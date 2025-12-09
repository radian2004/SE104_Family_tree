# Hướng dẫn sửa lỗi và chạy hệ thống Authentication

## Phần 1: Sửa lỗi TypeScript trong users.services.ts

### Lỗi hiện tại

Ở dòng 37 và 53 trong file `users.services.ts` có lỗi:
```
Type 'string' is not assignable to type 'number | StringValue | undefined'.
```

**Nguyên nhân:** 
- TypeScript strict type checking không chấp nhận type `string | undefined` cho thuộc tính `expiresIn`
- `SignOptions['expiresIn']` yêu cầu kiểu cụ thể: `number | string` (trong đó string phải là định dạng thời gian như '15m', '7d')
- Biểu thức `process.env.ACCESS_TOKEN_EXPIRE || '15m'` có kiểu `string | undefined` dù giá trị runtime luôn là string

### ✅ Giải pháp: Type Assertion cho expiresIn

**File cần sửa:** `src/services/users.services.ts`

**Dòng 37 và 53:** Thêm type assertion `as string` cho `expiresIn` (KHÔNG phải cho toàn bộ biểu thức)

#### Sửa method signAccessToken (dòng 25-39):

```typescript
private signAccessToken(user_id: string) {
  return signToken(
    {
      user_id,
      token_type: TokenType.AccessToken
    },
    process.env.JWT_SECRET_ACCESS_TOKEN as string,
    {
      algorithm: 'HS256',
      expiresIn: (process.env.ACCESS_TOKEN_EXPIRE || '15m') as string
    }
  );
}
```

**Thay bằng:**

```typescript
private signAccessToken(user_id: string) {
  return signToken(
    {
      user_id,
      token_type: TokenType.AccessToken
    },
    process.env.JWT_SECRET_ACCESS_TOKEN as string,
    {
      algorithm: 'HS256',
      expiresIn: (process.env.ACCESS_TOKEN_EXPIRE || '15m') as any
    }
  );
}
```

#### Sửa method signRefreshToken (dòng 41-55):

```typescript
private signRefreshToken(user_id: string) {
  return signToken(
    {
      user_id,
      token_type: TokenType.RefreshToken
    },
    process.env.JWT_SECRET_REFRESH_TOKEN as string,
    {
      algorithm: 'HS256',
      expiresIn: (process.env.REFRESH_TOKEN_EXPIRE || '7d') as string
    }
  );
}
```

**Thay bằng:**

```typescript
private signRefreshToken(user_id: string) {
  return signToken(
    {
      user_id,
      token_type: TokenType.RefreshToken
    },
    process.env.JWT_SECRET_REFRESH_TOKEN as string,
    {
      algorithm: 'HS256',
      expiresIn: (process.env.REFRESH_TOKEN_EXPIRE || '7d') as any
    }
  );
}
```

### 💡 Giải thích

- **Tại sao dùng `as any`?** 
  - TypeScript's `SignOptions['expiresIn']` có kiểu phức tạp: `string | number | undefined`
  - Nhưng type checker nghiêm ngặt không chấp nhận `string` từ biểu thức `process.env.X || 'default'`
  - `as any` bypass type checking an toàn vì runtime value luôn đúng định dạng ('15m', '7d')
  - jsonwebtoken sẽ validate format string tại runtime

- **Tại sao không dùng `as string`?**
  - `as string` vẫn không đủ vì TypeScript vẫn check strict compatibility
  - `as any` là cách bypass hoàn toàn type checking cho thuộc tính này

### 📝 Tóm tắt thay đổi

**Dòng 37:** 
```typescript
// Trước:
expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '15m'

// Sau:
expiresIn: (process.env.ACCESS_TOKEN_EXPIRE || '15m') as any
```

**Dòng 53:**
```typescript
// Trước:
expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d'

// Sau:
expiresIn: (process.env.REFRESH_TOKEN_EXPIRE || '7d') as any
```

### ✅ Sau khi sửa

