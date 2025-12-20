# Hướng Dẫn Cập Nhật Chức Năng Thành Tích (Version 2)

## 📋 Tổng Quan Thay Đổi

Cập nhật chức năng thành tích để ưu tiên tra cứu theo **TÊN** thay vì **MÃ**:

### Các Thay Đổi Chính:
1. ✅ **Bỏ tra cứu theo MaTV** - chỉ giữ tra cứu theo họ tên thành viên
2. ✅ **Tra cứu theo tên loại thành tích** - tìm kiếm linh hoạt với LIKE (VD: "huân" → tìm tất cả loại có chứa "huân")
3. ✅ **Lấy thành tích của thành viên bằng tên** - thay vì dùng MaTV
4. ✅ **Đơn giản hóa endpoint xóa** - dùng DELETE với request body thay vì URL params phức tạp

---

## 🔧 Chi Tiết Sửa Đổi

### 1. Service: `thanhtich.services.ts` (CẬP NHẬT)

**File:** `backend/src/services/thanhtich.services.ts`

#### ❌ Code CŨ - Xóa hoặc Sửa

**Phần 1: Interface ThanhTichDetailRow**
```typescript
interface ThanhTichDetailRow extends RowDataPacket {
  STT: number;
  MaTV: string;
  HoTen: string;
  MaLTT: string;
  TenLTT: string;
  NgayPhatSinh: Date;
}
```

**Phần 2: Hàm traCuuThanhTich**
```typescript
// ❌ CODE CŨ - CẦN SỬA
async traCuuThanhTich(filters?: {
  MaTV?: string;  // ❌ XÓA - không cần nữa
  HoTen?: string;
  MaLTT?: string;  // ❌ ĐỔI - search theo tên thay vì mã
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

  if (filters) {
    if (filters.MaTV) {  // ❌ XÓA PHẦN NÀY
      sql += ' AND g.MaTV = ?';
      params.push(filters.MaTV);
    }
    if (filters.HoTen) {
      sql += ' AND tv.HoTen LIKE ?';
      params.push(`%${filters.HoTen}%`);
    }
    if (filters.MaLTT) {  // ❌ ĐỔI PHẦN NÀY
      sql += ' AND g.MaLTT = ?';
      params.push(filters.MaLTT);
    }
    // ... rest
  }

  sql += ' ORDER BY g.NgayPhatSinh DESC';
  const rows = await databaseService.query<ThanhTichDetailRow[]>(sql, params);
  return rows;
}
```

**Phần 3: Hàm getThanhTichByMaTV**
```typescript
// ❌ CODE CŨ - CẦN XÓA HOÀN TOÀN
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
```

**Phần 4: Hàm xoaThanhTich**
```typescript
// ❌ CODE CŨ - CẦN SỬA
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
```

---

#### ✅ CODE MỚI - Thay Thế Hoàn Toàn

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
  TenLTT: string;
  NgayPhatSinh: Date;
}

