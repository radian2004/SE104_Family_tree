# HƯỚNG DẪN: CHUYỂN ROUTES /thanhvien, /thanhtich, /ketthuc VÀO /users

## 📋 MỤC ĐÍCH

Chuyển các routes độc lập `/thanhvien`, `/thanhtich`, `/ketthuc` thành các sub-routes của `/users`:
- `/thanhvien` → `/users/thanhvien`
- `/thanhtich` → `/users/thanhtich`
- `/ketthuc` → `/users/ketthuc`

**Lý do**: Đảm bảo chỉ có thể sử dụng các API này khi:
1. Đã đăng nhập (có JWT access token hợp lệ)
2. JWT chưa hết hạn
3. Tất cả requests đều phải qua authentication middleware

---

## 📊 PHÂN TÍCH CẤU TRÚC HIỆN TẠI

### 1. File `src/index.ts` - Đăng ký routes hiện tại

```typescript
// Hiện tại
app.use('/users', usersRouter);
app.use('/thanhvien', thanhvienRouter);
app.use('/thanhtich', thanhTichRouter);
app.use('/ketthuc', ketthucRouter);
```

**Vấn đề**: 
- Các routes `/thanhvien`, `/thanhtich`, `/ketthuc` là độc lập
- KHÔNG có middleware authentication
- Client có thể truy cập mà không cần đăng nhập

---

### 2. Authentication Middleware hiện tại

File: `src/middlewares/users.middlewares.ts`

**Middleware quan trọng**:

#### `accessTokenValidator`
- Kiểm tra header `Authorization: Bearer <token>`
- Verify JWT access token
- Nếu token không hợp lệ hoặc hết hạn → trả về 401 Unauthorized
- Nếu hợp lệ → gắn `decoded_authorization` vào request

```typescript
export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            const access_token = value.split(' ')[1];

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
    },
    ['headers']
  )
);
```

**Cách hoạt động**:
1. Client gửi request với header: `Authorization: Bearer <access_token>`
2. Middleware tách token từ header
3. Verify token bằng JWT secret
4. Nếu token hết hạn hoặc không hợp lệ → throw error 401
5. Nếu OK → cho phép request đi tiếp

---

### 3. Routes hiện tại

#### File: `src/routes/users.routes.ts`
```typescript
const usersRouter = Router();

usersRouter.post('/register', registerValidator, wrapAsync(registerController));
usersRouter.post('/login', loginValidator, wrapAsync(loginController));
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController));
```

**Lưu ý**: Hiện tại chỉ có `/logout` sử dụng `accessTokenValidator`

#### File: `src/routes/thanhvien.routes.ts`
```typescript
const thanhvienRouter = Router();

// Các routes cụ thể
thanhvienRouter.post('/register', registerController);
thanhvienRouter.post('/ghi-nhan', ghiNhanThanhVienController);
thanhvienRouter.get('/available-relations', getAvailableRelationsController);
thanhvienRouter.get('/tra-cuu', traCuuThanhVienController);

// Routes chung
thanhvienRouter.get('/', getAllThanhVienController);
thanhvienRouter.get('/baocao', getBaoCaoTangGiamController);
thanhvienRouter.get('/:MaTV', getThanhVienByMaTVController);
thanhvienRouter.put('/:MaTV', updateThanhVienController);
thanhvienRouter.delete('/:MaTV', deleteThanhVienController);
```

**Vấn đề**: KHÔNG có middleware authentication nào

#### File: `src/routes/thanhtich.routes.ts`
```typescript
const thanhTichRouter = Router();

thanhTichRouter.get('/loai', getLoaiThanhTichController);
thanhTichRouter.post('/ghinhan', ghiNhanThanhTichController);
thanhTichRouter.get('/tracuu', traCuuThanhTichController);
thanhTichRouter.get('/thanhvien', getThanhTichByHoTenController);
thanhTichRouter.delete('/xoa', xoaThanhTichController);
thanhTichRouter.put('/capnhat', capNhatThanhTichController);
thanhTichRouter.get('/baocao', getBaoCaoThanhTichController);
```

**Vấn đề**: KHÔNG có middleware authentication nào

#### File: `src/routes/ketthuc.routes.ts`
```typescript
const ketthucRouter = Router();

ketthucRouter.post('/ghinhan', ghiNhanKetThucController);
ketthucRouter.get('/tracuu', traCuuKetThucController);
ketthucRouter.get('/:MaTV', getChiTietKetThucController);
ketthucRouter.put('/:MaTV', capNhatKetThucController);
ketthucRouter.delete('/:MaTV', xoaKetThucController);
```

**Vấn đề**: KHÔNG có middleware authentication nào

---

## 🔍 PHÂN TÍCH DATABASE

### Bảng TAIKHOAN
```sql
CREATE TABLE TAIKHOAN(
	TenDangNhap VARCHAR(50) PRIMARY KEY,
	MaTV VARCHAR(5),
	MatKhau VARCHAR(100),
	MaLoaiTK VARCHAR(5),
	TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV) ON DELETE CASCADE,
	FOREIGN KEY(MaLoaiTK) REFERENCES LOAITAIKHOAN(MaLoaiTK)
);
```

