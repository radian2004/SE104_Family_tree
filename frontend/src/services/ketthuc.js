/**
 * ============================================
 * KẾT THÚC SERVICE
 * Xử lý ghi nhận và tra cứu thông tin mất
 * ============================================
 */

import apiClient from '../api/client';

class KetThucService {
    /**
     * Ghi nhận kết thúc (báo tử)
     * POST /users/ketthuc/ghinhan
     * @param {Object} payload - { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem }
     */
    async ghiNhan(payload) {
        try {
            const response = await apiClient.post('/users/ketthuc/ghinhan', payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Tra cứu thông tin kết thúc
     * GET /users/ketthuc/tracuu
     */
    async traCuu(params) {
        try {
            const response = await apiClient.get('/users/ketthuc/tracuu', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xem chi tiết kết thúc theo MaTV
     * GET /users/ketthuc/:MaTV
     */
    async getDetail(MaTV) {
        try {
            const response = await apiClient.get(`/users/ketthuc/${MaTV}`);
            return response.data.result || response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cập nhật thông tin kết thúc
     * PUT /users/ketthuc/:MaTV
     */
    async update(MaTV, payload) {
        try {
            const response = await apiClient.put(`/users/ketthuc/${MaTV}`, payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa thông tin kết thúc (Hồi sinh)
     * DELETE /users/ketthuc/:MaTV
     */
    async delete(MaTV) {
        try {
            const response = await apiClient.delete(`/users/ketthuc/${MaTV}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default new KetThucService();
