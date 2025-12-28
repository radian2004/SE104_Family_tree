// src/models/requests/DanhMuc.requests.ts

/**
 * Interface cho query parameters tra cứu danh mục
 */
export interface TraCuuDanhMucQuery {
  nam?: number;  // Năm tra cứu (optional, default = năm hiện tại)
}

/**
 * Interface cho thông tin người đảm nhận
 */
export interface NguoiDamNhanInfo {
  MaTV: string;
  HoTen: string;
}

/**
 * Interface cho mỗi danh mục trong kết quả
 */
export interface DanhMucThuChiItem {
  STT: number;
  MaDM: string;
  TenDM: string;
  Nam: number;
  NguoiDamNhan: NguoiDamNhanInfo;
  TongThu: number;
  TongChi: number;
  DuThieu: number;
  TrangThai: 'Dư' | 'Thiếu' | 'Cân bằng';
}

/**
 * Interface cho response tra cứu
 */
export interface TraCuuDanhMucResponse {
  nam: number;
  tongSoDanhMuc: number;
  tongThuNam: number;
  tongChiNam: number;
  tongDuThieu: number;
  danhSach: DanhMucThuChiItem[];
}