# Hướng Dẫn Thêm Chức Năng "Báo Cáo Tăng Giảm Thành Viên"

## 📋 Tổng Quan Chức Năng

Tính năng này cho phép người dùng xem báo cáo thống kê tăng giảm thành viên theo năm trong khoảng thời gian tùy chọn.

### Đầu vào:
- **Năm bắt đầu**: Năm bắt đầu của khoảng thời gian báo cáo (VD: 2020)
- **Năm kết thúc**: Năm kết thúc của khoảng thời gian báo cáo (VD: 2025)

### Đầu ra - Bảng báo cáo:

| STT | Năm | Số lượng sinh | Số lượng kết hôn | Số lượng mất |
|-----|-----|---------------|------------------|--------------|
| 1   | 2020 | 15 | 8 | 3 |
| 2   | 2021 | 12 | 10 | 2 |
| 3   | 2022 | 18 | 6 | 5 |
| ... | ... | ... | ... | ... |

---

## 🗄️ Phân Tích Cơ Sở Dữ Liệu

### 1. Các Bảng Liên Quan

#### Bảng `THANHVIEN` - Thông tin thành viên
```sql
CREATE TABLE THANHVIEN (
    MaTV VARCHAR(5) PRIMARY KEY,
    HoTen VARCHAR(50),
    NgayGioSinh DATETIME,        -- Sửa Dùng để đếm số sinh trong năm
    DiaChi VARCHAR(50),
    TrangThai VARCHAR(20) DEFAULT 'Còn Sống',
    TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    DOI INT DEFAULT 0,
    MaQueQuan VARCHAR(5),
    MaNgheNghiep VARCHAR(5),
    GioiTinh VARCHAR(3),
    MaNguyenNhanMat VARCHAR(5),
    NgayGioMat DATETIME,         -- Sửa Dùng để đếm số mất trong năm
    MaDiaDiem VARCHAR(5),
    MaGiaPha VARCHAR(5)
);
```

**Các cột quan trọng**:
- `NgayGioSinh`: Ngày giờ sinh của thành viên → Dùng để đếm số sinh
- `NgayGioMat`: Ngày giờ mất của thành viên → Dùng để đếm số mất

#### Bảng `QUANHEVOCHONG` - Quan hệ hôn nhân
```sql
CREATE TABLE QUANHEVOCHONG(
    MaTV VARCHAR(5),
    MaTVVC VARCHAR(5),           -- Mã thành viên vợ/chồng
    NgayBatDau DATE,             -- Sửa Dùng để đếm số kết hôn trong năm
    NgayKetThuc DATE,            -- Ngày kết thúc (ly hôn/mất)
    PRIMARY KEY(MaTV, MaTVVC),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(MaTVVC) REFERENCES THANHVIEN(MaTV)
);
```

**Lưu ý quan trọng về đếm kết hôn**:
- Mỗi cặp vợ chồng có **2 bản ghi** trong bảng:
  - Bản ghi 1: `(MaTV=A, MaTVVC=B, NgayBatDau=...)`
  - Bản ghi 2: `(MaTV=B, MaTVVC=A, NgayBatDau=...)`
- ⚠️ **Phải chia 2** khi đếm để tránh đếm trùng!
- Hoặc chỉ đếm các cặp có `MaTV < MaTVVC`

---

## 🎯 Logic Tính Toán

### 1. Số lượng sinh trong năm
```sql
-- Đếm số thành viên có NgayGioSinh trong năm
SELECT YEAR(NgayGioSinh) as Nam, COUNT(*) as SoLuongSinh
FROM THANHVIEN
WHERE YEAR(NgayGioSinh) = ?
GROUP BY YEAR(NgayGioSinh)
```

### 2. Số lượng kết hôn trong năm
```sql
-- Đếm số cặp vợ chồng bắt đầu quan hệ trong năm
-- Chỉ đếm 1 lần cho mỗi cặp (MaTV < MaTVVC)
SELECT YEAR(NgayBatDau) as Nam, COUNT(*) as SoLuongKetHon
FROM QUANHEVOCHONG
WHERE YEAR(NgayBatDau) = ?
  AND MaTV < MaTVVC  -- Sửa Tránh đếm trùng
GROUP BY YEAR(NgayBatDau)
```

### 3. Số lượng mất trong năm
```sql
-- Đếm số thành viên có NgayGioMat trong năm
SELECT YEAR(NgayGioMat) as Nam, COUNT(*) as SoLuongMat
FROM THANHVIEN
WHERE YEAR(NgayGioMat) = ?
  AND NgayGioMat IS NOT NULL
GROUP BY YEAR(NgayGioMat)
```

---

## 🛠️ Hướng Dẫn Implementation

### BƯỚC 1: Tạo Schema Model (Optional)

**File mới**: `backend/src/models/schemas/BaoCaoTangGiam.schema.ts`

```typescript
// src/models/schemas/BaoCaoTangGiam.schema.ts

interface BaoCaoTangGiamType {
  Nam: number;
  SoLuongSinh: number;
  SoLuongKetHon: number;
  SoLuongMat: number;
}

export default class BaoCaoTangGiam {
  Nam: number;
  SoLuongSinh: number;
  SoLuongKetHon: number;
  SoLuongMat: number;

  constructor(baoCao: BaoCaoTangGiamType) {
    this.Nam = baoCao.Nam;
    this.SoLuongSinh = baoCao.SoLuongSinh;
    this.SoLuongKetHon = baoCao.SoLuongKetHon;
    this.SoLuongMat = baoCao.SoLuongMat;
  }
}
```

