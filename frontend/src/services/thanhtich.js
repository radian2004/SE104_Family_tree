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
     * GET /users/thanhtich/tracuu
     * Params: HoTen, TenLoaiThanhTich, TuNgay, DenNgay, MaTV
     */
    async traCuu(params) {
        try {
            const response = await apiClient.get('/users/thanhtich/tracuu', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Ghi nhận thành tích mới
     * POST /users/thanhtich/ghinhan
     * Body: { MaTV, MaLTT, NgayPhatSinh }
     */
    async ghiNhan(payload) {
        try {
            const response = await apiClient.post('/users/thanhtich/ghinhan', payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa thành tích
     * DELETE /users/thanhtich/xoa
     * Body: { MaTV, MaLTT, NgayPhatSinh }
     */
    async xoa(payload) {
        try {
            const response = await apiClient.delete('/users/thanhtich/xoa', { data: payload });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy danh sách loại thành tích
     * GET /users/thanhtich/loai
     */
    async getLoai() {
        try {
            const response = await apiClient.get('/users/thanhtich/loai');
            return response.data.result || response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cập nhật loại thành tích
     * PUT /users/thanhtich/capnhat
     * @param {Object} payload - { MaTV, MaLTT, NgayPhatSinh, MaLTTMoi }
     */
    async capNhat(payload) {
        try {
            const response = await apiClient.put('/users/thanhtich/capnhat', payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy báo cáo thành tích theo năm
     * GET /users/thanhtich/baocao
     * @param {Object} params - { Nam }
     */
    async getBaoCao(params = {}) {
        try {
            const response = await apiClient.get('/users/thanhtich/baocao', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy thành tích theo tên thành viên
     * GET /users/thanhtich/thanhvien
     * @param {string} hoTen - Tên thành viên (LIKE search)
     */
    async getByHoTen(hoTen) {
        try {
            const response = await apiClient.get('/users/thanhtich/thanhvien', {
                params: { HoTen: hoTen }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default new ThanhTichService();
