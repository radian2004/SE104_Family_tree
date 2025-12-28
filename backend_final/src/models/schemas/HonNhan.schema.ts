// src/models/schemas/HonNhan.schema.ts

interface HonNhanType {
  MaTV: string;
  MaTVVC: string;
  NgayBatDau: Date;
  NgayKetThuc?: Date;
}

export default class HonNhan {
  MaTV: string;
  MaTVVC: string;
  NgayBatDau: Date;
  NgayKetThuc?: Date;

  constructor(honNhan: HonNhanType) {
    this.MaTV = honNhan.MaTV;
    this.MaTVVC = honNhan.MaTVVC;
    this.NgayBatDau = honNhan.NgayBatDau;
    this.NgayKetThuc = honNhan.NgayKetThuc;
  }
}