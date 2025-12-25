/**
 * ============================================
 * API CLIENT (Axios configuration)
 * Backend dùng HTTP-only cookies cho authentication
 * ============================================
 */

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../utils/constants';

// Tạo axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // ✅ QUAN TRỌNG: Gửi cookies với mọi request
});

// ==================== REQUEST INTERCEPTOR ====================
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// ==================== RESPONSE INTERCEPTOR ====================
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}:`, response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error(`[API] Error ${error.response?.status}:`, error.response?.data || error.message);

    // Nếu lỗi 401 và chưa retry - thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Backend lấy refresh_token từ cookies
        await axios.post(`${API_BASE_URL}/users/refresh-token`, {}, {
          withCredentials: true
        });

        // Retry request gốc
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token thất bại, redirect về login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
