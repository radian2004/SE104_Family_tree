// src/controllers/thanhvien.controllers.ts
import { Request, Response } from 'express';
import thanhvienService from '~/services/thanhvien.services';

// Controller đăng ký thành viên mới
export const registerController = async (req: Request, res: Response) => {
  const { HoTen, NgayGioSinh, DiaChi, MaQueQuan, MaNgheNghiep, MaGioiTinh, MaGiaPha } = req.body;

  try {
    const result = await thanhvienService.register({
      HoTen,
      NgayGioSinh: new Date(NgayGioSinh), // Convert string to Date
      DiaChi,
      MaQueQuan,
      MaNgheNghiep,
      MaGioiTinh,
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