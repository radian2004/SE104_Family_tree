/**
 * ============================================
 * QUAN HỆ SERVICE
 * Xử lý quan hệ gia phả: vợ chồng, cha mẹ con
 * ============================================
 */

import apiClient from '../api/client';

class QuanHeService {
  // ==================== VỢ CHỒNG ====================
  /**
   * Lấy danh sách vợ/chồng của thành viên
   * GET /quanhevochong/:MaTV
   * @param {string} MaTV - Mã thành viên
   * @returns {Promise<Array>} Danh sách vợ/chồng
   */
  async getVoChong(MaTV) {
    try {
      const response = await apiClient.get(`/quanhevochong/${MaTV}`);
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Thêm quan hệ vợ chồng
   * POST /quanhevochong
   * @param {Object} payload - { MaTV, MaTV_Vo_Chong }
   * @returns {Promise<Object>} Quan hệ vừa tạo
   */
  async createVoChong(payload) {
    try {
      const response = await apiClient.post('/quanhevochong', payload);
      return response.data.result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cập nhật quan hệ vợ chồng
   * PUT /quanhevochong/:id
   * @param {string} id - ID quan hệ
   * @param {Object} payload - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Quan hệ đã cập nhật
   */
  async updateVoChong(id, payload) {
    try {
      const response = await apiClient.put(`/quanhevochong/${id}`, payload);
      return response.data.result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Xóa quan hệ vợ chồng
   * DELETE /quanhevochong/:id
   * @param {string} id - ID quan hệ
   * @returns {Promise<Object>} Result
   */
  async deleteVoChong(id) {
    try {
      const response = await apiClient.delete(`/quanhevochong/${id}`);
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  // ==================== QUAN HỆ CHA MẸ CON ====================
  /**
   * Lấy danh sách con cái
   * GET /quanhecon/:MaTV
   * @param {string} MaTV - Mã thành viên (cha/mẹ)
   * @returns {Promise<Array>} Danh sách con cái
   */
  async getConCai(MaTV) {
    try {
      const response = await apiClient.get(`/quanhecon/${MaTV}`);
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách cha mẹ
   * GET /quanhecha/:MaTV
   * @param {string} MaTV - Mã thành viên (con)
   * @returns {Promise<Array>} Danh sách cha mẹ
   */
  async getChaMe(MaTV) {
    try {
      const response = await apiClient.get(`/quanhecha/${MaTV}`);
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Thêm quan hệ cha mẹ con
   * POST /quanhecon
   * @param {Object} payload - { MaCha, MaMe, MaCon }
   * @returns {Promise<Object>} Quan hệ vừa tạo
   */
  async createChaMe(payload) {
    try {
      const response = await apiClient.post('/quanhecon', payload);
      return response.data.result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Xóa quan hệ cha mẹ con
   * DELETE /quanhecon/:id
   * @param {string} id - ID quan hệ
   * @returns {Promise<Object>} Result
   */
  async deleteChaMe(id) {
    try {
      const response = await apiClient.delete(`/quanhecon/${id}`);
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new QuanHeService();