**Quan trọng**: 
- `TenDangNhap` là khóa chính (email)
- `MaTV` là khóa ngoại tham chiếu đến `THANHVIEN(MaTV)`
- Mỗi tài khoản có liên kết với 1 thành viên trong hệ thống

### Bảng REFRESH_TOKENS
```sql
CREATE TABLE REFRESH_TOKENS (
    token VARCHAR(500) PRIMARY KEY,
    TenDangNhap VARCHAR(50) NOT NULL,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    NgayHetHan TIMESTAMP NOT NULL,
    FOREIGN KEY(TenDangNhap) REFERENCES TAIKHOAN(TenDangNhap) ON DELETE CASCADE,
    INDEX idx_tendangnhap (TenDangNhap),
    INDEX idx_ngayhethan (NgayHetHan)
);
```

**Lưu ý**:
- Lưu refresh token để verify khi logout
- Token có ngày hết hạn

### Các bảng liên quan đến thành viên

#### THANHVIEN
```sql
CREATE TABLE THANHVIEN (
    MaTV VARCHAR(5) PRIMARY KEY,
    HoTen VARCHAR(50),
    NgayGioSinh DATETIME,
    DiaChi VARCHAR(50),
    TrangThai VARCHAR(20) DEFAULT 'Còn Sống',
    TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    DOI	INT DEFAULT 0,
    MaQueQuan VARCHAR(5),
    MaNgheNghiep VARCHAR(5),
    GioiTinh VARCHAR(3), -- Nam/Nữ
    MaNguyenNhanMat VARCHAR(5),
    NgayGioMat DATETIME,
    MaDiaDiem VARCHAR(5),
    MaGiaPha VARCHAR(5),
    FOREIGN KEY(MaQueQuan) REFERENCES QUEQUAN(MaQueQuan),
	FOREIGN KEY(MaNgheNghiep) REFERENCES NGHENGHIEP(MaNgheNghiep),
	FOREIGN KEY(MaNguyenNhanMat) REFERENCES NGUYENNHANMAT(MaNguyenNhanMat),
	FOREIGN KEY(MaDiaDiem) REFERENCES DIADIEMMAITANG(MaDiaDiem)
);
```

#### GHINHANTHANHTICH
```sql
CREATE TABLE GHINHANTHANHTICH(
	MaLTT VARCHAR(5),
	MaTV VARCHAR(5),
	NgayPhatSinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY(MaLTT, MaTV, NgayPhatSinh),
	FOREIGN KEY(MaLTT) REFERENCES LOAITHANHTICH(MaLTT),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV)
);
```

#### LOAITHANHTICH
```sql
CREATE TABLE LOAITHANHTICH(
	MaLTT VARCHAR(5) PRIMARY KEY,
	TenLTT VARCHAR(35) UNIQUE
);
```

**Kết luận về database**:
- ✅ Database đã có cấu trúc authentication đầy đủ
- ✅ Có bảng TAIKHOAN và REFRESH_TOKENS
- ✅ Quan hệ giữa tài khoản và thành viên đã được thiết lập
- ✅ KHÔNG CẦN THAY ĐỔI GÌ Ở DATABASE

---

## 🛠️ HƯỚNG DẪN THỰC HIỆN

### ⚠️ LƯU Ý QUAN TRỌNG

**Có 2 cách tiếp cận**:

#### Cách 1: Nest Router (Khuyến nghị) ⭐
- Giữ nguyên các file routes hiện tại
- Chỉ sửa file `src/index.ts`
- Đơn giản, dễ rollback

#### Cách 2: Merge Router
- Gộp tất cả vào `src/routes/users.routes.ts`
- Phức tạp hơn nhưng rõ ràng về cấu trúc

**Tài liệu này hướng dẫn CẢ HAI CÁCH**

---

## 📝 CÁCH 1: NEST ROUTER (KHUYẾN NGHỊ)

### ⚠️ LƯU Ý QUAN TRỌNG: CÓ 2 CÁCH ÁP DỤNG MIDDLEWARE

**Cách A (ĐƠN GIẢN HƠN - KHUYẾN NGHỊ)**: Thêm middleware khi nest router  
**Cách B**: Thêm middleware vào từng router con

Hướng dẫn này sử dụng **Cách A** vì đơn giản hơn và ít thay đổi code hơn.

---

### Bước 1: Thêm `wrapAsync` vào các Routes con

Các file routes con cần wrap tất cả controllers bằng `wrapAsync` để xử lý async/await đúng cách.

#### 1.1. Sửa file `src/routes/thanhvien.routes.ts`

**ĐỊA ĐIỂM SỬA**: Đầu file, sau import

```typescript
// THÊM IMPORT
import { wrapAsync } from '~/utils/handlers';
```

**ĐỊA ĐIỂM SỬA**: Wrap TẤT CẢ controllers bằng `wrapAsync()`

**FILE HOÀN CHỈNH SAU KHI SỬA**:

