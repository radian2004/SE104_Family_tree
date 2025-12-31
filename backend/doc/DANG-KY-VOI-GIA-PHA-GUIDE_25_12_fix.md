# Sửa Lỗi SQL Trong Hàm Register

## Ngày sửa
**25/12/2025**

---

## 1. Mô Tả Lỗi

Khi đăng ký tài khoản với payload:
```json
{
    "name": "Nguyen Van B",
    "email": "nguyenvanb@example.com",
    "password": "Password1234!",
    "confirm_password": "Password1234!",
    "giapha": {
      "exist": true,
      "name": "Gia phả họ Nguyễn Văn"
    }
}
```

**Response lỗi:**
```json
{
    "message": "Unknown column 'Email' in 'field list'",
    "errorInfo": {
        "message": "Unknown column 'Email' in 'field list'",
        "code": "ER_BAD_FIELD_ERROR",
        "errno": 1054,
        "sql": "INSERT INTO TAIKHOAN (MaTV, Email, MatKhau) VALUES (?, ?, ?)",
        "sqlState": "42S22",
        "sqlMessage": "Unknown column 'Email' in 'field list'"
    }
}
```

---

## 2. Nguyên Nhân

### 2.1 Cấu Trúc Thực Tế Của Bảng TAIKHOAN

```sql
CREATE TABLE TAIKHOAN(
	TenDangNhap VARCHAR(50) PRIMARY KEY,  -- Sửa Đúng
	MaTV VARCHAR(5),
	MatKhau VARCHAR(100),
	MaLoaiTK VARCHAR(5),                  -- Sửa Bắt buộc
	TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV) ON DELETE CASCADE,
	FOREIGN KEY(MaLoaiTK) REFERENCES LOAITAIKHOAN(MaLoaiTK)
);
```

### 2.2 Cấu Trúc Bảng REFRESH_TOKENS

```sql
CREATE TABLE REFRESH_TOKENS (
    token VARCHAR(500) PRIMARY KEY,
    TenDangNhap VARCHAR(50) NOT NULL,     -- Sửa FK đến TAIKHOAN
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    NgayHetHan TIMESTAMP NOT NULL,        -- Sửa Bắt buộc
    FOREIGN KEY(TenDangNhap) REFERENCES TAIKHOAN(TenDangNhap) ON DELETE CASCADE
);
```

### 2.3 Các Lỗi Trong Code

| Lỗi | Code Sai | Code Đúng |
|-----|----------|-----------|
| **Lỗi 1** | `Email` trong INSERT TAIKHOAN | `TenDangNhap` |
| **Lỗi 2** | Thiếu cột `MaLoaiTK` khi INSERT | Thêm `MaLoaiTK = 'LTK03'` |
| **Lỗi 3** | UPDATE TAIKHOAN với cột `RefreshToken` không tồn tại | INSERT vào bảng `REFRESH_TOKENS` |

---

## 3. Các Thay Đổi Đã Thực Hiện

### 3.1 Sửa INSERT TAIKHOAN - Trường Hợp 1 (Tạo Gia Phả Mới)

📁 **File:** `src/services/users.services.ts`

#### ❌ Code Cũ (SAI)
```typescript
// Tạo tài khoản
await databaseService.getPool().execute<ResultSetHeader>(
  'INSERT INTO TAIKHOAN (MaTV, Email, MatKhau) VALUES (?, ?, ?)',
  [MaTV, email, hashedPassword]
)
```

#### Sửa Code Mới (ĐÚNG)
```typescript
// Tạo tài khoản
await databaseService.getPool().execute<ResultSetHeader>(
  'INSERT INTO TAIKHOAN (TenDangNhap, MaTV, MatKhau, MaLoaiTK) VALUES (?, ?, ?, ?)',
  [email, MaTV, hashedPassword, 'LTK03']
)
```

**Thay đổi:**
1. `Email` → `TenDangNhap`
2. Thêm cột `MaLoaiTK` với giá trị `'LTK03'` (User)
3. Đổi thứ tự tham số: `[email, MaTV, hashedPassword, 'LTK03']`

---

### 3.2 Sửa INSERT TAIKHOAN - Trường Hợp 2 (Gia Nhập Gia Phả)

📁 **File:** `src/services/users.services.ts`

#### ❌ Code Cũ (SAI)
```typescript
// Tạo tài khoản
await databaseService.getPool().execute<ResultSetHeader>(
  'INSERT INTO TAIKHOAN (MaTV, Email, MatKhau) VALUES (?, ?, ?)',
  [MaTV, email, hashedPassword]
)
```

