// src/models/schemas/LoaiThanhTich.schema.ts

interface LoaiThanhTichType {
  MaLTT: string;
  TenLTT: string;
}

export default class LoaiThanhTich {
  MaLTT: string;
  TenLTT: string;

  constructor(loaiThanhTich: LoaiThanhTichType) {
    this.MaLTT = loaiThanhTich.MaLTT;
    this.TenLTT = loaiThanhTich.TenLTT;
  }
}