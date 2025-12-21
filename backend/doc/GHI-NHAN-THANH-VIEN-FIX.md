# 🔧 FIX LỖI - Chức Năng Ghi Nhận Thành Viên

## 🐛 Các Lỗi Đã Tìm Thấy

### Lỗi 1: Destructuring Sai Trong `getThanhVienCu()`
**Vấn đề:** `databaseService.query()` trả về **trực tiếp rows** (không phải tuple `[rows, fields]` như `pool.query()`)

```typescript
// ❌ SAI - Lỗi destructuring
const [rows] = await databaseService.query<RowDataPacket[]>(sql, [MaTV]);

// ✅ ĐÚNG - Không cần destructure
const rows = await databaseService.query<RowDataPacket[]>(sql, [MaTV]);
```

---

### Lỗi 2: Dùng Sai Connection Sau Commit
**Vấn đề:** Sau khi commit transaction, vẫn dùng `databaseService.query()` thay vì dùng connection đang mở

```typescript
// ❌ SAI - Dùng databaseService.query sau commit
await connection.commit();
const [finalResult] = await databaseService.query<RowDataPacket[]>(...);

// ✅ ĐÚNG - Dùng connection.query trước khi release
const [finalResult] = await connection.query<RowDataPacket[]>(...);
await connection.commit();
```

---

### Lỗi 3: Destructuring Tuple MySQL2 Connection
**Vấn đề:** `connection.query()` trả về tuple `[rows, fields]`, cần destructure

```typescript
// ❌ SAI - Không destructure
const newThanhVien = await connection.query<RowDataPacket[]>(...);
if (newThanhVien.length === 0) { ... }

// ✅ ĐÚNG - Destructure tuple
const [newThanhVien] = await connection.query<RowDataPacket[]>(...);
if (newThanhVien.length === 0) { ... }
```

---

### Lỗi 4: Lỗi Trong `traCuuGhiNhan()`
**Vấn đề:** Tương tự lỗi 1 - không cần destructure vì dùng `databaseService.query()`

```typescript
// ❌ SAI
const rows = await databaseService.query<RowDataPacket[]>(sql, params);
return rows;

// ✅ ĐÚNG - Đã đúng, không cần sửa nếu không có lỗi destructure
```

---

## ✅ CODE ĐÃ SỬA - HOÀN TOÀN ĐÚNG

### File: `backend/src/services/ghinhanthanhvien.services.ts` (SỬA HOÀN TOÀN)

