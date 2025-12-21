# Hướng Dẫn Xây Dựng Chức Năng "Ghi Nhận Thành Viên"

## 📋 Tổng Quan

Chức năng này cho phép ghi nhận thành viên mới vào hệ thống gia phả, bao gồm thông tin cá nhân và mối quan hệ với thành viên cũ (cha/mẹ/vợ/chồng).

### Điểm Khác Biệt So Với Chức Năng Hiện Tại

Hiện tại hệ thống đã có:
- **Đăng ký thành viên mới** (`POST /thanhvien/register`) - tạo thành viên không có quan hệ
- **Bảng QUANHECON** - lưu quan hệ cha-mẹ-con (chỉ lưu sau khi đã tạo thành viên)
- **Bảng QUANHEVOCHONG** - lưu quan hệ vợ chồng (chỉ lưu sau khi đã tạo thành viên)

**Chức năng mới "Ghi Nhận Thành Viên"** sẽ:
1. **Tạo thành viên MỚI** và **đồng thời thiết lập quan hệ** với thành viên CŨ trong 1 transaction
2. Tự động xác định loại quan hệ (con cái, vợ/chồng) dựa trên giới tính và lựa chọn người dùng
3. Tự động gán **Đời** và **Mã gia phả** thông qua các trigger có sẵn
4. Lưu **Ngày phát sinh** (ngày làm giấy khai sinh) - thời điểm ghi nhận chính thức

---

## 🗃️ Phân Tích Cơ Sở Dữ liệu Hiện Tại

### 1. Bảng THANHVIEN
```sql
CREATE TABLE THANHVIEN (
    MaTV VARCHAR(5) PRIMARY KEY,              -- Auto-gen: TV01, TV02...
    HoTen VARCHAR(50),                        -- ✅ Họ tên
    NgayGioSinh DATETIME,                     -- ✅ Ngày giờ sinh
    DiaChi VARCHAR(50),                       -- ✅ Địa chỉ
    TrangThai VARCHAR(20) DEFAULT 'Còn Sống',
    TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    DOI INT DEFAULT 0,                        -- Tự động tính khi thêm quan hệ
    MaQueQuan VARCHAR(5),                     -- ✅ Quê quán (FK → QUEQUAN)
    MaNgheNghiep VARCHAR(5),                  -- ✅ Nghề nghiệp (có thể NULL)
    GioiTinh VARCHAR(3),                      -- ✅ Giới tính (Nam/Nữ)
    MaNguyenNhanMat VARCHAR(5),
    NgayGioMat DATETIME,
    MaDiaDiem VARCHAR(5),
    MaGiaPha VARCHAR(5),                      -- Tự động gán khi thêm quan hệ
    FOREIGN KEY(MaQueQuan) REFERENCES QUEQUAN(MaQueQuan),
    FOREIGN KEY(MaNgheNghiep) REFERENCES NGHENGHIEP(MaNgheNghiep),
    FOREIGN KEY(MaNguyenNhanMat) REFERENCES NGUYENNHANMAT(MaNguyenNhanMat),
    FOREIGN KEY(MaDiaDiem) REFERENCES DIADIEMMAITANG(MaDiaDiem)
);
```

**Đánh giá:** Bảng này ĐÃ ĐỦ các trường cần thiết. KHÔNG cần thêm cột mới.

---

### 2. Bảng QUANHECON (Quan Hệ Cha-Mẹ-Con)
```sql
CREATE TABLE QUANHECON(
    MaTV VARCHAR(5) PRIMARY KEY,              -- Mã thành viên CON
    MaTVCha VARCHAR(5),                       -- Mã thành viên CHA (có thể NULL)
    MaTVMe VARCHAR(5),                        -- Mã thành viên MẸ (có thể NULL)
    NgayPhatSinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP(), -- ✅ Ngày làm giấy khai sinh
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(MaTVCha) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(MaTVMe) REFERENCES THANHVIEN(MaTV)
);
```

