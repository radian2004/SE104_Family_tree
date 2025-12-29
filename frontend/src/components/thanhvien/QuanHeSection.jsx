/**
 * ============================================
 * QUAN HỆ SECTION - Hiển thị quan hệ gia đình
 * Có đầy đủ CRUD: Xem, Sửa, Xóa
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiChevronRight, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import quanheService from '../../services/quanhe.js';
import thanhVienService from '../../services/thanhvien.js';
import DateInput from '../common/DateInput';

export default function QuanHeSection({ MaTV, memberName, memberGender, canEdit = false, MaGiaPha }) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Relationships data
    const [spouse, setSpouse] = useState([]);
    const [parents, setParents] = useState(null);
    const [children, setChildren] = useState([]);

    // All members for dropdown
    const [allMembers, setAllMembers] = useState([]);

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteType, setDeleteType] = useState(null); // 'spouse' | 'child'
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit marriage modal
    const [showEditMarriage, setShowEditMarriage] = useState(false);
    const [editingSpouse, setEditingSpouse] = useState(null);
    const [endDate, setEndDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Edit parents modal
    const [showEditParents, setShowEditParents] = useState(false);
    const [editParentsData, setEditParentsData] = useState({ MaTVCha: '', MaTVMe: '', NgayPhatSinh: '' });

    // Load relationships
    const loadRelationships = async () => {
        if (!MaTV) return;

        setIsLoading(true);
        setError(null);

        try {
            const [spouseData, parentsData, childrenData] = await Promise.all([
                quanheService.getHonNhan(MaTV).catch(() => []),
                quanheService.getChaMe(MaTV).catch(() => null),
                quanheService.getConCai(MaTV).catch(() => [])
            ]);

            setSpouse(Array.isArray(spouseData) ? spouseData : []);
            setParents(parentsData);
            setChildren(Array.isArray(childrenData) ? childrenData : []);
        } catch (err) {
            console.error('Error loading relationships:', err);
            setError('Không thể tải thông tin quan hệ');
        } finally {
            setIsLoading(false);
        }
    };

    // Load all members for dropdown
    const loadMembers = async () => {
        if (!MaGiaPha) return;
        try {
            const data = await thanhVienService.getByGiaPha(MaGiaPha);
            const memberList = Array.isArray(data) ? data : (data.items || data.result || []);
            // Filter out current member
            setAllMembers(memberList.filter(m => m.MaTV !== MaTV));
        } catch (err) {
            console.error('Error loading members:', err);
        }
    };

    useEffect(() => {
        loadRelationships();
        loadMembers();
    }, [MaTV, MaGiaPha]);

    // Navigate to member detail
    const goToMember = (maTV) => {
        if (maTV) {
            navigate(`/thanhvien/${maTV}`);
        }
    };

    // Delete marriage handler
    const handleDeleteSpouse = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await quanheService.deleteHonNhan({
                MaTV: MaTV,
                MaTVVC: deleteTarget.MaTVVC
            });
            setSuccessMsg('Đã xóa quan hệ hôn nhân');
            setShowDeleteModal(false);
            setDeleteTarget(null);
            await loadRelationships();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa quan hệ hôn nhân');
        } finally {
            setIsDeleting(false);
        }
    };

    // Delete child relationship handler
    const handleDeleteChild = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await quanheService.deleteQuanHeCon(deleteTarget.MaTV);
            setSuccessMsg('Đã xóa quan hệ cha mẹ con');
            setShowDeleteModal(false);
            setDeleteTarget(null);
            await loadRelationships();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa quan hệ');
        } finally {
            setIsDeleting(false);
        }
    };

    // Update marriage handler
    const handleUpdateMarriage = async () => {
        if (!editingSpouse) return;

        setIsUpdating(true);
        try {
            const payload = {
                MaTV: MaTV,
                MaTVVC: editingSpouse.MaTVVC
            };
            if (startDate) payload.NgayBatDau = startDate;
            if (endDate) payload.NgayKetThuc = endDate;

            await quanheService.updateHonNhan(payload);
            setSuccessMsg('Đã cập nhật thông tin hôn nhân');
            setShowEditMarriage(false);
            setEditingSpouse(null);
            setStartDate('');
            setEndDate('');
            await loadRelationships();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật');
        } finally {
            setIsUpdating(false);
        }
    };

    // Open delete confirmation
    const openDeleteModal = (target, type) => {
        setDeleteTarget(target);
        setDeleteType(type);
        setShowDeleteModal(true);
    };

    // Open edit marriage modal
    const openEditMarriage = (sp) => {
        setEditingSpouse(sp);
        setStartDate(sp.NgayBatDau || '');
        setEndDate(sp.NgayKetThuc || '');
        setShowEditMarriage(true);
    };

    // Open edit parents modal
    const openEditParents = () => {
        setEditParentsData({
            MaTVCha: parents?.MaTVCha || '',
            MaTVMe: parents?.MaTVMe || '',
            NgayPhatSinh: parents?.NgayPhatSinh ? new Date(parents.NgayPhatSinh).toISOString().split('T')[0] : ''
        });
        setShowEditParents(true);
    };

    // Handle update parents
    const handleUpdateParents = async () => {
        setIsUpdating(true);
        try {
            await quanheService.updateQuanHeCon(MaTV, editParentsData);
            setSuccessMsg('Đã cập nhật quan hệ cha mẹ');
            setShowEditParents(false);
            await loadRelationships();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật');
        } finally {
            setIsUpdating(false);
        }
    };

    // Clear messages after 3 seconds
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    // Check if has any relationships
    const hasRelationships = spouse.length > 0 ||
        (parents && (parents.MaTVCha || parents.MaTVMe)) ||
        children.length > 0;

    if (isLoading) {
        return (
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                    <FiHeart className="text-pink-500" />
                    Quan hệ gia đình
                </h3>
                <div className="animate-pulse flex items-center justify-center py-8">
                    <div className="spinner"></div>
                    <span className="ml-2 text-neutral-500">Đang tải...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                <FiHeart className="text-pink-500" />
                Quan hệ gia đình
            </h3>

            {/* Success/Error Messages */}
            {successMsg && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                    <FiCheck /> {successMsg}
                </div>
            )}
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                    <FiX /> {error}
                </div>
            )}

            {!hasRelationships ? (
                <div className="text-center py-8 text-neutral-500">
                    <div className="text-4xl mb-2">👤</div>
                    <p>Chưa có thông tin quan hệ gia đình</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* ==================== CHA MẸ ==================== */}
                    {parents && (parents.MaTVCha || parents.MaTVMe) && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                                    👨‍👩‍👧 Cha mẹ
                                </h4>
                                {canEdit && (
                                    <button
                                        onClick={openEditParents}
                                        className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                                        title="Sửa quan hệ cha mẹ"
                                    >
                                        <FiEdit2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Cha */}
                                {parents.MaTVCha && (
                                    <div
                                        onClick={() => goToMember(parents.MaTVCha)}
                                        className="flex items-center justify-between p-3 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">👨</div>
                                            <div>
                                                <div className="font-medium text-neutral-800">
                                                    {parents.HoTenCha || `Thành viên ${parents.MaTVCha}`}
                                                </div>
                                                <div className="text-xs text-blue-600">Cha</div>
                                            </div>
                                        </div>
                                        <FiChevronRight className="text-blue-500 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}

                                {/* Mẹ */}
                                {parents.MaTVMe && (
                                    <div
                                        onClick={() => goToMember(parents.MaTVMe)}
                                        className="flex items-center justify-between p-3 bg-pink-50 rounded-xl cursor-pointer hover:bg-pink-100 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-lg">👩</div>
                                            <div>
                                                <div className="font-medium text-neutral-800">
                                                    {parents.HoTenMe || `Thành viên ${parents.MaTVMe}`}
                                                </div>
                                                <div className="text-xs text-pink-600">Mẹ</div>
                                            </div>
                                        </div>
                                        <FiChevronRight className="text-pink-500 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ==================== VỢ/CHỒNG ==================== */}
                    {spouse.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                                💒 {memberGender === 'Nữ' ? 'Chồng' : 'Vợ'}
                            </h4>
                            <div className="space-y-2">
                                {spouse.map((sp, index) => (
                                    <div
                                        key={sp.MaTVVC || index}
                                        className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl group"
                                    >
                                        <div
                                            onClick={() => goToMember(sp.MaTVVC)}
                                            className="flex items-center gap-3 cursor-pointer flex-1"
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${sp.GioiTinh === 'Nữ' ? 'bg-pink-100' : 'bg-blue-100'}`}>
                                                {sp.GioiTinh === 'Nữ' ? '👩' : '👨'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-neutral-800">
                                                    {sp.HoTenVC || `Thành viên ${sp.MaTVVC}`}
                                                </div>
                                                <div className="text-xs text-rose-600 flex items-center gap-1">
                                                    <FiHeart className="w-3 h-3" />
                                                    {sp.GioiTinh === 'Nữ' ? 'Vợ' : 'Chồng'}
                                                    {sp.NgayBatDau && (
                                                        <span className="ml-1">• Từ {new Date(sp.NgayBatDau).getFullYear()}</span>
                                                    )}
                                                    {sp.NgayKetThuc && (
                                                        <span className="ml-1 text-neutral-500">→ {new Date(sp.NgayKetThuc).getFullYear()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Action buttons - Only for Admin/Owner */}
                                        {canEdit && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openEditMarriage(sp); }}
                                                    className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Sửa (kết thúc hôn nhân)"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openDeleteModal(sp, 'spouse'); }}
                                                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Xóa quan hệ"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ==================== CON CÁI ==================== */}
                    {children.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                                👶 Con cái ({children.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {children.map((child, index) => (
                                    <div
                                        key={child.MaTV || index}
                                        className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl group"
                                    >
                                        <div
                                            onClick={() => goToMember(child.MaTV)}
                                            className="flex items-center gap-3 cursor-pointer flex-1"
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${child.GioiTinh === 'Nữ' ? 'bg-pink-100' : 'bg-blue-100'}`}>
                                                {child.GioiTinh === 'Nữ' ? '👧' : '👦'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-neutral-800">
                                                    {child.HoTenCon || child.HoTen || `Thành viên ${child.MaTV}`}
                                                </div>
                                                <div className="text-xs text-emerald-600">
                                                    {child.GioiTinh === 'Nữ' ? 'Con gái' : 'Con trai'}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Delete button - Only for Admin/Owner */}
                                        {canEdit && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openDeleteModal(child, 'child'); }}
                                                className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                                title="Xóa quan hệ cha mẹ con"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="text-sm text-neutral-500 pt-4 border-t border-neutral-200">
                        📝 {memberName}
                        {parents && parents.HoTenCha && ` là con của ${parents.HoTenCha}`}
                        {parents && parents.HoTenMe && parents.HoTenCha && ` và ${parents.HoTenMe}`}
                        {parents && parents.HoTenMe && !parents.HoTenCha && ` là con của ${parents.HoTenMe}`}
                        {spouse.length > 0 && `, ${memberGender === 'Nữ' ? 'vợ' : 'chồng'} của ${spouse[0].HoTenVC || 'người phối ngẫu'}`}
                        {children.length > 0 && `, có ${children.length} con`}
                    </div>
                </div>
            )}

            {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-bold text-neutral-800 mb-4">
                            ⚠️ Xác nhận xóa
                        </h3>
                        <p className="text-neutral-600 mb-6">
                            {deleteType === 'spouse'
                                ? `Bạn có chắc muốn xóa quan hệ hôn nhân với ${deleteTarget?.HoTenVC || 'thành viên này'}?`
                                : `Bạn có chắc muốn xóa quan hệ cha mẹ con với ${deleteTarget?.HoTenCon || deleteTarget?.HoTen || 'thành viên này'}?`
                            }
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={deleteType === 'spouse' ? handleDeleteSpouse : handleDeleteChild}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== EDIT MARRIAGE MODAL ==================== */}
            {showEditMarriage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-bold text-neutral-800 mb-4">
                            ✏️ Cập nhật hôn nhân
                        </h3>
                        <p className="text-neutral-600 mb-4">
                            Quan hệ với: <strong>{editingSpouse?.HoTenVC}</strong>
                        </p>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    💒 Ngày bắt đầu (kết hôn)
                                </label>
                                <DateInput
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    💔 Ngày kết thúc (ly hôn - để trống nếu còn)
                                </label>
                                <DateInput
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowEditMarriage(false); setEditingSpouse(null); }}
                                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdateMarriage}
                                disabled={isUpdating}
                                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
                            >
                                {isUpdating ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== EDIT PARENTS MODAL ==================== */}
            {showEditParents && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-bold text-neutral-800 mb-4">
                            ✏️ Cập nhật quan hệ cha mẹ
                        </h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    👨 Cha
                                </label>
                                <select
                                    value={editParentsData.MaTVCha}
                                    onChange={(e) => setEditParentsData({ ...editParentsData, MaTVCha: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">-- Không có --</option>
                                    {allMembers.filter(m => m.GioiTinh === 'Nam').map(m => (
                                        <option key={m.MaTV} value={m.MaTV}>
                                            {m.HoTen} ({m.MaTV})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    👩 Mẹ
                                </label>
                                <select
                                    value={editParentsData.MaTVMe}
                                    onChange={(e) => setEditParentsData({ ...editParentsData, MaTVMe: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                >
                                    <option value="">-- Không có --</option>
                                    {allMembers.filter(m => m.GioiTinh === 'Nữ').map(m => (
                                        <option key={m.MaTV} value={m.MaTV}>
                                            {m.HoTen} ({m.MaTV})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    📅 Ngày phát sinh (khai sinh)
                                </label>
                                <DateInput
                                    value={editParentsData.NgayPhatSinh}
                                    onChange={(e) => setEditParentsData({ ...editParentsData, NgayPhatSinh: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowEditParents(false)}
                                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdateParents}
                                disabled={isUpdating}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                                {isUpdating ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
