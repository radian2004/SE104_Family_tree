/**
 * ============================================
 * THÀNH TÍCH LIST - Premium Design với Sửa/Xóa
 * ============================================
 */

import { useState, useEffect } from 'react';
import { FiAward, FiPlus, FiTrash2, FiCalendar, FiEdit2, FiX, FiCheck } from 'react-icons/fi';
import thanhTichService from '../../services/thanhtich';
import { useLookupsStore } from '../../store/lookupsStore';
import DateInput from '../common/DateInput';

export default function ThanhTichList({ MaTV }) {
    const loaithanhtich = useLookupsStore((state) => state.loaithanhtich);
    const [thanhTichs, setThanhTichs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form state
    const [selectedLoai, setSelectedLoai] = useState('');
    const [ngayPhatSinh, setNgayPhatSinh] = useState('');

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editLoai, setEditLoai] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Load danh sách thành tích
    const loadThanhTich = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await thanhTichService.traCuu({ MaTV });
            setThanhTichs(res.result || res || []);
        } catch (err) {
            console.error('Lỗi tải thành tích:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách thành tích');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (MaTV) {
            loadThanhTich();
        }
    }, [MaTV]);

    // Clear messages
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!selectedLoai) {
            setError('Vui lòng chọn loại thành tích');
            return;
        }

        try {
            setIsAdding(true);
            setError(null);
            await thanhTichService.ghiNhan({
                MaTV,
                MaLTT: selectedLoai,
                NgayPhatSinh: ngayPhatSinh || undefined
            });

            setSelectedLoai('');
            setNgayPhatSinh('');
            setIsFormOpen(false);
            setSuccessMsg('Đã thêm thành tích thành công');
            loadThanhTich();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Có lỗi xảy ra khi thêm thành tích';
            setError(errorMsg);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Xóa thành tích "${item.ThanhTich}"?`)) return;

        try {
            const loai = loaithanhtich?.find(l => l.TenLTT === item.ThanhTich);
            if (!loai) {
                setError('Không tìm thấy mã loại thành tích để xóa');
                return;
            }

            await thanhTichService.xoa({
                MaTV,
                MaLTT: loai.MaLTT,
                NgayPhatSinh: item.NgayPhatSinh
            });
            setError(null);
            setSuccessMsg('Đã xóa thành tích');
            loadThanhTich();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Lỗi khi xóa thành tích');
        }
    };

    // Open edit modal
    const openEditModal = (item) => {
        const loai = loaithanhtich?.find(l => l.TenLTT === item.ThanhTich);
        setEditingItem(item);
        setEditLoai(loai?.MaLTT || '');
        setShowEditModal(true);
    };

    // Handle update
    const handleUpdate = async () => {
        if (!editingItem || !editLoai) return;

        const currentLoai = loaithanhtich?.find(l => l.TenLTT === editingItem.ThanhTich);
        if (!currentLoai) {
            setError('Không tìm thấy loại thành tích hiện tại');
            return;
        }

        setIsUpdating(true);
        try {
            await thanhTichService.capNhat({
                MaTV,
                MaLTT: currentLoai.MaLTT,
                NgayPhatSinh: editingItem.NgayPhatSinh,
                MaLTTMoi: editLoai
            });
            setSuccessMsg('Đã cập nhật thành tích');
            setShowEditModal(false);
            setEditingItem(null);
            loadThanhTich();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật thành tích');
        } finally {
            setIsUpdating(false);
        }
    };

    if (!MaTV) return null;

    return (
        <div className="glass-card p-6 mt-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                        <FiAward className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Thành tích & Khen thưởng
                        </h3>
                        <p className="text-sm text-neutral-500">
                            {thanhTichs.length} thành tích đã ghi nhận
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className={`btn ${isFormOpen ? 'btn-ghost' : 'btn-primary'} btn-small`}
                >
                    <FiPlus className={`w-4 h-4 transition-transform ${isFormOpen ? 'rotate-45' : ''}`} />
                    {isFormOpen ? 'Hủy' : 'Thêm mới'}
                </button>
            </div>

            {/* Success Message */}
            {successMsg && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                    <FiCheck /> {successMsg}
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                    <FiX /> {error}
                </div>
            )}

            {/* Add Form */}
            {isFormOpen && (
                <form onSubmit={handleAdd} className="mb-6 p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="form-label">Loại thành tích *</label>
                            <select
                                className="select-field"
                                value={selectedLoai}
                                onChange={e => setSelectedLoai(e.target.value)}
                                required
                            >
                                <option value="">-- Chọn thành tích --</option>
                                {loaithanhtich?.map(l => (
                                    <option key={l.MaLTT} value={l.MaLTT}>{l.TenLTT}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Ngày phát sinh</label>
                            <div className="relative">
                                <DateInput
                                    className="input-field"
                                    value={ngayPhatSinh}
                                    onChange={e => setNgayPhatSinh(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={isAdding}
                                className="btn btn-primary w-full"
                            >
                                {isAdding ? (
                                    <>
                                        <div className="spinner"></div>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <FiPlus className="w-4 h-4" />
                                        Thêm thành tích
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* List */}
            {isLoading ? (
                <div className="text-center py-8">
                    <div className="spinner spinner-large mx-auto mb-4"></div>
                    <p className="text-neutral-500">Đang tải thành tích...</p>
                </div>
            ) : thanhTichs.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-xl">
                    <div className="text-5xl mb-4">🏆</div>
                    <p className="text-neutral-500 mb-2">Chưa có thành tích nào được ghi nhận</p>
                    <p className="text-sm text-neutral-400">Nhấn "Thêm mới" để ghi nhận thành tích đầu tiên</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {thanhTichs.map((t, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-100 hover:shadow-md hover:border-yellow-200 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center text-yellow-600 font-bold">
                                    {idx + 1}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-neutral-800">{t.ThanhTich}</h4>
                                    <div className="flex items-center gap-1 text-sm text-neutral-500">
                                        <FiCalendar className="w-3 h-3" />
                                        {t.NgayPhatSinh
                                            ? new Date(t.NgayPhatSinh).toLocaleDateString('vi-VN')
                                            : 'Không xác định'}
                                    </div>
                                </div>
                            </div>
                            {/* Action buttons */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEditModal(t)}
                                    className="text-blue-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                    title="Sửa thành tích"
                                >
                                    <FiEdit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(t)}
                                    className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Xóa thành tích"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ==================== EDIT MODAL ==================== */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-bold text-neutral-800 mb-4">
                            ✏️ Sửa thành tích
                        </h3>
                        <p className="text-neutral-600 mb-4">
                            Thành tích hiện tại: <strong>{editingItem?.ThanhTich}</strong>
                        </p>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Đổi sang loại thành tích
                            </label>
                            <select
                                value={editLoai}
                                onChange={(e) => setEditLoai(e.target.value)}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            >
                                <option value="">-- Chọn loại thành tích mới --</option>
                                {loaithanhtich?.map(l => (
                                    <option key={l.MaLTT} value={l.MaLTT}>{l.TenLTT}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowEditModal(false); setEditingItem(null); }}
                                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating || !editLoai}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                            >
                                {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