```typescript
import { Router } from 'express';
import {
  registerController,
  getAllThanhVienController,
  getThanhVienByMaTVController,
  updateThanhVienController,
  deleteThanhVienController,
  getBaoCaoTangGiamController,
  ghiNhanThanhVienController,
  getAvailableRelationsController,
  traCuuThanhVienController
} from '~/controllers/thanhvien.controllers';
import { wrapAsync } from '~/utils/handlers'; // ✅ THÊM

const thanhvienRouter = Router();

// Routes cụ thể - ✅ CHÚ Ý: Wrap bằng wrapAsync()
thanhvienRouter.post('/register', wrapAsync(registerController));
thanhvienRouter.post('/ghi-nhan', wrapAsync(ghiNhanThanhVienController));
thanhvienRouter.get('/available-relations', wrapAsync(getAvailableRelationsController));
thanhvienRouter.get('/tra-cuu', wrapAsync(traCuuThanhVienController));

// Routes chung
thanhvienRouter.get('/', wrapAsync(getAllThanhVienController));
thanhvienRouter.get('/baocao', wrapAsync(getBaoCaoTangGiamController));
thanhvienRouter.get('/:MaTV', wrapAsync(getThanhVienByMaTVController));
thanhvienRouter.put('/:MaTV', wrapAsync(updateThanhVienController));
thanhvienRouter.delete('/:MaTV', wrapAsync(deleteThanhVienController));

export default thanhvienRouter;
```

**CHÚ Ý**:
- ✅ PHẢI wrap tất cả controllers bằng `wrapAsync()`
- ✅ KHÔNG cần thêm `accessTokenValidator` ở đây (sẽ thêm khi nest)
- `wrapAsync` giúp bắt lỗi async/await tự động

---

#### 1.2. Sửa file `src/routes/thanhtich.routes.ts`

**ĐỊA ĐIỂM SỬA**: Đầu file, sau import

```typescript
// THÊM IMPORT
import { wrapAsync } from '~/utils/handlers';
```

**FILE HOÀN CHỈNH SAU KHI SỬA**:

```typescript
import { Router } from 'express';
import {
  getLoaiThanhTichController,
  ghiNhanThanhTichController,
  traCuuThanhTichController,
  getThanhTichByHoTenController,
  xoaThanhTichController,
  capNhatThanhTichController,
  getBaoCaoThanhTichController
} from '~/controllers/thanhtich.controllers';
import { wrapAsync } from '~/utils/handlers'; // ✅ THÊM

const thanhTichRouter = Router();

// ✅ CHÚ Ý: Wrap tất cả bằng wrapAsync()
thanhTichRouter.get('/loai', wrapAsync(getLoaiThanhTichController));
thanhTichRouter.post('/ghinhan', wrapAsync(ghiNhanThanhTichController));
thanhTichRouter.get('/tracuu', wrapAsync(traCuuThanhTichController));
thanhTichRouter.get('/thanhvien', wrapAsync(getThanhTichByHoTenController));
thanhTichRouter.delete('/xoa', wrapAsync(xoaThanhTichController));
thanhTichRouter.put('/capnhat', wrapAsync(capNhatThanhTichController));
thanhTichRouter.get('/baocao', wrapAsync(getBaoCaoThanhTichController));

export default thanhTichRouter;
```

---

#### 1.3. Sửa file `src/routes/ketthuc.routes.ts`

**ĐỊA ĐIỂM SỬA**: Đầu file, sau import

```typescript
// THÊM IMPORT
import { wrapAsync } from '~/utils/handlers';
```

**FILE HOÀN CHỈNH SAU KHI SỬA**:

```typescript
import { Router } from 'express';
import {
  ghiNhanKetThucController,
  traCuuKetThucController,
  getChiTietKetThucController,
  capNhatKetThucController,
  xoaKetThucController
} from '~/controllers/ketthuc.controllers';
import { wrapAsync } from '~/utils/handlers'; // ✅ THÊM

const ketthucRouter = Router();

// ✅ CHÚ Ý: Wrap tất cả bằng wrapAsync()
ketthucRouter.post('/ghinhan', wrapAsync(ghiNhanKetThucController));
ketthucRouter.get('/tracuu', wrapAsync(traCuuKetThucController));
ketthucRouter.get('/:MaTV', wrapAsync(getChiTietKetThucController));
ketthucRouter.put('/:MaTV', wrapAsync(capNhatKetThucController));
ketthucRouter.delete('/:MaTV', wrapAsync(xoaKetThucController));

export default ketthucRouter;
```

---

### Bước 2: Nest các Router vào /users VỚI Authentication Middleware

Đây là bước QUAN TRỌNG: thêm `accessTokenValidator` khi nest router.

#### 2.1. Sửa file `src/routes/users.routes.ts`

**ĐỊA ĐIỂM SỬA**: Sau phần import, thêm import các router khác

```typescript
// THÊM IMPORT
import thanhvienRouter from './thanhvien.routes';
import thanhTichRouter from './thanhtich.routes';
import ketthucRouter from './ketthuc.routes';
```

**ĐỊA ĐIỂM SỬA**: Sau các routes hiện tại, TRƯỚC `export default`

```typescript
// ✅ THÊM: Nest sub-routes VỚI accessTokenValidator middleware
usersRouter.use('/thanhvien', accessTokenValidator, thanhvienRouter);
usersRouter.use('/thanhtich', accessTokenValidator, thanhTichRouter);
usersRouter.use('/ketthuc', accessTokenValidator, ketthucRouter);

export default usersRouter;
```

