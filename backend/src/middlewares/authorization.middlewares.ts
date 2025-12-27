import { Request, Response, NextFunction } from 'express';
import { ErrorWithStatus } from '~/models/Errors';
import HTTP_STATUS from '~/constants/httpStatus';
import databaseService from '~/services/database.services';
import { RowDataPacket } from 'mysql2';
import { TokenPayload } from '~/models/requests/User.requests';
import { userInfo } from 'node:os';

// Interface cho thông tin tài khoản
export interface TaiKhoanInfo extends RowDataPacket {
  TenDangNhap: string;
  MaTV: string;
  MaLoaiTK: string;
  MaGiaPha: string | null;
}

/**
 * Lấy thông tin tài khoản và gia phả của user từ token
 */
const getUserInfo = async (user_id: string): Promise<TaiKhoanInfo> => {
  const sql = `
    SELECT 
      tk.TenDangNhap,
      tk.MaTV,
      tk.MaLoaiTK,
      tv.MaGiaPha
    FROM TAIKHOAN tk
    LEFT JOIN THANHVIEN tv ON tk.MaTV = tv.MaTV
    WHERE tk.TenDangNhap = ?
  `;
  
  const rows = await databaseService.query<TaiKhoanInfo[]>(sql, [user_id]);
  
  if (!rows || rows.length === 0) {
    throw new ErrorWithStatus({
      message: 'Không tìm thấy thông tin tài khoản',
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
  
  return rows[0];
};

/**
 * Kiểm tra user có phải Admin không
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);

    // Chỉ cho phép Admin (LTK01)
    if (userInfo.MaLoaiTK !== 'LTK01') {
      return res.status(403).json({
        message: 'Chỉ Admin mới có quyền thực hiện chức năng này'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi xác thực quyền Admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Kiểm tra user có phải Admin hoặc Owner không
 */
export const requireAdminOrOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // Owner (TruongToc)
    if (userInfo.MaLoaiTK === 'LTK02') {
      req.userInfo = userInfo;
      return next();
    }
    
    throw new ErrorWithStatus({
      message: 'Chỉ Admin hoặc Trưởng tộc mới có quyền thực hiện hành động này',
      status: HTTP_STATUS.FORBIDDEN
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kiểm tra quyền sửa thành viên
 * - Admin: sửa được tất cả
 * - Owner: sửa được thành viên trong gia phả
 * - User: chỉ sửa được chính mình
 */
export const checkUpdateMemberPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    console.log(user_id);
    
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.params;  // MaTV của thành viên cần sửa
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // Lấy thông tin thành viên cần sửa
    const [memberRows] = await databaseService.query<RowDataPacket[]>(
      'SELECT MaTV, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
      [MaTV]
    );
    
    if (memberRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy thành viên',
        status: HTTP_STATUS.NOT_FOUND
      });
    }
    
    const memberInfo = memberRows[0];
    
    // Owner: chỉ sửa được thành viên trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02') {
      if (memberInfo.MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền sửa thành viên trong gia phả của mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      req.userInfo = userInfo;
      return next();
    }
    
    // User: chỉ sửa được chính mình
    if (userInfo.MaLoaiTK === 'LTK03') {
      if (userInfo.MaTV !== MaTV) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền sửa thông tin cá nhân của chính mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      req.userInfo = userInfo;
      return next();
    }
    
    throw new ErrorWithStatus({
      message: 'Không có quyền truy cập',
      status: HTTP_STATUS.FORBIDDEN
    });
  } catch (error) {
    console.log("lỗi nè");    
    next(error);
  }
};

/**
 * Kiểm tra quyền xóa thành viên
 * - Admin: xóa được tất cả
 * - Owner: xóa được thành viên trong gia phả
 * - User: KHÔNG có quyền xóa
 */
export const checkDeleteMemberPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.params;
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // User không có quyền xóa
    if (userInfo.MaLoaiTK === 'LTK03') {
      throw new ErrorWithStatus({
        message: 'Bạn không có quyền xóa thành viên',
        status: HTTP_STATUS.FORBIDDEN
      });
    }
    
    // Owner: chỉ xóa được thành viên trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02') {
      const [memberRows] = await databaseService.query<RowDataPacket[]>(
        'SELECT MaTV, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
        [MaTV]
      );
      
      if (memberRows.length === 0) {
        throw new ErrorWithStatus({
          message: 'Không tìm thấy thành viên',
          status: HTTP_STATUS.NOT_FOUND
        });
      }
      
      if (memberRows[0].MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền xóa thành viên trong gia phả của mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      req.userInfo = userInfo;
      return next();
    }
    
    throw new ErrorWithStatus({
      message: 'Không có quyền truy cập',
      status: HTTP_STATUS.FORBIDDEN
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Filter kết quả tra cứu theo quyền
 * - Admin: xem tất cả
 * - Owner/User: chỉ xem trong gia phả
 */
export const attachUserInfoMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    
    // Gán thông tin user vào request
    req.userInfo = userInfo;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Kiểm tra quyền ghi nhận thành tích
 * - Admin: ghi nhận cho mọi thành viên
 * - Owner: ghi nhận cho thành viên trong gia phả
 * - User: chỉ ghi nhận cho chính mình
 */
export const checkGhiNhanThanhTichPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.body;  // MaTV của thành viên được ghi nhận thành tích
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // Lấy thông tin thành viên được ghi nhận
    const memberRows = await databaseService.query<RowDataPacket[]>(
      'SELECT MaTV, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
      [MaTV]
    );
    
    if (!memberRows || memberRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy thành viên',
        status: HTTP_STATUS.NOT_FOUND
      });
    }
    
    const memberInfo = memberRows[0];
    
    // Owner: chỉ ghi nhận cho thành viên trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02') {
      if (memberInfo.MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền ghi nhận thành tích cho thành viên trong gia phả của mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      req.userInfo = userInfo;
      return next();
    }
    
    // User: chỉ ghi nhận cho chính mình
    if (userInfo.MaLoaiTK === 'LTK03') {
      if (userInfo.MaTV !== MaTV) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền ghi nhận thành tích cho chính mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      req.userInfo = userInfo;
      return next();
    }
    
    throw new ErrorWithStatus({
      message: 'Không có quyền truy cập',
      status: HTTP_STATUS.FORBIDDEN
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kiểm tra quyền XÓA thành tích
 * - Admin: xóa được tất cả
 * - Owner: xóa được thành tích trong gia phả
 * - User: xóa được thành tích trong gia phả
 */
export const checkDeleteThanhTichPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.body;  // MaTV trong body
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // Lấy thông tin thành viên
    const memberRows = await databaseService.query<RowDataPacket[]>(
      'SELECT MaTV, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
      [MaTV]
    );
    
    if (!memberRows || memberRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy thành viên',
        status: HTTP_STATUS.NOT_FOUND
      });
    }
    
    // Owner và User: chỉ xóa được thành tích trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02' || userInfo.MaLoaiTK === 'LTK03') {
      if (!userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chưa thuộc gia phả nào',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      if (memberRows[0].MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền xóa thành tích của thành viên trong gia phả của mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      req.userInfo = userInfo;
      return next();
    }
    
    throw new ErrorWithStatus({
      message: 'Không có quyền truy cập',
      status: HTTP_STATUS.FORBIDDEN
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kiểm tra quyền CẬP NHẬT thành tích
 * - Admin: sửa được tất cả
 * - Owner: sửa được thành tích trong gia phả
 * - User: chỉ sửa được thành tích của chính mình
 */
export const checkUpdateThanhTichPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.body;  // MaTV trong body
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // Lấy thông tin thành viên
    const memberRows = await databaseService.query<RowDataPacket[]>(
      'SELECT MaTV, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
      [MaTV]
    );
    
    if (!memberRows || memberRows.length === 0) {
      throw new ErrorWithStatus({
        message: 'Không tìm thấy thành viên',
        status: HTTP_STATUS.NOT_FOUND
      });
    }
    
    const memberInfo = memberRows[0];
    
    // Owner: chỉ sửa được thành tích trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02') {
      if (!userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chưa thuộc gia phả nào',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      if (memberInfo.MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền sửa thành tích của thành viên trong gia phả của mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      req.userInfo = userInfo;
      return next();
    }
    
    // User: chỉ sửa được thành tích của chính mình
    if (userInfo.MaLoaiTK === 'LTK03') {
      if (userInfo.MaTV !== MaTV) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền sửa thành tích của chính mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      req.userInfo = userInfo;
      return next();
    }
    
    throw new ErrorWithStatus({
      message: 'Không có quyền truy cập',
      status: HTTP_STATUS.FORBIDDEN
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kiểm tra quyền GHI NHẬN kết thúc
 * - Admin: ghi nhận cho mọi thành viên
 * - Owner: ghi nhận cho thành viên trong gia phả
 * - User: KHÔNG có quyền
 */
export const checkGhiNhanKetThucPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.body;  // MaTV của thành viên cần ghi nhận kết thúc
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // User không có quyền ghi nhận kết thúc
    if (userInfo.MaLoaiTK === 'LTK03') {
      throw new ErrorWithStatus({
        message: 'Bạn không có quyền ghi nhận kết thúc',
        status: HTTP_STATUS.FORBIDDEN
      });
    }
    
    // Owner: chỉ ghi nhận được thành viên trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02') {
      if (!userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chưa thuộc gia phả nào',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      // Kiểm tra thành viên có trong gia phả không
      const memberRows = await databaseService.query<RowDataPacket[]>(
        'SELECT MaTV, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
        [MaTV]
      );
      
      if (!memberRows || memberRows.length === 0) {
        throw new ErrorWithStatus({
          message: 'Không tìm thấy thành viên',
          status: HTTP_STATUS.NOT_FOUND
        });
      }
      
      if (memberRows[0].MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền ghi nhận kết thúc cho thành viên trong gia phả của mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      req.userInfo = userInfo;
      return next();
    }
    
    throw new ErrorWithStatus({
      message: 'Không có quyền truy cập',
      status: HTTP_STATUS.FORBIDDEN
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Kiểm tra quyền CẬP NHẬT/XÓA kết thúc
 * - Admin: sửa/xóa được tất cả
 * - Owner: sửa/xóa được trong gia phả
 * - User: KHÔNG có quyền
 */
export const checkUpdateDeleteKetThucPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const userInfo = await getUserInfo(user_id);
    const { MaTV } = req.params;  // MaTV trong URL params
    
    // Admin có toàn quyền
    if (userInfo.MaLoaiTK === 'LTK01') {
      req.userInfo = userInfo;
      return next();
    }
    
    // User không có quyền sửa/xóa
    if (userInfo.MaLoaiTK === 'LTK03') {
      throw new ErrorWithStatus({
        message: 'Bạn không có quyền sửa/xóa thông tin kết thúc',
        status: HTTP_STATUS.FORBIDDEN
      });
    }
    
    // Owner: chỉ sửa/xóa được thành viên trong gia phả
    if (userInfo.MaLoaiTK === 'LTK02') {
      if (!userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chưa thuộc gia phả nào',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      const memberRows = await databaseService.query<RowDataPacket[]>(
        'SELECT MaTV, MaGiaPha FROM THANHVIEN WHERE MaTV = ?',
        [MaTV]
      );
      
      if (!memberRows || memberRows.length === 0) {
        throw new ErrorWithStatus({
          message: 'Không tìm thấy thành viên',
          status: HTTP_STATUS.NOT_FOUND
        });
      }
      
      if (memberRows[0].MaGiaPha !== userInfo.MaGiaPha) {
        throw new ErrorWithStatus({
          message: 'Bạn chỉ có quyền sửa/xóa kết thúc của thành viên trong gia phả của mình',
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      
      req.userInfo = userInfo;
      return next();
    }
    
    throw new ErrorWithStatus({
      message: 'Không có quyền truy cập',
      status: HTTP_STATUS.FORBIDDEN
    });
  } catch (error) {
    next(error);
  }
};