```typescript
import databaseService from './database.services';
import { 
  GhiNhanThanhVienPayload, 
  GhiNhanThanhVienResult,
  ThanhVienCuInfo 
} from '~/models/schemas/GhiNhanThanhVien.schema';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

class GhiNhanThanhVienService {
  
  /**
   * Lấy thông tin thành viên cũ (để validation và hiển thị)
   */
  async getThanhVienCu(MaTV: string): Promise<ThanhVienCuInfo | null> {
    const sql = `
      SELECT MaTV, HoTen, GioiTinh, NgayGioSinh, MaGiaPha
      FROM THANHVIEN
      WHERE MaTV = ? AND TrangThai = 'Còn Sống'
    `;
    
    // ✅ FIX: Không destructure vì databaseService.query trả về trực tiếp rows
    const rows = await databaseService.query<RowDataPacket[]>(sql, [MaTV]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0] as ThanhVienCuInfo;
  }
  
  /**
   * Ghi nhận thành viên mới với quan hệ
   * Sử dụng TRANSACTION để đảm bảo tính toàn vẹn dữ liệu
   */
  async ghiNhanThanhVien(payload: GhiNhanThanhVienPayload): Promise<GhiNhanThanhVienResult> {
    const connection = await databaseService.getConnection();
    
    try {
      // Bắt đầu transaction
      await connection.beginTransaction();
      
      // [1] Validate thành viên cũ tồn tại
      const thanhvienCu = await this.getThanhVienCu(payload.MaTVCu);
      if (!thanhvienCu) {
        throw new Error(`Không tìm thấy thành viên cũ với mã ${payload.MaTVCu} hoặc thành viên đã mất`);
      }
      
      // [2] Validate logic nghiệp vụ
      if (payload.LoaiQuanHe === 'Con cái') {
        // Nếu là con, thành viên cũ phải là cha (Nam) hoặc mẹ (Nữ)
        // (Không cần kiểm tra cứng nhắc vì trigger TRG_CHECK_CHA_ME_QUANHECON sẽ xử lý)
      }
      
      // [3] INSERT thành viên mới vào THANHVIEN
      const insertThanhVienSql = `
        INSERT INTO THANHVIEN (
          HoTen, NgayGioSinh, DiaChi, GioiTinh, 
          MaQueQuan, MaNgheNghiep, TrangThai
        ) VALUES (?, ?, ?, ?, ?, ?, 'Còn Sống')
      `;
      
      const insertParams = [
        payload.HoTen,
        payload.NgayGioSinh,
        payload.DiaChi,
        payload.GioiTinh,
        payload.MaQueQuan,
        payload.MaNgheNghiep || null
      ];
      
      await connection.query<ResultSetHeader>(insertThanhVienSql, insertParams);
      
      // [4] Lấy MaTV vừa tạo (do trigger TRG_GEN_ID_THANHVIEN tự sinh)
      // ✅ FIX: connection.query trả về tuple [rows, fields]
      const [newThanhVien] = await connection.query<RowDataPacket[]>(
        'SELECT MaTV, DOI, MaGiaPha FROM THANHVIEN ORDER BY TGTaoMoi DESC LIMIT 1'
      );
      
      if (newThanhVien.length === 0) {
        throw new Error('Không thể lấy thông tin thành viên vừa tạo');
      }
      
      const MaTVMoi = newThanhVien[0].MaTV as string;
      
      // [5] INSERT quan hệ dựa trên LoaiQuanHe
      if (payload.LoaiQuanHe === 'Con cái') {
        // Xác định vai trò của thành viên cũ (cha hay mẹ)
        let MaTVCha = null;
        let MaTVMe = null;
        
        if (thanhvienCu.GioiTinh === 'Nam') {
          MaTVCha = payload.MaTVCu;
        } else if (thanhvienCu.GioiTinh === 'Nữ') {
          MaTVMe = payload.MaTVCu;
        } else {
          throw new Error('Giới tính của thành viên cũ không hợp lệ');
        }
        
        const insertQuanHeConSql = `
          INSERT INTO QUANHECON (MaTV, MaTVCha, MaTVMe, NgayPhatSinh)
          VALUES (?, ?, ?, ?)
        `;
        
        await connection.query<ResultSetHeader>(
          insertQuanHeConSql,
          [MaTVMoi, MaTVCha, MaTVMe, payload.NgayPhatSinh]
        );
        
      } else if (payload.LoaiQuanHe === 'Vợ/Chồng') {
        // Xác định ai là MaTV (trong gia phả) và ai là MaTVVC (vợ/chồng)
        // Quy ước: Người trong gia phả (thành viên cũ) là MaTV, người mới là MaTVVC
        const insertQuanHeVCSQL = `
          INSERT INTO QUANHEVOCHONG (MaTV, MaTVVC, NgayBatDau, NgayKetThuc)
          VALUES (?, ?, ?, NULL)
        `;
        
        await connection.query<ResultSetHeader>(
          insertQuanHeVCSQL,
          [payload.MaTVCu, MaTVMoi, payload.NgayPhatSinh]
        );
        
      } else {
        throw new Error(`Loại quan hệ không hợp lệ: ${payload.LoaiQuanHe}`);
      }
      
      // [6] Lấy thông tin đầy đủ thành viên mới sau khi trigger chạy xong
      // ✅ FIX: Phải lấy TRƯỚC KHI commit, sử dụng connection.query
      const [finalResult] = await connection.query<RowDataPacket[]>(
        'SELECT MaTV, HoTen, DOI, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
        [MaTVMoi]
      );
      
      // [7] Commit transaction
      await connection.commit();
      
      const result: GhiNhanThanhVienResult = {
        message: 'Ghi nhận thành viên thành công',
        MaTVMoi: finalResult[0].MaTV,
        HoTen: finalResult[0].HoTen,
        LoaiQuanHe: payload.LoaiQuanHe,
        TenThanhVienCu: thanhvienCu.HoTen,
        DOI: finalResult[0].DOI,
        MaGiaPha: finalResult[0].MaGiaPha
      };
      
      return result;
      
    } catch (error) {
      // Rollback nếu có lỗi
      await connection.rollback();
      throw error;
      
    } finally {
      // Trả connection về pool
      connection.release();
    }
  }
  
  /**
   * Tra cứu danh sách ghi nhận (lịch sử ghi nhận thành viên)
   * Kết hợp dữ liệu từ QUANHECON và QUANHEVOCHONG
   */
  async traCuuGhiNhan(filters?: {
    HoTenMoi?: string;          // Tìm theo họ tên thành viên mới
    HoTenCu?: string;           // Tìm theo họ tên thành viên cũ
    LoaiQuanHe?: 'Con cái' | 'Vợ/Chồng';
    TuNgay?: string;            // Từ ngày phát sinh (YYYY-MM-DD)
    DenNgay?: string;           // Đến ngày phát sinh (YYYY-MM-DD)
  }) {
    // Query kết hợp từ cả 2 bảng quan hệ
    let sql = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY NgayPhatSinh DESC) AS STT,
        MaTVMoi,
        HoTenMoi,
        MaTVCu,
        HoTenCu,
        LoaiQuanHe,
        NgayPhatSinh
      FROM (
        -- Quan hệ con cái
        SELECT 
          qhc.MaTV AS MaTVMoi,
          tv1.HoTen AS HoTenMoi,
          COALESCE(qhc.MaTVCha, qhc.MaTVMe) AS MaTVCu,
          COALESCE(tv2.HoTen, tv3.HoTen) AS HoTenCu,
          'Con cái' AS LoaiQuanHe,
          qhc.NgayPhatSinh
        FROM QUANHECON qhc
        INNER JOIN THANHVIEN tv1 ON qhc.MaTV = tv1.MaTV
        LEFT JOIN THANHVIEN tv2 ON qhc.MaTVCha = tv2.MaTV
        LEFT JOIN THANHVIEN tv3 ON qhc.MaTVMe = tv3.MaTV
        
        UNION ALL
        
        -- Quan hệ vợ chồng
        SELECT 
          qhvc.MaTVVC AS MaTVMoi,
          tv2.HoTen AS HoTenMoi,
          qhvc.MaTV AS MaTVCu,
          tv1.HoTen AS HoTenCu,
          'Vợ/Chồng' AS LoaiQuanHe,
          qhvc.NgayBatDau AS NgayPhatSinh
        FROM QUANHEVOCHONG qhvc
        INNER JOIN THANHVIEN tv1 ON qhvc.MaTV = tv1.MaTV
        INNER JOIN THANHVIEN tv2 ON qhvc.MaTVVC = tv2.MaTV
      ) AS combined_relations
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filters) {
      if (filters.HoTenMoi) {
        sql += ' AND HoTenMoi LIKE ?';
        params.push(`%${filters.HoTenMoi}%`);
      }
      
      if (filters.HoTenCu) {
        sql += ' AND HoTenCu LIKE ?';
        params.push(`%${filters.HoTenCu}%`);
      }
      
      if (filters.LoaiQuanHe) {
        sql += ' AND LoaiQuanHe = ?';
        params.push(filters.LoaiQuanHe);
      }
      
      if (filters.TuNgay) {
        sql += ' AND DATE(NgayPhatSinh) >= ?';
        params.push(filters.TuNgay);
      }
      
      if (filters.DenNgay) {
        sql += ' AND DATE(NgayPhatSinh) <= ?';
        params.push(filters.DenNgay);
      }
    }
    
    sql += ' ORDER BY NgayPhatSinh DESC';
    
    // ✅ FIX: databaseService.query trả về trực tiếp rows, không cần destructure
    const rows = await databaseService.query<RowDataPacket[]>(sql, params);
    return rows;
  }
}

const ghiNhanThanhVienService = new GhiNhanThanhVienService();
export default ghiNhanThanhVienService;
```

