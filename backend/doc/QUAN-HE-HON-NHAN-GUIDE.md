# HƯỚNG DẪN IMPLEMENT CHỨC NĂNG QUẢN LÝ QUAN HỆ HÔN NHÂN

## � XÁC THỰC (AUTHENTICATION)

**⚠️ QUAN TRỌNG:** Chức năng này YÊU CẦU xác thực người dùng!

### Tại sao cần authentication?
- **Bảo mật**: Chỉ người dùng đã đăng nhập mới có quyền quản lý quan hệ hôn nhân
- **Nhất quán**: Giống với các chức năng khác: thành tích, kết thúc, thành viên
- **Kiểm soát**: Ngăn chặn truy cập trái phép vào dữ liệu gia phả

### Cách hoạt động:
1. **Người dùng đăng nhập** → Nhận `access_token`
2. **Mọi request** đến `/users/honnhan/*` phải gửi kèm token trong header
3. **Middleware `accessTokenValidator`** kiểm tra token hợp lệ
4. **Nếu hợp lệ** → Cho phép truy cập
5. **Nếu không hợp lệ** → Trả về lỗi 401 Unauthorized

### Route Structure:
```
/users                           (Public - không cần token)
  ├── /register                  (Đăng ký)
  └── /login                     (Đăng nhập)
  
/users/honnhan/*                 (Protected - CẦN token)
  ├── accessTokenValidator       (Middleware bảo vệ)
  └── honNhanRouter              (Các routes con)
      ├── POST /thietlap
      ├── GET /
      ├── GET /:MaTV
      ├── PUT /ketthuc
      └── DELETE /
```

---

## �📋 MÔ TẢ CHỨC NĂNG

Chức năng này cho phép thiết lập quan hệ hôn nhân giữa hai thành viên:
- **Thành viên A**: Đã có trong gia phả (có `MaGiaPha`)
- **Thành viên B**: Chưa có trong gia phả nhưng đã có trong database (không có `MaGiaPha` hoặc `MaGiaPha = NULL`)

### Yêu cầu nghiệp vụ:
1. Không cần kiểm tra nhập liệu (frontend đã xử lý)
2. Khi thiết lập hôn nhân, thành viên B sẽ tự động được gán vào cùng gia phả với thành viên A (thông qua trigger `TRG_INSERT_MaGP_THANHVIEN_HONNHAN`)
3. Hai thành viên sẽ tự động có cùng `DOI` (đời) thông qua trigger `TRG_INSERT_DOI_THANHVIEN_HONNHAN`

---

## 🗄️ CẤU TRÚC DATABASE HIỆN TẠI

### Bảng HONNHAN (Đã tồn tại trong `init.sql`)

```sql
CREATE TABLE HONNHAN(
	MaTV VARCHAR(5),           -- Mã thành viên (trong gia phả)
	MaTVVC VARCHAR(5),         -- Mã thành viên vợ/chồng (chưa có trong gia phả)
	NgayBatDau DATE,           -- Ngày đăng ký kết hôn
	NgayKetThuc DATE,          -- Ngày kết thúc hôn nhân (NULL = còn hôn nhân)
	PRIMARY KEY(MaTV, MaTVVC),
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(MaTVVC) REFERENCES THANHVIEN(MaTV)
);
```

### Các Triggers liên quan:

#### 1. TRG_INSERT_DOI_THANHVIEN_HONNHAN (Đã tồn tại)
**Mục đích**: Đảm bảo hai vợ chồng có cùng đời (DOI)
```sql
CREATE TRIGGER TRG_INSERT_DOI_THANHVIEN_HONNHAN
AFTER INSERT ON HONNHAN
FOR EACH ROW
BEGIN
    DECLARE partner_gen INT;
    
    -- Đời vợ
    SELECT DOI INTO partner_gen
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVVC;

    -- Nếu một bên có đời, mà bên kia chưa có hoặc khác thì cập nhật giống nhau
    IF partner_gen IS NOT NULL AND partner_gen = 0 THEN
        UPDATE THANHVIEN
        SET DOI = partner_gen
        WHERE MaTV = NEW.MaTVVC;
    END IF;
END;
```

#### 2. TRG_CHECK_NGAY_KET_HON_HONNHAN (Đã tồn tại - CẦN SỬA)
**Mục đích**: Kiểm tra ngày kết hôn hợp lệ (sau ngày sinh + tối thiểu 14 tuổi)

**⚠️ CẦN SỬA TRONG `init.sql`:**
```sql
-- XÓA trigger cũ
DROP TRIGGER IF EXISTS TRG_CHECK_NGAY_KET_HON_HONNHAN;

-- TẠO LẠI trigger mới với logic đầy đủ
CREATE TRIGGER TRG_CHECK_NGAY_KET_HON_HONNHAN
BEFORE INSERT ON HONNHAN
FOR EACH ROW
BEGIN
    DECLARE birth_date_1 DATE;
    DECLARE birth_date_2 DATE;
    DECLARE age_1 INT;
    DECLARE age_2 INT;

    -- Lấy ngày sinh của hai thành viên
    SELECT DATE(NgayGioSinh) INTO birth_date_1
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;

    SELECT DATE(NgayGioSinh) INTO birth_date_2
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVVC;

    -- Kiểm tra ngày kết hôn phải sau ngày sinh
    IF NEW.NgayBatDau <= birth_date_1 OR NEW.NgayBatDau <= birth_date_2 THEN
        SIGNAL SQLSTATE '45010'
        SET MESSAGE_TEXT = 'Ngày kết hôn phải sau ngày sinh thành viên!';
    END IF;

    -- ✅ THÊM MỚI: Tính tuổi tại ngày kết hôn
    SET age_1 = TIMESTAMPDIFF(YEAR, birth_date_1, NEW.NgayBatDau);
    SET age_2 = TIMESTAMPDIFF(YEAR, birth_date_2, NEW.NgayBatDau);

    -- ✅ THÊM MỚI: Kiểm tra cả hai phải trên 14 tuổi
    IF age_1 < 14 THEN
        SIGNAL SQLSTATE '45011'
        SET MESSAGE_TEXT = 'Thành viên phải đủ 14 tuổi trở lên mới được kết hôn!';
    END IF;

    IF age_2 < 14 THEN
        SIGNAL SQLSTATE '45012'
        SET MESSAGE_TEXT = 'Thành viên vợ/chồng phải đủ 14 tuổi trở lên mới được kết hôn!';
    END IF;
END;
```

#### 3. TRG_INSERT_MaGP_THANHVIEN_HONNHAN (Đã tồn tại)
**Mục đích**: Tự động gán gia phả cho vợ/chồng khi thiết lập hôn nhân
```sql
CREATE TRIGGER TRG_INSERT_MaGP_THANHVIEN_HONNHAN
AFTER INSERT ON HONNHAN
FOR EACH ROW
BEGIN
    DECLARE partner_gen VARCHAR(5);

    -- Lấy mã gia phả bạn đời (trong gia phả)
    SELECT MaGiaPha INTO partner_gen
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;

    -- Gán mã gia phả bằng bạn đời
    IF partner_gen IS NOT NULL THEN
        UPDATE THANHVIEN
        SET MaGiaPha = partner_gen
        WHERE MaTV = NEW.MaTVVC;
    END IF;
END;
```

#### 4. TRG_CHECK_HONNHAN_HOPLE (MỚI - CẦN THÊM)
**Mục đích**: Kiểm tra một thành viên chỉ được có 1 vợ/chồng tại một thời điểm và tái hôn hợp lệ

**⚠️ CẦN THÊM VÀO `init.sql`:**
```sql
CREATE TRIGGER TRG_CHECK_HONNHAN_HOPLE
BEFORE INSERT ON HONNHAN
FOR EACH ROW
BEGIN
    DECLARE existing_marriage_count INT;
    DECLARE last_end_date DATE;

    -- ✅ Kiểm tra MaTV có đang trong hôn nhân nào không (NgayKetThuc IS NULL)
    SELECT COUNT(*) INTO existing_marriage_count
    FROM HONNHAN
    WHERE (MaTV = NEW.MaTV OR MaTVVC = NEW.MaTV)
      AND NgayKetThuc IS NULL;

    IF existing_marriage_count > 0 THEN
        SIGNAL SQLSTATE '45013'
        SET MESSAGE_TEXT = 'Thành viên đang có hôn nhân hiện tại. Vui lòng kết thúc hôn nhân cũ trước khi kết hôn mới!';
    END IF;

    -- ✅ Kiểm tra MaTVVC có đang trong hôn nhân nào không
    SELECT COUNT(*) INTO existing_marriage_count
    FROM HONNHAN
    WHERE (MaTV = NEW.MaTVVC OR MaTVVC = NEW.MaTVVC)
      AND NgayKetThuc IS NULL;

    IF existing_marriage_count > 0 THEN
        SIGNAL SQLSTATE '45014'
        SET MESSAGE_TEXT = 'Vợ/Chồng đang có hôn nhân hiện tại. Vui lòng kết thúc hôn nhân cũ trước khi kết hôn mới!';
    END IF;

    -- ✅ Kiểm tra tái hôn: Ngày bắt đầu hôn nhân mới phải sau ngày kết thúc hôn nhân cũ
    -- Kiểm tra cho MaTV
    SELECT MAX(NgayKetThuc) INTO last_end_date
    FROM HONNHAN
    WHERE (MaTV = NEW.MaTV OR MaTVVC = NEW.MaTV)
      AND NgayKetThuc IS NOT NULL;

    IF last_end_date IS NOT NULL AND NEW.NgayBatDau <= last_end_date THEN
        SIGNAL SQLSTATE '45015'
        SET MESSAGE_TEXT = 'Ngày bắt đầu hôn nhân mới phải sau ngày kết thúc hôn nhân cũ!';
    END IF;

    -- Kiểm tra cho MaTVVC
    SELECT MAX(NgayKetThuc) INTO last_end_date
    FROM HONNHAN
    WHERE (MaTV = NEW.MaTVVC OR MaTVVC = NEW.MaTVVC)
      AND NgayKetThuc IS NOT NULL;

    IF last_end_date IS NOT NULL AND NEW.NgayBatDau <= last_end_date THEN
        SIGNAL SQLSTATE '45016'
        SET MESSAGE_TEXT = 'Ngày bắt đầu hôn nhân mới của vợ/chồng phải sau ngày kết thúc hôn nhân cũ!';
    END IF;
END;
```

