/**
 * ============================================
 * BÁO CÁO PAGE - Báo cáo thống kê theo năm
 * ============================================
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiBarChart2, FiTrendingUp, FiTrendingDown, FiAward, FiUsers, FiDollarSign } from 'react-icons/fi';
import thanhvienService from '../services/thanhvien.js';
import thanhtichService from '../services/thanhtich.js';
import phieuThuService from '../services/phieuthu.js';
import giaPhaService from '../services/giapha.js';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';

export default function BaoCaoPage() {
    const currentYear = new Date().getFullYear();
    const { user } = useAuth();
    const { isAdmin, isOwner } = usePermissions();

    // State
    const [activeTab, setActiveTab] = useState('thanhvien'); // 'thanhvien' | 'thanhtich' | 'thuChi'
    const [namBatDau, setNamBatDau] = useState(currentYear - 5);
    const [namKetThuc, setNamKetThuc] = useState(currentYear);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Gia phả selector
    const [giaPhaList, setGiaPhaList] = useState([]);
    const [selectedGiaPha, setSelectedGiaPha] = useState(''); // MaGiaPha

    // Data
    const [baoCaoThanhVien, setBaoCaoThanhVien] = useState([]);
    const [baoCaoThanhTich, setBaoCaoThanhTich] = useState([]);
    const [baoCaoThuChi, setBaoCaoThuChi] = useState(null);

    // Load gia phả list on mount
    useEffect(() => {
        const loadGiaPhaList = async () => {
            try {
                let data = await giaPhaService.getAll();

                // ⭐ FILTER FOR OWNER: Only show their own gia phả
                if (isOwner && !isAdmin && user?.MaGiaPha) {
                    data = data.filter(gp => gp.MaGiaPha === user.MaGiaPha);
                }

                setGiaPhaList(data);
                // Select first gia pha by default if available
                if (data.length > 0) {
                    setSelectedGiaPha(data[0].MaGiaPha);
                }
            } catch (err) {
                console.error('Error loading gia pha list:', err);
            }
        };
        loadGiaPhaList();
    }, [isOwner, isAdmin, user?.MaGiaPha]);

    // Load báo cáo
    const loadBaoCao = async () => {
        if (!selectedGiaPha) return; // Wait for gia pha selection

        console.log('[BaoCaoPage] Starting loadBaoCao...');
        console.log('[BaoCaoPage] selectedGiaPha:', selectedGiaPha);
        console.log('[BaoCaoPage] activeTab:', activeTab);
        console.log('[BaoCaoPage] namBatDau:', namBatDau, 'namKetThuc:', namKetThuc);

        setIsLoading(true);
        setError(null);
        try {
            if (activeTab === 'thanhvien') {
                console.log('[BaoCaoPage] Calling thanhvienService.getBaoCao...');
                const response = await thanhvienService.getBaoCao({
                    NamBatDau: namBatDau,
                    NamKetThuc: namKetThuc,
                    MaGiaPha: selectedGiaPha
                });
                console.log('[BaoCaoPage] thanhvien response:', response);
                // Backend returns { result: { NamBatDau, NamKetThuc, DanhSach, TongSinh, TongKetHon, TongMat } }
                const data = response?.result?.DanhSach || [];
                console.log('[BaoCaoPage] Setting baoCaoThanhVien:', data);
                setBaoCaoThanhVien(Array.isArray(data) ? data : []);
            } else if (activeTab === 'thanhtich') {
                console.log('[BaoCaoPage] Calling thanhtichService.getBaoCao...');
                const response = await thanhtichService.getBaoCao({
                    NamBatDau: namBatDau,
                    NamKetThuc: namKetThuc,
                    MaGiaPha: selectedGiaPha
                });
                console.log('[BaoCaoPage] thanhtich response:', response);
                // Backend returns {result: {NamBatDau, NamKetThuc, TongSoLuong, DanhSach: [...]}}
                const data = response?.result?.DanhSach || [];
                console.log('[BaoCaoPage] Setting baoCaoThanhTich:', data);
                setBaoCaoThanhTich(Array.isArray(data) ? data : []);
            } else if (activeTab === 'thuChi') {
                console.log('[BaoCaoPage] Calling phieuThuService.traCuuDanhMuc...');
                const response = await phieuThuService.traCuuDanhMuc(namKetThuc, selectedGiaPha);
                console.log('[BaoCaoPage] thuChi response:', response);
                setBaoCaoThuChi(response);
            }
        } catch (err) {
            console.error('[BaoCaoPage] Error:', err);
            console.error('[BaoCaoPage] Error response:', err.response);
            setError(err.response?.data?.message || err.message || 'Lỗi tải báo cáo');
        } finally {
            setIsLoading(false);
            console.log('[BaoCaoPage] loadBaoCao finished');
        }
    };

    useEffect(() => {
        console.log('[BaoCaoPage] useEffect triggered, activeTab:', activeTab, 'selectedGiaPha:', selectedGiaPha);
        if (selectedGiaPha) {
            loadBaoCao();
        }
    }, [activeTab, selectedGiaPha]);

    // Tính tổng - sử dụng đúng tên trường từ backend (SoSinh, SoKetHon, SoMat)
    const totalSinh = Array.isArray(baoCaoThanhVien) ? baoCaoThanhVien.reduce((sum, row) => sum + Number(row.SoSinh || row.SoLuongSinh || 0), 0) : 0;
    const totalKetHon = Array.isArray(baoCaoThanhVien) ? baoCaoThanhVien.reduce((sum, row) => sum + Number(row.SoKetHon || row.SoLuongKetHon || 0), 0) : 0;
    const totalMat = Array.isArray(baoCaoThanhVien) ? baoCaoThanhVien.reduce((sum, row) => sum + Number(row.SoMat || row.SoLuongMat || 0), 0) : 0;
    const totalThanhTich = Array.isArray(baoCaoThanhTich) ? baoCaoThanhTich.reduce((sum, row) => sum + Number(row.SoLuong || 0), 0) : 0;

    return (
        <div className="min-h-screen">
            {/* Decorative Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-200/20 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-200/20 to-transparent rounded-full blur-3xl"></div>
            </div>

            {/* Navigation */}
            <nav className="navbar px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2 text-neutral-600 hover:text-violet-600 transition-colors"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        <span>Quay lại</span>
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-800 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                        📊 Báo cáo thống kê
                    </h1>
                    <p className="text-neutral-500">Thống kê thành viên và thành tích theo năm</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('thanhvien')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'thanhvien'
                            ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg'
                            : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                            }`}
                    >
                        <FiUsers className="w-5 h-5" />
                        Báo cáo thành viên
                    </button>
                    <button
                        onClick={() => setActiveTab('thanhtich')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'thanhtich'
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                            : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                            }`}
                    >
                        <FiAward className="w-5 h-5" />
                        Báo cáo thành tích
                    </button>
                    <button
                        onClick={() => setActiveTab('thuChi')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'thuChi'
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                            : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                            }`}
                    >
                        <FiDollarSign className="w-5 h-5" />
                        Báo cáo thu chi
                    </button>
                </div>

                {/* Filters */}
                <div className="glass-card p-6 mb-6">
                    {/* Row 1: GiaPha Selector - Full width row */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                            🌳 Chọn Gia Phả
                        </label>
                        <div className="max-w-md">
                            <select
                                value={selectedGiaPha}
                                onChange={(e) => setSelectedGiaPha(e.target.value)}
                                className="w-full px-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-neutral-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
                            >
                                {giaPhaList.length === 0 && (
                                    <option value="">Đang tải...</option>
                                )}
                                {giaPhaList.map((gp) => (
                                    <option key={gp.MaGiaPha} value={gp.MaGiaPha}>
                                        {gp.TenGiaPha} ({gp.MaGiaPha})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Year filters + Submit button */}
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-1">Từ năm</label>
                            <input
                                type="number"
                                value={namBatDau}
                                onChange={(e) => setNamBatDau(Number(e.target.value))}
                                className="input w-28"
                                min="1900"
                                max={currentYear}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-1">Đến năm</label>
                            <input
                                type="number"
                                value={namKetThuc}
                                onChange={(e) => setNamKetThuc(Number(e.target.value))}
                                className="input w-28"
                                min="1900"
                                max={currentYear}
                            />
                        </div>
                        <button
                            onClick={loadBaoCao}
                            disabled={isLoading || !selectedGiaPha}
                            className="btn btn-primary px-6"
                        >
                            {isLoading ? 'Đang tải...' : '📊 Xem báo cáo'}
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="alert alert-danger mb-6">
                        <span className="text-lg">⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="glass-card p-12 text-center">
                        <div className="spinner spinner-large mx-auto mb-4"></div>
                        <p className="text-neutral-500">Đang tải báo cáo...</p>
                    </div>
                )}

                {/* ==================== BÁO CÁO THÀNH VIÊN ==================== */}
                {!isLoading && activeTab === 'thanhvien' && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="glass-card p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                                        <FiTrendingUp className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-neutral-800">{totalSinh}</div>
                                        <div className="text-sm text-neutral-500">Tổng số sinh</div>
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                                        <span className="text-2xl">💒</span>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-neutral-800">{totalKetHon}</div>
                                        <div className="text-sm text-neutral-500">Tổng kết hôn</div>
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neutral-400 to-neutral-600 flex items-center justify-center">
                                        <span className="text-2xl">🕯️</span>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-neutral-800">{totalMat}</div>
                                        <div className="text-sm text-neutral-500">Tổng qua đời</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="glass-card overflow-hidden">
                            <div className="px-6 py-4 border-b border-neutral-100">
                                <h2 className="text-xl font-bold text-neutral-800">
                                    Chi tiết theo năm ({namBatDau} - {namKetThuc})
                                </h2>
                            </div>

                            {baoCaoThanhVien.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="text-5xl mb-4">📊</div>
                                    <p className="text-neutral-500">Không có dữ liệu trong khoảng thời gian này</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-neutral-50 border-b border-neutral-100">
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">STT</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">Năm</th>
                                                <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-600">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <FiTrendingUp className="w-4 h-4" />
                                                        Số sinh
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 text-center text-sm font-semibold text-pink-600">
                                                    <div className="flex items-center justify-center gap-1">
                                                        💒 Kết hôn
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-600">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <FiTrendingDown className="w-4 h-4" />
                                                        Qua đời
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {baoCaoThanhVien.map((row, index) => (
                                                <tr key={row.Nam || index} className="border-b border-neutral-100 hover:bg-neutral-50">
                                                    <td className="px-6 py-4 text-sm text-neutral-500">{row.STT || index + 1}</td>
                                                    <td className="px-6 py-4 font-medium text-neutral-800">{row.Nam}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">
                                                            +{row.SoSinh || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-pink-100 text-pink-700">
                                                            {row.SoKetHon || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-neutral-100 text-neutral-600">
                                                            {row.SoMat || 0}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-neutral-50 font-bold">
                                                <td className="px-6 py-4" colSpan="2">Tổng cộng</td>
                                                <td className="px-6 py-4 text-center text-emerald-600">{totalSinh}</td>
                                                <td className="px-6 py-4 text-center text-pink-600">{totalKetHon}</td>
                                                <td className="px-6 py-4 text-center text-neutral-600">{totalMat}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )
                }

                {/* ==================== BÁO CÁO THÀNH TÍCH ==================== */}
                {
                    !isLoading && activeTab === 'thanhtich' && (
                        <div className="space-y-6">
                            {/* Summary Card */}
                            <div className="glass-card p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                        <FiAward className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-neutral-800">{totalThanhTich}</div>
                                        <div className="text-sm text-neutral-500">Tổng thành tích đạt được</div>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="glass-card overflow-hidden">
                                <div className="px-6 py-4 border-b border-neutral-100">
                                    <h2 className="text-xl font-bold text-neutral-800">
                                        Chi tiết thành tích theo năm ({namBatDau} - {namKetThuc})
                                    </h2>
                                </div>

                                {baoCaoThanhTich.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="text-5xl mb-4">🏆</div>
                                        <p className="text-neutral-500">Không có dữ liệu trong khoảng thời gian này</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-neutral-50 border-b border-neutral-100">
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">STT</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">Năm</th>
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">Loại thành tích</th>
                                                    <th className="px-6 py-4 text-center text-sm font-semibold text-amber-600">Số lượng</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {baoCaoThanhTich.map((row, index) => (
                                                    <tr key={`${row.Nam}-${row.LoaiThanhTich || row.TenLTT}-${index}`} className="border-b border-neutral-100 hover:bg-neutral-50">
                                                        <td className="px-6 py-4 text-sm text-neutral-500">{row.STT || index + 1}</td>
                                                        <td className="px-6 py-4 font-medium text-neutral-800">{row.Nam}</td>
                                                        <td className="px-6 py-4 text-neutral-700">{row.TenLTT || row.LoaiThanhTich || '-'}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700">
                                                                🏆 {row.SoLuong || 0}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-neutral-50 font-bold">
                                                    <td className="px-6 py-4" colSpan="3">Tổng cộng</td>
                                                    <td className="px-6 py-4 text-center text-amber-600">{totalThanhTich}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Thu Chi Report */}
                {
                    !isLoading && activeTab === 'thuChi' && (
                        <div className="glass-card overflow-hidden animate-fade-in">
                            <div className="p-6 border-b border-neutral-100 bg-gradient-to-r from-emerald-50 to-green-50">
                                <h2 className="text-xl font-bold text-neutral-800">
                                    💰 Báo cáo thu chi năm {namKetThuc}
                                </h2>
                            </div>

                            {!baoCaoThuChi ? (
                                <div className="p-12 text-center">
                                    <div className="text-5xl mb-4">💵</div>
                                    <p className="text-neutral-500">Nhấn "Xem báo cáo" để tải dữ liệu thu chi</p>
                                </div>
                            ) : (
                                <>
                                    {/* Summary Cards */}
                                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50">
                                        <div className="bg-white p-4 rounded-xl text-center shadow-sm">
                                            <div className="text-2xl mb-2">💰</div>
                                            <div className="text-lg font-bold text-emerald-600">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baoCaoThuChi.tongThuNam || 0)}
                                            </div>
                                            <div className="text-xs text-neutral-500">Tổng thu</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl text-center shadow-sm">
                                            <div className="text-2xl mb-2">💸</div>
                                            <div className="text-lg font-bold text-red-600">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baoCaoThuChi.tongChiNam || 0)}
                                            </div>
                                            <div className="text-xs text-neutral-500">Tổng chi</div>
                                        </div>
                                        <div className={`bg-white p-4 rounded-xl text-center shadow-sm`}>
                                            <div className="text-2xl mb-2">{(baoCaoThuChi.tongDuThieu || 0) >= 0 ? '📈' : '📉'}</div>
                                            <div className={`text-lg font-bold ${(baoCaoThuChi.tongDuThieu || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.abs(baoCaoThuChi.tongDuThieu || 0))}
                                            </div>
                                            <div className="text-xs text-neutral-500">{(baoCaoThuChi.tongDuThieu || 0) >= 0 ? 'Dư' : 'Thiếu'}</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl text-center shadow-sm">
                                            <div className="text-2xl mb-2">📂</div>
                                            <div className="text-lg font-bold text-violet-600">{baoCaoThuChi.tongSoDanhMuc || 0}</div>
                                            <div className="text-xs text-neutral-500">Danh mục</div>
                                        </div>
                                    </div>

                                    {/* Detailed Table */}
                                    {baoCaoThuChi.danhSach && baoCaoThuChi.danhSach.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-neutral-50 border-b border-neutral-100">
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">STT</th>
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">Danh mục</th>
                                                        <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">Người đảm nhận</th>
                                                        <th className="px-6 py-4 text-right text-sm font-semibold text-emerald-600">Tổng thu</th>
                                                        <th className="px-6 py-4 text-right text-sm font-semibold text-red-600">Tổng chi</th>
                                                        <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-600">Dư/Thiếu</th>
                                                        <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-600">Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {baoCaoThuChi.danhSach.map((item, idx) => (
                                                        <tr key={idx} className="border-b border-neutral-100 hover:bg-neutral-50">
                                                            <td className="px-6 py-4 text-sm text-neutral-500">{item.STT}</td>
                                                            <td className="px-6 py-4 font-medium text-neutral-800">{item.TenDM}</td>
                                                            <td className="px-6 py-4 text-neutral-600">{item.NguoiDamNhan?.HoTen || '-'}</td>
                                                            <td className="px-6 py-4 text-right font-medium text-emerald-600">
                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.TongThu || 0)}
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-medium text-red-600">
                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.TongChi || 0)}
                                                            </td>
                                                            <td className={`px-6 py-4 text-right font-medium ${(item.DuThieu || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.abs(item.DuThieu || 0))}
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${item.TrangThai === 'Dư' ? 'bg-blue-100 text-blue-700' :
                                                                    item.TrangThai === 'Thiếu' ? 'bg-orange-100 text-orange-700' :
                                                                        'bg-neutral-100 text-neutral-600'
                                                                    }`}>
                                                                    {item.TrangThai || 'Cân bằng'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-neutral-50 font-bold">
                                                        <td className="px-6 py-4" colSpan="3">Tổng cộng</td>
                                                        <td className="px-6 py-4 text-right text-emerald-600">
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baoCaoThuChi.tongThuNam || 0)}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-red-600">
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(baoCaoThuChi.tongChiNam || 0)}
                                                        </td>
                                                        <td className={`px-6 py-4 text-right ${(baoCaoThuChi.tongDuThieu || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.abs(baoCaoThuChi.tongDuThieu || 0))}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${(baoCaoThuChi.tongDuThieu || 0) >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                {(baoCaoThuChi.tongDuThieu || 0) >= 0 ? 'Dư' : 'Thiếu'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center">
                                            <div className="text-5xl mb-4">📊</div>
                                            <p className="text-neutral-500">Không có dữ liệu thu chi trong năm {namKetThuc}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
            </main>
        </div>
    );
}
