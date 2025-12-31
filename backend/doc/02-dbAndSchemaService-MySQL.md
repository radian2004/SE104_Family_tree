# Tạo Schema và Service cho MySQL

## Tổng quan

- **Schemas** là nơi chứa các định nghĩa của dữ liệu, giống như bảng thiết kế của database
  - Ví dụ: database trả về thông tin nhiều thành viên (THANHVIEN)
  - Mỗi thành viên có các thuộc tính gì (MaTV, HoTen, NgayGioSinh...)
  - Nếu muốn tạo thành viên mới thì phải tạo như thế nào, có được để trống không
  - Vậy nên ta tạo schema để định nghĩa rõ ràng thành viên như thế nào

## 1. Tạo Schema cho THANHVIEN

### Phân tích bảng THANHVIEN từ init.sql

Từ file `init.sql`, bảng THANHVIEN có cấu trúc:

```sql
CREATE TABLE THANHVIEN (
    MaTV VARCHAR(5) PRIMARY KEY,
    HoTen VARCHAR(50),
    NgayGioSinh DATE,
    DiaChi VARCHAR(50),
    TrangThai VARCHAR(10) DEFAULT 'Sống',
    TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    DOI INT DEFAULT 0,
    MaQueQuan VARCHAR(5),
    MaNgheNghiep VARCHAR(5),
    MaGioiTinh VARCHAR(5),
    MaGiaPha VARCHAR(5),
    FOREIGN KEY(MaQueQuan) REFERENCES QUEQUAN(MaQueQuan),
    FOREIGN KEY(MaNgheNghiep) REFERENCES NGHENGHIEP(MaNgheNghiep),
    FOREIGN KEY(MaGioiTinh) REFERENCES GIOITINH(MaGioiTinh),
    FOREIGN KEY(MaGiaPha) REFERENCES CAYGIAPHA(MaGiaPha)
)
```

### Tạo file schema

- Trong folder `models` tạo folder `schemas` (nếu chưa có)
- Tạo file `ThanhVien.schema.ts`
- Sử dụng **class** thay vì interface vì:
  - Interface chỉ định dạng kiểu dữ liệu
  - Class đại diện cho kiểu và dùng để tạo object rất nhanh

### Code ThanhVien.schema.ts

```ts
// src/models/schemas/ThanhVien.schema.ts

// Interface định nghĩa thành viên cần những gì khi tạo
interface ThanhVienType {
  MaTV?: string; // optional vì có trigger tự sinh
  HoTen?: string;
  NgayGioSinh?: Date;
  DiaChi?: string;
  TrangThai?: string; // 'Sống' hoặc 'Mất'
  TGTaoMoi?: Date;
  DOI?: number; // Đời (thế hệ)
  MaQueQuan?: string;
  MaNgheNghiep?: string;
  MaGioiTinh?: string;
  MaGiaPha?: string;
}

// Class sử dụng interface để tạo thành viên đầy đủ thông tin
export default class ThanhVien {
  MaTV?: string;
  HoTen: string;
  NgayGioSinh: Date;
  DiaChi: string;
  TrangThai: string;
  TGTaoMoi: Date;
  DOI: number;
  MaQueQuan: string;
  MaNgheNghiep: string;
  MaGioiTinh: string;
  MaGiaPha?: string;

  constructor(thanhvien: ThanhVienType) {
    const date = new Date(); // Cho TGTaoMoi

    // MaTV sẽ được trigger tự sinh, không cần gán
    this.MaTV = thanhvien.MaTV;
    this.HoTen = thanhvien.HoTen || '';
    this.NgayGioSinh = thanhvien.NgayGioSinh || new Date();
    this.DiaChi = thanhvien.DiaChi || '';
    this.TrangThai = thanhvien.TrangThai || 'Sống';
    this.TGTaoMoi = thanhvien.TGTaoMoi || date;
    this.DOI = thanhvien.DOI || 0;
    this.MaQueQuan = thanhvien.MaQueQuan || '';
    this.MaNgheNghiep = thanhvien.MaNgheNghiep || '';
    this.MaGioiTinh = thanhvien.MaGioiTinh || '';
    this.MaGiaPha = thanhvien.MaGiaPha;
  }
}
```

**Giải thích:**
- Interface `ThanhVienType` cho phép định nghĩa thành viên thiếu một số trường
- Khi tạo object từ interface, class `ThanhVien` sẽ tự động điền giá trị mặc định
- Vì khi lưu vào database, các trường bắt buộc không thể để trống

## 2. Kết nối Database và tạo Connection Pool

