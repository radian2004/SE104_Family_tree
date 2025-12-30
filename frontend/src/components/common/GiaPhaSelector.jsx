/**
 * ============================================
 * GIA PHẢ SELECTOR COMPONENT
 * Searchable dropdown for selecting Gia Phả
 * Only visible for Admin users
 * ============================================
 */

import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiGitBranch, FiX, FiChevronDown } from 'react-icons/fi';
import giaPhaService from '../../services/giapha';
import { usePermissions } from '../../hooks/usePermissions';

export default function GiaPhaSelector({ value, onChange, showAll = true, inititalSelectFirst = false }) {
    const { isAdmin } = usePermissions();
    const [giaPhaList, setGiaPhaList] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Load gia phả list
    useEffect(() => {
        const loadGiaPha = async () => {
            setIsLoading(true);
            try {
                const data = await giaPhaService.getAll();
                setGiaPhaList(data || []);

                // Auto select first if requested and no value exists
                if (inititalSelectFirst && data && data.length > 0 && !value) {
                    onChange(data[0].MaGiaPha);
                }
            } catch (err) {
                console.error('Error loading gia pha list:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadGiaPha();
    }, []);

    // Update search text when value changes externally
    useEffect(() => {
        if (value) {
            const selected = giaPhaList.find(gp => gp.MaGiaPha === value);
            setSearchText(selected ? selected.TenGiaPha : '');
        } else {
            setSearchText('');
        }
    }, [value, giaPhaList]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                inputRef.current && !inputRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter gia phả based on search
    const filteredList = giaPhaList.filter(gp => {
        const search = searchText.toLowerCase();
        return (
            gp.TenGiaPha?.toLowerCase().includes(search) ||
            gp.MaGiaPha?.toLowerCase().includes(search)
        );
    });

    const handleSelect = (giaPha) => {
        onChange(giaPha.MaGiaPha);
        setSearchText(giaPha.TenGiaPha);
        setShowDropdown(false);
    };

    const handleClear = () => {
        onChange('');
        setSearchText('');
    };

    // Only show for Admin
    if (!isAdmin) {
        return null;
    }

    return (
        <div className="relative">
            <label className="form-label flex items-center gap-2">
                <FiGitBranch className="w-4 h-4 text-emerald-500" />
                Cây gia phả
            </label>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                    <FiSearch className="w-5 h-5" />
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={searchText}
                    onChange={(e) => {
                        setSearchText(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Tìm và chọn gia phả..."
                    className={`w-full pl-12 pr-16 py-2.5 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${value ? 'border-emerald-400 bg-emerald-50' : ''}`}
                />

                <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                    {value && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="p-1 text-neutral-400 hover:text-neutral-600"
                    >
                        <FiChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Dropdown - high z-index to overlay other elements */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute z-[9999] w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                    style={{ top: '100%', left: 0 }}
                >
                    {isLoading ? (
                        <div className="px-4 py-3 text-neutral-500 text-sm text-center">
                            Đang tải...
                        </div>
                    ) : (
                        <>
                            {/* All option */}
                            {showAll && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange('');
                                        setSearchText('');
                                        setShowDropdown(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-center gap-2 border-b ${!value ? 'bg-emerald-50' : ''}`}
                                >
                                    <FiGitBranch className="w-4 h-4 text-neutral-400" />
                                    <span className="font-medium text-neutral-700">Tất cả gia phả</span>
                                </button>
                            )}

                            {filteredList.length === 0 ? (
                                <div className="px-4 py-3 text-neutral-500 text-sm">
                                    Không tìm thấy gia phả
                                </div>
                            ) : (
                                filteredList.map(gp => (
                                    <button
                                        key={gp.MaGiaPha}
                                        type="button"
                                        onClick={() => handleSelect(gp)}
                                        className={`w-full px-4 py-2 text-left hover:bg-emerald-50 flex items-center gap-2 ${value === gp.MaGiaPha ? 'bg-emerald-100' : ''}`}
                                    >
                                        <FiGitBranch className="w-4 h-4 text-emerald-500" />
                                        <div>
                                            <div className="font-medium text-neutral-700">{gp.TenGiaPha}</div>
                                            <div className="text-xs text-neutral-400">{gp.MaGiaPha}</div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
