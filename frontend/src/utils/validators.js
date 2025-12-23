/**
 * ============================================
 * VALIDATORS
 * ============================================
 */

import { z } from 'zod';
import { VALIDATION_RULES } from './constants';

// ==================== AUTH VALIDATORS ====================
export const loginSchema = z.object({
  email: z
    .string('Email là bắt buộc')
    .email('Email không hợp lệ'),
  password: z
    .string('Mật khẩu là bắt buộc')
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH,
      `Mật khẩu phải ít nhất ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} ký tự`),
});

export const registerSchema = z.object({
  name: z
    .string('Họ tên là bắt buộc')
    .min(VALIDATION_RULES.NAME_MIN_LENGTH,
      `Họ tên phải ít nhất ${VALIDATION_RULES.NAME_MIN_LENGTH} ký tự`)
    .max(VALIDATION_RULES.NAME_MAX_LENGTH,
      `Họ tên không vượt quá ${VALIDATION_RULES.NAME_MAX_LENGTH} ký tự`),
  email: z
    .string('Email là bắt buộc')
    .email('Email không hợp lệ'),
  password: z
    .string('Mật khẩu là bắt buộc')
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH,
      `Mật khẩu phải ít nhất ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} ký tự`),
  confirm_password: z
    .string('Xác nhận mật khẩu là bắt buộc'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Mật khẩu không trùng khớp',
  path: ['confirm_password'],
});

// ==================== THÀNH VIÊN VALIDATORS ====================
export const createThanhVienSchema = z.object({
  HoTen: z
    .string('Họ tên là bắt buộc')
    .min(VALIDATION_RULES.NAME_MIN_LENGTH,
      `Họ tên phải ít nhất ${VALIDATION_RULES.NAME_MIN_LENGTH} ký tự`)
    .max(VALIDATION_RULES.NAME_MAX_LENGTH,
      `Họ tên không vượt quá ${VALIDATION_RULES.NAME_MAX_LENGTH} ký tự`),
  NgayGioSinh: z
    .string('Ngày giờ sinh là bắt buộc')
    .refine((date) => new Date(date) <= new Date(),
      'Ngày sinh không thể là ngày trong tương lai'),
  DiaChi: z
    .string('Địa chỉ là bắt buộc')
    .min(1, 'Địa chỉ không thể trống'),
  GioiTinh: z
    .string('Giới tính là bắt buộc')
    .min(1, 'Vui lòng chọn giới tính'),
  MaQueQuan: z
    .string('Quê quán là bắt buộc')
    .min(1, 'Vui lòng chọn quê quán'),
  MaNgheNghiep: z
    .string('Nghề nghiệp là bắt buộc')
    .min(1, 'Vui lòng chọn nghề nghiệp'),
  MaGiaPha: z
    .string('Gia phả là bắt buộc')
    .min(1, 'Vui lòng chọn gia phả')
    .optional(),
});

export const updateThanhVienSchema = createThanhVienSchema.partial();

// ==================== HELPER FUNCTIONS ====================
/**
 * Validate dữ liệu với schema
 * @param {object} schema - Zod schema
 * @param {object} data - Dữ liệu cần validate
 * @returns {Promise<{success: boolean, errors?: object, data?: object}>}
 */
export const validateData = async (schema, data) => {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData };
  } catch (error) {
    const errors = {};
    // Zod errors - error.issues là mảng các lỗi
    if (error.issues && Array.isArray(error.issues)) {
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
    }
    return { success: false, errors };
  }
};
