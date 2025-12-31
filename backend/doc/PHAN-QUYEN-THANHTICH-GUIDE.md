# HƯỚNG DẪN PHÂN QUYỀN CHỨC NĂNG THÀNH TÍCH

## 📋 TỔNG QUAN

Tài liệu này hướng dẫn chi tiết cách implement hệ thống phân quyền cho chức năng **Thành tích** với 3 vai trò:
- **Admin (LTK01)**: Quản trị viên hệ thống
- **Owner (LTK02)**: Người lập cây gia phả (Trưởng tộc)
- **User (LTK03)**: Thành viên thường

---

## 🗄️ PHÂN TÍCH CƠ SỞ DỮ LIỆU

### 1. Bảng LOAITHANHTICH (Loại thành tích)
```sql
CREATE TABLE LOAITHANHTICH(
	MaLTT VARCHAR(5) PRIMARY KEY,
	TenLTT VARCHAR(35) UNIQUE
);

-- Dữ liệu mẫu
INSERT INTO LOAITHANHTICH (MaLTT, TenLTT) VALUES
('LTT01', 'Huân chương Lao động'),
('LTT02', 'Bằng khen Thủ tướng'),
('LTT03', 'Chiến sĩ thi đua'),
('LTT04', 'Giấy khen cấp tỉnh'),
('LTT05', 'Học bổng giỏi'),
('LTT06', 'Giải thưởng khoa học kỹ thuật');
```

### 2. Bảng GHINHANTHANHTICH (Ghi nhận thành tích)
```sql
CREATE TABLE GHINHANTHANHTICH(
	MaLTT VARCHAR(5),
	MaTV VARCHAR(5),
	NgayPhatSinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY(MaLTT, MaTV, NgayPhatSinh),  -- Composite key
	FOREIGN KEY(MaLTT) REFERENCES LOAITHANHTICH(MaLTT),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV)
);
```

**Lưu ý quan trọng**: 
- Primary key là composite (MaLTT, MaTV, NgayPhatSinh)
- Một thành viên có thể có nhiều thành tích khác nhau
- Một thành viên có thể có cùng loại thành tích nhưng khác ngày
- `MaTV` liên kết với `THANHVIEN` → có thể trace được `MaGiaPha`

### 3. Bảng BAOCAOTHANHTICH (Báo cáo thành tích)
```sql
CREATE TABLE BAOCAOTHANHTICH (
    Nam INT,
    MaLTT VARCHAR(5),
    SoLuong INT,
    PRIMARY KEY (Nam, MaLTT),
    FOREIGN KEY (MaLTT) REFERENCES LOAITHANHTICH(MaLTT)
);

-- Trigger tự động cập nhật bảng này khi INSERT GHINHANTHANHTICH
```

### 4. Quan hệ với THANHVIEN
```sql
-- Trace MaGiaPha thông qua THANHVIEN
SELECT 
  g.MaLTT, 
  g.MaTV, 
  g.NgayPhatSinh,
  tv.HoTen,
  tv.MaGiaPha  -- Sửa Dùng để phân quyền
FROM GHINHANTHANHTICH g
INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV;
```

---

## 🎯 YÊU CẦU PHÂN QUYỀN CHI TIẾT

### 1. QUYỀN GHI NHẬN THÀNH TÍCH

#### Admin (LTK01)
- Sửa **Thêm** thành tích cho **MỌI** thành viên từ **MỌI** gia phả
- Sửa **Xóa** thành tích của **MỌI** thành viên từ **MỌI** gia phả
- Sửa **Chỉnh sửa** thành tích của **MỌI** thành viên từ **MỌI** gia phả
- ⚠️ Không bị giới hạn bởi MaGiaPha

#### Owner/TruongToc (LTK02)
- Sửa **Thêm** thành tích cho **MỌI** thành viên **TRONG GIA PHẠ**
- Sửa **Xóa** thành tích của **MỌI** thành viên **TRONG GIA PHẠ**
- Sửa **Chỉnh sửa** thành tích của **MỌI** thành viên **TRONG GIA PHẠ**
- ⚠️ Kiểm tra: `THANHVIEN.MaGiaPha = (MaGiaPha của Owner)`

#### User (LTK03)
- Sửa Chỉ được **THÊM** thành tích cho **CHÍNH MÌNH**
- Sửa Được **XÓA** thành tích của **MỌI THÀNH VIÊN TRONG GIA PHẠ**
- Sửa Được **SỬA** thành tích của **CHÍNH MÌNH**
- ⚠️ Kiểm tra xóa: `THANHVIEN.MaGiaPha = (MaGiaPha của User)`
- ⚠️ Kiểm tra sửa: `TAIKHOAN.MaTV = MaTV_trong_request`

---

### 2. QUYỀN TRA CỨU THÀNH TÍCH

