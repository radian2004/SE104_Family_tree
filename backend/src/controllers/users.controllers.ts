import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { LoginReqBody, LogoutReqBody, RegisterReqBody } from '~/models/requests/User.requests';
import usersService from '~/services/users.services';
import { ErrorWithStatus } from '~/models/Errors';

/**
 * Controller đăng ký
 * POST /users/register
 */
export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response
) => {
  const result = await usersService.register(req.body);

  // ✅ SET COOKIES THAY VÌ TRẢ VỀ JSON
  res.cookie('access_token', result.access_token, {
    httpOnly: true,        // Không thể truy cập qua JavaScript (chống XSS)
    secure: process.env.NODE_ENV === 'production',  // Chỉ gửi qua HTTPS trong production
    sameSite: 'strict',    // Chống CSRF attacks
    maxAge: 15 * 60 * 1000 // 15 phút (giống access token expiry)
  });

  res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 ngày (giống refresh token expiry)
  });

  // ✅ Chỉ trả về message và user info (KHÔNG trả tokens)
  return res.status(HTTP_STATUS.CREATED).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    user: {
      TenDangNhap: result.user?.TenDangNhap,
      MaTV: result.user?.MaTV,
      MaLoaiTK: result.user?.MaLoaiTK
    }
  });
};

/**
 * Controller đăng nhập
 * POST /users/login
 */
export const loginController = async (
  req: Request<ParamsDictionary, any, LoginReqBody>,
  res: Response
) => {
  const { email, password } = req.body;

  const result = await usersService.login(email, password);

  if (!result) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.EMAIL_OR_PASSWORD_INCORRECT,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY
    });
  }

  // ✅ SET COOKIES
  res.cookie('access_token', result.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000  // 15 phút
  });

  res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 ngày
  });

  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    user: result.user
  });
};

/**
 * Controller đăng xuất
 * POST /users/logout
 * ✅ KHÔNG CẦN refresh_token trong body nữa, lấy từ cookies
 */
export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutReqBody>,
  res: Response
) => {
  // ✅ Lấy refresh_token từ cookies
  const refresh_token = req.cookies.refresh_token;

  if (refresh_token) {
    await usersService.logout(refresh_token);
  }

  // ✅ XÓA COOKIES - ĐÂY LÀ CÁCH BACKEND "XÓA LOCALSTORAGE"
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  return res.status(HTTP_STATUS.OK).json({
    message: 'Đăng xuất thành công'
  });
};