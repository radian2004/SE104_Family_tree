import { Router } from 'express';
import {
    getAllAccountsController,
    promoteToOwnerController,
    demoteToUserController,
    getAccountTypesController
} from '~/controllers/taikhoan.controllers';
import { accessTokenValidator } from '~/middlewares/users.middlewares';
import { requireAdmin } from '~/middlewares/authorization.middlewares';
import { wrapAsync } from '~/utils/handlers';

const taikhoanRouter = Router();

/**
 * Description: Lấy danh sách loại tài khoản
 * Path: /taikhoan/types
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 */
taikhoanRouter.get('/types', accessTokenValidator, wrapAsync(getAccountTypesController));

/**
 * Description: Lấy danh sách tất cả tài khoản (Admin only)
 * Path: /taikhoan
 * Method: GET
 * Query: { search?: string, MaLoaiTK?: string }
 * Headers: { Authorization: Bearer <access_token> }
 * Requires: Admin (LTK01)
 */
taikhoanRouter.get('/', accessTokenValidator, requireAdmin, wrapAsync(getAllAccountsController));

/**
 * Description: Cấp quyền Owner cho tài khoản (Admin only)
 * Path: /taikhoan/:email/promote
 * Method: PUT
 * Headers: { Authorization: Bearer <access_token> }
 * Requires: Admin (LTK01)
 */
taikhoanRouter.put('/:email/promote', accessTokenValidator, requireAdmin, wrapAsync(promoteToOwnerController));

/**
 * Description: Hạ quyền về User cho tài khoản (Admin only)
 * Path: /taikhoan/:email/demote
 * Method: PUT
 * Headers: { Authorization: Bearer <access_token> }
 * Requires: Admin (LTK01)
 */
taikhoanRouter.put('/:email/demote', accessTokenValidator, requireAdmin, wrapAsync(demoteToUserController));

export default taikhoanRouter;
