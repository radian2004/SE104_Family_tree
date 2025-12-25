// src/services/thanhvien.services.ts
import ThanhVien from '~/models/schemas/ThanhVien.schema';
import databaseService from './database.services';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { 
  GhiNhanThanhVienReqBody, 
  ThanhVienCuInfo,
  GhiNhanThanhVienResponse 
} from '~/models/requests/GhiNhanThanhVien.requests';
import { 
  TraCuuThanhVienQuery,
  TraCuuThanhVienResult,
  TraCuuThanhVienResponse 
} from '~/models/requests/TraCuuThanhVien.requests';

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
  GioiTinh: string;  // ✅ ĐÚNG: VARCHAR(3) - 'Nam'/'Nữ'
  MaNguyenNhanMat: string | null;  // ✅ THÊM: Cột này có trong DB
  NgayGioMat: Date | null;  // ✅ THÊM: Cột này có trong DB
  MaDiaDiem: string | null;  // ✅ THÊM: Cột này có trong DB
  MaGiaPha: string | null;
}

interface QuanHeConRow extends RowDataPacket {
  MaTV: string;
  MaTVCha: string | null;
  MaTVMe: string | null;
  NgayPhatSinh: Date;
}

interface QuanHeVoChongRow extends RowDataPacket {
  MaTV: string;
  MaTVVC: string;
  NgayBatDau: Date;
  NgayKetThuc: Date | null;
}

