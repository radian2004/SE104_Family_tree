// src/controllers/phieuchi.controllers.ts
import { Request, Response } from 'express';
import phieuChiService from '~/services/phieuchi.services';
import { CreatePhieuChiReqBody, UpdatePhieuChiReqBody } from '~/models/requests/PhieuChi.requests';
import HTTP_STATUS from '~/constants/httpStatus';
import { PHIEUCHI_MESSAGES } from '~/constants/messages';

/**
 * Tạo phiếu chi mới
 * POST /users/phieuchi/create
 */
export const createPhieuChiController = async (req: Request, res: Response) => {
  try {
    const data: CreatePhieuChiReqBody = req.body;
    const userInfo = req.userInfo!;
    
    const result = await phieuChiService.createPhieuChi(data, userInfo);

    return res.status(HTTP_STATUS.CREATED).json({
      message: PHIEUCHI_MESSAGES.CREATE_SUCCESS,
      result
    });
  } catch (error: any) {
    console.error('Lỗi createPhieuChi:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: PHIEUCHI_MESSAGES.CREATE_FAILED,
      error: error.message
    });
  }
};

/**
 * Lấy danh sách phiếu chi
 * GET /users/phieuchi
 */
export const getPhieuChiListController = async (req: Request, res: Response) => {
  try {
    const userInfo = req.userInfo!;
    const result = await phieuChiService.getPhieuChiList(userInfo);

    return res.status(HTTP_STATUS.OK).json({
      message: PHIEUCHI_MESSAGES.GET_LIST_SUCCESS,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getPhieuChiList:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy danh sách thất bại',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết phiếu chi
 * GET /users/phieuchi/:MaPhieuChi
 */
export const getPhieuChiDetailController = async (req: Request, res: Response) => {
  try {
    const { MaPhieuChi } = req.params;
    const userInfo = req.userInfo!;
    
    const result = await phieuChiService.getPhieuChiDetail(MaPhieuChi, userInfo);

    return res.status(HTTP_STATUS.OK).json({
      message: PHIEUCHI_MESSAGES.GET_SUCCESS,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getPhieuChiDetail:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: PHIEUCHI_MESSAGES.NOT_FOUND,
      error: error.message
    });
  }
};

/**
 * Xóa phiếu chi
 * DELETE /users/phieuchi/:MaPhieuChi
 */
export const deletePhieuChiController = async (req: Request, res: Response) => {
  try {
    const { MaPhieuChi } = req.params;
    const userInfo = req.userInfo!;
    
    await phieuChiService.deletePhieuChi(MaPhieuChi, userInfo);

    return res.status(HTTP_STATUS.OK).json({
      message: PHIEUCHI_MESSAGES.DELETE_SUCCESS
    });
  } catch (error: any) {
    console.error('Lỗi deletePhieuChi:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: PHIEUCHI_MESSAGES.DELETE_FAILED,
      error: error.message
    });
  }
};

/**
 * Cập nhật phiếu chi
 * PUT /users/phieuchi/:MaPhieuChi
 */
export const updatePhieuChiController = async (req: Request, res: Response) => {
  try {
    const { MaPhieuChi } = req.params;
    const data: UpdatePhieuChiReqBody = req.body;
    const userInfo = req.userInfo!;
    
    const result = await phieuChiService.updatePhieuChi(MaPhieuChi, data, userInfo);

    return res.status(HTTP_STATUS.OK).json({
      message: PHIEUCHI_MESSAGES.UPDATE_SUCCESS,
      result
    });
  } catch (error: any) {
    console.error('Lỗi updatePhieuChi:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: PHIEUCHI_MESSAGES.UPDATE_FAILED,
      error: error.message
    });
  }
};

/**
 * Lấy danh sách phiếu chi theo danh mục
 * GET /users/phieuchi/danhmuc/:MaDM
 */
export const getPhieuChiByDanhMucController = async (req: Request, res: Response) => {
  try {
    const { MaDM } = req.params;
    const userInfo = req.userInfo!;
    
    const result = await phieuChiService.getPhieuChiByDanhMuc(MaDM, userInfo);

    return res.status(HTTP_STATUS.OK).json({
      message: PHIEUCHI_MESSAGES.GET_SUCCESS,
      result
    });
  } catch (error: any) {
    console.error('Lỗi getPhieuChiByDanhMuc:', error);
    return res.status(error.status || HTTP_STATUS.BAD_REQUEST).json({
      message: 'Lấy danh sách phiếu chi theo danh mục thất bại',
      error: error.message
    });
  }
};