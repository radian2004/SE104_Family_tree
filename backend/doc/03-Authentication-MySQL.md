# Xây dựng hệ thống Authentication cho MySQL (Đăng ký, Đăng nhập, Đăng xuất)

## Kiến thức nền tảng cần nắm vững

### 1. RESTful API
- **GET**: Đọc dữ liệu
- **POST**: Tạo mới dữ liệu
- **PUT**: Cập nhật dữ liệu
- **DELETE**: Xóa dữ liệu

### 2. HTTP Status Codes quan trọng
- **200 OK**: Thành công
- **201 CREATED**: Tạo thành công
- **400 BAD REQUEST**: Lỗi dữ liệu đầu vào
- **401 UNAUTHORIZED**: Thiếu hoặc sai authentication token
- **403 FORBIDDEN**: Không có quyền truy cập
- **404 NOT FOUND**: Không tìm thấy tài nguyên
- **422 UNPROCESSABLE ENTITY**: Lỗi validation
- **500 INTERNAL SERVER ERROR**: Lỗi server

### 3. JWT (JSON Web Token)
- Cấu trúc: `header.payload.signature`
- **Header**: Chứa thuật toán mã hóa (HS256, RS256...)
- **Payload**: Chứa thông tin user (user_id, role, exp, iat...)
- **Signature**: Chữ ký xác thực, tạo bằng secret key

### 4. Access Token vs Refresh Token
- **Access Token**: 
  - Thời gian sống ngắn (15 phút - 1 giờ)
  - Dùng để xác thực các request API
  - Không lưu vào database
  
- **Refresh Token**:
  - Thời gian sống dài (7 ngày - 30 ngày)
  - Dùng để tạo Access Token mới khi hết hạn
  - **BẮT BUỘC** lưu vào database để có thể thu hồi

### 5. Mô hình MVC
```
Client → Routes → Middleware → Controller → Service → Database
                                    ↓
                              Error Handler
```

### 6. Password Security
- **KHÔNG BAO GIỜ** lưu password dạng plain text
- Sử dụng hash function: SHA-256, bcrypt, argon2
- Kết hợp với salt để tăng bảo mật

---

## Chuẩn bị môi trường

### Bước 1: Cài đặt các package cần thiết

```bash
npm install jsonwebtoken express-validator lodash
npm install -D @types/jsonwebtoken @types/lodash
```

**Giải thích:**
- `jsonwebtoken`: Tạo và verify JWT tokens
- `express-validator`: Validate dữ liệu đầu vào
- `lodash`: Utility functions (omit, pick...)

### Bước 2: Cập nhật biến môi trường

File `.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=app

# Server
PORT=3000

# JWT Secrets (phải khác nhau để tăng bảo mật)
JWT_SECRET_ACCESS_TOKEN=your-secret-access-token-key-here
JWT_SECRET_REFRESH_TOKEN=your-secret-refresh-token-key-here

# Password hashing
PASSWORD_SECRET=your-password-hash-secret

# Token expiration
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d
```

---

## PHẦN 1: Tạo cấu trúc dữ liệu

### Bước 1: Tạo bảng TAIKHOAN trong database

Thêm vào file `init.sql`:

```sql
-- Bảng tài khoản
CREATE TABLE TAIKHOAN (
    TenDangNhap VARCHAR(50) PRIMARY KEY,
    MaTV VARCHAR(5),
    MatKhau VARCHAR(100) NOT NULL,
    MaLoaiTK VARCHAR(5),
    TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(MaLoaiTK) REFERENCES LOAITAIKHOAN(MaLoaiTK)
);

-- Bảng refresh tokens
CREATE TABLE REFRESH_TOKENS (
    token VARCHAR(500) PRIMARY KEY,
    TenDangNhap VARCHAR(50) NOT NULL,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    NgayHetHan TIMESTAMP NOT NULL,
    FOREIGN KEY(TenDangNhap) REFERENCES TAIKHOAN(TenDangNhap) ON DELETE CASCADE
);

-- Insert loại tài khoản mẫu
INSERT INTO LOAITAIKHOAN (MaLoaiTK, TenLoaiTK) VALUES
('LTK01', 'Admin'),
('LTK02', 'User');
```

