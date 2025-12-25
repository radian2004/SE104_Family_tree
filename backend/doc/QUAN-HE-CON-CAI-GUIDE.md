# HƯỚNG DẪN IMPLEMENT CHỨC NĂNG QUẢN LÝ QUAN HỆ CON CÁI

## 📋 MÔ TẢ CHỨC NĂNG

Chức năng này cho phép thiết lập quan hệ con cái giữa các thành viên trong gia phả:
- **Thành viên Con**: Đã có trong database (vừa được thêm mới từ frontend)
- **Thành viên Cha**: Đã có trong database 
- **Thành viên Mẹ**: Đã có trong database

### Yêu cầu nghiệp vụ:
1. Không cần kiểm tra nhập liệu (frontend đã xử lý và gọi thêm thành viên trước)
2. Khi thiết lập quan hệ con cái, con sẽ tự động được gán vào cùng gia phả với cha/mẹ (thông qua trigger `TRG_INSERT_MaGP_THANHVIEN_QUANHECON`)
3. Con sẽ tự động có `DOI` (đời) = đời cha/mẹ + 1 (thông qua trigger `TRG_INSERT_DOI_THANHVIEN_QUANHECON`)
4. Ngày làm giấy khai sinh phải sau ngày sinh của cả cha và mẹ (được validate bởi trigger)

---

## 🗄️ CẤU TRÚC DATABASE HIỆN TẠI

### Bảng QUANHECON (Đã tồn tại trong `init.sql`)

```sql
CREATE TABLE QUANHECON(
	MaTV VARCHAR(5) PRIMARY KEY,           -- Mã thành viên con
	MaTVCha VARCHAR(5),                    -- Mã thành viên cha
	MaTVMe VARCHAR(5),                     -- Mã thành viên mẹ
	NgayPhatSinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP(), -- Ngày làm giấy khai sinh
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(MaTVCha) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(MaTVMe) REFERENCES THANHVIEN(MaTV)
);
```

**Lưu ý quan trọng**: 
- `MaTV` là PRIMARY KEY nên mỗi thành viên chỉ có thể có 1 bản ghi quan hệ con cái duy nhất
- `NgayPhatSinh` mặc định là TIMESTAMP hiện tại nhưng có thể truyền vào giá trị tùy chỉnh

### Các Triggers liên quan (Đã tồn tại):

#### 1. TRG_INSERT_DOI_THANHVIEN_QUANHECON
**Mục đích**: Tự động set đời của con = đời cha/mẹ + 1
```sql
CREATE TRIGGER TRG_INSERT_DOI_THANHVIEN_QUANHECON
AFTER INSERT ON QUANHECON
FOR EACH ROW
BEGIN
    DECLARE parent_gen INT;

    -- Lấy đời của cha/mẹ từ bảng THANHVIEN
    SELECT doi INTO parent_gen
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVCha;

    -- Nếu đời cha/mẹ có tồn tại thì cập nhật đời của con
    IF parent_gen IS NOT NULL THEN
        UPDATE THANHVIEN
        SET DOI = parent_gen + 1
        WHERE MaTV = NEW.MaTV;
    END IF;
END;
```

#### 2. TRG_CHECK_CHA_ME_QUANHECON
**Mục đích**: Kiểm tra giới tính - Cha phải là Nam, Mẹ phải là Nữ
```sql
CREATE TRIGGER TRG_CHECK_CHA_ME_QUANHECON
BEFORE INSERT ON QUANHECON
FOR EACH ROW
BEGIN
    DECLARE father_gender VARCHAR(3);
    DECLARE mother_gender VARCHAR(3);

    -- Lấy giới tính của cha
    SELECT GioiTinh INTO father_gender
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVCha;
    
    -- Lấy giới tính của mẹ
    SELECT GioiTinh INTO mother_gender
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVMe;
    
    -- Kiểm tra giới tính cha phải là Nam
    IF father_gender IS NOT NULL AND father_gender != 'Nam' THEN
        SIGNAL SQLSTATE '45003'
        SET MESSAGE_TEXT = N'Giới tính của cha phải là Nam!';
    END IF;

    -- Kiểm tra giới tính mẹ phải là Nữ
    IF mother_gender IS NOT NULL AND mother_gender != 'Nữ' THEN
        SIGNAL SQLSTATE '45004'
        SET MESSAGE_TEXT = N'Giới tính của mẹ phải là Nữ!';
    END IF;
END;
```

