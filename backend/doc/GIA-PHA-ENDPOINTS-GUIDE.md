# HƯỚNG DẪN IMPLEMENT ENDPOINTS CHO QUẢN LÝ GIA PHẢ THÀNH VIÊN

## 📋 MỤC LỤC
1. [Tổng quan](#1-tổng-quan)
2. [Phân tích cơ sở dữ liệu](#2-phân-tích-cơ-sở-dữ-liệu)
3. [Các chức năng cần implement](#3-các-chức-năng-cần-implement)
4. [Chi tiết implementation](#4-chi-tiết-implementation)
5. [Testing](#5-testing)

---

## 1. TỔNG QUAN

### 1.1. Yêu cầu
Tạo các endpoint API để quản lý gia phả thành viên, bao gồm:
- **Xóa mã gia phả** của thành viên (set `MaGiaPha = NULL`)
- **Cập nhật trưởng tộc** của gia phả (thay đổi `TruongToc` trong bảng `CAYGIAPHA`) ⬅️ **ĐÃ SỬA**

### 1.2. Mục đích nghiệp vụ
- Loại bỏ thành viên khỏi một gia phả (không thuộc gia phả nào)
- **Chuyển giao quyền trưởng tộc** cho thành viên khác trong cùng gia phả
- **Tự động cập nhật quyền tài khoản** của trưởng tộc mới lên `LTK02` (TruongToc)
- Hỗ trợ quản lý linh hoạt cây gia phả và phân quyền trong hệ thống

---

## 2. PHÂN TÍCH CƠ SỞ DỮ LIỆU

### 2.1. Bảng THANHVIEN
```sql
CREATE TABLE THANHVIEN (
    MaTV VARCHAR(5) PRIMARY KEY,
    HoTen VARCHAR(50),
    NgayGioSinh DATETIME,
    DiaChi VARCHAR(50),
    TrangThai VARCHAR(20) DEFAULT 'Còn Sống',
    TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    DOI INT DEFAULT 0,
    MaQueQuan VARCHAR(5),
    MaNgheNghiep VARCHAR(5),
    GioiTinh VARCHAR(3), -- Nam/Nữ
    MaNguyenNhanMat VARCHAR(5),
    NgayGioMat DATETIME,
    MaDiaDiem VARCHAR(5),
    MaGiaPha VARCHAR(5),  -- ⭐ TRƯỜNG CẦN QUẢN LÝ
    FOREIGN KEY(MaQueQuan) REFERENCES QUEQUAN(MaQueQuan),
    FOREIGN KEY(MaNgheNghiep) REFERENCES NGHENGHIEP(MaNgheNghiep),
    FOREIGN KEY(MaNguyenNhanMat) REFERENCES NGUYENNHANMAT(MaNguyenNhanMat),
    FOREIGN KEY(MaDiaDiem) REFERENCES DIADIEMMAITANG(MaDiaDiem)
);

ALTER TABLE THANHVIEN 
ADD CONSTRAINT FK_THANHVIEN_GIAPHA FOREIGN KEY (MaGiaPha) REFERENCES CAYGIAPHA(MaGiaPha);
```

### 2.2. Bảng CAYGIAPHA
```sql
CREATE TABLE CAYGIAPHA(
    MaGiaPha VARCHAR(5) PRIMARY KEY,
    TenGiaPha VARCHAR(35),
    NguoiLap VARCHAR(20),
    TGLap TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    TruongToc VARCHAR(20),
    FOREIGN KEY(NguoiLap) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(TruongToc) REFERENCES THANHVIEN(MaTV)
);
```

### 2.3. Ràng buộc và Trigger liên quan

#### ⚠️ Các trigger quan trọng cần lưu ý:

**1. Trigger tự động gán gia phả khi thêm quan hệ con cái:**
```sql
-- TRG_INSERT_MaGP_THANHVIEN_QUANHECON
-- Khi INSERT vào QUANHECON, con sẽ tự động nhận MaGiaPha từ cha/mẹ
```

**2. Trigger tự động gán gia phả khi thêm quan hệ hôn nhân:**
```sql
-- TRG_INSERT_MaGP_THANHVIEN_HONNHAN
-- Khi INSERT vào HONNHAN, vợ/chồng sẽ tự động nhận MaGiaPha từ bạn đời
```

**3. ⭐ Trigger tự động cập nhật quyền tài khoản khi thay đổi trưởng tộc:**
```sql
-- TRG_UPDATE_TAIKHOAN_LOAITK_GIAPHA (MySQL 8.0+)
-- Khi INSERT hoặc UPDATE trường TruongToc trong bảng CAYGIAPHA
-- Tự động cập nhật MaLoaiTK = 'LTK02' cho tài khoản của trưởng tộc mới
DELIMITER $$
CREATE TRIGGER TRG_UPDATE_TAIKHOAN_LOAITK_GIAPHA
AFTER INSERT OR UPDATE ON CAYGIAPHA
FOR EACH ROW
BEGIN
    DECLARE account_count INT;
    
    SELECT COUNT(*) INTO account_count
    FROM TAIKHOAN
    WHERE MaTV = NEW.TruongToc;
    
    IF account_count > 0 THEN
        UPDATE TAIKHOAN
        SET MaLoaiTK = 'LTK02'
        WHERE MaTV = NEW.TruongToc;
    END IF;
END$$
DELIMITER ;
```

#### 🔍 **Điều này có nghĩa là:**
- Khi xóa `MaGiaPha` của một thành viên, các trigger này có thể tự động gán lại nếu có quan hệ
- Cần cẩn thận khi sửa/xóa `MaGiaPha` của thành viên có quan hệ con cái hoặc hôn nhân
- **⭐ Khi cập nhật trưởng tộc, trigger sẽ tự động nâng quyền tài khoản lên `LTK02`**
- Nên có cơ chế validate hoặc cảnh báo người dùng

### 2.4. Quan hệ khóa ngoại
```
THANHVIEN.MaGiaPha → CAYGIAPHA.MaGiaPha (FOREIGN KEY)
```
- `MaGiaPha` có thể NULL (thành viên chưa thuộc gia phả nào)
- Khi cập nhật, giá trị mới phải tồn tại trong bảng `CAYGIAPHA` hoặc là NULL

---

## 3. CÁC CHỨC NĂNG CẦN IMPLEMENT

### ⚠️ THÔNG BÁO QUAN TRỌNG VỀ THAY ĐỔI ENDPOINT

**Endpoint `PATCH /api/thanhvien/:MaTV/gia-pha` đã được thay đổi chức năng:**

| | **Trước đây** | **Hiện tại** |
|---|-------------|------------|
| **Mục đích** | Cập nhật mã gia phả của thành viên | **Cập nhật trưởng tộc của gia phả** |
| **Bảng cập nhật** | `THANHVIEN` | `CAYGIAPHA` |
| **Trường cập nhật** | `MaGiaPha` | `TruongToc` |
| **Request body** | `{ "MaGiaPha": "GP02" }` | `{ "MaTVTruongTocMoi": "TV04" }` |
| **Nghiệp vụ** | Di chuyển thành viên sang gia phả khác | Chuyển giao quyền trưởng tộc |
| **Controller** | `capNhatMaGiaPhaController` | `capNhatTruongTocController` |
| **Service method** | `capNhatMaGiaPhaThanhVien()` | `capNhatTruongTocGiaPha()` |

---

### 3.1. Endpoint 1: Xóa mã gia phả của thành viên
**DELETE** `/api/thanhvien/:MaTV/gia-pha`

**Mô tả:** Xóa mã gia phả của thành viên (set `MaGiaPha = NULL`)

**Request:**
```
DELETE /api/thanhvien/TV05/gia-pha
```

**Response thành công (200):**
```json
{
  "message": "Xóa mã gia phả thành công",
  "data": {
    "MaTV": "TV05",
    "HoTen": "Nguyễn Văn A",
    "MaGiaPhaCu": "GP01",
    "MaGiaPhaHienTai": null
  }
}
```

**Response lỗi:**
- **404:** Không tìm thấy thành viên
- **400:** Thành viên chưa có mã gia phả để xóa
- **409:** Không thể xóa vì thành viên có quan hệ phụ thuộc (optional - nếu muốn strict)

---

### 3.2. Endpoint 2: Cập nhật trưởng tộc của gia phả
**PUT/PATCH** `/api/thanhvien/:MaTV/gia-pha`

**Mô tả:** Cập nhật trưởng tộc của gia phả bằng cách thay đổi trường `TruongToc` trong bảng `CAYGIAPHA` sang thành viên mới

**⚠️ LƯU Ý QUAN TRỌNG:**
- Endpoint này **KHÔNG** thay đổi `MaGiaPha` của thành viên
- Thay vào đó, nó **cập nhật trường `TruongToc`** trong bảng `CAYGIAPHA`
- Thành viên mới phải **thuộc cùng gia phả** với trưởng tộc hiện tại
- Khi cập nhật, tài khoản của thành viên mới sẽ tự động được nâng cấp lên quyền `TruongToc` (LTK02) nhờ trigger

**Request:**
```http
PATCH /api/thanhvien/TV05/gia-pha
Content-Type: application/json

{
  "MaTVTruongTocMoi": "TV05"
}
```

**Response thành công (200):**
```json
{
  "message": "Cập nhật trưởng tộc thành công",
  "data": {
    "MaGiaPha": "GP02",
    "TenGiaPha": "Nguyễn Văn - Hà Nội",
    "TruongTocCu": "TV02",
    "TenTruongTocCu": "Nguyễn Văn Long",
    "TruongTocMoi": "TV05",
    "TenTruongTocMoi": "Phạm Thị Hồng"
  }
}
```

**Response lỗi:**
- **404:** Không tìm thấy thành viên mới
- **404:** Thành viên mới chưa thuộc gia phả nào (MaGiaPha = NULL)
- **400:** Thành viên mới đã là trưởng tộc hiện tại
- **400:** Thành viên mới không thuộc cùng gia phả
- **400:** Thiếu trường `MaTVTruongTocMoi` trong request body

---

## 4. CHI TIẾT IMPLEMENTATION

### 4.1. Cấu trúc file cần thay đổi/tạo mới

```
backend/src/
├── controllers/
│   └── thanhvien.controllers.ts    [CẬP NHẬT]
├── services/
│   └── thanhvien.services.ts       [CẬP NHẬT]
├── routes/
│   └── thanhvien.routes.ts         [CẬP NHẬT]
└── models/
    └── requests/
        └── GiaPhaNhanhVien.requests.ts [TẠO MỚI - optional]
```

---

### 4.2. SERVICE LAYER

#### File: `backend/src/services/thanhvien.services.ts`

**THÊM CÁC METHODS SAU vào class `ThanhVienService`:**

```typescript
/**
 * ========================================
 * QUẢN LÝ GIA PHẢ THÀNH VIÊN
 * ========================================
 */

/**
 * Lấy thông tin gia phả hiện tại của thành viên
 */
async getThanhVienGiaPhaInfo(MaTV: string) {
  const sql = `
    SELECT 
      tv.MaTV,
      tv.HoTen,
      tv.MaGiaPha,
      gp.TenGiaPha,
      gp.TruongToc,
      tv_tt.HoTen as TenTruongToc
    FROM THANHVIEN tv
    LEFT JOIN CAYGIAPHA gp ON tv.MaGiaPha = gp.MaGiaPha
    LEFT JOIN THANHVIEN tv_tt ON gp.TruongToc = tv_tt.MaTV
    WHERE tv.MaTV = ?
  `;
  
  interface GiaPhaInfoRow extends RowDataPacket {
    MaTV: string;
    HoTen: string;
    MaGiaPha: string | null;
    TenGiaPha: string | null;
    TruongToc: string | null;
    TenTruongToc: string | null;
  }
  
  const rows = await databaseService.query<GiaPhaInfoRow[]>(sql, [MaTV]);
  
  if (!rows || rows.length === 0) {
    throw new Error('Không tìm thấy thành viên');
  }
  
  return rows[0];
}

/**
 * Kiểm tra mã gia phả có tồn tại không
 */
async checkGiaPhaExists(MaGiaPha: string): Promise<boolean> {
  const sql = 'SELECT MaGiaPha FROM CAYGIAPHA WHERE MaGiaPha = ?';
  const rows = await databaseService.query<RowDataPacket[]>(sql, [MaGiaPha]);
  return rows && rows.length > 0;
}

/**
 * Xóa mã gia phả của thành viên (set NULL)
 */
async xoaMaGiaPhaThanhVien(MaTV: string) {
  // Kiểm tra thành viên tồn tại và lấy thông tin hiện tại
  const thanhVienInfo = await this.getThanhVienGiaPhaInfo(MaTV);
  
  if (!thanhVienInfo.MaGiaPha) {
    throw new Error('Thành viên chưa có mã gia phả để xóa');
  }
  
  const MaGiaPhaCu = thanhVienInfo.MaGiaPha;
  
  // Cập nhật MaGiaPha = NULL
  const updateSql = 'UPDATE THANHVIEN SET MaGiaPha = NULL WHERE MaTV = ?';
  const result = await databaseService.query<ResultSetHeader>(updateSql, [MaTV]);
  
  if (result.affectedRows === 0) {
    throw new Error('Không thể xóa mã gia phả');
  }
  
  return {
    message: 'Xóa mã gia phả thành công',
    data: {
      MaTV: thanhVienInfo.MaTV,
      HoTen: thanhVienInfo.HoTen,
      MaGiaPhaCu: MaGiaPhaCu,
      MaGiaPhaHienTai: null
    }
  };
}

/**
 * Cập nhật trưởng tộc của gia phả
 * Thay đổi trường TruongToc trong bảng CAYGIAPHA
 */
async capNhatTruongTocGiaPha(MaTVTruongTocMoi: string) {
  // Bước 1: Kiểm tra thành viên mới có tồn tại không
  const thanhVienMoi = await this.getThanhVienGiaPhaInfo(MaTVTruongTocMoi);
  
  if (!thanhVienMoi) {
    throw new Error('Không tìm thấy thành viên');
  }
  
  // Bước 2: Kiểm tra thành viên mới có thuộc gia phả nào không
  if (!thanhVienMoi.MaGiaPha) {
    throw new Error('Thành viên chưa thuộc gia phả nào');
  }
  
  const MaGiaPha = thanhVienMoi.MaGiaPha;
  
  // Bước 3: Lấy thông tin trưởng tộc hiện tại
  const sqlGetCurrentTruongToc = `
    SELECT TruongToc, TenGiaPha 
    FROM CAYGIAPHA 
    WHERE MaGiaPha = ?
  `;
  
  interface CurrentTruongTocRow extends RowDataPacket {
    TruongToc: string;
    TenGiaPha: string;
  }
  
  const currentTruongTocRows = await databaseService.query<CurrentTruongTocRow[]>(
    sqlGetCurrentTruongToc, 
    [MaGiaPha]
  );
  
  if (!currentTruongTocRows || currentTruongTocRows.length === 0) {
    throw new Error('Không tìm thấy gia phả');
  }
  
  const TruongTocCu = currentTruongTocRows[0].TruongToc;
  const TenGiaPha = currentTruongTocRows[0].TenGiaPha;
  
  // Bước 4: Kiểm tra xem thành viên mới có phải đã là trưởng tộc hiện tại không
  if (TruongTocCu === MaTVTruongTocMoi) {
    throw new Error('Thành viên này đã là trưởng tộc hiện tại');
  }
  
  // Bước 5: Lấy tên của trưởng tộc cũ
  const sqlGetTenTruongTocCu = `
    SELECT HoTen FROM THANHVIEN WHERE MaTV = ?
  `;
  
  interface TenThanhVienRow extends RowDataPacket {
    HoTen: string;
  }
  
  const tenTruongTocCuRows = await databaseService.query<TenThanhVienRow[]>(
    sqlGetTenTruongTocCu, 
    [TruongTocCu]
  );
  
  const TenTruongTocCu = tenTruongTocCuRows.length > 0 
    ? tenTruongTocCuRows[0].HoTen 
    : 'Không rõ';
  
  // Bước 6: Cập nhật trưởng tộc mới trong bảng CAYGIAPHA
  const updateSql = `
    UPDATE CAYGIAPHA 
    SET TruongToc = ? 
    WHERE MaGiaPha = ?
  `;
  
  const result = await databaseService.query<ResultSetHeader>(updateSql, [
    MaTVTruongTocMoi, 
    MaGiaPha
  ]);
  
  if (result.affectedRows === 0) {
    throw new Error('Không thể cập nhật trưởng tộc');
  }
  
  // Bước 7: Trả về thông tin cập nhật
  // Lưu ý: Trigger TRG_UPDATE_TAIKHOAN_LOAITK_GIAPHA sẽ tự động 
  // cập nhật tài khoản của trưởng tộc mới lên quyền LTK02
  return {
    message: 'Cập nhật trưởng tộc thành công',
    data: {
      MaGiaPha: MaGiaPha,
      TenGiaPha: TenGiaPha,
      TruongTocCu: TruongTocCu,
      TenTruongTocCu: TenTruongTocCu,
      TruongTocMoi: MaTVTruongTocMoi,
      TenTruongTocMoi: thanhVienMoi.HoTen
    }
  };
}

/**
 * Lấy danh sách tất cả các gia phả (để chọn khi cập nhật)
 */
async getAllGiaPha() {
  const sql = `
    SELECT 
      gp.MaGiaPha,
      gp.TenGiaPha,
      gp.TruongToc,
      tv.HoTen as TenTruongToc,
      gp.TGLap,
      COUNT(tv_member.MaTV) as SoLuongThanhVien
    FROM CAYGIAPHA gp
    LEFT JOIN THANHVIEN tv ON gp.TruongToc = tv.MaTV
    LEFT JOIN THANHVIEN tv_member ON tv_member.MaGiaPha = gp.MaGiaPha
    GROUP BY gp.MaGiaPha, gp.TenGiaPha, gp.TruongToc, tv.HoTen, gp.TGLap
    ORDER BY gp.TGLap DESC
  `;
  
  interface GiaPhaRow extends RowDataPacket {
    MaGiaPha: string;
    TenGiaPha: string;
    TruongToc: string;
    TenTruongToc: string;
    TGLap: Date;
    SoLuongThanhVien: number;
  }
  
  const rows = await databaseService.query<GiaPhaRow[]>(sql);
  return rows;
}
```

---

### 4.3. CONTROLLER LAYER

#### File: `backend/src/controllers/thanhvien.controllers.ts`

**THÊM CÁC CONTROLLERS SAU:**

```typescript
/**
 * ========================================
 * CONTROLLERS QUẢN LÝ GIA PHẢ THÀNH VIÊN
 * ========================================
 */

/**
 * Controller xóa mã gia phả của thành viên
 * DELETE /api/thanhvien/:MaTV/gia-pha
 */
export const xoaMaGiaPhaController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;
  
  try {
    const result = await thanhvienService.xoaMaGiaPhaThanhVien(MaTV);
    
    return res.status(200).json(result);
    
  } catch (error: any) {
    console.error('Lỗi xoaMaGiaPha:', error);
    
    // Xử lý lỗi cụ thể
    if (error.message === 'Không tìm thấy thành viên') {
      return res.status(404).json({
        message: 'Không tìm thấy thành viên',
        error: error.message
      });
    }
    
    if (error.message === 'Thành viên chưa có mã gia phả để xóa') {
      return res.status(400).json({
        message: 'Thành viên chưa có mã gia phả',
        error: error.message
      });
    }
    
    return res.status(500).json({
      message: 'Xóa mã gia phả thất bại',
      error: error.message
    });
  }
};

/**
 * Controller cập nhật trưởng tộc của gia phả
 * PATCH /api/thanhvien/:MaTV/gia-pha
 * 
 * ⚠️ CHÚ Ý: Endpoint này KHÔNG sử dụng param :MaTV nữa
 * Thay vào đó, MaTV của trưởng tộc mới được truyền qua body
 */
export const capNhatTruongTocController = async (req: Request, res: Response) => {
  const { MaTVTruongTocMoi } = req.body;
  
  try {
    // Validate input
    if (!MaTVTruongTocMoi) {
      return res.status(400).json({
        message: 'Thiếu thông tin',
        error: 'Trường MaTVTruongTocMoi là bắt buộc'
      });
    }
    
    const result = await thanhvienService.capNhatTruongTocGiaPha(MaTVTruongTocMoi);
    
    return res.status(200).json(result);
    
  } catch (error: any) {
    console.error('Lỗi capNhatTruongToc:', error);
    
    // Xử lý lỗi cụ thể
    if (error.message === 'Không tìm thấy thành viên') {
      return res.status(404).json({
        message: 'Không tìm thấy thành viên',
        error: error.message
      });
    }
    
    if (error.message === 'Thành viên chưa thuộc gia phả nào') {
      return res.status(404).json({
        message: 'Thành viên chưa thuộc gia phả',
        error: error.message
      });
    }
    
    if (error.message === 'Thành viên này đã là trưởng tộc hiện tại') {
      return res.status(400).json({
        message: 'Thành viên đã là trưởng tộc',
        error: error.message
      });
    }
    
    if (error.message === 'Không tìm thấy gia phả') {
      return res.status(404).json({
        message: 'Không tìm thấy gia phả',
        error: error.message
      });
    }
    
    return res.status(500).json({
      message: 'Cập nhật trưởng tộc thất bại',
      error: error.message
    });
  }
};

/**
 * Controller lấy thông tin gia phả của thành viên
 * GET /api/thanhvien/:MaTV/gia-pha
 */
export const getGiaPhaThanhVienController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;
  
  try {
    const result = await thanhvienService.getThanhVienGiaPhaInfo(MaTV);
    
    return res.status(200).json({
      message: 'Lấy thông tin gia phả thành công',
      data: result
    });
    
  } catch (error: any) {
    console.error('Lỗi getGiaPhaThanhVien:', error);
    
    if (error.message === 'Không tìm thấy thành viên') {
      return res.status(404).json({
        message: 'Không tìm thấy thành viên',
        error: error.message
      });
    }
    
    return res.status(500).json({
      message: 'Lấy thông tin gia phả thất bại',
      error: error.message
    });
  }
};

/**
 * Controller lấy danh sách tất cả các gia phả
 * GET /api/thanhvien/gia-pha/danh-sach
 */
export const getAllGiaPhaController = async (req: Request, res: Response) => {
  try {
    const result = await thanhvienService.getAllGiaPha();
    
    return res.status(200).json({
      message: 'Lấy danh sách gia phả thành công',
      data: result
    });
    
  } catch (error: any) {
    console.error('Lỗi getAllGiaPha:', error);
    
    return res.status(500).json({
      message: 'Lấy danh sách gia phả thất bại',
      error: error.message
    });
  }
};
```

---

### 4.4. ROUTES LAYER

#### File: `backend/src/routes/thanhvien.routes.ts`

**CẬP NHẬT imports và thêm routes mới:**

```typescript
// ========================================
// THÊM VÀO PHẦN IMPORT
// ========================================
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
  // ⭐ THAY ĐỔI TÊN CONTROLLER - Quản lý gia phả
  xoaMaGiaPhaController,
  capNhatTruongTocController,  // ⬅️ ĐỔI TÊN từ capNhatMaGiaPhaController
  getGiaPhaThanhVienController,
  getAllGiaPhaController
} from '~/controllers/thanhvien.controllers';

// ========================================
// THÊM CÁC ROUTES MỚI
// (Đặt TRƯỚC các routes có param /:MaTV)
// ========================================

// GET /thanhvien/gia-pha/danh-sach - Lấy danh sách tất cả gia phả
thanhvienRouter.get('/gia-pha/danh-sach', wrapAsync(getAllGiaPhaController));

// ========================================
// THÊM SAU ROUTES HIỆN TẠI CỦA /:MaTV
// ========================================

// GET /thanhvien/:MaTV/gia-pha - Lấy thông tin gia phả của thành viên
thanhvienRouter.get('/:MaTV/gia-pha', wrapAsync(getGiaPhaThanhVienController));

// PATCH /thanhvien/:MaTV/gia-pha - Cập nhật trưởng tộc của gia phả
// ⚠️ LƯU Ý: Endpoint này KHÔNG dùng param :MaTV, chỉ giữ lại cho nhất quán với các route khác
// Mã trưởng tộc mới được truyền qua body: { "MaTVTruongTocMoi": "TV05" }
thanhvienRouter.patch('/:MaTV/gia-pha', requireAdminOrOwner, wrapAsync(capNhatTruongTocController));

// DELETE /thanhvien/:MaTV/gia-pha - Xóa mã gia phả của thành viên
thanhvienRouter.delete('/:MaTV/gia-pha', wrapAsync(xoaMaGiaPhaController));
```

**⚠️ LƯU Ý THỨ TỰ ROUTES:**
```typescript
// Routes cụ thể phải đặt TRƯỚC routes có param
thanhvienRouter.get('/gia-pha/danh-sach', ...);  // ✅ Đặt trước
thanhvienRouter.get('/:MaTV', ...);               // ✅ Đặt sau

// SAI: /:MaTV sẽ match trước /gia-pha/danh-sach
thanhvienRouter.get('/:MaTV', ...);               // ❌ 
thanhvienRouter.get('/gia-pha/danh-sach', ...);  // ❌ Sẽ không bao giờ được gọi
```

---

### 4.5. ⚠️ LƯU Ý QUAN TRỌNG VỀ TRIGGERS

#### Hành vi của triggers khi cập nhật `MaGiaPha`:

**1. Trigger `TRG_INSERT_MaGP_THANHVIEN_QUANHECON`:**
- Chỉ chạy khi **INSERT** vào bảng `QUANHECON`
- **KHÔNG** ảnh hưởng khi chỉ UPDATE `MaGiaPha` trong bảng `THANHVIEN`

**2. Trigger `TRG_INSERT_MaGP_THANHVIEN_HONNHAN`:**
- Chỉ chạy khi **INSERT** vào bảng `HONNHAN`
- **KHÔNG** ảnh hưởng khi chỉ UPDATE `MaGiaPha` trong bảng `THANHVIEN`

#### 💡 Kết luận:
- Việc xóa/sửa `MaGiaPha` trực tiếp trong bảng `THANHVIEN` **KHÔNG kích hoạt** các trigger
- Các trigger chỉ chạy khi thêm mới quan hệ (INSERT vào QUANHECON/HONNHAN)
- Do đó, endpoint xóa/sửa `MaGiaPha` **AN TOÀN** và không bị trigger ghi đè

#### 🔍 Trường hợp cần cẩn thận:
Nếu sau khi xóa `MaGiaPha`, có thao tác:
- Thêm quan hệ con cái mới → Trigger sẽ tự động gán lại `MaGiaPha` từ cha/mẹ
- Thêm quan hệ hôn nhân mới → Trigger sẽ tự động gán lại `MaGiaPha` từ bạn đời

**Giải pháp:** Nếu muốn giữ `MaGiaPha = NULL` vĩnh viễn, cần:
- Xóa các quan hệ con cái/hôn nhân trước
- Hoặc chỉnh sửa logic trigger (không khuyến nghị)

---

### 4.6. OPTIONAL: Tạo Request Model

#### File: `backend/src/models/requests/GiaPhaThanhVien.requests.ts` (Tạo mới)

```typescript
/**
 * Request body cho cập nhật trưởng tộc
 */
export interface CapNhatTruongTocReqBody {
  MaTVTruongTocMoi: string;
}

/**
 * Response cho thông tin gia phả thành viên
 */
export interface GiaPhaThanhVienInfo {
  MaTV: string;
  HoTen: string;
  MaGiaPha: string | null;
  TenGiaPha: string | null;
  TruongToc: string | null;
  TenTruongToc: string | null;
}

/**
 * Response cho thao tác xóa gia phả
 */
export interface XoaGiaPhaResponse {
  message: string;
  data: {
    MaTV: string;
    HoTen: string;
    MaGiaPhaCu: string | null;
    MaGiaPhaHienTai: null;
  };
}

/**
 * Response cho thao tác cập nhật trưởng tộc
 */
export interface CapNhatTruongTocResponse {
  message: string;
  data: {
    MaGiaPha: string;
    TenGiaPha: string;
    TruongTocCu: string;
    TenTruongTocCu: string;
    TruongTocMoi: string;
    TenTruongTocMoi: string;
  };
}

/**
 * Thông tin gia phả đầy đủ
 */
export interface GiaPhaInfo {
  MaGiaPha: string;
  TenGiaPha: string;
  TruongToc: string;
  TenTruongToc: string;
  TGLap: Date;
  SoLuongThanhVien: number;
}
```

---

## 5. TESTING

### 5.1. Chuẩn bị dữ liệu test

```sql
-- Kiểm tra dữ liệu hiện có
SELECT MaTV, HoTen, MaGiaPha FROM THANHVIEN;
SELECT * FROM CAYGIAPHA;

-- Tạo thêm gia phả test (nếu cần)
INSERT INTO CAYGIAPHA (TenGiaPha, NguoiLap, TruongToc) 
VALUES ('Gia phả Test', 'TV01', 'TV01');
```

### 5.2. Test Cases

#### **Test 1: Lấy danh sách tất cả gia phả**
```bash
# Request
GET http://localhost:4000/api/thanhvien/gia-pha/danh-sach

# Expected Response (200 OK)
{
  "message": "Lấy danh sách gia phả thành công",
  "data": [
    {
      "MaGiaPha": "GP01",
      "TenGiaPha": "Nguyễn Văn - Nghệ An",
      "TruongToc": "TV03",
      "TenTruongToc": "Lê Thị Lan",
      "TGLap": "2024-01-01T00:00:00.000Z",
      "SoLuongThanhVien": 1
    },
    {
      "MaGiaPha": "GP02",
      "TenGiaPha": "Nguyễn Văn - Hà Nội",
      "TruongToc": "TV02",
      "TenTruongToc": "Nguyễn Văn Long",
      "TGLap": "2024-01-01T00:00:00.000Z",
      "SoLuongThanhVien": 7
    }
  ]
}
```

---

#### **Test 2: Lấy thông tin gia phả của thành viên**
```bash
# Request - Thành viên có gia phả
GET http://localhost:4000/api/thanhvien/TV02/gia-pha

# Expected Response (200 OK)
{
  "message": "Lấy thông tin gia phả thành công",
  "data": {
    "MaTV": "TV02",
    "HoTen": "Nguyễn Văn Long",
    "MaGiaPha": "GP02",
    "TenGiaPha": "Nguyễn Văn - Hà Nội",
    "TruongToc": "TV02",
    "TenTruongToc": "Nguyễn Văn Long"
  }
}
```

```bash
# Request - Thành viên KHÔNG tồn tại
GET http://localhost:4000/api/thanhvien/TV99/gia-pha

# Expected Response (404 Not Found)
{
  "message": "Không tìm thấy thành viên",
  "error": "Không tìm thấy thành viên"
}
```

---

#### **Test 3: Xóa mã gia phả của thành viên**
```bash
# Request - Thành viên có gia phả
DELETE http://localhost:4000/api/thanhvien/TV02/gia-pha

# Expected Response (200 OK)
{
  "message": "Xóa mã gia phả thành công",
  "data": {
    "MaTV": "TV02",
    "HoTen": "Nguyễn Văn Long",
    "MaGiaPhaCu": "GP02",
    "MaGiaPhaHienTai": null
  }
}
```

```bash
# Request - Thành viên chưa có gia phả
DELETE http://localhost:4000/api/thanhvien/TV02/gia-pha

# Expected Response (400 Bad Request)
{
  "message": "Thành viên chưa có mã gia phả",
  "error": "Thành viên chưa có mã gia phả để xóa"
}
```

```bash
# Request - Thành viên không tồn tại
DELETE http://localhost:4000/api/thanhvien/TV99/gia-pha

# Expected Response (404 Not Found)
{
  "message": "Không tìm thấy thành viên",
  "error": "Không tìm thấy thành viên"
}
```

---

#### **Test 4: Cập nhật trưởng tộc của gia phả**
```bash
# Request - Cập nhật thành công
PATCH http://localhost:4000/api/thanhvien/TV02/gia-pha
Content-Type: application/json

{
  "MaTVTruongTocMoi": "TV04"
}

# Expected Response (200 OK)
{
  "message": "Cập nhật trưởng tộc thành công",
  "data": {
    "MaGiaPha": "GP02",
    "TenGiaPha": "Nguyễn Văn - Hà Nội",
    "TruongTocCu": "TV02",
    "TenTruongTocCu": "Nguyễn Văn Long",
    "TruongTocMoi": "TV04",
    "TenTruongTocMoi": "Nguyễn Văn Hùng"
  }
}
```

```bash
# Request - Thiếu trường MaTVTruongTocMoi
PATCH http://localhost:4000/api/thanhvien/TV02/gia-pha
Content-Type: application/json

{}

# Expected Response (400 Bad Request)
{
  "message": "Thiếu thông tin",
  "error": "Trường MaTVTruongTocMoi là bắt buộc"
}
```

```bash
# Request - Thành viên mới chưa thuộc gia phả nào
PATCH http://localhost:4000/api/thanhvien/TV02/gia-pha
Content-Type: application/json

{
  "MaTVTruongTocMoi": "TV01"
}

# Expected Response (404 Not Found)
{
  "message": "Thành viên chưa thuộc gia phả",
  "error": "Thành viên chưa thuộc gia phả nào"
}
```

```bash
# Request - Thành viên mới đã là trưởng tộc hiện tại
PATCH http://localhost:4000/api/thanhvien/TV02/gia-pha
Content-Type: application/json

{
  "MaTVTruongTocMoi": "TV02"
}

# Expected Response (400 Bad Request)
{
  "message": "Thành viên đã là trưởng tộc",
  "error": "Thành viên này đã là trưởng tộc hiện tại"
}
```

```bash
# Request - Thành viên không tồn tại
PATCH http://localhost:4000/api/thanhvien/TV02/gia-pha
Content-Type: application/json

{
  "MaTVTruongTocMoi": "TV99"
}

# Expected Response (404 Not Found)
{
  "message": "Không tìm thấy thành viên",
  "error": "Không tìm thấy thành viên"
}
```

---

### 5.3. Test Script với Postman/Thunder Client

#### Collection: Quản Lý Gia Phả Thành Viên

**1. Lấy danh sách gia phả**
```
GET {{baseUrl}}/api/thanhvien/gia-pha/danh-sach
```

**2. Lấy thông tin gia phả thành viên**
```
GET {{baseUrl}}/api/thanhvien/TV02/gia-pha
```

**3. Cập nhật trưởng tộc của gia phả**
```
PATCH {{baseUrl}}/api/thanhvien/TV02/gia-pha
Content-Type: application/json

{
  "MaTVTruongTocMoi": "TV04"
}
```

**4. Xóa gia phả thành viên**
```
DELETE {{baseUrl}}/api/thanhvien/TV02/gia-pha
```

**Environment Variables:**
```json
{
  "baseUrl": "http://localhost:4000"
}
```

---

### 5.4. Kiểm tra trong Database

```sql
-- Xem thành viên và gia phả của họ
SELECT 
  tv.MaTV, 
  tv.HoTen, 
  tv.MaGiaPha,
  gp.TenGiaPha
FROM THANHVIEN tv
LEFT JOIN CAYGIAPHA gp ON tv.MaGiaPha = gp.MaGiaPha
ORDER BY tv.MaTV;

-- Đếm số thành viên trong mỗi gia phả
SELECT 
  gp.MaGiaPha,
  gp.TenGiaPha,
  COUNT(tv.MaTV) as SoThanhVien
FROM CAYGIAPHA gp
LEFT JOIN THANHVIEN tv ON tv.MaGiaPha = gp.MaGiaPha
GROUP BY gp.MaGiaPha, gp.TenGiaPha;

-- Xem thành viên chưa có gia phả
SELECT MaTV, HoTen 
FROM THANHVIEN 
WHERE MaGiaPha IS NULL;
```

---

## 6. XỬ LÝ LỖI VÀ EDGE CASES

### 6.1. Các trường hợp lỗi cần xử lý

| Error Case | HTTP Code | Message |
|-----------|-----------|---------|
| Thành viên không tồn tại | 404 | "Không tìm thấy thành viên" |
| Thành viên chưa có gia phả (khi xóa) | 400 | "Thành viên chưa có mã gia phả để xóa" |
| Thành viên mới chưa thuộc gia phả nào | 404 | "Thành viên chưa thuộc gia phả nào" |
| Thành viên mới đã là trưởng tộc hiện tại | 400 | "Thành viên này đã là trưởng tộc hiện tại" |
| Gia phả không tồn tại | 404 | "Không tìm thấy gia phả" |
| Thiếu trường MaTVTruongTocMoi trong body | 400 | "Trường MaTVTruongTocMoi là bắt buộc" |
| Lỗi database | 500 | "Xóa/Cập nhật trưởng tộc thất bại" |

### 6.2. Validation bổ sung (Optional)

Có thể thêm validation nghiệp vụ:

```typescript
/**
 * Kiểm tra thành viên có quan hệ con cái không
 */
async checkCoQuanHeConCai(MaTV: string): Promise<boolean> {
  const sql = 'SELECT MaTV FROM QUANHECON WHERE MaTVCha = ? OR MaTVMe = ? LIMIT 1';
  const rows = await databaseService.query<RowDataPacket[]>(sql, [MaTV, MaTV]);
  return rows && rows.length > 0;
}

/**
 * Trong method xoaMaGiaPhaThanhVien - thêm check
 */
async xoaMaGiaPhaThanhVien(MaTV: string) {
  // ... code hiện tại ...
  
  // ⚠️ OPTIONAL: Cảnh báo nếu thành viên có con cái
  const coConCai = await this.checkCoQuanHeConCai(MaTV);
  if (coConCai) {
    console.warn(`Cảnh báo: Thành viên ${MaTV} có con cái. Xóa gia phả có thể ảnh hưởng đến cấu trúc cây.`);
  }
  
  // ... tiếp tục logic xóa ...
}

/**
 * Trong method capNhatTruongTocGiaPha - thêm check
 */
async capNhatTruongTocGiaPha(MaTVTruongTocMoi: string) {
  // ... code hiện tại ...
  
  // ⚠️ OPTIONAL: Kiểm tra thành viên mới có đủ tư cách làm trưởng tộc không
  // Ví dụ: Phải thuộc đời cũ hoặc có uy tín trong gia phả
  const thanhVienMoi = await this.getThanhVienGiaPhaInfo(MaTVTruongTocMoi);
  if (thanhVienMoi.DOI > 3) {
    throw new Error('Trưởng tộc phải thuộc đời 1-3 trong gia phả');
  }
  
  // ... tiếp tục logic cập nhật ...
}
```

---

## 7. POSTMAN COLLECTION

### 7.1. Import vào Postman

**File:** `Gia-Pha-Thanhvien.postman_collection.json`

```json
{
  "info": {
    "name": "Gia Phả Thành Viên API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Lấy danh sách tất cả gia phả",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/thanhvien/gia-pha/danh-sach",
          "host": ["{{baseUrl}}"],
          "path": ["api", "thanhvien", "gia-pha", "danh-sach"]
        }
      }
    },
    {
      "name": "Lấy thông tin gia phả của thành viên",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/thanhvien/:MaTV/gia-pha",
          "host": ["{{baseUrl}}"],
          "path": ["api", "thanhvien", ":MaTV", "gia-pha"],
          "variable": [
            {
              "key": "MaTV",
              "value": "TV02"
            }
          ]
        }
      }
    },
    {
      "name": "Cập nhật trưởng tộc",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"MaTVTruongTocMoi\": \"TV04\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/thanhvien/:MaTV/gia-pha",
          "host": ["{{baseUrl}}"],
          "path": ["api", "thanhvien", ":MaTV", "gia-pha"],
          "variable": [
            {
              "key": "MaTV",
              "value": "TV02",
              "description": "Tham số này không được sử dụng, chỉ giữ để nhất quán với cấu trúc route"
            }
          ]
        }
      }
    },
    {
      "name": "Xóa mã gia phả",
      "request": {
        "method": "DELETE",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/thanhvien/:MaTV/gia-pha",
          "host": ["{{baseUrl}}"],
          "path": ["api", "thanhvien", ":MaTV", "gia-pha"],
          "variable": [
            {
              "key": "MaTV",
              "value": "TV02"
            }
          ]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:4000"
    }
  ]
}
```

---

## 8. CHECKLIST TRIỂN KHAI

### ✅ Các bước thực hiện

- [ ] **Bước 1:** Backup database và code hiện tại
- [ ] **Bước 2:** Thêm method mới vào `thanhvien.services.ts`
  - [ ] Sửa method `capNhatMaGiaPhaThanhVien()` thành `capNhatTruongTocGiaPha()`
  - [ ] Method mới sẽ UPDATE bảng `CAYGIAPHA` thay vì `THANHVIEN`
  - [ ] Thêm validation kiểm tra thành viên mới thuộc gia phả
- [ ] **Bước 3:** Sửa controller trong `thanhvien.controllers.ts`
  - [ ] Đổi tên `capNhatMaGiaPhaController` thành `capNhatTruongTocController`
  - [ ] Đổi tham số body từ `MaGiaPha` thành `MaTVTruongTocMoi`
  - [ ] Cập nhật error handling phù hợp với nghiệp vụ mới
- [ ] **Bước 4:** Cập nhật routes trong `thanhvien.routes.ts`
  - [ ] Đổi tên import từ `capNhatMaGiaPhaController` → `capNhatTruongTocController`
  - [ ] Route vẫn giữ nguyên: `PATCH /api/thanhvien/:MaTV/gia-pha`
  - [ ] Lưu ý: Param `:MaTV` không được sử dụng, chỉ giữ để nhất quán
- [ ] **Bước 5:** Test endpoint mới
  - [ ] PATCH với body `{ "MaTVTruongTocMoi": "TV04" }`
  - [ ] Kiểm tra bảng `CAYGIAPHA` xem trường `TruongToc` đã thay đổi chưa
  - [ ] Kiểm tra trigger tự động cập nhật quyền tài khoản (LTK02)
- [ ] **Bước 6:** Test các trường hợp lỗi
  - [ ] Thành viên không tồn tại
  - [ ] Thành viên chưa thuộc gia phả
  - [ ] Thành viên đã là trưởng tộc hiện tại
  - [ ] Thiếu trường `MaTVTruongTocMoi`
- [ ] **Bước 7:** Kiểm tra database sau cập nhật
  - [ ] Xem bảng `CAYGIAPHA` - trường `TruongToc`
  - [ ] Xem bảng `TAIKHOAN` - trường `MaLoaiTK` của trưởng tộc mới
- [ ] **Bước 8:** Test với Postman collection
- [ ] **Bước 9:** Document API trong file README

---

## 9. TỔNG KẾT

### 9.1. Các endpoint đã implement

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| GET | `/api/thanhvien/gia-pha/danh-sach` | Lấy danh sách tất cả gia phả |
| GET | `/api/thanhvien/:MaTV/gia-pha` | Lấy thông tin gia phả của thành viên |
| PATCH | `/api/thanhvien/:MaTV/gia-pha` | **Cập nhật trưởng tộc của gia phả** ⬅️ ĐÃ SỬA |
| DELETE | `/api/thanhvien/:MaTV/gia-pha` | Xóa mã gia phả của thành viên |

### 9.2. Các file đã thay đổi/tạo mới

```
backend/src/
├── controllers/thanhvien.controllers.ts    [CẬP NHẬT - Sửa controller cập nhật]
├── services/thanhvien.services.ts          [CẬP NHẬT - Sửa method cập nhật]
├── routes/thanhvien.routes.ts              [CẬP NHẬT - Đổi tên import controller]
└── models/requests/
    └── GiaPhaThanhVien.requests.ts         [TẠO MỚI - Optional]
```

### 9.3. Điểm cần lưu ý

1. ✅ **Thay đổi bảng**: Endpoint PATCH giờ cập nhật bảng `CAYGIAPHA` (trường `TruongToc`) thay vì bảng `THANHVIEN` (trường `MaGiaPha`)
2. ✅ **Trigger tự động**: Khi cập nhật trưởng tộc, trigger `TRG_UPDATE_TAIKHOAN_LOAITK_GIAPHA` sẽ tự động nâng quyền tài khoản lên `LTK02`
3. ✅ **Validation**: Thành viên mới phải thuộc cùng gia phả với trưởng tộc cũ
4. ⚠️ **Param không dùng**: Route `/:MaTV` giữ nguyên nhưng param `:MaTV` không được sử dụng trong logic
5. 💡 **Request body**: Đổi từ `{ "MaGiaPha": "..." }` sang `{ "MaTVTruongTocMoi": "..." }`
6. 🔒 **Optional validation**: Có thể thêm check về đời, tuổi, hoặc tư cách của trưởng tộc mới

---

## 10. HỖ TRỢ VÀ TROUBLESHOOTING

### 10.1. Lỗi thường gặp

**Lỗi 1: Cannot find module '~/controllers/thanhvien.controllers'**
```bash
# Giải pháp: Kiểm tra export trong file controllers
# Đảm bảo export đúng tên function
```

**Lỗi 2: Cannot set foreign key constraint**
```bash
# Giải pháp: Kiểm tra MaGiaPha có tồn tại trong bảng CAYGIAPHA
SELECT * FROM CAYGIAPHA WHERE MaGiaPha = 'GP02';
```

**Lỗi 3: Routes không hoạt động**
```bash
# Giải pháp: Kiểm tra thứ tự routes
# Routes cụ thể phải đặt TRƯỚC routes có param
```

### 10.2. Debug tips

```typescript
// Thêm console.log để debug
console.log('MaTV:', MaTV);
console.log('MaGiaPha:', MaGiaPha);
console.log('Query result:', result);
```

```sql
-- Kiểm tra dữ liệu
SELECT * FROM THANHVIEN WHERE MaTV = 'TV02';
SELECT * FROM CAYGIAPHA WHERE MaGiaPha = 'GP02';
```

---

## 11. LIÊN HỆ VÀ HỖ TRỢ

Nếu gặp vấn đề trong quá trình implement, vui lòng:
1. Kiểm tra lại checklist ở phần 8
2. Xem lại phần troubleshooting ở phần 10
3. Kiểm tra logs trong console và database

---

**Tài liệu này được tạo ngày:** 2025-12-25  
**Phiên bản:** 1.0  
**Tác giả:** GitHub Copilot

---

## PHỤ LỤC

### A. SQL Queries hữu ích

```sql
-- 1. Xem tất cả thành viên và gia phả
SELECT 
  tv.MaTV,
  tv.HoTen,
  tv.GioiTinh,
  tv.DOI,
  tv.MaGiaPha,
  gp.TenGiaPha,
  tv_tt.HoTen as TruongToc
FROM THANHVIEN tv
LEFT JOIN CAYGIAPHA gp ON tv.MaGiaPha = gp.MaGiaPha
LEFT JOIN THANHVIEN tv_tt ON gp.TruongToc = tv_tt.MaTV
ORDER BY tv.DOI, tv.MaTV;

-- 2. Thống kê số thành viên theo gia phả và trưởng tộc
SELECT 
  gp.MaGiaPha,
  gp.TenGiaPha,
  gp.TruongToc,
  tv_tt.HoTen as TenTruongToc,
  COUNT(tv.MaTV) as SoThanhVien,
  COUNT(CASE WHEN tv.GioiTinh = 'Nam' THEN 1 END) as SoNam,
  COUNT(CASE WHEN tv.GioiTinh = 'Nữ' THEN 1 END) as SoNu
FROM CAYGIAPHA gp
LEFT JOIN THANHVIEN tv ON tv.MaGiaPha = gp.MaGiaPha
LEFT JOIN THANHVIEN tv_tt ON gp.TruongToc = tv_tt.MaTV
GROUP BY gp.MaGiaPha, gp.TenGiaPha, gp.TruongToc, tv_tt.HoTen
ORDER BY SoThanhVien DESC;

-- 3. Tìm thành viên chưa có gia phả
SELECT 
  MaTV,
  HoTen,
  GioiTinh,
  DOI,
  NgayGioSinh
FROM THANHVIEN
WHERE MaGiaPha IS NULL
ORDER BY DOI;

-- 4. Tìm thành viên có quan hệ nhưng chưa có gia phả
SELECT DISTINCT
  tv.MaTV,
  tv.HoTen,
  tv.MaGiaPha,
  CASE 
    WHEN qhc.MaTV IS NOT NULL THEN 'Có quan hệ con cái'
    WHEN hn.MaTV IS NOT NULL THEN 'Có quan hệ hôn nhân'
    ELSE 'Không có quan hệ'
  END as LoaiQuanHe
FROM THANHVIEN tv
LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
LEFT JOIN HONNHAN hn ON tv.MaTV = hn.MaTV OR tv.MaTV = hn.MaTVVC
WHERE tv.MaGiaPha IS NULL
  AND (qhc.MaTV IS NOT NULL OR hn.MaTV IS NOT NULL);

-- 5. ⭐ Kiểm tra lịch sử thay đổi trưởng tộc
-- (Lưu ý: Query này giả định bạn có bảng log, nếu không thì xem trực tiếp)
SELECT 
  gp.MaGiaPha,
  gp.TenGiaPha,
  gp.TruongToc as MaTruongToc,
  tv.HoTen as TenTruongToc,
  tk.MaLoaiTK,
  ltk.TenLoaiTK
FROM CAYGIAPHA gp
LEFT JOIN THANHVIEN tv ON gp.TruongToc = tv.MaTV
LEFT JOIN TAIKHOAN tk ON tv.MaTV = tk.MaTV
LEFT JOIN LOAITAIKHOAN ltk ON tk.MaLoaiTK = ltk.MaLoaiTK
ORDER BY gp.MaGiaPha;

-- 6. ⭐ Kiểm tra quyền tài khoản sau khi cập nhật trưởng tộc
SELECT 
  tv.MaTV,
  tv.HoTen,
  gp.MaGiaPha,
  gp.TenGiaPha,
  CASE WHEN gp.TruongToc = tv.MaTV THEN 'Có' ELSE 'Không' END as LaTruongToc,
  tk.TenDangNhap,
  tk.MaLoaiTK,
  ltk.TenLoaiTK
FROM THANHVIEN tv
LEFT JOIN CAYGIAPHA gp ON tv.MaGiaPha = gp.MaGiaPha
LEFT JOIN TAIKHOAN tk ON tv.MaTV = tk.MaTV
LEFT JOIN LOAITAIKHOAN ltk ON tk.MaLoaiTK = ltk.MaLoaiTK
WHERE tv.MaGiaPha IS NOT NULL
ORDER BY gp.MaGiaPha, tv.MaTV;
```

### B. Mẫu Response cho Frontend

```typescript
// Success Response - Xóa gia phả
{
  "message": "Xóa mã gia phả thành công",
  "data": {
    "MaTV": "TV05",
    "HoTen": "Phạm Thị Hồng",
    "MaGiaPhaCu": "GP02",
    "MaGiaPhaHienTai": null
  }
}

// Success Response - Cập nhật trưởng tộc
{
  "message": "Cập nhật trưởng tộc thành công",
  "data": {
    "MaGiaPha": "GP02",
    "TenGiaPha": "Nguyễn Văn - Hà Nội",
    "TruongTocCu": "TV02",
    "TenTruongTocCu": "Nguyễn Văn Long",
    "TruongTocMoi": "TV04",
    "TenTruongTocMoi": "Nguyễn Văn Hùng"
  }
}

// Error Response - 404
{
  "message": "Không tìm thấy thành viên",
  "error": "Không tìm thấy thành viên"
}

// Error Response - 400
{
  "message": "Thành viên đã là trưởng tộc",
  "error": "Thành viên này đã là trưởng tộc hiện tại"
}
```

---

### C. So sánh trước và sau khi sửa

| Khía cạnh | Trước (Cập nhật Mã Gia Phả) | Sau (Cập nhật Trưởng Tộc) |
|-----------|---------------------------|--------------------------|
| **Bảng cập nhật** | `THANHVIEN` | `CAYGIAPHA` |
| **Trường cập nhật** | `MaGiaPha` | `TruongToc` |
| **Request body** | `{ "MaGiaPha": "GP02" }` | `{ "MaTVTruongTocMoi": "TV04" }` |
| **Nghiệp vụ** | Di chuyển thành viên giữa các gia phả | Thay đổi trưởng tộc của gia phả |
| **Trigger ảnh hưởng** | Không | `TRG_UPDATE_TAIKHOAN_LOAITK_GIAPHA` |
| **Validation chính** | Mã gia phả phải tồn tại | Thành viên mới phải thuộc gia phả |

---

### D. Hướng dẫn thực hiện từng bước

#### **BƯỚC 1: Sửa Service Method**

Trong file `backend/src/services/thanhvien.services.ts`:

```typescript
// XÓA method cũ:
// async capNhatMaGiaPhaThanhVien(MaTV: string, MaGiaPha: string) { ... }

// THÊM method mới:
async capNhatTruongTocGiaPha(MaTVTruongTocMoi: string) {
  // ... (xem code chi tiết ở section 4.2)
}
```

#### **BƯỚC 2: Sửa Controller**

Trong file `backend/src/controllers/thanhvien.controllers.ts`:

```typescript
// ĐỔITÊN controller:
// export const capNhatMaGiaPhaController = ... 
// THÀNH:
export const capNhatTruongTocController = async (req: Request, res: Response) => {
  const { MaTVTruongTocMoi } = req.body;  // Đổi từ MaGiaPha
  // ... (xem code chi tiết ở section 4.3)
}
```

#### **BƯỚC 3: Cập nhật Routes**

Trong file `backend/src/routes/thanhvien.routes.ts`:

```typescript
// ĐỔI TÊN import:
import {
  // ...
  capNhatTruongTocController  // Đổi từ capNhatMaGiaPhaController
} from '~/controllers/thanhvien.controllers';

// Route giữ nguyên, chỉ đổi controller:
thanhvienRouter.patch('/:MaTV/gia-pha', 
  requireAdminOrOwner, 
  wrapAsync(capNhatTruongTocController)  // Đổi tên
);
```

#### **BƯỚC 4: Test**

```bash
# Test với request mới:
PATCH http://localhost:4000/api/thanhvien/TV02/gia-pha
Content-Type: application/json

{
  "MaTVTruongTocMoi": "TV04"
}
```

#### **BƯỚC 5: Kiểm tra kết quả trong database**

```sql
-- Xem bảng CAYGIAPHA
SELECT MaGiaPha, TenGiaPha, TruongToc FROM CAYGIAPHA WHERE MaGiaPha = 'GP02';

-- Xem quyền tài khoản
SELECT tv.MaTV, tv.HoTen, tk.MaLoaiTK 
FROM THANHVIEN tv 
JOIN TAIKHOAN tk ON tv.MaTV = tk.MaTV 
WHERE tv.MaTV = 'TV04';
```

---

**🎉 HOÀN THÀNH HƯỚNG DẪN CẬP NHẬT! 🎉**

**📌 TÓM TẮT:**
- ✅ Endpoint PATCH đã được sửa từ "cập nhật mã gia phả thành viên" → "cập nhật trưởng tộc gia phả"
- ✅ Thay đổi từ cập nhật bảng `THANHVIEN` → bảng `CAYGIAPHA`
- ✅ Trigger tự động nâng quyền tài khoản lên `LTK02` cho trưởng tộc mới
- ✅ Request body đổi từ `{ "MaGiaPha": "..." }` → `{ "MaTVTruongTocMoi": "..." }`
