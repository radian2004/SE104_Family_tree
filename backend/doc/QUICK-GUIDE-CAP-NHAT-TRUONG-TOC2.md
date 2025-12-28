# 🚀 HƯỚNG DẪN: CẬP NHẬT TRƯỞNG TỘC (ADMIN ONLY)

## 📋 TÓM TẮT

Tạo endpoint mới để **Admin** cập nhật trưởng tộc của gia phả bằng cách thay đổi trường `TruongToc` trong bảng `CAYGIAPHA`.

### 🎯 YÊU CẦU:
- ✅ Chỉ **Admin** mới có quyền đổi trưởng tộc
- ✅ Endpoint **KHÔNG cần param `:MaTV`**
- ✅ Request body chứa: `MaGiaPha` và `MaTVTruongTocMoi`
- ✅ Trigger tự động nâng quyền tài khoản lên `LTK02`

---

## 🔧 THIẾT KẾ ENDPOINT

### Endpoint mới:
```
PATCH /api/thanhvien/truong-toc
```

### Phân quyền:
- Chỉ **Admin** (`requireAdmin` middleware)

### Request Body:
```json
{
  "MaGiaPha": "GP02",
  "MaTVTruongTocMoi": "TV04"
}
```

### Response thành công (200):
```json
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

---

## 🛠️ IMPLEMENTATION

### 1️⃣ Tạo Middleware requireAdmin

**File: `backend/src/middlewares/authorization.middlewares.ts`**

```typescript
/**
 * Middleware chỉ cho phép Admin
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;

    // Lấy thông tin loại tài khoản
    const sql = `
      SELECT tk.MaLoaiTK, ltk.TenLoaiTK
      FROM TAIKHOAN tk
      JOIN LOAITAIKHOAN ltk ON tk.MaLoaiTK = ltk.MaLoaiTK
      WHERE tk.TenDangNhap = ?
    `;

    interface LoaiTKRow extends RowDataPacket {
      MaLoaiTK: string;
      TenLoaiTK: string;
    }

    const rows = await databaseService.query<LoaiTKRow[]>(sql, [user_id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy tài khoản'
      });
    }

    const { MaLoaiTK } = rows[0];

    // Chỉ cho phép Admin (LTK01)
    if (MaLoaiTK !== 'LTK01') {
      return res.status(403).json({
        message: 'Chỉ Admin mới có quyền thực hiện chức năng này'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi xác thực quyền Admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
```

---

### 2️⃣ Service Method

**File: `backend/src/services/thanhvien.services.ts`**

```typescript
/**
 * Cập nhật trưởng tộc của gia phả (Admin only)
 */
