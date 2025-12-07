/**
 * ============================================
 * APP - ROUTES CONFIGURATION
 * ============================================
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute, PublicRoute } from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ThanhVienPage from './pages/ThanhVienPage';
import ThanhVienDetailPage from './pages/ThanhVienDetailPage';
import ThanhVienCreatePage from './pages/ThanhVienCreatePage';
import ThanhVienEditPage from './pages/ThanhVienEditPage';

// Placeholder pages (sẽ tạo sau)
const GiaPhaBrowserPage = () => <div className="p-8">Gia phả - Coming Soon</div>;

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // Check auth status khi app mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Routes>
        {/* ==================== PUBLIC ROUTES ==================== */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* ==================== PROTECTED ROUTES ==================== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thanhvien"
          element={
            <ProtectedRoute>
              <ThanhVienPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thanhvien/create"
          element={
            <ProtectedRoute>
              <ThanhVienCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thanhvien/:MaTV/edit"
          element={
            <ProtectedRoute>
              <ThanhVienEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thanhvien/:MaTV"
          element={
            <ProtectedRoute>
              <ThanhVienDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/giaphat"
          element={
            <ProtectedRoute>
              <GiaPhaBrowserPage />
            </ProtectedRoute>
          }
        />

        {/* ==================== DEFAULT & 404 ==================== */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}