interface ThanhTichByNameRow extends RowDataPacket {
  MaTV: string;
  HoTen: string;
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
   * ✅ MỚI: Tra cứu thành tích với tìm kiếm linh hoạt theo TÊN
   * - HoTen: Tìm theo tên thành viên (LIKE)
   * - TenLoaiThanhTich: Tìm theo tên loại thành tích (LIKE) - VD: "huân" sẽ tìm tất cả loại có chứa "huân"
   * - TuNgay, DenNgay: Lọc theo khoảng thời gian
   */
  async traCuuThanhTich(filters?: {
    HoTen?: string;
    TenLoaiThanhTich?: string;  // ✅ MỚI: Search theo TÊN loại thành tích
    TuNgay?: Date;
    DenNgay?: Date;
  }) {
    let sql = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY g.NgayPhatSinh DESC) AS STT,
        g.MaTV,
        tv.HoTen,
        ltt.TenLTT AS ThanhTich,
        g.NgayPhatSinh
      FROM GHINHANTHANHTICH g
      INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV
      INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
      WHERE 1=1
    `;

    const params: any[] = [];

    // Thêm điều kiện filter
    if (filters) {
      // ✅ Tìm theo tên thành viên
      if (filters.HoTen) {
        sql += ' AND tv.HoTen LIKE ?';
        params.push(`%${filters.HoTen}%`);
      }

      // ✅ MỚI: Tìm theo TÊN loại thành tích (LIKE search)
      // VD: "huân" → tìm tất cả loại có chứa "huân"
      if (filters.TenLoaiThanhTich) {
        sql += ' AND ltt.TenLTT LIKE ?';
        params.push(`%${filters.TenLoaiThanhTich}%`);
      }

      // ✅ Lọc theo khoảng thời gian
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
   * ✅ MỚI: Lấy thành tích của thành viên theo HỌ TÊN
   * Thay thế getThanhTichByMaTV
   */
  async getThanhTichByHoTen(HoTen: string) {
    const sql = `
      SELECT 
        g.MaTV,
        tv.HoTen,
        ltt.TenLTT AS ThanhTich,
        g.NgayPhatSinh
      FROM GHINHANTHANHTICH g
      INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV
      INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
      WHERE tv.HoTen LIKE ?
      ORDER BY g.NgayPhatSinh DESC
    `;

    const rows = await databaseService.query<ThanhTichByNameRow[]>(sql, [`%${HoTen}%`]);
    return rows;
  }

  /**
   * ✅ MỚI: Xóa thành tích - Đơn giản hóa với object payload
   * Thay vì dùng 3 params riêng lẻ
   */
  async xoaThanhTich(payload: {
    MaTV: string;
    MaLTT: string;
    NgayPhatSinh: Date;
  }) {
    const sql = `
      DELETE FROM GHINHANTHANHTICH 
      WHERE MaTV = ? AND MaLTT = ? AND DATE(NgayPhatSinh) = DATE(?)
    `;

    const result = await databaseService.query<ResultSetHeader>(sql, [
      payload.MaTV, 
      payload.MaLTT, 
      payload.NgayPhatSinh
    ]);

    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy thành tích để xóa');
    }

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
      WHERE MaTV = ? AND MaLTT = ? AND DATE(NgayPhatSinh) = DATE(?)
    `;
    
    const [result] = await databaseService.query<RowDataPacket[]>(sql, [MaTV, MaLTT, NgayPhatSinh]);
    return result.count > 0;
  }
}

const thanhTichService = new ThanhTichService();
export default thanhTichService;
```

---

### 2. Controller: `thanhtich.controllers.ts` (CẬP NHẬT)

**File:** `backend/src/controllers/thanhtich.controllers.ts`

#### ✅ CODE MỚI - Thay Thế Hoàn Toàn

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
 * ✅ MỚI: Controller tra cứu thành tích với tìm kiếm linh hoạt
 * GET /thanhtich/tracuu
 * Query params: 
 * - HoTen?: Tên thành viên (LIKE search)
 * - TenLoaiThanhTich?: Tên loại thành tích (LIKE search) - VD: "huân" → tìm tất cả loại có "huân"
 * - TuNgay?: Từ ngày (YYYY-MM-DD)
 * - DenNgay?: Đến ngày (YYYY-MM-DD)
 */
export const traCuuThanhTichController = async (req: Request, res: Response) => {
  try {
    const { HoTen, TenLoaiThanhTich, TuNgay, DenNgay } = req.query;

    const filters: any = {};
    if (HoTen) filters.HoTen = HoTen as string;
    if (TenLoaiThanhTich) filters.TenLoaiThanhTich = TenLoaiThanhTich as string;
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
 * ✅ MỚI: Controller lấy thành tích theo HỌ TÊN
 * GET /thanhtich/thanhvien?HoTen=Nguyễn Văn
 * Query param: HoTen (LIKE search)
 */
export const getThanhTichByHoTenController = async (req: Request, res: Response) => {
  const { HoTen } = req.query;

  try {
    if (!HoTen) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: HoTen'
      });
    }

    const result = await thanhTichService.getThanhTichByHoTen(HoTen as string);

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

/**
 * ✅ MỚI: Controller xóa thành tích - Đơn giản hóa với DELETE + body
 * DELETE /thanhtich/xoa
 * Body: { MaTV, MaLTT, NgayPhatSinh }
 */
export const xoaThanhTichController = async (req: Request, res: Response) => {
  const { MaTV, MaLTT, NgayPhatSinh } = req.body;

  try {
    if (!MaTV || !MaLTT || !NgayPhatSinh) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV, MaLTT, NgayPhatSinh'
      });
    }

    const result = await thanhTichService.xoaThanhTich({
      MaTV, 
      MaLTT, 
      NgayPhatSinh: new Date(NgayPhatSinh)
    });

    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    console.error('Lỗi xoaThanhTich:', error);
    
    if (error.message.includes('Không tìm thấy')) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: error.message
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Xóa thành tích thất bại',
      error: error.message
    });
  }
};
```

