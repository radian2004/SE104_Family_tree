/**
 * ============================================
 * CONSTANTS
 * ============================================
 */

// API Config
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const API_TIMEOUT = 10000; // 10 seconds

// Tokens
export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// Routes
export const ROUTES = {
  // Public
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Protected
  DASHBOARD: '/dashboard',
  THANHVIEN: '/thanhvien',
  THANHVIEN_DETAIL: '/thanhvien/:MaTV',
  THANHVIEN_CREATE: '/thanhvien/create',
  THANHVIEN_EDIT: '/thanhvien/:MaTV/edit',
  GIAPHAT: '/giaphat',
  
  // Errors
  NOT_FOUND: '/404',
};

// HTTP Status Messages
export const HTTP_MESSAGES = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
};

// Form Validation Rules
export const VALIDATION_RULES = {
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
};

// Thành viên Status
export const THANHVIEN_STATUS = {
  SỐNG: 'Sống',
  MẤT: 'Mất',
};

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const PAGE_SIZES = [10, 20, 50, 100];
