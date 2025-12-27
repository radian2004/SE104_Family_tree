// src/controllers/honnhan.controllers.ts
import { Request, Response } from 'express';
import honNhanService from '~/services/honnhan.services';
import HTTP_STATUS from '~/constants/httpStatus';

/**
 * POST /honnhan/thietlap
 * Thiết lập quan hệ hôn nhân giữa hai thành viên
 * Body: { MaTV, MaTVVC, NgayBatDau, NgayKetThuc? }
 */
export const thietLapHonNhanController = async (req: Request, res: Response) => {
  const { MaTV, MaTVVC, NgayBatDau, NgayKetThuc } = req.body;

  try {
    // Validate dữ liệu đầu vào
    if (!MaTV || !MaTVVC || !NgayBatDau) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV, MaTVVC, NgayBatDau'
      });
    }

    const result = await honNhanService.thietLapHonNhan({
      MaTV,
      MaTVVC,
      NgayBatDau: new Date(NgayBatDau),
      NgayKetThuc: NgayKetThuc ? new Date(NgayKetThuc) : undefined
    });

    return res.status(HTTP_STATUS.CREATED).json(result);
  } catch (error: any) {
    console.error('Lỗi thietLapHonNhan:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Thiết lập quan hệ hôn nhân thất bại',
      error: error.message
    });
  }
};

/**
 * GET /honnhan
 * Lấy tất cả quan hệ hôn nhân
 */
export const getAllHonNhanController = async (req: Request, res: Response) => {
  try {
    const result = await honNhanService.getAllHonNhan();
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách quan hệ hôn nhân thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getAllHonNhan:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy danh sách quan hệ hôn nhân thất bại',
      error: error.message
    });
  }
};

/**
 * GET /honnhan/:MaTV
 * Lấy quan hệ hôn nhân của một thành viên cụ thể
 */
export const getHonNhanByMaTVController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await honNhanService.getHonNhanByMaTV(MaTV);
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy quan hệ hôn nhân thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getHonNhanByMaTV:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy quan hệ hôn nhân thất bại',
      error: error.message
    });
  }
};

/**
 * PUT /honnhan/ketthuc
 * Cập nhật ngày kết thúc hôn nhân (ly hôn)
 * Body: { MaTV, MaTVVC, NgayKetThuc }
 */
export const ketThucHonNhanController = async (req: Request, res: Response) => {
  const { MaTV, MaTVVC, NgayKetThuc } = req.body;

  try {
    if (!MaTV || !MaTVVC || !NgayKetThuc) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV, MaTVVC, NgayKetThuc'
      });
    }

    const result = await honNhanService.ketThucHonNhan(
      MaTV,
      MaTVVC,
      new Date(NgayKetThuc)
    );

    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    console.error('Lỗi ketThucHonNhan:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Cập nhật kết thúc hôn nhân thất bại',
      error: error.message
    });
  }
};

/**
 * DELETE /honnhan
 * Xóa quan hệ hôn nhân
 * Body: { MaTV, MaTVVC }
 */
export const xoaHonNhanController = async (req: Request, res: Response) => {
  const { MaTV, MaTVVC } = req.body;

  try {
    if (!MaTV || !MaTVVC) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Thiếu thông tin bắt buộc: MaTV, MaTVVC'
      });
    }

    const result = await honNhanService.xoaHonNhan(MaTV, MaTVVC);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    console.error('Lỗi xoaHonNhan:', error);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Xóa quan hệ hôn nhân thất bại',
      error: error.message
    });
  }
};

/**
 * GET /honnhan/available/khong-co-gia-pha
 * Lấy danh sách thành viên chưa có trong gia phả (để chọn làm vợ/chồng)
 */
export const getThanhVienKhongCoGiaPhaController = async (req: Request, res: Response) => {
  try {
    const result = await honNhanService.getThanhVienKhongCoGiaPha();
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách thành viên chưa có gia phả thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getThanhVienKhongCoGiaPha:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy danh sách thành viên thất bại',
      error: error.message
    });
  }
};

/**
 * GET /honnhan/available/trong-gia-pha/:MaGiaPha
 * Lấy danh sách thành viên trong gia phả cụ thể
 */
export const getThanhVienTrongGiaPhaController = async (req: Request, res: Response) => {
  const { MaGiaPha } = req.params;

  try {
    const result = await honNhanService.getThanhVienTrongGiaPha(MaGiaPha);
    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy danh sách thành viên trong gia phả thành công',
      total: result.length,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getThanhVienTrongGiaPha:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lấy danh sách thành viên thất bại',
      error: error.message
    });
  }
};