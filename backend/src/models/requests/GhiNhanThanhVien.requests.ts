// src/models/requests/GhiNhanThanhVien.requests.ts

/**
 * Interface cho request body khi ghi nhận thành viên mới
 */
export interface GhiNhanThanhVienReqBody {
  // Thông tin thành viên mới
  HoTen: string;                              // Họ tên (required)
  NgayGioSinh: string;                        // Format: 'YYYY-MM-DD HH:mm:ss' hoặc 'YYYY-MM-DD'
  GioiTinh: 'Nam' | 'Nữ';                     // Giới tính (required)
  DiaChi: string;                             // Địa chỉ (required)
  MaQueQuan: string;                          // Mã quê quán - FK QUEQUAN (required)
  MaNgheNghiep?: string | null;               // Mã nghề nghiệp - FK NGHENGHIEP (optional)
  
  // Thông tin quan hệ
  MaTVCu: string;                             // Mã thành viên cũ (cha/mẹ/chồng/vợ)
  LoaiQuanHe: 'Con cái' | 'Vợ/Chồng';         // Loại quan hệ
  NgayPhatSinh: string;                       // Ngày phát sinh (ngày khai sinh / ngày kết hôn)
}

/**
 * Interface cho thông tin thành viên cũ (để validate và hiển thị)
 */
export interface ThanhVienCuInfo {
  MaTV: string;
  HoTen: string;
  GioiTinh: string;
  NgayGioSinh: Date;
  DOI: number;
  MaGiaPha: string | null;
}

/**
 * Interface cho response sau khi ghi nhận thành công
 */
export interface GhiNhanThanhVienResponse {
  message: string;
  data: {
    MaTVMoi: string;
    HoTen: string;
    NgayGioSinh: Date;
    GioiTinh: string;
    DiaChi: string;
    DOI: number;
    MaGiaPha: string;
    QuanHe: {
      LoaiQuanHe: string;
      TenThanhVienCu: string;
      MaTVCu: string;
      NgayPhatSinh: string;
    };
  };
}