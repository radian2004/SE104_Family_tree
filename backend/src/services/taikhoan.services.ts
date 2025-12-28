import { RowDataPacket, ResultSetHeader } from 'mysql2';
import databaseService from './database.services';
import { ErrorWithStatus } from '~/models/Errors';
import HTTP_STATUS from '~/constants/httpStatus';

/**
 * Interface cho thông tin tài khoản chi tiết
 */
interface TaiKhoanDetailRow extends RowDataPacket {
    TenDangNhap: string;
    MaTV: string;
    MaLoaiTK: string;
    TenLoaiTK: string;
    TGTaoMoi: Date;
    HoTen: string;
    MaGiaPha: string | null;
    TenGiaPha: string | null;
}

/**
 * Service quản lý tài khoản (dành cho Admin)
 */
class TaiKhoanService {
    /**
     * Lấy danh sách tất cả tài khoản với thông tin chi tiết
     * @param filters - Bộ lọc (search, MaLoaiTK)
     */
    async getAllAccounts(filters?: {
        search?: string;
        MaLoaiTK?: string;
    }) {
        let sql = `
      SELECT 
        tk.TenDangNhap,
        tk.MaTV,
        tk.MaLoaiTK,
        ltk.TenLoaiTK,
        tk.TGTaoMoi,
        tv.HoTen,
        tv.MaGiaPha,
        gp.TenGiaPha
      FROM TAIKHOAN tk
      LEFT JOIN LOAITAIKHOAN ltk ON tk.MaLoaiTK = ltk.MaLoaiTK
      LEFT JOIN THANHVIEN tv ON tk.MaTV = tv.MaTV
      LEFT JOIN CAYGIAPHA gp ON tv.MaGiaPha = gp.MaGiaPha
      WHERE 1=1
    `;

        const params: any[] = [];

        // Filter theo từ khóa tìm kiếm
        if (filters?.search) {
            sql += ' AND (tk.TenDangNhap LIKE ? OR tv.HoTen LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        // Filter theo loại tài khoản
        if (filters?.MaLoaiTK) {
            sql += ' AND tk.MaLoaiTK = ?';
            params.push(filters.MaLoaiTK);
        }

        sql += ' ORDER BY tk.TGTaoMoi DESC';

        const rows = await databaseService.query<TaiKhoanDetailRow[]>(sql, params);

        return rows.map(row => ({
            TenDangNhap: row.TenDangNhap,
            MaTV: row.MaTV,
            MaLoaiTK: row.MaLoaiTK,
            TenLoaiTK: row.TenLoaiTK,
            TGTaoMoi: row.TGTaoMoi,
            HoTen: row.HoTen,
            MaGiaPha: row.MaGiaPha,
            TenGiaPha: row.TenGiaPha,
        }));
    }

    /**
     * Cấp quyền Owner (LTK02) cho tài khoản
     * - Chỉ cho phép nâng từ LTK03 -> LTK02
     * - Admin không thể thay đổi quyền của chính mình
     */
    async promoteToOwner(targetEmail: string, adminEmail: string) {
        // Không cho phép admin tự thay đổi quyền của mình
        if (targetEmail === adminEmail) {
            throw new ErrorWithStatus({
                message: 'Không thể thay đổi quyền của chính mình',
                status: HTTP_STATUS.FORBIDDEN
            });
        }

        // Kiểm tra tài khoản tồn tại và loại tài khoản hiện tại
        const [accountRows] = await databaseService.getPool().execute<RowDataPacket[]>(
            'SELECT MaLoaiTK FROM TAIKHOAN WHERE TenDangNhap = ?',
            [targetEmail]
        );

        if (accountRows.length === 0) {
            throw new ErrorWithStatus({
                message: 'Không tìm thấy tài khoản',
                status: HTTP_STATUS.NOT_FOUND
            });
        }

        const currentRole = accountRows[0].MaLoaiTK;

        // Chỉ cho phép nâng từ User (LTK03) lên Owner (LTK02)
        if (currentRole !== 'LTK03') {
            throw new ErrorWithStatus({
                message: 'Chỉ có thể cấp quyền cho tài khoản Thành viên (LTK03)',
                status: HTTP_STATUS.BAD_REQUEST
            });
        }

        // Cập nhật quyền
        await databaseService.getPool().execute<ResultSetHeader>(
            'UPDATE TAIKHOAN SET MaLoaiTK = ? WHERE TenDangNhap = ?',
            ['LTK02', targetEmail]
        );

        return {
            message: 'Cấp quyền Người lập cây gia phả thành công',
            TenDangNhap: targetEmail,
            oldRole: 'LTK03',
            newRole: 'LTK02'
        };
    }

    /**
     * Hạ quyền về User (LTK03)
     * - Chỉ cho phép hạ từ LTK02 -> LTK03
     * - Admin không thể thay đổi quyền của Admin khác hoặc chính mình
     */
    async demoteToUser(targetEmail: string, adminEmail: string) {
        // Không cho phép admin tự thay đổi quyền của mình
        if (targetEmail === adminEmail) {
            throw new ErrorWithStatus({
                message: 'Không thể thay đổi quyền của chính mình',
                status: HTTP_STATUS.FORBIDDEN
            });
        }

        // Kiểm tra tài khoản tồn tại và loại tài khoản hiện tại
        const [accountRows] = await databaseService.getPool().execute<RowDataPacket[]>(
            'SELECT MaLoaiTK FROM TAIKHOAN WHERE TenDangNhap = ?',
            [targetEmail]
        );

        if (accountRows.length === 0) {
            throw new ErrorWithStatus({
                message: 'Không tìm thấy tài khoản',
                status: HTTP_STATUS.NOT_FOUND
            });
        }

        const currentRole = accountRows[0].MaLoaiTK;

        // Không cho phép hạ quyền Admin
        if (currentRole === 'LTK01') {
            throw new ErrorWithStatus({
                message: 'Không thể hạ quyền Quản trị viên',
                status: HTTP_STATUS.FORBIDDEN
            });
        }

        // Chỉ cho phép hạ từ Owner (LTK02) xuống User (LTK03)
        if (currentRole !== 'LTK02') {
            throw new ErrorWithStatus({
                message: 'Tài khoản này đã là Thành viên (LTK03)',
                status: HTTP_STATUS.BAD_REQUEST
            });
        }

        // Cập nhật quyền
        await databaseService.getPool().execute<ResultSetHeader>(
            'UPDATE TAIKHOAN SET MaLoaiTK = ? WHERE TenDangNhap = ?',
            ['LTK03', targetEmail]
        );

        return {
            message: 'Hạ quyền về Thành viên thành công',
            TenDangNhap: targetEmail,
            oldRole: 'LTK02',
            newRole: 'LTK03'
        };
    }

    /**
     * Lấy danh sách loại tài khoản
     */
    async getAccountTypes() {
        const sql = 'SELECT * FROM LOAITAIKHOAN ORDER BY MaLoaiTK';
        const rows = await databaseService.query<RowDataPacket[]>(sql);
        return rows;
    }
}

const taikhoanService = new TaiKhoanService();
export default taikhoanService;
