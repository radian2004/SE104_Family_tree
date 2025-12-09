/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './constants';

// ==================== TOKEN MANAGEMENT ====================
/**
 * Lưu tokens vào localStorage
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 */
export const saveTokens = (accessToken, refreshToken) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Lấy access token từ localStorage
 * @returns {string|null} Access token hoặc null
 */
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Lấy refresh token từ localStorage
 * @returns {string|null} Refresh token hoặc null
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Xóa tất cả tokens khỏi localStorage
 */
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Kiểm tra user đã đăng nhập hay chưa
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

// ==================== DATE HELPERS ====================
/**
 * Format ngày theo dạng DD/MM/YYYY
 * @param {Date|string} date - Ngày cần format
 * @returns {string} Ngày đã format
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format ngày theo dạng YYYY-MM-DD (để dùng trong input date)
 * @param {Date|string} date - Ngày cần format
 * @returns {string} Ngày đã format
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse ngày từ input date (YYYY-MM-DD) sang Date object
 * @param {string} dateString - String định dạng YYYY-MM-DD
 * @returns {Date} Date object
 */
export const parseDate = (dateString) => {
  return new Date(dateString);
};

// ==================== STRING HELPERS ====================
/**
 * Cắt chuỗi dài
 * @param {string} str - Chuỗi cần cắt
 * @param {number} length - Độ dài tối đa
 * @returns {string} Chuỗi đã cắt
 */
export const truncateString = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

/**
 * Viết hoa chữ cái đầu
 * @param {string} str - Chuỗi cần format
 * @returns {string} Chuỗi đã format
 */
export const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// ==================== ERROR HANDLERS ====================
/**
 * Lấy error message từ response
 * @param {Error|object} error - Error object
 * @returns {string} Error message
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Đã xảy ra lỗi. Vui lòng thử lại.';
};

/**
 * Lấy tất cả error messages từ validation errors
 * @param {object} errors - Validation errors object
 * @returns {string[]} Mảng các error messages
 */
export const getErrorMessages = (errors) => {
  return Object.values(errors || {}).flat();
};

// ==================== OBJECT HELPERS ====================
/**
 * Loại bỏ undefined values từ object
 * @param {object} obj - Object cần clean
 * @returns {object} Object đã clean
 */
export const cleanObject = (obj) => {
  const cleaned = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
};

/**
 * Tạo query string từ object
 * @param {object} params - Parameters object
 * @returns {string} Query string
 */
export const createQueryString = (params) => {
  const query = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      query.append(key, params[key]);
    }
  });
  return query.toString();
};
