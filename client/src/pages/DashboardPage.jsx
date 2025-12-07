/**
 * ============================================
 * DASHBOARD PAGE
 * ============================================
 */

import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    await handleLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Gia Phả</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">
              Xin chào, <strong>{user?.TenDangNhap}</strong>
            </span>
            <button
              onClick={handleLogoutClick}
              className="btn-secondary btn-small"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Thành viên */}
          <div
            onClick={() => navigate('/thanhvien')}
            className="card card-hover cursor-pointer transform hover:scale-105 transition-transform"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-gray-800">Thành viên</h3>
              <p className="text-gray-600 mt-2">Quản lý các thành viên gia phả</p>
              <button className="btn-primary mt-4">Xem thêm</button>
            </div>
          </div>

          {/* Card 2: Gia phả */}
          <div
            onClick={() => navigate('/giaphat')}
            className="card card-hover cursor-pointer transform hover:scale-105 transition-transform"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">🌳</div>
              <h3 className="text-2xl font-bold text-gray-800">Cây gia phả</h3>
              <p className="text-gray-600 mt-2">Xem cây gia phả theo mô hình</p>
              <button className="btn-primary mt-4">Xem thêm</button>
            </div>
          </div>

          {/* Card 3: Thống kê */}
          <div className="card card-hover">
            <div className="text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-800">Thống kê</h3>
              <p className="text-gray-600 mt-2">Xem báo cáo và thống kê</p>
              <button className="btn-primary mt-4">Xem thêm</button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tính năng chính</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="flex items-start">
              <span className="text-2xl mr-4">✓</span>
              <div>
                <h4 className="font-bold text-gray-800">Quản lý thành viên</h4>
                <p className="text-gray-600">Thêm, sửa, xóa thông tin các thành viên gia phả</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-4">✓</span>
              <div>
                <h4 className="font-bold text-gray-800">Quan hệ gia đình</h4>
                <p className="text-gray-600">Quản lý quan hệ vợ chồng, cha mẹ, con cái</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-4">✓</span>
              <div>
                <h4 className="font-bold text-gray-800">Trực quan hóa</h4>
                <p className="text-gray-600">Xem cây gia phả dưới dạng biểu đồ</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-4">✓</span>
              <div>
                <h4 className="font-bold text-gray-800">Báo cáo</h4>
                <p className="text-gray-600">Xuất báo cáo và thống kê thành viên</p>
              </div>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