class ThanhVienService {
  // Đăng ký thành viên mới
async register(payload: {
  HoTen: string;
  NgayGioSinh: Date;
  DiaChi: string;
  MaQueQuan: string;
  MaNgheNghiep: string;
  GioiTinh: string;  // ✅ ĐÚNG: 'Nam' hoặc 'Nữ'
  MaGiaPha?: string;
}) {
    const thanhvien = new ThanhVien(payload);

    // INSERT không cần MaTV vì trigger TRG_GEN_ID_THANHVIEN sẽ tự sinh
const sql = `
  INSERT INTO THANHVIEN (
    HoTen, NgayGioSinh, DiaChi, TrangThai, 
    DOI, MaQueQuan, MaNgheNghiep, GioiTinh, MaGiaPha
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
  thanhvien.GioiTinh,  // ✅ ĐÚNG
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
  if (payload.GioiTinh !== undefined) {  // ✅ THÊM
    fields.push('GioiTinh = ?');
    values.push(payload.GioiTinh);
  }
  if (payload.MaNguyenNhanMat !== undefined) {  // ✅ THÊM
    fields.push('MaNguyenNhanMat = ?');
    values.push(payload.MaNguyenNhanMat);
  }
  if (payload.NgayGioMat !== undefined) {  // ✅ THÊM
    fields.push('NgayGioMat = ?');
    values.push(payload.NgayGioMat);
  }
  if (payload.MaDiaDiem !== undefined) {  // ✅ THÊM
    fields.push('MaDiaDiem = ?');
    values.push(payload.MaDiaDiem);
  }
  if (payload.MaGiaPha !== undefined) {
    fields.push('MaGiaPha = ?');
    values.push(payload.MaGiaPha);
  }

  if (fields.length === 0) {
    throw new Error('Không có trường nào để cập nhật');
  }

  values.push(MaTV);
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

  /**
   * ✅ MỚI: Lấy báo cáo tăng giảm thành viên theo khoảng năm
   * Thống kê: Số sinh, số kết hôn, số mất theo từng năm
   * CHỈ HIỂN THỊ những năm có ít nhất 1 sự kiện (bỏ qua năm có cả 3 đều = 0)
   */
  async getBaoCaoTangGiam(NamBatDau: number, NamKetThuc: number) {
    // Validate input
    if (NamBatDau > NamKetThuc) {
      throw new Error('Năm bắt đầu không được lớn hơn năm kết thúc');
    }

    const currentYear = new Date().getFullYear();
    if (NamKetThuc > currentYear) {
      throw new Error(`Năm kết thúc không được vượt quá năm hiện tại (${currentYear})`);
    }

    // Query chỉ lấy những năm có sự kiện (sinh/kết hôn/mất)
    // Sử dụng UNION để gộp tất cả các năm có sự kiện, sau đó tính tổng
    const sql = `
      WITH AllYears AS (
        -- Lấy tất cả các năm có sinh
        SELECT DISTINCT YEAR(NgayGioSinh) as Nam
        FROM THANHVIEN
        WHERE YEAR(NgayGioSinh) BETWEEN ? AND ?
        
        UNION
        
        -- Lấy tất cả các năm có kết hôn
        SELECT DISTINCT YEAR(NgayBatDau) as Nam
        FROM QUANHEVOCHONG
        WHERE YEAR(NgayBatDau) BETWEEN ? AND ?
        
        UNION
        
        -- Lấy tất cả các năm có mất
        SELECT DISTINCT YEAR(NgayGioMat) as Nam
        FROM THANHVIEN
        WHERE YEAR(NgayGioMat) BETWEEN ? AND ?
          AND NgayGioMat IS NOT NULL
      )
      SELECT 
        ROW_NUMBER() OVER (ORDER BY ay.Nam) AS STT,
        ay.Nam,
        COALESCE(
          (SELECT COUNT(*) FROM THANHVIEN 
           WHERE YEAR(NgayGioSinh) = ay.Nam), 0
        ) AS SoLuongSinh,
        COALESCE(
          (SELECT COUNT(*) FROM QUANHEVOCHONG 
           WHERE YEAR(NgayBatDau) = ay.Nam AND MaTV < MaTVVC), 0
        ) AS SoLuongKetHon,
        COALESCE(
          (SELECT COUNT(*) FROM THANHVIEN 
           WHERE YEAR(NgayGioMat) = ay.Nam AND NgayGioMat IS NOT NULL), 0
        ) AS SoLuongMat
      FROM AllYears ay
      ORDER BY ay.Nam
    `;

    interface BaoCaoRow extends RowDataPacket {
      STT: number;
      Nam: number;
      SoLuongSinh: number;
      SoLuongKetHon: number;
      SoLuongMat: number;
    }

    const rows = await databaseService.query<BaoCaoRow[]>(sql, [
      NamBatDau,
      NamKetThuc,
      NamBatDau,
      NamKetThuc,
      NamBatDau,
      NamKetThuc
    ]);

    // Tính tổng
    const tongSinh = rows.reduce((sum, row) => sum + row.SoLuongSinh, 0);
    const tongKetHon = rows.reduce((sum, row) => sum + row.SoLuongKetHon, 0);
    const tongMat = rows.reduce((sum, row) => sum + row.SoLuongMat, 0);
    const tangGiamRong = tongSinh - tongMat;

    return {
      NamBatDau,
      NamKetThuc,
      TongSinh: tongSinh,
      TongKetHon: tongKetHon,
      TongMat: tongMat,
      TangGiamRong: tangGiamRong,
      DanhSach: rows
    };
  }

  // ========================================
  // METHODS MỚI - GHI NHẬN THÀNH VIÊN
  // ========================================

  /**
   * Lấy thông tin thành viên cũ để validate và hiển thị
   */
  async getThanhVienCu(MaTV: string): Promise<ThanhVienCuInfo | null> {
    const sql = `
      SELECT MaTV, HoTen, GioiTinh, NgayGioSinh, DOI, MaGiaPha
      FROM THANHVIEN
      WHERE MaTV = ?
    `;
    const rows = await databaseService.query<ThanhVienRow[]>(sql, [MaTV]);
    
    if (!rows || rows.length === 0) {
      return null;
    }
    
    return rows[0] as unknown as ThanhVienCuInfo;
  }

  /**
   * Kiểm tra thành viên cũ đã có vợ/chồng chưa
   */
  async checkExistingSpouse(MaTV: string): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count
      FROM QUANHEVOCHONG
      WHERE (MaTV = ? OR MaTVVC = ?) AND NgayKetThuc IS NULL
    `;
    const rows = await databaseService.query<any[]>(sql, [MaTV, MaTV]);
    return rows[0]?.count > 0;
  }

    /**
   * Kiểm tra thành viên con đã tồn tại chưa
   * Dựa trên: HoTen + NgayGioSinh + MaTVCha/MaTVMe
   */
  async checkDuplicateChild(
    HoTen: string, 
    NgayGioSinh: string, 
    MaTVCha: string | null,
    MaTVMe: string | null
  ): Promise<boolean> {
    let sql = '';
    let params: any[] = [];
    
    if (MaTVCha) {
      // Kiểm tra con của cha
      sql = `
        SELECT COUNT(*) as count
        FROM THANHVIEN tv
        INNER JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
        WHERE tv.HoTen = ? 
          AND DATE(tv.NgayGioSinh) = DATE(?)
          AND qhc.MaTVCha = ?
      `;
      params = [HoTen, NgayGioSinh, MaTVCha];
    } else if (MaTVMe) {
      // Kiểm tra con của mẹ
      sql = `
        SELECT COUNT(*) as count
        FROM THANHVIEN tv
        INNER JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
        WHERE tv.HoTen = ? 
          AND DATE(tv.NgayGioSinh) = DATE(?)
          AND qhc.MaTVMe = ?
      `;
      params = [HoTen, NgayGioSinh, MaTVMe];
    } else {
      return false; // Không có cha/mẹ thì không kiểm tra được
    }
    
    const rows = await databaseService.query<any[]>(sql, params);
    return rows[0]?.count > 0;
  }