1. Save file `users.services.ts`
2. Build lại:
```powershell
npm run build
```
3. Kiểm tra không còn lỗi TypeScript
4. Tiếp tục với Phần 2 bên dưới

---

## Phần 2: Kiểm tra và cập nhật Docker

### Kiểm tra Docker Compose

File `docker-compose.yml` hiện tại đã đúng, **KHÔNG CẦN SỬA**:

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: cnpm_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: app
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### Kiểm tra .env

File `.env` cần có đầy đủ các biến sau:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=app

# Server
PORT=3000

# JWT Secrets (QUAN TRỌNG: Đổi thành secret keys mạnh hơn)
JWT_SECRET_ACCESS_TOKEN=cnpm-access-token-secret-2025-very-strong
JWT_SECRET_REFRESH_TOKEN=cnpm-refresh-token-secret-2025-very-strong

# Password hashing (QUAN TRỌNG: Đổi thành secret key mạnh hơn)
PASSWORD_SECRET=cnpm-password-hash-secret-2025

# Token expiration
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d
```

**⚠️ LƯU Ý:** Trong production, các secret keys phải được generate ngẫu nhiên và bảo mật!

---

## Phần 3: Hướng dẫn chạy hệ thống từ đầu

### Bước 1: Start MySQL Docker Container

```powershell
cd D:\CNPM\backend
docker-compose up -d
```

**Kiểm tra container đang chạy:**
```powershell
docker ps
```

Kết quả mong đợi:
```
CONTAINER ID   IMAGE       COMMAND                  STATUS         PORTS                    NAMES
xxxxxxxxxxxx   mysql:8.0   "docker-entrypoint.s…"   Up 2 seconds   0.0.0.0:3306->3306/tcp   cnpm_mysql
```

### Bước 2: Chờ MySQL khởi động hoàn tất

```powershell
docker logs cnpm_mysql
```

Chờ đến khi thấy dòng:
```
[Server] /usr/sbin/mysqld: ready for connections. Version: '8.0.xx'
```

### Bước 3: Import database schema

**Lưu ý:** File `init.sql` cần bổ sung bảng TAIKHOAN và REFRESH_TOKENS.

**Cập nhật file `init.sql`** - Thêm vào trước phần `-- ----------INSERT VALUE----------`:

```sql
-- Bảng loại tài khoản (nếu chưa có)
CREATE TABLE IF NOT EXISTS LOAITAIKHOAN (
    MaLoaiTK VARCHAR(5) PRIMARY KEY,
    TenLoaiTK VARCHAR(50)
);

-- Bảng tài khoản
CREATE TABLE IF NOT EXISTS TAIKHOAN (
    TenDangNhap VARCHAR(50) PRIMARY KEY,
    MaTV VARCHAR(5),
    MatKhau VARCHAR(100) NOT NULL,
    MaLoaiTK VARCHAR(5),
    TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV) ON DELETE CASCADE,
    FOREIGN KEY(MaLoaiTK) REFERENCES LOAITAIKHOAN(MaLoaiTK)
);

