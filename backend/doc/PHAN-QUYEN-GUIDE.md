# HƯỚNG DẪN IMPLEMENT PHÂN QUYỀN HỆ THỐNG

## 📋 TỔNG QUAN

Tài liệu này hướng dẫn chi tiết cách implement hệ thống phân quyền với 3 vai trò:
- **Admin (LTK01)**: Quản trị viên hệ thống
- **Owner (LTK02)**: Người lập cây gia phả (Trưởng tộc)
- **User (LTK03)**: Thành viên thường

---

## 🗄️ PHÂN TÍCH CƠ SỞ DỮ LIỆU HIỆN TẠI

### 1. Bảng LOAITAIKHOAN (Loại tài khoản)
```sql
CREATE TABLE LOAITAIKHOAN(
	MaLoaiTK VARCHAR(5) PRIMARY KEY,
	TenLoaiTK VARCHAR(50)
);

-- Dữ liệu đã có
INSERT INTO LOAITAIKHOAN (MaLoaiTK, TenLoaiTK) VALUES
('LTK01', 'Admin'),
('LTK02', 'TruongToc'),  -- Owner
('LTK03', 'User');
```

### 2. Bảng TAIKHOAN (Tài khoản)
```sql
CREATE TABLE TAIKHOAN(
	TenDangNhap VARCHAR(50) PRIMARY KEY,
	MaTV VARCHAR(5),
	MatKhau VARCHAR(100),
	MaLoaiTK VARCHAR(5),  -- ✅ Đã có cột phân loại tài khoản
	TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV) ON DELETE CASCADE,
	FOREIGN KEY(MaLoaiTK) REFERENCES LOAITAIKHOAN(MaLoaiTK)
);
```

### 3. Bảng CAYGIAPHA (Gia phả)
```sql
CREATE TABLE CAYGIAPHA(
	MaGiaPha VARCHAR(5) PRIMARY KEY,
	TenGiaPha VARCHAR(35),
	NguoiLap VARCHAR(20),      -- MaTV của người lập (Owner)
	TGLap TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
	TruongToc VARCHAR(20),     -- MaTV của trưởng tộc (Owner)
	FOREIGN KEY(NguoiLap) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(TruongToc) REFERENCES THANHVIEN(MaTV)
);
```

### 4. Bảng THANHVIEN (Thành viên)
```sql
CREATE TABLE THANHVIEN (
    MaTV VARCHAR(5) PRIMARY KEY,
    HoTen VARCHAR(50),
    MaGiaPha VARCHAR(5),  -- ✅ Liên kết thành viên với gia phả
    -- ... các cột khác
    FOREIGN KEY(MaGiaPha) REFERENCES CAYGIAPHA(MaGiaPha)
);
```

---

## 🎯 YÊU CẦU PHÂN QUYỀN CHI TIẾT

### 1. QUYỀN QUẢN LÝ THÀNH VIÊN

#### Admin (LTK01)
- ✅ Có toàn quyền thêm, xóa, sửa **MỌI** thành viên từ **MỌI** gia phả
- ✅ Không bị giới hạn bởi MaGiaPha

#### Owner/TruongToc (LTK02)
- ✅ Có toàn quyền thêm, xóa, sửa thành viên **TRONG GIA PHẢ CỦA MÌNH**
- ⚠️ Kiểm tra: `THANHVIEN.MaGiaPha = CAYGIAPHA.MaGiaPha` (Owner là TruongToc hoặc NguoiLap)

#### User (LTK03)
- ✅ Chỉ được **SỬA** thông tin cá nhân của **CHÍNH MÌNH**
- ⚠️ Kiểm tra: `TAIKHOAN.MaTV = MaTV_được_sửa`
- ❌ **KHÔNG** được thêm/xóa thành viên
- ❌ **KHÔNG** được sửa thành viên khác

---

### 2. QUYỀN TRA CỨU THÀNH VIÊN

#### Admin (LTK01)
- ✅ Tra cứu **MỌI** thành viên từ **TẤT CẢ** các gia phả
- ✅ Không có giới hạn MaGiaPha

#### Owner/TruongToc (LTK02)
- ✅ Tra cứu **MỌI** thành viên **TRONG GIA PHẠ CỦA MÌNH**
- ⚠️ Kiểm tra: `THANHVIEN.MaGiaPha = (MaGiaPha của Owner)`

#### User (LTK03)
- ✅ Tra cứu **MỌI** thành viên **TRONG GIA PHẠ CỦA MÌNH**
- ⚠️ Kiểm tra: `THANHVIEN.MaGiaPha = (MaGiaPha của User)`

---

### 3. QUYỀN BÁO CÁO GHI NHẬN THÀNH VIÊN

#### Admin (LTK01)
- ✅ Lập báo cáo năm cho **MỌI** gia phả
- ✅ Có thể xem báo cáo tăng giảm thành viên của tất cả gia phả

#### Owner/TruongToc (LTK02)
- ✅ Lập báo cáo năm **TRONG GIA PHẠ CỦA MÌNH**
- ⚠️ Chỉ xem báo cáo thành viên thuộc MaGiaPha của mình

#### User (LTK03)
- ✅ Lập báo cáo năm **TRONG GIA PHẠ CỦA MÌNH**
- ⚠️ Chỉ xem báo cáo thành viên thuộc MaGiaPha của mình

---

## 🔧 IMPLEMENTATION GUIDE

### BƯỚC 1: Tạo Middleware Kiểm Tra Quyền

