import { Router } from 'express'
import {
  ghiNhanKetThucController,
  traCuuKetThucController,
  getChiTietKetThucController,
  capNhatKetThucController,
  xoaKetThucController
} from '~/controllers/ketthuc.controllers'
import { wrapAsync } from '~/utils/handlers';


const ketthucRouter = Router()

/**
 * Route 1: Ghi nhận kết thúc
 * POST /api/ketthuc/ghinhan
 * Body: { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem }
 */
ketthucRouter.post('/ghinhan', wrapAsync(ghiNhanKetThucController))

/**
 * Route 2: Tra cứu kết thúc
 * GET /api/ketthuc/tracuu?HoTen=...&MaNguyenNhanMat=...&MaDiaDiem=...&TuNgay=...&DenNgay=...
 */
ketthucRouter.get('/tracuu', wrapAsync(traCuuKetThucController))

/**
 * Route 3: Xem chi tiết kết thúc
 * GET /api/ketthuc/:MaTV
 */
ketthucRouter.get('/:MaTV', wrapAsync(getChiTietKetThucController))

/**
 * Route 4: Cập nhật thông tin kết thúc
 * PUT /api/ketthuc/:MaTV
 * Body: { NgayGioMat?, MaNguyenNhanMat?, MaDiaDiem? }
 */
ketthucRouter.put('/:MaTV', wrapAsync(capNhatKetThucController))

/**
 * Route 5: Xóa thông tin kết thúc (đưa về trạng thái Còn Sống)
 * DELETE /api/ketthuc/:MaTV
 */
ketthucRouter.delete('/:MaTV', wrapAsync(xoaKetThucController))

export default ketthucRouter