/**
 * ============================================
 * API CLIENT (Axios configuration)
 * ============================================
 */

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT, ACCESS_TOKEN_KEY } from '../utils/constants';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/helpers';

// Tạo axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== REQUEST INTERCEPTOR ====================
/**
 * Thêm access token vào header mỗi khi gửi request
 */
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================
/**
 * Xử lý response và refresh token nếu cần
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}:`, response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error(`[API] Error ${error.response?.status}:`, error.response?.data || error.message);

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Lấy refresh token
        const refreshToken = getRefreshToken();
        
        if (!refreshToken) {
          // Nếu không có refresh token, redirect về login
          clearTokens();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Gửi request refresh token
        const response = await axios.post(`${API_BASE_URL}/users/refresh-token`, {
          refresh_token: refreshToken,
        });

        // Lưu tokens mới
        const { access_token, refresh_token } = response.data.result;
        saveTokens(access_token, refresh_token);

        // Retry request gốc với token mới
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token thất bại, logout
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