  /**
   * Kiểm tra thành viên vợ/chồng đã tồn tại chưa
   * Dựa trên: HoTen + NgayGioSinh + GioiTinh
   */
  async checkDuplicatePerson(
    HoTen: string, 
    NgayGioSinh: string,
    GioiTinh: string
  ): Promise<{ exists: boolean; MaTV?: string }> {
    const sql = `
      SELECT MaTV
      FROM THANHVIEN
      WHERE HoTen = ? 
        AND DATE(NgayGioSinh) = DATE(?)
        AND GioiTinh = ?
      LIMIT 1
    `;
    
    const rows = await databaseService.query<ThanhVienRow[]>(
      sql, 
      [HoTen, NgayGioSinh, GioiTinh]
    );
    
    if (rows.length > 0) {
      return { exists: true, MaTV: rows[0].MaTV };
    }
    
    return { exists: false };
  }

  /**
   * Ghi nhận thành viên mới với quan hệ
   * Sử dụng TRANSACTION để đảm bảo tính toàn vẹn dữ liệu
   */
  async ghiNhanThanhVien(payload: GhiNhanThanhVienReqBody): Promise<GhiNhanThanhVienResponse> {
    const connection = await databaseService.getConnection();
    
    try {
      // Bắt đầu transaction
      await connection.beginTransaction();
      
      // [1] Validate: Lấy thông tin thành viên cũ
      const thanhvienCu = await this.getThanhVienCuWithConnection(connection, payload.MaTVCu);
      if (!thanhvienCu) {
        throw new Error(`Không tìm thấy thành viên cũ với mã ${payload.MaTVCu}`);
      }
      
            // [2] Validate logic nghiệp vụ theo loại quan hệ
      if (payload.LoaiQuanHe === 'Con cái') {
        // Thành viên cũ phải có giới tính hợp lệ (trigger sẽ check thêm)
        if (thanhvienCu.GioiTinh !== 'Nam' && thanhvienCu.GioiTinh !== 'Nữ') {
          throw new Error('Thành viên cũ phải có giới tính hợp lệ');
        }
        
        // ✅ THÊM MỚI: Kiểm tra trùng lặp con
        const isDuplicateChild = await this.checkDuplicateChildWithConnection(
          connection,
          payload.HoTen,
          payload.NgayGioSinh,
          thanhvienCu.GioiTinh === 'Nam' ? payload.MaTVCu : null,
          thanhvienCu.GioiTinh === 'Nữ' ? payload.MaTVCu : null
        );
        
        if (isDuplicateChild) {
          throw new Error(
            `Đã tồn tại con cùng tên "${payload.HoTen}" và ngày sinh "${payload.NgayGioSinh}" của thành viên này`
          );
        }
        
        // Kiểm tra ngày sinh con phải sau ngày sinh cha/mẹ
        const ngaySinhCon = new Date(payload.NgayGioSinh);
        const ngaySinhCha = new Date(thanhvienCu.NgayGioSinh);
        if (ngaySinhCon <= ngaySinhCha) {
          throw new Error('Ngày sinh của con phải sau ngày sinh của cha/mẹ');
        }
        } else if (payload.LoaiQuanHe === 'Vợ/Chồng') {
        // Kiểm tra thành viên cũ đã có vợ/chồng chưa
        const hasSpouse = await this.checkExistingSpouseWithConnection(connection, payload.MaTVCu);
        if (hasSpouse) {
          throw new Error('Thành viên cũ đã có vợ/chồng hiện tại');
        }
        
        // ✅ THÊM MỚI: Kiểm tra người này đã tồn tại trong hệ thống chưa
        const duplicatePerson = await this.checkDuplicatePersonWithConnection(
          connection,
          payload.HoTen,
          payload.NgayGioSinh,
          payload.GioiTinh
        );
        
        if (duplicatePerson.exists) {
          throw new Error(
            `Người này đã tồn tại trong hệ thống với mã ${duplicatePerson.MaTV}. ` +
            `Không thể ghi nhận lại. Hãy sử dụng chức năng "Thêm quan hệ hôn nhân" nếu muốn kết nối.`
          );
        }
      }
      
      // [3] INSERT thành viên mới vào bảng THANHVIEN
      const insertThanhVienSql = `
        INSERT INTO THANHVIEN (
          HoTen, NgayGioSinh, DiaChi, TrangThai, 
          DOI, MaQueQuan, MaNgheNghiep, GioiTinh
        ) VALUES (?, ?, ?, 'Còn Sống', 0, ?, ?, ?)
      `;
      
      await connection.execute(insertThanhVienSql, [
        payload.HoTen,
        payload.NgayGioSinh,
        payload.DiaChi,
        payload.MaQueQuan,
        payload.MaNgheNghiep || null,
        payload.GioiTinh
      ]);
      
      // [4] Lấy MaTV của thành viên vừa tạo (trigger tự gen)
      const [newMemberRows] = await connection.query<ThanhVienRow[]>(
        'SELECT * FROM THANHVIEN ORDER BY TGTaoMoi DESC LIMIT 1'
      );
      const newMember = newMemberRows[0];
      
      if (!newMember) {
        throw new Error('Không thể lấy thông tin thành viên vừa tạo');
      }
      
      // [5] INSERT quan hệ tương ứng
      if (payload.LoaiQuanHe === 'Con cái') {
        // Xác định cha/mẹ dựa trên giới tính thành viên cũ
        let insertQuanHeConSql: string;
        let quanHeParams: any[];
        
        if (thanhvienCu.GioiTinh === 'Nam') {
          // Thành viên cũ là CHA
          insertQuanHeConSql = `
            INSERT INTO QUANHECON (MaTV, MaTVCha, NgayPhatSinh)
            VALUES (?, ?, ?)
          `;
          quanHeParams = [newMember.MaTV, payload.MaTVCu, payload.NgayPhatSinh];
        } else {
          // Thành viên cũ là MẸ
          insertQuanHeConSql = `
            INSERT INTO QUANHECON (MaTV, MaTVMe, NgayPhatSinh)
            VALUES (?, ?, ?)
          `;
          quanHeParams = [newMember.MaTV, payload.MaTVCu, payload.NgayPhatSinh];
        }
        
        await connection.execute(insertQuanHeConSql, quanHeParams);
        
      } else if (payload.LoaiQuanHe === 'Vợ/Chồng') {
        // Xác định ai là MaTV (trong gia phả) và ai là MaTVVC (vợ/chồng)
        // Thường MaTV là người ĐÃ có trong gia phả (thành viên cũ)
        // MaTVVC là người mới vào (thành viên mới)
        const insertQuanHeVoChongSql = `
          INSERT INTO QUANHEVOCHONG (MaTV, MaTVVC, NgayBatDau, NgayKetThuc)
          VALUES (?, ?, ?, NULL)
        `;
        
        await connection.execute(insertQuanHeVoChongSql, [
          payload.MaTVCu,     // Thành viên cũ (trong gia phả)
          newMember.MaTV,     // Thành viên mới (vợ/chồng từ ngoài)
          payload.NgayPhatSinh // Ngày kết hôn
        ]);
      }
      
      // [6] Lấy lại thông tin thành viên mới sau khi trigger cập nhật DOI và MaGiaPha
      const [updatedMemberRows] = await connection.query<ThanhVienRow[]>(
        'SELECT * FROM THANHVIEN WHERE MaTV = ?',
        [newMember.MaTV]
      );
      const updatedMember = updatedMemberRows[0];
      
      // [7] Commit transaction
      await connection.commit();
      
      // [8] Trả về kết quả
      return {
        message: 'Ghi nhận thành viên thành công',
        data: {
          MaTVMoi: updatedMember.MaTV,
          HoTen: updatedMember.HoTen,
          NgayGioSinh: updatedMember.NgayGioSinh,
          GioiTinh: updatedMember.GioiTinh,
          DiaChi: updatedMember.DiaChi,
          DOI: updatedMember.DOI,
          MaGiaPha: updatedMember.MaGiaPha || '',
          QuanHe: {
            LoaiQuanHe: payload.LoaiQuanHe,
            TenThanhVienCu: thanhvienCu.HoTen,
            MaTVCu: payload.MaTVCu,
            NgayPhatSinh: payload.NgayPhatSinh
          }
        }
      };
      
    } catch (error) {
      // Rollback nếu có lỗi
      await connection.rollback();
      throw error;
    } finally {
      // Release connection
      connection.release();
    }
  }

