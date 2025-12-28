import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrapper cho async request handler
 * Tự động catch lỗi và chuyển sang error handler
 */
export const wrapAsync = <P>(func: RequestHandler<P, any, any, any>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};