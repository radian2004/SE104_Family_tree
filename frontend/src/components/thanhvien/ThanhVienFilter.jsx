/**
 * ============================================
 * THÀNH VIÊN FILTER COMPONENT - Premium Design
 * ============================================
 */

import { useState } from 'react';
import { FiSearch, FiX, FiRefreshCw } from 'react-icons/fi';

export default function ThanhVienFilter({ onFilter, isLoading }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('HoTen');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSearch = (e) => {
    e.preventDefault();
    onFilter({
      search,
      sortBy,
      sortOrder,
      page: 1,
    });
  };

  const handleClear = () => {
    setSearch('');
    setSortBy('HoTen');
    setSortOrder('asc');
    onFilter({
      search: '',
      sortBy: 'HoTen',
      sortOrder: 'asc',
      page: 1,
    });
  };

  return (
    <form onSubmit={handleSearch}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2">
          <label className="form-label">Tìm kiếm</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
              <FiSearch className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, địa chỉ..."
              className="input-field pl-12"
              disabled={isLoading}
            />
          </div>
        </div>

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
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-5">
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? (
            <>
              <FiRefreshCw className="w-4 h-4 animate-spin" />
              Đang tìm...
            </>
          ) : (
            <>
              <FiSearch className="w-4 h-4" />
              Tìm kiếm
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
          Xóa bộ lọc
        </button>
      </div>
    </form>
  );
}
