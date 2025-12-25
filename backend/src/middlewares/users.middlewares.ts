import { Request, Response, NextFunction } from 'express';
import { checkSchema } from 'express-validator';
import { JsonWebTokenError } from 'jsonwebtoken';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import usersService from '~/services/users.services';
import { validate } from '~/utils/validation';
import { verifyToken } from '~/utils/jwt';
import { TokenPayload } from '~/models/requests/User.requests';

/**
 * Middleware validate đăng ký
 */
export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
        },
        isString: true,
        isLength: {
          options: {
            min: 1,
            max: 100
          },
          errorMessage: USERS_MESSAGES.NAME_LENGTH_INVALID
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value) => {
            const isExist = await usersService.checkEmailExist(value);
            if (isExist) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS.UNPROCESSABLE_ENTITY
              });
            }
            return true;
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: true,
        isLength: {
          options: {
            min: 6,
            max: 50
          },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_INVALID
        },
        isStrongPassword: {
          options: {
            minLength: 6,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
          },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      },
      confirm_password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
        },
        isString: true,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_NOT_MATCH);
            }
            return true;
          }
        }
      }
    },
    ['body']
  )
);

/**
 * Middleware validate đăng nhập
 */
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: true
      }
    },
    ['body']
  )
);

/**
 * Middleware validate access token
 * ✅ Ưu tiên đọc từ cookies, sau đó mới từ header (backward compatible)
 */
export const accessTokenValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ✅ ĐỌC TỪ COOKIES TRƯỚC
    let access_token = req.cookies?.access_token;

    // ✅ NẾU KHÔNG CÓ, ĐỌC TỪ HEADER
    if (!access_token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        access_token = authHeader.substring(7);
      }
    }

    // ✅ KIỂM TRA TOKEN
    if (!access_token) {
      return res.status(401).json({
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
      });
    }

    // ✅ VERIFY TOKEN
    const decoded = await verifyToken(
      access_token,
      process.env.JWT_SECRET_ACCESS_TOKEN as string
    );

    // ✅ GẮN VÀO REQUEST
    (req as any).decoded_authorization = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: (error as any).message || 'Invalid token'
    });
  }
};

/**
 * Middleware validate refresh token
 * ✅ Ưu tiên đọc từ cookies, sau đó mới từ body (backward compatible)
 */
export const refreshTokenValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. ĐỌC TỪ COOKIES TRƯỚC
    let refresh_token = req.cookies?.refresh_token;

    // 2. NẾU KHÔNG CÓ, ĐỌC TỪ BODY
    if (!refresh_token) {
      refresh_token = req.body.refresh_token;
    }

    // 3. KIỂM TRA
    if (!refresh_token) {
      return res.status(401).json({
        message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
      });
    }

    // 4. VERIFY TOKEN
    const decoded = await verifyToken(
      refresh_token,
      process.env.JWT_SECRET_REFRESH_TOKEN as string
    );

    // 5. KIỂM TRA TOKEN CÓ TRONG DATABASE KHÔNG
    const isExist = await usersService.checkRefreshTokenExist(refresh_token);
    if (!isExist) {
      return res.status(401).json({
        message: USERS_MESSAGES.REFRESH_TOKEN_NOT_EXIST
      });
    }

    // 6. GẮN VÀO REQUEST
    (req as any).decoded_refresh_token = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: (error as any).message || 'Invalid refresh token'
    });
  }
};