**GIẢI THÍCH**:
- `accessTokenValidator` được thêm VÀO GIỮA path và router
- Middleware này sẽ chạy TRƯỚC khi request đi vào các routes con
- Tất cả routes trong `thanhvienRouter`, `thanhTichRouter`, `ketthucRouter` đều phải qua xác thực

**FILE HOÀN CHỈNH SAU KHI SỬA**:

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

// ✅ THÊM: Import sub-routers
import thanhvienRouter from './thanhvien.routes';
import thanhTichRouter from './thanhtich.routes';
import ketthucRouter from './ketthuc.routes';

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

// ✅ THÊM: Nest sub-routes VỚI accessTokenValidator middleware
// Middleware sẽ kiểm tra JWT token trước khi cho phép truy cập routes con
usersRouter.use('/thanhvien', accessTokenValidator, thanhvienRouter);
usersRouter.use('/thanhtich', accessTokenValidator, thanhTichRouter);
usersRouter.use('/ketthuc', accessTokenValidator, ketthucRouter);

export default usersRouter;
```

---

#### 2.2. Sửa file `src/index.ts`

**ĐỊA ĐIỂM SỬA**: Phần đăng ký routes

**XÓA 3 DÒNG IMPORT**:
```typescript
// ❌ XÓA 3 import này
import thanhvienRouter from '~/routes/thanhvien.routes';
import thanhTichRouter from '~/routes/thanhtich.routes';
import ketthucRouter from './routes/ketthuc.routes';
```

**XÓA 3 DÒNG app.use**:
```typescript
// ❌ XÓA 3 dòng này
app.use('/thanhvien', thanhvienRouter);
app.use('/thanhtich', thanhTichRouter);
app.use('/ketthuc', ketthucRouter);
```

**FILE HOÀN CHỈNH SAU KHI SỬA**:

```typescript
import express from 'express';
import cors from 'cors';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';
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

// Routes
app.use('/users', usersRouter); // ✅ Bây giờ chứa tất cả sub-routes với authentication

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

### Bước 3: Testing

#### 3.1. Restart Server

```bash
# Stop server hiện tại (Ctrl+C)
# Start lại
npm run dev
```

#### 3.2. Test với Postman/Thunder Client

**Test 1: Truy cập KHÔNG đăng nhập → 401**

```http
GET http://localhost:3000/users/thanhvien
# Không có header Authorization

Response:
{
  "message": "Access token is required",
  "status": 401
}
```

**Test 2: Đăng nhập để lấy token**

```http
POST http://localhost:3000/users/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "YourPassword123!"
}

Response:
{
  "message": "Đăng nhập thành công",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Test 3: Truy cập với token hợp lệ → 200 OK**

```http
GET http://localhost:3000/users/thanhvien
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response:
{
  "message": "Lấy danh sách thành viên thành công",
  "data": [...]
}
```

**Test 4: Truy cập với token hết hạn → 401**

```http
GET http://localhost:3000/users/thanhvien
Authorization: Bearer <expired_token>

Response:
{
  "message": "jwt expired",
  "status": 401
}
```

---

### Bước 4: Cập nhật Frontend (nếu có)

#### 4.1. Thay đổi Base URLs

**TRƯỚC ĐÂY**:
```javascript
// frontend/src/api/thanhvien.js
const BASE_URL = 'http://localhost:3000/thanhvien';
```

**SAU KHI SỬA**:
```javascript
// frontend/src/api/thanhvien.js
const BASE_URL = 'http://localhost:3000/users/thanhvien';
```

**Áp dụng tương tự cho**:
- `/thanhtich` → `/users/thanhtich`
- `/ketthuc` → `/users/ketthuc`

#### 4.2. Đảm bảo gửi JWT Token

**Ví dụ với Axios**:

```javascript
// Lưu token sau khi login
localStorage.setItem('access_token', response.data.access_token);

// Gửi request với token
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor: Tự động thêm token vào mọi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: Handle 401 (token hết hạn)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Xóa token và redirect về login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Sử dụng
api.get('/users/thanhvien')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

---

## 📝 CÁCH 2: MERGE ROUTER (TÙY CHỌN)

**Lưu ý**: Cách này phức tạp hơn nhưng tất cả routes sẽ ở trong 1 file duy nhất.

### Bước 1: Tạo file `src/routes/users.routes.ts` mới

**XÓA NỘI DUNG CŨ** và thay bằng:

