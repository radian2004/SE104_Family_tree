// src/models/schemas/QuanHeCon.schema.ts

interface QuanHeConType {
  MaTV: string;
  MaTVCha?: string | null;
  MaTVMe?: string | null;
  NgayPhatSinh?: Date;
}

export default class QuanHeCon {
  MaTV: string;
  MaTVCha?: string | null;
  MaTVMe?: string | null;
  NgayPhatSinh?: Date;

  constructor(quanHeCon: QuanHeConType) {
    this.MaTV = quanHeCon.MaTV;
    this.MaTVCha = quanHeCon.MaTVCha || null;
    this.MaTVMe = quanHeCon.MaTVMe || null;
    this.NgayPhatSinh = quanHeCon.NgayPhatSinh;
  }
}