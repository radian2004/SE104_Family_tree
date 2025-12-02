// src/models/schemas/ThanhVien.schema.ts

// Interface định nghĩa thành viên cần những gì khi tạo
interface ThanhVienType {
  MaTV?: string; // optional vì có trigger tự sinh
  HoTen?: string;
  NgayGioSinh?: Date;
  DiaChi?: string;
  TrangThai?: string; // 'Sống' hoặc 'Mất'
  TGTaoMoi?: Date;
  DOI?: number; // Đời (thế hệ)
  MaQueQuan?: string;
  MaNgheNghiep?: string;
  MaGioiTinh?: string;
  MaGiaPha?: string;
}

// Class sử dụng interface để tạo thành viên đầy đủ thông tin
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
  MaGioiTinh: string;
  MaGiaPha?: string;

  constructor(thanhvien: ThanhVienType) {
    const date = new Date(); // Cho TGTaoMoi

    // MaTV sẽ được trigger tự sinh, không cần gán
    this.MaTV = thanhvien.MaTV;
    this.HoTen = thanhvien.HoTen || '';
    this.NgayGioSinh = thanhvien.NgayGioSinh || new Date();
    this.DiaChi = thanhvien.DiaChi || '';
    this.TrangThai = thanhvien.TrangThai || 'Sống';
    this.TGTaoMoi = thanhvien.TGTaoMoi || date;
    this.DOI = thanhvien.DOI || 0;
    this.MaQueQuan = thanhvien.MaQueQuan || '';
    this.MaNgheNghiep = thanhvien.MaNgheNghiep || '';
    this.MaGioiTinh = thanhvien.MaGioiTinh || '';
    this.MaGiaPha = thanhvien.MaGiaPha;
  }
}
