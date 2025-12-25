# Hướng Dẫn Thêm Chức Năng "Báo Cáo Thành Tích Các Thành Viên"

## 📋 Tổng Quan Chức Năng

Tính năng này cho phép người dùng xem báo cáo thống kê số lượng thành tích của các thành viên theo:
- **Năm bắt đầu tính**: Năm bắt đầu của khoảng thời gian báo cáo
- **Năm cuối cùng tính**: Năm kết thúc của khoảng thời gian báo cáo
- **Bảng kết quả** hiển thị:
  - STT
  - Loại thành tích
  - Số lượng

---

## 🗄️ Phân Tích Cơ Sở Dữ Liệu

### 1. Bảng Liên Quan

#### Bảng `BAOCAOTHANHTICH`
```sql
CREATE TABLE BAOCAOTHANHTICH (
    Nam INT,
    MaLTT VARCHAR(5),
    SoLuong INT,
    PRIMARY KEY (Nam, MaLTT),
    FOREIGN KEY (MaLTT) REFERENCES LOAITHANHTICH(MaLTT)
);
```

**Mô tả**: Bảng này **ĐÃ TỒN TẠI** trong database và được **TỰ ĐỘNG CẬP NHẬT** bởi trigger.

**Cấu trúc**:
- `Nam`: Năm thành tích được ghi nhận
- `MaLTT`: Mã loại thành tích (FK đến LOAITHANHTICH)
- `SoLuong`: Số lượng thành tích của loại này trong năm

#### Bảng `LOAITHANHTICH`
```sql
CREATE TABLE LOAITHANHTICH(
    MaLTT VARCHAR(5) PRIMARY KEY,
    TenLTT VARCHAR(35) UNIQUE
);
```

**Mô tả**: Chứa danh sách các loại thành tích (Huân chương, Huy chương, Bằng khen, v.v.)

#### Bảng `GHINHANTHANHTICH`
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

**Mô tả**: Bảng ghi nhận thành tích của từng thành viên

### 2. Trigger Tự Động Cập Nhật

**Trigger**: `TRG_UPDATE_BAOCAOTHANHTICH_AFTER_INSERT`

```sql
-- Trigger này đã được tạo trong init.sql
CREATE TRIGGER TRG_UPDATE_BAOCAOTHANHTICH_AFTER_INSERT
AFTER INSERT ON GHINHANTHANHTICH
FOR EACH ROW
BEGIN
    DECLARE current_year INT;
    DECLARE existing_count INT;

    SET current_year = YEAR(NEW.NgayPhatSinh);

    -- Kiểm tra xem đã có bản ghi cho năm và loại thành tích này chưa
    SELECT SoLuong INTO existing_count
    FROM BAOCAOTHANHTICH
    WHERE Nam = current_year AND MaLTT = NEW.MaLTT;

    IF existing_count IS NOT NULL THEN
        -- Nếu có, tăng số lượng lên 1
        UPDATE BAOCAOTHANHTICH
        SET SoLuong = SoLuong + 1
        WHERE Nam = current_year AND MaLTT = NEW.MaLTT;
    ELSE
        -- Nếu chưa có, tạo mới bản ghi với số lượng là 1
        INSERT INTO BAOCAOTHANHTICH (Nam, MaLTT, SoLuong)
        VALUES (current_year, NEW.MaLTT, 1);
    END IF;
END;
```

**Kết luận**: 
- ✅ Bảng `BAOCAOTHANHTICH` đã tồn tại và được tự động cập nhật
- ✅ Mỗi khi có thành tích mới được ghi nhận, trigger sẽ tự động cập nhật số lượng
- ✅ Không cần thêm logic update thủ công

---

## 🎯 Yêu Cầu Chức Năng

### Input từ người dùng:
1. **Năm bắt đầu** (NamBatDau): Năm bắt đầu tính báo cáo (VD: 2020)
2. **Năm kết thúc** (NamKetThuc): Năm kết thúc tính báo cáo (VD: 2024)

### Output:
Bảng báo cáo với các cột:

| STT | Loại Thành Tích | Số Lượng |
|-----|----------------|----------|
| 1   | Huân chương Sao Vàng | 5 |
| 2   | Huy chương Lao Động | 12 |
| 3   | Bằng khen | 25 |
| ... | ... | ... |

