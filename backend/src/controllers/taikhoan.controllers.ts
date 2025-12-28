import { Request, Response } from 'express';
import HTTP_STATUS from '~/constants/httpStatus';
import taikhoanService from '~/services/taikhoan.services';
import { TokenPayload } from '~/models/requests/User.requests';

/**
 * Controller lấy danh sách tất cả tài khoản
 * GET /taikhoan
 * Query: { search?: string, MaLoaiTK?: string }
 * Requires: Admin (LTK01)
 */
export const getAllAccountsController = async (req: Request, res: Response) => {
    try {
        const { search, MaLoaiTK } = req.query;

        const result = await taikhoanService.getAllAccounts({
            search: search as string,
            MaLoaiTK: MaLoaiTK as string
        });

        return res.status(HTTP_STATUS.OK).json({
            message: 'Lấy danh sách tài khoản thành công',
            result
        });
    } catch (error: any) {
        console.error('[getAllAccountsController] Error:', error);
        return res.status(error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: error.message || 'Lỗi lấy danh sách tài khoản',
            error: error.message
        });
    }
};

/**
 * Controller cấp quyền Owner (LTK02) cho tài khoản
 * PUT /taikhoan/:email/promote
 * Requires: Admin (LTK01)
 */
export const promoteToOwnerController = async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const { user_id } = req.decoded_authorization as TokenPayload;

        const result = await taikhoanService.promoteToOwner(email, user_id);

        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error: any) {
        console.error('[promoteToOwnerController] Error:', error);
        return res.status(error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: error.message || 'Lỗi cấp quyền',
            error: error.message
        });
    }
};

/**
 * Controller hạ quyền về User (LTK03)
 * PUT /taikhoan/:email/demote
 * Requires: Admin (LTK01)
 */
export const demoteToUserController = async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const { user_id } = req.decoded_authorization as TokenPayload;

        const result = await taikhoanService.demoteToUser(email, user_id);

        return res.status(HTTP_STATUS.OK).json(result);
    } catch (error: any) {
        console.error('[demoteToUserController] Error:', error);
        return res.status(error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: error.message || 'Lỗi hạ quyền',
            error: error.message
        });
    }
};

/**
 * Controller lấy danh sách loại tài khoản
 * GET /taikhoan/types
 */
export const getAccountTypesController = async (req: Request, res: Response) => {
    try {
        const result = await taikhoanService.getAccountTypes();

        return res.status(HTTP_STATUS.OK).json({
            message: 'Lấy danh sách loại tài khoản thành công',
            result
        });
    } catch (error: any) {
        console.error('[getAccountTypesController] Error:', error);
        return res.status(error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: error.message || 'Lỗi lấy danh sách loại tài khoản',
            error: error.message
        });
    }
};
