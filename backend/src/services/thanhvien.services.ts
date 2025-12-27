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

interface HonNhanRow extends RowDataPacket {
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
  async getAllThanhVien(userInfo: { MaLoaiTK: string; MaGiaPha: string | null }) {
    let sql = 'SELECT * FROM THANHVIEN';
    const params: any[] = [];

    // Phân quyền
    if (userInfo.MaLoaiTK !== 'LTK01') {
      if (!userInfo.MaGiaPha) {
        throw new Error('Bạn chưa thuộc gia phả nào');
      }
      sql += ' WHERE MaGiaPha = ?';
      params.push(userInfo.MaGiaPha);
    }

    sql += ' ORDER BY DOI, TGTaoMoi';

    const rows = await databaseService.query<ThanhVienRow[]>(sql, params);
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
  async getBaoCaoTangGiam(
    NamBatDau: number, 
    NamKetThuc: number,
    userInfo: { MaLoaiTK: string; MaGiaPha: string | null }
  ) {
    // Validate
    if (NamBatDau > NamKetThuc) {
      throw new Error('Năm bắt đầu không được lớn hơn năm kết thúc');
    }

    const currentYear = new Date().getFullYear();
    if (NamKetThuc > currentYear) {
      throw new Error(`Năm kết thúc không được vượt quá năm hiện tại (${currentYear})`);
    }

    const conditions: string[] = [];
    const params: any[] = [];

    // Phân quyền
    if (userInfo.MaLoaiTK !== 'LTK01') {
      if (!userInfo.MaGiaPha) {
        throw new Error('Bạn chưa thuộc gia phả nào');
      }
      conditions.push('tv.MaGiaPha = ?');
      params.push(userInfo.MaGiaPha);
    }

    const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    // Query số sinh
    const sqlSinh = `
      SELECT YEAR(NgayGioSinh) AS Nam, COUNT(*) AS SoLuong
      FROM THANHVIEN tv
      WHERE YEAR(NgayGioSinh) BETWEEN ? AND ?
      ${whereClause}
      GROUP BY YEAR(NgayGioSinh)
    `;

    // Query số kết hôn
    const sqlKetHon = `
      SELECT YEAR(hn.NgayBatDau) AS Nam, COUNT(*) AS SoLuong
      FROM HONNHAN hn
      INNER JOIN THANHVIEN tv ON hn.MaTV = tv.MaTV
      WHERE YEAR(hn.NgayBatDau) BETWEEN ? AND ?
      ${whereClause}
      GROUP BY YEAR(hn.NgayBatDau)
    `;

    // Query số mất
    const sqlMat = `
      SELECT YEAR(NgayGioMat) AS Nam, COUNT(*) AS SoLuong
      FROM THANHVIEN tv
      WHERE NgayGioMat IS NOT NULL 
      AND YEAR(NgayGioMat) BETWEEN ? AND ?
      ${whereClause}
      GROUP BY YEAR(NgayGioMat)
    `;

    // Execute queries
    const paramsSinh = [NamBatDau, NamKetThuc, ...params];
    const paramsKetHon = [NamBatDau, NamKetThuc, ...params];
    const paramsMat = [NamBatDau, NamKetThuc, ...params];

    const sinhRows = await databaseService.query<RowDataPacket[]>(sqlSinh, paramsSinh);
    const ketHonRows = await databaseService.query<RowDataPacket[]>(sqlKetHon, paramsKetHon);
    const matRows = await databaseService.query<RowDataPacket[]>(sqlMat, paramsMat);

    // Tổng hợp kết quả
    const result: any[] = [];
    const years = new Set<number>();

    sinhRows.forEach((row: any) => years.add(row.Nam));
    ketHonRows.forEach((row: any) => years.add(row.Nam));
    matRows.forEach((row: any) => years.add(row.Nam));

    Array.from(years).sort().forEach((year: number) => {
      const sinh = sinhRows.find((r: any) => r.Nam === year)?.SoLuong || 0;
      const ketHon = ketHonRows.find((r: any) => r.Nam === year)?.SoLuong || 0;
      const mat = matRows.find((r: any) => r.Nam === year)?.SoLuong || 0;

      // Chỉ thêm năm có ít nhất 1 sự kiện
      if (sinh > 0 || ketHon > 0 || mat > 0) {
        result.push({
          Nam: year,
          SoSinh: sinh,
          SoKetHon: ketHon,
          SoMat: mat
        });
      }
    });

    return result;
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
      FROM HONNHAN
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
        const insertHONNHANSql = `
          INSERT INTO HONNHAN (MaTV, MaTVVC, NgayBatDau, NgayKetThuc)
          VALUES (?, ?, ?, NULL)
        `;
        
        await connection.execute(insertHONNHANSql, [
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
      FROM HONNHAN
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
  async traCuuThanhVien(
    query: TraCuuThanhVienQuery,
    userInfo: { MaLoaiTK: string; MaGiaPha: string | null }
  ): Promise<TraCuuThanhVienResponse> {
    const conditions: string[] = [];
    const params: any[] = [];

    // Phân quyền: Nếu không phải Admin, chỉ tra cứu trong gia phả
    if (userInfo.MaLoaiTK !== 'LTK01') {
      if (!userInfo.MaGiaPha) {
        throw new Error('Bạn chưa thuộc gia phả nào');
      }
      conditions.push('tv.MaGiaPha = ?');
      params.push(userInfo.MaGiaPha);
    }

    // Điều kiện tìm kiếm theo search (họ tên hoặc mã TV)
    if (query.search) {
      conditions.push('(tv.HoTen LIKE ? OR tv.MaTV LIKE ?)');
      params.push(`%${query.search}%`, `%${query.search}%`);
    }

    // Lọc theo đời
    if (query.doi !== undefined) {
      conditions.push('tv.DOI = ?');
      params.push(query.doi);
    }

    // Lọc theo gia phả (nếu Admin muốn xem gia phả cụ thể)
    if (query.maGiaPha) {
      conditions.push('tv.MaGiaPha = ?');
      params.push(query.maGiaPha);
    }

    // Lọc theo trạng thái
    if (query.trangThai) {
      conditions.push('tv.TrangThai = ?');
      params.push(query.trangThai);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Xác định sắp xếp
    let orderBy = 'tv.DOI, tv.HoTen';
    if (query.sortBy === 'ngaySinh') {
      orderBy = 'tv.NgayGioSinh';
    } else if (query.sortBy === 'hoTen') {
      orderBy = 'tv.HoTen';
    }
    
    const orderDirection = query.order === 'desc' ? 'DESC' : 'ASC';

    // Query lấy dữ liệu với quan hệ cha mẹ
    const sql = `
      SELECT 
        tv.MaTV,
        tv.HoTen,
        tv.NgayGioSinh,
        tv.DOI,
        cha.HoTen AS TenCha,
        me.HoTen AS TenMe,
        qhc.MaTVCha AS MaCha,
        qhc.MaTVMe AS MaMe
      FROM THANHVIEN tv
      LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
      LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
      LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
      ${whereClause}
      ORDER BY ${orderBy} ${orderDirection}
    `;

    const rows = await databaseService.query<RowDataPacket[]>(sql, params);

    // Phân trang
    const page = query.page || 1;
    const limit = query.limit || 10;
    const total = rows.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Map data với STT
    const data: TraCuuThanhVienResult[] = rows.slice(startIndex, endIndex).map((row, index) => ({
      STT: startIndex + index + 1,
      MaTV: row.MaTV,
      HoTen: row.HoTen,
      NgayGioSinh: row.NgayGioSinh,
      DOI: row.DOI,
      TenCha: row.TenCha || null,
      TenMe: row.TenMe || null,
      MaCha: row.MaCha || null,
      MaMe: row.MaMe || null
    }));

    return {
      message: 'Tra cứu thành công',
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  }

  async getThanhVienGiaPhaInfo(MaTV: string) {
    const sql = `
      SELECT 
        tv.MaTV,
        tv.HoTen,
        tv.MaGiaPha,
        gp.TenGiaPha,
        gp.TruongToc,
        tv_tt.HoTen as TenTruongToc
      FROM THANHVIEN tv
      LEFT JOIN CAYGIAPHA gp ON tv.MaGiaPha = gp.MaGiaPha
      LEFT JOIN THANHVIEN tv_tt ON gp.TruongToc = tv_tt.MaTV
      WHERE tv.MaTV = ?
    `;
    
    interface GiaPhaInfoRow extends RowDataPacket {
      MaTV: string;
      HoTen: string;
      MaGiaPha: string | null;
      TenGiaPha: string | null;
      TruongToc: string | null;
      TenTruongToc: string | null;
    }
    
    const rows = await databaseService.query<GiaPhaInfoRow[]>(sql, [MaTV]);
    
    if (!rows || rows.length === 0) {
      throw new Error('Không tìm thấy thành viên');
    }
    
    return rows[0];
  }

  /**
   * Kiểm tra mã gia phả có tồn tại không
   */
  async checkGiaPhaExists(MaGiaPha: string): Promise<boolean> {
    const sql = 'SELECT MaGiaPha FROM CAYGIAPHA WHERE MaGiaPha = ?';
    const rows = await databaseService.query<RowDataPacket[]>(sql, [MaGiaPha]);
    return rows && rows.length > 0;
  }

  /**
   * Xóa mã gia phả của thành viên (set NULL)
   */
  async xoaMaGiaPhaThanhVien(MaTV: string) {
    // Kiểm tra thành viên tồn tại và lấy thông tin hiện tại
    const thanhVienInfo = await this.getThanhVienGiaPhaInfo(MaTV);
    
    if (!thanhVienInfo.MaGiaPha) {
      throw new Error('Thành viên chưa có mã gia phả để xóa');
    }
    
    const MaGiaPhaCu = thanhVienInfo.MaGiaPha;
    
    // Cập nhật MaGiaPha = NULL
    const updateSql = 'UPDATE THANHVIEN SET MaGiaPha = NULL WHERE MaTV = ?';
    const result = await databaseService.query<ResultSetHeader>(updateSql, [MaTV]);
    
    if (result.affectedRows === 0) {
      throw new Error('Không thể xóa mã gia phả');
    }
    
    return {
      message: 'Xóa mã gia phả thành công',
      data: {
        MaTV: thanhVienInfo.MaTV,
        HoTen: thanhVienInfo.HoTen,
        MaGiaPhaCu: MaGiaPhaCu,
        MaGiaPhaHienTai: null
      }
    };
  }

  async capNhatTruongTocGiaPha(MaGiaPha: string, MaTVTruongTocMoi: string) {
    // Bước 1: Kiểm tra gia phả có tồn tại không
    const sqlCheckGiaPha = `
      SELECT MaGiaPha, TenGiaPha, TruongToc 
      FROM CAYGIAPHA 
      WHERE MaGiaPha = ?
    `;

    interface GiaPhaRow extends RowDataPacket {
      MaGiaPha: string;
      TenGiaPha: string;
      TruongToc: string;
    }

    const giaPhaRows = await databaseService.query<GiaPhaRow[]>(sqlCheckGiaPha, [MaGiaPha]);

    if (!giaPhaRows || giaPhaRows.length === 0) {
      throw new Error('Không tìm thấy gia phả');
    }

    const TruongTocCu = giaPhaRows[0].TruongToc;
    const TenGiaPha = giaPhaRows[0].TenGiaPha;

    // Bước 2: Kiểm tra trưởng tộc mới có tồn tại không
    const sqlCheckThanhVien = `
      SELECT MaTV, HoTen, MaGiaPha 
      FROM THANHVIEN 
      WHERE MaTV = ?
    `;

    interface ThanhVienRow extends RowDataPacket {
      MaTV: string;
      HoTen: string;
      MaGiaPha: string | null;
    }

    const thanhVienRows = await databaseService.query<ThanhVienRow[]>(
      sqlCheckThanhVien, 
      [MaTVTruongTocMoi]
    );

    if (!thanhVienRows || thanhVienRows.length === 0) {
      throw new Error('Không tìm thấy thành viên');
    }

    const thanhVienMoi = thanhVienRows[0];

    // Bước 3: Kiểm tra thành viên mới có thuộc gia phả này không
    if (thanhVienMoi.MaGiaPha !== MaGiaPha) {
      throw new Error('Thành viên không thuộc gia phả này');
    }

    // Bước 4: Kiểm tra xem có phải đang là trưởng tộc hiện tại không
    if (TruongTocCu === MaTVTruongTocMoi) {
      throw new Error('Thành viên này đã là trưởng tộc hiện tại');
    }

    // Bước 5: Lấy tên trưởng tộc cũ
    const sqlGetTenCu = 'SELECT HoTen FROM THANHVIEN WHERE MaTV = ?';
    const tenCuRows = await databaseService.query<ThanhVienRow[]>(sqlGetTenCu, [TruongTocCu]);
    const TenTruongTocCu = tenCuRows.length > 0 ? tenCuRows[0].HoTen : 'Không rõ';

    // Bước 6: Cập nhật trưởng tộc mới
    const updateSql = `
      UPDATE CAYGIAPHA 
      SET TruongToc = ? 
      WHERE MaGiaPha = ?
    `;

    const result = await databaseService.query<ResultSetHeader>(updateSql, [
      MaTVTruongTocMoi,
      MaGiaPha
    ]);

    if (result.affectedRows === 0) {
      throw new Error('Không thể cập nhật trưởng tộc');
    }

    // Bước 7: Trả về kết quả
    // Trigger TRG_UPDATE_TAIKHOAN_LOAITK_GIAPHA sẽ tự động 
    // cập nhật quyền tài khoản lên LTK02
    return {
      message: 'Cập nhật trưởng tộc thành công',
      data: {
        MaGiaPha: MaGiaPha,
        TenGiaPha: TenGiaPha,
        TruongTocCu: TruongTocCu,
        TenTruongTocCu: TenTruongTocCu,
        TruongTocMoi: MaTVTruongTocMoi,
        TenTruongTocMoi: thanhVienMoi.HoTen
      }
    };
  }

  /**
   * Lấy danh sách tất cả các gia phả (để chọn khi cập nhật)
   */
  async getAllGiaPha() {
    const sql = `
      SELECT 
        gp.MaGiaPha,
        gp.TenGiaPha,
        gp.TruongToc,
        tv.HoTen as TenTruongToc,
        gp.TGLap,
        COUNT(tv_member.MaTV) as SoLuongThanhVien
      FROM CAYGIAPHA gp
      LEFT JOIN THANHVIEN tv ON gp.TruongToc = tv.MaTV
      LEFT JOIN THANHVIEN tv_member ON tv_member.MaGiaPha = gp.MaGiaPha
      GROUP BY gp.MaGiaPha, gp.TenGiaPha, gp.TruongToc, tv.HoTen, gp.TGLap
      ORDER BY gp.TGLap DESC
    `;
    
    interface GiaPhaRow extends RowDataPacket {
      MaGiaPha: string;
      TenGiaPha: string;
      TruongToc: string;
      TenTruongToc: string;
      TGLap: Date;
      SoLuongThanhVien: number;
    }
    
    const rows = await databaseService.query<GiaPhaRow[]>(sql);
    return rows;
  }

}
const thanhvienService = new ThanhVienService();
export default thanhvienService;
