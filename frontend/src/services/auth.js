/**
 * ============================================
 * AUTH SERVICE
 * Xử lý tất cả các API call liên quan đến authentication
 * Backend dùng HTTP-only cookies cho tokens
 * ============================================
 */

import apiClient from '../api/client';

class AuthService {
  /**
   * Đăng ký tài khoản mới
   * POST /users/register
   * Backend trả về: { message, user } + set cookies
   */
  async register(payload) {
    try {
      const response = await apiClient.post('/users/register', payload);
      // Backend trả về { message, user } - không có .result
      return response.data.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Đăng nhập
   * POST /users/login
   * Backend trả về: { message, user } + set cookies
   */
  async login(payload) {
    try {
      const response = await apiClient.post('/users/login', payload);
      // Backend trả về { message, user } - không có .result
      return response.data.user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Đăng xuất
   * POST /users/logout
   * Backend lấy refresh_token từ cookies, không cần gửi trong body
   */
  async logout() {
    try {
      const response = await apiClient.post('/users/logout');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh token
   * POST /users/refresh-token
   * Backend dùng cookies nên không cần gửi refresh_token
   */
  async refreshToken() {
    try {
      const response = await apiClient.post('/users/refresh-token');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy thông tin profile của user
   * GET /users/profile
   */
  async getProfile() {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data.user || response.data.result;
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthService();
