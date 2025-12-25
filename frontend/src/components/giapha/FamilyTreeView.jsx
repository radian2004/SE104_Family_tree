/**
 * ============================================
 * FAMILY TREE VIEW COMPONENT - Hiển thị cây gia phả
 * ============================================
 */

import { useState, useEffect, useMemo } from 'react';
import { FiUser, FiHeart, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

/**
 * Hiển thị cây gia phả theo 2 chế độ:
 * 1. Theo đời (Generation View)
 * 2. Theo cây phả hệ (Tree View)
 */
export default function FamilyTreeView({ members = [], relationships = [] }) {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('generation'); // 'generation' | 'tree'
    const [expandedNodes, setExpandedNodes] = useState(new Set());

    // Group members by generation (DOI)
    const membersByGeneration = useMemo(() => {
        const grouped = {};
        members.forEach(member => {
            const gen = member.DOI || 0;
            if (!grouped[gen]) {
                grouped[gen] = [];
            }
            grouped[gen].push(member);
        });
        // Sort by generation
        return Object.keys(grouped)
            .sort((a, b) => Number(a) - Number(b))
            .map(gen => ({
                doi: Number(gen),
                members: grouped[gen]
            }));
    }, [members]);

    // Build tree structure from relationships
    const treeData = useMemo(() => {
        if (!members.length) return null;

        // Find root (DOI = 1 or earliest)
        const roots = members.filter(m => m.DOI === 1 || m.DOI === 0);
        if (roots.length === 0 && members.length > 0) {
            // Fallback: take member with lowest DOI
            const minDoi = Math.min(...members.map(m => m.DOI || 999));
            return members.filter(m => (m.DOI || 0) === minDoi);
        }
        return roots;
    }, [members]);

    const toggleNode = (maTV) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(maTV)) {
                next.delete(maTV);
            } else {
                next.add(maTV);
            }
            return next;
        });
    };

    // Get children of a member
    const getChildren = (maTV) => {
        return members.filter(m => {
            // Find members where this person is their parent
            const rel = relationships.find(r =>
                r.MaTV === m.MaTV && (r.MaTVCha === maTV || r.MaTVMe === maTV)
            );
            return rel !== undefined;
        });
    };

    // Get spouse of a member
    const getSpouse = (maTV) => {
        const rel = relationships.find(r =>
            (r.MaTV === maTV || r.MaTVVC === maTV) && r.NgayBatDau
        );
        if (rel) {
            const spouseId = rel.MaTV === maTV ? rel.MaTVVC : rel.MaTV;
            return members.find(m => m.MaTV === spouseId);
        }
        return null;
    };

    const isDeceased = (member) => {
        const status = (member.TrangThai || '').toLowerCase();
        return status.includes('mất') || status.includes('mat');
    };

    // Render member card
    const MemberCard = ({ member, showSpouse = false, size = 'normal' }) => {
        const spouse = showSpouse ? getSpouse(member.MaTV) : null;
        const isSmall = size === 'small';

        return (
            <div className="flex items-center gap-2">
                {/* Main member */}
                <div
                    onClick={() => navigate(`/thanhvien/${member.MaTV}`)}
                    className={`
            flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
            hover:shadow-lg hover:scale-105
            ${isDeceased(member)
                            ? 'bg-neutral-100 border-2 border-neutral-300'
                            : 'bg-white border-2 border-emerald-200 shadow-md'
                        }
            ${isSmall ? 'p-2' : 'p-3'}
          `}
                >
                    {/* Avatar */}
                    <div className={`
            rounded-full flex items-center justify-center text-lg
            ${member.GioiTinh === 'Nữ' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}
            ${isSmall ? 'w-8 h-8 text-sm' : 'w-10 h-10'}
          `}>
                        {member.GioiTinh === 'Nữ' ? '👩' : '👨'}
                    </div>

                    {/* Info */}
                    <div className={isSmall ? 'text-sm' : ''}>
                        <div className={`font-semibold ${isDeceased(member) ? 'text-neutral-500' : 'text-neutral-800'}`}>
                            {member.HoTen}
                        </div>
                        {!isSmall && (
                            <div className="text-xs text-neutral-400">
                                {member.NgayGioSinh
                                    ? new Date(member.NgayGioSinh).getFullYear()
                                    : ''
                                }
                                {isDeceased(member) && ' - Đã mất'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Spouse connection */}
                {spouse && (
                    <>
                        <div className="flex items-center gap-1">
                            <FiHeart className="w-4 h-4 text-pink-400" />
                            <div className="w-4 h-0.5 bg-pink-300"></div>
                        </div>
                        <div
                            onClick={() => navigate(`/thanhvien/${spouse.MaTV}`)}
                            className={`
                flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                hover:shadow-lg hover:scale-105
                ${isDeceased(spouse)
                                    ? 'bg-neutral-100 border-2 border-neutral-300'
                                    : 'bg-white border-2 border-pink-200 shadow-md'
                                }
                ${isSmall ? 'p-2' : 'p-3'}
              `}
                        >
                            <div className={`
                rounded-full flex items-center justify-center text-lg
                ${spouse.GioiTinh === 'Nữ' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}
                ${isSmall ? 'w-8 h-8 text-sm' : 'w-10 h-10'}
              `}>
                                {spouse.GioiTinh === 'Nữ' ? '👩' : '👨'}
                            </div>
                            <div className={isSmall ? 'text-sm' : ''}>
                                <div className={`font-semibold ${isDeceased(spouse) ? 'text-neutral-500' : 'text-neutral-800'}`}>
                                    {spouse.HoTen}
                                </div>
                                {!isSmall && (
                                    <div className="text-xs text-neutral-400">
                                        {spouse.NgayGioSinh ? new Date(spouse.NgayGioSinh).getFullYear() : ''}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    // Render tree node recursively
    const TreeNode = ({ member, level = 0 }) => {
        const children = getChildren(member.MaTV);
        const hasChildren = children.length > 0;
        const isExpanded = expandedNodes.has(member.MaTV);

        return (
            <div className="flex flex-col" style={{ paddingLeft: level > 0 ? '2rem' : 0 }}>
                {/* Node */}
                <div className="flex items-center gap-2 mb-2">
                    {hasChildren && (
                        <button
                            onClick={() => toggleNode(member.MaTV)}
                            className="p-1 rounded hover:bg-neutral-100 transition-colors"
                        >
                            {isExpanded ? (
                                <FiChevronDown className="w-4 h-4 text-neutral-500" />
                            ) : (
                                <FiChevronRight className="w-4 h-4 text-neutral-500" />
                            )}
                        </button>
                    )}
                    {!hasChildren && <div className="w-6"></div>}

                    <MemberCard member={member} showSpouse={true} size="small" />
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div className="ml-4 pl-4 border-l-2 border-emerald-200">
                        {children.map(child => (
                            <TreeNode key={child.MaTV} member={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="glass-card overflow-hidden">
            {/* Header with view toggle */}
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Cây gia phả
                </h2>

                {/* View Toggle */}
                <div className="flex bg-neutral-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('generation')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'generation'
                                ? 'bg-white shadow text-emerald-600'
                                : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                    >
                        📊 Theo đời
                    </button>
                    <button
                        onClick={() => setViewMode('tree')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'tree'
                                ? 'bg-white shadow text-emerald-600'
                                : 'text-neutral-500 hover:text-neutral-700'
                            }`}
                    >
                        🌳 Dạng cây
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {members.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4">👤</div>
                        <p className="text-neutral-500">Chưa có thành viên nào</p>
                    </div>
                ) : viewMode === 'generation' ? (
                    /* ==================== GENERATION VIEW ==================== */
                    <div className="space-y-8">
                        {membersByGeneration.map(({ doi, members: genMembers }) => (
                            <div key={doi} className="relative">
                                {/* Generation Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {doi || '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-neutral-800">
                                            Đời thứ {doi || '?'}
                                        </h3>
                                        <p className="text-sm text-neutral-500">
                                            {genMembers.length} thành viên
                                        </p>
                                    </div>
                                </div>

                                {/* Members Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-6 border-l-2 border-emerald-200 ml-6">
                                    {genMembers.map(member => (
                                        <MemberCard key={member.MaTV} member={member} showSpouse={false} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* ==================== TREE VIEW ==================== */
                    <div className="overflow-x-auto">
                        <div className="min-w-max p-4">
                            {treeData && treeData.map(root => (
                                <TreeNode key={root.MaTV} member={root} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
