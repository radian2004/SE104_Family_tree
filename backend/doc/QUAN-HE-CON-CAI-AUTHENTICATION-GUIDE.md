# HƯỚNG DẪN THÊM XÁC THỰC CHO CHỨC NĂNG QUAN HỆ CON CÁI

## 🔒 XÁC THỰC (AUTHENTICATION)

**⚠️ QUAN TRỌNG:** Chức năng này YÊU CẦU xác thực người dùng!

### Tại sao cần authentication?
- **Bảo mật**: Chỉ người dùng đã đăng nhập mới có quyền quản lý quan hệ con cái
- **Nhất quán**: Giống với các chức năng khác: hôn nhân, thành tích, kết thúc
- **Kiểm soát**: Ngăn chặn truy cập trái phép vào dữ liệu gia phả
- **Trách nhiệm**: Đảm bảo mọi thay đổi quan hệ gia đình được theo dõi

### Cách hoạt động:
1. **Người dùng đăng nhập** → Nhận `access_token` (lưu trong cookies)
2. **Mọi request** đến `/users/quanhecon/*` phải có token trong cookies
3. **Middleware `accessTokenValidator`** kiểm tra token hợp lệ
4. **Nếu hợp lệ** → Cho phép truy cập
5. **Nếu không hợp lệ** → Trả về lỗi 401 Unauthorized

### Route Structure:
```
TRƯỚC KHI SỬA (không có xác thực):
/quanhecon/*                     ❌ Public - ai cũng truy cập được
  ├── POST /thietlap             ❌ Không cần đăng nhập
  ├── GET /                      ❌ Không cần đăng nhập
  ├── GET /con/:MaTV             ❌ Không cần đăng nhập
  ├── GET /chame/:MaTV           ❌ Không cần đăng nhập
  ├── PUT /capnhat               ❌ Không cần đăng nhập
  ├── DELETE /                   ❌ Không cần đăng nhập
  └── GET /detail/:MaTV          ❌ Không cần đăng nhập

SAU KHI SỬA (có xác thực):
/users                           Sửa Public - không cần token
  ├── /register                  Sửa Đăng ký
  └── /login                     Sửa Đăng nhập
  
/users/quanhecon/*               Sửa Protected - CẦN token
  ├── accessTokenValidator       Sửa Middleware bảo vệ
  └── quanHeConRouter            Sửa Các routes con
      ├── POST /thietlap         Sửa CẦN đăng nhập
      ├── GET /                  Sửa CẦN đăng nhập
      ├── GET /con/:MaTV         Sửa CẦN đăng nhập
      ├── GET /chame/:MaTV       Sửa CẦN đăng nhập
      ├── PUT /capnhat           Sửa CẦN đăng nhập
      ├── DELETE /               Sửa CẦN đăng nhập
      └── GET /detail/:MaTV      Sửa CẦN đăng nhập
```

---

## 📋 MÔ TẢ CHỨC NĂNG

Chức năng này cho phép quản lý quan hệ cha/mẹ - con trong gia phả:
- **Thiết lập quan hệ con**: Gắn con vào cha/mẹ
- **Xem danh sách con**: Lấy tất cả con của một thành viên
- **Xem thông tin cha/mẹ**: Lấy thông tin cha và mẹ của một thành viên
- **Cập nhật quan hệ**: Thay đổi thông tin cha/mẹ
- **Xóa quan hệ**: Hủy quan hệ con cái

---

## 🔧 HƯỚNG DẪN THỰC HIỆN

### BƯỚC 1: Cập nhật file `src/routes/users.routes.ts`

**Mục đích**: Di chuyển routes quan hệ con cái vào trong `/users` và bảo vệ bằng `accessTokenValidator`

#### 1.1. Import quanHeConRouter
Thêm import ở đầu file:

