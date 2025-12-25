-- Database 'app' đã được tạo tự động bởi Docker
-- DROP DATABASE app;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_results = utf8mb4;
DROP DATABASE IF EXISTS app;
CREATE DATABASE app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE app;

-- Quê quán:QQ01
-- Nghề nghiệp: NN01
-- Thành viên: TV01
-- Gia phả: GP01
-- Loại thành tích: LTT01
-- Thành tích: TT01
-- Nguyên nhân mất: NNM01
-- Địa điểm mai táng: DD01
-- Hôn nhân: HN01
-- Con cái: CC01
-- Loại danh mục: LDM01
-- Danh mục: DM01
-- Thu quỹ: TQ01
-- Chi quỹ: CQ01
-- Chi tiết thu: CTT01
-- Chi tiết chi: CTC01
-- Quyền: Q01
-- Phân quyền TK: QTK01
-- Loại TK: LTK01
-- TK: TK01
-- ----------TABLE----------

CREATE TABLE QUEQUAN (
	MaQueQuan VARCHAR(5) PRIMARY KEY,
	TenQueQuan VARCHAR(50) UNIQUE
);

CREATE TABLE NGHENGHIEP(
	MaNgheNghiep VARCHAR(5) PRIMARY KEY,
	TenNgheNghiep VARCHAR(50) UNIQUE
);

CREATE TABLE NGUYENNHANMAT(
	MaNguyenNhanMat VARCHAR(5) PRIMARY KEY,
	TenNguyenNhanMat VARCHAR(50) UNIQUE
);

CREATE TABLE DIADIEMMAITANG(
	MaDiaDiem VARCHAR(5) PRIMARY KEY,
	TenDiaDiem VARCHAR(50) UNIQUE
);

CREATE TABLE THANHVIEN (
    MaTV VARCHAR(5) PRIMARY KEY,
    HoTen VARCHAR(50),
    NgayGioSinh DATETIME,
    DiaChi VARCHAR(50),
    TrangThai VARCHAR(20) DEFAULT 'Còn Sống',
    TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    DOI	INT DEFAULT 0,
    MaQueQuan VARCHAR(5),
    MaNgheNghiep VARCHAR(5),
    GioiTinh VARCHAR(3), -- Nam/Nữ
    MaNguyenNhanMat VARCHAR(5),
    NgayGioMat DATETIME,
    MaDiaDiem VARCHAR(5),
    MaGiaPha VARCHAR(5),
    FOREIGN KEY(MaQueQuan) REFERENCES QUEQUAN(MaQueQuan),
	FOREIGN KEY(MaNgheNghiep) REFERENCES NGHENGHIEP(MaNgheNghiep),
	FOREIGN KEY(MaNguyenNhanMat) REFERENCES NGUYENNHANMAT(MaNguyenNhanMat),
	FOREIGN KEY(MaDiaDiem) REFERENCES DIADIEMMAITANG(MaDiaDiem)
);

CREATE TABLE CAYGIAPHA(
	MaGiaPha VARCHAR(5) PRIMARY KEY,
	TenGiaPha VARCHAR(35),
	NguoiLap VARCHAR(20),
    TGLap TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
	TruongToc VARCHAR(20),
	FOREIGN KEY(NguoiLap) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(TruongToc) REFERENCES THANHVIEN(MaTV)
);

ALTER TABLE THANHVIEN 
ADD CONSTRAINT FK_THANHVIEN_GIAPHA FOREIGN KEY (MaGiaPha) REFERENCES CAYGIAPHA(MaGiaPha);

CREATE TABLE LOAITHANHTICH(
	MaLTT VARCHAR(5) PRIMARY KEY,
	TenLTT VARCHAR(35) UNIQUE
);
CREATE TABLE GHINHANTHANHTICH(
	MaLTT VARCHAR(5),
	MaTV VARCHAR(5),
	NgayPhatSinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY(MaLTT, MaTV, NgayPhatSinh),
	FOREIGN KEY(MaLTT) REFERENCES LOAITHANHTICH(MaLTT),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV)
);

CREATE TABLE HONNHAN(
	MaTV VARCHAR(5),
	MaTVVC VARCHAR(5),
	NgayBatDau DATE, -- Ngày đăng ký kết hôn
	NgayKetThuc DATE,
	PRIMARY KEY(MaTV, MaTVVC),
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(MaTVVC) REFERENCES THANHVIEN(MaTV)
);

CREATE TABLE QUANHECON(
	MaTV VARCHAR(5) PRIMARY KEY,
	MaTVCha VARCHAR(5),
	MaTVMe VARCHAR(5),
	NgayPhatSinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP(), -- Ngày làm giấy khai sinh
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(MaTVCha) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(MaTVMe) REFERENCES THANHVIEN(MaTV)
);

