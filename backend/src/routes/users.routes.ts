import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController
} from '~/controllers/users.controllers';
import {
  registerValidator,
  loginValidator,
  accessTokenValidator,
  refreshTokenValidator
} from '~/middlewares/users.middlewares';
import { wrapAsync } from '~/utils/handlers';

const usersRouter = Router();

/**
 * Description: Đăng ký tài khoản
 * Path: /users/register
 * Method: POST
 * Body: { name: string, email: string, password: string, confirm_password: string }
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

export default usersRouter;