Chạy lệnh để import vào MySQL:
```bash
docker exec -i cnpm_mysql mysql -uroot -p123456 app < init.sql
```

---

### Bước 2: Tạo constants và enums

**File `src/constants/enums.ts`:**
```typescript
export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum UserRole {
  Admin = 'LTK01',
  User = 'LTK02'
}
```

**File `src/constants/httpStatus.ts`:**
```typescript
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const;

export default HTTP_STATUS;
```

**File `src/constants/messages.ts`:**
```typescript
export const USERS_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  
  // Register
  NAME_IS_REQUIRED: 'Tên không được để trống',
  NAME_LENGTH_INVALID: 'Tên phải từ 1-100 ký tự',
  
  EMAIL_IS_REQUIRED: 'Email không được để trống',
  EMAIL_IS_INVALID: 'Email không hợp lệ',
  EMAIL_ALREADY_EXISTS: 'Email đã tồn tại',
  
  PASSWORD_IS_REQUIRED: 'Mật khẩu không được để trống',
  PASSWORD_LENGTH_INVALID: 'Mật khẩu phải từ 6-50 ký tự',
  PASSWORD_MUST_BE_STRONG: 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt',
  
  CONFIRM_PASSWORD_IS_REQUIRED: 'Xác nhận mật khẩu không được để trống',
  CONFIRM_PASSWORD_NOT_MATCH: 'Xác nhận mật khẩu không khớp',
  
  // Login
  EMAIL_OR_PASSWORD_INCORRECT: 'Email hoặc mật khẩu không đúng',
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  
  // Logout
  ACCESS_TOKEN_IS_REQUIRED: 'Access token không được để trống',
  ACCESS_TOKEN_IS_INVALID: 'Access token không hợp lệ',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token không được để trống',
  REFRESH_TOKEN_IS_INVALID: 'Refresh token không hợp lệ',
  REFRESH_TOKEN_NOT_EXIST: 'Refresh token không tồn tại',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  
  // Register success
  REGISTER_SUCCESS: 'Đăng ký tài khoản thành công'
} as const;
```

---

### Bước 3: Tạo Schema cho TaiKhoan

**File `src/models/schemas/TaiKhoan.schema.ts`:**
```typescript
interface TaiKhoanType {
  TenDangNhap?: string;
  MaTV?: string;
  MatKhau: string;
  MaLoaiTK?: string;
  TGTaoMoi?: Date;
}

export default class TaiKhoan {
  TenDangNhap?: string;
  MaTV?: string;
  MatKhau: string;
  MaLoaiTK: string;
  TGTaoMoi: Date;

  constructor(taikhoan: TaiKhoanType) {
    this.TenDangNhap = taikhoan.TenDangNhap;
    this.MaTV = taikhoan.MaTV;
    this.MatKhau = taikhoan.MatKhau;
    this.MaLoaiTK = taikhoan.MaLoaiTK || 'LTK02'; // Mặc định User
    this.TGTaoMoi = taikhoan.TGTaoMoi || new Date();
  }
}
```

**File `src/models/schemas/RefreshToken.schema.ts`:**
```typescript
export default class RefreshToken {
  token: string;
  TenDangNhap: string;
  NgayTao: Date;
  NgayHetHan: Date;

  constructor(token: string, tenDangNhap: string, ngayHetHan: Date) {
    this.token = token;
    this.TenDangNhap = tenDangNhap;
    this.NgayTao = new Date();
    this.NgayHetHan = ngayHetHan;
  }
}
```

---

### Bước 4: Tạo Request Types