#### 3. TRG_INSERT_MaGP_THANHVIEN_QUANHECON
**Mục đích**: Tự động gán gia phả cho con theo cha/mẹ
```sql
CREATE TRIGGER TRG_INSERT_MaGP_THANHVIEN_QUANHECON
AFTER INSERT ON QUANHECON
FOR EACH ROW
BEGIN
    DECLARE parent_family_id VARCHAR(5);

    -- Ưu tiên lấy mã gia phả từ cha, nếu cha không có thì lấy từ mẹ
    SELECT MaGiaPha INTO parent_family_id
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVCha;

    IF parent_family_id IS NULL THEN
        SELECT MaGiaPha INTO parent_family_id
        FROM THANHVIEN
        WHERE MaTV = NEW.MaTVMe;
    END IF;

    -- Nếu cha hoặc mẹ có mã gia phả thì set cho con
    IF parent_family_id IS NOT NULL THEN
        UPDATE THANHVIEN
        SET MaGiaPha = parent_family_id
        WHERE MaTV = NEW.MaTV;
    END IF;
END;
```

#### 4. TRG_CHECK_NGAY_SINH_CON_QUANHECON
**Mục đích**: Kiểm tra ngày sinh con phải sau ngày sinh cha và mẹ
```sql
CREATE TRIGGER TRG_CHECK_NGAY_SINH_CON_QUANHECON
BEFORE INSERT ON QUANHECON
FOR EACH ROW
BEGIN
    DECLARE father_birth DATE;
    DECLARE mother_birth DATE;
    DECLARE child_birth DATE;

    -- Lấy ngày sinh của cha
    SELECT NgayGioSinh INTO father_birth
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVCha;
    
    -- Lấy ngày sinh của mẹ
    SELECT NgayGioSinh INTO mother_birth
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVMe;

    -- Lấy ngày sinh con
    SELECT NgayGioSinh INTO child_birth
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;
    
    -- Kiểm tra ngày sinh con phải sau ngày sinh cha
    IF father_birth IS NOT NULL AND child_birth <= father_birth THEN
        SIGNAL SQLSTATE '45002'
        SET MESSAGE_TEXT = N'Ngày sinh của con phải sau ngày sinh của cha!';
    END IF;

    -- Kiểm tra ngày sinh con phải sau ngày sinh mẹ
    IF mother_birth IS NOT NULL AND child_birth <= mother_birth THEN
        SIGNAL SQLSTATE '45001'
        SET MESSAGE_TEXT = N'Ngày sinh của con phải sau ngày sinh của mẹ!';
    END IF;
END;
```

#### 5. TRG_UPDATE_ME_QUANHECON
**Mục đích**: Tự động set mẹ = vợ hiện tại của cha (nếu cha có quan hệ hôn nhân)
```sql
CREATE TRIGGER TRG_UPDATE_ME_QUANHECON
BEFORE INSERT ON QUANHECON
FOR EACH ROW
BEGIN
    DECLARE wife_id VARCHAR(5);
    
    -- Lấy vợ hiện tại của cha
    SELECT MaTVVC INTO wife_id
    FROM HONNHAN
    WHERE MaTV = NEW.MaTVCha;

    -- Nếu cha có vợ thì set mẹ = vợ của cha
    IF wife_id IS NOT NULL THEN
        SET NEW.MaTVMe = wife_id;
    ELSE
        -- Nếu cha không có vợ thì để mẹ là NULL
        SET NEW.MaTVMe = NULL;
    END IF;
END;
```

---

## 📁 CẤU TRÚC CODE CẦN TẠO

### 1. Schema: `src/models/schemas/QuanHeCon.schema.ts`

**Tạo file mới** với nội dung sau:

```typescript
// src/models/schemas/QuanHeCon.schema.ts

interface QuanHeConType {
  MaTV: string;
  MaTVCha: string;
  MaTVMe: string;
  NgayPhatSinh?: Date;
}

export default class QuanHeCon {
  MaTV: string;
  MaTVCha: string;
  MaTVMe: string;
  NgayPhatSinh?: Date;

  constructor(quanHeCon: QuanHeConType) {
    this.MaTV = quanHeCon.MaTV;
    this.MaTVCha = quanHeCon.MaTVCha;
    this.MaTVMe = quanHeCon.MaTVMe;
    this.NgayPhatSinh = quanHeCon.NgayPhatSinh;
  }
}
```

---

### 2. Service: `src/services/quanhecon.services.ts`

**Tạo file mới** với nội dung sau:

```typescript
// src/services/quanhecon.services.ts
import QuanHeCon from '~/models/schemas/QuanHeCon.schema';
import databaseService from './database.services';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface QuanHeConRow extends RowDataPacket {
  MaTV: string;
  MaTVCha: string;
  MaTVMe: string;
  NgayPhatSinh: Date;
}

interface QuanHeConDetailRow extends RowDataPacket {
  MaTV: string;
  HoTenCon: string;
  MaTVCha: string;
  HoTenCha: string;
  MaTVMe: string;
  HoTenMe: string;
  NgayPhatSinh: Date;
}

class QuanHeConService {
  /**
   * Thiết lập quan hệ con cái
   * @param MaTV - Mã thành viên con
   * @param MaTVCha - Mã thành viên cha
   * @param MaTVMe - Mã thành viên mẹ
   * @param NgayPhatSinh - Ngày làm giấy khai sinh (optional, default CURRENT_TIMESTAMP)
   */
  async thietLapQuanHeCon(payload: {
    MaTV: string;
    MaTVCha: string;
    MaTVMe: string;
    NgayPhatSinh?: Date;
  }) {
    const quanHeCon = new QuanHeCon(payload);

    const sql = `
      INSERT INTO QUANHECON (MaTV, MaTVCha, MaTVMe, NgayPhatSinh) 
      VALUES (?, ?, ?, ?)
    `;

    const params = [
      quanHeCon.MaTV,
      quanHeCon.MaTVCha,
      quanHeCon.MaTVMe,
      quanHeCon.NgayPhatSinh || new Date()
    ];

    try {
      const result = await databaseService.query<ResultSetHeader>(sql, params);
      
      // Lấy thông tin chi tiết của quan hệ vừa tạo
      const detail = await this.getQuanHeConDetail(quanHeCon.MaTV);

      return {
        message: 'Thiết lập quan hệ con cái thành công',
        data: detail,
        affectedRows: result.affectedRows
      };
    } catch (error: any) {
      // Xử lý lỗi từ trigger
      if (error.code === 'ER_SIGNAL_EXCEPTION') {
        const errorMessage = error.sqlMessage || 'Lỗi khi thiết lập quan hệ con cái';
        throw new Error(errorMessage);
      }
      // Xử lý lỗi duplicate key (thành viên con đã có quan hệ cha mẹ)
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Thành viên này đã có quan hệ cha mẹ!');
      }
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết một quan hệ con cái
   */
  async getQuanHeConDetail(MaTV: string) {
    const sql = `
      SELECT 
        qhc.MaTV,
        tvcon.HoTen AS HoTenCon,
        qhc.MaTVCha,
        tvcha.HoTen AS HoTenCha,
        qhc.MaTVMe,
        tvme.HoTen AS HoTenMe,
        qhc.NgayPhatSinh
      FROM QUANHECON qhc
      LEFT JOIN THANHVIEN tvcon ON qhc.MaTV = tvcon.MaTV
      LEFT JOIN THANHVIEN tvcha ON qhc.MaTVCha = tvcha.MaTV
      LEFT JOIN THANHVIEN tvme ON qhc.MaTVMe = tvme.MaTV
      WHERE qhc.MaTV = ?
    `;

    const rows = await databaseService.query<QuanHeConDetailRow[]>(sql, [MaTV]);
    return rows[0] || null;
  }

  /**
   * Lấy tất cả quan hệ con cái
   */
  async getAllQuanHeCon() {
    const sql = `
      SELECT 
        qhc.MaTV,
        tvcon.HoTen AS HoTenCon,
        qhc.MaTVCha,
        tvcha.HoTen AS HoTenCha,
        qhc.MaTVMe,
        tvme.HoTen AS HoTenMe,
        qhc.NgayPhatSinh
      FROM QUANHECON qhc
      LEFT JOIN THANHVIEN tvcon ON qhc.MaTV = tvcon.MaTV
      LEFT JOIN THANHVIEN tvcha ON qhc.MaTVCha = tvcha.MaTV
      LEFT JOIN THANHVIEN tvme ON qhc.MaTVMe = tvme.MaTV
      ORDER BY qhc.NgayPhatSinh DESC
    `;

    const rows = await databaseService.query<QuanHeConDetailRow[]>(sql);
    return rows;
  }

  /**
   * Lấy danh sách con của một thành viên cụ thể (có thể là cha hoặc mẹ)
   */
  async getConByMaTV(MaTV: string) {
    const sql = `
      SELECT 
        qhc.MaTV,
        tvcon.HoTen AS HoTenCon,
        qhc.MaTVCha,
        tvcha.HoTen AS HoTenCha,
        qhc.MaTVMe,
        tvme.HoTen AS HoTenMe,
        qhc.NgayPhatSinh
      FROM QUANHECON qhc
      LEFT JOIN THANHVIEN tvcon ON qhc.MaTV = tvcon.MaTV
      LEFT JOIN THANHVIEN tvcha ON qhc.MaTVCha = tvcha.MaTV
      LEFT JOIN THANHVIEN tvme ON qhc.MaTVMe = tvme.MaTV
      WHERE qhc.MaTVCha = ? OR qhc.MaTVMe = ?
      ORDER BY qhc.NgayPhatSinh DESC
    `;

    const rows = await databaseService.query<QuanHeConDetailRow[]>(sql, [MaTV, MaTV]);
    return rows;
  }

  /**
   * Lấy thông tin cha mẹ của một thành viên
   */
  async getChaMe(MaTV: string) {
    const sql = `
      SELECT 
        qhc.MaTVCha,
        tvcha.HoTen AS HoTenCha,
        qhc.MaTVMe,
        tvme.HoTen AS HoTenMe,
        qhc.NgayPhatSinh
      FROM QUANHECON qhc
      LEFT JOIN THANHVIEN tvcha ON qhc.MaTVCha = tvcha.MaTV
      LEFT JOIN THANHVIEN tvme ON qhc.MaTVMe = tvme.MaTV
      WHERE qhc.MaTV = ?
    `;

    const rows = await databaseService.query<QuanHeConDetailRow[]>(sql, [MaTV]);
    return rows[0] || null;
  }

  /**
   * Xóa quan hệ con cái
   */
  async xoaQuanHeCon(MaTV: string) {
    const sql = `
      DELETE FROM QUANHECON 
      WHERE MaTV = ?
    `;

    try {
      const result = await databaseService.query<ResultSetHeader>(sql, [MaTV]);
      
      if (result.affectedRows === 0) {
        throw new Error('Không tìm thấy quan hệ con cái để xóa');
      }

      return {
        message: 'Xóa quan hệ con cái thành công',
        affectedRows: result.affectedRows
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Cập nhật quan hệ con cái (cập nhật cha, mẹ hoặc ngày phát sinh)
   */
  async capNhatQuanHeCon(payload: {
    MaTV: string;
    MaTVCha?: string;
    MaTVMe?: string;
    NgayPhatSinh?: Date;
  }) {
    const { MaTV, MaTVCha, MaTVMe, NgayPhatSinh } = payload;

    // Build dynamic SQL
    const updates: string[] = [];
    const params: any[] = [];

    if (MaTVCha !== undefined) {
      updates.push('MaTVCha = ?');
      params.push(MaTVCha);
    }
    if (MaTVMe !== undefined) {
      updates.push('MaTVMe = ?');
      params.push(MaTVMe);
    }
    if (NgayPhatSinh !== undefined) {
      updates.push('NgayPhatSinh = ?');
      params.push(NgayPhatSinh);
    }

    if (updates.length === 0) {
      throw new Error('Không có thông tin nào để cập nhật');
    }

    params.push(MaTV);

    const sql = `
      UPDATE QUANHECON 
      SET ${updates.join(', ')}
      WHERE MaTV = ?
    `;

    try {
      const result = await databaseService.query<ResultSetHeader>(sql, params);
      
      if (result.affectedRows === 0) {
        throw new Error('Không tìm thấy quan hệ con cái để cập nhật');
      }

      // Lấy thông tin chi tiết sau khi cập nhật
      const detail = await this.getQuanHeConDetail(MaTV);

      return {
        message: 'Cập nhật quan hệ con cái thành công',
        data: detail,
        affectedRows: result.affectedRows
      };
    } catch (error: any) {
      // Xử lý lỗi từ trigger
      if (error.code === 'ER_SIGNAL_EXCEPTION') {
        const errorMessage = error.sqlMessage || 'Lỗi khi cập nhật quan hệ con cái';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}

const quanHeConService = new QuanHeConService();
export default quanHeConService;
```