### Cập nhật file .env

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=app
```

### Cập nhật database.services.ts

Thay vì dùng TypeORM, ta sẽ dùng **mysql2/promise** để linh hoạt hơn với các trigger và stored procedures:

```ts
// src/services/database.services.ts
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseService {
  private pool: mysql.Pool;

  constructor() {
    // Tạo connection pool
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10, // Số connection tối đa
      queueLimit: 0
    });
  }

  async connect() {
    try {
      // Test connection
      const connection = await this.pool.getConnection();
      console.log('Sửa Đã kết nối thành công với MySQL database!');
      connection.release();
    } catch (error) {
      console.error('❌ Lỗi kết nối MySQL:', error);
      throw error;
    }
  }

  // Thực thi query với parameters (tránh SQL injection)
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await this.pool.execute(sql, params);
    return rows as T;
  }

  // Lấy pool để dùng transaction
  getPool() {
    return this.pool;
  }
}

const databaseService = new DatabaseService();
export default databaseService;
```

**Ưu điểm của mysql2/promise:**
- Hỗ trợ async/await
- Connection pooling tự động
- Prepared statements (chống SQL injection)
- Tương thích tốt với triggers và stored procedures của MySQL

## 3. Tạo ThanhVien Service

Tạo file `thanhvien.services.ts` trong folder `services`:

```ts
// src/services/thanhvien.services.ts
import ThanhVien from '~/models/schemas/ThanhVien.schema';
import databaseService from './database.services';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

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
  MaGioiTinh: string;
  MaGiaPha: string | null;
}