#### Admin (LTK01)
- Sửa Tra cứu thành tích của **MỌI** thành viên từ **TẤT CẢ** các gia phả
- Sửa Không có giới hạn MaGiaPha

#### Owner/TruongToc (LTK02)
- Sửa Tra cứu thành tích của **MỌI** thành viên **TRONG GIA PHẠ**
- ⚠️ Kiểm tra: Chỉ trả về thành tích của thành viên có `MaGiaPha = (MaGiaPha của Owner)`

#### User (LTK03)
- Sửa Tra cứu thành tích của **MỌI** thành viên **TRONG GIA PHẠ**
- ⚠️ Kiểm tra: Chỉ trả về thành tích của thành viên có `MaGiaPha = (MaGiaPha của User)`

---

### 3. QUYỀN BÁO CÁO THÀNH TÍCH

#### Admin (LTK01)
- Sửa Lập báo cáo năm cho **MỌI** gia phả
- Sửa Có thể xem báo cáo thành tích tổng hợp của tất cả gia phả

#### Owner/TruongToc (LTK02)
- Sửa Lập báo cáo năm **TRONG GIA PHẠ**
- ⚠️ Chỉ thống kê thành tích của thành viên thuộc MaGiaPha của mình

#### User (LTK03)
- Sửa Lập báo cáo năm **TRONG GIA PHẠ**
- ⚠️ Chỉ thống kê thành tích của thành viên thuộc MaGiaPha của mình

---

## 🔧 IMPLEMENTATION GUIDE

### BƯỚC 1: Cập Nhật Middleware (Đã có từ PHAN-QUYEN-GUIDE.md)

Middleware phân quyền đã được tạo trong file `backend/src/middlewares/authorization.middlewares.ts`:
- `requireAdmin`: Chỉ Admin
- `requireAdminOrOwner`: Admin hoặc Owner
- `checkUpdateMemberPermission`: Kiểm tra quyền sửa (dùng tương tự cho thành tích)
- `checkDeleteMemberPermission`: Kiểm tra quyền xóa (dùng tương tự cho thành tích)
- `attachUserInfoMiddleware`: Gán userInfo vào request

**Cần thêm middleware mới cho thành tích**:

Thêm vào file: `backend/src/middlewares/authorization.middlewares.ts`

```typescript
/**
 * Kiểm tra quyền ghi nhận thành tích
 * - Admin: ghi nhận cho mọi thành viên
 * - Owner: ghi nhận cho thành viên trong gia phả
 * - User: chỉ ghi nhận cho chính mình
 */
export const checkGhiNhanThanhTichPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.body;  // MaTV của thành viên được ghi nhận thành tích
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // Lấy thông tin thành viên được ghi nhận
    const memberRows = await databaseService.query<RowDataPacket[]>(
      'SELECT MaTV, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
      [MaTV]
    );
    
    if (!memberRows || memberRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy thành viên',
        status: HTTP_STATUS.NOT_FOUND
      });
    }
    
    const memberInfo = memberRows[0];
    
    // Owner: chỉ ghi nhận cho thành viên trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02') {
      if (memberInfo.MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền ghi nhận thành tích cho thành viên trong gia phả của mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      req.userInfo = userInfo;
      return next();
    }
    
    // User: chỉ ghi nhận cho chính mình
    if (userInfo.MaLoaiTK === 'LTK03') {
      if (userInfo.MaTV !== MaTV) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền ghi nhận thành tích cho chính mình',
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
 * Kiểm tra quyền XÓA thành tích
 * - Admin: xóa được tất cả
 * - Owner: xóa được thành tích trong gia phả
 * - User: xóa được thành tích trong gia phả
 */
export const checkDeleteThanhTichPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.body;  // MaTV trong body
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // Lấy thông tin thành viên
    const memberRows = await databaseService.query<RowDataPacket[]>(
      'SELECT MaTV, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
      [MaTV]
    );
    
    if (!memberRows || memberRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy thành viên',
        status: HTTP_STATUS.NOT_FOUND
      });
    }
    
    // Owner và User: chỉ xóa được thành tích trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02' || userInfo.MaLoaiTK === 'LTK03') {
      if (!userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chưa thuộc gia phả nào',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      if (memberRows[0].MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền xóa thành tích của thành viên trong gia phả của mình',
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
 * Kiểm tra quyền CẬP NHẬT thành tích
 * - Admin: sửa được tất cả
 * - Owner: sửa được thành tích trong gia phả
 * - User: chỉ sửa được thành tích của chính mình
 */
export const checkUpdateThanhTichPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.body;  // MaTV trong body
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // Lấy thông tin thành viên
    const memberRows = await databaseService.query<RowDataPacket[]>(
      'SELECT MaTV, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
      [MaTV]
    );
    
    if (!memberRows || memberRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy thành viên',
        status: HTTP_STATUS.NOT_FOUND
      });
    }
    
    const memberInfo = memberRows[0];
    
    // Owner: chỉ sửa được thành tích trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02') {
      if (!userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chưa thuộc gia phả nào',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      if (memberInfo.MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền sửa thành tích của thành viên trong gia phả của mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      req.userInfo = userInfo;
      return next();
    }
    
    // User: chỉ sửa được thành tích của chính mình
    if (userInfo.MaLoaiTK === 'LTK03') {
      if (userInfo.MaTV !== MaTV) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền sửa thành tích của chính mình',
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
```