---

### 3. Controller: `src/controllers/quanhecon.controllers.ts`

**Tạo file mới** với nội dung sau:

```typescript
// src/controllers/quanhecon.controllers.ts
import { Request, Response } from 'express';
import quanHeConService from '~/services/quanhecon.services';
import HTTP_STATUS from '~/constants/httpStatus';

/**
 * POST /quanhecon/thietlap
 * Thiết lập quan hệ con cái giữa thành viên con với cha và mẹ
 * Body: { MaTV, MaTVCha, MaTVMe, NgayPhatSinh? }
 */
export const thietLapQuanHeConController = async (req: Request, res: Response) => {
  const { MaTV, MaTVCha, MaTVMe, NgayPhatSinh } = req.body;

  try {
    // Validate dữ liệu đầu vào
    if (!MaTV || !MaTVCha || !MaTVMe) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV, MaTVCha, MaTVMe'
      });
    }

    const result = await quanHeConService.thietLapQuanHeCon({
      MaTV,
      MaTVCha,
      MaTVMe,
      NgayPhatSinh: NgayPhatSinh ? new Date(NgayPhatSinh) : undefined
    });

    return res.status(HTTP_STATUS.CREATED).json(result);
  } catch (error: any) {
    console.error('Lỗi thietLapQuanHeCon:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Thiết lập quan hệ con cái thất bại',
      error: error.message
    });
  }
};

/**
 * GET /quanhecon
 * Lấy tất cả quan hệ con cái
 */
export const getAllQuanHeConController = async (req: Request, res: Response) => {
  try {
    const result = await quanHeConService.getAllQuanHeCon();
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách quan hệ con cái thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getAllQuanHeCon:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy danh sách quan hệ con cái thất bại',
      error: error.message
    });
  }
};

/**
 * GET /quanhecon/con/:MaTV
 * Lấy danh sách con của một thành viên (cha hoặc mẹ)
 */
export const getConByMaTVController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await quanHeConService.getConByMaTV(MaTV);
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách con thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getConByMaTV:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy danh sách con thất bại',
      error: error.message
    });
  }
};

/**
 * GET /quanhecon/chame/:MaTV
 * Lấy thông tin cha mẹ của một thành viên
 */
export const getChaMeController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await quanHeConService.getChaMe(MaTV);
    
    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Không tìm thấy thông tin cha mẹ'
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy thông tin cha mẹ thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi getChaMe:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy thông tin cha mẹ thất bại',
      error: error.message
    });
  }
};

/**
 * DELETE /quanhecon/:MaTV
 * Xóa quan hệ con cái
 */
export const xoaQuanHeConController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await quanHeConService.xoaQuanHeCon(MaTV);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    console.error('Lỗi xoaQuanHeCon:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Xóa quan hệ con cái thất bại',
      error: error.message
    });
  }
};

/**
 * PUT /quanhecon/:MaTV
 * Cập nhật quan hệ con cái
 * Body: { MaTVCha?, MaTVMe?, NgayPhatSinh? }
 */
export const capNhatQuanHeConController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;
  const { MaTVCha, MaTVMe, NgayPhatSinh } = req.body;

  try {
    const result = await quanHeConService.capNhatQuanHeCon({
      MaTV,
      MaTVCha,
      MaTVMe,
      NgayPhatSinh: NgayPhatSinh ? new Date(NgayPhatSinh) : undefined
    });

    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    console.error('Lỗi capNhatQuanHeCon:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Cập nhật quan hệ con cái thất bại',
      error: error.message
    });
  }
};

/**
 * GET /quanhecon/detail/:MaTV
 * Lấy thông tin chi tiết quan hệ con cái của một thành viên
 */
export const getQuanHeConDetailController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await quanHeConService.getQuanHeConDetail(MaTV);
    
    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Không tìm thấy thông tin quan hệ con cái'
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy thông tin chi tiết thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi getQuanHeConDetail:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy thông tin chi tiết thất bại',
      error: error.message
    });
  }
};
```

