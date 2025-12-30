/**
 * ============================================
 * FAMILY TREE VIEW COMPONENT - Cây gia phả dạng đời
 * Clean Layout: Mỗi đời một hàng ngang
 * Với chức năng sửa/xóa thành viên
 * ============================================
 */

import { useState, useMemo } from 'react';
import { FiHeart, FiEdit2, FiTrash2, FiMoreVertical, FiUserPlus } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';

export default function FamilyTreeView({
    members = [],
    relationships = [],
    canManage = false,
    onEdit,
    onDelete,
    MaGiaPha
}) {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('tree'); // 'generation' | 'tree'
    const [activeMenu, setActiveMenu] = useState(null); // MaTV of member with open menu

    // Helper: Check if deceased
    const isDeceased = (member) => {
        const status = (member.TrangThai || '').toLowerCase();
        return status.includes('mất') || status.includes('mat');
    };


    // Get ALL spouses/partners of a member (including ended marriages AND co-parents without marriage)
    const getAllSpouses = (maTV) => {
        const spousesMap = new Map(); // Use Map to avoid duplicates

        // 1. From HONNHAN table (marriages)
        const marriages = relationships.filter(r =>
            (r.MaTV === maTV && r.MaTVVC) || (r.MaTVVC === maTV && r.MaTV)
        );

        marriages.forEach(marriage => {
            const spouseId = marriage.MaTV === maTV ? marriage.MaTVVC : marriage.MaTV;
            const spouse = members.find(m => m.MaTV === spouseId);
            if (spouse && !spousesMap.has(spouseId)) {
                spousesMap.set(spouseId, {
                    spouse,
                    NgayBatDau: marriage.NgayBatDau,
                    NgayKetThuc: marriage.NgayKetThuc,
                    isEnded: !!marriage.NgayKetThuc,
                    hasSharedChildren: false,
                    isCoParentOnly: false
                });
            }
        });

        // 2. From QUANHECON table - find co-parents (shared children without marriage record)
        const member = members.find(m => m.MaTV === maTV);
        const isMale = member?.GioiTinh === 'Nam';

        // Find all children where this member is the father or mother
        relationships.forEach(rel => {
            if (rel.MaTVCha === maTV && rel.MaTVMe) {
                // This member is father, find mother
                const mother = members.find(m => m.MaTV === rel.MaTVMe);
                if (mother && !spousesMap.has(rel.MaTVMe)) {
                    spousesMap.set(rel.MaTVMe, {
                        spouse: mother,
                        NgayBatDau: null,
                        NgayKetThuc: null,
                        isEnded: true, // No marriage record = treat as "không còn quan hệ hôn nhân"
                        hasSharedChildren: true,
                        isCoParentOnly: true // Mark as co-parent only (no marriage)
                    });
                } else if (mother && spousesMap.has(rel.MaTVMe)) {
                    // Already in map from marriage, just mark as having shared children
                    spousesMap.get(rel.MaTVMe).hasSharedChildren = true;
                }
            } else if (rel.MaTVMe === maTV && rel.MaTVCha) {
                // This member is mother, find father
                const father = members.find(m => m.MaTV === rel.MaTVCha);
                if (father && !spousesMap.has(rel.MaTVCha)) {
                    spousesMap.set(rel.MaTVCha, {
                        spouse: father,
                        NgayBatDau: null,
                        NgayKetThuc: null,
                        isEnded: true,
                        hasSharedChildren: true,
                        isCoParentOnly: true
                    });
                } else if (father && spousesMap.has(rel.MaTVCha)) {
                    spousesMap.get(rel.MaTVCha).hasSharedChildren = true;
                }
            }
        });

        return Array.from(spousesMap.values());
    };

    // Get children of a member (either as father or mother)
    const getChildren = (maTV) => {
        return members.filter(m => {
            const rel = relationships.find(r =>
                r.MaTV === m.MaTV && (r.MaTVCha === maTV || r.MaTVMe === maTV)
            );
            return rel !== undefined;
        });
    };

    // Get parents of a member
    const getParents = (maTV) => {
        const rel = relationships.find(r => r.MaTV === maTV);
        if (!rel) return { father: null, mother: null };

        const father = rel.MaTVCha ? members.find(m => m.MaTV === rel.MaTVCha) : null;
        const mother = rel.MaTVMe ? members.find(m => m.MaTV === rel.MaTVMe) : null;

        return { father, mother };
    };

    // Build generations - Calculate generations dynamically from relationships
    const generationData = useMemo(() => {
        if (!members.length) return [];

        // 1. Build adjacency list for parent -> children
        const childrenMap = new Map();
        members.forEach(m => childrenMap.set(m.MaTV, []));

        relationships.forEach(rel => {
            if (rel.MaTVCha) {
                const list = childrenMap.get(rel.MaTVCha) || [];
                if (!list.includes(rel.MaTV)) list.push(rel.MaTV);
                childrenMap.set(rel.MaTVCha, list);
            }
            if (rel.MaTVMe) {
                const list = childrenMap.get(rel.MaTVMe) || [];
                if (!list.includes(rel.MaTV)) list.push(rel.MaTV);
                childrenMap.set(rel.MaTVMe, list);
            }
        });

        // 2. Calculate generation (DOI) for each member
        // Initialize with explicit DOI if available, otherwise 1
        const doiMap = new Map();
        members.forEach(m => {
            // Default to 0, will be adjusted relative to root
            // Or trust DB DOI if present? Better to recalculate to ensure consistency
            doiMap.set(m.MaTV, 0);
        });

        // Find roots (members with NO parents in the current list)
        // ⚠️ CRITICAL FIX: Only consider QUANHECON records with actual MaTVCha or MaTVMe
        // Do NOT mark members as having parents just because they have marriage records
        const hasParents = new Set();
        relationships.forEach(rel => {
            // Only add to hasParents if this is a QUANHECON record with actual parent info
            if (rel.MaTV && (rel.MaTVCha || rel.MaTVMe)) {
                hasParents.add(rel.MaTV);
            }
        });

        const roots = members.filter(m => !hasParents.has(m.MaTV));

        // If no roots (circular or empty?), pick the oldest one or first one
        const queue = roots.length > 0 ? roots.map(m => ({ id: m.MaTV, gen: 0 })) : [{ id: members[0].MaTV, gen: 0 }];
        const visited = new Set();

        // BFS to assign generations
        // Note: This assumes simple tree structure. 
        // For spouses, they should align with their partner's generation.

        // Improved approach:
        // 1. Assign explicit generation if known (e.g. root = 0)
        // 2. Propagate down to children (gen + 1)
        // 3. Spouses share generation? Usually yes.

        // Let's use a simpler approach:
        // Just rely on parent-child links. Spouses will be placed in the same row by render logic.

        queue.forEach(item => {
            visited.add(item.id);
            doiMap.set(item.id, item.gen);
        });

        let head = 0;
        while (head < queue.length) {
            const { id, gen } = queue[head++];
            const childrenId = childrenMap.get(id) || [];

            childrenId.forEach(childId => {
                // If child not visited or we found a "deeper" path?
                // Usually generation is fixed. 
                // Use Max generation if multiple paths (unlikely in tree)
                // But avoid cycles.

                // If not visited, enqueue
                if (!visited.has(childId)) {
                    visited.add(childId);
                    doiMap.set(childId, gen + 1);
                    queue.push({ id: childId, gen: gen + 1 });
                }
            });
        }

        // Handle unvisited members (disconnected branches)
        // Treat them as separate roots (gen 0) or attach to default
        members.forEach(m => {
            if (!visited.has(m.MaTV)) {
                // Determine generation for disconnected
                doiMap.set(m.MaTV, 0);
            }
        });

        // ⚡ CRITICAL FIX: Align spouse generations with iterative propagation
        // After BFS, some spouses might have wrong generation if they were ROOT
        // but married to someone with assigned generation
        // Example: Bưởi (no parents, ROOT gen=0) married to Hưng (gen=1) 
        // → Bưởi should be gen=1, and children should shift accordingly

        // Iterate until no more changes (to cascade updates)
        let changed = true;
        let iterations = 0;
        const MAX_ITERATIONS = 20; // Increased to handle complex family trees with 6+ generations

        while (changed && iterations < MAX_ITERATIONS) {
            changed = false;
            iterations++;

            relationships.forEach(rel => {
                // Only process HONNHAN records (marriage)
                if (rel.MaTV && rel.MaTVVC && !rel.MaTVCha && !rel.MaTVMe) {
                    const gen1 = doiMap.get(rel.MaTV);
                    const gen2 = doiMap.get(rel.MaTVVC);

                    if (gen1 !== undefined && gen2 !== undefined && gen1 !== gen2) {
                        // Spouses should share the same generation (use max)
                        const correctGen = Math.max(gen1, gen2);

                        // Update spouse 1 and propagate to children
                        if (doiMap.get(rel.MaTV) !== correctGen) {
                            doiMap.set(rel.MaTV, correctGen);
                            changed = true;

                            // Update all children to correctGen + 1
                            const children1 = childrenMap.get(rel.MaTV) || [];
                            children1.forEach(childId => {
                                const childGen = doiMap.get(childId);
                                if (childGen !== undefined && childGen <= correctGen) {
                                    doiMap.set(childId, correctGen + 1);
                                    changed = true;
                                }
                            });
                        }

                        // Update spouse 2 and propagate to children
                        if (doiMap.get(rel.MaTVVC) !== correctGen) {
                            doiMap.set(rel.MaTVVC, correctGen);
                            changed = true;

                            // Update all children to correctGen + 1
                            const children2 = childrenMap.get(rel.MaTVVC) || [];
                            children2.forEach(childId => {
                                const childGen = doiMap.get(childId);
                                if (childGen !== undefined && childGen <= correctGen) {
                                    doiMap.set(childId, correctGen + 1);
                                    changed = true;
                                }
                            });
                        }
                    }
                }
            });
        }


        // 3. Group by calculated DOI
        const globalProcessed = new Set();
        const byDoi = {};

        // Normalize generations so min is 0 (or 1)
        // const minGen = Math.min(...Array.from(doiMap.values()));
        // Shift all to start at 0

        members.forEach(m => {
            const rawGen = doiMap.get(m.MaTV);
            // We want 1-based indexing for display typically, or 0-based. 
            // DB uses 'DOI' usually 0 or 1 based. Let's use 0-based internaally but display as "Đời X"
            const doi = rawGen;

            if (!byDoi[doi]) byDoi[doi] = [];
            byDoi[doi].push(m);
        });

        // 4. Sort and build families (same logic as before)
        const generations = Object.keys(byDoi)
            .sort((a, b) => Number(a) - Number(b))
            .map(doiKey => {
                const doi = Number(doiKey);
                const genMembers = byDoi[doi];
                const families = [];

                // Sort members so those with more spouses processed first
                const sortedMembers = [...genMembers].sort((a, b) => {
                    const aSpouses = getAllSpouses(a.MaTV).length;
                    const bSpouses = getAllSpouses(b.MaTV).length;
                    return bSpouses - aSpouses;
                });

                sortedMembers.forEach(member => {
                    if (globalProcessed.has(member.MaTV)) return;

                    const allSpouses = getAllSpouses(member.MaTV);
                    const validSpouses = allSpouses.filter(s => s.spouse);

                    families.push({
                        primary: member,
                        spouses: validSpouses,
                        children: getChildren(member.MaTV)
                    });

                    globalProcessed.add(member.MaTV);

                    validSpouses.forEach(s => {
                        if (s.spouse && !globalProcessed.has(s.spouse.MaTV)) {
                            globalProcessed.add(s.spouse.MaTV);
                        }
                    });
                });

                return {
                    doi: doi, // Use calculated DOI
                    families
                };
            });

        return generations;
    }, [members, relationships]);

    // Toggle action menu
    const toggleMenu = (e, MaTV) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === MaTV ? null : MaTV);
    };

    // Close menu when clicking outside
    const handleClickOutside = () => {
        setActiveMenu(null);
    };

    // Member Card Component with action menu
    const MemberCard = ({ member, size = 'normal', showParents = false }) => {
        if (!member) return null;
        const isSmall = size === 'small';
        const isMenuOpen = activeMenu === member.MaTV;

        // Get parent info for this member
        const parents = getParents(member.MaTV);
        const hasParents = parents.father || parents.mother;

        return (
            <div className="relative group">
                {/* Connector line from parent (if has parents) */}
                {showParents && hasParents && (
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-0.5 h-20 bg-blue-400"></div>
                )}

                <div
                    onClick={() => navigate(`/thanhvien/${member.MaTV}`)}
                    className={`
                        cursor-pointer transition-all hover:scale-105 hover:shadow-lg
                        rounded-xl flex flex-col border-2
                        ${isSmall ? 'px-3 py-2' : 'px-4 py-3'}
                        ${isDeceased(member)
                            ? 'bg-gray-100 border-gray-300 text-gray-500'
                            : member.GioiTinh === 'Nữ'
                                ? 'bg-pink-50 border-pink-200 text-pink-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                        }
                    `}
                >
                    <div className="flex items-center gap-2">
                        <span className={isSmall ? 'text-base' : 'text-xl'}>
                            {member.GioiTinh === 'Nữ' ? '👩' : '👨'}
                        </span>
                        <span className={`font-semibold ${isSmall ? 'text-xs' : 'text-sm'} max-w-[120px] truncate`}>
                            {member.HoTen}
                        </span>
                    </div>

                    {/* Show parent info if member has parents */}
                    {showParents && hasParents && (
                        <div className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1 truncate max-w-[160px]">
                            {parents.mother && (
                                <span title={`Mẹ: ${parents.mother.HoTen}`}>
                                    👩 {parents.mother.HoTen.split(' ').slice(-2).join(' ')}
                                </span>
                            )}
                            {parents.father && parents.mother && <span>•</span>}
                            {parents.father && (
                                <span title={`Cha: ${parents.father.HoTen}`}>
                                    👨 {parents.father.HoTen.split(' ').slice(-2).join(' ')}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Action button - only show for managers */}
                    {canManage && (
                        <button
                            onClick={(e) => toggleMenu(e, member.MaTV)}
                            className="ml-1 p-1 rounded-full hover:bg-white/50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <FiMoreVertical className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Dropdown Menu */}
                {canManage && isMenuOpen && (
                    <div
                        className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-neutral-200 py-1 z-50 min-w-[140px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => {
                                setActiveMenu(null);
                                onEdit && onEdit(member.MaTV);
                            }}
                            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-emerald-50 text-neutral-700"
                        >
                            <FiEdit2 className="w-4 h-4 text-emerald-600" />
                            Chỉnh sửa
                        </button>
                        <button
                            onClick={() => {
                                setActiveMenu(null);
                                onDelete && onDelete(member.MaTV, member.HoTen);
                            }}
                            className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-50 text-red-600"
                        >
                            <FiTrash2 className="w-4 h-4" />
                            Xóa
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Marriage Connector - shows different styles based on relationship type
    // - Active marriage: heart + solid line
    // - Ended marriage: X + gray line
    // - Co-parents only (no marriage but shared children): dashed line
    const MarriageConnector = ({ isEnded, hasSharedChildren, isCoParentOnly }) => {
        // Co-parent only: show dashed line
        if (isCoParentOnly && hasSharedChildren) {
            return (
                <div className="flex items-center px-1">
                    <div className="w-6 h-0.5 border-t-2 border-dashed border-gray-400"></div>
                </div>
            );
        }

        // Ended marriage: gray line with X
        if (isEnded) {
            return (
                <div className="flex items-center px-1">
                    <div className="w-2 h-0.5 bg-gray-300"></div>
                    <span className="text-gray-400 mx-0.5 text-xs">✕</span>
                    <div className="w-2 h-0.5 bg-gray-300"></div>
                </div>
            );
        }

        // Active marriage: pink line with heart
        return (
            <div className="flex items-center px-1">
                <div className="w-2 h-0.5 bg-pink-300"></div>
                <FiHeart className="w-3 h-3 text-pink-400 mx-0.5" />
                <div className="w-2 h-0.5 bg-pink-300"></div>
            </div>
        );
    };

    // Family Unit Component (primary + multiple spouses) - VERTICAL LAYOUT
    const FamilyUnit = ({ primary, spouses = [], showParents = false }) => (
        <div className="inline-block">
            {/* Primary member at top */}
            <div className="mb-1">
                <MemberCard member={primary} showParents={showParents} />
            </div>

            {/* Spouses stacked below */}
            {spouses.length > 0 && (
                <div className="ml-4 pl-2 border-l-2 border-gray-300 space-y-2">
                    {spouses.map((spouseInfo, idx) => (
                        spouseInfo.spouse && (
                            <div key={spouseInfo.spouse.MaTV || idx} className="flex items-center -ml-2">
                                {/* Horizontal connector */}
                                <MarriageConnector
                                    isEnded={spouseInfo.isEnded}
                                    hasSharedChildren={spouseInfo.hasSharedChildren}
                                    isCoParentOnly={spouseInfo.isCoParentOnly}
                                />
                                <MemberCard member={spouseInfo.spouse} showParents={showParents} />
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    );

    // Generation View - Clean horizontal layout
    const GenerationView = () => (
        <div className="space-y-8" onClick={handleClickOutside}>
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
                                {families.reduce((sum, f) => sum + 1 + f.spouses.filter(s => s.spouse).length, 0)} thành viên
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
                                    spouses={family.spouses}
                                    showParents={doi > 0}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Tree View - Matching reference image layout
    // - Generation labels on left
    // - Red horizontal lines between generations  
    // - Couples side by side, children directly below
    // Helper to lookup family by member ID
    const familyMap = useMemo(() => {
        const map = new Map();
        generationData.forEach(gen => {
            gen.families.forEach(fam => {
                map.set(fam.primary.MaTV, fam);
            });
        });
        return map;
    }, [generationData]);

    // Recursive Render Function
    const renderRecursiveNode = (family, isRoot = false, isFirst = false, isLast = false, isSingle = false, depth = 0) => {
        if (depth > 50) return null; // Safety break

        const { primary, spouses, children } = family;
        const hasChildren = children && children.length > 0;

        return (
            <div key={primary.MaTV} className="flex flex-col items-center relative">
                {/* Upper Connector Lines (Moved to outer wrapper to span full width of branch) */}
                {!isRoot && (
                    <>
                        {/* Vertical line up */}
                        <div className="absolute -top-8 left-1/2 w-0.5 h-8 bg-blue-400 -translate-x-1/2"></div>

                        {/* Horizontal line half - Left (hide for first child) */}
                        {!isFirst && !isSingle && (
                            <div className="absolute -top-8 right-1/2 w-1/2 h-0.5 bg-blue-400"></div>
                        )}

                        {/* Horizontal line half - Right (hide for last child) */}
                        {!isLast && !isSingle && (
                            <div className="absolute -top-8 left-1/2 w-1/2 h-0.5 bg-blue-400"></div>
                        )}
                    </>
                )}

                <div className="relative flex flex-col items-center px-4">
                    {/* Member Card & Spouse */}
                    <div className="relative flex items-center z-10 bg-white/50 backdrop-blur-sm rounded-xl p-1">
                        {/* Ghost Spouses (Invisible, for centering Primary Member) */}
                        {spouses.length > 0 && (
                            <div className="flex items-center opacity-0 pointer-events-none select-none" aria-hidden="true">
                                {spouses.map((spouseInfo, idx) => (
                                    spouseInfo.spouse && (
                                        <div key={`ghost-${spouseInfo.spouse.MaTV || idx}`} className="flex items-center">
                                            <MemberCard member={spouseInfo.spouse} showParents={false} />
                                            <MarriageConnector
                                                isEnded={spouseInfo.isEnded}
                                                hasSharedChildren={spouseInfo.hasSharedChildren}
                                                isCoParentOnly={spouseInfo.isCoParentOnly}
                                            />
                                        </div>
                                    )
                                )).reverse()} {/* Reverse to symmetry if needed, though mostly checking total width */}
                            </div>
                        )}

                        {/* Primary Member */}
                        <MemberCard member={primary} showParents={false} />

                        {/* Real Spouses */}
                        {spouses.map((spouseInfo, idx) => (
                            spouseInfo.spouse && (
                                <div key={spouseInfo.spouse.MaTV || idx} className="flex items-center">
                                    <MarriageConnector
                                        isEnded={spouseInfo.isEnded}
                                        hasSharedChildren={spouseInfo.hasSharedChildren}
                                        isCoParentOnly={spouseInfo.isCoParentOnly}
                                    />
                                    <MemberCard member={spouseInfo.spouse} showParents={false} />
                                </div>
                            )
                        ))}
                    </div>

                    {/* Downward Connector (if has children) */}
                    {hasChildren && (
                        <div className="w-0.5 h-8 bg-blue-400"></div>
                    )}
                </div>

                {/* Children Container */}
                {hasChildren && (
                    <div className="flex items-start pt-8">
                        {children.map((child, index) => {
                            const childFamily = familyMap.get(child.MaTV) || {
                                primary: child,
                                spouses: [],
                                children: []
                            };

                            return renderRecursiveNode(
                                childFamily,
                                false,
                                index === 0,
                                index === children.length - 1,
                                children.length === 1,
                                depth + 1
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    // Find ALL root families (members without parents) across all generations
    // This ensures members like Trần Trung appear even if they're in generation 1+
    const rootFamilies = useMemo(() => {
        const roots = [];
        generationData.forEach(gen => {
            gen.families.forEach(family => {
                // Check if this family's primary member has no parents
                const parents = getParents(family.primary.MaTV);
                if (!parents.father && !parents.mother) {
                    roots.push(family);
                }
            });
        });
        return roots;
    }, [generationData]);

    return (
        <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center flex-wrap gap-3">
                <h2 className="text-xl font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Cây gia phả
                </h2>

                <div className="flex items-center gap-3">
                    {/* Add Member Button (inline) */}
                    {canManage && MaGiaPha && (
                        <Link
                            to={`/thanhvien/create?MaGiaPha=${MaGiaPha}`}
                            className="btn btn-sm btn-outline flex items-center gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        >
                            <FiUserPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">Thêm</span>
                        </Link>
                    )}

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
            </div>

            {/* Content */}
            <div className="p-6">
                {members.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4">🌳</div>
                        <p className="text-neutral-500 mb-4">Chưa có thành viên nào</p>
                        {canManage && MaGiaPha && (
                            <Link
                                to={`/thanhvien/create?MaGiaPha=${MaGiaPha}`}
                                className="btn btn-primary"
                            >
                                <FiUserPlus className="w-4 h-4" />
                                Thêm thành viên đầu tiên
                            </Link>
                        )}
                    </div>
                ) : viewMode === 'generation' ? (
                    <GenerationView />
                ) : (
                    <div className="overflow-auto py-8 px-4" onClick={handleClickOutside}>
                        <div className="min-w-max flex justify-center gap-16">
                            {rootFamilies.map(family => renderRecursiveNode(family, true, false, false, false, 0))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
