/**
 * ============================================
 * AUTH STORE (Zustand)
 * Quản lý trạng thái authentication
 * ============================================
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

/**
 * @typedef {Object} User
 * @property {string} TenDangNhap - Username/Email
 * @property {string} MaTV - Mã thành viên
 * @property {string} MaLoaiTK - Mã loại tài khoản
 * @property {string} HoTen - Họ tên
 * @property {string} LoaiTaiKhoan - Tên loại tài khoản
 */

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ==================== STATE ====================
      user: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,

      // ==================== SETTERS ====================
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      resetAuth: () => set({
        user: null,
        isLoggedIn: false,
        isLoading: false,
        error: null,
      }),

      // ==================== ACTIONS ====================

      /**
       * Handle login - nhận user data từ response và lưu vào store
       * Tokens được lưu trong HTTP-only cookies (do backend quản lý)
       */
      login: (userData) => {
        set({
          user: userData,
          isLoggedIn: true,
          isLoading: false,
          error: null,
        });
      },

      /**
       * Fetch user info từ API /users/me
       * Sử dụng khi cần refresh thông tin user
       */
      fetchUserInfo: async () => {
        try {
          set({ isLoading: true });
          const response = await apiClient.get('/users/me');
          const userData = response.data.result;

          set({
            user: userData,
            isLoggedIn: true,
            isLoading: false,
            error: null,
          });

          return userData;
        } catch (error) {
          console.error('[authStore] fetchUserInfo error:', error);
          // Nếu lỗi 401, có thể token đã hết hạn
          if (error.response?.status === 401) {
            set({
              user: null,
              isLoggedIn: false,
              isLoading: false,
              error: null,
            });
          }
          throw error;
        }
      },

      /**
       * Handle logout - gọi API logout và reset state
       */
      logout: async () => {
        try {
          await apiClient.post('/users/logout');
        } catch (error) {
          console.error('[authStore] logout error:', error);
        } finally {
          set({
            user: null,
            isLoggedIn: false,
            isLoading: false,
            error: null,
          });
        }
      },

      /**
       * Kiểm tra auth status bằng cách gọi API /users/me
       * Nếu thành công -> user đã login
       * Nếu thất bại -> user chưa login hoặc token hết hạn
       */
      checkAuth: async () => {
        const currentUser = get().user;

        // Nếu đã có user trong store, coi như đã login
        if (currentUser) {
          set({ isLoggedIn: true });
          return true;
        }

        // Thử fetch user info từ API
        try {
          set({ isLoading: true });
          const response = await apiClient.get('/users/me');
          const userData = response.data.result;

          set({
            user: userData,
            isLoggedIn: true,
            isLoading: false,
          });

          return true;
        } catch (error) {
          // Token không hợp lệ hoặc hết hạn
          set({
            user: null,
            isLoggedIn: false,
            isLoading: false,
          });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn
      }),
    }
  )
);
