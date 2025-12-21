/**
 * ============================================
 * LOGIN PAGE
 * ============================================
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { validateData, loginSchema } from '../utils/validators';
import { getErrorMessages } from '../utils/helpers';

export default function LoginPage() {
  const { handleLogin, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validate
    const validation = await validateData(loginSchema, formData);
    if (!validation.success) {
      setFormErrors(validation.errors);
      return;
    }

    // Call API
    try {
      await handleLogin(formData);
    } catch (err) {
      // Error đã được set trong store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center py-12 px-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Gia Phả</h1>
          <p className="text-gray-600 mt-2">Quản lý cây gia phả gia đình</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Error Alert */}
          {error && (
            <div className="alert alert-error mb-4">
              {error}
            </div>
          )}

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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary btn-block"
          >
            {isLoading ? (
              <>
                <span className="spinner mr-2"></span>
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
