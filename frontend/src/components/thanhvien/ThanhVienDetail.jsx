/**
 * ============================================
 * THÀNH VIÊN DETAIL CARD COMPONENT
 * Hiển thị chi tiết thông tin thành viên
 * ============================================
 */

import { useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { formatDate } from '../../utils/helpers';
import { useLookupsStore } from '../../store/lookupsStore.js';

export default function ThanhVienDetailCard({ thanhvien, onDelete, isLoading }) {
  const navigate = useNavigate();
  const { gioiTinh, queQuan, ngheNghiep, cayGiaPha } = useLookupsStore();

  // Helper function để lấy tên từ lookup tables
  const getName = (id, type) => {
    let list = [];
    switch (type) {
      case 'gioitinh':
        list = gioiTinh;
        return list.find((item) => item.MaGioiTinh === id)?.TenGioiTinh || id;
      case 'quequan':
        list = queQuan;
        return list.find((item) => item.MaQueQuan === id)?.TenQueQuan || id;
      case 'nghenghiep':
        list = ngheNghiep;
        return list.find((item) => item.MaNgheNghiep === id)?.TenNgheNghiep ||
          id;
      case 'giaphat':
        list = cayGiaPha;
        return list.find((item) => item.MaGiaPha === id)?.TenGiaPha || id;
      default:
        return id;
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Bạn chắc chắn muốn xóa ${thanhvien.HoTen}?`)) {
      await onDelete(thanhvien.MaTV);
    }
  };

  // Check if member is deceased - normalize to lowercase
  const statusText = (thanhvien.TrangThai || '').toLowerCase();
  const isDeceased = statusText.includes('mất') || statusText.includes('mat');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/thanhvien')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            <FiArrowLeft />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{thanhvien.HoTen}</h1>
          <p className="text-gray-600">Mã thành viên: {thanhvien.MaTV}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/thanhvien/${thanhvien.MaTV}/edit`)}
            disabled={isLoading}
            className="btn btn-ghost"
          >
            <FiEdit />
            Chỉnh sửa
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="btn-danger flex items-center gap-2"
          >
            <FiTrash2 />
            Xóa
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Thông tin cơ bản
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 font-medium">Họ tên</p>
              <p className="text-lg text-gray-900">{thanhvien.HoTen}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-medium">Ngày sinh</p>
              <p className="text-lg text-gray-900">
                {formatDate(thanhvien.NgayGioSinh)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-medium">Giới tính</p>
              <p className="text-lg text-gray-900">
                {getName(thanhvien.MaGioiTinh, 'gioitinh')}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-medium">Quê quán</p>
              <p className="text-lg text-gray-900">
                {getName(thanhvien.MaQueQuan, 'quequan')}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 font-medium">Địa chỉ</p>
              <p className="text-lg text-gray-900">{thanhvien.DiaChi}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-medium">Nghề nghiệp</p>
              <p className="text-lg text-gray-900">
                {getName(thanhvien.MaNgheNghiep, 'nghenghiep')}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-medium">Gia phả</p>
              <p className="text-lg text-gray-900">
                {getName(thanhvien.MaGiaPha, 'giaphat')}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-medium">Trạng thái</p>
              <p>
                {isDeceased ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                    Đã mất
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Còn sống
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Card */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Thông tin khác
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 font-medium">Đời</p>
            <p className="text-lg text-gray-900">{thanhvien.DOI || '-'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 font-medium">Ngày tạo</p>
            <p className="text-lg text-gray-900">
              {formatDate(thanhvien.TGTaoMoi)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 font-medium">Mã thành viên</p>
            <p className="text-lg text-gray-900 font-mono">{thanhvien.MaTV}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
