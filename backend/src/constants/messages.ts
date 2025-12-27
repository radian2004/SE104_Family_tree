export const USERS_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',

  REFRESH_TOKEN_SUCCESS: 'Làm mới token thành công',
  USED_REFRESH_TOKEN_OR_NOT_EXIST: 'Refresh token không tồn tại hoặc đã được sử dụng',
  
  // Messages phân quyền
  ACCESS_DENIED: 'Bạn không có quyền truy cập',
  ADMIN_ONLY: 'Chỉ Admin mới có quyền thực hiện hành động này',
  OWNER_ONLY: 'Chỉ Trưởng tộc mới có quyền thực hiện hành động này',
  ADMIN_OR_OWNER_ONLY: 'Chỉ Admin hoặc Trưởng tộc mới có quyền thực hiện hành động này',
  CANNOT_UPDATE_OTHER_MEMBER: 'Bạn không có quyền sửa thông tin thành viên khác',
  CANNOT_DELETE_MEMBER: 'Bạn không có quyền xóa thành viên',
  CANNOT_VIEW_OTHER_FAMILY: 'Bạn không có quyền xem thông tin gia phả khác',
  NOT_IN_FAMILY: 'Bạn chưa thuộc gia phả nào',

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
  REGISTER_SUCCESS: 'Đăng ký tài khoản thành công',

  // Gia phả messages
  GIAPHA_EXIST_IS_REQUIRED: 'Thông tin gia phả là bắt buộc',
  GIAPHA_EXIST_MUST_BE_BOOLEAN: 'Trường exist phải là boolean (true/false)',
  GIAPHA_NAME_IS_REQUIRED: 'Tên gia phả là bắt buộc',
  GIAPHA_NAME_MUST_BE_STRING: 'Tên gia phả phải là chuỗi',
  GIAPHA_NAME_LENGTH_MUST_BE_FROM_1_TO_35: 'Tên gia phả phải từ 1 đến 35 ký tự',
  GIAPHA_NOT_FOUND: 'Gia phả không tồn tại',
  GIAPHA_CREATED: 'Tạo gia phả mới thành công. Bạn là người lập và trưởng tộc.',
  GIAPHA_JOINED: 'Gia nhập gia phả thành công.',

  // Get me messages
  USER_NOT_FOUND: 'Không tìm thấy thông tin người dùng',
  GET_ME_SUCCESS: 'Lấy thông tin cá nhân thành công',

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

export const PHIEUTHU_MESSAGES = {
  CREATE_SUCCESS: 'Tạo phiếu thu thành công',
  CREATE_FAILED: 'Tạo phiếu thu thất bại',
  XACNHAN_SUCCESS: 'Xác nhận thành công',
  XACNHAN_FAILED: 'Xác nhận thất bại',
  NOT_FOUND: 'Không tìm thấy phiếu thu',
  FORBIDDEN: 'Chỉ người đảm nhận danh mục mới có quyền xác nhận',
  GET_SUCCESS: 'Lấy dữ liệu thành công'
} as const;

export const THANHTICH_MESSAGES = {
  // Ghi nhận thành tích
  GHI_NHAN_SUCCESS: 'Ghi nhận thành tích thành công',
  GHI_NHAN_FAILED: 'Ghi nhận thành tích thất bại',
  CANNOT_GHI_NHAN_OTHER_MEMBER: 'Bạn không có quyền ghi nhận thành tích cho thành viên khác',
  CANNOT_GHI_NHAN_OTHER_FAMILY: 'Bạn không có quyền ghi nhận thành tích cho thành viên ngoài gia phả',
  
  // Xóa thành tích
  XOA_SUCCESS: 'Xóa thành tích thành công',
  XOA_FAILED: 'Xóa thành tích thất bại',
  CANNOT_DELETE_THANHTICH: 'Bạn không có quyền xóa thành tích',
  
  // Cập nhật thành tích
  CAP_NHAT_SUCCESS: 'Cập nhật thành tích thành công',
  CAP_NHAT_FAILED: 'Cập nhật thành tích thất bại',
  CANNOT_UPDATE_THANHTICH: 'Bạn không có quyền sửa thành tích',
  
  // Tra cứu
  TRA_CUU_SUCCESS: 'Tra cứu thành tích thành công',
  TRA_CUU_FAILED: 'Tra cứu thành tích thất bại',
  CANNOT_VIEW_OTHER_FAMILY_THANHTICH: 'Bạn không có quyền xem thành tích của gia phả khác',
  
  // Báo cáo
  BAO_CAO_SUCCESS: 'Lấy báo cáo thành tích thành công',
  BAO_CAO_FAILED: 'Lấy báo cáo thành tích thất bại',
  
  // Validation
  MISSING_REQUIRED_FIELDS: 'Thiếu thông tin bắt buộc',
  INVALID_DATE: 'Ngày không hợp lệ',
  NGAY_PHAT_SINH_INVALID: 'Ngày đạt thành tích phải sau ngày sinh thành viên'
} as const;