# Hướng Dẫn Thêm Chức Năng Ghi Nhận & Tra Cứu Thành Tích

## 📋 Tổng Quan

Thêm 2 chức năng mới cho module Thành Tích:
1. **Ghi nhận thành tích** - Form nhập thành tích mới cho thành viên
2. **Tra cứu thành tích** - Xem danh sách thành tích đã ghi nhận

---

## 🗄️ Kiểm Tra Database Schema

### Bảng LOAITHANHTICH
```sql
CREATE TABLE LOAITHANHTICH(
	MaLTT VARCHAR(5) PRIMARY KEY,
	TenLTT VARCHAR(35) UNIQUE
);
```

**Dữ liệu mẫu:**
```sql
INSERT INTO LOAITHANHTICH (MaLTT, TenLTT) VALUES
('LTT01', 'Huân chương Lao động'),
('LTT02', 'Bằng khen Thủ tướng'),
('LTT03', 'Chiến sĩ thi đua'),
('LTT04', 'Giấy khen cấp tỉnh'),
('LTT05', 'Học bổng giỏi'),
('LTT06', 'Giải thưởng khoa học kỹ thuật');
```

---

### Bảng GHINHANTHANHTICH
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

**Lưu ý:**
- Primary Key là composite: `(MaLTT, MaTV, NgayPhatSinh)`
- Một thành viên có thể có nhiều thành tích khác nhau
- Một thành viên có thể nhận cùng một loại thành tích vào các ngày khác nhau

---

### Trigger Kiểm Tra Ngày Thành Tích
```sql
CREATE TRIGGER TRG_CHECK_NGAY_THANHTICH
BEFORE INSERT ON GHINHANTHANHTICH
FOR EACH ROW
BEGIN
    DECLARE ngay_sinh DATE;

    -- lấy ngày sinh của thành viên
    SELECT DATE(NgayGioSinh) INTO ngay_sinh
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;

    -- kiểm tra ngày
    IF NEW.NgayPhatSinh <= ngay_sinh THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ngày đạt thành tích phải sau ngày sinh thành viên!';
    END IF;
END;
```

**Trigger này đảm bảo:** Ngày đạt thành tích phải sau ngày sinh của thành viên.

---

## 📂 Cấu Trúc File Cần Tạo

```
backend/src/
├── models/
│   └── schemas/
│       ├── LoaiThanhTich.schema.ts          [MỚI]
│       └── GhiNhanThanhTich.schema.ts       [MỚI]
├── services/
│   └── thanhtich.services.ts                [MỚI]
├── controllers/
│   └── thanhtich.controllers.ts             [MỚI]
├── routes/
│   └── thanhtich.routes.ts                  [MỚI]
└── index.ts                                  [CẬP NHẬT - thêm route]
```

---

## 🔨 Chi Tiết Implementation

### 1. Model: `LoaiThanhTich.schema.ts`

**File:** `backend/src/models/schemas/LoaiThanhTich.schema.ts`

```typescript
// src/models/schemas/LoaiThanhTich.schema.ts

interface LoaiThanhTichType {
  MaLTT: string;
  TenLTT: string;
}

export default class LoaiThanhTich {
  MaLTT: string;
  TenLTT: string;

  constructor(loaiThanhTich: LoaiThanhTichType) {
    this.MaLTT = loaiThanhTich.MaLTT;
    this.TenLTT = loaiThanhTich.TenLTT;
  }
}
```

---

### 2. Model: `GhiNhanThanhTich.schema.ts`

**File:** `backend/src/models/schemas/GhiNhanThanhTich.schema.ts`

```typescript
// src/models/schemas/GhiNhanThanhTich.schema.ts

interface GhiNhanThanhTichType {
  MaLTT: string;
  MaTV: string;
  NgayPhatSinh?: Date;
}

export default class GhiNhanThanhTich {
  MaLTT: string;
  MaTV: string;
  NgayPhatSinh: Date;

  constructor(ghiNhanThanhTich: GhiNhanThanhTichType) {
    this.MaLTT = ghiNhanThanhTich.MaLTT;
    this.MaTV = ghiNhanThanhTich.MaTV;
    this.NgayPhatSinh = ghiNhanThanhTich.NgayPhatSinh || new Date();
  }
}
```