**Lưu ý**: 
- Số lượng là tổng của tất cả các năm trong khoảng [NamBatDau, NamKetThuc]
- Sắp xếp theo số lượng giảm dần (nhiều nhất → ít nhất)
- Chỉ hiển thị các loại thành tích có số lượng > 0

---

## 🛠️ Hướng Dẫn Implementation

### BƯỚC 1: Tạo Schema Model (Optional - Nếu cần)

**File mới**: `backend/src/models/schemas/BaoCaoThanhTich.schema.ts`

```typescript
// src/models/schemas/BaoCaoThanhTich.schema.ts

interface BaoCaoThanhTichType {
  Nam: number;
  MaLTT: string;
  SoLuong: number;
}

export default class BaoCaoThanhTich {
  Nam: number;
  MaLTT: string;
  SoLuong: number;

  constructor(baoCao: BaoCaoThanhTichType) {
    this.Nam = baoCao.Nam;
    this.MaLTT = baoCao.MaLTT;
    this.SoLuong = baoCao.SoLuong;
  }
}
```

**Lưu ý**: Schema này là optional vì bạn có thể trả về trực tiếp kết quả query mà không cần class wrapper.

---

### BƯỚC 2: Thêm Service Method

**File**: `backend/src/services/thanhtich.services.ts`

**Vị trí thêm**: Sau method `checkThanhTichExists`, trước dòng `export default`

```typescript
  /**
   * ✅ MỚI: Lấy báo cáo thành tích theo khoảng năm
   * Tổng hợp số lượng thành tích từ bảng BAOCAOTHANHTICH
   */
  async getBaoCaoThanhTich(NamBatDau: number, NamKetThuc: number) {
    // Validate input
    if (NamBatDau > NamKetThuc) {
      throw new Error('Năm bắt đầu không được lớn hơn năm kết thúc');
    }

    const currentYear = new Date().getFullYear();
    if (NamKetThuc > currentYear) {
      throw new Error(`Năm kết thúc không được vượt quá năm hiện tại (${currentYear})`);
    }

    // Query tổng hợp từ BAOCAOTHANHTICH
    const sql = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY SUM(bctc.SoLuong) DESC) AS STT,
        ltt.TenLTT AS LoaiThanhTich,
        SUM(bctc.SoLuong) AS SoLuong
      FROM BAOCAOTHANHTICH bctc
      INNER JOIN LOAITHANHTICH ltt ON bctc.MaLTT = ltt.MaLTT
      WHERE bctc.Nam BETWEEN ? AND ?
      GROUP BY bctc.MaLTT, ltt.TenLTT
      HAVING SUM(bctc.SoLuong) > 0
      ORDER BY SoLuong DESC
    `;

    interface BaoCaoRow extends RowDataPacket {
      STT: number;
      LoaiThanhTich: string;
      SoLuong: number;
    }

    const rows = await databaseService.query<BaoCaoRow[]>(sql, [NamBatDau, NamKetThuc]);

    return {
      NamBatDau,
      NamKetThuc,
      TongLoaiThanhTich: rows.length,
      TongSoLuong: rows.reduce((sum, row) => sum + parseInt(row.SoLuong.toString()), 0),
      DanhSach: rows
    };
  }
```

**Giải thích query**:
- `ROW_NUMBER() OVER (ORDER BY TongSoLuong DESC)`: Tự động đánh số thứ tự
- `SUM(bctc.SoLuong)`: Tổng số lượng của từng loại thành tích trong khoảng năm
- `WHERE bctc.Nam BETWEEN ? AND ?`: Lọc theo khoảng năm
- `GROUP BY bctc.MaLTT, ltt.TenLTT`: Nhóm theo loại thành tích
- `HAVING SUM(bctc.SoLuong) > 0`: Chỉ lấy loại có số lượng > 0
- `ORDER BY SoLuong DESC`: Sắp xếp giảm dần theo số lượng

---

### BƯỚC 3: Thêm Controller

**File**: `backend/src/controllers/thanhtich.controllers.ts`

**Vị trí thêm**: Sau controller `xoaThanhTichController`, trước dòng export

```typescript
/**
 * ✅ MỚI: Controller lấy báo cáo thành tích theo khoảng năm
 * GET /thanhtich/baocao
 * Query params: 
 * - NamBatDau: Năm bắt đầu (required)
 * - NamKetThuc: Năm kết thúc (required)
 * 
 * Response: {
 *   message: string,
 *   result: {
 *     NamBatDau: number,
 *     NamKetThuc: number,
 *     TongLoaiThanhTich: number,
 *     TongSoLuong: number,
 *     DanhSach: [{ STT, LoaiThanhTich, SoLuong }]
 *   }
 * }
 */
