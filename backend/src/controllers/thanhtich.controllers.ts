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

/**
 * ✅ MỚI: Controller cập nhật thành tích
 * PUT /thanhtich/capnhat
 * Body: { 
 *   MaTV: string, 
 *   MaLTT_Cu: string, 
 *   MaLTT_Moi: string, 
 *   NgayPhatSinh: string (YYYY-MM-DD) 
 * }
 * 
 * Response: { message, data }
 */
export const capNhatThanhTichController = async (req: Request, res: Response) => {
  const { MaTV, MaLTT_Cu, MaLTT_Moi, NgayPhatSinh } = req.body;

  try {
    // Validate input
    if (!MaTV || !MaLTT_Cu || !MaLTT_Moi || !NgayPhatSinh) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV, MaLTT_Cu, MaLTT_Moi, NgayPhatSinh'
      });
    }

    // Validate không được trùng loại
    if (MaLTT_Cu === MaLTT_Moi) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Loại thành tích mới phải khác loại thành tích cũ'
      });
    }

    const result = await thanhTichService.capNhatThanhTich({
      MaTV,
      MaLTT_Cu,
      MaLTT_Moi,
      NgayPhatSinh: new Date(NgayPhatSinh)
    });

    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    console.error('Lỗi capNhatThanhTich:', error);
    
    // Xử lý lỗi cụ thể
    if (error.message.includes('Không tìm thấy')) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: error.message
      });
    }
    
    if (error.message.includes('không tồn tại') || error.message.includes('đã có')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: error.message
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Cập nhật thành tích thất bại',
      error: error.message
    });
  }
};

/**
 * ✅ MỚI: Controller lấy báo cáo thành tích theo khoảng năm
 * GET /thanhtich/baocao
 * Query params: 
 * - NamBatDau: Năm bắt đầu (required)
 * - NamKetThuc: Năm kết thúc (required)
 * 
 * Response: {
 *   message: string,
 *   result: {
 *     NamBatDau: number,
 *     NamKetThuc: number,
 *     TongLoaiThanhTich: number,
 *     TongSoLuong: number,
 *     DanhSach: [{ STT, LoaiThanhTich, SoLuong }]
 *   }
 * }
 */
export const getBaoCaoThanhTichController = async (req: Request, res: Response) => {
  try {
    const { NamBatDau, NamKetThuc } = req.query;

    // Validate input
    if (!NamBatDau || !NamKetThuc) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin: NamBatDau và NamKetThuc là bắt buộc'
      });
    }

    const namBatDau = parseInt(NamBatDau as string);
    const namKetThuc = parseInt(NamKetThuc as string);

    // Validate số hợp lệ
    if (isNaN(namBatDau) || isNaN(namKetThuc)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'NamBatDau và NamKetThuc phải là số nguyên hợp lệ'
      });
    }

    const result = await thanhTichService.getBaoCaoThanhTich(namBatDau, namKetThuc);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy báo cáo thành tích thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi getBaoCaoThanhTich:', error);
    
    // Xử lý lỗi validation từ service
    if (error.message.includes('Năm') || error.message.includes('năm')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: error.message
      });
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi lấy báo cáo thành tích',
      error: error.message
    });
  }
};