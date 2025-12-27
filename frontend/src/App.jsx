/**
 * ============================================
 * APP - ROUTES CONFIGURATION
 * ============================================
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute, PublicRoute } from './components/common/ProtectedRoute';
import { AdminRoute } from './components/common/AdminRoute';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ThanhVienPage from './pages/ThanhVienPage';
import ThanhVienDetailPage from './pages/ThanhVienDetailPage';
import ThanhVienCreatePage from './pages/ThanhVienCreatePage';
import ThanhVienEditPage from './pages/ThanhVienEditPage';
import GiaPhaPage from './pages/GiaPhaPage';
import GiaPhaDetailPage from './pages/GiaPhaDetailPage';
import BaoCaoPage from './pages/BaoCaoPage';
import QuanHeHonNhanPage from './pages/QuanHeHonNhanPage';
import QuanHeConCaiPage from './pages/QuanHeConCaiPage';

// Admin Pages
import QuanLyTaiKhoanPage from './pages/admin/QuanLyTaiKhoanPage';

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

        {/* Thành viên routes */}
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

        {/* Gia phả routes */}
        <Route
          path="/giapha"
          element={
            <ProtectedRoute>
              <GiaPhaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/giapha/:MaGiaPha"
          element={
            <ProtectedRoute>
              <GiaPhaDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Báo cáo route */}
        <Route
          path="/baocao"
          element={
            <ProtectedRoute>
              <BaoCaoPage />
            </ProtectedRoute>
          }
        />

        {/* Quan hệ routes */}
        <Route
          path="/quanhe/honnhan"
          element={
            <ProtectedRoute>
              <QuanHeHonNhanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quanhe/concai"
          element={
            <ProtectedRoute>
              <QuanHeConCaiPage />
            </ProtectedRoute>
          }
        />

        {/* ==================== ADMIN ROUTES ==================== */}
        <Route
          path="/admin/taikhoan"
          element={
            <AdminRoute>
              <QuanLyTaiKhoanPage />
            </AdminRoute>
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

