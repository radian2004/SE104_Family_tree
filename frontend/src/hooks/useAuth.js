/**
 * ============================================
 * CUSTOM HOOKS
 * ============================================
 */

import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '../utils/helpers';
import authService from '../services/auth';

/**
 * Hook để sử dụng auth store và các hàm liên quan
 * @returns {Object} Auth hook
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const authStore = useAuthStore();

  /**
   * Handle login
   * @param {Object} credentials - { email, password }
   */
  const handleLogin = useCallback(
    async (credentials) => {
      authStore.setLoading(true);
      authStore.clearError();

      try {
        console.log('[LOGIN] Bắt đầu đăng nhập với:', credentials.email);
        const result = await authService.login(credentials);
        console.log('[LOGIN] Đăng nhập thành công:', result);
        authStore.login(result);
        navigate('/dashboard');
      } catch (error) {
        console.error('[LOGIN] Lỗi đăng nhập:', error);
        const message = getErrorMessage(error);
        console.log('[LOGIN] Error message:', message);
        authStore.setError(message);
        throw error;
      } finally {
        authStore.setLoading(false);
      }
    },
    [authStore, navigate]
  );

  /**
   * Handle register
   * @param {Object} payload - { name, email, password, confirm_password }
   */
  const handleRegister = useCallback(
    async (payload) => {
      authStore.setLoading(true);
      authStore.clearError();

      try {
        console.log('[REGISTER] Bắt đầu đăng ký với:', payload.email);
        const result = await authService.register(payload);
        console.log('[REGISTER] Đăng ký thành công:', result);
        authStore.login(result);
        navigate('/dashboard');
      } catch (error) {
        console.error('[REGISTER] Lỗi đăng ký:', error);
        const message = getErrorMessage(error);
        console.log('[REGISTER] Error message:', message);
        authStore.setError(message);
        throw error;
      } finally {
        authStore.setLoading(false);
      }
    },
    [authStore, navigate]
  );

  /**
   * Handle logout
   */
  const handleLogout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authStore.logout();
      navigate('/login');
    }
  }, [authStore, navigate]);

  return {
    ...authStore,
    handleLogin,
    handleRegister,
    handleLogout,
  };
};

/**
 * Hook để load data async
 * @param {Function} asyncFunction - Async function để gọi
 * @returns {Object} { data, isLoading, error }
 */
export const useAsync = (asyncFunction, immediate = true) => {
  const [state, setState] = useState({
    data: null,
    isLoading: immediate,
    error: null,
  });

  const execute = useCallback(async (...args) => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const result = await asyncFunction(...args);
      setState({ data: result, isLoading: false, error: null });
      return result;
    } catch (error) {
      setState({ data: null, isLoading: false, error });
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
};
