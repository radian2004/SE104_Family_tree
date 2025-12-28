interface ThanhVienType {
  MaTV?: string;
  HoTen?: string;
  NgayGioSinh?: Date;
  DiaChi?: string;
  TrangThai?: string;
  TGTaoMoi?: Date;
  DOI?: number;
  MaQueQuan?: string;
  MaNgheNghiep?: string;
  GioiTinh?: string;  // ✅ Đúng: VARCHAR(3) - 'Nam'/'Nữ'
  MaNguyenNhanMat?: string;
  NgayGioMat?: Date;
  MaDiaDiem?: string;
  MaGiaPha?: string;
}

export default class ThanhVien {
  MaTV?: string;
  HoTen: string;
  NgayGioSinh: Date;
  DiaChi: string;
  TrangThai: string;
  TGTaoMoi: Date;
  DOI: number;
  MaQueQuan: string;
  MaNgheNghiep: string;
  GioiTinh: string;  // ✅ Đúng: 'Nam' hoặc 'Nữ'
  MaNguyenNhanMat?: string;
  NgayGioMat?: Date;
  MaDiaDiem?: string;
  MaGiaPha?: string;

  constructor(thanhvien: ThanhVienType) {
    const date = new Date();
    this.MaTV = thanhvien.MaTV;
    this.HoTen = thanhvien.HoTen || '';
    this.NgayGioSinh = thanhvien.NgayGioSinh || new Date();
    this.DiaChi = thanhvien.DiaChi || '';
    this.TrangThai = thanhvien.TrangThai || 'Còn Sống';
    this.TGTaoMoi = thanhvien.TGTaoMoi || date;
    this.DOI = thanhvien.DOI || 0;
    this.MaQueQuan = thanhvien.MaQueQuan || '';
    this.MaNgheNghiep = thanhvien.MaNgheNghiep || '';
    this.GioiTinh = thanhvien.GioiTinh || 'Nam';  // ✅ Đúng: Mặc định 'Nam'
    this.MaNguyenNhanMat = thanhvien.MaNguyenNhanMat;
    this.NgayGioMat = thanhvien.NgayGioMat;
    this.MaDiaDiem = thanhvien.MaDiaDiem;
    this.MaGiaPha = thanhvien.MaGiaPha;
  }
}