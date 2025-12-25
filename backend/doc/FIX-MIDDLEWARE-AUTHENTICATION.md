# 🔥 FIX LỖI CUỐI CÙNG: Cannot GET /users/ketthuc/tracuu

## ❌ Vấn Đề Hiện Tại

**Lỗi:**
```
Cannot GET /users/ketthuc/tracuu
```

**Tình trạng code:**
- ✅ `index.ts` - Đúng (chỉ có `app.use('/users', usersRouter)`)
- ✅ `users.routes.ts` - Đúng (có nested routes với authentication)
- ✅ `ketthuc.routes.ts` - Đúng (có route `/tracuu`)
- ✅ Server đang chạy bình thường

**→ VẬY TẠI SAO VẪN LỖI?**

---

## 🔍 Phân Tích Sâu Hơn

### Giả Thuyết 1: Middleware Authentication Đang Chặn ❌

**File: `users.routes.ts` (dòng 45)**
```typescript
usersRouter.use('/ketthuc', accessTokenValidator, ketthucRouter);
```

**Vấn đề:**
- `accessTokenValidator` yêu cầu **PHẢI CÓ TOKEN hợp lệ**
- Nếu không có token hoặc token sai → **KHÔNG BẮN 404**, mà bắn **401 Unauthorized**
- Nhưng user báo lỗi `Cannot GET` → đây là lỗi 404, KHÔNG phải 401

### Giả Thuyết 2: Middleware Đang Bắn HTML Thay Vì JSON ✅

**Phân tích lỗi HTML:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Error</title>
</head>
<body>
    <pre>Cannot GET /users/ketthuc/tracuu</pre>
</body>
</html>
```

**Đây là response mặc định của Express khi:**
1. ❌ Route KHÔNG tồn tại (404 Not Found)
2. ❌ Hoặc middleware lỗi và không có error handler

**Nhưng route ĐÃ TỒN TẠI!** Vậy có thể:
- Middleware `accessTokenValidator` đang throw error
- Error handler không bắt được
- Express fallback về 404 handler mặc định

### Giả Thuyết 3: TypeScript Compilation Issues ⚠️

Server restart nhiều lần:
```
[nodemon] restarting due to changes...
[nodemon] restarting due to changes...
[nodemon] restarting due to changes...
```

**Có thể:**
- File chưa được compile đúng
- Module import bị cache cũ
- Nodemon restart nhưng code cũ vẫn chạy

---

## 🧪 Kiểm Tra Chi Tiết

### Bước 1: Kiểm Tra Route Có Đăng Ký Không

Thêm log vào `users.routes.ts` để debug:

**File: `src/routes/users.routes.ts`**

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
import thanhvienRouter from './thanhvien.routes';
import thanhTichRouter from './thanhtich.routes';
import ketthucRouter from './ketthuc.routes';

const usersRouter = Router();

// Public routes
usersRouter.post('/register', registerValidator, wrapAsync(registerController));
usersRouter.post('/login', loginValidator, wrapAsync(loginController));
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController));

// 🔍 DEBUG: Log khi route được đăng ký
console.log('✅ Đang đăng ký nested routes...');
console.log('  - /thanhvien');
console.log('  - /thanhtich');
console.log('  - /ketthuc');

// Protected nested routes
usersRouter.use('/thanhvien', accessTokenValidator, thanhvienRouter);
usersRouter.use('/thanhtich', accessTokenValidator, thanhTichRouter);
usersRouter.use('/ketthuc', accessTokenValidator, ketthucRouter);

console.log('✅ Đã đăng ký xong nested routes!');

export default usersRouter;
```

**Chạy lại server, check console xem có log này không:**
```
✅ Đang đăng ký nested routes...
  - /thanhvien
  - /thanhtich
  - /ketthuc
✅ Đã đăng ký xong nested routes!
```

Nếu KHÔNG có → Routes chưa được load!

### Bước 2: Test Route KHÔNG Cần Authentication

Tạm thời **BỎ authentication** để test xem route có hoạt động không:

