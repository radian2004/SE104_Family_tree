# CẢI TIẾN CHỨC NĂNG TRA CỨU KẾT THÚC - TÌM KIẾM LINH HOẠT

## 📋 TỔNG QUAN YÊU CẦU

### Hiện trạng
- Sửa Tra cứu tất cả thành viên kết thúc: **HOẠT ĐỘNG BÌNH THƯỜNG**
- Sửa Tra cứu theo mã thành viên (MaTV): **HOẠT ĐỘNG BÌNH THƯỜNG**
- ❌ Tra cứu theo tên địa điểm: **CHƯA CÓ** (hiện chỉ có MaDiaDiem)
- ❌ Tra cứu theo tên nguyên nhân: **CHƯA CÓ** (hiện chỉ có MaNguyenNhanMat)

### Yêu cầu mới
1. Sửa Sửa URL từ `localhost:4000` → `localhost:3000` trong tài liệu
2. ➕ **Thêm tra cứu theo tên địa điểm mai táng** (LIKE search, VD: "Hà Nội" tìm tất cả địa điểm có "Hà Nội")
3. ➕ **Thêm tra cứu theo tên nguyên nhân mất** (LIKE search, VD: "Bệnh" tìm "Bệnh hiểm nghèo")

### Kết quả test thực tế

**Test 1: Tra cứu tất cả (không lọc)**
```bash
GET http://localhost:3000/ketthuc/tracuu
```

**Response:**
```json
{
  "message": "Tra cứu kết thúc thành công",
  "total": 3,
  "data": [
    {
      "STT": 1,
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "NgayGioMat": "15/12/2024 10:30:00",
      "TenNguyenNhanMat": "Bệnh hiểm nghèo",
      "TenDiaDiem": "Hỏa táng Phúc An Viên"
    },
    {
      "STT": 2,
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "NgayGioMat": "15/12/2024 10:30:00",
      "TenNguyenNhanMat": "Bệnh hiểm nghèo",
      "TenDiaDiem": "Nghĩa trang Văn Điển - Hà Nội"
    },
    {
      "STT": 3,
      "MaTV": "TV01",
      "HoTen": "Nguyễn Văn Tổ",
      "NgayGioMat": "15/01/2020 10:30:00",
      "TenNguyenNhanMat": "Tuổi già",
      "TenDiaDiem": "Nghĩa trang quê nhà Nghệ An"
    }
  ]
}
```

Sửa **Kết luận**: Tra cứu tất cả hoạt động bình thường!

---

## 🔧 PHẦN 1: SỬA SCHEMAS

### File: `src/models/schemas/KetThuc.schema.ts`

**⚠️ SỬA FILE CŨ** - Thêm 2 trường mới vào interface filters

