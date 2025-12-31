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
    // Sửa ĐÚNG: Trả về danh sách giới tính hardcoded vì không có bảng GIOITINH
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
    const sql = 'SELECT * FROM CAYGIAPHA ORDER BY TenGiaPha';  // Sửa ĐÚNG: Tên bảng và cột đúng
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

// ============================================================
// CRUD ENDPOINTS FOR CATEGORIES
// ============================================================

// Helper function to generate next ID
async function generateNextId(table: string, prefix: string, idColumn: string): Promise<string> {
  const sql = `SELECT MAX(CAST(SUBSTRING(${idColumn}, ${prefix.length + 1}) AS UNSIGNED)) as maxNum FROM ${table}`;
  const result: any = await databaseService.query(sql);
  const maxNum = result[0]?.maxNum || 0;
  return `${prefix}${String(maxNum + 1).padStart(2, '0')}`;
}

// ==================== QUÊ QUÁN ====================
lookupsRouter.post('/quequan', async (req: Request, res: Response) => {
  try {
    const { TenQueQuan } = req.body;
    if (!TenQueQuan) {
      return res.status(400).json({ message: 'Tên quê quán là bắt buộc' });
    }
    const MaQueQuan = await generateNextId('QUEQUAN', 'QQ', 'MaQueQuan');
    await databaseService.query('INSERT INTO QUEQUAN (MaQueQuan, TenQueQuan) VALUES (?, ?)', [MaQueQuan, TenQueQuan]);
    return res.status(201).json({ message: 'Thêm quê quán thành công', result: { MaQueQuan, TenQueQuan } });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Quê quán đã tồn tại' });
    }
    return res.status(500).json({ message: error.message || 'Lỗi thêm quê quán' });
  }
});

lookupsRouter.put('/quequan/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { TenQueQuan } = req.body;
    if (!TenQueQuan) {
      return res.status(400).json({ message: 'Tên quê quán là bắt buộc' });
    }
    await databaseService.query('UPDATE QUEQUAN SET TenQueQuan = ? WHERE MaQueQuan = ?', [TenQueQuan, id]);
    return res.json({ message: 'Cập nhật quê quán thành công' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi cập nhật quê quán' });
  }
});

lookupsRouter.delete('/quequan/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Check if in use
    const checkSql = 'SELECT COUNT(*) as count FROM THANHVIEN WHERE MaQueQuan = ?';
    const checkResult: any = await databaseService.query(checkSql, [id]);
    if (checkResult[0].count > 0) {
      return res.status(400).json({ message: 'Không thể xóa quê quán đang được sử dụng' });
    }
    await databaseService.query('DELETE FROM QUEQUAN WHERE MaQueQuan = ?', [id]);
    return res.json({ message: 'Xóa quê quán thành công' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi xóa quê quán' });
  }
});

// ==================== NGHỀ NGHIỆP ====================
lookupsRouter.post('/nghenghiep', async (req: Request, res: Response) => {
  try {
    const { TenNgheNghiep } = req.body;
    if (!TenNgheNghiep) {
      return res.status(400).json({ message: 'Tên nghề nghiệp là bắt buộc' });
    }
    const MaNgheNghiep = await generateNextId('NGHENGHIEP', 'NN', 'MaNgheNghiep');
    await databaseService.query('INSERT INTO NGHENGHIEP (MaNgheNghiep, TenNgheNghiep) VALUES (?, ?)', [MaNgheNghiep, TenNgheNghiep]);
    return res.status(201).json({ message: 'Thêm nghề nghiệp thành công', result: { MaNgheNghiep, TenNgheNghiep } });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Nghề nghiệp đã tồn tại' });
    }
    return res.status(500).json({ message: error.message || 'Lỗi thêm nghề nghiệp' });
  }
});

lookupsRouter.put('/nghenghiep/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { TenNgheNghiep } = req.body;
    if (!TenNgheNghiep) {
      return res.status(400).json({ message: 'Tên nghề nghiệp là bắt buộc' });
    }
    await databaseService.query('UPDATE NGHENGHIEP SET TenNgheNghiep = ? WHERE MaNgheNghiep = ?', [TenNgheNghiep, id]);
    return res.json({ message: 'Cập nhật nghề nghiệp thành công' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi cập nhật nghề nghiệp' });
  }
});

