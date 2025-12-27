import { Router } from 'express';
import {
  ghiNhanKetThucController,
  traCuuKetThucController,
  getChiTietKetThucController,
  capNhatKetThucController,
  xoaKetThucController
} from '~/controllers/ketthuc.controllers';
import { wrapAsync } from '~/utils/handlers';
import { 
  checkGhiNhanKetThucPermission,
  checkUpdateDeleteKetThucPermission,
  attachUserInfoMiddleware
} from '~/middlewares/authorization.middlewares';

const ketthucRouter = Router();

// ========================================
// ROUTES CẦN PHÂN QUYỀN
// ========================================

/**
 * POST /ketthuc/ghinhan - Ghi nhận kết thúc
 * - Admin: ghi nhận cho mọi thành viên
 * - Owner: ghi nhận cho thành viên trong gia phả
 * - User: KHÔNG có quyền
 */
ketthucRouter.post('/ghinhan', checkGhiNhanKetThucPermission, wrapAsync(ghiNhanKetThucController));

/**
 * GET /ketthuc/tracuu - Tra cứu kết thúc
 * - Admin: tra cứu tất cả
 * - Owner/User: chỉ tra cứu trong gia phả (filter tại service)
 */
ketthucRouter.get('/tracuu', attachUserInfoMiddleware, wrapAsync(traCuuKetThucController));

/**
 * GET /ketthuc/:MaTV - Xem chi tiết kết thúc
 * - Admin: xem tất cả
 * - Owner/User: chỉ xem trong gia phả (check tại service)
 */
ketthucRouter.get('/:MaTV', attachUserInfoMiddleware, wrapAsync(getChiTietKetThucController));

/**
 * PUT /ketthuc/:MaTV - Cập nhật thông tin kết thúc
 * - Admin: sửa được tất cả
 * - Owner: sửa được trong gia phả
 * - User: KHÔNG có quyền
 */
ketthucRouter.put('/:MaTV', checkUpdateDeleteKetThucPermission, wrapAsync(capNhatKetThucController));

/**
 * DELETE /ketthuc/:MaTV - Xóa kết thúc (đưa về trạng thái "Còn Sống")
 * - Admin: xóa được tất cả
 * - Owner: xóa được trong gia phả
 * - User: KHÔNG có quyền
 */
ketthucRouter.delete('/:MaTV', checkUpdateDeleteKetThucPermission, wrapAsync(xoaKetThucController));

export default ketthucRouter;