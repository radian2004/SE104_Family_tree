// src/services/honnhan.services.ts
import HonNhan from '~/models/schemas/HonNhan.schema';
import databaseService from './database.services';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface HonNhanRow extends RowDataPacket {
  MaTV: string;
  MaTVVC: string;
  NgayBatDau: Date;
  NgayKetThuc: Date | null;
}

interface HonNhanDetailRow extends RowDataPacket {
  MaTV: string;
  HoTenTV: string;
  MaTVVC: string;
  HoTenVC: string;
  NgayBatDau: Date;
  NgayKetThuc: Date | null;
  TrangThaiHonNhan: string;
}

class HonNhanService {
  /**
   * Thiết lập quan hệ hôn nhân
   * @param MaTV - Mã thành viên trong gia phả
   * @param MaTVVC - Mã vợ/chồng (chưa có trong gia phả)
   * @param NgayBatDau - Ngày đăng ký kết hôn
   * @param NgayKetThuc - Ngày kết thúc hôn nhân (optional)
   */
  async thietLapHonNhan(payload: {
    MaTV: string;
    MaTVVC: string;
    NgayBatDau: Date;
    NgayKetThuc?: Date;
  }) {
    const honNhan = new HonNhan(payload);

    const sql = `
      INSERT INTO HONNHAN (MaTV, MaTVVC, NgayBatDau, NgayKetThuc) 
      VALUES (?, ?, ?, ?)
    `;

    const params = [
      honNhan.MaTV,
      honNhan.MaTVVC,
      honNhan.NgayBatDau,
      honNhan.NgayKetThuc || null
    ];

    try {
      const result = await databaseService.query<ResultSetHeader>(sql, params);
      
      // Lấy thông tin chi tiết của quan hệ vừa tạo
      const detail = await this.getHonNhanDetail(honNhan.MaTV, honNhan.MaTVVC);

      return {
        message: 'Thiết lập quan hệ hôn nhân thành công',
        data: detail,
        affectedRows: result.affectedRows
      };
    } catch (error: any) {
      // Xử lý lỗi từ trigger
      if (error.code === 'ER_SIGNAL_EXCEPTION') {
        throw new Error(error.sqlMessage || 'Ngày kết hôn phải sau ngày sinh thành viên!');
      }
      // Xử lý lỗi duplicate key (quan hệ đã tồn tại)
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Quan hệ hôn nhân giữa hai thành viên này đã tồn tại!');
      }
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết một quan hệ hôn nhân
   */
  async getHonNhanDetail(MaTV: string, MaTVVC: string) {
    const sql = `
      SELECT 
        h.MaTV,
        tv1.HoTen AS HoTenTV,
        h.MaTVVC,
        tv2.HoTen AS HoTenVC,
        h.NgayBatDau,
        h.NgayKetThuc,
        CASE 
          WHEN h.NgayKetThuc IS NULL THEN 'Đang hôn nhân'
          ELSE 'Đã kết thúc'
        END AS TrangThaiHonNhan
      FROM HONNHAN h
      JOIN THANHVIEN tv1 ON h.MaTV = tv1.MaTV
      JOIN THANHVIEN tv2 ON h.MaTVVC = tv2.MaTV
      WHERE h.MaTV = ? AND h.MaTVVC = ?
    `;

    const [rows] = await databaseService.query<HonNhanDetailRow[]>(sql, [MaTV, MaTVVC]);
    return rows;
  }

  /**
   * Lấy tất cả quan hệ hôn nhân
   */
  async getAllHonNhan() {
    const sql = `
      SELECT 
        h.MaTV,
        tv1.HoTen AS HoTenTV,
        h.MaTVVC,
        tv2.HoTen AS HoTenVC,
        h.NgayBatDau,
        h.NgayKetThuc,
        CASE 
          WHEN h.NgayKetThuc IS NULL THEN 'Đang hôn nhân'
          ELSE 'Đã kết thúc'
        END AS TrangThaiHonNhan
      FROM HONNHAN h
      JOIN THANHVIEN tv1 ON h.MaTV = tv1.MaTV
      JOIN THANHVIEN tv2 ON h.MaTVVC = tv2.MaTV
      ORDER BY h.NgayBatDau DESC
    `;

    const rows = await databaseService.query<HonNhanDetailRow[]>(sql);
    return rows;
  }

  /**
   * Lấy danh sách quan hệ hôn nhân của một thành viên cụ thể
   */
  async getHonNhanByMaTV(MaTV: string) {
    const sql = `
      SELECT 
        h.MaTV,
        tv1.HoTen AS HoTenTV,
        h.MaTVVC,
        tv2.HoTen AS HoTenVC,
        h.NgayBatDau,
        h.NgayKetThuc,
        CASE 
          WHEN h.NgayKetThuc IS NULL THEN 'Đang hôn nhân'
          ELSE 'Đã kết thúc'
        END AS TrangThaiHonNhan
      FROM HONNHAN h
      JOIN THANHVIEN tv1 ON h.MaTV = tv1.MaTV
      JOIN THANHVIEN tv2 ON h.MaTVVC = tv2.MaTV
      WHERE h.MaTV = ? OR h.MaTVVC = ?
      ORDER BY h.NgayBatDau DESC
    `;

    const rows = await databaseService.query<HonNhanDetailRow[]>(sql, [MaTV, MaTV]);
    return rows;
  }

  /**
   * Cập nhật ngày kết thúc hôn nhân (ly hôn)
   */
  async ketThucHonNhan(MaTV: string, MaTVVC: string, NgayKetThuc: Date) {
    const sql = `
      UPDATE HONNHAN 
      SET NgayKetThuc = ? 
      WHERE MaTV = ? AND MaTVVC = ?
    `;

    const result = await databaseService.query<ResultSetHeader>(sql, [NgayKetThuc, MaTV, MaTVVC]);

    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy quan hệ hôn nhân để cập nhật');
    }

    return {
      message: 'Cập nhật kết thúc hôn nhân thành công',
      affectedRows: result.affectedRows
    };
  }

