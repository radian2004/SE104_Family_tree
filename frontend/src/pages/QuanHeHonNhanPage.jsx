/**
 * ============================================
 * QUAN HỆ HÔN NHÂN PAGE - Tạo quan hệ vợ chồng
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiHeart, FiSave } from 'react-icons/fi';
import quanheService from '../services/quanhe.js';
import thanhvienService from '../services/thanhvien.js';

export default function QuanHeHonNhanPage() {
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        MaTV: '',
        MaTVVC: '',
        NgayBatDau: '',
        NgayKetThuc: ''
    });

    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Load members list
    useEffect(() => {
        const loadMembers = async () => {
            setIsLoadingMembers(true);
            try {
                const response = await thanhvienService.getList({ limit: 1000 });
                const memberList = response.items || response.result || response;
                setMembers(Array.isArray(memberList) ? memberList : []);
            } catch (err) {
                console.error('Error loading members:', err);
                console.log('API Response:', err.response);

                if (err.response?.status === 401) {
                    setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                } else if (err.response?.status === 403) {
                    setError('Bạn không có quyền truy cập.');
                } else {
                    setError(err.response?.data?.message || 'Không thể tải danh sách thành viên');
                }
            } finally {
                setIsLoadingMembers(false);
            }
        };
        loadMembers();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(null);
    };

    const validateForm = () => {
        if (!formData.MaTV) {
            setError('Vui lòng chọn thành viên thứ nhất');
            return false;
        }
        if (!formData.MaTVVC) {
            setError('Vui lòng chọn thành viên thứ hai (vợ/chồng)');
            return false;
        }
        if (formData.MaTV === formData.MaTVVC) {
            setError('Hai thành viên không thể giống nhau');
            return false;
        }
        if (!formData.NgayBatDau) {
            setError('Vui lòng nhập ngày bắt đầu hôn nhân');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Prepare payload
            const payload = {
                MaTV: formData.MaTV,
                MaTVVC: formData.MaTVVC,
                NgayBatDau: formData.NgayBatDau,
                NgayKetThuc: formData.NgayKetThuc || null
            };

            await quanheService.createHonNhan(payload);

            setSuccess(true);

            // Reset form
            setFormData({
                MaTV: '',
                MaTVVC: '',
                NgayBatDau: '',
                NgayKetThuc: ''
            });

            // Show success and redirect after 2 seconds
            setTimeout(() => {
                navigate(`/thanhvien/${formData.MaTV}`);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi tạo quan hệ hôn nhân');
            console.error('Error creating marriage:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getMemberName = (MaTV) => {
        const member = members.find(m => m.MaTV === MaTV);
        return member ? `${member.HoTen} (${member.GioiTinh || 'N/A'})` : '';
    };

    return (
        <div className="min-h-screen">
            {/* Decorative Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-rose-200/20 to-transparent rounded-full blur-3xl"></div>
            </div>

            {/* Navigation */}
            <nav className="navbar px-6 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2 text-neutral-600 hover:text-pink-600 transition-colors"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        <span>Quay lại</span>
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-800 mb-2 flex items-center gap-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                        💒 Tạo quan hệ hôn nhân
                    </h1>
                    <p className="text-neutral-500">Thiết lập quan hệ vợ chồng giữa hai thành viên</p>
                </div>

                {/* Success Alert */}
                {success && (
                    <div className="alert alert-success mb-6 animate-fade-in">
                        <span className="text-lg">✅</span>
                        <p>Tạo quan hệ hôn nhân thành công! Đang chuyển hướng...</p>
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="alert alert-danger mb-6 animate-fade-in">
                        <span className="text-lg">⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="glass-card p-8">
                    <div className="space-y-6">
                        {/* Member 1 */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                Thành viên thứ nhất <span className="text-red-500">*</span>
                            </label>
                            {isLoadingMembers ? (
                                <div className="flex items-center gap-2 text-neutral-500">
                                    <div className="spinner"></div>
                                    <span>Đang tải danh sách...</span>
                                </div>
                            ) : (
                                <select
                                    name="MaTV"
                                    value={formData.MaTV}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                >
                                    <option value="">-- Chọn thành viên --</option>
                                    {members.map(member => (
                                        <option key={member.MaTV} value={member.MaTV}>
                                            {member.HoTen} ({member.GioiTinh || 'N/A'}) - {member.MaTV}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {formData.MaTV && (
                                <p className="text-xs text-neutral-500 mt-1">
                                    Đã chọn: {getMemberName(formData.MaTV)}
                                </p>
                            )}
                        </div>

                        {/* Member 2 (Spouse) */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                Vợ/Chồng <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="MaTVVC"
                                value={formData.MaTVVC}
                                onChange={handleChange}
                                className="input"
                                required
                                disabled={isLoadingMembers}
                            >
                                <option value="">-- Chọn vợ/chồng --</option>
                                {members
                                    .filter(m => m.MaTV !== formData.MaTV)
                                    .map(member => (
                                        <option key={member.MaTV} value={member.MaTV}>
                                            {member.HoTen} ({member.GioiTinh || 'N/A'}) - {member.MaTV}
                                        </option>
                                    ))}
                            </select>
                            {formData.MaTVVC && (
                                <p className="text-xs text-neutral-500 mt-1">
                                    Đã chọn: {getMemberName(formData.MaTVVC)}
                                </p>
                            )}
                        </div>

                        {/* Marriage Start Date */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                Ngày bắt đầu hôn nhân <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="NgayBatDau"
                                value={formData.NgayBatDau}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                            <p className="text-xs text-neutral-500 mt-1">
                                Ngày kết hôn hoặc bắt đầu quan hệ vợ chồng
                            </p>
                        </div>

                        {/* Marriage End Date (Optional) */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                Ngày kết thúc (nếu có)
                            </label>
                            <input
                                type="date"
                                name="NgayKetThuc"
                                value={formData.NgayKetThuc}
                                onChange={handleChange}
                                className="input"
                            />
                            <p className="text-xs text-neutral-500 mt-1">
                                Để trống nếu quan hệ vẫn còn hiệu lực
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>
                            <span className="text-neutral-400 text-sm">Thông tin bổ sung</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <span>ℹ️</span>
                                Lưu ý
                            </h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Hai thành viên phải khác nhau</li>
                                <li>• Ngày bắt đầu là bắt buộc</li>
                                <li>• Ngày kết thúc chỉ cần điền khi quan hệ đã kết thúc (ly hôn, qua đời, ...)</li>
                                <li>• Sau khi tạo, bạn có thể xem quan hệ trong trang chi tiết thành viên</li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-6">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="btn btn-ghost"
                                disabled={isLoading}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading || isLoadingMembers}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner spinner-small"></div>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="w-4 h-4" />
                                        Tạo quan hệ
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
