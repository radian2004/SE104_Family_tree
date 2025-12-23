/**
 * ============================================
 * THÀNH VIÊN LIST PAGE - Premium Design
 * ============================================
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiPlus, FiUsers, FiArrowLeft, FiGrid, FiList, FiFilter } from 'react-icons/fi';
import ThanhVienFilter from '../components/thanhvien/ThanhVienFilter.jsx';
import ThanhVienList from '../components/thanhvien/ThanhVienList.jsx';
import { useThanhVienStore } from '../store/thanhvienStore.js';
import { useLookupsStore } from '../store/lookupsStore.js';
import thanhvienService from '../services/thanhvien.js';
import thanhTichService from '../services/thanhtich.js';

export default function ThanhVienPage() {
  const navigate = useNavigate();
  const {
    thanhvienList,
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
  const [viewMode, setViewMode] = useState('list');
  const [showFilter, setShowFilter] = useState(true);
  const [achievementCount, setAchievementCount] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'HoTen',
    sortOrder: 'asc',
  });

  // Calculate stats from thanhvienList
  const stats = useMemo(() => {
    if (!thanhvienList || thanhvienList.length === 0) {
      return { alive: 0, deceased: 0, withAchievements: 0 };
    }
    // Count deceased - normalize to lowercase for comparison
    const deceased = thanhvienList.filter(tv => {
      const status = (tv.TrangThai || '').toLowerCase();
      return status.includes('đã mất') || status.includes('mất') || status.includes('mat');
    }).length;
    // Alive is everyone who is NOT deceased
    const alive = thanhvienList.length - deceased;
    return { alive, deceased, withAchievements: 0 };
  }, [thanhvienList]);

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

  // Load achievement stats on mount
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const response = await thanhTichService.traCuu({});
        const achievements = response.result || response || [];
        // Count unique members with achievements
        const uniqueMembers = new Set(achievements.map(a => a.MaTV || a.HoTen));
        setAchievementCount(uniqueMembers.size);
      } catch (err) {
        console.error('Error loading achievements:', err);
      }
    };
    loadAchievements();
  }, []);

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
    <div className="min-h-screen">
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-200/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-200/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="navbar px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-neutral-600 hover:text-orange-600 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-neutral-200"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg">
                <FiUsers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Thành viên
                </h1>
                <p className="text-xs text-neutral-500">{total || thanhvienList?.length || 0} thành viên</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/thanhvien/create')}
            className="btn btn-primary group"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden md:inline">Thêm thành viên</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h2 className="heading-display mb-2">Quản lý thành viên</h2>
          <p className="text-neutral-600">
            Xem, thêm, sửa và xóa thông tin các thành viên trong gia phả
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="glass-card p-4 text-center hover:scale-105 transition-transform">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-2xl font-bold text-neutral-800">{total || thanhvienList?.length || 0}</div>
            <div className="text-xs text-neutral-500">Tổng thành viên</div>
          </div>
          <div className="glass-card p-4 text-center hover:scale-105 transition-transform border-l-4 border-emerald-500">
            <div className="text-2xl mb-2">💚</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.alive}</div>
            <div className="text-xs text-neutral-500">Còn sống</div>
          </div>
          <div className="glass-card p-4 text-center hover:scale-105 transition-transform">
            <div className="text-2xl mb-2">🕯️</div>
            <div className="text-2xl font-bold text-neutral-600">{stats.deceased}</div>
            <div className="text-xs text-neutral-500">Đã mất</div>
          </div>
          <div className="glass-card p-4 text-center hover:scale-105 transition-transform">
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-yellow-600">{achievementCount || 0}</div>
            <div className="text-xs text-neutral-500">Có thành tích</div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger mb-6 animate-fade-in">
            <span className="text-lg">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`btn btn-ghost btn-small ${showFilter ? 'bg-orange-100 text-orange-600' : ''}`}
            >
              <FiFilter className="w-4 h-4" />
              Bộ lọc
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              <FiList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Section */}
        {showFilter && (
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <ThanhVienFilter onFilter={handleFilter} isLoading={isLoading} />
          </div>
        )}

        {/* List Section */}
        <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <ThanhVienList
            thanhvienList={thanhvienList}
            total={total}
            page={page}
            limit={limit}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            onDelete={handleDelete}
            viewMode={viewMode}
          />
        </div>
      </main>
    </div>
  );
}
