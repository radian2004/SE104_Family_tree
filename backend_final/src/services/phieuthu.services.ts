// src/services/phieuthu.services.ts
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import databaseService from './database.services';
import { CreatePhieuThuReqBody, CreateDanhMucReqBody, UpdateDanhMucReqBody } from '~/models/requests/PhieuThu.requests';
import { TraCuuDanhMucResponse, DanhMucThuChiItem } from '~/models/requests/DanhMuc.requests';
import { ErrorWithStatus } from '~/models/Errors';
import HTTP_STATUS from '~/constants/httpStatus';

// Interface cho kết quả query
interface PhieuThuRow extends RowDataPacket {
  MaPhieuThu: string;
  MaTV: string;
  HoTen: string;
  NgayThu: Date;
  TongThu: number;
}

interface ChiTietPhieuThuRow extends RowDataPacket {
  MaPhieuThu: string;
  MaDMT: string;
  TenDM: string;
  SoTienThu: number;
  SoThuTu: number;
  TinhHopLe: boolean;
  NgayXacNhan: Date | null;
  NguoiXacNhan: string | null;
  TenNguoiXacNhan: string | null;
}

interface DanhMucRow extends RowDataPacket {
  MaDM: string;
  TenDM: string;
  NguoiDamNhan: string;
  TenNguoiDamNhan: string | null;
  TongThu: number;
  TongChi: number;
}

interface PendingConfirmRow extends RowDataPacket {
  MaPhieuThu: string;
  MaDMT: string;
  TenDM: string;
  SoTienThu: number;
  SoThuTu: number;
  HoTenNguoiDong: string;
  NgayThu: Date;
}

class PhieuThuService {

  // ==================== PHIẾU THU ====================

