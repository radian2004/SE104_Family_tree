// src/controllers/thanhvien.controllers.ts
import { Request, Response } from 'express';
import thanhvienService from '~/services/thanhvien.services';
import { GhiNhanThanhVienReqBody } from '~/models/requests/GhiNhanThanhVien.requests';
import { TraCuuThanhVienQuery } from '~/models/requests/TraCuuThanhVien.requests';

// Controller đăng ký thành viên mới
export const registerController = async (req: Request, res: Response) => {
  const { HoTen, NgayGioSinh, DiaChi, MaQueQuan, MaNgheNghiep, GioiTinh, MaGiaPha } = req.body;  // ✅ ĐÚNG

  console.log('[registerController] Request body:', { HoTen, NgayGioSinh, DiaChi, MaQueQuan, MaNgheNghiep, GioiTinh, MaGiaPha });

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

    console.log('[registerController] Success:', result);
    return res.status(201).json(result);
  } catch (error: any) {
    console.error('[registerController] Error:', error);
    console.error('[registerController] Error code:', error.code);
    console.error('[registerController] SQL Message:', error.sqlMessage);
    return res.status(400).json({
      message: 'Đăng ký thất bại',
      error: error.sqlMessage || error.message,
      code: error.code
    });
  }
};

// Controller lấy tất cả thành viên với filter/sort
export const getAllThanhVienController = async (req: Request, res: Response) => {
  const userInfo = req.userInfo!;

  try {
    const result = await thanhvienService.getAllThanhVien(userInfo);
    return res.status(200).json({
      message: 'Lấy danh sách thành công',
      total: result.length,
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
  const userInfo = req.userInfo!;
  const { NamBatDau, NamKetThuc } = req.query;

  try {
    const result = await thanhvienService.getBaoCaoTangGiam(
      Number(NamBatDau),
      Number(NamKetThuc),
      userInfo
    );

    return res.status(200).json({
      message: 'Lấy báo cáo thành công',
      result: result
    });
  } catch (error: any) {
    console.error('Lỗi getBaoCaoTangGiam:', error);
    return res.status(400).json({
      message: 'Lấy báo cáo thất bại',
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
  const { search, doi, maGiaPha, trangThai } = req.query as unknown as TraCuuThanhVienQuery;
  const userInfo = req.userInfo!;

  try {
    const result = await thanhvienService.traCuuThanhVien(
      { search, doi, maGiaPha, trangThai },
      userInfo
    );

    return res.status(200).json(result);  // result đã có message
  } catch (error: any) {
    console.error('Lỗi traCuuThanhVien:', error);
    return res.status(400).json({
      message: 'Tra cứu thất bại',
      error: error.message
    });
  }
};

export const xoaMaGiaPhaController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await thanhvienService.xoaMaGiaPhaThanhVien(MaTV);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Lỗi xoaMaGiaPha:', error);

    // Xử lý lỗi cụ thể
    if (error.message === 'Không tìm thấy thành viên') {
      return res.status(404).json({
        message: 'Không tìm thấy thành viên',
        error: error.message
      });
    }

    if (error.message === 'Thành viên chưa có mã gia phả để xóa') {
      return res.status(400).json({
        message: 'Thành viên chưa có mã gia phả',
        error: error.message
      });
    }

    return res.status(500).json({
      message: 'Xóa mã gia phả thất bại',
      error: error.message
    });
  }
};

export const capNhatTruongTocController = async (req: Request, res: Response) => {
  const { MaGiaPha, MaTVTruongTocMoi } = req.body;

  try {
    // Validate input
    if (!MaGiaPha || !MaTVTruongTocMoi) {
      return res.status(400).json({
        message: 'Thiếu thông tin',
        error: 'Các trường MaGiaPha và MaTVTruongTocMoi là bắt buộc'
      });
    }

    const result = await thanhvienService.capNhatTruongTocGiaPha(
      MaGiaPha,
      MaTVTruongTocMoi
    );

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Lỗi capNhatTruongToc:', error);

    // Xử lý lỗi cụ thể
    if (error.message === 'Không tìm thấy gia phả') {
      return res.status(404).json({
        message: 'Không tìm thấy gia phả',
        error: error.message
      });
    }

    if (error.message === 'Không tìm thấy thành viên') {
      return res.status(404).json({
        message: 'Không tìm thấy thành viên',
        error: error.message
      });
    }

    if (error.message === 'Thành viên không thuộc gia phả này') {
      return res.status(400).json({
        message: 'Thành viên không hợp lệ',
        error: error.message
      });
    }

    if (error.message === 'Thành viên này đã là trưởng tộc hiện tại') {
      return res.status(400).json({
        message: 'Thành viên đã là trưởng tộc',
        error: error.message
      });
    }

    return res.status(500).json({
      message: 'Cập nhật trưởng tộc thất bại',
      error: error.message
    });
  }
};

/**
 * Controller lấy thông tin gia phả của thành viên
 * GET /api/thanhvien/:MaTV/gia-pha
 */
export const getGiaPhaThanhVienController = async (req: Request, res: Response) => {
  const { MaTV } = req.params;

  try {
    const result = await thanhvienService.getThanhVienGiaPhaInfo(MaTV);

    return res.status(200).json({
      message: 'Lấy thông tin gia phả thành công',
      data: result
    });

  } catch (error: any) {
    console.error('Lỗi getGiaPhaThanhVien:', error);

    if (error.message === 'Không tìm thấy thành viên') {
      return res.status(404).json({
        message: 'Không tìm thấy thành viên',
        error: error.message
      });
    }

    return res.status(500).json({
      message: 'Lấy thông tin gia phả thất bại',
      error: error.message
    });
  }
};

/**
 * Controller lấy danh sách tất cả các gia phả
 * GET /api/thanhvien/gia-pha/danh-sach
 */
export const getAllGiaPhaController = async (req: Request, res: Response) => {
  try {
    const result = await thanhvienService.getAllGiaPha();

    return res.status(200).json({
      message: 'Lấy danh sách gia phả thành công',
      data: result
    });

  } catch (error: any) {
    console.error('Lỗi getAllGiaPha:', error);

    return res.status(500).json({
      message: 'Lấy danh sách gia phả thất bại',
      error: error.message
    });
  }
};