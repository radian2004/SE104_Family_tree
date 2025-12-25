# 🔍 Hướng Dẫn Triển Khai Chức Năng "Tra Cứu Thành Viên"

> **Ngày tạo:** 21/12/2024  
> **Mục đích:** Hướng dẫn chi tiết cách triển khai API tra cứu thành viên với đầy đủ thông tin gia phả  
> **Lưu ý:** Tài liệu này chỉ hướng dẫn, KHÔNG tự động sửa code

---

## 📋 Mục Lục

1. [Tổng Quan Yêu Cầu](#1-tổng-quan-yêu-cầu)
2. [Phân Tích Cơ Sở Dữ Liệu](#2-phân-tích-cơ-sở-dữ-liệu)
3. [Thiết Kế API](#3-thiết-kế-api)
4. [Hướng Dẫn Triển Khai](#4-hướng-dẫn-triển-khai)
5. [Query SQL Chi Tiết](#5-query-sql-chi-tiết)
6. [Test Cases](#6-test-cases)
7. [Tính Năng Mở Rộng](#7-tính-năng-mở-rộng)

---

## 1. Tổng Quan Yêu Cầu

### 1.1. Mô Tả Chức Năng

Chức năng "Tra Cứu Thành Viên" cho phép **tìm kiếm và hiển thị danh sách thành viên** với các thông tin đầy đủ về gia phả, bao gồm cả thông tin cha/mẹ.

### 1.2. Các Thuộc Tính Yêu Cầu

| STT | Thuộc Tính | Nguồn Dữ Liệu | Ghi Chú |
|-----|-----------|----------------|---------|
| 1 | **Số thứ tự** | Auto-generated | Row number trong kết quả trả về |
| 2 | **Họ tên** | `THANHVIEN.HoTen` | Họ và tên đầy đủ |
| 3 | **Ngày sinh** | `THANHVIEN.NgayGioSinh` | Format: DATETIME |
| 4 | **Đời** | `THANHVIEN.DOI` | Số đời trong gia phả (1, 2, 3...) |
| 5 | **Tên cha** | `THANHVIEN.HoTen` (JOIN qua `QUANHECON.MaTVCha`) | Có thể NULL nếu không có cha |
| 6 | **Tên mẹ** | `THANHVIEN.HoTen` (JOIN qua `QUANHECON.MaTVMe`) | Có thể NULL nếu không có mẹ |

### 1.3. Tính Năng Bổ Sung (Tùy Chọn)

- **Tìm kiếm:** Theo họ tên, mã thành viên
- **Lọc:** Theo đời, gia phả, trạng thái (còn sống/đã mất)
- **Sắp xếp:** Theo đời, ngày sinh, họ tên
- **Phân trang:** Limit và offset

---

## 2. Phân Tích Cơ Sở Dữ Liệu

### 2.1. Bảng THANHVIEN

```sql
CREATE TABLE THANHVIEN (
    MaTV VARCHAR(5) PRIMARY KEY,              -- ✅ Mã thành viên
    HoTen VARCHAR(50),                        -- ✅ Họ tên
    NgayGioSinh DATETIME,                     -- ✅ Ngày giờ sinh
    DiaChi VARCHAR(50),
    TrangThai VARCHAR(20) DEFAULT 'Còn Sống',
    TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    DOI INT DEFAULT 0,                        -- ✅ Đời
    MaQueQuan VARCHAR(5),
    MaNgheNghiep VARCHAR(5),
    GioiTinh VARCHAR(3),
    MaNguyenNhanMat VARCHAR(5),
    NgayGioMat DATETIME,
    MaDiaDiem VARCHAR(5),
    MaGiaPha VARCHAR(5)
);
```

**Kết luận:** Bảng này có đầy đủ thông tin cơ bản (HoTen, NgayGioSinh, DOI).

---

### 2.2. Bảng QUANHECON (Quan Hệ Cha-Mẹ-Con)

```sql
CREATE TABLE QUANHECON(
    MaTV VARCHAR(5) PRIMARY KEY,              -- Mã thành viên CON
    MaTVCha VARCHAR(5),                       -- ✅ Mã thành viên CHA (có thể NULL)
    MaTVMe VARCHAR(5),                        -- ✅ Mã thành viên MẸ (có thể NULL)
    NgayPhatSinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(MaTVCha) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(MaTVMe) REFERENCES THANHVIEN(MaTV)
);
```

**Kết luận:** Bảng này chứa thông tin quan hệ cha/mẹ. Cần JOIN để lấy tên cha/mẹ.

---

### 2.3. Mối Quan Hệ Giữa Các Bảng

```
THANHVIEN (tv)
    ↓ (1:1)
QUANHECON (qhc)
    ↓ (MaTVCha) → THANHVIEN (cha)
    ↓ (MaTVMe)  → THANHVIEN (me)
```

**Lưu ý quan trọng:**
- **Không phải tất cả thành viên đều có quan hệ con:** Thủy tổ (đời 1) không có cha/mẹ trong hệ thống
- **MaTVCha và MaTVMe có thể NULL:** Con riêng hoặc chưa ghi nhận đầy đủ
- Cần dùng **LEFT JOIN** để không bỏ sót thành viên không có quan hệ

---

## 3. Thiết Kế API

### 3.1. Endpoint

```
GET /thanhvien/tra-cuu
```

### 3.2. Query Parameters (Tùy Chọn)

| Parameter | Type | Mô Tả | Ví Dụ |
|-----------|------|-------|-------|
| `search` | string | Tìm kiếm theo họ tên hoặc mã TV | `?search=Nguyễn` |
| `doi` | number | Lọc theo đời | `?doi=3` |
| `maGiaPha` | string | Lọc theo gia phả | `?maGiaPha=GP02` |
| `trangThai` | string | Lọc theo trạng thái | `?trangThai=Còn Sống` |
| `sortBy` | string | Sắp xếp theo (doi, ngaySinh, hoTen) | `?sortBy=doi` |
| `order` | string | Thứ tự (asc, desc) | `?order=asc` |
| `page` | number | Trang hiện tại (phân trang) | `?page=1` |
| `limit` | number | Số lượng mỗi trang | `?limit=10` |

### 3.3. Response Thành Công (200 OK)

```json
{
  "message": "Tra cứu thành viên thành công",
  "data": [
    {
      "STT": 1,
      "MaTV": "TV01",
      "HoTen": "Nguyễn Văn Tổ",
      "NgayGioSinh": "1920-05-15T08:00:00.000Z",
      "DOI": 1,
      "TenCha": null,
      "TenMe": null,
      "MaCha": null,
      "MaMe": null
    },
    {
      "STT": 2,
      "MaTV": "TV02",
      "HoTen": "Nguyễn Văn Long",
      "NgayGioSinh": "1945-03-20T10:30:00.000Z",
      "DOI": 2,
      "TenCha": "Nguyễn Văn Tổ",
      "TenMe": null,
      "MaCha": "TV01",
      "MaMe": null
    },
    {
      "STT": 3,
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "NgayGioSinh": "1972-08-10T09:15:00.000Z",
      "DOI": 3,
      "TenCha": "Nguyễn Văn Long",
      "TenMe": "Lê Thị Lan",
      "MaCha": "TV02",
      "MaMe": "TV03"
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 3.4. Response Khi Không Có Dữ Liệu (200 OK)

```json
{
  "message": "Không tìm thấy thành viên",
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0
  }
}
```

---

## 4. Hướng Dẫn Triển Khai

### 4.1. Tạo Interface/Type Definitions

**File:** `backend/src/models/requests/TraCuuThanhVien.requests.ts` **(TẠO MỚI)**

```typescript
// src/models/requests/TraCuuThanhVien.requests.ts

/**
 * Query parameters cho API tra cứu thành viên
 */
export interface TraCuuThanhVienQuery {
  search?: string;         // Tìm kiếm theo họ tên hoặc mã TV
  doi?: number;            // Lọc theo đời
  maGiaPha?: string;       // Lọc theo gia phả
  trangThai?: string;      // Lọc theo trạng thái (Còn Sống / Mất)
  sortBy?: 'doi' | 'ngaySinh' | 'hoTen';  // Sắp xếp theo
  order?: 'asc' | 'desc';  // Thứ tự sắp xếp
  page?: number;           // Trang hiện tại
  limit?: number;          // Số lượng mỗi trang
}

/**
 * Kết quả tra cứu một thành viên
 */
export interface TraCuuThanhVienResult {
  STT: number;             // Số thứ tự (auto-generated)
  MaTV: string;            // Mã thành viên
  HoTen: string;           // Họ tên
  NgayGioSinh: Date;       // Ngày giờ sinh
  DOI: number;             // Đời
  TenCha: string | null;   // Tên cha (NULL nếu không có)
  TenMe: string | null;    // Tên mẹ (NULL nếu không có)
  MaCha: string | null;    // Mã cha (để navigate nếu cần)
  MaMe: string | null;     // Mã mẹ (để navigate nếu cần)
}

/**
 * Response tra cứu thành viên với phân trang
 */
export interface TraCuuThanhVienResponse {
  message: string;
  data: TraCuuThanhVienResult[];
  pagination: {
    total: number;         // Tổng số record
    page: number;          // Trang hiện tại
    limit: number;         // Số lượng mỗi trang
    totalPages: number;    // Tổng số trang
  };
}
```

---

### 4.2. Thêm Method Trong Service

**File:** `backend/src/services/thanhvien.services.ts`

**Vị trí:** Thêm method mới sau method `getAvailableParents` (cuối class, trước dòng export)

```typescript
  /**
   * Tra cứu thành viên với đầy đủ thông tin gia phả
   * Bao gồm: họ tên, ngày sinh, đời, tên cha, tên mẹ
   */
  async traCuuThanhVien(query: TraCuuThanhVienQuery): Promise<TraCuuThanhVienResponse> {
    // [1] Xây dựng điều kiện WHERE
    const conditions: string[] = ['1=1']; // Base condition
    const params: any[] = [];
    
    // Tìm kiếm theo họ tên hoặc mã TV
    if (query.search) {
      conditions.push('(tv.HoTen LIKE ? OR tv.MaTV LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`);
    }
    
    // Lọc theo đời
    if (query.doi !== undefined) {
      conditions.push('tv.DOI = ?');
      params.push(query.doi);
    }
    
    // Lọc theo gia phả
    if (query.maGiaPha) {
      conditions.push('tv.MaGiaPha = ?');
      params.push(query.maGiaPha);
    }
    
    // Lọc theo trạng thái
    if (query.trangThai) {
      conditions.push('tv.TrangThai = ?');
      params.push(query.trangThai);
    }
    
    const whereClause = conditions.join(' AND ');
    
    // [2] Xây dựng ORDER BY
    let orderBy = 'tv.DOI ASC, tv.TGTaoMoi ASC'; // Mặc định
    
    if (query.sortBy) {
      const order = query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      
      switch (query.sortBy) {
        case 'doi':
          orderBy = `tv.DOI ${order}`;
          break;
        case 'ngaySinh':
          orderBy = `tv.NgayGioSinh ${order}`;
          break;
        case 'hoTen':
          orderBy = `tv.HoTen ${order}`;
          break;
      }
    }
    
    // [3] Query đếm tổng số record (cho pagination)
    const countSql = `
      SELECT COUNT(*) as total
      FROM THANHVIEN tv
      WHERE ${whereClause}
    `;
    
    const countRows = await databaseService.query<any[]>(countSql, params);
    const total = countRows[0]?.total || 0;
    
    // [4] Tính toán pagination
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    
    // [5] Query lấy dữ liệu với JOIN
    const dataSql = `
      SELECT 
        tv.MaTV,
        tv.HoTen,
        tv.NgayGioSinh,
        tv.DOI,
        qhc.MaTVCha,
        qhc.MaTVMe,
        cha.HoTen AS TenCha,
        me.HoTen AS TenMe
      FROM THANHVIEN tv
      LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
      LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
      LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    
    // ⚠️ QUAN TRỌNG: Đảm bảo limit và offset là số nguyên
    const dataParams = [...params, parseInt(String(limit)), parseInt(String(offset))];
    const rows = await databaseService.query<any[]>(dataSql, dataParams);
    
    // [6] Format kết quả với STT
    const data: TraCuuThanhVienResult[] = rows.map((row, index) => ({
      STT: offset + index + 1,  // Số thứ tự liên tục qua các trang
      MaTV: row.MaTV,
      HoTen: row.HoTen,
      NgayGioSinh: row.NgayGioSinh,
      DOI: row.DOI,
      TenCha: row.TenCha || null,
      TenMe: row.TenMe || null,
      MaCha: row.MaTVCha || null,
      MaMe: row.MaTVMe || null
    }));
    
    // [7] Trả về kết quả
    return {
      message: data.length > 0 ? 'Tra cứu thành viên thành công' : 'Không tìm thấy thành viên',
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

**Lưu ý:** Cần import thêm ở đầu file:

```typescript
import { 
  TraCuuThanhVienQuery,
  TraCuuThanhVienResult,
  TraCuuThanhVienResponse 
} from '~/models/requests/TraCuuThanhVien.requests';
```

---

### 4.3. Thêm Controller

**File:** `backend/src/controllers/thanhvien.controllers.ts`

**Vị trí:** Thêm controller mới sau các controller hiện có

```typescript
/**
 * Controller tra cứu thành viên với đầy đủ thông tin gia phả
 * GET /thanhvien/tra-cuu
 */
export const traCuuThanhVienController = async (req: Request, res: Response) => {
  try {
    // Lấy query parameters
    const query: TraCuuThanhVienQuery = {
      search: req.query.search as string,
      doi: req.query.doi ? parseInt(req.query.doi as string) : undefined,
      maGiaPha: req.query.maGiaPha as string,
      trangThai: req.query.trangThai as string,
      sortBy: req.query.sortBy as 'doi' | 'ngaySinh' | 'hoTen',
      order: req.query.order as 'asc' | 'desc',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };
    
    // Gọi service
    const result = await thanhvienService.traCuuThanhVien(query);
    
    return res.status(200).json(result);
    
  } catch (error: any) {
    console.error('Lỗi traCuuThanhVien:', error);
    return res.status(500).json({
      message: 'Tra cứu thành viên thất bại',
      error: error.message
    });
  }
};
```

**Lưu ý:** Cần import thêm ở đầu file:

```typescript
import { TraCuuThanhVienQuery } from '~/models/requests/TraCuuThanhVien.requests';
```

---

### 4.4. Thêm Route

**File:** `backend/src/routes/thanhvien.routes.ts`

**Vị trí:** Thêm route TRƯỚC các routes có parameter `:MaTV`

```typescript
import {
  registerController,
  getAllThanhVienController,
  getThanhVienByMaTVController,
  updateThanhVienController,
  deleteThanhVienController,
  ghiNhanThanhVienController,
  getAvailableRelationsController,
  traCuuThanhVienController  // ✅ THÊM MỚI
} from '~/controllers/thanhvien.controllers';

const thanhvienRouter = Router();

// ========================================
// ROUTES CỤ THỂ (đặt trước routes có param)
// ========================================

// POST /thanhvien/register
thanhvienRouter.post('/register', registerController);

// POST /thanhvien/ghi-nhan
thanhvienRouter.post('/ghi-nhan', ghiNhanThanhVienController);

// GET /thanhvien/available-relations
thanhvienRouter.get('/available-relations', getAvailableRelationsController);

// ✅ THÊM MỚI: GET /thanhvien/tra-cuu
thanhvienRouter.get('/tra-cuu', traCuuThanhVienController);

// ========================================
// ROUTES CHUNG (đặt sau)
// ========================================

// GET /thanhvien
thanhvienRouter.get('/', getAllThanhVienController);

// GET /thanhvien/:MaTV
thanhvienRouter.get('/:MaTV', getThanhVienByMaTVController);

// PUT /thanhvien/:MaTV
thanhvienRouter.put('/:MaTV', updateThanhVienController);

// DELETE /thanhvien/:MaTV
thanhvienRouter.delete('/:MaTV', deleteThanhVienController);

export default thanhvienRouter;
```

**⚠️ QUAN TRỌNG:** Route `/tra-cuu` phải đặt **TRƯỚC** route `/:MaTV` để tránh conflict!

---

## 5. Query SQL Chi Tiết

### 5.1. Query Cơ Bản (Lấy Tất Cả)

```sql
SELECT 
  tv.MaTV,
  tv.HoTen,
  tv.NgayGioSinh,
  tv.DOI,
  qhc.MaTVCha,
  qhc.MaTVMe,
  cha.HoTen AS TenCha,
  me.HoTen AS TenMe
FROM THANHVIEN tv
LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
ORDER BY tv.DOI ASC, tv.TGTaoMoi ASC;
```

**Kết quả mẫu:**

| MaTV | HoTen | NgayGioSinh | DOI | TenCha | TenMe |
|------|-------|-------------|-----|--------|-------|
| TV01 | Nguyễn Văn Tổ | 1920-05-15 | 1 | NULL | NULL |
| TV02 | Nguyễn Văn Long | 1945-03-20 | 2 | Nguyễn Văn Tổ | NULL |
| TV03 | Lê Thị Lan | 1948-11-25 | 2 | NULL | NULL |
| TV04 | Nguyễn Văn Hùng | 1972-08-10 | 3 | Nguyễn Văn Long | Lê Thị Lan |

---

### 5.2. Query Với Tìm Kiếm

```sql
SELECT 
  tv.MaTV,
  tv.HoTen,
  tv.NgayGioSinh,
  tv.DOI,
  cha.HoTen AS TenCha,
  me.HoTen AS TenMe
FROM THANHVIEN tv
LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
WHERE (tv.HoTen LIKE '%Nguyễn%' OR tv.MaTV LIKE '%Nguyễn%')
ORDER BY tv.DOI ASC;
```

---

### 5.3. Query Với Lọc Theo Đời

```sql
SELECT 
  tv.MaTV,
  tv.HoTen,
  tv.NgayGioSinh,
  tv.DOI,
  cha.HoTen AS TenCha,
  me.HoTen AS TenMe
FROM THANHVIEN tv
LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
WHERE tv.DOI = 3
ORDER BY tv.TGTaoMoi ASC;
```

---

### 5.4. Query Với Phân Trang

```sql
SELECT 
  tv.MaTV,
  tv.HoTen,
  tv.NgayGioSinh,
  tv.DOI,
  cha.HoTen AS TenCha,
  me.HoTen AS TenMe
FROM THANHVIEN tv
LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
ORDER BY tv.DOI ASC
LIMIT 10 OFFSET 0;  -- Trang 1: OFFSET = (page - 1) * limit
```

---

## 6. Test Cases

### 📱 Hướng Dẫn Test Trên Postman

#### Bước 1: Tạo Request Mới
1. Mở Postman
2. Click **New** → **HTTP Request**
3. Method: Chọn **GET**
4. URL: `http://localhost:3000/thanhvien/tra-cuu`

#### Bước 2: Thêm Query Parameters
- Click tab **Params** (nằm dưới URL bar)
- Thêm các cặp key-value tương ứng với từng test case

#### Bước 3: Gửi Request
- Click **Send**
- Xem kết quả ở tab **Body** phía dưới

---

### 6.1. Test Case 1: Lấy Tất Cả Thành Viên (Không Filter)

**🔧 Cấu hình Postman:**
- Method: `GET`
- URL: `http://localhost:3000/thanhvien/tra-cuu`
- Params: **(Không có - để trống)**

**Hoặc dùng cURL:**
```bash
curl http://localhost:3000/thanhvien/tra-cuu
```

**Expected Response (200):**
```json
{
  "message": "Tra cứu thành viên thành công",
  "data": [
    {
      "STT": 1,
      "MaTV": "TV01",
      "HoTen": "Nguyễn Văn Tổ",
      "NgayGioSinh": "1920-05-15T08:00:00.000Z",
      "DOI": 1,
      "TenCha": null,
      "TenMe": null,
      "MaCha": null,
      "MaMe": null
    },
    {
      "STT": 2,
      "MaTV": "TV02",
      "HoTen": "Nguyễn Văn Long",
      "NgayGioSinh": "1945-03-20T10:30:00.000Z",
      "DOI": 2,
      "TenCha": "Nguyễn Văn Tổ",
      "TenMe": null,
      "MaCha": "TV01",
      "MaMe": null
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 6.2. Test Case 2: Tìm Kiếm Theo Tên

**🔧 Cấu hình Postman:**
- Method: `GET`
- URL: `http://localhost:3000/thanhvien/tra-cuu`
- **Params:**
  | Key | Value |
  |-----|-------|
  | search | Hùng |

**Hoặc dùng cURL:**
```bash
curl "http://localhost:3000/thanhvien/tra-cuu?search=Hùng"
```

**📸 Screenshot Postman:**
```
┌─────────────────────────────────────────────────────┐
│ GET http://localhost:3000/thanhvien/tra-cuu         │
├─────────────────────────────────────────────────────┤
│ Params  │ Authorization │ Headers │ Body            │
├─────────┴────────────────────────────────────────────┤
│ KEY       │ VALUE     │ DESCRIPTION                  │
│ search    │ Hùng      │                              │
└──────────────────────────────────────────────────────┘
```

**Expected Response (200):**
```json
{
  "message": "Tra cứu thành viên thành công",
  "data": [
    {
      "STT": 1,
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "NgayGioSinh": "1972-08-10T09:15:00.000Z",
      "DOI": 3,
      "TenCha": "Nguyễn Văn Long",
      "TenMe": "Lê Thị Lan",
      "MaCha": "TV02",
      "MaMe": "TV03"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 6.3. Test Case 3: Lọc Theo Đời

**🔧 Cấu hình Postman:**
- Method: `GET`
- URL: `http://localhost:3000/thanhvien/tra-cuu`
- **Params:**
  | Key | Value |
  |-----|-------|
  | doi | 4 |

**Hoặc dùng cURL:**
```bash
curl "http://localhost:3000/thanhvien/tra-cuu?doi=4"
```

**Expected Response (200):**
```json
{
  "message": "Tra cứu thành viên thành công",
  "data": [
    {
      "STT": 1,
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "NgayGioSinh": "1998-04-05T07:45:00.000Z",
      "DOI": 4,
      "TenCha": "Nguyễn Văn Hùng",
      "TenMe": "Phạm Thị Hồng",
      "MaCha": "TV04",
      "MaMe": "TV05"
    },
    {
      "STT": 2,
      "MaTV": "TV07",
      "HoTen": "Nguyễn Thị Ngọc Anh",
      "NgayGioSinh": "2002-01-18T16:30:00.000Z",
      "DOI": 4,
      "TenCha": "Nguyễn Văn Hùng",
      "TenMe": "Phạm Thị Hồng",
      "MaCha": "TV04",
      "MaMe": "TV05"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 6.4. Test Case 4: Sắp Xếp Theo Ngày Sinh (Giảm Dần)

**🔧 Cấu hình Postman:**
- Method: `GET`
- URL: `http://localhost:3000/thanhvien/tra-cuu`
- **Params:**
  | Key | Value |
  |-----|-------|
  | sortBy | ngaySinh |
  | order | desc |

**Hoặc dùng cURL:**
```bash
curl "http://localhost:3000/thanhvien/tra-cuu?sortBy=ngaySinh&order=desc"
```

---

### 6.5. Test Case 5: Phân Trang

**🔧 Cấu hình Postman:**
- Method: `GET`
- URL: `http://localhost:3000/thanhvien/tra-cuu`
- **Params:**
  | Key | Value |
  |-----|-------|
  | page | 1 |
  | limit | 3 |

**Hoặc dùng cURL:**
```bash
curl "http://localhost:3000/thanhvien/tra-cuu?page=1&limit=3"
```

**Expected Response (200):**
```json
{
  "message": "Tra cứu thành viên thành công",
  "data": [
    {
      "STT": 1,
      "MaTV": "TV01",
      ...
    },
    {
      "STT": 2,
      "MaTV": "TV02",
      ...
    },
    {
      "STT": 3,
      "MaTV": "TV03",
      ...
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 3,
    "totalPages": 3
  }
}
```

**💡 Tip:** Để xem trang 2, đổi `page` thành `2`:
- Params:
  | Key | Value |
  |-----|-------|
  | page | 2 |
  | limit | 3 |

---

### 6.6. Test Case 6: Kết Hợp Nhiều Filter

**🔧 Cấu hình Postman:**
- Method: `GET`
- URL: `http://localhost:3000/thanhvien/tra-cuu`
- **Params:**
  | Key | Value |
  |-----|-------|
  | search | Nguyễn |
  | doi | 3 |
  | sortBy | hoTen |
  | order | asc |

**Hoặc dùng cURL:**
```bash
curl "http://localhost:3000/thanhvien/tra-cuu?search=Nguyễn&doi=3&sortBy=hoTen&order=asc"
```

---

### 6.7. Test Case 7: Không Tìm Thấy Kết Quả

**🔧 Cấu hình Postman:**
- Method: `GET`
- URL: `http://localhost:3000/thanhvien/tra-cuu`
- **Params:**
  | Key | Value |
  |-----|-------|
  | search | XYZ123 |

**Hoặc dùng cURL:**
```bash
curl "http://localhost:3000/thanhvien/tra-cuu?search=XYZ123"
```

**Expected Response (200):**
```json
{
  "message": "Không tìm thấy thành viên",
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0
  }
}
```

---

### 📦 Import Postman Collection (Tùy Chọn)

Bạn có thể tạo một Postman Collection để lưu tất cả test cases:

**File:** `Tra-Cuu-Thanh-Vien.postman_collection.json`

```json
{
  "info": {
    "name": "Tra Cứu Thành Viên",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Lấy tất cả",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/thanhvien/tra-cuu",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["thanhvien", "tra-cuu"]
        }
      }
    },
    {
      "name": "2. Tìm kiếm theo tên",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/thanhvien/tra-cuu?search=Hùng",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["thanhvien", "tra-cuu"],
          "query": [
            {
              "key": "search",
              "value": "Hùng"
            }
          ]
        }
      }
    },
    {
      "name": "3. Lọc theo đời",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/thanhvien/tra-cuu?doi=4",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["thanhvien", "tra-cuu"],
          "query": [
            {
              "key": "doi",
              "value": "4"
            }
          ]
        }
      }
    },
    {
      "name": "4. Sắp xếp ngày sinh",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/thanhvien/tra-cuu?sortBy=ngaySinh&order=desc",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["thanhvien", "tra-cuu"],
          "query": [
            {
              "key": "sortBy",
              "value": "ngaySinh"
            },
            {
              "key": "order",
              "value": "desc"
            }
          ]
        }
      }
    },
    {
      "name": "5. Phân trang",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/thanhvien/tra-cuu?page=1&limit=3",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["thanhvien", "tra-cuu"],
          "query": [
            {
              "key": "page",
              "value": "1"
            },
            {
              "key": "limit",
              "value": "3"
            }
          ]
        }
      }
    },
    {
      "name": "6. Kết hợp nhiều filter",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/thanhvien/tra-cuu?search=Nguyễn&doi=3&sortBy=hoTen&order=asc",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["thanhvien", "tra-cuu"],
          "query": [
            {
              "key": "search",
              "value": "Nguyễn"
            },
            {
              "key": "doi",
              "value": "3"
            },
            {
              "key": "sortBy",
              "value": "hoTen"
            },
            {
              "key": "order",
              "value": "asc"
            }
          ]
        }
      }
    },
    {
      "name": "7. Không tìm thấy",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/thanhvien/tra-cuu?search=XYZ123",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["thanhvien", "tra-cuu"],
          "query": [
            {
              "key": "search",
              "value": "XYZ123"
            }
          ]
        }
      }
    }
  ]
}
```

**Cách import:**
1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file JSON trên
4. Collection sẽ xuất hiện ở sidebar bên trái

---

## 7. Tính Năng Mở Rộng

### 7.1. Thêm Thông Tin Bổ Sung

Có thể mở rộng response để bao gồm:

```typescript
export interface TraCuuThanhVienResult {
  STT: number;
  MaTV: string;
  HoTen: string;
  NgayGioSinh: Date;
  DOI: number;
  TenCha: string | null;
  TenMe: string | null;
  MaCha: string | null;
  MaMe: string | null;
  
  // ✅ THÊM CÁC TRƯỜNG MỚI
  GioiTinh?: string;           // Nam/Nữ
  TrangThai?: string;          // Còn Sống/Mất
  DiaChi?: string;             // Địa chỉ hiện tại
  TenQueQuan?: string;         // Quê quán (JOIN với QUEQUAN)
  TenNgheNghiep?: string;      // Nghề nghiệp (JOIN với NGHENGHIEP)
  TenGiaPha?: string;          // Tên gia phả (JOIN với CAYGIAPHA)
  SoLuongCon?: number;         // Số lượng con (COUNT từ QUANHECON)
}
```

**Query mở rộng:**
```sql
SELECT 
  tv.MaTV,
  tv.HoTen,
  tv.NgayGioSinh,
  tv.DOI,
  tv.GioiTinh,
  tv.TrangThai,
  tv.DiaChi,
  qq.TenQueQuan,
  nn.TenNgheNghiep,
  gp.TenGiaPha,
  cha.HoTen AS TenCha,
  me.HoTen AS TenMe,
  (SELECT COUNT(*) FROM QUANHECON WHERE MaTVCha = tv.MaTV OR MaTVMe = tv.MaTV) AS SoLuongCon
FROM THANHVIEN tv
LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
LEFT JOIN QUEQUAN qq ON tv.MaQueQuan = qq.MaQueQuan
LEFT JOIN NGHENGHIEP nn ON tv.MaNgheNghiep = nn.MaNgheNghiep
LEFT JOIN CAYGIAPHA gp ON tv.MaGiaPha = gp.MaGiaPha
ORDER BY tv.DOI ASC;
```

---

### 7.2. Export Excel/CSV

Thêm endpoint để export kết quả tra cứu:

```typescript
// GET /thanhvien/tra-cuu/export
export const exportTraCuuController = async (req: Request, res: Response) => {
  // Tương tự traCuuThanhVienController nhưng không có pagination
  // Dùng thư viện như xlsx hoặc csv-writer để export
};
```

---

### 7.3. Advanced Search

Thêm các filter nâng cao:

```typescript
export interface TraCuuThanhVienQuery {
  // ... các filter hiện có ...
  
  // ✅ THÊM FILTER MỚI
  namSinhFrom?: number;      // Lọc năm sinh từ
  namSinhTo?: number;        // Lọc năm sinh đến
  gioiTinh?: 'Nam' | 'Nữ';  // Lọc theo giới tính
  queQuan?: string;          // Lọc theo quê quán
  ngheNghiep?: string;       // Lọc theo nghề nghiệp
}
```

---

## 📊 So Sánh Với API Hiện Có

| Tính Năng | `GET /thanhvien` (Cũ) | `GET /thanhvien/tra-cuu` (Mới) |
|-----------|---------------------|---------------------------|
| Lấy danh sách | ✅ | ✅ |
| Thông tin cha/mẹ | ❌ | ✅ |
| Tìm kiếm | ❌ | ✅ |
| Lọc theo đời | ❌ | ✅ |
| Sắp xếp linh hoạt | ❌ | ✅ |
| Phân trang | ❌ | ✅ |
| Số thứ tự | ❌ | ✅ |

---

## ✅ Checklist Triển Khai

- [ ] Tạo file `TraCuuThanhVien.requests.ts` với các interfaces
- [ ] Thêm method `traCuuThanhVien` vào `thanhvien.services.ts`
- [ ] Thêm import interfaces vào service
- [ ] Thêm controller `traCuuThanhVienController` vào `thanhvien.controllers.ts`
- [ ] Thêm import interfaces vào controller
- [ ] Thêm route `GET /tra-cuu` vào `thanhvien.routes.ts`
- [ ] **Đảm bảo route `/tra-cuu` đặt TRƯỚC `/:MaTV`**
- [ ] Test với các query parameters khác nhau
- [ ] Test phân trang
- [ ] Test sắp xếp
- [ ] Kiểm tra performance với dữ liệu lớn

---

## 🎯 Lợi Ích

1. ✅ **Thông tin đầy đủ:** Hiển thị luôn tên cha/mẹ, không cần gọi API nhiều lần
2. ✅ **Tìm kiếm linh hoạt:** Hỗ trợ nhiều điều kiện lọc
3. ✅ **Performance tốt:** Sử dụng JOIN thay vì N+1 queries
4. ✅ **Phân trang:** Xử lý tốt với dữ liệu lớn
5. ✅ **UX tốt:** Số thứ tự giúp người dùng dễ theo dõi

---

> **Tác giả:** GitHub Copilot  
> **Phiên bản:** 1.0  
> **Ngày tạo:** 21/12/2024  
> **Mức độ ưu tiên:** 🟢 **TRUNG BÌNH** - Tính năng hữu ích
