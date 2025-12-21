/**
 * ============================================
 * AUTH SERVICE
 * Xử lý tất cả các API call liên quan đến authentication
 * ============================================
 */

import apiClient from '../api/client';

class AuthService {
  /**
   * Đăng ký tài khoản mới
   * POST /users/register
   * @param {Object} payload - { name, email, password, confirm_password }
   * @returns {Promise<Object>} User info và tokens
   */
  async register(payload) {
    try {
      const response = await apiClient.post('/users/register', payload);
      return response.data.result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Đăng nhập
   * POST /users/login
   * @param {Object} payload - { email, password }
   * @returns {Promise<Object>} User info và tokens
   */
  async login(payload) {
    try {
      const response = await apiClient.post('/users/login', payload);
      return response.data.result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Đăng xuất
   * POST /users/logout
   * @param {string} refresh_token - Refresh token
   * @returns {Promise<Object>} Logout result
   */
  async logout(refresh_token) {
    try {
      const response = await apiClient.post('/users/logout', {
        refresh_token,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh token
   * POST /users/refresh-token
   * @param {string} refresh_token - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refresh_token) {
    try {
      const response = await apiClient.post('/users/refresh-token', {
        refresh_token,
      });
      return response.data.result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy thông tin profile của user
   * GET /users/profile
   * @returns {Promise<Object>} User info
   */
  async getProfile() {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data.result;
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthService();