```typescript
import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController,
  refreshTokenController,
  changePasswordController,
  forgotPasswordController,
  verifyForgotPasswordController,
  resetPasswordController
} from '~/controllers/users.controllers';
import { 
  accessTokenValidator, 
  refreshTokenValidator, 
  registerValidator, 
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  verifyForgotPasswordValidator,
  resetPasswordValidator
} from '~/middlewares/users.middlewares';
import { wrapAsync } from '~/utils/handlers';
import thanhtichRouter from './thanhtich.routes';      // Đã có
import ketthucRouter from './ketthuc.routes';          // Đã có
import thanhvienRouter from './thanhvien.routes';      // Đã có
import honNhanRouter from './honnhan.routes';          // Đã có
import quanHeConRouter from './quanhecon.routes';      // Sửa THÊM DÒNG NÀY
```

#### 1.2. Thêm route cho quan hệ con cái
Thêm vào cuối file, trước `export default usersRouter;`:

```typescript
/**
 * QUAN HỆ CON CÁI (Protected Routes)
 * Prefix: /users/quanhecon
 * Yêu cầu: access_token
 * 
 * Các endpoints:
 * - POST   /users/quanhecon/thietlap        - Thiết lập quan hệ con cái
 * - GET    /users/quanhecon                 - Lấy tất cả quan hệ con cái
 * - GET    /users/quanhecon/con/:MaTV       - Lấy danh sách con của thành viên
 * - GET    /users/quanhecon/chame/:MaTV     - Lấy thông tin cha mẹ của thành viên
 * - PUT    /users/quanhecon/capnhat         - Cập nhật quan hệ con cái
 * - DELETE /users/quanhecon                 - Xóa quan hệ con cái
 * - GET    /users/quanhecon/detail/:MaTV    - Lấy chi tiết quan hệ con cái
 */
usersRouter.use('/quanhecon', accessTokenValidator, quanHeConRouter);
```

**File hoàn chỉnh sẽ trông như thế này:**

```typescript
import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController,
  refreshTokenController,
  changePasswordController,
  forgotPasswordController,
  verifyForgotPasswordController,
  resetPasswordController
} from '~/controllers/users.controllers';
import { 
  accessTokenValidator, 
  refreshTokenValidator, 
  registerValidator, 
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  verifyForgotPasswordValidator,
  resetPasswordValidator
} from '~/middlewares/users.middlewares';
import { wrapAsync } from '~/utils/handlers';
import thanhtichRouter from './thanhtich.routes';
import ketthucRouter from './ketthuc.routes';
import thanhvienRouter from './thanhvien.routes';
import honNhanRouter from './honnhan.routes';
import quanHeConRouter from './quanhecon.routes';      // Sửa THÊM DÒNG NÀY

const usersRouter = Router();

/**
 * PUBLIC ROUTES (Không cần authentication)
 */

// POST /users/register - Đăng ký tài khoản mới
usersRouter.post('/register', registerValidator, wrapAsync(registerController));

// POST /users/login - Đăng nhập
usersRouter.post('/login', loginValidator, wrapAsync(loginController));

// POST /users/logout - Đăng xuất
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController));

// POST /users/refresh-token - Làm mới access token
usersRouter.post('/refresh-token', refreshTokenValidator, wrapAsync(refreshTokenController));

// POST /users/forgot-password - Quên mật khẩu (bước 1)
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController));

// POST /users/verify-forgot-password - Xác thực mã OTP (bước 2)
usersRouter.post('/verify-forgot-password', verifyForgotPasswordValidator, wrapAsync(verifyForgotPasswordController));

// POST /users/reset-password - Đặt lại mật khẩu mới (bước 3)
usersRouter.post('/reset-password', resetPasswordValidator, wrapAsync(resetPasswordController));

/**
 * PROTECTED ROUTES (Cần access_token)
 */

// POST /users/change-password - Đổi mật khẩu (yêu cầu đăng nhập)
usersRouter.post('/change-password', accessTokenValidator, changePasswordValidator, wrapAsync(changePasswordController));

/**
 * THÀNH TÍCH (Protected Routes)
 * Prefix: /users/thanhtich
 */
usersRouter.use('/thanhtich', accessTokenValidator, thanhtichRouter);

/**
 * KẾT THÚC (Protected Routes)
 * Prefix: /users/ketthuc
 */
usersRouter.use('/ketthuc', accessTokenValidator, ketthucRouter);

/**
 * THÀNH VIÊN (Protected Routes)
 * Prefix: /users/thanhvien
 */
usersRouter.use('/thanhvien', accessTokenValidator, thanhvienRouter);

/**
 * HÔN NHÂN (Protected Routes)
 * Prefix: /users/honnhan
 */
usersRouter.use('/honnhan', accessTokenValidator, honNhanRouter);

/**
 * QUAN HỆ CON CÁI (Protected Routes)
 * Prefix: /users/quanhecon
 * Yêu cầu: access_token
 * 
 * Các endpoints:
 * - POST   /users/quanhecon/thietlap        - Thiết lập quan hệ con cái
 * - GET    /users/quanhecon                 - Lấy tất cả quan hệ con cái
 * - GET    /users/quanhecon/con/:MaTV       - Lấy danh sách con của thành viên
 * - GET    /users/quanhecon/chame/:MaTV     - Lấy thông tin cha mẹ của thành viên
 * - PUT    /users/quanhecon/capnhat         - Cập nhật quan hệ con cái
 * - DELETE /users/quanhecon                 - Xóa quan hệ con cái
 * - GET    /users/quanhecon/detail/:MaTV    - Lấy chi tiết quan hệ con cái
 */
usersRouter.use('/quanhecon', accessTokenValidator, quanHeConRouter); // Sửa THÊM DÒNG NÀY

export default usersRouter;
```

