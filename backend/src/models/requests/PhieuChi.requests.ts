// src/models/requests/PhieuChi.requests.ts

// Request body cho tạo phiếu chi
export interface CreatePhieuChiReqBody {
  MaDMC: string;       // Mã danh mục chi
  SoTienChi: number;   // Số tiền chi
  LyDoChi: string;     // Lý do chi
}

// Request body cho cập nhật phiếu chi
export interface UpdatePhieuChiReqBody {
  SoTienChi?: number;
  LyDoChi?: string;
}