CREATE TABLE DANHMUC(
	MaDM VARCHAR(5) PRIMARY KEY,
	TenDM VARCHAR(50),
	NguoiDamNhan VARCHAR(5),
	TongThu DECIMAL(15,2),
	TongChi DECIMAL(15,2),
    FOREIGN KEY(NguoiDamNhan) REFERENCES THANHVIEN(MaTV)
);

CREATE TABLE PHIEUTHUQUY(
	MaPhieuThu VARCHAR(5) PRIMARY KEY,
	MaTV VARCHAR(5),
	NgayThu TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
	TongThu DECIMAL(15,2),
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV)
);

CREATE TABLE PHIEUCHIQUY(
	MaPhieuChi VARCHAR(5) PRIMARY KEY,
	MaTV VARCHAR(5),
	NgayChi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    MaDMC VARCHAR(5),
	SoTienChi DECIMAL(15,2),
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
    FOREIGN KEY(MaDMC) REFERENCES DANHMUC(MaDM)
);

CREATE TABLE CT_PHIEUTHU(
	MaPhieuThu VARCHAR(5),
	MaDMT VARCHAR(5),
	SoTienThu DECIMAL(15,2),
	NguoiXacNhan VARCHAR(5),
	PRIMARY KEY(MaPhieuThu, MaDMT),
    FOREIGN KEY(NguoiXacNhan) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(MaPhieuThu) REFERENCES PHIEUTHUQUY(MaPhieuThu),
	FOREIGN KEY(MaDMT) REFERENCES DANHMUC(MaDM)
);

CREATE TABLE BAOCAOTHANHTICH (
    Nam INT,
    MaLTT VARCHAR(5),
    SoLuong INT,
    PRIMARY KEY (Nam, MaLTT),
    FOREIGN KEY (MaLTT) REFERENCES LOAITHANHTICH(MaLTT)
);


CREATE TABLE QUYEN(
	MaQuyen VARCHAR(5) PRIMARY KEY,
	TenQuyen VARCHAR(50)
);

CREATE TABLE LOAITAIKHOAN(
	MaLoaiTK VARCHAR(5) PRIMARY KEY,
	TenLoaiTK VARCHAR(50)
);

CREATE TABLE PHANQUYENLOAITK(
	MaLoaiTK VARCHAR(5),
	MaQuyen VARCHAR(5),
	PRIMARY KEY(MaLoaiTK, MaQuyen),
	FOREIGN KEY(MaLoaiTK) REFERENCES LOAITAIKHOAN(MaLoaiTK),
	FOREIGN KEY(MaQuyen) REFERENCES QUYEN(MaQuyen)
);

CREATE TABLE TAIKHOAN(
	TenDangNhap VARCHAR(50) PRIMARY KEY,
	MaTV VARCHAR(5),
	MatKhau VARCHAR(100),
	MaLoaiTK VARCHAR(5),
	TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV) ON DELETE CASCADE,
	FOREIGN KEY(MaLoaiTK) REFERENCES LOAITAIKHOAN(MaLoaiTK)
);

CREATE TABLE REFRESH_TOKENS (
    token VARCHAR(500) PRIMARY KEY,
    TenDangNhap VARCHAR(50) NOT NULL,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    NgayHetHan TIMESTAMP NOT NULL,
    FOREIGN KEY(TenDangNhap) REFERENCES TAIKHOAN(TenDangNhap) ON DELETE CASCADE,
    INDEX idx_tendangnhap (TenDangNhap),
    INDEX idx_ngayhethan (NgayHetHan)
);
-- ----------TRIGGER--------------
DELIMITER $$

-- 1. Generate ID cho THANHVIEN
CREATE TRIGGER TRG_GEN_ID_THANHVIEN
BEFORE INSERT ON THANHVIEN
FOR EACH ROW
BEGIN
    DECLARE max_id INT;

    SELECT COALESCE(MAX(CAST(SUBSTRING(MaTV, 3) AS UNSIGNED)), 0) + 1
    INTO max_id
    FROM THANHVIEN;

    SET NEW.MaTV = CONCAT('TV', LPAD(max_id, 2, '0'));
END$$

