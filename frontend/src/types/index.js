/**
 * ============================================
 * TYPES & INTERFACES
 * ============================================
 */

// ==================== AUTH ====================
/**
 * @typedef {Object} User
 * @property {string} TenDangNhap - Email/username
 * @property {string} MaTV - Mã thành viên
 * @property {string} MaLoaiTK - Mã loại tài khoản
 * @property {string} access_token - JWT access token
 * @property {string} refresh_token - JWT refresh token
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} email - Email đăng nhập
 * @property {string} password - Mật khẩu
 */

/**
 * @typedef {Object} RegisterRequest
 * @property {string} name - Họ tên
 * @property {string} email - Email
 * @property {string} password - Mật khẩu
 * @property {string} confirm_password - Xác nhận mật khẩu
 */

// ==================== THÀNH VIÊN ====================
/**
 * @typedef {Object} ThanhVien
 * @property {string} MaTV - Mã thành viên (PK)
 * @property {string} HoTen - Họ tên
 * @property {Date} NgayGioSinh - Ngày giờ sinh
 * @property {string} DiaChi - Địa chỉ
 * @property {string} TrangThai - Trạng thái (Sống/Mất)
 * @property {Date} TGTaoMoi - Thời gian tạo mới
 * @property {number} DOI - Đời (thế hệ)
 * @property {string} MaQueQuan - Mã quê quán (FK)
 * @property {string} MaNgheNghiep - Mã nghề nghiệp (FK)
 * @property {string} MaGioiTinh - Mã giới tính (FK)
 * @property {string|null} MaGiaPha - Mã gia phả (FK)
 */

/**
 * @typedef {Object} CreateThanhVienRequest
 * @property {string} HoTen - Họ tên
 * @property {Date} NgayGioSinh - Ngày giờ sinh
 * @property {string} DiaChi - Địa chỉ
 * @property {string} MaQueQuan - Mã quê quán
 * @property {string} MaNgheNghiep - Mã nghề nghiệp
 * @property {string} MaGioiTinh - Mã giới tính
 * @property {string} [MaGiaPha] - Mã gia phả (optional)
 */

/**
 * @typedef {Object} UpdateThanhVienRequest
 * @property {string} [HoTen] - Họ tên
 * @property {Date} [NgayGioSinh] - Ngày giờ sinh
 * @property {string} [DiaChi] - Địa chỉ
 * @property {string} [MaQueQuan] - Mã quê quán
 * @property {string} [MaNgheNghiep] - Mã nghề nghiệp
 * @property {string} [MaGioiTinh] - Mã giới tính
 * @property {string} [MaGiaPha] - Mã gia phả
 * @property {string} [TrangThai] - Trạng thái
 */

// ==================== LOOKUP TABLES ====================
/**
 * @typedef {Object} GioiTinh
 * @property {string} MaGioiTinh - Mã giới tính (PK)
 * @property {string} TenGioiTinh - Tên giới tính
 */

/**
 * @typedef {Object} QueQuan
 * @property {string} MaQueQuan - Mã quê quán (PK)
 * @property {string} TenQueQuan - Tên quê quán
 */

/**
 * @typedef {Object} NgheNghiep
 * @property {string} MaNgheNghiep - Mã nghề nghiệp (PK)
 * @property {string} TenNgheNghiep - Tên nghề nghiệp
 */

/**
 * @typedef {Object} CayGiaPha
 * @property {string} MaGiaPha - Mã gia phả (PK)
 * @property {string} TenGiaPha - Tên gia phả
 * @property {Date} NgayLap - Ngày lập
 */

// ==================== QUAN HỆ GIA PHẢ ====================
/**
 * @typedef {Object} QuanHeVoChong
 * @property {string} MaTV - Mã thành viên 1
 * @property {string} MaTV_Vo_Chong - Mã thành viên vợ/chồng
 * @property {Date} NgayKetThuc - Ngày kết thúc quan hệ
 * @property {string} [MaLoaiTK] - Mã loại tài khoản (optional)
 */

/**
 * @typedef {Object} QuanHeConCai
 * @property {string} MaCha - Mã cha
 * @property {string} MaMe - Mã mẹ
 * @property {string} MaCon - Mã con
 */

// ==================== API RESPONSE ====================
/**
 * @typedef {Object} ApiResponse
 * @property {string} message - Thông báo
 * @property {any} result - Kết quả
 */

/**
 * @typedef {Object} ApiErrorResponse
 * @property {string} message - Thông báo lỗi
 * @property {number} status - HTTP status code
 */

// ==================== PAGINATION ====================
/**
 * @typedef {Object} PaginationParams
 * @property {number} page - Trang hiện tại
 * @property {number} limit - Số items per page
 * @property {string} [search] - Từ khóa tìm kiếm
 * @property {string} [sortBy] - Cột sắp xếp
 * @property {string} [sortOrder] - Thứ tự (asc/desc)
 */

/**
 * @typedef {Object} PaginationResponse
 * @property {any[]} items - Danh sách items
 * @property {number} total - Tổng số items
 * @property {number} page - Trang hiện tại
 * @property {number} limit - Số items per page
 * @property {number} totalPages - Tổng số trang
 */
