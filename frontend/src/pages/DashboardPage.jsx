/**
 * ============================================
 * DASHBOARD PAGE - Premium Family Tree Design
 * With Role-Based Navigation
 * ============================================
 */

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiGitBranch,
  FiPieChart,
  FiAward,
  FiHeart,
  FiBarChart2,
  FiLogOut,
  FiChevronRight,
  FiShield,
  FiUserPlus,
  FiSettings,
  FiBook,
  FiDollarSign,
  FiAlertCircle
} from 'react-icons/fi';
import AdminPasswordRequests from '../components/admin/AdminPasswordRequests';
import UserProfileModal from '../components/UserProfileModal';


export default function DashboardPage() {
  const { user, handleLogout } = useAuth();
  const { isAdmin, isOwner, isUser, roleName, roleIcon } = usePermissions();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);


  const handleLogoutClick = async () => {
    await handleLogout();
  };

  // ========== MAIN FEATURES (all roles) ==========
  const mainFeatures = [
    {
      title: 'Thành viên',
      description: 'Quản lý thông tin các thành viên trong gia phả',
      icon: <FiUsers className="w-8 h-8" />,
      color: 'from-orange-400 to-orange-600',
      shadowColor: 'rgba(251, 146, 60, 0.4)',
      path: '/thanhvien',
      count: '150+',
    },
    {
      title: 'Cây gia phả',
      description: 'Xem và quản lý cây gia phả trực quan',
      icon: <FiGitBranch className="w-8 h-8" />,
      color: 'from-emerald-400 to-emerald-600',
      shadowColor: 'rgba(52, 211, 153, 0.4)',
      path: '/giapha',
      count: '5',
    },
    {
      title: 'Báo cáo',
      description: 'Báo cáo và phân tích dữ liệu gia phả',
      icon: <FiPieChart className="w-8 h-8" />,
      color: 'from-violet-400 to-violet-600',
      shadowColor: 'rgba(167, 139, 250, 0.4)',
      path: '/baocao',
      count: '',
    },
  ];

  // ========== QUICK ACTIONS based on role ==========
  const getQuickActions = () => {
    const actions = [];

    // Admin & Owner: Tiếp nhận thành viên
    if (isAdmin || isOwner) {
      actions.push({ title: 'Quản lý danh mục', icon: <FiSettings />, path: '/danhmuc', color: 'text-gray-600' });
      actions.push({ title: 'Thêm thành viên', icon: <FiUserPlus />, path: '/thanhvien/create', color: 'text-orange-500' });
    }

    // Admin & Owner: Ghi nhận thành tích
    if (isAdmin || isOwner) {
      actions.push({ title: 'Ghi nhận thành tích', icon: <FiAward />, path: '/thanhtich', color: 'text-yellow-500' });
      actions.push({ title: 'Ghi nhận kết thúc', icon: <FiAlertCircle />, path: '/ketthuc', color: 'text-neutral-500' });
    }

    // All roles: Báo cáo
    actions.push({ title: 'Xuất báo cáo', icon: <FiBarChart2 />, path: '/baocao', color: 'text-blue-500' });

    // All roles: Tra cứu
    actions.push({ title: 'Tra cứu thành viên', icon: <FiBook />, path: '/thanhvien', color: 'text-indigo-500' });

    // All roles: Thu quỹ
    actions.push({ title: 'Thu quỹ họ', icon: <FiDollarSign />, path: '/phieuthu', color: 'text-emerald-500' });

    // Admin & Owner: Chi quỹ
    if (isAdmin || isOwner) {
      actions.push({ title: 'Chi quỹ họ', icon: <FiDollarSign />, path: '/phieuchi', color: 'text-red-500' });
    }

    return actions;
  };

  const quickActions = getQuickActions();

  return (
    <div className="min-h-screen">
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-200/30 to-transparent rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-violet-200/20 to-transparent rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Navigation */}
      <nav className="navbar px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl shadow-lg">
              🌳
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                Gia Phả
              </h1>
              <p className="text-xs text-neutral-500">Family Tree Manager</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Role Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/70 rounded-full border border-neutral-200">
              <span className="text-lg">{roleIcon}</span>
              <span className="text-sm font-medium text-neutral-600">{roleName}</span>
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full cursor-pointer hover:bg-white/80 transition-colors border-none"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow">
                {user?.TenDangNhap?.charAt(0)?.toUpperCase() || user?.HoTen?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="font-medium text-neutral-700">{user?.HoTen || user?.TenDangNhap}</span>
            </button>
            <button onClick={handleLogoutClick} className="btn btn-ghost btn-small group">
              <FiLogOut className="w-4 h-4 group-hover:text-red-500 transition-colors" />
              <span className="hidden md:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10 animate-fade-in">
          <h2 className="heading-display mb-2">
            Xin chào, {user?.HoTen || user?.TenDangNhap || 'Người dùng'}! 👋
          </h2>
          <p className="text-neutral-600 text-lg">
            Chào mừng bạn đến với hệ thống quản lý gia phả. Hãy khám phá và quản lý lịch sử gia đình của bạn.
          </p>
        </div>

        {/* ========== ADMIN SECTION ========== */}
        {isAdmin && (
          <div className="mb-8 animate-fade-in">
            <div
              onClick={() => navigate('/admin/taikhoan')}
              className="group relative overflow-hidden rounded-2xl cursor-pointer bg-gradient-to-br from-purple-500 to-indigo-600 p-6 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <FiShield className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                      👑 Quản trị hệ thống
                    </h3>
                    <p className="text-white/80">Phân quyền tài khoản, quản lý người dùng</p>
                  </div>
                </div>
                <div className="text-white flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                  Truy cập <FiChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Admin Password Requests */}
            <div className="mt-8">
              <AdminPasswordRequests />
            </div>
          </div>
        )}

        {/* ========== OWNER SECTION ========== */}
        {(isAdmin || isOwner) && (
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
              🏠 Quản lý Gia phả
              {isOwner && <span className="text-sm font-normal text-neutral-500">(Trưởng tộc)</span>}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/thanhvien/create')}
                className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border-l-4 border-orange-500"
              >
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                  <FiUserPlus className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-neutral-800">Tiếp nhận thành viên</h4>
                  <p className="text-sm text-neutral-500">Thêm thành viên mới vào gia phả</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/quanhe/honnhan')}
                className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border-l-4 border-pink-500"
              >
                <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600">
                  <FiHeart className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-neutral-800">Quan hệ hôn nhân</h4>
                  <p className="text-sm text-neutral-500">Quản lý quan hệ vợ chồng</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/quanhe/concai')}
                className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border-l-4 border-emerald-500"
              >
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-neutral-800">Quan hệ con cái</h4>
                  <p className="text-sm text-neutral-500">Quản lý quan hệ cha mẹ - con</p>
                </div>
              </button>
            </div>
          </div>
        )
        }

        {/* Main Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {mainFeatures.map((feature, index) => (
            <div
              key={feature.title}
              onClick={() => navigate(feature.path)}
              className="group relative overflow-hidden rounded-2xl cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
            >
              {/* Card Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-90 group-hover:opacity-100 transition-opacity`}></div>

              {/* Decorative Circles */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>

              {/* Content */}
              <div className="relative p-6 text-white h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    {feature.icon}
                  </div>
                  {feature.count && (
                    <span className="text-3xl font-bold opacity-80">{feature.count}</span>
                  )}
                </div>

                <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {feature.title}
                </h3>
                <p className="text-white/80 text-sm flex-grow">
                  {feature.description}
                </p>

                <div className="mt-4 flex items-center gap-2 text-sm font-medium group-hover:translate-x-2 transition-transform">
                  Xem thêm <FiChevronRight />
                </div>
              </div>

              {/* Hover Effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: `0 20px 40px ${feature.shadowColor}` }}
              ></div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6 mb-12 animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <h3 className="text-xl font-bold text-neutral-800 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            ⚡ Thao tác nhanh
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group"
              >
                <div className={`${action.color} text-xl group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <span className="font-medium text-neutral-700 text-sm">{action.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Permission Info for User */}
        {isUser && (
          <div className="glass-card p-6 mb-12 animate-fade-in border-l-4 border-blue-500" style={{ animationDelay: '0.35s' }}>
            <h3 className="text-lg font-bold text-neutral-800 mb-2">
              ℹ️ Quyền của bạn
            </h3>
            <p className="text-neutral-600">
              Bạn đang đăng nhập với quyền <strong>Thành viên</strong>. Bạn có thể:
            </p>
            <ul className="mt-2 text-neutral-600 list-disc list-inside">
              <li>Tra cứu thông tin thành viên</li>
              <li>Tra cứu thành tích, kết thúc</li>
              <li>Xem báo cáo năm</li>
              <li>Ghi nhận thu quỹ họ</li>
            </ul>
            <p className="mt-3 text-sm text-neutral-500">
              Liên hệ Trưởng tộc hoặc Quản trị viên để được cấp thêm quyền.
            </p>
          </div>
        )}

        {/* Features Grid */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.4s', opacity: 0 }}>
          <h3 className="text-xl font-bold text-neutral-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
            🌟 Tính năng nổi bật
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: '👥', title: 'Quản lý thành viên', desc: 'Thêm, sửa, xóa thông tin các thành viên trong gia phả một cách dễ dàng' },
              { icon: '❤️', title: 'Quan hệ gia đình', desc: 'Thiết lập và quản lý các mối quan hệ: vợ chồng, cha mẹ, con cái' },
              { icon: '🏆', title: 'Thành tích & Khen thưởng', desc: 'Ghi nhận các thành tích, đóng góp của thành viên' },
              { icon: '📊', title: 'Thống kê & Báo cáo', desc: 'Xuất báo cáo chi tiết về gia phả và thống kê thành viên' },
            ].map((item, index) => (
              <div
                key={item.title}
                className="flex gap-4 p-4 bg-white/50 rounded-xl hover:bg-white hover:shadow-md transition-all"
              >
                <div className="text-3xl">{item.icon}</div>
                <div>
                  <h4 className="font-bold text-neutral-800 mb-1">{item.title}</h4>
                  <p className="text-sm text-neutral-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-neutral-500 text-sm">
          <p>© 2025 Gia Phả Management System. Designed by Thanh An, Hoàng Phúc, Đại Thành, Triệu Trinh</p>
        </footer>
      </main>

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