```typescript
import { Router } from 'express';

// Users controllers
import {
  registerController,
  loginController,
  logoutController
} from '~/controllers/users.controllers';

// Thanhvien controllers
import {
  registerController as registerThanhVienController,
  getAllThanhVienController,
  getThanhVienByMaTVController,
  updateThanhVienController,
  deleteThanhVienController,
  getBaoCaoTangGiamController,
  ghiNhanThanhVienController,
  getAvailableRelationsController,
  traCuuThanhVienController
} from '~/controllers/thanhvien.controllers';

// Thanhtich controllers
import {
  getLoaiThanhTichController,
  ghiNhanThanhTichController,
  traCuuThanhTichController,
  getThanhTichByHoTenController,
  xoaThanhTichController,
  capNhatThanhTichController,
  getBaoCaoThanhTichController
} from '~/controllers/thanhtich.controllers';

// Ketthuc controllers
import {
  ghiNhanKetThucController,
  traCuuKetThucController,
  getChiTietKetThucController,
  capNhatKetThucController,
  xoaKetThucController
} from '~/controllers/ketthuc.controllers';

// Middlewares
import {
  registerValidator,
  loginValidator,
  accessTokenValidator,
  refreshTokenValidator
} from '~/middlewares/users.middlewares';

import { wrapAsync } from '~/utils/handlers';

const usersRouter = Router();

// ========================================
// AUTHENTICATION ROUTES (KHÔNG CẦN TOKEN)
// ========================================

/**
 * POST /users/register - Đăng ký tài khoản
 */
usersRouter.post('/register', registerValidator, wrapAsync(registerController));

/**
 * POST /users/login - Đăng nhập
 */
usersRouter.post('/login', loginValidator, wrapAsync(loginController));

/**
 * POST /users/logout - Đăng xuất (CẦN TOKEN)
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController));

// ========================================
// PROTECTED ROUTES - THANHVIEN
// (Tất cả routes dưới đây CẦN accessToken)
// ========================================

/**
 * POST /users/thanhvien/register - Đăng ký thành viên mới
 */
usersRouter.post('/thanhvien/register', accessTokenValidator, wrapAsync(registerThanhVienController));

/**
 * POST /users/thanhvien/ghi-nhan - Ghi nhận thành viên
 */
usersRouter.post('/thanhvien/ghi-nhan', accessTokenValidator, wrapAsync(ghiNhanThanhVienController));

/**
 * GET /users/thanhvien/available-relations - Lấy các quan hệ khả dụng
 */
usersRouter.get('/thanhvien/available-relations', accessTokenValidator, wrapAsync(getAvailableRelationsController));

/**
 * GET /users/thanhvien/tra-cuu - Tra cứu thành viên
 */
usersRouter.get('/thanhvien/tra-cuu', accessTokenValidator, wrapAsync(traCuuThanhVienController));

/**
 * GET /users/thanhvien/baocao - Báo cáo tăng giảm
 */
usersRouter.get('/thanhvien/baocao', accessTokenValidator, wrapAsync(getBaoCaoTangGiamController));

/**
 * GET /users/thanhvien - Lấy tất cả thành viên
 */
usersRouter.get('/thanhvien', accessTokenValidator, wrapAsync(getAllThanhVienController));

/**
 * GET /users/thanhvien/:MaTV - Lấy thành viên theo MaTV
 */
usersRouter.get('/thanhvien/:MaTV', accessTokenValidator, wrapAsync(getThanhVienByMaTVController));

/**
 * PUT /users/thanhvien/:MaTV - Cập nhật thành viên
 */
usersRouter.put('/thanhvien/:MaTV', accessTokenValidator, wrapAsync(updateThanhVienController));

/**
 * DELETE /users/thanhvien/:MaTV - Xóa thành viên
 */
usersRouter.delete('/thanhvien/:MaTV', accessTokenValidator, wrapAsync(deleteThanhVienController));

// ========================================
// PROTECTED ROUTES - THANHTICH
// ========================================

/**
 * GET /users/thanhtich/loai - Lấy loại thành tích
 */
usersRouter.get('/thanhtich/loai', accessTokenValidator, wrapAsync(getLoaiThanhTichController));

/**
 * POST /users/thanhtich/ghinhan - Ghi nhận thành tích
 */
usersRouter.post('/thanhtich/ghinhan', accessTokenValidator, wrapAsync(ghiNhanThanhTichController));

/**
 * GET /users/thanhtich/tracuu - Tra cứu thành tích
 */
usersRouter.get('/thanhtich/tracuu', accessTokenValidator, wrapAsync(traCuuThanhTichController));

/**
 * GET /users/thanhtich/thanhvien - Lấy thành tích theo tên
 */
usersRouter.get('/thanhtich/thanhvien', accessTokenValidator, wrapAsync(getThanhTichByHoTenController));

/**
 * GET /users/thanhtich/baocao - Báo cáo thành tích
 */
usersRouter.get('/thanhtich/baocao', accessTokenValidator, wrapAsync(getBaoCaoThanhTichController));

/**
 * PUT /users/thanhtich/capnhat - Cập nhật thành tích
 */
usersRouter.put('/thanhtich/capnhat', accessTokenValidator, wrapAsync(capNhatThanhTichController));

/**
 * DELETE /users/thanhtich/xoa - Xóa thành tích
 */
usersRouter.delete('/thanhtich/xoa', accessTokenValidator, wrapAsync(xoaThanhTichController));

// ========================================
// PROTECTED ROUTES - KETTHUC
// ========================================

/**
 * POST /users/ketthuc/ghinhan - Ghi nhận kết thúc
 */
usersRouter.post('/ketthuc/ghinhan', accessTokenValidator, wrapAsync(ghiNhanKetThucController));

/**
 * GET /users/ketthuc/tracuu - Tra cứu kết thúc
 */
usersRouter.get('/ketthuc/tracuu', accessTokenValidator, wrapAsync(traCuuKetThucController));

/**
 * GET /users/ketthuc/:MaTV - Xem chi tiết kết thúc
 */
usersRouter.get('/ketthuc/:MaTV', accessTokenValidator, wrapAsync(getChiTietKetThucController));

/**
 * PUT /users/ketthuc/:MaTV - Cập nhật kết thúc
 */
usersRouter.put('/ketthuc/:MaTV', accessTokenValidator, wrapAsync(capNhatKetThucController));

/**
 * DELETE /users/ketthuc/:MaTV - Xóa kết thúc
 */
usersRouter.delete('/ketthuc/:MaTV', accessTokenValidator, wrapAsync(xoaKetThucController));

export default usersRouter;
```