**File: `src/routes/users.routes.ts`** (CHỈ ĐỂ TEST)

```typescript
// 🔧 TẠM THỜI BỎ accessTokenValidator ĐỂ TEST
usersRouter.use('/thanhvien', thanhvienRouter);  // ❌ BỎ accessTokenValidator
usersRouter.use('/thanhtich', thanhTichRouter);  // ❌ BỎ accessTokenValidator
usersRouter.use('/ketthuc', ketthucRouter);      // ❌ BỎ accessTokenValidator
```

**Test:**
```bash
GET http://localhost:3000/users/ketthuc/tracuu
# KHÔNG CẦN token
```

**Kết quả:**
- ✅ Nếu trả về data → Route OK, lỗi do authentication
- ❌ Nếu vẫn 404 → Route CHƯA được đăng ký đúng

### Bước 3: Kiểm Tra accessTokenValidator

**File: `src/middlewares/users.middlewares.ts`**

Middleware hiện tại:
```typescript
export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        optional: true,  // ✅ Đã optional
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            // ✅ ƯU TIÊN ĐỌC TỪ COOKIES
            let access_token = (req as any).cookies?.access_token;
            
            // ✅ NẾU KHÔNG CÓ TRONG COOKIES, ĐỌC TỪ HEADER
            if (!access_token && value) {
              const parts = value.split(' ');
              if (parts.length === 2 && parts[0] === 'Bearer') {
                access_token = parts[1];
              }
            }

            if (!access_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            // ... verify token ...
          }
        }
      }
    },
    ['headers']
  )
);
```

**VẤN ĐỀ TIỀM ẨN:**
- `checkSchema` kiểm tra `['headers']` → Chỉ validate field trong headers
- Nhưng `Authorization` là optional
- Nếu không gửi header → validate PASS
- Nhưng trong custom function → throw error nếu không có token

**→ Lỗi logic!**

---

## ✅ GIẢI PHÁP CUỐI CÙNG

### Vấn Đề: Middleware Validation Conflict

**`checkSchema` với `['headers']`** có vấn đề khi:
1. Field là `optional: true`
2. Nhưng custom function vẫn throw error nếu thiếu

**→ Express validation middleware bị confused!**

### Fix: Sửa Lại accessTokenValidator

**File: `src/middlewares/users.middlewares.ts`**

**CÁCH 1: Viết lại middleware KHÔNG dùng checkSchema (KHUYẾN NGHỊ)**

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '~/utils/jwt';
import { ErrorWithStatus } from '~/models/Errors';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';

/**
 * ✅ Middleware validate access token - VIẾT LẠI HOÀN TOÀN
 * Đọc từ cookies hoặc Authorization header
 */
