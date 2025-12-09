import { Request, Response, NextFunction } from 'express';
import { omit } from 'lodash';
import HTTP_STATUS from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';

/**
 * Default error handler - Xử lý tất cả lỗi của ứng dụng
 */
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Nếu là ErrorWithStatus thì trả về status và message
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, ['status']));
  }

  // Set enumerable cho message để có thể JSON.stringify
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true });
  });

  // Lỗi mặc định trả về 500
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfo: omit(err, ['stack'])
  });
};