---

### BƯỚC 2: Cập nhật file `src/index.ts`

**Mục đích**: Xóa route `/quanhecon` cũ khỏi index.ts vì đã chuyển vào `/users/quanhecon`

#### 2.1. Xóa import quanHeConRouter

**TÌM VÀ XÓA dòng này:**
```typescript
import quanHeConRouter from '~/routes/quanhecon.routes';      // ❌ XÓA DÒNG NÀY
```

**TRƯỚC KHI SỬA:**
```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';
import quanHeConRouter from '~/routes/quanhecon.routes';      // ❌ XÓA DÒNG NÀY
import { defaultErrorHandler } from '~/middlewares/error.middlewares';
```

**SAU KHI SỬA:**
```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';
// quanHeConRouter đã được chuyển vào users.routes.ts
import { defaultErrorHandler } from '~/middlewares/error.middlewares';
```

#### 2.2. Xóa route `/quanhecon`

**TÌM VÀ XÓA dòng này:**
```typescript
app.use('/quanhecon', quanHeConRouter);  // ❌ XÓA DÒNG NÀY
```

**TRƯỚC KHI SỬA:**
```typescript
// Routes
app.use('/users', usersRouter);
app.use('/quanhecon', quanHeConRouter);  // ❌ XÓA DÒNG NÀY

// Default error handler (đặt sau tất cả routes)
app.use(defaultErrorHandler);
```

**SAU KHI SỬA:**
```typescript
// Routes
app.use('/users', usersRouter);
// Route /quanhecon đã được chuyển vào /users/quanhecon trong users.routes.ts

// Default error handler (đặt sau tất cả routes)
app.use(defaultErrorHandler);
```

**File `src/index.ts` hoàn chỉnh sau khi sửa:**

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';
// quanHeConRouter đã được chuyển vào users.routes.ts
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

// CORS - QUAN TRỌNG: Phải cho phép credentials
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

// Routes
app.use('/users', usersRouter);
// Route /quanhecon đã được chuyển vào /users/quanhecon trong users.routes.ts

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

### BƯỚC 3: KHÔNG CẦN SỬA file `src/routes/quanhecon.routes.ts`

**⚠️ QUAN TRỌNG**: File `quanhecon.routes.ts` KHÔNG CẦN thay đổi gì!

**Lý do**: 
- File này chỉ định nghĩa các routes con: `/thietlap`, `/`, `/con/:MaTV`, etc.
- Middleware `accessTokenValidator` đã được thêm ở tầng cha (`users.routes.ts`)
- Tất cả routes con sẽ tự động kế thừa middleware bảo vệ

**Cơ chế hoạt động:**
```
Request: POST /users/quanhecon/thietlap
         ↓
    usersRouter
         ↓
    accessTokenValidator (kiểm tra token) Sửa
         ↓
    quanHeConRouter
         ↓
    POST /thietlap → thietLapQuanHeConController
```