export const getBaoCaoThanhTichController = async (req: Request, res: Response) => {
  try {
    const { NamBatDau, NamKetThuc } = req.query;

    // Validate input
    if (!NamBatDau || !NamKetThuc) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin: NamBatDau và NamKetThuc là bắt buộc'
      });
    }

    const namBatDau = parseInt(NamBatDau as string);
    const namKetThuc = parseInt(NamKetThuc as string);

    // Validate số hợp lệ
    if (isNaN(namBatDau) || isNaN(namKetThuc)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'NamBatDau và NamKetThuc phải là số nguyên hợp lệ'
      });
    }

    const result = await thanhTichService.getBaoCaoThanhTich(namBatDau, namKetThuc);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy báo cáo thành tích thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi getBaoCaoThanhTich:', error);
    
    // Xử lý lỗi validation từ service
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

**Giải thích**:
- Nhận 2 query params: `NamBatDau` và `NamKetThuc`
- Validate input: kiểm tra bắt buộc và kiểu số nguyên
- Gọi service method và trả về kết quả
- Xử lý lỗi chi tiết

---

### BƯỚC 4: Thêm Route

**File**: `backend/src/routes/thanhtich.routes.ts`

**Vị trí thêm**: 
1. Thêm import controller ở đầu file
2. Thêm route mới sau route `/xoa`

**PHẦN 1: Cập nhật import**

```typescript
// Dòng import ở đầu file
import {
  getLoaiThanhTichController,
  ghiNhanThanhTichController,
  traCuuThanhTichController,
  getThanhTichByHoTenController,
  xoaThanhTichController,
  getBaoCaoThanhTichController // ✅ THÊM DÒNG NÀY
} from '~/controllers/thanhtich.controllers';
```

**PHẦN 2: Thêm route**

```typescript
/**
 * ✅ MỚI: GET /thanhtich/baocao - Lấy báo cáo thành tích theo khoảng năm
 * Query params:
 * - NamBatDau: Năm bắt đầu (required, số nguyên)
 * - NamKetThuc: Năm kết thúc (required, số nguyên)
 * 
 * Ví dụ: /thanhtich/baocao?NamBatDau=2020&NamKetThuc=2024
 * 
 * Response: {
 *   message: "Lấy báo cáo thành tích thành công",
 *   result: {
 *     NamBatDau: 2020,
 *     NamKetThuc: 2024,
 *     TongLoaiThanhTich: 5,
 *     TongSoLuong: 42,
 *     DanhSach: [
 *       { STT: 1, LoaiThanhTich: "Huân chương Sao Vàng", SoLuong: 15 },
 *       { STT: 2, LoaiThanhTich: "Huy chương Lao Động", SoLuong: 12 },
 *       ...
 *     ]
 *   }
 * }
 */
thanhTichRouter.get('/baocao', getBaoCaoThanhTichController);
```

**Vị trí đặt route**: Thêm sau route `thanhTichRouter.delete('/xoa', ...)` và trước dòng `export default thanhTichRouter;`

---

### BƯỚC 5: Đăng Ký Route Vào Main Router (Kiểm tra)

**File**: `backend/src/index.ts` hoặc file router chính

**Kiểm tra**: Route `/thanhtich` đã được đăng ký chưa?

```typescript
// Kiểm tra xem có dòng này trong index.ts không
import thanhTichRouter from '~/routes/thanhtich.routes';

// ...

app.use('/thanhtich', thanhTichRouter);
```

**Nếu chưa có**, thêm vào file `index.ts`:

```typescript
import thanhTichRouter from '~/routes/thanhtich.routes';

// Trong phần đăng ký routes
app.use('/thanhtich', thanhTichRouter);
```

---

## 🧪 Test API

### 1. Test với Postman/Thunder Client