---

### 4. Routes: `src/routes/quanhecon.routes.ts`

**Tạo file mới** với nội dung sau:

```typescript
// src/routes/quanhecon.routes.ts
import { Router } from 'express';
import {
  thietLapQuanHeConController,
  getAllQuanHeConController,
  getConByMaTVController,
  getChaMeController,
  xoaQuanHeConController,
  capNhatQuanHeConController,
  getQuanHeConDetailController
} from '~/controllers/quanhecon.controllers';
import { wrapAsync } from '~/utils/handlers';

const quanHeConRouter = Router();

/**
 * POST /quanhecon/thietlap
 * Thiết lập quan hệ con cái
 * Body: { MaTV, MaTVCha, MaTVMe, NgayPhatSinh? }
 */
quanHeConRouter.post('/thietlap', wrapAsync(thietLapQuanHeConController));

/**
 * GET /quanhecon
 * Lấy tất cả quan hệ con cái
 */
quanHeConRouter.get('/', wrapAsync(getAllQuanHeConController));

/**
 * GET /quanhecon/con/:MaTV
 * Lấy danh sách con của một thành viên (cha hoặc mẹ)
 */
quanHeConRouter.get('/con/:MaTV', wrapAsync(getConByMaTVController));

/**
 * GET /quanhecon/chame/:MaTV
 * Lấy thông tin cha mẹ của một thành viên
 */
quanHeConRouter.get('/chame/:MaTV', wrapAsync(getChaMeController));

/**
 * GET /quanhecon/detail/:MaTV
 * Lấy thông tin chi tiết quan hệ con cái
 */
quanHeConRouter.get('/detail/:MaTV', wrapAsync(getQuanHeConDetailController));

/**
 * PUT /quanhecon/:MaTV
 * Cập nhật quan hệ con cái
 * Body: { MaTVCha?, MaTVMe?, NgayPhatSinh? }
 */
quanHeConRouter.put('/:MaTV', wrapAsync(capNhatQuanHeConController));

/**
 * DELETE /quanhecon/:MaTV
 * Xóa quan hệ con cái
 */
quanHeConRouter.delete('/:MaTV', wrapAsync(xoaQuanHeConController));

export default quanHeConRouter;
```

