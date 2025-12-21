/**
 * ============================================
 * PROTECTED ROUTE COMPONENT
 * Kiểm soát quyền truy cập trang
 * ============================================
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';

/**
 * Protected Route - chỉ user đã login mới vào được
 */
export const ProtectedRoute = ({ children }) => {
  // TEMPORARY: Bypass auth để test UI
  // TODO: Remove this when auth is ready
  const BYPASS_AUTH = false; // ← Set to false để bật auth lại

  if (BYPASS_AUTH) {
    return children;
  }

  const { isLoggedIn, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * Public Route - chỉ user chưa login mới vào được (Login/Register pages)
 */
export const PublicRoute = ({ children }) => {
  const { isLoggedIn, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
