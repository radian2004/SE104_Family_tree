/**
 * ============================================
 * PHIẾU THU SERVICE
 * Xử lý các API liên quan đến phiếu thu quỹ
 * ============================================
 */

import apiClient from '../api/client';

class PhieuThuService {
    /**
     * Lấy danh sách phiếu thu
     * GET /users/phieuthu
     */
    async getAll(params) {
        try {
            const response = await apiClient.get('/users/phieuthu', { params });
            return response.data.result || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy chi tiết phiếu thu
     * GET /users/phieuthu/:MaPhieuThu
     */
    async getDetail(MaPhieuThu) {
        try {
            const response = await apiClient.get(`/users/phieuthu/${MaPhieuThu}`);
            return response.data.result || response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Tạo phiếu thu mới
     * POST /users/phieuthu/create
     * @param {Object} data - { MaTV: string, chiTietPhieuThu: [{MaDMT, SoTienThu}] }
     */
    async create(data) {
        try {
            const response = await apiClient.post('/users/phieuthu/create', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy danh sách phiếu chờ xác nhận
     * GET /users/phieuthu/pending
     */
    async getPending() {
        try {
            const response = await apiClient.get('/users/phieuthu/pending');
            return response.data.result || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xác nhận chi tiết phiếu thu
     * PUT /users/phieuthu/xacnhan/:MaPhieuThu/:MaDMT
     */
    async xacNhan(MaPhieuThu, MaDMT) {
        try {
            const response = await apiClient.put(`/users/phieuthu/xacnhan/${MaPhieuThu}/${MaDMT}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Hủy xác nhận chi tiết phiếu thu
     * PUT /users/phieuthu/huyxacnhan/:MaPhieuThu/:MaDMT
     */
    async huyXacNhan(MaPhieuThu, MaDMT) {
        try {
            const response = await apiClient.put(`/users/phieuthu/huyxacnhan/${MaPhieuThu}/${MaDMT}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy danh sách danh mục
     * GET /users/phieuthu/danhmuc/list
     */
    async getDanhMuc() {
        try {
            const response = await apiClient.get('/users/phieuthu/danhmuc/list');
            return response.data.result || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Tạo danh mục mới
     * POST /users/phieuthu/danhmuc/create
     */
    async createDanhMuc(data) {
        try {
            const response = await apiClient.post('/users/phieuthu/danhmuc/create', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa phiếu thu
     * DELETE /users/phieuthu/:MaPhieuThu
     */
    async delete(MaPhieuThu) {
        try {
            const response = await apiClient.delete(`/users/phieuthu/${MaPhieuThu}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }


    /**
     * Tra cứu danh mục thu chi theo năm
     * GET /users/phieuthu/danhmuc/tra-cuu?nam=2025&MaGiaPha=GP01
     */
    async traCuuDanhMuc(nam, MaGiaPha) {
        try {
            const params = { nam };
            if (MaGiaPha) {
                params.MaGiaPha = MaGiaPha;
            }
            const response = await apiClient.get('/users/phieuthu/danhmuc/tra-cuu', {
                params
            });
            return response.data.data || response.data;
        } catch (error) {
            throw error;
        }
    }
}

const phieuThuService = new PhieuThuService();
export default phieuThuService;