#### Test Case 1: Báo cáo thành công
```
GET http://localhost:3000/thanhtich/baocao?NamBatDau=2020&NamKetThuc=2024

Response (200 OK):
{
  "message": "Lấy báo cáo thành tích thành công",
  "result": {
    "NamBatDau": 2020,
    "NamKetThuc": 2024,
    "TongLoaiThanhTich": 3,
    "TongSoLuong": 15,
    "DanhSach": [
      {
        "STT": 1,
        "LoaiThanhTich": "Huân chương Sao Vàng",
        "SoLuong": 8
      },
      {
        "STT": 2,
        "LoaiThanhTich": "Huy chương Lao Động",
        "SoLuong": 5
      },
      {
        "STT": 3,
        "LoaiThanhTich": "Bằng khen",
        "SoLuong": 2
      }
    ]
  }
}
```

#### Test Case 2: Thiếu tham số
```
GET http://localhost:3000/thanhtich/baocao?NamBatDau=2020

Response (400 Bad Request):
{
  "message": "Thiếu thông tin: NamBatDau và NamKetThuc là bắt buộc"
}
```

#### Test Case 3: Năm không hợp lệ
```
GET http://localhost:3000/thanhtich/baocao?NamBatDau=2025&NamKetThuc=2020

Response (400 Bad Request):
{
  "message": "Năm bắt đầu không được lớn hơn năm kết thúc"
}
```

#### Test Case 4: Năm vượt quá hiện tại
```
GET http://localhost:3000/thanhtich/baocao?NamBatDau=2020&NamKetThuc=2030

Response (400 Bad Request):
{
  "message": "Năm kết thúc không được vượt quá năm hiện tại (2025)"
}
```

#### Test Case 5: Không có dữ liệu
```
GET http://localhost:3000/thanhtich/baocao?NamBatDau=1990&NamKetThuc=1995

Response (200 OK):
{
  "message": "Lấy báo cáo thành tích thành công",
  "result": {
    "NamBatDau": 1990,
    "NamKetThuc": 1995,
    "TongLoaiThanhTich": 0,
    "TongSoLuong": 0,
    "DanhSach": []
  }
}
```

### 2. Test với cURL

```bash
# Test cơ bản
curl "http://localhost:3000/thanhtich/baocao?NamBatDau=2020&NamKetThuc=2024"

# Test với header JSON
curl -H "Content-Type: application/json" \
  "http://localhost:3000/thanhtich/baocao?NamBatDau=2020&NamKetThuc=2024"
```

---

## 🔍 Kiểm Tra Dữ Liệu Database

### 1. Kiểm tra bảng BAOCAOTHANHTICH

```sql
-- Xem tất cả dữ liệu báo cáo
SELECT * FROM BAOCAOTHANHTICH 
ORDER BY Nam DESC, SoLuong DESC;

-- Xem tổng số lượng theo năm
SELECT 
  Nam,
  COUNT(*) as SoLoaiThanhTich,
  SUM(SoLuong) as TongSoLuong
FROM BAOCAOTHANHTICH
GROUP BY Nam
ORDER BY Nam DESC;

-- Xem chi tiết một khoảng năm
SELECT 
  bctc.Nam,
  ltt.TenLTT as LoaiThanhTich,
  bctc.SoLuong
FROM BAOCAOTHANHTICH bctc
INNER JOIN LOAITHANHTICH ltt ON bctc.MaLTT = ltt.MaLTT
WHERE bctc.Nam BETWEEN 2020 AND 2024
ORDER BY bctc.Nam DESC, bctc.SoLuong DESC;
```

### 2. Kiểm tra các năm có dữ liệu

```sql
-- Lấy danh sách các năm có thành tích
SELECT DISTINCT Nam 
FROM BAOCAOTHANHTICH 
ORDER BY Nam DESC;

-- Hoặc từ bảng gốc
SELECT DISTINCT YEAR(NgayPhatSinh) as Nam
FROM GHINHANTHANHTICH
ORDER BY Nam DESC;
```

### 3. Thêm dữ liệu test (nếu chưa có)

```sql
-- Thêm một số thành tích test
INSERT INTO GHINHANTHANHTICH (MaLTT, MaTV, NgayPhatSinh) VALUES
('LTT01', 'TV01', '2020-05-15 10:00:00'),
('LTT01', 'TV02', '2020-08-20 14:30:00'),
('LTT02', 'TV03', '2021-03-10 09:00:00'),
('LTT02', 'TV04', '2021-07-25 16:45:00'),
('LTT03', 'TV05', '2022-01-05 11:20:00'),
('LTT01', 'TV06', '2023-06-18 13:00:00'),
('LTT03', 'TV07', '2024-02-28 15:30:00');

-- Kiểm tra trigger đã cập nhật BAOCAOTHANHTICH chưa
SELECT * FROM BAOCAOTHANHTICH;
```

