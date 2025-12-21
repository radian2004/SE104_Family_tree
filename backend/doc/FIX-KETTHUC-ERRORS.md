# SỬA LỖI CHỨC NĂNG KẾT THÚC - TYPESCRIPT ERRORS

## 📋 TỔNG QUAN LỖI

Phát hiện **3 LỖI CHÍNH** trong code chức năng kết thúc:

| File | Lỗi | Số dòng bị ảnh hưởng |
|------|-----|---------------------|
| `ketthuc.routes.ts` | Import sai tên function | 1 dòng |
| `ketthuc.controllers.ts` | Import sai cú pháp | 1 dòng |
| `ketthuc.services.ts` | Gọi sai method database | 5 dòng |

---

## ❌ LỖI 1: IMPORT SAI TRONG ROUTES

### File: `src/routes/ketthuc.routes.ts`

**Dòng 9 - LỖI:**
```typescript
import { wrapRequestHandler } from '~/utils/handlers'
```

**Lỗi TypeScript:**
```
TSError: ⨯ Unable to compile TypeScript:
src/routes/ketthuc.routes.ts:9:10 - error TS2305: Module '"~/utils/handlers"' has no exported member 'wrapRequestHandler'.
```

**Nguyên nhân:**
- File `src/utils/handlers.ts` chỉ export `wrapAsync`, KHÔNG có `wrapRequestHandler`
- Các routes khác (thanhvien, thanhtich) KHÔNG dùng wrapper này, gọi controller trực tiếp

**Code hiện tại trong handlers.ts:**
```typescript
// src/utils/handlers.ts
export const wrapAsync = <P>(func: RequestHandler<P, any, any, any>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
```

**Cách sửa - OPTION 1 (Đơn giản nhất - Khuyến nghị):**
Xóa dòng import và xóa tất cả `wrapRequestHandler()` trong file

```typescript
// ❌ XÓA DÒNG NÀY
import { wrapRequestHandler } from '~/utils/handlers'

const ketthucRouter = Router()

// ✅ THAY ĐỔI TẤT CẢ CÁC ROUTE
// Từ:
ketthucRouter.post('/ghinhan', wrapRequestHandler(ghiNhanKetThucController))

// Thành:
ketthucRouter.post('/ghinhan', ghiNhanKetThucController)
```

**Cách sửa - OPTION 2 (Nếu muốn dùng wrapper):**
Thay `wrapRequestHandler` thành `wrapAsync`

```typescript
// ✅ SỬA DÒNG NÀY
import { wrapAsync } from '~/utils/handlers'

const ketthucRouter = Router()

// ✅ THAY ĐỔI TẤT CẢ CÁC ROUTE
ketthucRouter.post('/ghinhan', wrapAsync(ghiNhanKetThucController))
ketthucRouter.get('/tracuu', wrapAsync(traCuuKetThucController))
ketthucRouter.get('/:MaTV', wrapAsync(getChiTietKetThucController))
ketthucRouter.put('/:MaTV', wrapAsync(capNhatKetThucController))
ketthucRouter.delete('/:MaTV', wrapAsync(xoaKetThucController))
```

**⭐ KHUYẾN NGHỊ: Dùng OPTION 1**

Vì:
- Các controllers đã có `try-catch` và `next(error)` bên trong
- Các routes khác (thanhvien, thanhtich) không dùng wrapper
- Đơn giản hơn, ít code hơn

---

### ✅ CODE HOÀN CHỈNH SAU KHI SỬA - OPTION 1

File: `src/routes/ketthuc.routes.ts`

