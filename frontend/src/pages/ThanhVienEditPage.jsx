/**
 * ============================================
 * THÀNH VIÊN EDIT PAGE
 * Trang chỉnh sửa thông tin thành viên
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Chỉnh sửa thành viên
          </h1>
          {thanhvien && (
            <p className="text-gray-600 mt-2">
              Chỉnh sửa thông tin của {thanhvien.HoTen}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoadingData ? (
          <div className="card text-center py-12">
            <div className="spinner"></div>
            <p className="text-gray-600 mt-4">Đang tải thông tin...</p>
          </div>
        ) : thanhvien ? (
          <>
            {/* Form */}
            <div className="card">
              <ThanhVienForm
                initialData={thanhvien}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </div>

            {/* Back Button */}
            <div className="mt-6">
              <button
                onClick={() => navigate(`/thanhvien/${MaTV}`)}
                disabled={isLoading}
                className="btn btn-ghost"
              >
                ← Quay lại
              </button>
            </div>
          </>
        ) : (
          <div className="alert alert-danger">
            <p>Không tìm thấy thành viên</p>
          </div>
        )}
      </div>
    </div>
  );
}
