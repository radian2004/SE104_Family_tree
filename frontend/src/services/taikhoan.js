/**
 * ============================================
 * TÀI KHOẢN SERVICE
 * API client cho quản lý tài khoản (Admin)
 * ============================================
 */

import apiClient from '../api/client';

/**
 * Lấy danh sách tất cả tài khoản
 * @param {Object} filters - Bộ lọc
 * @param {string} filters.search - Tìm kiếm theo email/tên
 * @param {string} filters.MaLoaiTK - Lọc theo loại tài khoản
 * @returns {Promise<Array>} Danh sách tài khoản
 */
export const getAllAccounts = async (filters = {}) => {
    const response = await apiClient.get('/taikhoan', { params: filters });
    return response.data;
};

/**
 * Lấy danh sách loại tài khoản
 * @returns {Promise<Array>} Danh sách loại tài khoản
 */
export const getAccountTypes = async () => {
    const response = await apiClient.get('/taikhoan/types');
    return response.data;
};

/**
 * Cấp quyền Owner (LTK02) cho tài khoản
 * @param {string} email - Email của tài khoản cần cấp quyền
 * @returns {Promise<Object>} Kết quả cấp quyền
 */
export const promoteToOwner = async (email) => {
    const response = await apiClient.put(`/taikhoan/${encodeURIComponent(email)}/promote`);
    return response.data;
};

/**
 * Hạ quyền về User (LTK03)
 * @param {string} email - Email của tài khoản cần hạ quyền
 * @returns {Promise<Object>} Kết quả hạ quyền
 */
export const demoteToUser = async (email) => {
    const response = await apiClient.put(`/taikhoan/${encodeURIComponent(email)}/demote`);
    return response.data;
};

export const taikhoanService = {
    getAllAccounts,
    getAccountTypes,
    promoteToOwner,
    demoteToUser,
};

export default taikhoanService;