Tạo file: `backend/src/middlewares/authorization.middlewares.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ErrorWithStatus } from '~/models/Errors';
import HTTP_STATUS from '~/constants/httpStatus';
import databaseService from '~/services/database.services';
import { RowDataPacket } from 'mysql2';
import { TokenPayload } from '~/models/requests/User.requests';

// Interface cho thông tin tài khoản
interface TaiKhoanInfo extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MaLoaiTK: string;
  MaGiaPha: string | null;
}

/**
 * Lấy thông tin tài khoản và gia phả của user từ token
 */
const getUserInfo = async (user_id: string): Promise<TaiKhoanInfo> => {
  const sql = `
    SELECT 
      tk.TenDangNhap,
      tk.MaTV,
      tk.MaLoaiTK,
      tv.MaGiaPha
    FROM TAIKHOAN tk
    LEFT JOIN THANHVIEN tv ON tk.MaTV = tv.MaTV
    WHERE tk.TenDangNhap = ?
  `;
  
  const [rows] = await databaseService.query<TaiKhoanInfo[]>(sql, [user_id]);
  
  if (rows.length === 0) {
    throw new ErrorWithStatus({
      message: 'Không tìm thấy thông tin tài khoản',
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
  
  return rows[0];
};

/**
 * Kiểm tra user có phải Admin không
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    
    if (userInfo.MaLoaiTK !== 'LTK01') {
      throw new ErrorWithStatus({
        message: 'Chỉ Admin mới có quyền thực hiện hành động này',
        status: HTTP_STATUS.FORBIDDEN
      });
    }
    
    // Gán thông tin user vào request để controller sử dụng
    req.userInfo = userInfo;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Kiểm tra user có phải Admin hoặc Owner không
 */
export const requireAdminOrOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // Owner (TruongToc)
    if (userInfo.MaLoaiTK === 'LTK02') {
      req.userInfo = userInfo;
      return next();
    }
    
    throw new ErrorWithStatus({
      message: 'Chỉ Admin hoặc Trưởng tộc mới có quyền thực hiện hành động này',
      status: HTTP_STATUS.FORBIDDEN
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kiểm tra quyền sửa thành viên
 * - Admin: sửa được tất cả
 * - Owner: sửa được thành viên trong gia phả
 * - User: chỉ sửa được chính mình
 */
export const checkUpdateMemberPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.params;  // MaTV của thành viên cần sửa
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // Lấy thông tin thành viên cần sửa
    const [memberRows] = await databaseService.query<RowDataPacket[]>(
      'SELECT MaTV, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
      [MaTV]
    );
    
    if (memberRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy thành viên',
        status: HTTP_STATUS.NOT_FOUND
      });
    }
    
    const memberInfo = memberRows[0];
    
    // Owner: chỉ sửa được thành viên trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02') {
      if (memberInfo.MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền sửa thành viên trong gia phả của mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      req.userInfo = userInfo;
      return next();
    }
    
    // User: chỉ sửa được chính mình
    if (userInfo.MaLoaiTK === 'LTK03') {
      if (userInfo.MaTV !== MaTV) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền sửa thông tin cá nhân của chính mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      req.userInfo = userInfo;
      return next();
    }
    
    throw new ErrorWithStatus({
      message: 'Không có quyền truy cập',
      status: HTTP_STATUS.FORBIDDEN
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kiểm tra quyền xóa thành viên
 * - Admin: xóa được tất cả
 * - Owner: xóa được thành viên trong gia phả
 * - User: KHÔNG có quyền xóa
 */
export const checkDeleteMemberPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.params;
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // User không có quyền xóa
    if (userInfo.MaLoaiTK === 'LTK03') {
      throw new ErrorWithStatus({
        message: 'Bạn không có quyền xóa thành viên',
        status: HTTP_STATUS.FORBIDDEN
      });
    }
    
    // Owner: chỉ xóa được thành viên trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02') {
      const [memberRows] = await databaseService.query<RowDataPacket[]>(
        'SELECT MaTV, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
        [MaTV]
      );
      
      if (memberRows.length === 0) {
        throw new ErrorWithStatus({
          message: 'Không tìm thấy thành viên',
          status: HTTP_STATUS.NOT_FOUND
        });
      }
      
      if (memberRows[0].MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền xóa thành viên trong gia phả của mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      req.userInfo = userInfo;
      return next();
    }
    
    throw new ErrorWithStatus({
      message: 'Không có quyền truy cập',
      status: HTTP_STATUS.FORBIDDEN
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Filter kết quả tra cứu theo quyền
 * - Admin: xem tất cả
 * - Owner/User: chỉ xem trong gia phả
 */
export const attachUserInfoMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    
    // Gán thông tin user vào request
    req.userInfo = userInfo;
    next();
  } catch (error) {
    next(error);
  }
};
```

---

### BƯỚC 2: Cập Nhật Type Definitions

Cập nhật file: `backend/src/type.d.ts`

```typescript
import { TokenPayload } from './models/requests/User.requests';

declare module 'express-serve-static-core' {
  interface Request {
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;
    userInfo?: {
      TenDangNhap: string;
      MaTV: string;
      MaLoaiTK: string;
      MaGiaPha: string | null;
    };
  }
}
```

---

### BƯỚC 3: Cập Nhật Routes Với Middleware Phân Quyền

#### 3.1. Routes Thành Viên

Cập nhật file: `backend/src/routes/thanhvien.routes.ts`

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
  traCuuThanhVienController,
  xoaMaGiaPhaController,
  capNhatMaGiaPhaController,
  getGiaPhaThanhVienController,
  getAllGiaPhaController
} from '~/controllers/thanhvien.controllers';
import { wrapAsync } from '~/utils/handlers';
import { 
  requireAdminOrOwner, 
  checkUpdateMemberPermission, 
  checkDeleteMemberPermission,
  attachUserInfoMiddleware
} from '~/middlewares/authorization.middlewares';

const thanhvienRouter = Router();

// ========================================
// ROUTES CÔNG KHAI / ĐĂNG KÝ
// ========================================

// POST /thanhvien/register - Đăng ký thành viên mới (cần quyền Admin hoặc Owner)
thanhvienRouter.post('/register', requireAdminOrOwner, wrapAsync(registerController));

// ========================================
// ROUTES CẦN PHÂN QUYỀN
// ========================================

// POST /thanhvien/ghi-nhan - Ghi nhận thành viên (Admin/Owner trong gia phả)
thanhvienRouter.post('/ghi-nhan', requireAdminOrOwner, wrapAsync(ghiNhanThanhVienController));

// GET /thanhvien/available-relations - Lấy danh sách quan hệ khả dụng
thanhvienRouter.get('/available-relations', attachUserInfoMiddleware, wrapAsync(getAvailableRelationsController));

// GET /thanhvien/tra-cuu - Tra cứu thành viên (Admin: all, Owner/User: trong gia phả)
thanhvienRouter.get('/tra-cuu', attachUserInfoMiddleware, wrapAsync(traCuuThanhVienController));

// GET /thanhvien/baocao - Báo cáo tăng giảm (Admin: all, Owner/User: trong gia phả)
thanhvienRouter.get('/baocao', attachUserInfoMiddleware, wrapAsync(getBaoCaoTangGiamController));

