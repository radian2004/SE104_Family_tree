/**
 * ============================================
 * REGISTER PAGE
 * ============================================
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { validateData, registerSchema } from '../utils/validators';

export default function RegisterPage() {
  const { handleRegister, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validate
    const validation = await validateData(registerSchema, formData);
    if (!validation.success) {
      setFormErrors(validation.errors);
      return;
    }

    // Call API
    try {
      await handleRegister(formData);
    } catch (err) {
      // Error đã được set trong store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center py-12 px-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Gia Phả</h1>
          <p className="text-gray-600 mt-2">Tạo tài khoản mới</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Error Alert */}
          {error && (
            <div className="alert alert-error mb-4">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="form-group">
            <label className="form-label">Họ tên</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập họ tên của bạn"
              className={`input-field ${formErrors.name ? 'input-field-error' : ''}`}
              disabled={isLoading}
            />
            {formErrors.name && (
              <p className="form-error">{formErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email của bạn"
              className={`input-field ${formErrors.email ? 'input-field-error' : ''}`}
              disabled={isLoading}
            />
            {formErrors.email && (
              <p className="form-error">{formErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              className={`input-field ${formErrors.password ? 'input-field-error' : ''}`}
              disabled={isLoading}
            />
            {formErrors.password && (
              <p className="form-error">{formErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Xác nhận mật khẩu</label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Xác nhận mật khẩu"
              className={`input-field ${formErrors.confirm_password ? 'input-field-error' : ''}`}
              disabled={isLoading}
            />
            {formErrors.confirm_password && (
              <p className="form-error">{formErrors.confirm_password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary btn-block"
          >
            {isLoading ? (
              <>
                <span className="spinner mr-2"></span>
                Đang đăng ký...
              </>
            ) : (
              'Đăng ký'
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-green-600 hover:underline font-medium">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
