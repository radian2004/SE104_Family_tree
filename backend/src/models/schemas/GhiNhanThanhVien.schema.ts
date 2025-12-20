// Định nghĩa payload từ client
export interface GhiNhanThanhVienPayload {
  // Thông tin thành viên mới
  HoTen: string;                    // ✅ Họ tên (required)
  NgayGioSinh: string;              // ✅ Ngày giờ sinh (ISO format: 'YYYY-MM-DD HH:mm:ss')
  GioiTinh: 'Nam' | 'Nữ';           // ✅ Giới tính (required)
  DiaChi: string;                   // ✅ Địa chỉ (required)
  MaQueQuan: string;                // ✅ Quê quán - FK đến QUEQUAN (required)
  MaNgheNghiep?: string;            // ✅ Nghề nghiệp - FK đến NGHENGHIEP (optional - NULL được)
  
  // Thông tin quan hệ với thành viên cũ
  MaTVCu: string;                   // ✅ Mã thành viên cũ (cha/mẹ/chồng/vợ) (required)
  LoaiQuanHe: 'Con cái' | 'Vợ/Chồng'; // ✅ Loại quan hệ (required)
  NgayPhatSinh: string;             // ✅ Ngày phát sinh (ISO format: 'YYYY-MM-DD' hoặc 'YYYY-MM-DD HH:mm:ss')
                                    //    - Nếu 'Con cái' → Ngày làm giấy khai sinh
                                    //    - Nếu 'Vợ/Chồng' → Ngày kết hôn
}

// Response trả về khi thành công
export interface GhiNhanThanhVienResult {
  message: string;
  MaTVMoi: string;                  // Mã thành viên vừa tạo
  HoTen: string;
  LoaiQuanHe: string;
  TenThanhVienCu: string;           // Tên thành viên cũ (để hiển thị xác nhận)
  DOI: number;                      // Đời của thành viên mới (tự động tính)
  MaGiaPha: string;                 // Mã gia phả (tự động gán)
}

// Interface cho validation
export interface ThanhVienCuInfo {
  MaTV: string;
  HoTen: string;
  GioiTinh: string;
  NgayGioSinh: Date;
  MaGiaPha: string;
}