### Bước 2: Sửa file `src/index.ts`

**Giống như Cách 1 - Bước 2.2**

### Bước 3: (Tùy chọn) Xóa các file routes cũ

Nếu đã merge tất cả vào `users.routes.ts`, có thể xóa:
- `src/routes/thanhvien.routes.ts`
- `src/routes/thanhtich.routes.ts`
- `src/routes/ketthuc.routes.ts`

**Lưu ý**: NÊN GIỮ LẠI để backup

---

## ⚡ SO SÁNH 2 CÁCH

| Tiêu chí | Cách 1: Nest Router | Cách 2: Merge Router |
|----------|---------------------|----------------------|
| **Độ phức tạp** | ⭐ Đơn giản | ⭐⭐ Phức tạp hơn |
| **Thay đổi code** | Ít (chỉ thêm middleware) | Nhiều (rewrite toàn bộ) |
| **Tính module** | ⭐⭐⭐ Cao (giữ nguyên cấu trúc) | ⭐ Thấp (gộp vào 1 file) |
| **Dễ rollback** | ⭐⭐⭐ Rất dễ | ⭐ Khó |
| **Performance** | Giống nhau | Giống nhau |
| **Khuyến nghị** | ✅ **Khuyến nghị** | ⚠️ Chỉ dùng khi cần |

---

## 🔐 GIẢI THÍCH FLOW AUTHENTICATION

### Flow khi User sử dụng API

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. POST /users/login
       │    Body: { email, password }
       ▼
┌─────────────────────┐
│   Login Controller  │
│  - Verify password  │
│  - Generate tokens  │
└──────┬──────────────┘
       │
       │ 2. Response: { access_token, refresh_token }
       ▼
┌─────────────┐
│   Client    │
│  Lưu token  │
│  vào local  │
│   storage   │
└──────┬──────┘
       │
       │ 3. GET /users/thanhvien
       │    Headers: { Authorization: Bearer <token> }
       ▼
┌──────────────────────┐
│ accessTokenValidator │
│  Middleware          │
│  - Check token       │
│  - Verify signature  │
│  - Check expiration  │
└──────┬───────────────┘
       │
       ├─── Token hợp lệ ───▶ 4a. Forward to Controller
       │                           └──▶ Return data (200)
       │
       └─── Token không hợp lệ ──▶ 4b. Throw error
                                       └──▶ Return 401 Unauthorized
```

### Token Expiration Flow

```
Access Token hết hạn sau: 15 phút (mặc định)
Refresh Token hết hạn sau: 7 ngày (mặc định)

Timeline:
0 min   ────────────────────────────────────────▶
        Login                       Access Token
        │                           expires (15 min)
        │                           │
        ▼                           ▼
        [Access: OK]                [Access: 401]
        [Refresh: OK]               [Refresh: OK]
                                    │
                                    ├─ Option 1: Call /refresh để lấy token mới
                                    │
                                    └─ Option 2: Redirect về /login
```

### Khi nào JWT hết hạn?

**Tình huống 1: Access Token hết hạn**
```
Client: GET /users/thanhvien
        Authorization: Bearer <expired_access_token>

Server: 401 Unauthorized
        { message: "jwt expired" }

Action: Frontend cần:
        - Dùng refresh_token để lấy access_token mới
        HOẶC
        - Redirect user về trang login
```

**Tình huống 2: Refresh Token hết hạn**
```
Client: POST /users/refresh
        Body: { refresh_token: <expired_refresh_token> }

Server: 401 Unauthorized
        { message: "Refresh token đã hết hạn" }

