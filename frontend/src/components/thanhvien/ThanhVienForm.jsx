/**
 * ============================================
 * THÀNH VIÊN FORM COMPONENT
 * Form tạo/sửa thành viên
 * ============================================
 */

import { useState, useEffect } from 'react';
import { validateData, createThanhVienSchema } from '../../utils/validators';
import { useLookupsStore } from '../../store/lookupsStore.js';
import { formatDateForInput } from '../../utils/helpers';

export default function ThanhVienForm({ initialData, onSubmit, isLoading }) {
  const { gioiTinh, queQuan, ngheNghiep, cayGiaPha } = useLookupsStore();
  const [formData, setFormData] = useState({
    HoTen: '',
    NgayGioSinh: '',
    DiaChi: '',
    GioiTinh: '',
    MaQueQuan: '',
    MaNgheNghiep: '',
    MaGiaPha: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Populate form khi có initialData (edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        HoTen: initialData.HoTen || '',
        NgayGioSinh: formatDateForInput(initialData.NgayGioSinh) || '',
        DiaChi: initialData.DiaChi || '',
        GioiTinh: initialData.GioiTinh || '',
        MaQueQuan: initialData.MaQueQuan || '',
        MaNgheNghiep: initialData.MaNgheNghiep || '',
        MaGiaPha: initialData.MaGiaPha || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validate
    const validation = await validateData(createThanhVienSchema, formData);
    if (!validation.success) {
      setFormErrors(validation.errors);
      return;
    }

    // Call parent submit handler
    await onSubmit(validation.data);
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {initialData ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Họ tên */}
        <div className="form-group">
          <label className="form-label">Họ tên *</label>
          <input
            type="text"
            name="HoTen"
            value={formData.HoTen}
            onChange={handleChange}
            placeholder="Nhập họ tên"
            className={`input-field ${formErrors.HoTen ? 'input-field-error' : ''}`}
            disabled={isLoading}
          />
          {formErrors.HoTen && (
            <p className="form-error">{formErrors.HoTen}</p>
          )}
        </div>

        {/* Ngày sinh */}
        <div className="form-group">
          <label className="form-label">Ngày sinh *</label>
          <input
            type="date"
            name="NgayGioSinh"
            value={formData.NgayGioSinh}
            onChange={handleChange}
            className={`input-field ${formErrors.NgayGioSinh ? 'input-field-error' : ''}`}
            disabled={isLoading}
          />
          {formErrors.NgayGioSinh && (
            <p className="form-error">{formErrors.NgayGioSinh}</p>
          )}
        </div>

        {/* Địa chỉ */}
        <div className="form-group">
          <label className="form-label">Địa chỉ *</label>
          <input
            type="text"
            name="DiaChi"
            value={formData.DiaChi}
            onChange={handleChange}
            placeholder="Nhập địa chỉ"
            className={`input-field ${formErrors.DiaChi ? 'input-field-error' : ''}`}
            disabled={isLoading}
          />
          {formErrors.DiaChi && (
            <p className="form-error">{formErrors.DiaChi}</p>
          )}
        </div>

        {/* Giới tính */}
        <div className="form-group">
          <label className="form-label">Giới tính *</label>
          <select
            name="GioiTinh"
            value={formData.GioiTinh}
            onChange={handleChange}
            className={`select-field ${formErrors.GioiTinh ? 'input-field-error' : ''}`}
            disabled={isLoading}
          >
            <option value="">-- Chọn giới tính --</option>
            {gioiTinh.map((item) => (
              <option key={item.MaGioiTinh} value={item.MaGioiTinh}>
                {item.TenGioiTinh}
              </option>
            ))}
          </select>
          {formErrors.GioiTinh && (
            <p className="form-error">{formErrors.GioiTinh}</p>
          )}
        </div>

        {/* Quê quán */}
        <div className="form-group">
          <label className="form-label">Quê quán *</label>
          <select
            name="MaQueQuan"
            value={formData.MaQueQuan}
            onChange={handleChange}
            className={`select-field ${formErrors.MaQueQuan ? 'input-field-error' : ''}`}
            disabled={isLoading}
          >
            <option value="">-- Chọn quê quán --</option>
            {queQuan.map((item) => (
              <option key={item.MaQueQuan} value={item.MaQueQuan}>
                {item.TenQueQuan}
              </option>
            ))}
          </select>
          {formErrors.MaQueQuan && (
            <p className="form-error">{formErrors.MaQueQuan}</p>
          )}
        </div>

        {/* Nghề nghiệp */}
        <div className="form-group">
          <label className="form-label">Nghề nghiệp *</label>
          <select
            name="MaNgheNghiep"
            value={formData.MaNgheNghiep}
            onChange={handleChange}
            className={`select-field ${formErrors.MaNgheNghiep ? 'input-field-error' : ''}`}
            disabled={isLoading}
          >
            <option value="">-- Chọn nghề nghiệp --</option>
            {ngheNghiep.map((item) => (
              <option key={item.MaNgheNghiep} value={item.MaNgheNghiep}>
                {item.TenNgheNghiep}
              </option>
            ))}
          </select>
          {formErrors.MaNgheNghiep && (
            <p className="form-error">{formErrors.MaNgheNghiep}</p>
          )}
        </div>

        {/* Gia phả */}
        <div className="form-group">
          <label className="form-label">Gia phả *</label>
          <select
            name="MaGiaPha"
            value={formData.MaGiaPha}
            onChange={handleChange}
            className={`select-field ${formErrors.MaGiaPha ? 'input-field-error' : ''}`}
            disabled={isLoading}
          >
            <option value="">-- Chọn gia phả --</option>
            {cayGiaPha.map((item) => (
              <option key={item.MaGiaPha} value={item.MaGiaPha}>
                {item.TenGiaPha}
              </option>
            ))}
          </select>
          {formErrors.MaGiaPha && (
            <p className="form-error">{formErrors.MaGiaPha}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Đang lưu...
              </>
            ) : (
              'Lưu thành viên'
            )}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn btn-ghost"
          >
            Quay lại
          </button>
        </div>
      </form>
    </div>
  );
}
