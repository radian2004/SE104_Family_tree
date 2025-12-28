// src/models/requests/PhieuThu.requests.ts

// Request body cho tạo phiếu thu
export interface CreatePhieuThuReqBody {
  MaTV: string;  // Mã thành viên người đóng góp
  chiTietPhieuThu: ChiTietPhieuThuItem[];
}

export interface ChiTietPhieuThuItem {
  MaDMT: string;     // Mã danh mục thu
  SoTienThu: number; // Số tiền đóng góp
}

// Request body cho tạo danh mục
export interface CreateDanhMucReqBody {
  TenDM: string;
  NguoiDamNhan: string;
}

// Request body cho cập nhật danh mục
export interface UpdateDanhMucReqBody {
  TenDM?: string;
  NguoiDamNhan?: string;
}