---

### BƯỚC 2: Cập Nhật Routes Với Middleware Phân Quyền

Cập nhật file: `backend/src/routes/thanhtich.routes.ts`

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
import { wrapAsync } from '~/utils/handlers';
import { 
  checkGhiNhanThanhTichPermission,
  checkDeleteThanhTichPermission,
  checkUpdateThanhTichPermission,
  attachUserInfoMiddleware
} from '~/middlewares/authorization.middlewares';

const thanhTichRouter = Router();

// ========================================
// ROUTES CÔNG KHAI (không cần phân quyền đặc biệt)
// ========================================

/**
 * GET /thanhtich/loai - Lấy danh sách loại thành tích
 * Ai cũng có thể xem
 */
thanhTichRouter.get('/loai', wrapAsync(getLoaiThanhTichController));

// ========================================
// ROUTES CẦN PHÂN QUYỀN
// ========================================

/**
 * POST /thanhtich/ghinhan - Ghi nhận thành tích mới
 * - Admin: ghi nhận cho mọi thành viên
 * - Owner: ghi nhận cho thành viên trong gia phả
 * - User: chỉ ghi nhận cho chính mình
 */
thanhTichRouter.post('/ghinhan', checkGhiNhanThanhTichPermission, wrapAsync(ghiNhanThanhTichController));

/**
 * GET /thanhtich/tracuu - Tra cứu thành tích
 * - Admin: tra cứu tất cả
 * - Owner/User: chỉ tra cứu trong gia phả
 */
thanhTichRouter.get('/tracuu', attachUserInfoMiddleware, wrapAsync(traCuuThanhTichController));

/**
 * GET /thanhtich/thanhvien - Lấy thành tích theo tên thành viên
 * - Admin: xem tất cả
 * - Owner/User: chỉ xem trong gia phả
 */
thanhTichRouter.get('/thanhvien', attachUserInfoMiddleware, wrapAsync(getThanhTichByHoTenController));

/**
 * DELETE /thanhtich/xoa - Xóa thành tích
 * - Admin: xóa được tất cả
 * - Owner: xóa được trong gia phả
 * - User: xóa được trong gia phả
 */
thanhTichRouter.delete('/xoa', checkDeleteThanhTichPermission, wrapAsync(xoaThanhTichController));

/**
 * PUT /thanhtich/capnhat - Cập nhật thành tích
 * - Admin: sửa được tất cả
 * - Owner: sửa được trong gia phả
 * - User: sửa được thành tích của chính mình
 */
thanhTichRouter.put('/capnhat', checkUpdateThanhTichPermission, wrapAsync(capNhatThanhTichController));

/**
 * GET /thanhtich/baocao - Báo cáo thành tích theo năm
 * - Admin: báo cáo tất cả gia phả
 * - Owner/User: chỉ báo cáo trong gia phả
 */
thanhTichRouter.get('/baocao', attachUserInfoMiddleware, wrapAsync(getBaoCaoThanhTichController));

export default thanhTichRouter;
```

---

### BƯỚC 3: Cập Nhật Controllers

#### 3.1. Controller Tra Cứu Thành Tích (Có phân quyền)

Cập nhật file: `backend/src/controllers/thanhtich.controllers.ts`

```typescript
/**
 * Controller tra cứu thành tích (CÓ PHÂN QUYỀN)
 * GET /thanhtich/tracuu
 */
export const traCuuThanhTichController = async (req: Request, res: Response) => {
  const userInfo = req.userInfo!;  // Đã được gán bởi middleware
  
  try {
    const { HoTen, TenLoaiThanhTich, TuNgay, DenNgay } = req.query;

    const filters: any = {};
    if (HoTen) filters.HoTen = HoTen as string;
    if (TenLoaiThanhTich) filters.TenLoaiThanhTich = TenLoaiThanhTich as string;
    if (TuNgay) filters.TuNgay = new Date(TuNgay as string);
    if (DenNgay) filters.DenNgay = new Date(DenNgay as string);

    // Truyền userInfo vào service để filter theo gia phả
    const result = await thanhTichService.traCuuThanhTich(filters, userInfo);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Tra cứu thành tích thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi traCuuThanhTich:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Tra cứu thành tích thất bại',
      error: error.message
    });
  }
};
```

#### 3.2. Controller Lấy Thành Tích Theo Tên (Có phân quyền)

```typescript
/**
 * Controller lấy thành tích theo tên (CÓ PHÂN QUYỀN)
 * GET /thanhtich/thanhvien
 */
