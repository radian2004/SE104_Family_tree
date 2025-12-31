# HƯỚNG DẪN CHỨC NĂNG GHI NHẬN VÀ TRA CỨU KẾT THÚC (THÀNH VIÊN QUA ĐỜI)

## 📋 TỔNG QUAN

Tài liệu này hướng dẫn chi tiết cách implement 2 chức năng:
1. **Ghi nhận kết thúc** - Cập nhật thông tin khi thành viên qua đời
2. **Tra cứu kết thúc** - Xem danh sách và chi tiết thành viên đã qua đời

### Phân tích cơ sở dữ liệu hiện có

Bảng `THANHVIEN` đã có đầy đủ thông tin về thành viên qua đời:

```sql
CREATE TABLE THANHVIEN (
    MaTV VARCHAR(5) PRIMARY KEY,
    HoTen VARCHAR(50),
    NgayGioSinh DATETIME,
    TrangThai VARCHAR(20) DEFAULT 'Còn Sống',
    -- ⭐ CÁC TRƯỜNG LIÊN QUAN ĐẾN KẾT THÚC ⭐
    MaNguyenNhanMat VARCHAR(5),           -- FK → NGUYENNHANMAT
    NgayGioMat DATETIME,                   -- Ngày giờ mất
    MaDiaDiem VARCHAR(5),                  -- FK → DIADIEMMAITANG
    FOREIGN KEY(MaNguyenNhanMat) REFERENCES NGUYENNHANMAT(MaNguyenNhanMat),
    FOREIGN KEY(MaDiaDiem) REFERENCES DIADIEMMAITANG(MaDiaDiem)
);
```

**Trigger tự động:**
```sql
-- Khi cập nhật MaNguyenNhanMat → TrangThai tự động chuyển sang 'Mất'
CREATE TRIGGER TRG_UPDATE_TRANGTHAI_THANHVIEN_MaNguyenNhanMat
BEFORE UPDATE ON THANHVIEN
FOR EACH ROW
BEGIN
    IF NEW.MaNguyenNhanMat IS NOT NULL AND OLD.MaNguyenNhanMat IS NULL THEN
        SET NEW.TrangThai = 'Mất';
    END IF;
END;
```

**Dữ liệu tra cứu:**
```sql
-- Bảng NGUYENNHANMAT
('NNM01', 'Tuổi già')
('NNM02', 'Bệnh hiểm nghèo')
('NNM03', 'Tai nạn giao thông')
('NNM04', 'Tai nạn lao động')
('NNM05', 'Khác')

-- Bảng DIADIEMMAITANG
('DD01', 'Nghĩa trang Văn Điển - Hà Nội')
('DD02', 'Nghĩa trang quê nhà Nghệ An')
('DD03', 'Nghĩa trang Sala - TP.HCM')
('DD04', 'Nghĩa trang Đà Nẵng')
('DD05', 'Hỏa táng Phúc An Viên')
```

---

## 🔧 PHẦN 1: SCHEMAS (TypeScript Interfaces)

### File: `src/models/schemas/KetThuc.schema.ts`

**⚠️ TẠO FILE MỚI** - File này chưa tồn tại

```typescript
export interface KetThucRow {
  MaTV: string
  HoTen: string
  NgayGioSinh: Date | null
  NgayGioMat: Date | null
  MaNguyenNhanMat: string | null
  TenNguyenNhanMat: string | null
  MaDiaDiem: string | null
  TenDiaDiem: string | null
  TrangThai: string
}

export interface TraCuuKetThucResult {
  STT: number
  MaTV: string
  HoTen: string
  NgayGioMat: string | null
  TenNguyenNhanMat: string
  TenDiaDiem: string
}

export interface GhiNhanKetThucPayload {
  MaTV: string
  NgayGioMat: string // Format: 'YYYY-MM-DD HH:mm:ss'
  MaNguyenNhanMat: string
  MaDiaDiem: string
}
```

---

## 🔧 PHẦN 2: SERVICES

### File: `src/services/ketthuc.services.ts`

**⚠️ TẠO FILE MỚI** - File này chưa tồn tại