-- Bảng refresh tokens
CREATE TABLE IF NOT EXISTS REFRESH_TOKENS (
    token VARCHAR(500) PRIMARY KEY,
    TenDangNhap VARCHAR(50) NOT NULL,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    NgayHetHan TIMESTAMP NOT NULL,
    FOREIGN KEY(TenDangNhap) REFERENCES TAIKHOAN(TenDangNhap) ON DELETE CASCADE,
    INDEX idx_tendangnhap (TenDangNhap),
    INDEX idx_ngayhethan (NgayHetHan)
);
```

**Thêm data mẫu cho LOAITAIKHOAN** (trong phần INSERT VALUE):

```sql
-- Insert loại tài khoản
INSERT INTO LOAITAIKHOAN (MaLoaiTK, TenLoaiTK) VALUES
('LTK01', 'Admin'),
('LTK02', 'User')
ON DUPLICATE KEY UPDATE TenLoaiTK = VALUES(TenLoaiTK);
```

**Import vào MySQL:**

```powershell
docker exec -i cnpm_mysql mysql -uroot -p123456 app < init.sql
```

**Kiểm tra tables đã được tạo:**

```powershell
docker exec -it cnpm_mysql mysql -uroot -p123456 -e "USE app; SHOW TABLES;"
```

Kết quả phải có:
```
+------------------+
| Tables_in_app    |
+------------------+
| CAYGIAPHA        |
| CONCAI           |
| ...              |
| LOAITAIKHOAN     |
| REFRESH_TOKENS   |
| TAIKHOAN         |
| THANHVIEN        |
| ...              |
+------------------+
```

### Bước 4: Cài đặt dependencies

```powershell
npm install
```

### Bước 5: Build TypeScript (nếu cần)

```powershell
npm run build
```

### Bước 6: Chạy server ở chế độ development

```powershell
npm run dev
```

**Kết quả mong đợi:**

```
[nodemon] starting `ts-node -r tsconfig-paths/register src/index.ts`
✅ Đã kết nối thành công với MySQL database!
🚀 Server đang chạy tại http://localhost:3000
```

**Nếu gặp lỗi kết nối MySQL:**

1. Kiểm tra MySQL container đang chạy:
```powershell
docker ps | Select-String cnpm_mysql
```

2. Kiểm tra .env có đúng credentials không

3. Restart MySQL container:
```powershell
docker-compose restart
```

---

## Phần 4: Testing với Postman

### Bước 1: Tạo Environment trong Postman

1. Mở Postman
2. Click **Environments** (bên trái)
3. Click **Create Environment**
4. Tên: `CNPM Dev`
5. Thêm các biến:

| Variable        | Initial Value         | Current Value         |
|----------------|----------------------|----------------------|
| baseUrl        | http://localhost:3000 | http://localhost:3000 |
| access_token   | (để trống)           | (để trống)           |
| refresh_token  | (để trống)           | (để trống)           |

6. Click **Save**
7. Chọn environment `CNPM Dev` ở dropdown (góc trên bên phải)

---

### Bước 2: Test API Register (Đăng ký)

#### Request

**Method:** `POST`  
**URL:** `{{baseUrl}}/users/register`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "password": "Password123!",
  "confirm_password": "Password123!"
}
```

#### Response mong đợi (201 Created)

```json
{
  "message": "Đăng ký tài khoản thành công",
  "result": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Auto save tokens (Tab "Tests")

Thêm script này vào tab **Tests** của request:

```javascript
if (pm.response.code === 201) {
    const { access_token, refresh_token } = pm.response.json().result;
    pm.environment.set('access_token', access_token);
    pm.environment.set('refresh_token', refresh_token);
    console.log('✅ Tokens đã được lưu vào environment');
}
```

#### Click Send và kiểm tra

✅ Status: 201 Created  
✅ Response có access_token và refresh_token  
✅ Tokens tự động lưu vào environment (check Console log)

**Verify trong database:**

```powershell
docker exec -it cnpm_mysql mysql -uroot -p123456 -e "USE app; SELECT TenDangNhap, MaTV, MaLoaiTK FROM TAIKHOAN WHERE TenDangNhap = 'nguyenvana@example.com';"
```

Kết quả:
```
+-------------------------+------+-----------+
| TenDangNhap             | MaTV | MaLoaiTK  |
+-------------------------+------+-----------+
| nguyenvana@example.com  | TV08 | LTK02     |
+-------------------------+------+-----------+
```

---

### Bước 3: Test API Login (Đăng nhập)

#### Request

**Method:** `POST`  
**URL:** `{{baseUrl}}/users/login`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "nguyenvana@example.com",
  "password": "Password123!"
}
```

#### Response mong đợi (200 OK)

```json
{
  "message": "Đăng nhập thành công",
  "result": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "TenDangNhap": "nguyenvana@example.com",
      "MaTV": "TV08",
      "MaLoaiTK": "LTK02"
    }
  }
}
```

