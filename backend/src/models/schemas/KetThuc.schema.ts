export interface KetThucRow {
  MaTV: string
  HoTen: string
  NgayGioSinh: Date | null
  NgayGioMat: Date | null
  MaNguyenNhanMat: string | null
  TenNguyenNhanMat: string | null
  MaDiaDiem: string | null
  TenDiaDiem: string | null
  TrangThai: string
}

export interface TraCuuKetThucResult {
  STT: number
  MaTV: string
  HoTen: string
  NgayGioMat: string | null
  TenNguyenNhanMat: string
  TenDiaDiem: string
}

export interface GhiNhanKetThucPayload {
  MaTV: string
  NgayGioMat: string // Format: 'YYYY-MM-DD HH:mm:ss'
  MaNguyenNhanMat: string
  MaDiaDiem: string
}

export interface TraCuuKetThucFilters {
  HoTen?: string                // Tìm theo họ tên thành viên (LIKE)
  MaNguyenNhanMat?: string      // Tìm theo mã nguyên nhân (bỏ trong V2)
  TenNguyenNhanMat?: string     // ⭐ MỚI: Tìm theo tên nguyên nhân (LIKE)
  MaDiaDiem?: string            // Tìm theo mã địa điểm (bỏ trong V2)
  TenDiaDiem?: string           // ⭐ MỚI: Tìm theo tên địa điểm (LIKE)
  TuNgay?: string               // Lọc từ ngày (YYYY-MM-DD)
  DenNgay?: string              // Lọc đến ngày (YYYY-MM-DD)
}