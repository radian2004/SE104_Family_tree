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
