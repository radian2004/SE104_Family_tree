# 🔥 FIX LỖI: Cannot GET /users/ketthuc/tracuu

## ❌ Vấn Đề

**Lỗi hiện tại:**
```
Cannot GET /users/ketthuc/tracuu
```

**User đã thử:**
- Gọi API: `GET /users/ketthuc/tracuu`
- Đã đăng nhập (có access token)
- Nhưng server trả về 404 Not Found

---

## 🔍 Phân Tích Nguyên Nhân

### 1. Cấu Trúc Routes Hiện Tại

#### File: `src/users.routes.ts` Sửa (ĐÚNG)

```typescript
import thanhvienRouter from './thanhvien.routes';
import thanhTichRouter from './thanhtich.routes';
import ketthucRouter from './ketthuc.routes';

const usersRouter = Router();

// Routes authentication
usersRouter.post('/register', registerValidator, wrapAsync(registerController));
usersRouter.post('/login', loginValidator, wrapAsync(loginController));
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController));

// Sửa NESTED ROUTES - Đã đăng ký với authentication
usersRouter.use('/thanhvien', accessTokenValidator, thanhvienRouter);
usersRouter.use('/thanhtich', accessTokenValidator, thanhTichRouter);
usersRouter.use('/ketthuc', accessTokenValidator, ketthucRouter);

export default usersRouter;
```

**Đường dẫn đầy đủ:**
- Base: `/users` (từ index.ts)
- Nested: `/ketthuc` (từ users.routes.ts)
- Route: `/tracuu` (từ ketthuc.routes.ts)
- **Kết quả:** `/users/ketthuc/tracuu` Sửa

#### File: `src/index.ts` ❌ (XUNG ĐỘT - VỪa SỬA)

```typescript
import usersRouter from '~/routes/users.routes';
import thanhvienRouter from '~/routes/thanhvien.routes';  // ❌ KHÔNG CẦN
import thanhtichRouter from '~/routes/thanhtich.routes';  // ❌ KHÔNG CẦN
import ketthucRouter from '~/routes/ketthuc.routes';      // ❌ KHÔNG CẦN

// Routes
app.use('/users', usersRouter);
app.use('/thanhvien', thanhvienRouter);  // ❌ TRUNG LẶP - đã có trong users.routes.ts
app.use('/thanhtich', thanhtichRouter);  // ❌ TRUNG LẶP
app.use('/ketthuc', ketthucRouter);      // ❌ TRUNG LẶP
```

**Vấn đề:**
1. ❌ Import thừa 3 routers (đã import trong users.routes.ts rồi)
2. ❌ Đăng ký routes 2 lần:
   - Lần 1: Qua `users.routes.ts` → `/users/ketthuc/tracuu` (có auth)
   - Lần 2: Qua `index.ts` → `/ketthuc/tracuu` (KHÔNG có auth)
3. ❌ Tạo ra 2 endpoints khác nhau, gây nhầm lẫn

---

## 🧪 Kiểm Tra Thực Tế

### Trường Hợp 1: Routes qua users.routes.ts (ĐÚNG)

**Endpoint:** `GET /users/ketthuc/tracuu`

**Middleware chain:**
```
Request → CORS → cookieParser → /users → accessTokenValidator → /ketthuc → /tracuu → Controller
```

**Đặc điểm:**
- Sửa CÓ xác thực (accessTokenValidator)
- Sửa Cần gửi `Authorization: Bearer <token>` hoặc cookies
- Sửa An toàn, đúng theo thiết kế

### Trường Hợp 2: Routes qua index.ts (SAI - vừa thêm nhầm)

**Endpoint:** `GET /ketthuc/tracuu`

**Middleware chain:**
```
Request → CORS → cookieParser → /ketthuc → /tracuu → Controller
```

**Đặc điểm:**
- ❌ KHÔNG CÓ xác thực
- ❌ Ai cũng có thể truy cập mà không cần đăng nhập
- ❌ Lỗ hổng bảo mật nghiêm trọng!

---

## 📋 Danh Sách Routes Chính Xác

Theo file `CHUYEN-ROUTES-VAO-USERS-GUIDE.md`, cấu trúc routes đúng là:

### Authentication Routes (Public - không cần đăng nhập)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/users/register` | Đăng ký tài khoản |
| POST | `/users/login` | Đăng nhập |
| POST | `/users/logout` | Đăng xuất (cần token) |

