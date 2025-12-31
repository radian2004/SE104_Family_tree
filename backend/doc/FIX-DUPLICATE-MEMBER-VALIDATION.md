# 🛡️ Fix Lỗi Validation - Ngăn Chặn Thêm Thành Viên Trùng Lặp

> **Ngày tạo:** 21/12/2024  
> **Vấn đề:** Hệ thống cho phép thêm cùng một người nhiều lần (cùng tên, ngày sinh, cha/mẹ)  
> **Mức độ:** 🔴 **NGHIÊM TRỌNG** - Logic nghiệp vụ sai

---

## 🐛 Mô Tả Vấn Đề

### Tình Huống Hiện Tại (SAI)

Với request body:
```json
{
  "HoTen": "Nguyễn Văn Mới",
  "NgayGioSinh": "2024-01-15 10:30:00",
  "GioiTinh": "Nam",
  "DiaChi": "Hà Nội",
  "MaQueQuan": "QQ00",
  "MaNgheNghiep": null,
  "MaTVCu": "TV04",
  "LoaiQuanHe": "Con cái",
  "NgayPhatSinh": "2024-01-20"
}
```

**Nếu gửi request này 10 lần**, hệ thống sẽ tạo ra:
- TV09: Nguyễn Văn Mới, sinh 2024-01-15, con của TV04
- TV10: Nguyễn Văn Mới, sinh 2024-01-15, con của TV04
- TV11: Nguyễn Văn Mới, sinh 2024-01-15, con của TV04
- ...
- TV18: Nguyễn Văn Mới, sinh 2024-01-15, con của TV04

→ **10 người con giống hệt nhau!** ❌

### Vấn Đề Logic Nghiệp Vụ

1. ❌ Một cha/mẹ **không thể có 2 con cùng tên, cùng ngày sinh**
2. ❌ Một người **không thể được "ghi nhận khai sinh" 2 lần**
3. ❌ Một cặp vợ chồng **không thể kết hôn 2 lần** (trừ khi đã ly hôn)

---

## Sửa Giải Pháp

### Chiến Lược Validation

Cần kiểm tra **trùng lặp** trước khi INSERT thành viên mới:

#### 1. Đối với quan hệ "Con cái"
Kiểm tra xem cha/mẹ đã có con với thông tin giống hệt chưa:
- **Điều kiện:** Cùng `MaTVCu` (cha/mẹ) + Cùng `HoTen` + Cùng `NgayGioSinh`
- **Nếu trùng:** Trả về lỗi "Đã tồn tại con cùng tên và ngày sinh"

#### 2. Đối với quan hệ "Vợ/Chồng"  
Đã được kiểm tra (có code `checkExistingSpouse`) nhưng **chưa đủ**:
- Sửa **Hiện tại:** Kiểm tra thành viên cũ có vợ/chồng chưa
- ❌ **Thiếu:** Kiểm tra người mới có phải là người đã tồn tại trong hệ thống chưa

---

## 🔨 Hướng Dẫn Sửa Code

### BƯỚC 1: Thêm Method Kiểm Tra Trùng Lặp Trong Service

**File:** `backend/src/services/thanhvien.services.ts`

**Vị trí:** Thêm method mới sau method `checkExistingSpouse` (khoảng dòng 180)

```typescript
  /**
   * Kiểm tra thành viên con đã tồn tại chưa
   * Dựa trên: HoTen + NgayGioSinh + MaTVCha/MaTVMe
   */
  async checkDuplicateChild(
    HoTen: string, 
    NgayGioSinh: string, 
    MaTVCha: string | null,
    MaTVMe: string | null
  ): Promise<boolean> {
    let sql = '';
    let params: any[] = [];
    
    if (MaTVCha) {
      // Kiểm tra con của cha
      sql = `
        SELECT COUNT(*) as count
        FROM THANHVIEN tv
        INNER JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
        WHERE tv.HoTen = ? 
          AND DATE(tv.NgayGioSinh) = DATE(?)
          AND qhc.MaTVCha = ?
      `;
      params = [HoTen, NgayGioSinh, MaTVCha];
    } else if (MaTVMe) {
      // Kiểm tra con của mẹ
      sql = `
        SELECT COUNT(*) as count
        FROM THANHVIEN tv
        INNER JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
        WHERE tv.HoTen = ? 
          AND DATE(tv.NgayGioSinh) = DATE(?)
          AND qhc.MaTVMe = ?
      `;
      params = [HoTen, NgayGioSinh, MaTVMe];
    } else {
      return false; // Không có cha/mẹ thì không kiểm tra được
    }
    
    const rows = await databaseService.query<any[]>(sql, params);
    return rows[0]?.count > 0;
  }

  /**
   * Kiểm tra thành viên vợ/chồng đã tồn tại chưa
   * Dựa trên: HoTen + NgayGioSinh + GioiTinh
   */
  async checkDuplicatePerson(
    HoTen: string, 
    NgayGioSinh: string,
    GioiTinh: string
  ): Promise<{ exists: boolean; MaTV?: string }> {
    const sql = `
      SELECT MaTV
      FROM THANHVIEN
      WHERE HoTen = ? 
        AND DATE(NgayGioSinh) = DATE(?)
        AND GioiTinh = ?
      LIMIT 1
    `;
    
    const rows = await databaseService.query<ThanhVienRow[]>(
      sql, 
      [HoTen, NgayGioSinh, GioiTinh]
    );
    
    if (rows.length > 0) {
      return { exists: true, MaTV: rows[0].MaTV };
    }
    
    return { exists: false };
  }
```