#### 5. TRG_CHECK_NGAYMAT_HONNHAN (MỚI - CẦN THÊM)
**Mục đích**: Kiểm tra ngày mất của thành viên phải sau ngày bắt đầu hôn nhân

**⚠️ CẦN THÊM VÀO `init.sql`:**
```sql
CREATE TRIGGER TRG_CHECK_NGAYMAT_HONNHAN
BEFORE UPDATE ON THANHVIEN
FOR EACH ROW
BEGIN
    DECLARE earliest_marriage_date DATE;

    -- Chỉ kiểm tra khi cập nhật NgayGioMat (từ NULL thành có giá trị)
    IF NEW.NgayGioMat IS NOT NULL AND OLD.NgayGioMat IS NULL THEN
        
        -- Lấy ngày bắt đầu hôn nhân sớm nhất của thành viên
        SELECT MIN(NgayBatDau) INTO earliest_marriage_date
        FROM HONNHAN
        WHERE MaTV = NEW.MaTV OR MaTVVC = NEW.MaTV;

        -- Nếu có hôn nhân, kiểm tra ngày mất phải sau ngày bắt đầu hôn nhân
        IF earliest_marriage_date IS NOT NULL AND DATE(NEW.NgayGioMat) <= earliest_marriage_date THEN
            SIGNAL SQLSTATE '45017'
            SET MESSAGE_TEXT = 'Ngày mất phải sau ngày bắt đầu hôn nhân!';
        END IF;
    END IF;
END;
```

---

---

## 🔧 CẬP NHẬT TRIGGERS TRONG `init.sql`

### Bước 1: Mở file `backend/init.sql`

### Bước 2: Tìm và SỬA trigger `TRG_CHECK_NGAY_KET_HON_HONNHAN` (Dòng ~287-310)

**Tìm đoạn code cũ:**
```sql
-- 7. Ngày kết hôn phải sau ngày sinh
CREATE TRIGGER TRG_CHECK_NGAY_KET_HON_HONNHAN
BEFORE INSERT ON HONNHAN
FOR EACH ROW
BEGIN
    DECLARE birth_date_1 DATE;
    DECLARE birth_date_2 DATE;
    ...
END;
```

**Thay thế bằng:**
```sql
-- 7. Ngày kết hôn phải sau ngày sinh + tối thiểu 14 tuổi
DROP TRIGGER IF EXISTS TRG_CHECK_NGAY_KET_HON_HONNHAN;

CREATE TRIGGER TRG_CHECK_NGAY_KET_HON_HONNHAN
BEFORE INSERT ON HONNHAN
FOR EACH ROW
BEGIN
    DECLARE birth_date_1 DATE;
    DECLARE birth_date_2 DATE;
    DECLARE age_1 INT;
    DECLARE age_2 INT;

    -- Lấy ngày sinh của hai thành viên
    SELECT DATE(NgayGioSinh) INTO birth_date_1
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;

    SELECT DATE(NgayGioSinh) INTO birth_date_2
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVVC;

    -- Kiểm tra ngày kết hôn phải sau ngày sinh
    IF NEW.NgayBatDau <= birth_date_1 OR NEW.NgayBatDau <= birth_date_2 THEN
        SIGNAL SQLSTATE '45010'
        SET MESSAGE_TEXT = 'Ngày kết hôn phải sau ngày sinh thành viên!';
    END IF;

    -- Tính tuổi tại ngày kết hôn
    SET age_1 = TIMESTAMPDIFF(YEAR, birth_date_1, NEW.NgayBatDau);
    SET age_2 = TIMESTAMPDIFF(YEAR, birth_date_2, NEW.NgayBatDau);

    -- Kiểm tra cả hai phải trên 14 tuổi
    IF age_1 < 14 THEN
        SIGNAL SQLSTATE '45011'
        SET MESSAGE_TEXT = 'Thành viên phải đủ 14 tuổi trở lên mới được kết hôn!';
    END IF;

    IF age_2 < 14 THEN
        SIGNAL SQLSTATE '45012'
        SET MESSAGE_TEXT = 'Thành viên vợ/chồng phải đủ 14 tuổi trở lên mới được kết hôn!';
    END IF;
END;
```

### Bước 3: THÊM trigger mới `TRG_CHECK_HONNHAN_HOPLE` (Sau trigger số 7)

**Vị trí:** Sau trigger `TRG_CHECK_NGAY_KET_HON_HONNHAN`, trước trigger số 8

**Code cần thêm:**
```sql
-- 7a. Kiểm tra một thành viên chỉ có 1 vợ/chồng và tái hôn hợp lệ
CREATE TRIGGER TRG_CHECK_HONNHAN_HOPLE
BEFORE INSERT ON HONNHAN
FOR EACH ROW
BEGIN
    DECLARE existing_marriage_count INT;
    DECLARE last_end_date DATE;

    -- Kiểm tra MaTV có đang trong hôn nhân nào không (NgayKetThuc IS NULL)
    SELECT COUNT(*) INTO existing_marriage_count
    FROM HONNHAN
    WHERE (MaTV = NEW.MaTV OR MaTVVC = NEW.MaTV)
      AND NgayKetThuc IS NULL;

    IF existing_marriage_count > 0 THEN
        SIGNAL SQLSTATE '45013'
        SET MESSAGE_TEXT = 'Thành viên đang có hôn nhân hiện tại. Vui lòng kết thúc hôn nhân cũ trước khi kết hôn mới!';
    END IF;

    -- Kiểm tra MaTVVC có đang trong hôn nhân nào không
    SELECT COUNT(*) INTO existing_marriage_count
    FROM HONNHAN
    WHERE (MaTV = NEW.MaTVVC OR MaTVVC = NEW.MaTVVC)
      AND NgayKetThuc IS NULL;

    IF existing_marriage_count > 0 THEN
        SIGNAL SQLSTATE '45014'
        SET MESSAGE_TEXT = 'Vợ/Chồng đang có hôn nhân hiện tại. Vui lòng kết thúc hôn nhân cũ trước khi kết hôn mới!';
    END IF;

    -- Kiểm tra tái hôn: Ngày bắt đầu hôn nhân mới phải sau ngày kết thúc hôn nhân cũ
    -- Kiểm tra cho MaTV
    SELECT MAX(NgayKetThuc) INTO last_end_date
    FROM HONNHAN
    WHERE (MaTV = NEW.MaTV OR MaTVVC = NEW.MaTV)
      AND NgayKetThuc IS NOT NULL;

    IF last_end_date IS NOT NULL AND NEW.NgayBatDau <= last_end_date THEN
        SIGNAL SQLSTATE '45015'
        SET MESSAGE_TEXT = 'Ngày bắt đầu hôn nhân mới phải sau ngày kết thúc hôn nhân cũ!';
    END IF;

    -- Kiểm tra cho MaTVVC
    SELECT MAX(NgayKetThuc) INTO last_end_date
    FROM HONNHAN
    WHERE (MaTV = NEW.MaTVVC OR MaTVVC = NEW.MaTVVC)
      AND NgayKetThuc IS NOT NULL;

    IF last_end_date IS NOT NULL AND NEW.NgayBatDau <= last_end_date THEN
        SIGNAL SQLSTATE '45016'
        SET MESSAGE_TEXT = 'Ngày bắt đầu hôn nhân mới của vợ/chồng phải sau ngày kết thúc hôn nhân cũ!';
    END IF;
END;
```

### Bước 4: THÊM trigger mới `TRG_CHECK_NGAYMAT_HONNHAN` (Sau trigger số 13)

**Vị trí:** Sau trigger `TRG_UPDATE_TRANGTHAI_THANHVIEN_MaNguyenNhanMat`, trước trigger số 14

**Code cần thêm:**
```sql
-- 13a. Kiểm tra ngày mất phải sau ngày bắt đầu hôn nhân
CREATE TRIGGER TRG_CHECK_NGAYMAT_HONNHAN
BEFORE UPDATE ON THANHVIEN
FOR EACH ROW
BEGIN
    DECLARE earliest_marriage_date DATE;

    -- Chỉ kiểm tra khi cập nhật NgayGioMat (từ NULL thành có giá trị)
    IF NEW.NgayGioMat IS NOT NULL AND OLD.NgayGioMat IS NULL THEN
        
        -- Lấy ngày bắt đầu hôn nhân sớm nhất của thành viên
        SELECT MIN(NgayBatDau) INTO earliest_marriage_date
        FROM HONNHAN
        WHERE MaTV = NEW.MaTV OR MaTVVC = NEW.MaTV;

        -- Nếu có hôn nhân, kiểm tra ngày mất phải sau ngày bắt đầu hôn nhân
        IF earliest_marriage_date IS NOT NULL AND DATE(NEW.NgayGioMat) <= earliest_marriage_date THEN
            SIGNAL SQLSTATE '45017'
            SET MESSAGE_TEXT = 'Ngày mất phải sau ngày bắt đầu hôn nhân!';
        END IF;
    END IF;
END;
```

### Bước 5: Rebuild Database

**Chạy các lệnh sau trong terminal:**
```bash
# Dừng container
docker-compose down

# Xóa volume cũ (để reset database)
docker volume rm backend_mysql_data

# Khởi động lại (sẽ chạy init.sql mới)
docker-compose up -d
```

