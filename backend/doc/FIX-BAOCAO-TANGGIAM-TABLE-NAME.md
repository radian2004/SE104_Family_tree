# FIX LỖI: BÁO CÁO TĂNG GIẢM THÀNH VIÊN - TABLE 'QUANHEVOCHONG' DOESN'T EXIST

## 🐛 MÔ TẢ LỖI

**Lỗi:** Khi gọi API báo cáo tăng giảm thành viên
```
GET http://localhost:3000/thanhvien/baocao?NamBatDau=1900&NamKetThuc=2025
```

**Response lỗi:**
```json
{
    "message": "Lỗi lấy báo cáo tăng giảm thành viên",
    "error": "Table 'app.QUANHEVOCHONG' doesn't exist"
}
```

---

## 🔍 NGUYÊN NHÂN

### Vấn đề:
Code trong file `thanhvien.services.ts` đang tham chiếu đến bảng `QUANHEVOCHONG` nhưng trong database thực tế, bảng quan hệ hôn nhân có tên là **`HONNHAN`**.

### Xung đột tên bảng:
- **Trong init.sql**: Bảng được định nghĩa là `HONNHAN` (dòng 103-111)
- **Trong code**: Đang query bảng `QUANHEVOCHONG` (không tồn tại)

### Nguồn gốc lỗi:
- Guide cũ `BAO-CAO-TANG-GIAM-THANH-VIEN-GUIDE.md` có thể đã sử dụng tên bảng `QUANHEVOCHONG`
- Khi implement, code đã follow guide cũ
- Nhưng trong `init.sql`, bảng được tạo với tên `HONNHAN` theo chuẩn của dự án
- Dẫn đến mismatch giữa code và database schema

---

## 🔧 GIẢI PHÁP

### Cần sửa file: `src/services/thanhvien.services.ts`

Thay thế **TẤT CẢ** các tham chiếu từ `QUANHEVOCHONG` → `HONNHAN`

---

## 📝 CÁC THAY ĐỔI CẦN THỰC HIỆN

### 1. Sửa Interface (Dòng ~41)

**TÌM:**
```typescript
interface QuanHeVoChongRow extends RowDataPacket {
```

**THAY BẰNG:**
```typescript
interface HonNhanRow extends RowDataPacket {
```

---

### 2. Sửa hàm getBaoCaoTangGiam (Dòng ~191-250)

**TÌM:**
```typescript
  async getBaoCaoTangGiam(NamBatDau: number, NamKetThuc: number) {
    // ... validate code ...

    const sql = `
      WITH AllYears AS (
        -- Lấy tất cả các năm có sinh
        SELECT DISTINCT YEAR(NgayGioSinh) as Nam
        FROM THANHVIEN
        WHERE YEAR(NgayGioSinh) BETWEEN ? AND ?
        
        UNION
        
        -- Lấy tất cả các năm có kết hôn
        SELECT DISTINCT YEAR(NgayBatDau) as Nam
        FROM QUANHEVOCHONG
        WHERE YEAR(NgayBatDau) BETWEEN ? AND ?
        
        UNION
        
        -- Lấy tất cả các năm có mất
        SELECT DISTINCT YEAR(NgayGioMat) as Nam
        FROM THANHVIEN
        WHERE YEAR(NgayGioMat) BETWEEN ? AND ?
          AND NgayGioMat IS NOT NULL
      )
      SELECT 
        ROW_NUMBER() OVER (ORDER BY ay.Nam) AS STT,
        ay.Nam,
        COALESCE(
          (SELECT COUNT(*) FROM THANHVIEN 
           WHERE YEAR(NgayGioSinh) = ay.Nam), 0
        ) AS SoLuongSinh,
        COALESCE(
          (SELECT COUNT(*) FROM QUANHEVOCHONG 
           WHERE YEAR(NgayBatDau) = ay.Nam AND MaTV < MaTVVC), 0
        ) AS SoLuongKetHon,
        COALESCE(
          (SELECT COUNT(*) FROM THANHVIEN 
           WHERE YEAR(NgayGioMat) = ay.Nam AND NgayGioMat IS NOT NULL), 0
        ) AS SoLuongMat
      FROM AllYears ay
      ORDER BY ay.Nam
    `;
```

