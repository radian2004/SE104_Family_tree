// ========================================
// THAY THẾ TOÀN BỘ NỘI DUNG FILE: src/routes/thanhvien.routes.ts
// ========================================

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
  capNhatMaGiaPhaController,
  getGiaPhaThanhVienController,
  getAllGiaPhaController
} from '~/controllers/thanhvien.controllers';
import { wrapAsync } from '~/utils/handlers';

const thanhvienRouter = Router();

// ========================================
// ROUTES CỤ THỂ (đặt trước routes có param)
// ========================================

// POST /thanhvien/register
thanhvienRouter.post('/register', wrapAsync(registerController));

// POST /thanhvien/ghi-nhan
thanhvienRouter.post('/ghi-nhan', wrapAsync(ghiNhanThanhVienController));

// GET /thanhvien/available-relations
thanhvienRouter.get('/available-relations', wrapAsync(getAvailableRelationsController));

// ✅ THÊM MỚI: GET /thanhvien/tra-cuu
thanhvienRouter.get('/tra-cuu', wrapAsync(traCuuThanhVienController));

// ========================================
// ROUTES CHUNG (đặt sau)
// ========================================

// GET /thanhvien
thanhvienRouter.get('/', wrapAsync(getAllThanhVienController));

// ✅ MỚI: GET /thanhvien/baocao/tanggiam - Báo cáo tăng giảm thành viên theo năm
thanhvienRouter.get('/baocao', wrapAsync(getBaoCaoTangGiamController));

// GET /thanhvien/:MaTV
thanhvienRouter.get('/:MaTV', wrapAsync(getThanhVienByMaTVController));

// PUT /thanhvien/:MaTV
thanhvienRouter.put('/:MaTV', wrapAsync(updateThanhVienController));

// DELETE /thanhvien/:MaTV
thanhvienRouter.delete('/:MaTV', wrapAsync(deleteThanhVienController));

// GET /thanhvien/gia-pha/danh-sach - Lấy danh sách tất cả gia phả
thanhvienRouter.get('/gia-pha/danh-sach', wrapAsync(getAllGiaPhaController));

// ========================================
// THÊM SAU ROUTES HIỆN TẠI CỦA /:MaTV
// ========================================

// GET /thanhvien/:MaTV/gia-pha - Lấy thông tin gia phả của thành viên
thanhvienRouter.get('/:MaTV/gia-pha', wrapAsync(getGiaPhaThanhVienController));

// PATCH /thanhvien/:MaTV/gia-pha - Cập nhật mã gia phả của thành viên
thanhvienRouter.patch('/:MaTV/gia-pha', wrapAsync(capNhatMaGiaPhaController));

// DELETE /thanhvien/:MaTV/gia-pha - Xóa mã gia phả của thành viên
thanhvienRouter.delete('/:MaTV/gia-pha', wrapAsync(xoaMaGiaPhaController));

export default thanhvienRouter;