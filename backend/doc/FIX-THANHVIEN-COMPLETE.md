# Hướng Dẫn Sửa Toàn Bộ Code ThanhVien Theo Database Schema Mới

## 📋 Tóm Tắt Vấn Đề

Sau khi cập nhật database schema trong `init.sql`, có nhiều thay đổi quan trọng về bảng `THANHVIEN`:

1. ❌ **Cột `MaGioiTinh` đã bị XÓA** → ✅ Thay bằng `GioiTinh VARCHAR(3)` với giá trị `'Nam'`/`'Nữ'`
2. ❌ **Bảng `GIOITINH` KHÔNG TỒN TẠI** trong init.sql → Cần xóa route lookups cho giới tính
3. ❌ **Bảng `CAYGIAPHAT` sai tên** → ✅ Đúng là `CAYGIAPHA` trong init.sql
4. ⚠️ **Thiếu cột `TrangThai`** trong ThanhVienRow interface

---

## 🔍 Kiểm Tra Schema THANHVIEN Trong Database

Từ file `init.sql`, bảng `THANHVIEN` có cấu trúc:

```sql
CREATE TABLE THANHVIEN (
    MaTV VARCHAR(5) PRIMARY KEY,
    HoTen VARCHAR(50),
    NgayGioSinh DATETIME,
    DiaChi VARCHAR(50),
    TrangThai VARCHAR(20) DEFAULT 'Còn Sống',  -- ✅ CÓ CỘT NÀY
    TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    DOI	INT DEFAULT 0,
    MaQueQuan VARCHAR(5),
    MaNgheNghiep VARCHAR(5),
    GioiTinh VARCHAR(3), -- Nam/Nữ  ✅ KHÔNG PHẢI MaGioiTinh
    MaNguyenNhanMat VARCHAR(5),
    NgayGioMat DATETIME,
    MaDiaDiem VARCHAR(5),
    MaGiaPha VARCHAR(5),
    FOREIGN KEY(MaQueQuan) REFERENCES QUEQUAN(MaQueQuan),
    FOREIGN KEY(MaNgheNghiep) REFERENCES NGHENGHIEP(MaNgheNghiep),
    FOREIGN KEY(MaNguyenNhanMat) REFERENCES NGUYENNHANMAT(MaNguyenNhanMat),
    FOREIGN KEY(MaDiaDiem) REFERENCES DIADIEMMAITANG(MaDiaDiem)
);
```

**Lưu ý:**
- ❌ KHÔNG có cột `MaGioiTinh`
- ✅ CÓ cột `GioiTinh` - VARCHAR(3) - giá trị: `'Nam'` hoặc `'Nữ'`
- ✅ CÓ cột `TrangThai` - VARCHAR(20) - mặc định: `'Còn Sống'`

---

## 📂 Danh Sách File Cần Sửa

### ✅ File Đã Sửa Đúng
- `src/models/schemas/ThanhVien.schema.ts` - ✅ Đã dùng `GioiTinh`
- `src/services/users.services.ts` - ✅ Đã dùng `GioiTinh` trong hàm register

### ❌ File Cần Sửa
1. `src/services/thanhvien.services.ts` - ❌ Vẫn dùng `MaGioiTinh`
2. `src/controllers/thanhvien.controllers.ts` - ❌ Vẫn dùng `MaGioiTinh`
3. `src/routes/lookups.routes.ts` - ❌ Query bảng `GIOITINH` không tồn tại, sai tên `CAYGIAPHAT`

---

## 🔧 Chi Tiết Sửa Từng File

### 1️⃣ File: `src/services/thanhvien.services.ts`

#### ❌ Lỗi 1: Interface ThanhVienRow sai (Dòng 6-17)

**Code hiện tại:**
```typescript
interface ThanhVienRow extends RowDataPacket {
  MaTV: string;
  HoTen: string;
  NgayGioSinh: Date;
  DiaChi: string;
  TrangThai: string;
  TGTaoMoi: Date;
  DOI: number;
  MaQueQuan: string;
  MaNgheNghiep: string;
  MaGioiTinh: string;  // ❌ SAI: Không có cột này trong DB
  MaGiaPha: string | null;
}
```

