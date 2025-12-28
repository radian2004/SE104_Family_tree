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
  TenLoaiTK: string;
  
  // Thông tin thành viên
  HoTen: string;
  NgayGioSinh: Date | null;
  DiaChi: string | null;
  TrangThai: string;
  DOI: number;
  GioiTinh: string | null;
  
  // Quê quán
  TenQueQuan: string | null;
  
  // Nghề nghiệp
  TenNgheNghiep: string | null;
  
  // Gia phả
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
   */
  async register(payload: RegisterReqBody) {
    const { name, email, password, giapha } = payload
    const hashedPassword = hashPassword(password)
    let MaGiaPha: string
    let giapha_message: string

    // Trường hợp 1: Tạo gia phả mới (exist = false)
    if (giapha.exist === false) {
      // Tạo gia phả mới - Trigger sẽ tự động sinh MaGiaPha
      const [insertGiaPhaResult] = await databaseService.getPool().execute<ResultSetHeader>(
        'INSERT INTO CAYGIAPHA (TenGiaPha) VALUES (?)',
        [giapha.name]
      )
      
      // Lấy MaGiaPha vừa được tạo
      const [rows] = await databaseService.getPool().execute<RowDataPacket[]>(
        'SELECT MaGiaPha FROM CAYGIAPHA WHERE TenGiaPha = ? ORDER BY MaGiaPha DESC LIMIT 1',
        [giapha.name]
      )
      MaGiaPha = rows[0].MaGiaPha
      giapha_message = USERS_MESSAGES.GIAPHA_CREATED
      
      // Tạo thành viên (sẽ được set làm NguoiLap và TruongToc)
      const [insertMemberResult] = await databaseService.getPool().execute<ResultSetHeader>(
        'INSERT INTO THANHVIEN (MaGiaPha, HoTen) VALUES (?, ?)',
        [MaGiaPha, name]
      )
      
      // Lấy MaTV vừa tạo
      const [memberRows] = await databaseService.getPool().execute<RowDataPacket[]>(
        'SELECT MaTV FROM THANHVIEN WHERE MaGiaPha = ? AND HoTen = ? ORDER BY MaTV DESC LIMIT 1',
        [MaGiaPha, name]
      )
      const MaTV = memberRows[0].MaTV
      
      // Tạo tài khoản
      await databaseService.getPool().execute<ResultSetHeader>(
        'INSERT INTO TAIKHOAN (TenDangNhap, MaTV, MatKhau, MaLoaiTK) VALUES (?, ?, ?, ?)',
        [email, MaTV, hashedPassword, 'LTK03']
      )

      // Cập nhật NguoiLap và TruongToc cho gia phả
      await databaseService.getPool().execute(
        'UPDATE CAYGIAPHA SET NguoiLap = ?, TruongToc = ? WHERE MaGiaPha = ?',
        [MaTV, MaTV, MaGiaPha]
      )
      
    } 
        // Trường hợp 2: Gia nhập gia phả có sẵn (exist = true)
    else {
      // 1. Tìm gia phả theo tên
      const [giaPhaRows] = await databaseService.getPool().execute<RowDataPacket[]>(
        'SELECT MaGiaPha, TenGiaPha FROM CAYGIAPHA WHERE TenGiaPha = ?',
        [giapha.name]
      )
      
      if (giaPhaRows.length === 0) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.GIAPHA_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }
      
      MaGiaPha = giaPhaRows[0].MaGiaPha
      const tenGiaPha = giaPhaRows[0].TenGiaPha
      let MaTV: string
      
      // ========== TRƯỜNG HỢP A: User đã chọn MaTV từ danh sách trùng tên ==========
      if (giapha.MaTV) {
        // Kiểm tra MaTV có thuộc gia phả và khớp tên không
        const [memberCheckRows] = await databaseService.getPool().execute<RowDataPacket[]>(
          `SELECT tv.MaTV, tv.HoTen, tk.TenDangNhap AS HasAccount
           FROM THANHVIEN tv
           LEFT JOIN TAIKHOAN tk ON tv.MaTV = tk.MaTV
           WHERE tv.MaTV = ? AND tv.MaGiaPha = ?`,
          [giapha.MaTV, MaGiaPha]
        )
        
        if (memberCheckRows.length === 0) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.MEMBER_NOT_IN_GIAPHA,
            status: HTTP_STATUS.NOT_FOUND
          })
        }
        
        const selectedMember = memberCheckRows[0]
        
        // Kiểm tra tên có khớp không
        if (selectedMember.HoTen !== name) {
          throw new ErrorWithStatus({
            message: `Tên "${name}" không khớp với thành viên đã chọn (${selectedMember.HoTen})`,
            status: HTTP_STATUS.BAD_REQUEST
          })
        }
        
        // Kiểm tra đã có tài khoản chưa
        if (selectedMember.HasAccount) {
          throw new ErrorWithStatus({
            message: `${USERS_MESSAGES.MEMBER_ALREADY_HAS_ACCOUNT} (${selectedMember.HasAccount}). Vui lòng đăng nhập.`,
            status: HTTP_STATUS.CONFLICT
          })
        }
        
        MaTV = giapha.MaTV
        giapha_message = `${USERS_MESSAGES.GIAPHA_JOINED} ${USERS_MESSAGES.LINKED_EXISTING_MEMBER}: '${tenGiaPha}'.`
      }
      // ========== TRƯỜNG HỢP B: Tự động tìm theo tên ==========
      else {
        // 2. Query thành viên cùng tên với thông tin đầy đủ
        const [existingMemberRows] = await databaseService.getPool().execute<RowDataPacket[]>(
          `SELECT 
              tv.MaTV,
              tv.HoTen,
              tv.NgayGioSinh,
              tv.DOI,
              tv.GioiTinh,
              tv.DiaChi,
              cha.HoTen AS TenCha,
              me.HoTen AS TenMe,
              CASE WHEN tk.TenDangNhap IS NOT NULL THEN TRUE ELSE FALSE END AS HasAccount,
              tk.TenDangNhap AS Email
           FROM THANHVIEN tv
           LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
           LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
           LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
           LEFT JOIN TAIKHOAN tk ON tv.MaTV = tk.MaTV
           WHERE tv.MaGiaPha = ? AND tv.HoTen = ?
           ORDER BY tv.DOI ASC, tv.NgayGioSinh ASC`,
          [MaGiaPha, name]
        )
        
        // 3. Xử lý theo số lượng kết quả
        
        // 3.1. Không tìm thấy ai → Tạo mới
        if (existingMemberRows.length === 0) {
          await databaseService.getPool().execute<ResultSetHeader>(
            'INSERT INTO THANHVIEN (MaGiaPha, HoTen) VALUES (?, ?)',
            [MaGiaPha, name]
          )
          
          const [memberRows] = await databaseService.getPool().execute<RowDataPacket[]>(
            'SELECT MaTV FROM THANHVIEN WHERE MaGiaPha = ? AND HoTen = ? ORDER BY MaTV DESC LIMIT 1',
            [MaGiaPha, name]
          )
          MaTV = memberRows[0].MaTV
          giapha_message = `${USERS_MESSAGES.GIAPHA_JOINED} ${USERS_MESSAGES.CREATED_NEW_MEMBER}: '${tenGiaPha}'.`
        }
        // 3.2. Tìm thấy đúng 1 người
        else if (existingMemberRows.length === 1) {
          const existingMember = existingMemberRows[0]
          
          // Kiểm tra đã có tài khoản chưa
          if (existingMember.HasAccount) {
            throw new ErrorWithStatus({
              message: `Thành viên "${name}" trong gia phả "${tenGiaPha}" đã có tài khoản (${existingMember.Email}). Vui lòng đăng nhập hoặc liên hệ quản trị viên.`,
              status: HTTP_STATUS.CONFLICT
            })
          }
          
          // Liên kết với thành viên đã có
          MaTV = existingMember.MaTV
          giapha_message = `${USERS_MESSAGES.GIAPHA_JOINED} ${USERS_MESSAGES.LINKED_EXISTING_MEMBER}: '${tenGiaPha}'.`
        }
        // 3.3. Tìm thấy NHIỀU người cùng tên → Trả về danh sách để chọn
        else {
          // Lọc ra những người CHƯA có tài khoản
          const availableCandidates = existingMemberRows.filter(m => !m.HasAccount)
          
          // Nếu tất cả đều đã có tài khoản
          if (availableCandidates.length === 0) {
            throw new ErrorWithStatus({
              message: `Tất cả thành viên tên "${name}" trong gia phả đều đã có tài khoản. Vui lòng đăng nhập.`,
              status: HTTP_STATUS.CONFLICT
            })
          }
          
          // Nếu chỉ còn 1 người chưa có tài khoản → Tự động liên kết
          if (availableCandidates.length === 1) {
            MaTV = availableCandidates[0].MaTV
            giapha_message = `${USERS_MESSAGES.GIAPHA_JOINED} ${USERS_MESSAGES.LINKED_EXISTING_MEMBER}: '${tenGiaPha}'.`
          }
          // Nhiều người chưa có tài khoản → Yêu cầu chọn
          else {
            // Format candidates để trả về cho frontend
            const candidates = availableCandidates.map(member => ({
              MaTV: member.MaTV,
              HoTen: member.HoTen,
              NgayGioSinh: member.NgayGioSinh,
              DOI: member.DOI,
              GioiTinh: member.GioiTinh,
              DiaChi: member.DiaChi,
              TenCha: member.TenCha || 'Không rõ',
              TenMe: member.TenMe || 'Không rõ',
              HasAccount: false
            }))
            
            // Throw special error với danh sách candidates
            const error: any = new ErrorWithStatus({
              message: USERS_MESSAGES.MULTIPLE_MEMBERS_FOUND,
              status: HTTP_STATUS.MULTIPLE_CHOICES  // 300
            })
            error.candidates = candidates
            throw error
          }
        }
      }
      
      // 4. Tạo tài khoản liên kết với MaTV
      await databaseService.getPool().execute<ResultSetHeader>(
        'INSERT INTO TAIKHOAN (TenDangNhap, MaTV, MatKhau, MaLoaiTK) VALUES (?, ?, ?, ?)',
        [email, MaTV, hashedPassword, 'LTK03']
      )
    }

    return {
      giapha_message,
      MaGiaPha
    }
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
   * @param old_refresh_token - Refresh token cũ
   * @param user_id - ID người dùng (email)
   */
  async refreshToken(old_refresh_token: string, user_id: string) {
    // 1. Xóa refresh token cũ khỏi database
    const deleteSql = 'DELETE FROM REFRESH_TOKENS WHERE token = ?';
    await databaseService.query(deleteSql, [old_refresh_token]);

    // 2. Tạo cặp token mới
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user_id);

    // 3. Lưu refresh token mới vào database
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 7);

    const insertRefreshTokenSql = `
      INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) 
      VALUES (?, ?, ?)
    `;
    await databaseService.query(insertRefreshTokenSql, [refresh_token, user_id, expDate]);

    return {
      access_token,
      refresh_token
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
      INNER JOIN THANHVIEN tv ON tk.MaTV = tv.MaTV
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
      LoaiTaiKhoan: userInfo.TenLoaiTK,
      
      // Thông tin cơ bản thành viên
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


}

const usersService = new UsersService();
export default usersService;