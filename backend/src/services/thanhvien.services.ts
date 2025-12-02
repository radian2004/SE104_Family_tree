// src/services/thanhvien.services.ts
import ThanhVien from '~/models/schemas/ThanhVien.schema';
import databaseService from './database.services';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ThanhVienRow extends RowDataPacket {
  MaTV: string;
  HoTen: string;
  NgayGioSinh: Date;
  DiaChi: string;
  TrangThai: string;
  TGTaoMoi: Date;
  DOI: number;
  MaQueQuan: string;
  MaNgheNghiep: string;
  MaGioiTinh: string;
  MaGiaPha: string | null;
}

class ThanhVienService {
  // Đăng ký thành viên mới
  async register(payload: {
    HoTen: string;
    NgayGioSinh: Date;
    DiaChi: string;
    MaQueQuan: string;
    MaNgheNghiep: string;
    MaGioiTinh: string;
    MaGiaPha?: string;
  }) {
    const thanhvien = new ThanhVien(payload);

    // INSERT không cần MaTV vì trigger TRG_GEN_ID_THANHVIEN sẽ tự sinh
    const sql = `
      INSERT INTO THANHVIEN (
        HoTen, NgayGioSinh, DiaChi, TrangThai, 
        DOI, MaQueQuan, MaNgheNghiep, MaGioiTinh, MaGiaPha
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      thanhvien.HoTen,
      thanhvien.NgayGioSinh,
      thanhvien.DiaChi,
      thanhvien.TrangThai,
      thanhvien.DOI,
      thanhvien.MaQueQuan,
      thanhvien.MaNgheNghiep,
      thanhvien.MaGioiTinh,
      thanhvien.MaGiaPha || null
    ];

    const result = await databaseService.query<ResultSetHeader>(sql, params);

    // Lấy thành viên vừa tạo (dùng LAST_INSERT_ID không được vì MaTV là VARCHAR)
    // Thay vào đó query lại theo insertId hoặc dùng cách khác
    const [newThanhVien] = await databaseService.query<ThanhVienRow[]>(
      'SELECT * FROM THANHVIEN ORDER BY TGTaoMoi DESC LIMIT 1'
    );

    return {
      message: 'Đăng ký thành viên thành công',
      data: newThanhVien
    };
  }

  // Tìm thành viên theo MaTV
  async findByMaTV(MaTV: string) {
    const sql = 'SELECT * FROM THANHVIEN WHERE MaTV = ?';
    const [rows] = await databaseService.query<ThanhVienRow[]>(sql, [MaTV]);
    return rows;
  }

  // Tìm thành viên theo HoTen
  async findByName(HoTen: string) {
    const sql = 'SELECT * FROM THANHVIEN WHERE HoTen LIKE ?';
    const rows = await databaseService.query<ThanhVienRow[]>(sql, [`%${HoTen}%`]);
    return rows;
  }

  // Lấy tất cả thành viên
  async getAllThanhVien() {
    const sql = 'SELECT * FROM THANHVIEN ORDER BY DOI, TGTaoMoi';
    const rows = await databaseService.query<ThanhVienRow[]>(sql);
    return rows;
  }

  // Cập nhật thông tin thành viên
  async updateThanhVien(MaTV: string, payload: Partial<ThanhVien>) {
    const fields: string[] = [];
    const values: any[] = [];

    // Chỉ update các field được truyền vào
    if (payload.HoTen !== undefined) {
      fields.push('HoTen = ?');
      values.push(payload.HoTen);
    }
    if (payload.NgayGioSinh !== undefined) {
      fields.push('NgayGioSinh = ?');
      values.push(payload.NgayGioSinh);
    }
    if (payload.DiaChi !== undefined) {
      fields.push('DiaChi = ?');
      values.push(payload.DiaChi);
    }
    if (payload.MaQueQuan !== undefined) {
      fields.push('MaQueQuan = ?');
      values.push(payload.MaQueQuan);
    }
    if (payload.MaNgheNghiep !== undefined) {
      fields.push('MaNgheNghiep = ?');
      values.push(payload.MaNgheNghiep);
    }
    if (payload.MaGiaPha !== undefined) {
      fields.push('MaGiaPha = ?');
      values.push(payload.MaGiaPha);
    }

    if (fields.length === 0) {
      throw new Error('Không có trường nào để cập nhật');
    }

    values.push(MaTV); // Thêm MaTV vào cuối cho WHERE clause

    const sql = `UPDATE THANHVIEN SET ${fields.join(', ')} WHERE MaTV = ?`;
    const result = await databaseService.query<ResultSetHeader>(sql, values);

    return {
      message: 'Cập nhật thành công',
      affectedRows: result.affectedRows
    };
  }

  // Xóa thành viên
  async deleteThanhVien(MaTV: string) {
    const sql = 'DELETE FROM THANHVIEN WHERE MaTV = ?';
    const result = await databaseService.query<ResultSetHeader>(sql, [MaTV]);

    return {
      message: 'Xóa thành công',
      affectedRows: result.affectedRows
    };
  }
}

const thanhvienService = new ThanhVienService();
export default thanhvienService;