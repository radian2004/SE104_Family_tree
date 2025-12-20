import { Request, Response } from 'express';
import ghiNhanThanhVienService from '~/services/ghinhanthanhvien.services';

/**
 * POST /ghinhanthanhvien
 * Ghi nhận thành viên mới với quan hệ
 */
export const ghiNhanThanhVienController = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Validation cơ bản (có thể tách ra middleware)
    if (!payload.HoTen || !payload.NgayGioSinh || !payload.GioiTinh || 
        !payload.DiaChi || !payload.MaQueQuan || !payload.MaTVCu || 
        !payload.LoaiQuanHe || !payload.NgayPhatSinh) {
      return res.status(400).json({
        message: 'Thiếu thông tin bắt buộc',
        required: ['HoTen', 'NgayGioSinh', 'GioiTinh', 'DiaChi', 'MaQueQuan', 'MaTVCu', 'LoaiQuanHe', 'NgayPhatSinh']
      });
    }
    
    if (!['Nam', 'Nữ'].includes(payload.GioiTinh)) {
      return res.status(400).json({
        message: 'Giới tính phải là "Nam" hoặc "Nữ"'
      });
    }
    
    if (!['Con cái', 'Vợ/Chồng'].includes(payload.LoaiQuanHe)) {
      return res.status(400).json({
        message: 'Loại quan hệ phải là "Con cái" hoặc "Vợ/Chồng"'
      });
    }
    
    const result = await ghiNhanThanhVienService.ghiNhanThanhVien(payload);
    
    return res.status(201).json(result);
    
  } catch (error: any) {
    console.error('Lỗi ghiNhanThanhVien:', error);
    
    // Xử lý lỗi từ trigger MySQL
    if (error.message.includes('Giới tính của cha phải là Nam')) {
      return res.status(400).json({
        message: 'Thành viên cũ được chọn làm cha phải có giới tính Nam',
        error: error.message
      });
    }
    
    if (error.message.includes('Giới tính của mẹ phải là Nữ')) {
      return res.status(400).json({
        message: 'Thành viên cũ được chọn làm mẹ phải có giới tính Nữ',
        error: error.message
      });
    }
    
    if (error.message.includes('Ngày sinh của con phải sau ngày sinh')) {
      return res.status(400).json({
        message: 'Ngày sinh của con phải sau ngày sinh của cha/mẹ',
        error: error.message
      });
    }
    
    return res.status(400).json({
      message: 'Ghi nhận thất bại',
      error: error.message
    });
  }
};

/**
 * GET /ghinhanthanhvien/tracuu
 * Tra cứu lịch sử ghi nhận thành viên
 */
export const traCuuGhiNhanController = async (req: Request, res: Response) => {
  try {
    const filters = {
      HoTenMoi: req.query.HoTenMoi as string,
      HoTenCu: req.query.HoTenCu as string,
      LoaiQuanHe: req.query.LoaiQuanHe as 'Con cái' | 'Vợ/Chồng',
      TuNgay: req.query.TuNgay as string,
      DenNgay: req.query.DenNgay as string
    };
    
    const result = await ghiNhanThanhVienService.traCuuGhiNhan(filters);
    
    return res.status(200).json({
      message: 'Tra cứu thành công',
      total: result.length,
      data: result
    });
    
  } catch (error: any) {
    console.error('Lỗi traCuuGhiNhan:', error);
    return res.status(400).json({
      message: 'Tra cứu thất bại',
      error: error.message
    });
  }
};

/**
 * GET /ghinhanthanhvien/thanhviencu/:MaTV
 * Lấy thông tin thành viên cũ (để hiển thị trong form)
 */
export const getThanhVienCuController = async (req: Request, res: Response) => {
  try {
    const { MaTV } = req.params;
    
    const result = await ghiNhanThanhVienService.getThanhVienCu(MaTV);
    
    if (!result) {
      return res.status(404).json({
        message: 'Không tìm thấy thành viên hoặc thành viên đã mất'
      });
    }
    
    return res.status(200).json({
      message: 'Lấy thông tin thành công',
      data: result
    });
    
  } catch (error: any) {
    console.error('Lỗi getThanhVienCu:', error);
    return res.status(400).json({
      message: 'Lấy thông tin thất bại',
      error: error.message
    });
  }
};