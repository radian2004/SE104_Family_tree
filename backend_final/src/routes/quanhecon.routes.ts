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