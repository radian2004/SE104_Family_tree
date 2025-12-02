export default class RefreshToken {
  token: string;
  TenDangNhap: string;
  NgayTao: Date;
  NgayHetHan: Date;

  constructor(token: string, tenDangNhap: string, ngayHetHan: Date) {
    this.token = token;
    this.TenDangNhap = tenDangNhap;
    this.NgayTao = new Date();
    this.NgayHetHan = ngayHetHan;
  }
}