**Ý nghĩa:** 
- `NgayPhatSinh` = Ngày làm giấy khai sinh cho con
- Trigger tự động: Đời con = Đời cha/mẹ + 1, tự động gán gia phả từ cha/mẹ

**Đánh giá:** Bảng này ĐÃ ĐỦ. KHÔNG cần thêm cột mới.

---

### 3. Bảng QUANHEVOCHONG (Quan Hệ Vợ Chồng)
```sql
CREATE TABLE QUANHEVOCHONG(
    MaTV VARCHAR(5),                          -- Mã thành viên trong gia phả (chồng/con trai)
    MaTVVC VARCHAR(5),                        -- Mã thành viên vợ/chồng (thường là vợ từ ngoài)
    NgayBatDau DATE,                          -- Ngày kết hôn
    NgayKetThuc DATE,                         -- Ngày ly hôn/kết thúc (NULL = còn hôn nhân)
    PRIMARY KEY(MaTV, MaTVVC),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(MaTVVC) REFERENCES THANHVIEN(MaTV)
);
```

**Ý nghĩa:**
- `NgayBatDau` có thể coi như "Ngày phát sinh" quan hệ hôn nhân
- Trigger tự động: Đời vợ = Đời chồng, tự động gán gia phả từ chồng sang vợ

**Đánh giá:** Bảng này ĐÃ ĐỦ. KHÔNG cần thêm cột mới.

---

### 4. Bảng Lookup (Tra Cứu)

#### QUEQUAN (Quê Quán)
```sql
CREATE TABLE QUEQUAN (
    MaQueQuan VARCHAR(5) PRIMARY KEY,         -- QQ00, QQ01...
    TenQueQuan VARCHAR(50) UNIQUE             -- Hà Nội, Hải Phòng...
);

-- Dữ liệu có sẵn
INSERT INTO QUEQUAN (MaQueQuan, TenQueQuan) VALUES
('QQ00', 'Hà Nội'),
('QQ01', 'Hải Phòng'),
('QQ02', 'Thanh Hóa'),
('QQ03', 'Hồ Chí Minh'),
('QQ04', 'Điện Biên');
```

#### NGHENGHIEP (Nghề Nghiệp)
```sql
CREATE TABLE NGHENGHIEP(
    MaNgheNghiep VARCHAR(5) PRIMARY KEY,      -- NN00, NN01...
    TenNgheNghiep VARCHAR(50) UNIQUE          -- Thợ Điện, Thầy Giáo...
);

-- Dữ liệu có sẵn (15 nghề)
INSERT INTO NGHENGHIEP (MaNgheNghiep, TenNgheNghiep) VALUES
('NN00', 'Thợ Điện'),
('NN01', 'Thầy Giáo'),
('NN02', 'Bác Sĩ'),
-- ... 12 nghề khác
```

**Đánh giá:** Có sẵn, sử dụng được ngay.

---

## 🎯 Thiết Kế Giải Pháp

### Tư Duy Thiết Kế

Chức năng "Ghi Nhận Thành Viên" = **Tạo Thành Viên Mới** + **Thiết Lập Quan Hệ Ngay Lập Tức**

#### Các Trường Hợp Sử Dụng (Use Cases)

**1. Ghi nhận con mới sinh:**
   - Nhập thông tin: Họ tên, ngày sinh, giới tính, địa chỉ, quê quán, (nghề nghiệp = NULL vì còn nhỏ)
   - Chọn **thành viên cũ**: Cha hoặc Mẹ
   - Chọn **loại quan hệ**: "Con cái"
   - **Ngày phát sinh**: Ngày làm giấy khai sinh
   - Hệ thống tự động:
     - Tạo record trong THANHVIEN
     - Tạo record trong QUANHECON (MaTVCha hoặc MaTVMe)
     - Trigger tự động tính Đời, gán MaGiaPha