// GET /thanhvien/gia-pha/danh-sach - Lấy danh sách gia phả (Admin: all, Owner/User: của mình)
thanhvienRouter.get('/gia-pha/danh-sach', attachUserInfoMiddleware, wrapAsync(getAllGiaPhaController));

// GET /thanhvien - Lấy tất cả thành viên (Admin: all, Owner/User: trong gia phả)
thanhvienRouter.get('/', attachUserInfoMiddleware, wrapAsync(getAllThanhVienController));

// GET /thanhvien/:MaTV - Lấy thông tin 1 thành viên (Admin: all, Owner/User: trong gia phả)
thanhvienRouter.get('/:MaTV', attachUserInfoMiddleware, wrapAsync(getThanhVienByMaTVController));

// PUT /thanhvien/:MaTV - Cập nhật thành viên (kiểm tra quyền chi tiết)
thanhvienRouter.put('/:MaTV', checkUpdateMemberPermission, wrapAsync(updateThanhVienController));

// DELETE /thanhvien/:MaTV - Xóa thành viên (Admin/Owner trong gia phả, User không được)
thanhvienRouter.delete('/:MaTV', checkDeleteMemberPermission, wrapAsync(deleteThanhVienController));

// GET /thanhvien/:MaTV/gia-pha - Lấy gia phả của thành viên
thanhvienRouter.get('/:MaTV/gia-pha', attachUserInfoMiddleware, wrapAsync(getGiaPhaThanhVienController));

// PATCH /thanhvien/:MaTV/gia-pha - Cập nhật gia phả (Admin/Owner)
thanhvienRouter.patch('/:MaTV/gia-pha', requireAdminOrOwner, wrapAsync(capNhatMaGiaPhaController));

// DELETE /thanhvien/:MaTV/gia-pha - Xóa khỏi gia phả (Admin/Owner)
thanhvienRouter.delete('/:MaTV/gia-pha', requireAdminOrOwner, wrapAsync(xoaMaGiaPhaController));

export default thanhvienRouter;
```

---

### BƯỚC 4: Cập Nhật Controllers Và Services

#### 4.1. Cập Nhật Controller Tra Cứu Thành Viên

Cập nhật trong file: `backend/src/controllers/thanhvien.controllers.ts`

```typescript
// Controller tra cứu thành viên (có phân quyền)
export const traCuuThanhVienController = async (req: Request, res: Response) => {
  const { HoTen, GioiTinh, Doi, NamSinh } = req.query as unknown as TraCuuThanhVienQuery;
  const userInfo = req.userInfo!;  // Đã được gán bởi middleware

  try {
    const result = await thanhvienService.traCuuThanhVien(
      { HoTen, GioiTinh, Doi, NamSinh },
      userInfo  // Truyền thông tin user vào service
    );

    return res.status(200).json({
      message: 'Tra cứu thành công',
      result: result
    });
  } catch (error: any) {
    console.error('Lỗi traCuuThanhVien:', error);
    return res.status(400).json({
      message: 'Tra cứu thất bại',
      error: error.message
    });
  }
};
```

#### 4.2. Cập Nhật Service Tra Cứu Thành Viên

Cập nhật trong file: `backend/src/services/thanhvien.services.ts`

```typescript
/**
 * Tra cứu thành viên với phân quyền
 * - Admin: Tra cứu tất cả thành viên
 * - Owner/User: Chỉ tra cứu trong gia phả của mình
 */