---

## 🧪 KIỂM THỬ

### 1. Kiểm tra KHÔNG CÓ access_token (phải lỗi)

#### Test 1: POST /users/quanhecon/thietlap (không có token)
```bash
curl -X POST http://localhost:3000/users/quanhecon/thietlap \
  -H "Content-Type: application/json" \
  -d '{
    "MaTV": "TV06",
    "MaTVCha": "TV04",
    "MaTVMe": "TV05"
  }'
```

**Kết quả mong đợi:**
```json
{
  "message": "Access token is required",
  "statusCode": 401
}
```

---

#### Test 2: GET /users/quanhecon (không có token)
```bash
curl -X GET http://localhost:3000/users/quanhecon
```

**Kết quả mong đợi:**
```json
{
  "message": "Access token is required",
  "statusCode": 401
}
```

---

#### Test 3: GET /users/quanhecon/con/TV04 (không có token)
```bash
curl -X GET http://localhost:3000/users/quanhecon/con/TV04
```

**Kết quả mong đợi:**
```json
{
  "message": "Access token is required",
  "statusCode": 401
}
```

---

### 2. Kiểm tra CÓ access_token (phải thành công)

#### Bước 1: Đăng nhập để lấy token
```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "TenDangNhap": "admin",
    "MatKhau": "123456"
  }' \
  -c cookies.txt
```

**Kết quả:**
```json
{
  "message": "Login successful",
  "result": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Token sẽ được lưu trong `cookies.txt`

---

#### Test 4: POST /users/quanhecon/thietlap (có token)
```bash
curl -X POST http://localhost:3000/users/quanhecon/thietlap \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "MaTV": "TV08",
    "MaTVCha": "TV06",
    "NgayPhatSinh": "2024-06-10"
  }'
```

**Kết quả mong đợi:**
```json
{
  "message": "Thiết lập quan hệ con cái thành công!",
  "result": {
    "MaTV": "TV08",
    "MaTVCha": "TV06",
    "MaTVMe": "TV07",
    "NgayPhatSinh": "2024-06-10T00:00:00.000Z"
  }
}
```

---

#### Test 5: GET /users/quanhecon (có token)
```bash
curl -X GET http://localhost:3000/users/quanhecon \
  -b cookies.txt
```

**Kết quả mong đợi:**
```json
{
  "message": "Lấy danh sách quan hệ con cái thành công",
  "result": [
    {
      "MaTV": "TV02",
      "HoTenCon": "Nguyễn Văn Long",
      "MaTVCha": "TV01",
      "HoTenCha": "Nguyễn Văn Tổ",
      "MaTVMe": null,
      "HoTenMe": null,
      "NgayPhatSinh": "1990-03-20T03:30:00.000Z"
    },
    {
      "MaTV": "TV04",
      "HoTenCon": "Nguyễn Văn Hùng",
      "MaTVCha": "TV02",
      "HoTenCha": "Nguyễn Văn Long",
      "MaTVMe": "TV03",
      "HoTenMe": "Lê Thị Lan",
      "NgayPhatSinh": "1972-08-10T02:15:00.000Z"
    }
  ]
}
```

---

#### Test 6: GET /users/quanhecon/con/TV04 (có token)
```bash
curl -X GET http://localhost:3000/users/quanhecon/con/TV04 \
  -b cookies.txt
```

**Kết quả mong đợi:**
```json
{
  "message": "Lấy danh sách con thành công",
  "result": [
    {
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "NgayGioSinh": "1998-04-05T00:45:00.000Z",
      "GioiTinh": "Nam"
    },
    {
      "MaTV": "TV07",
      "HoTen": "Nguyễn Thị Ngọc Anh",
      "NgayGioSinh": "2002-01-18T09:30:00.000Z",
      "GioiTinh": "Nữ"
    }
  ]
}
```

---

#### Test 7: GET /users/quanhecon/chame/TV06 (có token)
```bash
curl -X GET http://localhost:3000/users/quanhecon/chame/TV06 \
  -b cookies.txt
