# Hướng Dẫn Thêm Chức Năng "Cập Nhật Thông Tin Thành Tích"

## 📋 Tổng Quan Chức Năng

Tính năng này cho phép **cập nhật/sửa loại thành tích** của một bản ghi thành tích cụ thể.

### Đầu vào:
- **Mã thành viên** (MaTV): Mã của thành viên cần sửa thành tích
- **Mã loại thành tích cũ** (MaLTT_Cu): Loại thành tích hiện tại cần đổi
- **Ngày phát sinh** (NgayPhatSinh): Ngày đạt thành tích (để định danh bản ghi cụ thể)
- **Mã loại thành tích mới** (MaLTT_Moi): Loại thành tích muốn đổi sang

### Ví dụ thực tế:
```
Thành viên TV04 có thành tích:
- Ngày 2024-02-20: Bằng khen Thủ tướng (LTT02)

Muốn sửa thành:
- Ngày 2024-02-20: Huân chương Lao động (LTT01)

→ Cần UPDATE: (MaTV='TV04', MaLTT='LTT02', NgayPhatSinh='2024-02-20') 
   SET MaLTT='LTT01'
```

---

## 🗄️ Phân Tích Cơ Sở Dữ Liệu

### 1. Bảng GHINHANTHANHTICH - Cấu trúc

```sql
CREATE TABLE GHINHANTHANHTICH(
    MaLTT VARCHAR(5),
    MaTV VARCHAR(5),
    NgayPhatSinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY(MaLTT, MaTV, NgayPhatSinh),
    FOREIGN KEY(MaLTT) REFERENCES LOAITHANHTICH(MaLTT),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV)
);
```

**Điểm quan trọng**:
- **Primary Key**: Composite key gồm 3 cột `(MaLTT, MaTV, NgayPhatSinh)`
- Một thành viên có thể có nhiều thành tích cùng loại (khác ngày)
- Một thành viên có thể đạt nhiều thành tích khác loại trong cùng một ngày
- **Vấn đề khi UPDATE**: Không thể UPDATE trực tiếp cột trong Primary Key!

### 2. Bảng LOAITHANHTICH - Các loại thành tích

```sql
CREATE TABLE LOAITHANHTICH(
    MaLTT VARCHAR(5) PRIMARY KEY,
    TenLTT VARCHAR(35) UNIQUE
);

-- Dữ liệu mẫu
INSERT INTO LOAITHANHTICH (MaLTT, TenLTT) VALUES
('LTT01', 'Huân chương Lao động'),
('LTT02', 'Bằng khen Thủ tướng'),
('LTT03', 'Chiến sĩ thi đua'),
('LTT04', 'Giấy khen cấp tỉnh'),
('LTT05', 'Học bổng giỏi'),
('LTT06', 'Giải thưởng khoa học kỹ thuật');
```

### 3. Trigger Liên Quan

#### Trigger kiểm tra ngày thành tích
```sql
CREATE TRIGGER TRG_CHECK_NGAY_THANHTICH
BEFORE INSERT ON GHINHANTHANHTICH
FOR EACH ROW
BEGIN
    DECLARE ngay_sinh DATE;
    
    SELECT DATE(NgayGioSinh) INTO ngay_sinh
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;
    
    IF NEW.NgayPhatSinh <= ngay_sinh THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ngày đạt thành tích phải sau ngày sinh thành viên!';
    END IF;
END;
```

**⚠️ LƯU Ý**: Trigger này chỉ chạy khi INSERT, không chạy khi UPDATE.

#### Trigger cập nhật bảng báo cáo
```sql
CREATE TRIGGER TRG_UPDATE_BAOCAOTHANHTICH_AFTER_INSERT
AFTER INSERT ON GHINHANTHANHTICH
-- Tự động cập nhật bảng BAOCAOTHANHTICH
```

**⚠️ LƯU Ý**: Trigger này chỉ chạy khi INSERT, cần xử lý riêng cho UPDATE.

---

## 🎯 Phương Án Giải Quyết

### Vấn đề: Không thể UPDATE Primary Key trực tiếp

Do `MaLTT` là một phần của Primary Key, MySQL **KHÔNG CHO PHÉP** UPDATE trực tiếp:

```sql
-- ❌ LỖI: Cannot update primary key column
UPDATE GHINHANTHANHTICH 
SET MaLTT = 'LTT01' 
WHERE MaTV = 'TV04' AND MaLTT = 'LTT02' AND NgayPhatSinh = '2024-02-20';
```

### Giải pháp: DELETE + INSERT

**Phương án tốt nhất**: Xóa bản ghi cũ và thêm bản ghi mới trong một TRANSACTION.

