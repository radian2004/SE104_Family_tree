/**
 * ============================================
 * ADMIN ROUTE COMPONENT
 * Chỉ cho phép Admin (LTK01) truy cập
 * ============================================
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';

/**
 * AdminRoute - chỉ Admin (LTK01) mới vào được
 * Redirect về dashboard nếu không phải admin
 */
export const AdminRoute = ({ children }) => {
    const { isLoggedIn, isLoading } = useAuthStore();
    const { isAdmin } = usePermissions();
    const location = useLocation();

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-center">
                    <div className="spinner mb-4"></div>
                    <p className="text-gray-400">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        );
    }

    // Chưa đăng nhập -> redirect về login
    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Không phải admin -> redirect về dashboard với thông báo
    if (!isAdmin) {
        return (
            <Navigate
                to="/dashboard"
                state={{
                    error: 'Bạn không có quyền truy cập trang này. Chỉ Quản trị viên mới có thể truy cập.',
                    from: location
                }}
                replace
            />
        );
    }

    return children;
};

/**
 * OwnerRoute - Admin (LTK01) và Owner (LTK02) mới vào được
 * Redirect về dashboard nếu là User thường
 */
export const OwnerRoute = ({ children }) => {
    const { isLoggedIn, isLoading } = useAuthStore();
    const { isAdmin, isOwner } = usePermissions();
    const location = useLocation();

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="text-center">
                    <div className="spinner mb-4"></div>
                    <p className="text-gray-400">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        );
    }

    // Chưa đăng nhập -> redirect về login
    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Không phải admin hoặc owner -> redirect về dashboard
    if (!isAdmin && !isOwner) {
        return (
            <Navigate
                to="/dashboard"
                state={{
                    error: 'Bạn không có quyền truy cập trang này. Chỉ Quản trị viên hoặc Người lập gia phả mới có thể truy cập.',
                    from: location
                }}
                replace
            />
        );
    }

    return children;
};

export default AdminRoute;
