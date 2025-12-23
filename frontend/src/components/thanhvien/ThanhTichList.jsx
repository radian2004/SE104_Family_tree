import { useState, useEffect } from 'react';
import thanhTichService from '../../services/thanhtich';
import { useLookupsStore } from '../../store/lookupsStore';

export default function ThanhTichList({ MaTV }) {
    const { allLookups } = useLookupsStore();
    const [thanhTichs, setThanhTichs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [selectedLoai, setSelectedLoai] = useState('');
    const [ngayPhatSinh, setNgayPhatSinh] = useState('');

    // Load danh sách thành tích
    const loadThanhTich = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const res = await thanhTichService.traCuu({ MaTV });
            setThanhTichs(res.result || res || []);
        } catch (err) {
            console.error('Lỗi tải thành tích:', err);
            setError(err.response?.data?.message || 'Không thể tải danh sách thành tích');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (MaTV) {
            loadThanhTich();
        }
    }, [MaTV]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!selectedLoai) {
            setError('Vui lòng chọn loại thành tích');
            return;
        }

        try {
            setIsAdding(true);
            setError(null);
            await thanhTichService.ghiNhan({
                MaTV,
                MaLTT: selectedLoai,
                NgayPhatSinh: ngayPhatSinh || undefined
            });

            // Reset form & reload
            setSelectedLoai('');
            setNgayPhatSinh('');
            loadThanhTich();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Có lỗi xảy ra khi thêm thành tích';
            setError(errorMsg);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Xóa thành tích "${item.ThanhTich}"?`)) return;

        try {
            const loai = allLookups?.loaithanhtich?.find(l => l.TenLTT === item.ThanhTich);
            if (!loai) {
                setError('Không tìm thấy mã loại thành tích để xóa');
                return;
            }

            await thanhTichService.xoa({
                MaTV,
                MaLTT: loai.MaLTT,
                NgayPhatSinh: item.NgayPhatSinh
            });
            setError(null);
            loadThanhTich();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Lỗi khi xóa thành tích');
        }
    };

    if (!MaTV) return null;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                🏅 Thành tích & Khen thưởng
            </h3>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Form thêm mới */}
            <form onSubmit={handleAdd} className="mb-6 p-4 bg-yellow-50 rounded border border-yellow-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại thành tích *</label>
                        <select
                            className="w-full border rounded px-3 py-2"
                            value={selectedLoai}
                            onChange={e => setSelectedLoai(e.target.value)}
                            required
                        >
                            <option value="">-- Chọn thành tích --</option>
                            {allLookups?.loaithanhtich?.map(l => (
                                <option key={l.MaLTT} value={l.MaLTT}>{l.TenLTT}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày phát sinh (Tùy chọn)</label>
                        <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={ngayPhatSinh}
                            onChange={e => setNgayPhatSinh(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={isAdding}
                            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50 w-full"
                        >
                            {isAdding ? 'Đang lưu...' : '➕ Thêm thành tích'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Danh sách */}
            {isLoading ? (
                <div className="text-center py-4">
                    <div className="spinner inline-block"></div>
                    <p className="text-gray-500 mt-2">Đang tải...</p>
                </div>
            ) : thanhTichs.length === 0 ? (
                <p className="text-gray-500 italic text-center py-4">Chưa có thành tích nào.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-2">STT</th>
                                <th className="px-4 py-2">Tên Thành Tích</th>
                                <th className="px-4 py-2">Ngày Phát Sinh</th>
                                <th className="px-4 py-2">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {thanhTichs.map((t, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">{idx + 1}</td>
                                    <td className="px-4 py-2 font-medium text-gray-800">{t.ThanhTich}</td>
                                    <td className="px-4 py-2">
                                        {t.NgayPhatSinh
                                            ? new Date(t.NgayPhatSinh).toLocaleDateString('vi-VN')
                                            : 'N/A'}
                                    </td>
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => handleDelete(t)}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