```sql
START TRANSACTION;

-- Bước 1: Xóa bản ghi cũ
DELETE FROM GHINHANTHANHTICH 
WHERE MaTV = ? AND MaLTT = ? AND DATE(NgayPhatSinh) = DATE(?);

-- Bước 2: Thêm bản ghi mới với loại thành tích mới
INSERT INTO GHINHANTHANHTICH (MaTV, MaLTT, NgayPhatSinh) 
VALUES (?, ?, ?);

COMMIT;
```

**Lợi ích**:
- Sửa Đảm bảo tính toàn vẹn dữ liệu (ACID)
- Sửa Nếu có lỗi, toàn bộ thao tác sẽ rollback
- Sửa Trigger INSERT vẫn hoạt động bình thường
- Sửa Bảng BAOCAOTHANHTICH được cập nhật tự động

---

## 🛠️ Hướng Dẫn Implementation

### BƯỚC 1: Thêm Service Method

**File**: `backend/src/services/thanhtich.services.ts`

**Vị trí thêm**: Sau method `xoaThanhTich`, trước method `checkThanhTichExists`

```typescript
  /**
   * Sửa MỚI: Cập nhật loại thành tích
   * Do MaLTT là primary key nên phải dùng DELETE + INSERT trong transaction
   */
  async capNhatThanhTich(payload: {
    MaTV: string;
    MaLTT_Cu: string;
    MaLTT_Moi: string;
    NgayPhatSinh: Date;
  }) {
    const connection = await databaseService.getConnection();

    try {
      // Bắt đầu transaction
      await connection.beginTransaction();

      // Bước 1: Kiểm tra bản ghi cũ có tồn tại không
      const checkSql = `
        SELECT COUNT(*) as count 
        FROM GHINHANTHANHTICH 
        WHERE MaTV = ? AND MaLTT = ? AND DATE(NgayPhatSinh) = DATE(?)
      `;
      const [checkRows] = await connection.query<RowDataPacket[]>(checkSql, [
        payload.MaTV,
        payload.MaLTT_Cu,
        payload.NgayPhatSinh
      ]);
      const checkResult = checkRows[0] as any;

      if (checkResult.count === 0) {
        throw new Error('Không tìm thấy thành tích cần cập nhật');
      }

      // Bước 2: Kiểm tra loại thành tích mới có tồn tại không
      const checkLoaiSql = `
        SELECT COUNT(*) as count 
        FROM LOAITHANHTICH 
        WHERE MaLTT = ?
      `;
      const [checkLoaiRows] = await connection.query<RowDataPacket[]>(checkLoaiSql, [
        payload.MaLTT_Moi
      ]);
      const checkLoaiResult = checkLoaiRows[0] as any;

      if (checkLoaiResult.count === 0) {
        throw new Error('Loại thành tích mới không tồn tại');
      }

      // Bước 3: Kiểm tra xem bản ghi mới có bị trùng không (cùng MaTV, MaLTT_Moi, NgayPhatSinh)
      const checkDuplicateSql = `
        SELECT COUNT(*) as count 
        FROM GHINHANTHANHTICH 
        WHERE MaTV = ? AND MaLTT = ? AND DATE(NgayPhatSinh) = DATE(?)
      `;
      const [checkDuplicateRows] = await connection.query<RowDataPacket[]>(checkDuplicateSql, [
        payload.MaTV,
        payload.MaLTT_Moi,
        payload.NgayPhatSinh
      ]);
      const checkDuplicateResult = checkDuplicateRows[0] as any;

      if (checkDuplicateResult.count > 0) {
        throw new Error('Thành viên đã có loại thành tích này vào ngày này rồi');
      }

      // Bước 4: Xóa bản ghi cũ
      const deleteSql = `
        DELETE FROM GHINHANTHANHTICH 
        WHERE MaTV = ? AND MaLTT = ? AND DATE(NgayPhatSinh) = DATE(?)
      `;
      await connection.query(deleteSql, [
        payload.MaTV,
        payload.MaLTT_Cu,
        payload.NgayPhatSinh
      ]);

      // Bước 5: Thêm bản ghi mới
      const insertSql = `
        INSERT INTO GHINHANTHANHTICH (MaTV, MaLTT, NgayPhatSinh) 
        VALUES (?, ?, ?)
      `;
      await connection.query(insertSql, [
        payload.MaTV,
        payload.MaLTT_Moi,
        payload.NgayPhatSinh
      ]);

      // Commit transaction
      await connection.commit();

      return {
        message: 'Cập nhật thành tích thành công',
        data: {
          MaTV: payload.MaTV,
          MaLTT_Cu: payload.MaLTT_Cu,
          MaLTT_Moi: payload.MaLTT_Moi,
          NgayPhatSinh: payload.NgayPhatSinh
        }
      };
    } catch (error: any) {
      // Rollback nếu có lỗi
      await connection.rollback();
      throw error;
    } finally {
      // Release connection
      connection.release();
    }
  }
```

