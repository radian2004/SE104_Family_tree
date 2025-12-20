import databaseService from './database.services';
import { 
  GhiNhanThanhVienPayload, 
  GhiNhanThanhVienResult,
  ThanhVienCuInfo 
} from '~/models/schemas/GhiNhanThanhVien.schema';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

class GhiNhanThanhVienService {
  
  /**
   * Lấy thông tin thành viên cũ (để validation và hiển thị)
   */
  async getThanhVienCu(MaTV: string): Promise<ThanhVienCuInfo | null> {
    const sql = `
      SELECT MaTV, HoTen, GioiTinh, NgayGioSinh, MaGiaPha
      FROM THANHVIEN
      WHERE MaTV = ? AND TrangThai = 'Còn Sống'
    `;
    
    // ✅ FIX: Không destructure vì databaseService.query trả về trực tiếp rows
    const rows = await databaseService.query<RowDataPacket[]>(sql, [MaTV]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0] as ThanhVienCuInfo;
  }
  
  /**
   * Ghi nhận thành viên mới với quan hệ
   * Sử dụng TRANSACTION để đảm bảo tính toàn vẹn dữ liệu
   */
  async ghiNhanThanhVien(payload: GhiNhanThanhVienPayload): Promise<GhiNhanThanhVienResult> {
    const connection = await databaseService.getConnection();
    
    try {
      // Bắt đầu transaction
      await connection.beginTransaction();
      
      // [1] Validate thành viên cũ tồn tại
      const thanhvienCu = await this.getThanhVienCu(payload.MaTVCu);
      if (!thanhvienCu) {
        throw new Error(`Không tìm thấy thành viên cũ với mã ${payload.MaTVCu} hoặc thành viên đã mất`);
      }
      
      // [2] Validate logic nghiệp vụ
      if (payload.LoaiQuanHe === 'Con cái') {
        // Nếu là con, thành viên cũ phải là cha (Nam) hoặc mẹ (Nữ)
        // (Không cần kiểm tra cứng nhắc vì trigger TRG_CHECK_CHA_ME_QUANHECON sẽ xử lý)
      }
      
      // [3] INSERT thành viên mới vào THANHVIEN
      const insertThanhVienSql = `
        INSERT INTO THANHVIEN (
          HoTen, NgayGioSinh, DiaChi, GioiTinh, 
          MaQueQuan, MaNgheNghiep, TrangThai
        ) VALUES (?, ?, ?, ?, ?, ?, 'Còn Sống')
      `;
      
      const insertParams = [
        payload.HoTen,
        payload.NgayGioSinh,
        payload.DiaChi,
        payload.GioiTinh,
        payload.MaQueQuan,
        payload.MaNgheNghiep || null
      ];
      
      await connection.query<ResultSetHeader>(insertThanhVienSql, insertParams);
      
      // [4] Lấy MaTV vừa tạo (do trigger TRG_GEN_ID_THANHVIEN tự sinh)
      // ✅ FIX: connection.query trả về tuple [rows, fields]
      const [newThanhVien] = await connection.query<RowDataPacket[]>(
        'SELECT MaTV, DOI, MaGiaPha FROM THANHVIEN ORDER BY TGTaoMoi DESC LIMIT 1'
      );
      
      if (newThanhVien.length === 0) {
        throw new Error('Không thể lấy thông tin thành viên vừa tạo');
      }
      
      const MaTVMoi = newThanhVien[0].MaTV as string;
      
      // [5] INSERT quan hệ dựa trên LoaiQuanHe
      if (payload.LoaiQuanHe === 'Con cái') {
        // Xác định vai trò của thành viên cũ (cha hay mẹ)
        let MaTVCha = null;
        let MaTVMe = null;
        
        if (thanhvienCu.GioiTinh === 'Nam') {
          MaTVCha = payload.MaTVCu;
        } else if (thanhvienCu.GioiTinh === 'Nữ') {
          MaTVMe = payload.MaTVCu;
        } else {
          throw new Error('Giới tính của thành viên cũ không hợp lệ');
        }
        
        const insertQuanHeConSql = `
          INSERT INTO QUANHECON (MaTV, MaTVCha, MaTVMe, NgayPhatSinh)
          VALUES (?, ?, ?, ?)
        `;
        
        await connection.query<ResultSetHeader>(
          insertQuanHeConSql,
          [MaTVMoi, MaTVCha, MaTVMe, payload.NgayPhatSinh]
        );
        
      } else if (payload.LoaiQuanHe === 'Vợ/Chồng') {
        // Xác định ai là MaTV (trong gia phả) và ai là MaTVVC (vợ/chồng)
        // Quy ước: Người trong gia phả (thành viên cũ) là MaTV, người mới là MaTVVC
        const insertQuanHeVCSQL = `
          INSERT INTO QUANHEVOCHONG (MaTV, MaTVVC, NgayBatDau, NgayKetThuc)
          VALUES (?, ?, ?, NULL)
        `;
        
        await connection.query<ResultSetHeader>(
          insertQuanHeVCSQL,
          [payload.MaTVCu, MaTVMoi, payload.NgayPhatSinh]
        );
        
      } else {
        throw new Error(`Loại quan hệ không hợp lệ: ${payload.LoaiQuanHe}`);
      }
      
      // [6] Lấy thông tin đầy đủ thành viên mới sau khi trigger chạy xong
      // ✅ FIX: Phải lấy TRƯỚC KHI commit, sử dụng connection.query
      const [finalResult] = await connection.query<RowDataPacket[]>(
        'SELECT MaTV, HoTen, DOI, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
        [MaTVMoi]
      );
      
      // [7] Commit transaction
      await connection.commit();
      
      const result: GhiNhanThanhVienResult = {
        message: 'Ghi nhận thành viên thành công',
        MaTVMoi: finalResult[0].MaTV,
        HoTen: finalResult[0].HoTen,
        LoaiQuanHe: payload.LoaiQuanHe,
        TenThanhVienCu: thanhvienCu.HoTen,
        DOI: finalResult[0].DOI,
        MaGiaPha: finalResult[0].MaGiaPha
      };
      
      return result;
      
    } catch (error) {
      // Rollback nếu có lỗi
      await connection.rollback();
      throw error;
      
    } finally {
      // Trả connection về pool
      connection.release();
    }
  }
  
