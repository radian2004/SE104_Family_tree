import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiHome, FiCalendar, FiMapPin, FiPlus, FiTrash2, FiX, FiSearch, FiMail, FiUserPlus, FiCheck } from 'react-icons/fi';
import giaPhaService from '../services/giapha.js';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';

export default function GiaPhaPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isAdmin, isOwner } = usePermissions();
    const canManage = isAdmin || isOwner;

    const [giaPhaList, setGiaPhaList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Create modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ TenGiaPha: '', TruongToc: '', TruongTocName: '' });
    const [isCreating, setIsCreating] = useState(false);

    // Search member state (Autocomplete)
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Add Member by Email Modal State
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [selectedGiaPhaConfig, setSelectedGiaPhaConfig] = useState(null); // { MaGiaPha, TenGiaPha }
    const [addMemberEmail, setAddMemberEmail] = useState('');
    const [isAddingMember, setIsAddingMember] = useState(false);

    // Load gia phả function with member counts
    const loadGiaPha = async () => {
        setIsLoading(true);
        setError(null);
        try {
            let data = await giaPhaService.getAll();

            // ⭐ FILTER FOR OWNER/USER: Only show their own gia phả
            // Admin can see all, Owner/User can only see their own
            if (!isAdmin && user?.MaGiaPha) {
                data = data.filter(gp => gp.MaGiaPha === user.MaGiaPha);
            }

            // Fetch member counts for each gia pha (since backend doesn't return it correctly)
            const giaPhaWithCounts = await Promise.all(
                data.map(async (gp) => {
                    try {
                        const members = await giaPhaService.getThanhVienByGiaPha(gp.MaGiaPha);
                        const maxDoi = members.reduce((max, m) => Math.max(max, m.DOI || 0), 0);
                        return {
                            ...gp,
                            SoThanhVien: members.length,
                            SoDoi: maxDoi
                        };
                    } catch (err) {
                        return { ...gp, SoThanhVien: 0, SoDoi: 0 };
                    }
                })
            );

            console.log('DEBUG GiaPhaPage data with counts:', giaPhaWithCounts);
            setGiaPhaList(giaPhaWithCounts);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi tải danh sách gia phả');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadGiaPha();
    }, []);

    // Search members effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const results = await giaPhaService.searchMembers(searchQuery);
                    setSearchResults(results);
                    setShowDropdown(true);
                } catch (err) {
                    console.error('Search error:', err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowDropdown(false);
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle select member from dropdown
    const handleSelectMember = (member) => {
        setCreateForm({
            ...createForm,
            TruongToc: member.MaTV,
            TruongTocName: member.HoTen
        });
        setSearchQuery(member.HoTen);
        setShowDropdown(false);
    };

    // Handle create gia phả
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createForm.TenGiaPha.trim()) {
            alert('Vui lòng nhập tên gia phả');
            return;
        }
        if (!createForm.TruongToc) {
            alert('Vui lòng chọn trưởng tộc từ danh sách thành viên trước khi tạo gia phả');
            return;
        }
        setIsCreating(true);
        try {
            // Gửi TenGiaPha và TruongToc (bắt buộc phải có)
            const payload = {
                TenGiaPha: createForm.TenGiaPha,
                TruongToc: createForm.TruongToc
            };
            await giaPhaService.create(payload);
            alert('Tạo gia phả thành công!');
            setShowCreateModal(false);
            setCreateForm({ TenGiaPha: '', TruongToc: '', TruongTocName: '' });
            setSearchQuery('');
            loadGiaPha();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi tạo gia phả');
        } finally {
            setIsCreating(false);
        }
    };

    // Handle delete gia phả
    const handleDelete = async (MaGiaPha, TenGiaPha, e) => {
        e.stopPropagation();
        if (!confirm(`Bạn có chắc muốn xóa gia phả "${TenGiaPha}"?\nCác thành viên sẽ bị hủy liên kết với gia phả này.`)) {
            return;
        }
        try {
            await giaPhaService.delete(MaGiaPha);
            alert('Xóa gia phả thành công!');
            loadGiaPha();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi xóa gia phả');
        }
    };

    // Open add member modal
    const openAddMemberModal = (giaPha, e) => {
        e.stopPropagation();
        setSelectedGiaPhaConfig({ MaGiaPha: giaPha.MaGiaPha, TenGiaPha: giaPha.TenGiaPha });
        setAddMemberEmail('');
        setShowAddMemberModal(true);
    };

    // Handle add member by email
    const handleAddMemberByEmail = async (e) => {
        e.preventDefault();
        if (!addMemberEmail.trim()) return;

        setIsAddingMember(true);
        try {
            await giaPhaService.addMemberByEmail(selectedGiaPhaConfig.MaGiaPha, addMemberEmail);
            alert(`Đã thêm thành viên vào gia phả "${selectedGiaPhaConfig.TenGiaPha}" thành công!`);
            setShowAddMemberModal(false);
            setAddMemberEmail('');
            loadGiaPha(); // Reload to update member count
        } catch (err) {
            alert(err.response?.data?.error || err.response?.data?.message || 'Không thể thêm thành viên');
        } finally {
            setIsAddingMember(false);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Background & Nav... (Keep existing code) */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-200/20 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-200/20 to-transparent rounded-full blur-3xl"></div>
            </div>

            <nav className="navbar px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="flex items-center gap-2 text-neutral-600 hover:text-orange-600 transition-colors">
                            <FiArrowLeft className="w-5 h-5" />
                            <span className="hidden md:inline">Dashboard</span>
                        </Link>
                        <div className="h-6 w-px bg-neutral-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg">
                                <span className="text-xl">🌳</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>Gia Phả</h1>
                                <p className="text-xs text-neutral-500">{giaPhaList.length} gia phả</p>
                            </div>
                        </div>
                    </div>

                    {canManage && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                        >
                            <FiPlus className="w-4 h-4" />
                            <span>Tạo gia phả</span>
                        </button>
                    )}
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats & Header... (Keep existing code) */}
                <div className="mb-8 animate-fade-in">
                    <h2 className="heading-display mb-2">Quản lý Gia Phả</h2>
                    <p className="text-neutral-600">Xem và quản lý các cây gia phả trong hệ thống</p>
                </div>

                {/* Stats Cards ... (Keep existing code) */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
                    <div className="glass-card p-4 text-center hover:scale-105 transition-transform">
                        <div className="text-2xl mb-2">🌳</div>
                        <div className="text-2xl font-bold text-neutral-800">{giaPhaList.length}</div>
                        <div className="text-xs text-neutral-500">Tổng gia phả</div>
                    </div>
                    <div className="glass-card p-4 text-center hover:scale-105 transition-transform">
                        <div className="text-2xl mb-2">👨‍👩‍👧‍👦</div>
                        <div className="text-2xl font-bold text-emerald-600">
                            {giaPhaList.reduce((sum, gp) => sum + (Number(gp.SoThanhVien) || 0), 0)}
                        </div>
                        <div className="text-xs text-neutral-500">Tổng thành viên</div>
                    </div>
                    <div className="glass-card p-4 text-center hover:scale-105 transition-transform">
                        <div className="text-2xl mb-2">📊</div>
                        <div className="text-2xl font-bold text-violet-600">
                            {giaPhaList.reduce((sum, gp) => sum + (Number(gp.SoDoi) || 0), 0)}
                        </div>
                        <div className="text-xs text-neutral-500">Tổng số đời</div>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger mb-6 animate-fade-in">
                        <span className="text-lg">⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

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
                        {giaPhaList.map((giaPha) => {
                            // Check permissions for this specific tree
                            // Admin: All rights
                            // Owner: Must be TruongToc (Head) to Edit/Delete/Add
                            const isTreeOwner = user?.MaTV && giaPha.TruongToc === user?.MaTV;
                            const canInteract = isAdmin || (isOwner && isTreeOwner);

                            return (
                                <div
                                    key={giaPha.MaGiaPha}
                                    className="glass-card overflow-hidden hover:shadow-xl transition-all group cursor-pointer relative"
                                    onClick={() => navigate(`/giapha/${giaPha.MaGiaPha}`)}
                                >
                                    <div className="h-24 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-5xl opacity-50 group-hover:scale-110 transition-transform">🌳</span>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/50 to-transparent"></div>
                                    </div>

                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-neutral-800 flex-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                                                {giaPha.TenGiaPha}
                                            </h3>
                                            {isTreeOwner && <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full border border-orange-200">Của tôi</span>}
                                        </div>

                                        <div className="space-y-2 text-sm text-neutral-600">
                                            <div className="flex items-center gap-2">
                                                <FiHome className="w-4 h-4 text-neutral-400" />
                                                <span>Mã: {giaPha.MaGiaPha}</span>
                                            </div>
                                            {giaPha.NgayLap && (
                                                <div className="flex items-center gap-2">
                                                    <FiCalendar className="w-4 h-4 text-neutral-400" />
                                                    <span>Ngày lập: {new Date(giaPha.NgayLap).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            )}
                                            {giaPha.TenTruongToc && (
                                                <div className="flex items-center gap-2">
                                                    <FiUsers className="w-4 h-4 text-neutral-400" />
                                                    <span>Trưởng tộc: {giaPha.TenTruongToc}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                                                <FiUsers className="w-4 h-4" />
                                                <span>
                                                    {/* Fix: Check explicitly for null/undefined, treat 0 as valid */}
                                                    {giaPha.SoThanhVien ?? 0} thành viên
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {canInteract && (
                                                    <>
                                                        <button
                                                            onClick={(e) => openAddMemberModal(giaPha, e)}
                                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Thêm thành viên bằng email"
                                                            style={{ zIndex: 10 }}
                                                        >
                                                            <FiUserPlus className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDelete(giaPha.MaGiaPha, giaPha.TenGiaPha, e)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Xóa gia phả"
                                                            style={{ zIndex: 10 }}
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold">Tạo Gia Phả Mới</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Tên gia phả *</label>
                                <input
                                    type="text"
                                    value={createForm.TenGiaPha}
                                    onChange={(e) => setCreateForm({ ...createForm, TenGiaPha: e.target.value })}
                                    placeholder="Nhập tên gia phả (VD: Gia phả họ Nguyễn)"
                                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* Autocomplete Search input for TruongToc */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Trưởng tộc (Tìm theo tên) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            // Reset selected TruongToc if user types new query
                                            if (createForm.TruongTocName && e.target.value !== createForm.TruongTocName) {
                                                setCreateForm({ ...createForm, TruongToc: '', TruongTocName: '' });
                                            }
                                        }}
                                        onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                                        placeholder="Nhập tên thành viên để tìm..."
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent pl-10 ${!createForm.TruongToc ? 'border-neutral-200 focus:ring-orange-500' : 'border-emerald-300 focus:ring-emerald-500'
                                            }`}
                                    />
                                    <FiSearch className="absolute left-3 top-2.5 text-neutral-400 w-5 h-5" />
                                </div>

                                {/* Dropdown results */}
                                {showDropdown && searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {searchResults.map((member) => (
                                            <div
                                                key={member.MaTV}
                                                onClick={() => handleSelectMember(member)}
                                                className="px-4 py-2 hover:bg-neutral-50 cursor-pointer flex justify-between items-center transition-colors"
                                            >
                                                <div>
                                                    <div className="font-medium text-neutral-800">{member.HoTen}</div>
                                                    <div className="text-xs text-neutral-500">
                                                        Mã: {member.MaTV} {member.TenGiaPha ? `- Gia phả: ${member.TenGiaPha}` : '- Chưa thuộc gia phả nào'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {showDropdown && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg p-4 text-center text-sm text-neutral-500">
                                        Không tìm thấy thành viên nào
                                    </div>
                                )}
                                {createForm.TruongToc && (
                                    <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                                        <FiCheck className="w-3 h-3" />
                                        <strong>✓ Đã chọn:</strong> {createForm.TruongTocName} ({createForm.TruongToc})
                                    </p>
                                )}
                                {!createForm.TruongToc && (
                                    <p className="text-xs text-orange-500 mt-2">
                                        ⚠️ Bạn phải chọn một trưởng tộc từ danh sách trước khi tạo gia phả
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">Hủy</button>
                                <button type="submit" disabled={isCreating} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50">
                                    {isCreating ? 'Đang tạo...' : 'Tạo gia phả'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member By Email Modal */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex justify-between items-center">
                            <h2 className="text-xl font-bold">Thêm Thành Viên</h2>
                            <button onClick={() => setShowAddMemberModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddMemberByEmail} className="p-6 space-y-4">
                            <p className="text-sm text-neutral-600">
                                Nhập email của thành viên bạn muốn thêm vào gia phả <b>{selectedGiaPhaConfig?.TenGiaPha}</b>.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Email thành viên *</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={addMemberEmail}
                                        onChange={(e) => setAddMemberEmail(e.target.value)}
                                        placeholder="vidu@example.com"
                                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                                        required
                                    />
                                    <FiMail className="absolute left-3 top-2.5 text-neutral-400 w-5 h-5" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddMemberModal(false)} className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50">Hủy</button>
                                <button type="submit" disabled={isAddingMember} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50">
                                    {isAddingMember ? 'Đang thêm...' : 'Thêm vào gia phả'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
