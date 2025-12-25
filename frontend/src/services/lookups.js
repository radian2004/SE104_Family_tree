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
}

export default new LookupsService();
export { LookupsService };