**File `src/models/requests/User.requests.ts`:**
```typescript
import { JwtPayload } from 'jsonwebtoken';
import { TokenType } from '~/constants/enums';

export interface RegisterReqBody {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginReqBody {
  email: string;
  password: string;
}

export interface LogoutReqBody {
  refresh_token: string;
}

export interface TokenPayload extends JwtPayload {
  user_id: string;
  token_type: TokenType;
  iat: number;
  exp: number;
}
```

**File `src/type.d.ts`:** (Mở rộng Request của Express)
```typescript
import { Request } from 'express';
import { TokenPayload } from './models/requests/User.requests';

declare module 'express' {
  interface Request {
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;
  }
}
```

---

## PHẦN 2: Tạo Utilities

### Bước 1: Tạo crypto utilities

**File `src/utils/crypto.ts`:**
```typescript
import { createHash } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Mã hóa password bằng SHA-256
 * @param content - Password cần mã hóa
 * @returns Password đã được hash
 */
export function sha256(content: string): string {
  return createHash('sha256')
    .update(content + process.env.PASSWORD_SECRET)
    .digest('hex');
}

/**
 * Hash password trước khi lưu vào database
 */
export function hashPassword(password: string): string {
  return sha256(password);
}
```

**Giải thích:**
- Sử dụng SHA-256 để hash password
- Kết hợp với `PASSWORD_SECRET` để tăng độ bảo mật
- Không thể reverse từ hash về password gốc

---

### Bước 2: Tạo JWT utilities

**File `src/utils/jwt.ts`:**
```typescript
import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenPayload } from '~/models/requests/User.requests';

/**
 * Ký JWT token
 * @param payload - Dữ liệu cần mã hóa vào token
 * @param privateKey - Secret key để ký
 * @param options - Các tùy chọn (expiresIn...)
 */
export function signToken(
  payload: { user_id: string; token_type: number },
  privateKey: string,
  options: SignOptions = { algorithm: 'HS256' }
): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token as string);
      }
    });
  });
}

/**
 * Verify JWT token
 * @param token - Token cần verify
 * @param secretKey - Secret key để verify
 */
export function verifyToken(token: string, secretKey: string): Promise<TokenPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as TokenPayload);
      }
    });
  });
}
```

---

### Bước 3: Tạo validation utilities

**File `src/utils/validation.ts`:**
```typescript
import express from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { EntityError, ErrorWithStatus } from '~/models/Errors';

/**
 * Middleware validate dữ liệu đầu vào
 * Tự động kiểm tra lỗi và ném EntityError nếu có lỗi validation
 */
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Chạy tất cả validators
    await validation.run(req);

    const errors = validationResult(req);

    // Không có lỗi thì next
    if (errors.isEmpty()) {
      return next();
    }

    const errorObject = errors.mapped();
    const entityError = new EntityError({ errors: {} });

    // Xử lý từng lỗi
    for (const key in errorObject) {
      const { msg } = errorObject[key];

      // Nếu lỗi là ErrorWithStatus (do custom validator) và không phải 422 thì throw luôn
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg);
      }

      // Còn lại thì thêm vào entityError
      entityError.errors[key] = msg;
    }

    // Throw lỗi validation
    next(entityError);
  };
};
```

---

### Bước 4: Tạo error handlers

**File `src/models/Errors.ts`:**
```typescript
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';

type ErrorsType = Record<
  string,
  {
    msg: string;
    [key: string]: any;
  }
>;

export class ErrorWithStatus {
  message: string;
  status: number;

  constructor({ message, status }: { message: string; status: number }) {
    this.message = message;
    this.status = status;
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorsType;

  constructor({ message = USERS_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY });
    this.errors = errors;
  }
}
```

**File `src/middlewares/error.middlewares.ts`:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { omit } from 'lodash';
import HTTP_STATUS from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';