#### Sửa Code Mới (ĐÚNG)
```typescript
// Tạo tài khoản
await databaseService.getPool().execute<ResultSetHeader>(
  'INSERT INTO TAIKHOAN (TenDangNhap, MaTV, MatKhau, MaLoaiTK) VALUES (?, ?, ?, ?)',
  [email, MaTV, hashedPassword, 'LTK03']
)
```

**Thay đổi:** (giống trường hợp 1)

---

### 3.3 Sửa Lưu Refresh Token

📁 **File:** `src/services/users.services.ts`

#### ❌ Code Cũ (SAI)
```typescript
// Lưu refresh token
await databaseService.getPool().execute(
  'UPDATE TAIKHOAN SET RefreshToken = ? WHERE Email = ?',
  [refresh_token, email]
)
```

#### Sửa Code Mới (ĐÚNG)
```typescript
// Lưu refresh token vào bảng REFRESH_TOKENS
const expDate = new Date()
expDate.setDate(expDate.getDate() + 7) // Hết hạn sau 7 ngày

await databaseService.getPool().execute(
  'INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) VALUES (?, ?, ?)',
  [refresh_token, email, expDate]
)
```

**Thay đổi:**
1. Đổi từ `UPDATE TAIKHOAN` sang `INSERT INTO REFRESH_TOKENS`
2. Thêm logic tính ngày hết hạn (`NgayHetHan`)
3. Thay `Email` bằng `TenDangNhap`

---

## 4. Code Hoàn Chỉnh Sau Khi Sửa

📁 **File:** `src/services/users.services.ts`

```typescript
async register(payload: RegisterReqBody) {
  const { name, email, password, giapha } = payload
  const hashedPassword = hashPassword(password)
  let MaGiaPha: string
  let giapha_message: string

  // Trường hợp 1: Tạo gia phả mới (exist = false)
  if (giapha.exist === false) {
    // Tạo gia phả mới - Trigger sẽ tự động sinh MaGiaPha
    const [insertGiaPhaResult] = await databaseService.getPool().execute<ResultSetHeader>(
      'INSERT INTO CAYGIAPHA (TenGiaPha) VALUES (?)',
      [giapha.name]
    )
    
    // Lấy MaGiaPha vừa được tạo
    const [rows] = await databaseService.getPool().execute<RowDataPacket[]>(
      'SELECT MaGiaPha FROM CAYGIAPHA WHERE TenGiaPha = ? ORDER BY MaGiaPha DESC LIMIT 1',
      [giapha.name]
    )
    MaGiaPha = rows[0].MaGiaPha
    giapha_message = USERS_MESSAGES.GIAPHA_CREATED
    
    // Tạo thành viên (sẽ được set làm NguoiLap và TruongToc)
    const [insertMemberResult] = await databaseService.getPool().execute<ResultSetHeader>(
      'INSERT INTO THANHVIEN (MaGiaPha, HoTen) VALUES (?, ?)',
      [MaGiaPha, name]
    )
    
    // Lấy MaTV vừa tạo
    const [memberRows] = await databaseService.getPool().execute<RowDataPacket[]>(
      'SELECT MaTV FROM THANHVIEN WHERE MaGiaPha = ? AND HoTen = ? ORDER BY MaTV DESC LIMIT 1',
      [MaGiaPha, name]
    )
    const MaTV = memberRows[0].MaTV
    
    // Cập nhật NguoiLap và TruongToc cho gia phả
    await databaseService.getPool().execute(
      'UPDATE CAYGIAPHA SET NguoiLap = ?, TruongToc = ? WHERE MaGiaPha = ?',
      [MaTV, MaTV, MaGiaPha]
    )
    
    // Sửa Tạo tài khoản (ĐÃ SỬA)
    await databaseService.getPool().execute<ResultSetHeader>(
      'INSERT INTO TAIKHOAN (TenDangNhap, MaTV, MatKhau, MaLoaiTK) VALUES (?, ?, ?, ?)',
      [email, MaTV, hashedPassword, 'LTK03']
    )
  } 
  // Trường hợp 2: Gia nhập gia phả có sẵn (exist = true)
  else {
    // Tìm gia phả theo tên
    const [giaPhaRows] = await databaseService.getPool().execute<RowDataPacket[]>(
      'SELECT MaGiaPha, TenGiaPha FROM CAYGIAPHA WHERE TenGiaPha = ?',
      [giapha.name]
    )
    
    // Nếu không tìm thấy gia phả
    if (giaPhaRows.length === 0) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GIAPHA_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    
    MaGiaPha = giaPhaRows[0].MaGiaPha
    giapha_message = `${USERS_MESSAGES.GIAPHA_JOINED} Gia phả: '${giaPhaRows[0].TenGiaPha}'.`
    
    // Tạo thành viên mới trong gia phả đã tồn tại
    const [insertMemberResult] = await databaseService.getPool().execute<ResultSetHeader>(
      'INSERT INTO THANHVIEN (MaGiaPha, HoTen) VALUES (?, ?)',
      [MaGiaPha, name]
    )
    
    // Lấy MaTV vừa tạo
    const [memberRows] = await databaseService.getPool().execute<RowDataPacket[]>(
      'SELECT MaTV FROM THANHVIEN WHERE MaGiaPha = ? AND HoTen = ? ORDER BY MaTV DESC LIMIT 1',
      [MaGiaPha, name]
    )
    const MaTV = memberRows[0].MaTV
    
    // Sửa Tạo tài khoản (ĐÃ SỬA)
    await databaseService.getPool().execute<ResultSetHeader>(
      'INSERT INTO TAIKHOAN (TenDangNhap, MaTV, MatKhau, MaLoaiTK) VALUES (?, ?, ?, ?)',
      [email, MaTV, hashedPassword, 'LTK03']
    )
  }

  // Tạo tokens
  const [access_token, refresh_token] = await Promise.all([
    this.signAccessToken(email),
    this.signRefreshToken(email)
  ])

  // Sửa Lưu refresh token vào bảng REFRESH_TOKENS (ĐÃ SỬA)
  const expDate = new Date()
  expDate.setDate(expDate.getDate() + 7) // Hết hạn sau 7 ngày
  
  await databaseService.getPool().execute(
    'INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) VALUES (?, ?, ?)',
    [refresh_token, email, expDate]
  )

  return {
    access_token,
    refresh_token,
    MaGiaPha,
    giapha_message
  }
}
```

