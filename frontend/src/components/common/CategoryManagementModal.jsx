/**
 * ============================================
 * CATEGORY MANAGEMENT MODAL
 * Modal để quản lý các danh mục: Quê quán, Nghề nghiệp, 
 * Nguyên nhân mất, Địa điểm mai táng, Loại thành tích, Danh mục thu chi
 * ============================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiLoader, FiUser, FiSearch } from 'react-icons/fi';
import lookupsService from '../../services/lookups';
import thanhvienService from '../../services/thanhvien';

// Cấu hình cho từng loại danh mục
const CATEGORY_CONFIG = {
    quequan: {
        title: 'Quê quán',
        idField: 'MaQueQuan',
        nameField: 'TenQueQuan',
        hasNguoiDamNhan: false,
        loadFn: () => lookupsService.getQueQuan(),
        addFn: (name) => lookupsService.addQueQuan(name),
        updateFn: (id, name) => lookupsService.updateQueQuan(id, name),
        deleteFn: (id) => lookupsService.deleteQueQuan(id),
    },
    nghenghiep: {
        title: 'Nghề nghiệp',
        idField: 'MaNgheNghiep',
        nameField: 'TenNgheNghiep',
        hasNguoiDamNhan: false,
        loadFn: () => lookupsService.getNgheNghiep(),
        addFn: (name) => lookupsService.addNgheNghiep(name),
        updateFn: (id, name) => lookupsService.updateNgheNghiep(id, name),
        deleteFn: (id) => lookupsService.deleteNgheNghiep(id),
    },
    nguyennhanmat: {
        title: 'Nguyên nhân mất',
        idField: 'MaNguyenNhanMat',
        nameField: 'TenNguyenNhanMat',
        hasNguoiDamNhan: false,
        loadFn: () => lookupsService.getNguyenNhanMat(),
        addFn: (name) => lookupsService.addNguyenNhanMat(name),
        updateFn: (id, name) => lookupsService.updateNguyenNhanMat(id, name),
        deleteFn: (id) => lookupsService.deleteNguyenNhanMat(id),
    },
    diadiemmaitang: {
        title: 'Địa điểm mai táng',
        idField: 'MaDiaDiem',
        nameField: 'TenDiaDiem',
        hasNguoiDamNhan: false,
        loadFn: () => lookupsService.getDiaDiemMaiTang(),
        addFn: (name) => lookupsService.addDiaDiemMaiTang(name),
        updateFn: (id, name) => lookupsService.updateDiaDiemMaiTang(id, name),
        deleteFn: (id) => lookupsService.deleteDiaDiemMaiTang(id),
    },
    loaithanhtich: {
        title: 'Loại thành tích',
        idField: 'MaLTT',
        nameField: 'TenLTT',
        hasNguoiDamNhan: false,
        loadFn: () => lookupsService.getLoaiThanhTich(),
        addFn: (name) => lookupsService.addLoaiThanhTich(name),
        updateFn: (id, name) => lookupsService.updateLoaiThanhTich(id, name),
        deleteFn: (id) => lookupsService.deleteLoaiThanhTich(id),
    },
    danhmuc: {
        title: 'Danh mục thu chi',
        idField: 'MaDM',
        nameField: 'TenDM',
        hasNguoiDamNhan: true,
        loadFn: (MaGiaPha) => lookupsService.getDanhMuc(MaGiaPha),
        addFn: (name, nguoiDamNhan) => lookupsService.addDanhMuc(name, nguoiDamNhan),
        updateFn: (id, name, nguoiDamNhan) => lookupsService.updateDanhMuc(id, name, nguoiDamNhan),
        deleteFn: (id) => lookupsService.deleteDanhMuc(id),
    },
};

// ⭐ Searchable Member Selector Component
function MemberSearchInput({ value, onChange, memberList, placeholder = "Tìm và chọn thành viên..." }) {
    const [searchText, setSearchText] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Find selected member name on mount/value change
    useEffect(() => {
        if (value) {
            const member = memberList.find(m => m.MaTV === value);
            setSelectedMember(member);
            setSearchText(member ? member.HoTen : '');
        } else {
            setSelectedMember(null);
            setSearchText('');
        }
    }, [value, memberList]);

    // Filter members based on search text
    const filteredMembers = memberList.filter(member => {
        const search = searchText.toLowerCase();
        return (
            member.HoTen?.toLowerCase().includes(search) ||
            member.MaTV?.toLowerCase().includes(search)
        );
    }).slice(0, 10); // Limit to 10 results

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                inputRef.current && !inputRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (member) => {
        setSelectedMember(member);
        setSearchText(member.HoTen);
        onChange(member.MaTV);
        setShowDropdown(false);
    };

    const handleClear = () => {
        setSelectedMember(null);
        setSearchText('');
        onChange('');
    };

    return (
        <div className="relative flex-1">
            <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={searchText}
                    onChange={(e) => {
                        setSearchText(e.target.value);
                        setShowDropdown(true);
                        if (!e.target.value) {
                            onChange('');
                            setSelectedMember(null);
                        }
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={placeholder}
                    className={`w-full pl-9 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${selectedMember ? 'border-green-400 bg-green-50' : 'border-neutral-200'
                        }`}
                />
                {selectedMember && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-red-500"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {showDropdown && searchText && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                    {filteredMembers.length === 0 ? (
                        <div className="px-4 py-3 text-neutral-500 text-sm">
                            Không tìm thấy thành viên
                        </div>
                    ) : (
                        filteredMembers.map(member => (
                            <button
                                key={member.MaTV}
                                onClick={() => handleSelect(member)}
                                className={`w-full px-4 py-2 text-left hover:bg-amber-50 flex items-center gap-2 ${selectedMember?.MaTV === member.MaTV ? 'bg-amber-100' : ''
                                    }`}
                            >
                                <FiUser className="w-4 h-4 text-neutral-400" />
                                <div>
                                    <div className="font-medium text-neutral-700">{member.HoTen}</div>
                                    <div className="text-xs text-neutral-400">{member.MaTV}</div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default function CategoryManagementModal({ isOpen, onClose, categoryType, onUpdate, MaGiaPha }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newNguoiDamNhan, setNewNguoiDamNhan] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [editingNguoiDamNhan, setEditingNguoiDamNhan] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [memberList, setMemberList] = useState([]);

    const config = CATEGORY_CONFIG[categoryType];

    // Load member list for người đảm nhận - Filter by MaGiaPha
    const loadMemberList = useCallback(async () => {
        if (!config?.hasNguoiDamNhan) return;
        try {
            // If MaGiaPha is selected, use getByGiaPha, otherwise getAll
            let members = [];
            if (MaGiaPha) {
                members = await thanhvienService.getByGiaPha(MaGiaPha);
            } else {
                members = await thanhvienService.getAll();
            }
            setMemberList(members || []);
        } catch (err) {
            console.error('Error loading member list:', err);
        }
    }, [config, MaGiaPha]);

    // Load danh sách
    const loadItems = useCallback(async () => {
        if (!config) return;
        setLoading(true);
        setError('');
        try {
            // Pass MaGiaPha if available (mostly for 'danhmuc')
            const data = await config.loadFn(MaGiaPha);
            setItems(data || []);
        } catch (err) {
            setError('Lỗi tải danh sách');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [config, MaGiaPha]);

    useEffect(() => {
        if (isOpen && config) {
            loadItems();
            loadMemberList();
        }
    }, [isOpen, config, loadItems, loadMemberList]);

    // Thêm mới
    const handleAdd = async () => {
        if (!newItemName.trim()) {
            setError('Vui lòng nhập tên');
            return;
        }
        if (config.hasNguoiDamNhan && !newNguoiDamNhan) {
            setError('Vui lòng chọn người đảm nhận');
            return;
        }
        setSaving(true);
        setError('');
        try {
            if (config.hasNguoiDamNhan) {
                await config.addFn(newItemName.trim(), newNguoiDamNhan);
            } else {
                await config.addFn(newItemName.trim());
            }
            setNewItemName('');
            setNewNguoiDamNhan('');
            await loadItems();
            onUpdate?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi thêm mới');
        } finally {
            setSaving(false);
        }
    };

    // Bắt đầu sửa
    const handleStartEdit = (item) => {
        setEditingId(item[config.idField]);
        setEditingName(item[config.nameField]);
        if (config.hasNguoiDamNhan) {
            setEditingNguoiDamNhan(item.NguoiDamNhan || '');
        }
    };

    // Lưu sửa
    const handleSaveEdit = async () => {
        if (!editingName.trim()) {
            setError('Vui lòng nhập tên');
            return;
        }
        setSaving(true);
        setError('');
        try {
            if (config.hasNguoiDamNhan) {
                await config.updateFn(editingId, editingName.trim(), editingNguoiDamNhan || null);
            } else {
                await config.updateFn(editingId, editingName.trim());
            }
            setEditingId(null);
            setEditingName('');
            setEditingNguoiDamNhan('');
            await loadItems();
            onUpdate?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi cập nhật');
        } finally {
            setSaving(false);
        }
    };

    // Hủy sửa
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
        setEditingNguoiDamNhan('');
    };

    // Xóa
    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa?')) return;
        setSaving(true);
        setError('');
        try {
            await config.deleteFn(id);
            await loadItems();
            onUpdate?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi xóa');
        } finally {
            setSaving(false);
        }
    };

    // Helper to get member name by MaTV
    const getMemberName = (MaTV) => {
        const member = memberList.find(m => m.MaTV === MaTV);
        return member?.HoTen || 'Chưa phân công';
    };

    if (!isOpen || !config) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500">
                    <h2 className="text-xl font-bold text-white">Quản lý {config.title}</h2>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Add new form */}
                    <div className="mb-6 p-4 bg-neutral-50 rounded-xl">
                        <h3 className="text-sm font-semibold text-neutral-700 mb-3">➕ Thêm mới</h3>
                        <div className="flex flex-col gap-3">
                            <input
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder={`Nhập tên ${config.title.toLowerCase()}...`}
                                className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />

                            {/* ⭐ Searchable người đảm nhận for danhmuc */}
                            {config.hasNguoiDamNhan && (
                                <div className="flex gap-2 items-center">
                                    <FiUser className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                                    <MemberSearchInput
                                        value={newNguoiDamNhan}
                                        onChange={setNewNguoiDamNhan}
                                        memberList={memberList}
                                        placeholder="Tìm và chọn người đảm nhận..."
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleAdd}
                                disabled={saving}
                                className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiPlus className="w-4 h-4" />}
                                Thêm
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[350px] overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-8 text-neutral-500">
                                <FiLoader className="w-6 h-6 animate-spin mx-auto mb-2" />
                                Đang tải...
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500">
                                Chưa có dữ liệu
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item) => (
                                    <div
                                        key={item[config.idField]}
                                        className="flex flex-col p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                                    >
                                        {editingId === item[config.idField] ? (
                                            /* ===== EDIT MODE ===== */
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                                    autoFocus
                                                />

                                                {/* ⭐ Searchable edit người đảm nhận */}
                                                {config.hasNguoiDamNhan && (
                                                    <div className="flex gap-2 items-center">
                                                        <FiUser className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                                        <MemberSearchInput
                                                            value={editingNguoiDamNhan}
                                                            onChange={setEditingNguoiDamNhan}
                                                            memberList={memberList}
                                                            placeholder="Tìm và chọn người đảm nhận..."
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        disabled={saving}
                                                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-green-600"
                                                    >
                                                        <FiCheck className="w-4 h-4" /> Lưu
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded-lg text-sm flex items-center gap-1 hover:bg-neutral-400"
                                                    >
                                                        <FiX className="w-4 h-4" /> Hủy
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* ===== VIEW MODE ===== */
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <span className="text-neutral-700 font-medium">{item[config.nameField]}</span>
                                                    <span className="text-xs text-neutral-400 ml-2">({item[config.idField]})</span>

                                                    {/* ⭐ Show người đảm nhận */}
                                                    {config.hasNguoiDamNhan && (
                                                        <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                                                            <FiUser className="w-3 h-3" />
                                                            <span>Người đảm nhận: <span className="font-medium text-amber-600">{getMemberName(item.NguoiDamNhan)}</span></span>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => handleStartEdit(item)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                                                    title="Sửa"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item[config.idField])}
                                                    disabled={saving}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                                    title="Xóa"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
