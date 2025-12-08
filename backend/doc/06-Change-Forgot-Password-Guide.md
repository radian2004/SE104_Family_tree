# Hướng Dẫn: Thay Đổi Mật Khẩu & Quên Mật Khẩu (MySQL + Gmail SMTP)

## Mục lục
1. [Fix: Chỉ chấp nhận email @gmail.com khi đăng ký](#1-fix-chỉ-chấp-nhận-email-gmailcom-khi-đăng-ký)
2. [Tính năng: Change Password](#2-tính-năng-change-password)
3. [Tính năng: Forgot Password](#3-tính-năng-forgot-password)
4. [Tính năng: Verify Forgot Password Token](#4-tính-năng-verify-forgot-password-token)
5. [Tính năng: Reset Password](#5-tính-năng-reset-password)
6. [Test toàn bộ luồng](#6-test-toàn-bộ-luồng)

---

## 1. Fix: Chỉ chấp nhận email @gmail.com khi đăng ký

### 📝 **Yêu cầu:**
- Chỉ cho phép đăng ký với email có đuôi `@gmail.com`
- Email khác như `@yahoo.com`, `@outlook.com` sẽ bị reject

### 🔧 **Cách thực hiện:**

#### **Bước 1: Cập nhật Messages**

File: `src/constants/messages.ts`

```typescript
export const USERS_MESSAGES = {
  // ...existing messages...
  
  EMAIL_IS_INVALID: 'Email không hợp lệ',
  EMAIL_MUST_BE_GMAIL: 'Chỉ chấp nhận email @gmail.com', // ← THÊM MỚI
  EMAIL_ALREADY_EXISTS: 'Email đã tồn tại',
  
  // ...rest of messages...
} as const;
```

#### **Bước 2: Cập nhật Register Validator**

File: `src/middlewares/users.middlewares.ts`

```typescript
import { USERS_MESSAGES } from '~/constants/messages'
import { checkSchema } from 'express-validator'
import { validate } from '~/utils/validation'
import usersService from '~/services/users.services'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'

export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
        },
        isString: true,
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: USERS_MESSAGES.NAME_LENGTH_INVALID
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        // ═══════════════════════════════════════════════════
        // THÊM CUSTOM VALIDATOR ĐỂ CHECK @gmail.com
        // ═══════════════════════════════════════════════════
        custom: {
          options: async (value) => {
            // Check email có đuôi @gmail.com không
            if (!value.endsWith('@gmail.com')) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_MUST_BE_GMAIL,
                status: HTTP_STATUS.UNPROCESSABLE_ENTITY
              })
            }
            
            // Check email đã tồn tại chưa
            const isExist = await usersService.checkEmailExist(value)
            if (isExist) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS.UNPROCESSABLE_ENTITY
              })
            }
            
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: true,
        isLength: {
          options: { min: 8, max: 50 },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_INVALID
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      },
      confirm_password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
        },
        isString: true,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_NOT_MATCH)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
```

**Giải thích:**
```typescript
// Check đuôi email
if (!value.endsWith('@gmail.com')) {
  throw new ErrorWithStatus({ ... })
}

// Các trường hợp:
'user@gmail.com'     // ✅ PASS
'test@yahoo.com'     // ❌ REJECT - Email must be @gmail.com
'admin@outlook.com'  // ❌ REJECT - Email must be @gmail.com
'hello@gmail.vn'     // ❌ REJECT - Phải là .com
```

---

## 2. Tính năng: Change Password

### 📋 **Mô tả luồng:**

```
User đăng nhập → Muốn đổi mật khẩu
    ↓
Gửi request với:
  - access_token (trong header)
  - old_password (mật khẩu hiện tại)
  - password (mật khẩu mới)
  - confirm_password (xác nhận mật khẩu mới)
    ↓
Server kiểm tra:
  1. Access token hợp lệ?
  2. Old password đúng không?
  3. New password khác old password?
  4. Password và confirm_password khớp?
    ↓
Nếu OK → Hash password mới → Update DB → Trả về success
```

### 🔧 **Triển khai:**

#### **Bước 1: Cập nhật Database Schema**

Đảm bảo bảng `TAIKHOAN` đã có đủ các cột (đã có trong `init.sql`):

```sql
CREATE TABLE TAIKHOAN(
    TenDangNhap VARCHAR(50) PRIMARY KEY,
    MaTV VARCHAR(5),
    MatKhau VARCHAR(100),          -- ✅ Đã có
    MaLoaiTK VARCHAR(5),
    TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(MaLoaiTK) REFERENCES LOAITAIKHOAN(MaLoaiTK)
);
```

#### **Bước 2: Thêm Messages**

File: `src/constants/messages.ts`

```typescript
export const USERS_MESSAGES = {
  // ...existing messages...
  
  // Change Password
  OLD_PASSWORD_IS_REQUIRED: 'Mật khẩu cũ không được để trống',
  OLD_PASSWORD_IS_INCORRECT: 'Mật khẩu cũ không đúng',
  NEW_PASSWORD_MUST_BE_DIFFERENT: 'Mật khẩu mới phải khác mật khẩu cũ',
  CHANGE_PASSWORD_SUCCESS: 'Đổi mật khẩu thành công',
  
  // ...rest of messages...
} as const;
```

#### **Bước 3: Định nghĩa Request Body**

File: `src/models/requests/User.requests.ts`

```typescript
// ...existing interfaces...

export interface ChangePasswordReqBody {
  old_password: string
  password: string
  confirm_password: string
}
```

#### **Bước 4: Tạo Validator**

File: `src/middlewares/users.middlewares.ts`

```typescript
// ...existing imports...

// ═══════════════════════════════════════════════════════════
// CHANGE PASSWORD VALIDATOR
// ═══════════════════════════════════════════════════════════
export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.OLD_PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        trim: true
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: true,
        isLength: {
          options: { min: 8, max: 50 },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_INVALID
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        },
        // Custom: Mật khẩu mới phải khác mật khẩu cũ
        custom: {
          options: (value, { req }) => {
            if (value === req.body.old_password) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.NEW_PASSWORD_MUST_BE_DIFFERENT,
                status: HTTP_STATUS.UNPROCESSABLE_ENTITY
              })
            }
            return true
          }
        }
      },
      confirm_password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
        },
        isString: true,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_NOT_MATCH)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
```

**Giải thích logic:**
```typescript
// 1. Check old_password: Phải có, là string
// 2. Check password mới: Phải mạnh, khác old_password
// 3. Check confirm_password: Phải khớp với password

// Flow kiểm tra:
if (password === old_password) {
  throw Error('Mật khẩu mới phải khác mật khẩu cũ')
}

if (confirm_password !== password) {
  throw Error('Xác nhận mật khẩu không khớp')
}
```

#### **Bước 5: Tạo Service Method**

File: `src/services/users.services.ts`

```typescript
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import databaseService from './database.services'
import { hashPassword } from '~/utils/crypto'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'

// ...existing code...

class UsersService {
  // ...existing methods...

  /**
   * Đổi mật khẩu
   */
  async changePassword({
    user_id,
    old_password,
    new_password
  }: {
    user_id: string
    old_password: string
    new_password: string
  }) {
    // BƯỚC 1: Tìm user và kiểm tra old_password
    const sql = 'SELECT MatKhau FROM TAIKHOAN WHERE TenDangNhap = ?'
    const [rows] = await databaseService.query<RowDataPacket[]>(sql, [user_id])

    if (rows.length === 0) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const user = rows[0]

    // BƯỚC 2: Hash old_password và so sánh
    const hashedOldPassword = hashPassword(old_password)
    
    if (user.MatKhau !== hashedOldPassword) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.OLD_PASSWORD_IS_INCORRECT,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY
      })
    }

    // BƯỚC 3: Hash new_password
    const hashedNewPassword = hashPassword(new_password)

    // BƯỚC 4: Update password trong database
    const updateSql = 'UPDATE TAIKHOAN SET MatKhau = ? WHERE TenDangNhap = ?'
    await databaseService.query<ResultSetHeader>(updateSql, [hashedNewPassword, user_id])

    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
    }
  }
}

const usersService = new UsersService()
export default usersService
```

**Giải thích từng bước:**

```typescript
// BƯỚC 1: Tìm user
SELECT MatKhau FROM TAIKHOAN WHERE TenDangNhap = 'user@gmail.com'
// → { MatKhau: 'a1b2c3d4...' }

// BƯỚC 2: Verify old_password
const hashedOldPassword = hashPassword('OldPass123!')
if (user.MatKhau !== hashedOldPassword) {
  throw Error('Old password incorrect')
}

// BƯỚC 3: Hash new_password
const hashedNewPassword = hashPassword('NewPass456!')
// → 'x9y8z7w6...'

// BƯỚC 4: Update
UPDATE TAIKHOAN 
SET MatKhau = 'x9y8z7w6...' 
WHERE TenDangNhap = 'user@gmail.com'
```

#### **Bước 6: Tạo Controller**

File: `src/controllers/users.controllers.ts`

```typescript
import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ChangePasswordReqBody, TokenPayload } from '~/models/requests/User.requests'
import usersService from '~/services/users.services'
import HTTP_STATUS from '~/constants/httpStatus'

// ...existing controllers...

/**
 * Controller đổi mật khẩu
 * PUT /users/change-password
 */
export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  // Lấy user_id từ access token (đã decode bởi accessTokenValidator)
  const { user_id } = req.decoded_authorization as TokenPayload
  
  // Lấy old_password và password mới từ body
  const { old_password, password } = req.body

  // Gọi service để đổi mật khẩu
  const result = await usersService.changePassword({
    user_id,
    old_password,
    new_password: password
  })

  return res.status(HTTP_STATUS.OK).json(result)
}
```

#### **Bước 7: Tạo Route**

File: `src/routes/users.routes.ts`

```typescript
import { Router } from 'express'
import {
  registerController,
  loginController,
  logoutController,
  changePasswordController  // ← THÊM
} from '~/controllers/users.controllers'
import {
  registerValidator,
  loginValidator,
  accessTokenValidator,
  refreshTokenValidator,
  changePasswordValidator  // ← THÊM
} from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'

const usersRouter = Router()

// ...existing routes...

/**
 * Description: Đổi mật khẩu
 * Path: /users/change-password
 * Method: PUT
 * Headers: { Authorization: Bearer <access_token> }
 * Body: { old_password: string, password: string, confirm_password: string }
 */
usersRouter.put(
  '/change-password',
  accessTokenValidator,        // Kiểm tra đăng nhập
  changePasswordValidator,     // Validate input
  wrapAsync(changePasswordController)
)

export default usersRouter
```

**Middleware chain:**
```
1. accessTokenValidator  → Verify access token → Lấy user_id
2. changePasswordValidator → Validate old_password, password, confirm_password
3. changePasswordController → Xử lý đổi mật khẩu
```

---

## 3. Tính năng: Forgot Password

### 📋 **Mô tả luồng:**

```
User quên mật khẩu → Click "Quên mật khẩu"
    ↓
Nhập email đã đăng ký
    ↓
Server:
  1. Kiểm tra email có tồn tại?
  2. Tạo forgot_password_token (JWT)
  3. Lưu token vào database
  4. Gửi email chứa link reset password
    ↓
User nhận email → Click link → Chuyển đến trang reset password
```

### 🔧 **Triển khai:**

#### **Bước 1: Cập nhật Database Schema**

**Thêm cột `ForgotPasswordToken` vào bảng TAIKHOAN:**

```sql
-- Chạy lệnh này trong MySQL
ALTER TABLE TAIKHOAN 
ADD COLUMN ForgotPasswordToken VARCHAR(500) NULL;
```

**Verify:**
```sql
DESCRIBE TAIKHOAN;
```

Kết quả phải có:
```
+---------------------+--------------+------+-----+-------------------+
| Field               | Type         | Null | Key | Default           |
+---------------------+--------------+------+-----+-------------------+
| TenDangNhap         | varchar(50)  | NO   | PRI | NULL              |
| MaTV                | varchar(5)   | YES  | MUL | NULL              |
| MatKhau             | varchar(100) | YES  |     | NULL              |
| MaLoaiTK            | varchar(5)   | YES  | MUL | NULL              |
| TGTaoMoi            | timestamp    | YES  |     | CURRENT_TIMESTAMP |
| ForgotPasswordToken | varchar(500) | YES  |     | NULL              | ← MỚI
+---------------------+--------------+------+-----+-------------------+
```

#### **Bước 2: Cập nhật .env**

File: `.env`

```env
# ...existing env variables...

# JWT Secret cho forgot password token
JWT_SECRET_FORGOT_PASSWORD_TOKEN=your-forgot-password-secret-key-2025
FORGOT_PASSWORD_TOKEN_EXPIRE_IN=7d

# Gmail SMTP (để gửi email)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password-16-chars

# Frontend URL
CLIENT_URL=http://localhost:3000
```

#### **Bước 3: Thêm TokenType vào Enum**

File: `src/constants/enums.ts`

```typescript
export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,  // ✅ Đã có sẵn
  EmailVerifyToken
}

export enum UserRole {
  Admin = 'LTK01',
  User = 'LTK02'
}
```

#### **Bước 4: Thêm Messages**

File: `src/constants/messages.ts`

```typescript
export const USERS_MESSAGES = {
  // ...existing messages...
  
  // Forgot Password
  USER_NOT_FOUND: 'Người dùng không tồn tại',
  CHECK_EMAIL_TO_RESET_PASSWORD: 'Vui lòng kiểm tra email để đặt lại mật khẩu',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token không được để trống',
  FORGOT_PASSWORD_TOKEN_IS_INVALID: 'Forgot password token không hợp lệ',
  
  // ...rest of messages...
} as const;
```

#### **Bước 5: Cài đặt Nodemailer**

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

#### **Bước 6: Tạo Email Utility**

File: `src/utils/email.ts` (FILE MỚI)

```typescript
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// ═══════════════════════════════════════════════════════════
// TRANSPORTER - Cấu hình Gmail SMTP
// ═══════════════════════════════════════════════════════════
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

/**
 * Gửi email reset password
 * @param to - Email người nhận
 * @param forgot_password_token - Token để reset password
 */
export const sendResetPasswordEmail = async (to: string, forgot_password_token: string) => {
  // Link reset password (frontend)
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${forgot_password_token}`

  const mailOptions = {
    from: `"Hệ thống CNPM" <${process.env.GMAIL_USER}>`,
    to: to,
    subject: '🔐 Đặt lại mật khẩu - Hệ thống CNPM',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #f44336; text-align: center;">🔐 Đặt lại mật khẩu</h2>
        
        <p>Xin chào,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
        <p><strong>Nếu không phải bạn</strong>, vui lòng bỏ qua email này.</p>
        
        <p>Click vào nút bên dưới để tiếp tục:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #f44336; 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    display: inline-block;
                    font-weight: bold;">
            Đặt lại mật khẩu ngay
          </a>
        </div>
        
        <p>Hoặc copy link sau vào trình duyệt:</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
          ${resetLink}
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        
        <p style="color: #999; font-size: 12px;">
          ⏰ Link này sẽ hết hạn sau 7 ngày.<br>
          ⚠️ Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        </p>
      </div>
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email reset password đã gửi thành công!')
    console.log('📧 Message ID:', info.messageId)
    console.log('📬 Email gửi tới:', to)
    return true
  } catch (error) {
    console.error('❌ Lỗi khi gửi email:', error)
    throw new Error('Không thể gửi email reset password')
  }
}
```

**Giải thích:**

```typescript
// Transporter: Cấu hình kết nối Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',                        // Dùng Gmail SMTP
  auth: {
    user: process.env.GMAIL_USER,         // Email gửi
    pass: process.env.GMAIL_APP_PASSWORD  // App Password (16 ký tự)
  }
})

// Link reset password
const resetLink = `${CLIENT_URL}/reset-password?token=${forgot_password_token}`
// → http://localhost:3000/reset-password?token=eyJhbGc...

// HTML email template
mailOptions = {
  from: "Hệ thống CNPM",
  to: "user@gmail.com",
  subject: "Đặt lại mật khẩu",
  html: `<button href="${resetLink}">Đặt lại mật khẩu</button>`
}
```

#### **Bước 7: Định nghĩa Request Body**

File: `src/models/requests/User.requests.ts`

```typescript
// ...existing interfaces...

export interface ForgotPasswordReqBody {
  email: string
}
```

#### **Bước 8: Tạo Service Method**

File: `src/services/users.services.ts`

```typescript
import { TokenType } from '~/constants/enums'
import { signToken } from '~/utils/jwt'
import { sendResetPasswordEmail } from '~/utils/email'

class UsersService {
  // ...existing methods...

  /**
   * Tạo forgot password token
   */
  private signForgotPasswordToken(user_id: string) {
    return signToken(
      {
        user_id,
        token_type: TokenType.ForgotPasswordToken
      },
      process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      {
        algorithm: 'HS256',
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRE_IN || '7d'
      }
    )
  }

  /**
   * Xử lý forgot password
   */
  async forgotPassword(email: string) {
    // BƯỚC 1: Tìm user theo email
    const sql = 'SELECT TenDangNhap FROM TAIKHOAN WHERE TenDangNhap = ?'
    const [rows] = await databaseService.query<RowDataPacket[]>(sql, [email])

    if (rows.length === 0) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const user_id = rows[0].TenDangNhap

    // BƯỚC 2: Tạo forgot_password_token
    const forgot_password_token = await this.signForgotPasswordToken(user_id)

    // BƯỚC 3: Lưu token vào database
    const updateSql = 'UPDATE TAIKHOAN SET ForgotPasswordToken = ? WHERE TenDangNhap = ?'
    await databaseService.query<ResultSetHeader>(updateSql, [forgot_password_token, user_id])

    // BƯỚC 4: Gửi email
    try {
      await sendResetPasswordEmail(email, forgot_password_token)
    } catch (error) {
      console.error('⚠️ Không gửi được email:', error)
      throw new ErrorWithStatus({
        message: 'Không thể gửi email. Vui lòng thử lại sau.',
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR
      })
    }

    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }
}

const usersService = new UsersService()
export default usersService
```

**Giải thích từng bước:**

```typescript
// BƯỚC 1: Tìm user
SELECT TenDangNhap FROM TAIKHOAN WHERE TenDangNhap = 'user@gmail.com'
// Nếu không tìm thấy → throw USER_NOT_FOUND

// BƯỚC 2: Tạo JWT token
const forgot_password_token = signToken({
  user_id: 'user@gmail.com',
  token_type: TokenType.ForgotPasswordToken  // = 2
}, SECRET_KEY, { expiresIn: '7d' })
// → "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// BƯỚC 3: Lưu vào DB
UPDATE TAIKHOAN 
SET ForgotPasswordToken = 'eyJhbGc...' 
WHERE TenDangNhap = 'user@gmail.com'

// BƯỚC 4: Gửi email
await sendResetPasswordEmail('user@gmail.com', 'eyJhbGc...')
```

#### **Bước 9: Tạo Validator**

File: `src/middlewares/users.middlewares.ts`

```typescript
// ═══════════════════════════════════════════════════════════
// FORGOT PASSWORD VALIDATOR
// ═══════════════════════════════════════════════════════════
export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        // Custom: Check email có tồn tại không
        custom: {
          options: async (value) => {
            const isExist = await usersService.checkEmailExist(value)
            if (!isExist) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
```

#### **Bước 10: Tạo Controller**

File: `src/controllers/users.controllers.ts`

```typescript
import { ForgotPasswordReqBody } from '~/models/requests/User.requests'

// ...existing controllers...

/**
 * Controller forgot password
 * POST /users/forgot-password
 */
export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body

  const result = await usersService.forgotPassword(email)

  return res.status(HTTP_STATUS.OK).json(result)
}
```

#### **Bước 11: Tạo Route**

File: `src/routes/users.routes.ts`

```typescript
import { forgotPasswordController } from '~/controllers/users.controllers'
import { forgotPasswordValidator } from '~/middlewares/users.middlewares'

// ...existing routes...

/**
 * Description: Quên mật khẩu
 * Path: /users/forgot-password
 * Method: POST
 * Body: { email: string }
 */
usersRouter.post(
  '/forgot-password',
  forgotPasswordValidator,
  wrapAsync(forgotPasswordController)
)

export default usersRouter
```

---

## 4. Tính năng: Verify Forgot Password Token

### 📋 **Mô tả:**

Kiểm tra `forgot_password_token` có hợp lệ trước khi cho phép reset password.

### 🔧 **Triển khai:**

#### **Bước 1: Thêm Messages**

File: `src/constants/messages.ts`

```typescript
export const USERS_MESSAGES = {
  // ...existing...
  
  VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS: 'Xác thực token thành công',
  
  // ...rest...
} as const;
```

#### **Bước 2: Định nghĩa Request Body**

File: `src/models/requests/User.requests.ts`

```typescript
// ...existing...

export interface VerifyForgotPasswordTokenReqBody {
  forgot_password_token: string
}
```

#### **Bước 3: Cập nhật type.d.ts**

File: `src/type.d.ts`

```typescript
import { Request } from 'express'
import { TokenPayload } from './models/requests/User.requests'

declare module 'express' {
  interface Request {
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_forgot_password_token?: TokenPayload  // ← THÊM MỚI
  }
}
```

#### **Bước 4: Tạo Validator**

File: `src/middlewares/users.middlewares.ts`

```typescript
import { verifyToken } from '~/utils/jwt'
import { JsonWebTokenError } from 'jsonwebtoken'

// ═══════════════════════════════════════════════════════════
// VERIFY FORGOT PASSWORD TOKEN VALIDATOR
// ═══════════════════════════════════════════════════════════
export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            try {
              // BƯỚC 1: Verify JWT
              const decoded = await verifyToken(
                value,
                process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
              )

              // BƯỚC 2: Kiểm tra token có trong database không
              const sql = 'SELECT ForgotPasswordToken FROM TAIKHOAN WHERE TenDangNhap = ?'
              const [rows] = await databaseService.query<RowDataPacket[]>(sql, [decoded.user_id])

              if (rows.length === 0 || rows[0].ForgotPasswordToken !== value) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }

              // BƯỚC 3: Gán decoded vào req
              (req as Request).decoded_forgot_password_token = decoded

              return true
            } catch (error) {
              if (error instanceof ErrorWithStatus) {
                throw error
              }
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
          }
        }
      }
    },
    ['body']
  )
)
```

**Giải thích:**

```typescript
// BƯỚC 1: Verify JWT signature
const decoded = verifyToken(token, SECRET_KEY)
// decoded = { user_id: 'user@gmail.com', token_type: 2, exp: ... }