```

**Kết quả mong đợi:**
```json
{
  "message": "Lấy thông tin cha mẹ thành công",
  "result": {
    "Cha": {
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "NgayGioSinh": "1972-08-10T02:15:00.000Z",
      "GioiTinh": "Nam"
    },
    "Me": {
      "MaTV": "TV05",
      "HoTen": "Phạm Thị Hồng",
      "NgayGioSinh": "1975-09-12T04:20:00.000Z",
      "GioiTinh": "Nữ"
    }
  }
}
```

---

#### Test 8: PUT /users/quanhecon/capnhat (có token)
```bash
curl -X PUT http://localhost:3000/users/quanhecon/TV08 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "MaTVCha": "TV04",
    "MaTVMe": "TV05",
    "NgayPhatSinh": "2024-07-01"
  }'
```

**Kết quả mong đợi:**
```json
{
  "message": "Cập nhật quan hệ con cái thành công!",
  "result": {
    "MaTV": "TV08",
    "MaTVCha": "TV04",
    "MaTVMe": "TV05",
    "NgayPhatSinh": "2024-07-01T00:00:00.000Z"
  }
}
```

---

#### Test 9: DELETE /users/quanhecon (có token)
```bash
curl -X DELETE http://localhost:3000/users/quanhecon \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "MaTV": "TV08"
  }'
```

**Kết quả mong đợi:**
```json
{
  "message": "Xóa quan hệ con cái thành công!"
}
```

---

#### Test 10: GET /users/quanhecon/detail/TV06 (có token)
```bash
curl -X GET http://localhost:3000/users/quanhecon/detail/TV06 \
  -b cookies.txt
```

**Kết quả mong đợi:**
```json
{
  "message": "Lấy chi tiết quan hệ con cái thành công",
  "result": {
    "MaTV": "TV06",
    "HoTenCon": "Nguyễn Văn Nam",
    "NgayGioSinhCon": "1998-04-05T00:45:00.000Z",
    "MaTVCha": "TV04",
    "HoTenCha": "Nguyễn Văn Hùng",
    "NgayGioSinhCha": "1972-08-10T02:15:00.000Z",
    "MaTVMe": "TV05",
    "HoTenMe": "Phạm Thị Hồng",
    "NgayGioSinhMe": "1975-09-12T04:20:00.000Z",
    "NgayPhatSinh": "1998-04-05T00:45:00.000Z"
  }
}
```

---

### 3. Kiểm tra với token HẾT HẠN (phải lỗi)

Sau 15 phút (hoặc thời gian hết hạn của access_token), thử gọi lại:

```bash
curl -X GET http://localhost:3000/users/quanhecon \
  -b cookies.txt
```

**Kết quả mong đợi:**
```json
{
  "message": "Access token has expired",
  "statusCode": 401
}
```

**Giải pháp**: Dùng refresh token để lấy access token mới:
```bash
curl -X POST http://localhost:3000/users/refresh-token \
  -b cookies.txt
```

---

## 📊 SO SÁNH TRƯỚC VÀ SAU

### TRƯỚC KHI SỬA (Không có authentication)

| Endpoint | Method | Route | Bảo mật | Vấn đề |
|----------|--------|-------|---------|--------|
| Thiết lập quan hệ | POST | `/quanhecon/thietlap` | ❌ Không | Ai cũng thêm được |
| Lấy tất cả | GET | `/quanhecon` | ❌ Không | Ai cũng xem được |
| Lấy danh sách con | GET | `/quanhecon/con/:MaTV` | ❌ Không | Ai cũng xem được |
| Lấy cha mẹ | GET | `/quanhecon/chame/:MaTV` | ❌ Không | Ai cũng xem được |
| Cập nhật | PUT | `/quanhecon/capnhat` | ❌ Không | Ai cũng sửa được |
| Xóa | DELETE | `/quanhecon` | ❌ Không | Ai cũng xóa được |
| Chi tiết | GET | `/quanhecon/detail/:MaTV` | ❌ Không | Ai cũng xem được |

### SAU KHI SỬA (Có authentication)

| Endpoint | Method | Route | Bảo mật | Cải thiện |
|----------|--------|-------|---------|-----------|
| Thiết lập quan hệ | POST | `/users/quanhecon/thietlap` | Sửa Token | Chỉ user đã login |
| Lấy tất cả | GET | `/users/quanhecon` | Sửa Token | Chỉ user đã login |
| Lấy danh sách con | GET | `/users/quanhecon/con/:MaTV` | Sửa Token | Chỉ user đã login |
| Lấy cha mẹ | GET | `/users/quanhecon/chame/:MaTV` | Sửa Token | Chỉ user đã login |
| Cập nhật | PUT | `/users/quanhecon/capnhat` | Sửa Token | Chỉ user đã login |
| Xóa | DELETE | `/users/quanhecon` | Sửa Token | Chỉ user đã login |
| Chi tiết | GET | `/users/quanhecon/detail/:MaTV` | Sửa Token | Chỉ user đã login |

---

## 🔍 LUỒNG XÁC THỰC CHI TIẾT

### Luồng thành công (Happy Path)

```
1. Client đăng nhập
   POST /users/login
   Body: { TenDangNhap, MatKhau }
   ↓
