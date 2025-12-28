// src/models/requests/TraCuuThanhVien.requests.ts

/**
 * Query parameters cho API tra cứu thành viên
 */
export interface TraCuuThanhVienQuery {
  search?: string;         // Tìm kiếm theo họ tên hoặc mã TV
  doi?: number;            // Lọc theo đời
  maGiaPha?: string;       // Lọc theo gia phả
  trangThai?: string;      // Lọc theo trạng thái (Còn Sống / Mất)
  sortBy?: 'doi' | 'ngaySinh' | 'hoTen';  // Sắp xếp theo
  order?: 'asc' | 'desc';  // Thứ tự sắp xếp
  page?: number;           // Trang hiện tại
  limit?: number;          // Số lượng mỗi trang
}

/**
 * Kết quả tra cứu một thành viên
 */
export interface TraCuuThanhVienResult {
  STT: number;             // Số thứ tự (auto-generated)
  MaTV: string;            // Mã thành viên
  HoTen: string;           // Họ tên
  NgayGioSinh: Date;       // Ngày giờ sinh
  DOI: number;             // Đời
  TenCha: string | null;   // Tên cha (NULL nếu không có)
  TenMe: string | null;    // Tên mẹ (NULL nếu không có)
  MaCha: string | null;    // Mã cha (để navigate nếu cần)
  MaMe: string | null;     // Mã mẹ (để navigate nếu cần)
}

/**
 * Response tra cứu thành viên với phân trang
 */
export interface TraCuuThanhVienResponse {
  message: string;
  data: TraCuuThanhVienResult[];
  pagination: {
    total: number;         // Tổng số record
    page: number;          // Trang hiện tại
    limit: number;         // Số lượng mỗi trang
    totalPages: number;    // Tổng số trang
  };
}