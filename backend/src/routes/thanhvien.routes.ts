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