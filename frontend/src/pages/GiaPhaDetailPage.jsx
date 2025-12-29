/**
 * ============================================
 * GIA PHẢ DETAIL PAGE - Chi tiết cây gia phả
 * Với chức năng thêm/sửa/xóa thành viên và quan hệ
 * ============================================
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiUserPlus, FiRefreshCw, FiCheck, FiCalendar, FiX } from 'react-icons/fi';
import giaPhaService from '../services/giapha.js';
import thanhvienService from '../services/thanhvien.js';
import { useLookupsStore } from '../store/lookupsStore.js';
import { usePermissions } from '../hooks/usePermissions';
import FamilyTreeView from '../components/giapha/FamilyTreeView.jsx';


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
                        to="/dashboard"
                        className="flex items-center gap-2 text-neutral-600 hover:text-emerald-600 transition-colors"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        <span>Quay lại</span>
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
                            <Link
                                to={`/thanhvien/create?MaGiaPha=${MaGiaPha}`}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <FiUserPlus className="w-4 h-4" />
                                <span>Thêm thành viên</span>
                            </Link>
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
                        <div className="grid grid-cols-3 gap-4 mb-8">
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
        </div>
    );
}
