// src/models/schemas/QuanHeCon.schema.ts

interface QuanHeConType {
  MaTV: string;
  MaTVCha: string;
  MaTVMe: string;
  NgayPhatSinh?: Date;
}

export default class QuanHeCon {
  MaTV: string;
  MaTVCha: string;
  MaTVMe: string;
  NgayPhatSinh?: Date;

  constructor(quanHeCon: QuanHeConType) {
    this.MaTV = quanHeCon.MaTV;
    this.MaTVCha = quanHeCon.MaTVCha;
    this.MaTVMe = quanHeCon.MaTVMe;
    this.NgayPhatSinh = quanHeCon.NgayPhatSinh;
  }
}