**Tìm đoạn code:**
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
```

**KHÔNG CẦN SỬA** - Interface này đã đủ

**Tìm đoạn code cuối file:**
```typescript
export interface GhiNhanKetThucPayload {
  MaTV: string
  NgayGioMat: string // Format: 'YYYY-MM-DD HH:mm:ss'
  MaNguyenNhanMat: string
  MaDiaDiem: string
}
```

**THÊM SAU ĐOẠN CODE TRÊN:**
```typescript
// Sửa MỚI: Interface cho filters tra cứu linh hoạt
export interface TraCuuKetThucFilters {
  HoTen?: string                // Tìm theo họ tên thành viên (LIKE)
  MaNguyenNhanMat?: string      // Tìm theo mã nguyên nhân (bỏ trong V2)
  TenNguyenNhanMat?: string     // ⭐ MỚI: Tìm theo tên nguyên nhân (LIKE)
  MaDiaDiem?: string            // Tìm theo mã địa điểm (bỏ trong V2)
  TenDiaDiem?: string           // ⭐ MỚI: Tìm theo tên địa điểm (LIKE)
  TuNgay?: string               // Lọc từ ngày (YYYY-MM-DD)
  DenNgay?: string              // Lọc đến ngày (YYYY-MM-DD)
}
```

---

## 🔧 PHẦN 2: SỬA SERVICES

### File: `src/services/ketthuc.services.ts`

**⚠️ SỬA FILE CŨ** - Cập nhật method `traCuuKetThuc`

**Tìm đoạn code (dòng 39-52):**
```typescript
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
```

**THAY BẰNG:**
```typescript
  /**
   * 2. Tra cứu danh sách thành viên đã kết thúc
   * Với STT tự động (sử dụng ROW_NUMBER)
   * ⭐ V2: Hỗ trợ tìm kiếm linh hoạt theo TÊN (không cần nhớ mã)
   */
  async traCuuKetThuc(filters?: {
    HoTen?: string
    MaNguyenNhanMat?: string          // Deprecated - Giữ để tương thích ngược
    TenNguyenNhanMat?: string         // ⭐ MỚI: Tìm theo tên nguyên nhân
    MaDiaDiem?: string                // Deprecated - Giữ để tương thích ngược
    TenDiaDiem?: string               // ⭐ MỚI: Tìm theo tên địa điểm
    TuNgay?: string
    DenNgay?: string
  }): Promise<TraCuuKetThucResult[]> {
    let whereClauses: string[] = ["tv.TrangThai = 'Mất'"]
    const params: any[] = []
```

**Tìm đoạn code (dòng 54-73):**
```typescript
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
```

**THAY BẰNG:**
```typescript
    // Lọc theo họ tên (LIKE search)
    if (filters?.HoTen) {
      whereClauses.push('tv.HoTen LIKE ?')
      params.push(`%${filters.HoTen}%`)
    }

    // ⭐ MỚI: Lọc theo TÊN nguyên nhân mất (LIKE search)
    if (filters?.TenNguyenNhanMat) {
      whereClauses.push('nnm.TenNguyenNhanMat LIKE ?')
      params.push(`%${filters.TenNguyenNhanMat}%`)
    }
    // Deprecated: Giữ để tương thích ngược với code cũ
    else if (filters?.MaNguyenNhanMat) {
      whereClauses.push('tv.MaNguyenNhanMat = ?')
      params.push(filters.MaNguyenNhanMat)
    }

    // ⭐ MỚI: Lọc theo TÊN địa điểm mai táng (LIKE search)
    if (filters?.TenDiaDiem) {
      whereClauses.push('dd.TenDiaDiem LIKE ?')
      params.push(`%${filters.TenDiaDiem}%`)
    }
    // Deprecated: Giữ để tương thích ngược với code cũ
    else if (filters?.MaDiaDiem) {
      whereClauses.push('tv.MaDiaDiem = ?')
      params.push(filters.MaDiaDiem)
    }

    // Lọc theo khoảng thời gian mất
    if (filters?.TuNgay) {
```

**LƯU Ý:** Phần code còn lại (từ TuNgay, DenNgay, query SELECT...) GIỮ NGUYÊN không đổi!

---

## 🔧 PHẦN 3: SỬA CONTROLLERS

### File: `src/controllers/ketthuc.controllers.ts`

**⚠️ SỬA FILE CŨ** - Cập nhật controller `traCuuKetThucController`

**Tìm đoạn code (dòng 30-50):**
```typescript
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
```

**THAY BẰNG:**
```typescript
/**
 * Controller 2: Tra cứu kết thúc (với bộ lọc)
 * ⭐ V2: Thêm TenNguyenNhanMat và TenDiaDiem
 */
export const traCuuKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      HoTen, 
      MaNguyenNhanMat,      // Deprecated
      TenNguyenNhanMat,     // ⭐ MỚI
      MaDiaDiem,            // Deprecated
      TenDiaDiem,           // ⭐ MỚI
      TuNgay, 
      DenNgay 
    } = req.query

    const results = await ketthucService.traCuuKetThuc({
      HoTen: HoTen as string | undefined,
      MaNguyenNhanMat: MaNguyenNhanMat as string | undefined,
      TenNguyenNhanMat: TenNguyenNhanMat as string | undefined,     // ⭐ MỚI
      MaDiaDiem: MaDiaDiem as string | undefined,
      TenDiaDiem: TenDiaDiem as string | undefined,                 // ⭐ MỚI
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
```

---

## 📝 PHẦN 4: API ENDPOINTS MỚI VÀ TEST CASES

### 1. Tra cứu tất cả (Không thay đổi - đã hoạt động)

**Request:**
```http
GET http://localhost:3000/ketthuc/tracuu
```

**Response:**
```json
{
  "message": "Tra cứu kết thúc thành công",
  "total": 3,
  "data": [...]
}
```

---

### 2. ⭐ MỚI: Tra cứu theo TÊN nguyên nhân (LIKE search)

**Request 1: Tìm "Bệnh"**
```http
GET http://localhost:3000/ketthuc/tracuu?TenNguyenNhanMat=Bệnh
```

**Response:**
```json
{
  "message": "Tra cứu kết thúc thành công",
  "total": 2,
  "data": [
    {
      "STT": 1,
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "NgayGioMat": "15/12/2024 10:30:00",
      "TenNguyenNhanMat": "Bệnh hiểm nghèo",
      "TenDiaDiem": "Hỏa táng Phúc An Viên"
    },
    {
      "STT": 2,
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "NgayGioMat": "15/12/2024 10:30:00",
      "TenNguyenNhanMat": "Bệnh hiểm nghèo",
      "TenDiaDiem": "Nghĩa trang Văn Điển - Hà Nội"
    }
  ]
}
```

**Request 2: Tìm "Tuổi"**
```http
GET http://localhost:3000/ketthuc/tracuu?TenNguyenNhanMat=Tuổi
```

**Response:**
```json
{
  "message": "Tra cứu kết thúc thành công",
  "total": 1,
  "data": [
    {
      "STT": 1,
      "MaTV": "TV01",
      "HoTen": "Nguyễn Văn Tổ",
      "NgayGioMat": "15/01/2020 10:30:00",
      "TenNguyenNhanMat": "Tuổi già",
      "TenDiaDiem": "Nghĩa trang quê nhà Nghệ An"
    }
  ]
}
```

**Request 3: Tìm "già" (phân biệt hoa thường - không phân biệt trong LIKE)**
```http
GET http://localhost:3000/ketthuc/tracuu?TenNguyenNhanMat=già
```

**Response:** Giống Request 2 (tìm "Tuổi già")

---

### 3. ⭐ MỚI: Tra cứu theo TÊN địa điểm mai táng (LIKE search)

**Request 1: Tìm "Hà Nội"**
```http
GET http://localhost:3000/ketthuc/tracuu?TenDiaDiem=Hà Nội
```

**Response:**
```json
{
  "message": "Tra cứu kết thúc thành công",
  "total": 1,
  "data": [
    {
      "STT": 1,
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "NgayGioMat": "15/12/2024 10:30:00",
      "TenNguyenNhanMat": "Bệnh hiểm nghèo",
      "TenDiaDiem": "Nghĩa trang Văn Điển - Hà Nội"
    }
  ]
}
```

**Request 2: Tìm "Nghĩa trang"**
```http
GET http://localhost:3000/ketthuc/tracuu?TenDiaDiem=Nghĩa trang
```

**Response:**
```json
{
  "message": "Tra cứu kết thúc thành công",
  "total": 2,
  "data": [
    {
      "STT": 1,
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "NgayGioMat": "15/12/2024 10:30:00",
      "TenNguyenNhanMat": "Bệnh hiểm nghèo",
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

**Request 3: Tìm "Hỏa táng"**
```http
GET http://localhost:3000/ketthuc/tracuu?TenDiaDiem=Hỏa táng
```

**Response:**
```json
{
  "message": "Tra cứu kết thúc thành công",
  "total": 1,
  "data": [
    {
      "STT": 1,
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "NgayGioMat": "15/12/2024 10:30:00",
      "TenNguyenNhanMat": "Bệnh hiểm nghèo",
      "TenDiaDiem": "Hỏa táng Phúc An Viên"
    }
  ]
}
```

---

### 4. ⭐ MỚI: Kết hợp nhiều bộ lọc

**Request: Tìm người chết vì bệnh + ở Hà Nội + năm 2024**
```http
GET http://localhost:3000/ketthuc/tracuu?TenNguyenNhanMat=Bệnh&TenDiaDiem=Hà Nội&TuNgay=2024-01-01&DenNgay=2024-12-31
```

**Response:**
```json
{
  "message": "Tra cứu kết thúc thành công",
  "total": 1,
  "data": [
    {
      "STT": 1,
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "NgayGioMat": "15/12/2024 10:30:00",
      "TenNguyenNhanMat": "Bệnh hiểm nghèo",
      "TenDiaDiem": "Nghĩa trang Văn Điển - Hà Nội"
    }
  ]
}
```

**Request: Tìm họ "Nguyễn" + địa điểm có "Nghĩa trang"**
```http
GET http://localhost:3000/ketthuc/tracuu?HoTen=Nguyễn&TenDiaDiem=Nghĩa trang
```

**Response:**
```json
{
  "message": "Tra cứu kết thúc thành công",
  "total": 2,
  "data": [
    {
      "STT": 1,
      "MaTV": "TV06",
      "HoTen": "Nguyễn Văn Nam",
      "NgayGioMat": "15/12/2024 10:30:00",
      "TenNguyenNhanMat": "Bệnh hiểm nghèo",
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

### 5. Tương thích ngược với API cũ (MaNguyenNhanMat, MaDiaDiem)

**Vẫn hoạt động:**
```http
GET http://localhost:3000/ketthuc/tracuu?MaNguyenNhanMat=NNM01
GET http://localhost:3000/ketthuc/tracuu?MaDiaDiem=DD02
```

---

## 📊 PHẦN 5: BẢNG SO SÁNH BEFORE/AFTER

| Tính năng | Trước (V1) | Sau (V2 - Cải tiến) |
|-----------|-----------|---------------------|
| Tra cứu tất cả | Sửa Có | Sửa Có (không đổi) |
| Tra cứu theo họ tên | Sửa LIKE search | Sửa LIKE search (không đổi) |
| Tra cứu theo nguyên nhân | Sửa MaNguyenNhanMat = | SửaSửa TenNguyenNhanMat LIKE (mới) |
| Tra cứu theo địa điểm | Sửa MaDiaDiem = | SửaSửa TenDiaDiem LIKE (mới) |
| Tra cứu theo khoảng thời gian | Sửa TuNgay, DenNgay | Sửa TuNgay, DenNgay (không đổi) |
| User-friendly | ❌ Phải biết mã (NNM01, DD02) | SửaSửa Gõ từ khóa ("Bệnh", "Hà Nội") |
| Tương thích ngược | N/A | Sửa API cũ vẫn hoạt động |

---

## 📊 PHẦN 6: UI MOCKUP MỚI

### Form tra cứu kết thúc (V2 - Cải tiến)

```
┌────────────────────────────────────────────────────────────────────┐
│                    TRA CỨU KẾT THÚC - V2                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Họ tên:                                                           │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ VD: Nguyễn, Hùng, Nam...                                     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  🆕 Nguyên nhân (gõ từ khóa):                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ VD: Bệnh, Tuổi già, Tai nạn...                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  🆕 Địa điểm (gõ từ khóa):                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ VD: Hà Nội, Nghĩa trang, Hỏa táng...                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Từ ngày:                      Đến ngày:                          │
│  ┌────────────────┐            ┌────────────────┐                │
│  │ 01/01/2020     │            │ 31/12/2024     │                │
│  └────────────────┘            └────────────────┘                │
│                                                                    │
│              [Xóa bộ lọc]        [Tìm kiếm]                       │
└────────────────────────────────────────────────────────────────────┘

💡 Mẹo tìm kiếm:
- Gõ "Bệnh" → Tìm tất cả nguyên nhân có từ "Bệnh" (VD: "Bệnh hiểm nghèo")
- Gõ "Hà Nội" → Tìm tất cả địa điểm ở Hà Nội
- Gõ "Nghĩa trang" → Tìm tất cả nghĩa trang (bất kể tỉnh nào)
- Kết hợp nhiều điều kiện để tìm chính xác hơn
```

### Bảng kết quả (Không thay đổi)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     KẾT QUẢ TRA CỨU: 3 người                            │
├────┬──────────────────┬──────────────────┬───────────────┬──────────────┤
│STT │ Họ và tên        │ Ngày mất         │ Nguyên nhân   │ Địa điểm     │
├────┼──────────────────┼──────────────────┼───────────────┼──────────────┤
│ 1  │ Nguyễn Văn Hùng  │ 15/12/2024 10:30 │ Bệnh hiểm...  │ Hỏa táng...  │
│ 2  │ Nguyễn Văn Nam   │ 15/12/2024 10:30 │ Bệnh hiểm...  │ NT Văn Điển  │
│ 3  │ Nguyễn Văn Tổ    │ 15/01/2020 10:30 │ Tuổi già      │ NT Nghệ An   │
└────┴──────────────────┴──────────────────┴───────────────┴──────────────┘
```

---

## 🎯 PHẦN 7: WORKFLOW TÌM KIẾM

### Kịch bản 1: Tìm người chết vì bệnh

```
User nhập: "Bệnh"
    ↓
Frontend gửi: GET /ketthuc/tracuu?TenNguyenNhanMat=Bệnh
    ↓
Backend xử lý:
  - WHERE nnm.TenNguyenNhanMat LIKE '%Bệnh%'
  - JOIN với bảng NGUYENNHANMAT
    ↓
Kết quả: Tất cả thành viên có nguyên nhân chứa "Bệnh"
  - "Bệnh hiểm nghèo" Sửa
  - "Bệnh tim mạch" Sửa
  - "Tuổi già" ❌
```

### Kịch bản 2: Tìm người mai táng ở Hà Nội

```
User nhập: "Hà Nội"
    ↓
Frontend gửi: GET /ketthuc/tracuu?TenDiaDiem=Hà Nội
    ↓
Backend xử lý:
  - WHERE dd.TenDiaDiem LIKE '%Hà Nội%'
  - JOIN với bảng DIADIEMMAITANG
    ↓
Kết quả: Tất cả thành viên mai táng có địa điểm chứa "Hà Nội"
  - "Nghĩa trang Văn Điển - Hà Nội" Sửa
  - "Hỏa táng Hà Nội" Sửa
  - "Nghĩa trang Nghệ An" ❌
```

### Kịch bản 3: Tìm kết hợp

```
User nhập:
  - Nguyên nhân: "Bệnh"
  - Địa điểm: "Hà Nội"
  - Từ ngày: 2024-01-01
    ↓
Frontend gửi: GET /ketthuc/tracuu?TenNguyenNhanMat=Bệnh&TenDiaDiem=Hà Nội&TuNgay=2024-01-01
    ↓
Backend xử lý:
  - WHERE nnm.TenNguyenNhanMat LIKE '%Bệnh%'
  - AND dd.TenDiaDiem LIKE '%Hà Nội%'
  - AND DATE(tv.NgayGioMat) >= '2024-01-01'
    ↓
Kết quả: Người chết vì bệnh + mai táng Hà Nội + năm 2024
```

---

## 📋 PHẦN 8: BẢNG TÓM TẮT SỬA ĐỔI CODE

### 1. KetThuc.schema.ts (Thêm interface mới)

| Vị trí | Thêm/Sửa | Nội dung |
|--------|----------|----------|
| Cuối file | THÊM | Interface `TraCuuKetThucFilters` với 2 trường mới: `TenNguyenNhanMat?`, `TenDiaDiem?` |

### 2. ketthuc.services.ts (Sửa method traCuuKetThuc)

| Dòng | Thêm/Sửa | Nội dung |
|------|----------|----------|
| 39-52 | SỬA | Thêm 2 params mới: `TenNguyenNhanMat?`, `TenDiaDiem?` |
| 54-73 | SỬA | Thêm 2 điều kiện LIKE search cho tên nguyên nhân và tên địa điểm |

### 3. ketthuc.controllers.ts (Sửa controller)

| Dòng | Thêm/Sửa | Nội dung |
|------|----------|----------|
| 30-50 | SỬA | Lấy thêm 2 query params: `TenNguyenNhanMat`, `TenDiaDiem` |
| 30-50 | SỬA | Truyền 2 params mới vào service |

---

## Sửa CHECKLIST TRIỂN KHAI

```
□ SỬA KetThuc.schema.ts:
  □ Thêm interface TraCuuKetThucFilters cuối file
  □ Bao gồm TenNguyenNhanMat? và TenDiaDiem?
  
□ SỬA ketthuc.services.ts:
  □ Cập nhật comment method traCuuKetThuc (dòng 39-42)
  □ Thêm 2 params TenNguyenNhanMat?, TenDiaDiem? (dòng 44-50)
  □ Thêm logic xử lý TenNguyenNhanMat (dòng 60-65)
  □ Thêm logic xử lý TenDiaDiem (dòng 68-73)
  □ Giữ logic cũ MaNguyenNhanMat, MaDiaDiem (tương thích ngược)
  
□ SỬA ketthuc.controllers.ts:
  □ Destructure thêm TenNguyenNhanMat, TenDiaDiem từ req.query
  □ Truyền 2 params mới vào service
  
□ TEST sau khi sửa:
  □ GET /ketthuc/tracuu (tất cả) - phải có 3 người
  □ GET /ketthuc/tracuu?TenNguyenNhanMat=Bệnh - phải có 2 người
  □ GET /ketthuc/tracuu?TenNguyenNhanMat=Tuổi - phải có 1 người
  □ GET /ketthuc/tracuu?TenDiaDiem=Hà Nội - phải có 1 người
  □ GET /ketthuc/tracuu?TenDiaDiem=Nghĩa trang - phải có 2 người
  □ GET /ketthuc/tracuu?TenDiaDiem=Hỏa táng - phải có 1 người
  □ GET /ketthuc/tracuu?TenNguyenNhanMat=Bệnh&TenDiaDiem=Hà Nội - phải có 1 người
  □ GET /ketthuc/tracuu?MaNguyenNhanMat=NNM01 (API cũ) - vẫn hoạt động
```

---

## 🚀 PHẦN 9: HƯỚNG DẪN TRIỂN KHAI CHI TIẾT

### Bước 1: Backup files
```bash
# Trong thư mục backend
cp src/models/schemas/KetThuc.schema.ts backup/
cp src/services/ketthuc.services.ts backup/
cp src/controllers/ketthuc.controllers.ts backup/
```

### Bước 2: Sửa KetThuc.schema.ts
1. Mở file `src/models/schemas/KetThuc.schema.ts`
2. Kéo xuống cuối file
3. Thêm interface mới từ **PHẦN 1**

### Bước 3: Sửa ketthuc.services.ts
1. Mở file `src/services/ketthuc.services.ts`
2. Tìm method `traCuuKetThuc` (dòng ~39)
3. Thay thế theo **PHẦN 2**:
   - Sửa comment (dòng 39-42)
   - Thêm 2 params mới (dòng 44-50)
   - Thêm logic LIKE search (dòng 60-73)

### Bước 4: Sửa ketthuc.controllers.ts
1. Mở file `src/controllers/ketthuc.controllers.ts`
2. Tìm controller `traCuuKetThucController` (dòng ~30)
3. Thay thế theo **PHẦN 3**

### Bước 5: Restart server
```bash
# Server tự restart nếu dùng nodemon
# Nếu không, restart thủ công:
npm run dev
```

### Bước 6: Test API bằng VS Code REST Client hoặc Postman

**Test file: `test-ketthuc-v2.http`**
```http
### Test 1: Tra cứu tất cả
GET http://localhost:3000/ketthuc/tracuu

### Test 2: Tra cứu theo tên nguyên nhân
GET http://localhost:3000/ketthuc/tracuu?TenNguyenNhanMat=Bệnh

### Test 3: Tra cứu theo tên địa điểm
GET http://localhost:3000/ketthuc/tracuu?TenDiaDiem=Hà Nội

### Test 4: Kết hợp
GET http://localhost:3000/ketthuc/tracuu?TenNguyenNhanMat=Bệnh&TenDiaDiem=Hà Nội
```

---

## 🎯 PHẦN 10: KẾT LUẬN

### Cải tiến chính

1. Sửa **Tra cứu tất cả hoạt động bình thường** - Không có lỗi như user nghĩ
2. Sửa **Thêm tra cứu theo TÊN nguyên nhân** thay vì phải nhớ mã (NNM01, NNM02...)
3. Sửa **Thêm tra cứu theo TÊN địa điểm** thay vì phải nhớ mã (DD01, DD02...)
4. Sửa **LIKE search linh hoạt** - Gõ "Bệnh" tìm "Bệnh hiểm nghèo", gõ "Hà Nội" tìm tất cả địa điểm ở Hà Nội
5. Sửa **Tương thích ngược** - API cũ (MaNguyenNhanMat, MaDiaDiem) vẫn hoạt động
6. Sửa **Sửa URL** từ `localhost:4000` → `localhost:3000` trong tài liệu

### Lợi ích

- 🚀 **UX tốt hơn**: User không cần nhớ mã, chỉ cần gõ từ khóa
- 🔍 **Tìm kiếm linh hoạt**: LIKE search cho phép tìm một phần
- 🔄 **Không breaking change**: API cũ vẫn dùng được
- 📊 **Dữ liệu chính xác**: Chỉ tìm trong bảng NGUYENNHANMAT và DIADIEMMAITANG (đã có sẵn)

### Các trường hợp test thực tế

| Input | Output | Số kết quả |
|-------|--------|------------|
| (Không filter) | Tất cả | 3 |
| TenNguyenNhanMat=Bệnh | "Bệnh hiểm nghèo" | 2 |
| TenNguyenNhanMat=Tuổi | "Tuổi già" | 1 |
| TenDiaDiem=Hà Nội | "...Hà Nội" | 1 |
| TenDiaDiem=Nghĩa trang | "Nghĩa trang..." | 2 |
| TenDiaDiem=Hỏa táng | "Hỏa táng..." | 1 |
| TenNguyenNhanMat=Bệnh + TenDiaDiem=Hà Nội | Giao của 2 điều kiện | 1 |

Chúc bạn triển khai thành công! 🎉
