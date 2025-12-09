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
-- Giới tính: GT01
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

CREATE TABLE GIOITINH(
	MaGioiTinh VARCHAR(5) PRIMARY KEY,
	TenGioiTinh VARCHAR(10) UNIQUE
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
    MaGioiTinh VARCHAR(5),
    MaNguyenNhanMat VARCHAR(5),
    NgayGioMat DATETIME,
    MaDiaDiemMaiTang VARCHAR(5),
    MaGiaPha VARCHAR(5),
    FOREIGN KEY(MaQueQuan) REFERENCES QUEQUAN(MaQueQuan),
	FOREIGN KEY(MaNgheNghiep) REFERENCES NGHENGHIEP(MaNgheNghiep),
	FOREIGN KEY(MaGioiTinh) REFERENCES GIOITINH(MaGioiTinh),
	FOREIGN KEY(MaNguyenNhanMat) REFERENCES NGUYENNHANMAT(MaNguyenNhanMat),
	FOREIGN KEY(MaDiaDiemMaiTang) REFERENCES DIADIEMMAITANG(MaDiaDiemMaiTang)
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
	MaGNTT VARCHAR(5) PRIMARY KEY,
	MaLTT VARCHAR(5),
	MaTV VARCHAR(5),
	NgayPhatSinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
	FOREIGN KEY(MaLTT) REFERENCES LOAITHANHTICH(MaLTT)
);

CREATE TABLE NGUYENNHANMAT(
	MaNguyenNhanMat VARCHAR(5) PRIMARY KEY,
	TenNguyenNhanMat VARCHAR(50) UNIQUE
);

CREATE TABLE DIADIEMMAITANG(
	MaDiaDiemMaiTang VARCHAR(5) PRIMARY KEY,
	TenDiaDiemMaiTang VARCHAR(50) UNIQUE
);

CREATE TABLE QUANHEVOCHONG(
	MaVo VARCHAR(5),
	MaChong VARCHAR(5),
	NgayBatDau DATE DEFAULT (CURRENT_DATE),
	NgayKetThuc DATE,
	TrangThai VARCHAR(25),
	PRIMARY KEY(MaVo, MaChong),
	FOREIGN KEY(MaVo) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(MaChong) REFERENCES THANHVIEN(MaTV)
);

CREATE TABLE QUANHECHACONCAI(
	MaCon VARCHAR(5) PRIMARY KEY,
	MaCha VARCHAR(5) NULL,
	MaMe VARCHAR(5) NULL,
	NgayPhatSinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
	FOREIGN KEY(MaCon) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(MaCha) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(MaMe) REFERENCES THANHVIEN(MaTV),
	UNIQUE KEY uk_maconchamame (MaCon, MaCha, MaMe)
);

CREATE TABLE LOAIDANHMUC(
	MaLoai VARCHAR(5) PRIMARY KEY,
	TenLoai VARCHAR(50)
);

CREATE TABLE DANHMUC(
	MaDM VARCHAR(5) PRIMARY KEY,
	TenDM VARCHAR(50),
	MaLoai VARCHAR(5),
	NguoiDamNhan VARCHAR(5),
	NamThucHien INT,
	TongThuDM DECIMAL(15,2),
	TongChiDM DECIMAL(15,2),
	FOREIGN KEY(MaLoai) REFERENCES LOAIDANHMUC(MaLoai),
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
	TongChi DECIMAL(15,2),
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV)
);

CREATE TABLE CT_PHIEUTHU(
	MaPhieuThu VARCHAR(5),
	MaDMT VARCHAR(5),
	SoTienThu DECIMAL(15,2),
	NguoiXacNhan VARCHAR(5),
	PRIMARY KEY(MaPhieuThu, MaDMT),
	FOREIGN KEY(MaPhieuThu) REFERENCES PHIEUTHUQUY(MaPhieuThu),
	FOREIGN KEY(MaDMT) REFERENCES DANHMUC(MaDM)
);