-- 2. Generate ID cho CAYGIAPHA
CREATE TRIGGER TRG_GEN_ID_CAYGIAPHA
BEFORE INSERT ON CAYGIAPHA
FOR EACH ROW
BEGIN
    DECLARE max_id INT;

    -- Lấy số lớn nhất hiện có trong cột MaGiaPha, rồi +1
    SELECT COALESCE(MAX(CAST(SUBSTRING(MaGiaPha, 3) AS UNSIGNED)), 0) + 1
    INTO max_id
    FROM CAYGIAPHA;

    -- Gán MaGiaPha mới với prefix 'GP' và 2 chữ số
    SET NEW.MaGiaPha = CONCAT('GP', LPAD(max_id, 2, '0'));
END$$

-- 3. Generate ID cho PHIEUCHIQUY (Sửa: ID -> MaPhieuChi)
CREATE TRIGGER TRG_GEN_ID_CHIQUY
BEFORE INSERT ON PHIEUCHIQUY
FOR EACH ROW
BEGIN
    DECLARE max_id INT;

    SELECT COALESCE(MAX(CAST(SUBSTRING(MaPhieuChi, 3) AS UNSIGNED)), 0) + 1
    INTO max_id
    FROM PHIEUCHIQUY;

    SET NEW.MaPhieuChi = CONCAT('CQ', LPAD(max_id, 2, '0'));
END$$

-- 4. Generate ID cho PHIEUTHUQUY (Sửa: ID -> MaPhieuThu)
CREATE TRIGGER TRG_GEN_ID_THUQUY
BEFORE INSERT ON PHIEUTHUQUY
FOR EACH ROW
BEGIN
    DECLARE max_id INT;

    SELECT COALESCE(MAX(CAST(SUBSTRING(MaPhieuThu, 3) AS UNSIGNED)), 0) + 1
    INTO max_id
    FROM PHIEUTHUQUY;

    SET NEW.MaPhieuThu = CONCAT('TQ', LPAD(max_id, 2, '0'));
END$$

-- 5. Đời con bằng đời cha/mẹ + 1
CREATE TRIGGER TRG_INSERT_DOI_THANHVIEN_QUANHECON
AFTER INSERT ON QUANHECON
FOR EACH ROW
BEGIN
    DECLARE parent_gen INT;

    -- Lấy đời của cha/mẹ từ bảng THANHVIEN
    SELECT doi INTO parent_gen
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVCha;

    -- Nếu đời cha/mẹ có tồn tại thì cập nhật đời của con
    IF parent_gen IS NOT NULL THEN
        UPDATE THANHVIEN
        SET DOI = parent_gen + 1
        WHERE MaTV = NEW.MaTV;
    END IF;
END$$
	
-- 6. Đời vợ/chồng = đời chồng/vợ
CREATE TRIGGER TRG_INSERT_DOI_THANHVIEN_HONNHAN
AFTER INSERT ON HONNHAN
FOR EACH ROW
BEGIN
    DECLARE partner_gen INT;
    
    -- Đời vợ
    SELECT DOI INTO partner_gen
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVVC;

    -- Nếu một bên có đời, mà bên kia chưa có hoặc khác thì cập nhật giống nhau
    IF partner_gen IS NOT NULL AND partner_gen = 0 THEN
        UPDATE THANHVIEN
        SET DOI = partner_gen
        WHERE MaTV = NEW.MaTVVC;
    END IF;
END$$

-- 7. Ngày kết hôn phải sau ngày sinh
-- XÓA trigger cũ
DROP TRIGGER IF EXISTS TRG_CHECK_NGAY_KET_HON_HONNHAN;

-- TẠO LẠI trigger mới với logic đầy đủ
CREATE TRIGGER TRG_CHECK_NGAY_KET_HON_HONNHAN
BEFORE INSERT ON HONNHAN
FOR EACH ROW
BEGIN
    DECLARE birth_date_1 DATE;
    DECLARE birth_date_2 DATE;
    DECLARE age_1 INT;
    DECLARE age_2 INT;

    -- Lấy ngày sinh của hai thành viên
    SELECT DATE(NgayGioSinh) INTO birth_date_1
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;

    SELECT DATE(NgayGioSinh) INTO birth_date_2
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVVC;

    -- Kiểm tra ngày kết hôn phải sau ngày sinh
    IF NEW.NgayBatDau <= birth_date_1 OR NEW.NgayBatDau <= birth_date_2 THEN
        SIGNAL SQLSTATE '45010'
        SET MESSAGE_TEXT = 'Ngày kết hôn phải sau ngày sinh thành viên!';
    END IF;

    -- ✅ THÊM MỚI: Tính tuổi tại ngày kết hôn
    SET age_1 = TIMESTAMPDIFF(YEAR, birth_date_1, NEW.NgayBatDau);
    SET age_2 = TIMESTAMPDIFF(YEAR, birth_date_2, NEW.NgayBatDau);

    -- ✅ THÊM MỚI: Kiểm tra cả hai phải trên 14 tuổi
    IF age_1 < 14 THEN
        SIGNAL SQLSTATE '45011'
        SET MESSAGE_TEXT = 'Thành viên phải đủ 14 tuổi trở lên mới được kết hôn!';
    END IF;

    IF age_2 < 14 THEN
        SIGNAL SQLSTATE '45012'
        SET MESSAGE_TEXT = 'Thành viên vợ/chồng phải đủ 14 tuổi trở lên mới được kết hôn!';
    END IF;
