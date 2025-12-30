/**
 * ============================================
 * KẾT THÚC PAGE - Ghi nhận kết thúc (Báo tử)
 * Trang riêng để quản lý thông tin kết thúc
 * ============================================
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    FiArrowLeft, FiHeart, FiPlus, FiSearch, FiFilter,
    FiCalendar, FiUser, FiEdit2, FiX, FiCheck,
    FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown,
    FiMapPin, FiAlertCircle
} from 'react-icons/fi';
import ketThucService from '../services/ketthuc';
import thanhVienService from '../services/thanhvien';
import lookupsService from '../services/lookups';
import { usePermissions } from '../hooks/usePermissions';
import GiaPhaSelector from '../components/common/GiaPhaSelector';

export default function KetThucPage() {
    const { isAdmin, isOwner } = usePermissions();
    const canEdit = isAdmin || isOwner;

    // Data state
    const [ketThucs, setKetThucs] = useState([]);
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Lookup data
    const [nguyenNhanList, setNguyenNhanList] = useState([]);
    const [diaDiemList, setDiaDiemList] = useState([]);

    // Filter state
    const [searchName, setSearchName] = useState('');
    const [filterNguyenNhan, setFilterNguyenNhan] = useState('');
    const [filterDiaDiem, setFilterDiaDiem] = useState('');
    const [filterTuNgay, setFilterTuNgay] = useState('');
    const [filterDenNgay, setFilterDenNgay] = useState('');
    const [filterGiaPha, setFilterGiaPha] = useState('');

    // Sort state
    const [sortField, setSortField] = useState('NgayGioMat');
    const [sortOrder, setSortOrder] = useState('desc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Add modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState('');
    const [formData, setFormData] = useState({
        NgayGioMat: '',
        MaNguyenNhanMat: '',
        MaDiaDiem: ''
    });
    const [isAdding, setIsAdding] = useState(false);

    // Member search for autocomplete
    const [memberSearch, setMemberSearch] = useState('');
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);
    const [filteredMembers, setFilteredMembers] = useState([]);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editFormData, setEditFormData] = useState({
        NgayGioMat: '',
        MaNguyenNhanMat: '',
        MaDiaDiem: ''
    });
    const [isUpdating, setIsUpdating] = useState(false);

    // Load lookups
    useEffect(() => {
        const loadLookups = async () => {
            try {
                const [nguyenNhan, diaDiem] = await Promise.all([
                    lookupsService.getNguyenNhanMat(),
                    lookupsService.getDiaDiemMaiTang()
                ]);
                setNguyenNhanList(nguyenNhan || []);
                setDiaDiemList(diaDiem || []);
            } catch (err) {
                console.error('Error loading lookups:', err);
            }
        };
        loadLookups();
    }, []);

    // Load members for autocomplete (chỉ lấy thành viên còn sống)
    // Load members for autocomplete - filtered by selected GiaPha
    useEffect(() => {
        const loadMembers = async () => {
            try {
                // ✅ Filter members by selected GiaPha
                const params = filterGiaPha ? { MaGiaPha: filterGiaPha } : {};
                const data = await thanhVienService.getAll(params);
                const memberList = Array.isArray(data) ? data : (data.items || []);
                // ✅ Add null check để tránh lỗi "Cannot read properties of undefined"
                const livingMembers = memberList.filter(m => m && !m.NgayGioMat);
                setMembers(livingMembers);
            } catch (err) {
                console.error('Error loading members:', err);
            }
        };
        loadMembers();
    }, [filterGiaPha]);  // ✅ Reload when GiaPha changes

    // Filter members for autocomplete
    useEffect(() => {
        if (memberSearch.trim()) {
            const filtered = members.filter(m =>
                m && ( // Add null check
                    m.HoTen?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                    m.MaTV?.toLowerCase().includes(memberSearch.toLowerCase())
                )
            ).slice(0, 8);
            setFilteredMembers(filtered);
        } else {
            setFilteredMembers([]);
        }
    }, [memberSearch, members]);

    // Load kết thúc
    const loadKetThuc = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const params = {};
            if (searchName) params.HoTen = searchName;
            if (filterNguyenNhan) params.MaNguyenNhanMat = filterNguyenNhan;
            if (filterDiaDiem) params.MaDiaDiem = filterDiaDiem;
            if (filterTuNgay) params.TuNgay = filterTuNgay;
            if (filterDenNgay) params.DenNgay = filterDenNgay;
            if (filterGiaPha) params.MaGiaPha = filterGiaPha;

            const res = await ketThucService.traCuu(params);
            setKetThucs(res.data || res.result || res || []);
        } catch (err) {
            console.error('Error loading death records:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách');
        } finally {
            setIsLoading(false);
        }
    }, [searchName, filterNguyenNhan, filterDiaDiem, filterTuNgay, filterDenNgay, filterGiaPha]);

    useEffect(() => {
        loadKetThuc();
    }, [loadKetThuc]);

    // Clear messages
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    // Sorted and paginated data
    const sortedData = useMemo(() => {
        const sorted = [...ketThucs].sort((a, b) => {
            let aVal, bVal;

            switch (sortField) {
                case 'HoTen':
                    aVal = a.HoTen || '';
                    bVal = b.HoTen || '';
                    return sortOrder === 'asc'
                        ? aVal.localeCompare(bVal, 'vi')
                        : bVal.localeCompare(aVal, 'vi');
                case 'TenNguyenNhanMat':
                    aVal = a.TenNguyenNhanMat || '';
                    bVal = b.TenNguyenNhanMat || '';
                    return sortOrder === 'asc'
                        ? aVal.localeCompare(bVal, 'vi')
                        : bVal.localeCompare(aVal, 'vi');
                case 'NgayGioMat':
                default:
                    aVal = a.NgayGioMat ? new Date(a.NgayGioMat).getTime() : 0;
                    bVal = b.NgayGioMat ? new Date(b.NgayGioMat).getTime() : 0;
                    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            }
        });

        return sorted;
    }, [ketThucs, sortField, sortOrder]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Stats
    const stats = useMemo(() => {
        const thisYear = new Date().getFullYear();
        const thisYearCount = ketThucs.filter(k =>
            k.NgayGioMat && new Date(k.NgayGioMat).getFullYear() === thisYear
        ).length;
        const uniqueNguyenNhan = new Set(ketThucs.map(k => k.TenNguyenNhanMat).filter(Boolean)).size;
        const uniqueDiaDiem = new Set(ketThucs.map(k => k.TenDiaDiem).filter(Boolean)).size;
        return { total: ketThucs.length, thisYear: thisYearCount, uniqueNguyenNhan, uniqueDiaDiem };
    }, [ketThucs]);

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
            ? <FiChevronUp className="w-4 h-4 text-neutral-600" />
            : <FiChevronDown className="w-4 h-4 text-neutral-600" />;
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        loadKetThuc();
    };

    const handleClearFilters = () => {
        setSearchName('');
        setFilterNguyenNhan('');
        setFilterDiaDiem('');
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
        if (!selectedMember || !formData.NgayGioMat) {
            setError('Vui lòng chọn thành viên và ngày giờ mất');
            return;
        }

        // Validate NgayGioMat against future
        const deathDate = new Date(formData.NgayGioMat);
        const now = new Date();
        if (deathDate > now) {
            setError('Ngày giờ mất không được lớn hơn thời điểm hiện tại');
            return;
        }

        try {
            setIsAdding(true);
            setError(null);
            await ketThucService.ghiNhan({
                MaTV: selectedMember,
                ...formData
            });

            setShowAddModal(false);
            setSelectedMember('');
            setFormData({ NgayGioMat: '', MaNguyenNhanMat: '', MaDiaDiem: '' });
            setMemberSearch('');
            setSuccessMsg('Đã ghi nhận kết thúc thành công!');
            loadKetThuc();
            // Reload members
            const data = await thanhVienService.getAll();
            const memberList = Array.isArray(data) ? data : (data.items || []);
            setMembers(memberList.filter(m => !m.NgayGioMat));
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Hủy thông tin kết thúc của "${item.HoTen}"?\nThành viên sẽ được chuyển về trạng thái "Còn sống".`)) return;

        try {
            await ketThucService.delete(item.MaTV);
            setSuccessMsg('Đã hủy thông tin kết thúc');
            loadKetThuc();
            // Reload members
            const data = await thanhVienService.getAll();
            const memberList = Array.isArray(data) ? data : (data.items || []);
            setMembers(memberList.filter(m => !m.NgayGioMat));
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi xóa');
        }
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setEditFormData({
            NgayGioMat: item.NgayGioMat ? item.NgayGioMat.slice(0, 16) : '',
            MaNguyenNhanMat: item.MaNguyenNhanMat || '',
            MaDiaDiem: item.MaDiaDiem || ''
        });
        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        if (!editingItem || !editFormData.NgayGioMat) {
            setError('Vui lòng nhập ngày giờ mất');
            return;
        }

        setIsUpdating(true);
        try {
            await ketThucService.update(editingItem.MaTV, editFormData);
            setSuccessMsg('Đã cập nhật thông tin');
            setShowEditModal(false);
            setEditingItem(null);
            loadKetThuc();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
            {/* Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-neutral-200/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-neutral-200/30 rounded-full blur-3xl"></div>
            </div>

            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800 transition-colors font-medium">
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
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-500 to-neutral-700 flex items-center justify-center text-white shadow-lg">
                            <span className="text-3xl">🕯️</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Ghi nhận kết thúc
                            </h1>
                            <p className="text-neutral-500">Quản lý thông tin kết thúc của các thành viên</p>
                        </div>
                    </div>

                    {canEdit && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-700 text-white font-semibold rounded-xl shadow-lg hover:bg-neutral-800 transition-all"
                        >
                            <FiPlus className="w-5 h-5" />
                            Ghi nhận mới
                        </button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center">
                                <span className="text-2xl">🕯️</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{stats.total}</p>
                                <p className="text-sm text-neutral-500">Tổng số</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <FiCalendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{stats.thisYear}</p>
                                <p className="text-sm text-neutral-500">Năm nay</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                <FiAlertCircle className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{stats.uniqueNguyenNhan}</p>
                                <p className="text-sm text-neutral-500">Nguyên nhân</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <FiMapPin className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800">{stats.uniqueDiaDiem}</p>
                                <p className="text-sm text-neutral-500">Địa điểm</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {successMsg && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3">
                        <FiCheck className="w-5 h-5" />
                        <span className="font-medium">{successMsg}</span>
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                        <FiX className="w-5 h-5" />
                        <span className="font-medium flex-1">{error}</span>
                        <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg">
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FiFilter className="w-5 h-5 text-neutral-600" />
                        <h3 className="font-semibold text-neutral-800">Bộ lọc & Tìm kiếm</h3>
                    </div>
                    {/* GiaPha Selector - Admin only - on separate row */}
                    <div className="mb-4 max-w-sm">
                        <GiaPhaSelector value={filterGiaPha} onChange={setFilterGiaPha} />
                    </div>

                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-2">Tên thành viên</label>
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                <input
                                    type="text"
                                    className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                                    placeholder="Tìm theo tên..."
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-2">Nguyên nhân</label>
                            <select
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                                value={filterNguyenNhan}
                                onChange={(e) => setFilterNguyenNhan(e.target.value)}
                            >
                                <option value="">Tất cả</option>
                                {nguyenNhanList.map(item => (
                                    <option key={item.MaNguyenNhanMat} value={item.MaNguyenNhanMat}>{item.TenNguyenNhanMat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-2">Địa điểm</label>
                            <select
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                                value={filterDiaDiem}
                                onChange={(e) => setFilterDiaDiem(e.target.value)}
                            >
                                <option value="">Tất cả</option>
                                {diaDiemList.map(item => (
                                    <option key={item.MaDiaDiem} value={item.MaDiaDiem}>{item.TenDiaDiem}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-2">Từ ngày</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                                value={filterTuNgay}
                                onChange={(e) => setFilterTuNgay(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 mb-2">Đến ngày</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                                value={filterDenNgay}
                                onChange={(e) => setFilterDenNgay(e.target.value)}
                            />
                        </div>
                    </form>
                    <div className="flex gap-3 mt-5">
                        <button type="submit" onClick={handleSearch} className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-700 text-white font-medium rounded-xl hover:bg-neutral-800">
                            <FiSearch className="w-4 h-4" />
                            Tìm kiếm
                        </button>
                        <button type="button" onClick={handleClearFilters} className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-100 text-neutral-600 font-medium rounded-xl hover:bg-neutral-200">
                            <FiX className="w-4 h-4" />
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="text-center py-16">
                            <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-neutral-500 font-medium">Đang tải dữ liệu...</p>
                        </div>
                    ) : ketThucs.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
                                <FiHeart className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-800 mb-2">Chưa có thông tin kết thúc</h3>
                            <p className="text-neutral-500">Tất cả thành viên đều còn sống</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-neutral-50 border-b border-neutral-200">
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600 w-16">STT</th>
                                            <th className="px-6 py-4 text-left">
                                                <button onClick={() => handleSort('HoTen')} className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-800">
                                                    Thành viên
                                                    <SortIcon field="HoTen" />
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <button onClick={() => handleSort('NgayGioMat')} className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-800">
                                                    Ngày giờ mất
                                                    <SortIcon field="NgayGioMat" />
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-left">
                                                <button onClick={() => handleSort('TenNguyenNhanMat')} className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-800">
                                                    Nguyên nhân
                                                    <SortIcon field="TenNguyenNhanMat" />
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-600">Địa điểm</th>
                                            {canEdit && <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-600 w-32">Thao tác</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {paginatedData.map((item, idx) => (
                                            <tr key={item.MaTV} className="hover:bg-neutral-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <span className="w-8 h-8 inline-flex items-center justify-center bg-neutral-100 text-neutral-600 rounded-lg text-sm font-medium">
                                                        {(currentPage - 1) * itemsPerPage + idx + 1}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link to={`/thanhvien/${item.MaTV}`} className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-full bg-neutral-400 flex items-center justify-center text-white font-bold text-sm">
                                                            {item.HoTen?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-neutral-800">{item.HoTen}</div>
                                                            <div className="text-xs text-neutral-400">{item.MaTV}</div>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-neutral-600">
                                                        <FiCalendar className="w-4 h-4 text-neutral-400" />
                                                        <span className="font-medium">
                                                            {(() => {
                                                                if (!item.NgayGioMat) return '—';
                                                                const date = new Date(item.NgayGioMat);
                                                                if (isNaN(date.getTime())) return '—';
                                                                return date.toLocaleString('vi-VN');
                                                            })()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium border border-orange-100">
                                                        <FiAlertCircle className="w-3.5 h-3.5" />
                                                        {item.TenNguyenNhanMat || 'Không rõ'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-neutral-600">
                                                        <FiMapPin className="w-4 h-4 text-neutral-400" />
                                                        <span>{item.TenDiaDiem || 'Không rõ'}</span>
                                                    </div>
                                                </td>
                                                {canEdit && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => openEditModal(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Sửa">
                                                                <FiEdit2 className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleDelete(item)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg" title="Hồi sinh">
                                                                <FiHeart className="w-4 h-4" />
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
                                <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50">
                                    <p className="text-sm text-neutral-500">
                                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} / {sortedData.length}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-neutral-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <FiChevronLeft className="w-5 h-5" />
                                        </button>
                                        <span className="px-4 py-2 bg-neutral-700 text-white rounded-lg font-medium">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-neutral-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-neutral-600 flex items-center justify-center text-white">
                                <span className="text-2xl">🕯️</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-neutral-800">Ghi nhận kết thúc</h3>
                                <p className="text-neutral-500 text-sm">Báo tử cho thành viên</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="ml-auto p-2 hover:bg-neutral-100 rounded-xl">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-5">
                            <div className="relative">
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                    Thành viên (còn sống) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
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
                                                className="w-full px-4 py-3 text-left hover:bg-neutral-50 flex items-center gap-3"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold text-sm">
                                                    {m.HoTen?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-neutral-800">{m.HoTen}</div>
                                                    <div className="text-xs text-neutral-500">{m.MaTV} - Còn sống</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                    Ngày giờ mất <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                                    value={formData.NgayGioMat}
                                    onChange={(e) => setFormData({ ...formData, NgayGioMat: e.target.value })}
                                    max={new Date().toISOString().slice(0, 16)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Nguyên nhân</label>
                                <select
                                    className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                                    value={formData.MaNguyenNhanMat}
                                    onChange={(e) => setFormData({ ...formData, MaNguyenNhanMat: e.target.value })}
                                >
                                    <option value="">-- Chọn nguyên nhân --</option>
                                    {nguyenNhanList.map(item => (
                                        <option key={item.MaNguyenNhanMat} value={item.MaNguyenNhanMat}>{item.TenNguyenNhanMat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Địa điểm mai táng</label>
                                <select
                                    className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
                                    value={formData.MaDiaDiem}
                                    onChange={(e) => setFormData({ ...formData, MaDiaDiem: e.target.value })}
                                >
                                    <option value="">-- Chọn địa điểm --</option>
                                    {diaDiemList.map(item => (
                                        <option key={item.MaDiaDiem} value={item.MaDiaDiem}>{item.TenDiaDiem}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-3.5 bg-neutral-100 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-200"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAdding || !selectedMember || !formData.NgayGioMat}
                                    className="flex-1 px-6 py-3.5 bg-neutral-700 text-white font-semibold rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isAdding ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck className="w-5 h-5" />
                                            Xác nhận
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <FiEdit2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-neutral-800">Sửa thông tin kết thúc</h3>
                                <p className="text-sm text-neutral-500">{editingItem.HoTen}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Ngày giờ mất *</label>
                                <input
                                    type="datetime-local"
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={editFormData.NgayGioMat}
                                    onChange={(e) => setEditFormData({ ...editFormData, NgayGioMat: e.target.value })}
                                    max={new Date().toISOString().slice(0, 16)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Nguyên nhân</label>
                                <select
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={editFormData.MaNguyenNhanMat}
                                    onChange={(e) => setEditFormData({ ...editFormData, MaNguyenNhanMat: e.target.value })}
                                >
                                    <option value="">-- Chọn nguyên nhân --</option>
                                    {nguyenNhanList.map(item => (
                                        <option key={item.MaNguyenNhanMat} value={item.MaNguyenNhanMat}>{item.TenNguyenNhanMat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Địa điểm mai táng</label>
                                <select
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={editFormData.MaDiaDiem}
                                    onChange={(e) => setEditFormData({ ...editFormData, MaDiaDiem: e.target.value })}
                                >
                                    <option value="">-- Chọn địa điểm --</option>
                                    {diaDiemList.map(item => (
                                        <option key={item.MaDiaDiem} value={item.MaDiaDiem}>{item.TenDiaDiem}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowEditModal(false); setEditingItem(null); }}
                                className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating || !editFormData.NgayGioMat}
                                className="flex-1 px-6 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50"
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