---

## 📊 Tích Hợp Frontend

### 1. Component Form Nhập Liệu

**Ví dụ React/Vue**:

```typescript
// Component: BaoCaoThanhTichForm.tsx (React)
import { useState } from 'react';

interface BaoCaoFormData {
  NamBatDau: number;
  NamKetThuc: number;
}

export default function BaoCaoThanhTichForm() {
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
        `http://localhost:3000/thanhtich/baocao?NamBatDau=${formData.NamBatDau}&NamKetThuc=${formData.NamKetThuc}`
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
      <h2>Báo Cáo Thành Tích Các Thành Viên</h2>
      
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
        <BaoCaoTable baoCao={baoCao} />
      )}
    </div>
  );
}
```

### 2. Component Hiển Thị Bảng

```typescript
// Component: BaoCaoTable.tsx (React)
interface BaoCaoTableProps {
  baoCao: {
    NamBatDau: number;
    NamKetThuc: number;
    TongLoaiThanhTich: number;
    TongSoLuong: number;
    DanhSach: Array<{
      STT: number;
      LoaiThanhTich: string;
      SoLuong: number;
    }>;
  };
}

export default function BaoCaoTable({ baoCao }: BaoCaoTableProps) {
  return (
    <div className="bao-cao-result">
      <div className="bao-cao-header">
        <h3>Báo cáo từ năm {baoCao.NamBatDau} đến {baoCao.NamKetThuc}</h3>
        <div className="summary">
          <span>Tổng loại thành tích: <strong>{baoCao.TongLoaiThanhTich}</strong></span>
          <span>Tổng số lượng: <strong>{baoCao.TongSoLuong}</strong></span>
        </div>
      </div>

      {baoCao.DanhSach.length === 0 ? (
        <p className="no-data">Không có dữ liệu trong khoảng thời gian này</p>
      ) : (
        <table className="bao-cao-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Loại Thành Tích</th>
              <th>Số Lượng</th>
            </tr>
          </thead>
          <tbody>
            {baoCao.DanhSach.map((item) => (
              <tr key={item.STT}>
                <td>{item.STT}</td>
                <td>{item.LoaiThanhTich}</td>
                <td className="text-center">
                  <strong>{item.SoLuong}</strong>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}><strong>Tổng cộng</strong></td>
              <td className="text-center">
                <strong>{baoCao.TongSoLuong}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
```

### 3. CSS Styling (Tham khảo)

```css
/* styles/BaoCaoThanhTich.css */
.bao-cao-container {
  max-width: 900px;
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
  background: #007bff;
  color: white;
  padding: 20px;
}

.bao-cao-header h3 {
  margin: 0 0 15px 0;
}

.summary {
  display: flex;
  gap: 30px;
  font-size: 14px;
}

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
}

.bao-cao-table tbody tr:hover {
  background: #f8f9fa;
}

.bao-cao-table tfoot {
  background: #e9ecef;
  font-weight: 600;
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
```

---

## 🔐 Bảo Mật & Quyền Hạn (Optional)

Nếu muốn thêm kiểm tra quyền hạn:

### 1. Thêm Middleware Xác Thực

**File**: `backend/src/middlewares/users.middlewares.ts` (giả sử đã có)

```typescript
// Middleware kiểm tra quyền xem báo cáo
export const checkBaoCaoPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user; // Giả sử đã có từ auth middleware

    // Chỉ Admin và TruongToc mới được xem báo cáo
    const allowedRoles = ['Admin', 'TruongToc'];
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Bạn không có quyền xem báo cáo thành tích'
      });
    }

    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: 'Vui lòng đăng nhập'
    });
  }
};
```

### 2. Áp Dụng Middleware

**File**: `backend/src/routes/thanhtich.routes.ts`

```typescript
import { checkBaoCaoPermission } from '~/middlewares/users.middlewares';