---

### 3. Service: `thanhtich.services.ts`

**File:** `backend/src/services/thanhtich.services.ts`

```typescript
// src/services/thanhtich.services.ts
import GhiNhanThanhTich from '~/models/schemas/GhiNhanThanhTich.schema';
import databaseService from './database.services';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface LoaiThanhTichRow extends RowDataPacket {
  MaLTT: string;
  TenLTT: string;
}

interface GhiNhanThanhTichRow extends RowDataPacket {
  MaLTT: string;
  MaTV: string;
  NgayPhatSinh: Date;
}

interface ThanhTichDetailRow extends RowDataPacket {
  STT: number;
  MaTV: string;
  HoTen: string;
  MaLTT: string;
  TenLTT: string;
  NgayPhatSinh: Date;
}

class ThanhTichService {
  /**
   * Lấy danh sách loại thành tích
   */
  async getAllLoaiThanhTich() {
    const sql = 'SELECT * FROM LOAITHANHTICH ORDER BY TenLTT';
    const rows = await databaseService.query<LoaiThanhTichRow[]>(sql);
    return rows;
  }

  /**
   * Ghi nhận thành tích mới
   */
  async ghiNhanThanhTich(payload: {
    MaTV: string;
    MaLTT: string;
    NgayPhatSinh?: Date;
  }) {
    const ghiNhan = new GhiNhanThanhTich(payload);

    const sql = `
      INSERT INTO GHINHANTHANHTICH (MaLTT, MaTV, NgayPhatSinh) 
      VALUES (?, ?, ?)
    `;

    const params = [
      ghiNhan.MaLTT,
      ghiNhan.MaTV,
      ghiNhan.NgayPhatSinh
    ];

    try {
      const result = await databaseService.query<ResultSetHeader>(sql, params);
      
      return {
        message: 'Ghi nhận thành tích thành công',
        data: {
          MaLTT: ghiNhan.MaLTT,
          MaTV: ghiNhan.MaTV,
          NgayPhatSinh: ghiNhan.NgayPhatSinh,
          affectedRows: result.affectedRows
        }
      };
    } catch (error: any) {
      // Xử lý lỗi trigger (ngày phát sinh không hợp lệ)
      if (error.code === 'ER_SIGNAL_EXCEPTION') {
        throw new Error(error.sqlMessage || 'Ngày đạt thành tích phải sau ngày sinh thành viên!');
      }
      throw error;
    }
  }

  /**
   * Tra cứu thành tích - Lấy tất cả thành tích với thông tin chi tiết
   */
  async traCuuThanhTich(filters?: {
    MaTV?: string;
    HoTen?: string;
    MaLTT?: string;
    TuNgay?: Date;
    DenNgay?: Date;
  }) {
    let sql = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY g.NgayPhatSinh DESC) AS STT,
        g.MaTV,
        tv.HoTen,
        g.MaLTT,
        ltt.TenLTT AS ThanhTich,
        g.NgayPhatSinh
      FROM GHINHANTHANHTICH g
      INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV
      INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
      WHERE 1=1
    `;

    const params: any[] = [];

    // Thêm điều kiện filter nếu có
    if (filters) {
      if (filters.MaTV) {
        sql += ' AND g.MaTV = ?';
        params.push(filters.MaTV);
      }
      if (filters.HoTen) {
        sql += ' AND tv.HoTen LIKE ?';
        params.push(`%${filters.HoTen}%`);
      }
      if (filters.MaLTT) {
        sql += ' AND g.MaLTT = ?';
        params.push(filters.MaLTT);
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

  /**
   * Lấy thành tích của một thành viên cụ thể
   */
  async getThanhTichByMaTV(MaTV: string) {
    const sql = `
      SELECT 
        g.MaLTT,
        ltt.TenLTT AS ThanhTich,
        g.NgayPhatSinh
      FROM GHINHANTHANHTICH g
      INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
      WHERE g.MaTV = ?
      ORDER BY g.NgayPhatSinh DESC
    `;

    const rows = await databaseService.query<RowDataPacket[]>(sql, [MaTV]);
    return rows;
  }

  /**
   * Xóa thành tích
   */
  async xoaThanhTich(MaTV: string, MaLTT: string, NgayPhatSinh: Date) {
    const sql = `
      DELETE FROM GHINHANTHANHTICH 
      WHERE MaTV = ? AND MaLTT = ? AND NgayPhatSinh = ?
    `;

    const result = await databaseService.query<ResultSetHeader>(sql, [MaTV, MaLTT, NgayPhatSinh]);

    return {
      message: 'Xóa thành tích thành công',
      affectedRows: result.affectedRows
    };
  }

  /**
   * Kiểm tra thành tích đã tồn tại chưa
   */
  async checkThanhTichExists(MaTV: string, MaLTT: string, NgayPhatSinh: Date): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM GHINHANTHANHTICH 
      WHERE MaTV = ? AND MaLTT = ? AND NgayPhatSinh = ?
    `;
    
    const [result] = await databaseService.query<RowDataPacket[]>(sql, [MaTV, MaLTT, NgayPhatSinh]);
    return result.count > 0;
  }
}

const thanhTichService = new ThanhTichService();
export default thanhTichService;
```

---

### 4. Controller: `thanhtich.controllers.ts`

**File:** `backend/src/controllers/thanhtich.controllers.ts`

```typescript
// src/controllers/thanhtich.controllers.ts
import { Request, Response } from 'express';
import thanhTichService from '~/services/thanhtich.services';
import HTTP_STATUS from '~/constants/httpStatus';

/**
 * Controller lấy danh sách loại thành tích
 * GET /thanhtich/loai
 */
export const getLoaiThanhTichController = async (req: Request, res: Response) => {
  try {
    const result = await thanhTichService.getAllLoaiThanhTich();
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách loại thành tích thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi getLoaiThanhTich:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi lấy danh sách loại thành tích',
      error: error.message
    });
  }
};

/**
 * Controller ghi nhận thành tích mới
 * POST /thanhtich/ghinhan
 * Body: { MaTV, MaLTT, NgayPhatSinh? }
 */
export const ghiNhanThanhTichController = async (req: Request, res: Response) => {
  const { MaTV, MaLTT, NgayPhatSinh } = req.body;

  try {
    // Validate dữ liệu đầu vào
    if (!MaTV || !MaLTT) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV và MaLTT'
      });
    }

    const result = await thanhTichService.ghiNhanThanhTich({
      MaTV,
      MaLTT,
      NgayPhatSinh: NgayPhatSinh ? new Date(NgayPhatSinh) : undefined
    });

    return res.status(HTTP_STATUS.CREATED).json(result);
  } catch (error: any) {
    console.error('Lỗi ghiNhanThanhTich:', error);
    
    // Xử lý lỗi từ trigger
    if (error.message.includes('ngày sinh')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: error.message
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Ghi nhận thành tích thất bại',
      error: error.message
    });
  }
};

/**
 * Controller tra cứu thành tích
 * GET /thanhtich/tracuu
 * Query params: MaTV?, HoTen?, MaLTT?, TuNgay?, DenNgay?
 */
export const traCuuThanhTichController = async (req: Request, res: Response) => {
  try {
    const { MaTV, HoTen, MaLTT, TuNgay, DenNgay } = req.query;

    const filters: any = {};
    if (MaTV) filters.MaTV = MaTV as string;
    if (HoTen) filters.HoTen = HoTen as string;
    if (MaLTT) filters.MaLTT = MaLTT as string;
    if (TuNgay) filters.TuNgay = new Date(TuNgay as string);
    if (DenNgay) filters.DenNgay = new Date(DenNgay as string);

    const result = await thanhTichService.traCuuThanhTich(filters);

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

/**
 * Controller lấy thành tích theo MaTV
 * GET /thanhtich/:MaTV
 */
export const getThanhTichByMaTVController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await thanhTichService.getThanhTichByMaTV(MaTV);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy thành tích thành công',
      MaTV,
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getThanhTichByMaTV:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy thành tích thất bại',
      error: error.message
    });
  }
};

/**
 * Controller xóa thành tích
 * DELETE /thanhtich/:MaTV/:MaLTT/:NgayPhatSinh
 */
export const xoaThanhTichController = async (req: Request, res: Response) => {
  const { MaTV, MaLTT, NgayPhatSinh } = req.params;

  try {
    const result = await thanhTichService.xoaThanhTich(
      MaTV, 
      MaLTT, 
      new Date(NgayPhatSinh)
    );

    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    console.error('Lỗi xoaThanhTich:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Xóa thành tích thất bại',
      error: error.message
    });
  }
};
```

---

### 5. Routes: `thanhtich.routes.ts`

**File:** `backend/src/routes/thanhtich.routes.ts`

```typescript
// src/routes/thanhtich.routes.ts
import { Router } from 'express';
import {
  getLoaiThanhTichController,
  ghiNhanThanhTichController,
  traCuuThanhTichController,
  getThanhTichByMaTVController,
  xoaThanhTichController
} from '~/controllers/thanhtich.controllers';

const thanhTichRouter = Router();

/**
 * GET /thanhtich/loai - Lấy danh sách loại thành tích
 * Response: [{ MaLTT, TenLTT }]
 */
thanhTichRouter.get('/loai', getLoaiThanhTichController);

/**
 * POST /thanhtich/ghinhan - Ghi nhận thành tích mới
 * Body: { MaTV, MaLTT, NgayPhatSinh? }
 * Response: { message, data }
 */
thanhTichRouter.post('/ghinhan', ghiNhanThanhTichController);

/**
 * GET /thanhtich/tracuu - Tra cứu thành tích
 * Query params: MaTV?, HoTen?, MaLTT?, TuNgay?, DenNgay?
 * Response: { message, total, result: [{ STT, HoTen, ThanhTich, NgayPhatSinh }] }
 */
thanhTichRouter.get('/tracuu', traCuuThanhTichController);

/**
 * GET /thanhtich/:MaTV - Lấy thành tích của một thành viên
 * Response: { message, MaTV, total, result }
 */
thanhTichRouter.get('/:MaTV', getThanhTichByMaTVController);

/**
 * DELETE /thanhtich/:MaTV/:MaLTT/:NgayPhatSinh - Xóa thành tích
 * Response: { message, affectedRows }
 */
thanhTichRouter.delete('/:MaTV/:MaLTT/:NgayPhatSinh', xoaThanhTichController);

export default thanhTichRouter;
```

---

### 6. Cập Nhật: `index.ts`

**File:** `backend/src/index.ts`

Thêm import và sử dụng route mới:

```typescript
// ... existing imports ...
import thanhTichRouter from '~/routes/thanhtich.routes';

// ... existing code ...

// Routes
app.use('/users', usersRouter);
app.use('/thanhvien', thanhvienRouter);
app.use('/lookups', lookupsRouter);
app.use('/thanhtich', thanhTichRouter);  // Sửa THÊM DÒNG NÀY

// ... rest of code ...
```

---

### 7. Cập Nhật Lookups Route (Tùy chọn)

**File:** `backend/src/routes/lookups.routes.ts`

Thêm endpoint lấy loại thành tích vào lookups:

```typescript
/**
 * GET /lookups/loaithanhtich - Lấy danh sách loại thành tích
 */
lookupsRouter.get('/loaithanhtich', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM LOAITHANHTICH ORDER BY TenLTT';
    const result = await databaseService.query(sql);
    return res.json({
      message: 'Lấy danh sách loại thành tích thành công',
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách loại thành tích',
      error
    });
  }
});
```

---

## 🧪 Test API

### 1. Lấy Danh Sách Loại Thành Tích

**Endpoint:** `GET http://localhost:3000/thanhtich/loai`

**Expected Response:** `200 OK`
```json
{
  "message": "Lấy danh sách loại thành tích thành công",
  "result": [
    {
      "MaLTT": "LTT01",
      "TenLTT": "Huân chương Lao động"
    },
    {
      "MaLTT": "LTT02",
      "TenLTT": "Bằng khen Thủ tướng"
    },
    {
      "MaLTT": "LTT03",
      "TenLTT": "Chiến sĩ thi đua"
    },
    {
      "MaLTT": "LTT04",
      "TenLTT": "Giấy khen cấp tỉnh"
    },
    {
      "MaLTT": "LTT05",
      "TenLTT": "Học bổng giỏi"
    },
    {
      "MaLTT": "LTT06",
      "TenLTT": "Giải thưởng khoa học kỹ thuật"
    }
  ]
}
```

---

### 2. Ghi Nhận Thành Tích Mới

**Endpoint:** `POST http://localhost:3000/thanhtich/ghinhan`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "MaTV": "TV04",
  "MaLTT": "LTT01",
  "NgayPhatSinh": "2020-05-15"
}
```

**Expected Response:** `201 Created`
```json
{
  "message": "Ghi nhận thành tích thành công",
  "data": {
    "MaLTT": "LTT01",
    "MaTV": "TV04",
    "NgayPhatSinh": "2020-05-15T00:00:00.000Z",
    "affectedRows": 1
  }
}
```

---

### 3. Ghi Nhận Thành Tích Với Ngày Hiện Tại

**Endpoint:** `POST http://localhost:3000/thanhtich/ghinhan`

**Body:** (không truyền NgayPhatSinh)
```json
{
  "MaTV": "TV06",
  "MaLTT": "LTT05"
}
```

**Expected Response:** `201 Created`
```json
{
  "message": "Ghi nhận thành tích thành công",
  "data": {
    "MaLTT": "LTT05",
    "MaTV": "TV06",
    "NgayPhatSinh": "2024-12-18T10:30:00.000Z",
    "affectedRows": 1
  }
}
```

---

### 4. Test Trigger - Ngày Phát Sinh Không Hợp Lệ

**Endpoint:** `POST http://localhost:3000/thanhtich/ghinhan`

**Body:** (NgayPhatSinh trước ngày sinh của TV04)
```json
{
  "MaTV": "TV04",
  "MaLTT": "LTT02",
  "NgayPhatSinh": "1970-01-01"
}
```

**Expected Response:** `400 Bad Request`
```json
{
  "message": "Ngày đạt thành tích phải sau ngày sinh thành viên!"
}
```

---

### 5. Tra Cứu Tất Cả Thành Tích

**Endpoint:** `GET http://localhost:3000/thanhtich/tracuu`

**Expected Response:** `200 OK`
```json
{
  "message": "Tra cứu thành tích thành công",
  "total": 2,
  "result": [
    {
      "STT": 1,
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "MaLTT": "LTT05",
      "ThanhTich": "Học bổng giỏi",
      "NgayPhatSinh": "2024-12-18T10:30:00.000Z"
    },
    {
      "STT": 2,
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "MaLTT": "LTT01",
      "ThanhTich": "Huân chương Lao động",
      "NgayPhatSinh": "2020-05-15T00:00:00.000Z"
    }
  ]
}
```

---

### 6. Tra Cứu Theo Họ Tên

**Endpoint:** `GET http://localhost:3000/thanhtich/tracuu?HoTen=Nguyễn Văn`

**Expected Response:** `200 OK`
```json
{
  "message": "Tra cứu thành tích thành công",
  "total": 2,
  "result": [
    {
      "STT": 1,
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "MaLTT": "LTT05",
      "ThanhTich": "Học bổng giỏi",
      "NgayPhatSinh": "2024-12-18T10:30:00.000Z"
    },
    {
      "STT": 2,
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "MaLTT": "LTT01",
      "ThanhTich": "Huân chương Lao động",
      "NgayPhatSinh": "2020-05-15T00:00:00.000Z"
    }
  ]
}
```

---

### 7. Tra Cứu Theo MaTV

**Endpoint:** `GET http://localhost:3000/thanhtich/tracuu?MaTV=TV04`

**Expected Response:** `200 OK`
```json
{
  "message": "Tra cứu thành tích thành công",
  "total": 1,
  "result": [
    {
      "STT": 1,
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "MaLTT": "LTT01",
      "ThanhTich": "Huân chương Lao động",
      "NgayPhatSinh": "2020-05-15T00:00:00.000Z"
    }
  ]
}
```

---

### 8. Tra Cứu Theo Loại Thành Tích

**Endpoint:** `GET http://localhost:3000/thanhtich/tracuu?MaLTT=LTT05`

**Expected Response:** `200 OK`
```json
{
  "message": "Tra cứu thành tích thành công",
  "total": 1,
  "result": [
    {
      "STT": 1,
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "MaLTT": "LTT05",
      "ThanhTich": "Học bổng giỏi",
      "NgayPhatSinh": "2024-12-18T10:30:00.000Z"
    }
  ]
}
```

---

### 9. Tra Cứu Theo Khoảng Thời Gian

**Endpoint:** `GET http://localhost:3000/thanhtich/tracuu?TuNgay=2024-01-01&DenNgay=2024-12-31`

**Expected Response:** `200 OK`
```json
{
  "message": "Tra cứu thành tích thành công",
  "total": 1,
  "result": [
    {
      "STT": 1,
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "MaLTT": "LTT05",
      "ThanhTich": "Học bổng giỏi",
      "NgayPhatSinh": "2024-12-18T10:30:00.000Z"
    }
  ]
}
```

---

### 10. Lấy Thành Tích Của Một Thành Viên

**Endpoint:** `GET http://localhost:3000/thanhtich/TV04`

**Expected Response:** `200 OK`
```json
{
  "message": "Lấy thành tích thành công",
  "MaTV": "TV04",
  "total": 1,
  "result": [
    {
      "MaLTT": "LTT01",
      "ThanhTich": "Huân chương Lao động",
      "NgayPhatSinh": "2020-05-15T00:00:00.000Z"
    }
  ]
}
```

---

### 11. Xóa Thành Tích

**Endpoint:** `DELETE http://localhost:3000/thanhtich/TV04/LTT01/2020-05-15`

**Expected Response:** `200 OK`
```json
{
  "message": "Xóa thành tích thành công",
  "affectedRows": 1
}
```

---

## 📊 Test Database

### Query Kiểm Tra Dữ Liệu

Kết nối vào MySQL:
```bash
docker exec -it <container_name> mysql -u root -p123456 app
```

**1. Xem tất cả thành tích:**
```sql
SELECT * FROM GHINHANTHANHTICH ORDER BY NgayPhatSinh DESC;
```

**2. Xem thành tích với thông tin chi tiết:**
```sql
SELECT 
  g.MaTV,
  tv.HoTen,
  ltt.TenLTT AS ThanhTich,
  g.NgayPhatSinh
FROM GHINHANTHANHTICH g
INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV
INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
ORDER BY g.NgayPhatSinh DESC;
```

**3. Đếm số thành tích theo thành viên:**
```sql
SELECT 
  tv.MaTV,
  tv.HoTen,
  COUNT(*) AS SoThanhTich
FROM THANHVIEN tv
LEFT JOIN GHINHANTHANHTICH g ON tv.MaTV = g.MaTV
GROUP BY tv.MaTV, tv.HoTen
HAVING SoThanhTich > 0
ORDER BY SoThanhTich DESC;
```

**4. Xem thành tích theo loại:**
```sql
SELECT 
  ltt.TenLTT,
  COUNT(*) AS SoLuong
FROM GHINHANTHANHTICH g
INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
GROUP BY ltt.MaLTT, ltt.TenLTT
ORDER BY SoLuong DESC;
```

**5. Insert dữ liệu test:**
```sql
-- Ghi nhận thành tích cho TV02
INSERT INTO GHINHANTHANHTICH (MaLTT, MaTV, NgayPhatSinh) 
VALUES ('LTT01', 'TV02', '2015-06-20 10:00:00');

-- Ghi nhận thành tích cho TV04
INSERT INTO GHINHANTHANHTICH (MaLTT, MaTV, NgayPhatSinh) 
VALUES ('LTT02', 'TV04', '2020-05-15 14:30:00');

-- Ghi nhận thành tích cho TV06
INSERT INTO GHINHANTHANHTICH (MaLTT, MaTV, NgayPhatSinh) 
VALUES ('LTT05', 'TV06', '2023-12-10 09:00:00');
```

**6. Xóa dữ liệu test:**
```sql
DELETE FROM GHINHANTHANHTICH WHERE MaTV = 'TV04' AND MaLTT = 'LTT01';
```

---

## 🎨 UI/Frontend Gợi Ý

### Form Ghi Nhận Thành Tích

```
┌─────────────────────────────────────────┐
│  GHI NHẬN THÀNH TÍCH                    │
├─────────────────────────────────────────┤
│                                         │
│  Thành viên: [Dropdown - Chọn TV]      │
│              Tìm kiếm: [___________]    │
│                                         │
│  Loại thành tích: [Dropdown]           │
│  ☐ LTT01 - Huân chương Lao động        │
│  ☐ LTT02 - Bằng khen Thủ tướng         │
│  ☐ LTT03 - Chiến sĩ thi đua            │
│  ...                                    │
│                                         │
│  Ngày phát sinh: [Date Picker]         │
│  (Mặc định: Hôm nay)                   │
│                                         │
│           [Hủy]      [Ghi nhận]        │
└─────────────────────────────────────────┘
```

---

### Bảng Tra Cứu Thành Tích

```
┌───────────────────────────────────────────────────────────────┐
│  TRA CỨU THÀNH TÍCH                                           │
├───────────────────────────────────────────────────────────────┤
│  Tìm kiếm:                                                    │
│  Họ tên: [___________]  Loại TT: [___▼___]  [Tìm kiếm]      │
│  Từ ngày: [DD/MM/YYYY]  Đến ngày: [DD/MM/YYYY]              │
├───────────────────────────────────────────────────────────────┤
│  STT │ Họ tên           │ Thành tích         │ Ngày phát sinh │
├──────┼──────────────────┼────────────────────┼────────────────┤
│   1  │ Nguyễn Văn Nam   │ Học bổng giỏi      │ 18/12/2024     │
│   2  │ Nguyễn Văn Hùng  │ Huân chương Lao...│ 15/05/2020     │
│   3  │ Nguyễn Văn Long  │ Bằng khen Thủ...  │ 20/06/2015     │
├──────┴──────────────────┴────────────────────┴────────────────┤
│  Tổng: 3 thành tích                        [1] [2] [>]        │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔄 Workflow Hoàn Chỉnh

### 1. Ghi Nhận Thành Tích
```
User Input (Form)
    ↓
Frontend gọi POST /thanhtich/ghinhan
    ↓
Controller nhận request
    ↓
Validate dữ liệu (MaTV, MaLTT required)
    ↓
Service thực hiện INSERT
    ↓
Trigger kiểm tra ngày phát sinh
    ↓ (Hợp lệ)
Insert thành công
    ↓
Response 201 Created
    ↓
Frontend hiển thị thông báo thành công
```

### 2. Tra Cứu Thành Tích
```
User Input (Filters)
    ↓
Frontend gọi GET /thanhtich/tracuu?params
    ↓
Controller nhận request
    ↓
Parse query parameters
    ↓
Service thực hiện SELECT với JOIN
    ↓
Trả về danh sách với STT tự động
    ↓
Response 200 OK
    ↓
Frontend hiển thị trong bảng với phân trang
```

---

## 📝 Validation Rules

### Ghi Nhận Thành Tích
- Sửa MaTV: Required, phải tồn tại trong bảng THANHVIEN
- Sửa MaLTT: Required, phải tồn tại trong bảng LOAITHANHTICH
- Sửa NgayPhatSinh: Optional, mặc định ngày hiện tại
- Sửa NgayPhatSinh phải sau ngày sinh của thành viên (trigger kiểm tra)
- Sửa Không duplicate (MaTV, MaLTT, NgayPhatSinh) - Primary Key

---

## ⚠️ Lưu Ý Quan Trọng

1. **Primary Key Composite:** Bảng GHINHANTHANHTICH dùng composite key (MaLTT, MaTV, NgayPhatSinh), nghĩa là một thành viên có thể nhận cùng một loại thành tích nhiều lần, nhưng phải ở các ngày khác nhau.

2. **Trigger Validation:** Trigger `TRG_CHECK_NGAY_THANHTICH` tự động kiểm tra ngày phát sinh phải sau ngày sinh. Frontend nên validate trước khi gửi để UX tốt hơn.

3. **Timestamp Format:** NgayPhatSinh dùng TIMESTAMP, nên khi gửi từ frontend phải format đúng: `'YYYY-MM-DD'` hoặc `'YYYY-MM-DD HH:MM:SS'`.

4. **ROW_NUMBER():** Query tra cứu dùng `ROW_NUMBER()` để tạo STT tự động. Chỉ work với MySQL 8.0+.

5. **Soft Delete:** Hiện tại dùng hard delete. Nếu muốn soft delete, thêm cột `IsDeleted` vào bảng.

---

## 🚀 Các Bước Triển Khai

### Bước 1: Tạo Models
1. Sửa Tạo file `LoaiThanhTich.schema.ts`
2. Sửa Tạo file `GhiNhanThanhTich.schema.ts`

### Bước 2: Tạo Service
1. Sửa Tạo file `thanhtich.services.ts`
2. Sửa Implement các methods: getAllLoaiThanhTich, ghiNhanThanhTich, traCuuThanhTich, getThanhTichByMaTV, xoaThanhTich

### Bước 3: Tạo Controller
1. Sửa Tạo file `thanhtich.controllers.ts`
2. Sửa Implement các controllers: getLoaiThanhTichController, ghiNhanThanhTichController, traCuuThanhTichController, getThanhTichByMaTVController, xoaThanhTichController

### Bước 4: Tạo Routes
1. Sửa Tạo file `thanhtich.routes.ts`
2. Sửa Định nghĩa các routes

### Bước 5: Cập Nhật index.ts
1. Sửa Import `thanhTichRouter`
2. Sửa Thêm `app.use('/thanhtich', thanhTichRouter)`

### Bước 6: Test
1. 🧪 Restart server: `npm run dev`
2. 🧪 Test từng API endpoint bằng Postman
3. 🧪 Verify dữ liệu trong database
4. 🧪 Test trigger validation

### Bước 7: Frontend Integration
1. 📱 Tạo form ghi nhận thành tích
2. 📱 Tạo trang tra cứu thành tích với filter
3. 📱 Tạo modal xem chi tiết thành tích của thành viên
4. 📱 Thêm chức năng xóa thành tích

---

## 📚 API Endpoints Summary

| Method | Endpoint | Description | Body/Query |
|--------|----------|-------------|------------|
| GET | `/thanhtich/loai` | Lấy danh sách loại thành tích | - |
| POST | `/thanhtich/ghinhan` | Ghi nhận thành tích mới | `{ MaTV, MaLTT, NgayPhatSinh? }` |
| GET | `/thanhtich/tracuu` | Tra cứu thành tích | `?MaTV&HoTen&MaLTT&TuNgay&DenNgay` |
| GET | `/thanhtich/:MaTV` | Lấy thành tích của thành viên | - |
| DELETE | `/thanhtich/:MaTV/:MaLTT/:NgayPhatSinh` | Xóa thành tích | - |

---

## 🎯 Features Mở Rộng (Optional)

### 1. Thống Kê Thành Tích
- API thống kê số lượng thành tích theo loại
- API thống kê thành viên có nhiều thành tích nhất
- API thống kê thành tích theo năm

### 2. Export Báo Cáo
- Export danh sách thành tích ra Excel
- Export báo cáo PDF

### 3. Thông Báo
- Gửi email khi ghi nhận thành tích mới
- Push notification

### 4. Upload File
- Upload hình ảnh giấy khen
- Upload file PDF giấy chứng nhận

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** 18/12/2025  
**Mục đích:** Hướng dẫn thêm chức năng Ghi Nhận & Tra Cứu Thành Tích
