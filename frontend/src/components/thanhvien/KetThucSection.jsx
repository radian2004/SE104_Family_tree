import { useState, useEffect } from 'react';
import ketThucService from '../../services/ketthuc';

export default function KetThucSection({ MaTV, onStatusChange }) {
    const [ketThucInfo, setKetThucInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        NgayGioMat: '',
        MaNguyenNhanMat: '',
        MaDiaDiem: ''
    });

    const loadKetThucInfo = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await ketThucService.getDetail(MaTV);
            if (data) {
                setKetThucInfo(data);
                setFormData({
                    NgayGioMat: data.NgayGioMat ? data.NgayGioMat.slice(0, 16) : '',
                    MaNguyenNhanMat: data.MaNguyenNhanMat || '',
                    MaDiaDiem: data.MaDiaDiem || ''
                });
            }
        } catch (err) {
            // Silent 404 means member is alive
            if (err.response?.status !== 404) {
                console.error("Error loading death info:", err);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (MaTV) {
            loadKetThucInfo();
        }
    }, [MaTV]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            setError(null);
            if (ketThucInfo) {
                // Update
                await ketThucService.update(MaTV, formData);
            } else {
                // Create (Báo tử)
                await ketThucService.ghiNhan({ ...formData, MaTV });
            }
            setIsEditing(false);
            loadKetThucInfo();
            onStatusChange && onStatusChange();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Hủy thông tin kết thúc? Thành viên sẽ được chuyển về trạng thái 'Còn sống'?")) return;

        try {
            setIsLoading(true);
            setError(null);
            await ketThucService.delete(MaTV);
            setKetThucInfo(null);
            setIsEditing(false);
            setFormData({ NgayGioMat: '', MaNguyenNhanMat: '', MaDiaDiem: '' });
            onStatusChange && onStatusChange();
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Lỗi khi xóa');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !ketThucInfo && !isEditing) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
                <div className="text-center py-4">
                    <div className="spinner inline-block"></div>
                    <p className="text-gray-500 mt-2">Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    // Alive state - Show "Báo tử" button
    if (!ketThucInfo && !isEditing) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm mt-6 border-l-4 border-green-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Trạng thái: Còn Sống</h3>
                        <p className="text-gray-500 text-sm mt-1">Thành viên hiện đang còn sống.</p>
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
                    >
                        ⚰️ Báo tử
                    </button>
                </div>
            </div>
        );
    }

    // View Mode (Dead)
    if (ketThucInfo && !isEditing) {
        return (
            <div className="bg-gray-100 p-6 rounded-lg shadow-sm mt-6 border-l-4 border-gray-500">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">🪦 Thông tin Kết thúc</h3>
                    <div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-blue-600 hover:underline mr-4">
                            Sửa
                        </button>
                        <button
                            onClick={handleDelete}
                            className="text-red-600 hover:underline">
                            Hủy (Hồi sinh)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <span className="block text-gray-500 text-sm">Ngày giờ mất</span>
                        <span className="font-semibold">
                            {ketThucInfo.NgayGioMat
                                ? new Date(ketThucInfo.NgayGioMat).toLocaleString('vi-VN')
                                : 'N/A'}
                        </span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-sm">Nguyên nhân</span>
                        <span className="font-semibold">{ketThucInfo.TenNguyenNhan || ketThucInfo.MaNguyenNhanMat || 'Không rõ'}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-sm">Địa điểm</span>
                        <span className="font-semibold">{ketThucInfo.TenDiaDiem || ketThucInfo.MaDiaDiem || 'Không rõ'}</span>
                    </div>
                </div>
            </div>
        );
    }

    // Edit/Create Form
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6 border border-gray-200">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <h3 className="text-xl font-bold text-gray-800 mb-4">
                {ketThucInfo ? 'Chỉnh sửa thông tin kết thúc' : 'Ghi nhận kết thúc (Báo tử)'}
            </h3>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày giờ mất *
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full border rounded px-3 py-2"
                            value={formData.NgayGioMat}
                            onChange={e => setFormData({ ...formData, NgayGioMat: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nguyên nhân (Mã)
                        </label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="Nhập mã nguyên nhân"
                            value={formData.MaNguyenNhanMat}
                            onChange={e => setFormData({ ...formData, MaNguyenNhanMat: e.target.value })}
                        />
                        <p className="text-xs text-gray-400 mt-1">* Backend chưa có API danh sách</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Địa điểm (Mã)
                        </label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="Nhập mã địa điểm"
                            value={formData.MaDiaDiem}
                            onChange={e => setFormData({ ...formData, MaDiaDiem: e.target.value })}
                        />
                        <p className="text-xs text-gray-400 mt-1">* Backend chưa có API danh sách</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditing(false);
                            setError(null);
                            if (!ketThucInfo) {
                                setFormData({ NgayGioMat: '', MaNguyenNhanMat: '', MaDiaDiem: '' });
                            }
                        }}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                    >
                        Hủy
                    </button>
                </div>
            </form>
        </div>
    );
}