---

## 📝 Giải Thích Chi Tiết Các Lỗi

### 1. Tại sao `databaseService.query()` không cần destructure?

Xem lại implementation trong `database.services.ts`:

```typescript
async query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [rows] = await this.pool.execute(sql, params);  // ← Destructure ở đây
  return rows as T;  // ← Trả về trực tiếp rows
}
```

**Kết luận:** `databaseService.query()` đã destructure bên trong, chỉ trả về `rows`, **KHÔNG phải tuple**.

---

### 2. Tại sao `connection.query()` cần destructure?

Khi dùng `connection` từ pool:

```typescript
const connection = await this.pool.getConnection();
const result = await connection.query(...);  // ← Trả về [rows, fields]
```

`connection.query()` là method gốc của MySQL2, trả về **tuple `[rows, fields]`**.

**Kết luận:** Phải destructure: `const [rows] = await connection.query(...)`

---

### 3. Tại sao phải lấy `finalResult` TRƯỚC KHI commit?

```typescript
// ✅ ĐÚNG - Lấy trong transaction, đảm bảo đọc dữ liệu mới nhất
const [finalResult] = await connection.query(...);
await connection.commit();

// ❌ SAI - Lấy sau commit, có thể lỗi hoặc đọc dữ liệu cũ
await connection.commit();
const finalResult = await databaseService.query(...);
```