END$$

-- TV mới có quan hệ hôn nhân hoặc con cái với thành viên cũ sẽ thuộc cùng cây gia phả
-- 8. Bảng con cái - tự động gán gia phả
CREATE TRIGGER TRG_INSERT_MaGP_THANHVIEN_QUANHECON
AFTER INSERT ON QUANHECON
FOR EACH ROW
BEGIN
    DECLARE parent_family_id VARCHAR(5);

    -- Ưu tiên lấy mã gia phả từ cha, nếu cha không có thì lấy từ mẹ
    SELECT MaGiaPha INTO parent_family_id
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVCha;

    IF parent_family_id IS NULL THEN
        SELECT MaGiaPha INTO parent_family_id
        FROM THANHVIEN
        WHERE MaTV = NEW.MaTV;
    END IF;

    -- Nếu cha hoặc mẹ có mã gia phả thì set cho con
    IF parent_family_id IS NOT NULL THEN
        UPDATE THANHVIEN
        SET MaGiaPha = parent_family_id
        WHERE MaTV = NEW.MaTV;
    END IF;
END$$

-- 9. TV trong MaCha có giới tính Nam, trong MaMe có giới tính Nữ
CREATE TRIGGER TRG_CHECK_CHA_ME_QUANHECON
BEFORE INSERT ON QUANHECON
FOR EACH ROW
BEGIN
    DECLARE father_gender VARCHAR(3);
    DECLARE mother_gender VARCHAR(3);

    -- Lấy giới tính của cha
    SELECT GioiTinh INTO father_gender
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVCha;
    
    -- Lấy giới tính của mẹ
    SELECT GioiTinh INTO mother_gender
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVMe;
    
    -- Kiểm tra giới tính cha phải là Nam
    IF father_gender IS NOT NULL AND father_gender != 'Nam' THEN
        SIGNAL SQLSTATE '45003'
        SET MESSAGE_TEXT = N'Giới tính của cha phải là Nam!';
    END IF;

    -- Kiểm tra giới tính mẹ phải là Nữ
    IF mother_gender IS NOT NULL AND mother_gender != 'Nữ' THEN
        SIGNAL SQLSTATE '45004'
        SET MESSAGE_TEXT = N'Giới tính của mẹ phải là Nữ!';
    END IF;
END$$

-- 10. Bảng hôn nhân - tự động gán gia phả
CREATE TRIGGER TRG_INSERT_MaGP_THANHVIEN_HONNHAN
AFTER INSERT ON HONNHAN
FOR EACH ROW
BEGIN
    DECLARE partner_gen VARCHAR(5);

    -- Lấy mã gia phả bạn đời (trong gia phả)
    SELECT MaGiaPha INTO partner_gen
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;

    -- Gán mã gia phả bằng bạn đời
    IF partner_gen IS NOT NULL THEN
        UPDATE THANHVIEN
        SET MaGiaPha = partner_gen
        WHERE MaTV = NEW.MaTVVC;
    END IF;
END$$


-- 11. quan hệ con: ngày sinh con phải hợp lệ với cha/mẹ
CREATE TRIGGER TRG_CHECK_NGAY_SINH_CON_QUANHECON
BEFORE INSERT ON QUANHECON
FOR EACH ROW
BEGIN
    DECLARE father_birth DATE;
    DECLARE mother_birth DATE;
    DECLARE child_birth DATE;

    -- Lấy ngày sinh của cha
    SELECT NgayGioSinh INTO father_birth
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVCha;
    
    -- Lấy ngày sinh của mẹ
    SELECT NgayGioSinh INTO mother_birth
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVMe;

    -- Lấy ngày sinh con
    SELECT NgayGioSinh INTO child_birth
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;
    
    -- Kiểm tra ngày sinh con phải sau ngày sinh cha
    IF father_birth IS NOT NULL AND child_birth <= father_birth THEN
        SIGNAL SQLSTATE '45002'
        SET MESSAGE_TEXT = N'Ngày sinh của con phải sau ngày sinh của cha!';
    END IF;

    -- Kiểm tra ngày sinh con phải sau ngày sinh mẹ
    IF mother_birth IS NOT NULL AND child_birth <= mother_birth THEN
        SIGNAL SQLSTATE '45001'
        SET MESSAGE_TEXT = N'Ngày sinh của con phải sau ngày sinh của mẹ!';
    END IF;