**Code cần sửa thành:**
```typescript
interface ThanhVienRow extends RowDataPacket {
  MaTV: string;
  HoTen: string;
  NgayGioSinh: Date;
  DiaChi: string;
  TrangThai: string;
  TGTaoMoi: Date;
  DOI: number;
  MaQueQuan: string;
  MaNgheNghiep: string;
  GioiTinh: string;  // ✅ ĐÚNG: VARCHAR(3) - 'Nam'/'Nữ'
  MaNguyenNhanMat: string | null;  // ✅ THÊM: Cột này có trong DB
  NgayGioMat: Date | null;  // ✅ THÊM: Cột này có trong DB
  MaDiaDiem: string | null;  // ✅ THÊM: Cột này có trong DB
  MaGiaPha: string | null;
}
```

---

#### ❌ Lỗi 2: Hàm register() sai parameter và SQL (Dòng 21-31)

**Code hiện tại:**
```typescript
async register(payload: {
  HoTen: string;
  NgayGioSinh: Date;
  DiaChi: string;
  MaQueQuan: string;
  MaNgheNghiep: string;
  MaGioiTinh: string;  // ❌ SAI
  MaGiaPha?: string;
}) {
```

**Code cần sửa thành:**
```typescript
async register(payload: {
  HoTen: string;
  NgayGioSinh: Date;
  DiaChi: string;
  MaQueQuan: string;
  MaNgheNghiep: string;
  GioiTinh: string;  // ✅ ĐÚNG: 'Nam' hoặc 'Nữ'
  MaGiaPha?: string;
}) {
```

---

#### ❌ Lỗi 3: SQL INSERT sai cột (Dòng 34-38)