async capNhatTruongTocGiaPha(MaGiaPha: string, MaTVTruongTocMoi: string) {
  // Bước 1: Kiểm tra gia phả có tồn tại không
  const sqlCheckGiaPha = `
    SELECT MaGiaPha, TenGiaPha, TruongToc 
    FROM CAYGIAPHA 
    WHERE MaGiaPha = ?
  `;

  interface GiaPhaRow extends RowDataPacket {
    MaGiaPha: string;
    TenGiaPha: string;
    TruongToc: string;
  }

  const giaPhaRows = await databaseService.query<GiaPhaRow[]>(sqlCheckGiaPha, [MaGiaPha]);

  if (!giaPhaRows || giaPhaRows.length === 0) {
    throw new Error('Không tìm thấy gia phả');
  }

  const TruongTocCu = giaPhaRows[0].TruongToc;
  const TenGiaPha = giaPhaRows[0].TenGiaPha;

  // Bước 2: Kiểm tra trưởng tộc mới có tồn tại không
  const sqlCheckThanhVien = `
    SELECT MaTV, HoTen, MaGiaPha 
    FROM THANHVIEN 
    WHERE MaTV = ?
  `;

  interface ThanhVienRow extends RowDataPacket {
    MaTV: string;
    HoTen: string;
    MaGiaPha: string | null;
  }

  const thanhVienRows = await databaseService.query<ThanhVienRow[]>(
    sqlCheckThanhVien, 
    [MaTVTruongTocMoi]
  );

  if (!thanhVienRows || thanhVienRows.length === 0) {
    throw new Error('Không tìm thấy thành viên');
  }

  const thanhVienMoi = thanhVienRows[0];

  // Bước 3: Kiểm tra thành viên mới có thuộc gia phả này không
  if (thanhVienMoi.MaGiaPha !== MaGiaPha) {
    throw new Error('Thành viên không thuộc gia phả này');
  }

  // Bước 4: Kiểm tra xem có phải đang là trưởng tộc hiện tại không
  if (TruongTocCu === MaTVTruongTocMoi) {
    throw new Error('Thành viên này đã là trưởng tộc hiện tại');
  }

  // Bước 5: Lấy tên trưởng tộc cũ
  const sqlGetTenCu = 'SELECT HoTen FROM THANHVIEN WHERE MaTV = ?';
  const tenCuRows = await databaseService.query<ThanhVienRow[]>(sqlGetTenCu, [TruongTocCu]);
  const TenTruongTocCu = tenCuRows.length > 0 ? tenCuRows[0].HoTen : 'Không rõ';

  // Bước 6: Cập nhật trưởng tộc mới
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

  // Bước 7: Trả về kết quả
  // Trigger TRG_UPDATE_TAIKHOAN_LOAITK_GIAPHA sẽ tự động 
  // cập nhật quyền tài khoản lên LTK02
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
```

---

### 3️⃣ Controller

**File: `backend/src/controllers/thanhvien.controllers.ts`**

```typescript
/**
 * Controller cập nhật trưởng tộc của gia phả (Admin only)
 * PATCH /api/thanhvien/truong-toc
 */
export const capNhatTruongTocController = async (req: Request, res: Response) => {
  const { MaGiaPha, MaTVTruongTocMoi } = req.body;

  try {
    // Validate input
    if (!MaGiaPha || !MaTVTruongTocMoi) {
      return res.status(400).json({
        message: 'Thiếu thông tin',
        error: 'Các trường MaGiaPha và MaTVTruongTocMoi là bắt buộc'
      });
    }

    const result = await thanhvienService.capNhatTruongTocGiaPha(
      MaGiaPha,
      MaTVTruongTocMoi
    );

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Lỗi capNhatTruongToc:', error);

    // Xử lý lỗi cụ thể
    if (error.message === 'Không tìm thấy gia phả') {
      return res.status(404).json({
        message: 'Không tìm thấy gia phả',
        error: error.message
      });
    }

    if (error.message === 'Không tìm thấy thành viên') {
      return res.status(404).json({
        message: 'Không tìm thấy thành viên',
        error: error.message
      });
    }

    if (error.message === 'Thành viên không thuộc gia phả này') {
      return res.status(400).json({
        message: 'Thành viên không hợp lệ',
        error: error.message
      });
    }

    if (error.message === 'Thành viên này đã là trưởng tộc hiện tại') {
      return res.status(400).json({
        message: 'Thành viên đã là trưởng tộc',
        error: error.message
      });
    }

    return res.status(500).json({
      message: 'Cập nhật trưởng tộc thất bại',
      error: error.message
    });
  }
};
```

---

### 4️⃣ Routes

**File: `backend/src/routes/thanhvien.routes.ts`**

**Thêm import middleware:**
```typescript
import { 
  requireAdmin,           // ⬅️ THÊM MỚI
  requireAdminOrOwner, 
  checkUpdateMemberPermission, 
  checkDeleteMemberPermission,
  attachUserInfoMiddleware
} from '~/middlewares/authorization.middlewares';
```

**Thêm route mới (đặt TRƯỚC các routes có param `:MaTV`):**
```typescript
// ========================================
// ROUTES DÀNH CHO ADMIN
// ========================================

// PATCH /thanhvien/truong-toc - Cập nhật trưởng tộc (ADMIN ONLY)
thanhvienRouter.patch('/truong-toc', requireAdmin, wrapAsync(capNhatTruongTocController));
```

**Vị trí đặt route:**
```typescript
// ... các routes khác ...

// GET /thanhvien/gia-pha/danh-sach - Lấy danh sách gia phả
thanhvienRouter.get('/gia-pha/danh-sach', attachUserInfoMiddleware, wrapAsync(getAllGiaPhaController));

// PATCH /thanhvien/truong-toc - Cập nhật trưởng tộc (ADMIN ONLY)  ⬅️ THÊM Ở ĐÂY
thanhvienRouter.patch('/truong-toc', requireAdmin, wrapAsync(capNhatTruongTocController));

// GET /thanhvien - Lấy tất cả thành viên
thanhvienRouter.get('/', attachUserInfoMiddleware, wrapAsync(getAllThanhVienController));

// ... các routes còn lại ...
```

---

## 🧪 TESTING

### Test Case 1: Cập nhật thành công

**Request:**
```bash
PATCH http://localhost:4000/api/thanhvien/truong-toc
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "MaGiaPha": "GP02",
  "MaTVTruongTocMoi": "TV04"
}
```

**Response (200 OK):**
```json
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