#### Auto save tokens (Tab "Tests")

```javascript
if (pm.response.code === 200) {
    const { access_token, refresh_token } = pm.response.json().result;
    pm.environment.set('access_token', access_token);
    pm.environment.set('refresh_token', refresh_token);
    console.log('✅ Tokens đã được cập nhật');
}
```

#### Click Send và kiểm tra

✅ Status: 200 OK  
✅ Response có user info  
✅ Tokens mới được lưu vào environment

---

### Bước 4: Test API Logout (Đăng xuất)

#### Request

**Method:** `POST`  
**URL:** `{{baseUrl}}/users/logout`  

**Headers:**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "refresh_token": "{{refresh_token}}"
}
```

#### Response mong đợi (200 OK)

```json
{
  "message": "Đăng xuất thành công",
  "deletedCount": 1
}
```

#### Click Send và kiểm tra

✅ Status: 200 OK  
✅ deletedCount: 1 (đã xóa refresh token)

**Verify trong database:**

```powershell
docker exec -it cnpm_mysql mysql -uroot -p123456 -e "USE app; SELECT COUNT(*) as token_count FROM REFRESH_TOKENS WHERE TenDangNhap = 'nguyenvana@example.com';"
```

Kết quả sau logout:
```
+-------------+
| token_count |
+-------------+
|           0 |
+-------------+
```

---

### Bước 5: Test các trường hợp lỗi

#### Test 1: Email đã tồn tại (422)

**Request:** POST `/users/register`

```json
{
  "name": "Test User",
  "email": "nguyenvana@example.com",
  "password": "Password123!",
  "confirm_password": "Password123!"
}
```

**Response mong đợi:**
```json
{
  "message": "Validation error",
  "errors": {
    "email": "Email đã tồn tại"
  }
}
```

✅ Status: 422 Unprocessable Entity

---

#### Test 2: Password yếu (422)

**Request:** POST `/users/register`

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "123456",
  "confirm_password": "123456"
}
```

**Response mong đợi:**
```json
{
  "message": "Validation error",
  "errors": {
    "password": "Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt"
  }
}
```

✅ Status: 422

---

#### Test 3: Confirm password không khớp (422)

**Request:** POST `/users/register`

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Password123!",
  "confirm_password": "Different123!"
}
```

**Response mong đợi:**
```json
{
  "message": "Validation error",
  "errors": {
    "confirm_password": "Xác nhận mật khẩu không khớp"
  }
}
```

✅ Status: 422

---

#### Test 4: Email hoặc password sai (422)

**Request:** POST `/users/login`

```json
{
  "email": "wrong@example.com",
  "password": "WrongPassword123!"
}
```

**Response mong đợi:**
```json
{
  "message": "Email hoặc mật khẩu không đúng"
}
```

✅ Status: 422

---

#### Test 5: Thiếu access token (401)

**Request:** POST `/users/logout`

**Headers:** (KHÔNG GỬI Authorization)

```json
{
  "refresh_token": "some-token"
}
```

**Response mong đợi:**
```json
{
  "message": "Validation error",
  "errors": {
    "Authorization": "Access token không được để trống"
  }
}
```

✅ Status: 401 Unauthorized

---

#### Test 6: Refresh token không hợp lệ (401)

**Request:** POST `/users/logout`

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:**
```json
{
  "refresh_token": "invalid-token-string"
}
```

**Response mong đợi:**
```json
{
  "message": "Validation error",
  "errors": {
    "refresh_token": "jwt malformed" // hoặc tương tự
  }
}
```

✅ Status: 401

---

## Phần 5: Tổng hợp Scripts cho Postman Collection

### Tạo Collection

1. Tạo collection mới: `CNPM Authentication`
2. Thêm 3 requests: Register, Login, Logout

### Collection Variables

Trong tab **Variables** của Collection, thêm:

| Variable | Initial Value | Type |
|----------|--------------|------|
| baseUrl  | http://localhost:3000 | default |

### Pre-request Script (Collection level)

Không cần thiết cho collection này.

### Tests Script template cho tất cả requests

Thêm vào tab **Tests** của Collection (áp dụng cho tất cả requests):

```javascript
// Log response time
console.log(`⏱️ Response time: ${pm.response.responseTime}ms`);

