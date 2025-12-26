/**
 * ============================================
 * QUAN HỆ SECTION - Hiển thị quan hệ gia đình
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiUsers, FiChevronRight } from 'react-icons/fi';
import quanheService from '../../services/quanhe.js';

export default function QuanHeSection({ MaTV, memberName, memberGender }) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Relationships data
    const [spouse, setSpouse] = useState([]); // Vợ/chồng
    const [parents, setParents] = useState(null); // Cha mẹ
    const [children, setChildren] = useState([]); // Con cái

    useEffect(() => {
        const loadRelationships = async () => {
            if (!MaTV) return;

            setIsLoading(true);
            setError(null);

            try {
                // Load all relationships in parallel
                const [spouseData, parentsData, childrenData] = await Promise.all([
                    quanheService.getHonNhan(MaTV).catch(() => []),
                    quanheService.getChaMe(MaTV).catch(() => null),
                    quanheService.getConCai(MaTV).catch(() => [])
                ]);

                setSpouse(Array.isArray(spouseData) ? spouseData : []);
                setParents(parentsData);
                setChildren(Array.isArray(childrenData) ? childrenData : []);
            } catch (err) {
                console.error('Error loading relationships:', err);
                setError('Không thể tải thông tin quan hệ');
            } finally {
                setIsLoading(false);
            }
        };

        loadRelationships();
    }, [MaTV]);

    // Navigate to member detail
    const goToMember = (maTV) => {
        if (maTV) {
            navigate(`/thanhvien/${maTV}`);
        }
    };

    // Check if has any relationships
    const hasRelationships = spouse.length > 0 ||
        (parents && (parents.MaTVCha || parents.MaTVMe)) ||
        children.length > 0;

    if (isLoading) {
        return (
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                    <FiHeart className="text-pink-500" />
                    Quan hệ gia đình
                </h3>
                <div className="animate-pulse flex items-center justify-center py-8">
                    <div className="spinner"></div>
                    <span className="ml-2 text-neutral-500">Đang tải...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center gap-2">
                <FiHeart className="text-pink-500" />
                Quan hệ gia đình
            </h3>

            {error && (
                <div className="text-sm text-red-500 mb-4">{error}</div>
            )}

            {!hasRelationships ? (
                <div className="text-center py-8 text-neutral-500">
                    <div className="text-4xl mb-2">👤</div>
                    <p>Chưa có thông tin quan hệ gia đình</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* ==================== CHA MẸ ==================== */}
                    {parents && (parents.MaTVCha || parents.MaTVMe) && (
                        <div>
                            <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                                👨‍👩‍👧 Cha mẹ
                            </h4>
                            <div className="space-y-2">
                                {parents.MaTVCha && (
                                    <div
                                        onClick={() => goToMember(parents.MaTVCha)}
                                        className="flex items-center justify-between p-3 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                                                👨
                                            </div>
                                            <div>
                                                <div className="font-medium text-neutral-800">
                                                    {parents.HoTenCha || `Thành viên ${parents.MaTVCha}`}
                                                </div>
                                                <div className="text-xs text-blue-600">Cha</div>
                                            </div>
                                        </div>
                                        <div className="text-blue-500 group-hover:translate-x-1 transition-transform">
                                            <FiChevronRight />
                                        </div>
                                    </div>
                                )}
                                {parents.MaTVMe && (
                                    <div
                                        onClick={() => goToMember(parents.MaTVMe)}
                                        className="flex items-center justify-between p-3 bg-pink-50 rounded-xl cursor-pointer hover:bg-pink-100 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-lg">
                                                👩
                                            </div>
                                            <div>
                                                <div className="font-medium text-neutral-800">
                                                    {parents.HoTenMe || `Thành viên ${parents.MaTVMe}`}
                                                </div>
                                                <div className="text-xs text-pink-600">Mẹ</div>
                                            </div>
                                        </div>
                                        <div className="text-pink-500 group-hover:translate-x-1 transition-transform">
                                            <FiChevronRight />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ==================== VỢ/CHỒNG ==================== */}
                    {spouse.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                                💒 {memberGender === 'Nữ' ? 'Chồng' : 'Vợ'}
                            </h4>
                            <div className="space-y-2">
                                {spouse.map((sp, index) => (
                                    <div
                                        key={sp.MaTVVC || index}
                                        onClick={() => goToMember(sp.MaTVVC)}
                                        className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl cursor-pointer hover:from-pink-100 hover:to-rose-100 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${sp.GioiTinh === 'Nữ' ? 'bg-pink-100' : 'bg-blue-100'
                                                }`}>
                                                {sp.GioiTinh === 'Nữ' ? '👩' : '👨'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-neutral-800">
                                                    {sp.HoTenVC || `Thành viên ${sp.MaTVVC}`}
                                                </div>
                                                <div className="text-xs text-rose-600 flex items-center gap-1">
                                                    <FiHeart className="w-3 h-3" />
                                                    {sp.GioiTinh === 'Nữ' ? 'Vợ' : 'Chồng'}
                                                    {sp.NgayBatDau && (
                                                        <span className="ml-1">
                                                            • Từ {new Date(sp.NgayBatDau).getFullYear()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-rose-500 group-hover:translate-x-1 transition-transform">
                                            <FiChevronRight />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ==================== CON CÁI ==================== */}
                    {children.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                                👶 Con cái ({children.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {children.map((child, index) => (
                                    <div
                                        key={child.MaTV || index}
                                        onClick={() => goToMember(child.MaTV)}
                                        className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl cursor-pointer hover:bg-emerald-100 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${child.GioiTinh === 'Nữ' ? 'bg-pink-100' : 'bg-blue-100'
                                                }`}>
                                                {child.GioiTinh === 'Nữ' ? '👧' : '👦'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-neutral-800">
                                                    {child.HoTenCon || child.HoTen || `Thành viên ${child.MaTV}`}
                                                </div>
                                                <div className="text-xs text-emerald-600">
                                                    {child.GioiTinh === 'Nữ' ? 'Con gái' : 'Con trai'}
                                                    {child.NgayGioSinh && (
                                                        <span className="ml-1">
                                                            • {new Date(child.NgayGioSinh).getFullYear()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-emerald-500 group-hover:translate-x-1 transition-transform">
                                            <FiChevronRight />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Summary Text */}
            {hasRelationships && (
                <div className="mt-6 pt-4 border-t border-neutral-100">
                    <p className="text-sm text-neutral-600 italic">
                        📝 <strong>{memberName}</strong>
                        {parents && parents.HoTenCha && ` là con của ${parents.HoTenCha}`}
                        {parents && parents.HoTenMe && parents.HoTenCha && ` và ${parents.HoTenMe}`}
                        {parents && parents.HoTenMe && !parents.HoTenCha && ` là con của ${parents.HoTenMe}`}
                        {spouse.length > 0 && `, ${memberGender === 'Nữ' ? 'vợ' : 'chồng'} của ${spouse[0].HoTenVC || 'người phối ngẫu'}`}
                        {children.length > 0 && `, có ${children.length} con`}
                        .
                    </p>
                </div>
            )}
        </div>
    );
}
