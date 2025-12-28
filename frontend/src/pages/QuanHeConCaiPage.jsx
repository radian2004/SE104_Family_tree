/**
 * ============================================
 * QUAN HỆ CON CÁI PAGE - Tạo quan hệ cha mẹ con
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiSave } from 'react-icons/fi';
import quanheService from '../services/quanhe.js';
import thanhvienService from '../services/thanhvien.js';
import DateInput from '../components/common/DateInput';

export default function QuanHeConCaiPage() {
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        MaTV: '',          // Child
        MaTVCha: '',       // Father
        MaTVMe: '',        // Mother
        NgayPhatSinh: ''   // Optional
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
            setError('Vui lòng chọn con (thành viên con)');
            return false;
        }
        if (!formData.MaTVCha && !formData.MaTVMe) {
            setError('Phải chọn ít nhất một trong hai: Cha hoặc Mẹ');
            return false;
        }
        if (formData.MaTV === formData.MaTVCha) {
            setError('Con không thể trùng với Cha');
            return false;
        }
        if (formData.MaTV === formData.MaTVMe) {
            setError('Con không thể trùng với Mẹ');
            return false;
        }
        if (formData.MaTVCha && formData.MaTVMe && formData.MaTVCha === formData.MaTVMe) {
            setError('Cha và Mẹ không thể là cùng một người');
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
                MaTVCha: formData.MaTVCha || null,
                MaTVMe: formData.MaTVMe || null,
                NgayPhatSinh: formData.NgayPhatSinh || new Date().toISOString().split('T')[0]
            };

            await quanheService.createQuanHeCon(payload);

            setSuccess(true);

            // Reset form
            setFormData({
                MaTV: '',
                MaTVCha: '',
                MaTVMe: '',
                NgayPhatSinh: ''
            });

            // Show success and redirect after 2 seconds
            setTimeout(() => {
                navigate(`/thanhvien/${formData.MaTV}`);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi tạo quan hệ cha mẹ con');
            console.error('Error creating parent-child relationship:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getMemberName = (MaTV) => {
        if (!MaTV) return '';
        const member = members.find(m => m.MaTV === MaTV);
        return member ? `${member.HoTen} (${member.GioiTinh || 'N/A'})` : '';
    };

    // Filter members for father (male only)
    const getMaleMembers = () => members.filter(m =>
        m.GioiTinh === 'Nam' && m.MaTV !== formData.MaTV
    );

    // Filter members for mother (female only)
    const getFemaleMembers = () => members.filter(m =>
        m.GioiTinh === 'Nữ' && m.MaTV !== formData.MaTV
    );

    return (
        <div className="min-h-screen">
            {/* Decorative Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-200/20 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/20 to-transparent rounded-full blur-3xl"></div>
            </div>

            {/* Navigation */}
            <nav className="navbar px-6 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2 text-neutral-600 hover:text-emerald-600 transition-colors"
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
                        👨‍👩‍👧 Tạo quan hệ con cái
                    </h1>
                    <p className="text-neutral-500">Thiết lập quan hệ cha mẹ cho thành viên</p>
                </div>

                {/* Success Alert */}
                {success && (
                    <div className="alert alert-success mb-6 animate-fade-in">
                        <span className="text-lg">✅</span>
                        <p>Tạo quan hệ con cái thành công! Đang chuyển hướng...</p>
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
                        {/* Child */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                Con (Thành viên con) <span className="text-red-500">*</span>
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
                                    <option value="">-- Chọn con --</option>
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

                        {/* Father */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                Cha 👨
                            </label>
                            <select
                                name="MaTVCha"
                                value={formData.MaTVCha}
                                onChange={handleChange}
                                className="input"
                                disabled={isLoadingMembers}
                            >
                                <option value="">-- Chọn cha (không bắt buộc) --</option>
                                {getMaleMembers().map(member => (
                                    <option key={member.MaTV} value={member.MaTV}>
                                        {member.HoTen} - {member.MaTV}
                                    </option>
                                ))}
                            </select>
                            {formData.MaTVCha && (
                                <p className="text-xs text-neutral-500 mt-1">
                                    Đã chọn: {getMemberName(formData.MaTVCha)}
                                </p>
                            )}
                            <p className="text-xs text-neutral-500 mt-1">
                                Chỉ hiển thị thành viên nam
                            </p>
                        </div>

                        {/* Mother */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                Mẹ 👩
                            </label>
                            <select
                                name="MaTVMe"
                                value={formData.MaTVMe}
                                onChange={handleChange}
                                className="input"
                                disabled={isLoadingMembers}
                            >
                                <option value="">-- Chọn mẹ (không bắt buộc) --</option>
                                {getFemaleMembers().map(member => (
                                    <option key={member.MaTV} value={member.MaTV}>
                                        {member.HoTen} - {member.MaTV}
                                    </option>
                                ))}
                            </select>
                            {formData.MaTVMe && (
                                <p className="text-xs text-neutral-500 mt-1">
                                    Đã chọn: {getMemberName(formData.MaTVMe)}
                                </p>
                            )}
                            <p className="text-xs text-neutral-500 mt-1">
                                Chỉ hiển thị thành viên nữ
                            </p>
                        </div>

                        {/* NgayPhatSinh (Optional) */}
                        <div>
                            <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                Ngày phát sinh (không bắt buộc)
                            </label>
                            <DateInput
                                name="NgayPhatSinh"
                                value={formData.NgayPhatSinh}
                                onChange={handleChange}
                                className="input"
                            />
                            <p className="text-xs text-neutral-500 mt-1">
                                Để trống sẽ dùng ngày hiện tại
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
                                <li>• Phải chọn ít nhất Cha hoặc Mẹ (hoặc cả hai)</li>
                                <li>• Cha phải là thành viên nam, Mẹ phải là thành viên nữ</li>
                                <li>• Con không thể trùng với Cha hoặc Mẹ</li>
                                <li>• Cha và Mẹ không thể là cùng một người</li>
                                <li>• Ngày phát sinh mặc định là ngày hiện tại nếu để trống</li>
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
