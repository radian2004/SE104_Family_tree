// src/services/giapha.services.ts
import databaseService from './database.services';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Interface cho Gia Phả
interface GiaPha {
    MaGiaPha: string;
    TenGiaPha: string;
    NguoiLap?: string;
    TGLap?: Date;
    TruongToc?: string;
}

interface CreateGiaPhaData {
    TenGiaPha: string;
    TruongToc?: string;
}

interface UpdateGiaPhaData {
    TenGiaPha?: string;
    TruongToc?: string;
}

class GiaPhaService {
    /**
     * Lấy danh sách tất cả gia phả
     */
    /**
     * Lấy danh sách gia phả theo quyền hạn
     * - Admin (LTK01): Tất cả
     * - Owner (LTK02) / User (LTK03): Chỉ cây mình làm Trưởng tộc hoặc là Thành viên
     */
    async getAll(userId: string, userRole: string): Promise<GiaPha[]> {
        let condition = '';
        const params: any[] = [];

        // Nếu không phải Admin, áp dụng filter
        if (userRole !== 'LTK01') {
            condition = `
                WHERE gp.TruongToc = ? 
                OR gp.MaGiaPha IN (SELECT MaGiaPha FROM THANHVIEN WHERE MaTV = ?)
            `;
            params.push(userId, userId);
        }

        const sql = `
            SELECT 
                gp.MaGiaPha,
                gp.TenGiaPha,
                gp.NguoiLap,
                gp.TGLap,
                gp.TruongToc,
                nl.HoTen as TenNguoiLap,
                tt.HoTen as TenTruongToc,
                (SELECT COUNT(*) FROM THANHVIEN WHERE MaGiaPha = gp.MaGiaPha) as SoThanhVien,
                (SELECT CAST(MAX(DOI) - MIN(DOI) + 1 AS UNSIGNED) FROM THANHVIEN WHERE MaGiaPha = gp.MaGiaPha) as SoDoi
            FROM CAYGIAPHA gp
            LEFT JOIN THANHVIEN nl ON gp.NguoiLap = nl.MaTV
            LEFT JOIN THANHVIEN tt ON gp.TruongToc = tt.MaTV
            ${condition}
            ORDER BY gp.TGLap DESC
        `;
        const result = await databaseService.query<RowDataPacket[]>(sql, params);
        return result as GiaPha[];
    }

    /**
     * Lấy chi tiết gia phả theo mã
     */
    async getDetail(MaGiaPha: string): Promise<GiaPha | null> {
        const sql = `
            SELECT 
                gp.MaGiaPha,
                gp.TenGiaPha,
                gp.NguoiLap,
                gp.TGLap,
                gp.TruongToc,
                nl.HoTen as TenNguoiLap,
                tt.HoTen as TenTruongToc,
                (SELECT COUNT(*) FROM THANHVIEN WHERE MaGiaPha = gp.MaGiaPha) as SoThanhVien
            FROM CAYGIAPHA gp
            LEFT JOIN THANHVIEN nl ON gp.NguoiLap = nl.MaTV
            LEFT JOIN THANHVIEN tt ON gp.TruongToc = tt.MaTV
            WHERE gp.MaGiaPha = ?
        `;
        const result = await databaseService.query<RowDataPacket[]>(sql, [MaGiaPha]);
        return result.length > 0 ? (result[0] as GiaPha) : null;
    }

    /**
     * Tạo gia phả mới
     */
    async create(data: CreateGiaPhaData, userId?: string): Promise<GiaPha> {
        const { TenGiaPha, TruongToc } = data;

        // Trigger sẽ tự động tạo MaGiaPha
        const sql = `
            INSERT INTO CAYGIAPHA (TenGiaPha, NguoiLap, TruongToc)
            VALUES (?, ?, ?)
        `;

        await databaseService.query<ResultSetHeader>(sql, [
            TenGiaPha,
            userId || null,  // NguoiLap là user hiện tại
            TruongToc || null
        ]);

        // Lấy gia phả vừa tạo (MaGiaPha được tạo bởi trigger)
        const getLastSql = `
            SELECT * FROM CAYGIAPHA 
            WHERE TenGiaPha = ? 
            ORDER BY TGLap DESC 
            LIMIT 1
        `;
        const result = await databaseService.query<RowDataPacket[]>(getLastSql, [TenGiaPha]);

        if (result.length === 0) {
            throw new Error('Không thể tạo gia phả');
        }

        return result[0] as GiaPha;
    }

    /**
     * Cập nhật gia phả
     */
    async update(MaGiaPha: string, data: UpdateGiaPhaData): Promise<GiaPha | null> {
        const updates: string[] = [];
        const values: any[] = [];

        if (data.TenGiaPha !== undefined) {
            updates.push('TenGiaPha = ?');
            values.push(data.TenGiaPha);
        }

        if (data.TruongToc !== undefined) {
            updates.push('TruongToc = ?');
            values.push(data.TruongToc || null);
        }

        if (updates.length === 0) {
            return this.getDetail(MaGiaPha);
        }

        values.push(MaGiaPha);

        const sql = `UPDATE CAYGIAPHA SET ${updates.join(', ')} WHERE MaGiaPha = ?`;
        await databaseService.query<ResultSetHeader>(sql, values);

        return this.getDetail(MaGiaPha);
    }