END$$

-- 12. Ngày đạt thành tích phải sau ngày sinh thành viên
CREATE TRIGGER TRG_CHECK_NGAY_THANHTICH
BEFORE INSERT ON GHINHANTHANHTICH
FOR EACH ROW
BEGIN
    DECLARE ngay_sinh DATE;

    -- lấy ngày sinh của thành viên
    SELECT DATE(NgayGioSinh) INTO ngay_sinh
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;

    -- kiểm tra ngày
    IF NEW.NgayPhatSinh <= ngay_sinh THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ngày đạt thành tích phải sau ngày sinh thành viên!';
    END IF;
END$$

-- 13. Khi cập nhật MaNguyenNhanMat --> trạng thái tv chuyển sang 'Mất'
CREATE TRIGGER TRG_UPDATE_TRANGTHAI_THANHVIEN_MaNguyenNhanMat
BEFORE UPDATE ON THANHVIEN
FOR EACH ROW
BEGIN
    IF NEW.MaNguyenNhanMat IS NOT NULL AND OLD.MaNguyenNhanMat IS NULL THEN
        SET NEW.TrangThai = 'Mất';
    END IF;
END$$ 

-- 14. Sau khi insert GHINHANTHANHTICH --> CẬP NHẬT BẢNG BAOCAOTHANHTICH
CREATE TRIGGER TRG_UPDATE_BAOCAOTHANHTICH_AFTER_INSERT
AFTER INSERT ON GHINHANTHANHTICH
FOR EACH ROW
BEGIN
    DECLARE current_year INT;
    DECLARE existing_count INT;

    SET current_year = YEAR(NEW.NgayPhatSinh);

    -- Kiểm tra xem đã có bản ghi cho năm và loại thành tích này chưa
    SELECT SoLuong INTO existing_count
    FROM BAOCAOTHANHTICH
    WHERE Nam = current_year AND MaLTT = NEW.MaLTT;

    IF existing_count IS NOT NULL THEN
        -- Nếu có, tăng số lượng lên 1
        UPDATE BAOCAOTHANHTICH
        SET SoLuong = SoLuong + 1
        WHERE Nam = current_year AND MaLTT = NEW.MaLTT;
    ELSE
        -- Nếu chưa có, tạo mới bản ghi với số lượng là 1
        INSERT INTO BAOCAOTHANHTICH (Nam, MaLTT, SoLuong)
        VALUES (current_year, NEW.MaLTT, 1);
    END IF;
END$$
--15. Tự động set mẹ là vợ hiện tại của cha
CREATE TRIGGER TRG_UPDATE_ME_QUANHECON
BEFORE INSERT ON QUANHECON
FOR EACH ROW
BEGIN
    DECLARE wife_id VARCHAR(5);
    
    -- Lấy vợ hiện tại của cha
    SELECT MaTVVC INTO wife_id
    FROM HONNHAN
    WHERE MaTV = NEW.MaTVCha;

    -- Nếu cha có vợ thì set mẹ = vợ của cha
    IF wife_id IS NOT NULL THEN
        SET NEW.MaTVMe = wife_id;
    ELSE
        -- Nếu cha không có vợ thì để mẹ là NULL
        SET NEW.MaTVMe = NULL;
    END IF;