// BƯỚC 2: Check token có trong DB không
SELECT ForgotPasswordToken FROM TAIKHOAN WHERE TenDangNhap = 'user@gmail.com'
// → { ForgotPasswordToken: 'eyJhbGc...' }

if (db_token !== request_token) {
  throw Error('Token invalid')
}

// BƯỚC 3: Gán vào req để controller dùng
req.decoded_forgot_password_token = decoded
```

#### **Bước 5: Tạo Controller**

File: `src/controllers/users.controllers.ts`

```typescript
import { VerifyForgotPasswordTokenReqBody } from '~/models/requests/User.requests'

// ...existing...

/**
 * Controller verify forgot password token
 * POST /users/verify-forgot-password
 */
export const verifyForgotPasswordTokenController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordTokenReqBody>,
  res: Response,
  next: NextFunction
) => {
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}
```

**Note:** Không cần gọi service vì validator đã verify hết rồi.

#### **Bước 6: Tạo Route**

File: `src/routes/users.routes.ts`

```typescript
import { verifyForgotPasswordTokenController } from '~/controllers/users.controllers'
import { verifyForgotPasswordTokenValidator } from '~/middlewares/users.middlewares'

// ...existing...

/**
 * Description: Verify forgot password token
 * Path: /users/verify-forgot-password
 * Method: POST
 * Body: { forgot_password_token: string }
 */
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapAsync(verifyForgotPasswordTokenController)
)