  /**
   * Tra cứu danh sách ghi nhận (lịch sử ghi nhận thành viên)
   * Kết hợp dữ liệu từ QUANHECON và QUANHEVOCHONG
   */
  async traCuuGhiNhan(filters?: {
    HoTenMoi?: string;          // Tìm theo họ tên thành viên mới
    HoTenCu?: string;           // Tìm theo họ tên thành viên cũ
    LoaiQuanHe?: 'Con cái' | 'Vợ/Chồng';
    TuNgay?: string;            // Từ ngày phát sinh (YYYY-MM-DD)
    DenNgay?: string;           // Đến ngày phát sinh (YYYY-MM-DD)
  }) {
    // Query kết hợp từ cả 2 bảng quan hệ
    let sql = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY NgayPhatSinh DESC) AS STT,
        MaTVMoi,
        HoTenMoi,
        MaTVCu,
        HoTenCu,
        LoaiQuanHe,
        NgayPhatSinh
      FROM (
        -- Quan hệ con cái
        SELECT 
          qhc.MaTV AS MaTVMoi,
          tv1.HoTen AS HoTenMoi,
          COALESCE(qhc.MaTVCha, qhc.MaTVMe) AS MaTVCu,
          COALESCE(tv2.HoTen, tv3.HoTen) AS HoTenCu,
          'Con cái' AS LoaiQuanHe,
          qhc.NgayPhatSinh
        FROM QUANHECON qhc
        INNER JOIN THANHVIEN tv1 ON qhc.MaTV = tv1.MaTV
        LEFT JOIN THANHVIEN tv2 ON qhc.MaTVCha = tv2.MaTV
        LEFT JOIN THANHVIEN tv3 ON qhc.MaTVMe = tv3.MaTV
        
        UNION ALL
        
        -- Quan hệ vợ chồng
        SELECT 
          qhvc.MaTVVC AS MaTVMoi,
          tv2.HoTen AS HoTenMoi,
          qhvc.MaTV AS MaTVCu,
          tv1.HoTen AS HoTenCu,
          'Vợ/Chồng' AS LoaiQuanHe,
          qhvc.NgayBatDau AS NgayPhatSinh
        FROM QUANHEVOCHONG qhvc
        INNER JOIN THANHVIEN tv1 ON qhvc.MaTV = tv1.MaTV
        INNER JOIN THANHVIEN tv2 ON qhvc.MaTVVC = tv2.MaTV
      ) AS combined_relations
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (filters) {
      if (filters.HoTenMoi) {
        sql += ' AND HoTenMoi LIKE ?';
        params.push(`%${filters.HoTenMoi}%`);
      }
      
      if (filters.HoTenCu) {
        sql += ' AND HoTenCu LIKE ?';
        params.push(`%${filters.HoTenCu}%`);
      }
      
      if (filters.LoaiQuanHe) {
        sql += ' AND LoaiQuanHe = ?';
        params.push(filters.LoaiQuanHe);
      }
      
      if (filters.TuNgay) {
        sql += ' AND DATE(NgayPhatSinh) >= ?';
        params.push(filters.TuNgay);
      }
      
      if (filters.DenNgay) {
        sql += ' AND DATE(NgayPhatSinh) <= ?';
        params.push(filters.DenNgay);
      }
    }
    
    sql += ' ORDER BY NgayPhatSinh DESC';
    
    // ✅ FIX: databaseService.query trả về trực tiếp rows, không cần destructure
    const rows = await databaseService.query<RowDataPacket[]>(sql, params);
    return rows;
  }
}



const ghiNhanThanhVienService = new GhiNhanThanhVienService();
export default ghiNhanThanhVienService;