  /**
   * Xóa quan hệ hôn nhân
   */
  async xoaHonNhan(MaTV: string, MaTVVC: string) {
    const sql = `
      DELETE FROM HONNHAN 
      WHERE MaTV = ? AND MaTVVC = ?
    `;

    const result = await databaseService.query<ResultSetHeader>(sql, [MaTV, MaTVVC]);

    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy quan hệ hôn nhân để xóa');
    }

    return {
      message: 'Xóa quan hệ hôn nhân thành công',
      affectedRows: result.affectedRows
    };
  }

  /**
   * Lấy danh sách thành viên chưa có trong gia phả (để chọn làm vợ/chồng)
   */
  async getThanhVienKhongCoGiaPha() {
    const sql = `
      SELECT 
        MaTV,
        HoTen,
        NgayGioSinh,
        GioiTinh,
        DiaChi
      FROM THANHVIEN 
      WHERE MaGiaPha IS NULL
      ORDER BY HoTen
    `;

    const rows = await databaseService.query<RowDataPacket[]>(sql);
    return rows;
  }

  /**
   * Lấy danh sách thành viên trong gia phả cụ thể (để chọn làm người thiết lập hôn nhân)
   */
  async getThanhVienTrongGiaPha(MaGiaPha: string) {
    const sql = `
      SELECT 
        MaTV,
        HoTen,
        NgayGioSinh,
        GioiTinh,
        DiaChi,
        DOI
      FROM THANHVIEN 
      WHERE MaGiaPha = ?
      ORDER BY DOI, HoTen
    `;

    const rows = await databaseService.query<RowDataPacket[]>(sql, [MaGiaPha]);
    return rows;
  }
}

export default new HonNhanService();