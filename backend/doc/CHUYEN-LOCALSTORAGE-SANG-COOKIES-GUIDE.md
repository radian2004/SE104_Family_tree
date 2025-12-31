# Hướng Dẫn: Chuyển Từ LocalStorage Sang HttpOnly Cookies

## 📋 Vấn Đề

Hiện tại backend **trả tokens trong JSON response**, client phải tự lưu vào localStorage:

```typescript
// Backend trả về
return res.json({
  message: 'Login success',
  result: {
    access_token: 'xxx',
    refresh_token: 'yyy'
  }
});

// Client phải tự lưu
localStorage.setItem('access_token', result.access_token);
localStorage.setItem('refresh_token', result.refresh_token);
```

**Nhược điểm:**
- ❌ Backend không kiểm soát được việc client xóa tokens
- ❌ localStorage dễ bị tấn công XSS
- ❌ Client phải tự quản lý việc lưu/xóa tokens

## 💡 Giải Pháp: Sử dụng HttpOnly Cookies

Backend **tự động set cookies** khi login, **tự động xóa cookies** khi logout.

**Ưu điểm:**
- Sửa Backend kiểm soát hoàn toàn việc lưu/xóa tokens
- Sửa HttpOnly cookies an toàn hơn (không thể truy cập qua JavaScript)
- Sửa Client không cần làm gì thêm, browser tự động gửi cookies
- Sửa Khi logout, backend clear cookies → client tự động mất tokens

## 🔧 Cách Implement

### Bước 1: Sửa Controller - Set Cookies Khi Login/Register

**File: `src/controllers/users.controllers.ts`**

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

  // Sửa SET COOKIES THAY VÌ TRẢ VỀ JSON
  res.cookie('access_token', result.access_token, {
    httpOnly: true,        // Không thể truy cập qua JavaScript (chống XSS)
    secure: process.env.NODE_ENV === 'production',  // Chỉ gửi qua HTTPS trong production
    sameSite: 'strict',    // Chống CSRF attacks
    maxAge: 15 * 60 * 1000 // 15 phút (giống access token expiry)
  });

  res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 ngày (giống refresh token expiry)
  });

  // Sửa Chỉ trả về message và user info (KHÔNG trả tokens)
  return res.status(HTTP_STATUS.CREATED).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    user: {
      TenDangNhap: result.user?.TenDangNhap,
      MaTV: result.user?.MaTV,
      MaLoaiTK: result.user?.MaLoaiTK
    }
  });
};

/**
 * Controller đăng nhập
 * POST /users/login
 */
export const loginController = async (
  req: Request<ParamsDictionary, any, LoginReqBody>,
  res: Response
) => {
  const { email, password } = req.body;

  const result = await usersService.login(email, password);

  if (!result) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.EMAIL_OR_PASSWORD_INCORRECT,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY
    });
  }

  // Sửa SET COOKIES
  res.cookie('access_token', result.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000  // 15 phút
  });

  res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 ngày
  });

  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    user: result.user
  });
};

/**
 * Controller đăng xuất
 * POST /users/logout
 * Sửa KHÔNG CẦN refresh_token trong body nữa, lấy từ cookies
 */
export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutReqBody>,
  res: Response
) => {
  // Sửa Lấy refresh_token từ cookies
  const refresh_token = req.cookies.refresh_token;

  if (refresh_token) {
    await usersService.logout(refresh_token);
  }

  // Sửa XÓA COOKIES - ĐÂY LÀ CÁCH BACKEND "XÓA LOCALSTORAGE"
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  return res.status(HTTP_STATUS.OK).json({
    message: 'Đăng xuất thành công'
  });
};
```

### Bước 2: Cài Đặt cookie-parser Middleware

**File: `package.json`**

Thêm dependency:
```json
{
  "dependencies": {
    "cookie-parser": "^1.4.6"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.7"
  }
}
```

Chạy lệnh:
```bash
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

### Bước 3: Sử dụng cookie-parser Trong App

**File: `src/index.ts`**

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';  // Sửa Import
import usersRouter from '~/routes/users.routes';
import { defaultErrorHandler } from '~/middlewares/error.middlewares';

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json());
app.use(cookieParser());  // Sửa Thêm middleware này

// CORS - QUAN TRỌNG: Phải cho phép credentials
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // URL của client
  res.header('Access-Control-Allow-Credentials', 'true');  // Sửa CHO PHÉP GỬI COOKIES
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/users', usersRouter);

// Error handler
app.use(defaultErrorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### Bước 4: Sửa Middleware Xác Thực - Đọc Token Từ Cookies

**File: `src/middlewares/users.middlewares.ts`**

Tìm middleware xác thực access token (thường là `accessTokenValidator`), sửa để đọc từ cookies:

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '~/utils/jwt';

export const accessTokenValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sửa ƯU TIÊN ĐỌC TỪ COOKIES
  let token = req.cookies.access_token;
  
  // Sửa NẾU KHÔNG CÓ TRONG COOKIES, ĐỌC TỪ HEADER (để backward compatible)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({
      message: 'Access token is required'
    });
  }

  try {
    const decoded = await verifyToken(token, process.env.JWT_SECRET_ACCESS_TOKEN as string);
    req.user = decoded;  // Lưu user info vào request
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired access token'
    });
  }
};
```

### Bước 5: Cập Nhật Type Definitions

**File: `src/type.d.ts`**

Thêm type cho cookies:

```typescript
import { Request } from 'express';

