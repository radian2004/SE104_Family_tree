export interface PhieuThuQuySchema {
  MaPhieuThu: string;
  MaTV: string;
  NgayThu: Date;
  TongThu: number;
}

export interface CTPhieuThuSchema {
  MaPhieuThu: string;
  MaDMT: string;
  SoThuTu: number;
  SoTienThu: number;
  TinhHopLe: boolean;
  NguoiXacNhan: string;
  NgayXacNhan: Date | null;
}

// Interface cho response đầy đủ
export interface PhieuThuQuyFullResponse {
  MaPhieuThu: string;
  NguoiDongGop: string;      // HoTen từ THANHVIEN
  NgayThu: Date;
  TongThu: number;
  ChiTiet: {
    SoThuTu: number;
    TenDanhMuc: string;       // TenDM từ DANHMUC
    SoTienThu: number;
    TinhHopLe: boolean;
    NguoiXacNhan: string;     // HoTen từ THANHVIEN
    NgayXacNhan: Date | null;
  }[];
}