```typescript
import { Router } from 'express'
import {
  ghiNhanKetThucController,
  traCuuKetThucController,
  getChiTietKetThucController,
  capNhatKetThucController,
  xoaKetThucController
} from '~/controllers/ketthuc.controllers'

const ketthucRouter = Router()

/**
 * Route 1: Ghi nhận kết thúc
 * POST /api/ketthuc/ghinhan
 * Body: { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem }
 */
ketthucRouter.post('/ghinhan', ghiNhanKetThucController)

/**
 * Route 2: Tra cứu kết thúc
 * GET /api/ketthuc/tracuu?HoTen=...&MaNguyenNhanMat=...&MaDiaDiem=...&TuNgay=...&DenNgay=...
 */
ketthucRouter.get('/tracuu', traCuuKetThucController)

/**
 * Route 3: Xem chi tiết kết thúc
 * GET /api/ketthuc/:MaTV
 */
ketthucRouter.get('/:MaTV', getChiTietKetThucController)

/**
 * Route 4: Cập nhật thông tin kết thúc
 * PUT /api/ketthuc/:MaTV
 * Body: { NgayGioMat?, MaNguyenNhanMat?, MaDiaDiem? }
 */
ketthucRouter.put('/:MaTV', capNhatKetThucController)

/**
 * Route 5: Xóa thông tin kết thúc (đưa về trạng thái Còn Sống)
 * DELETE /api/ketthuc/:MaTV
 */
ketthucRouter.delete('/:MaTV', xoaKetThucController)

export default ketthucRouter
```

---

## ❌ LỖI 2: IMPORT SAI TRONG CONTROLLERS

### File: `src/controllers/ketthuc.controllers.ts`

**Dòng 3 - LỖI:**
```typescript
import { HTTP_STATUS } from '~/constants/httpStatus'
```

**Lỗi TypeScript:**
```
error TS2305: Module '"~/constants/httpStatus"' has no exported member 'HTTP_STATUS'. 
Did you mean to use 'import HTTP_STATUS from "~/constants/httpStatus"' instead?
```

**Nguyên nhân:**
- File `src/constants/httpStatus.ts` dùng `export default`, KHÔNG phải named export
- Phải dùng `import HTTP_STATUS from ...` thay vì `import { HTTP_STATUS } from ...`

**Code hiện tại trong httpStatus.ts:**
```typescript
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  // ...
} as const;

export default HTTP_STATUS; // ← Default export
```

**Cách sửa:**
```typescript
// ❌ SAI - Named import
import { HTTP_STATUS } from '~/constants/httpStatus'

// ✅ ĐÚNG - Default import
import HTTP_STATUS from '~/constants/httpStatus'
```

---

### ✅ CODE HOÀN CHỈNH SAU KHI SỬA

File: `src/controllers/ketthuc.controllers.ts`

```typescript
import { Request, Response, NextFunction } from 'express'
import ketthucService from '~/services/ketthuc.services'
import HTTP_STATUS from '~/constants/httpStatus' // ✅ SỬA DÒNG NÀY

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

## ❌ LỖI 3: GỌI SAI METHOD DATABASE SERVICE (QUAN TRỌNG NHẤT!)

### File: `src/services/ketthuc.services.ts`

**Lỗi ở 5 vị trí:**

| Dòng | Method gọi sai | Lỗi |
|------|---------------|-----|
| 22 | `executeQuery<ResultSetHeader>` | Property không tồn tại |
| 99 | `executeQuery<RowDataPacket[]>` | Property không tồn tại |
| 124 | `executeQuery<RowDataPacket[]>` | Property không tồn tại |
| 172 | `executeQuery<ResultSetHeader>` | Property không tồn tại |
| 199 | `executeQuery<ResultSetHeader>` | Property không tồn tại |

**Lỗi TypeScript:**
```
Property 'executeQuery' does not exist on type 'DatabaseService'.
```

**Nguyên nhân:**
- File `src/services/database.services.ts` chỉ có method `query()`, KHÔNG có `executeQuery()`
- Các service khác (thanhtich, thanhvien) đều dùng `databaseService.query()`, KHÔNG dùng `executeQuery()`

**Code hiện tại trong database.services.ts:**
```typescript
class DatabaseService {
  // ✅ Method đúng là query(), KHÔNG phải executeQuery()
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as T;
  }
}
```

**Code hiện tại sai trong ketthuc.services.ts:**
```typescript
// ❌ SAI - executeQuery không tồn tại
const [result] = await databaseService.executeQuery<ResultSetHeader>(query, params)

// ❌ SAI - executeQuery không tồn tại
const [rows] = await databaseService.executeQuery<RowDataPacket[]>(query, params)
```

**Cách sửa:**

Thay tất cả `executeQuery` → `query` và bỏ destructuring `[result]` / `[rows]`

```typescript
// ✅ ĐÚNG - Dùng query()
const result = await databaseService.query<ResultSetHeader>(query, params)

