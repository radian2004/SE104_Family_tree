import { useState, useEffect } from 'react';
import authService from '../../services/auth';
import { FiCheck, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { formatDate } from '../../utils/helpers';

export default function AdminPasswordRequests() {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadRequests = async () => {
        setIsLoading(true);
        try {
            const data = await authService.getPasswordRequests();
            setRequests(data);
        } catch (err) {
            console.error('Error loading password requests:', err);
            setError('Không thể tải danh sách yêu cầu.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn duyệt yêu cầu này?')) return;

        try {
            await authService.approvePasswordRequest(id);
            alert('Đã duyệt yêu cầu thành công!');
            loadRequests(); // Reload list
        } catch (err) {
            alert(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt.');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ChoDuyet':
                return <span className="badge badge-warning flex items-center gap-1"><FiClock /> Chờ duyệt</span>;
            case 'DaDuyet':
                return <span className="badge badge-success flex items-center gap-1"><FiCheckCircle /> Đã duyệt</span>;
            case 'DaDoi':
                return <span className="badge badge-neutral flex items-center gap-1"><FiCheck /> Đã đổi</span>;
            default:
                return <span className="badge badge-ghost">{status}</span>;
        }
    };

    if (isLoading) return <div className="p-4 text-center"><div className="spinner"></div></div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;

    return (
        <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-neutral-800 mb-4 flex items-center gap-2">
                <FiClock className="text-emerald-600" />
                Yêu Cầu Đặt Lại Mật Khẩu
            </h3>

            {requests.length === 0 ? (
                <p className="text-neutral-500 italic">Không có yêu cầu nào.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Ngày Yêu Cầu</th>
                                <th>Trạng Thái</th>
                                <th>Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((req) => (
                                <tr key={req.MaYeuCau} className="hover:bg-neutral-50">
                                    <td className="font-medium">{req.Email}</td>
                                    <td className="text-sm">{formatDate(req.NgayYeuCau)}</td>
                                    <td>{getStatusBadge(req.TrangThai)}</td>
                                    <td>
                                        {req.TrangThai === 'ChoDuyet' && (
                                            <button
                                                onClick={() => handleApprove(req.MaYeuCau)}
                                                className="btn btn-sm btn-primary flex items-center gap-1"
                                            >
                                                <FiCheck /> Duyệt
                                            </button>
                                        )}
                                        {req.TrangThai === 'DaDuyet' && (
                                            <span className="text-xs text-neutral-400">Chờ người dùng đổi...</span>
                                        )}
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
