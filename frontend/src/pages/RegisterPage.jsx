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

  // Dropdown data (chỉ dùng cho mode create)
  const [genealogies, setGenealogies] = useState([]);
  const [loadingGenealogies, setLoadingGenealogies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedMember, setVerifiedMember] = useState(null); // Thông tin thành viên đã xác minh
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    // Common fields
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    // Join mode - nhập mã trực tiếp
    MaGiaPha: '',
    MaTV: '',
    // Create mode
    newGiaPhaName: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset verified member khi thay đổi mode hoặc mã
  useEffect(() => {
    setVerifiedMember(null);
    setError(null);
  }, [mode, formData.MaGiaPha, formData.MaTV]);

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

  // Xác minh mã gia phả và mã thành viên
  const handleVerifyMember = async () => {
    if (!formData.MaGiaPha.trim() || !formData.MaTV.trim()) {
      setError('Vui lòng nhập cả Mã gia phả và Mã thành viên');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setVerifiedMember(null);

    try {
      // Gọi API để xác minh
      const response = await apiClient.get(`/users/verify-member?MaGiaPha=${formData.MaGiaPha}&MaTV=${formData.MaTV}`);

      if (response.data.result) {
        setVerifiedMember(response.data.result);
        setFormData(prev => ({ ...prev, name: response.data.result.HoTen }));
      } else {
        setError('Không tìm thấy thành viên với mã này trong gia phả đã chỉ định');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError(err.response?.data?.message || 'Không tìm thấy thành viên. Vui lòng kiểm tra lại mã.');
    } finally {
      setIsVerifying(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (mode === 'create') {
      if (!formData.name.trim()) errors.name = 'Vui lòng nhập họ tên';
      if (!formData.newGiaPhaName.trim()) errors.newGiaPhaName = 'Vui lòng nhập tên gia phả';
    } else {
      // Mode join: cần đã xác minh thành viên
      if (!formData.MaGiaPha.trim()) errors.MaGiaPha = 'Vui lòng nhập mã gia phả';
      if (!formData.MaTV.trim()) errors.MaTV = 'Vui lòng nhập mã thành viên';
      if (!verifiedMember) errors.MaTV = 'Vui lòng xác minh thành viên trước khi đăng ký';
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
        name: mode === 'create' ? formData.name : verifiedMember?.HoTen || formData.name,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
        giapha: mode === 'create'
          ? { name: formData.newGiaPhaName.trim(), exist: false }
          : { name: verifiedMember?.TenGiaPha || formData.MaGiaPha, exist: true, MaTV: formData.MaTV }
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
                <div className="text-sm text-blue-700">
                  <p>Nhập mã gia phả và mã thành viên được Trưởng tộc cung cấp.</p>
                  <p className="mt-1 text-blue-600">Ví dụ: Mã gia phả <strong>GP01</strong>, Mã thành viên <strong>TV001</strong></p>
                </div>
              </div>

              {/* Nhập mã Gia phả */}
              <div>
                <label className="form-label flex items-center gap-1">
                  <FiHome className="w-4 h-4" />
                  Mã gia phả *
                </label>
                <input
                  type="text"
                  name="MaGiaPha"
                  value={formData.MaGiaPha}
                  onChange={handleChange}
                  placeholder="VD: GP01"
                  className={`input-field ${formErrors.MaGiaPha ? 'border-red-400' : ''}`}
                  disabled={isSubmitting || verifiedMember}
                />
                {formErrors.MaGiaPha && <p className="text-red-500 text-xs mt-1">{formErrors.MaGiaPha}</p>}
              </div>

              {/* Nhập mã Thành viên */}
              <div>
                <label className="form-label flex items-center gap-1">
                  <FiUser className="w-4 h-4" />
                  Mã thành viên *
                </label>
                <input
                  type="text"
                  name="MaTV"
                  value={formData.MaTV}
                  onChange={handleChange}
                  placeholder="VD: TV001"
                  className={`input-field ${formErrors.MaTV ? 'border-red-400' : ''}`}
                  disabled={isSubmitting || verifiedMember}
                />
                {formErrors.MaTV && <p className="text-red-500 text-xs mt-1">{formErrors.MaTV}</p>}
              </div>

              {/* Nút xác minh */}
              {!verifiedMember && (
                <button
                  type="button"
                  onClick={handleVerifyMember}
                  disabled={isVerifying || !formData.MaGiaPha.trim() || !formData.MaTV.trim()}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xác minh...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Xác minh thành viên
                    </>
                  )}
                </button>
              )}

              {/* Thông tin thành viên đã xác minh */}
              {verifiedMember && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-emerald-800">✅ Xác minh thành công!</p>
                    <button
                      type="button"
                      onClick={() => {
                        setVerifiedMember(null);
                        setFormData(prev => ({ ...prev, MaGiaPha: '', MaTV: '', name: '' }));
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-800"
                    >
                      Đổi thành viên
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-emerald-700">
                    <div>Họ tên: <span className="font-medium">{verifiedMember.HoTen}</span></div>
                    <div>Đời: <span className="font-medium">{verifiedMember.DOI ?? 0}</span></div>
                    <div>Giới tính: <span className="font-medium">{verifiedMember.GioiTinh || 'Chưa rõ'}</span></div>
                    <div>Gia phả: <span className="font-medium">{verifiedMember.TenGiaPha}</span></div>
                  </div>
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