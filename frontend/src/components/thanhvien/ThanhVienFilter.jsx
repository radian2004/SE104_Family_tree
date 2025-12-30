/**
 * ============================================
 * THÀNH VIÊN FILTER COMPONENT - Premium Design
 * With extended filters: Gender, Status, GiaPha (Admin)
 * FIXED: GiaPha selector on its own row to prevent overlap
 * ============================================
 */

import { useState } from 'react';
import { FiSearch, FiX, FiRefreshCw, FiFilter } from 'react-icons/fi';
import GiaPhaSelector from '../common/GiaPhaSelector';
import { usePermissions } from '../../hooks/usePermissions';

export default function ThanhVienFilter({ onFilter, isLoading }) {
  const { isAdmin } = usePermissions();
  const [search, setSearch] = useState('');
  const [gioiTinh, setGioiTinh] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [MaGiaPha, setMaGiaPha] = useState('');
  const [sortBy, setSortBy] = useState('HoTen');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSearch = (e) => {
    e.preventDefault();
    onFilter({
      search,
      gioiTinh,
      trangThai,
      MaGiaPha,
      sortBy,
      sortOrder,
      page: 1,
    });
  };

  const handleClear = () => {
    setSearch('');
    setGioiTinh('');
    setTrangThai('');
    setMaGiaPha('');
    setSortBy('HoTen');
    setSortOrder('asc');
    onFilter({
      search: '',
      gioiTinh: '',
      trangThai: '',
      MaGiaPha: '',
      sortBy: 'HoTen',
      sortOrder: 'asc',
      page: 1,
    });
  };

  return (
    <form onSubmit={handleSearch}>
      {/* Row 1: GiaPha selector (Admin only) - Full width on its own row */}
      {isAdmin && (
        <div className="mb-4">
          <div className="max-w-sm">
            <GiaPhaSelector value={MaGiaPha} onChange={setMaGiaPha} />
          </div>
        </div>
      )}

      {/* Row 2: Search + Gender + Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Search Input */}
        <div className="lg:col-span-2">
          <label className="form-label flex items-center gap-2">
            <FiSearch className="w-4 h-4 text-neutral-400" />
            Tìm kiếm
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
              <FiSearch className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo họ tên, địa chỉ, mã thành viên..."
              className="input-field pl-12"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Gender Filter */}
        <div>
          <label className="form-label">Giới tính</label>
          <select
            value={gioiTinh}
            onChange={(e) => setGioiTinh(e.target.value)}
            className="select-field"
            disabled={isLoading}
          >
            <option value="">Tất cả</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="form-label">Trạng thái</label>
          <select
            value={trangThai}
            onChange={(e) => setTrangThai(e.target.value)}
            className="select-field"
            disabled={isLoading}
          >
            <option value="">Tất cả</option>
            <option value="Còn sống">Còn sống</option>
            <option value="Đã mất">Đã mất</option>
          </select>
        </div>
      </div>

      {/* Row 3: Sort options + Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Sort By */}
        <div>
          <label className="form-label">Sắp xếp theo</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select-field"
            disabled={isLoading}
          >
            <option value="HoTen">Họ tên</option>
            <option value="TGTaoMoi">Ngày tạo</option>
            <option value="NgayGioSinh">Ngày sinh</option>
            <option value="DOI">Thế hệ (Đời)</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="form-label">Thứ tự</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="select-field"
            disabled={isLoading}
          >
            <option value="asc">Tăng dần (A→Z)</option>
            <option value="desc">Giảm dần (Z→A)</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="md:col-span-2 flex items-end gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary flex-1 md:flex-none"
          >
            {isLoading ? (
              <>
                <FiRefreshCw className="w-4 h-4 animate-spin" />
                Đang tìm...
              </>
            ) : (
              <>
                <FiFilter className="w-4 h-4" />
                Áp dụng
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="btn btn-ghost"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
}
