/**
 * ============================================
 * THÀNH VIÊN CREATE PAGE (Refactored)
 * Trang thêm mới thành viên với quan hệ
 * Sử dụng ghiNhanThanhVien API
 * ============================================
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useLookupsStore } from '../store/lookupsStore.js';
import thanhvienService from '../services/thanhvien.js';
import giaPhaService from '../services/giapha.js';
import { FiArrowLeft, FiUser, FiUsers, FiHeart, FiCalendar, FiMapPin, FiBriefcase, FiCheck, FiAlertCircle, FiPlus } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import CategoryManagementModal from '../components/common/CategoryManagementModal';
import DateInput from '../components/common/DateInput';

export default function ThanhVienCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAllLookups, cayGiaPha, queQuan, ngheNghiep, gioiTinh } = useLookupsStore();

  // Lấy MaGiaPha từ URL query params (nếu có)
  const preselectedMaGiaPha = searchParams.get('MaGiaPha');

  // State
  const [step, setStep] = useState(1); // 1: Chọn quan hệ, 2: Nhập thông tin
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [thanhVienList, setThanhVienList] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryType, setCategoryType] = useState('');

  // Auth - check if user is Admin or Owner
  const { user } = useAuth();
  const canManageCategories = user?.MaLoaiTK === 'LTK01' || user?.MaLoaiTK === 'LTK02';

  // Open category modal
  const openCategoryModal = (type) => {
    setCategoryType(type);
    setCategoryModalOpen(true);
  };

  // Reload lookups after category update
  const handleCategoryUpdate = async () => {
    try {
      const lookupsData = await thanhvienService.getLookups();
      setAllLookups(lookupsData);
    } catch (err) {
      console.error('Error reloading lookups:', err);
    }
  };

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Quan hệ
    MaGiaPha: preselectedMaGiaPha || '',
    MaTVCu: '',
    LoaiQuanHe: '', // 'Con cái' hoặc 'Vợ/Chồng'
    NgayPhatSinh: new Date().toISOString().split('T')[0],

    // Step 2: Thông tin thành viên mới
    HoTen: '',
    NgayGioSinh: '',
    GioiTinh: '',
    DiaChi: '',
    MaQueQuan: '',
    MaNgheNghiep: ''
  });

  // Selected member info for display
  const [selectedMember, setSelectedMember] = useState(null);

  // Load lookups on mount
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const lookupsData = await thanhvienService.getLookups();
        setAllLookups(lookupsData);
      } catch (err) {
        console.error('Error loading lookups:', err);
      }
    };
    loadLookups();
  }, [setAllLookups]);

  // Load members when MaGiaPha changes
  useEffect(() => {
    const loadMembers = async () => {
      if (!formData.MaGiaPha) {
        setThanhVienList([]);
        return;
      }
      setLoadingMembers(true);
      try {
        const data = await giaPhaService.getThanhVienByGiaPha(formData.MaGiaPha);
        setThanhVienList(data || []);
      } catch (err) {
        console.error('Error loading members:', err);
        setThanhVienList([]);
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, [formData.MaGiaPha]);

  // Handle member selection
  const handleMemberSelect = (MaTV) => {
    const member = thanhVienList.find(m => m.MaTV === MaTV);
    setSelectedMember(member || null);
    setFormData(prev => ({ ...prev, MaTVCu: MaTV }));
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Reset dependent fields
    if (name === 'MaGiaPha') {
      setFormData(prev => ({ ...prev, MaTVCu: '', LoaiQuanHe: '' }));
      setSelectedMember(null);
    }
    if (name === 'MaTVCu') {
      handleMemberSelect(value);
    }
  };

  // Validate step 1
  const validateStep1 = () => {
    if (!formData.MaGiaPha) {
      setError('Vui lòng chọn gia phả');
      return false;
    }
    if (!formData.MaTVCu) {
      setError('Vui lòng chọn thành viên cũ để liên kết');
      return false;
    }
    if (!formData.LoaiQuanHe) {
      setError('Vui lòng chọn loại quan hệ');
      return false;
    }
    return true;
  };

  // Handle next step
  const handleNextStep = () => {
    setError(null);
    if (validateStep1()) {
      setStep(2);
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!formData.HoTen.trim()) {
      setError('Vui lòng nhập họ tên');
      return;
    }
    if (!formData.NgayGioSinh) {
      setError('Vui lòng nhập ngày sinh');
      return;
    }
    if (!formData.GioiTinh) {
      setError('Vui lòng chọn giới tính');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        MaTVCu: formData.MaTVCu,
        LoaiQuanHe: formData.LoaiQuanHe,
        NgayPhatSinh: formData.NgayPhatSinh,
        HoTen: formData.HoTen.trim(),
        NgayGioSinh: formData.NgayGioSinh,
        GioiTinh: formData.GioiTinh,
        DiaChi: formData.DiaChi || null,
        MaQueQuan: formData.MaQueQuan || null,
        MaNgheNghiep: formData.MaNgheNghiep || null
      };

      const response = await thanhvienService.ghiNhan(payload);

      alert('Thêm thành viên thành công!');

      // Navigate back to gia pha detail WITH reload trigger
      navigate(`/giapha/${formData.MaGiaPha}`, {
        state: { reload: true, timestamp: Date.now() }
      });
    } catch (err) {
      console.error('Error creating member:', err);
      console.error('Error response data:', err.response?.data);

      // Extract detailed error message from various possible locations
      let errorMessage = 'Lỗi thêm thành viên';
      if (err.response?.data) {
        const data = err.response.data;
        // Try different possible error message locations - prioritize error over message
        errorMessage = data.error || data.details || data.msg || data.message ||
          (typeof data === 'string' ? data : JSON.stringify(data));
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get gia pha info
  const selectedGiaPha = cayGiaPha.find(gp => gp.MaGiaPha === formData.MaGiaPha);
  const backUrl = formData.MaGiaPha ? `/giapha/${formData.MaGiaPha}` : '/giapha';

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-emerald-50/30">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              to={backUrl}
              className="inline-flex items-center gap-2 text-neutral-600 hover:text-emerald-600 transition-colors mb-4"
            >
              <FiArrowLeft className="w-4 h-4" />
              Quay lại
            </Link>

            <h1 className="text-2xl font-bold text-neutral-800" style={{ fontFamily: 'Playfair Display, serif' }}>
              Thêm thành viên mới
            </h1>
            <p className="text-neutral-500 mt-1">
              Ghi nhận thành viên mới và thiết lập quan hệ trong gia phả
            </p>

            {/* Step indicator */}
            <div className="flex items-center gap-3 mt-6">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                }`}>
                <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-xs">1</span>
                Chọn quan hệ
              </div>
              <div className="w-8 h-0.5 bg-neutral-200"></div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                }`}>
                <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-xs">2</span>
                Thông tin
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Chọn quan hệ */}
          {step === 1 && (
            <div className="glass-card p-6 animate-fade-in">
              <h2 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-emerald-600" />
                Thiết lập quan hệ
              </h2>

              {/* Chọn gia phả */}
              <div className="mb-6">
                <label className="form-label">Gia phả *</label>
                <select
                  name="MaGiaPha"
                  value={formData.MaGiaPha}
                  onChange={handleChange}
                  className="input-field"
                  disabled={!!preselectedMaGiaPha}
                >
                  <option value="">-- Chọn gia phả --</option>
                  {cayGiaPha.map(gp => (
                    <option key={gp.MaGiaPha} value={gp.MaGiaPha}>
                      {gp.TenGiaPha} ({gp.MaGiaPha})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn thành viên cũ */}
              {formData.MaGiaPha && (
                <div className="mb-6 animate-fade-in">
                  <label className="form-label">Liên kết với thành viên *</label>
                  {loadingMembers ? (
                    <div className="text-neutral-500 text-sm">Đang tải...</div>
                  ) : thanhVienList.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-amber-700 text-sm">
                        Gia phả chưa có thành viên nào. Hãy liên hệ Admin để thêm thành viên gốc.
                      </p>
                    </div>
                  ) : (
                    <>
                      <select
                        name="MaTVCu"
                        value={formData.MaTVCu}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="">-- Chọn thành viên để liên kết --</option>
                        {thanhVienList.map(tv => (
                          <option key={tv.MaTV} value={tv.MaTV}>
                            {tv.HoTen} (Đời {tv.DOI ?? 0}, {tv.GioiTinh})
                          </option>
                        ))}
                      </select>

                      {/* Selected member info */}
                      {selectedMember && (
                        <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                              {selectedMember.GioiTinh === 'Nữ' ? '👩' : '👨'}
                            </div>
                            <div>
                              <p className="font-semibold text-neutral-800">{selectedMember.HoTen}</p>
                              <p className="text-sm text-neutral-500">
                                Đời {selectedMember.DOI ?? 0} • {selectedMember.GioiTinh} • {selectedMember.MaTV}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Chọn loại quan hệ */}
              {formData.MaTVCu && (
                <div className="mb-6 animate-fade-in">
                  <label className="form-label">Loại quan hệ *</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, LoaiQuanHe: 'Con cái' }))}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${formData.LoaiQuanHe === 'Con cái'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-neutral-200 hover:border-emerald-300'
                        }`}
                    >
                      <div className="text-2xl mb-2">👶</div>
                      <div className="font-semibold text-neutral-800">Con cái</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Thêm CON của {selectedMember?.HoTen}
                      </div>
                      {formData.LoaiQuanHe === 'Con cái' && (
                        <div className="mt-2 text-xs text-emerald-600">
                          → Đời sẽ = {(selectedMember?.DOI ?? 0) + 1}
                        </div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, LoaiQuanHe: 'Vợ/Chồng' }))}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${formData.LoaiQuanHe === 'Vợ/Chồng'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-neutral-200 hover:border-pink-300'
                        }`}
                    >
                      <div className="text-2xl mb-2">💑</div>
                      <div className="font-semibold text-neutral-800">Vợ/Chồng</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Thêm VỢ/CHỒNG của {selectedMember?.HoTen}
                      </div>
                      {formData.LoaiQuanHe === 'Vợ/Chồng' && (
                        <div className="mt-2 text-xs text-pink-600">
                          → Kết hôn với {selectedMember?.HoTen}
                        </div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, LoaiQuanHe: 'Cha', GioiTinh: 'Nam' }))}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${formData.LoaiQuanHe === 'Cha'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-neutral-200 hover:border-blue-300'
                        }`}
                    >
                      <div className="text-2xl mb-2">👨</div>
                      <div className="font-semibold text-neutral-800">Cha</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Thêm CHA của {selectedMember?.HoTen}
                      </div>
                      {formData.LoaiQuanHe === 'Cha' && (
                        <div className="mt-2 text-xs text-blue-600">
                          → Đời sẽ = {(selectedMember?.DOI ?? 0) - 1}
                          {(selectedMember?.DOI ?? 0) === 0 && " (shift +1)"}
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Ngày phát sinh quan hệ */}
              {formData.LoaiQuanHe && (
                <div className="mb-6 animate-fade-in">
                  <label className="form-label">
                    {formData.LoaiQuanHe === 'Vợ/Chồng' ? 'Ngày kết hôn' : 'Ngày ghi nhận quan hệ'}
                  </label>
                  <DateInput
                    name="NgayPhatSinh"
                    value={formData.NgayPhatSinh}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              )}

              {/* Next button */}
              <div className="flex justify-end pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!formData.MaGiaPha || !formData.MaTVCu || !formData.LoaiQuanHe}
                  className="btn btn-primary"
                >
                  Tiếp tục
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Thông tin thành viên */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="glass-card p-6 animate-fade-in">
              {/* Summary */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  {formData.LoaiQuanHe === 'Con cái' ? (
                    <>
                      <span className="text-2xl">👶</span>
                      <div>
                        <p className="font-medium text-emerald-800">
                          Thêm CON của {selectedMember?.HoTen}
                        </p>
                        <p className="text-sm text-emerald-600">
                          Thành viên mới sẽ thuộc Đời {(selectedMember?.DOI ?? 0) + 1}
                        </p>
                      </div>
                    </>
                  ) : formData.LoaiQuanHe === 'Cha' || formData.LoaiQuanHe === 'Mẹ' ? (
                    <>
                      <span className="text-2xl">{formData.LoaiQuanHe === 'Cha' ? '👨' : '👩'}</span>
                      <div>
                        <p className="font-medium text-blue-800">
                          Thêm {formData.LoaiQuanHe.toUpperCase()} của {selectedMember?.HoTen}
                        </p>
                        <p className="text-sm text-blue-600">
                          Thành viên mới sẽ thuộc Đời {Math.max(0, (selectedMember?.DOI ?? 1) - 1)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">💑</span>
                      <div>
                        <p className="font-medium text-pink-800">
                          Thêm VỢ/CHỒNG của {selectedMember?.HoTen}
                        </p>
                        <p className="text-sm text-pink-600">
                          Kết hôn từ {formData.NgayPhatSinh}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <h2 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
                <FiUser className="w-5 h-5 text-emerald-600" />
                Thông tin thành viên mới
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Họ tên */}
                <div className="md:col-span-2">
                  <label className="form-label">Họ tên *</label>
                  <input
                    type="text"
                    name="HoTen"
                    value={formData.HoTen}
                    onChange={handleChange}
                    placeholder="Nhập họ tên đầy đủ"
                    className="input-field"
                    disabled={isLoading}
                  />
                </div>

                {/* Ngày sinh */}
                <div>
                  <label className="form-label flex items-center gap-1">
                    <FiCalendar className="w-4 h-4" />
                    Ngày sinh *
                  </label>
                  <DateInput
                    name="NgayGioSinh"
                    value={formData.NgayGioSinh}
                    onChange={handleChange}
                    className="input-field"
                    disabled={isLoading}
                  />
                </div>

                {/* Giới tính */}
                <div>
                  <label className="form-label">Giới tính *</label>
                  <select
                    name="GioiTinh"
                    value={formData.GioiTinh}
                    onChange={handleChange}
                    className="input-field"
                    disabled={isLoading}
                  >
                    <option value="">-- Chọn giới tính --</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                {/* Địa chỉ */}
                <div className="md:col-span-2">
                  <label className="form-label flex items-center gap-1">
                    <FiMapPin className="w-4 h-4" />
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    name="DiaChi"
                    value={formData.DiaChi}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ"
                    className="input-field"
                    disabled={isLoading}
                  />
                </div>

                {/* Quê quán */}
                <div>
                  <label className="form-label flex items-center justify-between">
                    Quê quán
                    {canManageCategories && (
                      <button
                        type="button"
                        onClick={() => openCategoryModal('quequan')}
                        className="text-amber-600 hover:text-amber-700 flex items-center gap-1 text-xs font-medium"
                      >
                        <FiPlus className="w-3 h-3" /> Thêm mới
                      </button>
                    )}
                  </label>
                  <select
                    name="MaQueQuan"
                    value={formData.MaQueQuan}
                    onChange={handleChange}
                    className="input-field"
                    disabled={isLoading}
                  >
                    <option value="">-- Chọn quê quán --</option>
                    {queQuan.map(qq => (
                      <option key={qq.MaQueQuan} value={qq.MaQueQuan}>
                        {qq.TenQueQuan}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nghề nghiệp */}
                <div>
                  <label className="form-label flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <FiBriefcase className="w-4 h-4" />
                      Nghề nghiệp
                    </span>
                    {canManageCategories && (
                      <button
                        type="button"
                        onClick={() => openCategoryModal('nghenghiep')}
                        className="text-amber-600 hover:text-amber-700 flex items-center gap-1 text-xs font-medium"
                      >
                        <FiPlus className="w-3 h-3" /> Thêm mới
                      </button>
                    )}
                  </label>
                  <select
                    name="MaNgheNghiep"
                    value={formData.MaNgheNghiep}
                    onChange={handleChange}
                    className="input-field"
                    disabled={isLoading}
                  >
                    <option value="">-- Chọn nghề nghiệp --</option>
                    {ngheNghiep.map(nn => (
                      <option key={nn.MaNgheNghiep} value={nn.MaNgheNghiep}>
                        {nn.TenNgheNghiep}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-6 mt-6 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-ghost"
                  disabled={isLoading}
                >
                  ← Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      Thêm thành viên
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Category Management Modal */}
      <CategoryManagementModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categoryType={categoryType}
        onUpdate={handleCategoryUpdate}
      />
    </>
  );
}
