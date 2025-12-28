// src/controllers/giapha.controllers.ts
import { Request, Response } from 'express';
import giaPhaService from '~/services/giapha.services';
import HTTP_STATUS from '~/constants/httpStatus';

/**
 * Lấy danh sách tất cả gia phả
 * GET /caygiapha
 */
export const getAllGiaPhaController = async (req: Request, res: Response) => {
    try {
        const { MaTV, MaLoaiTK } = req.userInfo || {};

        // Ensure user info exists (middleware should handle this, but for safety)
        if (!MaTV || !MaLoaiTK) {
            // Fallback or error? Assuming protected route means valid user.
            // If Admin has no MaTV, they still need to see list. Pass mock or handle null in service?
            // Service needs ID for non-admin. Admin ID ignored.
        }

        const result = await giaPhaService.getAll(MaTV, MaLoaiTK);
        return res.status(HTTP_STATUS.OK).json({
            message: 'Lấy danh sách gia phả thành công',
            result
        });
    } catch (error: any) {
        console.error('Lỗi getAllGiaPha:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: 'Lỗi lấy danh sách gia phả',
            error: error.message
        });
    }
};

/**
 * Lấy chi tiết gia phả
 * GET /caygiapha/:MaGiaPha
 */
export const getGiaPhaDetailController = async (req: Request, res: Response) => {
    try {
        const { MaGiaPha } = req.params;
        const result = await giaPhaService.getDetail(MaGiaPha);

        if (!result) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                message: 'Không tìm thấy gia phả'
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            message: 'Lấy chi tiết gia phả thành công',
            result
        });
    } catch (error: any) {
        console.error('Lỗi getGiaPhaDetail:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: 'Lỗi lấy chi tiết gia phả',
            error: error.message
        });
    }
};

/**
 * Tạo gia phả mới
 * POST /caygiapha
 */
export const createGiaPhaController = async (req: Request, res: Response) => {
    try {
        const { TenGiaPha, TruongToc } = req.body;

        if (!TenGiaPha) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Tên gia phả là bắt buộc'
            });
        }

        // Bắt buộc phải có TruongToc
        if (!TruongToc) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Trưởng tộc là bắt buộc. Vui lòng chọn một thành viên từ danh sách.'
            });
        }

        // Lấy MaTV của user hiện tại từ userInfo (nếu có)
        const userId = req.userInfo?.MaTV || null;

        const result = await giaPhaService.create({ TenGiaPha, TruongToc }, userId);

        return res.status(HTTP_STATUS.CREATED).json({
            message: 'Tạo gia phả thành công',
            result
        });
    } catch (error: any) {
        console.error('Lỗi createGiaPha:', error);
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: 'Lỗi tạo gia phả',
            error: error.message
        });
    }
};

/**
 * Cập nhật gia phả
 * PUT /caygiapha/:MaGiaPha
 */
export const updateGiaPhaController = async (req: Request, res: Response) => {
    try {
        const { MaGiaPha } = req.params;
        const { TenGiaPha, TruongToc } = req.body;
        const { MaLoaiTK, MaTV } = req.userInfo as any;

        // Kiểm tra quyền sở hữu
        const giaPha = await giaPhaService.getDetail(MaGiaPha);
        if (!giaPha) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                message: 'Không tìm thấy gia phả'
            });
        }

        // Nếu là Owner (LTK02), chỉ được sửa gia phả mình tạo
        if (MaLoaiTK === 'LTK02' && giaPha.NguoiLap !== MaTV) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                message: 'Bạn không có quyền chỉnh sửa gia phả này'
            });
        }

        const result = await giaPhaService.update(MaGiaPha, { TenGiaPha, TruongToc });

        return res.status(HTTP_STATUS.OK).json({
            message: 'Cập nhật gia phả thành công',
            result
        });
    } catch (error: any) {
        console.error('Lỗi updateGiaPha:', error);
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: 'Lỗi cập nhật gia phả',
            error: error.message
        });
    }
};

/**
 * Xóa gia phả
 * DELETE /caygiapha/:MaGiaPha
 */
export const deleteGiaPhaController = async (req: Request, res: Response) => {
    try {
        const { MaGiaPha } = req.params;
        const { MaLoaiTK, MaTV } = req.userInfo as any;

        // Kiểm tra quyền sở hữu
        const giaPha = await giaPhaService.getDetail(MaGiaPha);
        if (!giaPha) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                message: 'Không tìm thấy gia phả'
            });
        }

        // Nếu là Owner (LTK02), chỉ được xóa gia phả mình tạo
        if (MaLoaiTK === 'LTK02' && giaPha.NguoiLap !== MaTV) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                message: 'Bạn không có quyền xóa gia phả này'
            });
        }

        const result = await giaPhaService.delete(MaGiaPha);

        if (!result) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Không thể xóa gia phả'
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            message: 'Xóa gia phả thành công'
        });
    } catch (error: any) {
        console.error('Lỗi deleteGiaPha:', error);
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: 'Lỗi xóa gia phả',
            error: error.message
        });
    }
};