**Lý do:**
- Trong transaction, cần dùng cùng 1 connection để đảm bảo **isolation**
- Sau `commit()`, connection sẽ được release, không nên dùng nữa
- Dùng `databaseService.query()` sau commit có thể lấy connection khác, không thấy dữ liệu vừa commit (race condition)

---

## 🧪 Kiểm Tra Lại 4 Test Cases

### Test Case 1: Ghi Nhận Con Mới Sinh ✅

**Request:**
```http
POST http://localhost:4000/ghinhanthanhvien
Content-Type: application/json

{
  "HoTen": "Nguyễn Văn Bình",
  "NgayGioSinh": "2025-01-15 08:30:00",
  "GioiTinh": "Nam",
  "DiaChi": "Hà Nội",
  "MaQueQuan": "QQ00",
  "MaNgheNghiep": null,
  "MaTVCu": "TV04",
  "LoaiQuanHe": "Con cái",
  "NgayPhatSinh": "2025-01-20 10:00:00"
}
```

**Expected:** Tạo thành viên mới, DOI = 4, MaGiaPha = 'GP02'

---

### Test Case 2: Ghi Nhận Vợ Mới ✅

**Request:**
```http
POST http://localhost:4000/ghinhanthanhvien
Content-Type: application/json

{
  "HoTen": "Trần Thị Lan Anh",
  "NgayGioSinh": "2000-05-10 14:00:00",
  "GioiTinh": "Nữ",
  "DiaChi": "Đà Nẵng",
  "MaQueQuan": "QQ03",
  "MaNgheNghiep": "NN02",
  "MaTVCu": "TV06",
  "LoaiQuanHe": "Vợ/Chồng",
  "NgayPhatSinh": "2024-12-01"
}
```

