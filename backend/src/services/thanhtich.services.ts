// src/services/thanhtich.services.ts
import GhiNhanThanhTich from '~/models/schemas/GhiNhanThanhTich.schema';
import databaseService from './database.services';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface LoaiThanhTichRow extends RowDataPacket {
  MaLTT: string;
  TenLTT: string;
}

interface GhiNhanThanhTichRow extends RowDataPacket {
  MaLTT: string;
  MaTV: string;
  NgayPhatSinh: Date;
}

interface ThanhTichDetailRow extends RowDataPacket {
  STT: number;
  MaTV: string;
  HoTen: string;
  TenLTT: string;
  NgayPhatSinh: Date;
}

interface ThanhTichByNameRow extends RowDataPacket {
  MaTV: string;
  HoTen: string;
  TenLTT: string;
  NgayPhatSinh: Date;
}

class ThanhTichService {
  /**
   * Lấy danh sách loại thành tích
   */
  async getAllLoaiThanhTich() {
    const sql = 'SELECT * FROM LOAITHANHTICH ORDER BY TenLTT';
    const rows = await databaseService.query<LoaiThanhTichRow[]>(sql);
    return rows;
  }

  /**
   * Ghi nhận thành tích mới
   */
  async ghiNhanThanhTich(payload: {
    MaTV: string;
    MaLTT: string;
    NgayPhatSinh?: Date;
  }) {
    const ghiNhan = new GhiNhanThanhTich(payload);

    const sql = `
      INSERT INTO GHINHANTHANHTICH (MaLTT, MaTV, NgayPhatSinh) 
      VALUES (?, ?, ?)
    `;

    const params = [
      ghiNhan.MaLTT,
      ghiNhan.MaTV,
      ghiNhan.NgayPhatSinh
    ];

    try {
      const result = await databaseService.query<ResultSetHeader>(sql, params);

      return {
        message: 'Ghi nhận thành tích thành công',
        data: {
          MaLTT: ghiNhan.MaLTT,
          MaTV: ghiNhan.MaTV,
          NgayPhatSinh: ghiNhan.NgayPhatSinh,
          affectedRows: result.affectedRows
        }
      };
    } catch (error: any) {
      // Xử lý lỗi trigger (ngày phát sinh không hợp lệ)
      if (error.code === 'ER_SIGNAL_EXCEPTION') {
        throw new Error(error.sqlMessage || 'Ngày đạt thành tích phải sau ngày sinh thành viên!');
      }
      throw error;
    }
  }

