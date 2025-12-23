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
    MaTV?: string;  // ✅ ADDED: Search by Member ID
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
      // ✅ Tìm theo MaTV (Member ID)
      if (filters.MaTV) {
        sql += ' AND g.MaTV = ?';
        params.push(filters.MaTV);
      }

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
}

const thanhTichService = new ThanhTichService();
export default thanhTichService;