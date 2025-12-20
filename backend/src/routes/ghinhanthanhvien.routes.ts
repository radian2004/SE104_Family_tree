import { Router } from 'express';
import {
  ghiNhanThanhVienController,
  traCuuGhiNhanController,
  getThanhVienCuController
} from '~/controllers/ghinhanthanhvien.controllers';

const ghiNhanThanhVienRouter = Router();

// POST /ghinhanthanhvien - Ghi nhận thành viên mới với quan hệ
ghiNhanThanhVienRouter.post('/', ghiNhanThanhVienController);

// GET /ghinhanthanhvien/tracuu - Tra cứu lịch sử ghi nhận
ghiNhanThanhVienRouter.get('/tracuu', traCuuGhiNhanController);

// GET /ghinhanthanhvien/thanhviencu/:MaTV - Lấy thông tin thành viên cũ
ghiNhanThanhVienRouter.get('/thanhviencu/:MaTV', getThanhVienCuController);

export default ghiNhanThanhVienRouter;