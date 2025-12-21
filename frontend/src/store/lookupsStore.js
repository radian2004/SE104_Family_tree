/**
 * ============================================
 * LOOKUPS STORE (Zustand)
 * Quản lý dữ liệu tĩnh: giới tính, quê quán, etc.
 * ============================================
 */

import { create } from 'zustand';

/**
 * @typedef {Object} LookupsState
 * @property {Array} gioiTinh - Danh sách giới tính
 * @property {Array} queQuan - Danh sách quê quán
 * @property {Array} ngheNghiep - Danh sách nghề nghiệp
 * @property {Array} cayGiaPha - Danh sách gia phả
 * @property {Array} loaiTaiKhoan - Danh sách loại tài khoản
 * @property {boolean} isLoading - Trạng thái loading
 * @property {string|null} error - Error message
 * @property {Function} setGioiTinh - Set giới tính
 * @property {Function} setQueQuan - Set quê quán
 * @property {Function} setNgheNghiep - Set nghề nghiệp
 * @property {Function} setCayGiaPha - Set gia phả
 * @property {Function} setLoaiTaiKhoan - Set loại tài khoản
 * @property {Function} setLoading - Set loading state
 * @property {Function} setError - Set error
 * @property {Function} clearError - Xóa error
 */

export const useLookupsStore = create((set) => ({
  // ==================== STATE ====================
  gioiTinh: [],
  queQuan: [],
  ngheNghiep: [],
  cayGiaPha: [],
  loaiTaiKhoan: [],
  isLoading: false,
  error: null,

  // ==================== SETTERS ====================
  /**
   * Set giới tính
   */
  setGioiTinh: (gioiTinh) => set({ gioiTinh }),

  /**
   * Set quê quán
   */
  setQueQuan: (queQuan) => set({ queQuan }),

  /**
   * Set nghề nghiệp
   */
  setNgheNghiep: (ngheNghiep) => set({ ngheNghiep }),

  /**
   * Set gia phả
   */
  setCayGiaPha: (cayGiaPha) => set({ cayGiaPha }),

  /**
   * Set loại tài khoản
   */
  setLoaiTaiKhoan: (loaiTaiKhoan) => set({ loaiTaiKhoan }),

  /**
   * Set loading state
   */
  setLoading: (isLoading) => set({ isLoading }),

  /**
   * Set error message
   */
  setError: (error) => set({ error }),

  /**
   * Clear error message
   */
  clearError: () => set({ error: null }),

  /**
   * Set tất cả lookups cùng lúc
   */
  setAllLookups: (lookups) =>
    set({
      gioiTinh: lookups.gioiTinh || [],
      queQuan: lookups.queQuan || [],
      ngheNghiep: lookups.ngheNghiep || [],
      cayGiaPha: lookups.cayGiaPha || [],
      loaiTaiKhoan: lookups.loaiTaiKhoan || [],
    }),

  /**
   * Reset state
   */
  reset: () =>
    set({
      gioiTinh: [],
      queQuan: [],
      ngheNghiep: [],
      cayGiaPha: [],
      loaiTaiKhoan: [],
      isLoading: false,
      error: null,
    }),
}));
