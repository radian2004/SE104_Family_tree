// src/routes/thanhtich.routes.ts
import { Router } from 'express';
import {
  getLoaiThanhTichController,
  ghiNhanThanhTichController,
  traCuuThanhTichController,
  getThanhTichByHoTenController,
  xoaThanhTichController,
  capNhatThanhTichController,
  getBaoCaoThanhTichController // ✅ THÊM DÒNG NÀY
} from '~/controllers/thanhtich.controllers';
import { wrapAsync } from '~/utils/handlers';


const thanhTichRouter = Router();

/**
 * GET /thanhtich/loai - Lấy danh sách loại thành tích
 * Response: [{ MaLTT, TenLTT }]
 */
thanhTichRouter.get('/loai', wrapAsync(getLoaiThanhTichController));

/**
 * POST /thanhtich/ghinhan - Ghi nhận thành tích mới
 * Body: { MaTV, MaLTT, NgayPhatSinh? }
 * Response: { message, data }
 */
thanhTichRouter.post('/ghinhan', wrapAsync(ghiNhanThanhTichController));

/**
 * ✅ MỚI: GET /thanhtich/tracuu - Tra cứu thành tích linh hoạt
 * Query params:
 * - HoTen?: Tên thành viên (LIKE search) - VD: "Nguyễn Văn"
 * - TenLoaiThanhTich?: Tên loại thành tích (LIKE search) - VD: "huân" → tìm tất cả loại có "huân"
 * - TuNgay?: Từ ngày (YYYY-MM-DD)
 * - DenNgay?: Đến ngày (YYYY-MM-DD)
 * 
 * Response: { message, total, result: [{ STT, HoTen, ThanhTich, NgayPhatSinh }] }
 */
thanhTichRouter.get('/tracuu', wrapAsync(traCuuThanhTichController));

/**
 * ✅ MỚI: GET /thanhtich/thanhvien - Lấy thành tích của thành viên theo TÊN
 * Query param: HoTen (LIKE search)
 * VD: /thanhtich/thanhvien?HoTen=Nguyễn Văn
 * 
 * Response: { message, HoTen, total, result: [{ HoTen, ThanhTich, NgayPhatSinh }] }
 */
thanhTichRouter.get('/thanhvien', wrapAsync(getThanhTichByHoTenController));

/**
 * ✅ MỚI: DELETE /thanhtich/xoa - Xóa thành tích (Đơn giản hóa)
 * Body: { MaTV, MaLTT, NgayPhatSinh }
 * Response: { message, affectedRows }
 * 
 * Lưu ý: MaTV và MaLTT là mã nội bộ, frontend cần lưu trữ để gửi khi xóa
 */
thanhTichRouter.delete('/xoa', wrapAsync(xoaThanhTichController));

// ✅ MỚI: PUT /thanhtich/capnhat - Cập nhật loại thành tích
thanhTichRouter.put('/capnhat', wrapAsync(capNhatThanhTichController));

thanhTichRouter.get('/baocao', wrapAsync(getBaoCaoThanhTichController));

export default thanhTichRouter;