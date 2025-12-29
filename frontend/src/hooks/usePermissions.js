/**
 * ============================================
 * USE PERMISSIONS HOOK
 * Kiểm tra quyền của user dựa trên MaLoaiTK
 * ============================================
 * 
 * Bảng phân quyền:
 * - LTK01: Quản trị hệ thống (Admin) - Full access
 * - LTK02: Người lập cây gia phả (Owner) - Quản lý gia phả
 * - LTK03: Thành viên (User) - Quyền hạn chế
 */

import { useAuthStore } from '../store/authStore';

// Constants cho các loại tài khoản
export const ACCOUNT_TYPES = {
    ADMIN: 'LTK01',   // Quản trị hệ thống
    OWNER: 'LTK02',   // Người lập cây gia phả
    USER: 'LTK03',    // Thành viên
};

// Tên hiển thị cho các loại tài khoản
export const ACCOUNT_TYPE_NAMES = {
    LTK01: 'Quản trị hệ thống',
    LTK02: 'Người lập cây gia phả',
    LTK03: 'Thành viên',
};

// Icon cho các loại tài khoản
export const ACCOUNT_TYPE_ICONS = {
    LTK01: '👑',
    LTK02: '🏠',
    LTK03: '👤',
};

/**
 * Custom hook để kiểm tra quyền của user
 */
export const usePermissions = () => {
    const user = useAuthStore((state) => state.user);
    const MaLoaiTK = user?.MaLoaiTK || user?.LoaiTaiKhoan;

    // Role checks
    const isAdmin = MaLoaiTK === ACCOUNT_TYPES.ADMIN;
    const isOwner = MaLoaiTK === ACCOUNT_TYPES.OWNER;
    const isUser = MaLoaiTK === ACCOUNT_TYPES.USER;

    // ========== PERMISSIONS BASED ON TABLE ==========

    // 1. Tiếp nhận thành viên - Admin, Owner
    const canAddMember = isAdmin || isOwner;

    // 2. Tra cứu thành viên - All
    const canSearchMember = true;

    // 3. Ghi nhận thành tích - Admin, Owner
    const canRecordAchievement = isAdmin || isOwner;

    // 4. Tra cứu thành tích - All
    const canSearchAchievement = true;

    // 5. Ghi nhận kết thúc - Admin, Owner
    const canRecordDeath = isAdmin || isOwner;

    // 6. Tra cứu kết thúc - All
    const canSearchDeath = true;

    // 7. Lập báo cáo năm - All
    const canCreateReport = true;

    // 8. Thay đổi quy định - Admin, Owner
    const canChangeSettings = isAdmin || isOwner;

    // 9. Phân quyền - Admin ONLY
    const canManagePermissions = isAdmin;

    // 10. Thêm danh mục thu/chi - Admin, Owner
    const canAddCategory = isAdmin || isOwner;

    // 11. Ghi nhận thu quỹ họ - Owner + Check NguoiDamNhan in UI
    const canRecordIncome = isOwner;

    // 12. Ghi nhận chi quỹ họ - Owner + Check NguoiDamNhan in UI
    const canRecordExpense = isOwner;

    // 13. Tra cứu danh mục thu/chi - All
    const canSearchCategory = true;

    // ========== ADDITIONAL PERMISSIONS ==========

    // Có thể sửa thành viên
    const canEditMember = isAdmin || isOwner;

    // Có thể xóa thành viên
    const canDeleteMember = isAdmin || isOwner;

    // Có thể xem trang admin
    const canAccessAdmin = isAdmin;

    // Có thể quản lý gia phả
    const canManageFamilyTree = isAdmin || isOwner;

    return {
        // Role info
        isAdmin,
        isOwner,
        isUser,
        roleName: ACCOUNT_TYPE_NAMES[MaLoaiTK] || 'Unknown',
        roleIcon: ACCOUNT_TYPE_ICONS[MaLoaiTK] || '❓',
        MaLoaiTK,

        // Permission flags (từ bảng phân quyền)
        canAddMember,           // 1. Tiếp nhận thành viên
        canSearchMember,        // 2. Tra cứu thành viên
        canRecordAchievement,   // 3. Ghi nhận thành tích
        canSearchAchievement,   // 4. Tra cứu thành tích
        canRecordDeath,         // 5. Ghi nhận kết thúc
        canSearchDeath,         // 6. Tra cứu kết thúc
        canCreateReport,        // 7. Lập báo cáo năm
        canChangeSettings,      // 8. Thay đổi quy định
        canManagePermissions,   // 9. Phân quyền (Admin only!)
        canAddCategory,         // 10. Thêm danh mục thu/chi
        canRecordIncome,        // 11. Ghi nhận thu quỹ họ
        canRecordExpense,       // 12. Ghi nhận chi quỹ họ
        canSearchCategory,      // 13. Tra cứu danh mục thu/chi

        // Additional permissions
        canEditMember,
        canDeleteMember,
        canAccessAdmin,
        canManageFamilyTree,
    };
};

/**
 * Helper function để lấy tên loại tài khoản
 */
export const getAccountTypeName = (MaLoaiTK) => {
    return ACCOUNT_TYPE_NAMES[MaLoaiTK] || 'Unknown';
};

/**
 * Helper function để lấy icon loại tài khoản
 */
export const getAccountTypeIcon = (MaLoaiTK) => {
    return ACCOUNT_TYPE_ICONS[MaLoaiTK] || '❓';
};

export default usePermissions;