### Protected Routes (Cần đăng nhập)

#### Thành Viên

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/users/thanhvien/tra-cuu` | Tra cứu thành viên |
| POST | `/users/thanhvien/register` | Đăng ký thành viên mới |
| POST | `/users/thanhvien/ghi-nhan` | Ghi nhận thành viên |
| GET | `/users/thanhvien` | Lấy tất cả thành viên |
| GET | `/users/thanhvien/baocao` | Báo cáo tăng giảm |
| GET | `/users/thanhvien/:MaTV` | Chi tiết thành viên |
| PUT | `/users/thanhvien/:MaTV` | Cập nhật thành viên |
| DELETE | `/users/thanhvien/:MaTV` | Xóa thành viên |

#### Thành Tích

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/users/thanhtich/tracuu` | Tra cứu thành tích |
| GET | `/users/thanhtich/loai` | Danh sách loại thành tích |
| POST | `/users/thanhtich/ghinhan` | Ghi nhận thành tích |
| GET | `/users/thanhtich/thanhvien` | Thành tích theo tên |
| GET | `/users/thanhtich/baocao` | Báo cáo thành tích |
| PUT | `/users/thanhtich` | Cập nhật thành tích |
| DELETE | `/users/thanhtich` | Xóa thành tích |

#### Kết Thúc (Quản lý người mất)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/users/ketthuc/tracuu` | Tra cứu người mất |
| POST | `/users/ketthuc/ghinhan` | Ghi nhận người mất |
| GET | `/users/ketthuc/:MaTV` | Chi tiết kết thúc |
| PUT | `/users/ketthuc/:MaTV` | Cập nhật thông tin |
| DELETE | `/users/ketthuc/:MaTV` | Xóa thông tin mất |

---

## Sửa Giải Pháp

### Bước 1: Xóa Import Thừa Trong index.ts

**File:** `src/index.ts`

**TRƯỚC (SAI):**
```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';
import thanhvienRouter from '~/routes/thanhvien.routes';  // ❌ XÓA DÒNG NÀY
import thanhtichRouter from '~/routes/thanhtich.routes';  // ❌ XÓA DÒNG NÀY
import ketthucRouter from '~/routes/ketthuc.routes';      // ❌ XÓA DÒNG NÀY
import { defaultErrorHandler } from '~/middlewares/error.middlewares';

const app = express();
const PORT = process.env.PORT || 3000;

// ... middlewares ...

// Routes
app.use('/users', usersRouter);
app.use('/thanhvien', thanhvienRouter);  // ❌ XÓA DÒNG NÀY
app.use('/thanhtich', thanhtichRouter);  // ❌ XÓA DÒNG NÀY
app.use('/ketthuc', ketthucRouter);      // ❌ XÓA DÒNG NÀY

app.use(defaultErrorHandler);
```

**SAU (ĐÚNG):**
```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';  // Sửa CHỈ CẦN DÒNG NÀY
import { defaultErrorHandler } from '~/middlewares/error.middlewares';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware parse JSON
app.use(express.json());
app.use(cookieParser());

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Sửa CHỈ 1 ROUTE DUY NHẤT
app.use('/users', usersRouter);

// Error handler
app.use(defaultErrorHandler);

// Kết nối database và start server
databaseService.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  });
});
```

**Giải thích:**
- Sửa CHỈ import `usersRouter`
- Sửa Các routers khác (`thanhvienRouter`, `thanhtichRouter`, `ketthucRouter`) đã được import TRONG `users.routes.ts`
- Sửa CHỈ đăng ký 1 route: `app.use('/users', usersRouter)`
- Sửa Tất cả sub-routes đều được xử lý bên trong `users.routes.ts`

### Bước 2: Giữ Nguyên users.routes.ts (Đã Đúng)

**File:** `src/routes/users.routes.ts` - KHÔNG SỬA GÌ

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

// Sửa Protected nested routes - TẤT CẢ ĐỀU CẦN AUTHENTICATION
usersRouter.use('/thanhvien', accessTokenValidator, thanhvienRouter);
usersRouter.use('/thanhtich', accessTokenValidator, thanhTichRouter);
usersRouter.use('/ketthuc', accessTokenValidator, ketthucRouter);