```typescript
import databaseService from './database.services'
import { KetThucRow, TraCuuKetThucResult, GhiNhanKetThucPayload } from '~/models/schemas/KetThuc.schema'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

class KetThucService {
  /**
   * 1. Ghi nhận kết thúc (thành viên qua đời)
   * Cập nhật thông tin mất vào bảng THANHVIEN
   * Trigger sẽ tự động chuyển TrangThai → 'Mất'
   */
  async ghiNhanKetThuc(payload: GhiNhanKetThucPayload) {
    const { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem } = payload
    
    const query = `
      UPDATE THANHVIEN
      SET NgayGioMat = ?,
          MaNguyenNhanMat = ?,
          MaDiaDiem = ?
      WHERE MaTV = ? AND TrangThai = 'Còn Sống'
    `
    
    const [result] = await databaseService.executeQuery<ResultSetHeader>(
      query,
      [NgayGioMat, MaNguyenNhanMat, MaDiaDiem, MaTV]
    )
    
    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy thành viên hoặc thành viên đã được ghi nhận mất trước đó')
    }
    
    return {
      message: 'Ghi nhận kết thúc thành công',
      MaTV,
      affectedRows: result.affectedRows
    }
  }

  /**
   * 2. Tra cứu danh sách thành viên đã kết thúc
   * Với STT tự động (sử dụng ROW_NUMBER)
   * Có thể lọc theo: Họ tên, Nguyên nhân, Địa điểm, Khoảng thời gian mất
   */
  async traCuuKetThuc(filters?: {
    HoTen?: string
    MaNguyenNhanMat?: string
    MaDiaDiem?: string
    TuNgay?: string
    DenNgay?: string
  }): Promise<TraCuuKetThucResult[]> {
    let whereClauses: string[] = ["tv.TrangThai = 'Mất'"]
    const params: any[] = []

    // Lọc theo họ tên (LIKE search)
    if (filters?.HoTen) {
      whereClauses.push('tv.HoTen LIKE ?')
      params.push(`%${filters.HoTen}%`)
    }

    // Lọc theo nguyên nhân mất
    if (filters?.MaNguyenNhanMat) {
      whereClauses.push('tv.MaNguyenNhanMat = ?')
      params.push(filters.MaNguyenNhanMat)
    }

    // Lọc theo địa điểm mai táng
    if (filters?.MaDiaDiem) {
      whereClauses.push('tv.MaDiaDiem = ?')
      params.push(filters.MaDiaDiem)
    }

    // Lọc theo khoảng thời gian mất
    if (filters?.TuNgay) {
      whereClauses.push('DATE(tv.NgayGioMat) >= ?')
      params.push(filters.TuNgay)
    }

    if (filters?.DenNgay) {
      whereClauses.push('DATE(tv.NgayGioMat) <= ?')
      params.push(filters.DenNgay)
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

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
    `

    const [rows] = await databaseService.executeQuery<RowDataPacket[]>(query, params)
    return rows as TraCuuKetThucResult[]
  }

  /**
   * 3. Xem chi tiết thông tin kết thúc của một thành viên
   */
  async getChiTietKetThuc(MaTV: string): Promise<KetThucRow | null> {
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
        dd.TenDiaDiem
      FROM THANHVIEN tv
      LEFT JOIN NGUYENNHANMAT nnm ON tv.MaNguyenNhanMat = nnm.MaNguyenNhanMat
      LEFT JOIN DIADIEMMAITANG dd ON tv.MaDiaDiem = dd.MaDiaDiem
      WHERE tv.MaTV = ? AND tv.TrangThai = 'Mất'
    `

    const [rows] = await databaseService.executeQuery<RowDataPacket[]>(query, [MaTV])
    
    if (rows.length === 0) {
      return null
    }

    return rows[0] as KetThucRow
  }

  /**
   * 4. Cập nhật thông tin kết thúc (nguyên nhân, địa điểm)
   * Chỉ cho phép cập nhật nếu thành viên đã có trạng thái 'Mất'
   */
  async capNhatKetThuc(MaTV: string, updates: {
    NgayGioMat?: string
    MaNguyenNhanMat?: string
    MaDiaDiem?: string
  }) {
    const setClauses: string[] = []
    const params: any[] = []

    if (updates.NgayGioMat) {
      setClauses.push('NgayGioMat = ?')
      params.push(updates.NgayGioMat)
    }

    if (updates.MaNguyenNhanMat) {
      setClauses.push('MaNguyenNhanMat = ?')
      params.push(updates.MaNguyenNhanMat)
    }

    if (updates.MaDiaDiem) {
      setClauses.push('MaDiaDiem = ?')
      params.push(updates.MaDiaDiem)
    }

    if (setClauses.length === 0) {
      throw new Error('Không có thông tin cần cập nhật')
    }

    params.push(MaTV)

    const query = `
      UPDATE THANHVIEN
      SET ${setClauses.join(', ')}
      WHERE MaTV = ? AND TrangThai = 'Mất'
    `

    const [result] = await databaseService.executeQuery<ResultSetHeader>(query, params)

    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy thành viên hoặc thành viên chưa được ghi nhận mất')
    }

    return {
      message: 'Cập nhật thông tin kết thúc thành công',
      MaTV,
      affectedRows: result.affectedRows
    }
  }

  /**
   * 5. Xóa thông tin kết thúc (đưa thành viên về trạng thái "Còn Sống")
   * CHỈ SỬ DỤNG KHI GHI NHẬN SAI
   */
  async xoaKetThuc(MaTV: string) {
    const query = `
      UPDATE THANHVIEN
      SET NgayGioMat = NULL,
          MaNguyenNhanMat = NULL,
          MaDiaDiem = NULL,
          TrangThai = 'Còn Sống'
      WHERE MaTV = ? AND TrangThai = 'Mất'
    `

    const [result] = await databaseService.executeQuery<ResultSetHeader>(query, [MaTV])

    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy thành viên hoặc thành viên chưa được ghi nhận mất')
    }

    return {
      message: 'Xóa thông tin kết thúc thành công (trở về trạng thái Còn Sống)',
      MaTV,
      affectedRows: result.affectedRows
    }
  }
}

const ketthucService = new KetThucService()
export default ketthucService
```

---

## 🔧 PHẦN 3: CONTROLLERS

### File: `src/controllers/ketthuc.controllers.ts`

**⚠️ TẠO FILE MỚI** - File này chưa tồn tại

```typescript
import { Request, Response, NextFunction } from 'express'
import ketthucService from '~/services/ketthuc.services'
import { HTTP_STATUS } from '~/constants/httpStatus'

/**
 * Controller 1: Ghi nhận kết thúc
 */
export const ghiNhanKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem } = req.body

    const result = await ketthucService.ghiNhanKetThuc({
      MaTV,
      NgayGioMat,
      MaNguyenNhanMat,
      MaDiaDiem
    })

    res.status(HTTP_STATUS.OK).json({
      message: result.message,
      data: {
        MaTV: result.MaTV
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Controller 2: Tra cứu kết thúc (với bộ lọc)
 */
export const traCuuKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { HoTen, MaNguyenNhanMat, MaDiaDiem, TuNgay, DenNgay } = req.query

    const results = await ketthucService.traCuuKetThuc({
      HoTen: HoTen as string | undefined,
      MaNguyenNhanMat: MaNguyenNhanMat as string | undefined,
      MaDiaDiem: MaDiaDiem as string | undefined,
      TuNgay: TuNgay as string | undefined,
      DenNgay: DenNgay as string | undefined
    })

    res.status(HTTP_STATUS.OK).json({
      message: 'Tra cứu kết thúc thành công',
      total: results.length,
      data: results
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Controller 3: Xem chi tiết kết thúc
 */
export const getChiTietKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { MaTV } = req.params

    const result = await ketthucService.getChiTietKetThuc(MaTV)

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Không tìm thấy thông tin kết thúc của thành viên này'
      })
    }

    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy chi tiết kết thúc thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Controller 4: Cập nhật thông tin kết thúc
 */
export const capNhatKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { MaTV } = req.params
    const { NgayGioMat, MaNguyenNhanMat, MaDiaDiem } = req.body

    const result = await ketthucService.capNhatKetThuc(MaTV, {
      NgayGioMat,
      MaNguyenNhanMat,
      MaDiaDiem
    })

    res.status(HTTP_STATUS.OK).json({
      message: result.message,
      data: {
        MaTV: result.MaTV
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Controller 5: Xóa thông tin kết thúc
 */
export const xoaKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { MaTV } = req.params

    const result = await ketthucService.xoaKetThuc(MaTV)

    res.status(HTTP_STATUS.OK).json({
      message: result.message,
      data: {
        MaTV: result.MaTV
      }
    })
  } catch (error) {
    next(error)
  }
}
```

---

## 🔧 PHẦN 4: ROUTES

### File: `src/routes/ketthuc.routes.ts`

**⚠️ TẠO FILE MỚI** - File này chưa tồn tại

```typescript
import { Router } from 'express'
import {
  ghiNhanKetThucController,
  traCuuKetThucController,
  getChiTietKetThucController,
  capNhatKetThucController,
  xoaKetThucController
} from '~/controllers/ketthuc.controllers'
import { wrapRequestHandler } from '~/utils/handlers'

const ketthucRouter = Router()

/**
 * Route 1: Ghi nhận kết thúc
 * POST /api/ketthuc/ghinhan
 * Body: { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem }
 */
ketthucRouter.post('/ghinhan', wrapRequestHandler(ghiNhanKetThucController))

/**
 * Route 2: Tra cứu kết thúc
 * GET /api/ketthuc/tracuu?HoTen=...&MaNguyenNhanMat=...&MaDiaDiem=...&TuNgay=...&DenNgay=...
 */
ketthucRouter.get('/tracuu', wrapRequestHandler(traCuuKetThucController))

/**
 * Route 3: Xem chi tiết kết thúc
 * GET /api/ketthuc/:MaTV
 */
ketthucRouter.get('/:MaTV', wrapRequestHandler(getChiTietKetThucController))

/**
 * Route 4: Cập nhật thông tin kết thúc
 * PUT /api/ketthuc/:MaTV
 * Body: { NgayGioMat?, MaNguyenNhanMat?, MaDiaDiem? }
 */
ketthucRouter.put('/:MaTV', wrapRequestHandler(capNhatKetThucController))

/**
 * Route 5: Xóa thông tin kết thúc (đưa về trạng thái Còn Sống)
 * DELETE /api/ketthuc/:MaTV
 */
ketthucRouter.delete('/:MaTV', wrapRequestHandler(xoaKetThucController))

export default ketthucRouter
```

---

## 🔧 PHẦN 5: CẬP NHẬT FILE INDEX.TS

### File: `src/index.ts`

**⚠️ SỬA FILE CŨ** - Thêm import và route mới

Tìm đoạn code import routes:
```typescript
import usersRouter from './routes/users.routes'
import thanhvienRouter from './routes/thanhvien.routes'
import lookupsRouter from './routes/lookups.routes'
import thanhtichRouter from './routes/thanhtich.routes'
```

**THÊM DÒNG SAU:**
```typescript
import ketthucRouter from './routes/ketthuc.routes'
```

Tìm đoạn code sử dụng routes:
```typescript
app.use('/users', usersRouter)
app.use('/thanhvien', thanhvienRouter)
app.use('/lookups', lookupsRouter)
app.use('/thanhtich', thanhtichRouter)
```

**THÊM DÒNG SAU:**
```typescript
app.use('/ketthuc', ketthucRouter)
```

---

## 📝 PHẦN 6: TEST API ENDPOINTS

### 1. Ghi nhận kết thúc (Thành viên TV02 qua đời)

**Request:**
```http
POST http://localhost:4000/ketthuc/ghinhan
Content-Type: application/json

{
  "MaTV": "TV02",
  "NgayGioMat": "2023-12-25 10:30:00",
  "MaNguyenNhanMat": "NNM01",
  "MaDiaDiem": "DD01"
}
```

**Response thành công:**
```json
{
  "message": "Ghi nhận kết thúc thành công",
  "data": {
    "MaTV": "TV02"
  }
}
```

**Response lỗi (đã ghi nhận trước đó):**
```json
{
  "message": "Không tìm thấy thành viên hoặc thành viên đã được ghi nhận mất trước đó"
}
```

---

### 2. Tra cứu danh sách kết thúc (Không lọc)

**Request:**
```http
GET http://localhost:4000/ketthuc/tracuu
```

**Response:**
```json
{
  "message": "Tra cứu kết thúc thành công",
  "total": 2,
  "data": [
    {
      "STT": 1,
      "MaTV": "TV02",
      "HoTen": "Nguyễn Văn Long",
      "NgayGioMat": "25/12/2023 10:30:00",
      "TenNguyenNhanMat": "Tuổi già",
      "TenDiaDiem": "Nghĩa trang Văn Điển - Hà Nội"
    },
    {
      "STT": 2,
      "MaTV": "TV01",
      "HoTen": "Nguyễn Văn Tổ",
      "NgayGioMat": "15/01/2020 10:30:00",
      "TenNguyenNhanMat": "Tuổi già",
      "TenDiaDiem": "Nghĩa trang quê nhà Nghệ An"
    }
  ]
}
```

---

### 3. Tra cứu kết thúc theo họ tên

**Request:**
```http
GET http://localhost:4000/ketthuc/tracuu?HoTen=Long
```

**Response:**
```json
{
  "message": "Tra cứu kết thúc thành công",
  "total": 1,
  "data": [
    {
      "STT": 1,
      "MaTV": "TV02",
      "HoTen": "Nguyễn Văn Long",
      "NgayGioMat": "25/12/2023 10:30:00",
      "TenNguyenNhanMat": "Tuổi già",
      "TenDiaDiem": "Nghĩa trang Văn Điển - Hà Nội"
    }
  ]
}
```

---

### 4. Tra cứu kết thúc theo nguyên nhân

**Request:**
```http
GET http://localhost:4000/ketthuc/tracuu?MaNguyenNhanMat=NNM01
```

**Response:**
```json
{
  "message": "Tra cứu kết thúc thành công",
  "total": 2,
  "data": [
    {
      "STT": 1,
      "MaTV": "TV02",
      "HoTen": "Nguyễn Văn Long",
      "NgayGioMat": "25/12/2023 10:30:00",
      "TenNguyenNhanMat": "Tuổi già",
      "TenDiaDiem": "Nghĩa trang Văn Điển - Hà Nội"
    },
    {
      "STT": 2,
      "MaTV": "TV01",
      "HoTen": "Nguyễn Văn Tổ",
      "NgayGioMat": "15/01/2020 10:30:00",
      "TenNguyenNhanMat": "Tuổi già",
      "TenDiaDiem": "Nghĩa trang quê nhà Nghệ An"
    }
  ]
}
```

---

### 5. Tra cứu kết thúc theo khoảng thời gian

**Request:**
```http
GET http://localhost:4000/ketthuc/tracuu?TuNgay=2023-01-01&DenNgay=2023-12-31
```

**Response:**
```json
{
  "message": "Tra cứu kết thúc thành công",
  "total": 1,
  "data": [
    {
      "STT": 1,
      "MaTV": "TV02",
      "HoTen": "Nguyễn Văn Long",
      "NgayGioMat": "25/12/2023 10:30:00",
      "TenNguyenNhanMat": "Tuổi già",
      "TenDiaDiem": "Nghĩa trang Văn Điển - Hà Nội"
    }
  ]
}
```

---

### 6. Xem chi tiết kết thúc

**Request:**
```http
GET http://localhost:4000/ketthuc/TV02
```

**Response:**
```json
{
  "message": "Lấy chi tiết kết thúc thành công",
  "data": {
    "MaTV": "TV02",
    "HoTen": "Nguyễn Văn Long",
    "NgayGioSinh": "1945-03-20T03:30:00.000Z",
    "NgayGioMat": "2023-12-25T03:30:00.000Z",
    "TrangThai": "Mất",
    "MaNguyenNhanMat": "NNM01",
    "TenNguyenNhanMat": "Tuổi già",
    "MaDiaDiem": "DD01",
    "TenDiaDiem": "Nghĩa trang Văn Điển - Hà Nội"
  }
}
```

---

### 7. Cập nhật thông tin kết thúc

**Request:**
```http
PUT http://localhost:4000/ketthuc/TV02
Content-Type: application/json

{
  "MaNguyenNhanMat": "NNM02",
  "MaDiaDiem": "DD05"
}
```

**Response:**
```json
{
  "message": "Cập nhật thông tin kết thúc thành công",
  "data": {
    "MaTV": "TV02"
  }
}
```

---

### 8. Xóa thông tin kết thúc (Phục hồi trạng thái)

**Request:**
```http
DELETE http://localhost:4000/ketthuc/TV02
```

**Response:**
```json
{
  "message": "Xóa thông tin kết thúc thành công (trở về trạng thái Còn Sống)",
  "data": {
    "MaTV": "TV02"
  }
}
```

---

## 📊 PHẦN 7: UI MOCKUP

### Form ghi nhận kết thúc

```
┌─────────────────────────────────────────────┐
│         GHI NHẬN KẾT THÚC                   │
├─────────────────────────────────────────────┤
│                                              │
│  Họ và tên:                                  │
│  ┌────────────────────────────────────────┐ │
│  │ [Dropdown: Chọn thành viên còn sống]  ▼│ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Ngày giờ mất:                               │
│  ┌────────────────┐  ┌──────────────────┐   │
│  │ 25/12/2023     │  │ 10:30:00         │   │
│  └────────────────┘  └──────────────────┘   │
│                                              │
│  Nguyên nhân:                                │
│  ┌────────────────────────────────────────┐ │
│  │ [Dropdown: Tuổi già]                  ▼│ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Địa điểm mai táng:                          │
│  ┌────────────────────────────────────────┐ │
│  │ [Dropdown: Nghĩa trang Văn Điển]      ▼│ │
│  └────────────────────────────────────────┘ │
│                                              │
│        [Hủy bỏ]        [Xác nhận]           │
└─────────────────────────────────────────────┘
```

### Bảng tra cứu kết thúc

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        TRA CỨU KẾT THÚC                                  │
├──────────────────────────────────────────────────────────────────────────┤
│  Họ tên: [_______]  Nguyên nhân: [All ▼]  Địa điểm: [All ▼]            │
│  Từ ngày: [__/__/____]  Đến ngày: [__/__/____]  [Tìm kiếm]             │
├────┬─────────────────────┬──────────────────┬───────────────────────────┤
│STT │ Họ và tên           │ Ngày giờ mất     │ Nguyên nhân               │
├────┼─────────────────────┼──────────────────┼───────────────────────────┤
│ 1  │ Nguyễn Văn Long     │ 25/12/2023 10:30 │ Tuổi già                  │
│ 2  │ Nguyễn Văn Tổ       │ 15/01/2020 10:30 │ Tuổi già                  │
│ 3  │ Trần Thị Hoa        │ 10/08/2019 08:15 │ Bệnh hiểm nghèo           │
├────┴─────────────────────┴──────────────────┴───────────────────────────┤
│  Địa điểm mai táng                                                       │
├──────────────────────────────────────────────────────────────────────────┤
│  Nghĩa trang Văn Điển - Hà Nội                                          │
│  Nghĩa trang quê nhà Nghệ An                                            │
│  Nghĩa trang Sala - TP.HCM                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 PHẦN 8: WORKFLOW VÀ VALIDATION

### Workflow ghi nhận kết thúc

```
1. User chọn thành viên (MaTV) từ dropdown (chỉ hiện thành viên còn sống)
   ↓
2. Nhập ngày giờ mất
   ↓
3. Chọn nguyên nhân mất từ danh sách (NGUYENNHANMAT)
   ↓
4. Chọn địa điểm mai táng từ danh sách (DIADIEMMAITANG)
   ↓
5. Submit → POST /api/ketthuc/ghinhan
   ↓
6. Backend:
   - Update THANHVIEN: NgayGioMat, MaNguyenNhanMat, MaDiaDiem
   - Trigger tự động đổi TrangThai → 'Mất'
   ↓
7. Response thành công → Hiển thị thông báo
```

### Validation rules

**Frontend validation:**
```javascript
// 1. Kiểm tra MaTV
if (!MaTV) {
  throw new Error('Vui lòng chọn thành viên')
}

// 2. Kiểm tra ngày giờ mất
if (!NgayGioMat) {
  throw new Error('Vui lòng nhập ngày giờ mất')
}

// Kiểm tra định dạng datetime
const datetimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
if (!datetimeRegex.test(NgayGioMat)) {
  throw new Error('Định dạng ngày giờ không hợp lệ (YYYY-MM-DD HH:mm:ss)')
}

// Kiểm tra ngày mất phải sau ngày sinh
const ngaySinh = fetchNgaySinhFromAPI(MaTV)
if (new Date(NgayGioMat) <= new Date(ngaySinh)) {
  throw new Error('Ngày mất phải sau ngày sinh')
}

// 3. Kiểm tra nguyên nhân
if (!MaNguyenNhanMat) {
  throw new Error('Vui lòng chọn nguyên nhân mất')
}

// 4. Kiểm tra địa điểm
if (!MaDiaDiem) {
  throw new Error('Vui lòng chọn địa điểm mai táng')
}
```

**Backend validation (trong service):**
```typescript
// Kiểm tra thành viên tồn tại và còn sống
const [checkResult] = await databaseService.executeQuery<RowDataPacket[]>(
  'SELECT TrangThai FROM THANHVIEN WHERE MaTV = ?',
  [MaTV]
)

if (checkResult.length === 0) {
  throw new Error('Thành viên không tồn tại')
}

if (checkResult[0].TrangThai !== 'Còn Sống') {
  throw new Error('Thành viên đã được ghi nhận mất trước đó')
}

// Kiểm tra nguyên nhân tồn tại
const [nnmCheck] = await databaseService.executeQuery<RowDataPacket[]>(
  'SELECT 1 FROM NGUYENNHANMAT WHERE MaNguyenNhanMat = ?',
  [MaNguyenNhanMat]
)

if (nnmCheck.length === 0) {
  throw new Error('Mã nguyên nhân mất không tồn tại')
}

// Kiểm tra địa điểm tồn tại
const [ddCheck] = await databaseService.executeQuery<RowDataPacket[]>(
  'SELECT 1 FROM DIADIEMMAITANG WHERE MaDiaDiem = ?',
  [MaDiaDiem]
)

if (ddCheck.length === 0) {
  throw new Error('Mã địa điểm mai táng không tồn tại')
}
```

---

## 📋 PHẦN 9: BẢNG SO SÁNH TRƯỚC/SAU

| Chức năng | Trước (Không có) | Sau (Có chức năng kết thúc) |
|-----------|------------------|------------------------------|
| Ghi nhận kết thúc | ❌ Không có API | Sửa POST /api/ketthuc/ghinhan |
| Tra cứu danh sách | ❌ Không có | Sửa GET /api/ketthuc/tracuu với bộ lọc |
| Xem chi tiết | ❌ Không có | Sửa GET /api/ketthuc/:MaTV |
| Cập nhật thông tin | ❌ Không có | Sửa PUT /api/ketthuc/:MaTV |
| Xóa/Phục hồi | ❌ Không có | Sửa DELETE /api/ketthuc/:MaTV |
| Tự động đổi trạng thái | Sửa Có trigger | Sửa Trigger hoạt động bình thường |
| STT tự động | ❌ Không có | Sửa ROW_NUMBER() trong query |
| Lọc theo ngày | ❌ Không có | Sửa TuNgay, DenNgay |
| Tìm kiếm họ tên | ❌ Không có | Sửa LIKE %keyword% |

---

## 🚀 PHẦN 10: HƯỚNG DẪN TRIỂN KHAI

### Bước 1: Tạo file Schema
```bash
# Tạo file mới
touch src/models/schemas/KetThuc.schema.ts

# Copy nội dung từ PHẦN 1 vào file
```

### Bước 2: Tạo file Service
```bash
# Tạo file mới
touch src/services/ketthuc.services.ts

# Copy nội dung từ PHẦN 2 vào file
```

### Bước 3: Tạo file Controller
```bash
# Tạo file mới
touch src/controllers/ketthuc.controllers.ts

# Copy nội dung từ PHẦN 3 vào file
```

### Bước 4: Tạo file Route
```bash
# Tạo file mới
touch src/routes/ketthuc.routes.ts

# Copy nội dung từ PHẦN 4 vào file
```

### Bước 5: Cập nhật index.ts
```bash
# Mở file src/index.ts
# Thêm 2 dòng code từ PHẦN 5
```

### Bước 6: Restart server
```bash
# Nếu dùng nodemon, server sẽ tự restart
# Nếu không, restart thủ công:
npm run dev
```

### Bước 7: Test API
```bash
# Sử dụng các test cases từ PHẦN 6
# Hoặc dùng Postman/Thunder Client
```

---

## 🎯 PHẦN 11: LƯU Ý QUAN TRỌNG

### 1. Về cơ sở dữ liệu
- Sửa **KHÔNG CẦN TẠO BẢNG MỚI** - Dữ liệu đã có trong bảng `THANHVIEN`
- Sửa Trigger `TRG_UPDATE_TRANGTHAI_THANHVIEN_MaNguyenNhanMat` tự động đổi trạng thái
- Sửa Các bảng lookup (NGUYENNHANMAT, DIADIEMMAITANG) đã có sẵn

### 2. Về logic nghiệp vụ
- Chỉ cho phép ghi nhận kết thúc cho thành viên có `TrangThai = 'Còn Sống'`
- Khi cập nhật `MaNguyenNhanMat`, trigger tự động đổi `TrangThai → 'Mất'`
- Xóa kết thúc = Đưa thành viên về trạng thái `'Còn Sống'` (CHỈ KHI GHI NHẬN SAI)
- Ngày mất phải sau ngày sinh (nên thêm validation)

### 3. Về performance
- Index trên cột `TrangThai` để tăng tốc query tra cứu:
```sql
CREATE INDEX idx_trangthai ON THANHVIEN(TrangThai);
```
- Index trên `NgayGioMat` để tăng tốc lọc theo khoảng thời gian:
```sql
CREATE INDEX idx_ngaygiomat ON THANHVIEN(NgayGioMat);
```

### 4. Về bảo mật
- Cần thêm middleware xác thực (accessTokenValidator)
- Cần phân quyền (chỉ Admin/TruongToc được ghi nhận kết thúc)
- Log mọi thay đổi về thông tin kết thúc

### 5. Về UI/UX
- Form ghi nhận: Dropdown chỉ hiện thành viên còn sống
- Bảng tra cứu: Highlight dòng gần đây nhất
- Confirmation dialog khi xóa/cập nhật thông tin kết thúc
- Toast notification khi thành công/thất bại

---

## 📚 PHẦN 12: TÀI LIỆU THAM KHẢO

### Các file cần sửa/tạo

| File | Loại | Nội dung |
|------|------|----------|
| `src/models/schemas/KetThuc.schema.ts` | ⭐ TẠO MỚI | Interfaces TypeScript |
| `src/services/ketthuc.services.ts` | ⭐ TẠO MỚI | 5 methods service |
| `src/controllers/ketthuc.controllers.ts` | ⭐ TẠO MỚI | 5 controllers |
| `src/routes/ketthuc.routes.ts` | ⭐ TẠO MỚI | 5 routes |
| `src/index.ts` | ✏️ SỬA | Thêm 2 dòng import + use route |

### API Endpoints summary

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/ketthuc/ghinhan` | Ghi nhận kết thúc |
| GET | `/api/ketthuc/tracuu` | Tra cứu danh sách (có bộ lọc) |
| GET | `/api/ketthuc/:MaTV` | Chi tiết kết thúc |
| PUT | `/api/ketthuc/:MaTV` | Cập nhật thông tin |
| DELETE | `/api/ketthuc/:MaTV` | Xóa/Phục hồi |

---

## Sửa CHECKLIST TRIỂN KHAI

```
□ Tạo file KetThuc.schema.ts
□ Tạo file ketthuc.services.ts
□ Tạo file ketthuc.controllers.ts
□ Tạo file ketthuc.routes.ts
□ Cập nhật index.ts (thêm import + route)
□ Restart server
□ Test API ghi nhận kết thúc
□ Test API tra cứu (không lọc)
□ Test API tra cứu (có lọc họ tên)
□ Test API tra cứu (có lọc nguyên nhân)
□ Test API tra cứu (có lọc khoảng thời gian)
□ Test API xem chi tiết
□ Test API cập nhật
□ Test API xóa (phục hồi)
□ Kiểm tra trigger tự động đổi trạng thái
□ Thêm validation ngày mất > ngày sinh
□ Thêm middleware authentication
□ Thêm phân quyền (nếu cần)
□ Tạo UI form ghi nhận kết thúc
□ Tạo UI bảng tra cứu kết thúc
□ Test integration frontend + backend
```

---

## 🎉 KẾT LUẬN

Chức năng **Ghi nhận và Tra cứu kết thúc** sử dụng dữ liệu có sẵn trong bảng `THANHVIEN`, không cần tạo bảng mới. Trigger trong database tự động xử lý việc đổi trạng thái khi có thành viên qua đời.

**Điểm mạnh:**
- Sửa Tận dụng schema hiện có
- Sửa Trigger tự động xử lý trạng thái
- Sửa STT tự động với ROW_NUMBER()
- Sửa Bộ lọc linh hoạt (họ tên, nguyên nhân, địa điểm, khoảng thời gian)
- Sửa CRUD đầy đủ (Create, Read, Update, Delete)

**Áp dụng:**
1. Copy code từ markdown vào các file tương ứng
2. Restart server
3. Test các API endpoint
4. Implement frontend UI

Chúc bạn triển khai thành công! 🚀