---

### 3. Routes: `thanhtich.routes.ts` (CẬP NHẬT)

**File:** `backend/src/routes/thanhtich.routes.ts`

#### ✅ CODE MỚI - Thay Thế Hoàn Toàn

```typescript
// src/routes/thanhtich.routes.ts
import { Router } from 'express';
import {
  getLoaiThanhTichController,
  ghiNhanThanhTichController,
  traCuuThanhTichController,
  getThanhTichByHoTenController,
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
 * ✅ MỚI: GET /thanhtich/tracuu - Tra cứu thành tích linh hoạt
 * Query params:
 * - HoTen?: Tên thành viên (LIKE search) - VD: "Nguyễn Văn"
 * - TenLoaiThanhTich?: Tên loại thành tích (LIKE search) - VD: "huân" → tìm tất cả loại có "huân"
 * - TuNgay?: Từ ngày (YYYY-MM-DD)
 * - DenNgay?: Đến ngày (YYYY-MM-DD)
 * 
 * Response: { message, total, result: [{ STT, HoTen, ThanhTich, NgayPhatSinh }] }
 */
thanhTichRouter.get('/tracuu', traCuuThanhTichController);

/**
 * ✅ MỚI: GET /thanhtich/thanhvien - Lấy thành tích của thành viên theo TÊN
 * Query param: HoTen (LIKE search)
 * VD: /thanhtich/thanhvien?HoTen=Nguyễn Văn
 * 
 * Response: { message, HoTen, total, result: [{ HoTen, ThanhTich, NgayPhatSinh }] }
 */
thanhTichRouter.get('/thanhvien', getThanhTichByHoTenController);

/**
 * ✅ MỚI: DELETE /thanhtich/xoa - Xóa thành tích (Đơn giản hóa)
 * Body: { MaTV, MaLTT, NgayPhatSinh }
 * Response: { message, affectedRows }
 * 
 * Lưu ý: MaTV và MaLTT là mã nội bộ, frontend cần lưu trữ để gửi khi xóa
 */
thanhTichRouter.delete('/xoa', xoaThanhTichController);

export default thanhTichRouter;
```

---

## 🧪 Test API Mới

### 1. Tra Cứu Tất Cả Thành Tích

**Endpoint:** `GET http://localhost:3000/thanhtich/tracuu`

**Expected Response:** `200 OK`
```json
{
  "message": "Tra cứu thành tích thành công",
  "total": 3,
  "result": [
    {
      "STT": 1,
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "ThanhTich": "Học bổng giỏi",
      "NgayPhatSinh": "2024-12-18T10:30:00.000Z"
    },
    {
      "STT": 2,
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "ThanhTich": "Huân chương Lao động",
      "NgayPhatSinh": "2020-05-15T00:00:00.000Z"
    },
    {
      "STT": 3,
      "MaTV": "TV02",
      "HoTen": "Nguyễn Văn Long",
      "ThanhTich": "Bằng khen Thủ tướng",
      "NgayPhatSinh": "2015-06-20T00:00:00.000Z"
    }
  ]
}
```

---

### 2. ✅ Tra Cứu Theo Họ Tên