export default usersRouter;
```

**Giải thích:**
- Sửa Đã đúng 100%, không cần sửa gì
- Sửa `accessTokenValidator` bảo vệ tất cả routes con
- Sửa Nếu không có token hoặc token hết hạn → 401 Unauthorized

---

## 🧪 Cách Test API Đúng

### 1. Đăng Nhập Trước

```bash
POST http://localhost:3000/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "message": "Đăng nhập thành công",
  "user": {
    "TenDangNhap": "user@example.com",
    "MaTV": "TV01",
    "MaLoaiTK": "LTK03"
  }
}
```

**Cookies được set:**
- `access_token` (httpOnly)
- `refresh_token` (httpOnly)

### 2. Gọi API Protected Routes

#### Với Cookies (Khuyến nghị - sau khi implement cookies)

```bash
GET http://localhost:3000/users/ketthuc/tracuu
Cookie: access_token=<tự động>; refresh_token=<tự động>
```

Browser tự động gửi cookies, không cần thêm gì!

#### Với Authorization Header (Cũ - vẫn hoạt động)

Nếu dùng localStorage, phải gửi token trong header:

```bash
GET http://localhost:3000/users/ketthuc/tracuu
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Các Endpoint Khác

**Tra cứu thành viên:**
```bash
GET http://localhost:3000/users/thanhvien/tra-cuu?HoTen=Nguyễn
Cookie: access_token=<auto>
```

**Tra cứu thành tích:**
```bash
GET http://localhost:3000/users/thanhtich/tracuu?HoTen=Nguyễn&TuNgay=2020-01-01
Cookie: access_token=<auto>
```

**Ghi nhận kết thúc:**
```bash
POST http://localhost:3000/users/ketthuc/ghinhan
Content-Type: application/json
Cookie: access_token=<auto>

{
  "MaTV": "TV01",
  "NgayGioMat": "2024-01-15 10:30:00",
  "MaNguyenNhanMat": "NNM01",
  "MaDiaDiem": "DD01"
}
```

---

## 📊 So Sánh: Trước vs Sau

### TRƯỚC (SAI - vừa sửa nhầm)

**index.ts:**
```typescript
app.use('/users', usersRouter);
app.use('/thanhvien', thanhvienRouter);  // ❌ Trùng lặp
app.use('/thanhtich', thanhtichRouter);  // ❌ Trùng lặp
app.use('/ketthuc', ketthucRouter);      // ❌ Trùng lặp
```

**Endpoints:**
- ❌ `/users/ketthuc/tracuu` (có auth) - ĐÚNG nhưng không hoạt động vì conflict
- ❌ `/ketthuc/tracuu` (KHÔNG có auth) - Lỗ hổng bảo mật!

**Vấn đề:**
- Routes bị đăng ký 2 lần
- Express ưu tiên route đầu tiên → `/ketthuc/tracuu` chạy TRƯỚC `/users/ketthuc/tracuu`
- Route không có auth chạy trước, bypass authentication!

### SAU (ĐÚNG)

**index.ts:**
```typescript
app.use('/users', usersRouter);  // Sửa Chỉ 1 dòng duy nhất
```

**users.routes.ts:**
```typescript
usersRouter.use('/thanhvien', accessTokenValidator, thanhvienRouter);
usersRouter.use('/thanhtich', accessTokenValidator, thanhTichRouter);
usersRouter.use('/ketthuc', accessTokenValidator, ketthucRouter);
```

**Endpoints:**
- Sửa `/users/ketthuc/tracuu` (có auth)
- Sửa `/users/thanhvien/tra-cuu` (có auth)
- Sửa `/users/thanhtich/tracuu` (có auth)

**Ưu điểm:**
- Routes rõ ràng, không trùng lặp
- Tất cả đều có authentication
- An toàn, đúng thiết kế

---

## 🔒 Bảo Mật

### Authentication Flow

```
Client Request
    ↓
CORS Middleware
    ↓
Cookie Parser
    ↓
Route: /users
    ↓
Route: /ketthuc
    ↓
accessTokenValidator ← KIỂM TRA TOKEN
    ↓
    ├─ Token hợp lệ → Tiếp tục
    │   ↓
    │   Route: /tracuu
    │   ↓
    │   Controller xử lý
    │   ↓
    │   Response
    │
    └─ Token không hợp lệ / hết hạn / thiếu
        ↓
        401 Unauthorized
        ↓
        {
          "message": "Access token is required"
        }
```

