// src/services/phieuchi.services.ts
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import databaseService from './database.services';
import { CreatePhieuChiReqBody, UpdatePhieuChiReqBody } from '~/models/requests/PhieuChi.requests';
import { ErrorWithStatus } from '~/models/Errors';
import HTTP_STATUS from '~/constants/httpStatus';
import { PHIEUCHI_MESSAGES } from '~/constants/messages';

// Interface cho kết quả query
interface PhieuChiRow extends RowDataPacket {
  MaPhieuChi: string;
  MaTV: string;
  HoTenNguoiChi: string;
  NgayChi: Date;
  MaDMC: string;
  TenDM: string;
  SoTienChi: number;
  LyDoChi: string;
}

interface DanhMucRow extends RowDataPacket {
  MaDM: string;
  TenDM: string;
  NguoiDamNhan: string;
  TongThu: number;
  TongChi: number;
}

interface UserInfo {
  TenDangNhap: string;
  MaTV: string;
  MaLoaiTK: string;
  MaGiaPha: string | null;
}

class PhieuChiService {

  /**
   * Tạo phiếu chi mới
   * - Admin, Owner: lập được cho mọi danh mục
   * - User: chỉ được lập nếu là NguoiDamNhan của danh mục
   */
  async createPhieuChi(data: CreatePhieuChiReqBody, userInfo: UserInfo) {
    const connection = await databaseService.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Kiểm tra danh mục có tồn tại không
      const [dmRows] = await connection.execute<RowDataPacket[]>(
        'SELECT MaDM, TenDM, NguoiDamNhan FROM DANHMUC WHERE MaDM = ?',
        [data.MaDMC]
      );

      if (dmRows.length === 0) {
        throw new ErrorWithStatus({
          message: PHIEUCHI_MESSAGES.CATEGORY_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        });
      }

      const danhMuc = dmRows[0];

      // 2. Kiểm tra quyền lập phiếu chi
      // Admin và Owner được lập cho mọi danh mục
      // User chỉ được lập nếu là NguoiDamNhan
      if (userInfo.MaLoaiTK === 'LTK03') {
        // User: kiểm tra có phải NguoiDamNhan không
        if (danhMuc.NguoiDamNhan !== userInfo.MaTV) {
          throw new ErrorWithStatus({
            message: PHIEUCHI_MESSAGES.NOT_CATEGORY_MANAGER,
            status: HTTP_STATUS.FORBIDDEN
          });
        }
      }

      // 3. Validate số tiền chi
      if (!data.SoTienChi || data.SoTienChi <= 0) {
        throw new ErrorWithStatus({
          message: PHIEUCHI_MESSAGES.INVALID_AMOUNT,
          status: HTTP_STATUS.BAD_REQUEST
        });
      }

      // 4. Tạo phiếu chi (MaPhieuChi được trigger tự động sinh)
      // MaTV = người lập phiếu (lấy từ userInfo)
      await connection.execute<ResultSetHeader>(
        'INSERT INTO PHIEUCHIQUY (MaTV, MaDMC, SoTienChi, LyDoChi) VALUES (?, ?, ?, ?)',
        [userInfo.MaTV, data.MaDMC, data.SoTienChi, data.LyDoChi || '']
      );

      // 5. Lấy phiếu chi vừa tạo
      const [newPhieuChi] = await connection.execute<RowDataPacket[]>(
        `SELECT pc.*, dm.TenDM, tv.HoTen AS HoTenNguoiChi
         FROM PHIEUCHIQUY pc
         LEFT JOIN DANHMUC dm ON pc.MaDMC = dm.MaDM
         LEFT JOIN THANHVIEN tv ON pc.MaTV = tv.MaTV
         ORDER BY pc.MaPhieuChi DESC LIMIT 1`
      );

      await connection.commit();

      return {
        success: true,
        ...newPhieuChi[0]
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy danh sách phiếu chi
   * - Admin: xem tất cả
   * - Owner: xem gia phả của mình
   * - User: xem phiếu do mình lập
   */
  async getPhieuChiList(userInfo: UserInfo) {
    let sql = `
      SELECT 
        pc.MaPhieuChi,
        pc.MaTV,
        tv.HoTen AS HoTenNguoiChi,
        pc.NgayChi,
        pc.MaDMC,
        dm.TenDM,
        pc.SoTienChi,
        pc.LyDoChi
      FROM PHIEUCHIQUY pc
      LEFT JOIN THANHVIEN tv ON pc.MaTV = tv.MaTV
      LEFT JOIN DANHMUC dm ON pc.MaDMC = dm.MaDM
    `;

    const params: any[] = [];

    if (userInfo.MaLoaiTK === 'LTK01') {
      // Admin: xem tất cả
    } else if (userInfo.MaLoaiTK === 'LTK02') {
      // Owner: xem gia phả của mình
      sql += ' WHERE tv.MaGiaPha = ?';
      params.push(userInfo.MaGiaPha);
    } else {
      // User: xem phiếu do mình lập
      sql += ' WHERE pc.MaTV = ?';
      params.push(userInfo.MaTV);
    }

    sql += ' ORDER BY pc.NgayChi DESC';

    const rows = await databaseService.query<PhieuChiRow[]>(sql, params);
    return rows;
  }

  /**
   * Lấy chi tiết phiếu chi
   */
  async getPhieuChiDetail(MaPhieuChi: string, userInfo: UserInfo) {
    const sql = `
      SELECT 
        pc.MaPhieuChi,
        pc.MaTV,
        tv.HoTen AS HoTenNguoiChi,
        tv.MaGiaPha,
        pc.NgayChi,
        pc.MaDMC,
        dm.TenDM,
        dm.NguoiDamNhan,
        tvDM.HoTen AS TenNguoiDamNhan,
        pc.SoTienChi,
        pc.LyDoChi
      FROM PHIEUCHIQUY pc
      LEFT JOIN THANHVIEN tv ON pc.MaTV = tv.MaTV
      LEFT JOIN DANHMUC dm ON pc.MaDMC = dm.MaDM
      LEFT JOIN THANHVIEN tvDM ON dm.NguoiDamNhan = tvDM.MaTV
      WHERE pc.MaPhieuChi = ?
    `;

    const rows = await databaseService.query<RowDataPacket[]>(sql, [MaPhieuChi]);

    if (rows.length === 0) {
      throw new ErrorWithStatus({
        message: PHIEUCHI_MESSAGES.NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    const phieuChi = rows[0];

    // Kiểm tra quyền xem
    if (userInfo.MaLoaiTK === 'LTK01') {
      // Admin xem được tất cả
    } else if (userInfo.MaLoaiTK === 'LTK02') {
      // Owner chỉ xem được trong gia phả
      if (phieuChi.MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: PHIEUCHI_MESSAGES.FORBIDDEN,
          status: HTTP_STATUS.FORBIDDEN
        });
      }
    } else {
      // User chỉ xem được phiếu của mình
      if (phieuChi.MaTV !== userInfo.MaTV) {
        throw new ErrorWithStatus({
          message: PHIEUCHI_MESSAGES.FORBIDDEN,
          status: HTTP_STATUS.FORBIDDEN
        });
      }
    }

    return phieuChi;
  }

  /**
   * Xóa phiếu chi
   * - Admin: xóa được tất cả
   * - Owner: xóa được trong gia phả
   * - User: xóa được phiếu do mình lập
   */
  async deletePhieuChi(MaPhieuChi: string, userInfo: UserInfo) {
    // Lấy thông tin phiếu chi
    const phieuChiRows = await databaseService.query<RowDataPacket[]>(
      `SELECT pc.*, tv.MaGiaPha 
       FROM PHIEUCHIQUY pc
       LEFT JOIN THANHVIEN tv ON pc.MaTV = tv.MaTV
       WHERE pc.MaPhieuChi = ?`,
      [MaPhieuChi]
    );

    if (phieuChiRows.length === 0) {
      throw new ErrorWithStatus({
        message: PHIEUCHI_MESSAGES.NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    const phieuChi = phieuChiRows[0];

    // Kiểm tra quyền xóa
    if (userInfo.MaLoaiTK === 'LTK01') {
      // Admin xóa được tất cả
    } else if (userInfo.MaLoaiTK === 'LTK02') {
      // Owner chỉ xóa được trong gia phả
      if (phieuChi.MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: PHIEUCHI_MESSAGES.FORBIDDEN,
          status: HTTP_STATUS.FORBIDDEN
        });
      }
    } else {
      // User chỉ xóa được phiếu của mình
      if (phieuChi.MaTV !== userInfo.MaTV) {
        throw new ErrorWithStatus({
          message: PHIEUCHI_MESSAGES.FORBIDDEN,
          status: HTTP_STATUS.FORBIDDEN
        });
      }
    }

    // Trigger TRG_UPDATE_TONGCHI_AFTER_DELETE sẽ tự động cập nhật TongChi
    await databaseService.query(
      'DELETE FROM PHIEUCHIQUY WHERE MaPhieuChi = ?',
      [MaPhieuChi]
    );

    return { success: true };
  }

  /**
   * Cập nhật phiếu chi
   * - Không cho phép thay đổi danh mục (MaDMC)
   * - Chỉ được cập nhật SoTienChi và LyDoChi
   */
  async updatePhieuChi(MaPhieuChi: string, data: UpdatePhieuChiReqBody, userInfo: UserInfo) {
    const connection = await databaseService.getConnection();
    
    try {
      await connection.beginTransaction();

      // Lấy thông tin phiếu chi hiện tại
      const [phieuChiRows] = await connection.execute<RowDataPacket[]>(
        `SELECT pc.*, tv.MaGiaPha 
         FROM PHIEUCHIQUY pc
         LEFT JOIN THANHVIEN tv ON pc.MaTV = tv.MaTV
         WHERE pc.MaPhieuChi = ?`,
        [MaPhieuChi]
      );

      if (phieuChiRows.length === 0) {
        throw new ErrorWithStatus({
          message: PHIEUCHI_MESSAGES.NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        });
      }

      const phieuChi = phieuChiRows[0];
      const oldSoTienChi = phieuChi.SoTienChi;

      // Kiểm tra quyền cập nhật
      if (userInfo.MaLoaiTK === 'LTK01') {
        // Admin cập nhật được tất cả
      } else if (userInfo.MaLoaiTK === 'LTK02') {
        // Owner chỉ cập nhật được trong gia phả
        if (phieuChi.MaGiaPha !== userInfo.MaGiaPha) {
          throw new ErrorWithStatus({
            message: PHIEUCHI_MESSAGES.FORBIDDEN,
            status: HTTP_STATUS.FORBIDDEN
          });
        }
      } else {
        // User chỉ cập nhật được phiếu của mình
        if (phieuChi.MaTV !== userInfo.MaTV) {
          throw new ErrorWithStatus({
            message: PHIEUCHI_MESSAGES.FORBIDDEN,
            status: HTTP_STATUS.FORBIDDEN
          });
        }
      }

      // Build câu UPDATE
      const updates: string[] = [];
      const params: any[] = [];

      if (data.SoTienChi !== undefined) {
        if (data.SoTienChi <= 0) {
          throw new ErrorWithStatus({
            message: PHIEUCHI_MESSAGES.INVALID_AMOUNT,
            status: HTTP_STATUS.BAD_REQUEST
          });
        }
        updates.push('SoTienChi = ?');
        params.push(data.SoTienChi);
      }

      if (data.LyDoChi !== undefined) {
        updates.push('LyDoChi = ?');
        params.push(data.LyDoChi);
      }

      if (updates.length === 0) {
        throw new ErrorWithStatus({
          message: 'Không có dữ liệu để cập nhật',
          status: HTTP_STATUS.BAD_REQUEST
        });
      }

      params.push(MaPhieuChi);

      await connection.execute(
        `UPDATE PHIEUCHIQUY SET ${updates.join(', ')} WHERE MaPhieuChi = ?`,
        params
      );

      // Cập nhật TongChi trong DANHMUC nếu SoTienChi thay đổi
      if (data.SoTienChi !== undefined && data.SoTienChi !== oldSoTienChi) {
        const difference = data.SoTienChi - oldSoTienChi;
        await connection.execute(
          'UPDATE DANHMUC SET TongChi = TongChi + ? WHERE MaDM = ?',
          [difference, phieuChi.MaDMC]
        );
      }

      await connection.commit();

      // Lấy phiếu chi sau khi cập nhật
      const updatedRows = await databaseService.query<RowDataPacket[]>(
        `SELECT pc.*, dm.TenDM, tv.HoTen AS HoTenNguoiChi
         FROM PHIEUCHIQUY pc
         LEFT JOIN DANHMUC dm ON pc.MaDMC = dm.MaDM
         LEFT JOIN THANHVIEN tv ON pc.MaTV = tv.MaTV
         WHERE pc.MaPhieuChi = ?`,
        [MaPhieuChi]
      );

      return updatedRows[0];

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy danh sách phiếu chi theo danh mục
   * Dành cho người đảm nhận xem các khoản chi của danh mục mình quản lý
   */
  async getPhieuChiByDanhMuc(MaDM: string, userInfo: UserInfo) {
    // Kiểm tra danh mục tồn tại
    const dmRows = await databaseService.query<DanhMucRow[]>(
      'SELECT * FROM DANHMUC WHERE MaDM = ?',
      [MaDM]
    );

    if (dmRows.length === 0) {
      throw new ErrorWithStatus({
        message: PHIEUCHI_MESSAGES.CATEGORY_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    const danhMuc = dmRows[0];

    // Kiểm tra quyền xem
    // Admin xem tất cả, Owner xem gia phả, User chỉ xem nếu là NguoiDamNhan
    if (userInfo.MaLoaiTK === 'LTK03') {
      if (danhMuc.NguoiDamNhan !== userInfo.MaTV) {
        throw new ErrorWithStatus({
          message: PHIEUCHI_MESSAGES.FORBIDDEN,
          status: HTTP_STATUS.FORBIDDEN
        });
      }
    }

    const sql = `
      SELECT 
        pc.MaPhieuChi,
        pc.MaTV,
        tv.HoTen AS HoTenNguoiChi,
        pc.NgayChi,
        pc.MaDMC,
        dm.TenDM,
        pc.SoTienChi,
        pc.LyDoChi
      FROM PHIEUCHIQUY pc
      LEFT JOIN THANHVIEN tv ON pc.MaTV = tv.MaTV
      LEFT JOIN DANHMUC dm ON pc.MaDMC = dm.MaDM
      WHERE pc.MaDMC = ?
      ORDER BY pc.NgayChi DESC
    `;

    const rows = await databaseService.query<PhieuChiRow[]>(sql, [MaDM]);

    return {
      danhMuc: {
        MaDM: danhMuc.MaDM,
        TenDM: danhMuc.TenDM,
        TongChi: danhMuc.TongChi
      },
      phieuChiList: rows
    };
  }
}

const phieuChiService = new PhieuChiService();
export default phieuChiService;