---

### 5. Cập nhật file `src/index.ts`

**Thêm import và sử dụng route mới:**

```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import databaseService from '~/services/database.services';
import usersRouter from '~/routes/users.routes';
import honNhanRouter from '~/routes/honnhan.routes';          // Đã có
import quanHeConRouter from '~/routes/quanhecon.routes';      // THÊM MỚI
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

// Routes
app.use('/users', usersRouter);
app.use('/honnhan', honNhanRouter);          // Đã có
app.use('/quanhecon', quanHeConRouter);      // THÊM MỚI

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

## 📝 DANH SÁCH CÁC ENDPOINT API

### 1. Thiết lập quan hệ con cái
- **Endpoint**: `POST /quanhecon/thietlap`
- **Body**:
```json
{
  "MaTV": "TV08",
  "MaTVCha": "TV06",
  "MaTVMe": "TV07",
  "NgayPhatSinh": "2024-06-10T12:00:00Z"
}
```
- **Response thành công**:
```json
{
  "message": "Thiết lập quan hệ con cái thành công",
  "data": {
    "MaTV": "TV08",
    "HoTenCon": "Nguyễn Văn Minh",
    "MaTVCha": "TV06",
    "HoTenCha": "Nguyễn Văn Nam",
    "MaTVMe": "TV07",
    "HoTenMe": "Nguyễn Thị Ngọc Anh",
    "NgayPhatSinh": "2024-06-10T12:00:00.000Z"
  },
  "affectedRows": 1
}
```
- **Response lỗi**:
```json
{
  "message": "Thiết lập quan hệ con cái thất bại",
  "error": "Thành viên này đã có quan hệ cha mẹ!"
}
```

### 2. Lấy tất cả quan hệ con cái
- **Endpoint**: `GET /quanhecon`
- **Response**:
```json
{
  "message": "Lấy danh sách quan hệ con cái thành công",
  "total": 5,
  "result": [
    {
      "MaTV": "TV08",
      "HoTenCon": "Nguyễn Văn Minh",
      "MaTVCha": "TV06",
      "HoTenCha": "Nguyễn Văn Nam",
      "MaTVMe": "TV07",
      "HoTenMe": "Nguyễn Thị Ngọc Anh",
      "NgayPhatSinh": "2024-06-10T12:00:00.000Z"
    }
  ]
}
```

### 3. Lấy danh sách con của một thành viên
- **Endpoint**: `GET /quanhecon/con/:MaTV`
- **Ví dụ**: `GET /quanhecon/con/TV06`
- **Response**:
```json
{
  "message": "Lấy danh sách con thành công",
  "total": 1,
  "result": [
    {
      "MaTV": "TV08",
      "HoTenCon": "Nguyễn Văn Minh",
      "MaTVCha": "TV06",
      "HoTenCha": "Nguyễn Văn Nam",
      "MaTVMe": "TV07",
      "HoTenMe": "Nguyễn Thị Ngọc Anh",
      "NgayPhatSinh": "2024-06-10T12:00:00.000Z"
    }
  ]
}
```

### 4. Lấy thông tin cha mẹ của một thành viên
- **Endpoint**: `GET /quanhecon/chame/:MaTV`
- **Ví dụ**: `GET /quanhecon/chame/TV08`
- **Response**:
```json
{
  "message": "Lấy thông tin cha mẹ thành công",
  "result": {
    "MaTVCha": "TV06",
    "HoTenCha": "Nguyễn Văn Nam",
    "MaTVMe": "TV07",
    "HoTenMe": "Nguyễn Thị Ngọc Anh",
    "NgayPhatSinh": "2024-06-10T12:00:00.000Z"
  }
}
```

### 5. Lấy thông tin chi tiết quan hệ con cái
- **Endpoint**: `GET /quanhecon/detail/:MaTV`
- **Ví dụ**: `GET /quanhecon/detail/TV08`
- **Response**:
```json
{
  "message": "Lấy thông tin chi tiết thành công",
  "result": {
    "MaTV": "TV08",
    "HoTenCon": "Nguyễn Văn Minh",
    "MaTVCha": "TV06",
    "HoTenCha": "Nguyễn Văn Nam",
    "MaTVMe": "TV07",
    "HoTenMe": "Nguyễn Thị Ngọc Anh",
    "NgayPhatSinh": "2024-06-10T12:00:00.000Z"
  }
}
```

### 6. Cập nhật quan hệ con cái
- **Endpoint**: `PUT /quanhecon/:MaTV`
- **Ví dụ**: `PUT /quanhecon/TV08`
- **Body** (tất cả fields đều optional):
```json
{
  "MaTVCha": "TV06",
  "MaTVMe": "TV07",
  "NgayPhatSinh": "2024-06-15T10:00:00Z"
}
```
- **Response**:
```json
{
  "message": "Cập nhật quan hệ con cái thành công",
  "data": {
    "MaTV": "TV08",
    "HoTenCon": "Nguyễn Văn Minh",
    "MaTVCha": "TV06",
    "HoTenCha": "Nguyễn Văn Nam",
    "MaTVMe": "TV07",
    "HoTenMe": "Nguyễn Thị Ngọc Anh",
    "NgayPhatSinh": "2024-06-15T10:00:00.000Z"
  },
  "affectedRows": 1
}
```

### 7. Xóa quan hệ con cái
- **Endpoint**: `DELETE /quanhecon/:MaTV`
- **Ví dụ**: `DELETE /quanhecon/TV08`
- **Response**:
```json
{
  "message": "Xóa quan hệ con cái thành công",
  "affectedRows": 1
}
```

---

## 🧪 TEST CASES

### 1. Test thiết lập quan hệ con cái thành công

```bash
curl -X POST http://localhost:3000/quanhecon/thietlap \
  -H "Content-Type: application/json" \
  -d '{
    "MaTV": "TV08",
    "MaTVCha": "TV06",
    "MaTVMe": "TV07",
    "NgayPhatSinh": "2024-06-10T12:00:00Z"
  }'
