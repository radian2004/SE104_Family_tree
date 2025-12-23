/**
 * ============================================
 * GIA PHẢ DETAIL PAGE - Chi tiết cây gia phả
 * ============================================
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiCalendar, FiUser, FiMapPin } from 'react-icons/fi';
import giaPhaService from '../services/giapha.js';
import { useLookupsStore } from '../store/lookupsStore.js';

export default function GiaPhaDetailPage() {
    const navigate = useNavigate();
    const { MaGiaPha } = useParams();
    const { cayGiaPha } = useLookupsStore();

    const [giaPha, setGiaPha] = useState(null);
    const [thanhVienList, setThanhVienList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load gia phả detail and members
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Get gia pha info from store
                const found = cayGiaPha?.find(gp => gp.MaGiaPha === MaGiaPha);
                if (found) {
                    setGiaPha(found);
                }

                // Get members of this gia pha
                const members = await giaPhaService.getThanhVienByGiaPha(MaGiaPha);
                setThanhVienList(Array.isArray(members) ? members : []);
            } catch (err) {
                setError(err.response?.data?.message || 'Lỗi tải thông tin gia phả');
                console.error('Error loading gia pha detail:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (MaGiaPha) {
            loadData();
        }
    }, [MaGiaPha, cayGiaPha]);

    // Check if member is deceased
    const isDeceased = (tv) => {
        const status = (tv.TrangThai || '').toLowerCase();
        return status.includes('mất') || status.includes('mat');
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
                        to="/giapha"
                        className="flex items-center gap-2 text-neutral-600 hover:text-emerald-600 transition-colors"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        <span>Quay lại danh sách</span>
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Error Alert */}
                {error && (
                    <div className="alert alert-danger mb-6 animate-fade-in">
                        <span className="text-lg">⚠️</span>
                        <p>{error}</p>
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
                                    {new Set(thanhVienList.map(tv => tv.DOI)).size || '-'}
                                </div>
                                <div className="text-xs text-neutral-500">Số đời</div>
                            </div>
                        </div>

                        {/* Members List */}
                        <div className="glass-card overflow-hidden">
                            <div className="px-6 py-4 border-b border-neutral-100">
                                <h2 className="text-xl font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Danh sách thành viên
                                </h2>
                            </div>

                            {thanhVienList.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-5xl mb-4">👤</div>
                                    <p className="text-neutral-500">Chưa có thành viên nào trong gia phả này</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-neutral-50 border-b border-neutral-100">
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">Họ tên</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">Giới tính</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">Ngày sinh</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">Đời</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {thanhVienList.map((tv) => (
                                                <tr
                                                    key={tv.MaTV}
                                                    className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors"
                                                    onClick={() => navigate(`/thanhvien/${tv.MaTV}`)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${tv.GioiTinh === 'Nữ'
                                                                    ? 'bg-pink-100 text-pink-600'
                                                                    : 'bg-blue-100 text-blue-600'
                                                                }`}>
                                                                {tv.GioiTinh === 'Nữ' ? '👩' : '👨'}
                                                            </div>
                                                            <span className="font-medium text-neutral-800">{tv.HoTen}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-neutral-600">{tv.GioiTinh}</td>
                                                    <td className="px-6 py-4 text-sm text-neutral-600">
                                                        {tv.NgayGioSinh
                                                            ? new Date(tv.NgayGioSinh).toLocaleDateString('vi-VN')
                                                            : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-neutral-600">{tv.DOI || '-'}</td>
                                                    <td className="px-6 py-4">
                                                        {isDeceased(tv) ? (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">
                                                                Đã mất
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                                Còn sống
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
