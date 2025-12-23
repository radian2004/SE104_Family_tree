/**
 * ============================================
 * THÀNH VIÊN CARD COMPONENT - Premium Design
 * Hiển thị thông tin 1 thành viên
 * ============================================
 */

import { useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import { formatDate } from '../../utils/helpers';

export default function ThanhVienCard({ thanhvien, onDelete }) {
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (window.confirm(`Bạn chắc chắn muốn xóa ${thanhvien.HoTen}?`)) {
      await onDelete(thanhvien.MaTV);
    }
  };

  // Check actual status from database - normalize to lowercase
  const statusText = (thanhvien.TrangThai || '').toLowerCase();
  const isDeceased = statusText.includes('mất') || statusText.includes('mat');

  return (
    <tr className="hover:bg-neutral-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-medium text-neutral-800">{thanhvien.HoTen}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
        {formatDate(thanhvien.NgayGioSinh)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 max-w-xs truncate">
        {thanhvien.DiaChi}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isDeceased ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
            Đã mất
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
            Còn sống
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex gap-2">
          {/* View Button - BLUE */}
          <button
            onClick={() => navigate(`/thanhvien/${thanhvien.MaTV}`)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm"
            title="Xem chi tiết"
          >
            <FiEye className="w-4 h-4" />
          </button>

          {/* Edit Button - ORANGE */}
          <button
            onClick={() => navigate(`/thanhvien/${thanhvien.MaTV}/edit`)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm"
            title="Chỉnh sửa"
          >
            <FiEdit className="w-4 h-4" />
          </button>

          {/* Delete Button - RED */}
          <button
            onClick={handleDelete}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
            title="Xóa"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
