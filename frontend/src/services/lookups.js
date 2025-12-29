/**
 * ============================================
 * LOOKUPS SERVICE
 * Lấy các dữ liệu tĩnh: giới tính, quê quán, nghề nghiệp, gia phả
 * ============================================
 */

import apiClient from '../api/client';

class LookupsService {
  /**
   * Lấy danh sách giới tính
   * GET /gioitinh
   * @returns {Promise<Array>} Danh sách giới tính
   */
  async getGioiTinh() {
    try {
      const response = await apiClient.get('/gioitinh');
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách quê quán
   * GET /quequan
   * @returns {Promise<Array>} Danh sách quê quán
   */
  async getQueQuan() {
    try {
      const response = await apiClient.get('/quequan');
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách nghề nghiệp
   * GET /nghenghiep
   * @returns {Promise<Array>} Danh sách nghề nghiệp
   */
  async getNgheNghiep() {
    try {
      const response = await apiClient.get('/nghenghiep');
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách gia phả
   * GET /caygiapha
   * @returns {Promise<Array>} Danh sách gia phả
   */
  async getCayGiaPha() {
    try {
      const response = await apiClient.get('/caygiapha');
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy chi tiết gia phả
   * GET /caygiapha/:MaGiaPha
   * @param {string} MaGiaPha - Mã gia phả
   * @returns {Promise<Object>} Chi tiết gia phả
   */
  async getGiaPhDetail(MaGiaPha) {
    try {
      const response = await apiClient.get(`/caygiapha/${MaGiaPha}`);
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách loại tài khoản
   * GET /loaitaikhoan
   * @returns {Promise<Array>} Danh sách loại tài khoản
   */
  async getLoaiTaiKhoan() {
    try {
      const response = await apiClient.get('/loaitaikhoan');
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy danh sách loại thành tích
   * GET /loaithanhtich
   * @returns {Promise<Array>} Danh sách loại thành tích
   */
  async getLoaiThanhTich() {
    try {
      const response = await apiClient.get('/loaithanhtich');
      return response.data.result || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lấy tất cả lookup data cùng một lúc
   * @returns {Promise<Object>} { gioiTinh, queQuan, ngheNghiep, cayGiaPha, loaiTaiKhoan, loaithanhtich, nguyenNhanMat, diaDiemMaiTang }
   */
  async getAll() {
    try {
      const [gioiTinh, queQuan, ngheNghiep, cayGiaPha, loaiTaiKhoan, loaithanhtich, nguyenNhanMat, diaDiemMaiTang] =
        await Promise.all([
          this.getGioiTinh(),
          this.getQueQuan(),
          this.getNgheNghiep(),
          this.getCayGiaPha(),
          this.getLoaiTaiKhoan(),
          this.getLoaiThanhTich(),
          this.getNguyenNhanMat(),
          this.getDiaDiemMaiTang(),
        ]);

      return {
        gioiTinh,
        queQuan,
        ngheNghiep,
        cayGiaPha,
        loaiTaiKhoan,
        loaithanhtich,
        nguyenNhanMat,
        diaDiemMaiTang,
      };
    } catch (error) {
      console.error('Error loading all lookups:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách nguyên nhân mất
   * GET /nguyennhanmat
   * @returns {Promise<Array>} Danh sách nguyên nhân mất
   */
  async getNguyenNhanMat() {
    try {
      const response = await apiClient.get('/nguyennhanmat');
      return response.data.result || response.data;
    } catch (error) {
      // Trả về mảng rỗng nếu API chưa có
      console.warn('API nguyennhanmat chưa có, trả về mảng rỗng');
      return [];
    }
  }

  /**
   * Lấy danh sách địa điểm mai táng
   * GET /diadiemmaitang
   * @returns {Promise<Array>} Danh sách địa điểm mai táng
   */
  async getDiaDiemMaiTang() {
    try {
      const response = await apiClient.get('/diadiemmaitang');
      return response.data.result || response.data;
    } catch (error) {
      // Trả về mảng rỗng nếu API chưa có
      console.warn('API diadiemmaitang chưa có, trả về mảng rỗng');
      return [];
    }
  }

  /**
   * Lấy danh sách danh mục thu chi
   * GET /danhmuc
   */
  async getDanhMuc(MaGiaPha = null) {
    try {
      const response = await apiClient.get('/danhmuc', {
        params: { MaGiaPha }
      });
      return response.data.result || response.data;
    } catch (error) {
      console.warn('API danhmuc chưa có, trả về mảng rỗng');
      return [];
    }
  }

  // ============================================================
  // CRUD METHODS FOR CATEGORIES
  // ============================================================

  // ==================== QUÊ QUÁN ====================
  async addQueQuan(TenQueQuan) {
    const response = await apiClient.post('/quequan', { TenQueQuan });
    return response.data;
  }

  async updateQueQuan(id, TenQueQuan) {
    const response = await apiClient.put(`/quequan/${id}`, { TenQueQuan });
    return response.data;
  }

  async deleteQueQuan(id) {
    const response = await apiClient.delete(`/quequan/${id}`);
    return response.data;
  }

  // ==================== NGHỀ NGHIỆP ====================
  async addNgheNghiep(TenNgheNghiep) {
    const response = await apiClient.post('/nghenghiep', { TenNgheNghiep });
    return response.data;
  }

  async updateNgheNghiep(id, TenNgheNghiep) {
    const response = await apiClient.put(`/nghenghiep/${id}`, { TenNgheNghiep });
    return response.data;
  }

  async deleteNgheNghiep(id) {
    const response = await apiClient.delete(`/nghenghiep/${id}`);
    return response.data;
  }

  // ==================== NGUYÊN NHÂN MẤT ====================
  async addNguyenNhanMat(TenNguyenNhanMat) {
    const response = await apiClient.post('/nguyennhanmat', { TenNguyenNhanMat });
    return response.data;
  }

  async updateNguyenNhanMat(id, TenNguyenNhanMat) {
    const response = await apiClient.put(`/nguyennhanmat/${id}`, { TenNguyenNhanMat });
    return response.data;
  }

  async deleteNguyenNhanMat(id) {
    const response = await apiClient.delete(`/nguyennhanmat/${id}`);
    return response.data;
  }

  // ==================== ĐỊA ĐIỂM MAI TÁNG ====================
  async addDiaDiemMaiTang(TenDiaDiem) {
    const response = await apiClient.post('/diadiemmaitang', { TenDiaDiem });
    return response.data;
  }

  async updateDiaDiemMaiTang(id, TenDiaDiem) {
    const response = await apiClient.put(`/diadiemmaitang/${id}`, { TenDiaDiem });
    return response.data;
  }

  async deleteDiaDiemMaiTang(id) {
    const response = await apiClient.delete(`/diadiemmaitang/${id}`);
    return response.data;
  }

  // ==================== LOẠI THÀNH TÍCH ====================
  async addLoaiThanhTich(TenLTT) {
    const response = await apiClient.post('/loaithanhtich', { TenLTT });
    return response.data;
  }

  async updateLoaiThanhTich(id, TenLTT) {
    const response = await apiClient.put(`/loaithanhtich/${id}`, { TenLTT });
    return response.data;
  }

  async deleteLoaiThanhTich(id) {
    const response = await apiClient.delete(`/loaithanhtich/${id}`);
    return response.data;
  }

  // ==================== DANH MỤC THU CHI ====================
  async addDanhMuc(TenDM, NguoiDamNhan = null) {
    const response = await apiClient.post('/danhmuc', { TenDM, NguoiDamNhan });
    return response.data;
  }

  async updateDanhMuc(id, TenDM, NguoiDamNhan = null) {
    const response = await apiClient.put(`/danhmuc/${id}`, { TenDM, NguoiDamNhan });
    return response.data;
  }

  async deleteDanhMuc(id) {
    const response = await apiClient.delete(`/danhmuc/${id}`);
    return response.data;
  }
}

export default new LookupsService();
export { LookupsService };

