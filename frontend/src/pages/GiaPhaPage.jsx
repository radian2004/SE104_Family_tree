/**
 * ============================================
 * GIA PHẢ PAGE - Quản lý cây gia phả
 * ============================================
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiHome, FiCalendar, FiMapPin } from 'react-icons/fi';
import giaPhaService from '../services/giapha.js';

export default function GiaPhaPage() {
    const navigate = useNavigate();
    const [giaPhaList, setGiaPhaList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load gia phả list on mount
    useEffect(() => {
        const loadGiaPha = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await giaPhaService.getAll();
                setGiaPhaList(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Lỗi tải danh sách gia phả');
                console.error('Error loading gia pha:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadGiaPha();
    }, []);

    return (
        <div className="min-h-screen">
            {/* Decorative Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-200/20 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-200/20 to-transparent rounded-full blur-3xl"></div>
            </div>

            {/* Navigation */}
            <nav className="navbar px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 text-neutral-600 hover:text-orange-600 transition-colors"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                            <span className="hidden md:inline">Dashboard</span>
                        </Link>
                        <div className="h-6 w-px bg-neutral-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                                <span className="text-xl">🌳</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Gia Phả
                                </h1>
                                <p className="text-xs text-neutral-500">{giaPhaList.length} gia phả</p>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="mb-8 animate-fade-in">
                    <h2 className="heading-display mb-2">Quản lý Gia Phả</h2>
                    <p className="text-neutral-600">
                        Xem và quản lý các cây gia phả trong hệ thống
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
                    <div className="glass-card p-4 text-center hover:scale-105 transition-transform">
                        <div className="text-2xl mb-2">🌳</div>
                        <div className="text-2xl font-bold text-neutral-800">{giaPhaList.length}</div>
                        <div className="text-xs text-neutral-500">Tổng gia phả</div>
                    </div>
                    <div className="glass-card p-4 text-center hover:scale-105 transition-transform">
                        <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
                        <div className="text-2xl font-bold text-emerald-600">
                            {giaPhaList.reduce((sum, gp) => sum + (gp.SoThanhVien || 0), 0) || '-'}
                        </div>
                        <div className="text-xs text-neutral-500">Tổng thành viên</div>
                    </div>
                    <div className="glass-card p-4 text-center hover:scale-105 transition-transform">
                        <div className="text-2xl mb-2">📊</div>
                        <div className="text-2xl font-bold text-violet-600">
                            {giaPhaList.reduce((sum, gp) => sum + (gp.SoDoi || 0), 0) || '-'}
                        </div>
                        <div className="text-xs text-neutral-500">Tổng số đời</div>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="alert alert-danger mb-6 animate-fade-in">
                        <span className="text-lg">⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

                {/* List Section */}
                {isLoading ? (
                    <div className="glass-card p-12 text-center animate-fade-in">
                        <div className="spinner spinner-large mx-auto mb-4"></div>
                        <p className="text-neutral-500">Đang tải danh sách gia phả...</p>
                    </div>
                ) : giaPhaList.length === 0 ? (
                    <div className="glass-card p-12 text-center animate-fade-in">
                        <div className="text-6xl mb-4">🌳</div>
                        <h3 className="text-xl font-bold text-neutral-800 mb-2">Chưa có gia phả nào</h3>
                        <p className="text-neutral-500">Hãy liên hệ quản trị viên để tạo gia phả mới</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
                        {giaPhaList.map((giaPha) => (
                            <div
                                key={giaPha.MaGiaPha}
                                className="glass-card overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
                                onClick={() => navigate(`/giapha/${giaPha.MaGiaPha}`)}
                            >
                                {/* Header Gradient */}
                                <div className="h-24 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 relative overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-5xl opacity-50 group-hover:scale-110 transition-transform">🌳</span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/50 to-transparent"></div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-neutral-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                                        {giaPha.TenGiaPha}
                                    </h3>

                                    <div className="space-y-2 text-sm text-neutral-600">
                                        <div className="flex items-center gap-2">
                                            <FiHome className="w-4 h-4 text-neutral-400" />
                                            <span>Mã: {giaPha.MaGiaPha}</span>
                                        </div>
                                        {giaPha.NgayLap && (
                                            <div className="flex items-center gap-2">
                                                <FiCalendar className="w-4 h-4 text-neutral-400" />
                                                <span>
                                                    Ngày lập: {new Date(giaPha.NgayLap).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        )}
                                        {giaPha.DiaChi && (
                                            <div className="flex items-center gap-2">
                                                <FiMapPin className="w-4 h-4 text-neutral-400" />
                                                <span>{giaPha.DiaChi}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action */}
                                    <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                                            <FiUsers className="w-4 h-4" />
                                            <span>{giaPha.SoThanhVien || '?'} thành viên</span>
                                        </div>
                                        <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                                            Xem chi tiết →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
