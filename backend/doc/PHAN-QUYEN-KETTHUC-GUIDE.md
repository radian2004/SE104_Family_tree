# 🔐 HƯỚNG DẪN PHÂN QUYỀN - CHỨC NĂNG KẾT THÚC

## 📋 MỤC LỤC
1. [Tổng quan cơ sở dữ liệu](#1-tổng-quan-cơ-sở-dữ-liệu)
2. [Yêu cầu phân quyền](#2-yêu-cầu-phân-quyền)
3. [Thiết kế middleware](#3-thiết-kế-middleware)
4. [Cập nhật routes](#4-cập-nhật-routes)
5. [Cập nhật controllers](#5-cập-nhật-controllers)
6. [Cập nhật services](#6-cập-nhật-services)
7. [Test cases](#7-test-cases)
8. [Xử lý lỗi và messages](#8-xử-lý-lỗi-và-messages)
9. [Checklist triển khai](#9-checklist-triển-khai)

---

## 1. TỔNG QUAN CƠ SỞ DỮ LIỆU

### 1.1. Bảng THANHVIEN - Lưu thông tin kết thúc

Chức năng **Kết thúc** KHÔNG có bảng riêng mà được lưu trực tiếp vào bảng `THANHVIEN`:

```sql
CREATE TABLE THANHVIEN (
    MaTV VARCHAR(5) PRIMARY KEY,
    HoTen VARCHAR(50),
    NgayGioSinh DATE,
    DiaChi VARCHAR(50),
    TrangThai VARCHAR(20) DEFAULT 'Còn Sống',     -- 'Còn Sống' | 'Mất'
    -- ... các trường khác ...
    
    -- ⭐ CÁC TRƯỜNG LIÊN QUAN KẾT THÚC:
    NgayGioMat DATETIME,                          -- Thời điểm qua đời
    MaNguyenNhanMat VARCHAR(5),                   -- FK → NGUYENNHANMAT
    MaDiaDiem VARCHAR(5),                         -- FK → DIADIEMMAITANG
    MaGiaPha VARCHAR(5),                          -- ⚠️ QUAN TRỌNG cho phân quyền
    
    FOREIGN KEY(MaNguyenNhanMat) REFERENCES NGUYENNHANMAT(MaNguyenNhanMat),
    FOREIGN KEY(MaDiaDiem) REFERENCES DIADIEMMAITANG(MaDiaDiem)
);
```

### 1.2. Bảng tham chiếu

```sql
-- Nguyên nhân mất (bệnh, tai nạn, tuổi già, ...)
CREATE TABLE NGUYENNHANMAT(
    MaNguyenNhanMat VARCHAR(5) PRIMARY KEY,
    TenNguyenNhanMat VARCHAR(50) UNIQUE
);

-- Địa điểm mai táng (nghĩa trang, chùa, ...)
CREATE TABLE DIADIEMMAITANG(
    MaDiaDiem VARCHAR(5) PRIMARY KEY,
    TenDiaDiem VARCHAR(50) UNIQUE
);
```

### 1.3. Trigger tự động

```sql
-- Khi cập nhật NgayGioMat → Tự động chuyển TrangThai = 'Mất'
DELIMITER $$
CREATE TRIGGER update_trang_thai_mat
BEFORE UPDATE ON THANHVIEN
FOR EACH ROW
BEGIN
    IF NEW.NgayGioMat IS NOT NULL THEN
        SET NEW.TrangThai = 'Mất';
    END IF;
END$$
DELIMITER ;
```

**⚠️ Lưu ý:**
- Khi ghi nhận kết thúc: `UPDATE THANHVIEN SET NgayGioMat = ... WHERE MaTV = ?`
- Trigger tự động set `TrangThai = 'Mất'`
- Không cần INSERT vào bảng riêng

---

## 2. YÊU CẦU PHÂN QUYỀN

### 2.1. Tóm tắt quyền hạn

| Chức năng | Admin (LTK01) | Owner/TruongToc (LTK02) | User (LTK03) |
|-----------|--------------|------------------------|--------------|
| **Ghi nhận kết thúc** | ✅ Mọi thành viên | ✅ Trong gia phả | ❌ Không |
| **Xóa kết thúc** | ✅ Mọi thành viên | ✅ Trong gia phả | ❌ Không |
| **Sửa kết thúc** | ✅ Mọi thành viên | ✅ Trong gia phả | ❌ Không |
| **Tra cứu kết thúc** | ✅ Mọi gia phả | ✅ Trong gia phả | ✅ Trong gia phả |
| **Xem chi tiết** | ✅ Mọi gia phả | ✅ Trong gia phả | ✅ Trong gia phả |

### 2.2. Chi tiết yêu cầu

#### Admin (LTK01)
- ✅ **Ghi nhận** kết thúc cho **MỌI** thành viên từ **MỌI** gia phả
- ✅ **Xóa** kết thúc của **MỌI** thành viên (đưa về trạng thái "Còn Sống")
- ✅ **Chỉnh sửa** thông tin kết thúc của **MỌI** thành viên
- ✅ **Tra cứu** và **xem chi tiết** kết thúc của **MỌI** gia phả
- ⚠️ Không bị giới hạn bởi MaGiaPha

#### Owner/TruongToc (LTK02)
- ✅ **Ghi nhận** kết thúc cho **MỌI** thành viên **TRONG GIA PHẠ**
- ✅ **Xóa** kết thúc của **MỌI** thành viên **TRONG GIA PHẠ**
- ✅ **Chỉnh sửa** thông tin kết thúc của **MỌI** thành viên **TRONG GIA PHẠ**
- ✅ **Tra cứu** và **xem chi tiết** kết thúc **TRONG GIA PHẠ**
- ⚠️ Kiểm tra: `THANHVIEN.MaGiaPha = (MaGiaPha của Owner)`

#### User (LTK03)
- ❌ **KHÔNG** được ghi nhận kết thúc
- ❌ **KHÔNG** được xóa kết thúc
- ❌ **KHÔNG** được chỉnh sửa kết thúc
- ✅ Được **TRA CỨU** và **XEM CHI TIẾT** kết thúc **TRONG GIA PHẠ**
- ⚠️ Chỉ đọc (read-only), không được thay đổi dữ liệu

---

## 3. THIẾT KẾ MIDDLEWARE

### 3.1. Middleware: checkGhiNhanKetThucPermission

**Mục đích:** Kiểm tra quyền ghi nhận kết thúc (POST)

**Logic:**
- Admin: ✅ Toàn quyền
- Owner: ✅ Chỉ ghi nhận cho thành viên trong gia phạ
- User: ❌ Không có quyền

**Code:**

```typescript
/**
 * Kiểm tra quyền GHI NHẬN kết thúc
 * - Admin: ghi nhận cho mọi thành viên
 * - Owner: ghi nhận cho thành viên trong gia phả
 * - User: KHÔNG có quyền
 */
export const checkGhiNhanKetThucPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.body;  // MaTV của thành viên cần ghi nhận kết thúc
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // User không có quyền ghi nhận kết thúc
    if (userInfo.MaLoaiTK === 'LTK03') {
      throw new ErrorWithStatus({
        message: 'Bạn không có quyền ghi nhận kết thúc',
        status: HTTP_STATUS.FORBIDDEN
      });
    }
    
    // Owner: chỉ ghi nhận được thành viên trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02') {
      if (!userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chưa thuộc gia phả nào',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      // Kiểm tra thành viên có trong gia phả không
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
      
      if (memberRows[0].MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền ghi nhận kết thúc cho thành viên trong gia phả của mình',
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

### 3.2. Middleware: checkUpdateDeleteKetThucPermission

**Mục đích:** Kiểm tra quyền cập nhật/xóa kết thúc (PUT/DELETE)

**Logic:**
- Admin: ✅ Toàn quyền
- Owner: ✅ Chỉ sửa/xóa thành viên trong gia phả
- User: ❌ Không có quyền

**Code:**

```typescript
/**
 * Kiểm tra quyền CẬP NHẬT/XÓA kết thúc
 * - Admin: sửa/xóa được tất cả
 * - Owner: sửa/xóa được trong gia phả
 * - User: KHÔNG có quyền
 */
export const checkUpdateDeleteKetThucPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.params;  // MaTV trong URL params
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // User không có quyền sửa/xóa
    if (userInfo.MaLoaiTK === 'LTK03') {
      throw new ErrorWithStatus({
        message: 'Bạn không có quyền sửa/xóa thông tin kết thúc',
        status: HTTP_STATUS.FORBIDDEN
      });
    }
    
    // Owner: chỉ sửa/xóa được thành viên trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02') {
      if (!userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chưa thuộc gia phả nào',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
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
      
      if (memberRows[0].MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền sửa/xóa kết thúc của thành viên trong gia phả của mình',
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

## 4. CẬP NHẬT ROUTES

### 4.1. File: `ketthuc.routes.ts`

**Code đầy đủ:**

```typescript
import { Router } from 'express';
import {
  ghiNhanKetThucController,
  traCuuKetThucController,
  getChiTietKetThucController,
  capNhatKetThucController,
  xoaKetThucController
} from '~/controllers/ketthuc.controllers';
import { wrapAsync } from '~/utils/handlers';
import { 
  checkGhiNhanKetThucPermission,
  checkUpdateDeleteKetThucPermission,
  attachUserInfoMiddleware
} from '~/middlewares/authorization.middlewares';

const ketthucRouter = Router();

// ========================================
// ROUTES CẦN PHÂN QUYỀN
// ========================================

/**
 * POST /ketthuc/ghinhan - Ghi nhận kết thúc
 * - Admin: ghi nhận cho mọi thành viên
 * - Owner: ghi nhận cho thành viên trong gia phả
 * - User: KHÔNG có quyền
 */
ketthucRouter.post('/ghinhan', checkGhiNhanKetThucPermission, wrapAsync(ghiNhanKetThucController));

/**
 * GET /ketthuc/tracuu - Tra cứu kết thúc
 * - Admin: tra cứu tất cả
 * - Owner/User: chỉ tra cứu trong gia phả (filter tại service)
 */
ketthucRouter.get('/tracuu', attachUserInfoMiddleware, wrapAsync(traCuuKetThucController));

/**
 * GET /ketthuc/:MaTV - Xem chi tiết kết thúc
 * - Admin: xem tất cả
 * - Owner/User: chỉ xem trong gia phả (check tại service)
 */
ketthucRouter.get('/:MaTV', attachUserInfoMiddleware, wrapAsync(getChiTietKetThucController));

/**
 * PUT /ketthuc/:MaTV - Cập nhật thông tin kết thúc
 * - Admin: sửa được tất cả
 * - Owner: sửa được trong gia phả
 * - User: KHÔNG có quyền
 */
ketthucRouter.put('/:MaTV', checkUpdateDeleteKetThucPermission, wrapAsync(capNhatKetThucController));

/**
 * DELETE /ketthuc/:MaTV - Xóa kết thúc (đưa về trạng thái "Còn Sống")
 * - Admin: xóa được tất cả
 * - Owner: xóa được trong gia phả
 * - User: KHÔNG có quyền
 */
ketthucRouter.delete('/:MaTV', checkUpdateDeleteKetThucPermission, wrapAsync(xoaKetThucController));

export default ketthucRouter;
```

**⚠️ Thay đổi so với code hiện tại:**
1. ✅ Thêm import 3 middleware
2. ✅ Route `/ghinhan`: Thêm `checkGhiNhanKetThucPermission`
3. ✅ Route `/tracuu`: Thêm `attachUserInfoMiddleware`
4. ✅ Route `/:MaTV` (GET): Thêm `attachUserInfoMiddleware`
5. ✅ Route `/:MaTV` (PUT): Thêm `checkUpdateDeleteKetThucPermission`
6. ✅ Route `/:MaTV` (DELETE): Thêm `checkUpdateDeleteKetThucPermission`

---

## 5. CẬP NHẬT CONTROLLERS

### 5.1. Truyền userInfo vào service

**Các controller CẦN THÊM tham số `userInfo`:**

```typescript
/**
 * Controller 1: Ghi nhận kết thúc
 * ⚠️ Middleware đã check quyền, chỉ cần truyền userInfo vào service
 */
export const ghiNhanKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem } = req.body;
    const userInfo = req.userInfo;  // ⭐ LẤY TỪ MIDDLEWARE

    const result = await ketthucService.ghiNhanKetThuc({
      MaTV,
      NgayGioMat,
      MaNguyenNhanMat,
      MaDiaDiem
    }, userInfo);  // ⭐ TRUYỀN THÊM userInfo

    res.status(HTTP_STATUS.OK).json({
      message: result.message,
      data: {
        MaTV: result.MaTV
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller 2: Tra cứu kết thúc (với bộ lọc MaGiaPha)
 * ⭐ Thêm userInfo để filter theo gia phả
 */
export const traCuuKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      HoTen, 
      MaNguyenNhanMat,
      TenNguyenNhanMat,
      MaDiaDiem,
      TenDiaDiem,
      TuNgay, 
      DenNgay 
    } = req.query;
    const userInfo = req.userInfo;  // ⭐ LẤY TỪ MIDDLEWARE

    const results = await ketthucService.traCuuKetThuc({
      HoTen: HoTen as string | undefined,
      MaNguyenNhanMat: MaNguyenNhanMat as string | undefined,
      TenNguyenNhanMat: TenNguyenNhanMat as string | undefined,
      MaDiaDiem: MaDiaDiem as string | undefined,
      TenDiaDiem: TenDiaDiem as string | undefined,
      TuNgay: TuNgay as string | undefined,
      DenNgay: DenNgay as string | undefined
    }, userInfo);  // ⭐ TRUYỀN THÊM userInfo

    res.status(HTTP_STATUS.OK).json({
      message: 'Tra cứu kết thúc thành công',
      total: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller 3: Xem chi tiết kết thúc
 * ⭐ Kiểm tra quyền xem: Owner/User chỉ xem trong gia phả
 */
export const getChiTietKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { MaTV } = req.params;
    const userInfo = req.userInfo;  // ⭐ LẤY TỪ MIDDLEWARE

    const result = await ketthucService.getChiTietKetThuc(MaTV, userInfo);  // ⭐ TRUYỀN THÊM userInfo

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Không tìm thấy thông tin kết thúc của thành viên này'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy chi tiết kết thúc thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller 4: Cập nhật thông tin kết thúc
 * ⚠️ Middleware đã check quyền, controller chỉ gọi service
 */
export const capNhatKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { MaTV } = req.params;
    const { NgayGioMat, MaNguyenNhanMat, MaDiaDiem } = req.body;
    const userInfo = req.userInfo;  // ⭐ LẤY TỪ MIDDLEWARE (không bắt buộc)

    const result = await ketthucService.capNhatKetThuc(MaTV, {
      NgayGioMat,
      MaNguyenNhanMat,
      MaDiaDiem
    });

    res.status(HTTP_STATUS.OK).json({
      message: result.message,
      data: {
        MaTV: result.MaTV
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller 5: Xóa thông tin kết thúc
 * ⚠️ Middleware đã check quyền, controller chỉ gọi service
 */
export const xoaKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { MaTV } = req.params;
    const userInfo = req.userInfo;  // ⭐ LẤY TỪ MIDDLEWARE (không bắt buộc)

    const result = await ketthucService.xoaKetThuc(MaTV);

    res.status(HTTP_STATUS.OK).json({
      message: result.message,
      data: {
        MaTV: result.MaTV
      }
    });
  } catch (error) {
    next(error);
  }
};
```

**⚠️ Lưu ý:**
- Controller 1, 2, 3: **BẮT BUỘC** truyền `userInfo` vào service để filter
- Controller 4, 5: Middleware đã check quyền → không cần filter thêm tại service

---

## 6. CẬP NHẬT SERVICES

### 6.1. Thêm tham số userInfo vào service

**File: `ketthuc.services.ts`**

#### Hàm 1: ghiNhanKetThuc (không cần thay đổi logic)

```typescript
/**
 * 1. Ghi nhận kết thúc (thành viên qua đời)
 * ⚠️ Middleware đã check quyền → Service chỉ cần thực thi
 */
async ghiNhanKetThuc(payload: GhiNhanKetThucPayload, userInfo?: TaiKhoanInfo) {
  const { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem } = payload;
  
  const query = `
    UPDATE THANHVIEN
    SET NgayGioMat = ?,
        MaNguyenNhanMat = ?,
        MaDiaDiem = ?
    WHERE MaTV = ? AND TrangThai = 'Còn Sống'
  `;
  
  const result = await databaseService.query<ResultSetHeader>(
    query,
    [NgayGioMat, MaNguyenNhanMat, MaDiaDiem, MaTV]
  );
  
  if (result.affectedRows === 0) {
    throw new Error('Không tìm thấy thành viên hoặc thành viên đã được ghi nhận mất trước đó');
  }
  
  return {
    message: 'Ghi nhận kết thúc thành công',
    MaTV,
    affectedRows: result.affectedRows
  };
}
```

#### Hàm 2: traCuuKetThuc (THÊM FILTER MaGiaPha)

```typescript
/**
 * 2. Tra cứu danh sách thành viên đã kết thúc
 * ⭐ THÊM FILTER theo MaGiaPha
 */
async traCuuKetThuc(filters?: {
  HoTen?: string
  MaNguyenNhanMat?: string
  TenNguyenNhanMat?: string
  MaDiaDiem?: string
  TenDiaDiem?: string
  TuNgay?: string
  DenNgay?: string
}, userInfo?: TaiKhoanInfo): Promise<TraCuuKetThucResult[]> {
  let whereClauses: string[] = ["tv.TrangThai = 'Mất'"];
  const params: any[] = [];

  // ⭐ FILTER THEO MaGiaPha (Owner/User chỉ xem trong gia phả)
  if (userInfo && userInfo.MaLoaiTK !== 'LTK01') {
    // Không phải Admin → giới hạn theo gia phả
    if (!userInfo.MaGiaPha) {
      throw new Error('Bạn chưa thuộc gia phả nào');
    }
    whereClauses.push('tv.MaGiaPha = ?');
    params.push(userInfo.MaGiaPha);
  }

  // Lọc theo họ tên (LIKE search)
  if (filters?.HoTen) {
    whereClauses.push('tv.HoTen LIKE ?');
    params.push(`%${filters.HoTen}%`);
  }

  // Lọc theo TÊN nguyên nhân mất (LIKE search)
  if (filters?.TenNguyenNhanMat) {
    whereClauses.push('nnm.TenNguyenNhanMat LIKE ?');
    params.push(`%${filters.TenNguyenNhanMat}%`);
  }
  // Deprecated: Giữ để tương thích ngược
  else if (filters?.MaNguyenNhanMat) {
    whereClauses.push('tv.MaNguyenNhanMat = ?');
    params.push(filters.MaNguyenNhanMat);
  }

  // Lọc theo TÊN địa điểm mai táng (LIKE search)
  if (filters?.TenDiaDiem) {
    whereClauses.push('dd.TenDiaDiem LIKE ?');
    params.push(`%${filters.TenDiaDiem}%`);
  }
  // Deprecated: Giữ để tương thích ngược
  else if (filters?.MaDiaDiem) {
    whereClauses.push('tv.MaDiaDiem = ?');
    params.push(filters.MaDiaDiem);
  }

  // Lọc theo khoảng thời gian mất
  if (filters?.TuNgay) {
    whereClauses.push('DATE(tv.NgayGioMat) >= ?');
    params.push(filters.TuNgay);
  }

  if (filters?.DenNgay) {
    whereClauses.push('DATE(tv.NgayGioMat) <= ?');
    params.push(filters.DenNgay);
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const query = `
    SELECT 
      ROW_NUMBER() OVER (ORDER BY tv.NgayGioMat DESC) AS STT,
      tv.MaTV,
      tv.HoTen,
      DATE_FORMAT(tv.NgayGioMat, '%d/%m/%Y %H:%i:%s') AS NgayGioMat,
      COALESCE(nnm.TenNguyenNhanMat, 'Không rõ') AS TenNguyenNhanMat,
      COALESCE(dd.TenDiaDiem, 'Không rõ') AS TenDiaDiem
    FROM THANHVIEN tv
    LEFT JOIN NGUYENNHANMAT nnm ON tv.MaNguyenNhanMat = nnm.MaNguyenNhanMat
    LEFT JOIN DIADIEMMAITANG dd ON tv.MaDiaDiem = dd.MaDiaDiem
    ${whereClause}
    ORDER BY tv.NgayGioMat DESC
  `;

  const rows = await databaseService.query<RowDataPacket[]>(query, params);
  return rows as TraCuuKetThucResult[];
}
```

#### Hàm 3: getChiTietKetThuc (KIỂM TRA MaGiaPha)

```typescript
/**
 * 3. Xem chi tiết thông tin kết thúc của một thành viên
 * ⭐ KIỂM TRA quyền xem: Owner/User chỉ xem trong gia phả
 */
async getChiTietKetThuc(MaTV: string, userInfo?: TaiKhoanInfo): Promise<KetThucRow | null> {
  const query = `
    SELECT 
      tv.MaTV,
      tv.HoTen,
      tv.NgayGioSinh,
      tv.NgayGioMat,
      tv.TrangThai,
      tv.MaNguyenNhanMat,
      nnm.TenNguyenNhanMat,
      tv.MaDiaDiem,
      dd.TenDiaDiem,
      tv.MaGiaPha  -- ⭐ THÊM MaGiaPha để check quyền
    FROM THANHVIEN tv
    LEFT JOIN NGUYENNHANMAT nnm ON tv.MaNguyenNhanMat = nnm.MaNguyenNhanMat
    LEFT JOIN DIADIEMMAITANG dd ON tv.MaDiaDiem = dd.MaDiaDiem
    WHERE tv.MaTV = ? AND tv.TrangThai = 'Mất'
  `;

  const rows = await databaseService.query<RowDataPacket[]>(query, [MaTV]);
  
  if (rows.length === 0) {
    return null;
  }

  const member = rows[0];

  // ⭐ KIỂM TRA quyền xem (Owner/User chỉ xem trong gia phả)
  if (userInfo && userInfo.MaLoaiTK !== 'LTK01') {
    // Không phải Admin → kiểm tra gia phả
    if (!userInfo.MaGiaPha) {
      throw new Error('Bạn chưa thuộc gia phả nào');
    }
    
    if (member.MaGiaPha !== userInfo.MaGiaPha) {
      throw new ErrorWithStatus({
        message: 'Bạn chỉ có quyền xem thông tin kết thúc của thành viên trong gia phả của mình',
        status: 403  // HTTP_STATUS.FORBIDDEN
      });
    }
  }

  return member as KetThucRow;
}
```

#### Hàm 4 & 5: capNhatKetThuc, xoaKetThuc (KHÔNG CẦN THAY ĐỔI)

```typescript
/**
 * 4. Cập nhật thông tin kết thúc
 * ⚠️ Middleware đã check quyền → Service chỉ cần thực thi
 */
async capNhatKetThuc(MaTV: string, updates: {
  NgayGioMat?: string
  MaNguyenNhanMat?: string
  MaDiaDiem?: string
}) {
  // ... Code KHÔNG THAY ĐỔI ...
}

/**
 * 5. Xóa thông tin kết thúc (đưa về "Còn Sống")
 * ⚠️ Middleware đã check quyền → Service chỉ cần thực thi
 */
async xoaKetThuc(MaTV: string) {
  // ... Code KHÔNG THAY ĐỔI ...
}
```

**⚠️ Tóm tắt thay đổi:**
1. ✅ `traCuuKetThuc`: Thêm filter `tv.MaGiaPha = ?` nếu không phải Admin
2. ✅ `getChiTietKetThuc`: Thêm check quyền xem theo MaGiaPha
3. ✅ Các hàm khác: Không cần thay đổi (middleware đã check)

---

## 7. TEST CASES

### 7.1. Test Admin (LTK01) - Toàn quyền

```http
# Test 1: Admin ghi nhận kết thúc cho thành viên NGOÀI gia phạ
POST http://localhost:3000/users/ketthuc/ghinhan
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
Body: {
  "MaTV": "TV01",  # Thành viên gia phả khác
  "NgayGioMat": "2025-01-10 14:30:00",
  "MaNguyenNhanMat": "NNM01",
  "MaDiaDiem": "DD01"
}
# ✅ Kết quả: Ghi nhận thành công

# Test 2: Admin tra cứu kết thúc TẤT CẢ gia phả
GET http://localhost:3000/users/ketthuc/tracuu?HoTen=Nguyễn
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
# ✅ Kết quả: Trả về thành viên từ MỌI gia phả

# Test 3: Admin xem chi tiết kết thúc thành viên NGOÀI gia phạ
GET http://localhost:3000/users/ketthuc/TV01
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
# ✅ Kết quả: Xem được chi tiết

# Test 4: Admin cập nhật kết thúc thành viên NGOÀI gia phạ
PUT http://localhost:3000/users/ketthuc/TV01
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
Body: {
  "MaNguyenNhanMat": "NNM02",
  "MaDiaDiem": "DD02"
}
# ✅ Kết quả: Cập nhật thành công

# Test 5: Admin xóa kết thúc thành viên NGOÀI gia phạ
DELETE http://localhost:3000/users/ketthuc/TV01
Headers: {
  "Authorization": "Bearer <admin_access_token>"
}
# ✅ Kết quả: Xóa thành công (đưa về "Còn Sống")
```

### 7.2. Test Owner (LTK02) - Trong gia phả

```http
# Test 1: Owner ghi nhận kết thúc cho thành viên TRONG gia phạ
POST http://localhost:3000/users/ketthuc/ghinhan
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
Body: {
  "MaTV": "TV04",  # Thành viên cùng gia phả
  "NgayGioMat": "2025-01-20 10:00:00",
  "MaNguyenNhanMat": "NNM03",
  "MaDiaDiem": "DD01"
}
# ✅ Kết quả: Ghi nhận thành công

# Test 1.1: Owner ghi nhận kết thúc cho thành viên NGOÀI gia phạ
POST http://localhost:3000/users/ketthuc/ghinhan
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
Body: {
  "MaTV": "TV01",  # Thành viên gia phả khác
  "NgayGioMat": "2025-01-20 10:00:00",
  "MaNguyenNhanMat": "NNM01",
  "MaDiaDiem": "DD01"
}
# ❌ Kết quả: 403 Forbidden - "Bạn chỉ có quyền ghi nhận kết thúc cho thành viên trong gia phả của mình"

# Test 2: Owner tra cứu kết thúc TRONG gia phạ
GET http://localhost:3000/users/ketthuc/tracuu
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
# ✅ Kết quả: Chỉ trả về thành viên trong gia phả

# Test 3: Owner xem chi tiết kết thúc NGOÀI gia phạ
GET http://localhost:3000/users/ketthuc/TV01
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
# ❌ Kết quả: 403 Forbidden - "Bạn chỉ có quyền xem thông tin kết thúc của thành viên trong gia phả của mình"

# Test 4: Owner cập nhật kết thúc TRONG gia phạ
PUT http://localhost:3000/users/ketthuc/TV04
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
Body: {
  "MaDiaDiem": "DD02"
}
# ✅ Kết quả: Cập nhật thành công

# Test 4.1: Owner cập nhật kết thúc NGOÀI gia phạ
PUT http://localhost:3000/users/ketthuc/TV01
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
Body: {
  "MaDiaDiem": "DD02"
}
# ❌ Kết quả: 403 Forbidden

# Test 5: Owner xóa kết thúc TRONG gia phạ
DELETE http://localhost:3000/users/ketthuc/TV04
Headers: {
  "Authorization": "Bearer <owner_access_token>"
}
# ✅ Kết quả: Xóa thành công
```

### 7.3. Test User (LTK03) - Chỉ xem

```http
# Test 1: User cố ghi nhận kết thúc
POST http://localhost:3000/users/ketthuc/ghinhan
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
Body: {
  "MaTV": "TV06",  # Chính mình
  "NgayGioMat": "2025-01-25 15:00:00",
  "MaNguyenNhanMat": "NNM01",
  "MaDiaDiem": "DD01"
}
# ❌ Kết quả: 403 Forbidden - "Bạn không có quyền ghi nhận kết thúc"

# Test 2: User tra cứu kết thúc TRONG gia phạ
GET http://localhost:3000/users/ketthuc/tracuu?HoTen=Trần
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
# ✅ Kết quả: Chỉ trả về thành viên trong gia phả

# Test 3: User xem chi tiết kết thúc TRONG gia phạ
GET http://localhost:3000/users/ketthuc/TV04
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
# ✅ Kết quả: Xem được chi tiết

# Test 3.1: User xem chi tiết kết thúc NGOÀI gia phạ
GET http://localhost:3000/users/ketthuc/TV01
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
# ❌ Kết quả: 403 Forbidden

# Test 4: User cố cập nhật kết thúc
PUT http://localhost:3000/users/ketthuc/TV04
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
Body: {
  "MaDiaDiem": "DD02"
}
# ❌ Kết quả: 403 Forbidden - "Bạn không có quyền sửa/xóa thông tin kết thúc"

# Test 5: User cố xóa kết thúc
DELETE http://localhost:3000/users/ketthuc/TV04
Headers: {
  "Authorization": "Bearer <user_access_token>"
}
# ❌ Kết quả: 403 Forbidden - "Bạn không có quyền sửa/xóa thông tin kết thúc"
```

---

## 8. XỬ LÝ LỖI VÀ MESSAGES

### 8.1. Các thông báo lỗi cần thêm

**File: `constants/messages.ts`**

```typescript
export const KETTHUC_MESSAGES = {
  // Thành công
  GHI_NHAN_SUCCESS: 'Ghi nhận kết thúc thành công',
  CAP_NHAT_SUCCESS: 'Cập nhật thông tin kết thúc thành công',
  XOA_SUCCESS: 'Xóa thông tin kết thúc thành công (trở về trạng thái Còn Sống)',
  TRA_CUU_SUCCESS: 'Tra cứu kết thúc thành công',
  
  // Lỗi quyền hạn
  NO_PERMISSION_GHI_NHAN: 'Bạn không có quyền ghi nhận kết thúc',
  NO_PERMISSION_UPDATE_DELETE: 'Bạn không có quyền sửa/xóa thông tin kết thúc',
  ONLY_IN_GIAPHA_GHI_NHAN: 'Bạn chỉ có quyền ghi nhận kết thúc cho thành viên trong gia phả của mình',
  ONLY_IN_GIAPHA_UPDATE_DELETE: 'Bạn chỉ có quyền sửa/xóa kết thúc của thành viên trong gia phả của mình',
  ONLY_IN_GIAPHA_VIEW: 'Bạn chỉ có quyền xem thông tin kết thúc của thành viên trong gia phả của mình',
  
  // Lỗi dữ liệu
  MEMBER_NOT_FOUND: 'Không tìm thấy thành viên',
  MEMBER_ALREADY_DEAD: 'Thành viên đã được ghi nhận mất trước đó',
  MEMBER_NOT_DEAD: 'Thành viên chưa được ghi nhận mất',
  NO_GIAPHA: 'Bạn chưa thuộc gia phả nào',
  NO_UPDATE_DATA: 'Không có thông tin cần cập nhật',
  
  // Lỗi validation
  INVALID_DATE: 'Ngày giờ mất không hợp lệ',
  DATE_BEFORE_BIRTH: 'Ngày giờ mất phải sau ngày sinh'
} as const;
```

### 8.2. Error handling patterns

```typescript
// Pattern 1: User không có quyền
throw new ErrorWithStatus({
  message: KETTHUC_MESSAGES.NO_PERMISSION_GHI_NHAN,
  status: HTTP_STATUS.FORBIDDEN
});

// Pattern 2: Không tìm thấy thành viên
throw new ErrorWithStatus({
  message: KETTHUC_MESSAGES.MEMBER_NOT_FOUND,
  status: HTTP_STATUS.NOT_FOUND
});

// Pattern 3: Thành viên đã mất
throw new Error(KETTHUC_MESSAGES.MEMBER_ALREADY_DEAD);

// Pattern 4: Chưa thuộc gia phả
throw new ErrorWithStatus({
  message: KETTHUC_MESSAGES.NO_GIAPHA,
  status: HTTP_STATUS.FORBIDDEN
});
```

---

## 9. CHECKLIST TRIỂN KHAI

### 9.1. Middleware (`authorization.middlewares.ts`)

- [ ] Thêm 2 middleware mới:
  - [ ] `checkGhiNhanKetThucPermission`
  - [ ] `checkUpdateDeleteKetThucPermission`
- [ ] Export middleware để sử dụng trong routes

### 9.2. Routes (`ketthuc.routes.ts`)

- [ ] Import middleware từ `authorization.middlewares.ts`
- [ ] Áp dụng middleware cho từng route:
  - [ ] POST `/ghinhan` → `checkGhiNhanKetThucPermission`
  - [ ] GET `/tracuu` → `attachUserInfoMiddleware`
  - [ ] GET `/:MaTV` → `attachUserInfoMiddleware`
  - [ ] PUT `/:MaTV` → `checkUpdateDeleteKetThucPermission`
  - [ ] DELETE `/:MaTV` → `checkUpdateDeleteKetThucPermission`

### 9.3. Controllers (`ketthuc.controllers.ts`)

- [ ] Cập nhật 3 controllers:
  - [ ] `ghiNhanKetThucController`: Thêm `userInfo` từ `req.userInfo`
  - [ ] `traCuuKetThucController`: Truyền `userInfo` vào service
  - [ ] `getChiTietKetThucController`: Truyền `userInfo` vào service

### 9.4. Services (`ketthuc.services.ts`)

- [ ] Cập nhật 2 services:
  - [ ] `traCuuKetThuc`: Thêm filter `MaGiaPha` cho Owner/User
  - [ ] `getChiTietKetThuc`: Kiểm tra quyền xem theo `MaGiaPha`
- [ ] Thêm import `ErrorWithStatus` nếu chưa có

### 9.5. Messages (`constants/messages.ts`)

- [ ] Thêm object `KETTHUC_MESSAGES` với tất cả thông báo
- [ ] Update các error messages trong service để sử dụng constants

### 9.6. Type Definitions (`type.d.ts`)

- [ ] Thêm `userInfo` vào interface Request:
  ```typescript
  declare namespace Express {
    interface Request {
      decoded_authorization?: TokenPayload;
      userInfo?: TaiKhoanInfo;  // ⭐ THÊM DÒNG NÀY
    }
  }
  ```

### 9.7. Testing

- [ ] Test Admin (5 test cases)
- [ ] Test Owner (9 test cases - bao gồm các trường hợp ngoài gia phả)
- [ ] Test User (5 test cases)
- [ ] Test edge cases:
  - [ ] User chưa thuộc gia phả nào
  - [ ] Thành viên không tồn tại
  - [ ] Thành viên đã mất trước đó

---

## 10. LƯU Ý QUAN TRỌNG

### 10.1. Khác biệt so với Thành tích

| Đặc điểm | Thành tích | Kết thúc |
|----------|-----------|----------|
| **Bảng dữ liệu** | GHINHANTHANHTICH (riêng) | THANHVIEN (tích hợp) |
| **Primary Key** | Composite (MaLTT, MaTV, NgayPhatSinh) | MaTV (params) |
| **Lấy MaTV** | Từ `req.body` | Từ `req.params` |
| **User quyền thêm** | ✅ Chỉ cho mình | ❌ Không được thêm |
| **User quyền xóa/sửa** | Có giới hạn | ❌ Hoàn toàn không |

### 10.2. Trigger tự động

```sql
-- Khi UPDATE NgayGioMat → TrangThai tự động = 'Mất'
-- Khi DELETE kết thúc → SET NgayGioMat = NULL, TrangThai = 'Còn Sống'
```

⚠️ **Không cần gọi UPDATE TrangThai thủ công!**

### 10.3. Xử lý xóa kết thúc

```typescript
// ❌ SAI: Chỉ xóa NgayGioMat
UPDATE THANHVIEN SET NgayGioMat = NULL WHERE MaTV = ?

// ✅ ĐÚNG: Xóa toàn bộ thông tin kết thúc
UPDATE THANHVIEN
SET NgayGioMat = NULL,
    MaNguyenNhanMat = NULL,
    MaDiaDiem = NULL,
    TrangThai = 'Còn Sống'
WHERE MaTV = ? AND TrangThai = 'Mất'
```

### 10.4. User chỉ được xem (Read-only)

```typescript
// User KHÔNG có bất kỳ quyền CRU (Create/Update/Delete) nào
// Chỉ được R (Read) trong gia phả
if (userInfo.MaLoaiTK === 'LTK03') {
  // CHỈ CHO PHÉP: traCuuKetThuc, getChiTietKetThuc
  // CẤM: ghiNhanKetThuc, capNhatKetThuc, xoaKetThuc
}
```

---

## 📚 PHỤ LỤC

### A. So sánh với Thành tích

| Tiêu chí | Thành tích | Kết thúc |
|----------|-----------|----------|
| Middleware ghi nhận | checkGhiNhanThanhTichPermission | checkGhiNhanKetThucPermission |
| User ghi nhận | ✅ Của mình | ❌ Không được |
| User xóa | ✅ Trong gia phả | ❌ Không được |
| User sửa | ✅ Của mình | ❌ Không được |
| Owner quyền | Toàn bộ gia phả | Toàn bộ gia phả |
| Lấy MaTV | req.body | req.params |

### B. Flow hoàn chỉnh

```
Request → Route (middleware) → Controller → Service → Database
         ↓                    ↓            ↓
    Check quyền          Get userInfo   Filter MaGiaPha
```

---

## 11. SỬA LỖI COMPILE ERRORS

### 11.1. Lỗi 1: Missing import TaiKhoanInfo trong ketthuc.services.ts

**Lỗi:**
```
Cannot find name 'TaiKhoanInfo'.
```

**Nguyên nhân:** 
File `ketthuc.services.ts` sử dụng type `TaiKhoanInfo` nhưng chưa import.

**Giải pháp:**

Thêm import vào đầu file `ketthuc.services.ts`:

```typescript
import databaseService from './database.services'
import { KetThucRow, TraCuuKetThucResult, GhiNhanKetThucPayload } from '~/models/schemas/KetThuc.schema'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

// ⭐ THÊM DÒNG NÀY
interface TaiKhoanInfo extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MaLoaiTK: string;
  MaGiaPha: string | null;
}

class KetThucService {
  // ... rest of code
}
```

**Hoặc:** Import từ file khác nếu đã định nghĩa ở đâu đó:

```typescript
import { TaiKhoanInfo } from '~/middlewares/authorization.middlewares'
```

**⚠️ Lưu ý:** Nếu export từ middleware, cần thêm `export` trước interface:

```typescript
// File: authorization.middlewares.ts
export interface TaiKhoanInfo extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MaLoaiTK: string;
  MaGiaPha: string | null;
}
```

---

### 11.2. Lỗi 2: Missing import ErrorWithStatus trong ketthuc.services.ts

**Lỗi:**
```
Cannot find name 'ErrorWithStatus'.
```

**Nguyên nhân:** 
File `ketthuc.services.ts` throw `ErrorWithStatus` nhưng chưa import.

**Giải pháp:**

Thêm import vào đầu file `ketthuc.services.ts`:

```typescript
import databaseService from './database.services'
import { KetThucRow, TraCuuKetThucResult, GhiNhanKetThucPayload } from '~/models/schemas/KetThuc.schema'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { ErrorWithStatus } from '~/models/Errors'  // ⭐ THÊM DÒNG NÀY
import HTTP_STATUS from '~/constants/httpStatus'    // ⭐ THÊM DÒNG NÀY (nếu chưa có)
```

**Vị trí sử dụng trong code:**

```typescript
// Trong hàm getChiTietKetThuc
if (member.MaGiaPha !== userInfo.MaGiaPha) {
  throw new ErrorWithStatus({
    message: 'Bạn chỉ có quyền xem thông tin kết thúc của thành viên trong gia phả của mình',
    status: HTTP_STATUS.FORBIDDEN  // Cần import HTTP_STATUS
  });
}
```

---

### 11.3. Lỗi 3: Expected 1 argument, but got 2 trong ketthuc.controllers.ts

**Lỗi:**
```typescript
const result = await ketthucService.ghiNhanKetThuc({
  MaTV,
  NgayGioMat,
  MaNguyenNhanMat,
  MaDiaDiem
}, userInfo);  // ❌ Expected 1 arguments, but got 2
```

**Nguyên nhân:** 
Hàm `ghiNhanKetThuc` trong service chỉ nhận 1 tham số `payload`, chưa có tham số `userInfo`.

**Giải pháp:**

Cập nhật signature của hàm `ghiNhanKetThuc` trong `ketthuc.services.ts`:

**❌ Code cũ (SAI):**
```typescript
async ghiNhanKetThuc(payload: GhiNhanKetThucPayload) {
  const { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem } = payload;
  // ...
}
```

**✅ Code mới (ĐÚNG):**
```typescript
async ghiNhanKetThuc(payload: GhiNhanKetThucPayload, userInfo?: TaiKhoanInfo) {
  const { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem } = payload;
  // ... rest of code không đổi
}
```

**⚠️ Lưu ý:** 
- Middleware đã check quyền rồi, nên hàm này **KHÔNG CẦN** thêm logic kiểm tra quyền
- Tham số `userInfo` có thể optional (`?`) vì chỉ dùng trong trường hợp cần thêm thông tin log/audit

---

### 11.4. Tóm tắt các file cần sửa

#### File 1: `ketthuc.services.ts`

```typescript
// ⭐ THÊM IMPORTS
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'

// ⭐ THÊM INTERFACE (hoặc import từ middleware)
interface TaiKhoanInfo extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MaLoaiTK: string;
  MaGiaPha: string | null;
}

class KetThucService {
  // ⭐ SỬA SIGNATURE - THÊM userInfo
  async ghiNhanKetThuc(payload: GhiNhanKetThucPayload, userInfo?: TaiKhoanInfo) {
    // Code không đổi
  }

  // ⭐ Code đã đúng - đã có userInfo
  async traCuuKetThuc(filters?: {...}, userInfo?: TaiKhoanInfo): Promise<TraCuuKetThucResult[]> {
    // ...
  }

  // ⭐ Code đã đúng - đã có userInfo
  async getChiTietKetThuc(MaTV: string, userInfo?: TaiKhoanInfo): Promise<KetThucRow | null> {
    // ...
  }
}
```

#### File 2: `authorization.middlewares.ts` (nếu muốn export interface)

```typescript
// ⭐ THÊM EXPORT
export interface TaiKhoanInfo extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MaLoaiTK: string;
  MaGiaPha: string | null;
}
```

#### File 3: `ketthuc.controllers.ts`

**✅ Code đã ĐÚNG** - Không cần sửa gì, chỉ cần service có đúng signature.

---

### 11.5. Checklist sửa lỗi

- [ ] **ketthuc.services.ts:**
  - [ ] Import `ErrorWithStatus` từ `~/models/Errors`
  - [ ] Import `HTTP_STATUS` từ `~/constants/httpStatus`
  - [ ] Thêm interface `TaiKhoanInfo` (hoặc import từ middleware)
  - [ ] Sửa signature `ghiNhanKetThuc`: thêm tham số `userInfo?: TaiKhoanInfo`

- [ ] **authorization.middlewares.ts:**
  - [ ] Export interface `TaiKhoanInfo` nếu muốn dùng chung

- [ ] **Kiểm tra compile:**
  - [ ] Chạy `npm run build` hoặc `tsc` để kiểm tra lỗi
  - [ ] Không còn compile errors

- [ ] **Test runtime:**
  - [ ] Test ghi nhận kết thúc với Admin
  - [ ] Test tra cứu với Owner/User (kiểm tra filter MaGiaPha)
  - [ ] Test xem chi tiết với User ngoài gia phả (phải bị chặn)

---

## 12. FLOW SỬA LỖI NHANH

### Cách 1: Định nghĩa interface trong service (Đơn giản nhất)

**File: `ketthuc.services.ts`**

```typescript
import databaseService from './database.services'
import { KetThucRow, TraCuuKetThucResult, GhiNhanKetThucPayload } from '~/models/schemas/KetThuc.schema'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'

// ⭐ ĐỊNH NGHĨA LOCAL
interface TaiKhoanInfo extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MaLoaiTK: string;
  MaGiaPha: string | null;
}

class KetThucService {
  async ghiNhanKetThuc(payload: GhiNhanKetThucPayload, userInfo?: TaiKhoanInfo) {
    // ... code cũ không đổi
  }
  
  async traCuuKetThuc(filters?: {...}, userInfo?: TaiKhoanInfo): Promise<TraCuuKetThucResult[]> {
    // ... code cũ không đổi
  }
  
  async getChiTietKetThuc(MaTV: string, userInfo?: TaiKhoanInfo): Promise<KetThucRow | null> {
    // ... code cũ không đổi
  }
}
```

### Cách 2: Export và reuse interface (Clean code hơn)

**Bước 1:** Export từ middleware

**File: `authorization.middlewares.ts`**

```typescript
// ⭐ THÊM EXPORT
export interface TaiKhoanInfo extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MaLoaiTK: string;
  MaGiaPha: string | null;
}
```

**Bước 2:** Import vào service

**File: `ketthuc.services.ts`**

```typescript
import databaseService from './database.services'
import { KetThucRow, TraCuuKetThucResult, GhiNhanKetThucPayload } from '~/models/schemas/KetThuc.schema'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { TaiKhoanInfo } from '~/middlewares/authorization.middlewares'  // ⭐ IMPORT

class KetThucService {
  // ... giờ có thể dùng TaiKhoanInfo
}
```

**Bước 3:** Sửa signature hàm ghiNhanKetThuc

```typescript
// ❌ CŨ
async ghiNhanKetThuc(payload: GhiNhanKetThucPayload) {

// ✅ MỚI
async ghiNhanKetThuc(payload: GhiNhanKetThucPayload, userInfo?: TaiKhoanInfo) {
```

---

## 13. SỬA LỖI TYPE INCOMPATIBILITY

### 13.1. Lỗi 4: Type incompatibility giữa TaiKhoanInfo

**Lỗi:**
```
Argument of type '{ TenDangNhap: string; MaTV: string; MaLoaiTK: string; MaGiaPha: string | null; } | undefined' 
is not assignable to parameter of type 'TaiKhoanInfo | undefined'.
  The types of 'constructor.name' are incompatible between these types.
    Type 'string' is not assignable to type '"RowDataPacket"'.
```

**Nguyên nhân:** 
- Có **2 định nghĩa khác nhau** của interface `TaiKhoanInfo`:
  1. Trong `authorization.middlewares.ts` (extends RowDataPacket)
  2. Trong `ketthuc.services.ts` (extends RowDataPacket)
- Dù cùng cấu trúc nhưng TypeScript coi chúng là 2 type khác nhau
- Object từ middleware không tương thích với type trong service

**Giải pháp: Sử dụng CHUNG 1 định nghĩa**

---

### 13.2. Cách sửa: Cập nhật type.d.ts để dùng TaiKhoanInfo

**Vấn đề thực sự:**
- Trong `type.d.ts`, `req.userInfo` được định nghĩa là object literal:
  ```typescript
  userInfo?: {
    TenDangNhap: string;
    MaTV: string;
    MaLoaiTK: string;
    MaGiaPha: string | null;
  };
  ```
- Trong service, tham số yêu cầu type `TaiKhoanInfo` (extends RowDataPacket)
- TypeScript không chấp nhận plain object với interface extends RowDataPacket

**Giải pháp: Sửa type.d.ts để dùng TaiKhoanInfo**

---

#### Bước 1: Export interface từ `authorization.middlewares.ts`

**File: `authorization.middlewares.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { ErrorWithStatus } from '~/models/Errors';
import HTTP_STATUS from '~/constants/httpStatus';
import databaseService from '~/services/database.services';
import { RowDataPacket } from 'mysql2';
import { TokenPayload } from '~/models/requests/User.requests';
import { userInfo } from 'node:os';

// ⭐ THÊM EXPORT
export interface TaiKhoanInfo extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MaLoaiTK: string;
  MaGiaPha: string | null;
}

/**
 * Lấy thông tin tài khoản và gia phả của user từ token
 */
const getUserInfo = async (user_id: string): Promise<TaiKhoanInfo> => {
  // ... rest of code
};
```

**⚠️ CHỈ THÊM `export` trước `interface`**

---

#### Bước 2: Cập nhật `type.d.ts` để import và dùng TaiKhoanInfo

**File: `type.d.ts`**

**❌ Code cũ (SAI):**
```typescript
import { Request } from 'express';
import { TokenPayload } from './models/requests/User.requests';

declare module 'express' {
  interface Request {
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;
    cookies: {
      access_token?: string;
      refresh_token?: string;
      [key: string]: any;
    };
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;
    userInfo?: {                          // ❌ XÓA object literal này
      TenDangNhap: string;
      MaTV: string;
      MaLoaiTK: string;
      MaGiaPha: string | null;
    };
  }
}
```

**✅ Code mới (ĐÚNG):**
```typescript
import { Request } from 'express';
import { TokenPayload } from './models/requests/User.requests';
import { TaiKhoanInfo } from './middlewares/authorization.middlewares';  // ⭐ THÊM IMPORT

declare module 'express' {
  interface Request {
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;
    cookies: {
      access_token?: string;
      refresh_token?: string;
      [key: string]: any;
    };
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;
    userInfo?: TaiKhoanInfo;  // ⭐ DÙNG TYPE TaiKhoanInfo
  }
}
```

---

#### Bước 3: Import TaiKhoanInfo vào `ketthuc.services.ts`

**File: `ketthuc.services.ts`**

**❌ Code cũ (SAI):**
```typescript
import databaseService from './database.services'
import { KetThucRow, TraCuuKetThucResult, GhiNhanKetThucPayload } from '~/models/schemas/KetThuc.schema'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'

// ❌ XÓA DÒNG NÀY
interface TaiKhoanInfo extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MaLoaiTK: string;
  MaGiaPha: string | null;
}

class KetThucService {
  // ...
}
```

**✅ Code mới (ĐÚNG):**
```typescript
import databaseService from './database.services'
import { KetThucRow, TraCuuKetThucResult, GhiNhanKetThucPayload } from '~/models/schemas/KetThuc.schema'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { TaiKhoanInfo } from '~/middlewares/authorization.middlewares'  // ⭐ IMPORT

class KetThucService {
  async ghiNhanKetThuc(payload: GhiNhanKetThucPayload, userInfo?: TaiKhoanInfo) {
    // ... code không đổi
  }

  async traCuuKetThuc(filters?: {...}, userInfo?: TaiKhoanInfo): Promise<TraCuuKetThucResult[]> {
    // ... code không đổi
  }

  async getChiTietKetThuc(MaTV: string, userInfo?: TaiKhoanInfo): Promise<KetThucRow | null> {
    // ... code không đổi
  }
}
```

---

### 13.3. Tóm tắt thay đổi

#### File 1: `authorization.middlewares.ts` (1 thay đổi)

**Thay đổi dòng 10:**

```diff
- interface TaiKhoanInfo extends RowDataPacket {
+ export interface TaiKhoanInfo extends RowDataPacket {
```

#### File 2: `type.d.ts` (2 thay đổi)

**Thêm import và sửa userInfo:**

```diff
  import { Request } from 'express';
  import { TokenPayload } from './models/requests/User.requests';
+ import { TaiKhoanInfo } from './middlewares/authorization.middlewares';
  
  declare module 'express-serve-static-core' {
    interface Request {
      decoded_authorization?: TokenPayload;
      decoded_refresh_token?: TokenPayload;
-     userInfo?: {
-       TenDangNhap: string;
-       MaTV: string;
-       MaLoaiTK: string;
-       MaGiaPha: string | null;
-     };
+     userInfo?: TaiKhoanInfo;
    }
  }
```

#### File 3: `ketthuc.services.ts` (2 thay đổi)

**Thêm import và xóa duplicate interface:**

```diff
  import databaseService from './database.services'
  import { KetThucRow, TraCuuKetThucResult, GhiNhanKetThucPayload } from '~/models/schemas/KetThuc.schema'
  import { RowDataPacket, ResultSetHeader } from 'mysql2'
  import { ErrorWithStatus } from '~/models/Errors'
  import HTTP_STATUS from '~/constants/httpStatus'
+ import { TaiKhoanInfo } from '~/middlewares/authorization.middlewares'
  
- interface TaiKhoanInfo extends RowDataPacket {
-   TenDangNhap: string;
-   MaTV: string;
-   MaLoaiTK: string;
-   MaGiaPha: string | null;
- }

  class KetThucService {
```

---

### 13.4. Tại sao lỗi này xảy ra?

**TypeScript Type System:**

```typescript
// File A
interface User { name: string }

// File B
interface User { name: string }

// Dù giống hệt nhau nhưng TS coi đây là 2 type khác nhau!
const userA: UserFromFileA = { name: "John" };
const userB: UserFromFileB = userA;  // ❌ Type error!
```

**Giải pháp:**
- Chỉ định nghĩa interface **1 LẦN DUY NHẤT**
- Export từ nơi định nghĩa
- Import và dùng lại ở các file khác

---

### 13.5. Checklist sửa lỗi Type Incompatibility

- [ ] **authorization.middlewares.ts:**
  - [ ] Thêm `export` trước `interface TaiKhoanInfo`
  - [ ] Không thay đổi gì khác

- [ ] **ketthuc.services.ts:**
  - [ ] Import `TaiKhoanInfo` từ `~/middlewares/authorization.middlewares`
  - [ ] **XÓA** định nghĩa duplicate của `interface TaiKhoanInfo`
  - [ ] Các hàm giữ nguyên signature với `userInfo?: TaiKhoanInfo`

- [ ] **Kiểm tra:**
  - [ ] Chạy `npm run build` hoặc `tsc`
  - [ ] Không còn lỗi "Type incompatibility"
  - [ ] Không còn lỗi "Cannot find name 'TaiKhoanInfo'"

---

### 13.6. Các service khác cũng cần import

Nếu các service khác (thanhvien, thanhtich, honnhan, quanhecon) cũng cần dùng `TaiKhoanInfo`:

**File: `thanhvien.services.ts`, `thanhtich.services.ts`, etc.**

```typescript
import { TaiKhoanInfo } from '~/middlewares/authorization.middlewares'

class ThanhVienService {
  async getAllThanhVien(userInfo?: TaiKhoanInfo) {
    // ... có thể dùng userInfo
  }
}
```

**⚠️ QUAN TRỌNG:**
- **KHÔNG** định nghĩa lại `interface TaiKhoanInfo` trong bất kỳ file nào
- **CHỈ** import từ `authorization.middlewares.ts`
- Đảm bảo tất cả các file dùng **CÙNG 1 TYPE**

---

## 14. FLOW SỬA LỖI HOÀN CHỈNH

### Bước 1: Export interface (1 file)
**File: `authorization.middlewares.ts` - Dòng 10**
```typescript
export interface TaiKhoanInfo extends RowDataPacket {
```

### Bước 2: Import và xóa duplicate (1 file)
**File: `ketthuc.services.ts`**
```typescript
// ⭐ THÊM import
import { TaiKhoanInfo } from '~/middlewares/authorization.middlewares'

// ❌ XÓA TOÀN BỘ đoạn này
interface TaiKhoanInfo extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MaLoaiTK: string;
  MaGiaPha: string | null;
}
```

### Bước 3: Verify
```bash
npm run build
# hoặc
npx tsc --noEmit
```

**✅ Kết quả mong đợi:**
```
✓ No compile errors
✓ All types match correctly
✓ Ready for runtime testing
```

---

## 15. TÓM TẮT TẤT CẢ LỖI VÀ CÁCH SỬA

| Lỗi | File | Cách sửa |
|-----|------|---------|
| **Lỗi 1:** Cannot find name 'TaiKhoanInfo' | `ketthuc.services.ts` | Import từ middleware |
| **Lỗi 2:** Cannot find name 'ErrorWithStatus' | `ketthuc.services.ts` | Import từ `~/models/Errors` |
| **Lỗi 3:** Expected 1 argument, but got 2 | `ketthuc.services.ts` | Thêm `userInfo?: TaiKhoanInfo` vào signature |
| **Lỗi 4:** Type incompatibility userInfo | `type.d.ts` + `authorization.middlewares.ts` + `ketthuc.services.ts` | Export interface + sửa type.d.ts + xóa duplicate |

### Code hoàn chỉnh sau khi sửa

**File 1: `authorization.middlewares.ts`** (Chỉ sửa 1 dòng)
```typescript
// Dòng 10: Thêm export
export interface TaiKhoanInfo extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MaLoaiTK: string;
  MaGiaPha: string | null;
}
```

**File 2: `type.d.ts`** (Thêm import và sửa userInfo)
```typescript
import { Request } from 'express';
import { TokenPayload } from './models/requests/User.requests';
import { TaiKhoanInfo } from './middlewares/authorization.middlewares';  // ⭐ THÊM

declare module 'express' {
  interface Request {
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;
    cookies: {
      access_token?: string;
      refresh_token?: string;
      [key: string]: any;
    };
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    decoded_authorization?: TokenPayload;
    decoded_refresh_token?: TokenPayload;
    userInfo?: TaiKhoanInfo;  // ⭐ DÙNG TaiKhoanInfo thay vì object literal
  }
}
```

**File 3: `ketthuc.services.ts`** (Đầy đủ imports)
```typescript
import databaseService from './database.services'
import { KetThucRow, TraCuuKetThucResult, GhiNhanKetThucPayload } from '~/models/schemas/KetThuc.schema'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { ErrorWithStatus } from '~/models/Errors'              // ⭐ Fix Lỗi 2
import HTTP_STATUS from '~/constants/httpStatus'                // ⭐ Fix Lỗi 2
import { TaiKhoanInfo } from '~/middlewares/authorization.middlewares'  // ⭐ Fix Lỗi 1 & 4

// ❌ XÓA: interface TaiKhoanInfo { ... }  // Fix Lỗi 4

class KetThucService {
  // ⭐ Fix Lỗi 3: Thêm userInfo
  async ghiNhanKetThuc(payload: GhiNhanKetThucPayload, userInfo?: TaiKhoanInfo) {
    const { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem } = payload;
    
    const query = `
      UPDATE THANHVIEN
      SET NgayGioMat = ?,
          MaNguyenNhanMat = ?,
          MaDiaDiem = ?
      WHERE MaTV = ? AND TrangThai = 'Còn Sống'
    `;
    
    const result = await databaseService.query<ResultSetHeader>(
      query,
      [NgayGioMat, MaNguyenNhanMat, MaDiaDiem, MaTV]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy thành viên hoặc thành viên đã được ghi nhận mất trước đó');
    }
    
    return {
      message: 'Ghi nhận kết thúc thành công',
      MaTV,
      affectedRows: result.affectedRows
    };
  }

  async traCuuKetThuc(filters?: {...}, userInfo?: TaiKhoanInfo): Promise<TraCuuKetThucResult[]> {
    // ... code như cũ
  }

  async getChiTietKetThuc(MaTV: string, userInfo?: TaiKhoanInfo): Promise<KetThucRow | null> {
    // ... code như cũ
  }
}
```

---

**🎯 KẾT LUẬN CUỐI CÙNG:**

Sau khi sửa 4 lỗi:
1. ✅ **Lỗi 1 - Missing TaiKhoanInfo:** Import từ middleware
2. ✅ **Lỗi 2 - Missing ErrorWithStatus:** Import từ models/Errors
3. ✅ **Lỗi 3 - Wrong signature:** Thêm tham số userInfo
4. ✅ **Lỗi 4 - Type incompatibility userInfo:** Export interface + sửa type.d.ts + xóa duplicate

**Tổng số thay đổi:**
- `authorization.middlewares.ts`: 1 dòng (thêm `export`)
- `type.d.ts`: 2 dòng (thêm import + sửa `userInfo?: TaiKhoanInfo`)
- `ketthuc.services.ts`: 3 dòng import + xóa 6 dòng duplicate interface

**⚠️ QUAN TRỌNG:** Vấn đề chính là `type.d.ts` định nghĩa `userInfo` là object literal thay vì type `TaiKhoanInfo`, gây ra type mismatch khi truyền vào service.

Hệ thống phân quyền Kết thúc hoàn tất và sẵn sàng test!
