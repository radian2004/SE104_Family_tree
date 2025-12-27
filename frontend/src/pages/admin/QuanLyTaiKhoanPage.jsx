/**
 * ============================================
 * QUẢN LÝ TÀI KHOẢN PAGE (Admin Only)
 * Trang phân quyền cho Admin
 * Premium Design - Consistent with other pages
 * ============================================
 */

import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FiArrowLeft,
    FiUsers,
    FiSearch,
    FiFilter,
    FiArrowUp,
    FiArrowDown,
    FiShield,
    FiRefreshCw,
    FiCheck,
    FiX,
    FiInfo
} from 'react-icons/fi';
import { taikhoanService } from '../../services/taikhoan';
import { usePermissions, ACCOUNT_TYPE_ICONS, ACCOUNT_TYPE_NAMES } from '../../hooks/usePermissions';

export default function QuanLyTaiKhoanPage() {
    const navigate = useNavigate();
    const { isAdmin, roleName, roleIcon } = usePermissions();

    // State
    const [accounts, setAccounts] = useState([]);
    const [accountTypes, setAccountTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showFilter, setShowFilter] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        MaLoaiTK: '',
    });

    // Stats
    const stats = {
        total: accounts.length,
        admin: accounts.filter(a => a.MaLoaiTK === 'LTK01').length,
        owner: accounts.filter(a => a.MaLoaiTK === 'LTK02').length,
        user: accounts.filter(a => a.MaLoaiTK === 'LTK03').length,
    };

    // Load accounts
    const loadAccounts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await taikhoanService.getAllAccounts(filters);
            setAccounts(response.result || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi tải danh sách tài khoản');
            console.error('Error loading accounts:', err);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    // Load account types
    const loadAccountTypes = useCallback(async () => {
        try {
            const response = await taikhoanService.getAccountTypes();
            setAccountTypes(response.result || []);
        } catch (err) {
            console.error('Error loading account types:', err);
        }
    }, []);

    useEffect(() => {
        loadAccounts();
        loadAccountTypes();
    }, [loadAccounts, loadAccountTypes]);

    // Clear messages after 5 seconds
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    // Handle search
    const handleSearchChange = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    // Handle filter by account type
    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, MaLoaiTK: e.target.value }));
    };

    // Handle promote to Owner
    const handlePromote = async (email) => {
        if (!window.confirm(`Bạn có chắc muốn cấp quyền "Người lập cây gia phả" cho:\n${email}?`)) {
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await taikhoanService.promoteToOwner(email);
            setSuccess(`✅ ${response.message}`);
            loadAccounts();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi cấp quyền');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle demote to User
    const handleDemote = async (email) => {
        if (!window.confirm(`Bạn có chắc muốn hạ quyền về "Thành viên" cho:\n${email}?`)) {
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await taikhoanService.demoteToUser(email);
            setSuccess(`✅ ${response.message}`);
            loadAccounts();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi hạ quyền');
        } finally {
            setIsLoading(false);
        }
    };

    // Get role badge style
    const getRoleBadgeStyle = (MaLoaiTK) => {
        switch (MaLoaiTK) {
            case 'LTK01':
                return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' };
            case 'LTK02':
                return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' };
            case 'LTK03':
                return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
        }
    };

    return (
        <div className="min-h-screen">
            {/* Decorative Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-200/20 to-transparent rounded-full blur-3xl"></div>
            </div>

            {/* Navigation */}
            <nav className="navbar px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 text-neutral-600 hover:text-purple-600 transition-colors"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                            <span className="hidden md:inline">Dashboard</span>
                        </Link>
                        <div className="h-6 w-px bg-neutral-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                                <FiShield className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Phân quyền
                                </h1>
                                <p className="text-xs text-neutral-500">{stats.total} tài khoản</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={loadAccounts}
                        disabled={isLoading}
                        className="btn btn-primary group"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden md:inline">Làm mới</span>
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="mb-8 animate-fade-in">
                    <h2 className="heading-display mb-2">👑 Quản lý tài khoản</h2>
                    <p className="text-neutral-600">
                        Cấp quyền "Người lập cây gia phả" hoặc hạ quyền về "Thành viên" cho các tài khoản trong hệ thống
                    </p>
                </div>

                {/* Messages */}
                {error && (
                    <div className="alert alert-danger mb-6 animate-fade-in flex items-center gap-2">
                        <FiX className="w-5 h-5" />
                        <p>{error}</p>
                    </div>
                )}
                {success && (
                    <div className="alert alert-success mb-6 animate-fade-in flex items-center gap-2">
                        <FiCheck className="w-5 h-5" />
                        <p>{success}</p>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
                    <div className="glass-card p-4 text-center hover:scale-105 transition-transform">
                        <div className="text-2xl mb-2">📊</div>
                        <div className="text-2xl font-bold text-neutral-800">{stats.total}</div>
                        <div className="text-xs text-neutral-500">Tổng tài khoản</div>
                    </div>
                    <div className="glass-card p-4 text-center hover:scale-105 transition-transform border-l-4 border-purple-500">
                        <div className="text-2xl mb-2">👑</div>
                        <div className="text-2xl font-bold text-purple-600">{stats.admin}</div>
                        <div className="text-xs text-neutral-500">Quản trị viên</div>
                    </div>
                    <div className="glass-card p-4 text-center hover:scale-105 transition-transform border-l-4 border-emerald-500">
                        <div className="text-2xl mb-2">🏠</div>
                        <div className="text-2xl font-bold text-emerald-600">{stats.owner}</div>
                        <div className="text-xs text-neutral-500">Người lập gia phả</div>
                    </div>
                    <div className="glass-card p-4 text-center hover:scale-105 transition-transform border-l-4 border-blue-500">
                        <div className="text-2xl mb-2">👤</div>
                        <div className="text-2xl font-bold text-blue-600">{stats.user}</div>
                        <div className="text-xs text-neutral-500">Thành viên</div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className={`btn btn-ghost btn-small ${showFilter ? 'bg-purple-100 text-purple-600' : ''}`}
                        >
                            <FiFilter className="w-4 h-4" />
                            Bộ lọc
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <FiInfo className="w-4 h-4" />
                        <span>Nhấn vào nút để thay đổi quyền</span>
                    </div>
                </div>

                {/* Filter Section */}
                {showFilter && (
                    <div className="glass-card p-6 mb-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Tìm kiếm
                                </label>
                                <div className="relative">
                                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm theo email hoặc họ tên..."
                                        value={filters.search}
                                        onChange={handleSearchChange}
                                        className="input-field pl-12 w-full"
                                    />
                                </div>
                            </div>

                            {/* Filter by account type */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Loại tài khoản
                                </label>
                                <select
                                    value={filters.MaLoaiTK}
                                    onChange={handleFilterChange}
                                    className="input-field w-full"
                                >
                                    <option value="">Tất cả loại tài khoản</option>
                                    {accountTypes.map(type => (
                                        <option key={type.MaLoaiTK} value={type.MaLoaiTK}>
                                            {ACCOUNT_TYPE_ICONS[type.MaLoaiTK]} {type.TenLoaiTK || ACCOUNT_TYPE_NAMES[type.MaLoaiTK]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Account Table */}
                <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-neutral-500">Đang tải dữ liệu...</p>
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="p-12 text-center">
                            <FiUsers className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                            <h3 className="text-lg font-medium text-neutral-600 mb-2">Không tìm thấy tài khoản</h3>
                            <p className="text-neutral-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-neutral-100 border-b border-neutral-200">
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                            Họ tên
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                            Gia phả
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                            Loại tài khoản
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                            Hành động
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {accounts.map((account, index) => {
                                        const roleStyle = getRoleBadgeStyle(account.MaLoaiTK);
                                        return (
                                            <tr
                                                key={account.TenDangNhap}
                                                className="hover:bg-neutral-50 transition-colors"
                                                style={{ animationDelay: `${index * 0.05}s` }}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                                            {account.TenDangNhap?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-neutral-800">{account.TenDangNhap}</div>
                                                            <div className="text-xs text-neutral-500">
                                                                {new Date(account.TGTaoMoi).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-neutral-700">{account.HoTen || '—'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-neutral-600">{account.TenGiaPha || '—'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                                                        <span>{ACCOUNT_TYPE_ICONS[account.MaLoaiTK]}</span>
                                                        <span>{ACCOUNT_TYPE_NAMES[account.MaLoaiTK]}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {account.MaLoaiTK === 'LTK01' ? (
                                                        <span className="text-neutral-400 text-sm italic">Admin</span>
                                                    ) : account.MaLoaiTK === 'LTK02' ? (
                                                        <button
                                                            onClick={() => handleDemote(account.TenDangNhap)}
                                                            disabled={isLoading}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-all disabled:opacity-50 font-medium text-sm"
                                                            title="Hạ quyền về Thành viên"
                                                        >
                                                            <FiArrowDown className="w-4 h-4" />
                                                            Hạ quyền
                                                        </button>
                                                    ) : account.MaLoaiTK === 'LTK03' ? (
                                                        <button
                                                            onClick={() => handlePromote(account.TenDangNhap)}
                                                            disabled={isLoading}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-all disabled:opacity-50 font-medium text-sm"
                                                            title="Cấp quyền Người lập gia phả"
                                                        >
                                                            <FiArrowUp className="w-4 h-4" />
                                                            Cấp quyền
                                                        </button>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Permission Matrix */}
                <div className="glass-card p-6 mt-8 animate-fade-in" style={{ animationDelay: '0.4s', opacity: 0 }}>
                    <h3 className="text-xl font-bold text-neutral-800 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                        📋 Bảng phân quyền hệ thống
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-neutral-200">
                                    <th className="py-3 text-left font-semibold text-neutral-700">Nghiệp vụ</th>
                                    <th className="py-3 text-center font-semibold text-purple-600">
                                        <span className="inline-flex items-center gap-1">👑 QTV</span>
                                    </th>
                                    <th className="py-3 text-center font-semibold text-emerald-600">
                                        <span className="inline-flex items-center gap-1">🏠 Trưởng tộc</span>
                                    </th>
                                    <th className="py-3 text-center font-semibold text-blue-600">
                                        <span className="inline-flex items-center gap-1">👤 Thành viên</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {[
                                    { name: 'Tiếp nhận thành viên', admin: true, owner: true, user: false },
                                    { name: 'Tra cứu thành viên', admin: true, owner: true, user: true },
                                    { name: 'Ghi nhận thành tích', admin: true, owner: true, user: false },
                                    { name: 'Tra cứu thành tích', admin: true, owner: true, user: true },
                                    { name: 'Ghi nhận kết thúc', admin: true, owner: true, user: false },
                                    { name: 'Tra cứu kết thúc', admin: true, owner: true, user: true },
                                    { name: 'Lập báo cáo năm', admin: true, owner: true, user: true },
                                    { name: 'Thay đổi quy định', admin: true, owner: true, user: false },
                                    { name: 'Phân quyền', admin: true, owner: false, user: false, highlight: true },
                                    { name: 'Thêm danh mục thu/chi', admin: true, owner: true, user: false },
                                    { name: 'Ghi nhận thu quỹ họ', admin: true, owner: true, user: true },
                                    { name: 'Ghi nhận chi quỹ họ', admin: true, owner: true, user: false },
                                    { name: 'Tra cứu danh mục thu/chi', admin: true, owner: true, user: true },
                                ].map((row, index) => (
                                    <tr
                                        key={row.name}
                                        className={`hover:bg-neutral-50 ${row.highlight ? 'bg-purple-50' : ''}`}
                                    >
                                        <td className={`py-3 ${row.highlight ? 'font-semibold text-purple-700' : 'text-neutral-700'}`}>
                                            {row.name}
                                        </td>
                                        <td className="py-3 text-center">
                                            {row.admin ? (
                                                <span className="text-emerald-500 text-lg">✓</span>
                                            ) : (
                                                <span className="text-neutral-300">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-center">
                                            {row.owner ? (
                                                <span className="text-emerald-500 text-lg">✓</span>
                                            ) : (
                                                <span className="text-neutral-300">—</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-center">
                                            {row.user ? (
                                                <span className="text-emerald-500 text-lg">✓</span>
                                            ) : (
                                                <span className="text-neutral-300">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-12 text-center text-neutral-500 text-sm">
                    <p>© 2025 Gia Phả Management System. Designed by SE104 team</p>
                </footer>
            </main>
        </div>
    );
}
