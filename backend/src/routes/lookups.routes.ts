// src/routes/lookups.routes.ts
import { Router } from 'express';
import { Request, Response } from 'express';
import databaseService from '~/services/database.services';

const lookupsRouter = Router();

/**
 * GET /gioitinh - Lấy danh sách giới tính
 */
lookupsRouter.get('/gioitinh', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM GIOITINH ORDER BY TenGioiTinh';
    const result = await databaseService.query(sql);
    return res.json({
      message: 'Lấy danh sách giới tính thành công',
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách giới tính',
      error
    });
  }
});

/**
 * GET /quequan - Lấy danh sách quê quán
 */
lookupsRouter.get('/quequan', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM QUEQUAN ORDER BY TenQueQuan';
    const result = await databaseService.query(sql);
    return res.json({
      message: 'Lấy danh sách quê quán thành công',
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách quê quán',
      error
    });
  }
});

/**
 * GET /nghenghiep - Lấy danh sách nghề nghiệp
 */
lookupsRouter.get('/nghenghiep', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM NGHENGHIEP ORDER BY TenNgheNghiep';
    const result = await databaseService.query(sql);
    return res.json({
      message: 'Lấy danh sách nghề nghiệp thành công',
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách nghề nghiệp',
      error
    });
  }
});

/**
 * GET /caygiaphat - Lấy danh sách gia phả
 */
lookupsRouter.get('/caygiaphat', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM CAYGIAPHAT ORDER BY TenCayGiaP';
    const result = await databaseService.query(sql);
    return res.json({
      message: 'Lấy danh sách gia phả thành công',
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách gia phả',
      error
    });
  }
});

/**
 * GET /loaitaikhoan - Lấy danh sách loại tài khoản
 */
lookupsRouter.get('/loaitaikhoan', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM LOAITAIKHOAN ORDER BY TenLoaiTK';
    const result = await databaseService.query(sql);
    return res.json({
      message: 'Lấy danh sách loại tài khoản thành công',
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách loại tài khoản',
      error
    });
  }
});

export default lookupsRouter;