END$$
--16. Kiểm tra một thành viên chỉ được có 1 vợ/chồng tại một thời điểm và tái hôn hợp lệ
CREATE TRIGGER TRG_CHECK_HONNHAN_HOPLE
BEFORE INSERT ON HONNHAN
FOR EACH ROW
BEGIN
    DECLARE existing_marriage_count INT;
    DECLARE last_end_date DATE;

    -- ✅ Kiểm tra MaTV có đang trong hôn nhân nào không (NgayKetThuc IS NULL)
    SELECT COUNT(*) INTO existing_marriage_count
    FROM HONNHAN
    WHERE (MaTV = NEW.MaTV OR MaTVVC = NEW.MaTV)
      AND NgayKetThuc IS NULL;

    IF existing_marriage_count > 0 THEN
        SIGNAL SQLSTATE '45013'
        SET MESSAGE_TEXT = 'Thành viên đang có hôn nhân hiện tại. Vui lòng kết thúc hôn nhân cũ trước khi kết hôn mới!';
    END IF;

    -- ✅ Kiểm tra MaTVVC có đang trong hôn nhân nào không
    SELECT COUNT(*) INTO existing_marriage_count
    FROM HONNHAN
    WHERE (MaTV = NEW.MaTVVC OR MaTVVC = NEW.MaTVVC)
      AND NgayKetThuc IS NULL;

    IF existing_marriage_count > 0 THEN
        SIGNAL SQLSTATE '45014'
        SET MESSAGE_TEXT = 'Vợ/Chồng đang có hôn nhân hiện tại. Vui lòng kết thúc hôn nhân cũ trước khi kết hôn mới!';
    END IF;

    -- ✅ Kiểm tra tái hôn: Ngày bắt đầu hôn nhân mới phải sau ngày kết thúc hôn nhân cũ
    -- Kiểm tra cho MaTV
    SELECT MAX(NgayKetThuc) INTO last_end_date
    FROM HONNHAN
    WHERE (MaTV = NEW.MaTV OR MaTVVC = NEW.MaTV)
      AND NgayKetThuc IS NOT NULL;

    IF last_end_date IS NOT NULL AND NEW.NgayBatDau <= last_end_date THEN
        SIGNAL SQLSTATE '45015'
        SET MESSAGE_TEXT = 'Ngày bắt đầu hôn nhân mới phải sau ngày kết thúc hôn nhân cũ!';
    END IF;

    -- Kiểm tra cho MaTVVC
    SELECT MAX(NgayKetThuc) INTO last_end_date
    FROM HONNHAN
    WHERE (MaTV = NEW.MaTVVC OR MaTVVC = NEW.MaTVVC)
      AND NgayKetThuc IS NOT NULL;

    IF last_end_date IS NOT NULL AND NEW.NgayBatDau <= last_end_date THEN
        SIGNAL SQLSTATE '45016'
        SET MESSAGE_TEXT = 'Ngày bắt đầu hôn nhân mới của vợ/chồng phải sau ngày kết thúc hôn nhân cũ!';
    END IF;
END$$
--17. Kiểm tra ngày mất của thành viên phải sau ngày bắt đầu hôn nhân
CREATE TRIGGER TRG_CHECK_THANHVIEN_CONGSONG_HONNHAN
BEFORE INSERT ON HONNHAN
FOR EACH ROW
BEGIN
    DECLARE death_date_1 DATETIME;
    DECLARE death_date_2 DATETIME;

    -- Lấy ngày mất của thành viên thứ nhất (MaTV)
    SELECT NgayGioMat INTO death_date_1
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;

    -- Lấy ngày mất của thành viên thứ hai (MaTVVC)
    SELECT NgayGioMat INTO death_date_2
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVVC;

    -- Kiểm tra thành viên thứ nhất phải còn sống tại ngày kết hôn
    IF death_date_1 IS NOT NULL AND DATE(death_date_1) <= NEW.NgayBatDau THEN
        SIGNAL SQLSTATE '45018'
        SET MESSAGE_TEXT = 'Không thể thiết lập quan hệ hôn nhân với người đã mất!';
    END IF;

    -- Kiểm tra thành viên thứ hai phải còn sống tại ngày kết hôn
    IF death_date_2 IS NOT NULL AND DATE(death_date_2) <= NEW.NgayBatDau THEN
        SIGNAL SQLSTATE '45019'
        SET MESSAGE_TEXT = 'Không thể thiết lập quan hệ hôn nhân với người đã mất!';
    END IF;
END$$

DELIMITER ;

-- ----------INSERT VALUE----------
-- 4 quê quán
INSERT INTO QUEQUAN (MaQueQuan, TenQueQuan) VALUES
('QQ00', 'Hà Nội'),
('QQ01', 'Hải Phòng'),
('QQ02', 'Thanh Hóa'),
('QQ03', 'Hồ Chí Minh'),
('QQ04', 'Điện Biên');

-- 15 loại nghề nghiệp
INSERT INTO NGHENGHIEP (MaNgheNghiep, TenNgheNghiep) VALUES
('NN00', 'Thợ Điện'),
('NN01', 'Thầy Giáo'),
('NN02', 'Bác Sĩ'),
('NN03', 'Kỹ Sư'),
('NN04', 'Nông Dân'),
('NN05', 'Công Nhân'),
('NN06', 'Lập Trình Viên'),
('NN07', 'Kế Toán'),
('NN08', 'Luật Sư'),
('NN09', 'Doanh Nhân'),
('NN10', 'Y Tá'),
('NN11', 'Nhân Viên Văn Phòng'),
('NN12', 'Thợ Hàn'),
('NN13', 'Thợ Mộc'),
('NN14', 'Phiên Dịch Viên');