class ThanhVienService {
  // Đăng ký thành viên mới
  async register(payload: {
    HoTen: string;
    NgayGioSinh: Date;
    DiaChi: string;
    MaQueQuan: string;
    MaNgheNghiep: string;
    MaGioiTinh: string;
    MaGiaPha?: string;
  }) {
    const thanhvien = new ThanhVien(payload);

    // INSERT không cần MaTV vì trigger TRG_GEN_ID_THANHVIEN sẽ tự sinh
    const sql = `
      INSERT INTO THANHVIEN (
        HoTen, NgayGioSinh, DiaChi, TrangThai, 
        DOI, MaQueQuan, MaNgheNghiep, MaGioiTinh, MaGiaPha
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      thanhvien.HoTen,
      thanhvien.NgayGioSinh,
      thanhvien.DiaChi,
      thanhvien.TrangThai,
      thanhvien.DOI,
      thanhvien.MaQueQuan,
      thanhvien.MaNgheNghiep,
      thanhvien.MaGioiTinh,
      thanhvien.MaGiaPha || null
    ];

    const result = await databaseService.query<ResultSetHeader>(sql, params);

    // Lấy thành viên vừa tạo (dùng LAST_INSERT_ID không được vì MaTV là VARCHAR)
    // Thay vào đó query lại theo insertId hoặc dùng cách khác
    const [newThanhVien] = await databaseService.query<ThanhVienRow[]>(
      'SELECT * FROM THANHVIEN ORDER BY TGTaoMoi DESC LIMIT 1'
    );

    return {
      message: 'Đăng ký thành viên thành công',
      data: newThanhVien
    };
  }

  // Tìm thành viên theo MaTV
  async findByMaTV(MaTV: string) {
    const sql = 'SELECT * FROM THANHVIEN WHERE MaTV = ?';
    const [rows] = await databaseService.query<ThanhVienRow[]>(sql, [MaTV]);
    return rows;
  }

  // Tìm thành viên theo HoTen
  async findByName(HoTen: string) {
    const sql = 'SELECT * FROM THANHVIEN WHERE HoTen LIKE ?';
    const rows = await databaseService.query<ThanhVienRow[]>(sql, [`%${HoTen}%`]);
    return rows;
  }

  // Lấy tất cả thành viên
  async getAllThanhVien() {
    const sql = 'SELECT * FROM THANHVIEN ORDER BY DOI, TGTaoMoi';
    const rows = await databaseService.query<ThanhVienRow[]>(sql);
    return rows;
  }

  // Cập nhật thông tin thành viên
  async updateThanhVien(MaTV: string, payload: Partial<ThanhVien>) {
    const fields: string[] = [];
    const values: any[] = [];

    // Chỉ update các field được truyền vào
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

    if (fields.length === 0) {
      throw new Error('Không có trường nào để cập nhật');
    }

    values.push(MaTV); // Thêm MaTV vào cuối cho WHERE clause

    const sql = `UPDATE THANHVIEN SET ${fields.join(', ')} WHERE MaTV = ?`;
    const result = await databaseService.query<ResultSetHeader>(sql, values);

    return {
      message: 'Cập nhật thành công',
      affectedRows: result.affectedRows
    };
  }

  // Xóa thành viên
  async deleteThanhVien(MaTV: string) {
    const sql = 'DELETE FROM THANHVIEN WHERE MaTV = ?';
    const result = await databaseService.query<ResultSetHeader>(sql, [MaTV]);

    return {
      message: 'Xóa thành công',
      affectedRows: result.affectedRows
    };
  }
}

const thanhvienService = new ThanhVienService();
export default thanhvienService;
```

## 4. Tạo Controller

Tạo file `thanhvien.controllers.ts` trong folder `controllers`:

```ts
// src/controllers/thanhvien.controllers.ts
import { Request, Response } from 'express';
import thanhvienService from '~/services/thanhvien.services';

// Controller đăng ký thành viên mới
export const registerController = async (req: Request, res: Response) => {
  const { HoTen, NgayGioSinh, DiaChi, MaQueQuan, MaNgheNghiep, MaGioiTinh, MaGiaPha } = req.body;

  try {
    const result = await thanhvienService.register({
      HoTen,
      NgayGioSinh: new Date(NgayGioSinh), // Convert string to Date
      DiaChi,
      MaQueQuan,
      MaNgheNghiep,
      MaGioiTinh,
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

// Controller lấy tất cả thành viên
export const getAllThanhVienController = async (req: Request, res: Response) => {
  try {
    const result = await thanhvienService.getAllThanhVien();
    return res.status(200).json({
      message: 'Lấy danh sách thành công',
      data: result
    });
  } catch (error: any) {
    console.error('Lỗi getAllThanhVien:', error);
    return res.status(400).json({
      message: 'Lấy danh sách thất bại',
      error: error.message
    });
  }
};

// Controller tìm thành viên theo MaTV
export const getThanhVienByMaTVController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await thanhvienService.findByMaTV(MaTV);

    if (!result) {
      return res.status(404).json({
        message: 'Không tìm thấy thành viên'
      });
    }

    return res.status(200).json({
      message: 'Tìm thành viên thành công',
      data: result
    });
  } catch (error: any) {
    console.error('Lỗi getThanhVienByMaTV:', error);
    return res.status(400).json({
      message: 'Tìm thành viên thất bại',
      error: error.message
    });
  }
};

// Controller cập nhật thành viên
export const updateThanhVienController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;
  const payload = req.body;

  try {
    const result = await thanhvienService.updateThanhVien(MaTV, payload);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Lỗi updateThanhVien:', error);
    return res.status(400).json({
      message: 'Cập nhật thất bại',
      error: error.message
    });
  }
};

// Controller xóa thành viên
export const deleteThanhVienController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await thanhvienService.deleteThanhVien(MaTV);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Lỗi deleteThanhVien:', error);
    return res.status(400).json({
      message: 'Xóa thất bại',
      error: error.message
    });
  }
};
```

## 5. Tạo Routes

Tạo file `thanhvien.routes.ts` trong folder `routes`:

```ts
// src/routes/thanhvien.routes.ts
import { Router } from 'express';
import {
  registerController,
  getAllThanhVienController,
  getThanhVienByMaTVController,
  updateThanhVienController,
  deleteThanhVienController
} from '~/controllers/thanhvien.controllers';

const thanhvienRouter = Router();

// POST /thanhvien/register - Đăng ký thành viên mới
thanhvienRouter.post('/register', registerController);

// GET /thanhvien - Lấy tất cả thành viên
thanhvienRouter.get('/', getAllThanhVienController);

// GET /thanhvien/:MaTV - Lấy thành viên theo MaTV
thanhvienRouter.get('/:MaTV', getThanhVienByMaTVController);

// PUT /thanhvien/:MaTV - Cập nhật thành viên
thanhvienRouter.put('/:MaTV', updateThanhVienController);

// DELETE /thanhvien/:MaTV - Xóa thành viên
thanhvienRouter.delete('/:MaTV', deleteThanhVienController);

export default thanhvienRouter;
```

## 6. Cập nhật index.ts

```ts
// src/index.ts
import express from 'express';
import databaseService from '~/services/database.services';
import thanhvienRouter from '~/routes/thanhvien.routes';
import usersRouter from '~/routes/users.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/thanhvien', thanhvienRouter);
app.use('/users', usersRouter);

// Kết nối database và start server
databaseService.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  });
});
```

## 7. Test API với Postman

### 7.1. Đăng ký thành viên mới

**POST** `http://localhost:3000/thanhvien/register`

**Body (JSON):**
```json
{
  "HoTen": "Nguyễn Văn An",
  "NgayGioSinh": "1995-05-15",
  "DiaChi": "Hà Nội",
  "MaQueQuan": "QQ00",
  "MaNgheNghiep": "NN06",
  "MaGioiTinh": "GT00",
  "MaGiaPha": "GP00"
}
```

**Response:**
```json
{
  "message": "Đăng ký thành viên thành công",
  "data": {
    "MaTV": "TV08",
    "HoTen": "Nguyễn Văn An",
    "NgayGioSinh": "1995-05-15",
    "DiaChi": "Hà Nội",
    "TrangThai": "Sống",
    "TGTaoMoi": "2025-11-26T03:30:00.000Z",
    "DOI": 0,
    "MaQueQuan": "QQ00",
    "MaNgheNghiep": "NN06",
    "MaGioiTinh": "GT00",
    "MaGiaPha": "GP00"
  }
}
```

### 7.2. Lấy tất cả thành viên

**GET** `http://localhost:3000/thanhvien`

### 7.3. Lấy thành viên theo MaTV

**GET** `http://localhost:3000/thanhvien/TV02`

### 7.4. Cập nhật thành viên

**PUT** `http://localhost:3000/thanhvien/TV08`

**Body (JSON):**
```json
{
  "DiaChi": "TP Hồ Chí Minh",
  "MaNgheNghiep": "NN02"
}
```

### 7.5. Xóa thành viên

**DELETE** `http://localhost:3000/thanhvien/TV08`

## 8. Mô hình kiến trúc

```
Client (Postman/Frontend)
        ↓
    Routes (thanhvien.routes.ts)
        ↓
    Controllers (thanhvien.controllers.ts)
        ↓
    Services (thanhvien.services.ts)
        ↓
    Database (database.services.ts)
        ↓
    MySQL Database (app)
```

**Giải thích:**
1. **Routes**: Định nghĩa các endpoint và HTTP methods
2. **Controllers**: Nhận request, validate, gọi service và trả response
3. **Services**: Chứa business logic, tương tác với database
4. **Database Service**: Quản lý connection pool và thực thi queries
5. **MySQL**: Lưu trữ dữ liệu thực tế

## 9. Lưu ý về Triggers

Database của bạn có 13 triggers tự động xử lý:

### Triggers tự sinh ID:
1. `TRG_GEN_ID_THANHVIEN` - Tự sinh MaTV (TV00, TV01...)
2. `TRG_GEN_ID_CAYGIAPHA` - Tự sinh MaGiaPha (GP00, GP01...)
3. `TRG_GEN_ID_GHINHANTHANHTICH` - Tự sinh MaGNTT
4. `TRG_GEN_ID_GHINHANKETTHUC` - Tự sinh MaGNKT
5. `TRG_GEN_ID_CHIQUY` - Tự sinh MaPhieuChi
6. `TRG_GEN_ID_THUQUY` - Tự sinh MaPhieuThu

### Triggers logic nghiệp vụ:
7. `TRG_INSERT_DOI_THANHVIEN_CONCAI` - Đời con = đời cha/mẹ + 1
8. `TRG_INSERT_DOI_THANHVIEN_HONNHAN` - Đời vợ/chồng bằng nhau
9. `TRG_INSERT_MaGP_THANHVIEN_CONCAI` - Con cùng gia phả với cha/mẹ
10. `TRG_INSERT_MaGP_THANHVIEN_HONNHAN` - Vợ/chồng cùng gia phả
11. `TRG_INSERT_NgayGioMat_CONCAI_KETTHUC` - Kiểm tra ngày sinh con < ngày mất cha/mẹ
12. `TRG_CHECK_NGAY_THANHTICH` - Ngày đạt thành tích > ngày sinh
13. `TRG_INSERT_TRANGTHAI_THANHVIEN_KETTHUC` - Tự chuyển trạng thái 'Mất'

**Khi INSERT dữ liệu:**
- Không cần truyền các trường có trigger tự sinh (MaTV, MaGiaPha...)
- Triggers sẽ tự động xử lý logic nghiệp vụ
- Cần chú ý thứ tự INSERT để tránh lỗi foreign key

## 10. Tương tự cho các bảng khác

Bạn có thể áp dụng pattern tương tự cho các bảng khác:

### CAYGIAPHA
- Schema: `CayGiaPha.schema.ts`
- Service: `caygiapha.services.ts`
- Controller: `caygiapha.controllers.ts`
- Routes: `caygiapha.routes.ts`

### HONNHAN
- Schema: `HonNhan.schema.ts`
- Service: `honnhan.services.ts`
- Controller: `honnhan.controllers.ts`
- Routes: `honnhan.routes.ts`

### CONCAI
- Schema: `ConCai.schema.ts`
- Service: `concai.services.ts`
- Controller: `concai.controllers.ts`
- Routes: `concai.routes.ts`

Và tương tự cho 20+ bảng còn lại trong `init.sql` của bạn.

## 11. Kết luận

- Đã chuyển đổi từ MongoDB sang MySQL thành công
- Sử dụng mysql2/promise thay vì TypeORM để linh hoạt hơn với triggers
- Tách biệt rõ ràng: Schema → Service → Controller → Routes
- Triggers tự động xử lý logic nghiệp vụ phức tạp
- Code dễ bảo trì, mở rộng và test