---

### BƯỚC 2: Sử Dụng Validation Trong Method `ghiNhanThanhVien`

**File:** `backend/src/services/thanhvien.services.ts`

**Vị trí:** Trong method `ghiNhanThanhVien`, sau phần validate thành viên cũ (khoảng dòng 220)

**Tìm đoạn code:**
```typescript
      // [2] Validate logic nghiệp vụ theo loại quan hệ
      if (payload.LoaiQuanHe === 'Con cái') {
        // Thành viên cũ phải có giới tính hợp lệ (trigger sẽ check thêm)
        if (thanhvienCu.GioiTinh !== 'Nam' && thanhvienCu.GioiTinh !== 'Nữ') {
          throw new Error('Thành viên cũ phải có giới tính hợp lệ');
        }
```

**Thay thế bằng:**
```typescript
      // [2] Validate logic nghiệp vụ theo loại quan hệ
      if (payload.LoaiQuanHe === 'Con cái') {
        // Thành viên cũ phải có giới tính hợp lệ (trigger sẽ check thêm)
        if (thanhvienCu.GioiTinh !== 'Nam' && thanhvienCu.GioiTinh !== 'Nữ') {
          throw new Error('Thành viên cũ phải có giới tính hợp lệ');
        }
        
        // Sửa THÊM MỚI: Kiểm tra trùng lặp con
        const isDuplicateChild = await this.checkDuplicateChildWithConnection(
          connection,
          payload.HoTen,
          payload.NgayGioSinh,
          thanhvienCu.GioiTinh === 'Nam' ? payload.MaTVCu : null,
          thanhvienCu.GioiTinh === 'Nữ' ? payload.MaTVCu : null
        );
        
        if (isDuplicateChild) {
          throw new Error(
            `Đã tồn tại con cùng tên "${payload.HoTen}" và ngày sinh "${payload.NgayGioSinh}" của thành viên này`
          );
        }
```

**Tìm đoạn code:**
```typescript
      } else if (payload.LoaiQuanHe === 'Vợ/Chồng') {
        // Kiểm tra thành viên cũ đã có vợ/chồng chưa
        const hasSpouse = await this.checkExistingSpouseWithConnection(connection, payload.MaTVCu);
        if (hasSpouse) {
          throw new Error('Thành viên cũ đã có vợ/chồng hiện tại');
        }
      }
```

**Thay thế bằng:**
```typescript
      } else if (payload.LoaiQuanHe === 'Vợ/Chồng') {
        // Kiểm tra thành viên cũ đã có vợ/chồng chưa
        const hasSpouse = await this.checkExistingSpouseWithConnection(connection, payload.MaTVCu);
        if (hasSpouse) {
          throw new Error('Thành viên cũ đã có vợ/chồng hiện tại');
        }
        
        // Sửa THÊM MỚI: Kiểm tra người này đã tồn tại trong hệ thống chưa
        const duplicatePerson = await this.checkDuplicatePersonWithConnection(
          connection,
          payload.HoTen,
          payload.NgayGioSinh,
          payload.GioiTinh
        );
        
        if (duplicatePerson.exists) {
          throw new Error(
            `Người này đã tồn tại trong hệ thống với mã ${duplicatePerson.MaTV}. ` +
            `Không thể ghi nhận lại. Hãy sử dụng chức năng "Thêm quan hệ hôn nhân" nếu muốn kết nối.`
          );
        }
      }
```

---

### BƯỚC 3: Thêm Helper Methods Với Connection (Cho Transaction)

**File:** `backend/src/services/thanhvien.services.ts`

**Vị trí:** Thêm sau method `checkExistingSpouseWithConnection` (khoảng dòng 360)

