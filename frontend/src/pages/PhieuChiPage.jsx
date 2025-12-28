/**
 * ============================================
 * PHIẾU CHI PAGE - Quản lý chi quỹ họ
 * ============================================
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiDollarSign, FiCalendar, FiUser, FiFileText } from 'react-icons/fi';
import phieuChiService from '../services/phieuchi';
import phieuThuService from '../services/phieuthu';
import { usePermissions } from '../hooks/usePermissions';

export default function PhieuChiPage() {
    const { canRecordExpense, isAdmin, isOwner } = usePermissions();

    const [phieuChiList, setPhieuChiList] = useState([]);
    const [danhMucList, setDanhMucList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('list'); // 'list', 'create'

    // Form state
    const [formData, setFormData] = useState({
        MaDMC: '',
        SoTienChi: '',
        LyDoChi: ''
    });

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        // Load each data source independently
        try {
            const phieuChi = await phieuChiService.getAll();
            setPhieuChiList(phieuChi || []);
        } catch (err) {
            console.error('Error loading phieuchi:', err);
            setPhieuChiList([]);
        }

        try {
            const danhMuc = await phieuThuService.getDanhMuc();
            setDanhMucList(danhMuc || []);
        } catch (err) {
            console.error('Error loading danhmuc:', err);
            setError('Không thể tải danh mục. Vui lòng thử lại sau.');
            setDanhMucList([]);
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

    // Submit create form
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.MaDMC || !formData.SoTienChi || parseFloat(formData.SoTienChi) <= 0) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        try {
            await phieuChiService.create({
                MaDMC: formData.MaDMC,
                SoTienChi: parseFloat(formData.SoTienChi),
                LyDoChi: formData.LyDoChi || ''
            });
            alert('Tạo phiếu chi thành công!');
            setFormData({ MaDMC: '', SoTienChi: '', LyDoChi: '' });
            setActiveTab('list');
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi tạo phiếu chi');
        }
    };

    // Delete phiếu chi
    const handleDelete = async (MaPhieuChi) => {
        if (!confirm('Xác nhận xóa phiếu chi này?')) return;
        try {
            await phieuChiService.delete(MaPhieuChi);
            alert('Xóa phiếu chi thành công!');
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi xóa phiếu chi');
        }
    };

    // Calculate total
    const calculateTotal = () => {
        return phieuChiList.reduce((sum, pc) => sum + (pc.SoTienChi || 0), 0);
    };

    return (
        <div className="min-h-screen">
            {/* Decorative Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-200/20 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-200/20 to-transparent rounded-full blur-3xl"></div>
            </div>

            {/* Navigation */}
            <nav className="navbar px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 text-neutral-600 hover:text-red-600 transition-colors"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                            <span className="hidden md:inline">Dashboard</span>
                        </Link>
                        <div className="h-6 w-px bg-neutral-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-orange-600 flex items-center justify-center text-white shadow-lg">
                                <FiDollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                                    Chi Quỹ Họ
                                </h1>
                                <p className="text-xs text-neutral-500">{phieuChiList.length} phiếu chi</p>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 animate-fade-in">
                    <div className="glass-card p-4 text-center">
                        <div className="text-2xl mb-2">📝</div>
                        <div className="text-2xl font-bold text-neutral-800">{phieuChiList.length}</div>
                        <div className="text-xs text-neutral-500">Phiếu chi</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <div className="text-2xl mb-2">💸</div>
                        <div className="text-lg font-bold text-red-600">{formatCurrency(calculateTotal())}</div>
                        <div className="text-xs text-neutral-500">Tổng chi</div>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <div className="text-2xl mb-2">📂</div>
                        <div className="text-2xl font-bold text-neutral-800">{danhMucList.length}</div>
                        <div className="text-xs text-neutral-500">Danh mục</div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 animate-fade-in">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'list'
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'bg-white text-neutral-600 hover:bg-neutral-50'
                            }`}
                    >
                        📋 Danh sách phiếu chi
                    </button>
                    {canRecordExpense && (
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'create'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white text-neutral-600 hover:bg-neutral-50'
                                }`}
                        >
                            <FiPlus className="w-4 h-4" />
                            Tạo phiếu chi
                        </button>
                    )}
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
                                {phieuChiList.length === 0 ? (
                                    <div className="glass-card p-12 text-center">
                                        <div className="text-6xl mb-4">💸</div>
                                        <h3 className="text-xl font-bold text-neutral-800 mb-2">Chưa có phiếu chi nào</h3>
                                        <p className="text-neutral-500">Nhấn "Tạo phiếu chi" để bắt đầu</p>
                                    </div>
                                ) : (
                                    <div className="glass-card overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gradient-to-r from-red-50 to-orange-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Mã phiếu</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Người lập</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Danh mục</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Lý do</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Ngày chi</th>
                                                    <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">Số tiền</th>
                                                    {canRecordExpense && (
                                                        <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-700">Thao tác</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100">
                                                {phieuChiList.map((pc) => (
                                                    <tr key={pc.MaPhieuChi} className="hover:bg-neutral-50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <span className="font-mono text-sm bg-red-100 text-red-700 px-2 py-1 rounded">
                                                                {pc.MaPhieuChi}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <FiUser className="w-4 h-4 text-neutral-400" />
                                                                <span>{pc.HoTenNguoiChi || pc.MaTV}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                                                {pc.TenDM || pc.MaDMC}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-neutral-600 text-sm max-w-xs truncate">
                                                            <div className="flex items-center gap-1">
                                                                <FiFileText className="w-4 h-4 text-neutral-400" />
                                                                {pc.LyDoChi || '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-neutral-500 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <FiCalendar className="w-4 h-4" />
                                                                {formatDate(pc.NgayChi)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-red-600">
                                                            {formatCurrency(pc.SoTienChi)}
                                                        </td>
                                                        {canRecordExpense && (
                                                            <td className="px-4 py-3 text-center">
                                                                <button
                                                                    onClick={() => handleDelete(pc.MaPhieuChi)}
                                                                    className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                                                    title="Xóa phiếu chi"
                                                                >
                                                                    <FiTrash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Create Tab */}
                        {activeTab === 'create' && canRecordExpense && (
                            <div className="animate-fade-in">
                                <form onSubmit={handleCreate} className="glass-card p-6 max-w-lg">
                                    <h3 className="text-lg font-bold text-neutral-800 mb-6">Tạo phiếu chi mới</h3>

                                    {/* Select danh mục */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Danh mục chi *
                                        </label>
                                        <select
                                            value={formData.MaDMC}
                                            onChange={(e) => setFormData(prev => ({ ...prev, MaDMC: e.target.value }))}
                                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">-- Chọn danh mục --</option>
                                            {danhMucList.map(dm => (
                                                <option key={dm.MaDM} value={dm.MaDM}>
                                                    {dm.TenDM} ({dm.MaDM})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Số tiền chi */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Số tiền chi *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.SoTienChi}
                                            onChange={(e) => setFormData(prev => ({ ...prev, SoTienChi: e.target.value }))}
                                            placeholder="Nhập số tiền"
                                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            min="1"
                                            required
                                        />
                                    </div>

                                    {/* Lý do chi */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                                            Lý do chi
                                        </label>
                                        <textarea
                                            value={formData.LyDoChi}
                                            onChange={(e) => setFormData(prev => ({ ...prev, LyDoChi: e.target.value }))}
                                            placeholder="Mô tả lý do chi tiền..."
                                            rows={3}
                                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                        />
                                    </div>

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
                                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Tạo phiếu chi
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