// Thêm middleware vào route
thanhTichRouter.get(
  '/baocao', 
  checkBaoCaoPermission, // ✅ Thêm middleware này
  getBaoCaoThanhTichController
);
```

---

## 🎨 Tính Năng Mở Rộng (Optional)

### 1. Xuất Excel

**Thêm vào controller**:

```typescript
import ExcelJS from 'exceljs';

export const exportBaoCaoToExcel = async (req: Request, res: Response) => {
  try {
    const { NamBatDau, NamKetThuc } = req.query;
    
    // Validate và lấy dữ liệu
    const namBatDau = parseInt(NamBatDau as string);
    const namKetThuc = parseInt(NamKetThuc as string);
    const result = await thanhTichService.getBaoCaoThanhTich(namBatDau, namKetThuc);

    // Tạo workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo thành tích');

    // Thêm tiêu đề
    worksheet.addRow(['BÁO CÁO THÀNH TÍCH CÁC THÀNH VIÊN']);
    worksheet.addRow([`Từ năm ${result.NamBatDau} đến năm ${result.NamKetThuc}`]);
    worksheet.addRow([]); // Dòng trống

    // Thêm header
    worksheet.addRow(['STT', 'Loại Thành Tích', 'Số Lượng']);

    // Thêm dữ liệu
    result.DanhSach.forEach(item => {
      worksheet.addRow([item.STT, item.LoaiThanhTich, item.SoLuong]);
    });

    // Thêm tổng
    worksheet.addRow(['', 'Tổng cộng', result.TongSoLuong]);

    // Style
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(4).font = { bold: true };

    // Gửi file
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=bao-cao-thanh-tich-${namBatDau}-${namKetThuc}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Lỗi xuất Excel:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi xuất file Excel',
      error: error.message
    });
  }
};
```

**Thêm route**:

```typescript
thanhTichRouter.get('/baocao/export', exportBaoCaoToExcel);
```

**Cài đặt package**:

```bash
npm install exceljs
npm install --save-dev @types/exceljs
```

### 2. Báo Cáo Chi Tiết Theo Loại

**Thêm endpoint mới** để xem chi tiết thành viên theo loại thành tích:

```typescript
// Service method
async getBaoCaoChiTiet(NamBatDau: number, NamKetThuc: number, MaLTT?: string) {
  let sql = `
    SELECT 
      ROW_NUMBER() OVER (ORDER BY tv.HoTen) AS STT,
      tv.MaTV,
      tv.HoTen,
      ltt.TenLTT as LoaiThanhTich,
      COUNT(*) as SoLan,
      MIN(g.NgayPhatSinh) as LanDauTien,
      MAX(g.NgayPhatSinh) as LanGanNhat
    FROM GHINHANTHANHTICH g
    INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV
    INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
    WHERE YEAR(g.NgayPhatSinh) BETWEEN ? AND ?
  `;

  const params: any[] = [NamBatDau, NamKetThuc];

  if (MaLTT) {
    sql += ' AND g.MaLTT = ?';
    params.push(MaLTT);
  }

  sql += ' GROUP BY tv.MaTV, tv.HoTen, ltt.TenLTT ORDER BY SoLan DESC';

  const rows = await databaseService.query(sql, params);
  return rows;
}
```

### 3. Biểu Đồ Thống Kê

Frontend có thể dùng thư viện như **Chart.js** hoặc **Recharts** để vẽ:
- Biểu đồ cột: Số lượng thành tích theo loại
- Biểu đồ tròn: Tỷ lệ phần trăm các loại thành tích
- Biểu đồ đường: Xu hướng thành tích theo năm

---

## 📝 Checklist Hoàn Thành

- [ ] **BƯỚC 1**: Tạo schema `BaoCaoThanhTich.schema.ts` (optional)
- [ ] **BƯỚC 2**: Thêm method `getBaoCaoThanhTich()` vào `thanhtich.services.ts`
- [ ] **BƯỚC 3**: Thêm controller `getBaoCaoThanhTichController` vào `thanhtich.controllers.ts`
- [ ] **BƯỚC 4**: Cập nhật import và thêm route `/baocao` vào `thanhtich.routes.ts`
- [ ] **BƯỚC 5**: Kiểm tra route đã được đăng ký trong `index.ts`
- [ ] **Test API**: Chạy thử các test case với Postman/Thunder Client
- [ ] **Kiểm tra database**: Xem dữ liệu bảng `BAOCAOTHANHTICH`
- [ ] **Frontend**: Tạo form và bảng hiển thị (nếu có)
- [ ] **Bảo mật**: Thêm middleware kiểm tra quyền (nếu cần)
- [ ] **Tính năng mở rộng**: Xuất Excel, biểu đồ (optional)

---

## 🚨 Lưu Ý Quan Trọng

### 1. Về Dữ Liệu

- ✅ Bảng `BAOCAOTHANHTICH` **ĐÃ TỒN TẠI** trong database
- ✅ Trigger `TRG_UPDATE_BAOCAOTHANHTICH_AFTER_INSERT` **TỰ ĐỘNG CẬP NHẬT** mỗi khi có thành tích mới
- ⚠️ Nếu bạn thêm thành tích thủ công vào bảng `GHINHANTHANHTICH` trước khi trigger được tạo, cần chạy script cập nhật:

```sql
-- Script khôi phục dữ liệu BAOCAOTHANHTICH từ GHINHANTHANHTICH
TRUNCATE TABLE BAOCAOTHANHTICH;

