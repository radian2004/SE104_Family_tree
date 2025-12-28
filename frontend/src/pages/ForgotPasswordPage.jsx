import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/auth';
import { FiMail, FiArrowLeft } from 'react-icons/fi';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            const res = await authService.forgotPassword(email);
            setMessage(res?.result?.message || 'Yêu cầu đã được gửi thành công. Vui lòng đợi Admin phê duyệt.');
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-fade-in relative z-10">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-bl-full -z-10 opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-100 rounded-tr-full -z-10 opacity-50"></div>

                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-800 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Quên Mật Khẩu
                    </h1>
                    <p className="text-gray-500">
                        Nhập email đã đăng ký để nhận hướng dẫn
                    </p>
                </div>

                {message ? (
                    <div className="alert alert-success mb-6 border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-xl p-4">
                        <div className="flex flex-col items-center text-center gap-3">
                            <span className="text-4xl">✅</span>
                            <p className="font-medium">{message}</p>
                            <Link
                                to="/login"
                                className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full"
                            >
                                Về trang đăng nhập
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="alert alert-danger bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                                <span>⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                    <FiMail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-gray-50 focus:bg-white"
                                    placeholder="user@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:from-orange-600 hover:to-amber-700 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Đang gửi...</span>
                                </>
                            ) : 'Gửi Yêu Cầu'}
                        </button>
                    </form>
                )}

                {!message && (
                    <div className="mt-8 text-center">
                        <Link
                            to="/login"
                            className="text-sm font-medium text-gray-500 hover:text-orange-600 flex items-center justify-center gap-2 transition-colors group"
                        >
                            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                            Quay lại đăng nhập
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