/**
 * Thêm thành viên vào gia phả
 * PUT /caygiapha/:MaGiaPha/add-member
 */
export const addMemberController = async (req: Request, res: Response) => {
    try {
        const { MaGiaPha } = req.params;
        const { MaTV } = req.body;
        const userInfo = req.userInfo as any;

        if (!MaTV) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Mã thành viên là bắt buộc'
            });
        }

        // Kiểm tra quyền sở hữu
        const giaPha = await giaPhaService.getDetail(MaGiaPha);
        if (!giaPha) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                message: 'Không tìm thấy gia phả'
            });
        }

        if (userInfo.MaLoaiTK === 'LTK02' && giaPha.NguoiLap !== userInfo.MaTV) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                message: 'Bạn không có quyền thêm thành viên vào gia phả này'
            });
        }

        const result = await giaPhaService.addMember(MaGiaPha, MaTV);

        if (!result) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Không thể thêm thành viên vào gia phả'
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            message: 'Thêm thành viên vào gia phả thành công'
        });
    } catch (error: any) {
        console.error('Lỗi addMember:', error);
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: 'Lỗi thêm thành viên',
            error: error.message
        });
    }
};

/**
 * Xóa thành viên khỏi gia phả
 * PUT /caygiapha/:MaGiaPha/remove-member
 */
export const removeMemberController = async (req: Request, res: Response) => {
    try {
        const { MaTV } = req.body;
        // Cần MaGiaPha từ URL để check quyền, dù service chỉ cần MaTV
        const { MaGiaPha } = req.params;
        const userInfo = req.userInfo as any;

        if (!MaTV) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Mã thành viên là bắt buộc'
            });
        }

        // Kiểm tra quyền sở hữu
        const giaPha = await giaPhaService.getDetail(MaGiaPha);
        if (!giaPha) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                message: 'Không tìm thấy gia phả'
            });
        }

        if (userInfo.MaLoaiTK === 'LTK02' && giaPha.NguoiLap !== userInfo.MaTV) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                message: 'Bạn không có quyền xóa thành viên khỏi gia phả này'
            });
        }

        const result = await giaPhaService.removeMember(MaTV);

        if (!result) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Không thể xóa thành viên khỏi gia phả'
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            message: 'Xóa thành viên khỏi gia phả thành công'
        });
    } catch (error: any) {
        console.error('Lỗi removeMember:', error);
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: 'Lỗi xóa thành viên',
            error: error.message
        });
    }
};

/**
 * Lấy danh sách thành viên của gia phả
 * GET /caygiapha/:MaGiaPha/members
 */
export const getMembersController = async (req: Request, res: Response) => {
    try {
        const { MaGiaPha } = req.params;
        const result = await giaPhaService.getMembers(MaGiaPha);

        return res.status(HTTP_STATUS.OK).json({
            message: 'Lấy danh sách thành viên thành công',
            result
        });
    } catch (error: any) {
        console.error('Lỗi getMembers:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: 'Lỗi lấy danh sách thành viên',
            error: error.message
        });
    }
};

/**
 * Tìm kiếm thành viên theo tên (autocomplete)
 * GET /caygiapha/search-members?name=abc
 */
export const searchMembersController = async (req: Request, res: Response) => {
    try {
        const { name } = req.query;

        if (!name || typeof name !== 'string') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Vui lòng nhập tên để tìm kiếm'
            });
        }

        const result = await giaPhaService.searchMembersByName(name);

        return res.status(HTTP_STATUS.OK).json({
            message: 'Tìm kiếm thành công',
            result
        });
    } catch (error: any) {
        console.error('Lỗi searchMembers:', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: 'Lỗi tìm kiếm thành viên',
            error: error.message
        });
    }
};

/**
 * Thêm thành viên vào gia phả bằng email
 * POST /caygiapha/:MaGiaPha/add-member-by-email
 */
export const addMemberByEmailController = async (req: Request, res: Response) => {
    try {
        const { MaGiaPha } = req.params;
        const { email } = req.body;

        if (!email) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Email là bắt buộc'
            });
        }

        const result = await giaPhaService.addMemberByEmail(MaGiaPha, email);

        if (!result) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                message: 'Không thể thêm thành viên'
            });
        }

        return res.status(HTTP_STATUS.OK).json({
            message: 'Thêm thành viên thành công'
        });
    } catch (error: any) {
        console.error('Lỗi addMemberByEmail:', error);
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: 'Lỗi thêm thành viên',
            error: error.message
        });
    }
};