---

## 5. So Sánh Trước và Sau

| Vấn Đề | Trước (SAI) | Sau (ĐÚNG) |
|--------|-------------|------------|
| **Tên cột trong INSERT TAIKHOAN** | `Email` | `TenDangNhap` |
| **Thiếu MaLoaiTK** | Không có | `'LTK03'` (User) |
| **Lưu Refresh Token** | UPDATE TAIKHOAN (cột không tồn tại) | INSERT INTO REFRESH_TOKENS |
| **Ngày hết hạn token** | Không có | Tính toán `expDate` (+7 ngày) |

---

## 6. Loại Tài Khoản

Bảng `LOAITAIKHOAN` có 3 loại:

| MaLoaiTK | TenLoaiTK | Mô Tả |
|----------|-----------|-------|
| `LTK01` | Admin | Quản trị viên hệ thống |
| `LTK02` | TruongToc | Trưởng tộc gia phả |
| `LTK03` | User | Người dùng thông thường Sửa (mặc định khi đăng ký) |

> **Lưu ý:** Khi đăng ký mới, tài khoản mặc định có `MaLoaiTK = 'LTK03'` (User).

---

## 7. Bảng REFRESH_TOKENS

### 7.1 Cấu Trúc

```sql
CREATE TABLE REFRESH_TOKENS (
    token VARCHAR(500) PRIMARY KEY,          -- Refresh token (primary key)
    TenDangNhap VARCHAR(50) NOT NULL,        -- FK đến TAIKHOAN
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP(), -- Tự động
    NgayHetHan TIMESTAMP NOT NULL,           -- Ngày hết hạn (bắt buộc)
    FOREIGN KEY(TenDangNhap) REFERENCES TAIKHOAN(TenDangNhap) ON DELETE CASCADE
);
```

### 7.2 Logic Lưu Refresh Token

```typescript
// Tính ngày hết hạn: hiện tại + 7 ngày
const expDate = new Date()
expDate.setDate(expDate.getDate() + 7)

// INSERT vào REFRESH_TOKENS
await databaseService.getPool().execute(
  'INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) VALUES (?, ?, ?)',
  [refresh_token, email, expDate]
)
```

---

## 8. Test Cases Sau Khi Sửa

### Test Case 1: Tạo Gia Phả Mới (Thành Công)

**Request:**
```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "password": "Password1234!",
    "confirm_password": "Password1234!",
    "giapha": {
      "exist": false,
      "name": "Gia phả họ Nguyễn A"
    }
  }'
```