---

### BƯỚC 2: Thêm Service Method

**File**: `backend/src/services/thanhvien.services.ts`

**Vị trí thêm**: Sau method `deleteThanhVien`, trước dòng `export default`

```typescript
  /**
   * Sửa MỚI: Lấy báo cáo tăng giảm thành viên theo khoảng năm
   * Thống kê: Số sinh, số kết hôn, số mất theo từng năm
   * CHỈ HIỂN THỊ những năm có ít nhất 1 sự kiện (bỏ qua năm có cả 3 đều = 0)
   */
  async getBaoCaoTangGiam(NamBatDau: number, NamKetThuc: number) {
    // Validate input
    if (NamBatDau > NamKetThuc) {
      throw new Error('Năm bắt đầu không được lớn hơn năm kết thúc');
    }

    const currentYear = new Date().getFullYear();
    if (NamKetThuc > currentYear) {
      throw new Error(`Năm kết thúc không được vượt quá năm hiện tại (${currentYear})`);
    }

    // Query chỉ lấy những năm có sự kiện (sinh/kết hôn/mất)
    // Sử dụng UNION để gộp tất cả các năm có sự kiện, sau đó tính tổng
    const sql = `
      WITH AllYears AS (
        -- Lấy tất cả các năm có sinh
        SELECT DISTINCT YEAR(NgayGioSinh) as Nam
        FROM THANHVIEN
        WHERE YEAR(NgayGioSinh) BETWEEN ? AND ?
        
        UNION
        
        -- Lấy tất cả các năm có kết hôn
        SELECT DISTINCT YEAR(NgayBatDau) as Nam
        FROM QUANHEVOCHONG
        WHERE YEAR(NgayBatDau) BETWEEN ? AND ?
        
        UNION
        
        -- Lấy tất cả các năm có mất
        SELECT DISTINCT YEAR(NgayGioMat) as Nam
        FROM THANHVIEN
        WHERE YEAR(NgayGioMat) BETWEEN ? AND ?
          AND NgayGioMat IS NOT NULL
      )
      SELECT 
        ROW_NUMBER() OVER (ORDER BY ay.Nam) AS STT,
        ay.Nam,
        COALESCE(
          (SELECT COUNT(*) FROM THANHVIEN 
           WHERE YEAR(NgayGioSinh) = ay.Nam), 0
        ) AS SoLuongSinh,
        COALESCE(
          (SELECT COUNT(*) FROM QUANHEVOCHONG 
           WHERE YEAR(NgayBatDau) = ay.Nam AND MaTV < MaTVVC), 0
        ) AS SoLuongKetHon,
        COALESCE(
          (SELECT COUNT(*) FROM THANHVIEN 
           WHERE YEAR(NgayGioMat) = ay.Nam AND NgayGioMat IS NOT NULL), 0
        ) AS SoLuongMat
      FROM AllYears ay
      ORDER BY ay.Nam
    `;

    interface BaoCaoRow extends RowDataPacket {
      STT: number;
      Nam: number;
      SoLuongSinh: number;
      SoLuongKetHon: number;
      SoLuongMat: number;
    }

    const rows = await databaseService.query<BaoCaoRow[]>(sql, [
      NamBatDau,
      NamKetThuc,
      NamBatDau,
      NamKetThuc,
      NamBatDau,
      NamKetThuc
    ]);

    // Tính tổng
    const tongSinh = rows.reduce((sum, row) => sum + row.SoLuongSinh, 0);
    const tongKetHon = rows.reduce((sum, row) => sum + row.SoLuongKetHon, 0);
    const tongMat = rows.reduce((sum, row) => sum + row.SoLuongMat, 0);
    const tangGiamRong = tongSinh - tongMat;

    return {
      NamBatDau,
      NamKetThuc,
      TongSinh: tongSinh,
      TongKetHon: tongKetHon,
      TongMat: tongMat,
      TangGiamRong: tangGiamRong,
      DanhSach: rows
    };
  }
```

**Giải thích query**:
1. **AllYears CTE**: Sử dụng UNION để gộp tất cả các năm có ít nhất 1 sự kiện (sinh/kết hôn/mất)
   - Chỉ lấy DISTINCT năm từ 3 bảng/cột khác nhau
   - **Lợi ích**: Bỏ qua những năm không có sự kiện nào (cả 3 đều = 0)
2. **SELECT chính**: Với mỗi năm có sự kiện, đếm số lượng từng loại
   - Dùng subquery cho mỗi loại sự kiện
   - `MaTV < MaTVVC` để tránh đếm trùng cặp vợ chồng
   - `COALESCE(..., 0)` để thay NULL = 0 (trường hợp năm chỉ có 1-2 loại sự kiện)
3. **ROW_NUMBER()**: Tự động đánh số thứ tự sau khi sắp xếp theo năm
4. **Thêm import** cho RowDataPacket nếu chưa có:

```typescript
// Ở đầu file services
import { RowDataPacket, ResultSetHeader } from 'mysql2';
```