// ✅ ĐÚNG - Dùng query()
const rows = await databaseService.query<RowDataPacket[]>(query, params)
```

**⚠️ LƯU Ý QUAN TRỌNG:**
- `databaseService.query()` đã tự động destructure `[rows]` bên trong
- Chỉ cần gọi `query()`, KHÔNG CẦN destructure thêm lần nữa
- Các file khác (thanhtich.services.ts, thanhvien.services.ts) đều làm như vậy

---

### ✅ CODE HOÀN CHỈNH SAU KHI SỬA

File: `src/services/ketthuc.services.ts`

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
    
    // ✅ SỬA: executeQuery → query, bỏ destructuring
    const result = await databaseService.query<ResultSetHeader>(
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

    // ✅ SỬA: executeQuery → query, bỏ destructuring
    const rows = await databaseService.query<RowDataPacket[]>(query, params)
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

    // ✅ SỬA: executeQuery → query, bỏ destructuring
    const rows = await databaseService.query<RowDataPacket[]>(query, [MaTV])
    
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

    // ✅ SỬA: executeQuery → query, bỏ destructuring
    const result = await databaseService.query<ResultSetHeader>(query, params)

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

    // ✅ SỬA: executeQuery → query, bỏ destructuring
    const result = await databaseService.query<ResultSetHeader>(query, [MaTV])

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

## 📊 BẢNG TÓM TẮT CÁC SỬA ĐỔI

| File | Dòng | Sửa từ | Sửa thành |
|------|------|--------|-----------|
| **ketthuc.routes.ts** | 9 | `import { wrapRequestHandler }` | Xóa dòng này |
| **ketthuc.routes.ts** | 21 | `wrapRequestHandler(...)` | Xóa wrapper, gọi trực tiếp |
| **ketthuc.routes.ts** | 27 | `wrapRequestHandler(...)` | Xóa wrapper, gọi trực tiếp |
| **ketthuc.routes.ts** | 33 | `wrapRequestHandler(...)` | Xóa wrapper, gọi trực tiếp |
| **ketthuc.routes.ts** | 39 | `wrapRequestHandler(...)` | Xóa wrapper, gọi trực tiếp |
| **ketthuc.routes.ts** | 45 | `wrapRequestHandler(...)` | Xóa wrapper, gọi trực tiếp |
| **ketthuc.controllers.ts** | 3 | `import { HTTP_STATUS }` | `import HTTP_STATUS` |
| **ketthuc.services.ts** | 22 | `const [result] = await ...executeQuery` | `const result = await ...query` |
| **ketthuc.services.ts** | 99 | `const [rows] = await ...executeQuery` | `const rows = await ...query` |
| **ketthuc.services.ts** | 124 | `const [rows] = await ...executeQuery` | `const rows = await ...query` |
| **ketthuc.services.ts** | 172 | `const [result] = await ...executeQuery` | `const result = await ...query` |
| **ketthuc.services.ts** | 199 | `const [result] = await ...executeQuery` | `const result = await ...query` |

---

## 🔍 GIẢI THÍCH CHI TIẾT LỖI DATABASE

### Tại sao phải sửa từ `executeQuery` thành `query`?

**1. Database Service chỉ có method `query()`:**
```typescript
// src/services/database.services.ts
class DatabaseService {
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await this.pool.execute(sql, params); // ← Đã destructure ở đây
    return rows as T;
  }
}
```

**2. Method `query()` đã tự động destructure:**
- Line `const [rows] = await this.pool.execute(...)` đã lấy phần tử đầu tiên
- Kết quả trả về chỉ là `rows`, KHÔNG phải `[rows, fields]`

**3. Cách dùng đúng:**
```typescript
// ❌ SAI - Destructure 2 lần
const [result] = await databaseService.executeQuery<ResultSetHeader>(query, params)

