// src/controllers/phieuthu.controllers.ts
import { Request, Response } from 'express';
import phieuThuService from '~/services/phieuthu.services';
import { CreatePhieuThuReqBody, CreateDanhMucReqBody, UpdateDanhMucReqBody } from '~/models/requests/PhieuThu.requests';
import HTTP_STATUS from '~/constants/httpStatus';
import { PHIEUTHU_MESSAGES } from '~/constants/messages';
import { TokenPayload } from '~/models/requests/User.requests';

// ==================== PHIẾU THU ====================

/**
 * Tạo phiếu thu mới
 * POST /users/phieuthu/create
 */
export const createPhieuThuController = async (req: Request, res: Response) => {
  try {
    const data: CreatePhieuThuReqBody = req.body;
    const result = await phieuThuService.createPhieuThu(data);

    return res.status(HTTP_STATUS.CREATED).json({
      message: PHIEUTHU_MESSAGES.CREATE_SUCCESS,
      result
    });
  } catch (error: any) {
    console.error('Lỗi createPhieuThu:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: PHIEUTHU_MESSAGES.CREATE_FAILED,
      error: error.message
    });
  }
};

/**
 * Lấy danh sách phiếu thu
 * GET /users/phieuthu
 */
export const getPhieuThuListController = async (req: Request, res: Response) => {
  try {
    const userInfo = req.userInfo!;
    const { MaGiaPha } = req.query;
    const result = await phieuThuService.getPhieuThuList(userInfo, { MaGiaPha: MaGiaPha as string });

    return res.status(HTTP_STATUS.OK).json({
      message: PHIEUTHU_MESSAGES.GET_SUCCESS,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getPhieuThuList:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy danh sách thất bại',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết phiếu thu
 * GET /users/phieuthu/:MaPhieuThu
 */
export const getPhieuThuDetailController = async (req: Request, res: Response) => {
  try {
    const { MaPhieuThu } = req.params;
    const result = await phieuThuService.getPhieuThuDetail(MaPhieuThu);

    return res.status(HTTP_STATUS.OK).json({
      message: PHIEUTHU_MESSAGES.GET_SUCCESS,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getPhieuThuDetail:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: PHIEUTHU_MESSAGES.NOT_FOUND,
      error: error.message
    });
  }
};

/**
 * Xác nhận chi tiết phiếu thu
 * PUT /users/phieuthu/xacnhan/:MaPhieuThu/:MaDMT
 */
export const xacNhanChiTietController = async (req: Request, res: Response) => {
  try {
    const { MaPhieuThu, MaDMT } = req.params;
    const userInfo = req.userInfo!;

    // Truyền userInfo để service kiểm tra quyền Admin/Owner
    const result = await phieuThuService.xacNhanChiTiet(MaPhieuThu, MaDMT, {
      MaLoaiTK: userInfo.MaLoaiTK,
      MaTV: userInfo.MaTV
    });

    return res.status(HTTP_STATUS.OK).json({
      message: PHIEUTHU_MESSAGES.XACNHAN_SUCCESS,
      result
    });
  } catch (error: any) {
    console.error('Lỗi xacNhanChiTiet:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: PHIEUTHU_MESSAGES.XACNHAN_FAILED,
      error: error.message
    });
  }
};

/**
 * Hủy xác nhận chi tiết phiếu thu
 * PUT /users/phieuthu/huyxacnhan/:MaPhieuThu/:MaDMT
 */
export const huyXacNhanChiTietController = async (req: Request, res: Response) => {
  try {
    const { MaPhieuThu, MaDMT } = req.params;
    const userInfo = req.userInfo!;

    const result = await phieuThuService.huyXacNhanChiTiet(MaPhieuThu, MaDMT, userInfo.MaTV);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Hủy xác nhận thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi huyXacNhanChiTiet:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: 'Hủy xác nhận thất bại',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách chờ xác nhận
 * GET /users/phieuthu/pending
 */
export const getPendingConfirmationsController = async (req: Request, res: Response) => {
  try {
    const userInfo = req.userInfo!;
    // Truyền userInfo để service biết Admin/Owner xem tất cả, User chỉ xem của mình
    const result = await phieuThuService.getPendingConfirmations({
      MaLoaiTK: userInfo.MaLoaiTK,
      MaTV: userInfo.MaTV,
      MaGiaPha: userInfo.MaGiaPha
    });

    return res.status(HTTP_STATUS.OK).json({
      message: PHIEUTHU_MESSAGES.GET_SUCCESS,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getPendingConfirmations:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy danh sách thất bại',
      error: error.message
    });
  }
};

// ==================== DANH MỤC ====================

/**
 * Lấy danh sách danh mục
 * GET /users/danhmuc
 */
export const getDanhMucListController = async (req: Request, res: Response) => {
  try {
    const MaGiaPha = req.query.MaGiaPha as string;
    const result = await phieuThuService.getDanhMucList(MaGiaPha);

    return res.status(HTTP_STATUS.OK).json({
      message: PHIEUTHU_MESSAGES.GET_SUCCESS,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getDanhMucList:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy danh sách thất bại',
      error: error.message
    });
  }
};

/**
 * Tạo danh mục mới
 * POST /users/danhmuc/create
 */
export const createDanhMucController = async (req: Request, res: Response) => {
  try {
    const data: CreateDanhMucReqBody = req.body;
    const result = await phieuThuService.createDanhMuc(data);

    return res.status(HTTP_STATUS.CREATED).json({
      message: 'Tạo danh mục thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi createDanhMuc:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: 'Tạo danh mục thất bại',
      error: error.message
    });
  }
};

/**
 * Cập nhật danh mục
 * PUT /users/danhmuc/:MaDM
 */
export const updateDanhMucController = async (req: Request, res: Response) => {
  try {
    const { MaDM } = req.params;
    const data: UpdateDanhMucReqBody = req.body;
    const result = await phieuThuService.updateDanhMuc(MaDM, data);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Cập nhật danh mục thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi updateDanhMuc:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: 'Cập nhật danh mục thất bại',
      error: error.message
    });
  }
};

/**
 * Xóa danh mục
 * DELETE /users/danhmuc/:MaDM
 */
export const deleteDanhMucController = async (req: Request, res: Response) => {
  try {
    const { MaDM } = req.params;
    const result = await phieuThuService.deleteDanhMuc(MaDM);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Xóa danh mục thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi deleteDanhMuc:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: 'Xóa danh mục thất bại',
      error: error.message
    });
  }
};

/**
 * Tra cứu danh mục thu chi theo năm
 * GET /users/danhmuc/tra-cuu?nam=2025&MaGiaPha=GP01
 * Quyền: Tất cả người dùng đã đăng nhập
 */
export const traCuuDanhMucController = async (req: Request, res: Response) => {
  try {
    // Lấy userInfo để lọc theo MaGiaPha cho Owner
    const userInfo = req.userInfo;

    // Lấy năm từ query parameter, mặc định là năm hiện tại
    const namParam = req.query.nam;
    let nam: number;

    if (namParam) {
      nam = parseInt(namParam as string, 10);

      // Validate năm
      if (isNaN(nam) || nam < 1900 || nam > 2100) {
        return res.status(400).json({
          message: 'Năm không hợp lệ. Vui lòng nhập năm từ 1900 đến 2100'
        });
      }
    } else {
      nam = new Date().getFullYear();
    }

    // ⭐ Lấy MaGiaPha từ query (ưu tiên) hoặc từ userInfo
    const requestedMaGiaPha = req.query.MaGiaPha as string;

    // Nếu có MaGiaPha từ request, sử dụng nó (admin/owner có thể xem nhiều gia phả)
    // Nếu không, dùng MaGiaPha từ userInfo
    const effectiveUserInfo = requestedMaGiaPha
      ? { ...userInfo, MaGiaPha: requestedMaGiaPha }
      : userInfo;

    // Gọi service với userInfo để lọc theo MaGiaPha
    const result = await phieuThuService.traCuuDanhMucThuChi(nam, effectiveUserInfo);

    return res.status(200).json({
      message: 'Tra cứu danh mục thu chi thành công',
      data: result
    });

  } catch (error: any) {
    console.error('Lỗi tra cứu danh mục:', error);
    return res.status(500).json({
      message: 'Lỗi server khi tra cứu danh mục',
      error: error.message
    });
  }
};

/**
 * Xóa phiếu thu
 * DELETE /users/phieuthu/:MaPhieuThu
 * Quyền: Owner và người đảm nhận danh mục
 */
export const deletePhieuThuController = async (req: Request, res: Response) => {
  try {
    const { MaPhieuThu } = req.params;
    const userInfo = req.userInfo!;

    const result = await phieuThuService.deletePhieuThu(MaPhieuThu, {
      MaLoaiTK: userInfo.MaLoaiTK,
      MaTV: userInfo.MaTV,
      MaGiaPha: userInfo.MaGiaPha
    });

    return res.status(HTTP_STATUS.OK).json({
      message: 'Xóa phiếu thu thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi deletePhieuThu:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: 'Xóa phiếu thu thất bại',
      error: error.message
    });
  }
};