**Code hiện tại:**
```typescript
const sql = `
  INSERT INTO THANHVIEN (
    HoTen, NgayGioSinh, DiaChi, TrangThai, 
    DOI, MaQueQuan, MaNgheNghiep, MaGioiTinh, MaGiaPha
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
```

**Code cần sửa thành:**
```typescript
const sql = `
  INSERT INTO THANHVIEN (
    HoTen, NgayGioSinh, DiaChi, TrangThai, 
    DOI, MaQueQuan, MaNgheNghiep, GioiTinh, MaGiaPha
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
```

---

#### ❌ Lỗi 4: Params array sai (Dòng 40-50)

**Code hiện tại:**
```typescript
const params = [
  thanhvien.HoTen,
  thanhvien.NgayGioSinh,
  thanhvien.DiaChi,
  thanhvien.TrangThai,
  thanhvien.DOI,
  thanhvien.MaQueQuan,
  thanhvien.MaNgheNghiep,
  thanhvien.MaGioiTinh,  // ❌ SAI
  thanhvien.MaGiaPha || null
];
```

**Code cần sửa thành:**
```typescript
const params = [
  thanhvien.HoTen,
  thanhvien.NgayGioSinh,
  thanhvien.DiaChi,
  thanhvien.TrangThai,
  thanhvien.DOI,
  thanhvien.MaQueQuan,
  thanhvien.MaNgheNghiep,
  thanhvien.GioiTinh,  // ✅ ĐÚNG
  thanhvien.MaGiaPha || null
];
```

---

#### ✅ Cải thiện: Thêm các trường update cho MaNguyenNhanMat, NgayGioMat, MaDiaDiem (Dòng 89-120)

**Code hiện tại:** (chỉ update một số field)
```typescript
async updateThanhVien(MaTV: string, payload: Partial<ThanhVien>) {
  const fields: string[] = [];
  const values: any[] = [];

  if (payload.HoTen !== undefined) {
    fields.push('HoTen = ?');
    values.push(payload.HoTen);
  }
  if (payload.NgayGioSinh !== undefined) {
    fields.push('NgayGioSinh = ?');
    values.push(payload.NgayGioSinh);
  }
  if (payload.DiaChi !== undefined) {
    fields.push('DiaChi = ?');
    values.push(payload.DiaChi);
  }
  if (payload.MaQueQuan !== undefined) {
    fields.push('MaQueQuan = ?');
    values.push(payload.MaQueQuan);
  }
  if (payload.MaNgheNghiep !== undefined) {
    fields.push('MaNgheNghiep = ?');
    values.push(payload.MaNgheNghiep);
  }
  if (payload.MaGiaPha !== undefined) {
    fields.push('MaGiaPha = ?');
    values.push(payload.MaGiaPha);
  }
  
  // ❌ THIẾU: GioiTinh, MaNguyenNhanMat, NgayGioMat, MaDiaDiem

  if (fields.length === 0) {
    throw new Error('Không có trường nào để cập nhật');
  }

  values.push(MaTV);
  const sql = `UPDATE THANHVIEN SET ${fields.join(', ')} WHERE MaTV = ?`;
  const result = await databaseService.query<ResultSetHeader>(sql, values);

  return {
    message: 'Cập nhật thành công',
    affectedRows: result.affectedRows
  };
}
```

**Code cần sửa thành:** (thêm các field còn thiếu)
```typescript
async updateThanhVien(MaTV: string, payload: Partial<ThanhVien>) {
  const fields: string[] = [];
  const values: any[] = [];

  if (payload.HoTen !== undefined) {
    fields.push('HoTen = ?');
    values.push(payload.HoTen);
  }
  if (payload.NgayGioSinh !== undefined) {
    fields.push('NgayGioSinh = ?');
    values.push(payload.NgayGioSinh);
  }
  if (payload.DiaChi !== undefined) {
    fields.push('DiaChi = ?');
    values.push(payload.DiaChi);
  }
  if (payload.MaQueQuan !== undefined) {
    fields.push('MaQueQuan = ?');
    values.push(payload.MaQueQuan);
  }
  if (payload.MaNgheNghiep !== undefined) {
    fields.push('MaNgheNghiep = ?');
    values.push(payload.MaNgheNghiep);
  }
  if (payload.GioiTinh !== undefined) {  // ✅ THÊM
    fields.push('GioiTinh = ?');
    values.push(payload.GioiTinh);
  }
  if (payload.MaNguyenNhanMat !== undefined) {  // ✅ THÊM
    fields.push('MaNguyenNhanMat = ?');
    values.push(payload.MaNguyenNhanMat);
  }
  if (payload.NgayGioMat !== undefined) {  // ✅ THÊM
    fields.push('NgayGioMat = ?');
    values.push(payload.NgayGioMat);
  }
  if (payload.MaDiaDiem !== undefined) {  // ✅ THÊM
    fields.push('MaDiaDiem = ?');
    values.push(payload.MaDiaDiem);
  }
  if (payload.MaGiaPha !== undefined) {
    fields.push('MaGiaPha = ?');
    values.push(payload.MaGiaPha);
  }

  if (fields.length === 0) {
    throw new Error('Không có trường nào để cập nhật');
  }

  values.push(MaTV);
  const sql = `UPDATE THANHVIEN SET ${fields.join(', ')} WHERE MaTV = ?`;
  const result = await databaseService.query<ResultSetHeader>(sql, values);

  return {
    message: 'Cập nhật thành công',
    affectedRows: result.affectedRows
  };
}
```

---

### 2️⃣ File: `src/controllers/thanhvien.controllers.ts`

#### ❌ Lỗi: Controller nhận sai parameter (Dòng 7)

**Code hiện tại:**
```typescript
export const registerController = async (req: Request, res: Response) => {
  const { HoTen, NgayGioSinh, DiaChi, MaQueQuan, MaNgheNghiep, MaGioiTinh, MaGiaPha } = req.body;  // ❌ SAI

  try {
    const result = await thanhvienService.register({
      HoTen,
      NgayGioSinh: new Date(NgayGioSinh),
      DiaChi,
      MaQueQuan,
      MaNgheNghiep,
      MaGioiTinh,  // ❌ SAI
      MaGiaPha
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Lỗi register:', error);
    return res.status(400).json({
      message: 'Đăng ký thất bại',
      error: error.message
    });
  }
};
```

**Code cần sửa thành:**
```typescript
export const registerController = async (req: Request, res: Response) => {
  const { HoTen, NgayGioSinh, DiaChi, MaQueQuan, MaNgheNghiep, GioiTinh, MaGiaPha } = req.body;  // ✅ ĐÚNG

  try {
    const result = await thanhvienService.register({
      HoTen,
      NgayGioSinh: new Date(NgayGioSinh),
      DiaChi,
      MaQueQuan,
      MaNgheNghiep,
      GioiTinh,  // ✅ ĐÚNG: 'Nam' hoặc 'Nữ'
      MaGiaPha
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Lỗi register:', error);
    return res.status(400).json({
      message: 'Đăng ký thất bại',
      error: error.message
    });
  }
};
```

---

### 3️⃣ File: `src/routes/lookups.routes.ts`

#### ❌ Lỗi 1: Query bảng GIOITINH không tồn tại (Dòng 11-25)

**Vấn đề:** Trong `init.sql` KHÔNG có bảng `GIOITINH`. Giới tính giờ là cột `GioiTinh` trong bảng `THANHVIEN` với giá trị cố định `'Nam'` hoặc `'Nữ'`.

**Code hiện tại:**
```typescript
/**
 * GET /gioitinh - Lấy danh sách giới tính
 */
lookupsRouter.get('/gioitinh', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM GIOITINH ORDER BY TenGioiTinh';  // ❌ SAI: Bảng không tồn tại
    const result = await databaseService.query(sql);
    return res.json({
      message: 'Lấy danh sách giới tính thành công',
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách giới tính',
      error
    });
  }
});
```

**Code cần sửa thành:** (trả về danh sách hardcoded)
```typescript
/**
 * GET /gioitinh - Lấy danh sách giới tính
 */
lookupsRouter.get('/gioitinh', async (req: Request, res: Response) => {
  try {
    // ✅ ĐÚNG: Trả về danh sách giới tính hardcoded vì không có bảng GIOITINH
    const result = [
      { MaGioiTinh: 'Nam', TenGioiTinh: 'Nam' },
      { MaGioiTinh: 'Nữ', TenGioiTinh: 'Nữ' }
    ];
    return res.json({
      message: 'Lấy danh sách giới tính thành công',
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách giới tính',
      error
    });
  }
});
```

**HOẶC** nếu không cần route này nữa (vì chỉ có 2 giá trị cố định), có thể **XÓA ROUTE** này hoàn toàn.

---

#### ❌ Lỗi 2: Query bảng CAYGIAPHAT sai tên (Dòng 69-81)

**Vấn đề:** Trong `init.sql`, bảng tên là `CAYGIAPHA` không phải `CAYGIAPHAT`.

**Code hiện tại:**
```typescript
/**
 * GET /caygiaphat - Lấy danh sách gia phả
 */
lookupsRouter.get('/caygiaphat', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM CAYGIAPHAT ORDER BY TenCayGiaP';  // ❌ SAI: Tên bảng sai
    const result = await databaseService.query(sql);
    return res.json({
      message: 'Lấy danh sách gia phả thành công',
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách gia phả',
      error
    });
  }
});
```

**Code cần sửa thành:**
```typescript
/**
 * GET /caygiapha - Lấy danh sách gia phả
 */
lookupsRouter.get('/caygiapha', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM CAYGIAPHA ORDER BY TenGiaPha';  // ✅ ĐÚNG: Tên bảng và cột đúng
    const result = await databaseService.query(sql);
    return res.json({
      message: 'Lấy danh sách gia phả thành công',
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách gia phả',
      error
    });
  }
});
```

**Giải thích:**
- Tên bảng: `CAYGIAPHAT` → `CAYGIAPHA`
- Tên cột: `TenCayGiaP` → `TenGiaPha`
- Route URL: `/caygiaphat` → `/caygiapha`

---

## 📊 Bảng CAYGIAPHA Schema

Từ `init.sql`:
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

---

## 🧪 Test API Sau Khi Sửa

### 1. Test Đăng Ký Thành Viên
**Endpoint:** `POST http://localhost:3000/thanhvien/register`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "HoTen": "Nguyễn Văn Test",
  "NgayGioSinh": "1990-01-01",
  "DiaChi": "Hà Nội",
  "MaQueQuan": "QQ00",
  "MaNgheNghiep": "NN06",
  "GioiTinh": "Nam",
  "MaGiaPha": "GP01"
}
```

**Expected Response:** `201 Created`
```json
{
  "message": "Đăng ký thành viên thành công",
  "data": {
    "MaTV": "TV09",
    "HoTen": "Nguyễn Văn Test",
    "NgayGioSinh": "1990-01-01T00:00:00.000Z",
    "DiaChi": "Hà Nội",
    "TrangThai": "Còn Sống",
    "DOI": 0,
    "MaQueQuan": "QQ00",
    "MaNgheNghiep": "NN06",
    "GioiTinh": "Nam",
    "MaGiaPha": "GP01"
  }
}
```

---

### 2. Test Lấy Danh Sách Giới Tính
**Endpoint:** `GET http://localhost:3000/lookups/gioitinh`

