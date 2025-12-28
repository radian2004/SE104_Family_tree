# 🚀 HƯỚNG DẪN NHANH: CẬP NHẬT TRƯỞNG TỘC

## 📋 TÓM TẮT THAY ĐỔI

Endpoint `PATCH /api/thanhvien/:MaTV/gia-pha` đã được **ĐỔI THÀNH** endpoint mới:

| | **CŨ** | **MỚI** |
|---|--------|---------|
| **Endpoint** | `PATCH /thanhvien/:MaTV/gia-pha` | `PATCH /thanhvien/truong-toc` |
| **Chức năng** | Cập nhật mã gia phả thành viên | **Cập nhật trưởng tộc gia phả** |
| **Bảng** | `THANHVIEN` | `CAYGIAPHA` |
| **Trường** | `MaGiaPha` | `TruongToc` |
| **Body** | `{ "MaGiaPha": "GP02" }` | `{ "MaGiaPha": "GP02", "MaTVTruongTocMoi": "TV04" }` |
| **Quyền** | Admin hoặc Owner | **CHỈ ADMIN** |

---

## 🔧 CÁC FILE CẦN SỬA

### 1️⃣ Service (`thanhvien.services.ts`)

**XÓA method cũ:**
```typescript
async capNhatMaGiaPhaThanhVien(MaTV: string, MaGiaPha: string)
```

