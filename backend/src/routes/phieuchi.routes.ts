// src/routes/phieuchi.routes.ts
import { Router } from 'express';
import { wrapAsync } from '~/utils/handlers';
import {
  createPhieuChiController,
  getPhieuChiListController,
  getPhieuChiDetailController,
  deletePhieuChiController,
  updatePhieuChiController,
  getPhieuChiByDanhMucController
} from '~/controllers/phieuchi.controllers';
import { attachUserInfo } from '~/middlewares/authorization.middlewares';

const phieuChiRouter = Router();

// ==================== ROUTES CỤ THỂ PHẢI ĐẶT TRƯỚC /:MaPhieuChi ====================

/**
 * Lấy danh sách phiếu chi theo danh mục
 * GET /users/phieuchi/danhmuc/:MaDM
 * Quyền: Admin (tất cả), Owner (gia phả), User (chỉ NguoiDamNhan)
 */
phieuChiRouter.get('/danhmuc/:MaDM', attachUserInfo, wrapAsync(getPhieuChiByDanhMucController));

/**
 * Tạo phiếu chi mới
 * POST /users/phieuchi/create
 * Quyền: Admin, Owner (tất cả), User (chỉ NguoiDamNhan)
 */
phieuChiRouter.post('/create', attachUserInfo, wrapAsync(createPhieuChiController));

/**
 * Lấy danh sách phiếu chi
 * GET /users/phieuchi
 * Quyền: Admin (tất cả), Owner (gia phả), User (của mình)
 */
phieuChiRouter.get('/', attachUserInfo, wrapAsync(getPhieuChiListController));

/**
 * Lấy chi tiết phiếu chi
 * GET /users/phieuchi/:MaPhieuChi
 * Quyền: Theo phân quyền
 * ⚠️ ROUTE NÀY PHẢI ĐẶT SAU CÁC ROUTE CỤ THỂ
 */
phieuChiRouter.get('/:MaPhieuChi', attachUserInfo, wrapAsync(getPhieuChiDetailController));

/**
 * Cập nhật phiếu chi
 * PUT /users/phieuchi/:MaPhieuChi
 * Quyền: Theo phân quyền
 */
phieuChiRouter.put('/:MaPhieuChi', attachUserInfo, wrapAsync(updatePhieuChiController));

/**
 * Xóa phiếu chi
 * DELETE /users/phieuchi/:MaPhieuChi
 * Quyền: Theo phân quyền
 */
phieuChiRouter.delete('/:MaPhieuChi', attachUserInfo, wrapAsync(deletePhieuChiController));

export default phieuChiRouter;