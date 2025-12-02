import express from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import { EntityError, ErrorWithStatus } from '~/models/Errors';

/**
 * Middleware validate dữ liệu đầu vào
 * Tự động kiểm tra lỗi và ném EntityError nếu có lỗi validation
 */
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Chạy tất cả validators
    await validation.run(req);

    const errors = validationResult(req);

    // Không có lỗi thì next
    if (errors.isEmpty()) {
      return next();
    }

    const errorObject = errors.mapped();
    const entityError = new EntityError({ errors: {} });

    // Xử lý từng lỗi
    for (const key in errorObject) {
      const { msg } = errorObject[key];

      // Nếu lỗi là ErrorWithStatus (do custom validator) và không phải 422 thì throw luôn
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg);
      }

      // Còn lại thì thêm vào entityError
      entityError.errors[key] = msg;
    }

    // Throw lỗi validation
    next(entityError);
  };
};