/**
 * ============================================
 * REGISTER PAGE - Premium Family Tree Design
 * Hỗ trợ 2 mode:
 * 1. Gia nhập gia phả có sẵn (exist = true)
 * 2. Tạo gia phả mới làm Trưởng tộc (exist = false)
 * ============================================
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiUsers, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiPlus, FiCheck, FiInfo, FiUser, FiHome, FiEdit3 } from 'react-icons/fi';
import apiClient from '../api/client';

export default function RegisterPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Mode: 'join' = gia nhập có sẵn, 'create' = tạo mới
  const [mode, setMode] = useState('join');

  // Dropdown data
  const [genealogies, setGenealogies] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loadingGenealogies, setLoadingGenealogies] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    // Common fields
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    // Join mode
    selectedGiaPha: '',
    selectedMaTV: '',
    // Create mode
    newGiaPhaName: '',
  });

  const [selectedMember, setSelectedMember] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Load danh sách gia phả khi mount
  useEffect(() => {
    loadGenealogies();
  }, []);

  // Load members khi chọn gia phả (join mode)
  useEffect(() => {
    if (mode === 'join' && formData.selectedGiaPha) {
      loadMembers(formData.selectedGiaPha);
    } else {
      setAvailableMembers([]);
      setSelectedMember(null);
    }
  }, [formData.selectedGiaPha, mode]);

  const loadGenealogies = async () => {
    try {
      setLoadingGenealogies(true);
      const response = await apiClient.get('/users/genealogies');
      setGenealogies(response.data.result || []);
    } catch (err) {
      console.error('Error loading genealogies:', err);
    } finally {
      setLoadingGenealogies(false);
    }
  };

  const loadMembers = async (giaPhaName) => {
    try {
      setLoadingMembers(true);
      setAvailableMembers([]);
      setSelectedMember(null);
      setFormData(prev => ({ ...prev, selectedMaTV: '' }));

      const response = await apiClient.get(`/users/available-members?giapha=${encodeURIComponent(giaPhaName)}`);
      setAvailableMembers(response.data.result || []);
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  if (isAuthenticated) {
    navigate('/dashboard');
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setError(null);
  };

  const handleMemberSelect = (e) => {
    const MaTV = e.target.value;
    const member = availableMembers.find(m => m.MaTV === MaTV);
    setSelectedMember(member || null);
    setFormData(prev => ({ ...prev, selectedMaTV: MaTV, name: member?.HoTen || '' }));
  };

  const validateForm = () => {
    const errors = {};

    if (mode === 'create') {
      if (!formData.name.trim()) errors.name = 'Vui lòng nhập họ tên';
      if (!formData.newGiaPhaName.trim()) errors.newGiaPhaName = 'Vui lòng nhập tên gia phả';
    } else {
      if (!formData.selectedGiaPha) errors.selectedGiaPha = 'Vui lòng chọn gia phả';
      if (!formData.selectedMaTV) errors.selectedMaTV = 'Vui lòng chọn tên của bạn';
    }

    if (!formData.email) errors.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Email không hợp lệ';

    if (!formData.password) errors.password = 'Vui lòng nhập mật khẩu';
    else if (formData.password.length < 6) errors.password = 'Mật khẩu tối thiểu 6 ký tự';

    if (formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Mật khẩu xác nhận không khớp';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: mode === 'create' ? formData.name : selectedMember?.HoTen || formData.name,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
        giapha: mode === 'create'
          ? { name: formData.newGiaPhaName.trim(), exist: false }
          : { name: formData.selectedGiaPha, exist: true, MaTV: formData.selectedMaTV }
      };

      const response = await apiClient.post('/users/register', payload);

      setSuccess(response.data.message || 'Đăng ký thành công!');

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error('Register error:', err);
      const errorMsg = err.response?.data?.message || 'Đăng ký thất bại';
      setError(errorMsg);

      // Xử lý trường hợp có nhiều người trùng tên
      if (err.response?.status === 300 && err.response?.data?.candidates) {
        setAvailableMembers(err.response.data.candidates);
        setError('Có nhiều thành viên cùng tên. Vui lòng chọn đúng thành viên.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Tạo tài khoản mới
          </h1>
          <p className="text-neutral-500">
            {mode === 'create'
              ? 'Tạo gia phả mới và trở thành Trưởng tộc'
              : 'Liên kết email với thông tin của bạn trong gia phả'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="bg-neutral-100 rounded-xl p-1 mb-6 flex">
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'join'
              ? 'bg-white shadow text-emerald-600'
              : 'text-neutral-500 hover:text-neutral-700'
              }`}
          >
            <FiUsers className="w-4 h-4" />
            Gia nhập gia phả
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'create'
              ? 'bg-white shadow text-emerald-600'
              : 'text-neutral-500 hover:text-neutral-700'
              }`}
          >
            <FiPlus className="w-4 h-4" />
            Tạo gia phả mới
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <FiCheck className="w-5 h-5" />
              {success}
            </div>
          )}

          {/* Mode: Create New GiaPha */}
          {mode === 'create' && (
            <>
              {/* Info banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <FiInfo className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Bạn sẽ trở thành Trưởng tộc</p>
                  <p className="text-amber-600 mt-1">Có quyền quản lý thành viên và thông tin gia phả.</p>
                </div>
              </div>

              {/* Tên người đăng ký */}
              <div>
                <label className="form-label flex items-center gap-1">
                  <FiUser className="w-4 h-4" />
                  Họ tên của bạn *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập họ tên đầy đủ"
                  className={`input-field ${formErrors.name ? 'border-red-400' : ''}`}
                  disabled={isSubmitting}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              {/* Tên gia phả mới */}
              <div>
                <label className="form-label flex items-center gap-1">
                  <FiHome className="w-4 h-4" />
                  Tên gia phả mới *
                </label>
                <input
                  type="text"
                  name="newGiaPhaName"
                  value={formData.newGiaPhaName}
                  onChange={handleChange}
                  placeholder="Ví dụ: Nguyễn Văn - Nghệ An"
                  className={`input-field ${formErrors.newGiaPhaName ? 'border-red-400' : ''}`}
                  disabled={isSubmitting}
                />
                {formErrors.newGiaPhaName && <p className="text-red-500 text-xs mt-1">{formErrors.newGiaPhaName}</p>}
              </div>
            </>
          )}

          {/* Mode: Join Existing GiaPha */}
          {mode === 'join' && (
            <>
              {/* Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Bạn chỉ có thể đăng ký nếu tên của bạn đã được Trưởng tộc thêm vào gia phả.
                </p>
              </div>

              {/* Chọn Gia phả */}
              <div>
                <label className="form-label flex items-center gap-1">
                  <FiUsers className="w-4 h-4" />
                  Chọn Gia phả *
                </label>
                <select
                  name="selectedGiaPha"
                  value={formData.selectedGiaPha}
                  onChange={handleChange}
                  className={`input-field ${formErrors.selectedGiaPha ? 'border-red-400' : ''}`}
                  disabled={isSubmitting || loadingGenealogies}
                >
                  <option value="">-- Chọn gia phả --</option>
                  {genealogies.map(gp => (
                    <option key={gp.MaGiaPha} value={gp.TenGiaPha}>
                      {gp.TenGiaPha}
                    </option>
                  ))}
                </select>
                {formErrors.selectedGiaPha && <p className="text-red-500 text-xs mt-1">{formErrors.selectedGiaPha}</p>}
              </div>

              {/* Chọn tên */}
              {formData.selectedGiaPha && (
                <div className="animate-fade-in">
                  <label className="form-label flex items-center gap-1">
                    <FiUser className="w-4 h-4" />
                    Chọn tên của bạn *
                  </label>
                  {loadingMembers ? (
                    <div className="text-neutral-500 text-sm py-2">Đang tải...</div>
                  ) : availableMembers.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                      Không có thành viên nào khả dụng trong gia phả này.
                      Vui lòng liên hệ Trưởng tộc để được thêm vào.
                    </div>
                  ) : (
                    <select
                      name="selectedMaTV"
                      value={formData.selectedMaTV}
                      onChange={handleMemberSelect}
                      className={`input-field ${formErrors.selectedMaTV ? 'border-red-400' : ''}`}
                      disabled={isSubmitting}
                    >
                      <option value="">-- Chọn tên của bạn --</option>
                      {availableMembers.map(m => (
                        <option key={m.MaTV} value={m.MaTV}>
                          {m.HoTen} (Đời {m.DOI ?? 0}{m.GioiTinh ? `, ${m.GioiTinh}` : ''})
                        </option>
                      ))}
                    </select>
                  )}
                  {formErrors.selectedMaTV && <p className="text-red-500 text-xs mt-1">{formErrors.selectedMaTV}</p>}

                  {/* Thông tin thành viên được chọn */}
                  {selectedMember && (
                    <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <p className="text-sm font-medium text-emerald-800 mb-2">Thông tin xác nhận:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-emerald-700">
                        <div>Họ tên: <span className="font-medium">{selectedMember.HoTen}</span></div>
                        <div>Đời: <span className="font-medium">{selectedMember.DOI ?? 0}</span></div>
                        <div>Giới tính: <span className="font-medium">{selectedMember.GioiTinh || 'Chưa rõ'}</span></div>
                        <div>Cha: <span className="font-medium">{selectedMember.TenCha || 'Không rõ'}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Email */}
          <div>
            <label className="form-label flex items-center gap-1">
              <FiMail className="w-4 h-4" />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
              className={`input-field ${formErrors.email ? 'border-red-400' : ''}`}
              disabled={isSubmitting}
            />
            {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="form-label flex items-center gap-1">
              <FiLock className="w-4 h-4" />
              Mật khẩu *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`input-field pr-10 ${formErrors.password ? 'border-red-400' : ''}`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-1">Tối thiểu 6 ký tự</p>
            {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="form-label flex items-center gap-1">
              <FiLock className="w-4 h-4" />
              Xác nhận Mật khẩu *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`input-field pr-10 ${formErrors.confirm_password ? 'border-red-400' : ''}`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
            {formErrors.confirm_password && <p className="text-red-500 text-xs mt-1">{formErrors.confirm_password}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full py-3"
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                {mode === 'create' ? 'Tạo gia phả và đăng ký' : 'Tạo tài khoản'}
                <FiArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-neutral-200"></div>
          <span className="text-neutral-400 text-sm">hoặc</span>
          <div className="flex-1 h-px bg-neutral-200"></div>
        </div>

        {/* Login Link */}
        <p className="text-center text-neutral-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-emerald-600 font-medium hover:underline">
            Đăng nhập ngay →
          </Link>
        </p>

        {/* Footer */}
        <p className="text-center text-neutral-400 text-xs mt-8">
          © 2025 Gia Phả Management System designed by team SE104
        </p>
      </div>
    </div>
  );
}