-- 6 loại thành tích
INSERT INTO LOAITHANHTICH (MaLTT, TenLTT) VALUES
('LTT01', 'Huân chương Lao động'),
('LTT02', 'Bằng khen Thủ tướng'),
('LTT03', 'Chiến sĩ thi đua'),
('LTT04', 'Giấy khen cấp tỉnh'),
('LTT05', 'Học bổng giỏi'),
('LTT06', 'Giải thưởng khoa học kỹ thuật');

-- Nguyên nhân mất
INSERT INTO NGUYENNHANMAT (MaNguyenNhanMat, TenNguyenNhanMat) VALUES
('NNM01', 'Tuổi già'),
('NNM02', 'Bệnh hiểm nghèo'),
('NNM03', 'Tai nạn giao thông'),
('NNM04', 'Tai nạn lao động'),
('NNM05', 'Khác');

-- Địa điểm mai táng
INSERT INTO DIADIEMMAITANG (MaDiaDiem, TenDiaDiem) VALUES
('DD01', 'Nghĩa trang Văn Điển - Hà Nội'),
('DD02', 'Nghĩa trang quê nhà Nghệ An'),
('DD03', 'Nghĩa trang Sala - TP.HCM'),
('DD04', 'Nghĩa trang Đà Nẵng'),
('DD05', 'Hỏa táng Phúc An Viên');

-- Thêm để test
-- Thành viên
INSERT INTO THANHVIEN (HoTen, NgayGioSinh, DiaChi, MaQueQuan, MaNgheNghiep, GioiTinh) VALUES
('Nguyễn Văn Tổ',      '1920-05-15 08:00:00', 'Nghệ An', 'QQ02', 'NN04', 'Nam'), -- TV01 - Thủy tổ (Đời 1)
('Nguyễn Văn Long',    '1945-03-20 10:30:00', 'Hà Nội', 'QQ01', 'NN06', 'Nam'), -- TV02 - Con của Tổ (Đời 2)
('Lê Thị Lan',         '1948-11-25 14:00:00', 'Đà Nẵng', 'QQ03', 'NN03', 'Nữ'),  -- TV03 - Vợ Long (Đời 2)
('Nguyễn Văn Hùng',    '1972-08-10 09:15:00', 'Hà Nội', 'QQ01', 'NN01', 'Nam'), -- TV04 - Con của Long & Lan (Đời 3)
('Phạm Thị Hồng',      '1975-09-12 11:20:00', 'Hà Nội', 'QQ01', 'NN02', 'Nữ'),  -- TV05 - Vợ Hùng (Đời 3)
('Nguyễn Văn Nam',     '1998-04-05 07:45:00', 'TP.HCM', 'QQ04', 'NN01', 'Nam'), -- TV06 - Con của Hùng & Hồng (Đời 4)
('Nguyễn Thị Ngọc Anh','2002-01-18 16:30:00', 'Hà Nội', 'QQ01', 'NN02', 'Nữ'),  -- TV07 - Con của Hùng & Hồng (Đời 4)
('Nguyễn Văn Minh',    '2024-06-10 12:00:00', 'Hà Nội', 'QQ01', 'NN05', 'Nam'); -- TV08 - Con của Nam (Đời 5)

INSERT INTO CAYGIAPHA (TenGiaPha, NguoiLap, TruongToc) VALUES
('Nguyễn Văn - Hà Nội', 'TV02', 'TV02'),   -- Ông Long vừa lập vừa làm trưởng tộc
('Nguyễn Văn - Nghệ An', 'TV01', 'TV03');   -- Thủy tổ lập, truyền lại cho cháu đích tôn Hùng

UPDATE THANHVIEN SET MaGiaPha = 'GP02' WHERE MaTV IN ('TV02','TV03','TV04','TV05','TV06','TV07','TV08');
UPDATE THANHVIEN SET MaGiaPha = 'GP01' WHERE MaTV = 'TV01';

INSERT INTO HONNHAN (MaTV, MaTVVC, NgayBatDau, NgayKetThuc) VALUES
('TV02', 'TV03', '1970-06-15', NULL), -- Long - Lan
('TV04', 'TV05', '1997-05-20', NULL); -- Hùng - Hồng