Action: Frontend PHẢI redirect về trang login
```

---

## 🧪 CHECKLIST KIỂM TRA

### ✅ Backend Changes

- [ ] **File `src/routes/thanhvien.routes.ts`**
  - [ ] Import `wrapAsync` từ `~/utils/handlers`
  - [ ] Wrap tất cả controllers bằng `wrapAsync()`
  - [ ] ❌ KHÔNG thêm `accessTokenValidator` ở đây (sẽ thêm khi nest)

- [ ] **File `src/routes/thanhtich.routes.ts`**
  - [ ] Import `wrapAsync`
  - [ ] Wrap tất cả controllers bằng `wrapAsync()`
  - [ ] ❌ KHÔNG thêm `accessTokenValidator` ở đây

- [ ] **File `src/routes/ketthuc.routes.ts`**
  - [ ] Import `wrapAsync`
  - [ ] Wrap tất cả controllers bằng `wrapAsync()`
  - [ ] ❌ KHÔNG thêm `accessTokenValidator` ở đây

- [ ] **File `src/routes/users.routes.ts`**
  - [ ] Import `thanhvienRouter`, `thanhTichRouter`, `ketthucRouter`
  - [ ] ✅ Thêm `usersRouter.use('/thanhvien', accessTokenValidator, thanhvienRouter);`
  - [ ] ✅ Thêm `usersRouter.use('/thanhtich', accessTokenValidator, thanhTichRouter);`
  - [ ] ✅ Thêm `usersRouter.use('/ketthuc', accessTokenValidator, ketthucRouter);`
  - [ ] ⚠️ CHÚ Ý: `accessTokenValidator` đặt GIỮA path và router

- [ ] **File `src/index.ts`**
  - [ ] Xóa import `thanhvienRouter`, `thanhTichRouter`, `ketthucRouter`
  - [ ] Xóa `app.use('/thanhvien', thanhvienRouter);`
  - [ ] Xóa `app.use('/thanhtich', thanhTichRouter);`
  - [ ] Xóa `app.use('/ketthuc', ketthucRouter);`
  - [ ] Chỉ giữ lại `app.use('/users', usersRouter);`

### ✅ Testing

- [ ] **Server khởi động thành công**
  - [ ] Không có lỗi compile/syntax
  - [ ] Console log hiển thị "Server đang chạy..."

- [ ] **Test Authentication**
  - [ ] POST `/users/login` với credentials hợp lệ → 200 + tokens
  - [ ] POST `/users/login` với credentials sai → 401

- [ ] **Test Protected Routes - KHÔNG có token**
  - [ ] GET `/users/thanhvien` → 401 "Access token is required"
  - [ ] GET `/users/thanhtich/loai` → 401
  - [ ] GET `/users/ketthuc/tracuu` → 401

- [ ] **Test Protected Routes - CÓ token hợp lệ**
  - [ ] GET `/users/thanhvien` + Bearer token → 200 + data
  - [ ] POST `/users/thanhvien/register` + Bearer token → 200/201
  - [ ] GET `/users/thanhtich/loai` + Bearer token → 200 + data
  - [ ] POST `/users/thanhtich/ghinhan` + Bearer token → 200/201
  - [ ] GET `/users/ketthuc/tracuu` + Bearer token → 200 + data

- [ ] **Test Token Expiration**
  - [ ] Đợi token hết hạn (hoặc sửa expiry thành 10s để test)
  - [ ] Gọi API với token hết hạn → 401 "jwt expired"

### ✅ Frontend Changes (nếu có)

- [ ] **Update API base URLs**
  - [ ] `/thanhvien` → `/users/thanhvien`
  - [ ] `/thanhtich` → `/users/thanhtich`
  - [ ] `/ketthuc` → `/users/ketthuc`

- [ ] **Implement token management**
  - [ ] Lưu `access_token` sau khi login
  - [ ] Tự động gửi `Authorization: Bearer <token>` trong mọi request
  - [ ] Handle 401 response → redirect về login

- [ ] **Test UI flows**
  - [ ] Login → Lấy token → Gọi API thành công
  - [ ] Không login → Gọi API → Nhận 401
  - [ ] Token hết hạn → Gọi API → Nhận 401 → Redirect login

---

## ❗ VẤN ĐỀ BẠN GẶP PHẢI

### 🔍 Phân tích vấn đề

Bạn đã làm đúng cách:
```typescript
// ✅ Đúng trong users.routes.ts
usersRouter.use('/thanhvien', accessTokenValidator, thanhvienRouter);
usersRouter.use('/thanhtich', accessTokenValidator, thanhTichRouter);
usersRouter.use('/ketthuc', accessTokenValidator, ketthucRouter);

// ✅ Đúng trong index.ts - đã comment/xóa
// app.use('/thanhvien', thanhvienRouter);
// app.use('/thanhtich', thanhTichRouter);
// app.use('/ketthuc', ketthucRouter);
```

**Nhưng thiếu 1 điều QUAN TRỌNG**: Các controllers trong routes con PHẢI được wrap bằng `wrapAsync()`

### ❌ Nguyên nhân lỗi

Trong các file routes con (`thanhvien.routes.ts`, `thanhtich.routes.ts`, `ketthuc.routes.ts`), bạn có:

```typescript
// ❌ SAI - Không wrap
thanhvienRouter.get('/', getAllThanhVienController);
thanhvienRouter.post('/ghi-nhan', ghiNhanThanhVienController);
```

Khi controller là async function và throw error, Express KHÔNG TỰ ĐỘNG catch được. Kết quả:
- Request bị "hang" không response
- Hoặc server crash
- Hoặc trả về lỗi 500 không rõ ràng

### ✅ Giải pháp

Wrap TẤT CẢ controllers bằng `wrapAsync()`:

```typescript
// ✅ ĐÚNG
import { wrapAsync } from '~/utils/handlers';

