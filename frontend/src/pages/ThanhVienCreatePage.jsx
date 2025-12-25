/**
 * ============================================
 * THÀNH VIÊN CREATE PAGE
 * Trang thêm mới thành viên
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThanhVienForm from '../components/thanhvien/ThanhVienForm.jsx';
import { useThanhVienStore } from '../store/thanhvienStore.js';
import { useLookupsStore } from '../store/lookupsStore.js';
import thanhvienService from '../services/thanhvien.js';

export default function ThanhVienCreatePage() {
  const navigate = useNavigate();
  const { addThanhVien } = useThanhVienStore();
  const { setAllLookups } = useLookupsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await thanhvienService.create(formData);
      const newThanhVien = response.result || response;

      // Add to store
      addThanhVien(newThanhVien);

      // Show success message and navigate
      alert('Thêm thành viên thành công!');
      navigate(`/thanhvien/${newThanhVien.MaTV}`);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Lỗi thêm thành viên mới';
      setError(errorMsg);
      console.error('Error creating thanhvien:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Thêm thành viên mới</h1>
          <p className="text-gray-600 mt-2">
            Điền các thông tin dưới đây để thêm thành viên mới vào gia phả
          </p>
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

        {/* Form */}
        <div className="card">
          <ThanhVienForm
            initialData={undefined}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/thanhvien')}
            disabled={isLoading}
            className="btn btn-ghost"
          >
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    </div>
  );
}