**THAY BẰNG:**
```typescript
  async getBaoCaoTangGiam(NamBatDau: number, NamKetThuc: number) {
    // ... validate code GIỮ NGUYÊN ...

    const sql = `
      WITH AllYears AS (
        -- Lấy tất cả các năm có sinh
        SELECT DISTINCT YEAR(NgayGioSinh) as Nam
        FROM THANHVIEN
        WHERE YEAR(NgayGioSinh) BETWEEN ? AND ?
        
        UNION
        
        -- Lấy tất cả các năm có kết hôn
        SELECT DISTINCT YEAR(NgayBatDau) as Nam
        FROM HONNHAN
        WHERE YEAR(NgayBatDau) BETWEEN ? AND ?
        
        UNION
        
        -- Lấy tất cả các năm có mất
        SELECT DISTINCT YEAR(NgayGioMat) as Nam
        FROM THANHVIEN
        WHERE YEAR(NgayGioMat) BETWEEN ? AND ?
          AND NgayGioMat IS NOT NULL
      )
      SELECT 
        ROW_NUMBER() OVER (ORDER BY ay.Nam) AS STT,
        ay.Nam,
        COALESCE(
          (SELECT COUNT(*) FROM THANHVIEN 
           WHERE YEAR(NgayGioSinh) = ay.Nam), 0
        ) AS SoLuongSinh,
        COALESCE(
          (SELECT COUNT(*) FROM HONNHAN 
           WHERE YEAR(NgayBatDau) = ay.Nam AND MaTV < MaTVVC), 0
        ) AS SoLuongKetHon,
        COALESCE(
          (SELECT COUNT(*) FROM THANHVIEN 
           WHERE YEAR(NgayGioMat) = ay.Nam AND NgayGioMat IS NOT NULL), 0
        ) AS SoLuongMat
      FROM AllYears ay
      ORDER BY ay.Nam
    `;
```

**THAY ĐỔI:**
- Dòng 15: `FROM QUANHEVOCHONG` → `FROM HONNHAN`
- Dòng 34: `FROM QUANHEVOCHONG` → `FROM HONNHAN`

---

### 3. Sửa hàm getThanhVienByHoTen hoặc các hàm liên quan (nếu có)

**TÌM tất cả các đoạn code có:**
```typescript
FROM QUANHEVOCHONG
```

**THAY BẰNG:**
```typescript
FROM HONNHAN
```

---

### 4. Tìm và thay thế tất cả trong file

**Sử dụng Find & Replace trong VS Code:**
- **Find:** `QUANHEVOCHONG`
- **Replace:** `HONNHAN`
- **File:** `src/services/thanhvien.services.ts`

**Kết quả dự kiến:** Có khoảng 6-8 chỗ cần thay thế

---

## 📋 CHECKLIST THỰC HIỆN

### Bước 1: Backup file
```bash
# Trong terminal
cd E:\CNPM_backend_sub\SE104_Family_tree\backend\src\services
cp thanhvien.services.ts thanhvien.services.ts.backup
```

### Bước 2: Mở file trong VS Code
```
File: src/services/thanhvien.services.ts
```

### Bước 3: Find & Replace
- [ ] Nhấn `Ctrl + H` (Windows) hoặc `Cmd + H` (Mac)
- [ ] Find: `QUANHEVOCHONG`
- [ ] Replace: `HONNHAN`
- [ ] Click "Replace All" hoặc xem từng match và replace thủ công

### Bước 4: Verify các thay đổi

**Kiểm tra các vị trí đã sửa:**
- [ ] Interface `QuanHeVoChongRow` → `HonNhanRow`
- [ ] Query trong `getBaoCaoTangGiam` (2 chỗ: line ~215 và ~234)
- [ ] Query trong các hàm khác (nếu có)

### Bước 5: Test API

**Restart server:**
```bash
npm run dev
```

**Test request:**
```bash
GET http://localhost:3000/users/thanhvien/baocao?NamBatDau=1900&NamKetThuc=2025
```

**Expected Response (Success):**
```json
{
  "message": "Lấy báo cáo tăng giảm thành viên thành công",
  "data": {
    "NamBatDau": 1900,
    "NamKetThuc": 2025,
    "TongSoNamCoSuKien": 8,
    "result": [
      {
        "STT": 1,
        "Nam": 1920,
        "SoLuongSinh": 1,
        "SoLuongKetHon": 0,
        "SoLuongMat": 0
      },
      // ... more records
    ]
  }
}
```

---

## 🔍 VỊ TRÍ CỤ THỂ CẦN SỬA

### File: `src/services/thanhvien.services.ts`