export const getThanhTichByHoTenController = async (req: Request, res: Response) => {
  const { HoTen } = req.query;
  const userInfo = req.userInfo!;

  try {
    if (!HoTen) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: HoTen'
      });
    }

    const result = await thanhTichService.getThanhTichByHoTen(HoTen as string, userInfo);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy thành tích thành công',
      HoTen,
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getThanhTichByHoTen:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy thành tích thất bại',
      error: error.message
    });
  }
};
```

#### 3.3. Controller Báo Cáo Thành Tích (Có phân quyền)

```typescript
/**
 * Controller báo cáo thành tích (CÓ PHÂN QUYỀN)
 * GET /thanhtich/baocao
 */
export const getBaoCaoThanhTichController = async (req: Request, res: Response) => {
  const userInfo = req.userInfo!;
  
  try {
    const { NamBatDau, NamKetThuc } = req.query;

    if (!NamBatDau || !NamKetThuc) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin: NamBatDau và NamKetThuc là bắt buộc'
      });
    }

    const namBatDau = parseInt(NamBatDau as string);
    const namKetThuc = parseInt(NamKetThuc as string);

    if (isNaN(namBatDau) || isNaN(namKetThuc)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'NamBatDau và NamKetThuc phải là số nguyên hợp lệ'
      });
    }

    // Truyền userInfo vào service để filter theo gia phả
    const result = await thanhTichService.getBaoCaoThanhTich(namBatDau, namKetThuc, userInfo);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy báo cáo thành tích thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi getBaoCaoThanhTich:', error);
    
    if (error.message.includes('Năm') || error.message.includes('năm')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: error.message
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi lấy báo cáo thành tích',
      error: error.message
    });
  }
};
```

---

### BƯỚC 4: Cập Nhật Services

#### 4.1. Service Tra Cứu Thành Tích (Có phân quyền)

Cập nhật file: `backend/src/services/thanhtich.services.ts`

```typescript
/**
 * Tra cứu thành tích với phân quyền
 * - Admin: Tra cứu tất cả
 * - Owner/User: Chỉ tra cứu trong gia phả
 */
async traCuuThanhTich(
  filters?: {
    HoTen?: string;
    TenLoaiThanhTich?: string;
    TuNgay?: Date;
    DenNgay?: Date;
  },
  userInfo?: { MaLoaiTK: string; MaGiaPha: string | null }
) {
  let sql = `
    SELECT 
      ROW_NUMBER() OVER (ORDER BY g.NgayPhatSinh DESC) AS STT,
      g.MaTV,
      tv.HoTen,
      ltt.TenLTT AS ThanhTich,
      g.NgayPhatSinh,
      tv.MaGiaPha
    FROM GHINHANTHANHTICH g
    INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV
    INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
    WHERE 1=1
  `;

  const params: any[] = [];

  // Sửa PHÂN QUYỀN: Nếu không phải Admin, chỉ tra cứu trong gia phả
  if (userInfo && userInfo.MaLoaiTK !== 'LTK01') {
    if (!userInfo.MaGiaPha) {
      throw new Error('Bạn chưa thuộc gia phả nào');
    }
    sql += ' AND tv.MaGiaPha = ?';
    params.push(userInfo.MaGiaPha);
  }

  // Thêm điều kiện filter
  if (filters) {
    if (filters.HoTen) {
      sql += ' AND tv.HoTen LIKE ?';
      params.push(`%${filters.HoTen}%`);
    }

    if (filters.TenLoaiThanhTich) {
      sql += ' AND ltt.TenLTT LIKE ?';
      params.push(`%${filters.TenLoaiThanhTich}%`);
    }

    if (filters.TuNgay) {
      sql += ' AND DATE(g.NgayPhatSinh) >= ?';
      params.push(filters.TuNgay);
    }
    if (filters.DenNgay) {
      sql += ' AND DATE(g.NgayPhatSinh) <= ?';
      params.push(filters.DenNgay);
    }
  }

  sql += ' ORDER BY g.NgayPhatSinh DESC';

  const rows = await databaseService.query<ThanhTichDetailRow[]>(sql, params);
  return rows;
}
```

#### 4.2. Service Lấy Thành Tích Theo Tên (Có phân quyền)

```typescript
/**
 * Lấy thành tích theo tên với phân quyền
 * - Admin: Lấy tất cả
 * - Owner/User: Chỉ trong gia phả
 */
