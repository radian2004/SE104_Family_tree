/**
 * ============================================
 * NOT FOUND PAGE (404) - Premium Design
 * ============================================
 */

import { useNavigate } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-amber-50/30 flex items-center justify-center px-4">
      {/* Decorative Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-200/30 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="text-center max-w-md mx-auto">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-[180px] font-bold text-amber-100 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-8xl animate-float">🌳</div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-neutral-800 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
          Lạc đường rồi! 😢
        </h1>
        <p className="text-neutral-600 mb-8">
          Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển đến nơi khác.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary group"
          >
            <FiHome className="w-5 h-5" />
            Về trang chủ
          </button>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost group"
          >
            <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Quay lại
          </button>
        </div>

        {/* Footer */}
        <p className="text-neutral-400 text-sm mt-12">
          © 2025 Gia Phả - Family Tree Manager
        </p>
      </div>
    </div>
  );
}
