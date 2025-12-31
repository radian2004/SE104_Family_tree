# Giải Thích Chi Tiết: Token và Luồng Hoạt Động Authentication

## Mục lục
1. [Token là gì?](#1-token-là-gì)
2. [Access Token vs Refresh Token](#2-access-token-vs-refresh-token)
3. [JWT (JSON Web Token) hoạt động như thế nào?](#3-jwt-hoạt-động-như-thế-nào)
4. [Luồng Đăng Ký (Register)](#4-luồng-đăng-ký-register)
5. [Luồng Đăng Nhập (Login)](#5-luồng-đăng-nhập-login)
6. [Luồng Đăng Xuất (Logout)](#6-luồng-đăng-xuất-logout)
7. [Chi Tiết Code Từng File](#7-chi-tiết-code-từng-file)

---

## 1. Token là gì?

### Token là "vé thông hành" để truy cập hệ thống

Hãy tưởng tượng bạn đi vào một khu vui chơi:
- **Đăng ký/Đăng nhập** = Mua vé vào cổng
- **Token** = Cái vé bạn nhận được
- **Truy cập API** = Dùng vé để vào các trò chơi

**Tại sao cần Token?**
```
HTTP là stateless (không nhớ trạng thái)
→ Mỗi request là độc lập, server không biết bạn là ai
→ Phải gửi kèm "chứng minh thư" (token) trong mỗi request
→ Server verify token → biết bạn là ai → cho phép truy cập
```

**So sánh với Session Cookie:**
| Session-Cookie | Token (JWT) |
|----------------|-------------|
| Server lưu thông tin session | Server không lưu gì (stateless) |
| Khó scale (nhiều server) | Dễ scale (token tự chứa info) |
| Chỉ dùng cho web | Dùng được cho web, mobile, API |

---

## 2. Access Token vs Refresh Token

### 🎫 Access Token - "Vé tạm thời"

**Đặc điểm:**
- ⏱️ **Thời gian sống ngắn**: 15 phút - 1 giờ
- 🔑 **Mục đích**: Xác thực các request API
- 💾 **KHÔNG lưu vào database**: Vì hết hạn nhanh, không cần thu hồi
- 📤 **Cách gửi**: Trong header `Authorization: Bearer <access_token>`

**Tại sao phải ngắn hạn?**
```
Nếu bị đánh cắp → Hacker chỉ dùng được tối đa 15 phút
→ Giảm thiểu rủi ro bảo mật
```

**Ví dụ Access Token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibmd1eWVudmFuYUBleGFtcGxlLmNvbSIsInRva2VuX3R5cGUiOjAsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDA5MDB9.abc123xyz
```

### 🎟️ Refresh Token - "Vé dài hạn"

**Đặc điểm:**
- ⏱️ **Thời gian sống dài**: 7 ngày - 30 ngày
- 🔄 **Mục đích**: Tạo access token mới khi hết hạn
- 💾 **BẮT BUỘC lưu database**: Để có thể thu hồi (logout, bị hack...)
- 🔒 **Chỉ dùng 1 lần**: Mỗi lần refresh → xóa cái cũ, tạo cái mới (optional)

**Tại sao phải lưu database?**
```
User đăng xuất → Xóa refresh token khỏi DB
→ Dù hacker có token cũ → Verify thất bại (không tồn tại trong DB)
→ Bảo mật cao hơn
```

### 🔄 Luồng sử dụng Token

```
┌─────────────────────────────────────────────────────┐
│ 1. Login → Server trả về:                          │
│    - access_token (15 phút)                        │
│    - refresh_token (7 ngày, lưu DB)                │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 2. Gọi API → Gửi access_token trong header         │
│    Authorization: Bearer <access_token>             │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 3. Access token hết hạn (sau 15 phút)              │
│    → Gọi /refresh-token với refresh_token           │
│    → Server tạo access_token mới                    │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 4. Logout → Xóa refresh_token khỏi DB               │
│    → Access token vẫn còn hạn nhưng không tạo mới   │
└─────────────────────────────────────────────────────┘
```

---

## 3. JWT (JSON Web Token) hoạt động như thế nào?

### Cấu trúc JWT

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWJjIiwiZXhwIjoxNzAwMDAwfQ.signature
  ↑                                    ↑                                  ↑
HEADER                              PAYLOAD                           SIGNATURE
```

### 1️⃣ Header (Phần đầu)
```json
{
  "alg": "HS256",     // Thuật toán mã hóa: HMAC + SHA256
  "typ": "JWT"        // Loại token
}
```
→ Encode Base64 → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

### 2️⃣ Payload (Dữ liệu)
```json
{
  "user_id": "nguyenvana@example.com",  // Email của user
  "token_type": 0,                       // 0 = AccessToken, 1 = RefreshToken
  "iat": 1700000000,                     // Issued At: thời gian tạo
  "exp": 1700000900                      // Expires: thời gian hết hạn
}
```
→ Encode Base64 → `eyJ1c2VyX2lkIjoiYWJjIiwiZXhwIjoxNzAwMDAwfQ`

**⚠️ Lưu ý:** Payload chỉ được encode, **KHÔNG được mã hóa** → Ai cũng decode được → **KHÔNG lưu thông tin nhạy cảm** (password, số thẻ...)

### 3️⃣ Signature (Chữ ký)
```javascript
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET_KEY  // Chỉ server biết
)
```

**Chữ ký đảm bảo:**
- Sửa Token không bị giả mạo
- Sửa Token không bị chỉnh sửa

**Ví dụ:**
```javascript
// Hacker thay đổi payload từ "user_id": "hacker" → "user_id": "admin"
// → Signature không khớp → Verify thất bại → Bị từ chối
```

### Quá trình Verify Token

```javascript
// Bước 1: Tách token thành 3 phần
const [header, payload, signature] = token.split('.');

// Bước 2: Tính lại signature
const calculatedSignature = HMACSHA256(
  header + '.' + payload,
  JWT_SECRET_KEY
);

// Bước 3: So sánh
if (signature === calculatedSignature) {
  // Sửa Token hợp lệ
  const decoded = base64Decode(payload);
  
  // Kiểm tra hết hạn
  if (decoded.exp > currentTime) {
    return decoded;  // OK
  } else {
    throw new Error('Token expired');
  }
} else {
  throw new Error('Invalid signature');
}
```

---

## 4. Luồng Đăng Ký (Register)

### Sơ đồ tổng quan

```
Client                        Server                         Database
  |                             |                                |
  | POST /users/register        |                                |
  | {                           |                                |
  |   name: "Nguyễn Văn A",     |                                |
  |   email: "a@example.com",   |                                |
  |   password: "Pass123!",     |                                |
  |   confirm_password: "..."   |                                |
  | }                           |                                |
  |─────────────────────────────>                                |
  |                             |                                |
  |                     ┌───────┴────────┐                       |
  |                     │ 1. ROUTES      │                       |
  |                     │ users.routes.ts│                       |
  |                     └───────┬────────┘                       |
  |                             |                                |
  |                     ┌───────┴────────┐                       |
  |                     │ 2. MIDDLEWARE  │                       |
  |                     │ registerValidator│                     |
  |                     │                │                       |
  |                     │ - Check name   │                       |
  |                     │ - Check email  │    SELECT ... ?       |
  |                     │ - Check pass   │───────────────────────>
  |                     │ - Check confirm│<───────────────────────
  |                     └───────┬────────┘    email exists?      |
  |                             |                                |
  |                     ┌───────┴────────┐                       |
  |                     │ 3. CONTROLLER  │                       |
  |                     │ registerController│                    |
  |                     └───────┬────────┘                       |
  |                             |                                |
  |                     ┌───────┴────────┐                       |
  |                     │ 4. SERVICE     │                       |
  |                     │ users.services │                       |
  |                     │                │  INSERT THANHVIEN     |
  |                     │ A. Tạo user    │───────────────────────>
  |                     │                │<───────────────────────
  |                     │                │  (MaTV: TV01)         |
  |                     │                │                       |
  |                     │ B. Hash pass   │                       |
  |                     │ (SHA-256)      │  INSERT TAIKHOAN      |
  |                     │                │───────────────────────>
  |                     │                │<───────────────────────
  |                     │                │                       |
  |                     │ C. Create      │                       |
  |                     │ Access Token   │                       |
  |                     │ (15 min)       │                       |
  |                     │                │                       |
  |                     │ D. Create      │                       |
  |                     │ Refresh Token  │  INSERT REFRESH_TOKENS|
  |                     │ (7 days)       │───────────────────────>
  |                     └───────┬────────┘<───────────────────────
  |                             |                                |
  |  Response 201 Created       |                                |
  |  {                          |                                |
  |    message: "Success",      |                                |
  |    result: {                |                                |
  |      access_token: "...",   |                                |
  |      refresh_token: "..."   |                                |
  |    }                        |                                |
  |  }                          |                                |
  <─────────────────────────────|                                |
```

### Chi tiết từng bước

#### ⓵ ROUTES: `users.routes.ts`

```typescript
usersRouter.post('/register', registerValidator, wrapAsync(registerController));
```

**Giải thích:**
- Định nghĩa endpoint: `POST /users/register`
- `registerValidator`: Middleware kiểm tra dữ liệu đầu vào
- `wrapAsync`: Wrapper để bắt lỗi async
- `registerController`: Xử lý logic đăng ký

---

#### ⓶ MIDDLEWARE: `users.middlewares.ts`

```typescript
export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: { errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED },
      isLength: { options: { min: 1, max: 100 } }
    },
    email: {
      notEmpty: { errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED },
      isEmail: { errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID },
      custom: {
        options: async (value) => {
          // Kiểm tra email đã tồn tại chưa
          const isExist = await usersService.checkEmailExist(value);
          if (isExist) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS,
              status: HTTP_STATUS.UNPROCESSABLE_ENTITY
            });
          }
          return true;
        }
      }
    },
    password: {
      notEmpty: true,
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        }
      }
    },
    confirm_password: {
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_NOT_MATCH);
          }
          return true;
        }
      }
    }
  })
);
```

**Các bước kiểm tra:**
1. Sửa `name` không rỗng, 1-100 ký tự
2. Sửa `email` hợp lệ, chưa tồn tại trong DB
3. Sửa `password` đủ mạnh (6+ ký tự, có hoa, thường, số, ký tự đặc biệt)
4. Sửa `confirm_password` khớp với password

**Nếu có lỗi → Throw error → Dừng lại, không chạy tiếp Controller**

---

#### ⓷ CONTROLLER: `users.controllers.ts`

```typescript
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response
) => {
  // Gọi service để xử lý logic
  const result = await usersService.register(req.body);

  // Trả về response
  return res.status(HTTP_STATUS.CREATED).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  });
};
```

**Nhiệm vụ:**
- Nhận request đã được validate
- Gọi `usersService.register()` để xử lý
- Trả về response với status 201 (Created)

**⚠️ Controller KHÔNG xử lý logic business → Để Service làm**

---

#### ⓸ SERVICE: `users.services.ts`

```typescript
async register(payload: RegisterReqBody) {
  const { name, email, password } = payload;

  // BƯỚC 1: Tạo thành viên mới
  const insertThanhVienSql = `
    INSERT INTO THANHVIEN (HoTen, MaGioiTinh) 
    VALUES (?, 'GT00')
  `;
  await databaseService.query(insertThanhVienSql, [name]);

  // BƯỚC 2: Lấy MaTV vừa tạo
  const [thanhVien] = await databaseService.query<RowDataPacket[]>(
    'SELECT MaTV FROM THANHVIEN ORDER BY TGTaoMoi DESC LIMIT 1'
  );
  const MaTV = thanhVien.MaTV;  // Ví dụ: 'TV01'

  // BƯỚC 3: Hash password
  const hashedPassword = hashPassword(password);
  // Input:  'Password123!'
  // Output: 'a1b2c3d4e5f6...' (64 ký tự hex)

  // BƯỚC 4: Tạo tài khoản
  const insertTaiKhoanSql = `
    INSERT INTO TAIKHOAN (TenDangNhap, MaTV, MatKhau, MaLoaiTK) 
    VALUES (?, ?, ?, 'LTK02')
  `;
  await databaseService.query(insertTaiKhoanSql, [email, MaTV, hashedPassword]);

  // BƯỚC 5: Tạo tokens
  const [access_token, refresh_token] = await this.signAccessAndRefreshToken(email);

  // BƯỚC 6: Lưu refresh token vào DB
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + 7);  // +7 ngày

  const insertRefreshTokenSql = `
    INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) 
    VALUES (?, ?, ?)
  `;
  await databaseService.query(insertRefreshTokenSql, [
    refresh_token,
    email,
    expDate
  ]);

  // BƯỚC 7: Trả về tokens
  return {
    access_token,
    refresh_token
  };
}
```

**Chi tiết từng bước:**

##### BƯỚC 5: Tạo tokens chi tiết

```typescript
// Method helper
private signAccessAndRefreshToken(user_id: string) {
  return Promise.all([
    this.signAccessToken(user_id),   // Chạy song song
    this.signRefreshToken(user_id)
  ]);
}

private signAccessToken(user_id: string) {
  return signToken(
    {
      user_id: user_id,              // Email user
      token_type: TokenType.AccessToken  // 0
    },
    process.env.JWT_SECRET_ACCESS_TOKEN as string,  // Secret key riêng
    {
      algorithm: 'HS256',
      expiresIn: '15m'               // Hết hạn sau 15 phút
    }
  );
}

private signRefreshToken(user_id: string) {
  return signToken(
    {
      user_id: user_id,
      token_type: TokenType.RefreshToken  // 1
    },
    process.env.JWT_SECRET_REFRESH_TOKEN as string,  // Secret key khác
    {
      algorithm: 'HS256',
      expiresIn: '7d'                // Hết hạn sau 7 ngày
    }
  );
}
```

**Utility `jwt.ts`:**

```typescript
export function signToken(
  payload: { user_id: string; token_type: number },
  privateKey: string,
  options?: SignOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, privateKey, options || { algorithm: 'HS256' }, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token as string);  // Token string
      }
    });
  });
}
```

**Kết quả:**
```javascript
access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYUBleGFtcGxlLmNvbSIsInRva2VuX3R5cGUiOjAsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDA5MDB9.signature"

refresh_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYUBleGFtcGxlLmNvbSIsInRva2VuX3R5cGUiOjEsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwNjA0ODAwfQ.signature"
```

---

## 5. Luồng Đăng Nhập (Login)

### Sơ đồ tổng quan

```
Client                        Server                         Database
  |                             |                                |
  | POST /users/login           |                                |
  | {                           |                                |
  |   email: "a@example.com",   |                                |
  |   password: "Pass123!"      |                                |
  | }                           |                                |
  |─────────────────────────────>                                |
  |                             |                                |
  |                     ┌───────┴────────┐                       |
  |                     │ 1. ROUTES      │                       |
  |                     └───────┬────────┘                       |
  |                             |                                |
  |                     ┌───────┴────────┐                       |
  |                     │ 2. MIDDLEWARE  │                       |
  |                     │ loginValidator │                       |
  |                     │ - Check email  │                       |
  |                     │ - Check pass   │                       |
  |                     └───────┬────────┘                       |
  |                             |                                |
  |                     ┌───────┴────────┐                       |
  |                     │ 3. CONTROLLER  │                       |
  |                     └───────┬────────┘                       |
  |                             |                                |
  |                     ┌───────┴────────┐                       |
  |                     │ 4. SERVICE     │                       |
  |                     │                │  SELECT * FROM TAIKHOAN
  |                     │ A. Tìm user    │───────────────────────>
  |                     │                │<───────────────────────
  |                     │                │  user data            |
  |                     │                │                       |
  |                     │ B. Hash pass   │                       |
  |                     │    input       │                       |
  |                     │                │                       |
  |                     │ C. So sánh     │                       |
  |                     │    hash        │                       |
  |                     │                │                       |
  |                     │ D. Tạo tokens  │                       |
  |                     │                │                       |
  |                     │ E. Lưu refresh │  INSERT REFRESH_TOKENS|
  |                     │    token       │───────────────────────>
  |                     └───────┬────────┘<───────────────────────
  |                             |                                |
  |  Response 200 OK            |                                |
  |  {                          |                                |
  |    message: "Login success",|                                |
  |    result: {                |                                |
  |      access_token: "...",   |                                |
  |      refresh_token: "...",  |                                |
  |      user: { ... }          |                                |
  |    }                        |                                |
  |  }                          |                                |
  <─────────────────────────────|                                |
```

### Chi tiết SERVICE: login()

```typescript
async login(email: string, password: string) {
  // BƯỚC 1: Tìm tài khoản trong database
  const sql = 'SELECT * FROM TAIKHOAN WHERE TenDangNhap = ?';
  const rows = await databaseService.query<TaiKhoanRow[]>(sql, [email]);

  if (rows.length === 0) {
    return null;  // Không tìm thấy user
  }

  const user = rows[0];
  // user = {
  //   TenDangNhap: 'a@example.com',
  //   MaTV: 'TV01',
  //   MatKhau: 'a1b2c3d4...' (hash),
  //   MaLoaiTK: 'LTK02'
  // }

  // BƯỚC 2: Hash password từ input
  const hashedPassword = hashPassword(password);
  // Input: 'Password123!'
  // Hash:  'a1b2c3d4e5f6...'

  // BƯỚC 3: So sánh hash
  if (user.MatKhau !== hashedPassword) {
    return null;  // Sai mật khẩu
  }

  // BƯỚC 4: Tạo tokens (giống register)
  const [access_token, refresh_token] = await this.signAccessAndRefreshToken(
    user.TenDangNhap
  );

  // BƯỚC 5: Lưu refresh token vào DB
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + 7);

  const insertRefreshTokenSql = `
    INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) 
    VALUES (?, ?, ?)
  `;
  await databaseService.query(insertRefreshTokenSql, [
    refresh_token,
    user.TenDangNhap,
    expDate
  ]);

  // BƯỚC 6: Trả về
  return {
    access_token,
    refresh_token,
    user: {
      TenDangNhap: user.TenDangNhap,
      MaTV: user.MaTV,
      MaLoaiTK: user.MaLoaiTK
    }
  };
}
```

**So sánh Register vs Login:**

| | Register | Login |
|---|----------|-------|
| Tạo user | Sửa INSERT THANHVIEN + TAIKHOAN | ❌ Không |
| Tìm user | ❌ Không | Sửa SELECT |
| Verify password | ❌ Không | Sửa So sánh hash |
| Tạo tokens | Sửa Có | Sửa Có |
| Lưu refresh token | Sửa Có | Sửa Có |

---

## 6. Luồng Đăng Xuất (Logout)

### Sơ đồ tổng quan

```
Client                        Server                         Database
  |                             |                                |
  | POST /users/logout          |                                |
  | Headers:                    |                                |
  |   Authorization:            |                                |
  |   Bearer <access_token>     |                                |
  | Body:                       |                                |
  | {                           |                                |
  |   refresh_token: "..."      |                                |
  | }                           |                                |
  |─────────────────────────────>                                |
  |                             |                                |
  |                     ┌───────┴────────┐                       |
  |                     │ 1. ROUTES      │                       |
  |                     └───────┬────────┘                       |
  |                             |                                |
  |                     ┌───────┴──────────┐                     |
  |                     │ 2. MIDDLEWARE    │                     |
  |                     │ accessTokenValidator                   |
  |                     │                  │                     |
  |                     │ A. Lấy token     │                     |
  |                     │    từ header     │                     |
  |                     │                  │                     |
  |                     │ B. Verify token  │                     |
  |                     │    với secret    │                     |
  |                     │                  │                     |
  |                     │ C. Kiểm tra hết  │                     |
  |                     │    hạn?          │                     |
  |                     │                  │                     |
  |                     │ D. Gán decoded   │                     |
  |                     │    vào req       │                     |
  |                     └───────┬──────────┘                     |
  |                             |                                |
  |                     ┌───────┴──────────┐                     |
  |                     │ 3. MIDDLEWARE    │                     |
  |                     │ refreshTokenValidator                  |
  |                     │                  │                     |
  |                     │ A. Verify token  │                     |
  |                     │                  │  SELECT token FROM  |
  |                     │ B. Check exists  │     REFRESH_TOKENS  |
  |                     │    in DB         │───────────────────>
  |                     │                  │<───────────────────
  |                     └───────┬──────────┘                     |
  |                             |                                |
  |                     ┌───────┴────────┐                       |
  |                     │ 4. CONTROLLER  │                       |
  |                     └───────┬────────┘                       |
  |                             |                                |
  |                     ┌───────┴────────┐                       |
  |                     │ 5. SERVICE     │                       |
  |                     │                │  DELETE FROM          |
  |                     │ Xóa refresh    │  REFRESH_TOKENS       |
  |                     │ token          │───────────────────────>
  |                     └───────┬────────┘<───────────────────────
  |                             |                                |
  |  Response 200 OK            |                                |
  |  {                          |                                |
  |    message: "Logout success",                                |
  |    deletedCount: 1          |                                |
  |  }                          |                                |
  <─────────────────────────────|                                |
```

### Chi tiết MIDDLEWARE: accessTokenValidator

```typescript
export const accessTokenValidator = validate(
  checkSchema({
    Authorization: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          // BƯỚC 1: Kiểm tra có gửi Authorization header không
          if (!value) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            });
          }

          // BƯỚC 2: Lấy token từ "Bearer <token>"
          const access_token = value.split(' ')[1];
          // Input:  'Bearer eyJhbGc...'
          // Output: 'eyJhbGc...'

          if (!access_token) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            });
          }

          try {
            // BƯỚC 3: Verify token
            const decoded_authorization = await verifyToken(
              access_token,
              process.env.JWT_SECRET_ACCESS_TOKEN as string
            );
            // decoded_authorization = {
            //   user_id: 'a@example.com',
            //   token_type: 0,
            //   iat: 1700000000,
            //   exp: 1700000900
            // }

            // BƯỚC 4: Gán vào request để controller dùng
            (req as Request).decoded_authorization = decoded_authorization;

          } catch (error) {
            // Token không hợp lệ hoặc hết hạn
            throw new ErrorWithStatus({
              message: (error as JsonWebTokenError).message,
              status: HTTP_STATUS.UNAUTHORIZED
            });
          }

          return true;
        }
      }
    }
  }, ['headers'])  // Kiểm tra trong headers
);
```

**Chi tiết `verifyToken()` trong `jwt.ts`:**

```typescript
export function verifyToken(token: string, secretKey: string): Promise<TokenPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        // Lỗi: Invalid signature, Token expired, JsonWebTokenError...
        reject(err);
      } else {
        // Thành công → Trả về payload đã decode
        resolve(decoded as TokenPayload);
      }
    });
  });
}
```

**Các lỗi có thể xảy ra:**
- `JsonWebTokenError: invalid signature` → Token bị sửa đổi
- `TokenExpiredError: jwt expired` → Token hết hạn
- `JsonWebTokenError: jwt malformed` → Token sai định dạng

---

### Chi tiết MIDDLEWARE: refreshTokenValidator

```typescript
export const refreshTokenValidator = validate(
  checkSchema({
    refresh_token: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          // BƯỚC 1: Kiểm tra có gửi refresh token không
          if (!value) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            });
          }

          try {
            // BƯỚC 2: Verify token
            const decoded_refresh_token = await verifyToken(
              value,
              process.env.JWT_SECRET_REFRESH_TOKEN as string
            );

            // BƯỚC 3: Kiểm tra token có trong database không
            const isExist = await usersService.checkRefreshTokenExist(value);
            if (!isExist) {
              // Token đã bị xóa (đã logout) hoặc không tồn tại
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.REFRESH_TOKEN_NOT_EXIST,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            // BƯỚC 4: Gán vào request
            (req as Request).decoded_refresh_token = decoded_refresh_token;

          } catch (error) {
            if (error instanceof ErrorWithStatus) {
              throw error;
            }
            throw new ErrorWithStatus({
              message: (error as JsonWebTokenError).message,
              status: HTTP_STATUS.UNAUTHORIZED
            });
          }

          return true;
        }
      }
    }
  }, ['body'])  // Kiểm tra trong body
);
```

**Tại sao phải check database?**
```
Kịch bản:
1. User đăng xuất → Refresh token bị xóa khỏi DB
2. Hacker đánh cắp được refresh token (vẫn còn hạn 7 ngày)
3. Hacker dùng token → Verify thành công (chữ ký đúng, chưa hết hạn)
4. Nhưng check DB → Không tồn tại → Từ chối

→ Bảo mật cao hơn!
```

---

### Chi tiết SERVICE: logout()

```typescript
async logout(refresh_token: string) {
  // Xóa refresh token khỏi database
  const sql = 'DELETE FROM REFRESH_TOKENS WHERE token = ?';
  const result = await databaseService.query<ResultSetHeader>(sql, [refresh_token]);

  return {
    message: 'Đăng xuất thành công',
    deletedCount: result.affectedRows  // Số dòng bị xóa (thường là 1)
  };
}
```

**Lưu ý:**
- Access token **KHÔNG bị xóa** (không lưu DB)
- Access token vẫn còn hạn cho đến khi hết 15 phút
- Nhưng không thể tạo access token mới (vì refresh token đã bị xóa)

---

## 7. Chi Tiết Code Từng File

### 📁 File `utils/jwt.ts` - Xử lý JWT

**Mục đích:** Tạo và verify JWT tokens

```typescript
import jwt, { SignOptions } from 'jsonwebtoken';

// ════════════════════════════════════════════════════════════
// TẠO TOKEN
// ════════════════════════════════════════════════════════════
export function signToken(
  payload: { user_id: string; token_type: number },
  privateKey: string,
  options?: SignOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,           // Dữ liệu muốn mã hóa
      privateKey,        // Secret key
      options || { algorithm: 'HS256' },  // Thuật toán
      (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token as string);
        }
      }
    );
  });
}

// ════════════════════════════════════════════════════════════
// VERIFY TOKEN
// ════════════════════════════════════════════════════════════
export function verifyToken(token: string, secretKey: string): Promise<TokenPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        // Lỗi: Invalid, Expired, Malformed...
        reject(err);
      } else {
        // Thành công → Payload
        resolve(decoded as TokenPayload);
      }
    });
  });
}
```

**Ví dụ sử dụng:**

```typescript
// Tạo token
const token = await signToken(
  { user_id: 'a@example.com', token_type: 0 },
  'my-secret-key',
  { expiresIn: '15m' }
);
// → "eyJhbGc..."

// Verify token
const decoded = await verifyToken(token, 'my-secret-key');
// → { user_id: 'a@example.com', token_type: 0, iat: ..., exp: ... }
```

---

### 📁 File `utils/crypto.ts` - Hash password

```typescript
import { createHash } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// ════════════════════════════════════════════════════════════
// SHA-256 HASH
// ════════════════════════════════════════════════════════════
export function sha256(content: string): string {
  return createHash('sha256')
    .update(content + process.env.PASSWORD_SECRET)  // Thêm salt
    .digest('hex');  // Output dạng hex (64 ký tự)
}

// ════════════════════════════════════════════════════════════
// HASH PASSWORD
// ════════════════════════════════════════════════════════════
export function hashPassword(password: string): string {
  return sha256(password);
}
```

**Ví dụ:**

```typescript
// Input
const password = 'Password123!';

// Hash
const hashed = hashPassword(password);
// Output: 'a1b2c3d4e5f6...' (64 ký tự hex)

// Verify
const inputPassword = 'Password123!';
const inputHashed = hashPassword(inputPassword);
if (hashed === inputHashed) {
  console.log('Sửa Password đúng');
}
```

**Tại sao không thể reverse?**
```
Hash function là one-way (một chiều)
Input → Hash Sửa
Hash → Input ❌ (không thể)

Chỉ có thể so sánh:
hash(input) === hash_stored
```

---

### 📁 File `utils/validation.ts` - Validate middleware

```typescript
import express from 'express';
import { ValidationChain, validationResult } from 'express-validator';

// ════════════════════════════════════════════════════════════
// VALIDATION WRAPPER
// ════════════════════════════════════════════════════════════
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // BƯỚC 1: Chạy tất cả validators
    await validation.run(req);

    // BƯỚC 2: Lấy kết quả
    const errors = validationResult(req);

    // BƯỚC 3: Không có lỗi → next()
    if (errors.isEmpty()) {
      return next();
    }

    // BƯỚC 4: Có lỗi → Xử lý và throw
    const errorObject = errors.mapped();
    const entityError = new EntityError({ errors: {} });

    for (const key in errorObject) {
      const { msg } = errorObject[key];

      // Nếu lỗi custom (ErrorWithStatus)
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg);
      }

      // Thêm vào entityError
      entityError.errors[key] = msg;
    }

    // BƯỚC 5: Throw error
    next(entityError);
  };
};
```

**Cách hoạt động:**

```
1. validation.run(req) → Chạy tất cả rules
2. validationResult(req) → Lấy errors
3. errors.isEmpty() → true → next() → Chạy tiếp controller
                    → false → throw error → Dừng lại
```

---

### 📁 File `services/users.services.ts` - Business Logic

**Tóm tắt các method:**

| Method | Mục đích |
|--------|----------|
| `signAccessToken()` | Tạo access token (15 phút) |
| `signRefreshToken()` | Tạo refresh token (7 ngày) |
| `signAccessAndRefreshToken()` | Tạo cả 2 tokens song song |
| `checkEmailExist()` | Kiểm tra email đã tồn tại chưa |
| `register()` | Đăng ký tài khoản mới |
| `login()` | Đăng nhập |
| `logout()` | Đăng xuất (xóa refresh token) |
| `checkRefreshTokenExist()` | Kiểm tra refresh token trong DB |

**Lưu ý quan trọng:**
- Methods `private` → Chỉ dùng trong class
- Methods `public` → Export ra ngoài
- Tất cả đều `async` → Vì gọi database

---

## 🎯 Tổng kết: So sánh 3 luồng

| | Register | Login | Logout |
|---|----------|-------|--------|
| **Validate** | name, email, password, confirm | email, password | access_token, refresh_token |
| **Tìm user** | ❌ | Sửa SELECT | ❌ |
| **Tạo user** | Sửa INSERT | ❌ | ❌ |
| **Verify password** | ❌ | Sửa So sánh hash | ❌ |
| **Tạo tokens** | Sửa | Sửa | ❌ |
| **Lưu refresh token** | Sửa INSERT | Sửa INSERT | ❌ DELETE |
| **Response** | 201 + tokens | 200 + tokens + user | 200 + message |

---

## 📝 Câu hỏi thường gặp (FAQ)

### 1. Tại sao cần cả Access Token và Refresh Token?

**Đáp:** Cân bằng giữa bảo mật và trải nghiệm người dùng

- **Nếu chỉ có Access Token dài hạn:**
  - Sửa Tiện: Không cần refresh
  - ❌ Nguy hiểm: Bị đánh cắp → Hacker dùng mãi
  
- **Nếu chỉ có Access Token ngắn hạn:**
  - Sửa An toàn: Hết hạn nhanh
  - ❌ Phiền: User phải đăng nhập lại liên tục

- **Kết hợp cả 2:**
  - Sửa An toàn: Access token ngắn hạn
  - Sửa Tiện: Refresh token tạo access token mới
  - Sửa Kiểm soát: Có thể thu hồi refresh token (logout)

---

### 2. Token lưu ở đâu trong client?

**Các cách lưu:**

| Nơi lưu | Bảo mật | Truy cập | Khuyến nghị |
|---------|---------|----------|-------------|
| **localStorage** | ❌ Kém (XSS) | Sửa Dễ | ❌ Không nên |
| **sessionStorage** | ❌ Kém (XSS) | Sửa Dễ | ❌ Không nên |
| **Cookie (httpOnly)** | Sửa Tốt | ❌ Khó (server only) | Sửa Tốt nhất |
| **Memory (Redux)** | Sửa Tốt | Sửa Dễ | ⚠️ Mất khi reload |

**Khuyến nghị:**
- **Access Token:** Memory (Redux/Context) hoặc Cookie httpOnly
- **Refresh Token:** Cookie httpOnly, Secure, SameSite

---

### 3. Khi nào cần refresh access token?

**Kịch bản:**

```
1. Client gọi API → Gửi access_token
2. Server verify → Token expired (401)
3. Client tự động gọi /refresh-token với refresh_token
4. Server verify refresh_token
   - Sửa Hợp lệ → Tạo access_token mới
   - ❌ Hết hạn/không tồn tại → Yêu cầu login lại
5. Client lưu access_token mới
6. Retry request ban đầu với token mới
```

**Code mẫu (axios interceptor):**

```typescript
// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Access token hết hạn
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Gọi API refresh token
        const { data } = await axios.post('/users/refresh-token', {
          refresh_token: getRefreshToken()
        });
        
        // Lưu token mới
        setAccessToken(data.access_token);
        
        // Retry request
        originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
        return axios(originalRequest);
        
      } catch (refreshError) {
        // Refresh token cũng hết hạn → Logout
        logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

### 4. Làm sao để implement API refresh token?

**Thêm vào `users.routes.ts`:**

```typescript
usersRouter.post(
  '/refresh-token',
  refreshTokenValidator,
  wrapAsync(refreshTokenController)
);
```

**Controller:**

```typescript
export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, { refresh_token: string }>,
  res: Response
) => {
  const { refresh_token } = req.body;
  const { user_id } = req.decoded_refresh_token as TokenPayload;
  
  // Tạo access token mới
  const result = await usersService.refreshToken(user_id, refresh_token);
  
  return res.json({
    message: 'Refresh token thành công',
    result
  });
};
```

**Service:**

```typescript
async refreshToken(user_id: string, old_refresh_token: string) {
  // Tạo tokens mới
  const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id);
  
  // Xóa refresh token cũ
  await this.deleteRefreshToken(old_refresh_token);
  
  // Lưu refresh token mới
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + 7);
  
  await databaseService.query(
    'INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) VALUES (?, ?, ?)',
    [refresh_token, user_id, expDate]
  );
  
  return { access_token, refresh_token };
}
```

---

### 5. Có cách nào bảo mật hơn không?

**Các cải tiến nâng cao:**

1. **Rotating Refresh Tokens:**
   - Mỗi lần refresh → Tạo cặp tokens mới
   - Xóa token cũ → Detect token reuse

2. **Token Blacklist:**
   - Lưu access token đã logout vào Redis
   - Check blacklist khi verify

3. **Device Fingerprint:**
   - Lưu device info khi tạo token
   - Verify device khi dùng token

4. **IP Whitelist:**
   - Lưu IP khi login
   - Chặn request từ IP khác

5. **Two-Factor Authentication (2FA):**
   - Yêu cầu OTP khi login
   - Tăng độ bảo mật gấp đôi

---

## 🚀 Kết luận

Bạn đã hiểu:
- Sửa Token là gì và tại sao cần token
- Sửa Phân biệt Access Token vs Refresh Token
- Sửa JWT hoạt động như thế nào (Header, Payload, Signature)
- Sửa Luồng Đăng ký chi tiết (Routes → Middleware → Controller → Service)
- Sửa Luồng Đăng nhập chi tiết
- Sửa Luồng Đăng xuất chi tiết
- Sửa Cách verify token và check trong database
- Sửa Tại sao refresh token phải lưu DB

**Bước tiếp theo:**
- Implement API refresh token
- Thêm role-based authorization
- Email verification
- Forgot password / Reset password

---

**Nếu còn thắc mắc gì, hãy hỏi thêm! 🎓**
