/**
 * ============================================
 * THÀNH VIÊN FILTER COMPONENT
 * Tìm kiếm và filter thành viên
 * ============================================
 */

import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

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
    <div className="card mb-6">
      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2">
            <label className="form-label">Tìm kiếm</label>
            <div className="flex items-center">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, địa chỉ..."
                className="input-field"
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
              <option value="asc">Tăng dần (↑)</option>
              <option value="desc">Giảm dần (↓)</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            <FiSearch />
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <FiX />
            Xóa bộ lọc
          </button>
        </div>
      </form>
    </div>
  );
}