```typescript
  /**
   * Helper: Kiểm tra duplicate child với connection (trong transaction)
   */
  private async checkDuplicateChildWithConnection(
    connection: PoolConnection,
    HoTen: string, 
    NgayGioSinh: string, 
    MaTVCha: string | null,
    MaTVMe: string | null
  ): Promise<boolean> {
    let sql = '';
    let params: any[] = [];
    
    if (MaTVCha) {
      sql = `
        SELECT COUNT(*) as count
        FROM THANHVIEN tv
        INNER JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
        WHERE tv.HoTen = ? 
          AND DATE(tv.NgayGioSinh) = DATE(?)
          AND qhc.MaTVCha = ?
      `;
      params = [HoTen, NgayGioSinh, MaTVCha];
    } else if (MaTVMe) {
      sql = `
        SELECT COUNT(*) as count
        FROM THANHVIEN tv
        INNER JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
        WHERE tv.HoTen = ? 
          AND DATE(tv.NgayGioSinh) = DATE(?)
          AND qhc.MaTVMe = ?
      `;
      params = [HoTen, NgayGioSinh, MaTVMe];
    } else {
      return false;
    }
    
    const [rows] = await connection.query<any[]>(sql, params);
    return rows[0]?.count > 0;
  }

  /**
   * Helper: Kiểm tra duplicate person với connection (trong transaction)
   */
  private async checkDuplicatePersonWithConnection(
    connection: PoolConnection,
    HoTen: string, 
    NgayGioSinh: string,
    GioiTinh: string
  ): Promise<{ exists: boolean; MaTV?: string }> {
    const sql = `
      SELECT MaTV
      FROM THANHVIEN
      WHERE HoTen = ? 
        AND DATE(NgayGioSinh) = DATE(?)
        AND GioiTinh = ?
      LIMIT 1
    `;
    
    const [rows] = await connection.query<ThanhVienRow[]>(
      sql, 
      [HoTen, NgayGioSinh, GioiTinh]
    );
    
    if (rows.length > 0) {
      return { exists: true, MaTV: rows[0].MaTV };
    }
    
    return { exists: false };
  }
```

---

### BƯỚC 4: Thêm Error Messages (Tùy chọn)

**File:** `backend/src/constants/messages.ts`

**Vị trí:** Thêm vào object `THANHVIEN_MESSAGES` (nếu đã có), hoặc tạo mới

```typescript
export const THANHVIEN_MESSAGES = {
  // ... messages hiện có ...
  
  // Duplicate validation
  DUPLICATE_CHILD: 'Đã tồn tại con cùng tên và ngày sinh của thành viên này',
  DUPLICATE_PERSON: 'Người này đã tồn tại trong hệ thống',
  USE_RELATION_FEATURE: 'Hãy sử dụng chức năng "Thêm quan hệ" thay vì ghi nhận lại',
} as const;
```

---

## 🧪 Test Cases Sau Khi Sửa

### Test Case 1: Thêm Con Trùng Lặp (Phải Bị Chặn)

**Request lần 1:**
```bash
curl -X POST http://localhost:3000/thanhvien/ghi-nhan \
  -H "Content-Type: application/json" \
  -d '{
    "HoTen": "Nguyễn Văn Test",
    "NgayGioSinh": "2024-01-15 10:30:00",
    "GioiTinh": "Nam",
    "DiaChi": "Hà Nội",
    "MaQueQuan": "QQ00",
    "MaTVCu": "TV04",
    "LoaiQuanHe": "Con cái",
    "NgayPhatSinh": "2024-01-20"
  }'
```

**Expected Response (201):** Sửa Thành công - tạo TV09

**Request lần 2 (CÙNG THÔNG TIN):**
```bash
# Gửi lại request giống hệt
```

**Expected Response (400):** ❌ Lỗi
```json
{
  "message": "Ghi nhận thành viên thất bại",
  "error": "Đã tồn tại con cùng tên \"Nguyễn Văn Test\" và ngày sinh \"2024-01-15 10:30:00\" của thành viên này"
}
```

---

### Test Case 2: Thêm Con Khác Tên (Phải Thành Công)

**Request:**
```bash
curl -X POST http://localhost:3000/thanhvien/ghi-nhan \
  -H "Content-Type: application/json" \
  -d '{
    "HoTen": "Nguyễn Văn Khác",
    "NgayGioSinh": "2024-01-15 10:30:00",
    "GioiTinh": "Nam",
    "DiaChi": "Hà Nội",
    "MaQueQuan": "QQ00",
    "MaTVCu": "TV04",
    "LoaiQuanHe": "Con cái",
    "NgayPhatSinh": "2024-01-20"
  }'
```

**Expected Response (201):** Sửa Thành công - tạo thành viên mới

---

### Test Case 3: Thêm Vợ/Chồng Đã Tồn Tại (Phải Bị Chặn)

**Giả sử TV02 đã tồn tại trong hệ thống**

