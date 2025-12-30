/**
 * ============================================
 * THÀNH TÍCH PAGE - Premium Design V2
 * Trang ghi nhận thành tích với thiết kế đẹp
 * ============================================
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    FiArrowLeft, FiAward, FiPlus, FiSearch, FiFilter,
    FiCalendar, FiUser, FiEdit2, FiTrash2, FiX, FiCheck,
    FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown,
    FiTrendingUp, FiUsers, FiStar
} from 'react-icons/fi';
import thanhTichService from '../services/thanhtich';
import thanhVienService from '../services/thanhvien';
import lookupsService from '../services/lookups';
import { useLookupsStore } from '../store/lookupsStore';
import { usePermissions } from '../hooks/usePermissions';
import DateInput from '../components/common/DateInput';
import GiaPhaSelector from '../components/common/GiaPhaSelector';

export default function ThanhTichPage() {
    const { isAdmin, isOwner } = usePermissions();
    const canEdit = isAdmin || isOwner;
    const loaithanhtich = useLookupsStore((state) => state.loaithanhtich);
    const setLoaiThanhTich = useLookupsStore((state) => state.setLoaiThanhTich);

    // Data state
    const [thanhTichs, setThanhTichs] = useState([]);
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Filter state
    const [searchName, setSearchName] = useState('');
    const [filterLoai, setFilterLoai] = useState('');
    const [filterTuNgay, setFilterTuNgay] = useState('');
    const [filterDenNgay, setFilterDenNgay] = useState('');
    const [filterGiaPha, setFilterGiaPha] = useState('');

    // Sort state
    const [sortField, setSortField] = useState('NgayPhatSinh');
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Add modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState('');
    const [selectedLoai, setSelectedLoai] = useState('');
    const [ngayPhatSinh, setNgayPhatSinh] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Member search for autocomplete
    const [memberSearch, setMemberSearch] = useState('');
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);
    const [filteredMembers, setFilteredMembers] = useState([]);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editLoai, setEditLoai] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Load members for autocomplete - filtered by selected GiaPha
    useEffect(() => {
        const loadMembers = async () => {
            try {
                // ✅ Filter members by selected GiaPha
                const params = filterGiaPha ? { MaGiaPha: filterGiaPha } : {};
                const data = await thanhVienService.getAll(params);
                setMembers(Array.isArray(data) ? data : (data.items || []));
            } catch (err) {
                console.error('Error loading members:', err);
            }
        };
        loadMembers();
    }, [filterGiaPha]);  // ✅ Reload when GiaPha changes

    // Load loại thành tích từ API
    useEffect(() => {
        const loadLoaiThanhTich = async () => {
            try {
                const data = await lookupsService.getLoaiThanhTich();
                setLoaiThanhTich(data || []);
            } catch (err) {
                console.error('Error loading loai thanh tich:', err);
            }
        };
        // Only load if not already loaded
        if (!loaithanhtich || loaithanhtich.length === 0) {
            loadLoaiThanhTich();
        }
    }, [loaithanhtich, setLoaiThanhTich]);

    // Filter members for autocomplete
    useEffect(() => {
        if (memberSearch.trim()) {
            const filtered = members.filter(m =>
                m.HoTen?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                m.MaTV?.toLowerCase().includes(memberSearch.toLowerCase())
            ).slice(0, 8);
            setFilteredMembers(filtered);
        } else {
            setFilteredMembers([]);
        }
    }, [memberSearch, members]);

    // Load thành tích
    const loadThanhTich = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const params = {};
            if (searchName) params.HoTen = searchName;
            if (filterLoai) {
                // Backend expects TenLoaiThanhTich, get name from MaLTT
                const loai = loaithanhtich?.find(l => l.MaLTT === filterLoai);
                if (loai) params.TenLoaiThanhTich = loai.TenLTT;
            }
            if (filterTuNgay) params.TuNgay = filterTuNgay;
            if (filterDenNgay) params.DenNgay = filterDenNgay;
            if (filterGiaPha) params.MaGiaPha = filterGiaPha;

            const res = await thanhTichService.traCuu(params);
            setThanhTichs(res.data || res.result || res || []);
        } catch (err) {
            console.error('Error loading achievements:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách thành tích');
        } finally {
            setIsLoading(false);
        }
    }, [searchName, filterLoai, filterTuNgay, filterDenNgay, filterGiaPha, loaithanhtich]);

    useEffect(() => {
        loadThanhTich();
    }, [loadThanhTich]);

    // Clear messages
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    // Sorted and paginated data
    const sortedData = useMemo(() => {
        const sorted = [...thanhTichs].sort((a, b) => {
            let aVal, bVal;

            switch (sortField) {
                case 'HoTen':
                    aVal = a.HoTen || '';
                    bVal = b.HoTen || '';
                    break;
                case 'ThanhTich':
                    aVal = a.ThanhTich || '';
                    bVal = b.ThanhTich || '';
                    break;
                case 'NgayPhatSinh':
                default:
                    aVal = a.NgayPhatSinh ? new Date(a.NgayPhatSinh).getTime() : 0;
                    bVal = b.NgayPhatSinh ? new Date(b.NgayPhatSinh).getTime() : 0;
                    break;
            }

            if (sortField === 'NgayPhatSinh') {
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            }

            return sortOrder === 'asc'
                ? aVal.localeCompare(bVal, 'vi')
                : bVal.localeCompare(aVal, 'vi');
        });

        return sorted;
    }, [thanhTichs, sortField, sortOrder]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Stats
    const stats = useMemo(() => {
        const thisYear = new Date().getFullYear();
        const thisYearCount = thanhTichs.filter(t =>
            t.NgayPhatSinh && new Date(t.NgayPhatSinh).getFullYear() === thisYear
        ).length;
        const uniqueMembers = new Set(thanhTichs.map(t => t.MaTV)).size;
        const uniqueTypes = new Set(thanhTichs.map(t => t.ThanhTich)).size;
        return { total: thanhTichs.length, thisYear: thisYearCount, uniqueMembers, uniqueTypes };
    }, [thanhTichs]);

    // Handlers
    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <FiChevronDown className="w-4 h-4 opacity-30" />;
        return sortOrder === 'asc'
            ? <FiChevronUp className="w-4 h-4 text-amber-600" />
            : <FiChevronDown className="w-4 h-4 text-amber-600" />;
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        loadThanhTich();
    };

    const handleClearFilters = () => {
        setSearchName('');
        setFilterLoai('');
        setFilterTuNgay('');
        setFilterDenNgay('');
        setCurrentPage(1);
    };

    const handleSelectMember = (member) => {
        setSelectedMember(member.MaTV);
        setMemberSearch(member.HoTen);
        setShowMemberDropdown(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!selectedMember || !selectedLoai) {
            setError('Vui lòng chọn thành viên và loại thành tích');
            return;
        }

        // Validate NgayPhatSinh against future
        if (ngayPhatSinh) {
            const date = new Date(ngayPhatSinh);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            if (date > now) {
                setError('Ngày ghi nhận không được lớn hơn ngày hiện tại');
                return;
            }
        }

        try {
            setIsAdding(true);
            setError(null);
            await thanhTichService.ghiNhan({
                MaTV: selectedMember,
                MaLTT: selectedLoai,
                NgayPhatSinh: ngayPhatSinh || undefined
            });

            setShowAddModal(false);
            setSelectedMember('');
            setSelectedLoai('');
            setNgayPhatSinh('');
            setMemberSearch('');
            setSuccessMsg('Đã ghi nhận thành tích thành công!');
            loadThanhTich();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Xóa thành tích "${item.ThanhTich}" của ${item.HoTen}?`)) return;

        try {
            const loai = loaithanhtich?.find(l => l.TenLTT === item.ThanhTich);
            if (!loai) {
                setError('Không tìm thấy mã loại thành tích');
                return;
            }

            await thanhTichService.xoa({
                MaTV: item.MaTV,
                MaLTT: loai.MaLTT,
                NgayPhatSinh: item.NgayPhatSinh
            });
            setSuccessMsg('Đã xóa thành tích');
            loadThanhTich();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa thành tích');
        }
    };

    const openEditModal = (item) => {
        const loai = loaithanhtich?.find(l => l.TenLTT === item.ThanhTich);
        setEditingItem(item);
        setEditLoai(loai?.MaLTT || '');
        setShowEditModal(true);
    };

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
                MaTV: editingItem.MaTV,
                MaLTT: currentLoai.MaLTT,
                NgayPhatSinh: editingItem.NgayPhatSinh,
                MaLTTMoi: editLoai
            });
            setSuccessMsg('Đã cập nhật thành tích');
            setShowEditModal(false);
            setEditingItem(null);
            loadThanhTich();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật');
        } finally {
            setIsUpdating(false);
        }
    };

    // Achievement type color mapping
    const getTypeColor = (type) => {
        const colors = {
            'Huân chương Lao động': 'bg-red-100 text-red-700 border-red-200',
            'Bằng khen Thủ tướng': 'bg-purple-100 text-purple-700 border-purple-200',
            'Chiến sĩ thi đua': 'bg-green-100 text-green-700 border-green-200',
            'Giấy khen cấp tỉnh': 'bg-blue-100 text-blue-700 border-blue-200',
            'Học bổng giỏi': 'bg-amber-100 text-amber-700 border-amber-200',
            'Giải thưởng khoa học kỹ thuật': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        };
        return colors[type] || 'bg-neutral-100 text-neutral-700 border-neutral-200';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30">
            {/* Decorative Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-amber-200/30 to-orange-200/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-yellow-200/30 to-amber-200/20 rounded-full blur-3xl"></div>
            </div>

            {/* Navigation */}
            <nav className="bg-white/70 backdrop-blur-xl border-b border-amber-100/50 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-2 text-neutral-600 hover:text-amber-600 transition-colors font-medium"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        <span>Quay lại Dashboard</span>
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/30">
                            <FiAward className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Ghi nhận thành tích
                            </h1>
                            <p className="text-neutral-500 mt-1">Quản lý và theo dõi thành tích của các thành viên</p>
                        </div>
                    </div>

                    {canEdit && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <FiPlus className="w-5 h-5" />
                            Thêm thành tích
                        </button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                                <FiAward className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{stats.total}</p>
                                <p className="text-sm text-neutral-500">Tổng thành tích</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                                <FiTrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{stats.thisYear}</p>
                                <p className="text-sm text-neutral-500">Năm nay</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                <FiUsers className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{stats.uniqueMembers}</p>
                                <p className="text-sm text-neutral-500">Thành viên</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                                <FiStar className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{stats.uniqueTypes}</p>
                                <p className="text-sm text-neutral-500">Loại thành tích</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {successMsg && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3 animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <FiCheck className="w-5 h-5" />
                        </div>
                        <span className="font-medium">{successMsg}</span>
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <FiX className="w-5 h-5" />
                        </div>
                        <span className="font-medium flex-1">{error}</span>
                        <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg">
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-100 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FiFilter className="w-5 h-5 text-amber-600" />
                        <h3 className="font-semibold text-neutral-800">Bộ lọc & Tìm kiếm</h3>
                    </div>
                    {/* GiaPha Selector - Admin only - on separate row */}
                    <div className="mb-4 max-w-sm">
                        <GiaPhaSelector value={filterGiaPha} onChange={setFilterGiaPha} />
                    </div>

                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-2">Tên thành viên</label>
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    placeholder="Tìm theo tên..."
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-2">Loại thành tích</label>
                            <select
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                value={filterLoai}
                                onChange={(e) => setFilterLoai(e.target.value)}
                            >
                                <option value="">Tất cả loại</option>
                                {loaithanhtich?.map(l => (
                                    <option key={l.MaLTT} value={l.MaLTT}>{l.TenLTT}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-2">Từ ngày</label>
                            <DateInput
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                value={filterTuNgay}
                                onChange={(e) => setFilterTuNgay(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-2">Đến ngày</label>
                            <DateInput
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                value={filterDenNgay}
                                onChange={(e) => setFilterDenNgay(e.target.value)}
                            />
                        </div>
                    </form>
                    <div className="flex gap-3 mt-5">
                        <button
                            type="submit"
                            onClick={handleSearch}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors"
                        >
                            <FiSearch className="w-4 h-4" />
                            Tìm kiếm
                        </button>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-100 text-neutral-600 font-medium rounded-xl hover:bg-neutral-200 transition-colors"
                        >
                            <FiX className="w-4 h-4" />
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="text-center py-16">
                            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-neutral-500 font-medium">Đang tải dữ liệu...</p>
                        </div>
                    ) : thanhTichs.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
                                <FiAward className="w-10 h-10 text-amber-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Chưa có thành tích nào</h3>
                            <p className="text-neutral-500 mb-6">Hãy bắt đầu ghi nhận thành tích đầu tiên</p>
                            {canEdit && (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors"
                                >
                                    <FiPlus className="w-4 h-4" />
                                    Thêm thành tích
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600 w-16">STT</th>
                                            <th className="px-6 py-4 text-left">
                                                <button
                                                    onClick={() => handleSort('HoTen')}
                                                    className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-amber-600 transition-colors"
                                                >
                                                    Thành viên
                                                    <SortIcon field="HoTen" />
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <button
                                                    onClick={() => handleSort('ThanhTich')}
                                                    className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-amber-600 transition-colors"
                                                >
                                                    Loại thành tích
                                                    <SortIcon field="ThanhTich" />
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <button
                                                    onClick={() => handleSort('NgayPhatSinh')}
                                                    className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-amber-600 transition-colors"
                                                >
                                                    Ngày ghi nhận
                                                    <SortIcon field="NgayPhatSinh" />
                                                </button>
                                            </th>
                                            {canEdit && <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-600 w-32">Thao tác</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {paginatedData.map((item, idx) => (
                                            <tr
                                                key={`${item.MaTV}-${item.ThanhTich}-${idx}`}
                                                className="hover:bg-amber-50/50 transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="w-8 h-8 inline-flex items-center justify-center bg-neutral-100 text-neutral-600 rounded-lg text-sm font-medium">
                                                        {(currentPage - 1) * itemsPerPage + idx + 1}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link
                                                        to={`/thanhvien/${item.MaTV}`}
                                                        className="flex items-center gap-3 group/link"
                                                    >
                                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                            {item.HoTen?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-neutral-800 group-hover/link:text-amber-600 transition-colors">
                                                                {item.HoTen}
                                                            </div>
                                                            <div className="text-xs text-neutral-400">{item.MaTV}</div>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getTypeColor(item.ThanhTich)}`}>
                                                        <FiAward className="w-3.5 h-3.5" />
                                                        {item.ThanhTich}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-neutral-600">
                                                        <FiCalendar className="w-4 h-4 text-neutral-400" />
                                                        <span className="font-medium">
                                                            {item.NgayPhatSinh
                                                                ? new Date(item.NgayPhatSinh).toLocaleDateString('vi-VN')
                                                                : '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                {canEdit && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => openEditModal(item)}
                                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Sửa"
                                                            >
                                                                <FiEdit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Xóa"
                                                            >
                                                                <FiTrash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
                                    <p className="text-sm text-neutral-500">
                                        Hiển thị <span className="font-semibold text-neutral-700">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-semibold text-neutral-700">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> / <span className="font-semibold text-neutral-700">{sortedData.length}</span> thành tích
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-neutral-200 hover:bg-white hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        >
                                            <FiChevronLeft className="w-5 h-5" />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`w-10 h-10 rounded-lg font-medium transition-all ${currentPage === pageNum
                                                            ? 'bg-amber-500 text-white shadow-md'
                                                            : 'hover:bg-amber-50 text-neutral-600'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-neutral-200 hover:bg-white hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                        >
                                            <FiChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* ==================== ADD MODAL ==================== */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-fade-in">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                                <FiAward className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-neutral-800">Ghi nhận thành tích</h3>
                                <p className="text-neutral-500 text-sm">Thêm thành tích mới cho thành viên</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="ml-auto p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-5">
                            {/* Member Autocomplete */}
                            <div className="relative">
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                    Thành viên <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                        placeholder="Nhập tên để tìm kiếm..."
                                        value={memberSearch}
                                        onChange={(e) => {
                                            setMemberSearch(e.target.value);
                                            setShowMemberDropdown(true);
                                            setSelectedMember('');
                                        }}
                                        onFocus={() => setShowMemberDropdown(true)}
                                    />
                                    {selectedMember && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <FiCheck className="w-5 h-5 text-green-500" />
                                        </div>
                                    )}
                                </div>
                                {showMemberDropdown && filteredMembers.length > 0 && (
                                    <div className="absolute z-20 w-full mt-2 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                                        {filteredMembers.map(m => (
                                            <button
                                                key={m.MaTV}
                                                type="button"
                                                onClick={() => handleSelectMember(m)}
                                                className="w-full px-4 py-3 text-left hover:bg-amber-50 flex items-center gap-3 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                                                    {m.HoTen?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-neutral-800">{m.HoTen}</div>
                                                    <div className="text-xs text-neutral-500">{m.MaTV}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                    Loại thành tích <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                    value={selectedLoai}
                                    onChange={(e) => setSelectedLoai(e.target.value)}
                                    required
                                >
                                    <option value="">-- Chọn loại thành tích --</option>
                                    {loaithanhtich?.map(l => (
                                        <option key={l.MaLTT} value={l.MaLTT}>{l.TenLTT}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Ngày phát sinh</label>
                                <DateInput
                                    className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    value={ngayPhatSinh}
                                    onChange={(e) => setNgayPhatSinh(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-3.5 bg-neutral-100 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-200 transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAdding || !selectedMember || !selectedLoai}
                                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isAdding ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck className="w-5 h-5" />
                                            Ghi nhận
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==================== EDIT MODAL ==================== */}
            {showEditModal && editingItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <FiEdit2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-neutral-800">Sửa thành tích</h3>
                                <p className="text-sm text-neutral-500">{editingItem.HoTen}</p>
                            </div>
                        </div>

                        <div className="mb-6 p-4 bg-neutral-50 rounded-xl">
                            <p className="text-sm text-neutral-500 mb-1">Thành tích hiện tại</p>
                            <p className="font-semibold text-neutral-800">{editingItem.ThanhTich}</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                Đổi sang loại thành tích
                            </label>
                            <select
                                value={editLoai}
                                onChange={(e) => setEditLoai(e.target.value)}
                                className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                                <option value="">-- Chọn loại mới --</option>
                                {loaithanhtich?.map(l => (
                                    <option key={l.MaLTT} value={l.MaLTT}>{l.TenLTT}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowEditModal(false); setEditingItem(null); }}
                                className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating || !editLoai}
                                className="flex-1 px-6 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors"
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