**Giải thích**:
1. **Transaction**: Đảm bảo DELETE và INSERT thành công cùng lúc hoặc cùng fail
2. **Validation đầy đủ**:
   - Kiểm tra bản ghi cũ có tồn tại
   - Kiểm tra loại thành tích mới hợp lệ
   - Kiểm tra không bị trùng lặp
3. **Error handling**: Rollback nếu có lỗi bất kỳ
4. **Connection management**: Release connection sau khi dùng xong

**Thêm method getConnection vào database.services.ts** (nếu chưa có):

```typescript
// File: backend/src/services/database.services.ts

import { PoolConnection } from 'mysql2/promise';

class DatabaseService {
  // ... existing code ...

  /**
   * Lấy connection từ pool để thực hiện transaction
   */
  async getConnection(): Promise<PoolConnection> {
    return await this.pool.getConnection();
  }
}
```

---

### BƯỚC 2: Thêm Controller

**File**: `backend/src/controllers/thanhtich.controllers.ts`

**Vị trí thêm**: Sau controller `xoaThanhTichController`, trước `getBaoCaoThanhTichController`

```typescript
/**
 * Sửa MỚI: Controller cập nhật thành tích
 * PUT /thanhtich/capnhat
 * Body: { 
 *   MaTV: string, 
 *   MaLTT_Cu: string, 
 *   MaLTT_Moi: string, 
 *   NgayPhatSinh: string (YYYY-MM-DD) 
 * }
 * 
 * Response: { message, data }
 */
export const capNhatThanhTichController = async (req: Request, res: Response) => {
  const { MaTV, MaLTT_Cu, MaLTT_Moi, NgayPhatSinh } = req.body;

  try {
    // Validate input
    if (!MaTV || !MaLTT_Cu || !MaLTT_Moi || !NgayPhatSinh) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV, MaLTT_Cu, MaLTT_Moi, NgayPhatSinh'
      });
    }

    // Validate không được trùng loại
    if (MaLTT_Cu === MaLTT_Moi) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Loại thành tích mới phải khác loại thành tích cũ'
      });
    }

    const result = await thanhTichService.capNhatThanhTich({
      MaTV,
      MaLTT_Cu,
      MaLTT_Moi,
      NgayPhatSinh: new Date(NgayPhatSinh)
    });

    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    console.error('Lỗi capNhatThanhTich:', error);
    
    // Xử lý lỗi cụ thể
    if (error.message.includes('Không tìm thấy')) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: error.message
      });
    }
    
    if (error.message.includes('không tồn tại') || error.message.includes('đã có')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: error.message
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Cập nhật thành tích thất bại',
      error: error.message
    });
  }
};
```

**Giải thích**:
- Validate đầy đủ các trường bắt buộc
- Kiểm tra MaLTT_Cu khác MaLTT_Moi
- Xử lý các loại lỗi khác nhau với HTTP status code phù hợp

---

### BƯỚC 3: Thêm Route

**File**: `backend/src/routes/thanhtich.routes.ts`

**PHẦN 1: Cập nhật import**

```typescript
// Dòng import ở đầu file
import {
  getLoaiThanhTichController,
  ghiNhanThanhTichController,
  traCuuThanhTichController,
  getThanhTichByHoTenController,
  xoaThanhTichController,
  capNhatThanhTichController,  // Sửa THÊM DÒNG NÀY
  getBaoCaoThanhTichController
} from '~/controllers/thanhtich.controllers';
```

**PHẦN 2: Thêm route**

```typescript
/**
 * Sửa MỚI: PUT /thanhtich/capnhat - Cập nhật loại thành tích
 * Body: { 
 *   MaTV: string,           // Mã thành viên
 *   MaLTT_Cu: string,       // Mã loại thành tích hiện tại (cũ)
 *   MaLTT_Moi: string,      // Mã loại thành tích muốn đổi sang (mới)
 *   NgayPhatSinh: string    // Ngày đạt thành tích (YYYY-MM-DD)
 * }
 * 
 * Ví dụ:
 * {
 *   "MaTV": "TV04",
 *   "MaLTT_Cu": "LTT02",
 *   "MaLTT_Moi": "LTT01",
 *   "NgayPhatSinh": "2024-02-20"
 * }
 * 
 * Response: {
 *   message: "Cập nhật thành tích thành công",
 *   data: { MaTV, MaLTT_Cu, MaLTT_Moi, NgayPhatSinh }
 * }
 * 
 * Lưu ý: 
 * - Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
 * - Trigger INSERT sẽ tự động cập nhật bảng BAOCAOTHANHTICH
 */
thanhTichRouter.put('/capnhat', capNhatThanhTichController);
```