---

## 📁 CẤU TRÚC CODE CẦN TẠO

### 1. Schema: `src/models/schemas/HonNhan.schema.ts`

```typescript
// src/models/schemas/HonNhan.schema.ts

interface HonNhanType {
  MaTV: string;
  MaTVVC: string;
  NgayBatDau: Date;
  NgayKetThuc?: Date;
}

export default class HonNhan {
  MaTV: string;
  MaTVVC: string;
  NgayBatDau: Date;
  NgayKetThuc?: Date;

  constructor(honNhan: HonNhanType) {
    this.MaTV = honNhan.MaTV;
    this.MaTVVC = honNhan.MaTVVC;
    this.NgayBatDau = honNhan.NgayBatDau;
    this.NgayKetThuc = honNhan.NgayKetThuc;
  }
}
```

---

### 2. Service: `src/services/honnhan.services.ts`

```typescript
// src/services/honnhan.services.ts
import HonNhan from '~/models/schemas/HonNhan.schema';
import databaseService from './database.services';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface HonNhanRow extends RowDataPacket {
  MaTV: string;
  MaTVVC: string;
  NgayBatDau: Date;
  NgayKetThuc: Date | null;
}

interface HonNhanDetailRow extends RowDataPacket {
  MaTV: string;
  HoTenTV: string;
  MaTVVC: string;
  HoTenVC: string;
  NgayBatDau: Date;
  NgayKetThuc: Date | null;
  TrangThaiHonNhan: string;
}

class HonNhanService {
  /**
   * Thiết lập quan hệ hôn nhân
   * @param MaTV - Mã thành viên trong gia phả
   * @param MaTVVC - Mã vợ/chồng (chưa có trong gia phả)
   * @param NgayBatDau - Ngày đăng ký kết hôn
   * @param NgayKetThuc - Ngày kết thúc hôn nhân (optional)
   */
  async thietLapHonNhan(payload: {
    MaTV: string;
    MaTVVC: string;
    NgayBatDau: Date;
    NgayKetThuc?: Date;
  }) {
    const honNhan = new HonNhan(payload);

    const sql = `
      INSERT INTO HONNHAN (MaTV, MaTVVC, NgayBatDau, NgayKetThuc) 
      VALUES (?, ?, ?, ?)
    `;

    const params = [
      honNhan.MaTV,
      honNhan.MaTVVC,
      honNhan.NgayBatDau,
      honNhan.NgayKetThuc || null
    ];

    try {
      const result = await databaseService.query<ResultSetHeader>(sql, params);
      
      // Lấy thông tin chi tiết của quan hệ vừa tạo
      const detail = await this.getHonNhanDetail(honNhan.MaTV, honNhan.MaTVVC);

      return {
        message: 'Thiết lập quan hệ hôn nhân thành công',
        data: detail,
        affectedRows: result.affectedRows
      };
    } catch (error: any) {
      // Xử lý lỗi từ trigger
      if (error.code === 'ER_SIGNAL_EXCEPTION') {
        throw new Error(error.sqlMessage || 'Ngày kết hôn phải sau ngày sinh thành viên!');
      }
      // Xử lý lỗi duplicate key (quan hệ đã tồn tại)
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Quan hệ hôn nhân giữa hai thành viên này đã tồn tại!');
      }
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết một quan hệ hôn nhân
   */
  async getHonNhanDetail(MaTV: string, MaTVVC: string) {
    const sql = `
      SELECT 
        h.MaTV,
        tv1.HoTen AS HoTenTV,
        h.MaTVVC,
        tv2.HoTen AS HoTenVC,
        h.NgayBatDau,
        h.NgayKetThuc,
        CASE 
          WHEN h.NgayKetThuc IS NULL THEN 'Đang hôn nhân'
          ELSE 'Đã kết thúc'
        END AS TrangThaiHonNhan
      FROM HONNHAN h
      JOIN THANHVIEN tv1 ON h.MaTV = tv1.MaTV
      JOIN THANHVIEN tv2 ON h.MaTVVC = tv2.MaTV
      WHERE h.MaTV = ? AND h.MaTVVC = ?
    `;

    const [rows] = await databaseService.query<HonNhanDetailRow[]>(sql, [MaTV, MaTVVC]);
    return rows;
  }

  /**
   * Lấy tất cả quan hệ hôn nhân
   */
  async getAllHonNhan() {
    const sql = `
      SELECT 
        h.MaTV,
        tv1.HoTen AS HoTenTV,
        h.MaTVVC,
        tv2.HoTen AS HoTenVC,
        h.NgayBatDau,
        h.NgayKetThuc,
        CASE 
          WHEN h.NgayKetThuc IS NULL THEN 'Đang hôn nhân'
          ELSE 'Đã kết thúc'
        END AS TrangThaiHonNhan
      FROM HONNHAN h
      JOIN THANHVIEN tv1 ON h.MaTV = tv1.MaTV
      JOIN THANHVIEN tv2 ON h.MaTVVC = tv2.MaTV
      ORDER BY h.NgayBatDau DESC
    `;

    const rows = await databaseService.query<HonNhanDetailRow[]>(sql);
    return rows;
  }

  /**
   * Lấy danh sách quan hệ hôn nhân của một thành viên cụ thể
   */
  async getHonNhanByMaTV(MaTV: string) {
    const sql = `
      SELECT 
        h.MaTV,
        tv1.HoTen AS HoTenTV,
        h.MaTVVC,
        tv2.HoTen AS HoTenVC,
        h.NgayBatDau,
        h.NgayKetThuc,
        CASE 
          WHEN h.NgayKetThuc IS NULL THEN 'Đang hôn nhân'
          ELSE 'Đã kết thúc'
        END AS TrangThaiHonNhan
      FROM HONNHAN h
      JOIN THANHVIEN tv1 ON h.MaTV = tv1.MaTV
      JOIN THANHVIEN tv2 ON h.MaTVVC = tv2.MaTV
      WHERE h.MaTV = ? OR h.MaTVVC = ?
      ORDER BY h.NgayBatDau DESC
    `;

    const rows = await databaseService.query<HonNhanDetailRow[]>(sql, [MaTV, MaTV]);
    return rows;
  }

  /**
   * Cập nhật ngày kết thúc hôn nhân (ly hôn)
   */
  async ketThucHonNhan(MaTV: string, MaTVVC: string, NgayKetThuc: Date) {
    const sql = `
      UPDATE HONNHAN 
      SET NgayKetThuc = ? 
      WHERE MaTV = ? AND MaTVVC = ?
    `;

    const result = await databaseService.query<ResultSetHeader>(sql, [NgayKetThuc, MaTV, MaTVVC]);

    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy quan hệ hôn nhân để cập nhật');
    }

    return {
      message: 'Cập nhật kết thúc hôn nhân thành công',
      affectedRows: result.affectedRows
    };
  }

  /**
   * Xóa quan hệ hôn nhân
   */
  async xoaHonNhan(MaTV: string, MaTVVC: string) {
    const sql = `
      DELETE FROM HONNHAN 
      WHERE MaTV = ? AND MaTVVC = ?
    `;

    const result = await databaseService.query<ResultSetHeader>(sql, [MaTV, MaTVVC]);

    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy quan hệ hôn nhân để xóa');
    }

    return {
      message: 'Xóa quan hệ hôn nhân thành công',
      affectedRows: result.affectedRows
    };
  }

  /**
   * Lấy danh sách thành viên chưa có trong gia phả (để chọn làm vợ/chồng)
   */
  async getThanhVienKhongCoGiaPha() {
    const sql = `
      SELECT 
        MaTV,
        HoTen,
        NgayGioSinh,
        GioiTinh,
        DiaChi
      FROM THANHVIEN 
      WHERE MaGiaPha IS NULL
      ORDER BY HoTen
    `;

    const rows = await databaseService.query<RowDataPacket[]>(sql);
    return rows;
  }

  /**
   * Lấy danh sách thành viên trong gia phả cụ thể (để chọn làm người thiết lập hôn nhân)
   */
  async getThanhVienTrongGiaPha(MaGiaPha: string) {
    const sql = `
      SELECT 
        MaTV,
        HoTen,
        NgayGioSinh,
        GioiTinh,
        DiaChi,
        DOI
      FROM THANHVIEN 
      WHERE MaGiaPha = ?
      ORDER BY DOI, HoTen
    `;

    const rows = await databaseService.query<RowDataPacket[]>(sql, [MaGiaPha]);
    return rows;
  }
}

export default new HonNhanService();
```

---

### 3. Controller: `src/controllers/honnhan.controllers.ts`