/**
 * Default error handler - Xử lý tất cả lỗi của ứng dụng
 */
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Nếu là ErrorWithStatus thì trả về status và message
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, ['status']));
  }

  // Set enumerable cho message để có thể JSON.stringify
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true });
  });

  // Lỗi mặc định trả về 500
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: omit(err, ['stack'])
  });
};
```

**File `src/utils/handlers.ts`:**
```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrapper cho async request handler
 * Tự động catch lỗi và chuyển sang error handler
 */
export const wrapAsync = <P>(func: RequestHandler<P, any, any, any>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
```

---

## PHẦN 3: Service Layer

### Bước 1: Cập nhật Database Service

**File `src/services/database.services.ts`:** (Đã có sẵn, không cần sửa)

---

### Bước 2: Tạo Users Service

**File `src/services/users.services.ts`:**
```typescript
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import databaseService from './database.services';
import { RegisterReqBody } from '~/models/requests/User.requests';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import { TokenType } from '~/constants/enums';
import TaiKhoan from '~/models/schemas/TaiKhoan.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';

interface TaiKhoanRow extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MatKhau: string;
  MaLoaiTK: string;
  TGTaoMoi: Date;
}

interface RefreshTokenRow extends RowDataPacket {
  token: string;
  TenDangNhap: string;
  NgayTao: Date;
  NgayHetHan: Date;
}

class UsersService {
  /**
   * Ký access token
   */
  private signAccessToken(user_id: string) {
    return signToken(
      {
        user_id,
        token_type: TokenType.AccessToken
      },
      process.env.JWT_SECRET_ACCESS_TOKEN as string,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '15m' as any
      }
    );
  }

  /**
   * Ký refresh token
   */
  private signRefreshToken(user_id: string) {
    return signToken(
      {
        user_id,
        token_type: TokenType.RefreshToken
      },
      process.env.JWT_SECRET_REFRESH_TOKEN as string,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d' as any
      }
    );
  }

  /**
   * Ký cả access và refresh token
   */
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)]);
  }

  /**
   * Kiểm tra email đã tồn tại chưa
   */
  async checkEmailExist(email: string): Promise<boolean> {
    const sql = 'SELECT TenDangNhap FROM TAIKHOAN WHERE TenDangNhap = ?';
    const rows = await databaseService.query<TaiKhoanRow[]>(sql, [email]);
    return rows.length > 0;
  }

  /**
   * Đăng ký tài khoản mới
   */
  async register(payload: RegisterReqBody) {
    const { name, email, password } = payload;

    // 1. Tạo thành viên mới
    const insertThanhVienSql = `
      INSERT INTO THANHVIEN (HoTen, MaGioiTinh) 
      VALUES (?, 'GT00')
    `;
    await databaseService.query(insertThanhVienSql, [name]);

    // 2. Lấy MaTV vừa tạo (trigger tự sinh)
    const [thanhVien] = await databaseService.query<RowDataPacket[]>(
      'SELECT MaTV FROM THANHVIEN ORDER BY TGTaoMoi DESC LIMIT 1'
    );
    const MaTV = thanhVien.MaTV;

    // 3. Hash password và tạo tài khoản
    const hashedPassword = hashPassword(password);
    const insertTaiKhoanSql = `
      INSERT INTO TAIKHOAN (TenDangNhap, MaTV, MatKhau, MaLoaiTK) 
      VALUES (?, ?, ?, 'LTK02')
    `;
    await databaseService.query(insertTaiKhoanSql, [email, MaTV, hashedPassword]);

    // 4. Tạo access token và refresh token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(email);

    // 5. Lưu refresh token vào database
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 7); // 7 ngày

    const insertRefreshTokenSql = `
      INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) 
      VALUES (?, ?, ?)
    `;
    await databaseService.query(insertRefreshTokenSql, [refresh_token, email, expDate]);

    return {
      access_token,
      refresh_token
    };
  }

  /**
   * Đăng nhập
   */
  async login(email: string, password: string) {
    // 1. Tìm tài khoản
    const sql = 'SELECT * FROM TAIKHOAN WHERE TenDangNhap = ?';
    const rows = await databaseService.query<TaiKhoanRow[]>(sql, [email]);

    if (rows.length === 0) {
      return null; // Không tìm thấy
    }

    const user = rows[0];

    // 2. So sánh password
    const hashedPassword = hashPassword(password);
    if (user.MatKhau !== hashedPassword) {
      return null; // Sai password
    }

    // 3. Tạo tokens
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user.TenDangNhap);

    // 4. Lưu refresh token
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 7);

    const insertRefreshTokenSql = `
      INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) 
      VALUES (?, ?, ?)
    `;
    await databaseService.query(insertRefreshTokenSql, [refresh_token, user.TenDangNhap, expDate]);

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

  /**
   * Đăng xuất - Xóa refresh token
   */
  async logout(refresh_token: string) {
    const sql = 'DELETE FROM REFRESH_TOKENS WHERE token = ?';
    const result = await databaseService.query<ResultSetHeader>(sql, [refresh_token]);

    return {
      message: 'Đăng xuất thành công',
      deletedCount: result.affectedRows
    };
  }

  /**
   * Kiểm tra refresh token có tồn tại không
   */
  async checkRefreshTokenExist(refresh_token: string): Promise<boolean> {
    const sql = 'SELECT token FROM REFRESH_TOKENS WHERE token = ?';
    const rows = await databaseService.query<RefreshTokenRow[]>(sql, [refresh_token]);
    return rows.length > 0;
  }
}

