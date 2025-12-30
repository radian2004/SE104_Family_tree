// src/routes/phieuthu.routes.ts
import { Router } from 'express';
import { wrapAsync } from '~/utils/handlers';
import {
  createPhieuThuController,
  getPhieuThuListController,
  getPhieuThuDetailController,
  xacNhanChiTietController,
  huyXacNhanChiTietController,
  getPendingConfirmationsController,
  getDanhMucListController,
  createDanhMucController,
  updateDanhMucController,
  deleteDanhMucController,
  traCuuDanhMucController,
  deletePhieuThuController
} from '~/controllers/phieuthu.controllers';
import {
  requireAdminOrOwner,
  attachUserInfo,
  attachUserInfoMiddleware
} from '~/middlewares/authorization.middlewares';

const phieuThuRouter = Router();

// ==================== DANH MỤC (PHẢI ĐẶT TRƯỚC CÁC ROUTE CÓ :MaPhieuThu) ====================

/**
 * Lấy danh sách danh mục
 * GET /users/phieuthu/danhmuc/list
 * Quyền: Tất cả
 */
phieuThuRouter.get('/danhmuc/list', wrapAsync(getDanhMucListController));

/**
 * Tra cứu danh mục thu chi theo năm
 * GET /users/phieuthu/danhmuc/tra-cuu?nam=2025
 * Quyền: Tất cả người dùng đã đăng nhập
 */
phieuThuRouter.get('/danhmuc/tra-cuu', attachUserInfoMiddleware, wrapAsync(traCuuDanhMucController));

/**
 * Tạo danh mục mới
 * POST /users/phieuthu/danhmuc/create
 * Quyền: Admin, Owner
 */
phieuThuRouter.post('/danhmuc/create', requireAdminOrOwner, wrapAsync(createDanhMucController));

/**
 * Cập nhật danh mục
 * PUT /users/phieuthu/danhmuc/:MaDM
 * Quyền: Admin, Owner
 */
phieuThuRouter.put('/danhmuc/:MaDM', requireAdminOrOwner, wrapAsync(updateDanhMucController));

/**
 * Xóa danh mục
 * DELETE /users/phieuthu/danhmuc/:MaDM
 * Quyền: Admin, Owner
 */
phieuThuRouter.delete('/danhmuc/:MaDM', requireAdminOrOwner, wrapAsync(deleteDanhMucController));

// ==================== PHIẾU THU ====================

/**
 * Tạo phiếu thu mới
 * POST /users/phieuthu/create
 * Quyền: Admin, Owner, User (tất cả)
 */
phieuThuRouter.post('/create', wrapAsync(createPhieuThuController));

/**
 * Lấy danh sách phiếu thu chờ xác nhận (dành cho người đảm nhận danh mục)
 * GET /users/phieuthu/pending
 * Quyền: Tất cả (chỉ hiển thị các phiếu cần xác nhận của mình)
 */
phieuThuRouter.get('/pending', attachUserInfo, wrapAsync(getPendingConfirmationsController));

/**
 * Xác nhận chi tiết phiếu thu
 * PUT /users/phieuthu/xacnhan/:MaPhieuThu/:MaDMT
 * Quyền: Chỉ người đảm nhận danh mục
 */
phieuThuRouter.put('/xacnhan/:MaPhieuThu/:MaDMT', attachUserInfo, wrapAsync(xacNhanChiTietController));

/**
 * Hủy xác nhận chi tiết phiếu thu
 * PUT /users/phieuthu/huyxacnhan/:MaPhieuThu/:MaDMT
 * Quyền: Chỉ người đảm nhận danh mục
 */
phieuThuRouter.put('/huyxacnhan/:MaPhieuThu/:MaDMT', attachUserInfo, wrapAsync(huyXacNhanChiTietController));

/**
 * Lấy danh sách phiếu thu
 * GET /users/phieuthu
 * Quyền: Admin (tất cả), Owner (gia phả mình), User (của mình)
 */
phieuThuRouter.get('/', attachUserInfo, wrapAsync(getPhieuThuListController));

/**
 * Xóa phiếu thu
 * DELETE /users/phieuthu/:MaPhieuThu
 * Quyền: Owner và người đảm nhận danh mục
 */
phieuThuRouter.delete('/:MaPhieuThu', attachUserInfo, wrapAsync(deletePhieuThuController));

/**
 * Lấy chi tiết phiếu thu
 * GET /users/phieuthu/:MaPhieuThu
 * Quyền: Tất cả (kiểm tra quyền trong service)
 * ⚠️ PHẢI ĐẶT SAU CÙNG vì :MaPhieuThu sẽ match với mọi path
 */
phieuThuRouter.get('/:MaPhieuThu', wrapAsync(getPhieuThuDetailController));

export default phieuThuRouter;