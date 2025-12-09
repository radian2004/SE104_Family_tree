/**
 * ============================================
 * THÀNH VIÊN CARD COMPONENT
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

  const statusBadge =
    thanhvien.TrangThai === 'Sống' ? 'badge-success' : 'badge-danger';

  return (
    <tr className="table-row-hover">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-medium text-gray-900">{thanhvien.HoTen}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {formatDate(thanhvien.NgayGioSinh)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate-1">
        {thanhvien.DiaChi}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`badge ${statusBadge}`}>
          {thanhvien.TrangThai}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex gap-2">
          {/* View Button */}
          <button
            onClick={() => navigate(`/thanhvien/${thanhvien.MaTV}`)}
            className="btn-primary btn-small"
            title="Xem chi tiết"
          >
            <FiEye />
          </button>

          {/* Edit Button */}
          <button
            onClick={() => navigate(`/thanhvien/${thanhvien.MaTV}/edit`)}
            className="btn-secondary btn-small"
            title="Chỉnh sửa"
          >
            <FiEdit />
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="btn-danger btn-small"
            title="Xóa"
          >
            <FiTrash2 />
          </button>
        </div>
      </td>
    </tr>
  );
}
