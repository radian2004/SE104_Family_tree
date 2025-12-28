// src/routes/giapha.routes.ts
import { Router } from 'express';
import { wrapAsync } from '~/utils/handlers';
import {
    getAllGiaPhaController,
    getGiaPhaDetailController,
    createGiaPhaController,
    updateGiaPhaController,
    deleteGiaPhaController,
    addMemberController,
    removeMemberController,
    getMembersController,
    searchMembersController,
    addMemberByEmailController
} from '~/controllers/giapha.controllers';
import { accessTokenValidator } from '~/middlewares/users.middlewares';
import { attachUserInfo, requireAdminOrOwner, checkViewGiaPhaDetail } from '~/middlewares/authorization.middlewares';

const giaPhaRouter = Router();

/**
 * Tìm kiếm thành viên theo tên (autocomplete)
 * GET /caygiapha/search-members?name=abc
 * Quyền: Tất cả đã đăng nhập
 * ⚠️ Route này phải đặt TRƯỚC các routes có :MaGiaPha
 */
giaPhaRouter.get('/search-members', accessTokenValidator, wrapAsync(searchMembersController));

/**
 * Lấy danh sách tất cả gia phả
 * GET /caygiapha
 * Quyền: Admin/TruongToc xem tất cả, ThanhVien chỉ xem của mình
 */
giaPhaRouter.get('/', accessTokenValidator, attachUserInfo, wrapAsync(getAllGiaPhaController));

/**
 * Lấy danh sách thành viên của gia phả
 * GET /caygiapha/:MaGiaPha/members
 * Quyền: Admin xem tất cả, TruongToc/ThanhVien chỉ xem gia phả của mình
 * ⚠️ Route này phải đặt TRƯỚC /:MaGiaPha
 */
giaPhaRouter.get('/:MaGiaPha/members', accessTokenValidator, checkViewGiaPhaDetail, wrapAsync(getMembersController));

/**
 * Lấy chi tiết gia phả
 * GET /caygiapha/:MaGiaPha
 * Quyền: Admin xem tất cả, TruongToc/ThanhVien chỉ xem gia phả của mình
 */
giaPhaRouter.get('/:MaGiaPha', accessTokenValidator, checkViewGiaPhaDetail, wrapAsync(getGiaPhaDetailController));

/**
 * Tạo gia phả mới
 * POST /caygiapha
 * Quyền: Admin, Owner (đã đăng nhập)
 */
giaPhaRouter.post('/', accessTokenValidator, attachUserInfo, requireAdminOrOwner, wrapAsync(createGiaPhaController));

/**
 * Cập nhật gia phả
 * PUT /caygiapha/:MaGiaPha
 * Quyền: Admin, Owner
 */
giaPhaRouter.put('/:MaGiaPha', accessTokenValidator, attachUserInfo, requireAdminOrOwner, wrapAsync(updateGiaPhaController));

/**
 * Thêm thành viên vào gia phả
 * PUT /caygiapha/:MaGiaPha/add-member
 * Quyền: Admin, Owner
 */
giaPhaRouter.put('/:MaGiaPha/add-member', accessTokenValidator, attachUserInfo, requireAdminOrOwner, wrapAsync(addMemberController));

/**
 * Thêm thành viên vào gia phả bằng email
 * POST /caygiapha/:MaGiaPha/add-member-by-email
 * Quyền: Admin, Owner
 */
giaPhaRouter.post('/:MaGiaPha/add-member-by-email', accessTokenValidator, attachUserInfo, requireAdminOrOwner, wrapAsync(addMemberByEmailController));


/**
 * Xóa thành viên khỏi gia phả
 * PUT /caygiapha/:MaGiaPha/remove-member
 * Quyền: Admin, Owner
 */
giaPhaRouter.put('/:MaGiaPha/remove-member', accessTokenValidator, attachUserInfo, requireAdminOrOwner, wrapAsync(removeMemberController));

/**
 * Xóa gia phả
 * DELETE /caygiapha/:MaGiaPha
 * Quyền: Admin only
 */
giaPhaRouter.delete('/:MaGiaPha', accessTokenValidator, attachUserInfo, requireAdminOrOwner, wrapAsync(deleteGiaPhaController));

export default giaPhaRouter;