```

### 2. Test lấy tất cả quan hệ con cái

```bash
curl -X GET http://localhost:3000/quanhecon
```

### 3. Test lấy danh sách con của thành viên

```bash
curl -X GET http://localhost:3000/quanhecon/con/TV06
```

### 4. Test lấy thông tin cha mẹ

```bash
curl -X GET http://localhost:3000/quanhecon/chame/TV08
```

### 5. Test cập nhật quan hệ con cái

```bash
curl -X PUT http://localhost:3000/quanhecon/TV08 \
  -H "Content-Type: application/json" \
  -d '{
    "NgayPhatSinh": "2024-06-15T10:00:00Z"
  }'
```

### 6. Test xóa quan hệ con cái

```bash
curl -X DELETE http://localhost:3000/quanhecon/TV08
```

---

## 🔍 KIỂM TRA DATABASE SAU KHI THIẾT LẬP

### Kiểm tra quan hệ con cái vừa tạo:
```sql
SELECT * FROM QUANHECON WHERE MaTV = 'TV08';
```

### Kiểm tra thành viên con đã được gán gia phả chưa:
```sql
SELECT MaTV, HoTen, MaGiaPha, DOI FROM THANHVIEN WHERE MaTV = 'TV08';
```

### Kiểm tra tất cả quan hệ con cái:
```sql
SELECT 
  qhc.MaTV,
  tvcon.HoTen AS HoTenCon,
  qhc.MaTVCha,
  tvcha.HoTen AS HoTenCha,
  qhc.MaTVMe,
  tvme.HoTen AS HoTenMe,
  qhc.NgayPhatSinh