CREATE TABLE CT_PHIEUCHI(
	MaPhieuChi VARCHAR(5),
	MaDMC VARCHAR(5),
	SoTienChi DECIMAL(15,2),
	NguoiXacNhan VARCHAR(5),
	PRIMARY KEY(MaPhieuChi, MaDMC),
	FOREIGN KEY(MaPhieuChi) REFERENCES PHIEUCHIQUY(MaPhieuChi),
	FOREIGN KEY(MaDMC) REFERENCES DANHMUC(MaDM)
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
DELIMITER //
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
END;

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
END;

-- 3. Generate ID cho GHINHANTHANHTICH (Sửa: ID -> MaGNTT)
CREATE TRIGGER TRG_GEN_ID_GHINHANTHANHTICH
BEFORE INSERT ON GHINHANTHANHTICH
FOR EACH ROW
BEGIN
    DECLARE max_id INT;

    SELECT COALESCE(MAX(CAST(SUBSTRING(MaGNTT, 3) AS UNSIGNED)), 0) + 1
    INTO max_id
    FROM GHINHANTHANHTICH;

    SET NEW.MaGNTT = CONCAT('TT', LPAD(max_id, 2, '0'));
END;

-- 4. Generate ID cho LOAIDANHMUC
CREATE TRIGGER TRG_GEN_ID_LOAIDANHMUC
BEFORE INSERT ON LOAIDANHMUC
FOR EACH ROW
BEGIN
    DECLARE max_id INT;

    SELECT COALESCE(MAX(CAST(SUBSTRING(MaLoai, 4) AS UNSIGNED)), 0) + 1
    INTO max_id
    FROM LOAIDANHMUC;

    SET NEW.MaLoai = CONCAT('LDM', LPAD(max_id, 2, '0'));
END;

-- 5. Generate ID cho PHIEUCHIQUY (Sửa: ID -> MaPhieuChi)
CREATE TRIGGER TRG_GEN_ID_CHIQUY
BEFORE INSERT ON PHIEUCHIQUY
FOR EACH ROW
BEGIN
    DECLARE max_id INT;

    SELECT COALESCE(MAX(CAST(SUBSTRING(MaPhieuChi, 3) AS UNSIGNED)), 0) + 1
    INTO max_id
    FROM PHIEUCHIQUY;

    SET NEW.MaPhieuChi = CONCAT('CQ', LPAD(max_id, 2, '0'));
END;

-- 6. Generate ID cho PHIEUTHUQUY (Sửa: ID -> MaPhieuThu)
CREATE TRIGGER TRG_GEN_ID_THUQUY
BEFORE INSERT ON PHIEUTHUQUY
FOR EACH ROW
BEGIN
    DECLARE max_id INT;

    SELECT COALESCE(MAX(CAST(SUBSTRING(MaPhieuThu, 3) AS UNSIGNED)), 0) + 1
    INTO max_id
    FROM PHIEUTHUQUY;

    SET NEW.MaPhieuThu = CONCAT('TQ', LPAD(max_id, 2, '0'));
END;

-- 7. Đời con bằng đời cha/mẹ + 1
CREATE TRIGGER TRG_INSERT_DOI_THANHVIEN_QUANHECONCAI
AFTER INSERT ON QUANHECONCAI
FOR EACH ROW
BEGIN
    DECLARE parent_gen INT;

    -- Lấy đời của cha/mẹ từ bảng THANHVIEN
    SELECT doi INTO parent_gen
    FROM THANHVIEN
    WHERE MaTV = NEW.MaCha;

    -- Nếu đời cha/mẹ có tồn tại thì cập nhật đời của con
    IF parent_gen IS NOT NULL THEN
        UPDATE THANHVIEN
        SET DOI = parent_gen + 1
        WHERE MaTV = NEW.MaCon;
    END IF;
END;
	
-- 8. Đời vợ/chồng = đời chồng/vợ
CREATE TRIGGER TRG_INSERT_DOI_THANHVIEN_QUANHEVOCHONG
AFTER INSERT ON QUANHEVOCHONG
FOR EACH ROW
BEGIN
    DECLARE husband_gen INT;
    DECLARE wife_gen INT;

    -- Đời chồng
    SELECT DOI INTO husband_gen
    FROM THANHVIEN
    WHERE MaTV = NEW.MaChong;
    
    -- Đời vợ
    SELECT DOI INTO wife_gen
    FROM THANHVIEN
    WHERE MaTV = NEW.MaVo;

    -- Nếu một bên có đời, mà bên kia chưa có hoặc khác thì cập nhật giống nhau
    IF husband_gen IS NOT NULL AND wife_gen = 0 THEN
        UPDATE THANHVIEN
        SET DOI = husband_gen
        WHERE MaTV = NEW.MaVo;
        
    ELSEIF wife_gen IS NOT NULL AND husband_gen = 0 THEN
        UPDATE THANHVIEN
        SET DOI = wife_gen
        WHERE MaTV = NEW.MaChong;
    END IF;
END;

-- TV mới có quan hệ hôn nhân hoặc con cái với thành viên cũ sẽ thuộc cùng cây gia phả
-- 9. Bảng con cái - tự động gán gia phả
CREATE TRIGGER TRG_INSERT_MaGP_THANHVIEN_QUANHECONCAI
AFTER INSERT ON QUANHECONCAI
FOR EACH ROW
BEGIN
    DECLARE parent_family_id VARCHAR(5);

    -- Ưu tiên lấy mã gia phả từ cha, nếu cha không có thì lấy từ mẹ
    SELECT MaGiaPha INTO parent_family_id
    FROM THANHVIEN
    WHERE MaTV = NEW.MaCha;

    IF parent_family_id IS NULL THEN
        SELECT MaGiaPha INTO parent_family_id
        FROM THANHVIEN
        WHERE MaTV = NEW.MaMe;
    END IF;

    -- Nếu cha hoặc mẹ có mã gia phả thì set cho con
    IF parent_family_id IS NOT NULL THEN
        UPDATE THANHVIEN
        SET MaGiaPha = parent_family_id
        WHERE MaTV = NEW.MaCon;
    END IF;
END;

-- 10. Bảng hôn nhân - tự động gán gia phả
CREATE TRIGGER TRG_INSERT_MaGP_THANHVIEN_QUANHEVOCHONG
AFTER INSERT ON QUANHEVOCHONG
FOR EACH ROW
BEGIN
    DECLARE husband_family_id VARCHAR(5);
    DECLARE wife_family_id VARCHAR(5);

    -- Lấy mã gia phả chồng
    SELECT MaGiaPha INTO husband_family_id
    FROM THANHVIEN
    WHERE MaTV = NEW.MaChong;

    -- Lấy mã gia phả vợ
    SELECT MaGiaPha INTO wife_family_id
    FROM THANHVIEN
    WHERE MaTV = NEW.MaVo;

    -- Nếu chồng đã có mã gia phả, vợ chưa có -> cập nhật cho vợ
    IF husband_family_id IS NOT NULL AND wife_family_id IS NULL THEN
        UPDATE THANHVIEN
        SET MaGiaPha = husband_family_id
        WHERE MaTV = NEW.MaVo;

    -- Nếu vợ có mã gia phả, chồng chưa có -> cập nhật cho chồng
    ELSEIF wife_family_id IS NOT NULL AND husband_family_id IS NULL THEN
        UPDATE THANHVIEN
        SET MaGiaPha = wife_family_id
        WHERE MaTV = NEW.MaChong;
    END IF;
END;


-- 11. Ngày sinh con phải hợp lệ với cha/mẹ
CREATE TRIGGER TRG_CHECK_NGAY_SINH_CON_QUANHECONCAI
BEFORE INSERT ON QUANHECONCAI
FOR EACH ROW
BEGIN
    DECLARE father_birth DATE;
    DECLARE mother_birth DATE;
    DECLARE child_birth DATE;

    -- Lấy ngày sinh của cha
    SELECT NgayGioSinh INTO father_birth
    FROM THANHVIEN
    WHERE MaTV = NEW.MaCha;
    
    -- Lấy ngày sinh của mẹ
    SELECT NgayGioSinh INTO mother_birth
    FROM THANHVIEN
    WHERE MaTV = NEW.MaMe;
    
    -- Lấy ngày sinh của con
    SET child_birth = DATE(NEW.NgayPhatSinh);
    
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
END;

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
END;

-- 13. Khi cập nhật MaNguyenNhanMat --> trạng thái tv chuyển sang 'Mất'
CREATE TRIGGER TRG_UPDATE_TRANGTHAI_THANHVIEN_MaNguyenNhanMat
BEFORE UPDATE ON THANHVIEN
FOR EACH ROW
BEGIN
    IF NEW.MaNguyenNhanMat IS NOT NULL AND OLD.MaNguyenNhanMat IS NULL THEN
        SET NEW.TrangThai = 'Mất';
    END IF;
END; 

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

-- 2 giới tính
INSERT INTO GIOITINH (MaGioiTinh, TenGioiTinh) VALUES
('GT00', 'Nam'),
('GT01', 'Nữ');

-- 6 loại thành tích
INSERT INTO LOAITHANHTICH (MaLTT, TenLTT) VALUES
('LTT01', 'Huân chương Lao động'),
('LTT02', 'Bằng khen Thủ tướng'),
('LTT03', 'Chiến sĩ thi đua'),
('LTT04', 'Giấy khen cấp tỉnh'),
('LTT05', 'Học bổng giỏi'),
('LTT06', 'Giải thưởng khoa học kỹ thuật');

-- Nguyên nhân mất
INSERT INTO NGUYENNHANMAT (MaNN, TenNN) VALUES
('NNM01', 'Tuổi già'),
('NNM02', 'Bệnh hiểm nghèo'),
('NNM03', 'Tai nạn giao thông'),
('NNM04', 'Tai nạn lao động'),
('NNM05', 'Khác');

-- Địa điểm mai táng
INSERT INTO DIADIEMMAITANG (MaDD, TenDD) VALUES
('DD01', 'Nghĩa trang Văn Điển - Hà Nội'),
('DD02', 'Nghĩa trang quê nhà Nghệ An'),
('DD03', 'Nghĩa trang Sala - TP.HCM'),
('DD04', 'Nghĩa trang Đà Nẵng'),
('DD05', 'Hỏa táng Phúc An Viên');

-- Loại danh mục
INSERT INTO LOAIDANHMUC (MaLoai, TenLoai) VALUES
('LDM01', 'Đám tiệc'),
('LDM02', 'Thờ cúng'),
('LDM03', 'Tu sửa mồ mã'),
('LDM04', 'Du lịch');

-- Thành viên
INSERT INTO THANHVIEN (HoTen, NgayGioSinh, DiaChi, MaQueQuan, MaNgheNghiep, MaGioiTinh) VALUES
(N'Nguyễn Văn Tổ',      '1920-05-15', N'Nghệ An', 'QQ02', 'NN04', 'GT00'), -- Thủy tổ (chưa có gia phả)
(N'Nguyễn Văn Long',    '1945-03-20', N'Hà Nội', 'QQ01', 'NN06', 'GT00'), -- Người lập gia phả hiện tại + Trưởng tộc hiện tại
(N'Nguyễn Văn Hùng',    '1972-08-10', N'Hà Nội', 'QQ01', 'NN01', 'GT00'), -- Con trai trưởng
(N'Lê Thị Lan',         '1975-11-25', N'Đà Nẵng', 'QQ03', 'NN03', 'GT01'),
(N'Nguyễn Văn Nam',     '1998-04-05', N'TP.HCM', 'QQ04', 'NN01', 'GT00'),
(N'Phạm Thị Hồng',      '1999-09-12', N'Hà Nội', 'QQ01', 'NN02', 'GT01'),
(N'Nguyễn Thị Ngọc Anh','2002-01-18', N'Hà Nội', 'QQ01', 'NN02', 'GT01'),
(N'Nguyễn Văn Minh',    '2025-06-10', N'Hà Nội', 'QQ01', 'NN05',  'GT00'); -- Chắt (nghề chưa có)

INSERT INTO CAYGIAPHA (TenGiaPha, NguoiLap, TruongToc) VALUES
('Nguyễn Văn - Hà Nội', 'TV02', 'TV02'),   -- Ông Long vừa lập vừa làm trưởng tộc
('Nguyễn Văn - Nghệ An', 'TV01', 'TV03');   -- Thủy tổ lập, truyền lại cho cháu đích tôn Hùng

UPDATE THANHVIEN SET MaGiaPha = 'GP00' WHERE MaTV IN ('TV02','TV03','TV04','TV05','TV06','TV07','TV08');
UPDATE THANHVIEN SET MaGiaPha = 'GP01' WHERE MaTV = 'TV01';

INSERT INTO QUANHEVOCHONG (MaVo, MaChong, NgayKetThuc, TrangThai) VALUES
('TV04', 'TV03', NULL, 'Hiện tại'),
('TV06', 'TV05', NULL, 'Hiện tại');

INSERT INTO QUANHECONCAI (MaCon, MaCha, MaMe, NgayPhatSinh) VALUES
('TV02', 'TV01', NULL,   '1972-08-10'), -- TV02 (Hùng) là con của TV01 (Long)
('TV04', 'TV02', 'TV03', '1998-04-05'), -- TV04 (Nam) là con của TV02 (Hùng) và TV03 (Lan)
('TV05', NULL,   NULL,   '1999-09-12'), -- TV05 (Hồng) - vợ của Nam (chưa có cha mẹ)
('TV06', 'TV02', 'TV03', '2002-01-18'), -- TV06 (Ngọc Anh) là con của TV02 và TV03
('TV07', 'TV04', 'TV05', '2025-06-10'); -- TV07 (Minh) là con của TV04 (Nam) và TV05 (Hồng)

-- Cập nhật thông tin mất cho một số thành viên (các trường nullable)
UPDATE THANHVIEN SET MaNguyenNhanMat = 'NNM01', MaDiaDiemMaiTang = 'DD02' WHERE MaTV = 'TV01'; -- TV01 mất (tuổi già, mai táng tại Nghệ An)
UPDATE THANHVIEN SET MaNguyenNhanMat = 'NNM01', MaDiaDiemMaiTang = 'DD05' WHERE MaTV = 'TV03'; -- TV03 mất (tuổi già, hỏa táng)

-- Insert loại tài khoản
INSERT INTO LOAITAIKHOAN (MaLoaiTK, TenLoaiTK) VALUES
('LTK01', 'Admin'),
('LTK02', 'TruongToc'),
('LTK03', 'User')
ON DUPLICATE KEY UPDATE TenLoaiTK = VALUES(TenLoaiTK);