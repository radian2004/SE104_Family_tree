import { useState, useEffect } from 'react';
import { FiX, FiUser, FiMail, FiCalendar, FiMapPin, FiShield } from 'react-icons/fi';
import { usePermissions } from '../hooks/usePermissions';

export default function UserProfileModal({ user, onClose }) {
    const { roleName, roleIcon } = usePermissions();
    const [activeTab, setActiveTab] = useState('info');

    // Click outside to close
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Escape key to close
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!user) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1rem'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: 'white',
                    borderRadius: '1rem',
                    maxWidth: '600px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                }}
            >
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                    padding: '2rem',
                    position: 'relative',
                    borderRadius: '1rem 1rem 0 0'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '2rem',
                            height: '2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white'
                        }}
                    >
                        <FiX size={20} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            fontWeight: 'bold'
                        }}>
                            {user.HoTen?.charAt(0) || user.TenDangNhap?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
                                {user.HoTen || 'Chưa cập nhật tên'}
                            </h2>
                            <p style={{ opacity: 0.9, margin: '0.25rem 0 0 0' }}>
                                <FiMail style={{ display: 'inline', marginRight: '0.5rem' }} />
                                {user.TenDangNhap}
                            </p>
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                <span style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.875rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}>
                                    <span>{roleIcon}</span> {roleName}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    padding: '0 1.5rem'
                }}>
                    <button
                        onClick={() => setActiveTab('info')}
                        style={{
                            padding: '1rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'info' ? '2px solid #f97316' : '2px solid transparent',
                            color: activeTab === 'info' ? '#f97316' : '#6b7280',
                            fontWeight: activeTab === 'info' ? '600' : '400',
                            cursor: 'pointer'
                        }}
                    >
                        Thông tin cá nhân
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {activeTab === 'info' && (
                        <div>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '1rem' }}>
                                Thông tin cơ bản
                            </h3>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {/* Email */}
                                <div style={{
                                    background: '#f9fafb',
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        <FiMail />
                                        <span>Email</span>
                                    </div>
                                    <div style={{ fontWeight: '500', color: '#1f2937' }}>{user.TenDangNhap}</div>
                                </div>

                                {/* Mã thành viên */}
                                <div style={{
                                    background: '#f9fafb',
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        <FiUser />
                                        <span>Mã thành viên</span>
                                    </div>
                                    <div style={{ fontWeight: '500', color: '#1f2937' }}>{user.MaTV || 'Chưa có'}</div>
                                </div>

                                {/* Ngày sinh */}
                                {user.NgayGioSinh && (
                                    <div style={{
                                        background: '#f9fafb',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                            <FiCalendar />
                                            <span>Ngày sinh</span>
                                        </div>
                                        <div style={{ fontWeight: '500', color: '#1f2937' }}>{formatDate(user.NgayGioSinh)}</div>
                                    </div>
                                )}

                                {/* Quê quán */}
                                {user.QueQuan && (
                                    <div style={{
                                        background: '#f9fafb',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                            <FiMapPin />
                                            <span>Quê quán</span>
                                        </div>
                                        <div style={{ fontWeight: '500', color: '#1f2937' }}>{user.QueQuan}</div>
                                    </div>
                                )}

                                {/* Loại tài khoản */}
                                <div style={{
                                    background: '#f9fafb',
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        <FiShield />
                                        <span>Quyền</span>
                                    </div>
                                    <div style={{ fontWeight: '500', color: '#1f2937' }}>{roleName}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    borderTop: '1px solid #e5e7eb',
                    padding: '1rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1.5rem',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '500',
                            color: '#374151'
                        }}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
