// src/controllers/thanhtich.controllers.ts
import { Request, Response } from 'express';
import thanhTichService from '~/services/thanhtich.services';
import HTTP_STATUS from '~/constants/httpStatus';

/**
 * Controller lấy danh sách loại thành tích
 * GET /thanhtich/loai
 */
export const getLoaiThanhTichController = async (req: Request, res: Response) => {
  try {
    const result = await thanhTichService.getAllLoaiThanhTich();
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách loại thành tích thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi getLoaiThanhTich:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi lấy danh sách loại thành tích',
      error: error.message
    });
  }
};

/**
 * Controller ghi nhận thành tích mới
 * POST /thanhtich/ghinhan
 * Body: { MaTV, MaLTT, NgayPhatSinh? }
 */
export const ghiNhanThanhTichController = async (req: Request, res: Response) => {
  const { MaTV, MaLTT, NgayPhatSinh } = req.body;

  try {
    // Validate dữ liệu đầu vào
    if (!MaTV || !MaLTT) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV và MaLTT'
      });
    }

    const result = await thanhTichService.ghiNhanThanhTich({
      MaTV,
      MaLTT,
      NgayPhatSinh: NgayPhatSinh ? new Date(NgayPhatSinh) : undefined
    });

    return res.status(HTTP_STATUS.CREATED).json(result);
  } catch (error: any) {
    console.error('Lỗi ghiNhanThanhTich:', error);
    
    // Xử lý lỗi từ trigger
    if (error.message.includes('ngày sinh')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: error.message
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Ghi nhận thành tích thất bại',
      error: error.message
    });
  }
};

/**
 * ✅ MỚI: Controller tra cứu thành tích với tìm kiếm linh hoạt
 * GET /thanhtich/tracuu
 * Query params: 
 * - HoTen?: Tên thành viên (LIKE search)
 * - TenLoaiThanhTich?: Tên loại thành tích (LIKE search) - VD: "huân" → tìm tất cả loại có "huân"
 * - TuNgay?: Từ ngày (YYYY-MM-DD)
 * - DenNgay?: Đến ngày (YYYY-MM-DD)
 */
export const traCuuThanhTichController = async (req: Request, res: Response) => {
  try {
    const { HoTen, TenLoaiThanhTich, TuNgay, DenNgay } = req.query;

    const filters: any = {};
    if (HoTen) filters.HoTen = HoTen as string;
    if (TenLoaiThanhTich) filters.TenLoaiThanhTich = TenLoaiThanhTich as string;
    if (TuNgay) filters.TuNgay = new Date(TuNgay as string);
    if (DenNgay) filters.DenNgay = new Date(DenNgay as string);

    const result = await thanhTichService.traCuuThanhTich(filters);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Tra cứu thành tích thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi traCuuThanhTich:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Tra cứu thành tích thất bại',
      error: error.message
    });
  }
};

/**
 * ✅ MỚI: Controller lấy thành tích theo HỌ TÊN
 * GET /thanhtich/thanhvien?HoTen=Nguyễn Văn
 * Query param: HoTen (LIKE search)
 */
export const getThanhTichByHoTenController = async (req: Request, res: Response) => {
  const { HoTen } = req.query;

  try {
    if (!HoTen) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: HoTen'
      });
    }

    const result = await thanhTichService.getThanhTichByHoTen(HoTen as string);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy thành tích thành công',
      HoTen,
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getThanhTichByHoTen:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy thành tích thất bại',
      error: error.message
    });
  }
};

/**
 * ✅ MỚI: Controller xóa thành tích - Đơn giản hóa với DELETE + body
 * DELETE /thanhtich/xoa
 * Body: { MaTV, MaLTT, NgayPhatSinh }
 */
export const xoaThanhTichController = async (req: Request, res: Response) => {
  const { MaTV, MaLTT, NgayPhatSinh } = req.body;

  try {
    if (!MaTV || !MaLTT || !NgayPhatSinh) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV, MaLTT, NgayPhatSinh'
      });
    }

    const result = await thanhTichService.xoaThanhTich({
      MaTV, 
      MaLTT, 
      NgayPhatSinh: new Date(NgayPhatSinh)
    });

    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    console.error('Lỗi xoaThanhTich:', error);
    
    if (error.message.includes('Không tìm thấy')) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: error.message
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Xóa thành tích thất bại',
      error: error.message
    });
  }
};