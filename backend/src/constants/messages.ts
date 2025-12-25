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

// ========================================
// THÊM VÀO FILE: src/constants/messages.ts
// ========================================

export const THANHVIEN_MESSAGES = {
  // Ghi nhận thành viên
  GHI_NHAN_SUCCESS: 'Ghi nhận thành viên thành công',
  GHI_NHAN_FAILED: 'Ghi nhận thành viên thất bại',
  
  // Validation
  MISSING_REQUIRED_FIELDS: 'Thiếu thông tin bắt buộc',
  INVALID_GENDER: 'Giới tính không hợp lệ. Phải là "Nam" hoặc "Nữ"',
  INVALID_RELATION_TYPE: 'Loại quan hệ không hợp lệ. Phải là "Con cái" hoặc "Vợ/Chồng"',
  
  // Errors
  MEMBER_NOT_FOUND: 'Không tìm thấy thành viên',
  OLD_MEMBER_NOT_FOUND: 'Không tìm thấy thành viên cũ',
  ALREADY_HAS_SPOUSE: 'Thành viên cũ đã có vợ/chồng hiện tại',
  INVALID_BIRTH_DATE: 'Ngày sinh của con phải sau ngày sinh của cha/mẹ',
  FATHER_MUST_BE_MALE: 'Giới tính của cha phải là Nam',
  MOTHER_MUST_BE_FEMALE: 'Giới tính của mẹ phải là Nữ',
  
  // Duplicate validation
  DUPLICATE_CHILD: 'Đã tồn tại con cùng tên và ngày sinh của thành viên này',
  DUPLICATE_PERSON: 'Người này đã tồn tại trong hệ thống',
  USE_RELATION_FEATURE: 'Hãy sử dụng chức năng "Thêm quan hệ" thay vì ghi nhận lại',

  // Success
  GET_AVAILABLE_RELATIONS_SUCCESS: 'Lấy danh sách thành viên thành công',
} as const;