**Expected Response:** `200 OK`
```json
{
  "message": "Lấy danh sách giới tính thành công",
  "result": [
    { "MaGioiTinh": "Nam", "TenGioiTinh": "Nam" },
    { "MaGioiTinh": "Nữ", "TenGioiTinh": "Nữ" }
  ]
}
```

---

### 3. Test Lấy Danh Sách Gia Phả
**Endpoint:** `GET http://localhost:3000/lookups/caygiapha`

**Expected Response:** `200 OK`
```json
{
  "message": "Lấy danh sách gia phả thành công",
  "result": [
    {
      "MaGiaPha": "GP01",
      "TenGiaPha": "Nguyễn Văn - Nghệ An",
      "NguoiLap": "TV01",
      "TGLap": "2024-12-18T10:00:00.000Z",
      "TruongToc": "TV03"
    },
    {
      "MaGiaPha": "GP02",
      "TenGiaPha": "Nguyễn Văn - Hà Nội",
      "NguoiLap": "TV02",
      "TGLap": "2024-12-18T10:00:00.000Z",
      "TruongToc": "TV02"
    }
  ]
}
```

---

### 4. Test Cập Nhật Thành Viên
**Endpoint:** `PUT http://localhost:3000/thanhvien/TV09`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "HoTen": "Nguyễn Văn Test Updated",
  "GioiTinh": "Nữ",
  "DiaChi": "TP.HCM"
}
```

**Expected Response:** `200 OK`
```json
{
  "message": "Cập nhật thành công",
  "affectedRows": 1
}
```

---

### 5. Test Cập Nhật Thành Viên Mất
**Endpoint:** `PUT http://localhost:3000/thanhvien/TV09`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "MaNguyenNhanMat": "NNM01",
  "NgayGioMat": "2024-12-18",
  "MaDiaDiem": "DD01"
}
```

**Expected Response:** `200 OK`
```json
{
  "message": "Cập nhật thành công",
  "affectedRows": 1
}
```

**Lưu ý:** Khi cập nhật `MaNguyenNhanMat`, trigger `TRG_UPDATE_TRANGTHAI_THANHVIEN_MaNguyenNhanMat` sẽ tự động đổi `TrangThai` từ `'Còn Sống'` → `'Mất'`.

---

## 🔄 Kiểm Tra Database

Kết nối vào MySQL:
```bash
docker exec -it <container_name> mysql -u root -p123456 app
```

### Query kiểm tra thành viên mới:
```sql
-- Xem thành viên vừa tạo
SELECT * FROM THANHVIEN WHERE MaTV = 'TV09';