---

### BƯỚC 3: Thêm Controller

**File**: `backend/src/controllers/thanhvien.controllers.ts`

**Vị trí thêm**: Sau controller `deleteThanhVienController`, trước dòng export

```typescript
/**
 * Sửa MỚI: Controller lấy báo cáo tăng giảm thành viên
 * GET /thanhvien/tanggiam
 * Query params: 
 * - NamBatDau: Năm bắt đầu (required)
 * - NamKetThuc: Năm kết thúc (required)
 * 
 * Response: {
 *   message: string,
 *   result: {
 *     NamBatDau: number,
 *     NamKetThuc: number,
 *     TongSinh: number,
 *     TongKetHon: number,
 *     TongMat: number,
 *     TangGiamRong: number,
 *     DanhSach: [{ STT, Nam, SoLuongSinh, SoLuongKetHon, SoLuongMat }]
 *   }
 * }
 */
export const getBaoCaoTangGiamController = async (req: Request, res: Response) => {
  try {
    const { NamBatDau, NamKetThuc } = req.query;

    // Validate input
    if (!NamBatDau || !NamKetThuc) {
      return res.status(400).json({
        message: 'Thiếu thông tin: NamBatDau và NamKetThuc là bắt buộc'
      });
    }

    const namBatDau = parseInt(NamBatDau as string);
    const namKetThuc = parseInt(NamKetThuc as string);

    // Validate số hợp lệ
    if (isNaN(namBatDau) || isNaN(namKetThuc)) {
      return res.status(400).json({
        message: 'NamBatDau và NamKetThuc phải là số nguyên hợp lệ'
      });
    }

    const result = await thanhvienService.getBaoCaoTangGiam(namBatDau, namKetThuc);

    return res.status(200).json({
      message: 'Lấy báo cáo tăng giảm thành viên thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi getBaoCaoTangGiam:', error);
    
    // Xử lý lỗi validation từ service
    if (error.message.includes('Năm') || error.message.includes('năm')) {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: 'Lỗi lấy báo cáo tăng giảm thành viên',
      error: error.message
    });
  }
};
```

**Thêm import Request và Response** nếu chưa có:
```typescript
import { Request, Response } from 'express';
```

---

### BƯỚC 4: Thêm Route

**File**: `backend/src/routes/thanhvien.routes.ts`

**PHẦN 1: Cập nhật import**

```typescript
// Dòng import ở đầu file
import {
  registerController,
  getAllThanhVienController,
  getThanhVienByMaTVController,
  updateThanhVienController,
  deleteThanhVienController,
  getBaoCaoTangGiamController  // Sửa THÊM DÒNG NÀY
} from '~/controllers/thanhvien.controllers';
```

**PHẦN 2: Thêm route**

⚠️ **LƯU Ý**: Đặt route này **TRƯỚC** route `/:MaTV` để tránh conflict!

```typescript
/**
 * Sửa MỚI: GET /thanhvien/baocao/tanggiam - Báo cáo tăng giảm thành viên theo năm
 * Query params:
 * - NamBatDau: Năm bắt đầu (required, số nguyên)
 * - NamKetThuc: Năm kết thúc (required, số nguyên)
 * 
 * Ví dụ: /thanhvien/baocao?NamBatDau=2020&NamKetThuc=2025
 * 
 * Response: {
 *   message: "Lấy báo cáo tăng giảm thành viên thành công",
 *   result: {
 *     NamBatDau: 2020,
 *     NamKetThuc: 2025,
 *     TongSinh: 45,
 *     TongKetHon: 12,
 *     TongMat: 8,
 *     TangGiamRong: 37,
 *     DanhSach: [
 *       { STT: 1, Nam: 2020, SoLuongSinh: 10, SoLuongKetHon: 3, SoLuongMat: 2 },
 *       { STT: 2, Nam: 2021, SoLuongSinh: 8, SoLuongKetHon: 2, SoLuongMat: 1 },
 *       ...
 *     ]
 *   }
 * }
 */
thanhvienRouter.get('/baocao', getBaoCaoTangGiamController);
```

**Vị trí đặt route - QUAN TRỌNG**:

```typescript
const thanhvienRouter = Router();

// POST /thanhvien/register - Đăng ký thành viên mới
thanhvienRouter.post('/register', registerController);

// GET /thanhvien - Lấy tất cả thành viên
thanhvienRouter.get('/', getAllThanhVienController);

// Sửa THÊM ROUTE BÁO CÁO Ở ĐÂY - TRƯỚC route /:MaTV
thanhvienRouter.get('/baocao/tanggiam', getBaoCaoTangGiamController);

// GET /thanhvien/:MaTV - Lấy thành viên theo MaTV
thanhvienRouter.get('/:MaTV', getThanhVienByMaTVController);

// PUT /thanhvien/:MaTV - Cập nhật thành viên
thanhvienRouter.put('/:MaTV', updateThanhVienController);

// DELETE /thanhvien/:MaTV - Xóa thành viên
thanhvienRouter.delete('/:MaTV', deleteThanhVienController);

export default thanhvienRouter;
```

**Tại sao phải đặt trước `/:MaTV`?**
- Nếu đặt sau, Express sẽ hiểu `baocao` là giá trị của tham số `MaTV`
- Dẫn đến route `/baocao/tanggiam` sẽ match với route `/:MaTV` thay vì route mới