**Expected Response (201 Created):**
```json
{
  "message": "Đăng ký thành công",
  "result": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "MaGiaPha": "GP03",
    "giapha_message": "Tạo gia phả mới thành công. Bạn là người lập và trưởng tộc."
  }
}
```

---

### Test Case 2: Gia Nhập Gia Phả Có Sẵn (Thành Công)

**Request:**
```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyen Van B",
    "email": "nguyenvanb@example.com",
    "password": "Password1234!",
    "confirm_password": "Password1234!",
    "giapha": {
      "exist": true,
      "name": "Nguyễn Văn - Hà Nội"
    }
  }'
```

**Expected Response (201 Created):**
```json
{
  "message": "Đăng ký thành công",
  "result": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "MaGiaPha": "GP02",
    "giapha_message": "Gia nhập gia phả thành công. Gia phả: 'Nguyễn Văn - Hà Nội'."
  }
}
```

---

## 9. Kiểm Tra Database Sau Khi Đăng Ký

### 9.1 Kiểm Tra TAIKHOAN

```sql
SELECT * FROM TAIKHOAN WHERE TenDangNhap = 'nguyenvana@example.com';
```

**Kết quả mong đợi:**

| TenDangNhap | MaTV | MatKhau | MaLoaiTK | TGTaoMoi |
|-------------|------|---------|----------|----------|
| nguyenvana@example.com | TV09 | [hashed] | LTK03 | 2025-12-25... |

---

### 9.2 Kiểm Tra REFRESH_TOKENS

```sql
SELECT * FROM REFRESH_TOKENS WHERE TenDangNhap = 'nguyenvana@example.com';
```

**Kết quả mong đợi:**

| token | TenDangNhap | NgayTao | NgayHetHan |
|-------|-------------|---------|------------|
| eyJhbG... | nguyenvana@example.com | 2025-12-25... | 2026-01-01... |

---

### 9.3 Kiểm Tra THANHVIEN

```sql
SELECT * FROM THANHVIEN WHERE HoTen = 'Nguyen Van A';
```

**Kết quả mong đợi:**

| MaTV | HoTen | MaGiaPha | DOI |
|------|-------|----------|-----|
| TV09 | Nguyen Van A | GP03 | 0 |

---

### 9.4 Kiểm Tra CAYGIAPHA (Nếu Tạo Mới)

```sql
SELECT * FROM CAYGIAPHA WHERE TenGiaPha = 'Gia phả họ Nguyễn A';
```

**Kết quả mong đợi:**

| MaGiaPha | TenGiaPha | NguoiLap | TruongToc |
|----------|-----------|----------|-----------|
| GP03 | Gia phả họ Nguyễn A | TV09 | TV09 |

---

## 10. Tóm Tắt

### 10.1 Các Lỗi Đã Sửa

Sửa **3 lỗi SQL đã được sửa:**
1. Đổi `Email` → `TenDangNhap` trong INSERT TAIKHOAN
2. Thêm `MaLoaiTK = 'LTK03'` khi tạo tài khoản
3. Lưu refresh token vào bảng `REFRESH_TOKENS` thay vì UPDATE TAIKHOAN

### 10.2 Files Đã Sửa

| File | Số Thay Đổi |
|------|-------------|
| `src/services/users.services.ts` | 3 chỗ |

### 10.3 Testing

- Sửa Test đăng ký tạo gia phả mới
- Sửa Test đăng ký gia nhập gia phả có sẵn
- Sửa Kiểm tra database: TAIKHOAN, REFRESH_TOKENS, THANHVIEN, CAYGIAPHA

---

## 11. Cập Nhật File Markdown Chính

📁 **Cần cập nhật file:** `doc/DANG-KY-VOI-GIA-PHA-GUIDE.md`

**Thêm vào Bước 4 - Cập Nhật Service:**

> ⚠️ **LƯU Ý QUAN TRỌNG:**
> - Tên cột trong bảng TAIKHOAN là `TenDangNhap`, KHÔNG PHẢI `Email`
> - Phải thêm cột `MaLoaiTK` khi INSERT (mặc định `'LTK03'` cho User)
> - Refresh token lưu vào bảng `REFRESH_TOKENS`, KHÔNG lưu trong TAIKHOAN
> - Phải tính `NgayHetHan` khi INSERT vào REFRESH_TOKENS

---

**Ngày hoàn thành:** 25/12/2025  
**Người thực hiện:** GitHub Copilot  
**Trạng thái:** Sửa Hoàn thành