export default usersRouter
```

---

## 5. Tính năng: Reset Password

### 📋 **Mô tả:**

Sau khi verify token thành công, cho phép user nhập password mới.

### 🔧 **Triển khai:**

#### **Bước 1: Thêm Messages**

File: `src/constants/messages.ts`

```typescript
export const USERS_MESSAGES = {
  // ...existing...
  
  RESET_PASSWORD_SUCCESS: 'Đặt lại mật khẩu thành công',
  
  // ...rest...
} as const;
```

#### **Bước 2: Định nghĩa Request Body**

File: `src/models/requests/User.requests.ts`

```typescript
// ...existing...

export interface ResetPasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}
```

#### **Bước 3: Tạo Validator**

File: `src/middlewares/users.middlewares.ts`

```typescript
// ═══════════════════════════════════════════════════════════
// RESET PASSWORD VALIDATOR
// ═══════════════════════════════════════════════════════════
export const resetPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            try {
              // Verify token (giống verifyForgotPasswordTokenValidator)
              const decoded = await verifyToken(
                value,
                process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
              )

              const sql = 'SELECT ForgotPasswordToken FROM TAIKHOAN WHERE TenDangNhap = ?'
              const [rows] = await databaseService.query<RowDataPacket[]>(sql, [decoded.user_id])

              if (rows.length === 0 || rows[0].ForgotPasswordToken !== value) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }

              (req as Request).decoded_forgot_password_token = decoded
              return true
            } catch (error) {
              if (error instanceof ErrorWithStatus) {
                throw error
              }
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: true,
        isLength: {
          options: { min: 8, max: 50 },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_INVALID
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      },
      confirm_password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
        },
        isString: true,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_NOT_MATCH)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)