**Request:**
```bash
curl -X POST http://localhost:3000/thanhvien/ghi-nhan \
  -H "Content-Type: application/json" \
  -d '{
    "HoTen": "Nguyễn Văn Long",
    "NgayGioSinh": "1945-03-20 10:30:00",
    "GioiTinh": "Nam",
    "DiaChi": "Hà Nội",
    "MaQueQuan": "QQ00",
    "MaTVCu": "TV06",
    "LoaiQuanHe": "Vợ/Chồng",
    "NgayPhatSinh": "2024-01-20"
  }'
```

**Expected Response (400):** ❌ Lỗi
```json
{
  "message": "Ghi nhận thành viên thất bại",
  "error": "Người này đã tồn tại trong hệ thống với mã TV02. Không thể ghi nhận lại. Hãy sử dụng chức năng \"Thêm quan hệ hôn nhân\" nếu muốn kết nối."
}
```

---

## 📊 So Sánh Trước và Sau

| Tình Huống | Trước Khi Sửa | Sau Khi Sửa |
|-----------|---------------|-------------|
| Gửi 10 lần cùng request con | Sửa Tạo 10 TV (TV09-TV18) | ❌ Chỉ tạo 1 TV, 9 lần sau báo lỗi |
| Con cùng tên, khác ngày sinh | Sửa Tạo thành công | Sửa Tạo thành công |
| Con khác tên, cùng ngày sinh | Sửa Tạo thành công | Sửa Tạo thành công |
| Ghi nhận người đã tồn tại | Sửa Tạo duplicate | ❌ Báo lỗi, gợi ý dùng "Thêm quan hệ" |

---

## 🎯 Lợi Ích

1. Sửa **Đảm bảo tính toàn vẹn dữ liệu:** Không có thành viên trùng lặp
2. Sửa **Logic nghiệp vụ đúng:** Một người chỉ được ghi nhận 1 lần
3. Sửa **UX tốt hơn:** Thông báo lỗi rõ ràng, gợi ý giải pháp
4. Sửa **Dễ bảo trì:** Dữ liệu sạch, không có "rác"

---

## ⚠️ Lưu Ý

### Trường Hợp Edge Cases

**1. Anh em sinh đôi (cùng ngày sinh, cùng cha/mẹ):**
- **Vấn đề:** Validation sẽ chặn nếu cùng tên
- **Giải pháp:** Đặt tên khác nhau (Nguyễn Văn A, Nguyễn Văn B) hoặc thêm số phía sau

**2. Người cùng tên, cùng ngày sinh nhưng khác cha/mẹ:**
- **Hiện tại:** Cho phép (vì khác MaTVCu)
- **OK:** Hợp lý trong thực tế (người khác nhau)

**3. Cùng tên, khác năm sinh:**
- **Hiện tại:** Cho phép
- **OK:** Có thể đặt tên con giống nhau qua các thế hệ

---

## Sửa Checklist Triển Khai

- [ ] Thêm method `checkDuplicateChild` vào service
- [ ] Thêm method `checkDuplicatePerson` vào service
- [ ] Thêm method `checkDuplicateChildWithConnection` (private helper)
- [ ] Thêm method `checkDuplicatePersonWithConnection` (private helper)
- [ ] Sửa method `ghiNhanThanhVien` - thêm validation cho "Con cái"
- [ ] Sửa method `ghiNhanThanhVien` - thêm validation cho "Vợ/Chồng"
- [ ] Thêm error messages (tùy chọn)
- [ ] Test với 10 requests giống nhau → Chỉ tạo được 1
- [ ] Test với siblings khác tên → Tạo thành công
- [ ] Test với người đã tồn tại → Báo lỗi rõ ràng

---

## 🔍 Giải Thích Kỹ Thuật

### Tại Sao Kiểm Tra `HoTen + NgayGioSinh`?

**Lý do:**
1. **Unique Identifier tự nhiên:** Trong thực tế, 2 người cùng tên + cùng ngày sinh + cùng cha/mẹ = 99.99% là cùng người
2. **Không dùng MaTV:** Vì MaTV được tạo tự động, mỗi lần insert sẽ có MaTV mới
3. **DATE() function:** Chỉ so sánh ngày, bỏ qua giờ phút giây (tránh lỗi do sai lệch vài giây)

### Tại Sao Dùng Connection Trong Transaction?

**Lý do:**
- Tất cả operations (validate, insert THANHVIEN, insert QUANHECON) phải trong cùng 1 transaction
- Nếu validation pass nhưng insert fail → rollback toàn bộ
- Đảm bảo tính nhất quán (consistency)

---

> **Tác giả:** GitHub Copilot  
> **Phiên bản:** 1.0  
> **Ngày tạo:** 21/12/2024  
> **Mức độ ưu tiên:** 🔴 **CAO** - Cần sửa ngay
