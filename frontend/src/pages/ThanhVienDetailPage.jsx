/**
 * ============================================
 * THÀNH VIÊN DETAIL PAGE
 * Trang xem chi tiết thành viên
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ThanhVienDetail from '../components/thanhvien/ThanhVienDetail.jsx';
import { useThanhVienStore } from '../store/thanhvienStore.js';
import { useLookupsStore } from '../store/lookupsStore.js';
import thanhvienService from '../services/thanhvien.js';
import ThanhTichList from '../components/thanhvien/ThanhTichList.jsx';
import KetThucSection from '../components/thanhvien/KetThucSection.jsx';
import { useNavigate } from 'react-router-dom';

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

  const handleDelete = async (MaTV) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
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
          <ThanhVienDetail
            thanhvien={thanhvien}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        ) : (
          <div className="alert alert-danger">
            <p>Không tìm thấy thành viên</p>
          </div>
        )}

        {/* DEBUG: Test if this renders */}
        <div className="bg-blue-100 p-4 mt-6 rounded border-2 border-blue-500">
          <h3 className="font-bold text-blue-800">🔍 DEBUG TEST</h3>
          <p>thanhvien exists: {thanhvien ? 'YES' : 'NO'}</p>
          <p>MaTV: {MaTV || 'null'}</p>
        </div>

        {/* Thành tích & Kết thúc Sections */}
        {thanhvien && (
          <>
            <div className="my-6 border-t border-gray-200"></div>

            <KetThucSection
              MaTV={MaTV}
              onStatusChange={() => {
                const loadThanhVien = async () => {
                  try {
                    const response = await thanhvienService.getDetail(MaTV);
                    const data = response.result || response;
                    setThanhVien(data);
                  } catch (err) {
                    console.error('Error reloading member:', err);
                  }
                };
                loadThanhVien();
              }}
            />

            <ThanhTichList MaTV={MaTV} />
          </>
        )}
      </div>
    </div>
  );
}