---

### Test Case 2: Không phải Admin

**Request:**
```bash
PATCH http://localhost:4000/api/thanhvien/truong-toc
Authorization: Bearer <user_or_owner_token>
Content-Type: application/json

{
  "MaGiaPha": "GP02",
  "MaTVTruongTocMoi": "TV04"
}
```

**Response (403 Forbidden):**
```json
{
  "message": "Chỉ Admin mới có quyền thực hiện chức năng này"
}
```

---

### Test Case 3: Thiếu thông tin

**Request:**
```bash
PATCH http://localhost:4000/api/thanhvien/truong-toc
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "MaGiaPha": "GP02"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Thiếu thông tin",
  "error": "Các trường MaGiaPha và MaTVTruongTocMoi là bắt buộc"
}
```

---

### Test Case 4: Gia phả không tồn tại

**Request:**
```bash
PATCH http://localhost:4000/api/thanhvien/truong-toc
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "MaGiaPha": "GP99",
  "MaTVTruongTocMoi": "TV04"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Không tìm thấy gia phả",
  "error": "Không tìm thấy gia phả"
}
```

---

### Test Case 5: Thành viên không thuộc gia phả

**Request:**
```bash
PATCH http://localhost:4000/api/thanhvien/truong-toc
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "MaGiaPha": "GP02",
  "MaTVTruongTocMoi": "TV01"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Thành viên không hợp lệ",
  "error": "Thành viên không thuộc gia phả này"
}
```

---

### Test Case 6: Đã là trưởng tộc hiện tại

**Request:**
```bash
PATCH http://localhost:4000/api/thanhvien/truong-toc
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "MaGiaPha": "GP02",
  "MaTVTruongTocMoi": "TV02"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Thành viên đã là trưởng tộc",
  "error": "Thành viên này đã là trưởng tộc hiện tại"
}
```

---

## 🗄️ KIỂM TRA DATABASE

### Kiểm tra trưởng tộc đã thay đổi:
```sql
SELECT MaGiaPha, TenGiaPha, TruongToc 
FROM CAYGIAPHA 
WHERE MaGiaPha = 'GP02';
```

### Kiểm tra quyền tài khoản:
```sql
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
WHERE tv.MaTV = 'TV04';
```

**Kỳ vọng:** `MaLoaiTK = 'LTK02'` (TruongToc)

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Phân quyền
- ✅ Chỉ **Admin** (`LTK01`) mới được phép đổi trưởng tộc
- ❌ Owner (`LTK02`) và User (`LTK03`) **KHÔNG** có quyền

### 2. Trigger tự động
Khi cập nhật `TruongToc`, trigger `TRG_UPDATE_TAIKHOAN_LOAITK_GIAPHA` sẽ:
- Tự động cập nhật `MaLoaiTK = 'LTK02'` cho tài khoản của trưởng tộc mới
- Chỉ áp dụng nếu thành viên có tài khoản