```

#### **Bước 4: Tạo Service Method**

File: `src/services/users.services.ts`

```typescript
class UsersService {
  // ...existing...

  /**
   * Reset password
   */
  async resetPassword(user_id: string, new_password: string) {
    // BƯỚC 1: Hash password mới
    const hashedPassword = hashPassword(new_password)

    // BƯỚC 2: Update password và xóa forgot_password_token
    const updateSql = `
      UPDATE TAIKHOAN 
      SET MatKhau = ?, ForgotPasswordToken = NULL 
      WHERE TenDangNhap = ?
    `
    await databaseService.query<ResultSetHeader>(updateSql, [hashedPassword, user_id])

    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    }
  }
}

const usersService = new UsersService()
export default usersService
```

**Giải thích:**

```typescript
// Update password và xóa token (để không dùng lại)
UPDATE TAIKHOAN 
SET MatKhau = 'new_hashed_password', 
    ForgotPasswordToken = NULL 
WHERE TenDangNhap = 'user@gmail.com'
```

#### **Bước 5: Tạo Controller**

File: `src/controllers/users.controllers.ts`

```typescript
import { ResetPasswordReqBody } from '~/models/requests/User.requests'

// ...existing...

/**
 * Controller reset password
 * POST /users/reset-password
 */
export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  // Lấy user_id từ decoded token
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  
  // Lấy password mới
  const { password } = req.body

  // Gọi service
  const result = await usersService.resetPassword(user_id, password)

  return res.status(HTTP_STATUS.OK).json(result)
}
```

#### **Bước 6: Tạo Route**

File: `src/routes/users.routes.ts`

```typescript
import { resetPasswordController } from '~/controllers/users.controllers'
import { resetPasswordValidator } from '~/middlewares/users.middlewares'