---

### BƯỚC 5: Kiểm Tra Đăng Ký Route

**File**: `backend/src/index.ts`

Route `/thanhvien` đã được đăng ký:

```typescript
// Đã có sẵn
app.use('/thanhvien', thanhvienRouter);
```

Sửa Không cần thay đổi gì!

---

## 🧪 Test API

### 1. Test với Postman/Thunder Client

#### Test Case 1: Báo cáo thành công
```
GET http://localhost:3000/thanhvien/baocao/tanggiam?NamBatDau=2020&NamKetThuc=2025

Response (200 OK):
{
  "message": "Lấy báo cáo tăng giảm thành viên thành công",
  "result": {
    "NamBatDau": 2020,
    "NamKetThuc": 2025,
    "TongSinh": 1,
    "TongKetHon": 0,
    "TongMat": 1,
    "TangGiamRong": 0,
    "DanhSach": [
      {
        "STT": 1,
        "Nam": 2020,
        "SoLuongSinh": 0,
        "SoLuongKetHon": 0,
        "SoLuongMat": 1
      },
      {
        "STT": 2,
        "Nam": 2024,
        "SoLuongSinh": 1,
        "SoLuongKetHon": 0,
        "SoLuongMat": 0
      }
    ]
  }
}
```

#### Test Case 2: Thiếu tham số
```
GET http://localhost:3000/thanhvien/baocao/tanggiam?NamBatDau=2020

Response (400 Bad Request):
{
  "message": "Thiếu thông tin: NamBatDau và NamKetThuc là bắt buộc"
}
```

#### Test Case 3: Năm không hợp lệ
```
GET http://localhost:3000/thanhvien/baocao/tanggiam?NamBatDau=2025&NamKetThuc=2020

Response (400 Bad Request):
{
  "message": "Năm bắt đầu không được lớn hơn năm kết thúc"
}
```

#### Test Case 4: Năm vượt quá hiện tại
```
GET http://localhost:3000/thanhvien/baocao/tanggiam?NamBatDau=2020&NamKetThuc=2030

Response (400 Bad Request):
{
  "message": "Năm kết thúc không được vượt quá năm hiện tại (2025)"
}
```

#### Test Case 5: Khoảng năm xa trong quá khứ
```
GET http://localhost:3000/thanhvien/baocao/tanggiam?NamBatDau=1990&NamKetThuc=1995

Response (200 OK):
{
  "message": "Lấy báo cáo tăng giảm thành viên thành công",
  "result": {
    "NamBatDau": 1990,
    "NamKetThuc": 1995,
    "TongSinh": 0,
    "TongKetHon": 0,
    "TongMat": 0,
    "TangGiamRong": 0,
    "DanhSach": [
      { "STT": 1, "Nam": 1990, "SoLuongSinh": 0, "SoLuongKetHon": 0, "SoLuongMat": 0 },
      { "STT": 2, "Nam": 1991, "SoLuongSinh": 0, "SoLuongKetHon": 0, "SoLuongMat": 0 },
      ...
    ]
  }
}
```

### 2. Test với cURL

```bash
# Test cơ bản
curl "http://localhost:3000/thanhvien/baocao/tanggiam?NamBatDau=2020&NamKetThuc=2025"
 (không có dữ liệu)
```
```
GET http://localhost:3000/thanhvien/baocao/tanggiam?NamBatDau=1990&NamKetThuc=1995

Response (200 OK):
{
  "message": "Lấy báo cáo tăng giảm thành viên thành công",
  "result": {
    "NamBatDau": 1990,
    "NamKetThuc": 1995,
    "TongSinh": 0,
    "TongKetHon": 0,
    "TongMat": 0,
    "TangGiamRong": 0,
    "DanhSach": []  // Sửa Mảng rỗng vì không có năm nào có sự kiện
  }
}
```
```

#### Test Case 6: Khoảng có một vài năm có sự kiện
```
GET http://localhost:3000/thanhvien/baocao/tanggiam?NamBatDau=2018&NamKetThuc=2025

