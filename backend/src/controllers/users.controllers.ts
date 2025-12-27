import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { LoginReqBody, LogoutReqBody, RefreshTokenReqBody, RegisterReqBody, TokenPayload } from '~/models/requests/User.requests';
import usersService from '~/services/users.services';
import { ErrorWithStatus } from '~/models/Errors';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Controller đăng ký
 * POST /users/register
 */
export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await usersService.register(req.body)

  return res.status(HTTP_STATUS.CREATED).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result: {
      giapha_message: result.giapha_message,
      MaGiaPha: result.MaGiaPha
    }
  })
}

/**
 * Controller đăng nhập
 * POST /users/login
 */
export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const { email, password } = req.body;

  const result = await usersService.login(email, password);

  // Nếu không tìm thấy hoặc sai password
  if (!result) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.EMAIL_OR_PASSWORD_INCORRECT,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY
    });
  }

  // ✅ Set HTTP-only cookies cho tokens
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

  // Lấy thông tin user để trả về
  const userInfo = await usersService.getMe(email);

  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result: {
      user: userInfo
    }
  });
};

/**
 * Controller đăng xuất
 * POST /users/logout
 * ✅ Lấy refresh_token từ cookies và xóa cả access + refresh cookies
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

/**
 * Controller refresh token
 * POST /users/refresh-token
 * ✅ Lấy refresh_token từ cookies
 */
export const refreshTokenController = async (
  req: Request,
  res: Response
) => {
  // Lấy refresh_token từ cookies
  const refresh_token = req.cookies.refresh_token;

  if (!refresh_token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: 'Không tìm thấy refresh token'
    });
  }

  try {
    const result = await usersService.refreshToken(refresh_token);

    if (!result) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Refresh token không hợp lệ hoặc đã hết hạn'
      });
    }

    // Set new access token cookie
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000  // 15 phút
    });

    // Set new refresh token cookie (token rotation)
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 ngày
    });

    return res.status(HTTP_STATUS.OK).json({
      message: 'Refresh token thành công',
      user: result.user
    });
  } catch (error: any) {
    console.error('[refreshTokenController] Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi refresh token',
      error: error.message
    });
  }
};

/**
 * Controller lấy thông tin user hiện tại
 * GET /users/me
 * Headers: { Authorization: Bearer <access_token> }
 */
export const getMeController = async (
  req: Request,
  res: Response
) => {
  try {
    // user_id được set bởi accessTokenValidator middleware
    const { user_id } = req.decoded_authorization as TokenPayload;

    const result = await usersService.getMe(user_id);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Lấy thông tin thành công',
      result
    });
  } catch (error: any) {
    console.error('[getMeController] Error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Lỗi lấy thông tin người dùng',
      error: error.message
    });
  }
};