async getThanhTichByHoTen(
  HoTen: string, 
  userInfo?: { MaLoaiTK: string; MaGiaPha: string | null }
) {
  let sql = `
    SELECT 
      g.MaTV,
      tv.HoTen,
      ltt.TenLTT AS ThanhTich,
      g.NgayPhatSinh,
      tv.MaGiaPha
    FROM GHINHANTHANHTICH g
    INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV
    INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
    WHERE tv.HoTen LIKE ?
  `;

  const params: any[] = [`%${HoTen}%`];

  // Sửa PHÂN QUYỀN: Nếu không phải Admin, chỉ lấy trong gia phả
  if (userInfo && userInfo.MaLoaiTK !== 'LTK01') {
    if (!userInfo.MaGiaPha) {
      throw new Error('Bạn chưa thuộc gia phả nào');
    }
    sql += ' AND tv.MaGiaPha = ?';
    params.push(userInfo.MaGiaPha);
  }

  sql += ' ORDER BY g.NgayPhatSinh DESC';

  const rows = await databaseService.query<ThanhTichByNameRow[]>(sql, params);
  return rows;
}
```

#### 4.3. Service Báo Cáo Thành Tích (Có phân quyền)

```typescript
/**
 * Báo cáo thành tích với phân quyền
 * - Admin: Báo cáo tất cả gia phả
 * - Owner/User: Chỉ báo cáo gia phả của mình
 */
