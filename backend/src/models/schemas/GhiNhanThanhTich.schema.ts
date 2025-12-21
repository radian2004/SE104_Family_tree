// src/models/schemas/GhiNhanThanhTich.schema.ts

interface GhiNhanThanhTichType {
  MaLTT: string;
  MaTV: string;
  NgayPhatSinh?: Date;
}

export default class GhiNhanThanhTich {
  MaLTT: string;
  MaTV: string;
  NgayPhatSinh: Date;

  constructor(ghiNhanThanhTich: GhiNhanThanhTichType) {
    this.MaLTT = ghiNhanThanhTich.MaLTT;
    this.MaTV = ghiNhanThanhTich.MaTV;
    this.NgayPhatSinh = ghiNhanThanhTich.NgayPhatSinh || new Date();
  }
}