  /**
   * ✅ MỚI: Tra cứu thành tích với tìm kiếm linh hoạt theo TÊN
   * - HoTen: Tìm theo tên thành viên (LIKE)
   * - TenLoaiThanhTich: Tìm theo tên loại thành tích (LIKE) - VD: "huân" sẽ tìm tất cả loại có chứa "huân"
   * - TuNgay, DenNgay: Lọc theo khoảng thời gian
   */
  async traCuuThanhTich(filters?: {
    HoTen?: string;
    TenLoaiThanhTich?: string;  // ✅ MỚI: Search theo TÊN loại thành tích
    TuNgay?: Date;
    DenNgay?: Date;
  }) {
    let sql = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY g.NgayPhatSinh DESC) AS STT,
        g.MaTV,
        tv.HoTen,
        ltt.TenLTT AS ThanhTich,
        g.NgayPhatSinh
      FROM GHINHANTHANHTICH g
      INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV
      INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
      WHERE 1=1
    `;

    const params: any[] = [];

    // Thêm điều kiện filter
    if (filters) {
      // ✅ Tìm theo tên thành viên
      if (filters.HoTen) {
        sql += ' AND tv.HoTen LIKE ?';
        params.push(`%${filters.HoTen}%`);
      }

      // ✅ MỚI: Tìm theo TÊN loại thành tích (LIKE search)
      // VD: "huân" → tìm tất cả loại có chứa "huân"
      if (filters.TenLoaiThanhTich) {
        sql += ' AND ltt.TenLTT LIKE ?';
        params.push(`%${filters.TenLoaiThanhTich}%`);
      }

      // ✅ Lọc theo khoảng thời gian
      if (filters.TuNgay) {
        sql += ' AND DATE(g.NgayPhatSinh) >= ?';
        params.push(filters.TuNgay);
      }
      if (filters.DenNgay) {
        sql += ' AND DATE(g.NgayPhatSinh) <= ?';
        params.push(filters.DenNgay);
      }
    }

    sql += ' ORDER BY g.NgayPhatSinh DESC';

    const rows = await databaseService.query<ThanhTichDetailRow[]>(sql, params);
    return rows;
  }

  /**
   * ✅ MỚI: Lấy thành tích của thành viên theo HỌ TÊN
   * Thay thế getThanhTichByMaTV
   */
  async getThanhTichByHoTen(HoTen: string) {
    const sql = `
      SELECT 
        g.MaTV,
        tv.HoTen,
        ltt.TenLTT AS ThanhTich,
        g.NgayPhatSinh
      FROM GHINHANTHANHTICH g
      INNER JOIN THANHVIEN tv ON g.MaTV = tv.MaTV
      INNER JOIN LOAITHANHTICH ltt ON g.MaLTT = ltt.MaLTT
      WHERE tv.HoTen LIKE ?
      ORDER BY g.NgayPhatSinh DESC
    `;

    const rows = await databaseService.query<ThanhTichByNameRow[]>(sql, [`%${HoTen}%`]);
    return rows;
  }

  /**
   * ✅ MỚI: Xóa thành tích - Đơn giản hóa với object payload
   * Thay vì dùng 3 params riêng lẻ
   */
  async xoaThanhTich(payload: {
    MaTV: string;
    MaLTT: string;
    NgayPhatSinh: Date;
  }) {
    const sql = `
      DELETE FROM GHINHANTHANHTICH 
      WHERE MaTV = ? AND MaLTT = ? AND DATE(NgayPhatSinh) = DATE(?)
    `;

    const result = await databaseService.query<ResultSetHeader>(sql, [
      payload.MaTV,
      payload.MaLTT,
      payload.NgayPhatSinh
    ]);

    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy thành tích để xóa');
    }

    return {
      message: 'Xóa thành tích thành công',
      affectedRows: result.affectedRows
    };
  }

  /**
   * Kiểm tra thành tích đã tồn tại chưa
   */
  async checkThanhTichExists(MaTV: string, MaLTT: string, NgayPhatSinh: Date): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM GHINHANTHANHTICH 
      WHERE MaTV = ? AND MaLTT = ? AND DATE(NgayPhatSinh) = DATE(?)
    `;

