// src/models/schemas/BaoCaoThanhTich.schema.ts

interface BaoCaoThanhTichType {
  Nam: number;
  MaLTT: string;
  SoLuong: number;
}

export default class BaoCaoThanhTich {
  Nam: number;
  MaLTT: string;
  SoLuong: number;

  constructor(baoCao: BaoCaoThanhTichType) {
    this.Nam = baoCao.Nam;
    this.MaLTT = baoCao.MaLTT;
    this.SoLuong = baoCao.SoLuong;
  }
}