/**
 * ============================================
 * QUAN HỆ SERVICE
 * Xử lý quan hệ gia phả: hôn nhân (vợ chồng), cha mẹ con
 * ============================================
 */

import apiClient from '../api/client';

class QuanHeService {
  // ==================== HÔN NHÂN (VỢ CHỒNG) ====================
  /**
   * Lấy danh sách vợ/chồng của thành viên
   * GET /users/quanhe/honnhan/:MaTV
   * @param {string} MaTV - Mã thành viên
   * @returns {Promise<Array>} Danh sách vợ/chồng
   */
  async getHonNhan(MaTV) {
    try {
      const response = await apiClient.get(`/users/quanhe/honnhan/${MaTV}`);
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Thêm quan hệ hôn nhân
   * POST /users/quanhe/honnhan
   * @param {Object} payload - { MaTV, MaTVVC, NgayBatDau, NgayKetThuc? }
   * @returns {Promise<Object>} Kết quả
   */
  async createHonNhan(payload) {
    try {
      const response = await apiClient.post('/users/quanhe/honnhan', payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cập nhật quan hệ hôn nhân
   * PUT /users/quanhe/honnhan
   * @param {Object} payload - { MaTV, MaTVVC, NgayBatDau?, NgayKetThuc? }
   * @returns {Promise<Object>} Kết quả
   */
  async updateHonNhan(payload) {
    try {
      const response = await apiClient.put('/users/quanhe/honnhan', payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Xóa quan hệ hôn nhân
   * DELETE /users/quanhe/honnhan
   * @param {Object} payload - { MaTV, MaTVVC }
   * @returns {Promise<Object>} Kết quả
   */
  async deleteHonNhan(payload) {
    try {
      const response = await apiClient.delete('/users/quanhe/honnhan', { data: payload });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ==================== QUAN HỆ CHA MẸ CON ====================
  /**
   * Lấy danh sách con cái
   * GET /users/quanhe/concai/:MaTV
   * @param {string} MaTV - Mã thành viên (cha/mẹ)
   * @returns {Promise<Array>} Danh sách con cái
   */
  async getConCai(MaTV) {
    try {
      const response = await apiClient.get(`/users/quanhe/concai/${MaTV}`);
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy thông tin cha mẹ
   * GET /users/quanhe/chame/:MaTV
   * @param {string} MaTV - Mã thành viên (con)
   * @returns {Promise<Object>} Thông tin cha mẹ
   */
  async getChaMe(MaTV) {
    try {
      const response = await apiClient.get(`/users/quanhe/chame/${MaTV}`);
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Thêm quan hệ cha mẹ con
   * POST /users/quanhe/concai
   * @param {Object} payload - { MaTV, MaTVCha?, MaTVMe?, NgayPhatSinh? }
   * @returns {Promise<Object>} Kết quả
   */
  async createQuanHeCon(payload) {
    try {
      const response = await apiClient.post('/users/quanhe/concai', payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Xóa quan hệ cha mẹ con
   * DELETE /users/quanhe/concai/:MaTV
   * @param {string} MaTV - Mã thành viên (con)
   * @returns {Promise<Object>} Kết quả
   */
  async deleteQuanHeCon(MaTV) {
    try {
      const response = await apiClient.delete(`/users/quanhe/concai/${MaTV}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ==================== ALIAS METHODS (backward compatibility) ====================
  // Giữ lại các tên cũ để không phá vỡ code hiện tại

  async getVoChong(MaTV) {
    return this.getHonNhan(MaTV);
  }

  async createVoChong(payload) {
    return this.createHonNhan({
      MaTV: payload.MaTV,
      MaTVVC: payload.MaTV_Vo_Chong || payload.MaTVVC,
      NgayBatDau: payload.NgayBatDau || new Date().toISOString().split('T')[0],
      NgayKetThuc: payload.NgayKetThuc || null
    });
  }

  async updateVoChong(id, payload) {
    return this.updateHonNhan({ ...payload, MaTV: id });
  }

  async deleteVoChong(id) {
    // Cần cả MaTV và MaTVVC để xóa
    console.warn('deleteVoChong cần MaTVVC, sử dụng deleteHonNhan thay thế');
    throw new Error('Sử dụng deleteHonNhan({ MaTV, MaTVVC }) thay thế');
  }

  async createChaMe(payload) {
    return this.createQuanHeCon({
      MaTV: payload.MaCon,
      MaTVCha: payload.MaCha,
      MaTVMe: payload.MaMe,
      NgayPhatSinh: payload.NgayPhatSinh
    });
  }

  async deleteChaMe(MaTV) {
    return this.deleteQuanHeCon(MaTV);
  }
}

export default new QuanHeService();
