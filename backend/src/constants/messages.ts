export const USERS_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  
  // Register
  NAME_IS_REQUIRED: 'Tên không được để trống',
  NAME_LENGTH_INVALID: 'Tên phải từ 1-100 ký tự',
  
  EMAIL_IS_REQUIRED: 'Email không được để trống',
  EMAIL_IS_INVALID: 'Email không hợp lệ',
  EMAIL_ALREADY_EXISTS: 'Email đã tồn tại',
  
  PASSWORD_IS_REQUIRED: 'Mật khẩu không được để trống',
  PASSWORD_LENGTH_INVALID: 'Mật khẩu phải từ 8-50 ký tự',
  PASSWORD_MUST_BE_STRONG: 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt',
  
  CONFIRM_PASSWORD_IS_REQUIRED: 'Xác nhận mật khẩu không được để trống',
  CONFIRM_PASSWORD_NOT_MATCH: 'Xác nhận mật khẩu không khớp',
  
  // Login
  EMAIL_OR_PASSWORD_INCORRECT: 'Email hoặc mật khẩu không đúng',
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  
  // Logout
  ACCESS_TOKEN_IS_REQUIRED: 'Access token không được để trống',
  ACCESS_TOKEN_IS_INVALID: 'Access token không hợp lệ',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token không được để trống',
  REFRESH_TOKEN_IS_INVALID: 'Refresh token không hợp lệ',
  REFRESH_TOKEN_NOT_EXIST: 'Refresh token không tồn tại',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  
  // Register success
  REGISTER_SUCCESS: 'Đăng ký tài khoản thành công'
} as const;