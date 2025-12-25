// src/controllers/thanhvien.controllers.ts
import { Request, Response } from 'express';
import thanhvienService from '~/services/thanhvien.services';
import { GhiNhanThanhVienReqBody } from '~/models/requests/GhiNhanThanhVien.requests';
import { TraCuuThanhVienQuery } from '~/models/requests/TraCuuThanhVien.requests';

// Controller đăng ký thành viên mới
export const registerController = async (req: Request, res: Response) => {
  const { HoTen, NgayGioSinh, DiaChi, MaQueQuan, MaNgheNghiep, GioiTinh, MaGiaPha } = req.body;  // ✅ ĐÚNG

  try {
    const result = await thanhvienService.register({
      HoTen,
      NgayGioSinh: new Date(NgayGioSinh),
      DiaChi,
      MaQueQuan,
      MaNgheNghiep,
      GioiTinh,  // ✅ ĐÚNG: 'Nam' hoặc 'Nữ'
      MaGiaPha
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Lỗi register:', error);
    return res.status(400).json({
      message: 'Đăng ký thất bại',
      error: error.message
    });
  }
};

// Controller lấy tất cả thành viên
export const getAllThanhVienController = async (req: Request, res: Response) => {
  try {
    const result = await thanhvienService.getAllThanhVien();
    return res.status(200).json({
      message: 'Lấy danh sách thành công',
      result: result
    });
  } catch (error: any) {
    console.error('Lỗi getAllThanhVien:', error);
    return res.status(400).json({
      message: 'Lấy danh sách thất bại',
      error: error.message
    });
  }
};

// Controller tìm thành viên theo MaTV
export const getThanhVienByMaTVController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await thanhvienService.findByMaTV(MaTV);

    if (!result) {
      return res.status(404).json({
        message: 'Không tìm thấy thành viên'
      });
    }

    return res.status(200).json({
      message: 'Tìm thành viên thành công',
      result: result
    });
  } catch (error: any) {
    console.error('Lỗi getThanhVienByMaTV:', error);
    return res.status(400).json({
      message: 'Tìm thành viên thất bại',
      error: error.message
    });
  }
};

// Controller cập nhật thành viên
export const updateThanhVienController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;
  const payload = req.body;

  try {
    const result = await thanhvienService.updateThanhVien(MaTV, payload);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Lỗi updateThanhVien:', error);
    return res.status(400).json({
      message: 'Cập nhật thất bại',
      error: error.message
    });
  }
};

// Controller xóa thành viên
export const deleteThanhVienController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await thanhvienService.deleteThanhVien(MaTV);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Lỗi deleteThanhVien:', error);
    return res.status(400).json({
      message: 'Xóa thất bại',
      error: error.message
    });
  }
};

/**
 * ✅ MỚI: Controller lấy báo cáo tăng giảm thành viên
 * GET /thanhvien/baocao/tanggiam
 * Query params: 
 * - NamBatDau: Năm bắt đầu (required)
 * - NamKetThuc: Năm kết thúc (required)
 * 
 * Response: {
 *   message: string,
 *   result: {
 *     NamBatDau: number,
 *     NamKetThuc: number,
 *     TongSinh: number,
 *     TongKetHon: number,
 *     TongMat: number,
 *     TangGiamRong: number,
 *     DanhSach: [{ STT, Nam, SoLuongSinh, SoLuongKetHon, SoLuongMat }]
 *   }
 * }
 */
export const getBaoCaoTangGiamController = async (req: Request, res: Response) => {
  try {
    const { NamBatDau, NamKetThuc } = req.query;

    // Validate input
    if (!NamBatDau || !NamKetThuc) {
      return res.status(400).json({
        message: 'Thiếu thông tin: NamBatDau và NamKetThuc là bắt buộc'
      });
    }

    const namBatDau = parseInt(NamBatDau as string);
    const namKetThuc = parseInt(NamKetThuc as string);

    // Validate số hợp lệ
    if (isNaN(namBatDau) || isNaN(namKetThuc)) {
      return res.status(400).json({
        message: 'NamBatDau và NamKetThuc phải là số nguyên hợp lệ'
      });
    }

    const result = await thanhvienService.getBaoCaoTangGiam(namBatDau, namKetThuc);

    return res.status(200).json({
      message: 'Lấy báo cáo tăng giảm thành viên thành công',
      result
    });
  } catch (error: any) {
    console.error('Lỗi getBaoCaoTangGiam:', error);
    
    // Xử lý lỗi validation từ service
    if (error.message.includes('Năm') || error.message.includes('năm')) {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: 'Lỗi lấy báo cáo tăng giảm thành viên',
      error: error.message
    });
  }
};

