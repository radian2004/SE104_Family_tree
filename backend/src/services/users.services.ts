import { RowDataPacket, ResultSetHeader } from 'mysql2';
import databaseService from './database.services';
import { RegisterReqBody } from '~/models/requests/User.requests';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import { TokenType } from '~/constants/enums';
import TaiKhoan from '~/models/schemas/TaiKhoan.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';

interface TaiKhoanRow extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MatKhau: string;
  MaLoaiTK: string;
  TGTaoMoi: Date;
}

interface RefreshTokenRow extends RowDataPacket {
  token: string;
  TenDangNhap: string;
  NgayTao: Date;
  NgayHetHan: Date;
}

class UsersService {

private signAccessToken(user_id: string) {
  return signToken(
    {
      user_id,
      token_type: TokenType.AccessToken
    },
    process.env.JWT_SECRET_ACCESS_TOKEN as string,
    {
      algorithm: 'HS256',
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '15m' as any
    }
  );
}

private signRefreshToken(user_id: string) {
  return signToken(
    {
      user_id,
      token_type: TokenType.RefreshToken
    },
    process.env.JWT_SECRET_REFRESH_TOKEN as string,
    {
      algorithm: 'HS256',
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d' as any
    }
  );
}

  /**
   * Ký cả access và refresh token
   */
  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)]);
  }

  /**
   * Kiểm tra email đã tồn tại chưa
   */
  async checkEmailExist(email: string): Promise<boolean> {
    const sql = 'SELECT TenDangNhap FROM TAIKHOAN WHERE TenDangNhap = ?';
    const rows = await databaseService.query<TaiKhoanRow[]>(sql, [email]);
    return rows.length > 0;
  }

  /**
   * Đăng ký tài khoản mới
   */
  async register(payload: RegisterReqBody) {
    const { name, email, password } = payload;

    // 1. Tạo thành viên mới
    const insertThanhVienSql = `
      INSERT INTO THANHVIEN (HoTen, MaGioiTinh) 
      VALUES (?, 'GT00')
    `;
    await databaseService.query(insertThanhVienSql, [name]);

    // 2. Lấy MaTV vừa tạo (trigger tự sinh)
    const [thanhVien] = await databaseService.query<RowDataPacket[]>(
      'SELECT MaTV FROM THANHVIEN ORDER BY TGTaoMoi DESC LIMIT 1'
    );
    const MaTV = thanhVien.MaTV;

    // 3. Hash password và tạo tài khoản
    const hashedPassword = hashPassword(password);
    const insertTaiKhoanSql = `
      INSERT INTO TAIKHOAN (TenDangNhap, MaTV, MatKhau, MaLoaiTK) 
      VALUES (?, ?, ?, 'LTK02')
    `;
    await databaseService.query(insertTaiKhoanSql, [email, MaTV, hashedPassword]);

    // 4. Tạo access token và refresh token
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(email);

    // 5. Lưu refresh token vào database
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 7); // 7 ngày

    const insertRefreshTokenSql = `
      INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) 
      VALUES (?, ?, ?)
    `;
    await databaseService.query(insertRefreshTokenSql, [refresh_token, email, expDate]);

    return {
      access_token,
      refresh_token
    };
  }

  /**
   * Đăng nhập
   */
  async login(email: string, password: string) {
    // 1. Tìm tài khoản
    const sql = 'SELECT * FROM TAIKHOAN WHERE TenDangNhap = ?';
    const rows = await databaseService.query<TaiKhoanRow[]>(sql, [email]);

    if (rows.length === 0) {
      return null; // Không tìm thấy
    }

    const user = rows[0];

    // 2. So sánh password
    const hashedPassword = hashPassword(password);
    if (user.MatKhau !== hashedPassword) {
      return null; // Sai password
    }

    // 3. Tạo tokens
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user.TenDangNhap);

    // 4. Lưu refresh token
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 7);

    const insertRefreshTokenSql = `
      INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) 
      VALUES (?, ?, ?)
    `;
    await databaseService.query(insertRefreshTokenSql, [refresh_token, user.TenDangNhap, expDate]);

    return {
      access_token,
      refresh_token,
      user: {
        TenDangNhap: user.TenDangNhap,
        MaTV: user.MaTV,
        MaLoaiTK: user.MaLoaiTK
      }
    };
  }

  /**
   * Đăng xuất - Xóa refresh token
   */
  async logout(refresh_token: string) {
    const sql = 'DELETE FROM REFRESH_TOKENS WHERE token = ?';
    const result = await databaseService.query<ResultSetHeader>(sql, [refresh_token]);

    return {
      message: 'Đăng xuất thành công',
      deletedCount: result.affectedRows
    };
  }

  /**
   * Kiểm tra refresh token có tồn tại không
   */
  async checkRefreshTokenExist(refresh_token: string): Promise<boolean> {
    const sql = 'SELECT token FROM REFRESH_TOKENS WHERE token = ?';
    const rows = await databaseService.query<RefreshTokenRow[]>(sql, [refresh_token]);
    return rows.length > 0;
  }
}

const usersService = new UsersService();
export default usersService;