/**
 * ============================================
 * DANH MỤC PAGE - Quản lý tất cả danh mục
 * Chỉ dành cho Admin và Trưởng tộc
 * ============================================
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiSettings, FiMapPin, FiBriefcase, FiHeart, FiMap, FiAward, FiDollarSign } from 'react-icons/fi';
import CategoryManagementModal from '../components/common/CategoryManagementModal';
import GiaPhaSelector from '../components/common/GiaPhaSelector';
import { usePermissions } from '../hooks/usePermissions'; // Import usePermissions

// Category configuration
const CATEGORIES = [
    {
        id: 'quequan',
        name: 'Quê quán',
        description: 'Địa phương, tỉnh thành, vùng miền',
        icon: FiMapPin,
        color: 'emerald',
        gradient: 'from-emerald-500 to-teal-500'
    },
    {
        id: 'nghenghiep',
        name: 'Nghề nghiệp',
        description: 'Ngành nghề, công việc, chức vụ',
        icon: FiBriefcase,
        color: 'blue',
        gradient: 'from-blue-500 to-indigo-500'
    },
    {
        id: 'nguyennhanmat',
        name: 'Nguyên nhân mất',
        description: 'Lý do, nguyên nhân qua đời',
        icon: FiHeart,
        color: 'rose',
        gradient: 'from-rose-500 to-pink-500'
    },
    {
        id: 'diadiemmaitang',
        name: 'Địa điểm mai táng',
        description: 'Nghĩa trang, nơi an nghỉ',
        icon: FiMap,
        color: 'amber',
        gradient: 'from-amber-500 to-orange-500'
    },
    {
        id: 'loaithanhtich',
        name: 'Loại thành tích',
        description: 'Khen thưởng, danh hiệu, giải thưởng',
        icon: FiAward,
        color: 'yellow',
        gradient: 'from-yellow-500 to-amber-500'
    },
    {
        id: 'danhmuc',
        name: 'Danh mục thu chi',
        description: 'Loại khoản thu, khoản chi quỹ',
        icon: FiDollarSign,
        color: 'purple',
        gradient: 'from-purple-500 to-violet-500'
    }
];

export default function DanhMucPage() {
    const { isAdmin, isOwner } = usePermissions(); // Get permissions
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedGiaPha, setSelectedGiaPha] = useState(null); // Add selectedGiaPha state

    const openModal = (categoryId) => {
        setSelectedCategory(categoryId);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedCategory(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-amber-50/30">
            {/* Decorative Background */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-200/20 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-orange-200/20 to-transparent rounded-full blur-3xl"></div>
            </div>

            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 text-neutral-600 hover:text-amber-600 transition-colors"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                            <span>Quay lại</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
                            <FiSettings className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                                Quản lý danh mục
                            </h1>
                            <p className="text-neutral-500">Thêm, sửa, xóa các danh mục dùng trong hệ thống</p>
                        </div>
                    </div>
                </div>

                {/* Gia Pha Selector - Only for Admin/Owner */}
                {(isAdmin || isOwner) && (
                    <div className="mb-8">
                        <GiaPhaSelector
                            value={selectedGiaPha}
                            onChange={setSelectedGiaPha}
                            inititalSelectFirst={true}
                        />
                    </div>
                )}

                {/* Info Box */}
                <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-amber-800 text-sm">
                        <strong>💡 Lưu ý:</strong> Các danh mục đang được sử dụng sẽ không thể xóa. Bạn cần xóa hoặc cập nhật các thành viên/phiếu thu chi liên quan trước.
                    </p>
                </div>

                {/* Category Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CATEGORIES.map((category) => {
                        const IconComponent = category.icon;
                        return (
                            <div
                                key={category.id}
                                onClick={() => openModal(category.id)}
                                className="group cursor-pointer"
                            >
                                <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 transform hover:-translate-y-1">
                                    {/* Icon */}
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                                        <IconComponent className="w-7 h-7" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-bold text-neutral-800 mb-2 group-hover:text-amber-600 transition-colors">
                                        {category.name}
                                    </h3>
                                    <p className="text-neutral-500 text-sm mb-4">
                                        {category.description}
                                    </p>

                                    {/* Action Hint */}
                                    <div className="flex items-center gap-2 text-amber-600 text-sm font-medium group-hover:gap-3 transition-all">
                                        <span>Quản lý</span>
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-center text-neutral-400 text-sm">
                    <p>Trang này chỉ dành cho Admin và Trưởng tộc</p>
                </div>
            </main>

            {/* Category Management Modal */}
            <CategoryManagementModal
                isOpen={modalOpen}
                onClose={closeModal}
                categoryType={selectedCategory}
                MaGiaPha={selectedGiaPha} // Pass selected MaGiaPha to modal
                onUpdate={() => {
                    // Có thể reload data nếu cần
                }}
            />
        </div>
    );
}
