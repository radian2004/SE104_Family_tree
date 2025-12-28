/**
 * ============================================
 * CATEGORY MANAGEMENT MODAL
 * Modal để quản lý các danh mục: Quê quán, Nghề nghiệp, 
 * Nguyên nhân mất, Địa điểm mai táng, Loại thành tích, Danh mục thu chi
 * ============================================
 */

import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import lookupsService from '../../services/lookups';

// Cấu hình cho từng loại danh mục
const CATEGORY_CONFIG = {
    quequan: {
        title: 'Quê quán',
        idField: 'MaQueQuan',
        nameField: 'TenQueQuan',
        loadFn: () => lookupsService.getQueQuan(),
        addFn: (name) => lookupsService.addQueQuan(name),
        updateFn: (id, name) => lookupsService.updateQueQuan(id, name),
        deleteFn: (id) => lookupsService.deleteQueQuan(id),
    },
    nghenghiep: {
        title: 'Nghề nghiệp',
        idField: 'MaNgheNghiep',
        nameField: 'TenNgheNghiep',
        loadFn: () => lookupsService.getNgheNghiep(),
        addFn: (name) => lookupsService.addNgheNghiep(name),
        updateFn: (id, name) => lookupsService.updateNgheNghiep(id, name),
        deleteFn: (id) => lookupsService.deleteNgheNghiep(id),
    },
    nguyennhanmat: {
        title: 'Nguyên nhân mất',
        idField: 'MaNguyenNhanMat',
        nameField: 'TenNguyenNhanMat',
        loadFn: () => lookupsService.getNguyenNhanMat(),
        addFn: (name) => lookupsService.addNguyenNhanMat(name),
        updateFn: (id, name) => lookupsService.updateNguyenNhanMat(id, name),
        deleteFn: (id) => lookupsService.deleteNguyenNhanMat(id),
    },
    diadiemmaitang: {
        title: 'Địa điểm mai táng',
        idField: 'MaDiaDiem',
        nameField: 'TenDiaDiem',
        loadFn: () => lookupsService.getDiaDiemMaiTang(),
        addFn: (name) => lookupsService.addDiaDiemMaiTang(name),
        updateFn: (id, name) => lookupsService.updateDiaDiemMaiTang(id, name),
        deleteFn: (id) => lookupsService.deleteDiaDiemMaiTang(id),
    },
    loaithanhtich: {
        title: 'Loại thành tích',
        idField: 'MaLTT',
        nameField: 'TenLTT',
        loadFn: () => lookupsService.getLoaiThanhTich(),
        addFn: (name) => lookupsService.addLoaiThanhTich(name),
        updateFn: (id, name) => lookupsService.updateLoaiThanhTich(id, name),
        deleteFn: (id) => lookupsService.deleteLoaiThanhTich(id),
    },
    danhmuc: {
        title: 'Danh mục thu chi',
        idField: 'MaDM',
        nameField: 'TenDM',
        loadFn: () => lookupsService.getDanhMuc(),
        addFn: (name) => lookupsService.addDanhMuc(name),
        updateFn: (id, name) => lookupsService.updateDanhMuc(id, name),
        deleteFn: (id) => lookupsService.deleteDanhMuc(id),
    },
};

export default function CategoryManagementModal({ isOpen, onClose, categoryType, onUpdate }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const config = CATEGORY_CONFIG[categoryType];

    // Load danh sách
    const loadItems = useCallback(async () => {
        if (!config) return;
        setLoading(true);
        setError('');
        try {
            const data = await config.loadFn();
            setItems(data || []);
        } catch (err) {
            setError('Lỗi tải danh sách');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [config]);

    useEffect(() => {
        if (isOpen && config) {
            loadItems();
        }
    }, [isOpen, config, loadItems]);

    // Thêm mới
    const handleAdd = async () => {
        if (!newItemName.trim()) {
            setError('Vui lòng nhập tên');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await config.addFn(newItemName.trim());
            setNewItemName('');
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
            await config.updateFn(editingId, editingName.trim());
            setEditingId(null);
            setEditingName('');
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

    if (!isOpen || !config) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
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
                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder={`Nhập tên ${config.title.toLowerCase()}...`}
                            className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button
                            onClick={handleAdd}
                            disabled={saving}
                            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiPlus className="w-4 h-4" />}
                            Thêm
                        </button>
                    </div>

                    {/* List */}
                    <div className="max-h-[300px] overflow-y-auto">
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
                                        className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                                    >
                                        {editingId === item[config.idField] ? (
                                            <>
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    className="flex-1 px-3 py-1 border border-neutral-300 rounded focus:ring-2 focus:ring-amber-500"
                                                    autoFocus
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                />
                                                <button
                                                    onClick={handleSaveEdit}
                                                    disabled={saving}
                                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                                                >
                                                    <FiCheck className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="p-2 text-neutral-500 hover:bg-neutral-200 rounded-lg"
                                                >
                                                    <FiX className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="flex-1 text-neutral-700">{item[config.nameField]}</span>
                                                <span className="text-xs text-neutral-400">{item[config.idField]}</span>
                                                <button
                                                    onClick={() => handleStartEdit(item)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item[config.idField])}
                                                    disabled={saving}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </>
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