-- Kiểm tra cột GioiTinh
SELECT MaTV, HoTen, GioiTinh, TrangThai FROM THANHVIEN;

-- Kiểm tra trigger trigger đổi trạng thái
SELECT MaTV, HoTen, TrangThai, MaNguyenNhanMat FROM THANHVIEN WHERE MaNguyenNhanMat IS NOT NULL;
```

---

## 📝 Tóm Tắt Các Thay Đổi

| File | Vị trí | Thay đổi | Lý do |
|------|--------|----------|-------|
| `services/thanhvien.services.ts` | Dòng 16 | `MaGioiTinh` → `GioiTinh` | Cột đổi tên trong DB |
| `services/thanhvien.services.ts` | Dòng 15-17 | Thêm `MaNguyenNhanMat`, `NgayGioMat`, `MaDiaDiem` | Cột có trong DB nhưng thiếu trong interface |
| `services/thanhvien.services.ts` | Dòng 28 | `MaGioiTinh: string` → `GioiTinh: string` | Cột đổi tên |
| `services/thanhvien.services.ts` | Dòng 37 | `MaGioiTinh` → `GioiTinh` trong SQL | Tên cột sai |
| `services/thanhvien.services.ts` | Dòng 49 | `thanhvien.MaGioiTinh` → `thanhvien.GioiTinh` | Property sai |
| `services/thanhvien.services.ts` | Dòng 106-118 | Thêm update cho `GioiTinh`, `MaNguyenNhanMat`, `NgayGioMat`, `MaDiaDiem` | Thiếu các field này |
| `controllers/thanhvien.controllers.ts` | Dòng 7 | `MaGioiTinh` → `GioiTinh` trong destructuring | Parameter sai |
| `controllers/thanhvien.controllers.ts` | Dòng 16 | `MaGioiTinh` → `GioiTinh` trong service call | Property sai |
| `routes/lookups.routes.ts` | Dòng 13 | `FROM GIOITINH` → Return hardcoded array | Bảng không tồn tại |
| `routes/lookups.routes.ts` | Dòng 70 | `FROM CAYGIAPHAT` → `FROM CAYGIAPHA` | Tên bảng sai |
| `routes/lookups.routes.ts` | Dòng 70 | `ORDER BY TenCayGiaP` → `ORDER BY TenGiaPha` | Tên cột sai |
| `routes/lookups.routes.ts` | Dòng 69 | `/caygiaphat` → `/caygiapha` | Route URL sai |

---

## ⚠️ Lưu Ý Quan Trọng

1. **Backup Database** trước khi test
2. **Restart Backend Server** sau khi sửa code: `npm run dev`
3. **Xóa dữ liệu test** nếu cần:
   ```sql
   DELETE FROM THANHVIEN WHERE MaTV = 'TV09';
   ```
4. **Kiểm tra .env** để đảm bảo database connection đúng
5. **Test từng API endpoint** sau khi sửa
6. **Kiểm tra trigger** `TRG_UPDATE_TRANGTHAI_THANHVIEN_MaNguyenNhanMat` hoạt động đúng khi update `MaNguyenNhanMat`

---

## 🚀 Next Steps

Sau khi sửa xong các file trên:

1. ✅ Sửa `services/thanhvien.services.ts`
2. ✅ Sửa `controllers/thanhvien.controllers.ts`
3. ✅ Sửa `routes/lookups.routes.ts`
4. 🔄 Restart server: `npm run dev`
5. 🧪 Test từng API endpoint
6. ✅ Verify database có dữ liệu đúng
7. 📝 Update Postman collection (nếu có)

---

## 📚 Tài Liệu Tham Khảo

- [init.sql](../init.sql) - Database schema chính thức
- [FIX-ACCOUNT-FEATURES.md](./FIX-ACCOUNT-FEATURES.md) - Hướng dẫn sửa account features
- [ThanhVien.schema.ts](../src/models/schemas/ThanhVien.schema.ts) - Schema model

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** 18/12/2025  
**Mục đích:** Hướng dẫn sửa toàn bộ code ThanhVien theo database schema mới
