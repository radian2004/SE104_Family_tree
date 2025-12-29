import databaseService from './database.services'
import { KetThucRow, TraCuuKetThucResult, GhiNhanKetThucPayload } from '~/models/schemas/KetThuc.schema'
import { RowDataPacket, ResultSetHeader } from 'mysql2'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { TaiKhoanInfo } from '~/middlewares/authorization.middlewares'

class KetThucService {
  /**
   * ⭐ Helper: Kiểm tra thành viên có thuộc gia phả không
   */
  async verifyMemberInGiaPha(MaTV: string, MaGiaPha: string): Promise<boolean> {
    const sql = 'SELECT MaTV FROM THANHVIEN WHERE MaTV = ? AND MaGiaPha = ?';
    const rows = await databaseService.query<RowDataPacket[]>(sql, [MaTV, MaGiaPha]);
    return rows.length > 0;
  }

  /**
   * 1. Ghi nhận kết thúc (thành viên qua đời)
   * Cập nhật thông tin mất vào bảng THANHVIEN
   * Đồng thời cập nhật TrangThai → 'Mất'
   * ⭐ V2: Thêm phân quyền - chỉ cho phép ghi nhận cho thành viên trong gia phả của mình
   */
  async ghiNhanKetThuc(payload: GhiNhanKetThucPayload, userInfo?: TaiKhoanInfo) {
    const { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem } = payload

    // ⭐ PHÂN QUYỀN THEO GIA PHẢ
    if (userInfo && userInfo.MaLoaiTK !== 'LTK01') {
      if (!userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chưa thuộc gia phả nào',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      // Verify member belongs to user's gia pha
      const memberCheck = await this.verifyMemberInGiaPha(MaTV, userInfo.MaGiaPha);
      if (!memberCheck) {
        throw new ErrorWithStatus({
          message: 'Thành viên này không thuộc gia phả của bạn',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
    }

    // ⭐ VALIDATE: Ngày mất phải sau ngày sinh
    const [memberRows] = await databaseService.query<RowDataPacket[]>(
      'SELECT NgayGioSinh FROM THANHVIEN WHERE MaTV = ?',
      [MaTV]
    );

    if (memberRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy thành viên',
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    const member = memberRows[0];
    if (member.NgayGioSinh) {
      const ngaySinh = new Date(member.NgayGioSinh);
      const ngayMat = new Date(NgayGioMat);

      if (ngayMat < ngaySinh) {
        throw new ErrorWithStatus({
          message: 'Ngày mất không thể trước ngày sinh',
          status: HTTP_STATUS.BAD_REQUEST
        });
      }
    }

    const query = `
      UPDATE THANHVIEN
      SET NgayGioMat = ?,
          MaNguyenNhanMat = ?,
          MaDiaDiem = ?,
          TrangThai = 'Mất'
      WHERE MaTV = ? AND TrangThai = 'Còn Sống'
    `

    const result = await databaseService.query<ResultSetHeader>(
      query,
      [NgayGioMat, MaNguyenNhanMat, MaDiaDiem, MaTV]
    )

    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy thành viên hoặc thành viên đã được ghi nhận mất trước đó')
    }

    return {
      message: 'Ghi nhận kết thúc thành công',
      MaTV,
      affectedRows: result.affectedRows
    }
  }


  /**
    * 2. Tra cứu danh sách thành viên đã kết thúc
    * - Admin: Xem tất cả (có thể filter theo MaGiaPha từ query params)
    * - Owner/User: Chỉ xem trong gia phả
    */
  async traCuuKetThuc(filters?: {
    HoTen?: string
    MaNguyenNhanMat?: string
    TenNguyenNhanMat?: string
    MaDiaDiem?: string
    TenDiaDiem?: string
    TuNgay?: string
    DenNgay?: string
    MaGiaPha?: string  // ✅ NEW: Admin có thể filter theo gia phả từ dropdown
  }, userInfo?: TaiKhoanInfo): Promise<TraCuuKetThucResult[]> {
    let whereClauses: string[] = ["tv.TrangThai = 'Mất'"];
    const params: any[] = [];

    // ⭐ FILTER THEO MaGiaPha 
    // - Admin (LTK01): Xem tất cả, nhưng có thể filter theo MaGiaPha từ query
    // - Owner/User: Giới hạn theo gia phả của mình
    if (userInfo) {
      if (userInfo.MaLoaiTK === 'LTK01') {
        // Admin: nếu có MaGiaPha từ filter thì dùng, không thì xem tất cả
        if (filters?.MaGiaPha) {
          whereClauses.push('tv.MaGiaPha = ?');
          params.push(filters.MaGiaPha);
        }
      } else {
        // Không phải Admin → giới hạn theo gia phả
        if (!userInfo.MaGiaPha) {
          throw new Error('Bạn chưa thuộc gia phả nào');
        }
        whereClauses.push('tv.MaGiaPha = ?');
        params.push(userInfo.MaGiaPha);
      }
    }

    // Lọc theo họ tên (LIKE search)
    if (filters?.HoTen) {
      whereClauses.push('tv.HoTen LIKE ?');
      params.push(`%${filters.HoTen}%`);
    }

    // Lọc theo TÊN nguyên nhân mất (LIKE search)
    if (filters?.TenNguyenNhanMat) {
      whereClauses.push('nnm.TenNguyenNhanMat LIKE ?');
      params.push(`%${filters.TenNguyenNhanMat}%`);
    }
    // Deprecated: Giữ để tương thích ngược
    else if (filters?.MaNguyenNhanMat) {
      whereClauses.push('tv.MaNguyenNhanMat = ?');
      params.push(filters.MaNguyenNhanMat);
    }

    // Lọc theo TÊN địa điểm mai táng (LIKE search)
    if (filters?.TenDiaDiem) {
      whereClauses.push('dd.TenDiaDiem LIKE ?');
      params.push(`%${filters.TenDiaDiem}%`);
    }
    // Deprecated: Giữ để tương thích ngược
    else if (filters?.MaDiaDiem) {
      whereClauses.push('tv.MaDiaDiem = ?');
      params.push(filters.MaDiaDiem);
    }

    // Lọc theo khoảng thời gian mất
    if (filters?.TuNgay) {
      whereClauses.push('DATE(tv.NgayGioMat) >= ?');
      params.push(filters.TuNgay);
    }

    if (filters?.DenNgay) {
      whereClauses.push('DATE(tv.NgayGioMat) <= ?');
      params.push(filters.DenNgay);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY tv.NgayGioMat DESC) AS STT,
        tv.MaTV,
        tv.HoTen,
        DATE_FORMAT(tv.NgayGioMat, '%Y-%m-%d %H:%i:%s') AS NgayGioMat,
        COALESCE(nnm.TenNguyenNhanMat, 'Không rõ') AS TenNguyenNhanMat,
        COALESCE(dd.TenDiaDiem, 'Không rõ') AS TenDiaDiem
      FROM THANHVIEN tv
      LEFT JOIN NGUYENNHANMAT nnm ON tv.MaNguyenNhanMat = nnm.MaNguyenNhanMat
      LEFT JOIN DIADIEMMAITANG dd ON tv.MaDiaDiem = dd.MaDiaDiem
      ${whereClause}
      ORDER BY tv.NgayGioMat DESC
    `;

    const rows = await databaseService.query<RowDataPacket[]>(query, params);
    return rows as TraCuuKetThucResult[];
  }

  /**
   * 3. Xem chi tiết thông tin kết thúc của một thành viên
   */
  async getChiTietKetThuc(MaTV: string, userInfo?: TaiKhoanInfo): Promise<KetThucRow | null> {
    const query = `
      SELECT 
        tv.MaTV,
        tv.HoTen,
        tv.NgayGioSinh,
        tv.NgayGioMat,
        tv.TrangThai,
        tv.MaNguyenNhanMat,
        nnm.TenNguyenNhanMat,
        tv.MaDiaDiem,
        dd.TenDiaDiem,
        tv.MaGiaPha  -- ⭐ THÊM MaGiaPha để check quyền
      FROM THANHVIEN tv
      LEFT JOIN NGUYENNHANMAT nnm ON tv.MaNguyenNhanMat = nnm.MaNguyenNhanMat
      LEFT JOIN DIADIEMMAITANG dd ON tv.MaDiaDiem = dd.MaDiaDiem
      WHERE tv.MaTV = ? AND tv.TrangThai = 'Mất'
    `;

    const rows = await databaseService.query<RowDataPacket[]>(query, [MaTV]);

    if (rows.length === 0) {
      return null;
    }

    const member = rows[0];

    // KIỂM TRA quyền xem (Owner/User chỉ xem trong gia phả)
    if (userInfo && userInfo.MaLoaiTK !== 'LTK01') {
      // Không phải Admin → kiểm tra gia phả
      if (!userInfo.MaGiaPha) {
        throw new Error('Bạn chưa thuộc gia phả nào');
      }

      if (member.MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền xem thông tin kết thúc của thành viên trong gia phả của mình',
          status: HTTP_STATUS.FORBIDDEN  // Cần import HTTP_STATUS
        });
      }
    }

    return member as KetThucRow;
  }

  /**
   * 4. Cập nhật thông tin kết thúc (nguyên nhân, địa điểm)
   * Chỉ cho phép cập nhật nếu thành viên đã có trạng thái 'Mất'
   */
  async capNhatKetThuc(MaTV: string, updates: {
    NgayGioMat?: string
    MaNguyenNhanMat?: string
    MaDiaDiem?: string
  }) {
    const setClauses: string[] = []
    const params: any[] = []

    if (updates.NgayGioMat) {
      setClauses.push('NgayGioMat = ?')
      params.push(updates.NgayGioMat)
    }

    if (updates.MaNguyenNhanMat) {
      setClauses.push('MaNguyenNhanMat = ?')
      params.push(updates.MaNguyenNhanMat)
    }

    if (updates.MaDiaDiem) {
      setClauses.push('MaDiaDiem = ?')
      params.push(updates.MaDiaDiem)
    }

    if (setClauses.length === 0) {
      throw new Error('Không có thông tin cần cập nhật')
    }

    params.push(MaTV)

    const query = `
      UPDATE THANHVIEN
      SET ${setClauses.join(', ')}
      WHERE MaTV = ? AND TrangThai = 'Mất'
    `

    // ✅ SỬA: executeQuery → query, bỏ destructuring
    const result = await databaseService.query<ResultSetHeader>(query, params)

    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy thành viên hoặc thành viên chưa được ghi nhận mất')
    }

    return {
      message: 'Cập nhật thông tin kết thúc thành công',
      MaTV,
      affectedRows: result.affectedRows
    }
  }

  /**
   * 5. Xóa thông tin kết thúc (đưa thành viên về trạng thái "Còn Sống")
   * CHỈ SỬ DỤNG KHI GHI NHẬN SAI
   */
  async xoaKetThuc(MaTV: string) {
    const query = `
      UPDATE THANHVIEN
      SET NgayGioMat = NULL,
          MaNguyenNhanMat = NULL,
          MaDiaDiem = NULL,
          TrangThai = 'Còn Sống'
      WHERE MaTV = ? AND TrangThai = 'Mất'
    `

    // ✅ SỬA: executeQuery → query, bỏ destructuring
    const result = await databaseService.query<ResultSetHeader>(query, [MaTV])

    if (result.affectedRows === 0) {
      throw new Error('Không tìm thấy thành viên hoặc thành viên chưa được ghi nhận mất')
    }

    return {
      message: 'Xóa thông tin kết thúc thành công (trở về trạng thái Còn Sống)',
      MaTV,
      affectedRows: result.affectedRows
    }
  }
}

const ketthucService = new KetThucService()
export default ketthucService