### Các Trường Hợp Bị Chặn

1. **Không gửi token:**
```bash
GET /users/ketthuc/tracuu
# Không có Cookie hoặc Authorization header

Response: 401 Unauthorized
{
  "message": "Access token is required"
}
```

2. **Token hết hạn:**
```bash
GET /users/ketthuc/tracuu
Authorization: Bearer <expired_token>

Response: 401 Unauthorized
{
  "message": "jwt expired"
}
```

3. **Token không hợp lệ:**
```bash
GET /users/ketthuc/tracuu
Authorization: Bearer invalid_token_abc123

Response: 401 Unauthorized
{
  "message": "invalid signature"
}
```

---

## Sửa Checklist Fix Lỗi

### Bước 1: Kiểm tra index.ts

- [ ] Mở file `src/index.ts`
- [ ] Xóa dòng: `import thanhvienRouter from '~/routes/thanhvien.routes';`
- [ ] Xóa dòng: `import thanhtichRouter from '~/routes/thanhtich.routes';`
- [ ] Xóa dòng: `import ketthucRouter from '~/routes/ketthuc.routes';`
- [ ] Xóa dòng: `app.use('/thanhvien', thanhvienRouter);`
- [ ] Xóa dòng: `app.use('/thanhtich', thanhtichRouter);`
- [ ] Xóa dòng: `app.use('/ketthuc', ketthucRouter);`
- [ ] Chỉ giữ lại: `app.use('/users', usersRouter);`

### Bước 2: Kiểm tra users.routes.ts

- [ ] Mở file `src/routes/users.routes.ts`
- [ ] Xác nhận có dòng: `usersRouter.use('/ketthuc', accessTokenValidator, ketthucRouter);`
- [ ] Xác nhận có dòng: `usersRouter.use('/thanhvien', accessTokenValidator, thanhvienRouter);`
- [ ] Xác nhận có dòng: `usersRouter.use('/thanhtich', accessTokenValidator, thanhTichRouter);`
- [ ] KHÔNG SỬA GÌ - file này đã đúng

### Bước 3: Restart Server

```bash
# Stop server (Ctrl+C)
# Restart
npm run dev
```

### Bước 4: Test API

```bash
# 1. Login trước
POST http://localhost:3000/users/login
{
  "email": "test@example.com",
  "password": "Password123!"
}

# 2. Test tra cứu kết thúc
GET http://localhost:3000/users/ketthuc/tracuu
Cookie: access_token=<auto>

# 3. Kiểm tra response
# Sửa Phải trả về dữ liệu, KHÔNG phải 404
```

---

## 🎯 Kết Luận

**Nguyên nhân lỗi:**
- ❌ Import và đăng ký routes trùng lặp 2 lần
- ❌ Routes được đăng ký ở 2 nơi (index.ts và users.routes.ts)
- ❌ Gây xung đột và bypass authentication

**Giải pháp:**
- Sửa XÓA các import thừa trong `index.ts`
- Sửa XÓA các `app.use()` trùng lặp
- Sửa CHỈ giữ lại `app.use('/users', usersRouter)`
- Sửa Để `users.routes.ts` xử lý tất cả nested routes

**Đường dẫn API đúng:**
- Sửa `/users/ketthuc/tracuu` (ĐÚNG)
- ❌ `/ketthuc/tracuu` (SAI - không tồn tại sau khi fix)
- Sửa `/users/thanhvien/tra-cuu` (ĐÚNG)
- Sửa `/users/thanhtich/tracuu` (ĐÚNG)

**Đặc điểm:**
- Sửa Tất cả đều có authentication
- Sửa Phải đăng nhập mới dùng được
- Sửa Token tự động qua cookies hoặc Authorization header
- Sửa An toàn, không có lỗ hổng

---

## 📚 Tài Liệu Tham Khảo

- [CHUYEN-ROUTES-VAO-USERS-GUIDE.md](./CHUYEN-ROUTES-VAO-USERS-GUIDE.md) - Hướng dẫn cấu trúc routes
- [COOKIE-IMPLEMENTATION-COMPLETED.md](./COOKIE-IMPLEMENTATION-COMPLETED.md) - Authentication với cookies
- [03-Token-And-Flow-Explanation.md](./03-Token-And-Flow-Explanation.md) - JWT flow
