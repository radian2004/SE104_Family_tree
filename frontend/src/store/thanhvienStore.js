/**
 * ============================================
 * THÀNH VIÊN STORE (Zustand)
 * Quản lý dữ liệu thành viên
 * ============================================
 */

import { create } from 'zustand';

/**
 * @typedef {Object} ThanhVienState
 * @property {Array} thanhvienList - Danh sách thành viên
 * @property {Object|null} selectedThanhVien - Thành viên được chọn
 * @property {number} total - Tổng số thành viên
 * @property {number} page - Trang hiện tại
 * @property {number} limit - Số items per page
 * @property {boolean} isLoading - Trạng thái loading
 * @property {string|null} error - Error message
 * @property {Function} setThanhVienList - Set danh sách
 * @property {Function} setSelectedThanhVien - Set thành viên được chọn
 * @property {Function} setPagination - Set pagination info
 * @property {Function} setLoading - Set loading state
 * @property {Function} setError - Set error
 * @property {Function} clearError - Xóa error
 * @property {Function} reset - Reset state
 */

export const useThanhVienStore = create((set) => ({
  // ==================== STATE ====================
  thanhvienList: [],
  selectedThanhVien: null,
  total: 0,
  page: 1,
  limit: 10,
  isLoading: false,
  error: null,

  // ==================== SETTERS ====================
  /**
   * Set danh sách thành viên
   */
  setThanhVienList: (thanhvienList) => set({ thanhvienList }),

  /**
   * Set thành viên được chọn
   */
  setSelectedThanhVien: (selectedThanhVien) => set({ selectedThanhVien }),

  /**
   * Set pagination info
   */
  setPagination: (pagination) =>
    set({
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
    }),

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
   * Add thành viên mới vào list
   */
  addThanhVien: (thanhvien) =>
    set((state) => ({
      thanhvienList: [thanhvien, ...state.thanhvienList],
      total: state.total + 1,
    })),

  /**
   * Update thành viên trong list
   */
  updateThanhVienInList: (MaTV, updatedData) =>
    set((state) => ({
      thanhvienList: state.thanhvienList.map((item) =>
        item.MaTV === MaTV ? { ...item, ...updatedData } : item
      ),
    })),

  /**
   * Remove thành viên khỏi list
   */
  removeThanhVienFromList: (MaTV) =>
    set((state) => ({
      thanhvienList: state.thanhvienList.filter((item) => item.MaTV !== MaTV),
      total: state.total - 1,
    })),

  /**
   * Reset state
   */
  reset: () =>
    set({
      thanhvienList: [],
      selectedThanhVien: null,
      total: 0,
      page: 1,
      limit: 10,
      isLoading: false,
      error: null,
    }),
}));