### 3. Validation
- Gia phả phải tồn tại (`MaGiaPha` trong `CAYGIAPHA`)
- Thành viên mới phải tồn tại (`MaTVTruongTocMoi` trong `THANHVIEN`)
- Thành viên mới phải thuộc gia phả đó (`MaGiaPha` phải khớp)
- Không được trùng với trưởng tộc hiện tại

### 4. Endpoint design
- ✅ Đúng: `PATCH /api/thanhvien/truong-toc`
- ❌ Sai: `PATCH /api/thanhvien/:MaTV/gia-pha` (không cần param MaTV)

---

## ✅ CHECKLIST TRIỂN KHAI

### Backend Implementation:
- [ ] Tạo middleware `requireAdmin` trong `authorization.middlewares.ts`
- [ ] Thêm method `capNhatTruongTocGiaPha(MaGiaPha, MaTVTruongTocMoi)` vào `thanhvien.services.ts`
- [ ] Tạo controller `capNhatTruongTocController` trong `thanhvien.controllers.ts`
- [ ] Thêm route `PATCH /truong-toc` vào `thanhvien.routes.ts`
- [ ] Export middleware `requireAdmin` từ `authorization.middlewares.ts`
- [ ] Export controller `capNhatTruongTocController` từ `thanhvien.controllers.ts`

### Testing:
- [ ] Test với Admin token → thành công
- [ ] Test với Owner/User token → 403 Forbidden
- [ ] Test thiếu MaGiaPha → 400 Bad Request
- [ ] Test thiếu MaTVTruongTocMoi → 400 Bad Request
- [ ] Test MaGiaPha không tồn tại → 404 Not Found
- [ ] Test thành viên không thuộc gia phả → 400 Bad Request
- [ ] Test thành viên đã là trưởng tộc → 400 Bad Request

### Database Verification:
- [ ] Kiểm tra bảng `CAYGIAPHA` - trường `TruongToc` đã thay đổi
- [ ] Kiểm tra bảng `TAIKHOAN` - `MaLoaiTK` của trưởng tộc mới = `LTK02`

---

## 📊 SO SÁNH VỚI THIẾT KẾ CŨ

| Khía cạnh | Thiết kế cũ (SAI) | Thiết kế mới (ĐÚNG) |
|-----------|------------------|---------------------|
| **Endpoint** | `PATCH /:MaTV/gia-pha` | `PATCH /truong-toc` |
| **Param** | Cần `:MaTV` | Không cần param |
| **Body** | `{ "MaTVTruongTocMoi": "..." }` | `{ "MaGiaPha": "...", "MaTVTruongTocMoi": "..." }` |
| **Phân quyền** | Admin hoặc Owner | **Admin only** |
| **Middleware** | `requireAdminOrOwner` | `requireAdmin` |
| **Logic** | Không rõ ràng | Rõ ràng, đầy đủ validation |

---

## 🎯 TÓM TẮT NHANH

```typescript
// 1. Middleware
export const requireAdmin = async (req, res, next) => { /* chỉ cho phép LTK01 */ };

// 2. Service
async capNhatTruongTocGiaPha(MaGiaPha: string, MaTVTruongTocMoi: string) {
  // Validate gia phả, thành viên, thuộc gia phả, không trùng
  // UPDATE CAYGIAPHA SET TruongToc = ? WHERE MaGiaPha = ?
}

// 3. Controller
export const capNhatTruongTocController = async (req, res) => {
  const { MaGiaPha, MaTVTruongTocMoi } = req.body;
  // Gọi service
};

// 4. Route
thanhvienRouter.patch('/truong-toc', requireAdmin, wrapAsync(capNhatTruongTocController));
```

---

**🎉 HOÀN TẤT! 🎉**

Thiết kế này đảm bảo:
- ✅ Chỉ Admin có quyền
- ✅ Endpoint rõ ràng, không cần param MaTV
- ✅ Request body đầy đủ thông tin
- ✅ Validation chặt chẽ
- ✅ Trigger tự động cập nhật quyền