lookupsRouter.delete('/nghenghiep/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const checkSql = 'SELECT COUNT(*) as count FROM THANHVIEN WHERE MaNgheNghiep = ?';
    const checkResult: any = await databaseService.query(checkSql, [id]);
    if (checkResult[0].count > 0) {
      return res.status(400).json({ message: 'Không thể xóa nghề nghiệp đang được sử dụng' });
    }
    await databaseService.query('DELETE FROM NGHENGHIEP WHERE MaNgheNghiep = ?', [id]);
    return res.json({ message: 'Xóa nghề nghiệp thành công' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi xóa nghề nghiệp' });
  }
});

// ==================== NGUYÊN NHÂN MẤT ====================
lookupsRouter.post('/nguyennhanmat', async (req: Request, res: Response) => {
  try {
    const { TenNguyenNhanMat } = req.body;
    if (!TenNguyenNhanMat) {
      return res.status(400).json({ message: 'Tên nguyên nhân mất là bắt buộc' });
    }
    const MaNguyenNhanMat = await generateNextId('NGUYENNHANMAT', 'NNM', 'MaNguyenNhanMat');
    await databaseService.query('INSERT INTO NGUYENNHANMAT (MaNguyenNhanMat, TenNguyenNhanMat) VALUES (?, ?)', [MaNguyenNhanMat, TenNguyenNhanMat]);
    return res.status(201).json({ message: 'Thêm nguyên nhân mất thành công', result: { MaNguyenNhanMat, TenNguyenNhanMat } });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Nguyên nhân mất đã tồn tại' });
    }
    return res.status(500).json({ message: error.message || 'Lỗi thêm nguyên nhân mất' });
  }
});

lookupsRouter.put('/nguyennhanmat/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { TenNguyenNhanMat } = req.body;
    if (!TenNguyenNhanMat) {
      return res.status(400).json({ message: 'Tên nguyên nhân mất là bắt buộc' });
    }
    await databaseService.query('UPDATE NGUYENNHANMAT SET TenNguyenNhanMat = ? WHERE MaNguyenNhanMat = ?', [TenNguyenNhanMat, id]);
    return res.json({ message: 'Cập nhật nguyên nhân mất thành công' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi cập nhật nguyên nhân mất' });
  }
});

lookupsRouter.delete('/nguyennhanmat/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const checkSql = 'SELECT COUNT(*) as count FROM THANHVIEN WHERE MaNguyenNhanMat = ?';
    const checkResult: any = await databaseService.query(checkSql, [id]);
    if (checkResult[0].count > 0) {
      return res.status(400).json({ message: 'Không thể xóa nguyên nhân mất đang được sử dụng' });
    }
    await databaseService.query('DELETE FROM NGUYENNHANMAT WHERE MaNguyenNhanMat = ?', [id]);
    return res.json({ message: 'Xóa nguyên nhân mất thành công' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi xóa nguyên nhân mất' });
  }
});

// ==================== ĐỊA ĐIỂM MAI TÁNG ====================
lookupsRouter.post('/diadiemmaitang', async (req: Request, res: Response) => {
  try {
    const { TenDiaDiem } = req.body;
    if (!TenDiaDiem) {
      return res.status(400).json({ message: 'Tên địa điểm mai táng là bắt buộc' });
    }
    const MaDiaDiem = await generateNextId('DIADIEMMAITANG', 'DD', 'MaDiaDiem');
    await databaseService.query('INSERT INTO DIADIEMMAITANG (MaDiaDiem, TenDiaDiem) VALUES (?, ?)', [MaDiaDiem, TenDiaDiem]);
    return res.status(201).json({ message: 'Thêm địa điểm mai táng thành công', result: { MaDiaDiem, TenDiaDiem } });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Địa điểm mai táng đã tồn tại' });
    }
    return res.status(500).json({ message: error.message || 'Lỗi thêm địa điểm mai táng' });
  }
});

lookupsRouter.put('/diadiemmaitang/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { TenDiaDiem } = req.body;
    if (!TenDiaDiem) {
      return res.status(400).json({ message: 'Tên địa điểm mai táng là bắt buộc' });
    }
    await databaseService.query('UPDATE DIADIEMMAITANG SET TenDiaDiem = ? WHERE MaDiaDiem = ?', [TenDiaDiem, id]);
    return res.json({ message: 'Cập nhật địa điểm mai táng thành công' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi cập nhật địa điểm mai táng' });
  }
});

lookupsRouter.delete('/diadiemmaitang/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const checkSql = 'SELECT COUNT(*) as count FROM THANHVIEN WHERE MaDiaDiem = ?';
    const checkResult: any = await databaseService.query(checkSql, [id]);
    if (checkResult[0].count > 0) {
      return res.status(400).json({ message: 'Không thể xóa địa điểm mai táng đang được sử dụng' });
    }
    await databaseService.query('DELETE FROM DIADIEMMAITANG WHERE MaDiaDiem = ?', [id]);
    return res.json({ message: 'Xóa địa điểm mai táng thành công' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi xóa địa điểm mai táng' });
  }
});

