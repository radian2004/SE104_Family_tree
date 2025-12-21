/**
 * ============================================
 * NOT FOUND PAGE (404)
 * ============================================
 */

import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-800">404</h1>
        <p className="text-3xl font-bold text-gray-700 mt-4">Không tìm thấy trang</p>
        <p className="text-gray-600 mt-2">Trang bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
        
        <div className="mt-8 space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Về trang chủ
          </button>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}