```typescript
// src/controllers/honnhan.controllers.ts
import { Request, Response } from 'express';
import honNhanService from '~/services/honnhan.services';
import HTTP_STATUS from '~/constants/httpStatus';

/**
 * POST /honnhan/thietlap
 * Thiết lập quan hệ hôn nhân giữa hai thành viên
 * Body: { MaTV, MaTVVC, NgayBatDau, NgayKetThuc? }
 */
export const thietLapHonNhanController = async (req: Request, res: Response) => {
  const { MaTV, MaTVVC, NgayBatDau, NgayKetThuc } = req.body;

  try {
    // Validate dữ liệu đầu vào
    if (!MaTV || !MaTVVC || !NgayBatDau) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV, MaTVVC, NgayBatDau'
      });
    }

    const result = await honNhanService.thietLapHonNhan({
      MaTV,
      MaTVVC,
      NgayBatDau: new Date(NgayBatDau),
      NgayKetThuc: NgayKetThuc ? new Date(NgayKetThuc) : undefined
    });

    return res.status(HTTP_STATUS.CREATED).json(result);
  } catch (error: any) {
    console.error('Lỗi thietLapHonNhan:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Thiết lập quan hệ hôn nhân thất bại',
      error: error.message
    });
  }
};

/**
 * GET /honnhan
 * Lấy tất cả quan hệ hôn nhân
 */
export const getAllHonNhanController = async (req: Request, res: Response) => {
  try {
    const result = await honNhanService.getAllHonNhan();
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách quan hệ hôn nhân thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getAllHonNhan:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy danh sách quan hệ hôn nhân thất bại',
      error: error.message
    });
  }
};

/**
 * GET /honnhan/:MaTV
 * Lấy quan hệ hôn nhân của một thành viên cụ thể
 */
export const getHonNhanByMaTVController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await honNhanService.getHonNhanByMaTV(MaTV);
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy quan hệ hôn nhân thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getHonNhanByMaTV:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy quan hệ hôn nhân thất bại',
      error: error.message
    });
  }
};

/**
 * PUT /honnhan/ketthuc
 * Cập nhật ngày kết thúc hôn nhân (ly hôn)
 * Body: { MaTV, MaTVVC, NgayKetThuc }
 */
export const ketThucHonNhanController = async (req: Request, res: Response) => {
  const { MaTV, MaTVVC, NgayKetThuc } = req.body;

  try {
    if (!MaTV || !MaTVVC || !NgayKetThuc) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV, MaTVVC, NgayKetThuc'
      });
    }

    const result = await honNhanService.ketThucHonNhan(
      MaTV,
      MaTVVC,
      new Date(NgayKetThuc)
    );

    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    console.error('Lỗi ketThucHonNhan:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Cập nhật kết thúc hôn nhân thất bại',
      error: error.message
    });
  }
};

/**
 * DELETE /honnhan
 * Xóa quan hệ hôn nhân
 * Body: { MaTV, MaTVVC }
 */
export const xoaHonNhanController = async (req: Request, res: Response) => {
  const { MaTV, MaTVVC } = req.body;

  try {
    if (!MaTV || !MaTVVC) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV, MaTVVC'
      });
    }

    const result = await honNhanService.xoaHonNhan(MaTV, MaTVVC);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    console.error('Lỗi xoaHonNhan:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Xóa quan hệ hôn nhân thất bại',
      error: error.message
    });
  }
};

/**
 * GET /honnhan/available/khong-co-gia-pha
 * Lấy danh sách thành viên chưa có trong gia phả (để chọn làm vợ/chồng)
 */
export const getThanhVienKhongCoGiaPhaController = async (req: Request, res: Response) => {
  try {
    const result = await honNhanService.getThanhVienKhongCoGiaPha();
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách thành viên chưa có gia phả thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getThanhVienKhongCoGiaPha:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy danh sách thành viên thất bại',
      error: error.message
    });
  }
};

/**
 * GET /honnhan/available/trong-gia-pha/:MaGiaPha
 * Lấy danh sách thành viên trong gia phả cụ thể
 */
export const getThanhVienTrongGiaPhaController = async (req: Request, res: Response) => {
  const { MaGiaPha } = req.params;

  try {
    const result = await honNhanService.getThanhVienTrongGiaPha(MaGiaPha);
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách thành viên trong gia phả thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getThanhVienTrongGiaPha:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy danh sách thành viên thất bại',
      error: error.message
    });
  }
};
```

---

### 4. Routes: `src/routes/honnhan.routes.ts`

**⚠️ QUAN TRỌNG: Routes này KHÔNG cần `accessTokenValidator` vì đã được bảo vệ ở cấp cao hơn trong `users.routes.ts`**

```typescript
// src/routes/honnhan.routes.ts
import { Router } from 'express';
import {
  thietLapHonNhanController,
  getAllHonNhanController,
  getHonNhanByMaTVController,
  ketThucHonNhanController,
  xoaHonNhanController,
  getThanhVienKhongCoGiaPhaController,
  getThanhVienTrongGiaPhaController
} from '~/controllers/honnhan.controllers';
import { wrapAsync } from '~/utils/handlers';

const honNhanRouter = Router();

/**
 * POST /users/honnhan/thietlap
 * Thiết lập quan hệ hôn nhân
 * Body: { MaTV, MaTVVC, NgayBatDau, NgayKetThuc? }
 * ✅ YÊU CẦU: Access token (đã được validate ở users.routes.ts)
 */
honNhanRouter.post('/thietlap', wrapAsync(thietLapHonNhanController));

/**
 * GET /users/honnhan
 * Lấy tất cả quan hệ hôn nhân
 * ✅ YÊU CẦU: Access token (đã được validate ở users.routes.ts)
 */
honNhanRouter.get('/', wrapAsync(getAllHonNhanController));

/**
 * GET /users/honnhan/available/khong-co-gia-pha
 * Lấy danh sách thành viên chưa có trong gia phả
 * ✅ YÊU CẦU: Access token (đã được validate ở users.routes.ts)
 */
honNhanRouter.get('/available/khong-co-gia-pha', wrapAsync(getThanhVienKhongCoGiaPhaController));

/**
 * GET /users/honnhan/available/trong-gia-pha/:MaGiaPha
 * Lấy danh sách thành viên trong gia phả cụ thể
 * ✅ YÊU CẦU: Access token (đã được validate ở users.routes.ts)
 */
honNhanRouter.get('/available/trong-gia-pha/:MaGiaPha', wrapAsync(getThanhVienTrongGiaPhaController));

/**
 * GET /users/honnhan/:MaTV
 * Lấy quan hệ hôn nhân của một thành viên
 * ✅ YÊU CẦU: Access token (đã được validate ở users.routes.ts)
 */
honNhanRouter.get('/:MaTV', wrapAsync(getHonNhanByMaTVController));

/**
 * PUT /users/honnhan/ketthuc
 * Cập nhật ngày kết thúc hôn nhân
 * Body: { MaTV, MaTVVC, NgayKetThuc }
 * ✅ YÊU CẦU: Access token (đã được validate ở users.routes.ts)
 */
honNhanRouter.put('/ketthuc', wrapAsync(ketThucHonNhanController));

/**
 * DELETE /users/honnhan
 * Xóa quan hệ hôn nhân
 * Body: { MaTV, MaTVVC }
 * ✅ YÊU CẦU: Access token (đã được validate ở users.routes.ts)
 */
honNhanRouter.delete('/', wrapAsync(xoaHonNhanController));

export default honNhanRouter;
```

---

### 5. Đăng ký Routes trong `src/routes/users.routes.ts`

**⚠️ QUAN TRỌNG: Đăng ký honnhan vào TRONG users.routes.ts, KHÔNG phải index.ts**

**SỬA FILE `src/routes/users.routes.ts`:**

```typescript
import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController
} from '~/controllers/users.controllers';
import {
  registerValidator,
  loginValidator,
  accessTokenValidator,
  refreshTokenValidator
} from '~/middlewares/users.middlewares';
import { wrapAsync } from '~/utils/handlers';
import thanhvienRouter from './thanhvien.routes';
import thanhTichRouter from './thanhtich.routes';
import ketthucRouter from './ketthuc.routes';
import honNhanRouter from './honnhan.routes';  // ✅ THÊM DÒNG NÀY

const usersRouter = Router();

/**
 * Description: Đăng ký tài khoản
 * Path: /users/register
 * Method: POST
 * Body: { name: string, email: string, password: string, confirm_password: string }
 */
usersRouter.post('/register', registerValidator, wrapAsync(registerController));

/**
 * Description: Đăng nhập
 * Path: /users/login
 * Method: POST
 * Body: { email: string, password: string }
 */
usersRouter.post('/login', loginValidator, wrapAsync(loginController));

/**
 * Description: Đăng xuất
 * Path: /users/logout
 * Method: POST
 * Headers: { Authorization: Bearer <access_token> }
 * Body: { refresh_token: string }
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController));

// 🔍 DEBUG: Log khi route được đăng ký
console.log('✅ Đang đăng ký nested routes...');
console.log('  - /thanhvien');
console.log('  - /thanhtich');
console.log('  - /ketthuc');
console.log('  - /honnhan');  // ✅ THÊM DÒNG NÀY

// ✅ Đăng ký nested routes với authentication
usersRouter.use('/thanhvien', accessTokenValidator, thanhvienRouter);
usersRouter.use('/thanhtich', accessTokenValidator, thanhTichRouter);
usersRouter.use('/ketthuc', accessTokenValidator, ketthucRouter);
usersRouter.use('/honnhan', accessTokenValidator, honNhanRouter);  // ✅ THÊM DÒNG NÀY

console.log('✅ Đã đăng ký xong nested routes!');

export default usersRouter;
```

**GIẢI THÍCH:**
- **accessTokenValidator**: Middleware kiểm tra access token hợp lệ
- Tất cả routes trong `honNhanRouter` sẽ tự động yêu cầu authentication
- Path sẽ là: `/users/honnhan/*` thay vì `/honnhan/*`

---

### 6. XÓA route cũ trong `src/index.ts`

**SỬA FILE `src/index.ts` - XÓA DÒNG:**

```typescript
// XÓA IMPORT NÀY:
import honNhanRouter from '~/routes/honnhan.routes';  // ❌ XÓA DÒNG NÀY

// XÓA ĐĂNG KÝ ROUTE NÀY:
app.use('/honnhan', honNhanRouter);  // ❌ XÓA DÒNG NÀY
```

**KẾT QUẢ SAU KHI XÓA - File `src/index.ts` chỉ còn:**

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';
import quanHeConRouter from '~/routes/quanhecon.routes';  // Giữ lại nếu có
import { defaultErrorHandler } from '~/middlewares/error.middlewares';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware parse JSON
app.use(express.json());
app.use(cookieParser());

// CORS - QUAN TRỌNG: Phải cho phép credentials
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes - CHỈ CÒN users router
app.use('/users', usersRouter);
app.use('/quanhecon', quanHeConRouter);  // Giữ lại nếu có (hoặc cũng nên chuyển vào users)