DELETE FROM QUANHECON; -- Xóa hết dữ liệu cũ nếu có
INSERT INTO QUANHECON (MaTV, MaTVCha, MaTVMe, NgayPhatSinh) VALUES
('TV04', 'TV01', 'TV03', '1990-03-20 10:30:00'), -- Long là con của Tổ
('TV05', 'TV01', 'TV03', '1972-08-10 09:15:00'), -- Hùng là con của Long & Lan
('TV06', 'TV01', 'TV03', '1998-04-05 07:45:00'), -- Nam là con của Hùng & Hồng
('TV07', 'TV01', 'TV05', '2002-01-18 16:30:00'); -- Ngọc Anh là con của Hùng & Hồng

-- ('TV02', 'TV01', NULL, '1945-03-20 10:30:00'), -- Long là con Tổ (Mẹ không rõ/hoặc mất nên để NULL)
-- ('TV04', 'TV02', 'TV03', '1972-08-10 09:15:00'), -- Hùng là con ông Long & bà Lan
-- ('TV06', 'TV04', 'TV05', '1998-04-05 07:45:00'), -- Nam là con ông Hùng & bà Hồng
-- ('TV07', 'TV04', 'TV05', '2002-01-18 16:30:00'), -- Ngọc Anh là con ông Hùng & bà Hồng
-- ('TV08', 'TV06', NULL, '2024-06-10 12:00:00'); -- Minh là con của Nam (Mẹ chưa nhập nên để NULL)

-- Ghi nhận thành tích
INSERT INTO GHINHANTHANHTICH (MaLTT, MaTV, NgayPhatSinh) VALUES -- GHINHAN THANH TICH trong 10 năm qua
('LTT01', 'TV01', '2025-01-15'), -- Tổ đạt Huân chương Lao động
('LTT02', 'TV04', '2024-02-20'), -- Hùng đạt Bằng khen Thủ tướng
('LTT03', 'TV05', '2023-1-11'), -- Hồng đạt Chiến sĩ thi đua
('LTT04', 'TV06', '2022-12-11'), -- Nam đạt Giấy khen cấp tỉnh
('LTT05', 'TV07', '2023-03-15'), -- Ngọc Anh đạt Học bổng giỏi
('LTT06', 'TV04', '2025-01-01'), -- Hùng đạt Giải thưởng khoa học kỹ thuật
('LTT01', 'TV02', '2018-06-10'), -- Long đạt Huân chương Lao động
('LTT03', 'TV03', '2019-01-01'), -- Lan đạt Chiến sĩ thi đua
('LTT05', 'TV08', '2025-03-15'), -- Minh đạt Học bổng giỏi
('LTT02', 'TV06', '2022-02-20'), -- Nam đạt Bằng khen Thủ tướng
('LTT04', 'TV07', '2010-12-11'), -- Ngọc Anh đạt Giấy khen cấp tỉnh
('LTT06', 'TV05', '2025-01-01'); -- Hồng đạt Giải thưởng khoa học kỹ thuật

-- Cập nhật thông tin mất cho một số thành viên
UPDATE THANHVIEN SET MaNguyenNhanMat = 'NNM01', NgayGioMat = '2020-01-15 10:30:00', MaDiaDiem = 'DD02' WHERE MaTV = 'TV01'; -- TV01 mất

-- Insert loại tài khoản
INSERT INTO LOAITAIKHOAN (MaLoaiTK, TenLoaiTK) VALUES
('LTK01', 'Admin'),
('LTK02', 'TruongToc'),
('LTK03', 'User')
ON DUPLICATE KEY UPDATE TenLoaiTK = VALUES(TenLoaiTK);

SELECT * FROM TAIKHOAN;
SELECT * FROM REFRESH_TOKENS;
SELECT * FROM THANHVIEN; -- Kiểm tra dữ liệu thành viên
SELECT * FROM GHINHANTHANHTICH; -- Kiểm tra dữ liệu thành tích
SELECT * FROM BAOCAOTHANHTICH; -- Kiểm tra dữ liệu báo cáo thành tích
SELECT * FROM CAYGIAPHA; -- Kiểm tra dữ liệu gia phả
SELECT * FROM HONNHAN; -- Kiểm tra dữ liệu quan hệ vợ chồng
SELECT * FROM QUANHECON; -- Kiểm tra dữ liệu quan hệ con cái
SELECT * FROM LOAITAIKHOAN; -- Kiểm tra dữ liệu loại tài khoản
SELECT * FROM NGHENGHIEP; -- Kiểm tra dữ liệu nghề nghiệp
SELECT * FROM QUEQUAN; -- Kiểm tra dữ liệu quê quán

-- Insert tài khoản (Đã có LoạiTK ở trên)
INSERT INTO TAIKHOAN (TenDangNhap, MatKhau, MaLoaiTK) VALUES 
('test@example.com', SHA2(CONCAT('Test@123', 'secret'), 256), 'LTK01');