2. Server trả về tokens (lưu trong cookies)
   {
     access_token: "eyJhbG...",
     refresh_token: "eyJhbG..."
   }
   ↓
3. Client gọi API thiết lập quan hệ con (kèm cookies)
   POST /users/quanhecon/thietlap
   Cookie: access_token=eyJhbG...
   Body: { MaTV, MaTVCha, MaTVMe? }
   ↓
4. Middleware accessTokenValidator
   - Kiểm tra cookie có access_token không?
   - Verify token với JWT_SECRET
   - Decode payload: { TenDangNhap, MaTV, MaLoaiTK }
   - Gắn vào req.decoded_authorization
   ↓
5. Controller thietLapQuanHeConController
   - Xử lý logic nghiệp vụ
   - Insert vào database
   - Trả kết quả
   ↓
6. Client nhận response thành công
   {
     message: "Thiết lập quan hệ con cái thành công!",
     result: { ... }
   }
```

### Luồng thất bại (Error Path)

```
1. Client gọi API KHÔNG CÓ token
   POST /users/quanhecon/thietlap
   (Không có cookie)
   ↓
2. Middleware accessTokenValidator
   - Kiểm tra cookie → KHÔNG TÌM THẤY
   - Throw Error: "Access token is required"
   ↓
3. Error Handler
   - Bắt lỗi
   - Trả về 401 Unauthorized
   ↓
4. Client nhận lỗi
   {
     message: "Access token is required",
     statusCode: 401
   }