**THÊM method mới:**
```typescript
async capNhatTruongTocGiaPha(MaGiaPha: string, MaTVTruongTocMoi: string) {
  // 1. Kiểm tra gia phả có tồn tại không
  const giaPhaExists = await this.checkGiaPhaExists(MaGiaPha);
  if (!giaPhaExists) {
    throw new Error(`Không tìm thấy gia phả với mã: ${MaGiaPha}`);
  }
  
  // 2. Kiểm tra thành viên mới có tồn tại không
  const thanhVienMoi = await this.getThanhVienGiaPhaInfo(MaTVTruongTocMoi);
  if (!thanhVienMoi) {
    throw new Error('Không tìm thấy thành viên');
  }
  
  // 3. Kiểm tra thành viên mới có thuộc gia phả này không
  if (thanhVienMoi.MaGiaPha !== MaGiaPha) {
    throw new Error('Thành viên không thuộc gia phả này');
  }
  
  // 4. Lấy thông tin trưởng tộc hiện tại
  const sqlGetCurrent = `
    SELECT TruongToc, TenGiaPha 
    FROM CAYGIAPHA 
    WHERE MaGiaPha = ?
  `;
  
  interface CurrentTruongTocRow extends RowDataPacket {
    TruongToc: string;
    TenGiaPha: string;
  }
  
  const currentData = await databaseService.query<CurrentTruongTocRow[]>(
    sqlGetCurrent, 
    [MaGiaPha]
  );
  
  const TruongTocCu = currentData[0].TruongToc;
  const TenGiaPha = currentData[0].TenGiaPha;
  
  XÓA controller cũ:**
```typescript
export const capNhatMaGiaPhaController = ...
```

**THÊM controller mới:**
```typescript
export const capNhatTruongTocController = async (req: Request, res: Response) => {
  const { MaGiaPha, MaTVTruongTocMoi } = req.body;
  
  try {
    // Validate input
    if (!MaGiaPha) {
      return res.status(400).json({
        message: 'Thiếu thông tin',
        error: 'Trường MaGiaPha là bắt buộc'
      });
    }
    
    if (!MaTVTruongTocMoi) {
      return res.status(400).json({
        message: 'Thiếu thông tin',
        error: 'Trường MaTVTruongTocMoi là bắt buộc'
      });
    }
    
    const result = await thanhvienService.capNhatTruongTocGiaPha(MaGiaPha, MaTVTruongTocMoi);
    return res.status(200).json(result);
    
  } catch (error: any) {
    console.error('Lỗi capNhatTruongToc:', error);
    
    // Xử lý lỗi cụ thể
    if (error.message === 'Không tìm thấy thành viên') {
      return res.status(404).json({
        message: 'Không tìm thấy thành viên',
        error: error.message
      });
    }
    
    if (error.message.includes('Không tìm thấy gia phả')) {
      return res.status(404).json({
        message: 'Không tìm thấy gia phả',
        error: error.message
      });
    }
    
    if (error.message === 'Thành viên không thuộc gia phả này') {
      return res.status(400).json({
        message: 'Thành viên không thuộc gia phả',
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
    });quả
  return {
    message: 'Cập nhật trưởng tộc thành công',
    data: {
      MaGiaPha: MaGiaPha,
      TenGiaPha: TenGiaPha,
  THÊM import mới:**
```typescript
import {
  // ... các imports khác
  capNhatTruongTocController  // ⬅️ THÊM MỚI
} from '~/controllers/thanhvien.controllers';
```

**THÊM route mới (đặt trước các route có param `:MaTV`):**
```typescript
// PATCH /thanhvien/truong-toc - Cập nhật trưởng tộc (CHỈ ADMIN)
thanhvienRouter.patch('/truong-toc', requireAdmin, wrapAsync(capNhatTruongTocController));
```

**XÓA route cũ:**
```typescript
// XÓA dòng này:
// thanhvienRouter.patch('/:MaTV/gia-pha', requireAdminOrOwner, wrapAsync(capNhatMaGiaPhaController));
```

**⚠️ LƯU Ý:** Bạn cần thêm middleware `reqtruong-toc
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "MaGiaPha": "GP02",/ Trong file: backend/src/middlewares/authorization.middlewares.ts

/**
 * Middleware kiểm tra chỉ Admin mới được phép
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { TenDangNhap } = req.decoded_authorization as TokenPayload;
    
    const sql = `
      SELECT tk.MaLoaiTK 
      FROM TAIKHOAN tk 
      WHERE tk.TenDangNhap = ?
    `;
    
    const result = await databaseService.query<any[]>(sql, [TenDangNhap]);
    
    if (!result || result.length === 0) {
      return res.status(401).json({
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    const MaLoaiTK = result[0].MaLoaiTK;
    
    // Chỉ cho phép Admin (LTK01)
    if (MaLoaiTK !== 'LTK01') {
      return res.status(403).json({
        message: 'Chỉ Admin mới có quyền thực hiện chức năng này'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi kiểm tra quyền',
      error: error instanceof Error ? error.message : error
    });
  }
}## 2️⃣ Controller (`thanhvien.controllers.ts`)

**ĐỔIEndpoint mới**: `PATCH /thanhvien/truong-toc` (không có param `:MaTV`)

2. **Quyền hạn**: **CHỈ CÓ ADMIN (LTK01)** mới có quyền cập nhật trưởng tộc

3. **Request body**: Cần cả 2 trường:
   - `MaGiaPha`: Mã gia phả cần đổi trưởng tộc
   - `MaTVTruongTocMoi`: Mã thành viên sẽ làm trưởng tộc mới

4. **Trigger tự động**: Khi cập nhật `TruongToc`, trigger `TRG_UPDATE_TAIKHOAN_LOAITK_GIAPHA` sẽ tự động nâng quyền tài khoản lên `LTK02`

5. **Validation**: Thành viên mới PHẢI thuộc gia phả được chỉ định

6. **Error codes**:
   - `404`: Gia phả hoặc thành viên không tồn tại
   - `400`: Thành viên không thuộc gia phả / đã là trưởng tộc hiện tại
   - `403`: Không có quyền (không phải Admin)
  try {
    if (!MaTVTruongTocMoi) {
      return res.status(400).json({
        message: 'Thiếu thông tin',
        error: 'Trường MaTVTruongTocMoi là bắt buộc'
      });
    }
    
    const result = await thanhvienService.capNhatTruongTocGiaPha(MaTVTruongTocMoi);
    return res.status(200).json(result);
    
  } catch (error: any) {
    // Xử lý lỗi...
  }
};
```

---

### 3️⃣ Routes (`thanhvien.routes.ts`)

**ĐỔI TÊN import:**
```typescript
import {
  // ... các imports khác
  capNhatTruongTocController  // ⬅️ ĐỔI từ capNhatMaGiaPhaController
} from '~/controllers/thanhvien.controllers';

// Route giữ nguyên, chỉ đổi controller:
thanhvienRouter.patch('/:MaTV/gia-pha', 
  requireAdminOrOwner, 
  wrapAsync(capNhatTruongTocController)  // ⬅️ ĐỔI TÊN
);
```

---

## 🧪 TEST

### Request mới:
```bash
PATCH http://localhost:4000/api/thanhvien/TV02/gia-pha
ContenThêm method mới `capNhatTruongTocGiaPha()` trong `thanhvien.services.ts`
- [ ] Thêm controller mới `capNhatTruongTocController` trong `thanhvien.controllers.ts`
- [ ] Thêm middleware `requireAdmin` trong `authorization.middlewares.ts`
- [ ] Thêm route mới `PATCH /truong-toc` trong `thanhvien.routes.ts`
- [ ] Xóa route cũ `PATCH /:MaTV/gia-pha` (nếu chỉ dùng cho cập nhật trưởng tộc)
- [ ] Test với Postman/Thunder Client (nhớ dùng token Admin)
- [ ] Kiểm tra database: bảng `CAYGIAPHA`
- [ ] Kiểm tra quyền tài khoản: bảng `TAIKHOAN`
- [ ] Test các trường hợp lỗi
- [ ] Test với token không phải Admin (phải bị từ chối)
### Response thành công:
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

## 🗄️ KIỂM TRA DATABASE

```sql
-- Xem trưởng tộc đã thay đổi chưa
SELECT MaGiaPha, TenGiaPha, TruongToc 
FROM CAYGIAPHA 
WHERE MaGiaPha = 'GP02';

-- Xem quyền tài khoản của trưởng tộc mới
SELECT tv.MaTV, tv.HoTen, tk.MaLoaiTK, ltk.TenLoaiTK
FROM THANHVIEN tv 
JOIN TAIKHOAN tk ON tv.MaTV = tk.MaTV 
JOIN LOAITAIKHOAN ltk ON tk.MaLoaiTK = ltk.MaLoaiTK
WHERE tv.MaTV = 'TV04';
-- Kỳ vọng: MaLoaiTK = 'LTK02' (TruongToc)
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Trigger tự động**: Khi cập nhật `TruongToc`, trigger `TRG_UPDATE_TAIKHOAN_LOAITK_GIAPHA` sẽ tự động nâng quyền tài khoản lên `LTK02`

2. **Validation**: Thành viên mới PHẢI thuộc gia phả (có `MaGiaPha`)

3. **Param `:MaTV`**: Không được sử dụng trong logic, chỉ giữ để nhất quán với route structure

4. **Error codes**:
   - `404`: Thành viên không tồn tại / chưa thuộc gia phả
   - `400`: Thành viên đã là trưởng tộc hiện tại
   - `500`: Lỗi database

---

## ✅ CHECKLIST

- [ ] Sửa method trong `thanhvien.services.ts`
- [ ] Đổi tên controller trong `thanhvien.controllers.ts`
- [ ] Cập nhật import trong `thanhvien.routes.ts`
- [ ] Test với Postman/Thunder Client
- [ ] Kiểm tra database: bảng `CAYGIAPHA`
- [ ] Kiểm tra quyền tài khoản: bảng `TAIKHOAN`
- [ ] Test các trường hợp lỗi

---

**📚 Xem hướng dẫn chi tiết tại:** [GIA-PHA-ENDPOINTS-GUIDE.md](./GIA-PHA-ENDPOINTS-GUIDE.md)