Response (200 OK):
{
  "message": "Lấy báo cáo tăng giảm thành viên thành công",
  "result": {
    "NamBatDau": 2018,
    "NamKetThuc": 2025,
    "TongSinh": 1,
    "TongKetHon": 0,
    "TongMat": 1,
    "TangGiamRong": 0,
    "DanhSach": [
      { "STT": 1, "Nam": 2020, "SoLuongSinh": 0, "SoLuongKetHon": 0, "SoLuongMat": 1 },
      { "STT": 2, "Nam": 2024, "SoLuongSinh": 1, "SoLuongKetHon": 0, "SoLuongMat": 0 }
      // Sửa Chỉ hiển thị 2020 và 2024, bỏ qua 2018, 2019, 2021, 2022, 2023, 2025
  MaTV,
  HoTen,
  YEAR(NgayGioSinh) as NamSinh,
  NgayGioSinh
FROM THANHVIEN
ORDER BY NgayGioSinh;

-- Đếm số sinh theo năm
SELECT 
  YEAR(NgayGioSinh) as Nam,
  COUNT(*) as SoLuongSinh
FROM THANHVIEN
GROUP BY YEAR(NgayGioSinh)
ORDER BY Nam;
```

### 2. Kiểm tra số kết hôn theo năm

```sql
-- Xem tất cả quan hệ vợ chồng
SELECT 
  MaTV,
  MaTVVC,
  NgayBatDau,
  NgayKetThuc,
  YEAR(NgayBatDau) as NamKetHon
FROM QUANHEVOCHONG
ORDER BY NgayBatDau;

-- Đếm số kết hôn theo năm (tránh đếm trùng)
SELECT 
  YEAR(NgayBatDau) as Nam,
  COUNT(*) as SoLuongKetHon
FROM QUANHEVOCHONG
WHERE MaTV < MaTVVC  -- Chỉ đếm 1 lần mỗi cặp
GROUP BY YEAR(NgayBatDau)
ORDER BY Nam;
```

### 3. Kiểm tra số mất theo năm

```sql
-- Xem tất cả thành viên đã mất
SELECT 
  MaTV,
  HoTen,
  NgayGioMat,
  YEAR(NgayGioMat) as NamMat,
  MaNguyenNhanMat
FROM THANHVIEN
WHERE NgayGioMat IS NOT NULL
ORDER BY NgayGioMat;

-- Đếm số mất theo năm
SELECT 
  YEAR(NgayGioMat) as Nam,
  COUNT(*) as SoLuongMat
FROM THANHVIEN
WHERE NgayGioMat IS NOT NULL
GROUP BY YEAR(NgayGioMat)
ORDER BY Nam;
```

### 4. Thêm dữ liệu test (nếu cần)

```sql
-- Thêm thành viên mới sinh năm 2023
INSERT INTO THANHVIEN (HoTen, NgayGioSinh, DiaChi, MaQueQuan, MaNgheNghiep, GioiTinh) VALUES
('Nguyễn Văn Test1', '2023-03-15 10:00:00', 'Hà Nội', 'QQ01', 'NN01', 'Nam'),
('Nguyễn Thị Test2', '2023-06-20 14:30:00', 'Hà Nội', 'QQ01', 'NN02', 'Nữ'),
('Nguyễn Văn Test3', '2024-01-10 08:00:00', 'Hà Nội', 'QQ01', 'NN03', 'Nam');

-- Thêm quan hệ vợ chồng năm 2023
-- Giả sử TV06 và TV07 kết hôn năm 2023
INSERT INTO QUANHEVOCHONG (MaTV, MaTVVC, NgayBatDau, NgayKetThuc) VALUES
('TV06', 'TV07', '2023-05-20', NULL),
('TV07', 'TV06', '2023-05-20', NULL);

-- Cập nhật thành viên mất năm 2024
-- Giả sử TV02 mất năm 2024
UPDATE THANHVIEN 
SET MaNguyenNhanMat = 'NNM01', 
    NgayGioMat = '2024-08-15 10:00:00', 
    MaDiaDiem = 'DD01',
    TrangThai = 'Đã Mất'
WHERE MaTV = 'TV02';

-- Kiểm tra lại
SELECT * FROM THANHVIEN WHERE YEAR(NgayGioSinh) >= 2023;
SELECT * FROM QUANHEVOCHONG WHERE YEAR(NgayBatDau) >= 2023;
SELECT * FROM THANHVIEN WHERE YEAR(NgayGioMat) >= 2023;
```

---

## 📊 Tích Hợp Frontend

### 1. Component Form Nhập Liệu

**Ví dụ React**:

```typescript
// Component: BaoCaoTangGiamForm.tsx (React)
import { useState } from 'react';

interface BaoCaoFormData {
  NamBatDau: number;
  NamKetThuc: number;
}

export default function BaoCaoTangGiamForm() {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState<BaoCaoFormData>({
    NamBatDau: currentYear - 5,
    NamKetThuc: currentYear
  });
  const [baoCao, setBaoCao] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `http://localhost:3000/thanhvien/baocao/tanggiam?NamBatDau=${formData.NamBatDau}&NamKetThuc=${formData.NamKetThuc}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra');
      }

      setBaoCao(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bao-cao-container">
      <h2>Báo Cáo Tăng Giảm Thành Viên</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Năm bắt đầu:</label>
          <input
            type="number"
            min="1900"
            max={currentYear}
            value={formData.NamBatDau}
            onChange={(e) => setFormData({ 
              ...formData, 
              NamBatDau: parseInt(e.target.value) 
            })}
            required
          />
        </div>

        <div className="form-group">
          <label>Năm kết thúc:</label>
          <input
            type="number"
            min="1900"
            max={currentYear}
            value={formData.NamKetThuc}
            onChange={(e) => setFormData({ 
              ...formData, 
              NamKetThuc: parseInt(e.target.value) 
            })}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Đang tải...' : 'Xem báo cáo'}
        </button>
      </form>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {baoCao && (
        <BaoCaoTangGiamTable baoCao={baoCao} />
      )}
    </div>
  );
}
```

### 2. Component Hiển Thị Bảng

```typescript
// Component: BaoCaoTangGiamTable.tsx (React)
interface BaoCaoTableProps {
  baoCao: {
    NamBatDau: number;
    NamKetThuc: number;
    TongSinh: number;
    TongKetHon: number;
    TongMat: number;
    TangGiamRong: number;
    DanhSach: Array<{
      STT: number;
      Nam: number;
      SoLuongSinh: number;
      SoLuongKetHon: number;
      SoLuongMat: number;
    }>;
  };
}

export default function BaoCaoTangGiamTable({ baoCao }: BaoCaoTableProps) {
  return (
    <div className="bao-cao-result">
      <div className="bao-cao-header">
        <h3>Báo cáo từ năm {baoCao.NamBatDau} đến {baoCao.NamKetThuc}</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Tổng sinh:</span>
            <span className="value birth">{baoCao.TongSinh}</span>
          </div>
          <div className="summary-item">
            <span className="label">Tổng kết hôn:</span>
            <span className="value marriage">{baoCao.TongKetHon}</span>
          </div>
          <div className="summary-item">
            <span className="label">Tổng mất:</span>
            <span className="value death">{baoCao.TongMat}</span>
          </div>
          <div className="summary-item">
            <span className="label">Tăng/Giảm ròng:</span>
            <span className={`value ${baoCao.TangGiamRong >= 0 ? 'increase' : 'decrease'}`}>
              {baoCao.TangGiamRong >= 0 ? '+' : ''}{baoCao.TangGiamRong}
            </span>
          </div>
        </div>
      </div>

      {baoCao.DanhSach.length === 0 ? (
        <p className="no-data">Không có dữ liệu trong khoảng thời gian này</p>
      ) : (
        <table className="bao-cao-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Năm</th>
              <th>Số lượng sinh</th>
              <th>Số lượng kết hôn</th>
              <th>Số lượng mất</th>
            </tr>
          </thead>
          <tbody>
            {baoCao.DanhSach.map((item) => (
              <tr key={item.STT}>
                <td>{item.STT}</td>
                <td className="year-cell"><strong>{item.Nam}</strong></td>
                <td className="text-center birth-cell">{item.SoLuongSinh}</td>
                <td className="text-center marriage-cell">{item.SoLuongKetHon}</td>
                <td className="text-center death-cell">{item.SoLuongMat}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}><strong>Tổng cộng</strong></td>
              <td className="text-center"><strong>{baoCao.TongSinh}</strong></td>
              <td className="text-center"><strong>{baoCao.TongKetHon}</strong></td>
              <td className="text-center"><strong>{baoCao.TongMat}</strong></td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
```

### 3. CSS Styling

```css
/* styles/BaoCaoTangGiam.css */
.bao-cao-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.bao-cao-container h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
}

form {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
}

button[type="submit"] {
  padding: 10px 30px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

button[type="submit"]:hover {
  background: #0056b3;
}

button[type="submit"]:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.error-message {
  padding: 15px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 20px;
}

.bao-cao-result {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.bao-cao-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px;
}

.bao-cao-header h3 {
  margin: 0 0 20px 0;
  font-size: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.2);
  padding: 12px;
  border-radius: 6px;
}

.summary-item .label {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 5px;
}

.summary-item .value {
  font-size: 24px;
  font-weight: bold;
}

.value.birth { color: #90ee90; }
.value.marriage { color: #ffd700; }
.value.death { color: #ff6b6b; }
.value.increase { color: #51cf66; }
.value.decrease { color: #ff6b6b; }

.bao-cao-table {
  width: 100%;
  border-collapse: collapse;
}

.bao-cao-table thead {
  background: #f8f9fa;
}

.bao-cao-table th,
.bao-cao-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.bao-cao-table th {
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  font-size: 12px;
}

.bao-cao-table tbody tr:hover {
  background: #f8f9fa;
}

.bao-cao-table .year-cell {
  font-size: 16px;
  color: #007bff;
}

.bao-cao-table .birth-cell {
  color: #28a745;
  font-weight: 500;
}

.bao-cao-table .marriage-cell {
  color: #ffc107;
  font-weight: 500;
}

.bao-cao-table .death-cell {
  color: #dc3545;
  font-weight: 500;
}

.bao-cao-table tfoot {
  background: #e9ecef;
  font-weight: 600;
  font-size: 15px;
}

.text-center {
  text-align: center !important;
}

.no-data {
  padding: 40px;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  form {
    flex-direction: column;
  }
}
```

---

## 🎨 Tính Năng Mở Rộng (Optional)

### 1. Xuất Excel

```typescript
import ExcelJS from 'exceljs';

export const exportBaoCaoTangGiamToExcel = async (req: Request, res: Response) => {
  try {
    const { NamBatDau, NamKetThuc } = req.query;
    
    const namBatDau = parseInt(NamBatDau as string);
    const namKetThuc = parseInt(NamKetThuc as string);
    const result = await thanhvienService.getBaoCaoTangGiam(namBatDau, namKetThuc);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo tăng giảm');

    // Tiêu đề
    worksheet.addRow(['BÁO CÁO TĂNG GIẢM THÀNH VIÊN']);
    worksheet.addRow([`Từ năm ${result.NamBatDau} đến năm ${result.NamKetThuc}`]);
    worksheet.addRow([]);

    // Thống kê tổng
    worksheet.addRow(['Tổng sinh:', result.TongSinh]);
    worksheet.addRow(['Tổng kết hôn:', result.TongKetHon]);
    worksheet.addRow(['Tổng mất:', result.TongMat]);
    worksheet.addRow(['Tăng/Giảm ròng:', result.TangGiamRong]);
    worksheet.addRow([]);

    // Header bảng
    worksheet.addRow(['STT', 'Năm', 'Số lượng sinh', 'Số lượng kết hôn', 'Số lượng mất']);

    // Dữ liệu
    result.DanhSach.forEach(item => {
      worksheet.addRow([
        item.STT, 
        item.Nam, 
        item.SoLuongSinh, 
        item.SoLuongKetHon, 
        item.SoLuongMat
      ]);
    });

    // Tổng
    worksheet.addRow(['', 'Tổng cộng', result.TongSinh, result.TongKetHon, result.TongMat]);

    // Style
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(9).font = { bold: true };

    // Gửi file
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=bao-cao-tang-giam-${namBatDau}-${namKetThuc}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    return res.status(500).json({
      message: 'Lỗi xuất file Excel',
      error: error.message
    });
  }
};
```

**Thêm route**:
```typescript
thanhvienRouter.get('/baocao/tanggiam/export', exportBaoCaoTangGiamToExcel);
```

### 2. Biểu Đồ Trực Quan

Frontend có thể dùng **Chart.js** hoặc **Recharts**:

```typescript
import { Line } from 'react-chartjs-2';

const chartData = {
  labels: baoCao.DanhSach.map(item => item.Nam),
  datasets: [
    {
      label: 'Sinh',
      data: baoCao.DanhSach.map(item => item.SoLuongSinh),
      borderColor: '#28a745',
      backgroundColor: 'rgba(40, 167, 69, 0.2)',
    },
    {
      label: 'Kết hôn',
      data: baoCao.DanhSach.map(item => item.SoLuongKetHon),
      borderColor: '#ffc107',
      backgroundColor: 'rgba(255, 193, 7, 0.2)',
    },
    {
      label: 'Mất',
      data: baoCao.DanhSach.map(item => item.SoLuongMat),
      borderColor: '#dc3545',
      backgroundColor: 'rgba(220, 53, 69, 0.2)',
    }
  ]
};

<Line data={chartData} />
```

### 3. Báo Cáo Chi Tiết

Thêm endpoint để xem danh sách chi tiết thành viên sinh/kết hôn/mất trong năm cụ thể:

```typescript
async getBaoCaoChiTiet(Nam: number, LoaiSuKien: 'sinh' | 'kethon' | 'mat') {
  let sql = '';
  
  if (LoaiSuKien === 'sinh') {
    sql = `
      SELECT MaTV, HoTen, NgayGioSinh, GioiTinh
      FROM THANHVIEN
      WHERE YEAR(NgayGioSinh) = ?
      ORDER BY NgayGioSinh
    `;
  } else if (LoaiSuKien === 'kethon') {
    sql = `
      SELECT 
        tv1.HoTen as Chong,
        tv2.HoTen as Vo,
        qh.NgayBatDau
      FROM QUANHEVOCHONG qh
      INNER JOIN THANHVIEN tv1 ON qh.MaTV = tv1.MaTV
      INNER JOIN THANHVIEN tv2 ON qh.MaTVVC = tv2.MaTV
      WHERE YEAR(qh.NgayBatDau) = ?
        AND qh.MaTV < qh.MaTVVC
      ORDER BY qh.NgayBatDau
    `;
  } else if (LoaiSuKien === 'mat') {
    sql = `
      SELECT MaTV, HoTen, NgayGioMat, MaNguyenNhanMat
      FROM THANHVIEN
      WHERE YEAR(NgayGioMat) = ?
      ORDER BY NgayGioMat
    `;
  }
  
  const rows = await databaseService.query(sql, [Nam]);
  return rows;
}
```

---

## 📝 Checklist Hoàn Thành

- [ ] **BƯỚC 1**: Tạo schema `BaoCaoTangGiam.schema.ts` (optional)
- [ ] **BƯỚC 2**: Thêm method `getBaoCaoTangGiam()` vào `thanhvien.services.ts`
- [ ] **BƯỚC 3**: Thêm controller `getBaoCaoTangGiamController` vào `thanhvien.controllers.ts`
- [ ] **BƯỚC 4**: Cập nhật import và thêm route `/baocao/tanggiam` vào `thanhvien.routes.ts` (đặt TRƯỚC `/:MaTV`)
- [ ] **BƯỚC 5**: Kiểm tra route `/thanhvien` đã được đăng ký trong `index.ts`
- [ ] **Test API**: Chạy thử các test case với Postman/Thunder Client
- [ ] **Kiểm tra database**: Xem dữ liệu sinh/kết hôn/mất theo năm
- [ ] **Frontend**: Tạo form và bảng hiển thị (nếu có)
- [ ] **Tính năng mở rộng**: Xuất Excel, biểu đồ (optional)

---

## 🚨 Lưu Ý Quan Trọng

### 1. Về Dữ Liệu Kết Hôn

⚠️ **QUAN TRỌNG**: Bảng `QUANHEVOCHONG` lưu **2 bản ghi cho mỗi cặp vợ chồng**:
```sql
-- Cặp A-B có 2 records:
(MaTV='A', MaTVVC='B', NgayBatDau='2020-01-01')
(MaTV='B', MaTVVC='A', NgayBatDau='2020-01-01')
```

**Giải pháp**: Dùng điều kiện `MaTV < MaTVVC` để chỉ đếm 1 lần:
```sql
WHERE MaTV < MaTVVC  -- Chỉ lấy cặp A-B, bỏ qua B-A
```

### 2. Về Performance

- Query sử dụng CTE (Common Table Expression) để tạo YearRange
- Nếu khoảng năm quá lớn (> 50 năm), cân nhắc giới hạn
- Có thể thêm index nếu cần:

```sql
CREATE INDEX idx_thanhvien_ngaysinh ON THANHVIEN(NgayGioSinh);
CREATE INDEX idx_thanhvien_ngaymat ON THANHVIEN(NgayGioMat);
CREATE INDEX idx_quanhevochong_ngaybatdau ON QUANHEVOCHONG(NgayBatDau);
```
UNION để lấy các năm có sự kiện, sau đó dùng subquery
- **Ưu điểm**: Chỉ xử lý những năm có dữ liệu, bỏ qua năm trống
- **Tối ưu hơn** so với cách tạo full YearRange rồi LEFT JOIN

- Năm bắt đầu <= Năm kết thúc
- Năm kết thúc <= Năm hiện tại
- Khoảng nămUnknown column in field list" hoặc lỗi ROW_NUMBER()

**Nguyên nhân**: MySQL version < 8.0 không hỗ trợ ROW_NUMBER()

**Giải pháp**: Dùng biến thay vì ROW_NUMBER():

```typescript
// Query thay thế cho MySQL 5.x
const sql = `
  SET @row_number = 0;
  
  SELECT 
    (@row_number:=@row_number + 1) AS STT,
    ay.Nam,
    COALESCE(
      (SELECT COUNT(*) FROM THANHVIEN 
       WHERE YEAR(NgayGioSinh) = ay.Nam), 0
    ) AS SoLuongSinh,
    COALESCE(
      (SELECT COUNT(*) FROM QUANHEVOCHONG 
       WHERE YEAR(NgayBatDau) = ay.Nam AND MaTV < MaTVVC), 0
    ) AS SoLuongKetHon,
    COALESCE(
      (SELECT COUNT(*) FROM THANHVIEN 
       WHERE YEAR(NgayGioMat) = ay.Nam AND NgayGioMat IS NOT NULL), 0
    ) AS SoLuongMat
  FROM (
    SELECT DISTINCT YEAR(NgayGioSinh) as Nam
    FROM THANHVIEN
    WHERE YEAR(NgayGioSinh) BETWEEN ? AND ?
    
    UNION
    
    SELECT DISTINCT YEAR(NgayBatDau) as Nam
    FROM QUANHEVOCHONG
    WHERE YEAR(NgayBatDau) BETWEEN ? AND ?
    
    UNION
    
    SELECT DISTINCT YEAR(NgayGioMat) as Nam
    FROM THANHVIEN
    WHERE YEAR(NgayGioMat) BETWEEN ? AND ?
      AND NgayGioMat IS NOT NULL
  ) ay
  ORDER BY ay.Nam
`;
```

**Lưu ý**: Với MySQL 5.x, bạn cần chạy 2 query riêng (SET và SELECT).   (SELECT COUNT(*) FROM QUANHEVOCHONG 
       WHERE YEAR(NgayBatDau) = years.Nam AND MaTV < MaTVVC), 0
    ) AS SoLuongKetHon,
    COALESCE(
      (SELECT COUNT(*) FROM THANHVIEN 
       WHERE YEAR(NgayGioMat) = years.Nam AND NgayGioMat IS NOT NULL), 0
    ) AS SoLuongMat
  FROM (
    SELECT ? + (a.a + (10 * b.a)) as Nam
    FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 
          UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 
          UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
    CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 
                UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 
                UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 
                UNION ALL SELECT 9) b
  ) years
  WHERE years.Nam <= ?
  ORDER BY years.Nam
`;
```

### Lỗi 2: Route không hoạt động

**Kiểm tra**:
1. Route đặt đúng vị trí (trước `/:MaTV`)
2. Import controller đầy đủ
3. Server đã restart sau khi sửa code

### Lỗ 3: Không có dữ liệu

**Kiểm tra database**:
```sql
SELECT COUNT(*) FROM THANHVIEN;
SELECT COUNT(*) FROM QUANHEVOCHONG;
SELECT MIN(YEAR(NgayGioSinh)), MAX(YEAR(NgayGioSinh)) FROM THANHVIEN;
```

---

## 🎯 Kết Luận

Tính năng "Báo cáo tăng giảm thành viên" đã được thiết kế với:

Sửa **Backend hoàn chỉnh**: Service, Controller, Route  
Sửa **Query tối ưu**: Sử dụng CTE và LEFT JOIN  
Sửa **Tránh đếm trùng**: Xử lý đúng bảng QUANHEVOCHONG  
Sửa **Validation đầy đủ**: Kiểm tra input, xử lý lỗi  
Sửa **Scalable**: Dễ mở rộng (Excel, biểu đồ, chi tiết...)  
Sửa **Documentation đầy đủ**: Hướng dẫn từng bước  

**Thời gian ước tính**: 30-60 phút implement backend + 1-2 giờ frontend

Chúc bạn implement thành công! 🚀