**2. Ghi nhận vợ/chồng mới:**
   - Nhập thông tin: Họ tên, ngày sinh, giới tính, địa chỉ, quê quán, nghề nghiệp
   - Chọn **thành viên cũ**: Chồng/Vợ trong gia phả
   - Chọn **loại quan hệ**: "Vợ/Chồng"
   - **Ngày phát sinh**: Ngày kết hôn (NgayBatDau)
   - Hệ thống tự động:
     - Tạo record trong THANHVIEN
     - Tạo record trong QUANHEVOCHONG
     - Trigger tự động cân bằng Đời, gán MaGiaPha

**3. Ghi nhận con riêng (cha hoặc mẹ đơn thân):**
   - Tương tự Use Case 1
   - Chỉ điền MaTVCha hoặc MaTVMe, bỏ trống cái còn lại

---

### Quy Trình Xử Lý (Backend Flow)

```
[1] Client gửi request POST /ghinhanthanhvien
     ↓
[2] Middleware validation:
     - Kiểm tra tất cả trường bắt buộc
     - Validate NgayGioSinh hợp lệ
     - Validate GioiTinh = 'Nam' hoặc 'Nữ'
     - Kiểm tra MaTV cũ tồn tại
     - Kiểm tra LoaiQuanHe hợp lệ
     ↓
[3] Controller nhận request
     ↓
[4] Service bắt đầu TRANSACTION:
     ├─ [4.1] INSERT vào THANHVIEN (trigger auto-gen MaTV mới)
     ├─ [4.2] Lấy MaTV vừa tạo
     ├─ [4.3] IF LoaiQuanHe = 'Con cái':
     │        INSERT vào QUANHECON (NgayPhatSinh = ngày làm giấy khai sinh)
     │        → Trigger tự động tính DOI, MaGiaPha
     ├─ [4.4] ELSE IF LoaiQuanHe = 'Vợ/Chồng':
     │        INSERT vào QUANHEVOCHONG (NgayBatDau = ngày phát sinh)
     │        → Trigger tự động cân bằng DOI, MaGiaPha
     └─ [4.5] COMMIT transaction
     ↓
[5] Trả về response thành công với thông tin thành viên mới
```

---

## 📝 Hướng Dẫn Implementation Chi Tiết

### BƯỚC 1: Tạo Schema Interface (TypeScript)

**File:** `backend/src/models/schemas/GhiNhanThanhVien.schema.ts` (TẠO MỚI)

```typescript
// Định nghĩa payload từ client
export interface GhiNhanThanhVienPayload {
  // Thông tin thành viên mới
  HoTen: string;                    // ✅ Họ tên (required)
  NgayGioSinh: string;              // ✅ Ngày giờ sinh (ISO format: 'YYYY-MM-DD HH:mm:ss')
  GioiTinh: 'Nam' | 'Nữ';           // ✅ Giới tính (required)
  DiaChi: string;                   // ✅ Địa chỉ (required)
  MaQueQuan: string;                // ✅ Quê quán - FK đến QUEQUAN (required)
  MaNgheNghiep?: string;            // ✅ Nghề nghiệp - FK đến NGHENGHIEP (optional - NULL được)
  
  // Thông tin quan hệ với thành viên cũ
  MaTVCu: string;                   // ✅ Mã thành viên cũ (cha/mẹ/chồng/vợ) (required)
  LoaiQuanHe: 'Con cái' | 'Vợ/Chồng'; // ✅ Loại quan hệ (required)
  NgayPhatSinh: string;             // ✅ Ngày phát sinh (ISO format: 'YYYY-MM-DD' hoặc 'YYYY-MM-DD HH:mm:ss')
                                    //    - Nếu 'Con cái' → Ngày làm giấy khai sinh
                                    //    - Nếu 'Vợ/Chồng' → Ngày kết hôn
}

// Response trả về khi thành công
export interface GhiNhanThanhVienResult {
  message: string;
  MaTVMoi: string;                  // Mã thành viên vừa tạo
  HoTen: string;
  LoaiQuanHe: string;
  TenThanhVienCu: string;           // Tên thành viên cũ (để hiển thị xác nhận)
  DOI: number;                      // Đời của thành viên mới (tự động tính)
  MaGiaPha: string;                 // Mã gia phả (tự động gán)
}

// Interface cho validation
export interface ThanhVienCuInfo {
  MaTV: string;
  HoTen: string;
  GioiTinh: string;
  NgayGioSinh: Date;
  MaGiaPha: string;
}
```

