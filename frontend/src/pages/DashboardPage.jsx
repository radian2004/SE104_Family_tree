/**
 * ============================================
 * DASHBOARD PAGE - Premium Family Tree Design
 * ============================================
 */

import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiGitBranch, FiPieChart, FiAward, FiHeart, FiBarChart2, FiLogOut, FiChevronRight } from 'react-icons/fi';

export default function DashboardPage() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    await handleLogout();
  };

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

  const quickActions = [
    { title: 'Thêm thành viên', icon: <FiUsers />, path: '/thanhvien/create', color: 'text-orange-500' },
    { title: 'Ghi nhận thành tích', icon: <FiAward />, path: '/thanhvien', color: 'text-yellow-500' },
    { title: 'Tạo quan hệ hôn nhân', icon: <FiHeart />, path: '/quanhe/honnhan', color: 'text-pink-500' },
    { title: 'Tạo quan hệ con cái', icon: <FiUsers />, path: '/quanhe/concai', color: 'text-emerald-500' },
    { title: 'Xuất báo cáo', icon: <FiBarChart2 />, path: '/baocao', color: 'text-blue-500' },
  ];

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
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow">
                {user?.TenDangNhap?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="font-medium text-neutral-700">{user?.TenDangNhap}</span>
            </div>
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
            Xin chào, {user?.TenDangNhap || 'Người dùng'}! 👋
          </h2>
          <p className="text-neutral-600 text-lg">
            Chào mừng bạn đến với hệ thống quản lý gia phả. Hãy khám phá và quản lý lịch sử gia đình của bạn.
          </p>
        </div>

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
          <p>© 2025 Gia Phả Management System. Designed by SE104 team</p>
        </footer>
      </main>
    </div>
  );
}
