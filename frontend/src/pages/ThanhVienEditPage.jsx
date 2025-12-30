/**
 * ============================================
 * THÀNH VIÊN EDIT PAGE - Premium Design
 * Trang chỉnh sửa thông tin thành viên
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiSave, FiUser } from 'react-icons/fi';
import ThanhVienForm from '../components/thanhvien/ThanhVienForm.jsx';
import { useThanhVienStore } from '../store/thanhvienStore.js';
import { useLookupsStore } from '../store/lookupsStore.js';
import thanhvienService from '../services/thanhvien.js';

export default function ThanhVienEditPage() {
  const navigate = useNavigate();
  const { MaTV } = useParams();
  const { updateThanhVienInList } = useThanhVienStore();
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
        const errorMsg =
          err.response?.data?.message || 'Lỗi tải thông tin thành viên';
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

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await thanhvienService.update(MaTV, formData);
      const updatedThanhVien = response.result || response;

      // Update store
      updateThanhVienInList(MaTV, updatedThanhVien);

      // Show success message and navigate
      alert('Cập nhật thành viên thành công!');
      navigate(`/thanhvien/${MaTV}`);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Lỗi cập nhật thành viên';
      setError(errorMsg);
      console.error('Error updating thanhvien:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-200/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="navbar px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link
            to={`/thanhvien/${MaTV}`}
            className="flex items-center gap-2 text-neutral-600 hover:text-orange-600 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Quay lại chi tiết</span>
          </Link>

          {thanhvien && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg">
                <FiEdit2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Chỉnh sửa
                </h1>
                <p className="text-xs text-neutral-500">{thanhvien.HoTen}</p>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h2 className="heading-display mb-2">Chỉnh sửa thành viên</h2>
          {thanhvien && (
            <p className="text-neutral-600">
              Cập nhật thông tin của <span className="font-semibold text-orange-600">{thanhvien.HoTen}</span>
            </p>
          )}
        </div>

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
          <>
            {/* Form Card */}
            <div className="glass-card overflow-hidden animate-fade-in">
              {/* Gradient Header */}
              <div className="h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500"></div>

              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${thanhvien.GioiTinh === 'Nữ'
                      ? 'bg-gradient-to-br from-pink-100 to-pink-200'
                      : 'bg-gradient-to-br from-blue-100 to-blue-200'
                    }`}>
                    {thanhvien.GioiTinh === 'Nữ' ? '👩' : '👨'}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-800">{thanhvien.HoTen}</h3>
                    <p className="text-sm text-neutral-500">{thanhvien.MaTV}</p>
                  </div>
                </div>

                <ThanhVienForm
                  initialData={thanhvien}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Back Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate(`/thanhvien/${MaTV}`)}
                disabled={isLoading}
                className="btn btn-ghost"
              >
                <FiArrowLeft className="w-4 h-4" />
                Hủy và quay lại
              </button>
            </div>
          </>
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
