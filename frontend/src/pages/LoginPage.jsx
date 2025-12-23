/**
 * ============================================
 * LOGIN PAGE - Premium Family Tree Design
 * ============================================
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { validateData, loginSchema } from '../utils/validators';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';

export default function LoginPage() {
  const { handleLogin, isLoading, error, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/dashboard');
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const validation = await validateData(loginSchema, formData);
    if (!validation.success) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      await handleLogin(formData);
    } catch (err) {
      // Error is handled in auth store
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-emerald-500"></div>

        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full"></div>
        </div>

        {/* Tree Illustration */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white z-10">
            <div className="text-9xl mb-6 animate-float">🌳</div>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Gia Phả
            </h2>
            <p className="text-xl text-white/80 max-w-md mx-auto">
              Lưu giữ và kết nối thế hệ qua dòng thời gian
            </p>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 text-6xl animate-float" style={{ animationDelay: '0.5s' }}>👨‍👩‍👧‍👦</div>
        <div className="absolute bottom-1/4 right-1/4 text-5xl animate-float" style={{ animationDelay: '1s' }}>❤️</div>
        <div className="absolute top-1/3 right-1/3 text-4xl animate-float" style={{ animationDelay: '1.5s' }}>🏠</div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo for Mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-2xl shadow-lg">
                🌳
              </div>
              <span className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                Gia Phả
              </span>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Chào mừng trở lại! 👋
            </h1>
            <p className="text-neutral-500">
              Đăng nhập để quản lý gia phả của bạn
            </p>
          </div>

          {/* Login Card */}
          <div className="glass-card p-8">
            <form onSubmit={handleSubmit} noValidate>
              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger mb-6">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="font-semibold">Đã có lỗi xảy ra</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                    <FiMail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className={`input-field pl-12 ${formErrors.email ? 'input-field-error' : ''}`}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {formErrors.email && <p className="form-error">{formErrors.email}</p>}
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                    <FiLock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`input-field pl-12 pr-12 ${formErrors.password ? 'input-field-error' : ''}`}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
                {formErrors.password && <p className="form-error">{formErrors.password}</p>}
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end mb-6">
                <a href="#" className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors">
                  Quên mật khẩu?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full btn-large group"
              >
                {isLoading ? (
                  <>
                    <div className="spinner"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">hoặc</span>
              </div>
            </div>

            {/* Register Link */}
            <p className="text-center text-neutral-600">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Đăng ký ngay →
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-neutral-400 text-sm mt-8">
            © 2025 Gia Phả Management System designed by team SE104
          </p>
        </div>
      </div>
    </div>
  );
}