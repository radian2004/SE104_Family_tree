// src/routes/quanhe.routes.ts
import { Router } from 'express';
import { Request, Response } from 'express';
import databaseService from '~/services/database.services';
import { wrapAsync } from '~/utils/handlers';

const quanheRouter = Router();

// ==================== HÔN NHÂN (VỢ CHỒNG) ====================

/**
 * GET /quanhe/honnhan/:MaTV - Lấy danh sách vợ/chồng của thành viên
 */
quanheRouter.get('/honnhan/:MaTV', wrapAsync(async (req: Request, res: Response) => {
    const { MaTV } = req.params;

    const sql = `
    SELECT 
      hn.MaTV,
      hn.MaTVVC,
      hn.NgayBatDau,
      hn.NgayKetThuc,
      tv.HoTen as TenVoChong,
      tv.GioiTinh
    FROM HONNHAN hn
    INNER JOIN THANHVIEN tv ON hn.MaTVVC = tv.MaTV
    WHERE hn.MaTV = ?
    
    UNION
    
    SELECT 
      hn.MaTVVC as MaTV,
      hn.MaTV as MaTVVC,
      hn.NgayBatDau,
      hn.NgayKetThuc,
      tv.HoTen as TenVoChong,
      tv.GioiTinh
    FROM HONNHAN hn
    INNER JOIN THANHVIEN tv ON hn.MaTV = tv.MaTV
    WHERE hn.MaTVVC = ?
  `;

    const result = await databaseService.query(sql, [MaTV, MaTV]);

    return res.json({
        message: 'Lấy danh sách vợ/chồng thành công',
        result
    });
}));

/**
 * POST /quanhe/honnhan - Thêm quan hệ hôn nhân mới
 * Body: { MaTV, MaTVVC, NgayBatDau, NgayKetThuc? }
 */
quanheRouter.post('/honnhan', wrapAsync(async (req: Request, res: Response) => {
    const { MaTV, MaTVVC, NgayBatDau, NgayKetThuc } = req.body;

    if (!MaTV || !MaTVVC || !NgayBatDau) {
        return res.status(400).json({
            message: 'Thiếu thông tin bắt buộc: MaTV, MaTVVC, NgayBatDau'
        });
    }

    const sql = `
    INSERT INTO HONNHAN (MaTV, MaTVVC, NgayBatDau, NgayKetThuc)
    VALUES (?, ?, ?, ?)
  `;

    await databaseService.query(sql, [MaTV, MaTVVC, NgayBatDau, NgayKetThuc || null]);

    return res.status(201).json({
        message: 'Thêm quan hệ hôn nhân thành công'
    });
}));

/**
 * PUT /quanhe/honnhan - Cập nhật quan hệ hôn nhân
 * Body: { MaTV, MaTVVC, NgayBatDau?, NgayKetThuc? }
 */
quanheRouter.put('/honnhan', wrapAsync(async (req: Request, res: Response) => {
    const { MaTV, MaTVVC, NgayBatDau, NgayKetThuc } = req.body;

    if (!MaTV || !MaTVVC) {
        return res.status(400).json({
            message: 'Thiếu thông tin bắt buộc: MaTV, MaTVVC'
        });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (NgayBatDau !== undefined) {
        updates.push('NgayBatDau = ?');
        params.push(NgayBatDau);
    }
    if (NgayKetThuc !== undefined) {
        updates.push('NgayKetThuc = ?');
        params.push(NgayKetThuc);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'Không có thông tin cập nhật' });
    }

    params.push(MaTV, MaTVVC);

    const sql = `UPDATE HONNHAN SET ${updates.join(', ')} WHERE MaTV = ? AND MaTVVC = ?`;
    await databaseService.query(sql, params);

    return res.json({ message: 'Cập nhật quan hệ hôn nhân thành công' });
}));

/**
 * DELETE /quanhe/honnhan - Xóa quan hệ hôn nhân
 * Body: { MaTV, MaTVVC }
 */
