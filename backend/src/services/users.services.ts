import { RowDataPacket, ResultSetHeader } from 'mysql2';
import databaseService from './database.services';
import { RegisterReqBody } from '~/models/requests/User.requests';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import { TokenType } from '~/constants/enums';
import dotenv from 'dotenv';
import { USERS_MESSAGES } from '~/constants/messages';
import HTTP_STATUS from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';

dotenv.config();

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

interface GetMeUserRow extends RowDataPacket {
  // Thông tin tài khoản
  TenDangNhap: string;
  MaTV: string | null;
  MaLoaiTK: string;
  TenLoaiTK: string;

  // Thông tin thành viên
  HoTen: string | null;
  NgayGioSinh: Date | null;
  DiaChi: string | null;
  TrangThai: string | null;
  DOI: number | null;
  GioiTinh: string | null;

  // Quê quán
  TenQueQuan: string | null;

  // Nghề nghiệp
  TenNgheNghiep: string | null;

  // Gia phả
  MaGiaPha: string | null;
  TenGiaPha: string | null;
  TenNguoiLap: string | null;
  TenTruongToc: string | null;
}

// Interface cho quan hệ hôn nhân
interface HonNhanInfoRow extends RowDataPacket {
  HoTenVC: string;
  GioiTinhVC: string;
  NgayGioSinhVC: Date | null;
  NgayBatDau: Date;
  NgayKetThuc: Date | null;
  TrangThaiHonNhan: string; // 'Đang kết hôn' hoặc 'Đã kết thúc'
}

// Interface cho quan hệ cha mẹ
interface QuanHeChaMemRow extends RowDataPacket {
  HoTenCha: string | null;
  GioiTinhCha: string | null;
  HoTenMe: string | null;
  GioiTinhMe: string | null;
}

// Interface cho danh sách thành tích
interface ThanhTichInfoRow extends RowDataPacket {
  TenLTT: string;
  NgayPhatSinh: Date;
}


class UsersService {

  private signAccessToken(user_id: string) {
    const secretKey = process.env.JWT_SECRET_ACCESS_TOKEN as string;
    if (!secretKey) {
      throw new Error('JWT_SECRET_ACCESS_TOKEN is not defined in environment variables');
    }
    return signToken(
      {
        user_id,
        token_type: TokenType.AccessToken
      },
      secretKey,
      {
        algorithm: 'HS256',
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '15m' as any
      }
    );
  }

  private signRefreshToken(user_id: string) {
    const secretKey = process.env.JWT_SECRET_REFRESH_TOKEN as string;
    if (!secretKey) {
      throw new Error('JWT_SECRET_REFRESH_TOKEN is not defined in environment variables');
    }
    return signToken(
      {
        user_id,
        token_type: TokenType.RefreshToken
      },
      secretKey,
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
   * - Trường hợp 1: giapha.exist = false → Tạo gia phả MỚI, user là Trưởng tộc
   * - Trường hợp 2: giapha.exist = true → Gia nhập gia phả có sẵn
   */
  async register(payload: RegisterReqBody) {
    const { name, email, password, giapha } = payload;
    const hashedPassword = hashPassword(password);

    // Kiểm tra email đã tồn tại chưa
    const emailExists = await this.checkEmailExist(email);
    if (emailExists) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS,
        status: HTTP_STATUS.CONFLICT
      });
    }