**Vị trí đặt route**: Thêm sau route `thanhTichRouter.delete('/xoa', ...)` và trước route `thanhTichRouter.get('/baocao', ...)`

```typescript
// Thứ tự routes trong file
thanhTichRouter.get('/loai', getLoaiThanhTichController);
thanhTichRouter.post('/ghinhan', ghiNhanThanhTichController);
thanhTichRouter.get('/tracuu', traCuuThanhTichController);
thanhTichRouter.get('/thanhvien', getThanhTichByHoTenController);
thanhTichRouter.delete('/xoa', xoaThanhTichController);
thanhTichRouter.put('/capnhat', capNhatThanhTichController);  // Sửa THÊM Ở ĐÂY
thanhTichRouter.get('/baocao', getBaoCaoThanhTichController);

export default thanhTichRouter;
```

---

### BƯỚC 4: Kiểm Tra Database Service

**File**: `backend/src/services/database.services.ts`

Kiểm tra xem đã có method `getConnection()` chưa. Nếu chưa, thêm vào:

```typescript
import mysql from 'mysql2/promise';
import { PoolConnection } from 'mysql2/promise';

class DatabaseService {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  async connect() {
    try {
      await this.pool.getConnection();
      console.log('Sửa Kết nối database thành công');
    } catch (error) {
      console.error('❌ Lỗi kết nối database:', error);
      throw error;
    }
  }

  async query<T>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as T;
  }

  /**
   * Sửa THÊM METHOD NÀY (nếu chưa có)
   * Lấy connection từ pool để thực hiện transaction
   */
  async getConnection(): Promise<PoolConnection> {
    return await this.pool.getConnection();
  }
}

const databaseService = new DatabaseService();
export default databaseService;
```

---

## 🧪 Test API

### 1. Chuẩn bị dữ liệu test

Kiểm tra thành tích hiện có:

```sql
-- Xem tất cả thành tích của TV04
SELECT 
  g.MaTV,
  tv.HoTen,
  g.MaLTT,
  ltt.TenLTT,
  g.NgayPhatSinh
FROM GHINHANTHANHTICH g
INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV
INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
WHERE g.MaTV = 'TV04';

-- Kết quả mẫu:
-- MaTV: TV04, HoTen: Nguyễn Văn Hùng
-- MaLTT: LTT02, TenLTT: Bằng khen Thủ tướng
-- NgayPhatSinh: 2024-02-20
```

### 2. Test với Postman/Thunder Client

#### Test Case 1: Cập nhật thành công
```
PUT http://localhost:3000/thanhtich/capnhat
Content-Type: application/json

Body:
{
  "MaTV": "TV04",
  "MaLTT_Cu": "LTT02",
  "MaLTT_Moi": "LTT01",
  "NgayPhatSinh": "2024-02-20"
}

Response (200 OK):
{
  "message": "Cập nhật thành tích thành công",
  "data": {
    "MaTV": "TV04",
    "MaLTT_Cu": "LTT02",
    "MaLTT_Moi": "LTT01",
    "NgayPhatSinh": "2024-02-20T00:00:00.000Z"
  }
}
```

**Kiểm tra sau khi cập nhật**:
```sql
SELECT * FROM GHINHANTHANHTICH WHERE MaTV = 'TV04';
-- Bây giờ sẽ thấy LTT01 thay vì LTT02
```

#### Test Case 2: Thiếu thông tin
```
PUT http://localhost:3000/thanhtich/capnhat
Content-Type: application/json

Body:
{
  "MaTV": "TV04",
  "MaLTT_Cu": "LTT02"
}

Response (400 Bad Request):
{
  "message": "Thiếu thông tin bắt buộc: MaTV, MaLTT_Cu, MaLTT_Moi, NgayPhatSinh"
}
```

#### Test Case 3: Loại thành tích mới trùng với cũ
```
PUT http://localhost:3000/thanhtich/capnhat
Content-Type: application/json

Body:
{
  "MaTV": "TV04",
  "MaLTT_Cu": "LTT02",
  "MaLTT_Moi": "LTT02",
  "NgayPhatSinh": "2024-02-20"
}

Response (400 Bad Request):
{
  "message": "Loại thành tích mới phải khác loại thành tích cũ"
}
```

