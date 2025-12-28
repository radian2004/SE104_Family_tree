# Hướng Dẫn: Đăng Ký Tài Khoản Bắt Buộc Có Gia Phả

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Yêu Cầu Nghiệp Vụ](#2-yêu-cầu-nghiệp-vụ)
3. [Cấu Trúc Database Liên Quan](#3-cấu-trúc-database-liên-quan)
4. [Các Bước Thực Hiện](#4-các-bước-thực-hiện)
   - [Bước 1: Cập Nhật Interface RegisterReqBody](#bước-1-cập-nhật-interface-registerreqbody)
   - [Bước 2: Cập Nhật Validation](#bước-2-cập-nhật-validation)
   - [Bước 3: Thêm Messages Constants](#bước-3-thêm-messages-constants)
   - [Bước 4: Cập Nhật Service](#bước-4-cập-nhật-service)
   - [Bước 5: Thêm Import](#bước-5-thêm-import)
   - [Bước 6: Cập Nhật Controller](#bước-6-cập-nhật-controller)
5. [Test Cases](#5-test-cases)
6. [So Sánh Trước và Sau](#6-so-sánh-trước-và-sau)
7. [FAQ](#7-faq)
8. [Kết Luận](#8-kết-luận)

---

## 1. Tổng Quan

Tính năng này **bắt buộc** người dùng phải cung cấp thông tin gia phả khi đăng ký tài khoản. Có 2 trường hợp:

| Trường hợp | `exist` | Mô tả |
|------------|---------|-------|
| **Tạo mới gia phả** | `false` | Người dùng tạo gia phả mới, trở thành `NguoiLap` và `TruongToc` |
| **Gia nhập gia phả** | `true` | Người dùng gia nhập gia phả đã tồn tại bằng `TenGiaPha` |

> ⚠️ **QUAN TRỌNG**: Đăng ký **KHÔNG CÓ** thông tin gia phả sẽ bị **TỪ CHỐI** với lỗi 400.

---

## 2. Yêu Cầu Nghiệp Vụ

### 2.1 Request Body Mới (BẮT BUỘC)

```json
{
  "name": "Nguyen Van A",
  "email": "nguyenvana@example.com",
  "password": "Password1234!",
  "confirm_password": "Password1234!",
  "giapha": {
    "exist": false,
    "name": "Gia phả họ Nguyễn"
  }
}
```

### 2.2 Trường Hợp 1: Tạo Mới Gia Phả (`exist: false`)

**Request:**
```json
{
  "name": "Nguyen Van A",
  "email": "nguyenvana@example.com",
  "password": "Password1234!",
  "confirm_password": "Password1234!",
  "giapha": {
    "exist": false,
    "name": "Gia phả họ Nguyễn"
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Đăng ký thành công",
  "result": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "MaGiaPha": "GP01",
    "giapha_message": "Tạo gia phả mới thành công. Bạn là người lập và trưởng tộc."
  }
}
```

**Logic xử lý:**
1. Tạo bản ghi mới trong bảng `CAYGIAPHA` với `TenGiaPha` từ request
2. Trigger `TRG_GEN_ID_CAYGIAPHA` tự động sinh `MaGiaPha` (GP01, GP02, ...)
3. Tạo bản ghi thành viên trong bảng `THANHVIEN` với:
   - `MaGiaPha`: Mã gia phả vừa tạo
   - `NguoiLap`: Thành viên này
   - `TruongToc`: Thành viên này
4. Tạo tài khoản trong bảng `TAIKHOAN`

### 2.3 Trường Hợp 2: Gia Nhập Gia Phả Có Sẵn (`exist: true`)

**Request:**
```json
{
  "name": "Nguyen Van B",
  "email": "nguyenvanb@example.com",
  "password": "Password1234!",
  "confirm_password": "Password1234!",
  "giapha": {
    "exist": true,
    "name": "Gia phả họ Nguyễn"
  }
}
```

**Response (201 Created):**
```json
{
  "message": "Đăng ký thành công",
  "result": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "MaGiaPha": "GP01",
    "giapha_message": "Gia nhập gia phả 'Gia phả họ Nguyễn' thành công."
  }
}
```

**Logic xử lý:**
1. Tìm gia phả trong bảng `CAYGIAPHA` theo `TenGiaPha`
2. Nếu **KHÔNG TÌM THẤY** → Trả về lỗi 404
3. Nếu **TÌM THẤY** → Lấy `MaGiaPha` từ kết quả
4. Tạo bản ghi thành viên trong bảng `THANHVIEN` với `MaGiaPha` đã tìm được
5. Tạo tài khoản trong bảng `TAIKHOAN`

### 2.4 Trường Hợp Lỗi: Không Có Thông Tin Gia Phả

**Request (THIẾU giapha):**
```json
{
  "name": "Nguyen Van A",
  "email": "nguyenvana@example.com",
  "password": "Password1234!",
  "confirm_password": "Password1234!"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Validation error",
  "errors": {
    "giapha.exist": {
      "msg": "Thông tin gia phả là bắt buộc",
      "location": "body"
    }
  }
}
```

### 2.5 Trường Hợp Lỗi: Gia Phả Không Tồn Tại

**Request:**
```json
{
  "name": "Nguyen Van C",
  "email": "nguyenvanc@example.com",
  "password": "Password1234!",
  "confirm_password": "Password1234!",
  "giapha": {
    "exist": true,
    "name": "Gia phả không có thật"
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Gia phả không tồn tại"
}
```

---

## 3. Cấu Trúc Database Liên Quan

### 3.1 Bảng CAYGIAPHA

```sql
CREATE TABLE CAYGIAPHA (
  MaGiaPha VARCHAR(5) NOT NULL,
  TenGiaPha VARCHAR(35) NOT NULL,
  NgayLap DATE DEFAULT (CURDATE()),
  NguoiLap VARCHAR(5) DEFAULT NULL,
  TruongToc VARCHAR(5) DEFAULT NULL,
  PRIMARY KEY (MaGiaPha)
);
```

### 3.2 Trigger Tự Động Sinh MaGiaPha

```sql
DELIMITER $$

CREATE TRIGGER TRG_GEN_ID_CAYGIAPHA
BEFORE INSERT ON CAYGIAPHA
FOR EACH ROW
BEGIN
  DECLARE max_id INT;
  DECLARE new_id VARCHAR(5);
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(MaGiaPha, 3) AS UNSIGNED)), 0) + 1 
  INTO max_id 
  FROM CAYGIAPHA;
  
  SET new_id = CONCAT('GP', LPAD(max_id, 2, '0'));
  SET NEW.MaGiaPha = new_id;
END$$

DELIMITER ;
```

### 3.3 Bảng THANHVIEN

```sql
CREATE TABLE THANHVIEN (
  MaTV VARCHAR(5) NOT NULL,
  MaGiaPha VARCHAR(5) NOT NULL,
  HoTen VARCHAR(50) NOT NULL,
  -- ... các trường khác
  PRIMARY KEY (MaTV),
  FOREIGN KEY (MaGiaPha) REFERENCES CAYGIAPHA(MaGiaPha)
);
```

---

## 4. Các Bước Thực Hiện

### Bước 1: Cập Nhật Interface RegisterReqBody

📁 **File:** `src/models/requests/User.requests.ts`

**Tìm code cũ:**
```typescript
export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
}
```

**Thay thế bằng code mới:**
```typescript
export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  giapha: {
    exist: boolean
    name: string
  }
}
```

> ⚠️ **LƯU Ý**: Trường `giapha` **KHÔNG CÓ dấu `?`** → Bắt buộc phải có.

---

### Bước 2: Cập Nhật Validation

📁 **File:** `src/middlewares/users.middlewares.ts`

**Tìm đoạn code `registerValidator` có các trường `confirm_password`, sau đó THÊM validation cho `giapha`:**

**Tìm code cũ (cuối cùng của registerValidator schema):**
```typescript
    confirm_password: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
          }
          return true
        }
      }
    }
```

**Thay thế bằng code mới (THÊM `giapha.exist` và `giapha.name` sau `confirm_password`):**
```typescript
    confirm_password: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
          }
          return true
        }
      }
    },
    'giapha.exist': {
      notEmpty: {
        errorMessage: USERS_MESSAGES.GIAPHA_EXIST_IS_REQUIRED
      },
      isBoolean: {
        errorMessage: USERS_MESSAGES.GIAPHA_EXIST_MUST_BE_BOOLEAN
      }
    },
    'giapha.name': {
      notEmpty: {
        errorMessage: USERS_MESSAGES.GIAPHA_NAME_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.GIAPHA_NAME_MUST_BE_STRING
      },
      isLength: {
        options: {
          min: 1,
          max: 35
        },
        errorMessage: USERS_MESSAGES.GIAPHA_NAME_LENGTH_MUST_BE_FROM_1_TO_35
      },
      trim: true
    }
```

---

### Bước 3: Thêm Messages Constants

📁 **File:** `src/constants/messages.ts`

**Tìm object `USERS_MESSAGES`, thêm các messages sau vào cuối object:**

**Code cần thêm (trước dấu `}` đóng của USERS_MESSAGES):**
```typescript
  // Gia phả messages
  GIAPHA_EXIST_IS_REQUIRED: 'Thông tin gia phả là bắt buộc',
  GIAPHA_EXIST_MUST_BE_BOOLEAN: 'Trường exist phải là boolean (true/false)',
  GIAPHA_NAME_IS_REQUIRED: 'Tên gia phả là bắt buộc',
  GIAPHA_NAME_MUST_BE_STRING: 'Tên gia phả phải là chuỗi',
  GIAPHA_NAME_LENGTH_MUST_BE_FROM_1_TO_35: 'Tên gia phả phải từ 1 đến 35 ký tự',
  GIAPHA_NOT_FOUND: 'Gia phả không tồn tại',
  GIAPHA_CREATED: 'Tạo gia phả mới thành công. Bạn là người lập và trưởng tộc.',
  GIAPHA_JOINED: 'Gia nhập gia phả thành công.'
```

**Ví dụ vị trí thêm:**
```typescript
export const USERS_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  NAME_IS_REQUIRED: 'Name is required',
  // ... các messages khác ...
  CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD: 'Confirm password must be the same as password',
  
  // Gia phả messages (THÊM VÀO ĐÂY)
  GIAPHA_EXIST_IS_REQUIRED: 'Thông tin gia phả là bắt buộc',
  GIAPHA_EXIST_MUST_BE_BOOLEAN: 'Trường exist phải là boolean (true/false)',
  GIAPHA_NAME_IS_REQUIRED: 'Tên gia phả là bắt buộc',
  GIAPHA_NAME_MUST_BE_STRING: 'Tên gia phả phải là chuỗi',
  GIAPHA_NAME_LENGTH_MUST_BE_FROM_1_TO_35: 'Tên gia phả phải từ 1 đến 35 ký tự',
  GIAPHA_NOT_FOUND: 'Gia phả không tồn tại',
  GIAPHA_CREATED: 'Tạo gia phả mới thành công. Bạn là người lập và trưởng tộc.',
  GIAPHA_JOINED: 'Gia nhập gia phả thành công.'
} as const
```

---

### Bước 4: Cập Nhật Service

📁 **File:** `src/services/users.services.ts`

**Tìm hàm `register` cũ và thay thế toàn bộ logic:**

**Tìm code cũ (hàm register):**
```typescript
  async register(payload: RegisterReqBody) {
    // Code cũ ở đây
  }
```

**Thay thế bằng code mới:**
```typescript
  async register(payload: RegisterReqBody) {
    const { name, email, password, giapha } = payload
    const hashedPassword = hashPassword(password)
    let MaGiaPha: string
    let giapha_message: string

    // Trường hợp 1: Tạo gia phả mới (exist = false)
    if (giapha.exist === false) {
      // Tạo gia phả mới - Trigger sẽ tự động sinh MaGiaPha
      const [insertGiaPhaResult] = await databaseService.pool.execute<ResultSetHeader>(
        'INSERT INTO CAYGIAPHA (TenGiaPha) VALUES (?)',
        [giapha.name]
      )
      
      // Lấy MaGiaPha vừa được tạo
      const [rows] = await databaseService.pool.execute<RowDataPacket[]>(
        'SELECT MaGiaPha FROM CAYGIAPHA WHERE TenGiaPha = ? ORDER BY MaGiaPha DESC LIMIT 1',
        [giapha.name]
      )
      MaGiaPha = rows[0].MaGiaPha
      giapha_message = USERS_MESSAGES.GIAPHA_CREATED
      
      // Tạo thành viên (sẽ được set làm NguoiLap và TruongToc)
      const [insertMemberResult] = await databaseService.pool.execute<ResultSetHeader>(
        'INSERT INTO THANHVIEN (MaGiaPha, HoTen) VALUES (?, ?)',
        [MaGiaPha, name]
      )
      
      // Lấy MaTV vừa tạo
      const [memberRows] = await databaseService.pool.execute<RowDataPacket[]>(
        'SELECT MaTV FROM THANHVIEN WHERE MaGiaPha = ? AND HoTen = ? ORDER BY MaTV DESC LIMIT 1',
        [MaGiaPha, name]
      )
      const MaTV = memberRows[0].MaTV
      
      // Cập nhật NguoiLap và TruongToc cho gia phả
      await databaseService.pool.execute(
        'UPDATE CAYGIAPHA SET NguoiLap = ?, TruongToc = ? WHERE MaGiaPha = ?',
        [MaTV, MaTV, MaGiaPha]
      )
      
      // Tạo tài khoản
      await databaseService.pool.execute<ResultSetHeader>(
        'INSERT INTO TAIKHOAN (MaTV, Email, MatKhau) VALUES (?, ?, ?)',
        [MaTV, email, hashedPassword]
      )
    } 
    // Trường hợp 2: Gia nhập gia phả có sẵn (exist = true)
    else {
      // Tìm gia phả theo tên
      const [giaPhaRows] = await databaseService.pool.execute<RowDataPacket[]>(
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
      const [insertMemberResult] = await databaseService.pool.execute<ResultSetHeader>(
        'INSERT INTO THANHVIEN (MaGiaPha, HoTen) VALUES (?, ?)',
        [MaGiaPha, name]
      )
      
      // Lấy MaTV vừa tạo
      const [memberRows] = await databaseService.pool.execute<RowDataPacket[]>(
        'SELECT MaTV FROM THANHVIEN WHERE MaGiaPha = ? AND HoTen = ? ORDER BY MaTV DESC LIMIT 1',
        [MaGiaPha, name]
      )
      const MaTV = memberRows[0].MaTV
      
      // Tạo tài khoản
      await databaseService.pool.execute<ResultSetHeader>(
        'INSERT INTO TAIKHOAN (MaTV, Email, MatKhau) VALUES (?, ?, ?)',
        [MaTV, email, hashedPassword]
      )
    }

    // Tạo tokens
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(email),
      this.signRefreshToken(email)
    ])

    // Lưu refresh token
    await databaseService.pool.execute(
      'UPDATE TAIKHOAN SET RefreshToken = ? WHERE Email = ?',
      [refresh_token, email]
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

### Bước 5: Thêm Import

📁 **File:** `src/services/users.services.ts`

**Tìm phần import ở đầu file, đảm bảo có các import sau:**

**Kiểm tra và thêm nếu thiếu:**
```typescript
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { ResultSetHeader, RowDataPacket } from 'mysql2'
```

---

### Bước 6: Cập Nhật Controller

📁 **File:** `src/controllers/users.controllers.ts`

**Tìm hàm `registerController` cũ:**

**Tìm code cũ:**
```typescript
export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await usersService.register(req.body)
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}
```

**Thay thế bằng code mới:**
```typescript
export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await usersService.register(req.body)
  
  // Set cookies cho tokens
  res.cookie('access_token', result.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 phút
  })
  
  res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
  })
  
  return res.status(HTTP_STATUS.CREATED).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result: {
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      MaGiaPha: result.MaGiaPha,
      giapha_message: result.giapha_message
    }
  })
}
```

**Đảm bảo import `HTTP_STATUS` ở đầu file:**
```typescript
import HTTP_STATUS from '~/constants/httpStatus'
```

---

## 5. Test Cases

### Test Case 1: Tạo Gia Phả Mới (Thành Công)

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
      "name": "Gia phả họ Nguyễn Văn"
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
    "MaGiaPha": "GP01",
    "giapha_message": "Tạo gia phả mới thành công. Bạn là người lập và trưởng tộc."
  }
}
```

---

### Test Case 2: Gia Nhập Gia Phả Có Sẵn (Thành Công)

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
      "name": "Gia phả họ Nguyễn Văn"
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
    "MaGiaPha": "GP01",
    "giapha_message": "Gia nhập gia phả thành công. Gia phả: 'Gia phả họ Nguyễn Văn'."
  }
}
```

---

### Test Case 3: Gia Nhập Gia Phả Không Tồn Tại (Lỗi 404)

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyen Van C",
    "email": "nguyenvanc@example.com",
    "password": "Password1234!",
    "confirm_password": "Password1234!",
    "giapha": {
      "exist": true,
      "name": "Gia phả không có thật"
    }
  }'
```

**Expected Response (404 Not Found):**
```json
{
  "message": "Gia phả không tồn tại"
}
```

---

### Test Case 4: Đăng Ký KHÔNG CÓ Gia Phả (Lỗi 400) ⚠️

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyen Van D",
    "email": "nguyenvand@example.com",
    "password": "Password1234!",
    "confirm_password": "Password1234!"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "message": "Validation error",
  "errors": {
    "giapha.exist": {
      "msg": "Thông tin gia phả là bắt buộc",
      "location": "body"
    },
    "giapha.name": {
      "msg": "Tên gia phả là bắt buộc",
      "location": "body"
    }
  }
}
```

> ⚠️ **ĐÂY LÀ TEST CASE QUAN TRỌNG**: Đăng ký cũ không có gia phả **PHẢI BỊ TỪ CHỐI**.

---

### Test Case 5: Thiếu Tên Gia Phả (Lỗi 400)

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyen Van E",
    "email": "nguyenvane@example.com",
    "password": "Password1234!",
    "confirm_password": "Password1234!",
    "giapha": {
      "exist": false
    }
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "message": "Validation error",
  "errors": {
    "giapha.name": {
      "msg": "Tên gia phả là bắt buộc",
      "location": "body"
    }
  }
}
```

---

### Test Case 6: Tên Gia Phả Quá Dài (Lỗi 400)

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyen Van F",
    "email": "nguyenvanf@example.com",
    "password": "Password1234!",
    "confirm_password": "Password1234!",
    "giapha": {
      "exist": false,
      "name": "Tên gia phả này quá dài hơn 35 ký tự nên sẽ bị lỗi validation"
    }
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "message": "Validation error",
  "errors": {
    "giapha.name": {
      "msg": "Tên gia phả phải từ 1 đến 35 ký tự",
      "location": "body"
    }
  }
}
```

---

### Test Case 7: Giá Trị `exist` Không Hợp Lệ (Lỗi 400)

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyen Van G",
    "email": "nguyenvang@example.com",
    "password": "Password1234!",
    "confirm_password": "Password1234!",
    "giapha": {
      "exist": "yes",
      "name": "Gia phả test"
    }
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "message": "Validation error",
  "errors": {
    "giapha.exist": {
      "msg": "Trường exist phải là boolean (true/false)",
      "location": "body"
    }
  }
}
```

---

### Test Case 8: Email Đã Tồn Tại (Lỗi 422)

```bash
# Đăng ký lần 1 (thành công)
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyen Van H",
    "email": "nguyenvanh@example.com",
    "password": "Password1234!",
    "confirm_password": "Password1234!",
    "giapha": {
      "exist": false,
      "name": "Gia phả họ Nguyễn H"
    }
  }'

# Đăng ký lần 2 với cùng email (lỗi)
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyen Van H2",
    "email": "nguyenvanh@example.com",
    "password": "Password1234!",
    "confirm_password": "Password1234!",
    "giapha": {
      "exist": false,
      "name": "Gia phả họ Nguyễn H2"
    }
  }'
```

**Expected Response (422 Unprocessable Entity):**
```json
{
  "message": "Email đã tồn tại"
}
```

---

## 6. So Sánh Trước và Sau

### 6.1 Request Body

| Trước (CŨ - Không còn hỗ trợ) | Sau (MỚI - Bắt buộc) |
|-------------------------------|----------------------|
| `name`, `email`, `password`, `confirm_password` | `name`, `email`, `password`, `confirm_password`, **`giapha`** |
| Không có thông tin gia phả | **Bắt buộc** có `giapha.exist` và `giapha.name` |

### 6.2 Response

| Trước (CŨ) | Sau (MỚI) |
|------------|-----------|
| `access_token`, `refresh_token` | `access_token`, `refresh_token`, **`MaGiaPha`**, **`giapha_message`** |

### 6.3 Hành Vi

| Trường hợp | Trước (CŨ) | Sau (MỚI) |
|------------|------------|-----------|
| Đăng ký không có gia phả | ✅ Thành công | ❌ **Lỗi 400** |
| Đăng ký với gia phả mới | ❌ Không hỗ trợ | ✅ Thành công (người lập + trưởng tộc) |
| Đăng ký gia nhập gia phả | ❌ Không hỗ trợ | ✅ Thành công |

---

## 7. FAQ

### Q1: Đăng ký cũ không có trường `giapha` có còn hoạt động không?

**A1:** **KHÔNG.** Đăng ký không có trường `giapha` sẽ trả về lỗi 400 với message:
```json
{
  "message": "Validation error",
  "errors": {
    "giapha.exist": {
      "msg": "Thông tin gia phả là bắt buộc"
    }
  }
}
```

---

### Q2: Khi tạo gia phả mới, ai là `NguoiLap` và `TruongToc`?

**A2:** Người đăng ký sẽ tự động trở thành cả `NguoiLap` (người lập) và `TruongToc` (trưởng tộc) của gia phả đó.

---

### Q3: Nếu có 2 gia phả cùng tên thì sao?

**A3:** Khi gia nhập (`exist: true`), hệ thống sẽ tìm gia phả **đầu tiên** có tên khớp. Nếu cần chính xác hơn, có thể mở rộng logic tìm kiếm theo các tiêu chí khác (vùng miền, ngày lập, v.v.).

---

### Q4: Làm sao để biết gia phả nào đã tồn tại?

**A4:** Có thể tạo thêm API `/giapha/search?name=...` để tìm kiếm gia phả trước khi đăng ký. Tuy nhiên, nếu không tìm thấy khi đăng ký, API sẽ trả về lỗi 404 rõ ràng.

---

### Q5: `MaGiaPha` được sinh như thế nào?

**A5:** Trigger `TRG_GEN_ID_CAYGIAPHA` tự động sinh mã theo format:
- GP01, GP02, GP03, ... GP99

---

## 8. Kết Luận

### Checklist Hoàn Thành

- [ ] Bước 1: Cập nhật `RegisterReqBody` interface (BẮT BUỘC có `giapha`)
- [ ] Bước 2: Thêm validation cho `giapha.exist` và `giapha.name`
- [ ] Bước 3: Thêm messages constants
- [ ] Bước 4: Cập nhật logic `register()` service
- [ ] Bước 5: Thêm imports cần thiết
- [ ] Bước 6: Cập nhật `registerController()`
- [ ] Test Case 1-8: Kiểm tra tất cả các trường hợp

### Files Cần Sửa

| File | Thay Đổi |
|------|----------|
| `src/models/requests/User.requests.ts` | Thêm `giapha` vào interface |
| `src/middlewares/users.middlewares.ts` | Thêm validation `giapha.exist`, `giapha.name` |
| `src/constants/messages.ts` | Thêm GIAPHA messages |
| `src/services/users.services.ts` | Cập nhật logic `register()` |
| `src/controllers/users.controllers.ts` | Cập nhật response với `MaGiaPha` |

---

**Lưu ý cuối:** Sau khi áp dụng các thay đổi, hãy chạy lại server và test với các test cases ở trên để đảm bảo tính năng hoạt động đúng.

---

## 9. Sửa Lỗi: `databaseService.pool` is private

### 9.1 Vấn Đề

Khi implement code ở **Bước 4**, nếu gặp lỗi:

```
Property 'pool' is private and only accessible within class 'DatabaseService'
```

### 9.2 Nguyên Nhân

File `src/services/database.services.ts` có thuộc tính `pool` được khai báo là `private`, không thể truy cập trực tiếp từ bên ngoài class.

```typescript
class DatabaseService {
  private pool: mysql.Pool;  // ⚠️ private
}
```

### 9.3 Giải Pháp

**Thay tất cả `databaseService.pool.execute()` thành `databaseService.getPool().execute()`**

Class `DatabaseService` đã có method public `getPool()` để truy cập pool:

```typescript
class DatabaseService {
  // ...
  getPool() {
    return this.pool;
  }
}
```

### 9.4 Code Cần Sửa trong Bước 4

📁 **File:** `src/services/users.services.ts`

**TÌM VÀ THAY THẾ tất cả các dòng sau:**

#### Sửa 1: INSERT CAYGIAPHA
```typescript
// ❌ SAI
const [insertGiaPhaResult] = await databaseService.pool.execute<ResultSetHeader>(

// ✅ ĐÚNG
const [insertGiaPhaResult] = await databaseService.getPool().execute<ResultSetHeader>(
```

#### Sửa 2: SELECT MaGiaPha
```typescript
// ❌ SAI
const [rows] = await databaseService.pool.execute<RowDataPacket[]>(

// ✅ ĐÚNG
const [rows] = await databaseService.getPool().execute<RowDataPacket[]>(
```

#### Sửa 3: INSERT THANHVIEN (2 lần - trường hợp 1 và 2)
```typescript
// ❌ SAI
const [insertMemberResult] = await databaseService.pool.execute<ResultSetHeader>(

// ✅ ĐÚNG
const [insertMemberResult] = await databaseService.getPool().execute<ResultSetHeader>(
```

#### Sửa 4: SELECT MaTV (2 lần - trường hợp 1 và 2)
```typescript
// ❌ SAI
const [memberRows] = await databaseService.pool.execute<RowDataPacket[]>(

// ✅ ĐÚNG
const [memberRows] = await databaseService.getPool().execute<RowDataPacket[]>(
```

#### Sửa 5: UPDATE CAYGIAPHA
```typescript
// ❌ SAI
await databaseService.pool.execute(

// ✅ ĐÚNG
await databaseService.getPool().execute(
```

#### Sửa 6: INSERT TAIKHOAN (2 lần - trường hợp 1 và 2)
```typescript
// ❌ SAI
await databaseService.pool.execute<ResultSetHeader>(

// ✅ ĐÚNG
await databaseService.getPool().execute<ResultSetHeader>(
```

#### Sửa 7: SELECT CAYGIAPHA (trường hợp 2)
```typescript
// ❌ SAI
const [giaPhaRows] = await databaseService.pool.execute<RowDataPacket[]>(

// ✅ ĐÚNG
const [giaPhaRows] = await databaseService.getPool().execute<RowDataPacket[]>(
```

#### Sửa 8: UPDATE TAIKHOAN (lưu refresh token)
```typescript
// ❌ SAI
await databaseService.pool.execute(

// ✅ ĐÚNG
await databaseService.getPool().execute(
```

### 9.5 Code Hoàn Chỉnh Sau Khi Sửa

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
    
    // Tạo tài khoản
    await databaseService.getPool().execute<ResultSetHeader>(
      'INSERT INTO TAIKHOAN (MaTV, Email, MatKhau) VALUES (?, ?, ?)',
      [MaTV, email, hashedPassword]
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
    
    // Tạo tài khoản
    await databaseService.getPool().execute<ResultSetHeader>(
      'INSERT INTO TAIKHOAN (MaTV, Email, MatKhau) VALUES (?, ?, ?)',
      [MaTV, email, hashedPassword]
    )
  }

  // Tạo tokens
  const [access_token, refresh_token] = await Promise.all([
    this.signAccessToken(email),
    this.signRefreshToken(email)
  ])

  // Lưu refresh token
  await databaseService.getPool().execute(
    'UPDATE TAIKHOAN SET RefreshToken = ? WHERE Email = ?',
    [refresh_token, email]
  )

  return {
    access_token,
    refresh_token,
    MaGiaPha,
    giapha_message
  }
}
```

### 9.6 Tóm Tắt

- **Vấn đề**: `pool` là private property
- **Giải pháp**: Dùng `getPool()` thay vì truy cập trực tiếp
- **Số chỗ cần sửa**: 12 chỗ (tất cả `.pool.execute` → `.getPool().execute`)
- **Lưu ý**: Đảm bảo import `USERS_MESSAGES` ở đầu file

✅ Sau khi sửa, code sẽ chạy được mà không có lỗi TypeScript.
