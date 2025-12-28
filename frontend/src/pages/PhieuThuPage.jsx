/**
 * ============================================
 * PHIẾU THU PAGE - Quản lý thu quỹ họ
 * ============================================
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiCheck, FiX, FiDollarSign, FiCalendar, FiUser, FiClock, FiBarChart2 } from 'react-icons/fi';
import phieuThuService from '../services/phieuthu';
import thanhVienService from '../services/thanhvien';
import { usePermissions } from '../hooks/usePermissions';

export default function PhieuThuPage() {
    const { canRecordIncome, isAdmin, isOwner } = usePermissions();

    const [phieuThuList, setPhieuThuList] = useState([]);
    const [pendingList, setPendingList] = useState([]);
    const [danhMucList, setDanhMucList] = useState([]);
    const [thanhVienList, setThanhVienList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('list'); // 'list', 'pending', 'create', 'report'

    // Report state
    const [reportData, setReportData] = useState(null);
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [isLoadingReport, setIsLoadingReport] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        MaTV: '',
        chiTietPhieuThu: []
    });
    const [selectedDanhMuc, setSelectedDanhMuc] = useState('');
    const [soTienThu, setSoTienThu] = useState('');

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        // Load each data source independently to prevent cascade failures
        try {
            const phieuThu = await phieuThuService.getAll();
            setPhieuThuList(phieuThu || []);
        } catch (err) {
            console.error('Error loading phieuthu:', err);
            setPhieuThuList([]);
        }

        try {
            const pending = await phieuThuService.getPending();
            setPendingList(pending || []);
        } catch (err) {
            console.error('Error loading pending:', err);
            setPendingList([]);
        }

        try {
            const danhMuc = await phieuThuService.getDanhMuc();
            setDanhMucList(danhMuc || []);
        } catch (err) {
            console.error('Error loading danhmuc:', err);
            setError('Không thể tải danh mục. Vui lòng thử lại sau.');
            setDanhMucList([]);
        }

        try {
            const thanhVien = await thanhVienService.getAll();
            setThanhVienList(thanhVien || []);
        } catch (err) {
            console.error('Error loading thanhvien:', err);
            if (!error) {
                setError('Không thể tải danh sách thành viên. Vui lòng thử lại sau.');
            }
            setThanhVienList([]);
        }

        setIsLoading(false);
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Add danh mục to form
    const addDanhMucToForm = () => {
        if (!selectedDanhMuc || !soTienThu || parseFloat(soTienThu) <= 0) return;

        const dm = danhMucList.find(d => d.MaDM === selectedDanhMuc);
        if (!dm) return;

        // Check if already added
        if (formData.chiTietPhieuThu.find(ct => ct.MaDMT === selectedDanhMuc)) {
            alert('Danh mục này đã được thêm!');
            return;
        }

        setFormData(prev => ({
            ...prev,
            chiTietPhieuThu: [...prev.chiTietPhieuThu, {
                MaDMT: selectedDanhMuc,
                TenDM: dm.TenDM,
                SoTienThu: parseFloat(soTienThu)
            }]
        }));
        setSelectedDanhMuc('');
        setSoTienThu('');
    };

    // Remove danh mục from form
    const removeDanhMucFromForm = (MaDMT) => {
        setFormData(prev => ({
            ...prev,
            chiTietPhieuThu: prev.chiTietPhieuThu.filter(ct => ct.MaDMT !== MaDMT)
        }));
    };

    // Submit create form
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.MaTV || formData.chiTietPhieuThu.length === 0) {
            alert('Vui lòng chọn thành viên và thêm ít nhất 1 khoản thu!');
            return;
        }

        try {
            await phieuThuService.create({
                MaTV: formData.MaTV,
                chiTietPhieuThu: formData.chiTietPhieuThu.map(ct => ({
                    MaDMT: ct.MaDMT,
                    SoTienThu: ct.SoTienThu
                }))
            });
            alert('Tạo phiếu thu thành công!');
            setFormData({ MaTV: '', chiTietPhieuThu: [] });
            setActiveTab('list');
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi tạo phiếu thu');
        }
    };

    // Xác nhận phiếu thu
    const handleXacNhan = async (MaPhieuThu, MaDMT) => {
        if (!confirm('Xác nhận khoản thu này?')) return;
        try {
            await phieuThuService.xacNhan(MaPhieuThu, MaDMT);
            alert('Xác nhận thành công!');
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi xác nhận');
        }
    };

    // Calculate total
    const calculateTotal = () => {
        return formData.chiTietPhieuThu.reduce((sum, ct) => sum + ct.SoTienThu, 0);
    };

    // Load report by year
    const loadReport = async (year = reportYear) => {
        setIsLoadingReport(true);
        try {
            const data = await phieuThuService.traCuuDanhMuc(year);
            setReportData(data);
        } catch (err) {
            console.error('Error loading report:', err);
            setReportData(null);
        } finally {
            setIsLoadingReport(false);
        }
    };

    // Load report when switching to report tab
    useEffect(() => {
        if (activeTab === 'report' && !reportData) {
            loadReport();
        }
    }, [activeTab]);

    return (
        <div className="min-h-screen">
            {/* Decorative Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-200/20 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-200/20 to-transparent rounded-full blur-3xl"></div>
            </div>

            {/* Navigation */}
            <nav className="navbar px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 text-neutral-600 hover:text-emerald-600 transition-colors"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                            <span className="hidden md:inline">Dashboard</span>
                        </Link>
                        <div className="h-6 w-px bg-neutral-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white shadow-lg">
                                <FiDollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Thu Quỹ Họ
                                </h1>
                                <p className="text-xs text-neutral-500">{phieuThuList.length} phiếu thu</p>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 animate-fade-in">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'list'
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'bg-white text-neutral-600 hover:bg-neutral-50'
                            }`}
                    >
                        📋 Danh sách phiếu thu
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'pending'
                            ? 'bg-orange-500 text-white shadow-lg'
                            : 'bg-white text-neutral-600 hover:bg-neutral-50'
                            }`}
                    >
                        <FiClock className="w-4 h-4" />
                        Chờ xác nhận
                        {pendingList.length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {pendingList.length}
                            </span>
                        )}
                    </button>
                    {canRecordIncome && (
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'create'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white text-neutral-600 hover:bg-neutral-50'
                                }`}
                        >
                            <FiPlus className="w-4 h-4" />
                            Tạo phiếu thu
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'report'
                            ? 'bg-violet-600 text-white shadow-lg'
                            : 'bg-white text-neutral-600 hover:bg-neutral-50'
                            }`}
                    >
                        <FiBarChart2 className="w-4 h-4" />
                        Báo cáo thu chi
                    </button>
                </div>

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
                        <p className="text-neutral-500">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        {/* List Tab */}
                        {activeTab === 'list' && (
                            <div className="animate-fade-in">
                                {phieuThuList.length === 0 ? (
                                    <div className="glass-card p-12 text-center">
                                        <div className="text-6xl mb-4">💰</div>
                                        <h3 className="text-xl font-bold text-neutral-800 mb-2">Chưa có phiếu thu nào</h3>
                                        <p className="text-neutral-500">Nhấn "Tạo phiếu thu" để bắt đầu</p>
                                    </div>
                                ) : (
                                    <div className="glass-card overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gradient-to-r from-emerald-50 to-green-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Mã phiếu</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Người đóng</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Ngày thu</th>
                                                    <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">Tổng thu</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100">
                                                {phieuThuList.map((pt) => (
                                                    <tr key={pt.MaPhieuThu} className="hover:bg-neutral-50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <span className="font-mono text-sm bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                                                                {pt.MaPhieuThu}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <FiUser className="w-4 h-4 text-neutral-400" />
                                                                <span>{pt.HoTen || pt.MaTV}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-neutral-500 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <FiCalendar className="w-4 h-4" />
                                                                {formatDate(pt.NgayThu)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                                                            {formatCurrency(pt.TongThu)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pending Tab */}
                        {activeTab === 'pending' && (
                            <div className="animate-fade-in">
                                {pendingList.length === 0 ? (
                                    <div className="glass-card p-12 text-center">
                                        <div className="text-6xl mb-4">✅</div>
                                        <h3 className="text-xl font-bold text-neutral-800 mb-2">Không có phiếu chờ xác nhận</h3>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingList.map((item, idx) => (
                                            <div key={idx} className="glass-card p-4 flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="font-mono text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                                            {item.MaPhieuThu}
                                                        </span>
                                                        <span className="text-sm text-neutral-500">{item.TenDM}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                                                        <span className="flex items-center gap-1">
                                                            <FiUser className="w-4 h-4" />
                                                            {item.HoTenNguoiDong}
                                                        </span>
                                                        <span className="font-semibold text-emerald-600">
                                                            {formatCurrency(item.SoTienThu)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {(isAdmin || isOwner) && (
                                                    <button
                                                        onClick={() => handleXacNhan(item.MaPhieuThu, item.MaDMT)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                                    >
                                                        <FiCheck className="w-4 h-4" />
                                                        Xác nhận
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Create Tab */}
                        {activeTab === 'create' && canRecordIncome && (
                            <div className="animate-fade-in">
                                <form onSubmit={handleCreate} className="glass-card p-6">
                                    <h3 className="text-lg font-bold text-neutral-800 mb-6">Tạo phiếu thu mới</h3>

                                    {/* Select member */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Người đóng góp *
                                        </label>
                                        <select
                                            value={formData.MaTV}
                                            onChange={(e) => setFormData(prev => ({ ...prev, MaTV: e.target.value }))}
                                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">-- Chọn thành viên --</option>
                                            {thanhVienList.map(tv => (
                                                <option key={tv.MaTV} value={tv.MaTV}>
                                                    {tv.HoTen} ({tv.MaTV})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Add danh mục */}
                                    <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Thêm khoản thu
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedDanhMuc}
                                                onChange={(e) => setSelectedDanhMuc(e.target.value)}
                                                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg"
                                            >
                                                <option value="">-- Chọn danh mục --</option>
                                                {danhMucList.map(dm => (
                                                    <option key={dm.MaDM} value={dm.MaDM}>
                                                        {dm.TenDM}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                value={soTienThu}
                                                onChange={(e) => setSoTienThu(e.target.value)}
                                                placeholder="Số tiền"
                                                className="w-40 px-4 py-2 border border-neutral-200 rounded-lg"
                                                min="1"
                                            />
                                            <button
                                                type="button"
                                                onClick={addDanhMucToForm}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <FiPlus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* List added items */}
                                    {formData.chiTietPhieuThu.length > 0 && (
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                                Các khoản thu đã thêm
                                            </label>
                                            <div className="space-y-2">
                                                {formData.chiTietPhieuThu.map((ct, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                                        <div>
                                                            <span className="font-medium">{ct.TenDM}</span>
                                                            <span className="ml-3 text-emerald-600 font-semibold">
                                                                {formatCurrency(ct.SoTienThu)}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDanhMucFromForm(ct.MaDMT)}
                                                            className="p-1 text-red-500 hover:bg-red-100 rounded"
                                                        >
                                                            <FiX className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <div className="flex justify-end pt-2 border-t border-neutral-200">
                                                    <span className="font-bold text-lg text-emerald-600">
                                                        Tổng: {formatCurrency(calculateTotal())}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit */}
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('list')}
                                            className="px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={formData.chiTietPhieuThu.length === 0}
                                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Tạo phiếu thu
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Report Tab */}
                        {activeTab === 'report' && (
                            <div className="animate-fade-in">
                                <div className="glass-card p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-neutral-800">Báo cáo thu chi theo năm</h3>
                                        <div className="flex items-center gap-3">
                                            <label className="text-sm text-neutral-600">Năm:</label>
                                            <select
                                                value={reportYear}
                                                onChange={(e) => {
                                                    const year = parseInt(e.target.value);
                                                    setReportYear(year);
                                                    loadReport(year);
                                                }}
                                                className="px-3 py-1.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                            >
                                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {isLoadingReport ? (
                                        <div className="text-center py-8">
                                            <div className="spinner mx-auto mb-4"></div>
                                            <p className="text-neutral-500">Đang tải báo cáo...</p>
                                        </div>
                                    ) : reportData ? (
                                        <>
                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                <div className="bg-emerald-50 p-4 rounded-lg text-center">
                                                    <div className="text-2xl mb-1">💰</div>
                                                    <div className="text-lg font-bold text-emerald-600">{formatCurrency(reportData.tongThuNam)}</div>
                                                    <div className="text-xs text-neutral-500">Tổng thu</div>
                                                </div>
                                                <div className="bg-red-50 p-4 rounded-lg text-center">
                                                    <div className="text-2xl mb-1">💸</div>
                                                    <div className="text-lg font-bold text-red-600">{formatCurrency(reportData.tongChiNam)}</div>
                                                    <div className="text-xs text-neutral-500">Tổng chi</div>
                                                </div>
                                                <div className={`p-4 rounded-lg text-center ${reportData.tongDuThieu >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                                                    <div className="text-2xl mb-1">{reportData.tongDuThieu >= 0 ? '📈' : '📉'}</div>
                                                    <div className={`text-lg font-bold ${reportData.tongDuThieu >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                        {formatCurrency(Math.abs(reportData.tongDuThieu))}
                                                    </div>
                                                    <div className="text-xs text-neutral-500">
                                                        {reportData.tongDuThieu >= 0 ? 'Dư' : 'Thiếu'}
                                                    </div>
                                                </div>
                                                <div className="bg-violet-50 p-4 rounded-lg text-center">
                                                    <div className="text-2xl mb-1">📂</div>
                                                    <div className="text-lg font-bold text-violet-600">{reportData.tongSoDanhMuc}</div>
                                                    <div className="text-xs text-neutral-500">Danh mục</div>
                                                </div>
                                            </div>

                                            {/* Detailed Table */}
                                            {reportData.danhSach && reportData.danhSach.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-gradient-to-r from-violet-50 to-purple-50">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">STT</th>
                                                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Danh mục</th>
                                                                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Người đảm nhận</th>
                                                                <th className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">Thu</th>
                                                                <th className="px-4 py-3 text-right text-sm font-semibold text-red-700">Chi</th>
                                                                <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">Dư/Thiếu</th>
                                                                <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-700">Trạng thái</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-neutral-100">
                                                            {reportData.danhSach.map((item, idx) => (
                                                                <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                                                                    <td className="px-4 py-3 text-neutral-600">{item.STT}</td>
                                                                    <td className="px-4 py-3 font-medium text-neutral-800">{item.TenDM}</td>
                                                                    <td className="px-4 py-3 text-neutral-600">{item.NguoiDamNhan?.HoTen || '-'}</td>
                                                                    <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatCurrency(item.TongThu)}</td>
                                                                    <td className="px-4 py-3 text-right font-medium text-red-600">{formatCurrency(item.TongChi)}</td>
                                                                    <td className={`px-4 py-3 text-right font-medium ${item.DuThieu >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                                        {formatCurrency(Math.abs(item.DuThieu))}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.TrangThai === 'Dư' ? 'bg-blue-100 text-blue-700' :
                                                                            item.TrangThai === 'Thiếu' ? 'bg-orange-100 text-orange-700' :
                                                                                'bg-neutral-100 text-neutral-600'
                                                                            }`}>
                                                                            {item.TrangThai}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-neutral-500">
                                                    Không có dữ liệu cho năm {reportYear}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-neutral-500">
                                            Nhấn chọn năm để xem báo cáo
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
