/**
 * ============================================
 * THÀNH VIÊN SERVICE
 * Xử lý tất cả các API call liên quan đến thành viên
 * ============================================
 */

import apiClient from '../api/client';
import { createQueryString } from '../utils/helpers';

class ThanhVienService {
  /**
   * Lấy danh sách thành viên với pagination
   * GET /thanhvien?page=1&limit=10&search=...&sortBy=...&sortOrder=...
   * @param {Object} params - { page, limit, search, sortBy, sortOrder }
   * @returns {Promise<Object>} { items, total, page, limit, totalPages }
   */
  async getList(params = {}) {
    try {
      const queryString = createQueryString(params);
      const url = queryString ? `/thanhvien?${queryString}` : '/thanhvien';
      const response = await apiClient.get(url);
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy chi tiết thành viên
   * GET /thanhvien/:MaTV
   * @param {string} MaTV - Mã thành viên
   * @returns {Promise<Object>} Thông tin thành viên
   */
  async getDetail(MaTV) {
    try {
      const response = await apiClient.get(`/thanhvien/${MaTV}`);
      return response.data.result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tạo thành viên mới
   * POST /thanhvien
   * @param {Object} payload - Thông tin thành viên
   * @returns {Promise<Object>} Thành viên vừa tạo
   */
  async create(payload) {
    try {
      const response = await apiClient.post('/thanhvien', payload);
      return response.data.result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cập nhật thành viên
   * PUT /thanhvien/:MaTV
   * @param {string} MaTV - Mã thành viên
   * @param {Object} payload - Thông tin cần cập nhật
   * @returns {Promise<Object>} Thành viên đã cập nhật
   */
  async update(MaTV, payload) {
    try {
      const response = await apiClient.put(`/thanhvien/${MaTV}`, payload);
      return response.data.result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Xóa thành viên
   * DELETE /thanhvien/:MaTV
   * @param {string} MaTV - Mã thành viên
   * @returns {Promise<Object>} Result
   */
  async delete(MaTV) {
    try {
      const response = await apiClient.delete(`/thanhvien/${MaTV}`);
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Tìm kiếm thành viên
   * GET /thanhvien/search?q=...
   * @param {string} query - Từ khóa tìm kiếm
   * @returns {Promise<Array>} Danh sách kết quả
   */
  async search(query) {
    try {
      const response = await apiClient.get('/thanhvien/search', {
        params: { q: query },
      });
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách thành viên theo gia phả
   * GET /thanhvien/giaphat/:MaGiaPha
   * @param {string} MaGiaPha - Mã gia phả
   * @returns {Promise<Array>} Danh sách thành viên
   */
  async getByGiaPha(MaGiaPha) {
    try {
      const response = await apiClient.get(`/thanhvien/giaphat/${MaGiaPha}`);
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy tất cả lookup data (Giới tính, Quê quán, Nghề nghiệp, Gia phả)
   * Gọi lookupsService thay vì định nghĩa ở đây
   * @returns {Promise<Object>} { gioiTinh, queQuan, ngheNghiep, cayGiaPha, loaiTaiKhoan }
   */
  async getLookups() {
    try {
      const lookupsService = (await import('./lookups.js')).default;
      const result = await lookupsService.getAll();
      return result;
    } catch (error) {
      console.error('Error loading lookups:', error);
      throw error;
    }
  }
}

export default new ThanhVienService();
export { ThanhVienService };