#### Test Case 4: Không tìm thấy bản ghi cần cập nhật
```
PUT http://localhost:3000/thanhtich/capnhat
Content-Type: application/json

Body:
{
  "MaTV": "TV04",
  "MaLTT_Cu": "LTT99",
  "MaLTT_Moi": "LTT01",
  "NgayPhatSinh": "2024-02-20"
}

Response (404 Not Found):
{
  "message": "Không tìm thấy thành tích cần cập nhật"
}
```

#### Test Case 5: Loại thành tích mới không tồn tại
```
PUT http://localhost:3000/thanhtich/capnhat
Content-Type: application/json

Body:
{
  "MaTV": "TV04",
  "MaLTT_Cu": "LTT02",
  "MaLTT_Moi": "LTT99",
  "NgayPhatSinh": "2024-02-20"
}

Response (400 Bad Request):
{
  "message": "Loại thành tích mới không tồn tại"
}
```

#### Test Case 6: Bị trùng lặp (thành viên đã có loại thành tích mới vào ngày đó)
```
-- Giả sử TV04 đã có LTT01 vào ngày 2024-02-20
PUT http://localhost:3000/thanhtich/capnhat
Content-Type: application/json

Body:
{
  "MaTV": "TV04",
  "MaLTT_Cu": "LTT02",
  "MaLTT_Moi": "LTT01",
  "NgayPhatSinh": "2024-02-20"
}

Response (400 Bad Request):
{
  "message": "Thành viên đã có loại thành tích này vào ngày này rồi"
}
```

### 3. Test với cURL

```bash
# Test cập nhật thành công
curl -X PUT http://localhost:3000/thanhtich/capnhat \
  -H "Content-Type: application/json" \
  -d '{
    "MaTV": "TV04",
    "MaLTT_Cu": "LTT02",
    "MaLTT_Moi": "LTT01",
    "NgayPhatSinh": "2024-02-20"
  }'

# Format đẹp với jq
curl -X PUT http://localhost:3000/thanhtich/capnhat \
  -H "Content-Type: application/json" \
  -d '{
    "MaTV": "TV04",
    "MaLTT_Cu": "LTT02",
    "MaLTT_Moi": "LTT01",
    "NgayPhatSinh": "2024-02-20"
  }' | jq
```

---

## 🔍 Kiểm Tra Dữ Liệu Database

### 1. Xem thành tích trước khi cập nhật

```sql
-- Xem chi tiết thành tích của thành viên
SELECT 
  g.MaTV,
  tv.HoTen,
  g.MaLTT,
  ltt.TenLTT as LoaiThanhTich,
  DATE(g.NgayPhatSinh) as NgayDatThanhTich
FROM GHINHANTHANHTICH g
INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV
INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
WHERE g.MaTV = 'TV04'
ORDER BY g.NgayPhatSinh DESC;
```

### 2. Kiểm tra sau khi cập nhật

```sql
-- Kiểm tra lại
SELECT 
  g.MaTV,
  tv.HoTen,
  g.MaLTT,
  ltt.TenLTT as LoaiThanhTich,
  DATE(g.NgayPhatSinh) as NgayDatThanhTich
FROM GHINHANTHANHTICH g
INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV
INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
WHERE g.MaTV = 'TV04'
ORDER BY g.NgayPhatSinh DESC;

-- Kiểm tra bảng báo cáo đã được cập nhật chưa
SELECT * FROM BAOCAOTHANHTICH 
WHERE Nam = YEAR(CURDATE())
ORDER BY Nam DESC, SoLuong DESC;
```

### 3. Test transaction rollback (nếu cần)

```sql
-- Test thủ công bằng cách tắt autocommit
SET autocommit = 0;

START TRANSACTION;

DELETE FROM GHINHANTHANHTICH 
WHERE MaTV = 'TV04' AND MaLTT = 'LTT02' AND DATE(NgayPhatSinh) = '2024-02-20';

INSERT INTO GHINHANTHANHTICH (MaTV, MaLTT, NgayPhatSinh) 
VALUES ('TV04', 'LTT01', '2024-02-20');

-- Xem kết quả tạm thời
SELECT * FROM GHINHANTHANHTICH WHERE MaTV = 'TV04';

-- Rollback để hoàn tác
ROLLBACK;

-- Hoặc commit để lưu thay đổi
-- COMMIT;

SET autocommit = 1;
```

---

## 📊 Tích Hợp Frontend

### 1. Component Form Cập Nhật

**Ví dụ React**:

