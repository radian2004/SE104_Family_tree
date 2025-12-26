/**
 * ============================================
 * GIA PHẢ SERVICE
 * Xử lý các API liên quan đến cây gia phả
 * ============================================
 */

import apiClient from '../api/client';

class GiaPhaService {
    /**
     * Lấy danh sách tất cả gia phả
     * GET /caygiapha
     */
    async getAll() {
        try {
            const response = await apiClient.get('/caygiapha');
            return response.data.result || response.data || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy chi tiết gia phả theo mã
     * GET /caygiapha/:MaGiaPha
     */
    async getDetail(MaGiaPha) {
        try {
            const response = await apiClient.get(`/caygiapha/${MaGiaPha}`);
            return response.data.result || response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy danh sách thành viên theo gia phả
     * GET /users/thanhvien với filter MaGiaPha
     */
    async getThanhVienByGiaPha(MaGiaPha) {
        try {
            const response = await apiClient.get('/users/thanhvien', {
                params: { MaGiaPha }
            });
            return response.data.result || response.data || [];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Lấy quan hệ con cái cho gia phả
     * Dùng để xây dựng cây gia phả
     */
    async getQuanHeConByGiaPha(MaGiaPha) {
        try {
            // Lấy tất cả thành viên của gia phả trước
            const members = await this.getThanhVienByGiaPha(MaGiaPha);

            // Lấy quan hệ cho từng thành viên
            const relationships = [];
            for (const member of members) {
                try {
                    const response = await apiClient.get(`/users/quanhecon/chame/${member.MaTV}`);
                    if (response.data.result) {
                        relationships.push({
                            MaTV: member.MaTV,
                            MaTVCha: response.data.result.MaTVCha,
                            MaTVMe: response.data.result.MaTVMe,
                            NgayPhatSinh: response.data.result.NgayPhatSinh
                        });
                    }
                } catch (err) {
                    // Ignore if no relationship found
                }
            }
            return relationships;
        } catch (error) {
            console.error('Error getting relationships:', error);
            return [];
        }
    }

    /**
     * Lấy quan hệ hôn nhân cho gia phả
     */
    async getHonNhanByGiaPha(MaGiaPha) {
        try {
            const members = await this.getThanhVienByGiaPha(MaGiaPha);
            const marriages = [];
            const processedPairs = new Set();

            for (const member of members) {
                try {
                    const response = await apiClient.get(`/users/honnhan/${member.MaTV}`);
                    const spouses = response.data.result || [];

                    spouses.forEach(spouse => {
                        const pairKey = [member.MaTV, spouse.MaTVVC].sort().join('-');
                        if (!processedPairs.has(pairKey)) {
                            processedPairs.add(pairKey);
                            marriages.push({
                                MaTV: member.MaTV,
                                MaTVVC: spouse.MaTVVC,
                                NgayBatDau: spouse.NgayBatDau,
                                NgayKetThuc: spouse.NgayKetThuc
                            });
                        }
                    });
                } catch (err) {
                    // Ignore if no marriage found
                }
            }
            return marriages;
        } catch (error) {
            console.error('Error getting marriages:', error);
            return [];
        }
    }

    /**
     * Lấy tất cả data cần thiết để hiển thị cây gia phả
     */
    async getTreeData(MaGiaPha) {
        try {
            const [members, relationships, marriages] = await Promise.all([
                this.getThanhVienByGiaPha(MaGiaPha),
                this.getQuanHeConByGiaPha(MaGiaPha),
                this.getHonNhanByGiaPha(MaGiaPha)
            ]);

            return {
                members,
                relationships: [...relationships, ...marriages]
            };
        } catch (error) {
            console.error('Error loading tree data:', error);
            return { members: [], relationships: [] };
        }
    }
}

const giaPhaService = new GiaPhaService();
export default giaPhaService;