| Dòng | Code cũ | Code mới |
|------|---------|----------|
| ~41 | `interface QuanHeVoChongRow` | `interface HonNhanRow` |
| ~215 | `FROM QUANHEVOCHONG` | `FROM HONNHAN` |
| ~234 | `FROM QUANHEVOCHONG` | `FROM HONNHAN` |
| ~307 | `FROM QUANHEVOCHONG` (nếu có) | `FROM HONNHAN` |
| ~510 | `INSERT INTO QUANHEVOCHONG` (nếu có) | `INSERT INTO HONNHAN` |
| ~592 | `FROM QUANHEVOCHONG` (nếu có) | `FROM HONNHAN` |

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Cấu trúc bảng HONNHAN:
```sql
CREATE TABLE HONNHAN(
    MaTV VARCHAR(5),           -- Thành viên trong gia phả
    MaTVVC VARCHAR(5),         -- Vợ/Chồng
    NgayBatDau DATE,           -- Ngày đăng ký kết hôn
    NgayKetThuc DATE,          -- Ngày kết thúc (NULL = còn hôn nhân)
    PRIMARY KEY(MaTV, MaTVVC),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(MaTVVC) REFERENCES THANHVIEN(MaTV)
);
```

### 2. Logic đếm số lượng kết hôn:
```sql
-- Sửa ĐÚNG: Đếm số cặp (chỉ lấy MaTV < MaTVVC để tránh đếm trùng)
SELECT COUNT(*) FROM HONNHAN 
WHERE YEAR(NgayBatDau) = 2020 AND MaTV < MaTVVC
```

**Giải thích:** Mỗi cặp vợ chồng có 1 record duy nhất trong bảng HONNHAN (không lưu 2 chiều như guide cũ đã mô tả)

### 3. Không cần sửa database:
- ❌ KHÔNG cần tạo bảng `QUANHEVOCHONG`
- Sửa CHỈ cần sửa code để dùng đúng bảng `HONNHAN` đã có sẵn

### 4. Các file KHÔNG cần sửa:
- ❌ `init.sql` - Đã đúng (bảng HONNHAN)
- ❌ `honnhan.services.ts` - Đã đúng
- ❌ `honnhan.controllers.ts` - Đã đúng
- Sửa CHỈ SỬA: `thanhvien.services.ts`

---

## 📊 KẾT QUẢ SAU KHI SỬA

### Test Case 1: Query báo cáo 1900-2025
```bash
GET http://localhost:3000/users/thanhvien/baocao?NamBatDau=1900&NamKetThuc=2025
```

**Expected:**
- Sửa Status: 200 OK
- Sửa Có data báo cáo theo từng năm
- Sửa Các năm có kết hôn hiển thị đúng `SoLuongKetHon`

### Test Case 2: Query báo cáo 2020-2025
```bash
GET http://localhost:3000/users/thanhvien/baocao?NamBatDau=2020&NamKetThuc=2025
```

**Expected:**
- Sửa Status: 200 OK
- Sửa Chỉ hiển thị các năm có sự kiện trong khoảng 2020-2025

---

## 🎯 SUMMARY

### Vấn đề:
- Code dùng bảng `QUANHEVOCHONG` (không tồn tại)
- Database có bảng `HONNHAN` (đúng theo chuẩn dự án)

### Giải pháp:
- Thay thế tất cả `QUANHEVOCHONG` → `HONNHAN` trong `thanhvien.services.ts`
- Không cần sửa database hay các file khác

### Số lượng thay đổi:
- **1 file**: `src/services/thanhvien.services.ts`
- **6-8 vị trí**: Tất cả đều thay `QUANHEVOCHONG` → `HONNHAN`

### Thời gian ước tính:
- **5 phút**: Find & Replace + Verify
- **2 phút**: Test API

---

## 🔗 THAM KHẢO

- Schema database: `init.sql` dòng 103-111 (Bảng HONNHAN)
- Guide cũ (CÓ SAI): `doc/BAO-CAO-TANG-GIAM-THANH-VIEN-GUIDE.md`
- Guide đúng: `doc/QUAN-HE-HON-NHAN-GUIDE.md` (Sử dụng HONNHAN)

**Ghi chú:** Sau khi fix xong, có thể cần cập nhật lại guide `BAO-CAO-TANG-GIAM-THANH-VIEN-GUIDE.md` để thống nhất tên bảng là `HONNHAN`.
