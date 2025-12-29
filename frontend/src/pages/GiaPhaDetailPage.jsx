/**
 * ============================================
 * GIA PHẢ DETAIL PAGE - Chi tiết cây gia phả
 * Với chức năng thêm/sửa/xóa thành viên và quan hệ
 * ============================================
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiCalendar, FiUserPlus, FiRefreshCw, FiHeart, FiX, FiCheck } from 'react-icons/fi';
import giaPhaService from '../services/giapha.js';
import thanhvienService from '../services/thanhvien.js';
import quanheService from '../services/quanhe.js';
import { useLookupsStore } from '../store/lookupsStore.js';
import { usePermissions } from '../hooks/usePermissions';
import FamilyTreeView from '../components/giapha/FamilyTreeView.jsx';
import DateInput from '../components/common/DateInput';

export default function GiaPhaDetailPage() {
    const { MaGiaPha } = useParams();
    const navigate = useNavigate();
    const { cayGiaPha } = useLookupsStore();
    const { isAdmin, isOwner } = usePermissions();
    const canManage = isAdmin || isOwner;

    const [giaPha, setGiaPha] = useState(null);
    const [thanhVienList, setThanhVienList] = useState([]);
    const [relationships, setRelationships] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // ===== MODAL STATES =====
    // Marriage Modal
    const [showMarriageModal, setShowMarriageModal] = useState(false);
    const [marriageForm, setMarriageForm] = useState({
        MaChong: '',
        MaVo: '',
        NgayBatDau: new Date().toISOString().split('T')[0]
    });
    const [isSubmittingMarriage, setIsSubmittingMarriage] = useState(false);

    // Parent-Child Modal
    const [showParentChildModal, setShowParentChildModal] = useState(false);
    const [parentChildForm, setParentChildForm] = useState({
        MaCon: '',
        MaTVCha: '',
        MaTVMe: ''
    });
    const [isSubmittingParentChild, setIsSubmittingParentChild] = useState(false);

    // Load gia phả detail and members
    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch Gia Pha Detail directly
            const gpDetail = await giaPhaService.getDetail(MaGiaPha);
            if (gpDetail) {
                setGiaPha(gpDetail);
            }

            // Get tree data (members + relationships)
            const treeData = await giaPhaService.getTreeData(MaGiaPha);
            setThanhVienList(treeData.members);
            setRelationships(treeData.relationships);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi tải thông tin gia phả');
            console.error('Error loading gia pha detail:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (MaGiaPha) {
            loadData();
        }
    }, [MaGiaPha]);

    // Clear success message after 3 seconds
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    // Check if member is deceased
    const isDeceased = (tv) => {
        const status = (tv.TrangThai || '').toLowerCase();
        return status.includes('mất') || status.includes('mat');
    };

    // Handle edit member - navigate to edit page
    const handleEditMember = (MaTV) => {
        navigate(`/thanhvien/${MaTV}/edit`);
    };

    // Handle delete member
    const handleDeleteMember = async (MaTV, HoTen) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa thành viên "${HoTen}"?\n\nHành động này không thể hoàn tác!`)) {
            return;
        }

        try {
            await thanhvienService.delete(MaTV);
            setSuccessMsg('Đã xóa thành viên thành công!');
            loadData();
        } catch (err) {
            console.error('Delete error:', err);
            setError(err.response?.data?.message || 'Lỗi xóa thành viên');
        }
    };

    // ===== MARRIAGE HANDLERS =====
    const handleSubmitMarriage = async (e) => {
        e.preventDefault();
        if (!marriageForm.MaChong || !marriageForm.MaVo) {
            setError('Vui lòng chọn cả chồng và vợ');
            return;
        }
        if (marriageForm.MaChong === marriageForm.MaVo) {
            setError('Chồng và vợ không thể là cùng một người');
            return;
        }

        setIsSubmittingMarriage(true);
        setError(null);
        try {
            await quanheService.createHonNhan({
                MaChong: marriageForm.MaChong,
                MaVo: marriageForm.MaVo,
                NgayBatDau: marriageForm.NgayBatDau
            });
            setSuccessMsg('Đã thêm quan hệ hôn nhân thành công!');
            setShowMarriageModal(false);
            setMarriageForm({ MaChong: '', MaVo: '', NgayBatDau: new Date().toISOString().split('T')[0] });
            loadData();
        } catch (err) {
            console.error('Marriage error:', err);
            setError(err.response?.data?.message || 'Lỗi thêm quan hệ hôn nhân');
        } finally {
            setIsSubmittingMarriage(false);
        }
    };

    // ===== PARENT-CHILD HANDLERS =====
    const handleSubmitParentChild = async (e) => {
        e.preventDefault();
        if (!parentChildForm.MaCon) {
            setError('Vui lòng chọn con');
            return;
        }
        if (!parentChildForm.MaTVCha && !parentChildForm.MaTVMe) {
            setError('Vui lòng chọn ít nhất cha hoặc mẹ');
            return;
        }

        setIsSubmittingParentChild(true);
        setError(null);
        try {
            await quanheService.createQuanHeCon({
                MaTV: parentChildForm.MaCon,
                MaTVCha: parentChildForm.MaTVCha || null,
                MaTVMe: parentChildForm.MaTVMe || null
            });
            setSuccessMsg('Đã thêm quan hệ cha-mẹ-con thành công!');
            setShowParentChildModal(false);
            setParentChildForm({ MaCon: '', MaTVCha: '', MaTVMe: '' });
            loadData();
        } catch (err) {
            console.error('Parent-child error:', err);
            setError(err.response?.data?.message || 'Lỗi thêm quan hệ cha-mẹ-con');
        } finally {
            setIsSubmittingParentChild(false);
        }
    };

    // Get members filtered by gender
    const maleMembers = thanhVienList.filter(tv => tv.GioiTinh === 'Nam');
    const femaleMembers = thanhVienList.filter(tv => tv.GioiTinh === 'Nữ');

    return (
        <div className="min-h-screen">
            {/* Decorative Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-200/20 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-200/20 to-transparent rounded-full blur-3xl"></div>
            </div>

            {/* Navigation */}
            <nav className="navbar px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link
                        to="/giapha"
                        className="flex items-center gap-2 text-neutral-600 hover:text-emerald-600 transition-colors"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        <span>Quay lại danh sách</span>
                    </Link>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadData}
                            className="btn btn-outline flex items-center gap-2"
                            disabled={isLoading}
                        >
                            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Làm mới</span>
                        </button>

                        {canManage && (
                            <>
                                {/* Add Marriage Button */}
                                <button
                                    onClick={() => setShowMarriageModal(true)}
                                    className="btn btn-outline flex items-center gap-2 border-pink-300 text-pink-600 hover:bg-pink-50"
                                >
                                    <FiHeart className="w-4 h-4" />
                                    <span className="hidden md:inline">Thêm hôn nhân</span>
                                </button>

                                {/* Add Parent-Child Button */}
                                <button
                                    onClick={() => setShowParentChildModal(true)}
                                    className="btn btn-outline flex items-center gap-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                                >
                                    <span>👶</span>
                                    <span className="hidden md:inline">Thêm con cái</span>
                                </button>

                                <Link
                                    to={`/thanhvien/create?MaGiaPha=${MaGiaPha}`}
                                    className="btn btn-primary flex items-center gap-2"
                                >
                                    <FiUserPlus className="w-4 h-4" />
                                    <span>Thêm thành viên</span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Success Message */}
                {successMsg && (
                    <div className="mb-6 p-4 bg-emerald-100 text-emerald-700 rounded-xl flex items-center gap-2 animate-fade-in">
                        <FiCheck className="w-5 h-5" />
                        {successMsg}
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="alert alert-danger mb-6 animate-fade-in">
                        <span className="text-lg">⚠️</span>
                        <p>{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto">
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {isLoading ? (
                    <div className="glass-card p-12 text-center animate-fade-in">
                        <div className="spinner spinner-large mx-auto mb-4"></div>
                        <p className="text-neutral-500">Đang tải thông tin gia phả...</p>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {/* Header Card */}
                        <div className="glass-card overflow-hidden mb-6">
                            {/* Gradient Banner */}
                            <div className="h-40 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-8xl opacity-30">🌳</span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="px-6 pb-6 -mt-8">
                                <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center text-4xl mb-4">
                                    🌳
                                </div>

                                <h1 className="text-3xl font-bold text-neutral-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    {giaPha?.TenGiaPha || `Gia phả ${MaGiaPha}`}
                                </h1>
                                <p className="text-neutral-500 text-sm mb-4">Mã gia phả: {MaGiaPha}</p>

                                <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                                    <span className="flex items-center gap-1">
                                        <FiUsers className="w-4 h-4" />
                                        {thanhVienList.length} thành viên
                                    </span>
                                    {giaPha?.NgayLap && (
                                        <span className="flex items-center gap-1">
                                            <FiCalendar className="w-4 h-4" />
                                            Ngày lập: {new Date(giaPha.NgayLap).toLocaleDateString('vi-VN')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="glass-card p-4 text-center">
                                <div className="text-2xl mb-2">👥</div>
                                <div className="text-2xl font-bold text-neutral-800">{thanhVienList.length}</div>
                                <div className="text-xs text-neutral-500">Tổng thành viên</div>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <div className="text-2xl mb-2">💚</div>
                                <div className="text-2xl font-bold text-emerald-600">
                                    {thanhVienList.filter(tv => !isDeceased(tv)).length}
                                </div>
                                <div className="text-xs text-neutral-500">Còn sống</div>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <div className="text-2xl mb-2">🕯️</div>
                                <div className="text-2xl font-bold text-neutral-500">
                                    {thanhVienList.filter(tv => isDeceased(tv)).length}
                                </div>
                                <div className="text-xs text-neutral-500">Đã mất</div>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <div className="text-2xl mb-2">👫</div>
                                <div className="text-2xl font-bold text-violet-600">
                                    {new Set(thanhVienList.map(tv => tv.DOI)).size || 0}
                                </div>
                                <div className="text-xs text-neutral-500">Số đời</div>
                            </div>
                        </div>

                        {/* Family Tree View Component with CRUD actions */}
                        <FamilyTreeView
                            members={thanhVienList}
                            relationships={relationships}
                            canManage={canManage}
                            onEdit={handleEditMember}
                            onDelete={handleDeleteMember}
                            MaGiaPha={MaGiaPha}
                        />
                    </div>
                )}
            </main>

            {/* ===== MARRIAGE MODAL ===== */}
            {showMarriageModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
                                <FiHeart className="text-pink-500" />
                                Thêm quan hệ hôn nhân
                            </h3>
                            <button
                                onClick={() => setShowMarriageModal(false)}
                                className="p-2 hover:bg-neutral-100 rounded-lg"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitMarriage} className="space-y-4">
                            {/* Chồng */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    👨 Chọn Chồng *
                                </label>
                                <select
                                    value={marriageForm.MaChong}
                                    onChange={(e) => setMarriageForm(prev => ({ ...prev, MaChong: e.target.value }))}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">-- Chọn chồng --</option>
                                    {maleMembers.map(m => (
                                        <option key={m.MaTV} value={m.MaTV}>
                                            {m.HoTen} (Đời {m.DOI || 0})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Vợ */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    👩 Chọn Vợ *
                                </label>
                                <select
                                    value={marriageForm.MaVo}
                                    onChange={(e) => setMarriageForm(prev => ({ ...prev, MaVo: e.target.value }))}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">-- Chọn vợ --</option>
                                    {femaleMembers.map(m => (
                                        <option key={m.MaTV} value={m.MaTV}>
                                            {m.HoTen} (Đời {m.DOI || 0})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Ngày kết hôn */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    📅 Ngày kết hôn
                                </label>
                                <DateInput
                                    value={marriageForm.NgayBatDau}
                                    onChange={(e) => setMarriageForm(prev => ({ ...prev, NgayBatDau: e.target.value }))}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowMarriageModal(false)}
                                    className="flex-1 px-4 py-3 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingMarriage}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isSubmittingMarriage ? 'Đang lưu...' : 'Thêm hôn nhân'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== PARENT-CHILD MODAL ===== */}
            {showParentChildModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-neutral-800 flex items-center gap-2">
                                👨‍👩‍👧 Thêm quan hệ cha-mẹ-con
                            </h3>
                            <button
                                onClick={() => setShowParentChildModal(false)}
                                className="p-2 hover:bg-neutral-100 rounded-lg"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitParentChild} className="space-y-4">
                            {/* Con */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    👶 Chọn Con *
                                </label>
                                <select
                                    value={parentChildForm.MaCon}
                                    onChange={(e) => setParentChildForm(prev => ({ ...prev, MaCon: e.target.value }))}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">-- Chọn con --</option>
                                    {thanhVienList.map(m => (
                                        <option key={m.MaTV} value={m.MaTV}>
                                            {m.HoTen} ({m.GioiTinh}, Đời {m.DOI || 0})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Cha */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    👨 Chọn Cha
                                </label>
                                <select
                                    value={parentChildForm.MaTVCha}
                                    onChange={(e) => setParentChildForm(prev => ({ ...prev, MaTVCha: e.target.value }))}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                    <option value="">-- Không chọn --</option>
                                    {maleMembers.map(m => (
                                        <option key={m.MaTV} value={m.MaTV} disabled={m.MaTV === parentChildForm.MaCon}>
                                            {m.HoTen} (Đời {m.DOI || 0})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Mẹ */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    👩 Chọn Mẹ
                                </label>
                                <select
                                    value={parentChildForm.MaTVMe}
                                    onChange={(e) => setParentChildForm(prev => ({ ...prev, MaTVMe: e.target.value }))}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                    <option value="">-- Không chọn --</option>
                                    {femaleMembers.map(m => (
                                        <option key={m.MaTV} value={m.MaTV} disabled={m.MaTV === parentChildForm.MaCon}>
                                            {m.HoTen} (Đời {m.DOI || 0})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <p className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg">
                                💡 Bạn cần chọn ít nhất một trong hai: cha hoặc mẹ
                            </p>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowParentChildModal(false)}
                                    className="flex-1 px-4 py-3 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingParentChild}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isSubmittingParentChild ? 'Đang lưu...' : 'Thêm quan hệ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
