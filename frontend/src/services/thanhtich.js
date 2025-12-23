/**
 * ============================================
 * THÀNH TÍCH SERVICE
 * Xử lý các API liên quan đến thành tích
 * ============================================
 */

import apiClient from '../api/client';

class ThanhTichService {
    /**
     * Lấy danh sách thành tích (tra cứu)
     * GET /thanhtich/tracuu
     * Params: HoTen, TenLoaiThanhTich, TuNgay, DenNgay, MaTV
     */
    async traCuu(params) {
        try {
            const response = await apiClient.get('/thanhtich/tracuu', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Ghi nhận thành tích mới
     * POST /thanhtich/ghinhan
     * Body: { MaTV, MaLTT, NgayPhatSinh }
     */
    async ghiNhan(payload) {
        try {
            const response = await apiClient.post('/thanhtich/ghinhan', payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa thành tích
     * DELETE /thanhtich/xoa
     * Body: { MaTV, MaLTT, NgayPhatSinh }
     */
    async xoa(payload) {
        try {
            const response = await apiClient.delete('/thanhtich/xoa', { data: payload });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy danh sách loại thành tích
     * GET /thanhtich/loai
     */
    async getLoai() {
        try {
            const response = await apiClient.get('/thanhtich/loai');
            return response.data.result || response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default new ThanhTichService();
