/**
 * ============================================
 * THÀNH VIÊN LIST COMPONENT
 * Hiển thị danh sách thành viên với pagination
 * ============================================
 */

import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import ThanhVienCard from './ThanhVienCard.jsx';

export default function ThanhVienList({
  thanhvienList,
  total,
  page,
  limit,
  isLoading,
  onPageChange,
  onDelete,
}) {
  const navigate = useNavigate();
  const totalPages = Math.ceil(total / limit);

  if (isLoading && thanhvienList.length === 0) {
    return (
      <div className="card flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (thanhvienList.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600 mb-4">Không có thành viên nào</p>
        <button
          onClick={() => navigate('/thanhvien/create')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <FiPlus />
          Thêm thành viên mới
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="table-wrapper card">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Họ tên
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Ngày sinh
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Địa chỉ
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Trạng thái
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {thanhvienList.map((item) => (
              <ThanhVienCard
                key={item.MaTV}
                thanhvien={item}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Trang {page} / {totalPages} (Tổng: {total} thành viên)
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1 || isLoading}
              className="btn btn-ghost btn-small"
            >
              ← Trước
            </button>

            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    disabled={isLoading}
                    className={`px-3 py-1 rounded ${pageNum === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages || isLoading}
              className="btn btn-ghost btn-small"
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