INSERT INTO BAOCAOTHANHTICH (Nam, MaLTT, SoLuong)
SELECT 
  YEAR(NgayPhatSinh) as Nam,
  MaLTT,
  COUNT(*) as SoLuong
FROM GHINHANTHANHTICH
GROUP BY YEAR(NgayPhatSinh), MaLTT;
```

### 2. Về Performance

- Query đã được tối ưu với `GROUP BY` và `HAVING`
- Nếu dữ liệu lớn (> 100,000 records), cân nhắc thêm index:

```sql
-- Thêm index nếu cần
CREATE INDEX idx_baocao_nam ON BAOCAOTHANHTICH(Nam);
CREATE INDEX idx_baocao_maltt ON BAOCAOTHANHTICH(MaLTT);
```

### 3. Về Validation

- Frontend nên validate năm trước khi gửi request
- Backend đã có validation đầy đủ:
  - Kiểm tra bắt buộc
  - Kiểm tra kiểu số nguyên
  - Kiểm tra logic (năm bắt đầu <= năm kết thúc)
  - Kiểm tra năm không vượt quá hiện tại

### 4. Về Bảo Mật

- Endpoint này chỉ đọc dữ liệu, không thay đổi database
- Nên thêm middleware xác thực người dùng
- Nên giới hạn quyền truy cập (chỉ Admin/TruongToc)
- Cân nhắc thêm rate limiting để tránh spam

---

## 📞 Hỗ Trợ & Troubleshooting

### Lỗi thường gặp:

#### 1. Không có dữ liệu trả về

**Nguyên nhân**: Bảng `BAOCAOTHANHTICH` chưa có dữ liệu

**Giải pháp**:
```sql
-- Kiểm tra
SELECT * FROM BAOCAOTHANHTICH;

-- Nếu rỗng, chạy script khôi phục ở trên
```

#### 2. Lỗi "Cannot find module"

**Nguyên nhân**: Chưa compile TypeScript

**Giải pháp**:
```bash
cd backend
npm run build
npm run dev
```

#### 3. Lỗi 404 Not Found

**Nguyên nhân**: Route chưa được đăng ký

**Giải pháp**: Kiểm tra file `index.ts` đã import và use `thanhTichRouter` chưa

#### 4. Lỗi database connection

**Nguyên nhân**: Database chưa chạy

**Giải pháp**:
```bash
cd backend
docker-compose up -d
```

---

## 🎯 Kết Luận

Tính năng "Báo cáo thành tích các thành viên" đã được thiết kế với:

✅ **Backend hoàn chỉnh**: Service, Controller, Route, Validation  
✅ **Database tối ưu**: Sử dụng bảng báo cáo có sẵn + Trigger tự động  
✅ **API RESTful**: Endpoint rõ ràng, response chuẩn  
✅ **Validation đầy đủ**: Kiểm tra input, xử lý lỗi chi tiết  
✅ **Scalable**: Dễ mở rộng (Excel export, biểu đồ, chi tiết...)  
✅ **Documentation đầy đủ**: Hướng dẫn chi tiết từng bước  

**Thời gian ước tính**: 30-60 phút implement backend + 1-2 giờ làm frontend (nếu cần)

Chúc bạn implement thành công! 🚀
