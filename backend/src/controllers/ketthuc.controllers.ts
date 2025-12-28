import { Request, Response, NextFunction } from 'express'
import ketthucService from '~/services/ketthuc.services'
import HTTP_STATUS from '~/constants/httpStatus' // ✅ SỬA DÒNG NÀY

/**
 * Controller 1: Ghi nhận kết thúc
 */
export const ghiNhanKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem } = req.body;
    const userInfo = req.userInfo;  // ⭐ LẤY TỪ MIDDLEWARE

    const result = await ketthucService.ghiNhanKetThuc({
      MaTV,
      NgayGioMat,
      MaNguyenNhanMat,
      MaDiaDiem
    }, userInfo);  // ⭐ TRUYỀN THÊM userInfo

    res.status(HTTP_STATUS.OK).json({
      message: result.message,
      data: {
        MaTV: result.MaTV
      }
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Controller 2: Tra cứu kết thúc (với bộ lọc)
 * ⭐ V2: Thêm TenNguyenNhanMat và TenDiaDiem
 */
export const traCuuKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      HoTen, 
      MaNguyenNhanMat,
      TenNguyenNhanMat,
      MaDiaDiem,
      TenDiaDiem,
      TuNgay, 
      DenNgay 
    } = req.query;
    const userInfo = req.userInfo;  // ⭐ LẤY TỪ MIDDLEWARE

    const results = await ketthucService.traCuuKetThuc({
      HoTen: HoTen as string | undefined,
      MaNguyenNhanMat: MaNguyenNhanMat as string | undefined,
      TenNguyenNhanMat: TenNguyenNhanMat as string | undefined,
      MaDiaDiem: MaDiaDiem as string | undefined,
      TenDiaDiem: TenDiaDiem as string | undefined,
      TuNgay: TuNgay as string | undefined,
      DenNgay: DenNgay as string | undefined
    }, userInfo);  // ⭐ TRUYỀN THÊM userInfo

    res.status(HTTP_STATUS.OK).json({
      message: 'Tra cứu kết thúc thành công',
      total: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller 3: Xem chi tiết kết thúc
 */
export const getChiTietKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { MaTV } = req.params;
    const userInfo = req.userInfo;  // ⭐ LẤY TỪ MIDDLEWARE

    const result = await ketthucService.getChiTietKetThuc(MaTV, userInfo);  // ⭐ TRUYỀN THÊM userInfo

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Không tìm thấy thông tin kết thúc của thành viên này'
      });
    }

    res.status(HTTP_STATUS.OK).json({
      message: 'Lấy chi tiết kết thúc thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller 4: Cập nhật thông tin kết thúc
 */
export const capNhatKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { MaTV } = req.params;
    const { NgayGioMat, MaNguyenNhanMat, MaDiaDiem } = req.body;
    const userInfo = req.userInfo;  // ⭐ LẤY TỪ MIDDLEWARE (không bắt buộc)

    const result = await ketthucService.capNhatKetThuc(MaTV, {
      NgayGioMat,
      MaNguyenNhanMat,
      MaDiaDiem
    });

    res.status(HTTP_STATUS.OK).json({
      message: result.message,
      data: {
        MaTV: result.MaTV
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller 5: Xóa thông tin kết thúc
 */
export const xoaKetThucController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { MaTV } = req.params;
    const userInfo = req.userInfo;  // ⭐ LẤY TỪ MIDDLEWARE (không bắt buộc)

    const result = await ketthucService.xoaKetThuc(MaTV);

    res.status(HTTP_STATUS.OK).json({
      message: result.message,
      data: {
        MaTV: result.MaTV
      }
    });
  } catch (error) {
    next(error);
  }
};