**Endpoint:** `GET http://localhost:3000/thanhtich/tracuu?HoTen=Nguyễn Văn`

**Expected Response:** `200 OK`
```json
{
  "message": "Tra cứu thành tích thành công",
  "total": 3,
  "result": [
    {
      "STT": 1,
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "ThanhTich": "Học bổng giỏi",
      "NgayPhatSinh": "2024-12-18T10:30:00.000Z"
    },
    {
      "STT": 2,
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "ThanhTich": "Huân chương Lao động",
      "NgayPhatSinh": "2020-05-15T00:00:00.000Z"
    },
    {
      "STT": 3,
      "MaTV": "TV02",
      "HoTen": "Nguyễn Văn Long",
      "ThanhTich": "Bằng khen Thủ tướng",
      "NgayPhatSinh": "2015-06-20T00:00:00.000Z"
    }
  ]
}
```

---

### 3. ✅ Tra Cứu Theo TÊN Loại Thành Tích (LIKE Search)

**Ví dụ 1: Tìm "huân" - sẽ tìm tất cả loại thành tích có chứa từ "huân"**

**Endpoint:** `GET http://localhost:3000/thanhtich/tracuu?TenLoaiThanhTich=huân`

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
      "ThanhTich": "Huân chương Lao động",
      "NgayPhatSinh": "2020-05-15T00:00:00.000Z"
    }
  ]
}
```

**Ví dụ 2: Tìm "khen" - sẽ tìm tất cả loại thành tích có chứa từ "khen"**

**Endpoint:** `GET http://localhost:3000/thanhtich/tracuu?TenLoaiThanhTich=khen`

**Expected Response:** `200 OK`
```json
{
  "message": "Tra cứu thành tích thành công",
  "total": 2,
  "result": [
    {
      "STT": 1,
      "MaTV": "TV02",
      "HoTen": "Nguyễn Văn Long",
      "ThanhTich": "Bằng khen Thủ tướng",
      "NgayPhatSinh": "2015-06-20T00:00:00.000Z"
    },
    {
      "STT": 2,
      "MaTV": "TV07",
      "HoTen": "Nguyễn Thị Ngọc Anh",
      "ThanhTich": "Giấy khen cấp tỉnh",
      "NgayPhatSinh": "2023-08-10T00:00:00.000Z"
    }
  ]
}
```

**Ví dụ 3: Tìm "học" - sẽ tìm "Học bổng giỏi"**

**Endpoint:** `GET http://localhost:3000/thanhtich/tracuu?TenLoaiThanhTich=học`

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
      "ThanhTich": "Học bổng giỏi",
      "NgayPhatSinh": "2024-12-18T10:30:00.000Z"
    }
  ]
}
```

---

### 4. ✅ Kết Hợp: Tìm Theo Tên + Loại Thành Tích

**Endpoint:** `GET http://localhost:3000/thanhtich/tracuu?HoTen=Nguyễn&TenLoaiThanhTich=huân`

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
      "ThanhTich": "Huân chương Lao động",
      "NgayPhatSinh": "2020-05-15T00:00:00.000Z"
    }
  ]
}
```

---

### 5. ✅ Tra Cứu Theo Khoảng Thời Gian

**Endpoint:** `GET http://localhost:3000/thanhtich/tracuu?TuNgay=2020-01-01&DenNgay=2024-12-31`

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
      "ThanhTich": "Học bổng giỏi",
      "NgayPhatSinh": "2024-12-18T10:30:00.000Z"
    },
    {
      "STT": 2,
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "ThanhTich": "Huân chương Lao động",
      "NgayPhatSinh": "2020-05-15T00:00:00.000Z"
    }
  ]
}
```

---

### 6. ✅ Lấy Thành Tích Của Thành Viên Theo TÊN

**Endpoint:** `GET http://localhost:3000/thanhtich/thanhvien?HoTen=Nguyễn Văn Hùng`