quanheRouter.delete('/honnhan', wrapAsync(async (req: Request, res: Response) => {
    const { MaTV, MaTVVC } = req.body;

    if (!MaTV || !MaTVVC) {
        return res.status(400).json({
            message: 'Thiếu thông tin bắt buộc: MaTV, MaTVVC'
        });
    }

    const sql = `DELETE FROM HONNHAN WHERE (MaTV = ? AND MaTVVC = ?) OR (MaTV = ? AND MaTVVC = ?)`;
    await databaseService.query(sql, [MaTV, MaTVVC, MaTVVC, MaTV]);

    return res.json({ message: 'Xóa quan hệ hôn nhân thành công' });
}));

// ==================== QUAN HỆ CHA MẸ CON ====================

/**
 * GET /quanhe/concai/:MaTV - Lấy danh sách con cái của thành viên
 */
quanheRouter.get('/concai/:MaTV', wrapAsync(async (req: Request, res: Response) => {
    const { MaTV } = req.params;

    const sql = `
    SELECT 
      qhc.MaTV,
      tv.HoTen,
      tv.NgayGioSinh,
      tv.GioiTinh,
      qhc.MaTVCha,
      qhc.MaTVMe,
      qhc.NgayPhatSinh
    FROM QUANHECON qhc
    INNER JOIN THANHVIEN tv ON qhc.MaTV = tv.MaTV
    WHERE qhc.MaTVCha = ? OR qhc.MaTVMe = ?
  `;

    const result = await databaseService.query(sql, [MaTV, MaTV]);

    return res.json({
        message: 'Lấy danh sách con cái thành công',
        result
    });
}));

/**
 * GET /quanhe/chame/:MaTV - Lấy thông tin cha mẹ của thành viên
 */
quanheRouter.get('/chame/:MaTV', wrapAsync(async (req: Request, res: Response) => {
    const { MaTV } = req.params;

    const sql = `
    SELECT 
      qhc.MaTVCha,
      cha.HoTen as TenCha,
      qhc.MaTVMe,
      me.HoTen as TenMe,
      qhc.NgayPhatSinh
    FROM QUANHECON qhc
    LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
    LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
    WHERE qhc.MaTV = ?
  `;

    const result = await databaseService.query(sql, [MaTV]);

    return res.json({
        message: 'Lấy thông tin cha mẹ thành công',
        result: result[0] || null
    });
}));

/**
 * POST /quanhe/concai - Thêm quan hệ cha mẹ con
 * Body: { MaTV, MaTVCha?, MaTVMe?, NgayPhatSinh? }
 */
quanheRouter.post('/concai', wrapAsync(async (req: Request, res: Response) => {
    const { MaTV, MaTVCha, MaTVMe, NgayPhatSinh } = req.body;

    if (!MaTV) {
        return res.status(400).json({
            message: 'Thiếu thông tin bắt buộc: MaTV (mã con)'
        });
    }

    if (!MaTVCha && !MaTVMe) {
        return res.status(400).json({
            message: 'Phải có ít nhất MaTVCha hoặc MaTVMe'
        });
    }

    const sql = `
    INSERT INTO QUANHECON (MaTV, MaTVCha, MaTVMe, NgayPhatSinh)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      MaTVCha = COALESCE(VALUES(MaTVCha), MaTVCha),
      MaTVMe = COALESCE(VALUES(MaTVMe), MaTVMe)
  `;

    await databaseService.query(sql, [MaTV, MaTVCha || null, MaTVMe || null, NgayPhatSinh || new Date()]);

    return res.status(201).json({
        message: 'Thêm quan hệ cha mẹ con thành công'
    });
}));

/**
 * DELETE /quanhe/concai/:MaTV - Xóa quan hệ cha mẹ con
 */
quanheRouter.delete('/concai/:MaTV', wrapAsync(async (req: Request, res: Response) => {
    const { MaTV } = req.params;

    const sql = `DELETE FROM QUANHECON WHERE MaTV = ?`;
    await databaseService.query(sql, [MaTV]);

    return res.json({ message: 'Xóa quan hệ cha mẹ con thành công' });
}));

export default quanheRouter;