---

### BƯỚC 2: Tạo Service

**File:** `backend/src/services/ghinhanthanhvien.services.ts` (TẠO MỚI)

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
    
    const [rows] = await databaseService.query<RowDataPacket[]>(sql, [MaTV]);
    
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
      
      // [6] Commit transaction
      await connection.commit();
      
      // [7] Lấy thông tin đầy đủ thành viên mới sau khi trigger chạy xong
      const [finalResult] = await databaseService.query<RowDataPacket[]>(
        'SELECT MaTV, HoTen, DOI, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
        [MaTVMoi]
      );
      
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
    
    const rows = await databaseService.query<RowDataPacket[]>(sql, params);
    return rows;
  }
}

const ghiNhanThanhVienService = new GhiNhanThanhVienService();
export default ghiNhanThanhVienService;
```

---

### BƯỚC 3: Tạo Controller

**File:** `backend/src/controllers/ghinhanthanhvien.controllers.ts` (TẠO MỚI)

```typescript
import { Request, Response } from 'express';
import ghiNhanThanhVienService from '~/services/ghinhanthanhvien.services';

/**
 * POST /ghinhanthanhvien
 * Ghi nhận thành viên mới với quan hệ
 */
export const ghiNhanThanhVienController = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Validation cơ bản (có thể tách ra middleware)
    if (!payload.HoTen || !payload.NgayGioSinh || !payload.GioiTinh || 
        !payload.DiaChi || !payload.MaQueQuan || !payload.MaTVCu || 
        !payload.LoaiQuanHe || !payload.NgayPhatSinh) {
      return res.status(400).json({
        message: 'Thiếu thông tin bắt buộc',
        required: ['HoTen', 'NgayGioSinh', 'GioiTinh', 'DiaChi', 'MaQueQuan', 'MaTVCu', 'LoaiQuanHe', 'NgayPhatSinh']
      });
    }
    
    if (!['Nam', 'Nữ'].includes(payload.GioiTinh)) {
      return res.status(400).json({
        message: 'Giới tính phải là "Nam" hoặc "Nữ"'
      });
    }
    
    if (!['Con cái', 'Vợ/Chồng'].includes(payload.LoaiQuanHe)) {
      return res.status(400).json({
        message: 'Loại quan hệ phải là "Con cái" hoặc "Vợ/Chồng"'
      });
    }
    
    const result = await ghiNhanThanhVienService.ghiNhanThanhVien(payload);
    
    return res.status(201).json(result);
    
  } catch (error: any) {
    console.error('Lỗi ghiNhanThanhVien:', error);
    
    // Xử lý lỗi từ trigger MySQL
    if (error.message.includes('Giới tính của cha phải là Nam')) {
      return res.status(400).json({
        message: 'Thành viên cũ được chọn làm cha phải có giới tính Nam',
        error: error.message
      });
    }
    
    if (error.message.includes('Giới tính của mẹ phải là Nữ')) {
      return res.status(400).json({
        message: 'Thành viên cũ được chọn làm mẹ phải có giới tính Nữ',
        error: error.message
      });
    }
    
    if (error.message.includes('Ngày sinh của con phải sau ngày sinh')) {
      return res.status(400).json({
        message: 'Ngày sinh của con phải sau ngày sinh của cha/mẹ',
        error: error.message
      });
    }
    
    return res.status(400).json({
      message: 'Ghi nhận thất bại',
      error: error.message
    });
  }
};