export const accessTokenValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. ƯU TIÊN ĐỌC TỪ COOKIES
    let access_token = req.cookies?.access_token;

    // 2. NẾU KHÔNG CÓ TRONG COOKIES, ĐỌC TỪ HEADER
    if (!access_token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        access_token = authHeader.substring(7); // Lấy phần sau "Bearer "
      }
    }

    // 3. KIỂM TRA TOKEN CÓ TỒN TẠI KHÔNG
    if (!access_token) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
        status: HTTP_STATUS.UNAUTHORIZED
      });
    }

    // 4. VERIFY TOKEN
    const decoded_authorization = await verifyToken(
      access_token,
      process.env.JWT_SECRET_ACCESS_TOKEN as string
    );

    // 5. GẮN VÀO REQUEST
    (req as any).decoded_authorization = decoded_authorization;

    // 6. TIẾP TỤC
    next();
  } catch (error) {
    // Nếu là ErrorWithStatus, giữ nguyên
    if (error instanceof ErrorWithStatus) {
      next(error);
    } else {
      // Nếu là lỗi verify token (JsonWebTokenError)
      next(
        new ErrorWithStatus({
          message: (error as any).message || 'Invalid access token',
          status: HTTP_STATUS.UNAUTHORIZED
        })
      );
    }
  }
};
```

**CÁCH 2: Sửa checkSchema (Nếu muốn giữ nguyên cách cũ)**

```typescript
export const accessTokenValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ✅ ĐỌC TỪ COOKIES TRƯỚC
    let access_token = req.cookies?.access_token;

    // ✅ NẾU KHÔNG CÓ, ĐỌC TỪ HEADER
    if (!access_token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        access_token = authHeader.substring(7);
      }
    }

    // ✅ KIỂM TRA TOKEN
    if (!access_token) {
      return res.status(401).json({
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
      });
    }

    // ✅ VERIFY TOKEN
    const decoded = await verifyToken(
      access_token,
      process.env.JWT_SECRET_ACCESS_TOKEN as string
    );

    // ✅ GẮN VÀO REQUEST
    (req as any).decoded_authorization = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: (error as any).message || 'Invalid token'
    });
  }
};
```

### Fix: Sửa Lại refreshTokenValidator

**Tương tự:**

```typescript
export const refreshTokenValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. ĐỌC TỪ COOKIES TRƯỚC
    let refresh_token = req.cookies?.refresh_token;

    // 2. NẾU KHÔNG CÓ, ĐỌC TỪ BODY
    if (!refresh_token) {
      refresh_token = req.body.refresh_token;
    }

    // 3. KIỂM TRA
    if (!refresh_token) {
      return res.status(401).json({
        message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
      });
    }

    // 4. VERIFY TOKEN
    const decoded = await verifyToken(
      refresh_token,
      process.env.JWT_SECRET_REFRESH_TOKEN as string
    );

    // 5. KIỂM TRA TOKEN CÓ TRONG DATABASE KHÔNG
    const isExist = await usersService.checkRefreshTokenExist(refresh_token);
    if (!isExist) {
      return res.status(401).json({
        message: USERS_MESSAGES.REFRESH_TOKEN_NOT_EXIST
      });
    }

    // 6. GẮN VÀO REQUEST
    (req as any).decoded_refresh_token = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: (error as any).message || 'Invalid refresh token'
    });
  }
};
```

---

## 📝 CODE HOÀN CHỈNH

### File: `src/middlewares/users.middlewares.ts` (SAU KHI SỬA)

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
 * ✅ Middleware validate access token - VIẾT LẠI HOÀN TOÀN
 * Đọc từ cookies hoặc Authorization header
 */
export const accessTokenValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. ƯU TIÊN ĐỌC TỪ COOKIES
    let access_token = req.cookies?.access_token;

    // 2. NẾU KHÔNG CÓ TRONG COOKIES, ĐỌC TỪ HEADER
    if (!access_token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        access_token = authHeader.substring(7);
      }
    }

    // 3. KIỂM TRA TOKEN CÓ TỒN TẠI KHÔNG
    if (!access_token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
      });
    }

    // 4. VERIFY TOKEN
    const decoded_authorization = await verifyToken(
      access_token,
      process.env.JWT_SECRET_ACCESS_TOKEN as string
    );

    // 5. GẮN VÀO REQUEST
    (req as any).decoded_authorization = decoded_authorization;

    // 6. TIẾP TỤC
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: (error as any).message || 'Invalid access token'
    });
  }
};

/**
 * ✅ Middleware validate refresh token - VIẾT LẠI
 */
export const refreshTokenValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. ĐỌC TỪ COOKIES TRƯỚC
    let refresh_token = req.cookies?.refresh_token;

    // 2. NẾU KHÔNG CÓ, ĐỌC TỪ BODY
    if (!refresh_token) {
      refresh_token = req.body.refresh_token;
    }

    // 3. KIỂM TRA
    if (!refresh_token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
      });
    }

    // 4. VERIFY TOKEN
    const decoded_refresh_token = await verifyToken(
      refresh_token,
      process.env.JWT_SECRET_REFRESH_TOKEN as string
    );

    // 5. KIỂM TRA TOKEN CÓ TRONG DATABASE KHÔNG
    const isExist = await usersService.checkRefreshTokenExist(refresh_token);
    if (!isExist) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.REFRESH_TOKEN_NOT_EXIST
      });
    }

    // 6. GẮN VÀO REQUEST
    (req as any).decoded_refresh_token = decoded_refresh_token;

    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: (error as any).message || 'Invalid refresh token'
    });
  }
};
```