    const [result] = await databaseService.query<RowDataPacket[]>(sql, [MaTV, MaLTT, NgayPhatSinh]);
    return result.count > 0;
  }


  /**
   * ✅ MỚI: Lấy báo cáo thành tích theo khoảng năm
   * Tổng hợp số lượng thành tích từ bảng BAOCAOTHANHTICH
   */
  async getBaoCaoThanhTich(NamBatDau: number, NamKetThuc: number) {
    // Validate input
    if (NamBatDau > NamKetThuc) {
      throw new Error('Năm bắt đầu không được lớn hơn năm kết thúc');
    }

    const currentYear = new Date().getFullYear();
    if (NamKetThuc > currentYear) {
      throw new Error(`Năm kết thúc không được vượt quá năm hiện tại (${currentYear})`);
    }

    // Query tổng hợp từ BAOCAOTHANHTICH
    const sql = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY SUM(bctc.SoLuong) DESC) AS STT,
        ltt.TenLTT AS LoaiThanhTich,
        SUM(bctc.SoLuong) AS SoLuong
      FROM BAOCAOTHANHTICH bctc
      INNER JOIN LOAITHANHTICH ltt ON bctc.MaLTT = ltt.MaLTT
      WHERE bctc.Nam BETWEEN ? AND ?
      GROUP BY bctc.MaLTT, ltt.TenLTT
      HAVING SUM(bctc.SoLuong) > 0
      ORDER BY SoLuong DESC
    `;

    interface BaoCaoRow extends RowDataPacket {
      STT: number;
      LoaiThanhTich: string;
      SoLuong: number;
    }

    const rows = await databaseService.query<BaoCaoRow[]>(sql, [NamBatDau, NamKetThuc]);

    return {
      NamBatDau,
      NamKetThuc,
      TongLoaiThanhTich: rows.length,
      TongSoLuong: rows.reduce((sum, row) => sum + parseInt(row.SoLuong.toString()), 0),
      DanhSach: rows
    };
  }

  /**
    * ✅ MỚI: Cập nhật loại thành tích
    * Do MaLTT là primary key nên phải dùng DELETE + INSERT trong transaction
    */
  async capNhatThanhTich(payload: {
    MaTV: string;
    MaLTT_Cu: string;
    MaLTT_Moi: string;
    NgayPhatSinh: Date;
  }) {
    const connection = await databaseService.getConnection();

    try {
      // Bắt đầu transaction
      await connection.beginTransaction();

      // Bước 1: Kiểm tra bản ghi cũ có tồn tại không
      const checkSql = `
        SELECT COUNT(*) as count 
        FROM GHINHANTHANHTICH 
        WHERE MaTV = ? AND MaLTT = ? AND DATE(NgayPhatSinh) = DATE(?)
      `;
      const [checkRows] = await connection.query<RowDataPacket[]>(checkSql, [
        payload.MaTV,
        payload.MaLTT_Cu,
        payload.NgayPhatSinh
      ]);
      const checkResult = checkRows[0] as any;

      if (checkResult.count === 0) {
        throw new Error('Không tìm thấy thành tích cần cập nhật');
      }

      // Bước 2: Kiểm tra loại thành tích mới có tồn tại không
      const checkLoaiSql = `
        SELECT COUNT(*) as count 
        FROM LOAITHANHTICH 
        WHERE MaLTT = ?
      `;
      const [checkLoaiRows] = await connection.query<RowDataPacket[]>(checkLoaiSql, [
        payload.MaLTT_Moi
      ]);
      const checkLoaiResult = checkLoaiRows[0] as any;

      if (checkLoaiResult.count === 0) {
        throw new Error('Loại thành tích mới không tồn tại');
      }

      // Bước 3: Kiểm tra xem bản ghi mới có bị trùng không (cùng MaTV, MaLTT_Moi, NgayPhatSinh)
      const checkDuplicateSql = `
        SELECT COUNT(*) as count 
        FROM GHINHANTHANHTICH 
        WHERE MaTV = ? AND MaLTT = ? AND DATE(NgayPhatSinh) = DATE(?)
      `;
      const [checkDuplicateRows] = await connection.query<RowDataPacket[]>(checkDuplicateSql, [
        payload.MaTV,
        payload.MaLTT_Moi,
        payload.NgayPhatSinh
      ]);
      const checkDuplicateResult = checkDuplicateRows[0] as any;

      if (checkDuplicateResult.count > 0) {
        throw new Error('Thành viên đã có loại thành tích này vào ngày này rồi');
      }

      // Bước 4: Xóa bản ghi cũ
      const deleteSql = `
        DELETE FROM GHINHANTHANHTICH 
        WHERE MaTV = ? AND MaLTT = ? AND DATE(NgayPhatSinh) = DATE(?)
      `;
      await connection.query(deleteSql, [
        payload.MaTV,
        payload.MaLTT_Cu,
        payload.NgayPhatSinh
      ]);

      // Bước 5: Thêm bản ghi mới
      const insertSql = `
        INSERT INTO GHINHANTHANHTICH (MaTV, MaLTT, NgayPhatSinh) 
        VALUES (?, ?, ?)
      `;
      await connection.query(insertSql, [
        payload.MaTV,
        payload.MaLTT_Moi,
        payload.NgayPhatSinh
      ]);

      // Commit transaction
      await connection.commit();

      return {
        message: 'Cập nhật thành tích thành công',
        data: {
          MaTV: payload.MaTV,
          MaLTT_Cu: payload.MaLTT_Cu,
          MaLTT_Moi: payload.MaLTT_Moi,
          NgayPhatSinh: payload.NgayPhatSinh
        }
      };
    } catch (error: any) {
      // Rollback nếu có lỗi
      await connection.rollback();
      throw error;
    } finally {
      // Release connection
      connection.release();
    }
  }

}
const thanhTichService = new ThanhTichService();
export default thanhTichService;