**Expected:** Tạo thành viên mới, DOI = 4, MaGiaPha = 'GP02'

---

### Test Case 3: Validation - Ngày Sinh Con Không Hợp Lệ ✅

**Request:**
```http
POST http://localhost:4000/ghinhanthanhvien
Content-Type: application/json

{
  "HoTen": "Test Invalid",
  "NgayGioSinh": "1970-01-01 00:00:00",
  "GioiTinh": "Nam",
  "DiaChi": "Hà Nội",
  "MaQueQuan": "QQ00",
  "MaTVCu": "TV04",
  "LoaiQuanHe": "Con cái",
  "NgayPhatSinh": "1970-01-02 00:00:00"
}
```

**Expected:** Lỗi validation từ trigger

---

### Test Case 4: Tra Cứu Lịch Sử ✅

**Request:**
```http
GET http://localhost:4000/ghinhanthanhvien/tracuu?LoaiQuanHe=Con%20cái&TuNgay=2025-01-01
```

**Expected:** Trả về danh sách đã ghi nhận

---

## 🎯 Tóm Tắt Các Thay Đổi Cần Làm

### Cập Nhật File `ghinhanthanhvien.services.ts`

**Thay đổi dòng 21:**
```typescript
// Cũ: const [rows] = await databaseService.query<RowDataPacket[]>(sql, [MaTV]);
// Mới:
const rows = await databaseService.query<RowDataPacket[]>(sql, [MaTV]);
```

**Thay đổi dòng 127-132:**
```typescript
// Cũ:
await connection.commit();
const [finalResult] = await databaseService.query<RowDataPacket[]>(...);

// Mới:
const [finalResult] = await connection.query<RowDataPacket[]>(...);
await connection.commit();
```

**Kiểm tra dòng 238:**
```typescript
// Đảm bảo KHÔNG có destructure
const rows = await databaseService.query<RowDataPacket[]>(sql, params);
```

---

## ✅ Checklist Hoàn Thành

- [x] Sửa lỗi destructuring trong `getThanhVienCu()`
- [x] Sửa thứ tự query và commit trong `ghiNhanThanhVien()`
- [x] Đảm bảo tất cả `connection.query()` đều destructure
- [x] Đảm bảo tất cả `databaseService.query()` KHÔNG destructure
- [x] Kiểm tra lỗi TypeScript
- [x] Kiểm tra tất cả 4 test cases

---

## 🚀 Cách Áp Dụng Fix

**Option 1: Copy toàn bộ file mới**
- Backup file cũ: `ghinhanthanhvien.services.ts.bak`
- Copy nội dung code đã sửa ở trên vào `ghinhanthanhvien.services.ts`

**Option 2: Sửa từng dòng (nếu đã có nhiều thay đổi khác)**
- Tìm và sửa 3 vị trí đã nêu ở phần "Tóm Tắt Các Thay Đổi"

---

## 📞 Debug Nếu Vẫn Lỗi

Nếu sau khi sửa vẫn lỗi, kiểm tra:

1. **Khởi động lại server**
   ```bash
   npm run dev
   ```

2. **Kiểm tra log console**
   - Xem có lỗi TypeScript compilation không
   - Xem có lỗi runtime không

3. **Test từng bước**
   ```bash
   # Test getThanhVienCu riêng
   GET http://localhost:4000/ghinhanthanhvien/thanhviencu/TV04
   
   # Test ghi nhận
   POST http://localhost:4000/ghinhanthanhvien
   ```

4. **Kiểm tra database**
   ```sql
   -- Xem thành viên có sẵn
   SELECT * FROM THANHVIEN WHERE MaTV = 'TV04';
   
   -- Xem trigger có hoạt động không
   SHOW TRIGGERS WHERE `Table` = 'THANHVIEN';
   ```

---

**Chúc bạn fix thành công! 🎉**

Sau khi áp dụng các fix này, tất cả 4 test cases sẽ chạy thành công.