// ...existing...

/**
 * Description: Đặt lại mật khẩu
 * Path: /users/reset-password
 * Method: POST
 * Body: { forgot_password_token: string, password: string, confirm_password: string }
 */
usersRouter.post(
  '/reset-password',
  resetPasswordValidator,
  wrapAsync(resetPasswordController)
)

export default usersRouter
```

---

## 6. Test toàn bộ luồng

### 🧪 **Test 1: Đăng ký với email không phải @gmail.com**

**Request:**
```http
POST http://localhost:3000/users/register
Content-Type: application/json

{
  "name": "Nguyễn Văn A",
  "email": "test@yahoo.com",
  "password": "Password123!",
  "confirm_password": "Password123!"
}
```

**Expected Response:**
```json
{
  "message": "Validation error",
  "errors": {
    "email": "Chỉ chấp nhận email @gmail.com"
  }
}
```
**Status:** `422 Unprocessable Entity`

---

### 🧪 **Test 2: Đăng ký thành công với @gmail.com**

**Request:**
```http
POST http://localhost:3000/users/register
Content-Type: application/json

{
  "name": "Nguyễn Văn A",
  "email": "test@gmail.com",
  "password": "Password123!",
  "confirm_password": "Password123!"
}
```

**Expected Response:**
```json
{
  "message": "Đăng ký tài khoản thành công",
  "result": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```
**Status:** `201 Created`

---

### 🧪 **Test 3: Đổi mật khẩu**

**Bước 1: Đăng nhập để lấy access_token**

```http
POST http://localhost:3000/users/login
Content-Type: application/json

{
  "email": "test@gmail.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "message": "Đăng nhập thành công",
  "result": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

**Bước 2: Đổi mật khẩu**

```http
PUT http://localhost:3000/users/change-password
Content-Type: application/json
Authorization: Bearer eyJhbGc...

{
  "old_password": "Password123!",
  "password": "NewPassword456!",
  "confirm_password": "NewPassword456!"
}
```

**Expected Response:**
```json
{
  "message": "Đổi mật khẩu thành công"
}
```
**Status:** `200 OK`

**Bước 3: Verify bằng cách login với password mới**

```http
POST http://localhost:3000/users/login
Content-Type: application/json

{
  "email": "test@gmail.com",
  "password": "NewPassword456!"
}
```

**Expected:** Login thành công ✅

---

### 🧪 **Test 4: Forgot Password Flow (Đầy đủ)**

**Bước 1: Gửi request forgot password**

```http
POST http://localhost:3000/users/forgot-password
Content-Type: application/json

{
  "email": "test@gmail.com"
}
```

**Expected Response:**
```json
{
  "message": "Vui lòng kiểm tra email để đặt lại mật khẩu"
}
```
**Status:** `200 OK`

**Kiểm tra email:**
- ✅ Nhận được email từ hệ thống
- ✅ Có link reset password
- ✅ Link có dạng: `http://localhost:3000/reset-password?token=eyJhbGc...`

**Bước 2: Copy token từ email → Verify token**

```http
POST http://localhost:3000/users/verify-forgot-password
Content-Type: application/json

{
  "forgot_password_token": "eyJhbGc..."
}
```

**Expected Response:**
```json
{
  "message": "Xác thực token thành công"
}
```
**Status:** `200 OK`

**Bước 3: Reset password**

```http
POST http://localhost:3000/users/reset-password
Content-Type: application/json

{
  "forgot_password_token": "eyJhbGc...",
  "password": "ResetPass789!",
  "confirm_password": "ResetPass789!"
}
```

**Expected Response:**
```json
{
  "message": "Đặt lại mật khẩu thành công"
}
```
**Status:** `200 OK`

**Bước 4: Login với password mới**

```http
POST http://localhost:3000/users/login
Content-Type: application/json

{
  "email": "test@gmail.com",
  "password": "ResetPass789!"
}
```

**Expected:** Login thành công ✅

**Bước 5: Thử dùng lại forgot_password_token cũ**

```http
POST http://localhost:3000/users/reset-password
Content-Type: application/json

{
  "forgot_password_token": "eyJhbGc...",  // Token đã dùng
  "password": "AnotherPass999!",
  "confirm_password": "AnotherPass999!"
}
```

**Expected Response:**
```json
{
  "message": "Forgot password token không hợp lệ"
}
```
**Status:** `401 Unauthorized`

✅ **Token đã bị xóa khỏi database → Không thể dùng lại**

---

## 🎯 Tổng kết

### ✅ **Đã hoàn thành:**

1. **Fix email validation:**
   - ✅ Chỉ chấp nhận `@gmail.com`
   - ✅ Reject email khác

2. **Change Password:**
   - ✅ Verify old password
   - ✅ Check new password khác old password
   - ✅ Hash và update database

3. **Forgot Password:**
   - ✅ Tạo forgot_password_token
   - ✅ Lưu token vào database
   - ✅ Gửi email với link reset

4. **Verify Forgot Password Token:**
   - ✅ Verify JWT signature
   - ✅ Check token trong database

5. **Reset Password:**
   - ✅ Hash password mới
   - ✅ Update database
   - ✅ Xóa forgot_password_token (không dùng lại)

### 📊 **API Endpoints:**

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/users/register` | ❌ | Đăng ký (chỉ @gmail.com) |
| POST | `/users/login` | ❌ | Đăng nhập |
| PUT | `/users/change-password` | ✅ | Đổi mật khẩu |
| POST | `/users/forgot-password` | ❌ | Quên mật khẩu |
| POST | `/users/verify-forgot-password` | ❌ | Verify token |
| POST | `/users/reset-password` | ❌ | Reset password |

### 🔒 **Bảo mật:**

- ✅ Password được hash (SHA-256 + secret)
- ✅ JWT tokens có expiration
- ✅ Forgot password token chỉ dùng 1 lần
- ✅ Verify old password trước khi change
- ✅ Strong password policy
- ✅ Email validation (@gmail.com only)

### 📧 **Email Configuration:**

**Gmail SMTP (Miễn phí):**
- ✅ 500 email/ngày
- ✅ Gửi email thật
- ✅ HTML template đẹp

**Setup:**
1. Bật 2-Step Verification
2. Tạo App Password (16 ký tự)
3. Cập nhật `.env`

---

## 🚀 Lưu ý quan trọng

### ⚠️ **Production:**

1. **Secret Keys:**
   ```env
   JWT_SECRET_FORGOT_PASSWORD_TOKEN=<dùng secret mạnh>
   PASSWORD_SECRET=<dùng secret mạnh>
   ```

2. **Email:**
   - Sản xuất: Dùng SendGrid, AWS SES
   - Gmail SMTP: Chỉ cho development

3. **Frontend:**
   - Update `CLIENT_URL` thành domain thật
   - Tạo trang `/reset-password` để nhận token

4. **Database:**
   - Index cho `ForgotPasswordToken`
   - Tự động xóa expired tokens (cron job)

### 🐛 **Troubleshooting:**

**Lỗi: Cannot send email**
```bash
# Check .env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  # 16 ký tự

# Verify transporter
node -e "require('./dist/utils/email').sendResetPasswordEmail('test@gmail.com', 'test-token')"
```

**Lỗi: Token invalid**
```bash
# Check JWT secret consistency
JWT_SECRET_FORGOT_PASSWORD_TOKEN=<same-in-.env>
```

**Lỗi: Email không phải @gmail.com**
```bash
# Check validator
if (!value.endsWith('@gmail.com')) {
  throw Error('Chỉ chấp nhận @gmail.com')
}
```

---

**🎉 Hoàn thành! Bây giờ bạn có thể test toàn bộ luồng trên Postman.**