  /**
   * Tạo phiếu thu mới với nhiều danh mục
   */
  async createPhieuThu(data: CreatePhieuThuReqBody) {
    const connection = await databaseService.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Kiểm tra người đóng góp có tồn tại không
      const [memberRows] = await connection.execute<RowDataPacket[]>(
        'SELECT MaTV, HoTen FROM THANHVIEN WHERE MaTV = ?',
        [data.MaTV]
      );

      if (memberRows.length === 0) {
        throw new ErrorWithStatus({
          message: 'Không tìm thấy thành viên',
          status: HTTP_STATUS.NOT_FOUND
        });
      }

      // 2. Kiểm tra các danh mục có tồn tại không
      for (const item of data.chiTietPhieuThu) {
        const [dmRows] = await connection.execute<RowDataPacket[]>(
          'SELECT MaDM FROM DANHMUC WHERE MaDM = ?',
          [item.MaDMT]
        );
        if (dmRows.length === 0) {
          throw new ErrorWithStatus({
            message: `Không tìm thấy danh mục ${item.MaDMT}`,
            status: HTTP_STATUS.NOT_FOUND
          });
        }
      }

      // 3. Tạo phiếu thu (MaPhieuThu được trigger tự động sinh)
      const [insertResult] = await connection.execute<ResultSetHeader>(
        'INSERT INTO PHIEUTHUQUY (MaTV) VALUES (?)',
        [data.MaTV]
      );

      // 4. Lấy MaPhieuThu vừa tạo
      const [newPhieuThu] = await connection.execute<RowDataPacket[]>(
        'SELECT MaPhieuThu FROM PHIEUTHUQUY ORDER BY MaPhieuThu DESC LIMIT 1'
      );
      const MaPhieuThu = newPhieuThu[0].MaPhieuThu;

      // 5. Thêm chi tiết phiếu thu (Trigger sẽ tự động gán NguoiXacNhan, SoThuTu)
      for (const item of data.chiTietPhieuThu) {
        await connection.execute(
          'INSERT INTO CT_PHIEUTHU (MaPhieuThu, MaDMT, SoTienThu) VALUES (?, ?, ?)',
          [MaPhieuThu, item.MaDMT, item.SoTienThu]
        );
      }

      await connection.commit();

      return {
        success: true,
        MaPhieuThu,
        message: 'Tạo phiếu thu thành công. Đang chờ xác nhận từ người đảm nhận danh mục.'
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy danh sách phiếu thu
   * - Admin: xem tất cả
   * - Owner: xem gia phả của mình
   * - User: xem của mình
   */
  async getPhieuThuList(userInfo: { MaLoaiTK: string; MaTV: string; MaGiaPha: string | null }) {
    let sql = `
      SELECT 
        pt.MaPhieuThu,
        pt.MaTV,
        tv.HoTen,
        pt.NgayThu,
        pt.TongThu
      FROM PHIEUTHUQUY pt
      LEFT JOIN THANHVIEN tv ON pt.MaTV = tv.MaTV
    `;

    const params: any[] = [];

    if (userInfo.MaLoaiTK === 'LTK01') {
      // Admin: xem tất cả
    } else if (userInfo.MaLoaiTK === 'LTK02') {
      // Owner: xem gia phả của mình
      sql += ' WHERE tv.MaGiaPha = ?';
      params.push(userInfo.MaGiaPha);
    } else {
      // User: xem của mình
      sql += ' WHERE pt.MaTV = ?';
      params.push(userInfo.MaTV);
    }

    sql += ' ORDER BY pt.NgayThu DESC';

    const rows = await databaseService.query<PhieuThuRow[]>(sql, params);
    return rows;
  }

  /**
   * Lấy chi tiết một phiếu thu
   */
  async getPhieuThuDetail(MaPhieuThu: string) {
    // Lấy thông tin phiếu thu
    const phieuThuSql = `
      SELECT 
        pt.MaPhieuThu,
        pt.MaTV,
        tv.HoTen AS TenNguoiDong,
        pt.NgayThu,
        pt.TongThu
      FROM PHIEUTHUQUY pt
      LEFT JOIN THANHVIEN tv ON pt.MaTV = tv.MaTV
      WHERE pt.MaPhieuThu = ?
    `;

    const phieuThuRows = await databaseService.query<PhieuThuRow[]>(phieuThuSql, [MaPhieuThu]);

    if (phieuThuRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy phiếu thu',
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    // Lấy chi tiết phiếu thu
    const chiTietSql = `
      SELECT 
        ct.MaPhieuThu,
        ct.MaDMT,
        dm.TenDM,
        ct.SoTienThu,
        ct.SoThuTu,
        ct.TinhHopLe,
        ct.NgayXacNhan,
        ct.NguoiXacNhan,
        tv.HoTen AS TenNguoiXacNhan
      FROM CT_PHIEUTHU ct
      LEFT JOIN DANHMUC dm ON ct.MaDMT = dm.MaDM
      LEFT JOIN THANHVIEN tv ON ct.NguoiXacNhan = tv.MaTV
      WHERE ct.MaPhieuThu = ?
      ORDER BY ct.SoThuTu
    `;

    const chiTietRows = await databaseService.query<ChiTietPhieuThuRow[]>(chiTietSql, [MaPhieuThu]);

    return {
      phieuThu: phieuThuRows[0],
      chiTiet: chiTietRows
    };
  }

  /**
   * Xác nhận chi tiết phiếu thu
   * Chỉ người đảm nhận danh mục mới được xác nhận
   */
  async xacNhanChiTiet(MaPhieuThu: string, MaDMT: string, currentUserMaTV: string) {
    // Kiểm tra chi tiết phiếu có tồn tại không
    const chiTietRows = await databaseService.query<RowDataPacket[]>(
      `SELECT ct.*, dm.NguoiDamNhan 
       FROM CT_PHIEUTHU ct
       JOIN DANHMUC dm ON ct.MaDMT = dm.MaDM
       WHERE ct.MaPhieuThu = ? AND ct.MaDMT = ?`,
      [MaPhieuThu, MaDMT]
    );

    if (!chiTietRows || chiTietRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy chi tiết phiếu thu',
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    const chiTiet = chiTietRows[0];

    // Kiểm tra quyền xác nhận (chỉ người đảm nhận danh mục)
    if (chiTiet.NguoiDamNhan !== currentUserMaTV) {
      throw new ErrorWithStatus({
        message: 'Chỉ người đảm nhận danh mục mới có quyền xác nhận',
        status: HTTP_STATUS.FORBIDDEN
      });
    }

    // Kiểm tra đã xác nhận chưa
    if (chiTiet.TinhHopLe === 1) {
      throw new ErrorWithStatus({
        message: 'Chi tiết phiếu thu này đã được xác nhận',
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    // Cập nhật TinhHopLe = TRUE (Trigger sẽ tự động cập nhật TongThu)
    await databaseService.query(
      'UPDATE CT_PHIEUTHU SET TinhHopLe = TRUE WHERE MaPhieuThu = ? AND MaDMT = ?',
      [MaPhieuThu, MaDMT]
    );

    return {
      success: true,
      message: 'Xác nhận thành công'
    };
  }

  /**
   * Hủy xác nhận chi tiết phiếu thu
   */
  async huyXacNhanChiTiet(MaPhieuThu: string, MaDMT: string, currentUserMaTV: string) {
    // Kiểm tra chi tiết phiếu có tồn tại không
    const chiTietRows = await databaseService.query<RowDataPacket[]>(
      `SELECT ct.*, dm.NguoiDamNhan 
       FROM CT_PHIEUTHU ct
       JOIN DANHMUC dm ON ct.MaDMT = dm.MaDM
       WHERE ct.MaPhieuThu = ? AND ct.MaDMT = ?`,
      [MaPhieuThu, MaDMT]
    );

    if (!chiTietRows || chiTietRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy chi tiết phiếu thu',
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    const chiTiet = chiTietRows[0];

    // Kiểm tra quyền
    if (chiTiet.NguoiDamNhan !== currentUserMaTV) {
      throw new ErrorWithStatus({
        message: 'Chỉ người đảm nhận danh mục mới có quyền hủy xác nhận',
        status: HTTP_STATUS.FORBIDDEN
      });
    }

    // Kiểm tra đã xác nhận chưa
    if (chiTiet.TinhHopLe === 0) {
      throw new ErrorWithStatus({
        message: 'Chi tiết phiếu thu này chưa được xác nhận',
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    // Cập nhật TinhHopLe = FALSE (Trigger sẽ tự động trừ TongThu)
    await databaseService.query(
      'UPDATE CT_PHIEUTHU SET TinhHopLe = FALSE WHERE MaPhieuThu = ? AND MaDMT = ?',
      [MaPhieuThu, MaDMT]
    );

    return {
      success: true,
      message: 'Hủy xác nhận thành công'
    };
  }

  /**
   * Lấy danh sách chi tiết phiếu thu chờ xác nhận
   * Dành cho người đảm nhận danh mục
   */
  async getPendingConfirmations(currentUserMaTV: string) {
    const sql = `
      SELECT 
        ct.MaPhieuThu,
        ct.MaDMT,
        dm.TenDM,
        ct.SoTienThu,
        ct.SoThuTu,
        tv.HoTen AS HoTenNguoiDong,
        pt.NgayThu
      FROM CT_PHIEUTHU ct
      JOIN DANHMUC dm ON ct.MaDMT = dm.MaDM
      JOIN PHIEUTHUQUY pt ON ct.MaPhieuThu = pt.MaPhieuThu
      JOIN THANHVIEN tv ON pt.MaTV = tv.MaTV
      WHERE dm.NguoiDamNhan = ? AND ct.TinhHopLe = FALSE
      ORDER BY pt.NgayThu DESC
    `;

    const rows = await databaseService.query<PendingConfirmRow[]>(sql, [currentUserMaTV]);
    return rows;
  }

  // ==================== DANH MỤC ====================

  /**
   * Lấy danh sách danh mục
   */
  async getDanhMucList() {
    const sql = `
      SELECT 
        dm.MaDM,
        dm.TenDM,
        dm.NguoiDamNhan,
        tv.HoTen AS TenNguoiDamNhan,
        dm.TongThu,
        dm.TongChi
      FROM DANHMUC dm
      LEFT JOIN THANHVIEN tv ON dm.NguoiDamNhan = tv.MaTV
      ORDER BY dm.MaDM
    `;

    const rows = await databaseService.query<DanhMucRow[]>(sql);
    return rows;
  }

  /**
   * Tạo danh mục mới
   * Chỉ Admin và Owner mới có quyền
   */
  async createDanhMuc(data: CreateDanhMucReqBody) {
    // Kiểm tra người đảm nhận có tồn tại không
    const memberRows = await databaseService.query<RowDataPacket[]>(
      'SELECT MaTV FROM THANHVIEN WHERE MaTV = ?',
      [data.NguoiDamNhan]
    );

    if (!memberRows || memberRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy thành viên được chỉ định làm người đảm nhận',
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    // Tạo mã danh mục mới
    const maxIdRows = await databaseService.query<RowDataPacket[]>(
      "SELECT COALESCE(MAX(CAST(SUBSTRING(MaDM, 3) AS UNSIGNED)), 0) + 1 AS nextId FROM DANHMUC"
    );
    const nextId = maxIdRows[0]?.nextId || 1;
    const MaDM = `DM${String(nextId).padStart(2, '0')}`;

    // Insert danh mục
    await databaseService.query(
      'INSERT INTO DANHMUC (MaDM, TenDM, NguoiDamNhan) VALUES (?, ?, ?)',
      [MaDM, data.TenDM, data.NguoiDamNhan]
    );

    return {
      success: true,
      MaDM,
      message: 'Tạo danh mục thành công'
    };
  }

  /**
   * Cập nhật danh mục
   * Chỉ Admin và Owner mới có quyền
   */
  async updateDanhMuc(MaDM: string, data: UpdateDanhMucReqBody) {
    // Kiểm tra danh mục có tồn tại không
    const dmRows = await databaseService.query<RowDataPacket[]>(
      'SELECT MaDM FROM DANHMUC WHERE MaDM = ?',
      [MaDM]
    );

    if (!dmRows || dmRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy danh mục',
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    // Nếu có NguoiDamNhan mới, kiểm tra tồn tại
    if (data.NguoiDamNhan) {
      const memberRows = await databaseService.query<RowDataPacket[]>(
        'SELECT MaTV FROM THANHVIEN WHERE MaTV = ?',
        [data.NguoiDamNhan]
      );

      if (!memberRows || memberRows.length === 0) {
        throw new ErrorWithStatus({
          message: 'Không tìm thấy thành viên được chỉ định làm người đảm nhận',
          status: HTTP_STATUS.NOT_FOUND
        });
      }
    }

    // Build câu UPDATE
    const updateFields: string[] = [];
    const params: any[] = [];

    if (data.TenDM !== undefined) {
      updateFields.push('TenDM = ?');
      params.push(data.TenDM);
    }

    if (data.NguoiDamNhan !== undefined) {
      updateFields.push('NguoiDamNhan = ?');
      params.push(data.NguoiDamNhan);
    }

    if (updateFields.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không có dữ liệu để cập nhật',
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    params.push(MaDM);

    await databaseService.query(
      `UPDATE DANHMUC SET ${updateFields.join(', ')} WHERE MaDM = ?`,
      params
    );

    return {
      success: true,
      message: 'Cập nhật danh mục thành công'
    };
  }

  /**
   * Xóa danh mục
   * Chỉ Admin và Owner mới có quyền
   * Không xóa được nếu đã có phiếu thu/chi liên quan
   */
  async deleteDanhMuc(MaDM: string) {
    // Kiểm tra danh mục có tồn tại không
    const dmRows = await databaseService.query<RowDataPacket[]>(
      'SELECT MaDM FROM DANHMUC WHERE MaDM = ?',
      [MaDM]
    );

    if (!dmRows || dmRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy danh mục',
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    // Kiểm tra có chi tiết phiếu thu liên quan không
    const ctPhieuThuRows = await databaseService.query<RowDataPacket[]>(
      'SELECT MaPhieuThu FROM CT_PHIEUTHU WHERE MaDMT = ? LIMIT 1',
      [MaDM]
    );

    if (ctPhieuThuRows && ctPhieuThuRows.length > 0) {
      throw new ErrorWithStatus({
        message: 'Không thể xóa danh mục này vì đã có phiếu thu liên quan',
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    // Kiểm tra có phiếu chi liên quan không
    const phieuChiRows = await databaseService.query<RowDataPacket[]>(
      'SELECT MaPhieuChi FROM PHIEUCHIQUY WHERE MaDMC = ? LIMIT 1',
      [MaDM]
    );

    if (phieuChiRows && phieuChiRows.length > 0) {
      throw new ErrorWithStatus({
        message: 'Không thể xóa danh mục này vì đã có phiếu chi liên quan',
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    // Xóa danh mục
    await databaseService.query(
      'DELETE FROM DANHMUC WHERE MaDM = ?',
      [MaDM]
    );

    return {
      success: true,
      message: 'Xóa danh mục thành công'
    };
  }
    /**
   * Tra cứu danh mục thu chi theo năm
   * @param nam - Năm cần tra cứu
   * @returns Danh sách danh mục với tổng thu/chi trong năm đó
   */
  async traCuuDanhMucThuChi(nam: number): Promise<TraCuuDanhMucResponse> {
    // SQL Query: Lấy tất cả danh mục với tổng thu/chi THEO NĂM
    const sql = `
      SELECT 
        dm.MaDM,
        dm.TenDM,
        dm.NguoiDamNhan,
        tv.HoTen AS TenNguoiDamNhan,
        
        -- Tổng thu trong năm (chỉ tính các khoản đã xác nhận TinhHopLe = TRUE)
        COALESCE(
          (SELECT SUM(ct.SoTienThu) 
           FROM CT_PHIEUTHU ct
           WHERE ct.MaDMT = dm.MaDM 
             AND ct.TinhHopLe = TRUE 
             AND YEAR(ct.NgayXacNhan) = ?
          ), 0
        ) AS TongThuNam,
        
        -- Tổng chi trong năm
        COALESCE(
          (SELECT SUM(pc.SoTienChi)
           FROM PHIEUCHIQUY pc
           WHERE pc.MaDMC = dm.MaDM
             AND YEAR(pc.NgayChi) = ?
          ), 0
        ) AS TongChiNam
        
      FROM DANHMUC dm
      LEFT JOIN THANHVIEN tv ON dm.NguoiDamNhan = tv.MaTV
      ORDER BY dm.MaDM
    `;

    const rows = await databaseService.query<RowDataPacket[]>(sql, [nam, nam]);

    // Chuyển đổi kết quả
    const danhSach: DanhMucThuChiItem[] = rows.map((row, index) => {
      const tongThu = Number(row.TongThuNam) || 0;
      const tongChi = Number(row.TongChiNam) || 0;
      const duThieu = tongThu - tongChi;

      let trangThai: 'Dư' | 'Thiếu' | 'Cân bằng';
      if (duThieu > 0) {
        trangThai = 'Dư';
      } else if (duThieu < 0) {
        trangThai = 'Thiếu';
      } else {
        trangThai = 'Cân bằng';
      }

      return {
        STT: index + 1,
        MaDM: row.MaDM,
        TenDM: row.TenDM,
        Nam: nam,
        NguoiDamNhan: {
          MaTV: row.NguoiDamNhan || '',
          HoTen: row.TenNguoiDamNhan || 'Chưa phân công'
        },
        TongThu: tongThu,
        TongChi: tongChi,
        DuThieu: duThieu,
        TrangThai: trangThai
      };
    });

    // Tính tổng cộng
    const tongThuNam = danhSach.reduce((sum, item) => sum + item.TongThu, 0);
    const tongChiNam = danhSach.reduce((sum, item) => sum + item.TongChi, 0);
    const tongDuThieu = tongThuNam - tongChiNam;

    return {
      nam,
      tongSoDanhMuc: danhSach.length,
      tongThuNam,
      tongChiNam,
      tongDuThieu,
      danhSach
    };
  }
}

const phieuThuService = new PhieuThuService();
export default phieuThuService;