  /**
   * Helper: Lấy thông tin thành viên cũ với connection (trong transaction)
   */
  private async getThanhVienCuWithConnection(
    connection: PoolConnection, 
    MaTV: string
  ): Promise<ThanhVienCuInfo | null> {
    const sql = `
      SELECT MaTV, HoTen, GioiTinh, NgayGioSinh, DOI, MaGiaPha
      FROM THANHVIEN
      WHERE MaTV = ?
    `;
    const [rows] = await connection.query<ThanhVienRow[]>(sql, [MaTV]);
    
    if (!rows || rows.length === 0) {
      return null;
    }
    
    return rows[0] as unknown as ThanhVienCuInfo;
  }

  /**
   * Helper: Kiểm tra có vợ/chồng với connection (trong transaction)
   */
  private async checkExistingSpouseWithConnection(
    connection: PoolConnection, 
    MaTV: string
  ): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count
      FROM QUANHEVOCHONG
      WHERE (MaTV = ? OR MaTVVC = ?) AND NgayKetThuc IS NULL
    `;
    const [rows] = await connection.query<any[]>(sql, [MaTV, MaTV]);
    return rows[0]?.count > 0;
  }
    /**
   * Helper: Kiểm tra duplicate child với connection (trong transaction)
   */
  private async checkDuplicateChildWithConnection(
    connection: PoolConnection,
    HoTen: string, 
    NgayGioSinh: string, 
    MaTVCha: string | null,
    MaTVMe: string | null
  ): Promise<boolean> {
    let sql = '';
    let params: any[] = [];
    
    if (MaTVCha) {
      sql = `
        SELECT COUNT(*) as count
        FROM THANHVIEN tv
        INNER JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
        WHERE tv.HoTen = ? 
          AND DATE(tv.NgayGioSinh) = DATE(?)
          AND qhc.MaTVCha = ?
      `;
      params = [HoTen, NgayGioSinh, MaTVCha];
    } else if (MaTVMe) {
      sql = `
        SELECT COUNT(*) as count
        FROM THANHVIEN tv
        INNER JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
        WHERE tv.HoTen = ? 
          AND DATE(tv.NgayGioSinh) = DATE(?)
          AND qhc.MaTVMe = ?
      `;
      params = [HoTen, NgayGioSinh, MaTVMe];
    } else {
      return false;
    }
    
    const [rows] = await connection.query<any[]>(sql, params);
    return rows[0]?.count > 0;
  }

  /**
   * Helper: Kiểm tra duplicate person với connection (trong transaction)
   */
  private async checkDuplicatePersonWithConnection(
    connection: PoolConnection,
    HoTen: string, 
    NgayGioSinh: string,
    GioiTinh: string
  ): Promise<{ exists: boolean; MaTV?: string }> {
    const sql = `
      SELECT MaTV
      FROM THANHVIEN
      WHERE HoTen = ? 
        AND DATE(NgayGioSinh) = DATE(?)
        AND GioiTinh = ?
      LIMIT 1
    `;
    
    const [rows] = await connection.query<ThanhVienRow[]>(
      sql, 
      [HoTen, NgayGioSinh, GioiTinh]
    );
    
    if (rows.length > 0) {
      return { exists: true, MaTV: rows[0].MaTV };
    }
    
    return { exists: false };
  }
  /**
   * Lấy danh sách thành viên có thể làm cha/mẹ (để hiển thị dropdown)
   * Chỉ lấy những thành viên còn sống
   */
  async getAvailableParents(): Promise<ThanhVienRow[]> {
    const sql = `
      SELECT MaTV, HoTen, GioiTinh, NgayGioSinh, DOI, MaGiaPha
      FROM THANHVIEN
      WHERE TrangThai = 'Còn Sống'
      ORDER BY DOI, HoTen
    `;
    const rows = await databaseService.query<ThanhVienRow[]>(sql);
    return rows;
  }
    /**
   * Tra cứu thành viên với đầy đủ thông tin gia phả
   * Bao gồm: họ tên, ngày sinh, đời, tên cha, tên mẹ
   */
    async traCuuThanhVien(query: TraCuuThanhVienQuery): Promise<TraCuuThanhVienResponse> {
    try {
      // [1] Validation và chuẩn hóa input
      const page = Math.max(1, parseInt(String(query.page || 1)) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(String(query.limit || 10)) || 10));
      const offset = (page - 1) * limit;
      
      // [2] Xây dựng base query
      let whereClauses: string[] = [];
      let queryParams: any[] = [];
      
      // Tìm kiếm
      if (query.search && query.search.trim()) {
        whereClauses.push('(tv.HoTen LIKE ? OR tv.MaTV LIKE ?)');
        const searchPattern = `%${query.search.trim()}%`;
        queryParams.push(searchPattern, searchPattern);
      }
      
      // Lọc đời
      if (query.doi !== undefined && !isNaN(Number(query.doi))) {
        whereClauses.push('tv.DOI = ?');
        queryParams.push(Number(query.doi));
      }
      
      // Lọc gia phả
      if (query.maGiaPha && query.maGiaPha.trim()) {
        whereClauses.push('tv.MaGiaPha = ?');
        queryParams.push(query.maGiaPha.trim());
      }
      
      // Lọc trạng thái
      if (query.trangThai && query.trangThai.trim()) {
        whereClauses.push('tv.TrangThai = ?');
        queryParams.push(query.trangThai.trim());
      }
      
      const whereSQL = whereClauses.length > 0 ? whereClauses.join(' AND ') : '1=1';
      
      // [3] Xây dựng ORDER BY
      let orderBySQL = 'tv.DOI ASC, tv.TGTaoMoi ASC';
      
      if (query.sortBy) {
        const orderDirection = query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        
        if (query.sortBy === 'doi') {
          orderBySQL = `tv.DOI ${orderDirection}`;
        } else if (query.sortBy === 'ngaySinh') {
          orderBySQL = `tv.NgayGioSinh ${orderDirection}`;
        } else if (query.sortBy === 'hoTen') {
          orderBySQL = `tv.HoTen ${orderDirection}`;
        }
      }
      
      // [4] Đếm tổng số records
      const countSQL = `SELECT COUNT(*) as total FROM THANHVIEN tv WHERE ${whereSQL}`;
      
      const countResultRaw = await databaseService.query<any[]>(countSQL, queryParams);
      // Handle cả 2 trường hợp: [rows, fields] hoặc rows
      const countData = Array.isArray(countResultRaw[0]) && 'total' in countResultRaw[0][0] 
        ? countResultRaw[0] 
        : countResultRaw;
      
      const total = Number(countData[0]?.total || 0);
      const totalPages = Math.ceil(total / limit);
      
      // [5] Lấy dữ liệu
      const dataSQL = `
        SELECT 
          tv.MaTV,
          tv.HoTen,
          tv.NgayGioSinh,
          tv.DOI,
          qhc.MaTVCha,
          qhc.MaTVMe,
          cha.HoTen AS TenCha,
          me.HoTen AS TenMe
        FROM THANHVIEN tv
        LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
        LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
        LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
        WHERE ${whereSQL}
        ORDER BY ${orderBySQL}
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      // ⚠️ QUAN TRỌNG: Không dùng ? cho LIMIT/OFFSET, dùng template string
      const dataResultRaw = await databaseService.query<any[]>(dataSQL, queryParams);
      
      // Handle kết quả
      const dataRows = Array.isArray(dataResultRaw[0]) && dataResultRaw[0].length > 0 && 'MaTV' in dataResultRaw[0][0]
        ? dataResultRaw[0]
        : dataResultRaw;
      
      // [6] Format kết quả
      const data: TraCuuThanhVienResult[] = dataRows.map((row: any, index: number) => ({
        STT: offset + index + 1,
        MaTV: row.MaTV,
        HoTen: row.HoTen,
        NgayGioSinh: row.NgayGioSinh,
        DOI: row.DOI,
        TenCha: row.TenCha || null,
        TenMe: row.TenMe || null,
        MaCha: row.MaTVCha || null,
        MaMe: row.MaTVMe || null
      }));
      
      // [7] Trả về
      return {
        message: data.length > 0 ? 'Tra cứu thành viên thành công' : 'Không tìm thấy thành viên',
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      };
      
    } catch (error: any) {
      console.error('❌ Lỗi traCuuThanhVien:', error);
      throw error;
    }
  }
}
const thanhvienService = new ThanhVienService();
export default thanhvienService;