    // Validate input
    if (!name || !giapha || !giapha.name) {
      throw new ErrorWithStatus({
        message: 'Vui lòng nhập tên và thông tin gia phả',
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    let MaGiaPha: string;
    let MaTV: string;
    let HoTen: string = name;
    let resultMessage: string;
    let accountType: string = 'LTK03'; // User mặc định

    // ========== TRƯỜNG HỢP 1: TẠO GIA PHẢ MỚI (exist = false) ==========
    if (giapha.exist === false) {
      // 1. Tạo gia phả mới
      await databaseService.getPool().execute<ResultSetHeader>(
        'INSERT INTO CAYGIAPHA (TenGiaPha) VALUES (?)',
        [giapha.name]
      );

      // 2. Lấy MaGiaPha vừa tạo
      const [gpRows] = await databaseService.getPool().execute<RowDataPacket[]>(
        'SELECT MaGiaPha FROM CAYGIAPHA WHERE TenGiaPha = ? ORDER BY MaGiaPha DESC LIMIT 1',
        [giapha.name]
      );
      MaGiaPha = gpRows[0].MaGiaPha;

      // 3. Tạo thành viên mới (người lập gia phả)
      await databaseService.getPool().execute<ResultSetHeader>(
        'INSERT INTO THANHVIEN (MaGiaPha, HoTen, DOI, TrangThai) VALUES (?, ?, 1, ?)',
        [MaGiaPha, name, 'Còn Sống']
      );

      // 4. Lấy MaTV vừa tạo
      const [tvRows] = await databaseService.getPool().execute<RowDataPacket[]>(
        'SELECT MaTV FROM THANHVIEN WHERE MaGiaPha = ? AND HoTen = ? ORDER BY MaTV DESC LIMIT 1',
        [MaGiaPha, name]
      );
      MaTV = tvRows[0].MaTV;

      // 5. Cập nhật NguoiLap và TruongToc
      await databaseService.getPool().execute(
        'UPDATE CAYGIAPHA SET NguoiLap = ?, TruongToc = ? WHERE MaGiaPha = ?',
        [MaTV, MaTV, MaGiaPha]
      );

      // 6. Tạo tài khoản với quyền Trưởng tộc (LTK02)
      accountType = 'LTK02';
      resultMessage = `Đăng ký thành công! Bạn đã tạo gia phả "${giapha.name}" và trở thành Trưởng tộc.`;

    }
    // ========== TRƯỜNG HỢP 2: GIA NHẬP GIA PHẢ CÓ SẴN (exist = true) ==========
    else {
      // 1. Tìm gia phả theo tên
      const [giaPhaRows] = await databaseService.getPool().execute<RowDataPacket[]>(
        'SELECT MaGiaPha, TenGiaPha FROM CAYGIAPHA WHERE TenGiaPha = ?',
        [giapha.name]
      );

      if (giaPhaRows.length === 0) {
        throw new ErrorWithStatus({
          message: `Không tìm thấy gia phả "${giapha.name}". Vui lòng kiểm tra lại hoặc tạo gia phả mới.`,
          status: HTTP_STATUS.NOT_FOUND
        });
      }

      MaGiaPha = giaPhaRows[0].MaGiaPha;

      // 2. Tìm thành viên
      if (giapha.MaTV) {
        // Đã chọn MaTV cụ thể (trường hợp trùng tên)
        const [memberRows] = await databaseService.getPool().execute<RowDataPacket[]>(
          `SELECT tv.MaTV, tv.HoTen, tk.TenDangNhap AS HasAccount
           FROM THANHVIEN tv
           LEFT JOIN TAIKHOAN tk ON tv.MaTV = tk.MaTV
           WHERE tv.MaTV = ? AND tv.MaGiaPha = ?`,
          [giapha.MaTV, MaGiaPha]
        );

        if (memberRows.length === 0) {
          throw new ErrorWithStatus({
            message: `Không tìm thấy thành viên với mã "${giapha.MaTV}" trong gia phả.`,
            status: HTTP_STATUS.NOT_FOUND
          });
        }

        const member = memberRows[0];
        if (member.HasAccount) {
          throw new ErrorWithStatus({
            message: `Thành viên này đã có tài khoản (${member.HasAccount}). Vui lòng đăng nhập.`,
            status: HTTP_STATUS.CONFLICT
          });
        }

        MaTV = member.MaTV;
        HoTen = member.HoTen;
        resultMessage = `Đăng ký thành công! Tài khoản đã được liên kết với "${HoTen}" trong gia phả "${giapha.name}".`;

      } else {
        // Tìm theo tên
        const [memberRows] = await databaseService.getPool().execute<RowDataPacket[]>(
          `SELECT tv.MaTV, tv.HoTen, tv.DOI, tv.GioiTinh, tv.NgayGioSinh, tv.DiaChi,
                  cha.HoTen AS TenCha, me.HoTen AS TenMe,
                  tk.TenDangNhap AS HasAccount
           FROM THANHVIEN tv
           LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
           LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
           LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
           LEFT JOIN TAIKHOAN tk ON tv.MaTV = tk.MaTV
           WHERE tv.MaGiaPha = ? AND tv.HoTen = ?
           ORDER BY tv.DOI ASC`,
          [MaGiaPha, name]
        );

        if (memberRows.length === 0) {
          throw new ErrorWithStatus({
            message: `Không tìm thấy thành viên "${name}" trong gia phả "${giapha.name}". Vui lòng liên hệ Trưởng tộc để được thêm vào.`,
            status: HTTP_STATUS.NOT_FOUND
          });
        }

        // Filter những người chưa có tài khoản
        const available = memberRows.filter((m: any) => !m.HasAccount);

        if (available.length === 0) {
          throw new ErrorWithStatus({
            message: `Tất cả thành viên tên "${name}" đều đã có tài khoản. Vui lòng đăng nhập.`,
            status: HTTP_STATUS.CONFLICT
          });
        }

        if (available.length === 1) {
          // Chỉ còn 1 người → tự động liên kết
          MaTV = available[0].MaTV;
          HoTen = available[0].HoTen;
          resultMessage = `Đăng ký thành công! Tài khoản đã được liên kết với "${HoTen}" trong gia phả "${giapha.name}".`;
        } else {
          // Nhiều người cùng tên → yêu cầu chọn
          const candidates = available.map((m: any) => ({
            MaTV: m.MaTV,
            HoTen: m.HoTen,
            DOI: m.DOI,
            GioiTinh: m.GioiTinh,
            NgayGioSinh: m.NgayGioSinh,
            DiaChi: m.DiaChi,
            TenCha: m.TenCha || 'Không rõ',
            TenMe: m.TenMe || 'Không rõ'
          }));

          const error: any = new ErrorWithStatus({
            message: `Có ${available.length} thành viên cùng tên "${name}". Vui lòng chọn đúng thành viên.`,
            status: 300 // Multiple Choices
          });
          error.candidates = candidates;
          throw error;
        }
      }

      // 3. Kiểm tra thành viên đã có tài khoản chưa (double check)
      const [accountRows] = await databaseService.getPool().execute<RowDataPacket[]>(
        'SELECT TenDangNhap FROM TAIKHOAN WHERE MaTV = ?',
        [MaTV]
      );

      if (accountRows.length > 0) {
        throw new ErrorWithStatus({
          message: `Thành viên này đã có tài khoản (${accountRows[0].TenDangNhap}). Vui lòng đăng nhập.`,
          status: HTTP_STATUS.CONFLICT
        });
      }
    }

    // Tạo tài khoản
    await databaseService.getPool().execute<ResultSetHeader>(
      'INSERT INTO TAIKHOAN (TenDangNhap, MaTV, MatKhau, MaLoaiTK) VALUES (?, ?, ?, ?)',
      [email, MaTV, hashedPassword, accountType]
    );

    return {
      message: resultMessage!,
      MaTV,
      MaGiaPha,
      HoTen,
      TenGiaPha: giapha.name,
      isNewGiaPha: giapha.exist === false,
      isTruongToc: accountType === 'LTK02'
    };
  }

  /**
   * Lấy danh sách gia phả (cho dropdown đăng ký)
   */
  async getAvailableGenealogies() {
    const sql = 'SELECT MaGiaPha, TenGiaPha FROM CAYGIAPHA ORDER BY TenGiaPha';
    const rows = await databaseService.query<RowDataPacket[]>(sql);
    return rows.map(row => ({
      MaGiaPha: row.MaGiaPha,
      TenGiaPha: row.TenGiaPha
    }));
  }

  /**
   * Lấy danh sách thành viên chưa có tài khoản trong gia phả (cho dropdown đăng ký)
   */
  async getAvailableMembersForRegistration(giaPhaName: string) {
    // Tìm gia phả theo tên
    const [giaPhaRows] = await databaseService.getPool().execute<RowDataPacket[]>(
      'SELECT MaGiaPha FROM CAYGIAPHA WHERE TenGiaPha = ?',
      [giaPhaName]
    );

    if (giaPhaRows.length === 0) {
      throw new ErrorWithStatus({
        message: `Không tìm thấy gia phả "${giaPhaName}"`,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    const MaGiaPha = giaPhaRows[0].MaGiaPha;

    // Lấy thành viên chưa có tài khoản + thông tin chi tiết để phân biệt trùng tên
    const sql = `
      SELECT 
        tv.MaTV, 
        tv.HoTen, 
        tv.NgayGioSinh,
        tv.DOI,
        tv.GioiTinh,
        tv.DiaChi,
        qq.TenQueQuan,
        cha.HoTen AS TenCha,
        me.HoTen AS TenMe
      FROM THANHVIEN tv
      LEFT JOIN TAIKHOAN tk ON tv.MaTV = tk.MaTV
      LEFT JOIN QUEQUAN qq ON tv.MaQueQuan = qq.MaQueQuan
      LEFT JOIN QUANHECON qhc_cha ON tv.MaTV = qhc_cha.MaCon AND qhc_cha.QuanHe = 'Con ruột'
      LEFT JOIN THANHVIEN cha ON qhc_cha.MaCha = cha.MaTV
      LEFT JOIN QUANHECON qhc_me ON tv.MaTV = qhc_me.MaCon AND qhc_me.QuanHe = 'Con ruột'
      LEFT JOIN HONNHAN hn ON qhc_me.MaCha = hn.MaChong OR qhc_me.MaCha = hn.MaVo
      LEFT JOIN THANHVIEN me ON (hn.MaVo = me.MaTV AND hn.MaChong = cha.MaTV) OR (hn.MaChong = me.MaTV AND hn.MaVo = cha.MaTV)
      WHERE tv.MaGiaPha = ? AND tk.TenDangNhap IS NULL
      ORDER BY tv.HoTen, tv.NgayGioSinh
    `;
    const rows = await databaseService.query<RowDataPacket[]>(sql, [MaGiaPha]);

    return rows.map(row => ({
      MaTV: row.MaTV,
      HoTen: row.HoTen,
      NgayGioSinh: row.NgayGioSinh,
      DOI: row.DOI,
      GioiTinh: row.GioiTinh,
      DiaChi: row.DiaChi || row.TenQueQuan,
      TenCha: row.TenCha,
      TenMe: row.TenMe,
      HasAccount: false
    }));
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

  /**
   * Làm mới access token và refresh token
   * @param old_refresh_token - Refresh token cũ (sẽ decode để lấy user_id)
   */
  async refreshToken(old_refresh_token: string) {
    // 1. Tìm user_id từ refresh token trong database
    const findUserSql = 'SELECT TenDangNhap FROM REFRESH_TOKENS WHERE token = ? AND NgayHetHan > NOW()';
    const rows = await databaseService.query<RefreshTokenRow[]>(findUserSql, [old_refresh_token]);

    if (rows.length === 0) {
      return null; // Token không hợp lệ hoặc đã hết hạn
    }

    const user_id = rows[0].TenDangNhap;

    // 2. Xóa refresh token cũ khỏi database
    const deleteSql = 'DELETE FROM REFRESH_TOKENS WHERE token = ?';
    await databaseService.query(deleteSql, [old_refresh_token]);

    // 3. Tạo cặp token mới
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id);

    // 4. Lưu refresh token mới vào database
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 7);

    const insertRefreshTokenSql = `
      INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) 
      VALUES (?, ?, ?)
    `;
    await databaseService.query(insertRefreshTokenSql, [refresh_token, user_id, expDate]);

    // 5. Lấy thông tin user
    const userSql = `
      SELECT tk.TenDangNhap, tk.MaTV, tk.MaLoaiTK, tv.HoTen 
      FROM TAIKHOAN tk
      LEFT JOIN THANHVIEN tv ON tk.MaTV = tv.MaTV
      WHERE tk.TenDangNhap = ?
    `;
    const userRows = await databaseService.query<TaiKhoanRow[]>(userSql, [user_id]);

    return {
      access_token,
      refresh_token,
      user: userRows.length > 0 ? {
        TenDangNhap: userRows[0].TenDangNhap,
        MaTV: userRows[0].MaTV,
        MaLoaiTK: userRows[0].MaLoaiTK,
        HoTen: (userRows[0] as any).HoTen // Cast as any because TaiKhoanRow might not have HoTen yet
      } : null
    };
  }

  async getMe(user_id: string) {
    // 1. Lấy thông tin cơ bản của user từ nhiều bảng
    const userInfoSql = `
      SELECT 
        tk.TenDangNhap,
        tk.MaTV,
        tk.MaLoaiTK,
        ltk.TenLoaiTK,
        tk.TGTaoMoi AS TGTaoTK,
        
        tv.HoTen,
        tv.NgayGioSinh,
        tv.DiaChi,
        tv.TrangThai,
        tv.DOI,
        tv.GioiTinh,
        tv.TGTaoMoi,
        tv.NgayGioMat,
        
        tv.MaNguyenNhanMat,
        nnm.TenNguyenNhanMat,
        
        tv.MaDiaDiem,
        dd.TenDiaDiem,
        
        tv.MaQueQuan,
        qq.TenQueQuan,
        
        tv.MaNgheNghiep,
        nn.TenNgheNghiep,
        
        tv.MaGiaPha,
        gp.TenGiaPha,
        gp.NguoiLap,
        nl.HoTen AS TenNguoiLap,
        gp.TruongToc,
        tt.HoTen AS TenTruongToc,
        gp.TGLap
        
      FROM TAIKHOAN tk
      LEFT JOIN THANHVIEN tv ON tk.MaTV = tv.MaTV
      LEFT JOIN LOAITAIKHOAN ltk ON tk.MaLoaiTK = ltk.MaLoaiTK
      LEFT JOIN QUEQUAN qq ON tv.MaQueQuan = qq.MaQueQuan
      LEFT JOIN NGHENGHIEP nn ON tv.MaNgheNghiep = nn.MaNgheNghiep
      LEFT JOIN NGUYENNHANMAT nnm ON tv.MaNguyenNhanMat = nnm.MaNguyenNhanMat
      LEFT JOIN DIADIEMMAITANG dd ON tv.MaDiaDiem = dd.MaDiaDiem
      LEFT JOIN CAYGIAPHA gp ON tv.MaGiaPha = gp.MaGiaPha
      LEFT JOIN THANHVIEN nl ON gp.NguoiLap = nl.MaTV
      LEFT JOIN THANHVIEN tt ON gp.TruongToc = tt.MaTV
      WHERE tk.TenDangNhap = ?
    `;

    const userInfoRows = await databaseService.query<GetMeUserRow[]>(userInfoSql, [user_id]);

    if (userInfoRows.length === 0) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    const userInfo = userInfoRows[0];

    // Nếu tài khoản không liên kết với thành viên (admin account)
    if (!userInfo.MaTV) {
      return {
        TenDangNhap: userInfo.TenDangNhap,
        MaLoaiTK: userInfo.MaLoaiTK,
        LoaiTaiKhoan: userInfo.TenLoaiTK,
        HoTen: null,
        MaTV: null,
        MaGiaPha: null,
        GiaPha: null,
        HonNhan: [],
        ChaMe: null,
        ThanhTich: []
      };
    }

    // 2. Lấy thông tin quan hệ hôn nhân (vợ/chồng)
    const honNhanSql = `
      SELECT 
        tv.HoTen AS HoTenVC,
        tv.GioiTinh AS GioiTinhVC,
        tv.NgayGioSinh AS NgayGioSinhVC,
        hn.NgayBatDau,
        hn.NgayKetThuc,
        CASE 
          WHEN hn.NgayKetThuc IS NULL THEN 'Đang kết hôn'
          ELSE 'Đã kết thúc'
        END AS TrangThaiHonNhan
      FROM HONNHAN hn
      INNER JOIN THANHVIEN tv ON hn.MaTVVC = tv.MaTV
      WHERE hn.MaTV = ?
      ORDER BY hn.NgayBatDau DESC
    `;

    const honNhanRows = await databaseService.query<HonNhanInfoRow[]>(honNhanSql, [userInfo.MaTV]);

    // 3. Lấy thông tin cha mẹ
    const quanHeChaMemSql = `
      SELECT 
        cha.HoTen AS HoTenCha,
        cha.GioiTinh AS GioiTinhCha,
        me.HoTen AS HoTenMe,
        me.GioiTinh AS GioiTinhMe
      FROM QUANHECON qhc
      LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
      LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
      WHERE qhc.MaTV = ?
    `;

    const quanHeChaMemRows = await databaseService.query<QuanHeChaMemRow[]>(quanHeChaMemSql, [userInfo.MaTV]);

    // 4. Lấy danh sách thành tích
    const thanhTichSql = `
      SELECT 
        ltt.TenLTT,
        gnt.NgayPhatSinh
      FROM GHINHANTHANHTICH gnt
      INNER JOIN LOAITHANHTICH ltt ON gnt.MaLTT = ltt.MaLTT
      WHERE gnt.MaTV = ?
      ORDER BY gnt.NgayPhatSinh DESC
    `;

    const thanhTichRows = await databaseService.query<ThanhTichInfoRow[]>(thanhTichSql, [userInfo.MaTV]);

    // 5. Trả về kết quả tổng hợp
    return {
      // Thông tin tài khoản
      TenDangNhap: userInfo.TenDangNhap,
      MaLoaiTK: userInfo.MaLoaiTK,
      LoaiTaiKhoan: userInfo.TenLoaiTK,

      // Thông tin cơ bản thành viên
      MaTV: userInfo.MaTV,
      HoTen: userInfo.HoTen,
      NgayGioSinh: userInfo.NgayGioSinh,
      DiaChi: userInfo.DiaChi,
      GioiTinh: userInfo.GioiTinh,
      Doi: userInfo.DOI,
      TrangThai: userInfo.TrangThai,

      // Thông tin quê quán
      QueQuan: userInfo.TenQueQuan,

      // Thông tin nghề nghiệp
      NgheNghiep: userInfo.TenNgheNghiep,

      // Thông tin gia phả
      MaGiaPha: userInfo.MaGiaPha,
      GiaPha: userInfo.TenGiaPha ? {
        TenGiaPha: userInfo.TenGiaPha,
        NguoiLap: userInfo.TenNguoiLap,
        TruongToc: userInfo.TenTruongToc
      } : null,

      // Danh sách vợ/chồng
      HonNhan: honNhanRows.map(hn => ({
        HoTen: hn.HoTenVC,
        GioiTinh: hn.GioiTinhVC,
        NgayGioSinh: hn.NgayGioSinhVC,
        NgayBatDau: hn.NgayBatDau,
        NgayKetThuc: hn.NgayKetThuc,
        TrangThai: hn.TrangThaiHonNhan
      })),

      // Thông tin cha mẹ
      ChaMe: quanHeChaMemRows.length > 0 ? {
        Cha: quanHeChaMemRows[0].HoTenCha ? {
          HoTen: quanHeChaMemRows[0].HoTenCha,
          GioiTinh: quanHeChaMemRows[0].GioiTinhCha
        } : null,
        Me: quanHeChaMemRows[0].HoTenMe ? {
          HoTen: quanHeChaMemRows[0].HoTenMe,
          GioiTinh: quanHeChaMemRows[0].GioiTinhMe
        } : null
      } : null,

      // Danh sách thành tích
      ThanhTich: thanhTichRows.map(tt => ({
        TenThanhTich: tt.TenLTT,
        NgayDat: tt.NgayPhatSinh
      }))
    };
  }


  // ==================== PASSWORD RESET (ADMIN APPROVAL) ====================

  /**
   * 1. Tạo yêu cầu đặt lại mật khẩu (Public)
   */
  async forgotPassword(email: string) {
    // Check if user exists (TenDangNhap is the email)
    const userExists = await this.checkEmailExist(email);
    if (!userExists) {
      throw new ErrorWithStatus({
        message: 'Email không tồn tại trong hệ thống',
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    // Check pending requests
    const checkSql = `
      SELECT * FROM YEU_CAU_MAT_KHAU 
      WHERE Email = ? AND TrangThai = 'ChoDuyet'
    `;
    const pendingRequests = await databaseService.query<RowDataPacket[]>(checkSql, [email]);
    if (pendingRequests.length > 0) {
      throw new ErrorWithStatus({
        message: 'Bạn đã có yêu cầu đang chờ duyệt. Vui lòng đợi Admin xử lý.',
        status: HTTP_STATUS.CONFLICT
      });
    }

    // Create request
    // MaTK references TAIKHOAN(TenDangNhap), which IS the email in this system
    const sql = `
      INSERT INTO YEU_CAU_MAT_KHAU (MaTK, Email, TrangThai)
      VALUES (?, ?, 'ChoDuyet')
    `;
    await databaseService.query(sql, [email, email]);

    return {
      message: 'Đã gửi yêu cầu đặt lại mật khẩu. Vui lòng đợi Admin phê duyệt.'
    };
  }

  /**
   * 2. Lấy danh sách yêu cầu (Admin)
   */
  async getPasswordRequests() {
    const sql = `
      SELECT * FROM YEU_CAU_MAT_KHAU 
      ORDER BY FIELD(TrangThai, 'ChoDuyet', 'DaDuyet', 'DaDoi'), NgayYeuCau DESC
    `;
    const rows = await databaseService.query<RowDataPacket[]>(sql);
    return rows;
  }

  /**
   * 3. Duyệt yêu cầu (Admin)
   */
  async approvePasswordRequest(id: number) {
    const checkSql = 'SELECT * FROM YEU_CAU_MAT_KHAU WHERE MaYeuCau = ?';
    const rows = await databaseService.query<RowDataPacket[]>(checkSql, [id]);

    if (rows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Yêu cầu không tồn tại',
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    const request = rows[0];
    if (request.TrangThai !== 'ChoDuyet') {
      throw new ErrorWithStatus({
        message: 'Yêu cầu này đã được xử lý',
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    const updateSql = `
      UPDATE YEU_CAU_MAT_KHAU 
      SET TrangThai = 'DaDuyet', NgayDuyet = NOW() 
      WHERE MaYeuCau = ?
    `;
    await databaseService.query(updateSql, [id]);

    return {
      message: 'Đã phê duyệt yêu cầu. Người dùng có thể đặt lại mật khẩu ngay bây giờ.'
    };
  }

  /**
   * 4. Kiểm tra quyền đặt lại mật khẩu (Public - Verify Reset Permission)
   */
  async verifyResetPermission(email: string) {
    const sql = `
      SELECT * FROM YEU_CAU_MAT_KHAU 
      WHERE Email = ? AND TrangThai = 'DaDuyet'
      ORDER BY NgayDuyet DESC LIMIT 1
    `;
    const rows = await databaseService.query<RowDataPacket[]>(sql, [email]);

    if (rows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Bạn chưa có yêu cầu nào được duyệt hoặc liên kết đã hết hạn (chuyển sang trạng thái đã đổi).',
        status: HTTP_STATUS.FORBIDDEN
      });
    }

    return {
      message: 'Hợp lệ',
      MaYeuCau: rows[0].MaYeuCau
    };
  }

  /**
   * 5. Đặt mật khẩu mới (Public - Reset Password)
   */
  async resetPassword(email: string, newPassword: string) {
    // Verify permission again
    const request = await this.verifyResetPermission(email);
    // Cast to any because TS might trigger error on implicit type from previous method return
    const maYeuCau = (request as any).MaYeuCau;

    // Hash new password
    const hashedPassword = hashPassword(newPassword);

    // Update password
    const updatePassSql = 'UPDATE TAIKHOAN SET MatKhau = ? WHERE TenDangNhap = ?';
    await databaseService.query(updatePassSql, [hashedPassword, email]);

    // Update request status
    const updateReqSql = `
      UPDATE YEU_CAU_MAT_KHAU 
      SET TrangThai = 'DaDoi' 
      WHERE MaYeuCau = ?
    `;
    await databaseService.query(updateReqSql, [maYeuCau]);

    return {
      message: 'Đã đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.'
    };
  }

}

const usersService = new UsersService();
export default usersService;