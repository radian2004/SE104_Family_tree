/**
 * ============================================
 * THÀNH VIÊN DETAIL PAGE - Premium Design
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiTrash2, FiUser, FiMapPin, FiBriefcase, FiCalendar, FiHeart } from 'react-icons/fi';
import ThanhVienDetail from '../components/thanhvien/ThanhVienDetail.jsx';
import { useThanhVienStore } from '../store/thanhvienStore.js';
import { useLookupsStore } from '../store/lookupsStore.js';
import thanhvienService from '../services/thanhvien.js';
import ThanhTichList from '../components/thanhvien/ThanhTichList.jsx';
import KetThucSection from '../components/thanhvien/KetThucSection.jsx';

export default function ThanhVienDetailPage() {
  const navigate = useNavigate();
  const { MaTV } = useParams();
  const { removeThanhVienFromList } = useThanhVienStore();
  const { setAllLookups } = useLookupsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [thanhvien, setThanhVien] = useState(null);

  // Load lookups data on mount
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const lookupsData = await thanhvienService.getLookups();
        setAllLookups(lookupsData);
      } catch (err) {
        console.error('Error loading lookups:', err);
      }
    };
    loadLookups();
  }, [setAllLookups]);

  // Load thành viên detail
  useEffect(() => {
    const loadThanhVien = async () => {
      setIsLoadingData(true);
      setError(null);
      try {
        const response = await thanhvienService.getDetail(MaTV);
        const data = response.result || response;
        setThanhVien(data);
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Lỗi tải thông tin thành viên';
        setError(errorMsg);
        console.error('Error loading thanhvien detail:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (MaTV) {
      loadThanhVien();
    }
  }, [MaTV]);

  const handleDelete = async (MaTV) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) return;

    try {
      setIsLoading(true);
      await thanhvienService.delete(MaTV);
      removeThanhVienFromList(MaTV);
      alert('Xóa thành viên thành công!');
      navigate('/thanhvien');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi xóa thành viên');
    } finally {
      setIsLoading(false);
    }
  };

  const reloadThanhVien = async () => {
    try {
      const response = await thanhvienService.getDetail(MaTV);
      const data = response.result || response;
      setThanhVien(data);
    } catch (err) {
      console.error('Error reloading member:', err);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-200/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-200/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-violet-200/10 to-transparent rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Navigation */}
      <nav className="navbar px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link
            to="/thanhvien"
            className="flex items-center gap-2 text-neutral-600 hover:text-orange-600 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Quay lại danh sách</span>
          </Link>

          {thanhvien && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/thanhvien/${MaTV}/edit`)}
                className="btn btn-ghost btn-small"
              >
                <FiEdit2 className="w-4 h-4" />
                <span className="hidden md:inline">Chỉnh sửa</span>
              </button>
              <button
                onClick={() => handleDelete(MaTV)}
                disabled={isLoading}
                className="btn btn-danger btn-small"
              >
                <FiTrash2 className="w-4 h-4" />
                <span className="hidden md:inline">Xóa</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger mb-6 animate-fade-in">
            <span className="text-lg">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoadingData ? (
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="spinner spinner-large mx-auto mb-4"></div>
            <p className="text-neutral-500">Đang tải thông tin thành viên...</p>
          </div>
        ) : thanhvien ? (
          <div className="animate-fade-in">
            {/* Profile Header Card */}
            <div className="glass-card overflow-hidden mb-6">
              {/* Gradient Banner */}
              <div className="h-32 bg-gradient-to-r from-orange-400 via-orange-500 to-emerald-500 relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -bottom-2 left-0 right-0 h-8 bg-gradient-to-t from-white/50 to-transparent"></div>
              </div>

              {/* Profile Info */}
              <div className="px-6 pb-6 -mt-16 relative">
                {/* Avatar */}
                <div className={`w-32 h-32 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center text-5xl mb-4 ${thanhvien.GioiTinh === 'Nữ'
                    ? 'bg-gradient-to-br from-pink-100 to-pink-200'
                    : 'bg-gradient-to-br from-blue-100 to-blue-200'
                  }`}>
                  {thanhvien.GioiTinh === 'Nữ' ? '👩' : '👨'}
                </div>

                {/* Name & Info */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-neutral-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {thanhvien.HoTen}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                      <span className={`badge ${thanhvien.TrangThai === 'Còn sống' ? 'badge-success' : 'badge-neutral'}`}>
                        {thanhvien.TrangThai || 'Còn sống'}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiUser className="w-4 h-4" />
                        {thanhvien.GioiTinh}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" />
                        {thanhvien.NgayGioSinh
                          ? new Date(thanhvien.NgayGioSinh).toLocaleDateString('vi-VN')
                          : 'Chưa có'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/thanhvien/${MaTV}/edit`)}
                      className="btn btn-outline btn-small"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      Chỉnh sửa
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Address Card */}
              <div className="glass-card p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <FiMapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Địa chỉ</h3>
                    <p className="text-neutral-800 font-medium">{thanhvien.DiaChi || 'Chưa cập nhật'}</p>
                    <p className="text-sm text-neutral-500 mt-1">
                      Quê quán: {thanhvien.TenQueQuan || thanhvien.MaQueQuan || 'Chưa có'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Occupation Card */}
              <div className="glass-card p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <FiBriefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Nghề nghiệp</h3>
                    <p className="text-neutral-800 font-medium">
                      {thanhvien.TenNgheNghiep || thanhvien.MaNgheNghiep || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Family Card */}
              <div className="glass-card p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                    <FiHeart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Gia phả</h3>
                    <p className="text-neutral-800 font-medium">
                      {thanhvien.TenGiaPha || thanhvien.MaGiaPha || 'Chưa thuộc gia phả nào'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ID Card */}
              <div className="glass-card p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                    <span className="text-xl font-bold">#</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-1">Mã thành viên</h3>
                    <p className="text-neutral-800 font-mono font-medium">{thanhvien.MaTV}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>
              <span className="text-neutral-400 text-sm">Chi tiết bổ sung</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>
            </div>

            {/* Kết thúc Section */}
            <KetThucSection
              MaTV={MaTV}
              onStatusChange={reloadThanhVien}
            />

            {/* Thành tích Section */}
            <ThanhTichList MaTV={MaTV} />
          </div>
        ) : (
          <div className="glass-card p-12 text-center animate-fade-in">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-xl font-bold text-neutral-800 mb-2">Không tìm thấy thành viên</h2>
            <p className="text-neutral-500 mb-6">Thành viên này có thể đã bị xóa hoặc không tồn tại.</p>
            <button onClick={() => navigate('/thanhvien')} className="btn btn-primary">
              <FiArrowLeft className="w-4 h-4" />
              Quay lại danh sách
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