// Default error handler (đặt sau tất cả routes)
app.use(defaultErrorHandler);

// Kết nối database và start server
databaseService.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  });
});
```

---

## 📝 API ENDPOINTS

**⚠️ LƯU Ý:** 
- **TẤT CẢ** endpoints đều yêu cầu authentication (access token)
- Gửi access token trong header: `Authorization: Bearer <access_token>`
- Access token lấy được sau khi đăng nhập thành công
- Base path: `/users/honnhan/*` (KHÔNG còn là `/honnhan/*`)

---

### 1. Thiết lập quan hệ hôn nhân

**POST** `/users/honnhan/thietlap`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "MaTV": "TV01",
  "MaTVVC": "TV05",
  "NgayBatDau": "2024-01-15",
  "NgayKetThuc": null
}
```

**Response (Success - 201):**
```json
{
  "message": "Thiết lập quan hệ hôn nhân thành công",
  "data": {
    "MaTV": "TV01",
    "HoTenTV": "Nguyễn Văn An",
    "MaTVVC": "TV05",
    "HoTenVC": "Trần Thị Bình",
    "NgayBatDau": "2024-01-15T00:00:00.000Z",
    "NgayKetThuc": null,
    "TrangThaiHonNhan": "Đang hôn nhân"
  },
  "affectedRows": 1
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "message": "Access token is required"
}
```

**Response (Error - 400):**
```json
{
  "message": "Thiết lập quan hệ hôn nhân thất bại",
  "error": "Ngày kết hôn phải sau ngày sinh thành viên!"
}
```

---

### 2. Lấy tất cả quan hệ hôn nhân

**GET** `/users/honnhan`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```json
{
  "message": "Lấy danh sách quan hệ hôn nhân thành công",
  "total": 2,
  "result": [
    {
      "MaTV": "TV01",
      "HoTenTV": "Nguyễn Văn An",
      "MaTVVC": "TV05",
      "HoTenVC": "Trần Thị Bình",
      "NgayBatDau": "2024-01-15T00:00:00.000Z",
      "NgayKetThuc": null,
      "TrangThaiHonNhan": "Đang hôn nhân"
    },
    {
      "MaTV": "TV02",
      "HoTenTV": "Lê Văn Cường",
      "MaTVVC": "TV06",
      "HoTenVC": "Phạm Thị Dung",
      "NgayBatDau": "2020-06-20T00:00:00.000Z",
      "NgayKetThuc": "2023-12-31T00:00:00.000Z",
      "TrangThaiHonNhan": "Đã kết thúc"
    }
  ]
}
```

---

### 3. Lấy quan hệ hôn nhân của một thành viên

**GET** `/users/honnhan/:MaTV`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Ví dụ:** `/users/honnhan/TV01`

**Response (Success - 200):**
```json
{
  "message": "Lấy quan hệ hôn nhân thành công",
  "total": 1,
  "result": [
    {
      "MaTV": "TV01",
      "HoTenTV": "Nguyễn Văn An",
      "MaTVVC": "TV05",
      "HoTenVC": "Trần Thị Bình",
      "NgayBatDau": "2024-01-15T00:00:00.000Z",
      "NgayKetThuc": null,
      "TrangThaiHonNhan": "Đang hôn nhân"
    }
  ]
}
```

---

### 4. Cập nhật kết thúc hôn nhân (Ly hôn)

**PUT** `/users/honnhan/ketthuc`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "MaTV": "TV01",
  "MaTVVC": "TV05",
  "NgayKetThuc": "2024-12-31"
}
```

**Response (Success - 200):**
```json
{
  "message": "Cập nhật kết thúc hôn nhân thành công",
  "affectedRows": 1
}
```

---

### 5. Xóa quan hệ hôn nhân

**DELETE** `/users/honnhan`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "MaTV": "TV01",
  "MaTVVC": "TV05"
}
```

**Response (Success - 200):**
```json
{
  "message": "Xóa quan hệ hôn nhân thành công",
  "affectedRows": 1
}
```

---

### 6. Lấy danh sách thành viên chưa có gia phả

**GET** `/users/honnhan/available/khong-co-gia-pha`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Mục đích:** Lấy danh sách thành viên có thể chọn làm vợ/chồng (chưa có trong gia phả)

**Response (Success - 200):**
```json
{
  "message": "Lấy danh sách thành viên chưa có gia phả thành công",
  "total": 3,
  "result": [
    {
      "MaTV": "TV10",
      "HoTen": "Hoàng Văn Em",
      "NgayGioSinh": "1995-03-15T00:00:00.000Z",
      "GioiTinh": "Nam",
      "DiaChi": "Hà Nội"
    },
    {
      "MaTV": "TV11",
      "HoTen": "Đỗ Thị Phương",
      "NgayGioSinh": "1998-07-20T00:00:00.000Z",
      "GioiTinh": "Nữ",
      "DiaChi": "Hải Phòng"
    }
  ]
}
```

---

### 7. Lấy danh sách thành viên trong gia phả cụ thể

**GET** `/users/honnhan/available/trong-gia-pha/:MaGiaPha`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Ví dụ:** `/users/honnhan/available/trong-gia-pha/GP01`

**Mục đích:** Lấy danh sách thành viên trong gia phả để chọn thiết lập hôn nhân

**Response (Success - 200):**
```json
{
  "message": "Lấy danh sách thành viên trong gia phả thành công",
  "total": 5,
  "result": [
    {
      "MaTV": "TV01",
      "HoTen": "Nguyễn Văn An",
      "NgayGioSinh": "1990-01-01T00:00:00.000Z",
      "GioiTinh": "Nam",
      "DiaChi": "Hà Nội",
      "DOI": 1
    },
    {
      "MaTV": "TV04",
      "HoTen": "Nguyễn Văn Hùng",
      "NgayGioSinh": "2015-03-20T00:00:00.000Z",
      "GioiTinh": "Nam",
      "DiaChi": "Hà Nội",
      "DOI": 2
    }
  ]
}
```

---

## 🔄 LUỒNG SỬ DỤNG TỪ FRONTEND

### Luồng đăng nhập và thiết lập hôn nhân:

```
0. Người dùng đăng nhập để lấy access token
   POST /users/login
   Body: { email, password }
   → Nhận được: { access_token, refresh_token }
   ↓
1. Người dùng chọn gia phả muốn thiết lập hôn nhân
   ↓
2. Frontend gọi: GET /users/honnhan/available/trong-gia-pha/GP01
   Headers: { Authorization: "Bearer <access_token>" }
   → Lấy danh sách thành viên trong gia phả GP01
   ↓
3. Người dùng chọn thành viên trong gia phả (ví dụ: TV01)
   ↓
4. Frontend gọi: GET /users/honnhan/available/khong-co-gia-pha
   Headers: { Authorization: "Bearer <access_token>" }
   → Lấy danh sách thành viên chưa có trong gia phả
   ↓
5. Người dùng chọn vợ/chồng từ danh sách (ví dụ: TV10)
   ↓
6. Người dùng nhập ngày kết hôn
   ↓
7. Frontend gọi: POST /users/honnhan/thietlap
   Headers: { Authorization: "Bearer <access_token>" }
   Body: { MaTV: "TV01", MaTVVC: "TV10", NgayBatDau: "2024-01-15" }
   ↓
8. Backend xử lý:
   - Kiểm tra access token hợp lệ (middleware accessTokenValidator)
   - Insert vào bảng HONNHAN
   - Trigger TRG_INSERT_MaGP_THANHVIEN_HONNHAN tự động gán MaGiaPha cho TV10
   - Trigger TRG_INSERT_DOI_THANHVIEN_HONNHAN tự động đồng bộ DOI
   ↓
9. Trả về kết quả thành công với thông tin chi tiết
```

### Xử lý khi token hết hạn:

```
1. API trả về 401 Unauthorized
   ↓
2. Frontend tự động gọi refresh token
   POST /users/logout (với refresh_token)
   ↓
3. Nhận access_token mới
   ↓
4. Thử lại request ban đầu với token mới
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Authentication (Xác thực):
- **BẮT BUỘC**: Tất cả API đều yêu cầu access token
- **Cách gửi token**: Thêm vào header `Authorization: Bearer <access_token>`
- **Lấy token**: Đăng nhập qua `POST /users/login` để nhận access_token
- **Token hết hạn**: Frontend cần xử lý refresh token tự động

### 2. Nested Routes (Routes lồng nhau):
- **Path**: `/users/honnhan/*` (KHÔNG còn là `/honnhan/*`)
- **Lý do**: Tất cả chức năng liên quan đến gia phả phải được bảo vệ bởi authentication
- **Middleware**: `accessTokenValidator` được áp dụng ở level `users.routes.ts`
- **Tương tự**: `/users/thanhtich`, `/users/ketthuc`, `/users/thanhvien`

### 3. Trigger tự động xử lý:
- **TRG_INSERT_MaGP_THANHVIEN_HONNHAN**: Tự động gán gia phả cho vợ/chồng
- **TRG_INSERT_DOI_THANHVIEN_HONNHAN**: Tự động đồng bộ đời (DOI) của hai vợ chồng
- **TRG_CHECK_NGAY_KET_HON_HONNHAN**: Kiểm tra ngày kết hôn hợp lệ và tuổi tối thiểu 14
- **TRG_CHECK_HONNHAN_HOPLE**: Kiểm tra một thành viên chỉ có 1 vợ/chồng và tái hôn hợp lệ
- **TRG_CHECK_NGAYMAT_HONNHAN**: Kiểm tra ngày mất phải sau ngày bắt đầu hôn nhân

### 4. Logic nghiệp vụ được kiểm tra:
- ✅ Ngày kết hôn phải sau ngày sinh
- ✅ Cả hai người phải đủ 14 tuổi trở lên
- ✅ Một thành viên chỉ được có 1 vợ/chồng tại một thời điểm
- ✅ Nếu ly hôn và tái hôn, ngày bắt đầu hôn nhân mới phải sau ngày kết thúc hôn nhân cũ
- ✅ Ngày mất phải sau ngày bắt đầu hôn nhân
- ✅ Frontend đã xử lý logic chọn thành viên phù hợp
- ✅ Backend kiểm tra tất cả ràng buộc và để trigger xử lý

### 5. Xử lý lỗi:
- **401 Unauthorized**: Token không hợp lệ hoặc hết hạn
- **400 Bad Request**: Lỗi từ trigger hoặc validation
- **500 Internal Server Error**: Lỗi server

### 6. Primary Key phức hợp:
- Bảng HONNHAN có PRIMARY KEY(MaTV, MaTVVC)
- Không thể có 2 record giống nhau về cặp (MaTV, MaTVVC)

---

## 🧪 TEST APIs

**⚠️ LƯU Ý**: Trước khi test, phải đăng nhập để lấy access token!

### Bước 0: Đăng nhập để lấy token

```bash
POST http://localhost:4000/users/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "YourPassword123!"
}

# Response sẽ trả về access_token
# Copy access_token để dùng cho các request sau
```

---

### Test với Postman/Thunder Client:

#### 1. Test thiết lập hôn nhân:
```bash
POST http://localhost:4000/users/honnhan/thietlap
Authorization: Bearer <your_access_token_here>
Content-Type: application/json

{
  "MaTV": "TV02",
  "MaTVVC": "TV03",
  "NgayBatDau": "1970-06-15"
}
```

#### 2. Test lấy tất cả quan hệ:
```bash
GET http://localhost:4000/users/honnhan
Authorization: Bearer <your_access_token_here>
```

#### 3. Test lấy theo thành viên:
```bash
GET http://localhost:4000/users/honnhan/TV02
Authorization: Bearer <your_access_token_here>
```

#### 4. Test lấy thành viên chưa có gia phả:
```bash
GET http://localhost:4000/users/honnhan/available/khong-co-gia-pha
Authorization: Bearer <your_access_token_here>
```

#### 5. Test lấy thành viên trong gia phả:
```bash
GET http://localhost:4000/users/honnhan/available/trong-gia-pha/GP01
Authorization: Bearer <your_access_token_here>
```

#### 6. Test kết thúc hôn nhân:
```bash
PUT http://localhost:4000/users/honnhan/ketthuc
Authorization: Bearer <your_access_token_here>
Content-Type: application/json

{
  "MaTV": "TV02",
  "MaTVVC": "TV03",
  "NgayKetThuc": "2024-12-31"
}
```

#### 7. Test xóa quan hệ:
```bash
DELETE http://localhost:4000/users/honnhan
Authorization: Bearer <your_access_token_here>
Content-Type: application/json

{
  "MaTV": "TV02",
  "MaTVVC": "TV03"
}
```

---

### Test Authentication Failure (Không có token):

```bash
# Nếu không gửi token, sẽ nhận lỗi 401
GET http://localhost:4000/users/honnhan

# Response:
{
  "message": "Access token is required"
}
```

---

## 🧪 TEST CASES CHO CÁC TRIGGER MỚI

### Test Case 1: Kiểm tra tuổi tối thiểu (14 tuổi)

**Scenario:** Thành viên dưới 14 tuổi không được kết hôn

```bash
POST http://localhost:4000/users/honnhan/thietlap
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "MaTV": "TV08",
  "MaTVVC": "TV07",
  "NgayBatDau": "2025-01-01"
}

# Expected Response (400):
{
  "message": "Thiết lập quan hệ hôn nhân thất bại",
  "error": "Thành viên phải đủ 14 tuổi trở lên mới được kết hôn!"
}
```

**Giải thích:** TV08 sinh năm 2024, năm 2025 mới 1 tuổi → Không đủ 14 tuổi

---

### Test Case 2: Kiểm tra một thành viên chỉ có 1 vợ/chồng

**Scenario:** Không thể kết hôn khi đang có hôn nhân hiện tại

```bash
# Giả sử TV02 đang có hôn nhân với TV03 (NgayKetThuc = NULL)

POST http://localhost:4000/users/honnhan/thietlap
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "MaTV": "TV02",
  "MaTVVC": "TV05",
  "NgayBatDau": "2025-01-15"
}

# Expected Response (400):
{
  "message": "Thiết lập quan hệ hôn nhân thất bại",
  "error": "Thành viên đang có hôn nhân hiện tại. Vui lòng kết thúc hôn nhân cũ trước khi kết hôn mới!"
}
```

---

### Test Case 3: Kiểm tra tái hôn hợp lệ

**Scenario:** Ngày bắt đầu hôn nhân mới phải sau ngày kết thúc hôn nhân cũ

**Bước 1: Kết thúc hôn nhân cũ**
```bash
PUT http://localhost:4000/users/honnhan/ketthuc
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "MaTV": "TV02",
  "MaTVVC": "TV03",
  "NgayKetThuc": "2024-12-31"
}
```

**Bước 2: Thử tái hôn với ngày không hợp lệ (trước ngày kết thúc)**
```bash
POST http://localhost:4000/users/honnhan/thietlap
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "MaTV": "TV02",
  "MaTVVC": "TV05",
  "NgayBatDau": "2024-06-01"
}

# Expected Response (400):
{
  "message": "Thiết lập quan hệ hôn nhân thất bại",
  "error": "Ngày bắt đầu hôn nhân mới phải sau ngày kết thúc hôn nhân cũ!"
}
```

**Bước 3: Tái hôn với ngày hợp lệ (sau ngày kết thúc)**
```bash
POST http://localhost:4000/users/honnhan/thietlap
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "MaTV": "TV02",
  "MaTVVC": "TV05",
  "NgayBatDau": "2025-01-15"
}

# Expected Response (201):
{
  "message": "Thiết lập quan hệ hôn nhân thành công",
  "data": { ... }
}
```

---

### Test Case 4: Kiểm tra ngày mất phải sau ngày bắt đầu hôn nhân

**Scenario:** Cập nhật ngày mất cho thành viên có hôn nhân

**Giả sử:** TV02 có hôn nhân bắt đầu từ ngày 1970-06-15

**Test 1: Ngày mất trước ngày kết hôn (KHÔNG HỢP LỆ)**

```bash
# Gọi API cập nhật thông tin kết thúc
PUT http://localhost:4000/users/ketthuc/TV02
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "NgayGioMat": "1960-01-01 10:00:00",
  "MaNguyenNhanMat": "NNM01",
  "MaDiaDiem": "DD01"
}

# Expected Response (400):
{
  "message": "Cập nhật thông tin kết thúc thất bại",
  "error": "Ngày mất phải sau ngày bắt đầu hôn nhân!"
}
```

**Test 2: Ngày mất sau ngày kết hôn (HỢP LỆ)**

```bash
PUT http://localhost:4000/users/ketthuc/TV02
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "NgayGioMat": "2020-12-31 10:00:00",
  "MaNguyenNhanMat": "NNM01",
  "MaDiaDiem": "DD01"
}

# Expected Response (200):
{
  "message": "Cập nhật thông tin kết thúc thành công",
  "affectedRows": 1
}
```

---

## 📊 BẢNG TỔNG HỢP CÁC SQLSTATE VÀ MESSAGES

| SQLSTATE | Trigger | Message |
|----------|---------|---------|
| 45010 | TRG_CHECK_NGAY_KET_HON_HONNHAN | Ngày kết hôn phải sau ngày sinh thành viên! |
| 45011 | TRG_CHECK_NGAY_KET_HON_HONNHAN | Thành viên phải đủ 14 tuổi trở lên mới được kết hôn! |
| 45012 | TRG_CHECK_NGAY_KET_HON_HONNHAN | Thành viên vợ/chồng phải đủ 14 tuổi trở lên mới được kết hôn! |
| 45013 | TRG_CHECK_HONNHAN_HOPLE | Thành viên đang có hôn nhân hiện tại. Vui lòng kết thúc hôn nhân cũ trước khi kết hôn mới! |
| 45014 | TRG_CHECK_HONNHAN_HOPLE | Vợ/Chồng đang có hôn nhân hiện tại. Vui lòng kết thúc hôn nhân cũ trước khi kết hôn mới! |
| 45015 | TRG_CHECK_HONNHAN_HOPLE | Ngày bắt đầu hôn nhân mới phải sau ngày kết thúc hôn nhân cũ! |
| 45016 | TRG_CHECK_HONNHAN_HOPLE | Ngày bắt đầu hôn nhân mới của vợ/chồng phải sau ngày kết thúc hôn nhân cũ! |
| 45017 | TRG_CHECK_NGAYMAT_HONNHAN | Ngày mất phải sau ngày bắt đầu hôn nhân! |

---

## 📊 DỮ LIỆU MẪU TRONG DATABASE

Dữ liệu mẫu đã có trong `init.sql`:

```sql
INSERT INTO HONNHAN (MaTV, MaTVVC, NgayBatDau, NgayKetThuc) VALUES
('TV02', 'TV03', '1970-06-15', NULL), -- Long - Lan
('TV04', 'TV05', '1997-05-20', NULL); -- Hùng - Hồng
```

Bạn có thể query để kiểm tra:
```sql
SELECT * FROM HONNHAN;
```

---

## 🎯 CHECKLIST IMPLEMENTATION

### Phase 0: Cập nhật Database Triggers (BẮT BUỘC)
- [ ] **SỬA** trigger `TRG_CHECK_NGAY_KET_HON_HONNHAN` trong `init.sql`:
  - [ ] Thêm kiểm tra tuổi tối thiểu 14 tuổi
  - [ ] Tính tuổi bằng `TIMESTAMPDIFF(YEAR, birth_date, NgayBatDau)`
  
- [ ] **THÊM** trigger `TRG_CHECK_HONNHAN_HOPLE` trong `init.sql`:
  - [ ] Kiểm tra không có hôn nhân hiện tại (NgayKetThuc IS NULL)
  - [ ] Kiểm tra ngày tái hôn phải sau ngày kết thúc hôn nhân cũ
  
- [ ] **THÊM** trigger `TRG_CHECK_NGAYMAT_HONNHAN` trong `init.sql`:
  - [ ] Kiểm tra ngày mất phải sau ngày bắt đầu hôn nhân
  
- [ ] **REBUILD DATABASE**:
  - [ ] Chạy: `docker-compose down`
  - [ ] Chạy: `docker volume rm backend_mysql_data`
  - [ ] Chạy: `docker-compose up -d`

### Phase 1: Cập nhật Routes (QUAN TRỌNG)
- [ ] **SỬA** file `src/routes/users.routes.ts`:
  - [ ] Thêm import: `import honNhanRouter from './honnhan.routes';`
  - [ ] Thêm đăng ký route: `usersRouter.use('/honnhan', accessTokenValidator, honNhanRouter);`
  - [ ] Thêm log: `console.log('  - /honnhan');`
  
- [ ] **SỬA** file `src/index.ts`:
  - [ ] XÓA import: `import honNhanRouter from '~/routes/honnhan.routes';`
  - [ ] XÓA đăng ký route: `app.use('/honnhan', honNhanRouter);`

### Phase 2: Các file đã tạo (Giữ nguyên, không cần sửa)
- [x] File `src/models/schemas/HonNhan.schema.ts` đã tồn tại
- [x] File `src/services/honnhan.services.ts` đã tồn tại
- [x] File `src/controllers/honnhan.controllers.ts` đã tồn tại
- [x] File `src/routes/honnhan.routes.ts` đã tồn tại

### Phase 3: Testing
- [ ] Restart server (để load routes mới)
- [ ] Đăng nhập để lấy access token: `POST /users/login`
- [ ] Test endpoint với token: `GET /users/honnhan` (phải có Authorization header)
- [ ] Test endpoint không có token: `GET /users/honnhan` (phải trả về 401)
- [ ] **Test Trigger 1**: Thử kết hôn với người dưới 14 tuổi (phải lỗi 45011/45012)
- [ ] **Test Trigger 2**: Thử kết hôn khi đang có hôn nhân (phải lỗi 45013/45014)
- [ ] **Test Trigger 3**: Thử tái hôn với ngày không hợp lệ (phải lỗi 45015/45016)
- [ ] **Test Trigger 4**: Thử cập nhật ngày mất trước ngày kết hôn (phải lỗi 45017)
- [ ] Test tất cả endpoints khác với token
- [ ] Kiểm tra trigger hoạt động đúng (MaGiaPha, DOI tự động)

### Phase 4: Frontend Update (Lưu ý cho team frontend)
- [ ] Cập nhật tất cả API calls từ `/honnhan/*` → `/users/honnhan/*`
- [ ] Đảm bảo gửi access token trong header cho mọi request
- [ ] Xử lý lỗi 401 (token hết hạn) và refresh token tự động
- [ ] Xử lý các lỗi mới từ trigger (45011-45017)
- [ ] Hiển thị message lỗi rõ ràng cho người dùng

---

## 📋 SUMMARY: NHỮNG THAY ĐỔI CẦN THỰC HIỆN

### ✅ File CẦN SỬA (2 files):

1. **`src/routes/users.routes.ts`** - Thêm 3 dòng:
   ```typescript
   import honNhanRouter from './honnhan.routes';  // Line ~15
   console.log('  - /honnhan');                   // Line ~53
   usersRouter.use('/honnhan', accessTokenValidator, honNhanRouter);  // Line ~60
   ```

2. **`src/index.ts`** - Xóa 2 dòng:
   ```typescript
   import honNhanRouter from '~/routes/honnhan.routes';  // XÓA
   app.use('/honnhan', honNhanRouter);                   // XÓA
   ```

### ❌ File KHÔNG CẦN SỬA (4 files):
- `src/models/schemas/HonNhan.schema.ts` ✓ Đã đúng
- `src/services/honnhan.services.ts` ✓ Đã đúng
- `src/controllers/honnhan.controllers.ts` ✓ Đúng
- `src/routes/honnhan.routes.ts` ✓ Đã đúng (không cần thêm middleware)

### 🔄 Thay đổi về API Path:
- **CŨ**: `/honnhan/*` (không cần token) ❌
- **MỚI**: `/users/honnhan/*` (YÊU CẦU token) ✅

### 🔐 Authentication Flow:
```
Client Request → accessTokenValidator (users.routes.ts) 
              → honNhanRouter (honnhan.routes.ts) 
              → Controller → Service → Database
```

---

## 📚 TÀI LIỆU THAM KHẢO

- Database Schema: [init.sql](d:\SE104_Family_tree\backend\init.sql) - Dòng 103-111
- Triggers liên quan: [init.sql](d:\SE104_Family_tree\backend\init.sql) - Dòng 287-410
- Pattern tham khảo: [thanhtich.services.ts](d:\SE104_Family_tree\backend\src\services\thanhtich.services.ts)
- Routes pattern: [thanhtich.routes.ts](d:\SE104_Family_tree\backend\src\routes\thanhtich.routes.ts)

---

## ✅ KẾT LUẬN

Hướng dẫn này cung cấp đầy đủ code và logic để implement chức năng quản lý quan hệ hôn nhân **VỚI XÁC THỰC VÀ LOGIC NGHIỆP VỤ ĐẦY ĐỦ**.

### Các bước thực hiện:

0. **Cập nhật Database Triggers** (QUAN TRỌNG NHẤT):
   - Sửa trigger `TRG_CHECK_NGAY_KET_HON_HONNHAN` - Thêm kiểm tra tuổi 14+
   - Thêm trigger `TRG_CHECK_HONNHAN_HOPLE` - Kiểm tra một vợ/chồng và tái hôn
   - Thêm trigger `TRG_CHECK_NGAYMAT_HONNHAN` - Kiểm tra ngày mất hợp lệ
   - Rebuild database với `docker-compose down && docker volume rm backend_mysql_data && docker-compose up -d`

1. **Cập nhật Routes**:
   - Sửa `src/routes/users.routes.ts` - Thêm honnhan vào nested routes
   - Sửa `src/index.ts` - Xóa đăng ký route cũ

2. **Kiểm tra các file đã tạo** (Nếu chưa có thì tạo theo hướng dẫn):
   - `src/models/schemas/HonNhan.schema.ts`
   - `src/services/honnhan.services.ts`
   - `src/controllers/honnhan.controllers.ts`
   - `src/routes/honnhan.routes.ts`

3. **Test API**:
   - Đăng nhập để lấy token
   - Test các endpoints với token
   - Verify authentication hoạt động
   - **Test tất cả trigger mới (tuổi, một vợ/chồng, tái hôn, ngày mất)**

4. **Thông báo Frontend**:
   - Cập nhật API paths: `/honnhan/*` → `/users/honnhan/*`
   - Thêm Authorization header cho mọi request
   - Xử lý lỗi 401 và refresh token
   - Xử lý các lỗi mới từ trigger (SQLSTATE 45011-45017)

---

## 🚨 THAY ĐỔI QUAN TRỌNG SO VỚI PHIÊN BẢN CŨ

### ❌ TRƯỚC (Không bảo mật, logic chưa đầy đủ):
```typescript
// index.ts
app.use('/honnhan', honNhanRouter);  // Không có authentication

// Frontend call
fetch('http://localhost:4000/honnhan')  // Không cần token

// Database
- Chỉ kiểm tra ngày kết hôn sau ngày sinh
- Không kiểm tra tuổi tối thiểu
- Không kiểm tra một vợ/chồng
- Không kiểm tra tái hôn hợp lệ
- Không kiểm tra ngày mất
```

### ✅ SAU (Có bảo mật, logic đầy đủ):
```typescript
// users.routes.ts
usersRouter.use('/honnhan', accessTokenValidator, honNhanRouter);

// Frontend call
fetch('http://localhost:4000/users/honnhan', {
  headers: {
    'Authorization': 'Bearer ' + access_token  // BẮT BUỘC
  }
})

// Database - Triggers mới
✅ TRG_CHECK_NGAY_KET_HON_HONNHAN: Ngày kết hôn + tuổi tối thiểu 14
✅ TRG_CHECK_HONNHAN_HOPLE: Một vợ/chồng + tái hôn hợp lệ
✅ TRG_CHECK_NGAYMAT_HONNHAN: Ngày mất sau ngày kết hôn
✅ TRG_INSERT_MaGP_THANHVIEN_HONNHAN: Auto gán gia phả
✅ TRG_INSERT_DOI_THANHVIEN_HONNHAN: Auto đồng bộ đời
```

---

## 📋 SUMMARY: CÁC LOGIC NGHIỆP VỤ

### 1. Ràng buộc về tuổi:
- ✅ Cả hai người phải đủ 14 tuổi trở lên
- ✅ Tính tuổi tại thời điểm kết hôn (NgayBatDau)

### 2. Ràng buộc về hôn nhân hiện tại:
- ✅ Một thành viên chỉ có 1 vợ/chồng tại một thời điểm
- ✅ Không thể kết hôn khi còn hôn nhân hiện tại (NgayKetThuc IS NULL)
- ✅ Áp dụng cho cả MaTV và MaTVVC

### 3. Ràng buộc về tái hôn:
- ✅ Phải kết thúc hôn nhân cũ trước (set NgayKetThuc)
- ✅ Ngày bắt đầu hôn nhân mới > Ngày kết thúc hôn nhân cũ
- ✅ Kiểm tra cho cả hai bên

### 4. Ràng buộc về ngày mất:
- ✅ Ngày mất phải sau ngày bắt đầu hôn nhân
- ✅ Kiểm tra khi cập nhật thông tin kết thúc
- ✅ Tự động trigger khi UPDATE THANHVIEN.NgayGioMat

### 5. Tự động hóa:
- ✅ Auto gán MaGiaPha cho vợ/chồng
- ✅ Auto đồng bộ DOI (đời) của hai vợ chồng

---

## 📞 HỖ TRỢ

**Lưu ý:** Tuyệt đối KHÔNG tự động sửa code. Hãy làm theo từng bước trong markdown này.

**Nếu gặp vấn đề:**
1. Kiểm tra lại triggers trong init.sql đã được thêm/sửa chưa
2. Verify database đã được rebuild với triggers mới
3. Kiểm tra lại các file theo checklist
4. Verify access token còn hạn
5. Kiểm tra console log của server
6. Test với Postman/Thunder Client trước
7. Xem bảng SQLSTATE để biết lỗi từ trigger nào

**Tham khảo:**
- Pattern tương tự: `/users/thanhtich/*`, `/users/ketthuc/*`
- Middleware: `src/middlewares/users.middlewares.ts`
- Authentication flow: `doc/03-Authentication-MySQL.md`
- Triggers tương tự: `init.sql` - TRG_CHECK_NGAY_THANHTICH, TRG_CHECK_CHA_ME_QUANHECON

**Debug Triggers:**
```sql
-- Xem tất cả triggers của bảng HONNHAN
SHOW TRIGGERS WHERE `Table` = 'HONNHAN';

-- Xem tất cả triggers của bảng THANHVIEN
SHOW TRIGGERS WHERE `Table` = 'THANHVIEN';

-- Test trigger thủ công
INSERT INTO HONNHAN (MaTV, MaTVVC, NgayBatDau) VALUES ('TV02', 'TV05', '2025-01-15');
```

---

## 🚫 BỔ SUNG: KIỂM TRA KHÔNG ĐƯỢC KẾT HÔN VỚI NGƯỜI ĐÃ MẤT

### Vấn đề phát hiện:
- Khi thành viên A đã mất (có NgayGioMat) vào năm 2024
- Vẫn có thể thiết lập quan hệ hôn nhân mới với thành viên A vào năm 2025
- **Điều này không hợp lý về mặt logic nghiệp vụ**

### Giải pháp: Thêm trigger mới

#### Trigger 6: TRG_CHECK_THANHVIEN_CONGSONG_HONNHAN (MỚI - CẦN THÊM)

**Mục đích:** Kiểm tra cả hai thành viên phải còn sống tại thời điểm kết hôn

**⚠️ CẦN THÊM VÀO `init.sql`:**

**Vị trí:** Sau trigger `TRG_CHECK_HONNHAN_HOPLE` (trigger 7a), trước trigger số 8

**Code cần thêm:**
```sql
-- 7b. Kiểm tra cả hai thành viên phải còn sống tại thời điểm kết hôn
CREATE TRIGGER TRG_CHECK_THANHVIEN_CONGSONG_HONNHAN
BEFORE INSERT ON HONNHAN
FOR EACH ROW
BEGIN
    DECLARE death_date_1 DATETIME;
    DECLARE death_date_2 DATETIME;

    -- Lấy ngày mất của thành viên thứ nhất (MaTV)
    SELECT NgayGioMat INTO death_date_1
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;

    -- Lấy ngày mất của thành viên thứ hai (MaTVVC)
    SELECT NgayGioMat INTO death_date_2
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVVC;

    -- Kiểm tra thành viên thứ nhất phải còn sống tại ngày kết hôn
    IF death_date_1 IS NOT NULL AND DATE(death_date_1) <= NEW.NgayBatDau THEN
        SIGNAL SQLSTATE '45018'
        SET MESSAGE_TEXT = 'Không thể thiết lập quan hệ hôn nhân với người đã mất!';
    END IF;

    -- Kiểm tra thành viên thứ hai phải còn sống tại ngày kết hôn
    IF death_date_2 IS NOT NULL AND DATE(death_date_2) <= NEW.NgayBatDau THEN
        SIGNAL SQLSTATE '45019'
        SET MESSAGE_TEXT = 'Không thể thiết lập quan hệ hôn nhân với người đã mất!';
    END IF;
END;
```

---

### Cập nhật bảng SQLSTATE

| SQLSTATE | Trigger | Message |
|----------|---------|---------|
| 45010 | TRG_CHECK_NGAY_KET_HON_HONNHAN | Ngày kết hôn phải sau ngày sinh thành viên! |
| 45011 | TRG_CHECK_NGAY_KET_HON_HONNHAN | Thành viên phải đủ 14 tuổi trở lên mới được kết hôn! |
| 45012 | TRG_CHECK_NGAY_KET_HON_HONNHAN | Thành viên vợ/chồng phải đủ 14 tuổi trở lên mới được kết hôn! |
| 45013 | TRG_CHECK_HONNHAN_HOPLE | Thành viên đang có hôn nhân hiện tại. Vui lòng kết thúc hôn nhân cũ trước khi kết hôn mới! |
| 45014 | TRG_CHECK_HONNHAN_HOPLE | Vợ/Chồng đang có hôn nhân hiện tại. Vui lòng kết thúc hôn nhân cũ trước khi kết hôn mới! |
| 45015 | TRG_CHECK_HONNHAN_HOPLE | Ngày bắt đầu hôn nhân mới phải sau ngày kết thúc hôn nhân cũ! |
| 45016 | TRG_CHECK_HONNHAN_HOPLE | Ngày bắt đầu hôn nhân mới của vợ/chồng phải sau ngày kết thúc hôn nhân cũ! |
| 45017 | TRG_CHECK_NGAYMAT_HONNHAN | Ngày mất phải sau ngày bắt đầu hôn nhân! |
| **45018** | **TRG_CHECK_THANHVIEN_CONGSONG_HONNHAN** | **Không thể thiết lập quan hệ hôn nhân với người đã mất!** |
| **45019** | **TRG_CHECK_THANHVIEN_CONGSONG_HONNHAN** | **Không thể thiết lập quan hệ hôn nhân với người đã mất!** |

---

### Test Case: Không được kết hôn với người đã mất

**Scenario:** Thành viên A đã mất năm 2024, không thể tạo hôn nhân mới năm 2025

**Dữ liệu test:**
- TV01: Đã mất ngày 2020-01-15 (theo init.sql)
- Thử tạo hôn nhân mới với TV01 vào năm 2025

**Request:**
```bash
POST http://localhost:4000/users/honnhan/thietlap
Authorization: Bearer <your_access_token>
Content-Type: application/json

{
  "MaTV": "TV04",
  "MaTVVC": "TV01",
  "NgayBatDau": "2025-01-15"
}
```

**Expected Response (400):**
```json
{
  "message": "Thiết lập quan hệ hôn nhân thất bại",
  "error": "Không thể thiết lập quan hệ hôn nhân với người đã mất!"
}
```

**Giải thích:**
- TV01 đã mất ngày 2020-01-15
- NgayBatDau (2025-01-15) > NgayGioMat (2020-01-15)
- Trigger sẽ chặn không cho insert

---

### Cập nhật Checklist

Thêm vào **Phase 0: Cập nhật Database Triggers**:

- [ ] **THÊM** trigger `TRG_CHECK_THANHVIEN_CONGSONG_HONNHAN` trong `init.sql`:
  - [ ] Kiểm tra MaTV chưa mất (NgayGioMat IS NULL hoặc NgayBatDau < NgayGioMat)
  - [ ] Kiểm tra MaTVVC chưa mất (NgayGioMat IS NULL hoặc NgayBatDau < NgayGioMat)
  - [ ] Vị trí: Sau trigger `TRG_CHECK_HONNHAN_HOPLE`, trước trigger số 8

---

### Cập nhật Summary Logic

Thêm vào **📋 SUMMARY: CÁC LOGIC NGHIỆP VỤ**:

### 6. Ràng buộc về trạng thái sống:
- ✅ Cả hai thành viên phải còn sống tại thời điểm kết hôn
- ✅ Không thể thiết lập hôn nhân với người đã mất
- ✅ NgayBatDau phải < NgayGioMat (nếu NgayGioMat có giá trị)
- ✅ Áp dụng cho cả MaTV và MaTVVC

---

### Các bước thực hiện:

1. **Mở file `backend/init.sql`**

2. **Tìm vị trí thêm trigger:**
   - Tìm trigger `TRG_CHECK_HONNHAN_HOPLE` (trigger 7a)
   - Thêm trigger mới `TRG_CHECK_THANHVIEN_CONGSONG_HONNHAN` (trigger 7b) ngay sau đó
   - Trước trigger `TRG_INSERT_MaGP_THANHVIEN_QUANHECON` (trigger số 8)

3. **Thêm code trigger như trên**

4. **Rebuild database:**
   ```bash
   docker-compose down
   docker volume rm backend_mysql_data
   docker-compose up -d
   ```

5. **Test trigger:**
   - Thử tạo hôn nhân với TV01 (đã mất năm 2020)
   - Phải nhận được lỗi SQLSTATE 45018 hoặc 45019

---

### Lưu ý bổ sung:

- ✅ Logic này đảm bảo dữ liệu hợp lý về mặt thực tế
- ✅ Ngăn chặn tạo quan hệ hôn nhân "ma" (với người đã mất)
- ✅ Trigger kiểm tra TRƯỚC khi insert, tránh dữ liệu bẩn
- ✅ Message lỗi rõ ràng, dễ hiểu cho người dùng
- ✅ Frontend cần xử lý và hiển thị lỗi 45018/45019 một cách thân thiện
