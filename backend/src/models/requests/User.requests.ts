import { JwtPayload } from 'jsonwebtoken';
import { TokenType } from '~/constants/enums';

// Interface cho thông tin gia phả khi đăng ký
export interface GiaPhaRegisterInfo {
  name: string;           // Tên gia phả (chọn từ danh sách hoặc tự đặt)
  exist: boolean;         // true = gia nhập gia phả có sẵn, false = tạo mới
  MaTV?: string;          // Mã thành viên (dùng khi có nhiều người cùng tên)
}

export interface RegisterReqBody {
  name: string;           // Tên người đăng ký
  email: string;
  password: string;
  confirm_password: string;
  giapha: GiaPhaRegisterInfo;  // Thông tin gia phả

  // Legacy fields - kept for backward compatibility
  MaTV?: string;
  memberName?: string;
}

export interface LoginReqBody {
  email: string;
  password: string;
}

export interface LogoutReqBody {
  refresh_token: string;
}

export interface TokenPayload extends JwtPayload {
  user_id: string;
  token_type: TokenType;
  iat: number;
  exp: number;
}

export interface RefreshTokenReqBody {
  refresh_token: string;
}