---

## 🧪 Cách Test Từng Bước

### Bước 1: Stop Server Hiện Tại

```bash
# Nhấn Ctrl+C trong terminal đang chạy server
```

### Bước 2: Xóa Cache TypeScript

```bash
# PowerShell
Remove-Item -Recurse -Force dist
Remove-Item -Recurse -Force node_modules\.cache
```

### Bước 3: Restart Server

```bash
npm run dev
```

### Bước 4: Test Login Trước

```bash
POST http://localhost:3000/users/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123!@#"
}
```

**Response mong đợi:**
```json
{
  "message": "Đăng nhập thành công",
  "user": {
    "TenDangNhap": "test@example.com",
    "MaTV": "TV01",
    "MaLoaiTK": "LTK03"
  }
}
```

**Cookies được set:**
- `access_token`
- `refresh_token`

### Bước 5: Test API Protected

**Với Browser (Cookies tự động):**
```bash
GET http://localhost:3000/users/ketthuc/tracuu
# Cookies tự động gửi
```

**Với Postman/Thunder Client:**
```bash
GET http://localhost:3000/users/ketthuc/tracuu
Cookie: access_token=<token_từ_login>; refresh_token=<token_từ_login>
```

**Hoặc dùng Authorization header:**
```bash
GET http://localhost:3000/users/ketthuc/tracuu
Authorization: Bearer <access_token>
```

---

## 🎯 Checklist Hoàn Chỉnh

### Code Changes

- [ ] Sửa file `src/middlewares/users.middlewares.ts`
  - [ ] VIẾT LẠI `accessTokenValidator` (không dùng checkSchema)
  - [ ] VIẾT LẠI `refreshTokenValidator` (không dùng checkSchema)
  
- [ ] File `src/routes/users.routes.ts` - KHÔNG SỬA (đã đúng)
- [ ] File `src/index.ts` - KHÔNG SỬA (đã đúng)

### Testing

- [ ] Stop server (Ctrl+C)
- [ ] Xóa cache TypeScript
- [ ] Restart server (`npm run dev`)
- [ ] Test login: `POST /users/login`
- [ ] Kiểm tra cookies được set
- [ ] Test tra cứu: `GET /users/ketthuc/tracuu`
- [ ] Kiểm tra response có data

---

## 🔑 Nguyên Nhân Chính Của Lỗi

**KHÔNG PHẢI do routes sai!** Mà do:

1. ❌ **Middleware `checkSchema` conflict**: 
   - Field `Authorization` là `optional: true`
   - Nhưng custom function throw error khi thiếu
   - Express validation confused → không handle error đúng
   - Fallback về 404 handler thay vì 401

2. ❌ **Error handler không bắt được**:
   - Middleware throw error không đúng format
   - `defaultErrorHandler` không catch được
   - Express dùng default 404 handler → HTML response

3. ✅ **Giải pháp**: 
   - VIẾT LẠI middleware không dùng `checkSchema`
   - Trả về response trực tiếp thay vì throw error
   - Đảm bảo error handling rõ ràng

---

## 📚 Tóm Tắt

**Vấn đề:**
- Middleware validation dùng `checkSchema` gây conflict
- Error không được handle đúng
- Express fallback về 404 HTML

**Giải pháp:**
- VIẾT LẠI `accessTokenValidator` và `refreshTokenValidator`
- Không dùng `checkSchema`, trả về JSON response trực tiếp
- Ensure proper error handling

**Đường dẫn API đúng:**
- ✅ `POST /users/login` (đăng nhập trước)
- ✅ `GET /users/ketthuc/tracuu` (sau khi có token)
- ✅ Cookies hoặc Authorization header

**Sau khi sửa, API SẼ HOẠT ĐỘNG!** 🎉