// ==================== LOẠI THÀNH TÍCH ====================
lookupsRouter.post('/loaithanhtich', async (req: Request, res: Response) => {
  try {
    const { TenLTT } = req.body;
    if (!TenLTT) {
      return res.status(400).json({ message: 'Tên loại thành tích là bắt buộc' });
    }
    const MaLTT = await generateNextId('LOAITHANHTICH', 'LTT', 'MaLTT');
    await databaseService.query('INSERT INTO LOAITHANHTICH (MaLTT, TenLTT) VALUES (?, ?)', [MaLTT, TenLTT]);
    return res.status(201).json({ message: 'Thêm loại thành tích thành công', result: { MaLTT, TenLTT } });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Loại thành tích đã tồn tại' });
    }
    return res.status(500).json({ message: error.message || 'Lỗi thêm loại thành tích' });
  }
});

lookupsRouter.put('/loaithanhtich/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { TenLTT } = req.body;
    if (!TenLTT) {
      return res.status(400).json({ message: 'Tên loại thành tích là bắt buộc' });
    }
    await databaseService.query('UPDATE LOAITHANHTICH SET TenLTT = ? WHERE MaLTT = ?', [TenLTT, id]);
    return res.json({ message: 'Cập nhật loại thành tích thành công' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi cập nhật loại thành tích' });
  }
});

lookupsRouter.delete('/loaithanhtich/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const checkSql = 'SELECT COUNT(*) as count FROM GHINHANTHANHTICH WHERE MaLTT = ?';
    const checkResult: any = await databaseService.query(checkSql, [id]);
    if (checkResult[0].count > 0) {
      return res.status(400).json({ message: 'Không thể xóa loại thành tích đang được sử dụng' });
    }
    await databaseService.query('DELETE FROM LOAITHANHTICH WHERE MaLTT = ?', [id]);
    return res.json({ message: 'Xóa loại thành tích thành công' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi xóa loại thành tích' });
  }
});

// ==================== DANH MỤC THU CHI ====================
lookupsRouter.get('/danhmuc', async (req: Request, res: Response) => {
  try {
    const sql = 'SELECT * FROM DANHMUC ORDER BY TenDM';
    const result = await databaseService.query(sql);
    return res.json({ message: 'Lấy danh sách danh mục thành công', result });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi lấy danh sách danh mục' });
  }
});

lookupsRouter.post('/danhmuc', async (req: Request, res: Response) => {
  try {
    const { TenDM, NguoiDamNhan } = req.body;
    if (!TenDM) {
      return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
    }
    const MaDM = await generateNextId('DANHMUC', 'DM', 'MaDM');
    await databaseService.query('INSERT INTO DANHMUC (MaDM, TenDM, NguoiDamNhan, TongThu, TongChi) VALUES (?, ?, ?, 0, 0)', [MaDM, TenDM, NguoiDamNhan || null]);
    return res.status(201).json({ message: 'Thêm danh mục thành công', result: { MaDM, TenDM, NguoiDamNhan } });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi thêm danh mục' });
  }
});

lookupsRouter.put('/danhmuc/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { TenDM, NguoiDamNhan } = req.body;
    if (!TenDM) {
      return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
    }
    await databaseService.query('UPDATE DANHMUC SET TenDM = ?, NguoiDamNhan = ? WHERE MaDM = ?', [TenDM, NguoiDamNhan || null, id]);
    return res.json({ message: 'Cập nhật danh mục thành công' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi cập nhật danh mục' });
  }
});

lookupsRouter.delete('/danhmuc/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Check if used in thu/chi
    const checkThu = 'SELECT COUNT(*) as count FROM CT_PHIEUTHU WHERE MaDMT = ?';
    const checkChi = 'SELECT COUNT(*) as count FROM PHIEUCHIQUY WHERE MaDMC = ?';
    const thuResult: any = await databaseService.query(checkThu, [id]);
    const chiResult: any = await databaseService.query(checkChi, [id]);
    if (thuResult[0].count > 0 || chiResult[0].count > 0) {
      return res.status(400).json({ message: 'Không thể xóa danh mục đang có phiếu thu/chi' });
    }
    await databaseService.query('DELETE FROM DANHMUC WHERE MaDM = ?', [id]);
    return res.json({ message: 'Xóa danh mục thành công' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Lỗi xóa danh mục' });
  }
});

export default lookupsRouter;

