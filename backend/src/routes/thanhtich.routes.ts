import { Router } from 'express';
import {
  getLoaiThanhTichController,
  ghiNhanThanhTichController,
  traCuuThanhTichController,
  getThanhTichByHoTenController,
  xoaThanhTichController,
  capNhatThanhTichController,
  getBaoCaoThanhTichController
} from '~/controllers/thanhtich.controllers';
import { wrapAsync } from '~/utils/handlers';
import { 
  checkGhiNhanThanhTichPermission,
  checkDeleteThanhTichPermission,
  checkUpdateThanhTichPermission,
  attachUserInfoMiddleware
} from '~/middlewares/authorization.middlewares';

const thanhTichRouter = Router();

// ========================================
// ROUTES CÔNG KHAI (không cần phân quyền đặc biệt)
// ========================================

/**
 * GET /thanhtich/loai - Lấy danh sách loại thành tích
 * Ai cũng có thể xem
 */
thanhTichRouter.get('/loai', wrapAsync(getLoaiThanhTichController));

// ========================================
// ROUTES CẦN PHÂN QUYỀN
// ========================================

/**
 * POST /thanhtich/ghinhan - Ghi nhận thành tích mới
 * - Admin: ghi nhận cho mọi thành viên
 * - Owner: ghi nhận cho thành viên trong gia phả
 * - User: chỉ ghi nhận cho chính mình
 */
thanhTichRouter.post('/ghinhan', checkGhiNhanThanhTichPermission, wrapAsync(ghiNhanThanhTichController));

/**
 * GET /thanhtich/tracuu - Tra cứu thành tích
 * - Admin: tra cứu tất cả
 * - Owner/User: chỉ tra cứu trong gia phả
 */
thanhTichRouter.get('/tracuu', attachUserInfoMiddleware, wrapAsync(traCuuThanhTichController));

/**
 * GET /thanhtich/thanhvien - Lấy thành tích theo tên thành viên
 * - Admin: xem tất cả
 * - Owner/User: chỉ xem trong gia phả
 */
thanhTichRouter.get('/thanhvien', attachUserInfoMiddleware, wrapAsync(getThanhTichByHoTenController));

/**
 * DELETE /thanhtich/xoa - Xóa thành tích
 * - Admin: xóa được tất cả
 * - Owner: xóa được trong gia phả
 * - User: xóa được trong gia phả
 */
thanhTichRouter.delete('/xoa', checkDeleteThanhTichPermission, wrapAsync(xoaThanhTichController));

/**
 * PUT /thanhtich/capnhat - Cập nhật thành tích
 * - Admin: sửa được tất cả
 * - Owner: sửa được trong gia phả
 * - User: sửa được thành tích của chính mình
 */
thanhTichRouter.put('/capnhat', checkUpdateThanhTichPermission, wrapAsync(capNhatThanhTichController));

/**
 * GET /thanhtich/baocao - Báo cáo thành tích theo năm
 * - Admin: báo cáo tất cả gia phả
 * - Owner/User: chỉ báo cáo trong gia phả
 */
thanhTichRouter.get('/baocao', attachUserInfoMiddleware, wrapAsync(getBaoCaoThanhTichController));

export default thanhTichRouter;