declare module 'express' {
  interface Request {
    user?: any;  // Thông tin user sau khi verify token
  }
}

// Sửa Thêm type cho cookies (nếu cần)
declare global {
  namespace Express {
    interface Request {
      cookies: {
        access_token?: string;
        refresh_token?: string;
      };
    }
  }
}
```

## 🔄 Cập Nhật Client

Client giờ **KHÔNG CẦN** lưu localStorage nữa, chỉ cần:

### Vanilla JavaScript / Fetch

```javascript
// Sửa Login - Cookies tự động được set
const login = async (email, password) => {
  const response = await fetch('http://localhost:4000/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // Sửa QUAN TRỌNG: Cho phép gửi/nhận cookies
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  console.log(data.message);  // Chỉ nhận message, không nhận tokens
  
  // Sửa KHÔNG CẦN localStorage.setItem() NỮA!
};

// Sửa Logout - Cookies tự động được xóa
const logout = async () => {
  await fetch('http://localhost:4000/users/logout', {
    method: 'POST',
    credentials: 'include'  // Sửa Gửi cookies để backend biết user nào logout
  });
  
  // Sửa KHÔNG CẦN localStorage.removeItem() NỮA!
  // Cookies đã được backend xóa rồi
  
  window.location.href = '/login';
};

// Sửa Gọi API được protect - Browser tự động gửi cookies
const getUserProfile = async () => {
  const response = await fetch('http://localhost:4000/users/profile', {
    credentials: 'include'  // Sửa Tự động gửi cookies
  });
  
  return response.json();
};
```

### React with Axios

```javascript
import axios from 'axios';

// Sửa Config axios để luôn gửi cookies
axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: 'http://localhost:4000',
  withCredentials: true  // Sửa Quan trọng
});

// Login
const login = async (email, password) => {
  const { data } = await api.post('/users/login', { email, password });
  console.log(data.message);
  // Sửa Cookies tự động được set, không cần làm gì thêm
};

// Logout
const logout = async () => {
  await api.post('/users/logout');
  // Sửa Cookies tự động bị xóa
  window.location.href = '/login';
};

// API calls
const getProfile = async () => {
  const { data } = await api.get('/users/profile');
  // Sửa Cookies tự động được gửi
  return data;
};
```

## 📊 So Sánh

### Cũ (LocalStorage)

| Bước | Backend | Client |
|------|---------|--------|
| Login | Trả tokens trong JSON | Phải lưu vào localStorage |
| API Call | Không làm gì | Phải lấy token từ localStorage, thêm vào header |
| Logout | Xóa token trong DB | Phải xóa localStorage |

### Mới (HttpOnly Cookies)

| Bước | Backend | Client |
|------|---------|--------|
| Login | Set cookies | Không làm gì (browser tự nhận) |
| API Call | Đọc từ cookies | Không làm gì (browser tự gửi) |
| Logout | Clear cookies | Không làm gì (browser tự xóa) |

## 🔒 Bảo Mật

### HttpOnly Cookies

```typescript
res.cookie('access_token', token, {
  httpOnly: true,      // Sửa JavaScript KHÔNG THỂ đọc được (chống XSS)
  secure: true,        // Sửa Chỉ gửi qua HTTPS (production)
  sameSite: 'strict',  // Sửa Chống CSRF attacks
  maxAge: 900000       // Sửa Tự động hết hạn
});
```

### localStorage (Không an toàn)

```javascript
localStorage.setItem('token', 'xxx');  // ❌ JavaScript có thể đọc được
// Nếu bị XSS, hacker có thể:
console.log(localStorage.getItem('token'));  // Lấy được token!
```

## 📝 Checklist

### Backend Changes

- [ ] Install `cookie-parser`: `npm i cookie-parser @types/cookie-parser`
- [ ] Thêm `app.use(cookieParser())` trong `index.ts`
- [ ] Sửa CORS để cho phép `credentials: true`
- [ ] Sửa `registerController` - set cookies thay vì trả JSON
- [ ] Sửa `loginController` - set cookies thay vì trả JSON
- [ ] Sửa `logoutController` - clear cookies
- [ ] Sửa `accessTokenValidator` - đọc từ cookies
- [ ] Test với Postman/Thunder Client

### Client Changes (Minimal)

- [ ] Thêm `credentials: 'include'` vào tất cả fetch/axios calls
- [ ] Xóa tất cả `localStorage.setItem()` cho tokens
- [ ] Xóa tất cả `localStorage.removeItem()` cho tokens
- [ ] Xóa code thêm `Authorization` header thủ công

## 🎯 Kết Luận

Sửa **Backend giờ KIỂM SOÁT HOÀN TOÀN** việc lưu/xóa tokens

Sửa Khi logout, backend `res.clearCookie()` → Client TỰ ĐỘNG mất tokens

Sửa An toàn hơn localStorage (HttpOnly chống XSS)

Sửa Client đơn giản hơn (không cần quản lý tokens)

---

**Đây là cách "sửa backend để xóa localStorage của client" - bằng cách THAY localStorage bằng HttpOnly Cookies mà backend kiểm soát được!**