/**
 * GET /ghinhanthanhvien/tracuu
 * Tra cứu lịch sử ghi nhận thành viên
 */
export const traCuuGhiNhanController = async (req: Request, res: Response) => {
  try {
    const filters = {
      HoTenMoi: req.query.HoTenMoi as string,
      HoTenCu: req.query.HoTenCu as string,
      LoaiQuanHe: req.query.LoaiQuanHe as 'Con cái' | 'Vợ/Chồng',
      TuNgay: req.query.TuNgay as string,
      DenNgay: req.query.DenNgay as string
    };
    
    const result = await ghiNhanThanhVienService.traCuuGhiNhan(filters);
    
    return res.status(200).json({
      message: 'Tra cứu thành công',
      total: result.length,
      data: result
    });
    
  } catch (error: any) {
    console.error('Lỗi traCuuGhiNhan:', error);
    return res.status(400).json({
      message: 'Tra cứu thất bại',
      error: error.message
    });
  }
};

/**
 * GET /ghinhanthanhvien/thanhviencu/:MaTV
 * Lấy thông tin thành viên cũ (để hiển thị trong form)
 */
export const getThanhVienCuController = async (req: Request, res: Response) => {
  try {
    const { MaTV } = req.params;
    
    const result = await ghiNhanThanhVienService.getThanhVienCu(MaTV);
    
    if (!result) {
      return res.status(404).json({
        message: 'Không tìm thấy thành viên hoặc thành viên đã mất'
      });
    }
    
    return res.status(200).json({
      message: 'Lấy thông tin thành công',
      data: result
    });
    
  } catch (error: any) {
    console.error('Lỗi getThanhVienCu:', error);
    return res.status(400).json({
      message: 'Lấy thông tin thất bại',
      error: error.message
    });
  }
};
```

---

### BƯỚC 4: Tạo Routes

**File:** `backend/src/routes/ghinhanthanhvien.routes.ts` (TẠO MỚI)

```typescript
import { Router } from 'express';
import {
  ghiNhanThanhVienController,
  traCuuGhiNhanController,
  getThanhVienCuController
} from '~/controllers/ghinhanthanhvien.controllers';

const ghiNhanThanhVienRouter = Router();

// POST /ghinhanthanhvien - Ghi nhận thành viên mới với quan hệ
ghiNhanThanhVienRouter.post('/', ghiNhanThanhVienController);

// GET /ghinhanthanhvien/tracuu - Tra cứu lịch sử ghi nhận
ghiNhanThanhVienRouter.get('/tracuu', traCuuGhiNhanController);

// GET /ghinhanthanhvien/thanhviencu/:MaTV - Lấy thông tin thành viên cũ
ghiNhanThanhVienRouter.get('/thanhviencu/:MaTV', getThanhVienCuController);

export default ghiNhanThanhVienRouter;
```

---

### BƯỚC 5: Đăng Ký Routes Vào Server

**File:** `backend/src/index.ts` (CẬP NHẬT)

Tìm đoạn code đăng ký routes và thêm vào:

```typescript
import ghiNhanThanhVienRouter from '~/routes/ghinhanthanhvien.routes';

// ... các import khác

app.use('/ghinhanthanhvien', ghiNhanThanhVienRouter); // ✅ THÊM DÒNG NÀY
```

**Vị trí chính xác:** Thêm sau các route đã có (users, thanhvien, thanhtich, ketthuc, lookups)

---

## 🧪 Testing & Validation

### Test Case 1: Ghi Nhận Con Mới Sinh (Có Cả Cha Và Mẹ)

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

**Expected Response:**
```json
{
  "message": "Ghi nhận thành viên thành công",
  "MaTVMoi": "TV09",
  "HoTen": "Nguyễn Văn Bình",
  "LoaiQuanHe": "Con cái",
  "TenThanhVienCu": "Nguyễn Văn Hùng",
  "DOI": 4,
  "MaGiaPha": "GP02"
}
```

**Kiểm tra database:**
```sql
-- Kiểm tra thành viên mới
SELECT * FROM THANHVIEN WHERE MaTV = 'TV09';