// ✅ ĐÚNG - Không cần destructure vì query() đã làm sẵn
const result = await databaseService.query<ResultSetHeader>(query, params)
```

**4. Tham khảo code đúng từ thanhtich.services.ts:**
```typescript
// File: src/services/thanhtich.services.ts
async getAllLoaiThanhTich() {
  const sql = 'SELECT * FROM LOAITHANHTICH ORDER BY TenLTT';
  const rows = await databaseService.query<LoaiThanhTichRow[]>(sql); // ← Không destructure
  return rows;
}
```

---

## ✅ CHECKLIST SỬA LỖI

```
□ Sửa ketthuc.routes.ts:
  □ Xóa dòng import wrapRequestHandler
  □ Xóa wrapRequestHandler() ở 5 routes (chỉ gọi controller trực tiếp)
  
□ Sửa ketthuc.controllers.ts:
  □ Đổi import { HTTP_STATUS } → import HTTP_STATUS
  
□ Sửa ketthuc.services.ts:
  □ Dòng 22: executeQuery → query, bỏ [result]
  □ Dòng 99: executeQuery → query, bỏ [rows]
  □ Dòng 124: executeQuery → query, bỏ [rows]
  □ Dòng 172: executeQuery → query, bỏ [result]
  □ Dòng 199: executeQuery → query, bỏ [result]
  
□ Kiểm tra sau khi sửa:
  □ npm run dev (server khởi động không lỗi)
  □ Test API POST /ketthuc/ghinhan
  □ Test API GET /ketthuc/tracuu
  □ Test API GET /ketthuc/:MaTV
  □ Test API PUT /ketthuc/:MaTV
  □ Test API DELETE /ketthuc/:MaTV
```

---

## 🚀 HƯỚNG DẪN TRIỂN KHAI

### Bước 1: Backup file cũ
```bash
# Tạo thư mục backup
mkdir -p backup

# Copy các file cần sửa
cp src/routes/ketthuc.routes.ts backup/
cp src/controllers/ketthuc.controllers.ts backup/
cp src/services/ketthuc.services.ts backup/
```

### Bước 2: Sửa file theo thứ tự
1. Mở `src/routes/ketthuc.routes.ts` → Copy code từ phần "CODE HOÀN CHỈNH SAU KHI SỬA - OPTION 1"
2. Mở `src/controllers/ketthuc.controllers.ts` → Sửa dòng 3 (import HTTP_STATUS)
3. Mở `src/services/ketthuc.services.ts` → Copy code từ phần "CODE HOÀN CHỈNH SAU KHI SỬA"

### Bước 3: Restart server
```bash
# Nếu dùng nodemon, server sẽ tự restart
# Nếu không, restart thủ công:
npm run dev
```

### Bước 4: Kiểm tra lỗi
```bash
# Server phải chạy không lỗi
# Output mong muốn:
✅ Đã kết nối thành công với MySQL database!
🚀 Server đang chạy tại http://localhost:4000
```

### Bước 5: Test API (dùng Postman/Thunder Client)

**Test 1: Ghi nhận kết thúc**
```http
POST http://localhost:4000/ketthuc/ghinhan
Content-Type: application/json

{
  "MaTV": "TV06",
  "NgayGioMat": "2024-12-15 10:30:00",
  "MaNguyenNhanMat": "NNM02",
  "MaDiaDiem": "DD01"
}
```

**Test 2: Tra cứu**
```http
GET http://localhost:4000/ketthuc/tracuu
```

**Test 3: Chi tiết**
```http
GET http://localhost:4000/ketthuc/TV06
```

---

## 🎯 KẾT LUẬN

**3 lỗi chính:**
1. ❌ `wrapRequestHandler` không tồn tại → Xóa hoặc đổi thành `wrapAsync` (khuyến nghị xóa)
2. ❌ Import `{ HTTP_STATUS }` sai → Đổi thành `import HTTP_STATUS` (default import)
3. ❌ `executeQuery` không tồn tại → Đổi thành `query` và bỏ destructuring

**Sau khi sửa:**
- ✅ Server chạy không lỗi TypeScript
- ✅ Tất cả endpoints hoạt động bình thường
- ✅ Code thống nhất với các service khác (thanhtich, thanhvien)

Chúc bạn sửa lỗi thành công! 🚀