/**
 * Controller ghi nhận thành viên mới với quan hệ
 * POST /thanhvien/ghi-nhan
 */
export const ghiNhanThanhVienController = async (req: Request, res: Response) => {
  const payload: GhiNhanThanhVienReqBody = req.body;
  
  try {
    // Validate cơ bản
    if (!payload.HoTen || !payload.NgayGioSinh || !payload.GioiTinh || 
        !payload.DiaChi || !payload.MaQueQuan || !payload.MaTVCu || 
        !payload.LoaiQuanHe || !payload.NgayPhatSinh) {
      return res.status(400).json({
        message: 'Thiếu thông tin bắt buộc',
        error: 'Vui lòng điền đầy đủ các trường: HoTen, NgayGioSinh, GioiTinh, DiaChi, MaQueQuan, MaTVCu, LoaiQuanHe, NgayPhatSinh'
      });
    }
    
    // Validate giới tính
    if (payload.GioiTinh !== 'Nam' && payload.GioiTinh !== 'Nữ') {
      return res.status(400).json({
        message: 'Giới tính không hợp lệ',
        error: 'Giới tính phải là "Nam" hoặc "Nữ"'
      });
    }
    
    // Validate loại quan hệ
    if (payload.LoaiQuanHe !== 'Con cái' && payload.LoaiQuanHe !== 'Vợ/Chồng') {
      return res.status(400).json({
        message: 'Loại quan hệ không hợp lệ',
        error: 'Loại quan hệ phải là "Con cái" hoặc "Vợ/Chồng"'
      });
    }
    
    // Gọi service
    const result = await thanhvienService.ghiNhanThanhVien(payload);
    
    return res.status(201).json(result);
    
  } catch (error: any) {
    console.error('Lỗi ghiNhanThanhVien:', error);
    
    // Xử lý lỗi từ trigger MySQL
    if (error.message.includes('Giới tính của cha phải là Nam')) {
      return res.status(400).json({
        message: 'Lỗi nghiệp vụ',
        error: 'Giới tính của cha phải là Nam'
      });
    }
    
    if (error.message.includes('Giới tính của mẹ phải là Nữ')) {
      return res.status(400).json({
        message: 'Lỗi nghiệp vụ',
        error: 'Giới tính của mẹ phải là Nữ'
      });
    }
    
    if (error.message.includes('Ngày sinh của con phải sau ngày sinh')) {
      return res.status(400).json({
        message: 'Lỗi nghiệp vụ',
        error: error.message
      });
    }
    
    return res.status(400).json({
      message: 'Ghi nhận thành viên thất bại',
      error: error.message
    });
  }
};

/**
 * Controller lấy danh sách thành viên có thể làm cha/mẹ/vợ/chồng
 * GET /thanhvien/available-relations
 */
export const getAvailableRelationsController = async (req: Request, res: Response) => {
  try {
    const result = await thanhvienService.getAvailableParents();
    
    return res.status(200).json({
      message: 'Lấy danh sách thành viên thành công',
      result: result
    });
    
  } catch (error: any) {
    console.error('Lỗi getAvailableRelations:', error);
    return res.status(400).json({
      message: 'Lấy danh sách thất bại',
      error: error.message
    });
  }
};

/**
 * Controller tra cứu thành viên với đầy đủ thông tin gia phả
 * GET /thanhvien/tra-cuu
 */
export const traCuuThanhVienController = async (req: Request, res: Response) => {
  try {
    // Lấy query parameters
    const query: TraCuuThanhVienQuery = {
      search: req.query.search as string,
      doi: req.query.doi ? parseInt(req.query.doi as string) : undefined,
      maGiaPha: req.query.maGiaPha as string,
      trangThai: req.query.trangThai as string,
      sortBy: req.query.sortBy as 'doi' | 'ngaySinh' | 'hoTen',
      order: req.query.order as 'asc' | 'desc',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };
    
    // Gọi service
    const result = await thanhvienService.traCuuThanhVien(query);
    
    return res.status(200).json(result);
    
  } catch (error: any) {
    console.error('Lỗi traCuuThanhVien:', error);
    return res.status(500).json({
      message: 'Tra cứu thành viên thất bại',
      error: error.message
    });
  }
};