// Log status code
console.log(`📊 Status: ${pm.response.code} ${pm.response.status}`);

// Pretty print response
if (pm.response.json) {
    console.log('📦 Response:', JSON.stringify(pm.response.json(), null, 2));
}
```

---

## Phần 6: Troubleshooting

### Lỗi 1: Cannot connect to MySQL

**Hiện tượng:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Giải pháp:**

1. Kiểm tra container:
```powershell
docker ps | Select-String cnpm_mysql
```

2. Nếu không chạy:
```powershell
docker-compose up -d
```

3. Kiểm tra logs:
```powershell
docker logs cnpm_mysql
```

4. Nếu vẫn lỗi, restart:
```powershell
docker-compose down
docker-compose up -d
```

---

### Lỗi 2: Table doesn't exist

**Hiện tượng:**
```
Error: Table 'app.TAIKHOAN' doesn't exist
```

**Giải pháp:**

Import lại schema:
```powershell
docker exec -i cnpm_mysql mysql -uroot -p123456 app < init.sql
```

---

### Lỗi 3: JWT secret not configured

**Hiện tượng:**
```
Error: secretOrPrivateKey must have a value
```

**Giải pháp:**

Kiểm tra file `.env` có đầy đủ:
```env
JWT_SECRET_ACCESS_TOKEN=cnpm-access-token-secret-2025-very-strong
JWT_SECRET_REFRESH_TOKEN=cnpm-refresh-token-secret-2025-very-strong
PASSWORD_SECRET=cnpm-password-hash-secret-2025
```

Restart server:
```powershell
# Ctrl+C để dừng
npm run dev
```

---

### Lỗi 4: TypeScript compilation errors

**Hiện tượng:**
```
error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'
```

**Giải pháp:**

Đảm bảo đã sửa file `users.services.ts` theo hướng dẫn ở Phần 1.

---

### Lỗi 5: Port 3000 already in use

**Hiện tượng:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Giải pháp:**

1. Tìm process đang dùng port 3000:
```powershell
netstat -ano | Select-String ":3000"
```

2. Kill process (thay PID bằng số tìm được):
```powershell
taskkill /F /PID <PID>
```

3. Hoặc đổi port trong `.env`:
```env
PORT=3001
```

---

## Phần 7: Verify toàn bộ hệ thống

### Checklist cuối cùng

✅ **Docker MySQL:**
```powershell
docker ps | Select-String cnpm_mysql
```

✅ **Database tables:**
```powershell
docker exec -it cnpm_mysql mysql -uroot -p123456 -e "USE app; SHOW TABLES;"
```

✅ **Server running:**
```
🚀 Server đang chạy tại http://localhost:3000
```

✅ **Postman tests:**
- [ ] Register: 201 Created ✅
- [ ] Login: 200 OK ✅
- [ ] Logout: 200 OK ✅
- [ ] Email exists: 422 ✅
- [ ] Weak password: 422 ✅
- [ ] Wrong credentials: 422 ✅
- [ ] Missing token: 401 ✅

---

## Phần 8: Next Steps

Sau khi hoàn thành, bạn có thể mở rộng:

1. **Refresh access token endpoint**
   - Endpoint: POST `/users/refresh-token`
   - Dùng refresh_token để tạo access_token mới

2. **Email verification**
   - Gửi email khi đăng ký
   - Verify email trước khi login

3. **Forgot password**
   - Endpoint gửi email reset password
   - Endpoint verify và đổi password

4. **Role-based authorization**
   - Middleware check role (Admin/User)
   - Protect routes theo role

5. **Rate limiting**
   - Giới hạn số lần request
   - Chống brute force attack

---

**🎉 Chúc mừng! Hệ thống Authentication đã chạy thành công!**