**Expected Response:** `200 OK`
```json
{
  "message": "Lấy thành tích thành công",
  "HoTen": "Nguyễn Văn Hùng",
  "total": 2,
  "result": [
    {
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "ThanhTich": "Huân chương Lao động",
      "NgayPhatSinh": "2020-05-15T00:00:00.000Z"
    },
    {
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "ThanhTich": "Chiến sĩ thi đua",
      "NgayPhatSinh": "2018-03-10T00:00:00.000Z"
    }
  ]
}
```

**Tìm kiếm linh hoạt:** `GET http://localhost:3000/thanhtich/thanhvien?HoTen=Hùng`

```json
{
  "message": "Lấy thành tích thành công",
  "HoTen": "Hùng",
  "total": 2,
  "result": [
    {
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "ThanhTich": "Huân chương Lao động",
      "NgayPhatSinh": "2020-05-15T00:00:00.000Z"
    },
    {
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "ThanhTich": "Chiến sĩ thi đua",
      "NgayPhatSinh": "2018-03-10T00:00:00.000Z"
    }
  ]
}
```

---

### 7. ✅ Xóa Thành Tích - Đơn Giản Hóa

**Endpoint:** `DELETE http://localhost:3000/thanhtich/xoa`

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

**Expected Response:** `200 OK`
```json
{
  "message": "Xóa thành tích thành công",
  "affectedRows": 1
}
```

**Trường hợp không tìm thấy:** `404 Not Found`
```json
{
  "message": "Không tìm thấy thành tích để xóa"
}
```

**Trường hợp thiếu thông tin:** `400 Bad Request`
```json
{
  "message": "Thiếu thông tin bắt buộc: MaTV, MaLTT, NgayPhatSinh"
}
```

---

## 📊 So Sánh Trước & Sau

| Feature | Version 1 (CŨ) | Version 2 (MỚI) |
|---------|----------------|-----------------|
| **Tra cứu theo mã TV** | ✅ `?MaTV=TV04` | ❌ Đã bỏ |
| **Tra cứu theo tên TV** | ✅ `?HoTen=Nguyễn Văn` | ✅ `?HoTen=Nguyễn Văn` |
| **Tra cứu theo mã loại TT** | ✅ `?MaLTT=LTT01` | ❌ Đã bỏ |
| **Tra cứu theo tên loại TT** | ❌ Không có | ✅ `?TenLoaiThanhTich=huân` (LIKE) |
| **Lấy TT theo mã TV** | ✅ `GET /thanhtich/:MaTV` | ❌ Đã bỏ |
| **Lấy TT theo tên TV** | ❌ Không có | ✅ `GET /thanhtich/thanhvien?HoTen=xxx` |
| **Xóa thành tích** | ❌ `DELETE /:MaTV/:MaLTT/:date` | ✅ `DELETE /xoa` + body |

---

## 🎨 UI Gợi Ý (Cập Nhật)

### Form Tra Cứu Thành Tích (Cập Nhật)

```
┌───────────────────────────────────────────────────────────────┐
│  TRA CỨU THÀNH TÍCH                                           │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Họ tên thành viên: [___________________]                    │
│  (Nhập một phần tên, VD: "Nguyễn Văn")                       │
│                                                               │
│  Loại thành tích: [___________________]                      │
│  (Nhập một phần tên, VD: "huân", "khen", "học")             │
│                                                               │
│  Từ ngày: [DD/MM/YYYY]  Đến ngày: [DD/MM/YYYY]              │
│                                                               │
│                              [Tìm kiếm]  [Xóa bộ lọc]        │
├───────────────────────────────────────────────────────────────┤
│  Kết quả tìm thấy: 3                                         │
├───────────────────────────────────────────────────────────────┤
│  STT │ Họ tên           │ Thành tích         │ Ngày đạt      │
├──────┼──────────────────┼────────────────────┼───────────────┤
│   1  │ Nguyễn Văn Nam   │ Học bổng giỏi      │ 18/12/2024    │
│   2  │ Nguyễn Văn Hùng  │ Huân chương Lao...│ 15/05/2020    │
│   3  │ Nguyễn Văn Long  │ Bằng khen Thủ...  │ 20/06/2015    │
└──────┴──────────────────┴────────────────────┴───────────────┘
```