const usersService = new UsersService();
export default usersService;
```


**Giải thích các method quan trọng:**
1. **signAccessAndRefreshToken**: Tạo cả 2 tokens song song bằng Promise.all
2. **register**: Tạo THANHVIEN → Tạo TAIKHOAN → Tạo tokens → Lưu refresh token
3. **login**: Tìm user → Verify password → Tạo tokens → Lưu refresh token
4. **logout**: Xóa refresh token khỏi database

---

## PHẦN 4: Middleware Layer

**File `src/middlewares/users.middlewares.ts`:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { checkSchema } from 'express-validator';
import { JsonWebTokenError } from 'jsonwebtoken';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import usersService from '~/services/users.services';
import { validate } from '~/utils/validation';
import { verifyToken } from '~/utils/jwt';
import { TokenPayload } from '~/models/requests/User.requests';

/**
 * Middleware validate đăng ký
 */
export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
        },
        isString: true,
        isLength: {
          options: {
            min: 1,
            max: 100
          },
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
        custom: {
          options: async (value) => {
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
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: true,
        isLength: {
          options: {
            min: 6,
            max: 50
          },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_INVALID
        },
        isStrongPassword: {
          options: {
            minLength: 6,
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
              throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_NOT_MATCH);
            }
            return true;
          }
        }
      }
    },
    ['body']
  )
);

/**
 * Middleware validate đăng nhập
 */
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: true
      }
    },
    ['body']
  )
);

/**
 * Middleware validate access token
 */
export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            // Kiểm tra có gửi access token không
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            // Lấy token từ "Bearer <token>"
            const access_token = value.split(' ')[1];

            if (!access_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            try {
              // Verify token
              const decoded_authorization = await verifyToken(
                access_token,
                process.env.JWT_SECRET_ACCESS_TOKEN as string
              );

              // Gán vào req để controller sử dụng
              (req as Request).decoded_authorization = decoded_authorization;
            } catch (error) {
              throw new ErrorWithStatus({
                message: (error as JsonWebTokenError).message,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            return true;
          }
        }
      }
    },
    ['headers']
  )
);

/**
 * Middleware validate refresh token
 */
export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            // Kiểm tra có gửi refresh token không
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            try {
              // Verify token
              const decoded_refresh_token = await verifyToken(
                value,
                process.env.JWT_SECRET_REFRESH_TOKEN as string
              );

              // Kiểm tra refresh token có trong database không
              const isExist = await usersService.checkRefreshTokenExist(value);
              if (!isExist) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.REFRESH_TOKEN_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }

              // Gán vào req
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
    },
    ['body']
  )
);
```

