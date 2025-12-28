import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import { FiMail, FiLock, FiArrowLeft, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Verify, 2: Reset
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Visibility toggle states
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Step 1: Verify Permission
    const handleVerify = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await authService.verifyResetPermission(email);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể xác thực quyền đặt lại mật khẩu.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Reset Password
    const handleReset = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await authService.resetPassword(email, newPassword);
            setMessage(res.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại.');
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
                        Đặt Lại Mật Khẩu
                    </h1>
                    <p className="text-gray-500">
                        {step === 1 ? 'Nhập email để kiểm tra quyền' : 'Nhập mật khẩu mới của bạn'}
                    </p>
                </div>

                {message ? (
                    <div className="text-center animate-slide-up py-4">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiCheckCircle className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Thành Công!</h2>
                        <p className="text-gray-600 mb-8 font-medium">{message}</p>

                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center w-full px-6 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Đăng nhập ngay
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="alert alert-danger mb-6 bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                                <span>⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleVerify} className="space-y-6">
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
                                            placeholder="example@email.com"
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
                                            <span>Đang xử lý...</span>
                                        </>
                                    ) : 'Kiểm tra quyền'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleReset} className="space-y-6 animate-slide-up">
                                <div className="form-group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500"
                                        value={email}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                            <FiLock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            required
                                            className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-gray-50 focus:bg-white"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            disabled={isLoading}
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors"
                                        >
                                            {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                            <FiLock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            required
                                            className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none bg-gray-50 focus:bg-white"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            disabled={isLoading}
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors"
                                        >
                                            {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                        </button>
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
                                            <span>Đổi Mật Khẩu...</span>
                                        </>
                                    ) : 'Đổi Mật Khẩu'}
                                </button>
                            </form>
                        )}
                    </>
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
