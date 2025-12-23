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
     * POST /ketthuc/ghinhan
     * @param {Object} payload - { MaTV, NgayGioMat, MaNguyenNhanMat, MaDiaDiem }
     */
    async ghiNhan(payload) {
        try {
            const response = await apiClient.post('/ketthuc/ghinhan', payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Tra cứu thông tin kết thúc
     * GET /ketthuc/tracuu
     */
    async traCuu(params) {
        try {
            const response = await apiClient.get('/ketthuc/tracuu', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xem chi tiết kết thúc theo MaTV
     * GET /ketthuc/:MaTV
     */
    async getDetail(MaTV) {
        try {
            const response = await apiClient.get(`/ketthuc/${MaTV}`);
            return response.data.result || response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cập nhật thông tin kết thúc
     * PUT /ketthuc/:MaTV
     */
    async update(MaTV, payload) {
        try {
            const response = await apiClient.put(`/ketthuc/${MaTV}`, payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa thông tin kết thúc (Hồi sinh)
     * DELETE /ketthuc/:MaTV
     */
    async delete(MaTV) {
        try {
            const response = await apiClient.delete(`/ketthuc/${MaTV}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default new KetThucService();
