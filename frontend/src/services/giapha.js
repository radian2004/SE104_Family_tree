/**
 * ============================================
 * GIA PHẢ SERVICE
 * Xử lý các API liên quan đến cây gia phả
 * ============================================
 */

import apiClient from '../api/client';

class GiaPhaService {
    /**
     * Lấy danh sách tất cả gia phả
     * GET /lookups/caygiapha
     */
    async getAll() {
        try {
            const response = await apiClient.get('/lookups/caygiapha');
            return response.data.result || response.data || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy chi tiết gia phả theo mã
     * GET /lookups/caygiapha/:MaGiaPha
     */
    async getDetail(MaGiaPha) {
        try {
            const response = await apiClient.get(`/lookups/caygiapha/${MaGiaPha}`);
            return response.data.result || response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy danh sách thành viên theo gia phả
     * GET /thanhvien với filter MaGiaPha
     */
    async getThanhVienByGiaPha(MaGiaPha) {
        try {
            const response = await apiClient.get('/thanhvien', {
                params: { MaGiaPha }
            });
            return response.data.result || response.data || [];
        } catch (error) {
            throw error;
        }
    }
}

const giaPhaService = new GiaPhaService();
export default giaPhaService;
