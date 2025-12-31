import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController,
  refreshTokenController,
  getMeController,
  forgotPasswordController,
  getPasswordRequestsController,
  approvePasswordRequestController,
  verifyResetPermissionController,
  resetPasswordController,
  getGenealogiesController,
  getAvailableMembersController,
  verifyMemberController
} from '~/controllers/users.controllers';
import {
  registerValidator,
  loginValidator,
  accessTokenValidator,
  refreshTokenValidator
} from '~/middlewares/users.middlewares';
import { requireAdmin } from '~/middlewares/authorization.middlewares';
import { wrapAsync } from '~/utils/handlers';
import thanhvienRouter from './thanhvien.routes';
import thanhTichRouter from './thanhtich.routes';
import ketthucRouter from './ketthuc.routes';
import honNhanRouter from './honnhan.routes';
import quanHeConRouter from './quanhecon.routes';
import phieuThuRouter from './phieuthu.routes';
import phieuChiRouter from './phieuchi.routes';

const usersRouter = Router();

/**
 * Description: Lấy danh sách gia phả (cho đăng ký)
 * Path: /users/genealogies
 * Method: GET
 */
usersRouter.get('/genealogies', wrapAsync(getGenealogiesController));

/**
 * Description: Lấy danh sách thành viên chưa có tài khoản (cho đăng ký)
 * Path: /users/available-members?giapha=<tên gia phả>
 * Method: GET
 */
usersRouter.get('/available-members', wrapAsync(getAvailableMembersController));

/**
 * Description: Xác minh thành viên bằng mã gia phả và mã thành viên
 * Path: /users/verify-member?MaGiaPha=<mã>&MaTV=<mã>
 * Method: GET
 */
usersRouter.get('/verify-member', wrapAsync(verifyMemberController));

/**
 * Description: Đăng ký tài khoản
 * Path: /users/register
 * Method: POST
 * Body: { memberName: string, giapha: string, email: string, password: string, confirm_password: string }
 */
usersRouter.post('/register', registerValidator, wrapAsync(registerController));

/**
 * Description: Đăng nhập
 * Path: /users/login
 * Method: POST
 * Body: { email: string, password: string }
 */
usersRouter.post('/login', loginValidator, wrapAsync(loginController));

/**
 * Description: Đăng xuất
 * Path: /users/logout
 * Method: POST
 * Headers: { Authorization: Bearer <access_token> }
 * Body: { refresh_token: string }
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController));

/**
 * Description: Refresh access token
 * Path: /users/refresh-token
 * Method: POST
 * Cookies: refresh_token
 */
usersRouter.post('/refresh-token', wrapAsync(refreshTokenController));

/**
 * Description: Lấy thông tin người dùng hiện tại
 * Path: /users/me
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 */
usersRouter.get('/me', accessTokenValidator, wrapAsync(getMeController));

// ==================== PASSWORD RESET ROUTES ====================

/**
 * 1. Tạo yêu cầu đặt lại mật khẩu (Public)
 * POST /users/forgot-password
 */
usersRouter.post('/forgot-password', wrapAsync(forgotPasswordController));

/**
 * 2. Lấy danh sách yêu cầu (Admin)
 * GET /users/password-requests
 */
usersRouter.get('/password-requests', accessTokenValidator, requireAdmin, wrapAsync(getPasswordRequestsController));

/**
 * 3. Duyệt yêu cầu (Admin)
 * POST /users/password-requests/:id/approve
 */
usersRouter.post('/password-requests/:id/approve', accessTokenValidator, requireAdmin, wrapAsync(approvePasswordRequestController));

/**
 * 4. Kiểm tra quyền Reset (Public)
 * POST /users/verify-reset-permission
 */
usersRouter.post('/verify-reset-permission', wrapAsync(verifyResetPermissionController));

/**
 * 5. Đặt lại mật khẩu (Public)
 * POST /users/reset-password
 */
usersRouter.post('/reset-password', wrapAsync(resetPasswordController));

// 🔍 DEBUG: Log khi route được đăng ký
console.log('Sửa Đang đăng ký nested routes...');
console.log('  - /thanhvien');
console.log('  - /thanhtich');
console.log('  - /ketthuc');
console.log('  - /quanhe');
console.log('  - /phieuthu');
console.log('  - /phieuchi');

usersRouter.use('/thanhvien', accessTokenValidator, thanhvienRouter);
usersRouter.use('/thanhtich', accessTokenValidator, thanhTichRouter);
usersRouter.use('/ketthuc', accessTokenValidator, ketthucRouter);
usersRouter.use('/honnhan', accessTokenValidator, honNhanRouter);
usersRouter.use('/quanhecon', accessTokenValidator, quanHeConRouter);
usersRouter.use('/phieuthu', accessTokenValidator, phieuThuRouter);
usersRouter.use('/phieuchi', accessTokenValidator, phieuChiRouter);
console.log('Sửa Đã đăng ký xong nested routes!');

export default usersRouter;