FROM QUANHECON qhc
LEFT JOIN THANHVIEN tvcon ON qhc.MaTV = tvcon.MaTV
LEFT JOIN THANHVIEN tvcha ON qhc.MaTVCha = tvcha.MaTV
LEFT JOIN THANHVIEN tvme ON qhc.MaTVMe = tvme.MaTV;
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Về Triggers tự động
- **TRG_INSERT_DOI_THANHVIEN_QUANHECON**: Tự động set đời con = đời cha + 1
- **TRG_INSERT_MaGP_THANHVIEN_QUANHECON**: Tự động gán gia phả cho con
- **TRG_UPDATE_ME_QUANHECON**: Tự động set mẹ = vợ hiện tại của cha (nếu có)
- **TRG_CHECK_CHA_ME_QUANHECON**: Kiểm tra giới tính cha (Nam) và mẹ (Nữ)
- **TRG_CHECK_NGAY_SINH_CON_QUANHECON**: Kiểm tra ngày sinh con phải sau cha và mẹ

### 2. Về Primary Key
- `MaTV` là PRIMARY KEY trong bảng `QUANHECON`
- Mỗi thành viên chỉ có thể có **1 bản ghi duy nhất** (1 cặp cha mẹ)
- Nếu muốn thêm lại quan hệ cho thành viên đã có, phải xóa quan hệ cũ trước

### 3. Về Validation
- Không cần validate giới tính (trigger đã xử lý)
- Không cần validate ngày sinh (trigger đã xử lý)
- Frontend phải đảm bảo thành viên con đã được tạo trước khi gọi API thiết lập quan hệ

### 4. Về Error Handling
- Lỗi duplicate key → thành viên đã có cha mẹ
- Lỗi foreign key → thành viên không tồn tại
- Lỗi trigger → vi phạm business rule (giới tính, ngày sinh, etc.)

### 5. Flow thực tế khi thêm thành viên mới
```
1. Frontend: Gọi API thêm thành viên mới → Nhận về MaTV mới (ví dụ: TV09)
2. Frontend: Gọi API thiết lập quan hệ con cái với MaTV = TV09
3. Backend: Trigger tự động gán gia phả và đời cho TV09
4. Hoàn thành!
```

---

## 📊 SƠ ĐỒ QUAN HỆ

```
THANHVIEN (cha)
    |
    | MaTVCha (FK)
    |
    v
QUANHECON ---- MaTVMe (FK) ----> THANHVIEN (mẹ)
    |
    | MaTV (PK, FK)
    |
    v
THANHVIEN (con)
```

---

## 🎯 CHECKLIST TRIỂN KHAI

- [ ] Tạo file `src/models/schemas/QuanHeCon.schema.ts`
- [ ] Tạo file `src/services/quanhecon.services.ts`
- [ ] Tạo file `src/controllers/quanhecon.controllers.ts`
- [ ] Tạo file `src/routes/quanhecon.routes.ts`
- [ ] Cập nhật file `src/index.ts` (import và sử dụng route mới)
- [ ] Test endpoint `POST /quanhecon/thietlap`
- [ ] Test endpoint `GET /quanhecon`
- [ ] Test endpoint `GET /quanhecon/con/:MaTV`
- [ ] Test endpoint `GET /quanhecon/chame/:MaTV`
- [ ] Test endpoint `GET /quanhecon/detail/:MaTV`
- [ ] Test endpoint `PUT /quanhecon/:MaTV`
- [ ] Test endpoint `DELETE /quanhecon/:MaTV`
- [ ] Kiểm tra trigger tự động gán gia phả
- [ ] Kiểm tra trigger tự động set đời
- [ ] Kiểm tra trigger validation giới tính
- [ ] Kiểm tra trigger validation ngày sinh

---

## 📚 TÀI LIỆU THAM KHẢO

- File database: `backend/init.sql` (dòng 110-127)
- File tương tự: `backend/doc/QUAN-HE-HON-NHAN-GUIDE.md`
- Các trigger liên quan đến bảng QUANHECON (dòng 265-450 trong init.sql)

---

**Ngày tạo**: 23/12/2025  
**Phiên bản**: 1.0  
**Người tạo**: GitHub Copilot