    /**
     * Xóa gia phả
     * Lưu ý: Cần xử lý thành viên thuộc gia phả trước khi xóa
     */
    async delete(MaGiaPha: string): Promise<boolean> {
        // Kiểm tra gia phả có tồn tại không
        const giaPha = await this.getDetail(MaGiaPha);
        if (!giaPha) {
            throw new Error('Gia phả không tồn tại');
        }

        // Xóa liên kết thành viên với gia phả (set MaGiaPha = NULL)
        const unlinkSql = `UPDATE THANHVIEN SET MaGiaPha = NULL WHERE MaGiaPha = ?`;
        await databaseService.query<ResultSetHeader>(unlinkSql, [MaGiaPha]);

        // Xóa gia phả
        const deleteSql = `DELETE FROM CAYGIAPHA WHERE MaGiaPha = ?`;
        const result = await databaseService.query<ResultSetHeader>(deleteSql, [MaGiaPha]);

        return result.affectedRows > 0;
    }

    /**
     * Thêm thành viên vào gia phả
     */
    async addMember(MaGiaPha: string, MaTV: string): Promise<boolean> {
        // Kiểm tra gia phả có tồn tại không
        const giaPha = await this.getDetail(MaGiaPha);
        if (!giaPha) {
            throw new Error('Gia phả không tồn tại');
        }

        // Kiểm tra thành viên có tồn tại không
        const checkMemberSql = `SELECT MaTV FROM THANHVIEN WHERE MaTV = ?`;
        const memberResult = await databaseService.query<RowDataPacket[]>(checkMemberSql, [MaTV]);
        if (memberResult.length === 0) {
            throw new Error('Thành viên không tồn tại');
        }

        // Cập nhật MaGiaPha cho thành viên
        const sql = `UPDATE THANHVIEN SET MaGiaPha = ? WHERE MaTV = ?`;
        const result = await databaseService.query<ResultSetHeader>(sql, [MaGiaPha, MaTV]);

        return result.affectedRows > 0;
    }

    /**
     * Xóa thành viên khỏi gia phả (set MaGiaPha = NULL)
     */
    async removeMember(MaTV: string): Promise<boolean> {
        const sql = `UPDATE THANHVIEN SET MaGiaPha = NULL WHERE MaTV = ?`;
        const result = await databaseService.query<ResultSetHeader>(sql, [MaTV]);
        return result.affectedRows > 0;
    }

    /**
     * Lấy danh sách thành viên của gia phả
     */
    async getMembers(MaGiaPha: string): Promise<any[]> {
        const sql = `
            SELECT 
                tv.*,
                hn.TenHonNhan as QueQuan,
                nn.TenNgheNghiep
            FROM THANHVIEN tv
            LEFT JOIN QUEQUAN hn ON tv.MaQueQuan = hn.MaQueQuan
            LEFT JOIN NGHENGHIEP nn ON tv.MaNgheNghiep = nn.MaNgheNghiep
            WHERE tv.MaGiaPha = ?
            ORDER BY tv.DOI, tv.HoTen
        `;
        const result = await databaseService.query<RowDataPacket[]>(sql, [MaGiaPha]);
        return result;
    }

    /**
     * Tìm kiếm thành viên theo tên (autocomplete)
     */
    async searchMembersByName(name: string, limit: number = 10): Promise<any[]> {
        const sql = `
            SELECT 
                tv.MaTV,
                tv.HoTen,
                tv.MaGiaPha,
                gp.TenGiaPha
            FROM THANHVIEN tv
            LEFT JOIN CAYGIAPHA gp ON tv.MaGiaPha = gp.MaGiaPha
            WHERE tv.HoTen LIKE ?
            ORDER BY tv.HoTen
            LIMIT ?
        `;
        const result = await databaseService.query<RowDataPacket[]>(sql, [`%${name}%`, String(limit)]);
        return result;
    }

    /**
     * Tìm thành viên theo email đăng nhập
     */
    async findMemberByEmail(email: string): Promise<any | null> {
        const sql = `
            SELECT 
                tv.MaTV,
                tv.HoTen,
                tv.MaGiaPha,
                tk.TenDangNhap as Email
            FROM TAIKHOAN tk
            INNER JOIN THANHVIEN tv ON tk.MaTV = tv.MaTV
            WHERE tk.TenDangNhap = ?
        `;
        const result = await databaseService.query<RowDataPacket[]>(sql, [email]);
        return result.length > 0 ? result[0] : null;
    }

    /**
     * Thêm thành viên vào gia phả bằng email đăng nhập
     */
    async addMemberByEmail(MaGiaPha: string, email: string): Promise<boolean> {
        // Kiểm tra gia phả có tồn tại không
        const giaPha = await this.getDetail(MaGiaPha);
        if (!giaPha) {
            throw new Error('Gia phả không tồn tại');
        }

        // Tìm thành viên theo email
        const member = await this.findMemberByEmail(email);
        if (!member) {
            throw new Error('Không tìm thấy thành viên với email này. Đảm bảo tài khoản đã được liên kết với thành viên.');
        }

        // Kiểm tra thành viên đã thuộc gia phả khác chưa
        if (member.MaGiaPha && member.MaGiaPha !== MaGiaPha) {
            throw new Error(`Thành viên "${member.HoTen}" đã thuộc gia phả khác`);
        }

        // Cập nhật MaGiaPha cho thành viên
        const sql = `UPDATE THANHVIEN SET MaGiaPha = ? WHERE MaTV = ?`;
        const result = await databaseService.query<ResultSetHeader>(sql, [MaGiaPha, member.MaTV]);

        return result.affectedRows > 0;
    }
}

const giaPhaService = new GiaPhaService();
export default giaPhaService;