**Giải thích middleware:**
- **registerValidator**: Check name, email, password, confirm_password
- **loginValidator**: Check email, password
- **accessTokenValidator**: Verify access token từ header Authorization
- **refreshTokenValidator**: Verify refresh token và check tồn tại trong DB

---

## PHẦN 5: Controller Layer

**File `src/controllers/users.controllers.ts`:**
```typescript
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { LoginReqBody, LogoutReqBody, RegisterReqBody } from '~/models/requests/User.requests';
import usersService from '~/services/users.services';
import { ErrorWithStatus } from '~/models/Errors';

/**
 * Controller đăng ký
 * POST /users/register
 */
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response
) => {
  const result = await usersService.register(req.body);

  return res.status(HTTP_STATUS.CREATED).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  });
};

/**
 * Controller đăng nhập
 * POST /users/login
 */
export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const { email, password } = req.body;

  const result = await usersService.login(email, password);

  // Nếu không tìm thấy hoặc sai password
  if (!result) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.EMAIL_OR_PASSWORD_INCORRECT,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  });
};

/**
 * Controller đăng xuất
 * POST /users/logout
 * Headers: { Authorization: Bearer <access_token> }
 * Body: { refresh_token: string }
 */
export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body;

  const result = await usersService.logout(refresh_token);

  return res.status(HTTP_STATUS.OK).json(result);
};
```

---

## PHẦN 6: Routes Layer

**File `src/routes/users.routes.ts`:**
```typescript
import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController
} from '~/controllers/users.controllers';
import {
  registerValidator,
  loginValidator,
  accessTokenValidator,
  refreshTokenValidator
} from '~/middlewares/users.middlewares';
import { wrapAsync } from '~/utils/handlers';

const usersRouter = Router();

/**
 * Description: Đăng ký tài khoản
 * Path: /users/register
 * Method: POST
 * Body: { name: string, email: string, password: string, confirm_password: string }
 */
usersRouter.post('/register', registerValidator, wrapAsync(registerController));

/**
 * Description: Đăng nhập
 * Path: /users/login
 * Method: POST
 * Body: { email: string, password: string }
 */
usersRouter.post('/login', loginValidator, wrapAsync(loginController));

/**
 * Description: Đăng xuất
 * Path: /users/logout
 * Method: POST
 * Headers: { Authorization: Bearer <access_token> }
 * Body: { refresh_token: string }
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController));

export default usersRouter;
```

---

## PHẦN 7: Cập nhật Server

**File `src/index.ts`:**
```typescript
import express from 'express';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';
import thanhvienRouter from '~/routes/thanhvien.routes';
import { defaultErrorHandler } from '~/middlewares/error.middlewares';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware parse JSON
app.use(express.json());

// Routes
app.use('/users', usersRouter);
app.use('/thanhvien', thanhvienRouter);

// Default error handler (đặt sau tất cả routes)
app.use(defaultErrorHandler);

// Kết nối database và start server
databaseService.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  });
});
```

---

## PHẦN 8: Testing với Postman

### Bước 1: Tạo Environment

1. Mở Postman → Environments → Create Environment
2. Tên: `CNPM Dev`
3. Thêm các biến:
```
baseUrl: http://localhost:3000
access_token: (để trống, sẽ tự động set)
refresh_token: (để trống, sẽ tự động set)
```

### Bước 2: Test API Register

**Request:**
```
POST {{baseUrl}}/users/register
Content-Type: application/json

{
  "name": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "password": "Password123!",
  "confirm_password": "Password123!"
}
```

**Response mong đợi (201 Created):**
```json
{
  "message": "Đăng ký tài khoản thành công",
  "result": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
  }
}
```