```

---

## 🎯 CHECKLIST HOÀN THÀNH

### Checklist thực hiện

- [ ] **BƯỚC 1**: Sửa file `src/routes/users.routes.ts`
  - [ ] Import `quanHeConRouter`
  - [ ] Thêm route `/quanhecon` với `accessTokenValidator`
  
- [ ] **BƯỚC 2**: Sửa file `src/index.ts`
  - [ ] Xóa import `quanHeConRouter`
  - [ ] Xóa route `/quanhecon`
  
- [ ] **BƯỚC 3**: Khởi động lại server
  ```bash
  npm run dev
  ```

### Checklist kiểm thử

- [ ] **Test không có token (phải lỗi 401)**
  - [ ] POST /users/quanhecon/thietlap
  - [ ] GET /users/quanhecon
  - [ ] GET /users/quanhecon/con/:MaTV
  - [ ] GET /users/quanhecon/chame/:MaTV
  - [ ] PUT /users/quanhecon/capnhat
  - [ ] DELETE /users/quanhecon
  - [ ] GET /users/quanhecon/detail/:MaTV
  
- [ ] **Test có token (phải thành công 200)**
  - [ ] Đăng nhập lấy token
  - [ ] POST /users/quanhecon/thietlap
  - [ ] GET /users/quanhecon
  - [ ] GET /users/quanhecon/con/:MaTV
  - [ ] GET /users/quanhecon/chame/:MaTV
  - [ ] PUT /users/quanhecon/capnhat
  - [ ] DELETE /users/quanhecon
  - [ ] GET /users/quanhecon/detail/:MaTV
  
- [ ] **Test token hết hạn (phải lỗi 401)**
  - [ ] Đợi 15 phút (hoặc thời gian hết hạn)
  - [ ] Gọi lại API → phải lỗi
  - [ ] Dùng refresh token → lấy token mới thành công

---

## ❓ FAQ (Câu hỏi thường gặp)

### Q1: Tại sao không cần sửa file `quanhecon.routes.ts`?
**A**: Vì middleware `accessTokenValidator` được thêm ở tầng cha (`users.routes.ts`), tất cả routes con sẽ tự động kế thừa. Không cần thêm middleware vào từng route con.

### Q2: Client cần gửi token như thế nào?
**A**: Token được lưu trong **cookies** tự động sau khi đăng nhập. Client chỉ cần:
- Browser: Cookies tự động gửi kèm mỗi request
- Postman: Chọn "Send cookies"
- cURL: Dùng `-b cookies.txt`
- Axios/Fetch: Cấu hình `credentials: 'include'`

### Q3: Token hết hạn thì làm sao?
**A**: Dùng **refresh token** để lấy access token mới:
```bash
POST /users/refresh-token
Cookie: refresh_token=eyJhbG...
```

### Q4: Có cần sửa database không?
**A**: **KHÔNG**. Tất cả triggers và schema đã đúng. Chỉ cần sửa routes.

### Q5: Có cần sửa controllers/services không?
**A**: **KHÔNG**. Controllers và services hoạt động bình thường. Chỉ cần thêm authentication layer ở routes.

### Q6: Frontend cần thay đổi gì?
**A**: 
- Đổi URL từ `/quanhecon/*` → `/users/quanhecon/*`
- Đảm bảo gửi cookies trong mỗi request:
  ```javascript
  axios.post('/users/quanhecon/thietlap', data, {
    withCredentials: true  // Sửa Quan trọng
  })
  ```

### Q7: Làm sao biết token đã được gửi chưa?
**A**: Kiểm tra trong:
- **Browser DevTools**: Network tab → Request Headers → Cookie
- **Postman**: Cookies tab
- **Server logs**: `console.log(req.cookies.access_token)`

### Q8: Có thể dùng Authorization header thay vì cookies không?
**A**: Được, nhưng phải sửa middleware `accessTokenValidator` để đọc từ header thay vì cookies. Hiện tại project dùng cookies theo best practice của web security.

---

## 🎓 LƯU Ý QUAN TRỌNG

### Sửa Nên làm:
1. **Đọc kỹ guide** trước khi sửa code
2. **Backup code** trước khi thay đổi
3. **Test từng bước** một để dễ debug
4. **Kiểm tra logs** nếu có lỗi
5. **Dùng Postman** để test API dễ dàng

### ❌ Không nên:
1. **Sửa nhiều file cùng lúc** → khó debug
2. **Bỏ qua test** → có thể bị lỗi sau
3. **Hardcode token** trong code → mất bảo mật
4. **Xóa middleware cũ** trước khi test middleware mới
5. **Quên restart server** sau khi sửa code

---

## 📞 HỖ TRỢ

Nếu gặp lỗi, kiểm tra:
1. **Server có chạy không?** → `npm run dev`
2. **Database có kết nối không?** → Kiểm tra MySQL container
3. **Token có hợp lệ không?** → Kiểm tra cookies trong DevTools
4. **Route có đúng không?** → Phải là `/users/quanhecon/*`, không phải `/quanhecon/*`
5. **Middleware có được thêm không?** → Kiểm tra `users.routes.ts`

---

## ✨ KẾT LUẬN

Sau khi hoàn thành guide này, chức năng **Quan hệ Con cái** sẽ:
- Sửa **Bảo mật**: Chỉ user đã đăng nhập mới truy cập được
- Sửa **Nhất quán**: Giống với các chức năng khác (hôn nhân, thành tích, kết thúc)
- Sửa **Dễ bảo trì**: Routes được tổ chức rõ ràng trong `/users/*`
- Sửa **Chuẩn RESTful**: Prefix `/users` cho tất cả protected resources

**Chúc bạn thực hiện thành công! 🎉**