-- Kiểm tra quan hệ con
SELECT * FROM QUANHECON WHERE MaTV = 'TV09';

-- Kết quả mong đợi:
-- THANHVIEN: TV09 có DOI = 4, MaGiaPha = 'GP02'
-- QUANHECON: MaTV = 'TV09', MaTVCha = 'TV04', MaTVMe = 'TV05' (trigger tự động điền mẹ)
```

---

### Test Case 2: Ghi Nhận Vợ Mới (Lấy Vợ Từ Ngoài Gia Phả)

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

**Expected Response:**
```json
{
  "message": "Ghi nhận thành viên thành công",
  "MaTVMoi": "TV10",
  "HoTen": "Trần Thị Lan Anh",
  "LoaiQuanHe": "Vợ/Chồng",
  "TenThanhVienCu": "Nguyễn Văn Nam",
  "DOI": 4,
  "MaGiaPha": "GP02"
}
```

**Kiểm tra database:**
```sql
-- Kiểm tra thành viên mới
SELECT * FROM THANHVIEN WHERE MaTV = 'TV10';

-- Kiểm tra quan hệ vợ chồng
SELECT * FROM QUANHEVOCHONG WHERE MaTVVC = 'TV10';

-- Kết quả mong đợi:
-- THANHVIEN: TV10 có DOI = 4, MaGiaPha = 'GP02' (trigger tự động gán từ TV06)
-- QUANHEVOCHONG: MaTV = 'TV06', MaTVVC = 'TV10', NgayBatDau = '2024-12-01'
```

---

### Test Case 3: Validation - Ngày Sinh Con Không Hợp Lệ

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

**Expected Response:**
```json
{
  "message": "Ngày sinh của con phải sau ngày sinh của cha/mẹ",
  "error": "Ngày sinh của con phải sau ngày sinh của cha!"
}
```

---

### Test Case 4: Tra Cứu Lịch Sử Ghi Nhận

**Request:**
```http
GET http://localhost:4000/ghinhanthanhvien/tracuu?LoaiQuanHe=Con%20cái&TuNgay=2025-01-01
```

**Expected Response:**
```json
{
  "message": "Tra cứu thành công",
  "total": 1,
  "data": [
    {
      "STT": 1,
      "MaTVMoi": "TV09",
      "HoTenMoi": "Nguyễn Văn Bình",
      "MaTVCu": "TV04",
      "HoTenCu": "Nguyễn Văn Hùng",
      "LoaiQuanHe": "Con cái",
      "NgayPhatSinh": "2025-01-20T03:00:00.000Z"
    }
  ]
}
```

---

## 🎨 Frontend Integration (Hướng Dẫn Nhanh)

### 1. Tạo Service API

**File:** `client/src/services/ghinhanthanhvien.js` (TẠO MỚI)

```javascript
import apiClient from '@/api/client';

/**
 * Ghi nhận thành viên mới
 */