**Ví dụ tìm kiếm:**
- Nhập "Nguyễn" → Tìm tất cả họ Nguyễn
- Nhập "huân" → Tìm tất cả loại thành tích có chứa "huân"
- Nhập "Nguyễn" + "huân" → Tìm họ Nguyễn có thành tích chứa "huân"

---

### Form Xem Thành Tích Của Thành Viên

```
┌───────────────────────────────────────────────────────────────┐
│  THÀNH TÍCH CỦA THÀNH VIÊN                                    │
├───────────────────────────────────────────────────────────────┤
│  Nhập tên thành viên: [___________________]  [Tìm kiếm]      │
│  (VD: "Nguyễn Văn Hùng" hoặc chỉ "Hùng")                     │
├───────────────────────────────────────────────────────────────┤
│  Thành viên: Nguyễn Văn Hùng                                 │
│  Tổng số thành tích: 2                                       │
├───────────────────────────────────────────────────────────────┤
│  • Huân chương Lao động - 15/05/2020         [Xóa]           │
│  • Chiến sĩ thi đua - 10/03/2018             [Xóa]           │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔄 Workflow Hoàn Chỉnh (Cập Nhật)

### 1. Tra Cứu Thành Tích Linh Hoạt

```
User nhập vào form:
  - Họ tên: "Nguyễn"
  - Loại TT: "huân"
    ↓
Frontend gọi:
  GET /thanhtich/tracuu?HoTen=Nguyễn&TenLoaiThanhTich=huân
    ↓
Controller parse query params
    ↓
Service thực hiện:
  SELECT ... WHERE HoTen LIKE '%Nguyễn%' 
  AND TenLTT LIKE '%huân%'
    ↓
Trả về danh sách phù hợp:
  - Nguyễn Văn Hùng - Huân chương Lao động
    ↓
Frontend hiển thị bảng kết quả
```

---

### 2. Xem Thành Tích Của Thành Viên

```
User nhập tên: "Hùng"
    ↓
Frontend gọi:
  GET /thanhtich/thanhvien?HoTen=Hùng
    ↓
Service thực hiện:
  SELECT ... WHERE HoTen LIKE '%Hùng%'
    ↓
Trả về tất cả thành viên có tên chứa "Hùng":
  - Nguyễn Văn Hùng (2 thành tích)
  - Phạm Thị Hùng (1 thành tích)
    ↓
Frontend hiển thị danh sách thành tích
```

---

### 3. Xóa Thành Tích

```
User click nút [Xóa] trên 1 thành tích
    ↓
Frontend lấy thông tin từ row:
  - MaTV: "TV04" (lưu trong data attribute)
  - MaLTT: "LTT01" (lưu trong data attribute)
  - NgayPhatSinh: "2020-05-15"
    ↓
Hiển thị confirm dialog:
  "Bạn có chắc muốn xóa thành tích này?"
    ↓ (User confirm)
Frontend gọi:
  DELETE /thanhtich/xoa
  Body: { MaTV, MaLTT, NgayPhatSinh }
    ↓
Service thực hiện DELETE
    ↓
Response 200 OK
    ↓
Frontend xóa row khỏi bảng
    ↓