async getBaoCaoThanhTich(
  NamBatDau: number, 
  NamKetThuc: number,
  userInfo?: { MaLoaiTK: string; MaGiaPha: string | null }
) {
  // Validate input
  if (NamBatDau > NamKetThuc) {
    throw new Error('Năm bắt đầu không được lớn hơn năm kết thúc');
  }

  const currentYear = new Date().getFullYear();
  if (NamKetThuc > currentYear) {
    throw new Error(`Năm kết thúc không được vượt quá năm hiện tại (${currentYear})`);
  }

  let sql = `
    SELECT 
      ROW_NUMBER() OVER (ORDER BY SUM(g.cnt) DESC) AS STT,
      ltt.TenLTT AS LoaiThanhTich,
      SUM(g.cnt) AS SoLuong
    FROM (
      SELECT 
        g.MaLTT,
        COUNT(*) as cnt
      FROM GHINHANTHANHTICH g
      INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV
      WHERE YEAR(g.NgayPhatSinh) BETWEEN ? AND ?
  `;

  const params: any[] = [NamBatDau, NamKetThuc];

  // Sửa PHÂN QUYỀN: Nếu không phải Admin, chỉ thống kê gia phả của mình
  if (userInfo && userInfo.MaLoaiTK !== 'LTK01') {
    if (!userInfo.MaGiaPha) {
      throw new Error('Bạn chưa thuộc gia phả nào');
    }
    sql += ' AND tv.MaGiaPha = ?';
    params.push(userInfo.MaGiaPha);
  }

  sql += `
      GROUP BY g.MaLTT
    ) g
    INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
    GROUP BY g.MaLTT, ltt.TenLTT
    HAVING SUM(g.cnt) > 0
    ORDER BY SoLuong DESC
  `;

  interface BaoCaoRow extends RowDataPacket {
    STT: number;
    LoaiThanhTich: string;
    SoLuong: number;
  }

  const rows = await databaseService.query<BaoCaoRow[]>(sql, params);

  return {
    NamBatDau,
    NamKetThuc,
    TongLoaiThanhTich: rows.length,
    TongSoLuong: rows.reduce((sum, row) => sum + parseInt(row.SoLuong.toString()), 0),
    DanhSach: rows
  };
}
```

---

### BƯỚC 5: Cập Nhật Messages

Thêm vào file: `backend/src/constants/messages.ts`

```typescript
export const THANHTICH_MESSAGES = {
  // Ghi nhận thành tích
  GHI_NHAN_SUCCESS: 'Ghi nhận thành tích thành công',
  GHI_NHAN_FAILED: 'Ghi nhận thành tích thất bại',
  CANNOT_GHI_NHAN_OTHER_MEMBER: 'Bạn không có quyền ghi nhận thành tích cho thành viên khác',
  CANNOT_GHI_NHAN_OTHER_FAMILY: 'Bạn không có quyền ghi nhận thành tích cho thành viên ngoài gia phả',
  
  // Xóa thành tích
  XOA_SUCCESS: 'Xóa thành tích thành công',
  XOA_FAILED: 'Xóa thành tích thất bại',
  CANNOT_DELETE_THANHTICH: 'Bạn không có quyền xóa thành tích',
  
  // Cập nhật thành tích
  CAP_NHAT_SUCCESS: 'Cập nhật thành tích thành công',
  CAP_NHAT_FAILED: 'Cập nhật thành tích thất bại',
  CANNOT_UPDATE_THANHTICH: 'Bạn không có quyền sửa thành tích',
  
  // Tra cứu
  TRA_CUU_SUCCESS: 'Tra cứu thành tích thành công',
  TRA_CUU_FAILED: 'Tra cứu thành tích thất bại',
  CANNOT_VIEW_OTHER_FAMILY_THANHTICH: 'Bạn không có quyền xem thành tích của gia phả khác',
  
  // Báo cáo
  BAO_CAO_SUCCESS: 'Lấy báo cáo thành tích thành công',
  BAO_CAO_FAILED: 'Lấy báo cáo thành tích thất bại',
  
  // Validation
  MISSING_REQUIRED_FIELDS: 'Thiếu thông tin bắt buộc',
  INVALID_DATE: 'Ngày không hợp lệ',
  NGAY_PHAT_SINH_INVALID: 'Ngày đạt thành tích phải sau ngày sinh thành viên'
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

# Test 1: Admin ghi nhận thành tích cho mọi thành viên
POST http://localhost:3000/users/thanhtich/ghinhan
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
Body: {
  "MaTV": "TV01",  # Thành viên bất kỳ
  "MaLTT": "LTT01",
  "NgayPhatSinh": "2025-01-15"
}
# Sửa Kết quả: Ghi nhận thành công

# Test 2: Admin tra cứu thành tích tất cả gia phả
GET http://localhost:3000/users/thanhtich/tracuu?HoTen=Nguyễn
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
# Sửa Kết quả: Trả về thành tích từ TẤT CẢ gia phả

# Test 3: Admin xóa thành tích bất kỳ
DELETE http://localhost:3000/users/thanhtich/xoa
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
Body: {
  "MaTV": "TV04",
  "MaLTT": "LTT02",
  "NgayPhatSinh": "2024-02-20"
}
# Sửa Kết quả: Xóa thành công

# Test 4: Admin cập nhật thành tích bất kỳ
PUT http://localhost:3000/users/thanhtich/capnhat
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
Body: {
  "MaTV": "TV05",
  "MaLTT_Cu": "LTT03",
  "MaLTT_Moi": "LTT01",
  "NgayPhatSinh": "2023-01-11"
}
# Sửa Kết quả: Cập nhật thành công

# Test 5: Admin xem báo cáo tất cả gia phả
GET http://localhost:3000/users/thanhtich/baocao?NamBatDau=2020&NamKetThuc=2025
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
# Sửa Kết quả: Báo cáo tất cả gia phả
```

---

### 2. Test Quyền Owner (Trưởng Tộc)

```bash
# Login với tài khoản Owner (giả sử TV02 là trưởng tộc GP02)
POST http://localhost:3000/users/login
Body: {
  "email": "owner@example.com",
  "password": "Owner@123"
}

# Test 1: Owner ghi nhận thành tích trong gia phả
POST http://localhost:3000/users/thanhtich/ghinhan
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
Body: {
  "MaTV": "TV04",  # Thành viên trong gia phả GP02
  "MaLTT": "LTT01",
  "NgayPhatSinh": "2025-01-15"
}
# Sửa Kết quả: Ghi nhận thành công

# Test 2: Owner ghi nhận thành tích NGOÀI gia phả
POST http://localhost:3000/users/thanhtich/ghinhan
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
Body: {
  "MaTV": "TV01",  # Thành viên ngoài gia phả (GP01)
  "MaLTT": "LTT01",
  "NgayPhatSinh": "2025-01-15"
}
# ❌ Kết quả: 403 Forbidden - "Bạn chỉ có quyền ghi nhận thành tích cho thành viên trong gia phả của mình"

# Test 3: Owner tra cứu thành tích trong gia phả
GET http://localhost:3000/users/thanhtich/tracuu?HoTen=Nguyễn
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
# Sửa Kết quả: Chỉ trả về thành tích của gia phả GP02

# Test 4: Owner xóa thành tích trong gia phả
DELETE http://localhost:3000/users/thanhtich/xoa
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
Body: {
  "MaTV": "TV04",  # Trong gia phả
  "MaLTT": "LTT02",
  "NgayPhatSinh": "2024-02-20"
}
# Sửa Kết quả: Xóa thành công

# Test 5: Owner xóa thành tích NGOÀI gia phả
DELETE http://localhost:3000/users/thanhtich/xoa
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
Body: {
  "MaTV": "TV01",  # Ngoài gia phả
  "MaLTT": "LTT01",
  "NgayPhatSinh": "2025-01-15"
}
# ❌ Kết quả: 403 Forbidden

# Test 6: Owner cập nhật thành tích trong gia phả
PUT http://localhost:3000/users/thanhtich/capnhat
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
Body: {
  "MaTV": "TV05",  # Trong gia phả
  "MaLTT_Cu": "LTT03",
  "MaLTT_Moi": "LTT01",
  "NgayPhatSinh": "2023-01-11"
}
# Sửa Kết quả: Cập nhật thành công

# Test 7: Owner xem báo cáo gia phả
GET http://localhost:3000/users/thanhtich/baocao?NamBatDau=2020&NamKetThuc=2025
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
# Sửa Kết quả: Chỉ báo cáo gia phả GP02
```

---

### 3. Test Quyền User (Thành Viên Thường)

```bash
# Login với tài khoản User (giả sử TV06 thuộc GP02)
POST http://localhost:3000/users/login
Body: {
  "email": "user@example.com",
  "password": "User@123"
}

# Test 1: User ghi nhận thành tích cho CHÍNH MÌNH
POST http://localhost:3000/users/thanhtich/ghinhan
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
Body: {
  "MaTV": "TV06",  # Chính mình
  "MaLTT": "LTT05",
  "NgayPhatSinh": "2025-01-15"
}
# Sửa Kết quả: Ghi nhận thành công

# Test 2: User ghi nhận thành tích cho NGƯỜI KHÁC (cùng gia phả)
POST http://localhost:3000/users/thanhtich/ghinhan
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
Body: {
  "MaTV": "TV04",  # Người khác trong gia phả
  "MaLTT": "LTT01",
  "NgayPhatSinh": "2025-01-15"
}
# ❌ Kết quả: 403 Forbidden - "Bạn chỉ có quyền ghi nhận thành tích cho chính mình"

# Test 3: User tra cứu thành tích trong gia phả
GET http://localhost:3000/users/thanhtich/tracuu?HoTen=Nguyễn
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
# Sửa Kết quả: Trả về thành tích của gia phả GP02

# Test 4: User xem thành tích theo tên trong gia phả
GET http://localhost:3000/users/thanhtich/thanhvien?HoTen=Nguyễn Văn Nam
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
# Sửa Kết quả: Trả về thành tích của TV06 (nếu tên khớp)
xóa thành tích trong gia phả
DELETE http://localhost:3000/users/thanhtich/xoa
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
Body: {
  "MaTV": "TV04",  # Thành viên khác trong gia phả
  "MaLTT": "LTT02",
  "NgayPhatSinh": "2024-02-20"
}
# Sửa Kết quả: Xóa thành công (vì cùng gia phả)

# Test 5.1: User xóa thành tích NGOÀI gia phả
DELETE http://localhost:3000/users/thanhtich/xoa
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
Body: {
  "MaTV": "TV01",  # Thành viên ngoài gia phả
  "MaLTT": "LTT01",
  "NgayPhatSinh": "2025-01-15"
}
# ❌ Kết quả: 403 Forbidden - "Bạn chỉ có quyền xóa thành tích của thành viên trong gia phả của mình"

# Test 6: User cập nhật thành tích của chính mình
PUT http://localhost:3000/users/thanhtich/capnhat
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
Body: {
  "MaTV": "TV06",  # Chính mình
  "MaLTT_Cu": "LTT05",
  "MaLTT_Moi": "LTT01",
  "NgayPhatSinh": "2025-01-15"
}
# Sửa Kết quả: Cập nhật thành công

# Test 6.1: User cố cập nhật thành tích của người khác
PUT http://localhost:3000/users/thanhtich/capnhat
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
Body: {
  "MaTV": "TV04",  # Người khác
  "MaLTT_Cu": "LTT02",
  "MaLTT_Moi": "LTT01",
  "NgayPhatSinh": "2024-02-20"
}
# ❌ Kết quả: 403 Forbidden - "Bạn chỉ có quyền sửa thành tích của chính mìn
# ❌ Kết quả: 403 Forbidden - "Bạn không có quyền xóa/sửa thành tích"

# Test 7: User xem báo cáo gia phả
GET http://localhost:3000/users/thanhtich/baocao?NamBatDau=2020&NamKetThuc=2025
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
# Sửa Kết quả: Chỉ báo cáo gia phả GP02
```

---

## 📊 BẢNG TỔNG HỢP PHÂN QUYỀN THÀNH TÍCH

| Chức năng | Admin (LTK01) | Owner (LTK02) | User (LTK03) |
|-----------|--------------|---------------|--------------|
| **Ghi nhận thành tích** | Sửa Mọi thành viên | Sửa Trong gia pSửa Trong gia phả |
| **Sửa thành tích** | Sửa Mọi thành viên | Sửa Trong gia phả | Sửa Của bản thân |
| **Sửa thành tích** | Sửa Mọi thành viên | Sửa Trong gia phả | ❌ Không |
| **Tra cứu thành tích** | Sửa Tất cả gia phả | Sửa Trong gia phả | Sửa Trong gia phả |
| **Xem theo tên** | Sửa Tất cả gia phả | Sửa Trong gia phả | Sửa Trong gia phả |
| **Báo cáo thành tích** | Sửa Tất cả gia phả | Sửa Trong gia phả | Sửa Trong gia phả |
| **Xem loại thành tích** | Sửa Tất cả | Sửa Tất cả | Sửa Tất cả |

---

## 🔐 LƯU Ý3 middleware mới vào authorization.middlewares.ts
  - [ ] checkGhiNhanThanhTichPermission
  - [ ] checkDeleteThanhTichPermission (✨ User được xóa trong gia phả)
  - [ ] checkUpdateThanhTichPermission (✨ User được sửa của mình)
- Luôn verify MaGiaPha khi không phải Admin
- Join với bảng THANHVIEN để lấy MaGiaPha
- So sánh MaGiaPha của user với MaGiaPha của thành viên

### 2. Validate Composite Key
- GHINHANTHANHTICH có composite key (MaLTT, MaTV, NgayPhatSinh)
- Khi xóa/sửa cần cả 3 giá trị
- Validate tất cả 3 giá trị trước khi thực hiện

### 3. Transaction cho Update
- Cập nhật thành tích = DELETE + INSERT (do composite key)
- Phải dùng transaction để đảm bảo atomic
- Rollback nếu có lỗi

### 4. Trigger Database
- Có trigger kiểm tra ngày phát sinh > ngày sinh
- Có trigger tự động cập nhật BAOCAOTHANHTICH
- Xử lý lỗi từ trigger trong service

---

## 📝 CHECKLIST TRIỂN KHAI

- [ ] Thêm 2 middleware mới vào authorization.middlewares.ts
  - [ ] checkGhiNhanThanhTichPermission
  - [ ] checkUpdateDeleteThanhTichPermission
- [ ] Cập nhật routes thanhtich.routes.ts với middleware
- [ ] Cập nhật controllers thanhtich.controllers.ts
  - [ ] traCuuThanhTichController (thêm userInfo)
  - [ ] getThanhTichByHoTenController (thêm userInfo)
  - [ ] getBaoCaoThanhTichController (thêm userInfo)
- [ ] Cập nhật services thanhtich.services.ts
  - [ ] traCuuThanhTich (thêm phân quyền)
  - [ ] getThanhTichByHoTen (thêm phân quyền)
  - [ ] getBaoCaoThanhTich (thêm phân quyền)
- [ ] Thêm messages vào constants/messages.ts
- [ ] TQuyền User Được Mở Rộng
- Sửa User được **THÊM** thành tích cho MaTV của chính mình
- Sửa User được **XÓA** thành tích của mọi người **TRONG GIA PHẠ** (không chỉ của mình)
- Sửa User được **SỬA** thành tích của **CHÍNH MÌNH**
- Sửa User được **XEM**cases (không thuộc gia phả, composite key, etc.)
- [ ] Test transaction rollback
- [ ] Review security

---

## 🚀 CÁC LƯU Ý QUAN TRỌNG

### 1. Composite Primary Key
- Bảng GHINHANTHANHTICH dùng composite key (MaLTT, MaTV, NgayPhatSinh)
- Không thể UPDATE trực tiếp primary key
- Phải DELETE + INSERT trong transaction

### 2. MaGiaPha Tracing
- MaGiaPha không trực tiếp trong GHINHANTHANHTICH
- Phải JOIN với THANHVIEN để lấy MaGiaPha
- Luôn JOIN trong các query có phân quyền

### 3. Báo Cáo Thành Tích
- Có 2 bảng: GHINHANTHANHTICH (chi tiết) và BAOCAOTHANHTICH (tổng hợp)
- BAOCAOTHANHTICH được cập nhật tự động bởi trigger
- Service nên query từ GHINHANTHANHTICH để có phân quyền chính xác

### 4. User Chỉ Ghi Nhận Cho Mình
- User chỉ được thêm thành tích cho MaTV của chính mình
- Không được xóa/sửa thành tích (kể cả của mình)
- Nhưng được xem thành tích của mọi người trong gia phả

---

## ❓ TROUBLESHOOTING

### Lỗi "Không tìm thấy thành viên"
**Nguyên nhân**: MaTV không tồn tại hoặc không thuộc gia phả
**Giải pháp**: Kiểm tra MaTV trong database

### Lỗi "Ngày đạt thành tích phải sau ngày sinh"
**Nguyên nhân**: Trigger kiểm tra NgayPhatSinh <= NgayGioSinh
**Giải pháp**: Sửa NgayPhatSinh cho hợp lệ

### Lỗi "Bạn chỉ có quyền ghi nhận thành tích cho chính mình"
**Nguyên nhân**: User cố ghi nhận cho người khác
**Giải pháp**: User chỉ được ghi nhận cho MaTV = userInfo.MaTV

### Lỗi Transaction Rollback
**Nguyên nhân**: Lỗi trong quá trình DELETE + INSERT
**Giải pháp**: Kiểm tra log, đảm bảo connection.release() được gọi

---

**Ngày tạo**: 27/12/2025  
**Version**: 1.0  
**Tác giả**: GitHub Copilot  
**Dự án**: SE104 Family Tree Management System  
**Liên quan**: PHAN-QUYEN-GUIDE.md (Phân quyền thành viên)
