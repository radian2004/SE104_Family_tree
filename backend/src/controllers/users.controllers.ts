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

  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  });
};

/**
 * Controller đăng xuất
 * POST /users/logout
 * Headers: { Authorization: Bearer <access_token> }
 * Body: { refresh_token: string }
 */
export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body;

  const result = await usersService.logout(refresh_token);

  return res.status(HTTP_STATUS.OK).json(result);  
};

/**
 * Controller làm mới token
 * POST /users/refresh-token
 * Body: { refresh_token: string }
 */
export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { refresh_token } = req.body;
  
  // Lấy user_id từ decoded_refresh_token (đã được validate bởi middleware)
  const { user_id } = req.decoded_refresh_token as TokenPayload;
  
  // Gọi service để làm mới token
  const result = await usersService.refreshToken(refresh_token, user_id);

  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  });
};

export const getMeController = async (req: Request, res: Response) => {
  // Lấy user_id từ decoded_authorization (đã được validate bởi middleware)
  const { user_id } = req.decoded_authorization as TokenPayload;
  
  // Gọi service để lấy thông tin
  const result = await usersService.getMe(user_id);

  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result
  });
};