Hiển thị thông báo: "Xóa thành công"
```

---

## 📝 Lưu Ý Quan Trọng

### 1. LIKE Search Performance
- Tìm kiếm với LIKE `%keyword%` có thể chậm với database lớn
- Nên thêm INDEX cho các cột thường xuyên search:
  ```sql
  CREATE INDEX idx_hoten ON THANHVIEN(HoTen);
  CREATE INDEX idx_tenltt ON LOAITHANHTICH(TenLTT);
  ```

### 2. Frontend Cần Lưu Trữ MaTV và MaLTT
- Khi hiển thị danh sách thành tích, frontend cần lưu `MaTV` và `MaLTT` (trong data attribute hoặc state)
- Khi user click xóa, gửi các mã này lên backend
- **VD trong React:**
  ```jsx
  <tr data-matv="TV04" data-maltt="LTT01" data-ngay="2020-05-15">
    <td>Nguyễn Văn Hùng</td>
    <td>Huân chương Lao động</td>
    <td>15/05/2020</td>
    <td>
      <button onClick={() => handleDelete('TV04', 'LTT01', '2020-05-15')}>
        Xóa
      </button>
    </td>
  </tr>
  ```

### 3. Validation
- **HoTen**: Trim whitespace, min length 2 characters
- **TenLoaiThanhTich**: Trim whitespace, min length 2 characters
- **NgayPhatSinh**: Validate format YYYY-MM-DD
- **Date range**: TuNgay phải <= DenNgay

### 4. Case Sensitivity
- MySQL mặc định không phân biệt hoa thường cho LIKE
- "huân" sẽ match với "Huân chương", "HUÂN CHƯƠNG", "huân chương"

### 5. Empty Results
- Nếu không tìm thấy kết quả, trả về array rỗng với total = 0
- Frontend hiển thị message: "Không tìm thấy kết quả phù hợp"

---

## 🚀 Các Bước Triển Khai

### ✅ Bước 1: Cập Nhật Service
1. Mở file `backend/src/services/thanhtich.services.ts`
2. Thay thế toàn bộ nội dung bằng code mới ở phần 1
3. Lưu file

### ✅ Bước 2: Cập Nhật Controller
1. Mở file `backend/src/controllers/thanhtich.controllers.ts`
2. Thay thế toàn bộ nội dung bằng code mới ở phần 2
3. Lưu file

### ✅ Bước 3: Cập Nhật Routes
1. Mở file `backend/src/routes/thanhtich.routes.ts`
2. Thay thế toàn bộ nội dung bằng code mới ở phần 3
3. Lưu file

### ✅ Bước 4: Test
1. Restart server: `npm run dev`
2. Test từng endpoint bằng Postman theo hướng dẫn ở phần Test API
3. Verify kết quả trong database

### ✅ Bước 5: Cập Nhật Frontend
1. Sửa form tra cứu để dùng `TenLoaiThanhTich` thay vì `MaLTT`
2. Sửa component xem thành tích để dùng query param `HoTen`
3. Sửa function xóa để gửi DELETE request với body
4. Update UI để lưu MaTV và MaLTT trong data attributes

---

## 📚 API Endpoints Summary (Cập Nhật)

| Method | Endpoint | Description | Params/Body |
|--------|----------|-------------|-------------|
| GET | `/thanhtich/loai` | Lấy danh sách loại thành tích | - |
| POST | `/thanhtich/ghinhan` | Ghi nhận thành tích mới | Body: `{ MaTV, MaLTT, NgayPhatSinh? }` |
| GET | `/thanhtich/tracuu` | Tra cứu thành tích | Query: `?HoTen&TenLoaiThanhTich&TuNgay&DenNgay` |
| GET | `/thanhtich/thanhvien` | Lấy TT của TV theo tên | Query: `?HoTen=xxx` |
| DELETE | `/thanhtich/xoa` | Xóa thành tích | Body: `{ MaTV, MaLTT, NgayPhatSinh }` |

---

## 🎯 Ví Dụ Use Case

### Use Case 1: Tìm tất cả thành viên họ Nguyễn có huân chương
```
GET /thanhtich/tracuu?HoTen=Nguyễn&TenLoaiThanhTich=huân
```

### Use Case 2: Tìm tất cả loại khen thưởng trong năm 2023
```
GET /thanhtich/tracuu?TenLoaiThanhTich=khen&TuNgay=2023-01-01&DenNgay=2023-12-31
```

### Use Case 3: Xem tất cả thành tích của ông "Long"
```
GET /thanhtich/thanhvien?HoTen=Long
```

### Use Case 4: Tìm học bổng trong 3 năm gần nhất
```
GET /thanhtich/tracuu?TenLoaiThanhTich=học&TuNgay=2021-01-01
```

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** 18/12/2025  
**Version:** 2.0 - Cập nhật theo yêu cầu ưu tiên tra cứu theo TÊN
