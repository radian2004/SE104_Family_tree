/**
 * ============================================
 * PHIẾU CHI SERVICE
 * Xử lý các API liên quan đến phiếu chi quỹ
 * ============================================
 */

import apiClient from '../api/client';

class PhieuChiService {
    /**
     * Lấy danh sách phiếu chi
     * GET /users/phieuchi
     */
    async getAll() {
        try {
            const response = await apiClient.get('/users/phieuchi');
            return response.data.result || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy chi tiết phiếu chi
     * GET /users/phieuchi/:MaPhieuChi
     */
    async getDetail(MaPhieuChi) {
        try {
            const response = await apiClient.get(`/users/phieuchi/${MaPhieuChi}`);
            return response.data.result || response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Tạo phiếu chi mới
     * POST /users/phieuchi/create
     * @param {Object} data - { MaDMC: string, SoTienChi: number, LyDoChi: string }
     */
    async create(data) {
        try {
            const response = await apiClient.post('/users/phieuchi/create', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cập nhật phiếu chi
     * PUT /users/phieuchi/:MaPhieuChi
     */
    async update(MaPhieuChi, data) {
        try {
            const response = await apiClient.put(`/users/phieuchi/${MaPhieuChi}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa phiếu chi
     * DELETE /users/phieuchi/:MaPhieuChi
     */
    async delete(MaPhieuChi) {
        try {
            const response = await apiClient.delete(`/users/phieuchi/${MaPhieuChi}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy danh sách phiếu chi theo danh mục
     * GET /users/phieuchi/danhmuc/:MaDM
     */
    async getByDanhMuc(MaDM) {
        try {
            const response = await apiClient.get(`/users/phieuchi/danhmuc/${MaDM}`);
            return response.data.result || response.data;
        } catch (error) {
            throw error;
        }
    }
}

const phieuChiService = new PhieuChiService();
export default phieuChiService;
