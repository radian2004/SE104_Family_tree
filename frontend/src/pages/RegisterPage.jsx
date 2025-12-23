/**
 * ============================================
 * REGISTER PAGE (Final Version)
 * - Hỗ trợ hiển thị lỗi chi tiết từ Backend
 * - Hỗ trợ ẩn/hiện mật khẩu
 * ============================================
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { validateData, registerSchema } from '../utils/validators';

export default function RegisterPage() {
  const { handleRegister, isLoading, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // 1. State lưu dữ liệu Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  
  // 2. State lưu lỗi (validation errors)
  const [formErrors, setFormErrors] = useState({});
  
  // 3. State điều khiển ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Nếu đã đăng nhập thì chuyển hướng về Dashboard
  if (isAuthenticated) {
    navigate('/dashboard');
  }

  // Xử lý khi người dùng nhập liệu
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Tự động xóa lỗi của ô đang nhập để giao diện sạch sẽ hơn
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Xử lý khi nhấn nút Đăng ký
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({}); // Reset lỗi cũ

    // Bước 1: Validate phía Frontend (Client-side)
    const validation = await validateData(registerSchema, formData);
    if (!validation.success) {
      setFormErrors(validation.errors);
      return;
    }

    // Bước 2: Gọi API Đăng ký
    try {
      await handleRegister(formData);
      // Nếu thành công, useAuth hoặc App sẽ tự điều hướng
    } catch (err) {
      console.error("Register Error:", err);

      // --- LOGIC XỬ LÝ LỖI TỪ BACKEND ---
      // Kiểm tra nếu Backend trả về danh sách lỗi chi tiết (thường là express-validator)
      if (err.response && err.response.data && err.response.data.errors) {
        const backendErrors = err.response.data.errors;
        const processedErrors = {};

        // Duyệt qua từng key lỗi để "làm phẳng" (flatten) object
        Object.keys(backendErrors).forEach((key) => {
          const errorValue = backendErrors[key];
          
          // Nếu lỗi là Object có chứa .msg (format của express-validator)
          if (typeof errorValue === 'object' && errorValue !== null && errorValue.msg) {
             processedErrors[key] = errorValue.msg;
          } else {
             // Nếu lỗi chỉ là string bình thường
             processedErrors[key] = errorValue;
          }
        });

        setFormErrors(processedErrors);
      } else {
        // Trường hợp lỗi chung (không có field cụ thể), hoặc lỗi Server 500
        const errorMessage = err.response?.data?.message || err.message || '';
        
        // Nếu thông báo lỗi có chứa từ "email" (ví dụ: "Email đã tồn tại") -> Gán vào ô Email
        if (errorMessage.toLowerCase().includes('email')) {
           setFormErrors(prev => ({ ...prev, email: errorMessage }));
        }
        // Các lỗi khác sẽ được hiển thị ở Alert đỏ phía trên cùng (do logic bên dưới render)
      }
    }
  };

  // Component Icon Mắt (Tái sử dụng)
  const EyeIcon = ({ isVisible, toggle }) => (
    <button
      type="button"
      onClick={toggle}
      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-blue-600 focus:outline-none"
      tabIndex="-1" // Tránh focus khi nhấn Tab
    >
      {isVisible ? (
        // Icon Mở Mắt
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ) : (
        // Icon Nhắm Mắt
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Tạo tài khoản mới</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Bắt đầu quản lý cây gia phả của bạn ngay hôm nay</p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8">
          <form onSubmit={handleSubmit} noValidate>
            
            {/* ALERT LỖI CHUNG (Chỉ hiện khi có lỗi hệ thống/mạng, còn lỗi nhập liệu hiện ở input) */}
            {error && Object.keys(formErrors).length === 0 && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
                <p className="font-bold">Đăng ký không thành công</p>
                <p>{error}</p>
              </div>
            )}

            {/* --- INPUT: HỌ TÊN --- */}
            <div className="mb-4">
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Họ và Tên
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className={`w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isLoading}
                autoComplete="name"
              />
              {formErrors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>}
            </div>

            {/* --- INPUT: EMAIL --- */}
            <div className="mb-4">
              <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className={`w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isLoading}
                autoComplete="email"
              />
              {formErrors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>}
            </div>

            {/* --- INPUT: MẬT KHẨU --- */}
            <div className="mb-4">
              <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 transition-colors ${
                    formErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <EyeIcon isVisible={showPassword} toggle={() => setShowPassword(!showPassword)} />
              </div>
              {formErrors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>}
            </div>

            {/* --- INPUT: XÁC NHẬN MẬT KHẨU --- */}
            <div className="mb-6">
              <label htmlFor="confirm_password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Xác nhận Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 transition-colors ${
                    formErrors.confirm_password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <EyeIcon isVisible={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} />
              </div>
              {formErrors.confirm_password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.confirm_password}</p>}
            </div>

            {/* --- BUTTON SUBMIT --- */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 disabled:bg-blue-400 dark:disabled:bg-blue-500 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                'Tạo tài khoản'
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}