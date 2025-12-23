/**
 * ============================================
 * KẾT THÚC SECTION - Premium Design
 * ============================================
 */

import { useState, useEffect } from 'react';
import { FiHeart, FiAlertCircle, FiEdit2, FiX, FiCheck, FiCalendar, FiMapPin } from 'react-icons/fi';
import ketThucService from '../../services/ketthuc';

export default function KetThucSection({ MaTV, onStatusChange }) {
    const [ketThucInfo, setKetThucInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        NgayGioMat: '',
        MaNguyenNhanMat: '',
        MaDiaDiem: ''
    });

    const loadKetThucInfo = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await ketThucService.getDetail(MaTV);
            if (data) {
                setKetThucInfo(data);
                setFormData({
                    NgayGioMat: data.NgayGioMat ? data.NgayGioMat.slice(0, 16) : '',
                    MaNguyenNhanMat: data.MaNguyenNhanMat || '',
                    MaDiaDiem: data.MaDiaDiem || ''
                });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            setError(null);
            if (ketThucInfo) {
                await ketThucService.update(MaTV, formData);
            } else {
                await ketThucService.ghiNhan({ ...formData, MaTV });
            }
            setIsEditing(false);
            loadKetThucInfo();
            onStatusChange && onStatusChange();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Hủy thông tin kết thúc? Thành viên sẽ được chuyển về trạng thái 'Còn sống'?")) return;

        try {
            setIsLoading(true);
            setError(null);
            await ketThucService.delete(MaTV);
            setKetThucInfo(null);
            setIsEditing(false);
            setFormData({ NgayGioMat: '', MaNguyenNhanMat: '', MaDiaDiem: '' });
            onStatusChange && onStatusChange();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Lỗi khi xóa');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !ketThucInfo && !isEditing) {
        return (
            <div className="glass-card p-6 mt-6">
                <div className="text-center py-8">
                    <div className="spinner spinner-large mx-auto mb-4"></div>
                    <p className="text-neutral-500">Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    // Alive state - Show "Báo tử" button
    if (!ketThucInfo && !isEditing) {
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
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-ghost"
                    >
                        <FiAlertCircle className="w-4 h-4" />
                        Báo tử
                    </button>
                </div>
            </div>
        );
    }

    // View Mode (Dead)
    if (ketThucInfo && !isEditing) {
        return (
            <div className="glass-card p-6 mt-6 relative overflow-hidden">
                {/* Indicator */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-neutral-400 to-neutral-600"></div>

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
                        <button
                            onClick={() => setIsEditing(true)}
                            className="btn btn-ghost btn-small"
                        >
                            <FiEdit2 className="w-4 h-4" />
                            Sửa
                        </button>
                        <button
                            onClick={handleDelete}
                            className="btn btn-outline btn-small text-emerald-600 border-emerald-500 hover:bg-emerald-500"
                        >
                            <FiHeart className="w-4 h-4" />
                            Hồi sinh
                        </button>
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
                            {ketThucInfo.TenNguyenNhan || ketThucInfo.MaNguyenNhanMat || 'Không rõ'}
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

    // Edit/Create Form
    return (
        <div className="glass-card p-6 mt-6 relative overflow-hidden animate-fade-in">
            {/* Indicator */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-400 to-red-500"></div>

            {error && (
                <div className="alert alert-danger mb-4">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white shadow-lg">
                    <FiAlertCircle className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                        {ketThucInfo ? 'Chỉnh sửa thông tin' : 'Ghi nhận kết thúc'}
                    </h3>
                    <p className="text-neutral-500 text-sm">
                        {ketThucInfo ? 'Cập nhật thông tin kết thúc' : 'Báo tử cho thành viên này'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="form-label">
                            <FiCalendar className="inline w-4 h-4 mr-1" />
                            Ngày giờ mất *
                        </label>
                        <input
                            type="datetime-local"
                            className="input-field"
                            value={formData.NgayGioMat}
                            onChange={e => setFormData({ ...formData, NgayGioMat: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="form-label">
                            <FiAlertCircle className="inline w-4 h-4 mr-1" />
                            Nguyên nhân
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Nhập mã nguyên nhân"
                            value={formData.MaNguyenNhanMat}
                            onChange={e => setFormData({ ...formData, MaNguyenNhanMat: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="form-label">
                            <FiMapPin className="inline w-4 h-4 mr-1" />
                            Địa điểm
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Nhập mã địa điểm"
                            value={formData.MaDiaDiem}
                            onChange={e => setFormData({ ...formData, MaDiaDiem: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-danger"
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner"></div>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <FiCheck className="w-4 h-4" />
                                Xác nhận
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditing(false);
                            setError(null);
                            if (!ketThucInfo) {
                                setFormData({ NgayGioMat: '', MaNguyenNhanMat: '', MaDiaDiem: '' });
                            }
                        }}
                        className="btn btn-ghost"
                    >
                        <FiX className="w-4 h-4" />
                        Hủy
                    </button>
                </div>
            </form>
        </div>
    );
}
