/**
 * ============================================
 * AUTH STORE (Zustand)
 * Quản lý trạng thái authentication
 * ============================================
 */

import { create } from 'zustand';
import { saveTokens, clearTokens, isAuthenticated } from '../utils/helpers';

/**
 * @typedef {Object} User
 * @property {string} TenDangNhap - Username/Email
 * @property {string} MaTV - Mã thành viên
 * @property {string} MaLoaiTK - Mã loại tài khoản
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user - User info
 * @property {boolean} isLoggedIn - Trạng thái đăng nhập
 * @property {boolean} isLoading - Trạng thái loading
 * @property {string|null} error - Error message
 * @property {Function} setUser - Set user info
 * @property {Function} setLoading - Set loading state
 * @property {Function} setError - Set error
 * @property {Function} login - Xử lý đăng nhập
 * @property {Function} logout - Xử lý đăng xuất
 * @property {Function} clearError - Xóa error
 * @property {Function} checkAuth - Kiểm tra auth status
 */

export const useAuthStore = create((set) => ({
  // ==================== STATE ====================
  user: null,
  isLoggedIn: isAuthenticated(),
  isLoading: false,
  error: null,

  // ==================== SETTERS ====================
  /**
   * Set user info
   */
  setUser: (user) => set({ user }),

  /**
   * Set loading state
   */
  setLoading: (isLoading) => set({ isLoading }),

  /**
   * Set error message
   */
  setError: (error) => set({ error }),

  /**
   * Clear error message
   */
  clearError: () => set({ error: null }),

  /**
   * Reset auth state (khi logout)
   */
  resetAuth: () => set({
    user: null,
    isLoggedIn: false,
    isLoading: false,
    error: null,
  }),

  // ==================== ACTIONS ====================
  /**
   * Handle login
   * @param {Object} userData - User data từ backend
   * @param {string} userData.access_token - Access token
   * @param {string} userData.refresh_token - Refresh token
   * @param {Object} userData.user - User info
   */
  login: (userData) => {
    const { access_token, refresh_token, user } = userData;
    
    // Lưu tokens
    saveTokens(access_token, refresh_token);
    
    // Lưu user info
    set({
      user,
      isLoggedIn: true,
      isLoading: false,
      error: null,
    });
  },

  /**
   * Handle logout
   */
  logout: () => {
    clearTokens();
    set({
      user: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,
    });
  },

  /**
   * Kiểm tra auth status từ localStorage
   */
  checkAuth: () => {
    const isLoggedIn = isAuthenticated();
    set({ isLoggedIn });
    return isLoggedIn;
  },
}));