export const ghiNhanThanhVien = async (payload) => {
  try {
    const response = await apiClient.post('/ghinhanthanhvien', payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Tra cứu lịch sử ghi nhận
 */
export const traCuuGhiNhan = async (filters) => {
  try {
    const response = await apiClient.get('/ghinhanthanhvien/tracuu', {
      params: filters
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy thông tin thành viên cũ
 */
export const getThanhVienCu = async (MaTV) => {
  try {
    const response = await apiClient.get(`/ghinhanthanhvien/thanhviencu/${MaTV}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

---

### 2. Tạo Component Form (React/Vue/Vanilla JS)

**Các Trường Cần Thiết:**

```
[Form Ghi Nhận Thành Viên Mới]

Thông tin thành viên mới:
- Họ tên: [___________________] (required, text)
- Ngày giờ sinh: [___________________] (required, datetime-local)
- Giới tính: ( ) Nam  ( ) Nữ (required, radio)
- Địa chỉ: [___________________] (required, text)
- Quê quán: [▼ Chọn quê quán] (required, select - lấy từ /lookups/quequan)
- Nghề nghiệp: [▼ Chọn nghề nghiệp] (optional, select - lấy từ /lookups/nghenghiep)

Quan hệ với thành viên cũ:
- Thành viên cũ: [▼ Chọn thành viên] (required, select/autocomplete - lấy từ /thanhvien)
  Hiển thị: Họ tên - MaTV (VD: "Nguyễn Văn Hùng - TV04")
- Loại quan hệ: [▼ Con cái / Vợ/Chồng] (required, select)
- Ngày phát sinh: [___________________] (required, date)
  Label động:
    - Nếu chọn "Con cái" → "Ngày làm giấy khai sinh"
    - Nếu chọn "Vợ/Chồng" → "Ngày kết hôn"

[Hủy] [Ghi Nhận]
```

---

### 3. Xử Lý Submit

```javascript
const handleSubmit = async (formData) => {
  try {
    // Chuẩn hóa dữ liệu
    const payload = {
      HoTen: formData.hoTen,
      NgayGioSinh: formData.ngayGioSinh, // Format: 'YYYY-MM-DD HH:mm:ss'
      GioiTinh: formData.gioiTinh,       // 'Nam' hoặc 'Nữ'
      DiaChi: formData.diaChi,
      MaQueQuan: formData.maQueQuan,
      MaNgheNghiep: formData.maNgheNghiep || null,
      MaTVCu: formData.maTVCu,
      LoaiQuanHe: formData.loaiQuanHe,   // 'Con cái' hoặc 'Vợ/Chồng'
      NgayPhatSinh: formData.ngayPhatSinh
    };
    
    const result = await ghiNhanThanhVien(payload);
    
    // Hiển thị thông báo thành công
    alert(`Ghi nhận thành công!\n` +
          `Mã thành viên mới: ${result.MaTVMoi}\n` +
          `Họ tên: ${result.HoTen}\n` +
          `Quan hệ: ${result.LoaiQuanHe} với ${result.TenThanhVienCu}\n` +
          `Đời: ${result.DOI}\n` +
          `Gia phả: ${result.MaGiaPha}`);
    
    // Redirect hoặc refresh danh sách
    // router.push('/thanhvien');
    
  } catch (error) {
    // Hiển thị lỗi chi tiết
    const errorMsg = error.response?.data?.message || error.message;
    alert(`Ghi nhận thất bại: ${errorMsg}`);
  }
};
```

---

## 📊 Tổng Kết

### Các File Cần Tạo/Sửa

**Backend:**
- ✅ TẠO: `backend/src/models/schemas/GhiNhanThanhVien.schema.ts`
- ✅ TẠO: `backend/src/services/ghinhanthanhvien.services.ts`
- ✅ TẠO: `backend/src/controllers/ghinhanthanhvien.controllers.ts`
- ✅ TẠO: `backend/src/routes/ghinhanthanhvien.routes.ts`
- ✅ SỬA: `backend/src/index.ts` (đăng ký route)

**Frontend (Optional):**
- ✅ TẠO: `client/src/services/ghinhanthanhvien.js`
- ✅ TẠO: `client/src/pages/GhiNhanThanhVienPage.jsx` (hoặc component tương đương)

**Database:**
- ❌ KHÔNG cần sửa `init.sql` - các bảng và trigger hiện tại ĐÃ ĐỦ

---

### Ưu Điểm Của Giải Pháp

1. **Không cần sửa database schema** - tận dụng tối đa cấu trúc hiện có
2. **Tự động hóa cao** - trigger xử lý DOI, MaGiaPha, validation
3. **Transaction đảm bảo tính toàn vẹn** - rollback nếu có lỗi
4. **Dễ mở rộng** - có thể thêm loại quan hệ khác (anh/em, cô/dì...) sau này
5. **Tra cứu linh hoạt** - hỗ trợ nhiều filter

---

### Các Trigger Quan Trọng Đang Hoạt Động

| Trigger | Chức Năng |
|---------|-----------|
| `TRG_GEN_ID_THANHVIEN` | Tự động tạo MaTV (TV01, TV02...) |
| `TRG_INSERT_DOI_THANHVIEN_QUANHECON` | Đời con = Đời cha/mẹ + 1 |
| `TRG_INSERT_DOI_THANHVIEN_QUANHEVOCHONG` | Đời vợ = Đời chồng |
| `TRG_INSERT_MaGP_THANHVIEN_QUANHECON` | Tự động gán MaGiaPha từ cha/mẹ cho con |
| `TRG_INSERT_MaGP_THANHVIEN_QUANHEVOCHONG` | Tự động gán MaGiaPha từ chồng sang vợ |
| `TRG_CHECK_CHA_ME_QUANHECON` | Validate giới tính cha/mẹ |
| `TRG_CHECK_NGAY_SINH_CON_QUANHECON` | Validate ngày sinh con > ngày sinh cha/mẹ |
| `TRG_UPDATE_ME_QUANHECON` | Tự động điền mẹ nếu cha có vợ |

---

## 🚀 Lộ Trình Triển Khai

### Phase 1: Backend Core (Ưu tiên cao)
1. Tạo schema interface
2. Tạo service với transaction
3. Tạo controller với error handling
4. Tạo routes và đăng ký vào server
5. Test với Postman/Thunder Client

### Phase 2: Backend Enhancement (Tùy chọn)
6. Thêm middleware validation chi tiết
7. Thêm logging cho audit trail
8. Thêm endpoint xóa/sửa ghi nhận (nếu cần)

### Phase 3: Frontend (Sau khi backend ổn định)
9. Tạo service API
10. Tạo form component
11. Tạo trang tra cứu
12. Tích hợp vào menu/navigation

### Phase 4: Testing & Deployment
13. Unit test
14. Integration test
15. User acceptance test
16. Deploy lên production

---

## ❓ FAQ (Câu Hỏi Thường Gặp)

### Q1: Tại sao không tạo bảng mới "GhiNhanThanhVien"?
**A:** Vì dữ liệu đã được lưu trong THANHVIEN + QUANHECON/QUANHEVOCHONG. Tạo bảng mới sẽ dẫn đến trùng lặp dữ liệu và khó đồng bộ.

### Q2: Làm sao phân biệt được thành viên nào được "ghi nhận" và thành viên nào được "đăng ký thủ công"?
**A:** Xem cột `NgayPhatSinh` trong QUANHECON/QUANHEVOCHONG:
- Nếu có NgayPhatSinh → được ghi nhận có quan hệ
- Nếu không có trong bảng quan hệ → đăng ký thủ công

### Q3: Có thể ghi nhận con riêng (không rõ cha/mẹ) không?
**A:** Có. Chỉ cần điền MaTVCha HOẶC MaTVMe, bỏ trống cái còn lại. Trigger sẽ tự động xử lý.

### Q4: Có thể sửa/xóa ghi nhận đã tạo không?
**A:** Hiện tại chưa có endpoint sửa/xóa. Nếu cần, có thể:
- Xóa record trong QUANHECON/QUANHEVOCHONG
- Xóa THANHVIEN (nếu muốn xóa luôn thành viên)

### Q5: Có thể ghi nhận nhiều vợ không?
**A:** Có. QUANHEVOCHONG cho phép 1 MaTV có nhiều MaTVVC (đa thê). Chỉ cần gọi API nhiều lần với cùng MaTVCu.

---

## 📞 Hỗ Trợ & Liên Hệ

Nếu gặp vấn đề khi implement, vui lòng kiểm tra:
1. Log server (console.error)
2. Log MySQL (SHOW ERRORS)
3. Postman response body
4. Database state sau mỗi operation

**Chúc bạn implement thành công! 🎉**