**Test Scripts (Auto save tokens):**
```javascript
if (pm.response.code === 201) {
    const { access_token, refresh_token } = pm.response.json().result;
    pm.environment.set('access_token', access_token);
    pm.environment.set('refresh_token', refresh_token);
}
```

### Bước 3: Test API Login

**Request:**
```
POST {{baseUrl}}/users/login
Content-Type: application/json

{
  "email": "nguyenvana@example.com",
  "password": "Password123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Đăng nhập thành công",
  "result": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user": {
      "TenDangNhap": "nguyenvana@example.com",
      "MaTV": "TV08",
      "MaLoaiTK": "LTK02"
    }
  }
}
```

**Test Scripts:**
```javascript
if (pm.response.code === 200) {
    const { access_token, refresh_token } = pm.response.json().result;
    pm.environment.set('access_token', access_token);
    pm.environment.set('refresh_token', refresh_token);
}
```

### Bước 4: Test API Logout

**Request:**
```
POST {{baseUrl}}/users/logout
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "refresh_token": "{{refresh_token}}"
}
```

**Response (200 OK):**
```json
{
  "message": "Đăng xuất thành công",
  "deletedCount": 1
}
```

### Bước 5: Test các trường hợp lỗi

**1. Email đã tồn tại (422):**
```json
POST /users/register
{
  "name": "Test",
  "email": "nguyenvana@example.com", // Email đã đăng ký
  "password": "Password123!",
  "confirm_password": "Password123!"
}
```

**2. Password yếu (422):**
```json
{
  "name": "Test",
  "email": "test@example.com",
  "password": "123456", // Không đủ mạnh
  "confirm_password": "123456"
}
```

**3. Confirm password không khớp (422):**
```json
{
  "name": "Test",
  "email": "test@example.com",
  "password": "Password123!",
  "confirm_password": "Different123!" // Không khớp
}
```

**4. Email hoặc password sai (422):**
```json
POST /users/login
{
  "email": "wrong@example.com",
  "password": "WrongPassword123!"
}
```

**5. Thiếu access token (401):**
```
POST /users/logout
// Không gửi Authorization header
{
  "refresh_token": "..."
}
```

---

## Tổng kết

### Luồng hoạt động

**1. Đăng ký (Register):**
```
Client → POST /users/register
  → registerValidator (validate dữ liệu)
  → registerController
    → usersService.register()
      → Tạo THANHVIEN
      → Tạo TAIKHOAN (hash password)
      → Tạo access_token + refresh_token
      → Lưu refresh_token vào DB
  → Response { access_token, refresh_token }
```

**2. Đăng nhập (Login):**
```
Client → POST /users/login
  → loginValidator
  → loginController
    → usersService.login()
      → Tìm user by email
      → Verify password (so sánh hash)
      → Tạo tokens
      → Lưu refresh_token
  → Response { access_token, refresh_token, user }
```

**3. Đăng xuất (Logout):**
```
Client → POST /users/logout
  → accessTokenValidator (verify access_token)
  → refreshTokenValidator (verify refresh_token)
  → logoutController
    → usersService.logout()
      → Xóa refresh_token khỏi DB
  → Response { message: "success" }
```

### Bảo mật đã implement

Sửa Password được hash bằng SHA-256 + secret
Sửa JWT với secret key riêng cho access & refresh token
Sửa Refresh token được lưu database → có thể thu hồi
Sửa Access token ngắn hạn (15 phút)
Sửa Refresh token dài hạn (7 ngày)
Sửa Validation đầy đủ với express-validator
Sửa Error handling tập trung
Sửa SQL injection prevention (prepared statements)

### Mở rộng tiếp theo

- [ ] Email verification
- [ ] Forgot password / Reset password
- [ ] Role-based authorization
- [ ] Rate limiting
- [ ] Refresh access token bằng refresh token
- [ ] Blacklist tokens
- [ ] Two-factor authentication (2FA)

---

**Chúc mừng! Bạn đã hoàn thành hệ thống Authentication cơ bản với MySQL!** 🎉
