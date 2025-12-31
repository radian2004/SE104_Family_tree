/**
 * ============================================
 * KẾT THÚC SECTION - Read-Only Display with Delete
 * Hiển thị thông tin, có thể hủy (xóa) kết thúc
 * Quản lý chi tiết qua trang riêng trong Dashboard
 * ============================================
 */

import { useState, useEffect } from 'react';
import { FiHeart, FiAlertCircle, FiCalendar, FiMapPin, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import ketThucService from '../../services/ketthuc';
import { usePermissions } from '../../hooks/usePermissions';

export default function KetThucSection({ MaTV, onStatusChange }) {
    const [ketThucInfo, setKetThucInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

    const { isAdmin, isOwner } = usePermissions();
    const canEdit = isAdmin || isOwner;

    const loadKetThucInfo = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await ketThucService.getDetail(MaTV);
            if (data) {
                setKetThucInfo(data);
            }
        } catch (err) {
            // Silent 404 means member is alive
            if (err.response?.status !== 404) {
                console.error("Error loading death info:", err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (MaTV) {
            loadKetThucInfo();
        }
    }, [MaTV]);

    const handleDelete = async () => {
        if (!window.confirm("Hủy thông tin kết thúc? Thành viên sẽ được chuyển về trạng thái 'Còn sống'?")) return;

        try {
            setIsDeleting(true);
            setError(null);
            await ketThucService.delete(MaTV);
            setKetThucInfo(null);
            onStatusChange && onStatusChange();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Lỗi khi xóa');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="glass-card p-6 mt-6">
                <div className="text-center py-8">
                    <div className="spinner spinner-large mx-auto mb-4"></div>
                    <p className="text-neutral-500">Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    // Alive state - Simple badge
    if (!ketThucInfo) {
        return (
            <div className="glass-card p-6 mt-6 relative overflow-hidden">
                {/* Success indicator */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-emerald-600"></div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                            <FiHeart className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Còn sống
                            </h3>
                            <p className="text-neutral-500 text-sm">Thành viên hiện đang còn sống</p>
                        </div>
                    </div>

                    {/* Link to management page */}
                    <Link
                        to="/ketthuc"
                        className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                    >
                        Quản lý qua trang Kết thúc →
                    </Link>
                </div>
            </div>
        );
    }

    // View Mode (Dead) - Read-only with delete option
    return (
        <div className="glass-card p-6 mt-6 relative overflow-hidden">
            {/* Indicator */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-neutral-400 to-neutral-600"></div>

            {/* Error message */}
            {error && (
                <div className="alert alert-danger mb-4">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neutral-400 to-neutral-600 flex items-center justify-center text-white shadow-lg">
                        <span className="text-2xl">🕯️</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Thông tin Kết thúc
                        </h3>
                        <p className="text-neutral-500 text-sm">Thành viên đã qua đời</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Delete button - only for Admin/Owner */}
                    {canEdit && (
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="btn btn-outline btn-small text-emerald-600 border-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center gap-1"
                            title="Hủy ghi nhận kết thúc"
                        >
                            {isDeleting ? (
                                <div className="spinner spinner-small"></div>
                            ) : (
                                <FiHeart className="w-4 h-4" />
                            )}
                            Hồi sinh
                        </button>
                    )}

                    {/* Link to management page */}
                    <Link
                        to="/ketthuc"
                        className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                    >
                        Quản lý →
                    </Link>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                        <FiCalendar className="w-4 h-4" />
                        Ngày giờ mất
                    </div>
                    <p className="font-semibold text-neutral-800">
                        {ketThucInfo.NgayGioMat
                            ? new Date(ketThucInfo.NgayGioMat).toLocaleString('vi-VN')
                            : 'Không xác định'}
                    </p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                        <FiAlertCircle className="w-4 h-4" />
                        Nguyên nhân
                    </div>
                    <p className="font-semibold text-neutral-800">
                        {ketThucInfo.TenNguyenNhanMat || ketThucInfo.MaNguyenNhanMat || 'Không rõ'}
                    </p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                        <FiMapPin className="w-4 h-4" />
                        Địa điểm
                    </div>
                    <p className="font-semibold text-neutral-800">
                        {ketThucInfo.TenDiaDiem || ketThucInfo.MaDiaDiem || 'Không rõ'}
                    </p>
                </div>
            </div>
        </div>
    );
}
