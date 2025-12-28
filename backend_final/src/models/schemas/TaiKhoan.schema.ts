interface TaiKhoanType {
  TenDangNhap?: string;
  MaTV?: string;
  MatKhau: string;
  MaLoaiTK?: string;
  TGTaoMoi?: Date;
}

export default class TaiKhoan {
  TenDangNhap?: string;
  MaTV?: string;
  MatKhau: string;
  MaLoaiTK: string;
  TGTaoMoi: Date;

  constructor(taikhoan: TaiKhoanType) {
    this.TenDangNhap = taikhoan.TenDangNhap;
    this.MaTV = taikhoan.MaTV;
    this.MatKhau = taikhoan.MatKhau;
    this.MaLoaiTK = taikhoan.MaLoaiTK || 'LTK02'; // Mặc định User
    this.TGTaoMoi = taikhoan.TGTaoMoi || new Date();
  }
}