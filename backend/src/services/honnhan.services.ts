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

interface ThanhVienInfo extends RowDataPacket {
  MaTV: string;
  HoTen: string;
  GioiTinh: string;
  NgayGioSinh: Date;
  NgayGioMat: Date | null;
  TrangThai: string;
}

class HonNhanService {
  /**
   * Helper: Lấy thông tin thành viên
   */
  private async getThanhVienInfo(MaTV: string): Promise<ThanhVienInfo | null> {
    const sql = `
      SELECT MaTV, HoTen, GioiTinh, NgayGioSinh, NgayGioMat, TrangThai
      FROM THANHVIEN WHERE MaTV = ?
    `;
    const rows = await databaseService.query<ThanhVienInfo[]>(sql, [MaTV]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Helper: Kiểm tra thành viên có đang trong hôn nhân chưa kết thúc không
   */
  private async hasActiveMarriage(MaTV: string): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count FROM HONNHAN 
      WHERE (MaTV = ? OR MaTVVC = ?) AND NgayKetThuc IS NULL
    `;
    const rows = await databaseService.query<RowDataPacket[]>(sql, [MaTV, MaTV]);
    return rows[0].count > 0;
  }

  /**
   * Thiết lập quan hệ hôn nhân với đầy đủ validation
   */
  async thietLapHonNhan(payload: {
    MaTV: string;
    MaTVVC: string;
    NgayBatDau: Date;
    NgayKetThuc?: Date;
  }) {
    const { MaTV, MaTVVC, NgayBatDau, NgayKetThuc } = payload;

    // [0] VALIDATE: Các ngày không được lớn hơn hiện tại
    const now = new Date();
    const ngayKetHon = new Date(NgayBatDau);

    if (ngayKetHon > now) {
      throw new Error('Ngày bắt đầu hôn nhân không được lớn hơn ngày hiện tại');
    }

    if (NgayKetThuc) {
      const ngayKetThucDate = new Date(NgayKetThuc);
      if (ngayKetThucDate > now) {
        throw new Error('Ngày kết thúc hôn nhân không được lớn hơn ngày hiện tại');
      }
    }

    // [1] Lấy thông tin 2 thành viên
    const tv1 = await this.getThanhVienInfo(MaTV);
    const tv2 = await this.getThanhVienInfo(MaTVVC);

    if (!tv1) throw new Error(`Không tìm thấy thành viên với mã ${MaTV}`);
    if (!tv2) throw new Error(`Không tìm thấy thành viên với mã ${MaTVVC}`);

    // [2] VALIDATION: Khác giới tính (không cho phép cùng giới)
    if (tv1.GioiTinh === tv2.GioiTinh) {
      throw new Error('Quan hệ hôn nhân chỉ được phép giữa hai người khác giới tính!');
    }

    // [3] VALIDATION: Hai người đều còn sống
    if (tv1.TrangThai === 'Mất' || tv1.NgayGioMat) {
      const ngayMat1 = new Date(tv1.NgayGioMat!);
      if (ngayKetHon > ngayMat1) {
        throw new Error(`${tv1.HoTen} đã qua đời ngày ${ngayMat1.toLocaleDateString('vi-VN')}, không thể kết hôn sau ngày này!`);
      }
    }

    if (tv2.TrangThai === 'Mất' || tv2.NgayGioMat) {
      const ngayMat2 = new Date(tv2.NgayGioMat!);
      if (ngayKetHon > ngayMat2) {
        throw new Error(`${tv2.HoTen} đã qua đời ngày ${ngayMat2.toLocaleDateString('vi-VN')}, không thể kết hôn sau ngày này!`);
      }
    }

    // [4] VALIDATION: Ngày kết hôn phải sau ngày sinh của cả hai
    const ngaySinh1 = new Date(tv1.NgayGioSinh);
    const ngaySinh2 = new Date(tv2.NgayGioSinh);

    if (ngayKetHon <= ngaySinh1) {
      throw new Error(`Ngày kết hôn phải sau ngày sinh của ${tv1.HoTen}!`);
    }
    if (ngayKetHon <= ngaySinh2) {
      throw new Error(`Ngày kết hôn phải sau ngày sinh của ${tv2.HoTen}!`);
    }

    // [5] VALIDATION: Kiểm tra người 1 có đang trong hôn nhân không
    const hasActive1 = await this.hasActiveMarriage(MaTV);
    if (hasActive1) {
      throw new Error(`${tv1.HoTen} đang trong một hôn nhân chưa kết thúc! Hãy kết thúc hôn nhân hiện tại trước.`);
    }

    // [6] VALIDATION: Kiểm tra người 2 có đang trong hôn nhân không
    const hasActive2 = await this.hasActiveMarriage(MaTVVC);
    if (hasActive2) {
      throw new Error(`${tv2.HoTen} đang trong một hôn nhân chưa kết thúc! Hãy kết thúc hôn nhân hiện tại trước.`);
    }

    // [7] VALIDATION: Kiểm tra quan hệ hôn nhân đã tồn tại (cả 2 chiều)
    const checkDuplicateSql = `
      SELECT MaTV, MaTVVC FROM HONNHAN 
      WHERE (MaTV = ? AND MaTVVC = ?) 
         OR (MaTV = ? AND MaTVVC = ?)
    `;
    const existingRows = await databaseService.query<RowDataPacket[]>(
      checkDuplicateSql,
      [MaTV, MaTVVC, MaTVVC, MaTV]
    );

    if (existingRows.length > 0) {
      throw new Error('Quan hệ hôn nhân giữa hai thành viên này đã tồn tại!');
    }

    // [8] VALIDATION: Nếu có ngày kết thúc, phải sau ngày bắt đầu
    if (NgayKetThuc) {
      const ngayKetThucDate = new Date(NgayKetThuc);
      if (ngayKetThucDate <= ngayKetHon) {
        throw new Error('Ngày kết thúc hôn nhân phải sau ngày bắt đầu!');
      }
    }

    // [9] INSERT quan hệ hôn nhân
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
      if (error.code === 'ER_SIGNAL_EXCEPTION') {
        throw new Error(error.sqlMessage || 'Lỗi thiết lập hôn nhân!');
      }
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
        CASE WHEN h.MaTV = ? THEN h.MaTVVC ELSE h.MaTV END AS MaTVVC,
        CASE WHEN h.MaTV = ? THEN tv2.HoTen ELSE tv1.HoTen END AS HoTenVC,
        CASE WHEN h.MaTV = ? THEN tv2.GioiTinh ELSE tv1.GioiTinh END AS GioiTinh,
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

    const rows = await databaseService.query<HonNhanDetailRow[]>(sql, [MaTV, MaTV, MaTV, MaTV, MaTV]);
    return rows;
  }

  /**
   * Cập nhật ngày kết thúc hôn nhân (ly hôn) với validation
   */
  async ketThucHonNhan(MaTV: string, MaTVVC: string, NgayKetThuc: Date) {
    // [1] Lấy thông tin hôn nhân hiện tại
    const checkSql = `
      SELECT h.NgayBatDau, tv1.HoTen as HoTen1, tv2.HoTen as HoTen2
      FROM HONNHAN h
      JOIN THANHVIEN tv1 ON h.MaTV = tv1.MaTV
      JOIN THANHVIEN tv2 ON h.MaTVVC = tv2.MaTV
      WHERE (h.MaTV = ? AND h.MaTVVC = ?) OR (h.MaTV = ? AND h.MaTVVC = ?)
    `;
    const existing = await databaseService.query<RowDataPacket[]>(checkSql, [MaTV, MaTVVC, MaTVVC, MaTV]);

    if (existing.length === 0) {
      throw new Error('Không tìm thấy quan hệ hôn nhân để cập nhật');
    }

    const marriage = existing[0];
    const ngayBatDau = new Date(marriage.NgayBatDau);
    const ngayKetThucDate = new Date(NgayKetThuc);

    // [2] VALIDATION: Ngày kết thúc phải sau ngày bắt đầu
    if (ngayKetThucDate <= ngayBatDau) {
      throw new Error(`Ngày kết thúc (${ngayKetThucDate.toLocaleDateString('vi-VN')}) phải sau ngày bắt đầu hôn nhân (${ngayBatDau.toLocaleDateString('vi-VN')})!`);
    }

    // [3] UPDATE - thử cả 2 chiều
    const sql1 = `
      UPDATE HONNHAN 
      SET NgayKetThuc = ? 
      WHERE MaTV = ? AND MaTVVC = ?
    `;
    const result1 = await databaseService.query<ResultSetHeader>(sql1, [NgayKetThuc, MaTV, MaTVVC]);

    if (result1.affectedRows === 0) {
      // Thử chiều ngược lại
      const sql2 = `
        UPDATE HONNHAN 
        SET NgayKetThuc = ? 
        WHERE MaTV = ? AND MaTVVC = ?
      `;
      const result2 = await databaseService.query<ResultSetHeader>(sql2, [NgayKetThuc, MaTVVC, MaTV]);

      if (result2.affectedRows === 0) {
        throw new Error('Không tìm thấy quan hệ hôn nhân để cập nhật');
      }
    }

    return {
      message: 'Cập nhật kết thúc hôn nhân thành công',
      affectedRows: 1
    };
  }

  /**
   * Xóa quan hệ hôn nhân (hỗ trợ cả 2 chiều)
   */
  async xoaHonNhan(MaTV: string, MaTVVC: string) {
    // Thử xóa theo thứ tự đầu tiên
    const sql1 = `DELETE FROM HONNHAN WHERE MaTV = ? AND MaTVVC = ?`;
    const result1 = await databaseService.query<ResultSetHeader>(sql1, [MaTV, MaTVVC]);

    if (result1.affectedRows === 0) {
      // Thử chiều ngược lại
      const sql2 = `DELETE FROM HONNHAN WHERE MaTV = ? AND MaTVVC = ?`;
      const result2 = await databaseService.query<ResultSetHeader>(sql2, [MaTVVC, MaTV]);

      if (result2.affectedRows === 0) {
        throw new Error('Không tìm thấy quan hệ hôn nhân để xóa');
      }
    }

    return {
      message: 'Xóa quan hệ hôn nhân thành công',
      affectedRows: 1
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