async traCuuThanhVien(
  query: TraCuuThanhVienQuery,
  userInfo: { MaLoaiTK: string; MaGiaPha: string | null }
): Promise<TraCuuThanhVienResponse> {
  const conditions: string[] = [];
  const params: any[] = [];

  // Phân quyền: Nếu không phải Admin, chỉ tra cứu trong gia phả
  if (userInfo.MaLoaiTK !== 'LTK01') {
    if (!userInfo.MaGiaPha) {
      throw new Error('Bạn chưa thuộc gia phả nào');
    }
    conditions.push('tv.MaGiaPha = ?');
    params.push(userInfo.MaGiaPha);
  }

  // Điều kiện tìm kiếm
  if (query.HoTen) {
    conditions.push('tv.HoTen LIKE ?');
    params.push(`%${query.HoTen}%`);
  }

  if (query.GioiTinh) {
    conditions.push('tv.GioiTinh = ?');
    params.push(query.GioiTinh);
  }

  if (query.Doi !== undefined) {
    conditions.push('tv.DOI = ?');
    params.push(query.Doi);
  }

  if (query.NamSinh !== undefined) {
    conditions.push('YEAR(tv.NgayGioSinh) = ?');
    params.push(query.NamSinh);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      tv.MaTV,
      tv.HoTen,
      tv.NgayGioSinh,
      tv.DiaChi,
      tv.TrangThai,
      tv.DOI,
      tv.GioiTinh,
      qq.TenQueQuan,
      nn.TenNgheNghiep,
      gp.TenGiaPha
    FROM THANHVIEN tv
    LEFT JOIN QUEQUAN qq ON tv.MaQueQuan = qq.MaQueQuan
    LEFT JOIN NGHENGHIEP nn ON tv.MaNgheNghiep = nn.MaNgheNghiep
    LEFT JOIN CAYGIAPHA gp ON tv.MaGiaPha = gp.MaGiaPha
    ${whereClause}
    ORDER BY tv.DOI, tv.HoTen
  `;

  const rows = await databaseService.query<RowDataPacket[]>(sql, params);

  return {
    message: 'Tra cứu thành công',
    total: rows.length,
    data: rows as any[]
  };
}
```

#### 4.3. Cập Nhật Controller Lấy Tất Cả Thành Viên

```typescript
// Controller lấy tất cả thành viên (có phân quyền)
export const getAllThanhVienController = async (req: Request, res: Response) => {
  const userInfo = req.userInfo!;

  try {
    const result = await thanhvienService.getAllThanhVien(userInfo);
    return res.status(200).json({
      message: 'Lấy danh sách thành công',
      result: result
    });
  } catch (error: any) {
    console.error('Lỗi getAllThanhVien:', error);
    return res.status(400).json({
      message: 'Lấy danh sách thất bại',
      error: error.message
    });
  }
};
```

#### 4.4. Cập Nhật Service Lấy Tất Cả Thành Viên

```typescript
/**
 * Lấy tất cả thành viên với phân quyền
 * - Admin: Lấy tất cả
 * - Owner/User: Chỉ trong gia phả
 */
async getAllThanhVien(userInfo: { MaLoaiTK: string; MaGiaPha: string | null }) {
  let sql = 'SELECT * FROM THANHVIEN';
  const params: any[] = [];

  // Phân quyền
  if (userInfo.MaLoaiTK !== 'LTK01') {
    if (!userInfo.MaGiaPha) {
      throw new Error('Bạn chưa thuộc gia phả nào');
    }
    sql += ' WHERE MaGiaPha = ?';
    params.push(userInfo.MaGiaPha);
  }

  sql += ' ORDER BY DOI, TGTaoMoi';

  const rows = await databaseService.query<ThanhVienRow[]>(sql, params);
  return rows;
}
```

#### 4.5. Cập Nhật Controller Báo Cáo Tăng Giảm

```typescript
// Controller báo cáo tăng giảm (có phân quyền)
export const getBaoCaoTangGiamController = async (req: Request, res: Response) => {
  const userInfo = req.userInfo!;
  const { NamBatDau, NamKetThuc } = req.query;

  try {
    const result = await thanhvienService.getBaoCaoTangGiam(
      Number(NamBatDau),
      Number(NamKetThuc),
      userInfo
    );

    return res.status(200).json({
      message: 'Lấy báo cáo thành công',
      result: result
    });
  } catch (error: any) {
    console.error('Lỗi getBaoCaoTangGiam:', error);
    return res.status(400).json({
      message: 'Lấy báo cáo thất bại',
      error: error.message
    });
  }
};
```

#### 4.6. Cập Nhật Service Báo Cáo Tăng Giảm

```typescript
/**
 * Lấy báo cáo tăng giảm thành viên với phân quyền
 * - Admin: Báo cáo tất cả gia phả
 * - Owner/User: Chỉ gia phả của mình
 */
async getBaoCaoTangGiam(
  NamBatDau: number, 
  NamKetThuc: number,
  userInfo: { MaLoaiTK: string; MaGiaPha: string | null }
) {
  // Validate
  if (NamBatDau > NamKetThuc) {
    throw new Error('Năm bắt đầu không được lớn hơn năm kết thúc');
  }

  const currentYear = new Date().getFullYear();
  if (NamKetThuc > currentYear) {
    throw new Error(`Năm kết thúc không được vượt quá năm hiện tại (${currentYear})`);
  }

  const conditions: string[] = [];
  const params: any[] = [];

  // Phân quyền
  if (userInfo.MaLoaiTK !== 'LTK01') {
    if (!userInfo.MaGiaPha) {
      throw new Error('Bạn chưa thuộc gia phả nào');
    }
    conditions.push('tv.MaGiaPha = ?');
    params.push(userInfo.MaGiaPha);
  }

  const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

  // Query số sinh
  const sqlSinh = `
    SELECT YEAR(NgayGioSinh) AS Nam, COUNT(*) AS SoLuong
    FROM THANHVIEN tv
    WHERE YEAR(NgayGioSinh) BETWEEN ? AND ?
    ${whereClause}
    GROUP BY YEAR(NgayGioSinh)
  `;

  // Query số kết hôn
  const sqlKetHon = `
    SELECT YEAR(hn.NgayBatDau) AS Nam, COUNT(*) AS SoLuong
    FROM HONNHAN hn
    INNER JOIN THANHVIEN tv ON hn.MaTV = tv.MaTV
    WHERE YEAR(hn.NgayBatDau) BETWEEN ? AND ?
    ${whereClause}
    GROUP BY YEAR(hn.NgayBatDau)
  `;

  // Query số mất
  const sqlMat = `
    SELECT YEAR(NgayGioMat) AS Nam, COUNT(*) AS SoLuong
    FROM THANHVIEN tv
    WHERE NgayGioMat IS NOT NULL 
    AND YEAR(NgayGioMat) BETWEEN ? AND ?
    ${whereClause}
    GROUP BY YEAR(NgayGioMat)
  `;

  // Execute queries
  const paramsSinh = [NamBatDau, NamKetThuc, ...params];
  const paramsKetHon = [NamBatDau, NamKetThuc, ...params];
  const paramsMat = [NamBatDau, NamKetThuc, ...params];

  const [sinhRows] = await databaseService.query<RowDataPacket[]>(sqlSinh, paramsSinh);
  const [ketHonRows] = await databaseService.query<RowDataPacket[]>(sqlKetHon, paramsKetHon);
  const [matRows] = await databaseService.query<RowDataPacket[]>(sqlMat, paramsMat);

  // Tổng hợp kết quả
  const result: any[] = [];
  const years = new Set<number>();

  sinhRows.forEach(row => years.add(row.Nam));
  ketHonRows.forEach(row => years.add(row.Nam));
  matRows.forEach(row => years.add(row.Nam));

  Array.from(years).sort().forEach(year => {
    const sinh = sinhRows.find(r => r.Nam === year)?.SoLuong || 0;
    const ketHon = ketHonRows.find(r => r.Nam === year)?.SoLuong || 0;
    const mat = matRows.find(r => r.Nam === year)?.SoLuong || 0;

    // Chỉ thêm năm có ít nhất 1 sự kiện
    if (sinh > 0 || ketHon > 0 || mat > 0) {
      result.push({
        Nam: year,
        SoSinh: sinh,
        SoKetHon: ketHon,
        SoMat: mat
      });
    }
  });

  return result;
}
```

---

### BƯỚC 5: Cập Nhật Messages

Thêm vào file: `backend/src/constants/messages.ts`

```typescript
// Thêm vào đối tượng USERS_MESSAGES
export const USERS_MESSAGES = {
  // ... các message hiện có
  
  // Messages phân quyền
  ACCESS_DENIED: 'Bạn không có quyền truy cập',
  ADMIN_ONLY: 'Chỉ Admin mới có quyền thực hiện hành động này',
  OWNER_ONLY: 'Chỉ Trưởng tộc mới có quyền thực hiện hành động này',
  ADMIN_OR_OWNER_ONLY: 'Chỉ Admin hoặc Trưởng tộc mới có quyền thực hiện hành động này',
  CANNOT_UPDATE_OTHER_MEMBER: 'Bạn không có quyền sửa thông tin thành viên khác',
  CANNOT_DELETE_MEMBER: 'Bạn không có quyền xóa thành viên',
  CANNOT_VIEW_OTHER_FAMILY: 'Bạn không có quyền xem thông tin gia phả khác',
  NOT_IN_FAMILY: 'Bạn chưa thuộc gia phả nào'
} as const;
```

---

## 🧪 TEST CASES

### 1. Test Quyền Admin

```bash
# Login với tài khoản Admin
POST http://localhost:3000/users/login
Body: {
  "email": "admin@example.com",
  "password": "Admin@123"
}

# Test: Admin xem tất cả thành viên (mọi gia phả)
GET http://localhost:3000/users/thanhvien
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
# ✅ Kết quả: Trả về TẤT CẢ thành viên từ mọi gia phả

# Test: Admin tra cứu bất kỳ thành viên nào
GET http://localhost:3000/users/thanhvien/tra-cuu?HoTen=Nguyễn
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
# ✅ Kết quả: Trả về kết quả từ tất cả gia phả

# Test: Admin sửa bất kỳ thành viên nào
PUT http://localhost:3000/users/thanhvien/TV04
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
Body: {
  "DiaChi": "Địa chỉ mới"
}
# ✅ Kết quả: Cập nhật thành công

# Test: Admin xóa bất kỳ thành viên nào
DELETE http://localhost:3000/users/thanhvien/TV08
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
# ✅ Kết quả: Xóa thành công

# Test: Admin xem báo cáo tất cả gia phả
GET http://localhost:3000/users/thanhvien/baocao?NamBatDau=2020&NamKetThuc=2025
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
# ✅ Kết quả: Báo cáo tất cả gia phả
```

---

### 2. Test Quyền Owner (Trưởng Tộc)

```bash
# Login với tài khoản Owner (giả sử TV02 là trưởng tộc của gia phả GP02)
POST http://localhost:3000/users/login
Body: {
  "email": "owner@example.com",
  "password": "Owner@123"
}

# Test: Owner xem thành viên trong gia phả
GET http://localhost:3000/users/thanhvien
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
# ✅ Kết quả: Chỉ trả về thành viên trong gia phả GP02

# Test: Owner tra cứu trong gia phả
GET http://localhost:3000/users/thanhvien/tra-cuu?HoTen=Nguyễn
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
# ✅ Kết quả: Chỉ trả về thành viên trong gia phả GP02

# Test: Owner sửa thành viên trong gia phả
PUT http://localhost:3000/users/thanhvien/TV04
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
Body: {
  "DiaChi": "Địa chỉ mới"
}
# ✅ Kết quả: Cập nhật thành công (nếu TV04 thuộc GP02)

# Test: Owner sửa thành viên NGOÀI gia phả
PUT http://localhost:3000/users/thanhvien/TV01
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
Body: {
  "DiaChi": "Địa chỉ mới"
}
# ❌ Kết quả: 403 Forbidden - "Bạn chỉ có quyền sửa thành viên trong gia phả của mình"

# Test: Owner xóa thành viên trong gia phả
DELETE http://localhost:3000/users/thanhvien/TV08
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
# ✅ Kết quả: Xóa thành công (nếu TV08 thuộc GP02)

# Test: Owner xóa thành viên NGOÀI gia phả
DELETE http://localhost:3000/users/thanhvien/TV01
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
# ❌ Kết quả: 403 Forbidden

# Test: Owner xem báo cáo gia phả
GET http://localhost:3000/users/thanhvien/baocao?NamBatDau=2020&NamKetThuc=2025
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
# ✅ Kết quả: Chỉ báo cáo gia phả GP02

# Test: Owner thêm thành viên mới
POST http://localhost:3000/users/thanhvien/register
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
Body: {
  "HoTen": "Nguyễn Văn Test",
  "NgayGioSinh": "2000-01-01",
  "DiaChi": "Hà Nội",
  "MaQueQuan": "QQ01",
  "MaNgheNghiep": "NN01",
  "GioiTinh": "Nam",
  "MaGiaPha": "GP02"
}
# ✅ Kết quả: Thêm thành công
```

---

### 3. Test Quyền User (Thành Viên Thường)

```bash
# Login với tài khoản User (giả sử TV06 là user thuộc gia phả GP02)
POST http://localhost:3000/users/login
Body: {
  "email": "user@example.com",
  "password": "User@123"
}

# Test: User xem thành viên trong gia phả
GET http://localhost:3000/users/thanhvien
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
# ✅ Kết quả: Chỉ trả về thành viên trong gia phả GP02

# Test: User tra cứu trong gia phả
GET http://localhost:3000/users/thanhvien/tra-cuu?HoTen=Nguyễn
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
# ✅ Kết quả: Chỉ trả về thành viên trong gia phả GP02

# Test: User sửa thông tin CHÍNH MÌNH
PUT http://localhost:3000/users/thanhvien/TV06
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
Body: {
  "DiaChi": "Địa chỉ mới của tôi"
}
# ✅ Kết quả: Cập nhật thành công

# Test: User sửa thông tin NGƯỜI KHÁC
PUT http://localhost:3000/users/thanhvien/TV04
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
Body: {
  "DiaChi": "Địa chỉ mới"
}
# ❌ Kết quả: 403 Forbidden - "Bạn chỉ có quyền sửa thông tin cá nhân của chính mình"

# Test: User xóa thành viên
DELETE http://localhost:3000/users/thanhvien/TV08
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
# ❌ Kết quả: 403 Forbidden - "Bạn không có quyền xóa thành viên"

# Test: User thêm thành viên mới
POST http://localhost:3000/users/thanhvien/register
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
Body: {
  "HoTen": "Nguyễn Văn Test",
  ...
}
# ❌ Kết quả: 403 Forbidden - "Chỉ Admin hoặc Trưởng tộc mới có quyền thực hiện hành động này"

# Test: User xem báo cáo gia phả
GET http://localhost:3000/users/thanhvien/baocao?NamBatDau=2020&NamKetThuc=2025
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
# ✅ Kết quả: Chỉ báo cáo gia phả GP02
```

---

## 📊 BẢNG TỔNG HỢP PHÂN QUYỀN

| Chức năng | Admin (LTK01) | Owner (LTK02) | User (LTK03) |
|-----------|--------------|---------------|--------------|
| **Thêm thành viên** | ✅ Tất cả | ✅ Trong gia phả | ❌ Không |
| **Xóa thành viên** | ✅ Tất cả | ✅ Trong gia phả | ❌ Không |
| **Sửa thành viên** | ✅ Tất cả | ✅ Trong gia phả | ✅ Chính mình |
| **Xem thành viên** | ✅ Tất cả | ✅ Trong gia phả | ✅ Trong gia phả |
| **Tra cứu** | ✅ Tất cả gia phả | ✅ Trong gia phả | ✅ Trong gia phả |
| **Báo cáo** | ✅ Tất cả gia phả | ✅ Trong gia phả | ✅ Trong gia phả |
| **Ghi nhận quan hệ** | ✅ Tất cả | ✅ Trong gia phả | ❌ Không |
| **Quản lý gia phả** | ✅ Tất cả | ✅ Của mình | ❌ Không |

---

## 🔐 LƯU Ý BẢO MẬT

### 1. Validate Input
- Luôn validate tất cả input từ client
- Kiểm tra MaTV, MaGiaPha có tồn tại không
- Validate định dạng dữ liệu

### 2. SQL Injection Prevention
- Sử dụng prepared statements
- Không concatenate string trong SQL
- Dùng parameterized queries

### 3. Authorization
- KHÔNG TIN TƯỞNGclient-side validation
- Luôn kiểm tra quyền ở server-side
- Verify JWT token mỗi request

### 4. Logging
- Log mọi hành động quan trọng (thêm, xóa, sửa)
- Ghi lại ai, làm gì, khi nào
- Dùng để audit và debug

---

## � SỬA LỖI TRONG CODE HIỆN TẠI

### Lỗi 1: Interface TraCuuThanhVienQuery không khớp

**File cần sửa**: `backend/src/models/requests/TraCuuThanhVien.requests.ts`

**Vấn đề**: Interface hiện tại sử dụng tên thuộc tính viết thường (search, doi) nhưng code đang dùng viết hoa (HoTen, Doi)

**Cách sửa**: Thêm các thuộc tính mới vào interface hoặc thay đổi code để khớp với interface hiện tại.

**Giải pháp 1** (Thay đổi code để khớp interface hiện tại):

Trong file `backend/src/controllers/thanhvien.controllers.ts` (dòng 252):

```typescript
// ❌ SAI - Code cũ
export const traCuuThanhVienController = async (req: Request, res: Response) => {
  const { HoTen, GioiTinh, Doi, NamSinh } = req.query as unknown as TraCuuThanhVienQuery;
  const userInfo = req.userInfo!;

  try {
    const result = await thanhvienService.traCuuThanhVien(
      { HoTen, GioiTinh, Doi, NamSinh },
      userInfo
    );
    // ...
  }
}

// ✅ ĐÚNG - Code mới
export const traCuuThanhVienController = async (req: Request, res: Response) => {
  const { search, doi, maGiaPha, trangThai } = req.query as unknown as TraCuuThanhVienQuery;
  const userInfo = req.userInfo!;

  try {
    const result = await thanhvienService.traCuuThanhVien(
      { search, doi, maGiaPha, trangThai },
      userInfo
    );

    return res.status(200).json(result);  // result đã có message
  } catch (error: any) {
    console.error('Lỗi traCuuThanhVien:', error);
    return res.status(400).json({
      message: 'Tra cứu thất bại',
      error: error.message
    });
  }
};
```

Trong file `backend/src/services/thanhvien.services.ts` (dòng 705-770):

```typescript
// ❌ SAI - Code cũ
async traCuuThanhVien(
  query: TraCuuThanhVienQuery,
  userInfo: { MaLoaiTK: string; MaGiaPha: string | null }
): Promise<TraCuuThanhVienResponse> {
  const conditions: string[] = [];
  const params: any[] = [];

  // Phân quyền
  if (userInfo.MaLoaiTK !== 'LTK01') {
    if (!userInfo.MaGiaPha) {
      throw new Error('Bạn chưa thuộc gia phả nào');
    }
    conditions.push('tv.MaGiaPha = ?');
    params.push(userInfo.MaGiaPha);
  }

  // Điều kiện tìm kiếm
  if (query.HoTen) {
    conditions.push('tv.HoTen LIKE ?');
    params.push(`%${query.HoTen}%`);
  }

  if (query.GioiTinh) {
    conditions.push('tv.GioiTinh = ?');
    params.push(query.GioiTinh);
  }

  if (query.Doi !== undefined) {
    conditions.push('tv.DOI = ?');
    params.push(query.Doi);
  }

  if (query.NamSinh !== undefined) {
    conditions.push('YEAR(tv.NgayGioSinh) = ?');
    params.push(query.NamSinh);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      tv.MaTV,
      tv.HoTen,
      tv.NgayGioSinh,
      tv.DiaChi,
      tv.TrangThai,
      tv.DOI,
      tv.GioiTinh,
      qq.TenQueQuan,
      nn.TenNgheNghiep,
      gp.TenGiaPha
    FROM THANHVIEN tv
    LEFT JOIN QUEQUAN qq ON tv.MaQueQuan = qq.MaQueQuan
    LEFT JOIN NGHENGHIEP nn ON tv.MaNgheNghiep = nn.MaNgheNghiep
    LEFT JOIN CAYGIAPHA gp ON tv.MaGiaPha = gp.MaGiaPha
    ${whereClause}
    ORDER BY tv.DOI, tv.HoTen
  `;

  const rows = await databaseService.query<RowDataPacket[]>(sql, params);

  return {
    message: 'Tra cứu thành công',
    total: rows.length,
    data: rows as any[]
  };
}

// ✅ ĐÚNG - Code mới
async traCuuThanhVien(
  query: TraCuuThanhVienQuery,
  userInfo: { MaLoaiTK: string; MaGiaPha: string | null }
): Promise<TraCuuThanhVienResponse> {
  const conditions: string[] = [];
  const params: any[] = [];

  // Phân quyền: Nếu không phải Admin, chỉ tra cứu trong gia phả
  if (userInfo.MaLoaiTK !== 'LTK01') {
    if (!userInfo.MaGiaPha) {
      throw new Error('Bạn chưa thuộc gia phả nào');
    }
    conditions.push('tv.MaGiaPha = ?');
    params.push(userInfo.MaGiaPha);
  }

  // Điều kiện tìm kiếm theo search (họ tên hoặc mã TV)
  if (query.search) {
    conditions.push('(tv.HoTen LIKE ? OR tv.MaTV LIKE ?)');
    params.push(`%${query.search}%`, `%${query.search}%`);
  }

  // Lọc theo đời
  if (query.doi !== undefined) {
    conditions.push('tv.DOI = ?');
    params.push(query.doi);
  }

  // Lọc theo gia phả (nếu Admin muốn xem gia phả cụ thể)
  if (query.maGiaPha) {
    conditions.push('tv.MaGiaPha = ?');
    params.push(query.maGiaPha);
  }

  // Lọc theo trạng thái
  if (query.trangThai) {
    conditions.push('tv.TrangThai = ?');
    params.push(query.trangThai);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Xác định sắp xếp
  let orderBy = 'tv.DOI, tv.HoTen';
  if (query.sortBy === 'ngaySinh') {
    orderBy = 'tv.NgayGioSinh';
  } else if (query.sortBy === 'hoTen') {
    orderBy = 'tv.HoTen';
  }
  
  const orderDirection = query.order === 'desc' ? 'DESC' : 'ASC';

  // Query lấy dữ liệu với quan hệ cha mẹ
  const sql = `
    SELECT 
      tv.MaTV,
      tv.HoTen,
      tv.NgayGioSinh,
      tv.DOI,
      cha.HoTen AS TenCha,
      me.HoTen AS TenMe,
      qhc.MaTVCha AS MaCha,
      qhc.MaTVMe AS MaMe
    FROM THANHVIEN tv
    LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
    LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
    LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
    ${whereClause}
    ORDER BY ${orderBy} ${orderDirection}
  `;

  const rows = await databaseService.query<RowDataPacket[]>(sql, params);

  // Phân trang
  const page = query.page || 1;
  const limit = query.limit || 10;
  const total = rows.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  // Map data với STT
  const data: TraCuuThanhVienResult[] = rows.slice(startIndex, endIndex).map((row, index) => ({
    STT: startIndex + index + 1,
    MaTV: row.MaTV,
    HoTen: row.HoTen,
    NgayGioSinh: row.NgayGioSinh,
    DOI: row.DOI,
    TenCha: row.TenCha || null,
    TenMe: row.TenMe || null,
    MaCha: row.MaCha || null,
    MaMe: row.MaMe || null
  }));

  return {
    message: 'Tra cứu thành công',
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  };
}
```

---

### Lỗi 2: Destructuring sai trong authorization.middlewares.ts

**File cần sửa**: `backend/src/middlewares/authorization.middlewares.ts`

**Vấn đề**: Function `getUserInfo` đang destructure kết quả từ `databaseService.query` nhưng service này đã return array sẵn rồi (đã destructure bên trong).

**Vị trí**: Dòng 33

**Nguyên nhân**: 
- `databaseService.query` implementation:
  ```typescript
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await this.pool.execute(sql, params);  // ✅ Đã destructure ở đây
    return rows as T;  // ✅ Return rows (array) trực tiếp
  }
  ```
- Nếu destructure thêm lần nữa `const [rows] = await databaseService.query(...)` thì `rows` sẽ là phần tử đầu tiên của array thay vì array

**Cách sửa**:

```typescript
// ❌ SAI - Code cũ (dòng 33)
const getUserInfo = async (user_id: string): Promise<TaiKhoanInfo> => {
  const sql = `
    SELECT 
      tk.TenDangNhap,
      tk.MaTV,
      tk.MaLoaiTK,
      tv.MaGiaPha
    FROM TAIKHOAN tk
    LEFT JOIN THANHVIEN tv ON tk.MaTV = tv.MaTV
    WHERE tk.TenDangNhap = ?
  `;
  
  const [rows] = await databaseService.query<TaiKhoanInfo[]>(sql, [user_id]);  // ❌ Destructure 2 lần
  
  if (rows.length === 0) {
    throw new ErrorWithStatus({
      message: 'Không tìm thấy thông tin tài khoản',
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
  
  return rows[0];
};

// ✅ ĐÚNG - Code mới
const getUserInfo = async (user_id: string): Promise<TaiKhoanInfo> => {
  const sql = `
    SELECT 
      tk.TenDangNhap,
      tk.MaTV,
      tk.MaLoaiTK,
      tv.MaGiaPha
    FROM TAIKHOAN tk
    LEFT JOIN THANHVIEN tv ON tk.MaTV = tv.MaTV
    WHERE tk.TenDangNhap = ?
  `;
  
  const rows = await databaseService.query<TaiKhoanInfo[]>(sql, [user_id]);  // ✅ Lấy trực tiếp
  
  if (!rows || rows.length === 0) {  // ✅ Thêm check !rows
    throw new ErrorWithStatus({
      message: 'Không tìm thấy thông tin tài khoản',
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
  
  return rows[0];
};
```

**Kết quả lỗi nếu không sửa**: `rows` sẽ là `undefined` hoặc không phải array → Lỗi khi gọi `rows.length`

---

### Lỗi 3: Destructuring sai trong getBaoCaoTangGiam

**File cần sửa**: `backend/src/services/thanhvien.services.ts`

**Vấn đề**: Tương tự lỗi 2, đang destructure kết quả query 2 lần

**Vị trí**: Dòng 270-272

**Cách sửa**:

```typescript
// ❌ SAI - Code cũ
// Execute queries
const paramsSinh = [NamBatDau, NamKetThuc, ...params];
const paramsKetHon = [NamBatDau, NamKetThuc, ...params];
const paramsMat = [NamBatDau, NamKetThuc, ...params];

const [sinhRows] = await databaseService.query<RowDataPacket[]>(sqlSinh, paramsSinh);  // ❌
const [ketHonRows] = await databaseService.query<RowDataPacket[]>(sqlKetHon, paramsKetHon);  // ❌
const [matRows] = await databaseService.query<RowDataPacket[]>(sqlMat, paramsMat);  // ❌

// Tổng hợp kết quả
const result: any[] = [];
const years = new Set<number>();

sinhRows.forEach((row: any) => years.add(row.Nam));  // ❌ sinhRows.forEach is not a function
ketHonRows.forEach((row: any) => years.add(row.Nam));
matRows.forEach((row: any) => years.add(row.Nam));

// ✅ ĐÚNG - Code mới
// Execute queries
const paramsSinh = [NamBatDau, NamKetThuc, ...params];
const paramsKetHon = [NamBatDau, NamKetThuc, ...params];
const paramsMat = [NamBatDau, NamKetThuc, ...params];

const sinhRows = await databaseService.query<RowDataPacket[]>(sqlSinh, paramsSinh);  // ✅
const ketHonRows = await databaseService.query<RowDataPacket[]>(sqlKetHon, paramsKetHon);  // ✅
const matRows = await databaseService.query<RowDataPacket[]>(sqlMat, paramsMat);  // ✅

// Tổng hợp kết quả
const result: any[] = [];
const years = new Set<number>();

sinhRows.forEach((row: any) => years.add(row.Nam));  // ✅ Hoạt động bình thường
ketHonRows.forEach((row: any) => years.add(row.Nam));
matRows.forEach((row: any) => years.add(row.Nam));
```

**Kết quả lỗi nếu không sửa**: `"sinhRows.forEach is not a function"` vì `sinhRows` không phải là array

---

### Lỗi 4: Thiếu type annotation cho callback functions

**File cần sửa**: `backend/src/services/thanhvien.services.ts`

**Vấn đề**: Các callback trong forEach và find không có type annotation

**Vị trí**: Dòng 275-282

**Cách sửa**:

```typescript
// ❌ SAI - Code cũ
sinhRows.forEach(row => years.add(row.Nam));
ketHonRows.forEach(row => years.add(row.Nam));
matRows.forEach(row => years.add(row.Nam));

Array.from(years).sort().forEach(year => {
  const sinh = sinhRows.find(r => r.Nam === year)?.SoLuong || 0;
  const ketHon = ketHonRows.find(r => r.Nam === year)?.SoLuong || 0;
  const mat = matRows.find(r => r.Nam === year)?.SoLuong || 0;
  // ...
});

// ✅ ĐÚNG - Code mới (thêm type annotation)
sinhRows.forEach((row: any) => years.add(row.Nam));
ketHonRows.forEach((row: any) => years.add(row.Nam));
matRows.forEach((row: any) => years.add(row.Nam));

Array.from(years).sort().forEach((year: number) => {
  const sinh = sinhRows.find((r: any) => r.Nam === year)?.SoLuong || 0;
  const ketHon = ketHonRows.find((r: any) => r.Nam === year)?.SoLuong || 0;
  const mat = matRows.find((r: any) => r.Nam === year)?.SoLuong || 0;
  // ...
});
```

Hoặc tốt hơn là định nghĩa interface cho row:

```typescript
// Thêm interface ở đầu file
interface BaoCaoRow extends RowDataPacket {
  Nam: number;
  SoLuong: number;
}

// Trong function getBaoCaoTangGiam, đổi type của query result:
const sinhRows = await databaseService.query<BaoCaoRow[]>(sqlSinh, paramsSinh);
const ketHonRows = await databaseService.query<BaoCaoRow[]>(sqlKetHon, paramsKetHon);
const matRows = await databaseService.query<BaoCaoRow[]>(sqlMat, paramsMat);

// Sau đó không cần type annotation trong callback nữa:
sinhRows.forEach(row => years.add(row.Nam));
ketHonRows.forEach(row => years.add(row.Nam));
matRows.forEach(row => years.add(row.Nam));

Array.from(years).sort().forEach(year => {
  const sinh = sinhRows.find(r => r.Nam === year)?.SoLuong || 0;
  const ketHon = ketHonRows.find(r => r.Nam === year)?.SoLuong || 0;
  const mat = matRows.find(r => r.Nam === year)?.SoLuong || 0;
  // ...
});
```

---

## 📝 CHECKLIST TRIỂN KHAI

- [ ] Tạo middleware authorization.middlewares.ts
- [ ] ⚠️ **SỬA LỖI 2: Sửa destructuring trong authorization.middlewares.ts (getUserInfo)**
- [ ] Cập nhật type.d.ts với userInfo
- [ ] Cập nhật routes thanhvien.routes.ts
- [ ] ⚠️ **SỬA LỖI 1: Cập nhật controllers thanhvien.controllers.ts (traCuuThanhVienController)**
- [ ] ⚠️ **SỬA LỖI 1 + 3 + 4: Cập nhật services thanhvien.services.ts (traCuuThanhVien + getBaoCaoTangGiam)**
- [ ] Thêm messages phân quyền vào constants/messages.ts
- [ ] Test quyền Admin
- [ ] Test quyền Owner
- [ ] Test quyền User
- [ ] Test các edge cases (không thuộc gia phả, gia phả không tồn tại, etc.)
- [ ] Cập nhật documentation API
- [ ] Review security

---

## 🚀 CÁC BƯỚC TIẾP THEO

### 1. Mở rộng phân quyền cho các module khác
- Thành tích (thanhtich.routes.ts)
- Quan hệ hôn nhân (honnhan.routes.ts)
- Quan hệ con cái (quanhecon.routes.ts)
- Kết thúc (ketthuc.routes.ts)

### 2. Thêm chức năng nâng cao
- Phân quyền động (admin có thể thay đổi quyền)
- Role-based permissions (không chỉ dựa vào MaLoaiTK)
- Audit log (ghi nhật ký truy cập)

### 3. Cải thiện UX
- Thông báo rõ ràng khi không có quyền
- Ẩn/hiện button theo quyền ở frontend
- Loading states và error handling

---

## ❓ TROUBLESHOOTING

### Lỗi 403 Forbidden dù đúng quyền
**Nguyên nhân**: MaGiaPha không khớp hoặc null
**Giải pháp**: Kiểm tra THANHVIEN.MaGiaPha trong database

### Lỗi "Bạn chưa thuộc gia phả nào"
**Nguyên nhân**: MaGiaPha của user = NULL
**Giải pháp**: Cập nhật MaGiaPha cho thành viên

### Admin không xem được tất cả
**Nguyên nhân**: Logic phân quyền sai
**Giải pháp**: Kiểm tra điều kiện `if (userInfo.MaLoaiTK !== 'LTK01')`

### Token expired
**Nguyên nhân**: Access token hết hạn
**Giải pháp**: Dùng refresh token để lấy access token mới

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề trong quá trình implement:
1. Kiểm tra lại code theo từng bước
2. Test từng middleware riêng lẻ
3. Kiểm tra database có dữ liệu đúng không
4. Review logs để tìm lỗi
5. So sánh với test cases ở trên

---

**Ngày tạo**: 27/12/2025  
**Version**: 1.0  
**Tác giả**: GitHub Copilot  
**Dự án**: SE104 Family Tree Management System
