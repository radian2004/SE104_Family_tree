// src/controllers/quanhecon.controllers.ts
import { Request, Response } from 'express';
import quanHeConService from '~/services/quanhecon.services';
import HTTP_STATUS from '~/constants/httpStatus';

/**
 * POST /quanhecon/thietlap
 * Thiết lập quan hệ con cái giữa thành viên con với cha và mẹ
 * Body: { MaTV, MaTVCha, MaTVMe, NgayPhatSinh? }
 */
export const thietLapQuanHeConController = async (req: Request, res: Response) => {
  const { MaTV, MaTVCha, MaTVMe, NgayPhatSinh } = req.body;

  try {
    // Validate dữ liệu đầu vào
    if (!MaTV || !MaTVCha || !MaTVMe) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV, MaTVCha, MaTVMe'
      });
    }

    const result = await quanHeConService.thietLapQuanHeCon({
      MaTV,
      MaTVCha,
      MaTVMe,
      NgayPhatSinh: NgayPhatSinh ? new Date(NgayPhatSinh) : undefined
    });

    return res.status(HTTP_STATUS.CREATED).json(result);
  } catch (error: any) {
    console.error('Lỗi thietLapQuanHeCon:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Thiết lập quan hệ con cái thất bại',
      error: error.message
    });
  }
};

/**
 * GET /quanhecon
 * Lấy tất cả quan hệ con cái
 */
export const getAllQuanHeConController = async (req: Request, res: Response) => {
  try {
    const result = await quanHeConService.getAllQuanHeCon();
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách quan hệ con cái thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getAllQuanHeCon:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy danh sách quan hệ con cái thất bại',
      error: error.message
    });
  }
};

/**
 * GET /quanhecon/con/:MaTV
 * Lấy danh sách con của một thành viên (cha hoặc mẹ)
 */
export const getConByMaTVController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await quanHeConService.getConByMaTV(MaTV);
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách con thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getConByMaTV:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy danh sách con thất bại',
      error: error.message
    });
  }
};

/**
 * GET /quanhecon/chame/:MaTV
 * Lấy thông tin cha mẹ của một thành viên
 */
export const getChaMeController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await quanHeConService.getChaMe(MaTV);
    
    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Không tìm thấy thông tin cha mẹ'
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy thông tin cha mẹ thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi getChaMe:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy thông tin cha mẹ thất bại',
      error: error.message
    });
  }
};

/**
 * DELETE /quanhecon/:MaTV
 * Xóa quan hệ con cái
 */
export const xoaQuanHeConController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await quanHeConService.xoaQuanHeCon(MaTV);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    console.error('Lỗi xoaQuanHeCon:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Xóa quan hệ con cái thất bại',
      error: error.message
    });
  }
};

/**
 * PUT /quanhecon/:MaTV
 * Cập nhật quan hệ con cái
 * Body: { MaTVCha?, MaTVMe?, NgayPhatSinh? }
 */
export const capNhatQuanHeConController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;
  const { MaTVCha, MaTVMe, NgayPhatSinh } = req.body;

  try {
    const result = await quanHeConService.capNhatQuanHeCon({
      MaTV,
      MaTVCha,
      MaTVMe,
      NgayPhatSinh: NgayPhatSinh ? new Date(NgayPhatSinh) : undefined
    });

    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    console.error('Lỗi capNhatQuanHeCon:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Cập nhật quan hệ con cái thất bại',
      error: error.message
    });
  }
};

/**
 * GET /quanhecon/detail/:MaTV
 * Lấy thông tin chi tiết quan hệ con cái của một thành viên
 */
export const getQuanHeConDetailController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await quanHeConService.getQuanHeConDetail(MaTV);
    
    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Không tìm thấy thông tin quan hệ con cái'
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy thông tin chi tiết thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi getQuanHeConDetail:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy thông tin chi tiết thất bại',
      error: error.message
    });
  }
};