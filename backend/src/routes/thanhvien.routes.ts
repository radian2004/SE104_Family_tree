import { Router } from 'express';
import {
  registerController,
  getAllThanhVienController,
  getThanhVienByMaTVController,
  updateThanhVienController,
  deleteThanhVienController,
  getBaoCaoTangGiamController,
  ghiNhanThanhVienController,
  getAvailableRelationsController,       
  traCuuThanhVienController,
  xoaMaGiaPhaController,
  capNhatTruongTocController,
  getGiaPhaThanhVienController,
  getAllGiaPhaController
} from '~/controllers/thanhvien.controllers';
import { wrapAsync } from '~/utils/handlers';
import { 
  requireAdminOrOwner, 
  checkUpdateMemberPermission, 
  checkDeleteMemberPermission,
  attachUserInfoMiddleware,
  requireAdmin
} from '~/middlewares/authorization.middlewares';

const thanhvienRouter = Router();

// ========================================
// ROUTES CÔNG KHAI / ĐĂNG KÝ
// ========================================

// POST /thanhvien/register - Đăng ký thành viên mới (cần quyền Admin hoặc Owner)
thanhvienRouter.post('/register', requireAdminOrOwner, wrapAsync(registerController));

// ========================================
// ROUTES CẦN PHÂN QUYỀN
// ========================================

// POST /thanhvien/ghi-nhan - Ghi nhận thành viên (Admin/Owner trong gia phả)
thanhvienRouter.post('/ghi-nhan', requireAdminOrOwner, wrapAsync(ghiNhanThanhVienController));

// GET /thanhvien/available-relations - Lấy danh sách quan hệ khả dụng
thanhvienRouter.get('/available-relations', attachUserInfoMiddleware, wrapAsync(getAvailableRelationsController));

// GET /thanhvien/tra-cuu - Tra cứu thành viên (Admin: all, Owner/User: trong gia phả)
thanhvienRouter.get('/tra-cuu', attachUserInfoMiddleware, wrapAsync(traCuuThanhVienController));

// GET /thanhvien/baocao - Báo cáo tăng giảm (Admin: all, Owner/User: trong gia phả)
thanhvienRouter.get('/baocao', attachUserInfoMiddleware, wrapAsync(getBaoCaoTangGiamController));

// GET /thanhvien/gia-pha/danh-sach - Lấy danh sách gia phả (Admin: all, Owner/User: của mình)
thanhvienRouter.get('/gia-pha/danh-sach', attachUserInfoMiddleware, wrapAsync(getAllGiaPhaController));

// GET /thanhvien - Lấy tất cả thành viên (Admin: all, Owner/User: trong gia phả)
thanhvienRouter.get('/', attachUserInfoMiddleware, wrapAsync(getAllThanhVienController));

// GET /thanhvien/:MaTV - Lấy thông tin 1 thành viên (Admin: all, Owner/User: trong gia phả)
thanhvienRouter.get('/:MaTV', attachUserInfoMiddleware, wrapAsync(getThanhVienByMaTVController));

// PUT /thanhvien/:MaTV - Cập nhật thành viên (kiểm tra quyền chi tiết)
thanhvienRouter.put('/:MaTV', checkUpdateMemberPermission, wrapAsync(updateThanhVienController));

// DELETE /thanhvien/:MaTV - Xóa thành viên (Admin/Owner trong gia phả, User không được)
thanhvienRouter.delete('/:MaTV', checkDeleteMemberPermission, wrapAsync(deleteThanhVienController));

// GET /thanhvien/:MaTV/gia-pha - Lấy gia phả của thành viên
thanhvienRouter.get('/:MaTV/gia-pha', attachUserInfoMiddleware, wrapAsync(getGiaPhaThanhVienController));

// PATCH /thanhvien/truong-toc - Cập nhật trưởng tộc (ADMIN ONLY)
thanhvienRouter.patch('/truong-toc', requireAdmin, wrapAsync(capNhatTruongTocController));

// DELETE /thanhvien/:MaTV/gia-pha - Xóa khỏi gia phả (Admin/Owner)
thanhvienRouter.delete('/:MaTV/gia-pha', requireAdminOrOwner, wrapAsync(xoaMaGiaPhaController));

export default thanhvienRouter;