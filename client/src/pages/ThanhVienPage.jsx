/**
 * ============================================
 * THÀNH VIÊN LIST PAGE
 * Trang chính để quản lý danh sách thành viên
 * ============================================
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import ThanhVienFilter from '../components/thanhvien/ThanhVienFilter.jsx';
import ThanhVienList from '../components/thanhvien/ThanhVienList.jsx';
import { useThanhVienStore } from '../store/thanhvienStore.js';
import { useLookupsStore } from '../store/lookupsStore.js';
import thanhvienService from '../services/thanhvien.js';

export default function ThanhVienPage() {
  const navigate = useNavigate();
  const {
    thanhvienList,
    selectedThanhVien,
    total,
    page,
    limit,
    setThanhVienList,
    setPagination,
    removeThanhVienFromList,
  } = useThanhVienStore();

  const { setAllLookups } = useLookupsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'HoTen',
    sortOrder: 'asc',
  });

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

  // Load thành viên list when filters or pagination changes
  useEffect(() => {
    loadThanhVien();
  }, [filters, page]);

  const loadThanhVien = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: page,
        limit: limit,
        ...filters,
      };
      const response = await thanhvienService.getList(params);
      const data = response.result || response;
      
      // Assuming API returns { items/result, total, page, limit }
      setThanhVienList(data.result || data.items || data);
      setPagination({
        total: data.total || 0,
        page: page,
        limit: limit,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi tải dữ liệu');
      console.error('Error loading thanhvien:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (newPage) => {
    setPagination({ total, page: newPage, limit });
  };

  const handleDelete = async (MaTV) => {
    try {
      setIsLoading(true);
      await thanhvienService.delete(MaTV);
      removeThanhVienFromList(MaTV);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi xóa thành viên');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Quản lý thành viên
              </h1>
              <p className="text-gray-600 mt-2">
                Tổng cộng: {total} thành viên
              </p>
            </div>
            <button
              onClick={() => navigate('/thanhvien/create')}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus />
              Thêm thành viên
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Filter */}
        <div className="mb-8">
          <ThanhVienFilter onFilter={handleFilter} isLoading={isLoading} />
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow">
          <ThanhVienList
            thanhvienList={thanhvienList}
            total={total}
            page={page}
            limit={limit}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