```typescript
// Component: CapNhatThanhTichForm.tsx
import { useState } from 'react';

interface CapNhatFormData {
  MaTV: string;
  MaLTT_Cu: string;
  MaLTT_Moi: string;
  NgayPhatSinh: string;
}

interface ThanhTich {
  MaTV: string;
  HoTen: string;
  MaLTT: string;
  LoaiThanhTich: string;
  NgayPhatSinh: string;
}

interface LoaiThanhTich {
  MaLTT: string;
  TenLTT: string;
}

export default function CapNhatThanhTichForm() {
  const [selectedThanhTich, setSelectedThanhTich] = useState<ThanhTich | null>(null);
  const [loaiThanhTichList, setLoaiThanhTichList] = useState<LoaiThanhTich[]>([]);
  const [newMaLTT, setNewMaLTT] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load danh sách loại thành tích
  useEffect(() => {
    fetchLoaiThanhTich();
  }, []);

  const fetchLoaiThanhTich = async () => {
    try {
      const response = await fetch('http://localhost:3000/thanhtich/loai');
      const data = await response.json();
      setLoaiThanhTichList(data.result);
    } catch (err) {
      console.error('Lỗi load loại thành tích:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedThanhTich || !newMaLTT) {
      setError('Vui lòng chọn đầy đủ thông tin');
      return;
    }

    if (selectedThanhTich.MaLTT === newMaLTT) {
      setError('Loại thành tích mới phải khác loại thành tích hiện tại');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:3000/thanhtich/capnhat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          MaTV: selectedThanhTich.MaTV,
          MaLTT_Cu: selectedThanhTich.MaLTT,
          MaLTT_Moi: newMaLTT,
          NgayPhatSinh: selectedThanhTich.NgayPhatSinh
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra');
      }

      setSuccess('Cập nhật thành tích thành công!');
      setSelectedThanhTich(null);
      setNewMaLTT('');
      
      // Reload danh sách thành tích nếu cần
      // ...
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cap-nhat-container">
      <h2>Cập Nhật Thông Tin Thành Tích</h2>

      {/* Bước 1: Chọn thành tích cần sửa */}
      <div className="step">
        <h3>Bước 1: Chọn thành tích cần cập nhật</h3>
        {/* Component tìm kiếm và chọn thành tích */}
        <ThanhTichSelector 
          onSelect={setSelectedThanhTich}
          selected={selectedThanhTich}
        />
      </div>

      {/* Bước 2: Chọn loại thành tích mới */}
      {selectedThanhTich && (
        <form onSubmit={handleSubmit} className="step">
          <h3>Bước 2: Chọn loại thành tích mới</h3>
          
          <div className="current-info">
            <p><strong>Thành viên:</strong> {selectedThanhTich.HoTen}</p>
            <p><strong>Loại hiện tại:</strong> {selectedThanhTich.LoaiThanhTich}</p>
            <p><strong>Ngày đạt:</strong> {new Date(selectedThanhTich.NgayPhatSinh).toLocaleDateString('vi-VN')}</p>
          </div>

          <div className="form-group">
            <label>Chọn loại thành tích mới:</label>
            <select 
              value={newMaLTT} 
              onChange={(e) => setNewMaLTT(e.target.value)}
              required
            >
              <option value="">-- Chọn loại thành tích --</option>
              {loaiThanhTichList
                .filter(lt => lt.MaLTT !== selectedThanhTich.MaLTT)
                .map(loai => (
                  <option key={loai.MaLTT} value={loai.MaLTT}>
                    {loai.TenLTT}
                  </option>
                ))
              }
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </form>
      )}
    </div>
  );
}
```

### 2. Component Selector

