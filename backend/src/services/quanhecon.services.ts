// src/services/quanhecon.services.ts
import QuanHeCon from '~/models/schemas/QuanHeCon.schema';
import databaseService from './database.services';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface QuanHeConRow extends RowDataPacket {
  MaTV: string;
  MaTVCha: string;
  MaTVMe: string;
  NgayPhatSinh: Date;
}

interface QuanHeConDetailRow extends RowDataPacket {
  MaTV: string;
  HoTenCon: string;
  MaTVCha: string;
  HoTenCha: string;
  MaTVMe: string;
  HoTenMe: string;
  NgayPhatSinh: Date;
}

class QuanHeConService {
  /**
   * Thiết lập quan hệ con cái
   * @param MaTV - Mã thành viên con
   * @param MaTVCha - Mã thành viên cha
   * @param MaTVMe - Mã thành viên mẹ
   * @param NgayPhatSinh - Ngày làm giấy khai sinh (optional, default CURRENT_TIMESTAMP)
   */
  async thietLapQuanHeCon(payload: {
    MaTV: string;
    MaTVCha: string;
    MaTVMe: string;
    NgayPhatSinh?: Date;
  }) {
    const quanHeCon = new QuanHeCon(payload);

    const sql = `
      INSERT INTO QUANHECON (MaTV, MaTVCha, MaTVMe, NgayPhatSinh) 
      VALUES (?, ?, ?, ?)
    `;

    const params = [
      quanHeCon.MaTV,
      quanHeCon.MaTVCha,
      quanHeCon.MaTVMe,
      quanHeCon.NgayPhatSinh || new Date()
    ];

    try {
      const result = await databaseService.query<ResultSetHeader>(sql, params);
      
      // Lấy thông tin chi tiết của quan hệ vừa tạo
      const detail = await this.getQuanHeConDetail(quanHeCon.MaTV);

      return {
        message: 'Thiết lập quan hệ con cái thành công',
        data: detail,
        affectedRows: result.affectedRows
      };
    } catch (error: any) {
      // Xử lý lỗi từ trigger
      if (error.code === 'ER_SIGNAL_EXCEPTION') {
        const errorMessage = error.sqlMessage || 'Lỗi khi thiết lập quan hệ con cái';
        throw new Error(errorMessage);
      }
      // Xử lý lỗi duplicate key (thành viên con đã có quan hệ cha mẹ)
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Thành viên này đã có quan hệ cha mẹ!');
      }
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết một quan hệ con cái
   */
  async getQuanHeConDetail(MaTV: string) {
    const sql = `
      SELECT 
        qhc.MaTV,
        tvcon.HoTen AS HoTenCon,
        qhc.MaTVCha,
        tvcha.HoTen AS HoTenCha,
        qhc.MaTVMe,
        tvme.HoTen AS HoTenMe,
        qhc.NgayPhatSinh
      FROM QUANHECON qhc
      LEFT JOIN THANHVIEN tvcon ON qhc.MaTV = tvcon.MaTV
      LEFT JOIN THANHVIEN tvcha ON qhc.MaTVCha = tvcha.MaTV
      LEFT JOIN THANHVIEN tvme ON qhc.MaTVMe = tvme.MaTV
      WHERE qhc.MaTV = ?
    `;

    const rows = await databaseService.query<QuanHeConDetailRow[]>(sql, [MaTV]);
    return rows[0] || null;
  }

  /**
   * Lấy tất cả quan hệ con cái
   */
  async getAllQuanHeCon() {
    const sql = `
      SELECT 
        qhc.MaTV,
        tvcon.HoTen AS HoTenCon,
        qhc.MaTVCha,
        tvcha.HoTen AS HoTenCha,
        qhc.MaTVMe,
        tvme.HoTen AS HoTenMe,
        qhc.NgayPhatSinh
      FROM QUANHECON qhc
      LEFT JOIN THANHVIEN tvcon ON qhc.MaTV = tvcon.MaTV
      LEFT JOIN THANHVIEN tvcha ON qhc.MaTVCha = tvcha.MaTV
      LEFT JOIN THANHVIEN tvme ON qhc.MaTVMe = tvme.MaTV
      ORDER BY qhc.NgayPhatSinh DESC
    `;

    const rows = await databaseService.query<QuanHeConDetailRow[]>(sql);
    return rows;
  }

  /**
   * Lấy danh sách con của một thành viên cụ thể (có thể là cha hoặc mẹ)
   */
  async getConByMaTV(MaTV: string) {
    const sql = `
      SELECT 
        qhc.MaTV,
        tvcon.HoTen AS HoTenCon,
        qhc.MaTVCha,
        tvcha.HoTen AS HoTenCha,
        qhc.MaTVMe,
        tvme.HoTen AS HoTenMe,
        qhc.NgayPhatSinh
      FROM QUANHECON qhc
      LEFT JOIN THANHVIEN tvcon ON qhc.MaTV = tvcon.MaTV
      LEFT JOIN THANHVIEN tvcha ON qhc.MaTVCha = tvcha.MaTV
      LEFT JOIN THANHVIEN tvme ON qhc.MaTVMe = tvme.MaTV
      WHERE qhc.MaTVCha = ? OR qhc.MaTVMe = ?
      ORDER BY qhc.NgayPhatSinh DESC
    `;

    const rows = await databaseService.query<QuanHeConDetailRow[]>(sql, [MaTV, MaTV]);
    return rows;
  }

  /**
   * Lấy thông tin cha mẹ của một thành viên
   */
  async getChaMe(MaTV: string) {
    const sql = `
      SELECT 
        qhc.MaTVCha,
        tvcha.HoTen AS HoTenCha,
        qhc.MaTVMe,
        tvme.HoTen AS HoTenMe,
        qhc.NgayPhatSinh
      FROM QUANHECON qhc
      LEFT JOIN THANHVIEN tvcha ON qhc.MaTVCha = tvcha.MaTV
      LEFT JOIN THANHVIEN tvme ON qhc.MaTVMe = tvme.MaTV
      WHERE qhc.MaTV = ?
    `;

    const rows = await databaseService.query<QuanHeConDetailRow[]>(sql, [MaTV]);
    return rows[0] || null;
  }

  /**
   * Xóa quan hệ con cái
   */
  async xoaQuanHeCon(MaTV: string) {
    const sql = `
      DELETE FROM QUANHECON 
      WHERE MaTV = ?
    `;

    try {
      const result = await databaseService.query<ResultSetHeader>(sql, [MaTV]);
      
      if (result.affectedRows === 0) {
        throw new Error('Không tìm thấy quan hệ con cái để xóa');
      }

      return {
        message: 'Xóa quan hệ con cái thành công',
        affectedRows: result.affectedRows
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Cập nhật quan hệ con cái (cập nhật cha, mẹ hoặc ngày phát sinh)
   */
  async capNhatQuanHeCon(payload: {
    MaTV: string;
    MaTVCha?: string;
    MaTVMe?: string;
    NgayPhatSinh?: Date;
  }) {
    const { MaTV, MaTVCha, MaTVMe, NgayPhatSinh } = payload;

    // Build dynamic SQL
    const updates: string[] = [];
    const params: any[] = [];

    if (MaTVCha !== undefined) {
      updates.push('MaTVCha = ?');
      params.push(MaTVCha);
    }
    if (MaTVMe !== undefined) {
      updates.push('MaTVMe = ?');
      params.push(MaTVMe);
    }
    if (NgayPhatSinh !== undefined) {
      updates.push('NgayPhatSinh = ?');
      params.push(NgayPhatSinh);
    }

    if (updates.length === 0) {
      throw new Error('Không có thông tin nào để cập nhật');
    }

    params.push(MaTV);

    const sql = `
      UPDATE QUANHECON 
      SET ${updates.join(', ')}
      WHERE MaTV = ?
    `;

    try {
      const result = await databaseService.query<ResultSetHeader>(sql, params);
      
      if (result.affectedRows === 0) {
        throw new Error('Không tìm thấy quan hệ con cái để cập nhật');
      }

      // Lấy thông tin chi tiết sau khi cập nhật
      const detail = await this.getQuanHeConDetail(MaTV);

      return {
        message: 'Cập nhật quan hệ con cái thành công',
        data: detail,
        affectedRows: result.affectedRows
      };
    } catch (error: any) {
      // Xử lý lỗi từ trigger
      if (error.code === 'ER_SIGNAL_EXCEPTION') {
        const errorMessage = error.sqlMessage || 'Lỗi khi cập nhật quan hệ con cái';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}

const quanHeConService = new QuanHeConService();
export default quanHeConService;