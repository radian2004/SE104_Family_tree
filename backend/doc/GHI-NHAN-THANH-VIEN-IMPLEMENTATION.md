# 📋 Hướng Dẫn Triển Khai Chức Năng "Ghi Nhận Thành Viên"

> **Ngày tạo:** 21/12/2024  
> **Mục đích:** Hướng dẫn chi tiết cách sửa đổi và bổ sung code để triển khai chức năng "Ghi Nhận Thành Viên"  
> **Lưu ý:** Tài liệu này chỉ hướng dẫn, KHÔNG tự động sửa code

---

## 📌 Mục Lục

1. [Tổng Quan Yêu Cầu](#1-tổng-quan-yêu-cầu)
2. [Phân Tích Cơ Sở Dữ Liệu](#2-phân-tích-cơ-sở-dữ-liệu)
3. [Thiết Kế API](#3-thiết-kế-api)
4. [Hướng Dẫn Triển Khai](#4-hướng-dẫn-triển-khai)
   - 4.1. [Schema - Định nghĩa kiểu dữ liệu](#41-schema---định-nghĩa-kiểu-dữ-liệu)
   - 4.2. [Service - Logic nghiệp vụ](#42-service---logic-nghiệp-vụ)
   - 4.3. [Controller - Xử lý request](#43-controller---xử-lý-request)
   - 4.4. [Route - Định tuyến API](#44-route---định-tuyến-api)
   - 4.5. [Messages - Thông báo](#45-messages---thông-báo)
5. [Validation Rules](#5-validation-rules)
6. [Test Cases](#6-test-cases)
7. [Lỗi Thường Gặp](#7-lỗi-thường-gặp)

---

## 1. Tổng Quan Yêu Cầu

### Mô Tả Chức Năng
Chức năng "Ghi Nhận Thành Viên" cho phép thêm một thành viên mới vào hệ thống gia phả, đồng thời thiết lập quan hệ với thành viên đã có trong hệ thống.

### Các Thuộc Tính Yêu Cầu

| STT | Thuộc Tính | Mô Tả | Bắt Buộc | Ghi Chú |
|-----|-----------|-------|----------|---------|
| 1 | Họ tên | Họ và tên đầy đủ của thành viên mới | Sửa | Tối đa 50 ký tự |
| 2 | Ngày giờ sinh | Ngày tháng năm sinh | Sửa | Format: DATETIME |
| 3 | Ngày phát sinh | Ngày làm giấy khai sinh / Ngày kết hôn | Sửa | Phụ thuộc vào loại quan hệ |
| 4 | Giới tính | Nam hoặc Nữ | Sửa | Giá trị: 'Nam' / 'Nữ' |
| 5 | Quê quán | Mã quê quán (FK) | Sửa | Tham chiếu bảng QUEQUAN |
| 6 | Nghề nghiệp | Mã nghề nghiệp (FK) | ❌ | Có thể NULL, tham chiếu bảng NGHENGHIEP |
| 7 | Địa chỉ | Địa chỉ hiện tại | Sửa | Tối đa 50 ký tự |
| 8 | Mã thành viên cũ | Mã TV của cha/mẹ hoặc chồng/vợ | Sửa | Tham chiếu bảng THANHVIEN |
| 9 | Loại quan hệ | Loại quan hệ với thành viên cũ | Sửa | Giá trị: 'Con cái' / 'Vợ/Chồng' |

---

## 2. Phân Tích Cơ Sở Dữ Liệu

### 2.1. Bảng THANHVIEN (Đã có)

```sql
CREATE TABLE THANHVIEN (
    MaTV VARCHAR(5) PRIMARY KEY,              -- Auto-gen: TV01, TV02... (Trigger)
    HoTen VARCHAR(50),                        -- Sửa Họ tên
    NgayGioSinh DATETIME,                     -- Sửa Ngày giờ sinh
    DiaChi VARCHAR(50),                       -- Sửa Địa chỉ
    TrangThai VARCHAR(20) DEFAULT 'Còn Sống', -- Mặc định 'Còn Sống'
    TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    DOI INT DEFAULT 0,                        -- Tự động tính qua trigger
    MaQueQuan VARCHAR(5),                     -- Sửa FK → QUEQUAN
    MaNgheNghiep VARCHAR(5),                  -- Sửa FK → NGHENGHIEP (NULL được)
    GioiTinh VARCHAR(3),                      -- Sửa 'Nam' / 'Nữ'
    MaNguyenNhanMat VARCHAR(5),               -- NULL khi còn sống
    NgayGioMat DATETIME,                      -- NULL khi còn sống
    MaDiaDiem VARCHAR(5),                     -- NULL khi còn sống
    MaGiaPha VARCHAR(5),                      -- Tự động gán qua trigger
    FOREIGN KEY(MaQueQuan) REFERENCES QUEQUAN(MaQueQuan),
    FOREIGN KEY(MaNgheNghiep) REFERENCES NGHENGHIEP(MaNgheNghiep),
    FOREIGN KEY(MaNguyenNhanMat) REFERENCES NGUYENNHANMAT(MaNguyenNhanMat),
    FOREIGN KEY(MaDiaDiem) REFERENCES DIADIEMMAITANG(MaDiaDiem)
);
```

**Kết luận:** Bảng THANHVIEN **KHÔNG CẦN SỬA ĐỔI**, đã có đầy đủ các cột.

---

### 2.2. Bảng QUANHECON (Quan Hệ Cha-Mẹ-Con) - Đã có

```sql
CREATE TABLE QUANHECON(
    MaTV VARCHAR(5) PRIMARY KEY,              -- Mã thành viên CON
    MaTVCha VARCHAR(5),                       -- Mã thành viên CHA (có thể NULL)
    MaTVMe VARCHAR(5),                        -- Mã thành viên MẸ (tự động gán từ trigger)
    NgayPhatSinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP(), -- Sửa Ngày làm giấy khai sinh
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(MaTVCha) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(MaTVMe) REFERENCES THANHVIEN(MaTV)
);
```

**Các Trigger liên quan:**
- `TRG_INSERT_DOI_THANHVIEN_QUANHECON`: Tự động tính DOI = DOI cha + 1
- `TRG_INSERT_MaGP_THANHVIEN_QUANHECON`: Tự động gán MaGiaPha từ cha/mẹ
- `TRG_CHECK_CHA_ME_QUANHECON`: Kiểm tra giới tính cha = Nam, mẹ = Nữ
- `TRG_CHECK_NGAY_SINH_CON_QUANHECON`: Kiểm tra ngày sinh con > ngày sinh cha/mẹ
- `TRG_UPDATE_ME_QUANHECON`: Tự động gán mẹ là vợ hiện tại của cha (nếu có)

**Kết luận:** Bảng QUANHECON **KHÔNG CẦN SỬA ĐỔI**.

---

### 2.3. Bảng QUANHEVOCHONG (Quan Hệ Vợ Chồng) - Đã có

```sql
CREATE TABLE QUANHEVOCHONG(
    MaTV VARCHAR(5),                          -- Mã TV trong gia phả (thường là chồng/con trai)
    MaTVVC VARCHAR(5),                        -- Mã TV vợ/chồng (thường là vợ từ ngoài)
    NgayBatDau DATE,                          -- Sửa Ngày kết hôn (= Ngày phát sinh)
    NgayKetThuc DATE,                         -- Ngày ly hôn (NULL = còn hôn nhân)
    PRIMARY KEY(MaTV, MaTVVC),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(MaTVVC) REFERENCES THANHVIEN(MaTV)
);
```

**Các Trigger liên quan:**
- `TRG_INSERT_DOI_THANHVIEN_QUANHEVOCHONG`: Tự động đồng bộ DOI giữa vợ chồng
- `TRG_INSERT_MaGP_THANHVIEN_QUANHEVOCHONG`: Tự động gán MaGiaPha từ chồng sang vợ

**Kết luận:** Bảng QUANHEVOCHONG **KHÔNG CẦN SỬA ĐỔI**.

---

### 2.4. Bảng Lookup (Tra Cứu)

| Bảng | Mô Tả | API Lấy Dữ Liệu |
|------|-------|-----------------|
| QUEQUAN | Danh sách quê quán | `GET /quequan` |
| NGHENGHIEP | Danh sách nghề nghiệp | `GET /nghenghiep` |

---

## 3. Thiết Kế API

### 3.1. Endpoint Chính

```
POST /thanhvien/ghi-nhan
```

### 3.2. Request Body

```json
{
  "HoTen": "Nguyễn Văn A",
  "NgayGioSinh": "2020-05-15 08:30:00",
  "GioiTinh": "Nam",
  "DiaChi": "123 Đường ABC, Quận 1, TP.HCM",
  "MaQueQuan": "QQ03",
  "MaNgheNghiep": null,
  "MaTVCu": "TV04",
  "LoaiQuanHe": "Con cái",
  "NgayPhatSinh": "2020-05-20"
}
```

### 3.3. Response Thành Công (201 Created)

```json
{
  "message": "Ghi nhận thành viên thành công",
  "data": {
    "MaTVMoi": "TV09",
    "HoTen": "Nguyễn Văn A",
    "NgayGioSinh": "2020-05-15T08:30:00.000Z",
    "GioiTinh": "Nam",
    "DiaChi": "123 Đường ABC, Quận 1, TP.HCM",
    "DOI": 4,
    "MaGiaPha": "GP02",
    "QuanHe": {
      "LoaiQuanHe": "Con cái",
      "TenThanhVienCu": "Nguyễn Văn Hùng",
      "MaTVCu": "TV04",
      "NgayPhatSinh": "2020-05-20"
    }
  }
}
```

### 3.4. Response Lỗi (400 Bad Request)

```json
{
  "message": "Ghi nhận thành viên thất bại",
  "error": "Không tìm thấy thành viên cũ với mã TV99"
}
```

---

## 4. Hướng Dẫn Triển Khai

### 4.1. Schema - Định nghĩa kiểu dữ liệu

**Tạo file mới:** `backend/src/models/requests/GhiNhanThanhVien.requests.ts`

```typescript
// src/models/requests/GhiNhanThanhVien.requests.ts

/**
 * Interface cho request body khi ghi nhận thành viên mới
 */
export interface GhiNhanThanhVienReqBody {
  // Thông tin thành viên mới
  HoTen: string;                              // Họ tên (required)
  NgayGioSinh: string;                        // Format: 'YYYY-MM-DD HH:mm:ss' hoặc 'YYYY-MM-DD'
  GioiTinh: 'Nam' | 'Nữ';                     // Giới tính (required)
  DiaChi: string;                             // Địa chỉ (required)
  MaQueQuan: string;                          // Mã quê quán - FK QUEQUAN (required)
  MaNgheNghiep?: string | null;               // Mã nghề nghiệp - FK NGHENGHIEP (optional)
  
  // Thông tin quan hệ
  MaTVCu: string;                             // Mã thành viên cũ (cha/mẹ/chồng/vợ)
  LoaiQuanHe: 'Con cái' | 'Vợ/Chồng';         // Loại quan hệ
  NgayPhatSinh: string;                       // Ngày phát sinh (ngày khai sinh / ngày kết hôn)
}

/**
 * Interface cho thông tin thành viên cũ (để validate và hiển thị)
 */
export interface ThanhVienCuInfo {
  MaTV: string;
  HoTen: string;
  GioiTinh: string;
  NgayGioSinh: Date;
  DOI: number;
  MaGiaPha: string | null;
}

/**
 * Interface cho response sau khi ghi nhận thành công
 */
export interface GhiNhanThanhVienResponse {
  message: string;
  data: {
    MaTVMoi: string;
    HoTen: string;
    NgayGioSinh: Date;
    GioiTinh: string;
    DiaChi: string;
    DOI: number;
    MaGiaPha: string;
    QuanHe: {
      LoaiQuanHe: string;
      TenThanhVienCu: string;
      MaTVCu: string;
      NgayPhatSinh: string;
    };
  };
}
```

---

### 4.2. Service - Logic nghiệp vụ

**Sửa file:** `backend/src/services/thanhvien.services.ts`

Thêm các method mới vào class `ThanhVienService`:

```typescript
// ========================================
// THÊM VÀO FILE: src/services/thanhvien.services.ts
// ========================================

import { 
  GhiNhanThanhVienReqBody, 
  ThanhVienCuInfo,
  GhiNhanThanhVienResponse 
} from '~/models/requests/GhiNhanThanhVien.requests';
import { PoolConnection } from 'mysql2/promise';

// Thêm interface này ở đầu file (sau các import)
interface QuanHeConRow extends RowDataPacket {
  MaTV: string;
  MaTVCha: string | null;
  MaTVMe: string | null;
  NgayPhatSinh: Date;
}

interface QuanHeVoChongRow extends RowDataPacket {
  MaTV: string;
  MaTVVC: string;
  NgayBatDau: Date;
  NgayKetThuc: Date | null;
}

// ========================================
// THÊM CÁC METHOD SAU VÀO CLASS ThanhVienService
// ========================================

class ThanhVienService {
  // ... (giữ nguyên các method hiện có) ...

  /**
   * Lấy thông tin thành viên cũ để validate và hiển thị
   */
  async getThanhVienCu(MaTV: string): Promise<ThanhVienCuInfo | null> {
    const sql = `
      SELECT MaTV, HoTen, GioiTinh, NgayGioSinh, DOI, MaGiaPha
      FROM THANHVIEN
      WHERE MaTV = ?
    `;
    const rows = await databaseService.query<ThanhVienRow[]>(sql, [MaTV]);
    
    if (!rows || rows.length === 0) {
      return null;
    }
    
    return rows[0] as unknown as ThanhVienCuInfo;
  }

  /**
   * Kiểm tra thành viên cũ đã có vợ/chồng chưa
   */
  async checkExistingSpouse(MaTV: string): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count
      FROM QUANHEVOCHONG
      WHERE (MaTV = ? OR MaTVVC = ?) AND NgayKetThuc IS NULL
    `;
    const rows = await databaseService.query<any[]>(sql, [MaTV, MaTV]);
    return rows[0]?.count > 0;
  }

  /**
   * Ghi nhận thành viên mới với quan hệ
   * Sử dụng TRANSACTION để đảm bảo tính toàn vẹn dữ liệu
   */
  async ghiNhanThanhVien(payload: GhiNhanThanhVienReqBody): Promise<GhiNhanThanhVienResponse> {
    const connection = await databaseService.getConnection();
    
    try {
      // Bắt đầu transaction
      await connection.beginTransaction();
      
      // [1] Validate: Lấy thông tin thành viên cũ
      const thanhvienCu = await this.getThanhVienCuWithConnection(connection, payload.MaTVCu);
      if (!thanhvienCu) {
        throw new Error(`Không tìm thấy thành viên cũ với mã ${payload.MaTVCu}`);
      }
      
      // [2] Validate logic nghiệp vụ theo loại quan hệ
      if (payload.LoaiQuanHe === 'Con cái') {
        // Thành viên cũ phải có giới tính hợp lệ (trigger sẽ check thêm)
        if (thanhvienCu.GioiTinh !== 'Nam' && thanhvienCu.GioiTinh !== 'Nữ') {
          throw new Error('Thành viên cũ phải có giới tính hợp lệ');
        }
        
        // Kiểm tra ngày sinh con phải sau ngày sinh cha/mẹ
        const ngaySinhCon = new Date(payload.NgayGioSinh);
        const ngaySinhCha = new Date(thanhvienCu.NgayGioSinh);
        if (ngaySinhCon <= ngaySinhCha) {
          throw new Error('Ngày sinh của con phải sau ngày sinh của cha/mẹ');
        }
      } else if (payload.LoaiQuanHe === 'Vợ/Chồng') {
        // Kiểm tra thành viên cũ đã có vợ/chồng chưa
        const hasSpouse = await this.checkExistingSpouseWithConnection(connection, payload.MaTVCu);
        if (hasSpouse) {
          throw new Error('Thành viên cũ đã có vợ/chồng hiện tại');
        }
      }
      
      // [3] INSERT thành viên mới vào bảng THANHVIEN
      const insertThanhVienSql = `
        INSERT INTO THANHVIEN (
          HoTen, NgayGioSinh, DiaChi, TrangThai, 
          DOI, MaQueQuan, MaNgheNghiep, GioiTinh
        ) VALUES (?, ?, ?, 'Còn Sống', 0, ?, ?, ?)
      `;
      
      await connection.execute(insertThanhVienSql, [
        payload.HoTen,
        payload.NgayGioSinh,
        payload.DiaChi,
        payload.MaQueQuan,
        payload.MaNgheNghiep || null,
        payload.GioiTinh
      ]);
      
      // [4] Lấy MaTV của thành viên vừa tạo (trigger tự gen)
      const [newMemberRows] = await connection.query<ThanhVienRow[]>(
        'SELECT * FROM THANHVIEN ORDER BY TGTaoMoi DESC LIMIT 1'
      );
      const newMember = newMemberRows[0];
      
      if (!newMember) {
        throw new Error('Không thể lấy thông tin thành viên vừa tạo');
      }
      
      // [5] INSERT quan hệ tương ứng
      if (payload.LoaiQuanHe === 'Con cái') {
        // Xác định cha/mẹ dựa trên giới tính thành viên cũ
        let insertQuanHeConSql: string;
        let quanHeParams: any[];
        
        if (thanhvienCu.GioiTinh === 'Nam') {
          // Thành viên cũ là CHA
          insertQuanHeConSql = `
            INSERT INTO QUANHECON (MaTV, MaTVCha, NgayPhatSinh)
            VALUES (?, ?, ?)
          `;
          quanHeParams = [newMember.MaTV, payload.MaTVCu, payload.NgayPhatSinh];
        } else {
          // Thành viên cũ là MẸ
          insertQuanHeConSql = `
            INSERT INTO QUANHECON (MaTV, MaTVMe, NgayPhatSinh)
            VALUES (?, ?, ?)
          `;
          quanHeParams = [newMember.MaTV, payload.MaTVCu, payload.NgayPhatSinh];
        }
        
        await connection.execute(insertQuanHeConSql, quanHeParams);
        
      } else if (payload.LoaiQuanHe === 'Vợ/Chồng') {
        // Xác định ai là MaTV (trong gia phả) và ai là MaTVVC (vợ/chồng)
        // Thường MaTV là người ĐÃ có trong gia phả (thành viên cũ)
        // MaTVVC là người mới vào (thành viên mới)
        const insertQuanHeVoChongSql = `
          INSERT INTO QUANHEVOCHONG (MaTV, MaTVVC, NgayBatDau, NgayKetThuc)
          VALUES (?, ?, ?, NULL)
        `;
        
        await connection.execute(insertQuanHeVoChongSql, [
          payload.MaTVCu,     // Thành viên cũ (trong gia phả)
          newMember.MaTV,     // Thành viên mới (vợ/chồng từ ngoài)
          payload.NgayPhatSinh // Ngày kết hôn
        ]);
      }
      
      // [6] Lấy lại thông tin thành viên mới sau khi trigger cập nhật DOI và MaGiaPha
      const [updatedMemberRows] = await connection.query<ThanhVienRow[]>(
        'SELECT * FROM THANHVIEN WHERE MaTV = ?',
        [newMember.MaTV]
      );
      const updatedMember = updatedMemberRows[0];
      
      // [7] Commit transaction
      await connection.commit();
      
      // [8] Trả về kết quả
      return {
        message: 'Ghi nhận thành viên thành công',
        data: {
          MaTVMoi: updatedMember.MaTV,
          HoTen: updatedMember.HoTen,
          NgayGioSinh: updatedMember.NgayGioSinh,
          GioiTinh: updatedMember.GioiTinh,
          DiaChi: updatedMember.DiaChi,
          DOI: updatedMember.DOI,
          MaGiaPha: updatedMember.MaGiaPha || '',
          QuanHe: {
            LoaiQuanHe: payload.LoaiQuanHe,
            TenThanhVienCu: thanhvienCu.HoTen,
            MaTVCu: payload.MaTVCu,
            NgayPhatSinh: payload.NgayPhatSinh
          }
        }
      };
      
    } catch (error) {
      // Rollback nếu có lỗi
      await connection.rollback();
      throw error;
    } finally {
      // Release connection
      connection.release();
    }
  }

  /**
   * Helper: Lấy thông tin thành viên cũ với connection (trong transaction)
   */
  private async getThanhVienCuWithConnection(
    connection: PoolConnection, 
    MaTV: string
  ): Promise<ThanhVienCuInfo | null> {
    const sql = `
      SELECT MaTV, HoTen, GioiTinh, NgayGioSinh, DOI, MaGiaPha
      FROM THANHVIEN
      WHERE MaTV = ?
    `;
    const [rows] = await connection.query<ThanhVienRow[]>(sql, [MaTV]);
    
    if (!rows || rows.length === 0) {
      return null;
    }
    
    return rows[0] as unknown as ThanhVienCuInfo;
  }

  /**
   * Helper: Kiểm tra có vợ/chồng với connection (trong transaction)
   */
  private async checkExistingSpouseWithConnection(
    connection: PoolConnection, 
    MaTV: string
  ): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count
      FROM QUANHEVOCHONG
      WHERE (MaTV = ? OR MaTVVC = ?) AND NgayKetThuc IS NULL
    `;
    const [rows] = await connection.query<any[]>(sql, [MaTV, MaTV]);
    return rows[0]?.count > 0;
  }

  /**
   * Lấy danh sách thành viên có thể làm cha/mẹ (để hiển thị dropdown)
   * Chỉ lấy những thành viên còn sống
   */
  async getAvailableParents(): Promise<ThanhVienRow[]> {
    const sql = `
      SELECT MaTV, HoTen, GioiTinh, NgayGioSinh, DOI, MaGiaPha
      FROM THANHVIEN
      WHERE TrangThai = 'Còn Sống'
      ORDER BY DOI, HoTen
    `;
    const rows = await databaseService.query<ThanhVienRow[]>(sql);
    return rows;
  }
}
```

---

### 4.3. Controller - Xử lý request

**Sửa file:** `backend/src/controllers/thanhvien.controllers.ts`

Thêm controller mới:

```typescript
// ========================================
// THÊM VÀO FILE: src/controllers/thanhvien.controllers.ts
// ========================================

import { GhiNhanThanhVienReqBody } from '~/models/requests/GhiNhanThanhVien.requests';

// Thêm controller sau các controller hiện có

/**
 * Controller ghi nhận thành viên mới với quan hệ
 * POST /thanhvien/ghi-nhan
 */
export const ghiNhanThanhVienController = async (req: Request, res: Response) => {
  const payload: GhiNhanThanhVienReqBody = req.body;
  
  try {
    // Validate cơ bản
    if (!payload.HoTen || !payload.NgayGioSinh || !payload.GioiTinh || 
        !payload.DiaChi || !payload.MaQueQuan || !payload.MaTVCu || 
        !payload.LoaiQuanHe || !payload.NgayPhatSinh) {
      return res.status(400).json({
        message: 'Thiếu thông tin bắt buộc',
        error: 'Vui lòng điền đầy đủ các trường: HoTen, NgayGioSinh, GioiTinh, DiaChi, MaQueQuan, MaTVCu, LoaiQuanHe, NgayPhatSinh'
      });
    }
    
    // Validate giới tính
    if (payload.GioiTinh !== 'Nam' && payload.GioiTinh !== 'Nữ') {
      return res.status(400).json({
        message: 'Giới tính không hợp lệ',
        error: 'Giới tính phải là "Nam" hoặc "Nữ"'
      });
    }
    
    // Validate loại quan hệ
    if (payload.LoaiQuanHe !== 'Con cái' && payload.LoaiQuanHe !== 'Vợ/Chồng') {
      return res.status(400).json({
        message: 'Loại quan hệ không hợp lệ',
        error: 'Loại quan hệ phải là "Con cái" hoặc "Vợ/Chồng"'
      });
    }
    
    // Gọi service
    const result = await thanhvienService.ghiNhanThanhVien(payload);
    
    return res.status(201).json(result);
    
  } catch (error: any) {
    console.error('Lỗi ghiNhanThanhVien:', error);
    
    // Xử lý lỗi từ trigger MySQL
    if (error.message.includes('Giới tính của cha phải là Nam')) {
      return res.status(400).json({
        message: 'Lỗi nghiệp vụ',
        error: 'Giới tính của cha phải là Nam'
      });
    }
    
    if (error.message.includes('Giới tính của mẹ phải là Nữ')) {
      return res.status(400).json({
        message: 'Lỗi nghiệp vụ',
        error: 'Giới tính của mẹ phải là Nữ'
      });
    }
    
    if (error.message.includes('Ngày sinh của con phải sau ngày sinh')) {
      return res.status(400).json({
        message: 'Lỗi nghiệp vụ',
        error: error.message
      });
    }
    
    return res.status(400).json({
      message: 'Ghi nhận thành viên thất bại',
      error: error.message
    });
  }
};

/**
 * Controller lấy danh sách thành viên có thể làm cha/mẹ/vợ/chồng
 * GET /thanhvien/available-relations
 */
export const getAvailableRelationsController = async (req: Request, res: Response) => {
  try {
    const result = await thanhvienService.getAvailableParents();
    
    return res.status(200).json({
      message: 'Lấy danh sách thành viên thành công',
      result: result
    });
    
  } catch (error: any) {
    console.error('Lỗi getAvailableRelations:', error);
    return res.status(400).json({
      message: 'Lấy danh sách thất bại',
      error: error.message
    });
  }
};
```

---

### 4.4. Route - Định tuyến API

**Sửa file:** `backend/src/routes/thanhvien.routes.ts`

```typescript
// ========================================
// THAY THẾ TOÀN BỘ NỘI DUNG FILE: src/routes/thanhvien.routes.ts
// ========================================

import { Router } from 'express';
import {
  registerController,
  getAllThanhVienController,
  getThanhVienByMaTVController,
  updateThanhVienController,
  deleteThanhVienController,
  ghiNhanThanhVienController,          // THÊM MỚI
  getAvailableRelationsController       // THÊM MỚI
} from '~/controllers/thanhvien.controllers';

const thanhvienRouter = Router();

// ========================================
// ROUTES HIỆN CÓ (giữ nguyên)
// ========================================

// POST /thanhvien/register - Đăng ký thành viên mới (không có quan hệ)
thanhvienRouter.post('/register', registerController);

// GET /thanhvien - Lấy tất cả thành viên
thanhvienRouter.get('/', getAllThanhVienController);

// GET /thanhvien/:MaTV - Lấy thành viên theo MaTV
thanhvienRouter.get('/:MaTV', getThanhVienByMaTVController);

// PUT /thanhvien/:MaTV - Cập nhật thành viên
thanhvienRouter.put('/:MaTV', updateThanhVienController);

// DELETE /thanhvien/:MaTV - Xóa thành viên
thanhvienRouter.delete('/:MaTV', deleteThanhVienController);

// ========================================
// ROUTES MỚI - GHI NHẬN THÀNH VIÊN
// ========================================

// POST /thanhvien/ghi-nhan - Ghi nhận thành viên mới với quan hệ
// ⚠️ LƯU Ý: Route này phải đặt TRƯỚC route /:MaTV để tránh conflict
thanhvienRouter.post('/ghi-nhan', ghiNhanThanhVienController);

// GET /thanhvien/available-relations - Lấy danh sách TV có thể làm cha/mẹ/vợ/chồng
// ⚠️ LƯU Ý: Route này phải đặt TRƯỚC route /:MaTV để tránh conflict
thanhvienRouter.get('/available-relations', getAvailableRelationsController);

export default thanhvienRouter;
```

**⚠️ QUAN TRỌNG:** Thứ tự routes rất quan trọng! Routes cụ thể như `/ghi-nhan` phải đặt TRƯỚC routes với parameter như `/:MaTV`, nếu không Express sẽ interpret `ghi-nhan` như là MaTV.

**Cách sắp xếp đúng:**

```typescript
// ĐẶT TRƯỚC routes có parameter (:MaTV)
thanhvienRouter.post('/ghi-nhan', ghiNhanThanhVienController);
thanhvienRouter.get('/available-relations', getAvailableRelationsController);

// ĐẶT SAU
thanhvienRouter.get('/:MaTV', getThanhVienByMaTVController);
thanhvienRouter.put('/:MaTV', updateThanhVienController);
thanhvienRouter.delete('/:MaTV', deleteThanhVienController);
```

---

### 4.5. Messages - Thông báo (Tùy chọn)

**Sửa file:** `backend/src/constants/messages.ts`

Thêm các thông báo mới:

```typescript
// ========================================
// THÊM VÀO FILE: src/constants/messages.ts
// ========================================

export const THANHVIEN_MESSAGES = {
  // Ghi nhận thành viên
  GHI_NHAN_SUCCESS: 'Ghi nhận thành viên thành công',
  GHI_NHAN_FAILED: 'Ghi nhận thành viên thất bại',
  
  // Validation
  MISSING_REQUIRED_FIELDS: 'Thiếu thông tin bắt buộc',
  INVALID_GENDER: 'Giới tính không hợp lệ. Phải là "Nam" hoặc "Nữ"',
  INVALID_RELATION_TYPE: 'Loại quan hệ không hợp lệ. Phải là "Con cái" hoặc "Vợ/Chồng"',
  
  // Errors
  MEMBER_NOT_FOUND: 'Không tìm thấy thành viên',
  OLD_MEMBER_NOT_FOUND: 'Không tìm thấy thành viên cũ',
  ALREADY_HAS_SPOUSE: 'Thành viên cũ đã có vợ/chồng hiện tại',
  INVALID_BIRTH_DATE: 'Ngày sinh của con phải sau ngày sinh của cha/mẹ',
  FATHER_MUST_BE_MALE: 'Giới tính của cha phải là Nam',
  MOTHER_MUST_BE_FEMALE: 'Giới tính của mẹ phải là Nữ',
  
  // Success
  GET_AVAILABLE_RELATIONS_SUCCESS: 'Lấy danh sách thành viên thành công',
} as const;
```

---

## 5. Validation Rules

### 5.1. Validation Phía Client

| Trường | Quy Tắc | Thông Báo Lỗi |
|--------|---------|---------------|
| HoTen | Required, 1-50 ký tự | "Họ tên không được để trống" |
| NgayGioSinh | Required, format datetime | "Ngày sinh không hợp lệ" |
| GioiTinh | Required, enum ['Nam', 'Nữ'] | "Giới tính phải là Nam hoặc Nữ" |
| DiaChi | Required, 1-50 ký tự | "Địa chỉ không được để trống" |
| MaQueQuan | Required, FK valid | "Quê quán không hợp lệ" |
| MaNgheNghiep | Optional, FK valid if provided | "Nghề nghiệp không hợp lệ" |
| MaTVCu | Required, FK valid | "Thành viên cũ không tồn tại" |
| LoaiQuanHe | Required, enum | "Loại quan hệ không hợp lệ" |
| NgayPhatSinh | Required, format date | "Ngày phát sinh không hợp lệ" |

### 5.2. Validation Phía Server (Trigger MySQL)

| Trigger | Mô Tả | Error Code |
|---------|-------|------------|
| TRG_CHECK_CHA_ME_QUANHECON | Kiểm tra giới tính cha = Nam, mẹ = Nữ | SQLSTATE 45003, 45004 |
| TRG_CHECK_NGAY_SINH_CON_QUANHECON | Kiểm tra ngày sinh con > ngày sinh cha/mẹ | SQLSTATE 45001, 45002 |

### 5.3. Business Logic Validation

```typescript
// Trong service, trước khi insert:

// 1. Nếu quan hệ là "Con cái" và thành viên cũ là Nam:
//    → INSERT QUANHECON với MaTVCha = MaTVCu
//    → Trigger TRG_UPDATE_ME_QUANHECON tự động gán MaTVMe = vợ hiện tại của cha

// 2. Nếu quan hệ là "Con cái" và thành viên cũ là Nữ:
//    → INSERT QUANHECON với MaTVMe = MaTVCu (không có cha)

// 3. Nếu quan hệ là "Vợ/Chồng":
//    → Kiểm tra thành viên cũ chưa có vợ/chồng (NgayKetThuc IS NULL)
//    → INSERT QUANHEVOCHONG với MaTV = MaTVCu, MaTVVC = MaTVMoi
```

---

## 6. Test Cases

### 6.1. Test Case 1: Ghi nhận con mới (cha đã có vợ)

**Request:**
```bash
curl -X POST http://localhost:3000/thanhvien/ghi-nhan \
  -H "Content-Type: application/json" \
  -d '{
    "HoTen": "Nguyễn Văn Mới",
    "NgayGioSinh": "2024-01-15 10:30:00",
    "GioiTinh": "Nam",
    "DiaChi": "Hà Nội",
    "MaQueQuan": "QQ00",
    "MaNgheNghiep": null,
    "MaTVCu": "TV04",
    "LoaiQuanHe": "Con cái",
    "NgayPhatSinh": "2024-01-20"
  }'
```

**Expected Response (201):**
```json
{
  "message": "Ghi nhận thành viên thành công",
  "data": {
    "MaTVMoi": "TV09",
    "HoTen": "Nguyễn Văn Mới",
    "DOI": 4,
    "MaGiaPha": "GP02",
    "QuanHe": {
      "LoaiQuanHe": "Con cái",
      "TenThanhVienCu": "Nguyễn Văn Hùng",
      "MaTVCu": "TV04"
    }
  }
}
```

### 6.2. Test Case 2: Ghi nhận vợ mới

**Request:**
```bash
curl -X POST http://localhost:3000/thanhvien/ghi-nhan \
  -H "Content-Type: application/json" \
  -d '{
    "HoTen": "Trần Thị Mai",
    "NgayGioSinh": "2000-05-20 08:00:00",
    "GioiTinh": "Nữ",
    "DiaChi": "TP.HCM",
    "MaQueQuan": "QQ03",
    "MaNgheNghiep": "NN02",
    "MaTVCu": "TV06",
    "LoaiQuanHe": "Vợ/Chồng",
    "NgayPhatSinh": "2024-12-01"
  }'
```

### 6.3. Test Case 3: Lỗi - Thành viên cũ không tồn tại

**Request:**
```bash
curl -X POST http://localhost:3000/thanhvien/ghi-nhan \
  -H "Content-Type: application/json" \
  -d '{
    "HoTen": "Test",
    "NgayGioSinh": "2024-01-15",
    "GioiTinh": "Nam",
    "DiaChi": "Test",
    "MaQueQuan": "QQ00",
    "MaTVCu": "TV99",
    "LoaiQuanHe": "Con cái",
    "NgayPhatSinh": "2024-01-20"
  }'
```

**Expected Response (400):**
```json
{
  "message": "Ghi nhận thành viên thất bại",
  "error": "Không tìm thấy thành viên cũ với mã TV99"
}
```

### 6.4. Test Case 4: Lỗi - Ngày sinh con trước ngày sinh cha

**Request:**
```bash
curl -X POST http://localhost:3000/thanhvien/ghi-nhan \
  -H "Content-Type: application/json" \
  -d '{
    "HoTen": "Nguyễn Văn Lỗi",
    "NgayGioSinh": "1970-01-01",
    "GioiTinh": "Nam",
    "DiaChi": "Test",
    "MaQueQuan": "QQ00",
    "MaTVCu": "TV04",
    "LoaiQuanHe": "Con cái",
    "NgayPhatSinh": "1970-01-05"
  }'
```

**Expected Response (400):**
```json
{
  "message": "Lỗi nghiệp vụ",
  "error": "Ngày sinh của con phải sau ngày sinh của cha/mẹ"
}
```

---

## 7. Lỗi Thường Gặp

### 7.1. Route Conflict

**Triệu chứng:** Gọi `POST /thanhvien/ghi-nhan` nhưng response trả về "Không tìm thấy thành viên"

**Nguyên nhân:** Route `/:MaTV` được định nghĩa trước `/ghi-nhan`, Express interpret `ghi-nhan` như là MaTV

**Giải pháp:** Đặt route `/ghi-nhan` và `/available-relations` TRƯỚC route `/:MaTV`

### 7.2. Transaction Rollback

**Triệu chứng:** Thành viên mới được tạo nhưng không có quan hệ

**Nguyên nhân:** Lỗi xảy ra sau INSERT THANHVIEN nhưng trước INSERT QUANHECON/QUANHEVOCHONG

**Giải pháp:** Kiểm tra log lỗi, đảm bảo connection.rollback() được gọi trong catch block

### 7.3. Trigger Error

**Triệu chứng:** Response trả về lỗi với SQLSTATE 45001/45002/45003/45004

**Nguyên nhân:** Trigger validation trong MySQL phát hiện lỗi nghiệp vụ

**Giải pháp:** Kiểm tra:
- 45001: Ngày sinh con <= ngày sinh mẹ
- 45002: Ngày sinh con <= ngày sinh cha
- 45003: Giới tính cha != 'Nam'
- 45004: Giới tính mẹ != 'Nữ'

### 7.4. Foreign Key Constraint

**Triệu chứng:** Error "Cannot add or update a child row: a foreign key constraint fails"

**Nguyên nhân:** MaQueQuan hoặc MaNgheNghiep không tồn tại trong bảng lookup

**Giải pháp:** Validate FK trước khi insert, sử dụng API lookup để lấy danh sách valid values

---

## 📊 Sơ Đồ Luồng Xử Lý

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                                │
│  POST /thanhvien/ghi-nhan                                            │
│  {                                                                    │
│    HoTen, NgayGioSinh, GioiTinh, DiaChi, MaQueQuan,                 │
│    MaNgheNghiep?, MaTVCu, LoaiQuanHe, NgayPhatSinh                  │
│  }                                                                    │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         CONTROLLER                                    │
│  1. Validate required fields                                         │
│  2. Validate GioiTinh ∈ ['Nam', 'Nữ']                               │
│  3. Validate LoaiQuanHe ∈ ['Con cái', 'Vợ/Chồng']                   │
│  4. Call thanhvienService.ghiNhanThanhVien(payload)                 │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          SERVICE                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    BEGIN TRANSACTION                             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                 │                                     │
│                                 ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  [1] Validate thành viên cũ tồn tại                            │ │
│  │      SELECT * FROM THANHVIEN WHERE MaTV = ?                     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                 │                                     │
│                                 ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  [2] Validate business logic                                     │ │
│  │      - Nếu "Con cái": check ngày sinh                           │ │
│  │      - Nếu "Vợ/Chồng": check đã có vợ/chồng chưa                │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                 │                                     │
│                                 ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  [3] INSERT INTO THANHVIEN (...)                                │ │
│  │      → Trigger TRG_GEN_ID_THANHVIEN auto-gen MaTV               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                 │                                     │
│                                 ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  [4] Lấy MaTV vừa tạo                                           │ │
│  │      SELECT * FROM THANHVIEN ORDER BY TGTaoMoi DESC LIMIT 1     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                 │                                     │
│                     ┌───────────┴───────────┐                        │
│                     │                       │                         │
│           LoaiQuanHe = 'Con cái'   LoaiQuanHe = 'Vợ/Chồng'          │
│                     │                       │                         │
│                     ▼                       ▼                         │
│  ┌─────────────────────────────┐ ┌────────────────────────────────┐ │
│  │  [5a] INSERT QUANHECON      │ │  [5b] INSERT QUANHEVOCHONG     │ │
│  │  (MaTV, MaTVCha/Me,         │ │  (MaTV, MaTVVC, NgayBatDau)    │ │
│  │   NgayPhatSinh)             │ │                                │ │
│  │                             │ │  → Trigger auto-update:        │ │
│  │  → Trigger auto-update:     │ │    - DOI                       │ │
│  │    - DOI = DOI_cha + 1      │ │    - MaGiaPha                  │ │
│  │    - MaGiaPha               │ │                                │ │
│  │    - MaTVMe (nếu cha có vợ) │ │                                │ │
│  └─────────────────────────────┘ └────────────────────────────────┘ │
│                     │                       │                         │
│                     └───────────┬───────────┘                        │
│                                 │                                     │
│                                 ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  [6] Lấy lại thông tin thành viên (sau khi trigger update)     │ │
│  │      SELECT * FROM THANHVIEN WHERE MaTV = ?                     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                 │                                     │
│                                 ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                       COMMIT                                      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        RESPONSE (201)                                 │
│  {                                                                    │
│    "message": "Ghi nhận thành viên thành công",                      │
│    "data": {                                                          │
│      "MaTVMoi": "TV09",                                              │
│      "HoTen": "...",                                                  │
│      "DOI": 4,                                                        │
│      "MaGiaPha": "GP02",                                             │
│      "QuanHe": { ... }                                               │
│    }                                                                  │
│  }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Tóm Tắt Các File Cần Sửa

| File | Hành Động | Mô Tả |
|------|-----------|-------|
| `src/models/requests/GhiNhanThanhVien.requests.ts` | **TẠO MỚI** | Định nghĩa interface cho request/response |
| `src/services/thanhvien.services.ts` | **SỬA** | Thêm method `ghiNhanThanhVien`, `getThanhVienCu`, `getAvailableParents` |
| `src/controllers/thanhvien.controllers.ts` | **SỬA** | Thêm `ghiNhanThanhVienController`, `getAvailableRelationsController` |
| `src/routes/thanhvien.routes.ts` | **SỬA** | Thêm routes `/ghi-nhan`, `/available-relations` |
| `src/constants/messages.ts` | **SỬA** (tùy chọn) | Thêm `THANHVIEN_MESSAGES` |

---

## Sửa Checklist Triển Khai

- [ ] Tạo file `GhiNhanThanhVien.requests.ts`
- [ ] Thêm import vào `thanhvien.services.ts`
- [ ] Thêm method `ghiNhanThanhVien` vào service
- [ ] Thêm method `getThanhVienCu` vào service
- [ ] Thêm method `getAvailableParents` vào service
- [ ] Thêm import vào `thanhvien.controllers.ts`
- [ ] Thêm `ghiNhanThanhVienController`
- [ ] Thêm `getAvailableRelationsController`
- [ ] Cập nhật `thanhvien.routes.ts` với routes mới
- [ ] **SẮP XẾP THỨ TỰ ROUTES đúng** (routes cụ thể trước routes có param)
- [ ] Test với Postman/curl
- [ ] Kiểm tra rollback khi có lỗi

---

> **Tác giả:** GitHub Copilot  
> **Phiên bản:** 1.0  
> **Cập nhật lần cuối:** 21/12/2024