thanhvienRouter.get('/', wrapAsync(getAllThanhVienController));
thanhvienRouter.post('/ghi-nhan', wrapAsync(ghiNhanThanhVienController));
```

Tôi đã sửa tất cả các file routes cho bạn rồi!

---

## ❗ NHỮNG LỖI THƯỜNG GẶP VÀ CÁCH XỬ LÝ

### Lỗi 1: "Cannot GET /users/thanhvien" hoặc 404

**Nguyên nhân**: 
- Thiếu `wrapAsync` wrapper cho controllers
- Routes chưa được đăng ký đúng

**Giải pháp**:
```typescript
// ❌ SAI
thanhvienRouter.get('/', getAllThanhVienController);

// ✅ ĐÚNG
thanhvienRouter.get('/', wrapAsync(getAllThanhVienController));
```

---

### Lỗi 2: "wrapAsync is not a function"

**Nguyên nhân**: Chưa import `wrapAsync`

**Giải pháp**:
```typescript
// Thêm vào đầu file
import { wrapAsync } from '~/utils/handlers';

// Sử dụng
thanhvienRouter.get('/', wrapAsync(getAllThanhVienController));
```

### Lỗi 3: "Access token is required" ngay cả khi đã gửi token

**Nguyên nhân**: 
- Token không đúng format `Bearer <token>`
- Token bị sai chỗ (gửi trong body thay vì header)

**Giải pháp**:
```javascript
// ❌ SAI
fetch('/users/thanhvien', {
  headers: {
    'Authorization': 'eyJhbGci...' // Thiếu "Bearer "
  }
});

// ✅ ĐÚNG
fetch('/users/thanhvien', {
  headers: {
    'Authorization': `Bearer ${token}` // Có "Bearer "
  }
});
```

### Lỗi 4: "jwt malformed" hoặc "invalid signature"

**Nguyên nhân**:
- Token bị sai format
- Secret key không khớp
- Token bị corrupt

**Giải pháp**:
1. Kiểm tra `.env` có đúng `JWT_SECRET_ACCESS_TOKEN` không
2. Login lại để lấy token mới
3. Đảm bảo không trim/modify token khi lưu

### Lỗi 5: Routes trả về 404

**Nguyên nhân**: Thứ tự routes không đúng

**Giải pháp**:
```typescript
// ❌ SAI - Routes cụ thể sau routes có param
thanhvienRouter.get('/:MaTV', ...);
thanhvienRouter.get('/baocao', ...); // ← Sẽ match với /:MaTV

// ✅ ĐÚNG - Routes cụ thể trước routes có param
thanhvienRouter.get('/baocao', ...);
thanhvienRouter.get('/:MaTV', ...);
```

### Lỗi 6: CORS error khi gửi Authorization header

**Nguyên nhân**: CORS chưa allow header `Authorization`

**Giải pháp**: Trong `src/index.ts`:
```typescript
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'] // ✅ Đã có
}));
```

---

## 📚 TÀI LIỆU THAM KHẢO

### Express Router Nesting
- https://expressjs.com/en/guide/routing.html#express-router

### JWT Best Practices
- https://jwt.io/introduction
- https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/

### Middleware trong Express
- https://expressjs.com/en/guide/using-middleware.html
- https://expressjs.com/en/guide/writing-middleware.html

---

## 🎯 KẾT LUẬN

### Thay đổi chính:

1. **Authentication Middleware**: Tất cả routes `/thanhvien`, `/thanhtich`, `/ketthuc` đều phải qua `accessTokenValidator`

2. **URL Structure**: 
   - Trước: `/thanhvien`, `/thanhtich`, `/ketthuc`
   - Sau: `/users/thanhvien`, `/users/thanhtich`, `/users/ketthuc`

3. **Security**: 
   - ✅ Không thể truy cập API nếu không đăng nhập
   - ✅ JWT hết hạn → Tự động reject request
   - ✅ Tất cả requests đều được verify

4. **Database**: 
   - ✅ KHÔNG CẦN THAY ĐỔI GÌ
   - ✅ Cấu trúc authentication đã sẵn sàng

### Lợi ích:

- 🔒 **Bảo mật cao**: Mọi API đều cần authentication
- 🎯 **Rõ ràng**: Tất cả protected routes đều dưới `/users`
- 🧩 **Module**: Giữ nguyên cấu trúc file hiện tại
- 🚀 **Dễ maintain**: Thêm middleware ở 1 chỗ, apply cho tất cả routes

### Khuyến nghị:

**SỬ DỤNG CÁCH 1 (Nest Router)** vì:
- Ít thay đổi code
- Dễ rollback
- Giữ nguyên cấu trúc module
- Dễ bảo trì về sau

---

## 📞 SUPPORT

Nếu gặp vấn đề, kiểm tra theo thứ tự:

1. ✅ Server khởi động thành công?
2. ✅ Đã login và lấy được token?
3. ✅ Token được gửi đúng format `Bearer <token>`?
4. ✅ URL đã đổi từ `/thanhvien` → `/users/thanhvien`?
5. ✅ CORS đã allow header `Authorization`?

**Vẫn lỗi?** → Check console logs và kiểm tra error message cụ thể.

---

**Ngày tạo**: 22/12/2025  
**Phiên bản**: 1.0  
**Tác giả**: GitHub Copilot  
**Trạng thái**: ✅ Ready to implement
