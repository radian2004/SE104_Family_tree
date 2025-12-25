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
    // ✅ ĐÚNG: Trả về danh sách giới tính hardcoded vì không có bảng GIOITINH
    const result = [
      { MaGioiTinh: 'Nam', TenGioiTinh: 'Nam' },
      { MaGioiTinh: 'Nữ', TenGioiTinh: 'Nữ' }
    ];
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
 * GET /caygiapha - Lấy danh sách gia phả
 */
lookupsRouter.get('/caygiapha', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM CAYGIAPHA ORDER BY TenGiaPha';  // ✅ ĐÚNG: Tên bảng và cột đúng
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

/**
 * GET /lookups/loaithanhtich - Lấy danh sách loại thành tích
 */
lookupsRouter.get('/loaithanhtich', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM LOAITHANHTICH ORDER BY TenLTT';
    const result = await databaseService.query(sql);
    return res.json({
      message: 'Lấy danh sách loại thành tích thành công',
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách loại thành tích',
      error
    });
  }
});

/**
 * GET /nguyennhanmat - Lấy danh sách nguyên nhân mất
 */
lookupsRouter.get('/nguyennhanmat', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM NGUYENNHANMAT ORDER BY TenNguyenNhanMat';
    const result = await databaseService.query(sql);
    return res.json({
      message: 'Lấy danh sách nguyên nhân mất thành công',
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách nguyên nhân mất',
      error
    });
  }
});

/**
 * GET /diadiemmaitang - Lấy danh sách địa điểm mai táng
 */
lookupsRouter.get('/diadiemmaitang', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM DIADIEMMAITANG ORDER BY TenDiaDiem';
    const result = await databaseService.query(sql);
    return res.json({
      message: 'Lấy danh sách địa điểm mai táng thành công',
      result
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || 'Lỗi lấy danh sách địa điểm mai táng',
      error
    });
  }
});

export default lookupsRouter;

