/**
 * ============================================
 * FAMILY TREE VIEW COMPONENT - Cây gia phả dạng đời
 * Clean Layout: Mỗi đời một hàng ngang
 * ============================================
 */

import { useState, useMemo } from 'react';
import { FiHeart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function FamilyTreeView({ members = [], relationships = [] }) {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('tree'); // 'generation' | 'tree'

    // Helper: Check if deceased
    const isDeceased = (member) => {
        const status = (member.TrangThai || '').toLowerCase();
        return status.includes('mất') || status.includes('mat');
    };

    // Get spouse of a member
    const getSpouse = (maTV) => {
        const marriage = relationships.find(r =>
            (r.MaTV === maTV && r.MaTVVC) || (r.MaTVVC === maTV && r.MaTV)
        );
        if (marriage) {
            const spouseId = marriage.MaTV === maTV ? marriage.MaTVVC : marriage.MaTV;
            return members.find(m => m.MaTV === spouseId);
        }
        return null;
    };

    // Get parents of a member
    const getParents = (maTV) => {
        const rel = relationships.find(r => r.MaTV === maTV && (r.MaTVCha || r.MaTVMe));
        return rel;
    };

    // Get children of a couple/member
    const getChildren = (maTV) => {
        return members.filter(m => {
            const rel = relationships.find(r =>
                r.MaTV === m.MaTV && (r.MaTVCha === maTV || r.MaTVMe === maTV)
            );
            return rel !== undefined;
        });
    };

    // Build generations - Group families by DOI
    const generationData = useMemo(() => {
        // Group members by DOI
        const byDoi = {};
        members.forEach(m => {
            const doi = m.DOI || 1;
            if (!byDoi[doi]) byDoi[doi] = [];
            byDoi[doi].push(m);
        });

        // Sort generations and build family groups
        const generations = Object.keys(byDoi)
            .sort((a, b) => Number(a) - Number(b))
            .map(doi => {
                const genMembers = byDoi[doi];

                // Find "primary" members (not just spouses) - those who have parents in previous generation
                // or are root if doi === 1
                const families = [];
                const processed = new Set();

                genMembers.forEach(member => {
                    if (processed.has(member.MaTV)) return;

                    const spouse = getSpouse(member.MaTV);

                    // Create family unit
                    families.push({
                        primary: member,
                        spouse: spouse,
                        children: getChildren(member.MaTV)
                    });

                    processed.add(member.MaTV);
                    if (spouse) processed.add(spouse.MaTV);
                });

                return {
                    doi: Number(doi),
                    families
                };
            });

        return generations;
    }, [members, relationships]);

    // Member Card Component
    const MemberCard = ({ member, size = 'normal' }) => {
        if (!member) return null;
        const isSmall = size === 'small';

        return (
            <div
                onClick={() => navigate(`/thanhvien/${member.MaTV}`)}
                className={`
                    cursor-pointer transition-all hover:scale-105 hover:shadow-lg
                    rounded-xl flex items-center gap-2 border-2
                    ${isSmall ? 'px-3 py-2' : 'px-4 py-3'}
                    ${isDeceased(member)
                        ? 'bg-gray-100 border-gray-300 text-gray-500'
                        : member.GioiTinh === 'Nữ'
                            ? 'bg-pink-50 border-pink-200 text-pink-700'
                            : 'bg-blue-50 border-blue-200 text-blue-700'
                    }
                `}
            >
                <span className={isSmall ? 'text-base' : 'text-xl'}>
                    {member.GioiTinh === 'Nữ' ? '👩' : '👨'}
                </span>
                <span className={`font-semibold ${isSmall ? 'text-xs' : 'text-sm'} max-w-[120px] truncate`}>
                    {member.HoTen}
                </span>
            </div>
        );
    };

    // Family Unit Component (couple + connector)
    const FamilyUnit = ({ primary, spouse }) => (
        <div className="flex items-center gap-1">
            <MemberCard member={primary} />
            {spouse && (
                <>
                    <div className="flex items-center px-1">
                        <div className="w-2 h-0.5 bg-pink-300"></div>
                        <FiHeart className="w-3 h-3 text-pink-400 mx-0.5" />
                        <div className="w-2 h-0.5 bg-pink-300"></div>
                    </div>
                    <MemberCard member={spouse} />
                </>
            )}
        </div>
    );

    // Generation View - Clean horizontal layout
    const GenerationView = () => (
        <div className="space-y-8">
            {generationData.map(({ doi, families }) => (
                <div key={doi} className="relative">
                    {/* Generation Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg">
                            {doi}
                        </div>
                        <div>
                            <h3 className="font-bold text-neutral-800">Đời thứ {doi}</h3>
                            <p className="text-xs text-neutral-500">
                                {families.reduce((sum, f) => sum + 1 + (f.spouse ? 1 : 0), 0)} thành viên
                            </p>
                        </div>
                    </div>

                    {/* Families in this generation */}
                    <div className="ml-12 pl-4 border-l-2 border-emerald-200">
                        <div className="flex flex-wrap gap-4">
                            {families.map((family, idx) => (
                                <FamilyUnit
                                    key={family.primary.MaTV || idx}
                                    primary={family.primary}
                                    spouse={family.spouse}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Tree View - Hierarchical with connectors
    const TreeView = () => (
        <div className="overflow-x-auto py-4">
            <div className="flex flex-col items-center gap-8 min-w-max">
                {generationData.map(({ doi, families }, genIndex) => (
                    <div key={doi} className="flex flex-col items-center">
                        {/* Generation label */}
                        <div className="mb-3 px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                            Đời {doi}
                        </div>

                        {/* Connector from previous generation */}
                        {genIndex > 0 && (
                            <div className="w-0.5 h-4 bg-emerald-300 -mt-3 mb-2"></div>
                        )}

                        {/* Families in this generation */}
                        <div className="flex flex-wrap justify-center gap-6">
                            {families.map((family, idx) => (
                                <div key={family.primary.MaTV || idx} className="flex flex-col items-center">
                                    <FamilyUnit primary={family.primary} spouse={family.spouse} />

                                    {/* Children connector */}
                                    {family.children.length > 0 && genIndex < generationData.length - 1 && (
                                        <div className="w-0.5 h-4 bg-emerald-300 mt-2"></div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Horizontal connector for multiple families */}
                        {families.length > 1 && genIndex < generationData.length - 1 && (
                            <div
                                className="h-0.5 bg-emerald-200 mt-2"
                                style={{ width: `${Math.min(families.length * 200, 800)}px` }}
                            ></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="glass-card overflow-hidden">
            {/* Header */}
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
                        <div className="text-5xl mb-4">🌳</div>
                        <p className="text-neutral-500">Chưa có thành viên nào</p>
                    </div>
                ) : viewMode === 'generation' ? (
                    <GenerationView />
                ) : (
                    <TreeView />
                )}
            </div>
        </div>
    );
}