```typescript
// Component: ThanhTichSelector.tsx
interface ThanhTichSelectorProps {
  onSelect: (thanhTich: ThanhTich | null) => void;
  selected: ThanhTich | null;
}

export function ThanhTichSelector({ onSelect, selected }: ThanhTichSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [thanhTichList, setThanhTichList] = useState<ThanhTich[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/thanhtich/thanhvien?HoTen=${encodeURIComponent(searchTerm)}`
      );
      const data = await response.json();
      setThanhTichList(data.result || []);
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
      setThanhTichList([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="selector">
      <div className="search-box">
        <input
          type="text"
          placeholder="Nhập tên thành viên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Đang tìm...' : 'Tìm kiếm'}
        </button>
      </div>

      {thanhTichList.length > 0 && (
        <div className="result-list">
          <h4>Kết quả tìm kiếm ({thanhTichList.length}):</h4>
          <table>
            <thead>
              <tr>
                <th>Chọn</th>
                <th>Họ tên</th>
                <th>Loại thành tích</th>
                <th>Ngày đạt</th>
              </tr>
            </thead>
            <tbody>
              {thanhTichList.map((item, index) => (
                <tr 
                  key={index}
                  className={selected === item ? 'selected' : ''}
                >
                  <td>
                    <input
                      type="radio"
                      name="selected-thanhtich"
                      checked={selected === item}
                      onChange={() => onSelect(item)}
                    />
                  </td>
                  <td>{item.HoTen}</td>
                  <td>{item.LoaiThanhTich}</td>
                  <td>{new Date(item.NgayPhatSinh).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

### 3. CSS Styling

```css
/* styles/CapNhatThanhTich.css */
.cap-nhat-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.cap-nhat-container h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
}

.step {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.step h3 {
  margin-top: 0;
  color: #007bff;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-box input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
}

.search-box button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-box button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.result-list {
  margin-top: 20px;
}

.result-list table {
  width: 100%;
  border-collapse: collapse;
}

.result-list th,
.result-list td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.result-list th {
  background: #f8f9fa;
  font-weight: 600;
}

.result-list tr:hover {
  background: #f8f9fa;
}

.result-list tr.selected {
  background: #e7f3ff;
}

.current-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.current-info p {
  margin: 5px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
}

.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
}

button[type="submit"] {
  padding: 12px 30px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

button[type="submit"]:hover {
  background: #218838;
}

button[type="submit"]:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-top: 15px;
}

.success-message {
  padding: 12px;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  margin-top: 15px;
}
```

---

## 🎨 Tính Năng Mở Rộng (Optional)

### 1. Lịch sử cập nhật

Tạo bảng lưu lịch sử thay đổi:

```sql
CREATE TABLE LICHSU_CAPNHAT_THANHTICH (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    MaTV VARCHAR(5),
    MaLTT_Cu VARCHAR(5),
    MaLTT_Moi VARCHAR(5),
    NgayPhatSinh DATE,
    ThoiGianCapNhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    NguoiCapNhat VARCHAR(50),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV)
);
```

Thêm vào service:

```typescript
// Sau khi commit transaction thành công
await connection.query(`
  INSERT INTO LICHSU_CAPNHAT_THANHTICH 
  (MaTV, MaLTT_Cu, MaLTT_Moi, NgayPhatSinh, NguoiCapNhat) 
  VALUES (?, ?, ?, ?, ?)
`, [payload.MaTV, payload.MaLTT_Cu, payload.MaLTT_Moi, payload.NgayPhatSinh, 'System']);
```

### 2. Cập nhật hàng loạt

Cho phép cập nhật nhiều thành tích cùng lúc:

```typescript
async capNhatNhieuThanhTich(payloads: CapNhatPayload[]) {
  const connection = await databaseService.getConnection();
  
  try {
    await connection.beginTransaction();
    
    for (const payload of payloads) {
      // Thực hiện cập nhật từng bản ghi
      // ...
    }
    
    await connection.commit();
    return { message: `Cập nhật thành công ${payloads.length} thành tích` };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

### 3. Trigger tự động cập nhật BAOCAOTHANHTICH

Tạo trigger để cập nhật cả khi DELETE (do dùng DELETE + INSERT):

```sql
-- Trigger giảm số lượng khi DELETE
CREATE TRIGGER TRG_UPDATE_BAOCAO_AFTER_DELETE
AFTER DELETE ON GHINHANTHANHTICH
FOR EACH ROW
BEGIN
    UPDATE BAOCAOTHANHTICH
    SET SoLuong = SoLuong - 1
    WHERE Nam = YEAR(OLD.NgayPhatSinh) AND MaLTT = OLD.MaLTT;
    
    -- Xóa record nếu SoLuong = 0
    DELETE FROM BAOCAOTHANHTICH
    WHERE Nam = YEAR(OLD.NgayPhatSinh) 
      AND MaLTT = OLD.MaLTT 
      AND SoLuong <= 0;
END;
```

---

## 📝 Checklist Hoàn Thành

- [ ] **BƯỚC 1**: Thêm method `capNhatThanhTich()` vào `thanhtich.services.ts`
- [ ] **BƯỚC 2**: Thêm method `getConnection()` vào `database.services.ts` (nếu chưa có)
- [ ] **BƯỚC 3**: Thêm controller `capNhatThanhTichController` vào `thanhtich.controllers.ts`
- [ ] **BƯỚC 4**: Cập nhật import và thêm route `PUT /capnhat` vào `thanhtich.routes.ts`
- [ ] **Test API**: Chạy thử các test case với Postman/Thunder Client
- [ ] **Kiểm tra database**: Verify transaction hoạt động đúng
- [ ] **Test rollback**: Kiểm tra rollback khi có lỗi
- [ ] **Frontend**: Tạo form cập nhật (nếu có)
- [ ] **Tính năng mở rộng**: Lịch sử, trigger (optional)

---

## 🚨 Lưu Ý Quan Trọng

### 1. Về Primary Key và UPDATE

⚠️ **KHÔNG THỂ UPDATE TRỰC TIẾP** cột trong Primary Key:
```sql
-- ❌ LỖI
UPDATE GHINHANTHANHTICH SET MaLTT = 'LTT01' WHERE ...
```

**Giải pháp bắt buộc**: DELETE + INSERT trong TRANSACTION

### 2. Về Transaction

- Sửa Dùng `connection.beginTransaction()` và `connection.commit()`
- Sửa Dùng `connection.rollback()` trong catch block
- Sửa Dùng `connection.release()` trong finally block
- ⚠️ Không quên release connection để tránh memory leak

### 3. Về Trigger

- Trigger `TRG_CHECK_NGAY_THANHTICH` chỉ chạy khi INSERT → OK
- Trigger `TRG_UPDATE_BAOCAOTHANHTICH_AFTER_INSERT` cũng chỉ INSERT → OK
- Nếu cần, tạo thêm trigger cho DELETE để cập nhật BAOCAOTHANHTICH

### 4. Về Validation

- Validate MaLTT_Cu khác MaLTT_Moi
- Kiểm tra bản ghi cũ tồn tại
- Kiểm tra loại mới hợp lệ
- Kiểm tra không bị trùng lặp

### 5. Về Performance

- Transaction nhanh vì chỉ 2 thao tác (DELETE + INSERT)
- Index đã có sẵn trên Primary Key
- Connection pool giúp tái sử dụng connection

---

## 📞 Troubleshooting

### Lỗi 1: "Property 'count' does not exist on type 'RowDataPacket[]'"

**Nguyên nhân**: Khi dùng `connection.query()`, kết quả trả về là `[rows, fields]`. Khi destructure `const [checkResult]`, bạn đang lấy mảng rows, chứ không phải row đầu tiên.

**Giải pháp**: Phải lấy phần tử đầu tiên của mảng:

```typescript
// ❌ SAI
const [checkResult] = await connection.query<RowDataPacket[]>(checkSql, [...]);
if (checkResult.count === 0) { ... }  // Lỗi!

// Sửa ĐÚNG - Cách 1: Lấy phần tử đầu tiên
const [checkRows] = await connection.query<RowDataPacket[]>(checkSql, [...]);
const checkResult = checkRows[0] as any;
if (checkResult.count === 0) { ... }  // OK!

// Sửa ĐÚNG - Cách 2: Destructure 2 lần
const [[checkResult]] = await connection.query<RowDataPacket[]>(checkSql, [...]);
if ((checkResult as any).count === 0) { ... }  // OK!
```

### Lỗi 2: "Cannot update primary key column"

**Nguyên nhân**: Cố gắng UPDATE trực tiếp MaLTT

**Giải pháp**: Đã implement DELETE + INSERT

### Lỗi 3: "Connection already released"

**Nguyên nhân**: Release connection 2 lần hoặc dùng sau khi release

**Giải pháp**: Dùng try-finally và chỉ release 1 lần

### Lỗi 4: Transaction bị timeout

**Nguyên nhân**: Transaction chạy quá lâu

**Giải pháp**: 
- Tăng timeout trong mysql config
- Tối ưu query
- Đảm bảo không có deadlock

### Lỗi 5: "Duplicate entry"

**Nguyên nhân**: Bản ghi mới bị trùng với bản ghi khác

**Giải pháp**: Đã validate trong code, kiểm tra logic

---

## 🎯 Kết Luận

Tính năng "Cập nhật thông tin thành tích" đã được thiết kế với:

Sửa **Transaction đảm bảo ACID**: DELETE + INSERT trong transaction  
Sửa **Validation đầy đủ**: Kiểm tra tồn tại, hợp lệ, không trùng  
Sửa **Error handling tốt**: Rollback khi có lỗi, release connection  
Sửa **Trigger hoạt động**: Tự động cập nhật BAOCAOTHANHTICH  
Sửa **API RESTful**: PUT method với body JSON chuẩn  
Sửa **Frontend thân thiện**: Form 2 bước, search và select  

**Thời gian ước tính**: 1-2 giờ implement backend + 2-3 giờ frontend

Chúc bạn implement thành công! 🚀
