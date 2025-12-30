-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: app
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `BAOCAOTHANHTICH`
--

DROP TABLE IF EXISTS `BAOCAOTHANHTICH`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `BAOCAOTHANHTICH` (
  `Nam` int NOT NULL,
  `MaLTT` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoLuong` int DEFAULT NULL,
  PRIMARY KEY (`Nam`,`MaLTT`),
  KEY `MaLTT` (`MaLTT`),
  CONSTRAINT `BAOCAOTHANHTICH_ibfk_1` FOREIGN KEY (`MaLTT`) REFERENCES `LOAITHANHTICH` (`MaLTT`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `BAOCAOTHANHTICH`
--

LOCK TABLES `BAOCAOTHANHTICH` WRITE;
/*!40000 ALTER TABLE `BAOCAOTHANHTICH` DISABLE KEYS */;
INSERT INTO `BAOCAOTHANHTICH` VALUES (1990,'LTT06',2),(2000,'LTT06',1),(2010,'LTT04',1),(2018,'LTT01',1),(2019,'LTT03',1),(2022,'LTT02',1),(2022,'LTT04',1),(2023,'LTT03',1),(2023,'LTT05',1),(2024,'LTT02',1),(2025,'LTT01',1),(2025,'LTT05',1),(2025,'LTT06',2);
/*!40000 ALTER TABLE `BAOCAOTHANHTICH` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CAYGIAPHA`
--

DROP TABLE IF EXISTS `CAYGIAPHA`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CAYGIAPHA` (
  `MaGiaPha` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenGiaPha` varchar(35) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NguoiLap` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TGLap` date DEFAULT (curdate()),
  `TruongToc` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaGiaPha`),
  KEY `NguoiLap` (`NguoiLap`),
  KEY `TruongToc` (`TruongToc`),
  CONSTRAINT `CAYGIAPHA_ibfk_1` FOREIGN KEY (`NguoiLap`) REFERENCES `THANHVIEN` (`MaTV`),
  CONSTRAINT `CAYGIAPHA_ibfk_2` FOREIGN KEY (`TruongToc`) REFERENCES `THANHVIEN` (`MaTV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CAYGIAPHA`
--

LOCK TABLES `CAYGIAPHA` WRITE;
/*!40000 ALTER TABLE `CAYGIAPHA` DISABLE KEYS */;
INSERT INTO `CAYGIAPHA` VALUES ('GP03','Hoàng Tộc - Thái Bình','TV09','2025-12-29','TV09'),('GP04','Nguyễn Thành - Quảng Ngãi','TV34','2025-12-30','TV34');
/*!40000 ALTER TABLE `CAYGIAPHA` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_GEN_ID_CAYGIAPHA` BEFORE INSERT ON `CAYGIAPHA` FOR EACH ROW BEGIN
    DECLARE max_id INT;

    
    SELECT COALESCE(MAX(CAST(SUBSTRING(MaGiaPha, 3) AS UNSIGNED)), 0) + 1
    INTO max_id
    FROM CAYGIAPHA;

    SET NEW.MaGiaPha = CONCAT('GP', LPAD(max_id, 2, '0'));
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_UPDATE_TAIKHOAN_LOAITK_GIAPHA` AFTER UPDATE ON `CAYGIAPHA` FOR EACH ROW BEGIN
    DECLARE account_count INT;  

    
    SELECT COUNT(*) INTO account_count
    FROM TAIKHOAN
    WHERE MaTV = NEW.TruongToc;

    
    IF account_count > 0 THEN
        UPDATE TAIKHOAN
        SET MaLoaiTK = 'LTK02'
        WHERE MaTV = NEW.TruongToc;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `CT_PHIEUTHU`
--

DROP TABLE IF EXISTS `CT_PHIEUTHU`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CT_PHIEUTHU` (
  `MaPhieuThu` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaDMT` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `SoTienThu` decimal(15,2) DEFAULT NULL,
  `SoThuTu` int DEFAULT '1',
  `TinhHopLe` tinyint(1) DEFAULT '0',
  `NgayXacNhan` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`MaPhieuThu`,`MaDMT`),
  KEY `MaDMT` (`MaDMT`),
  CONSTRAINT `CT_PHIEUTHU_ibfk_1` FOREIGN KEY (`MaPhieuThu`) REFERENCES `PHIEUTHUQUY` (`MaPhieuThu`),
  CONSTRAINT `CT_PHIEUTHU_ibfk_2` FOREIGN KEY (`MaDMT`) REFERENCES `DANHMUC` (`MaDM`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CT_PHIEUTHU`
--

LOCK TABLES `CT_PHIEUTHU` WRITE;
/*!40000 ALTER TABLE `CT_PHIEUTHU` DISABLE KEYS */;
/*!40000 ALTER TABLE `CT_PHIEUTHU` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_INSERT_AUTO_CT_PHIEUTHU` BEFORE INSERT ON `CT_PHIEUTHU` FOR EACH ROW BEGIN
    DECLARE max_stt INT;
    
    
    SELECT COALESCE(MAX(SoThuTu), 0) + 1 INTO max_stt
    FROM CT_PHIEUTHU
    WHERE MaPhieuThu = NEW.MaPhieuThu;
    
    SET NEW.SoThuTu = max_stt;
    
    
    IF NEW.TinhHopLe IS NULL THEN
        SET NEW.TinhHopLe = FALSE;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_UPDATE_NGAYXACNHAN` BEFORE UPDATE ON `CT_PHIEUTHU` FOR EACH ROW BEGIN
    
    IF OLD.TinhHopLe = FALSE AND NEW.TinhHopLe = TRUE THEN
        SET NEW.NgayXacNhan = CURRENT_TIMESTAMP();
    
    ELSEIF OLD.TinhHopLe = TRUE AND NEW.TinhHopLe = FALSE THEN
        SET NEW.NgayXacNhan = NULL;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_UPDATE_TONGTHU_AFTER_XACNHAN` AFTER UPDATE ON `CT_PHIEUTHU` FOR EACH ROW BEGIN
    
    IF OLD.TinhHopLe = FALSE AND NEW.TinhHopLe = TRUE THEN
        
        
        UPDATE DANHMUC
        SET TongThu = COALESCE(TongThu, 0) + NEW.SoTienThu
        WHERE MaDM = NEW.MaDMT;
        
        
        UPDATE PHIEUTHUQUY
        SET TongThu = COALESCE(TongThu, 0) + NEW.SoTienThu
        WHERE MaPhieuThu = NEW.MaPhieuThu;
        
    
    ELSEIF OLD.TinhHopLe = TRUE AND NEW.TinhHopLe = FALSE THEN
        
        
        UPDATE DANHMUC
        SET TongThu = COALESCE(TongThu, 0) - OLD.SoTienThu
        WHERE MaDM = OLD.MaDMT;
        
        
        UPDATE PHIEUTHUQUY
        SET TongThu = COALESCE(TongThu, 0) - OLD.SoTienThu
        WHERE MaPhieuThu = OLD.MaPhieuThu;
        
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `DANHMUC`
--

DROP TABLE IF EXISTS `DANHMUC`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DANHMUC` (
  `MaDM` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenDM` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NguoiDamNhan` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TongThu` decimal(15,2) DEFAULT '0.00',
  `TongChi` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (`MaDM`),
  KEY `NguoiDamNhan` (`NguoiDamNhan`),
  CONSTRAINT `DANHMUC_ibfk_1` FOREIGN KEY (`NguoiDamNhan`) REFERENCES `THANHVIEN` (`MaTV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DANHMUC`
--

LOCK TABLES `DANHMUC` WRITE;
/*!40000 ALTER TABLE `DANHMUC` DISABLE KEYS */;
INSERT INTO `DANHMUC` VALUES ('DM01','Quỹ khuyến học',NULL,0.00,0.00),('DM02','Quỹ từ thiện',NULL,0.00,0.00),('DM03','Quỹ xây dựng nhà thờ họ',NULL,0.00,0.00),('DM04','Quỹ hiếu hỷ',NULL,0.00,0.00),('DM05','Quỹ hỗ trợ sinh viên',NULL,0.00,0.00);
/*!40000 ALTER TABLE `DANHMUC` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `DIADIEMMAITANG`
--

DROP TABLE IF EXISTS `DIADIEMMAITANG`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DIADIEMMAITANG` (
  `MaDiaDiem` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenDiaDiem` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaDiaDiem`),
  UNIQUE KEY `TenDiaDiem` (`TenDiaDiem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DIADIEMMAITANG`
--

LOCK TABLES `DIADIEMMAITANG` WRITE;
/*!40000 ALTER TABLE `DIADIEMMAITANG` DISABLE KEYS */;
INSERT INTO `DIADIEMMAITANG` VALUES ('DD05','Hỏa táng Phúc An Viên'),('DD04','Nghĩa trang Đà Nẵng'),('DD02','Nghĩa trang quê nhà Nghệ An'),('DD03','Nghĩa trang Sala - TP.HCM'),('DD01','Nghĩa trang Văn Điển - Hà Nội');
/*!40000 ALTER TABLE `DIADIEMMAITANG` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `GHINHANTHANHTICH`
--

DROP TABLE IF EXISTS `GHINHANTHANHTICH`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `GHINHANTHANHTICH` (
  `MaLTT` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaTV` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayPhatSinh` date NOT NULL DEFAULT (curdate()),
  PRIMARY KEY (`MaLTT`,`MaTV`,`NgayPhatSinh`),
  KEY `MaTV` (`MaTV`),
  CONSTRAINT `GHINHANTHANHTICH_ibfk_1` FOREIGN KEY (`MaLTT`) REFERENCES `LOAITHANHTICH` (`MaLTT`),
  CONSTRAINT `GHINHANTHANHTICH_ibfk_2` FOREIGN KEY (`MaTV`) REFERENCES `THANHVIEN` (`MaTV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `GHINHANTHANHTICH`
--

LOCK TABLES `GHINHANTHANHTICH` WRITE;
/*!40000 ALTER TABLE `GHINHANTHANHTICH` DISABLE KEYS */;
INSERT INTO `GHINHANTHANHTICH` VALUES ('LTT03','TV03','2019-01-01'),('LTT03','TV05','2023-01-11'),('LTT06','TV05','2025-01-01'),('LTT04','TV07','2010-12-11'),('LTT05','TV07','2023-03-15'),('LTT06','TV09','1990-01-20'),('LTT06','TV15','2000-01-01'),('LTT06','TV20','1990-01-01');
/*!40000 ALTER TABLE `GHINHANTHANHTICH` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_CHECK_NGAY_THANHTICH` BEFORE INSERT ON `GHINHANTHANHTICH` FOR EACH ROW BEGIN
    DECLARE ngay_sinh DATE;

    
    SELECT DATE(NgayGioSinh) INTO ngay_sinh
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;

    
    IF NEW.NgayPhatSinh <= ngay_sinh THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ngày đạt thành tích phải sau ngày sinh thành viên!';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_UPDATE_BAOCAOTHANHTICH_AFTER_INSERT` AFTER INSERT ON `GHINHANTHANHTICH` FOR EACH ROW BEGIN
    DECLARE current_year INT;
    DECLARE existing_count INT;

    SET current_year = YEAR(NEW.NgayPhatSinh);

    
    SELECT SoLuong INTO existing_count
    FROM BAOCAOTHANHTICH
    WHERE Nam = current_year AND MaLTT = NEW.MaLTT;

    IF existing_count IS NOT NULL THEN
        
        UPDATE BAOCAOTHANHTICH
        SET SoLuong = SoLuong + 1
        WHERE Nam = current_year AND MaLTT = NEW.MaLTT;
    ELSE
        
        INSERT INTO BAOCAOTHANHTICH (Nam, MaLTT, SoLuong)
        VALUES (current_year, NEW.MaLTT, 1);
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `HONNHAN`
--

DROP TABLE IF EXISTS `HONNHAN`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `HONNHAN` (
  `MaTV` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaTVVC` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayBatDau` date DEFAULT (curdate()),
  `NgayKetThuc` date DEFAULT NULL,
  PRIMARY KEY (`MaTV`,`MaTVVC`),
  KEY `MaTVVC` (`MaTVVC`),
  CONSTRAINT `HONNHAN_ibfk_1` FOREIGN KEY (`MaTV`) REFERENCES `THANHVIEN` (`MaTV`),
  CONSTRAINT `HONNHAN_ibfk_2` FOREIGN KEY (`MaTVVC`) REFERENCES `THANHVIEN` (`MaTV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `HONNHAN`
--

LOCK TABLES `HONNHAN` WRITE;
/*!40000 ALTER TABLE `HONNHAN` DISABLE KEYS */;
INSERT INTO `HONNHAN` VALUES ('TV09','TV16','2025-12-29',NULL),('TV10','TV13','1945-12-29',NULL),('TV11','TV12','2025-12-29',NULL),('TV15','TV17','2025-12-29',NULL),('TV18','TV19','2025-12-30',NULL),('TV21','TV22','2025-12-30',NULL),('TV24','TV26','2025-12-30',NULL),('TV32','TV33','1925-12-30',NULL),('TV34','TV38','1990-12-30',NULL),('TV35','TV36','1970-12-30',NULL),('TV37','TV39','2025-12-30',NULL),('TV43','TV44','2000-12-30',NULL),('TV48','TV49','1949-12-30',NULL);
/*!40000 ALTER TABLE `HONNHAN` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_CHECK_NGAY_KET_HON_HONNHAN` BEFORE INSERT ON `HONNHAN` FOR EACH ROW BEGIN
    DECLARE birth_date_1 DATE;
    DECLARE birth_date_2 DATE;

    
    SELECT DATE(NgayGioSinh) INTO birth_date_1
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;

    SELECT DATE(NgayGioSinh) INTO birth_date_2
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVVC;

    
    IF NEW.NgayBatDau <= birth_date_1 OR NEW.NgayBatDau <= birth_date_2 THEN
        SIGNAL SQLSTATE '45010'
        SET MESSAGE_TEXT = 'Ngày kết hôn phải sau ngày sinh thành viên!';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_INSERT_DOI_THANHVIEN_HONNHAN` AFTER INSERT ON `HONNHAN` FOR EACH ROW BEGIN
    DECLARE partner_gen INT;
    
    
    SELECT DOI INTO partner_gen
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVVC;

    
    IF partner_gen IS NOT NULL AND partner_gen = 0 THEN
        UPDATE THANHVIEN
        SET DOI = partner_gen
        WHERE MaTV = NEW.MaTVVC;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_INSERT_MaGP_THANHVIEN_HONNHAN` AFTER INSERT ON `HONNHAN` FOR EACH ROW BEGIN
    DECLARE partner_gen VARCHAR(5);

    
    SELECT MaGiaPha INTO partner_gen
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;

    
    IF partner_gen IS NOT NULL THEN
        UPDATE THANHVIEN
        SET MaGiaPha = partner_gen
        WHERE MaTV = NEW.MaTVVC;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `LOAITAIKHOAN`
--

DROP TABLE IF EXISTS `LOAITAIKHOAN`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `LOAITAIKHOAN` (
  `MaLoaiTK` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenLoaiTK` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaLoaiTK`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `LOAITAIKHOAN`
--

LOCK TABLES `LOAITAIKHOAN` WRITE;
/*!40000 ALTER TABLE `LOAITAIKHOAN` DISABLE KEYS */;
INSERT INTO `LOAITAIKHOAN` VALUES ('LTK01','Admin'),('LTK02','Trưởng tộc'),('LTK03','User');
/*!40000 ALTER TABLE `LOAITAIKHOAN` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `LOAITHANHTICH`
--

DROP TABLE IF EXISTS `LOAITHANHTICH`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `LOAITHANHTICH` (
  `MaLTT` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenLTT` varchar(35) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaLTT`),
  UNIQUE KEY `TenLTT` (`TenLTT`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `LOAITHANHTICH`
--

LOCK TABLES `LOAITHANHTICH` WRITE;
/*!40000 ALTER TABLE `LOAITHANHTICH` DISABLE KEYS */;
INSERT INTO `LOAITHANHTICH` VALUES ('LTT02','Bằng khen Thủ tướng'),('LTT03','Chiến sĩ thi đua'),('LTT10','Công dân tiêu biểu thành phố'),('LTT08','Đảng viên tiêu biểu trung ương'),('LTT06','Giải thưởng khoa học kỹ thuật'),('LTT04','Giấy khen cấp tỉnh'),('LTT05','Học bổng giỏi'),('LTT01','Huân chương Lao động'),('LTT13','Nghệ sĩ nhân dân'),('LTT12','Nghệ sĩ ưu tú'),('LTT11','Nhà giáo dân nhân'),('LTT07','Sinh viên 5 tốt'),('LTT09','Thanh niên tiên tiến');
/*!40000 ALTER TABLE `LOAITHANHTICH` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `NGHENGHIEP`
--

DROP TABLE IF EXISTS `NGHENGHIEP`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NGHENGHIEP` (
  `MaNgheNghiep` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenNgheNghiep` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaNgheNghiep`),
  UNIQUE KEY `TenNgheNghiep` (`TenNgheNghiep`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `NGHENGHIEP`
--

LOCK TABLES `NGHENGHIEP` WRITE;
/*!40000 ALTER TABLE `NGHENGHIEP` DISABLE KEYS */;
INSERT INTO `NGHENGHIEP` VALUES ('NN02','Bác Sĩ'),('NN05','Công Nhân'),('NN09','Doanh Nhân'),('NN07','Kế Toán'),('NN03','Kỹ Sư'),('NN06','Lập Trình Viên'),('NN08','Luật Sư'),('NN11','Nhân Viên Văn Phòng'),('NN04','Nông Dân'),('NN14','Phiên Dịch Viên'),('NN15','Sinh viên'),('NN01','Thầy Giáo'),('NN00','Thợ Điện'),('NN12','Thợ Hàn'),('NN13','Thợ Mộc'),('NN10','Y Tá');
/*!40000 ALTER TABLE `NGHENGHIEP` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `NGUYENNHANMAT`
--

DROP TABLE IF EXISTS `NGUYENNHANMAT`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NGUYENNHANMAT` (
  `MaNguyenNhanMat` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenNguyenNhanMat` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaNguyenNhanMat`),
  UNIQUE KEY `TenNguyenNhanMat` (`TenNguyenNhanMat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `NGUYENNHANMAT`
--

LOCK TABLES `NGUYENNHANMAT` WRITE;
/*!40000 ALTER TABLE `NGUYENNHANMAT` DISABLE KEYS */;
INSERT INTO `NGUYENNHANMAT` VALUES ('NNM02','Bệnh hiểm nghèo'),('NNM06','Đuối nước'),('NNM08','Giật điện'),('NNM05','Khác'),('NNM03','Tai nạn giao thông'),('NNM04','Tai nạn lao động'),('NNM07','Tự tử'),('NNM01','Tuổi già');
/*!40000 ALTER TABLE `NGUYENNHANMAT` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PHANQUYENLOAITK`
--

DROP TABLE IF EXISTS `PHANQUYENLOAITK`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PHANQUYENLOAITK` (
  `MaLoaiTK` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaQuyen` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`MaLoaiTK`,`MaQuyen`),
  KEY `MaQuyen` (`MaQuyen`),
  CONSTRAINT `PHANQUYENLOAITK_ibfk_1` FOREIGN KEY (`MaLoaiTK`) REFERENCES `LOAITAIKHOAN` (`MaLoaiTK`),
  CONSTRAINT `PHANQUYENLOAITK_ibfk_2` FOREIGN KEY (`MaQuyen`) REFERENCES `QUYEN` (`MaQuyen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PHANQUYENLOAITK`
--

LOCK TABLES `PHANQUYENLOAITK` WRITE;
/*!40000 ALTER TABLE `PHANQUYENLOAITK` DISABLE KEYS */;
/*!40000 ALTER TABLE `PHANQUYENLOAITK` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PHIEUCHIQUY`
--

DROP TABLE IF EXISTS `PHIEUCHIQUY`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PHIEUCHIQUY` (
  `MaPhieuChi` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaTV` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayChi` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `MaDMC` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SoTienChi` decimal(15,2) DEFAULT NULL,
  `LyDoChi` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaPhieuChi`),
  KEY `MaTV` (`MaTV`),
  KEY `MaDMC` (`MaDMC`),
  CONSTRAINT `PHIEUCHIQUY_ibfk_1` FOREIGN KEY (`MaTV`) REFERENCES `THANHVIEN` (`MaTV`),
  CONSTRAINT `PHIEUCHIQUY_ibfk_2` FOREIGN KEY (`MaDMC`) REFERENCES `DANHMUC` (`MaDM`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PHIEUCHIQUY`
--

LOCK TABLES `PHIEUCHIQUY` WRITE;
/*!40000 ALTER TABLE `PHIEUCHIQUY` DISABLE KEYS */;
/*!40000 ALTER TABLE `PHIEUCHIQUY` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_GEN_ID_CHIQUY` BEFORE INSERT ON `PHIEUCHIQUY` FOR EACH ROW BEGIN
    DECLARE max_id INT;

    SELECT COALESCE(MAX(CAST(SUBSTRING(MaPhieuChi, 3) AS UNSIGNED)), 0) + 1
    INTO max_id
    FROM PHIEUCHIQUY;

    SET NEW.MaPhieuChi = CONCAT('CQ', LPAD(max_id, 2, '0'));
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_UPDATE_TONGCHI_AFTER_INSERT` AFTER INSERT ON `PHIEUCHIQUY` FOR EACH ROW BEGIN
    UPDATE DANHMUC
    SET TongChi = COALESCE(TongChi, 0) + NEW.SoTienChi
    WHERE MaDM = NEW.MaDMC;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_UPDATE_TONGCHI_AFTER_DELETE` AFTER DELETE ON `PHIEUCHIQUY` FOR EACH ROW BEGIN
    UPDATE DANHMUC
    SET TongChi = COALESCE(TongChi, 0) - OLD.SoTienChi
    WHERE MaDM = OLD.MaDMC;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `PHIEUTHUQUY`
--

DROP TABLE IF EXISTS `PHIEUTHUQUY`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PHIEUTHUQUY` (
  `MaPhieuThu` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaTV` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayThu` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `TongThu` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (`MaPhieuThu`),
  KEY `MaTV` (`MaTV`),
  CONSTRAINT `PHIEUTHUQUY_ibfk_1` FOREIGN KEY (`MaTV`) REFERENCES `THANHVIEN` (`MaTV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PHIEUTHUQUY`
--

LOCK TABLES `PHIEUTHUQUY` WRITE;
/*!40000 ALTER TABLE `PHIEUTHUQUY` DISABLE KEYS */;
/*!40000 ALTER TABLE `PHIEUTHUQUY` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_GEN_ID_THUQUY` BEFORE INSERT ON `PHIEUTHUQUY` FOR EACH ROW BEGIN
    DECLARE max_id INT;

    SELECT COALESCE(MAX(CAST(SUBSTRING(MaPhieuThu, 3) AS UNSIGNED)), 0) + 1
    INTO max_id
    FROM PHIEUTHUQUY;

    SET NEW.MaPhieuThu = CONCAT('TQ', LPAD(max_id, 2, '0'));
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `QUANHECON`
--

DROP TABLE IF EXISTS `QUANHECON`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `QUANHECON` (
  `MaTV` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaTVCha` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaTVMe` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayPhatSinh` date DEFAULT NULL,
  PRIMARY KEY (`MaTV`),
  KEY `MaTVCha` (`MaTVCha`),
  KEY `MaTVMe` (`MaTVMe`),
  CONSTRAINT `QUANHECON_ibfk_1` FOREIGN KEY (`MaTV`) REFERENCES `THANHVIEN` (`MaTV`),
  CONSTRAINT `QUANHECON_ibfk_2` FOREIGN KEY (`MaTVCha`) REFERENCES `THANHVIEN` (`MaTV`),
  CONSTRAINT `QUANHECON_ibfk_3` FOREIGN KEY (`MaTVMe`) REFERENCES `THANHVIEN` (`MaTV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QUANHECON`
--

LOCK TABLES `QUANHECON` WRITE;
/*!40000 ALTER TABLE `QUANHECON` DISABLE KEYS */;
INSERT INTO `QUANHECON` VALUES ('TV07',NULL,'TV05','2002-01-18'),('TV09','TV10','TV13','2025-12-28'),('TV10','TV11','TV12','2025-12-28'),('TV14','TV11','TV12','2025-12-29'),('TV15','TV10','TV13','2025-12-29'),('TV18','TV09','TV16','2025-12-30'),('TV20','TV09','TV16','2025-12-30'),('TV21','TV15','TV17','2025-12-30'),('TV23','TV18','TV19','2025-12-30'),('TV24','TV18','TV19','2025-12-30'),('TV25','TV21','TV22','2025-12-30'),('TV27','TV24','TV26','2025-12-30'),('TV28','TV24','TV26','2025-12-30'),('TV30','TV31',NULL,'2025-12-30'),('TV31','TV32',NULL,'2025-12-30'),('TV34','TV35',NULL,'1977-12-30'),('TV37','TV35','TV36','1979-12-30'),('TV40','TV35','TV36','1995-12-30'),('TV41','TV34','TV38','1999-12-30'),('TV42','TV34','TV38','2025-12-30'),('TV43','TV37','TV39','2000-12-30'),('TV45','TV42',NULL,'2025-12-30'),('TV46','TV35','TV36','2025-12-30');
/*!40000 ALTER TABLE `QUANHECON` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_CHECK_CHA_ME_QUANHECON` BEFORE INSERT ON `QUANHECON` FOR EACH ROW BEGIN
    DECLARE father_gender VARCHAR(3);
    DECLARE mother_gender VARCHAR(3);

    
    SELECT GioiTinh INTO father_gender
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVCha;
    
    
    SELECT GioiTinh INTO mother_gender
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVMe;
    
    
    IF father_gender IS NOT NULL AND father_gender != 'Nam' THEN
        SIGNAL SQLSTATE '45003'
        SET MESSAGE_TEXT = N'Giới tính của cha phải là Nam!';
    END IF;

    
    IF mother_gender IS NOT NULL AND mother_gender != 'Nữ' THEN
        SIGNAL SQLSTATE '45004'
        SET MESSAGE_TEXT = N'Giới tính của mẹ phải là Nữ!';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_CHECK_NGAY_SINH_CON_QUANHECON` BEFORE INSERT ON `QUANHECON` FOR EACH ROW BEGIN
    DECLARE father_birth DATE;
    DECLARE mother_birth DATE;
    DECLARE child_birth DATE;

    
    SELECT NgayGioSinh INTO father_birth
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVCha;
    
    
    SELECT NgayGioSinh INTO mother_birth
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVMe;

    
    SELECT NgayGioSinh INTO child_birth
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTV;
    
    
    IF father_birth IS NOT NULL AND child_birth <= father_birth THEN
        SIGNAL SQLSTATE '45002'
        SET MESSAGE_TEXT = N'Ngày sinh của con phải sau ngày sinh của cha!';
    END IF;

    
    IF mother_birth IS NOT NULL AND child_birth <= mother_birth THEN
        SIGNAL SQLSTATE '45001'
        SET MESSAGE_TEXT = N'Ngày sinh của con phải sau ngày sinh của mẹ!';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_INSERT_MaTVMe_QUANHECON_HONNHAN` BEFORE INSERT ON `QUANHECON` FOR EACH ROW BEGIN
    DECLARE spouse_id VARCHAR(5);

    
    SELECT MaTVVC INTO spouse_id
    FROM HONNHAN
    WHERE MaTV = NEW.MaTVCha AND NgayKetThuc IS NULL;

    
    IF spouse_id IS NOT NULL THEN
        SET NEW.MaTVMe = spouse_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_INSERT_DOI_THANHVIEN_QUANHECON` AFTER INSERT ON `QUANHECON` FOR EACH ROW BEGIN
    DECLARE parent_gen INT;

    
    SELECT doi INTO parent_gen
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVCha;

    
    IF parent_gen IS NOT NULL THEN
        UPDATE THANHVIEN
        SET DOI = parent_gen + 1
        WHERE MaTV = NEW.MaTV;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_INSERT_MaGP_THANHVIEN_QUANHECON` AFTER INSERT ON `QUANHECON` FOR EACH ROW BEGIN
    DECLARE parent_family_id VARCHAR(5);

    
    SELECT MaGiaPha INTO parent_family_id
    FROM THANHVIEN
    WHERE MaTV = NEW.MaTVCha;

    IF parent_family_id IS NULL THEN
        SELECT MaGiaPha INTO parent_family_id
        FROM THANHVIEN
        WHERE MaTV = NEW.MaTV;
    END IF;

    
    IF parent_family_id IS NOT NULL THEN
        UPDATE THANHVIEN
        SET MaGiaPha = parent_family_id
        WHERE MaTV = NEW.MaTV;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `QUEQUAN`
--

DROP TABLE IF EXISTS `QUEQUAN`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `QUEQUAN` (
  `MaQueQuan` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenQueQuan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaQueQuan`),
  UNIQUE KEY `TenQueQuan` (`TenQueQuan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QUEQUAN`
--

LOCK TABLES `QUEQUAN` WRITE;
/*!40000 ALTER TABLE `QUEQUAN` DISABLE KEYS */;
INSERT INTO `QUEQUAN` VALUES ('QQ07','An Giang'),('QQ08','Đà Nẵng'),('QQ04','Điện Biên'),('QQ00','Hà Nội'),('QQ01','Hải Phòng'),('QQ03','Hồ Chí Minh'),('QQ06','Nghệ An'),('QQ05','Quảng Ngãi'),('QQ02','Thanh Hóa');
/*!40000 ALTER TABLE `QUEQUAN` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QUYEN`
--

DROP TABLE IF EXISTS `QUYEN`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `QUYEN` (
  `MaQuyen` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenQuyen` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaQuyen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QUYEN`
--

LOCK TABLES `QUYEN` WRITE;
/*!40000 ALTER TABLE `QUYEN` DISABLE KEYS */;
/*!40000 ALTER TABLE `QUYEN` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `REFRESH_TOKENS`
--

DROP TABLE IF EXISTS `REFRESH_TOKENS`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `REFRESH_TOKENS` (
  `token` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenDangNhap` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayTao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `NgayHetHan` timestamp NOT NULL,
  PRIMARY KEY (`token`),
  KEY `idx_tendangnhap` (`TenDangNhap`),
  KEY `idx_ngayhethan` (`NgayHetHan`),
  CONSTRAINT `REFRESH_TOKENS_ibfk_1` FOREIGN KEY (`TenDangNhap`) REFERENCES `TAIKHOAN` (`TenDangNhap`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `REFRESH_TOKENS`
--

LOCK TABLES `REFRESH_TOKENS` WRITE;
/*!40000 ALTER TABLE `REFRESH_TOKENS` DISABLE KEYS */;
INSERT INTO `REFRESH_TOKENS` VALUES ('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGhhbmhjb25nQGV4YW1wbGUuY29tIiwidG9rZW5fdHlwZSI6MSwiaWF0IjoxNzY3MDgxMDczLCJleHAiOjE3Njc2ODU4NzN9.LiuHUl1SS1udYAXXeZJTtIm-_yOxnqDyfk87529WTpQ','thanhcong@example.com','2025-12-30 07:51:13','2026-01-06 14:51:13'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidHJ1bmd0cmFuQGV4YW1wbGUuY29tIiwidG9rZW5fdHlwZSI6MSwiaWF0IjoxNzY3MDgxNjk3LCJleHAiOjE3Njc2ODY0OTd9.nIGVjClt1Yap95u5mF7LQJcpxs1PXAN-KFTKo353uA8','trungtran@example.com','2025-12-30 08:01:37','2026-01-06 15:01:37'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidmFuZHVuZ0BleGFtcGxlLmNvbSIsInRva2VuX3R5cGUiOjEsImlhdCI6MTc2NzA2MjI4MywiZXhwIjoxNzY3NjY3MDgzfQ.jy5hhzPWCVSuCz3qF_i6gMx8u_ICmF7TtMaMLoVpGHk','vandung@example.com','2025-12-30 02:38:04','2026-01-06 09:38:04'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidmFuZHVuZ0BleGFtcGxlLmNvbSIsInRva2VuX3R5cGUiOjEsImlhdCI6MTc2NzA4MDAzNSwiZXhwIjoxNzY3Njg0ODM1fQ.PFRxdv2zMfGrdO9T3AvopzMXI8CoKpBGWMQjowzgt7A','vandung@example.com','2025-12-30 07:33:55','2026-01-06 14:33:55'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidmFuZHVuZ0BleGFtcGxlLmNvbSIsInRva2VuX3R5cGUiOjEsImlhdCI6MTc2NzAzMDEzMSwiZXhwIjoxNzY3NjM0OTMxfQ.MMt_mRHHeu6bvY67MHBpCT3IG0KdNSJurUuL42PNh2Q','vandung@example.com','2025-12-29 17:42:11','2026-01-06 00:42:11'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidmFuZHVuZ0BleGFtcGxlLmNvbSIsInRva2VuX3R5cGUiOjEsImlhdCI6MTc2NzAzMjA2MywiZXhwIjoxNzY3NjM2ODYzfQ.AP76O7cCWRP8sUcfjkKIvMrjUaU4p66zYpqqf5jNuac','vandung@example.com','2025-12-29 18:14:22','2026-01-06 01:14:23'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0b2tlbl90eXBlIjoxLCJpYXQiOjE3NjcwMjk3ODAsImV4cCI6MTc2NzYzNDU4MH0.gaDhWoWJn5idBxOhSCbdL03TzsOSDv97h3bxqrxauUU','admin@example.com','2025-12-29 17:36:20','2026-01-06 00:36:21'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0b2tlbl90eXBlIjoxLCJpYXQiOjE3NjcwMzAxNTQsImV4cCI6MTc2NzYzNDk1NH0.9XBhEwYJJflTojLJ_bdUlgRnBgoKOV6GiXowFY2ViGQ','admin@example.com','2025-12-29 17:42:34','2026-01-06 00:42:34'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0b2tlbl90eXBlIjoxLCJpYXQiOjE3NjcwNjc4MzAsImV4cCI6MTc2NzY3MjYzMH0.PTCiBK2Hb_pkx3-TtaS8dSET3tmfesCp60C-4Wy5sZs','admin@example.com','2025-12-30 04:10:29','2026-01-06 11:10:30'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0b2tlbl90eXBlIjoxLCJpYXQiOjE3NjcwNjcxMjgsImV4cCI6MTc2NzY3MTkyOH0.S42czynEn5ky88rdkrzdGAm-Gm4VklwTHZN9XZVAZP0','admin@example.com','2025-12-30 03:58:47','2026-01-06 10:58:49'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0b2tlbl90eXBlIjoxLCJpYXQiOjE3NjcwNjg3ODksImV4cCI6MTc2NzY3MzU4OX0.aagZliGUhIoeYxJFPuQC5V4RDLp5XSyla9gcJWx4E00','admin@example.com','2025-12-30 04:26:29','2026-01-06 11:26:30'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0b2tlbl90eXBlIjoxLCJpYXQiOjE3NjcwNjkyOTMsImV4cCI6MTc2NzY3NDA5M30.Wy7N8jvfAz8ckFuHAJGPnUaQsOyNUa7CO8-reA_MA_o','admin@example.com','2025-12-30 04:34:53','2026-01-06 11:34:54'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0b2tlbl90eXBlIjoxLCJpYXQiOjE3NjcwNjkzMjIsImV4cCI6MTc2NzY3NDEyMn0.afffXm7uV01LBaMKIjAK1kB4V3xc-8OVDfPi1YP1WIQ','admin@example.com','2025-12-30 04:35:22','2026-01-06 11:35:23'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0b2tlbl90eXBlIjoxLCJpYXQiOjE3NjcwODA1MDQsImV4cCI6MTc2NzY4NTMwNH0.7RMtzXpMXanjMm4EzcMxvTJ2h1JPv4NG1K6204H_OHA','admin@example.com','2025-12-30 07:41:44','2026-01-06 14:41:45'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0b2tlbl90eXBlIjoxLCJpYXQiOjE3NjcwODQ3MjQsImV4cCI6MTc2NzY4OTUyNH0.2X-goVbE0HQPLI1imSxRZkaWJwOcM9A_2QJ8bVEZ2Mo','admin@example.com','2025-12-30 08:52:04','2026-01-06 15:52:05'),('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJ0b2tlbl90eXBlIjoxLCJpYXQiOjE3NjcwODY5MjUsImV4cCI6MTc2NzY5MTcyNX0.uT7zI66YNgTMx-QrTViOoR3mKIBtUZDKYoJ9fXAXgJc','admin@example.com','2025-12-30 09:28:45','2026-01-06 16:28:45');
/*!40000 ALTER TABLE `REFRESH_TOKENS` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TAIKHOAN`
--

DROP TABLE IF EXISTS `TAIKHOAN`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TAIKHOAN` (
  `TenDangNhap` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `MaTV` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MatKhau` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaLoaiTK` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TGTaoMoi` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`TenDangNhap`),
  KEY `MaTV` (`MaTV`),
  KEY `MaLoaiTK` (`MaLoaiTK`),
  CONSTRAINT `TAIKHOAN_ibfk_1` FOREIGN KEY (`MaTV`) REFERENCES `THANHVIEN` (`MaTV`) ON DELETE CASCADE,
  CONSTRAINT `TAIKHOAN_ibfk_2` FOREIGN KEY (`MaLoaiTK`) REFERENCES `LOAITAIKHOAN` (`MaLoaiTK`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TAIKHOAN`
--

LOCK TABLES `TAIKHOAN` WRITE;
/*!40000 ALTER TABLE `TAIKHOAN` DISABLE KEYS */;
INSERT INTO `TAIKHOAN` VALUES ('admin@example.com',NULL,'c7a2c5c32068865b8f850123a46abcdfa81c5c1b1b7d90705b89315ad659c6fb','LTK01','2025-12-29 17:16:37'),('thanhcong@example.com','TV34','c7a2c5c32068865b8f850123a46abcdfa81c5c1b1b7d90705b89315ad659c6fb','LTK02','2025-12-30 07:42:11'),('trungtran@example.com','TV47','c7a2c5c32068865b8f850123a46abcdfa81c5c1b1b7d90705b89315ad659c6fb','LTK02','2025-12-30 07:51:41'),('truongtoc@example.com',NULL,'c7a2c5c32068865b8f850123a46abcdfa81c5c1b1b7d90705b89315ad659c6fb','LTK02','2025-12-29 17:16:37'),('vandung@example.com','TV09','c7a2c5c32068865b8f850123a46abcdfa81c5c1b1b7d90705b89315ad659c6fb','LTK02','2025-12-29 17:41:23');
/*!40000 ALTER TABLE `TAIKHOAN` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `THANHVIEN`
--

DROP TABLE IF EXISTS `THANHVIEN`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `THANHVIEN` (
  `MaTV` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `HoTen` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayGioSinh` date DEFAULT (curdate()),
  `DiaChi` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TrangThai` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Còn Sống',
  `TGTaoMoi` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `DOI` int DEFAULT '0',
  `MaQueQuan` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaNgheNghiep` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `GioiTinh` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Nam',
  `MaNguyenNhanMat` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayGioMat` datetime DEFAULT NULL,
  `MaDiaDiem` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaGiaPha` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MaTV`),
  KEY `MaQueQuan` (`MaQueQuan`),
  KEY `MaNgheNghiep` (`MaNgheNghiep`),
  KEY `MaNguyenNhanMat` (`MaNguyenNhanMat`),
  KEY `MaDiaDiem` (`MaDiaDiem`),
  KEY `FK_THANHVIEN_GIAPHA` (`MaGiaPha`),
  CONSTRAINT `FK_THANHVIEN_GIAPHA` FOREIGN KEY (`MaGiaPha`) REFERENCES `CAYGIAPHA` (`MaGiaPha`),
  CONSTRAINT `THANHVIEN_ibfk_1` FOREIGN KEY (`MaQueQuan`) REFERENCES `QUEQUAN` (`MaQueQuan`),
  CONSTRAINT `THANHVIEN_ibfk_2` FOREIGN KEY (`MaNgheNghiep`) REFERENCES `NGHENGHIEP` (`MaNgheNghiep`),
  CONSTRAINT `THANHVIEN_ibfk_3` FOREIGN KEY (`MaNguyenNhanMat`) REFERENCES `NGUYENNHANMAT` (`MaNguyenNhanMat`),
  CONSTRAINT `THANHVIEN_ibfk_4` FOREIGN KEY (`MaDiaDiem`) REFERENCES `DIADIEMMAITANG` (`MaDiaDiem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `THANHVIEN`
--

LOCK TABLES `THANHVIEN` WRITE;
/*!40000 ALTER TABLE `THANHVIEN` DISABLE KEYS */;
INSERT INTO `THANHVIEN` VALUES ('TV03','Lê Thị Lan','1948-11-25','Đà Nẵng','Còn Sống','2025-12-29 17:16:37',0,'QQ03','NN03','Nữ',NULL,NULL,NULL,NULL),('TV05','Phạm Thị Hồng','1975-09-12','Hà Nội','Còn Sống','2025-12-29 17:16:37',0,'QQ01','NN02','Nữ',NULL,NULL,NULL,NULL),('TV07','Nguyễn Thị Ngọc Anh','2002-01-18','Hà Nội','Còn Sống','2025-12-29 17:16:37',3,'QQ01','NN02','Nữ',NULL,NULL,NULL,NULL),('TV09','Hoàng Văn Dũng','1950-03-14','Thái Bình','Còn Sống','2025-12-29 17:41:23',2,'QQ00','NN07','Nam',NULL,NULL,NULL,'GP03'),('TV10','Hoàng Văn Hưng','1925-08-10','Thái Bình','Còn Sống','2025-12-29 18:26:13',1,'QQ04','NN01','Nam',NULL,NULL,NULL,'GP03'),('TV11','Hoàng Văn Thái','1900-01-01','Hà Nội','Mất','2025-12-29 18:26:49',0,'QQ00','NN04','Nam','NNM02','1990-01-01 10:20:00','DD04','GP03'),('TV12','Trần Thị Mận','1902-05-05','Thái Bình','Còn Sống','2025-12-29 18:27:11',0,'QQ00','NN04','Nữ',NULL,NULL,NULL,'GP03'),('TV13','Lê Thị Bưởi','1928-10-20','Hà Nội','Còn Sống','2025-12-29 18:29:16',1,'QQ00','NN07','Nữ',NULL,NULL,NULL,'GP03'),('TV14','Hoàng Thị Hoa','1930-12-15','Thái Bình','Mất','2025-12-29 18:30:21',1,'QQ00','NN14','Nữ','NNM05','2020-02-01 14:00:00','DD04','GP03'),('TV15','Hoàng Văn Hải','1958-09-02','Thái Bình','Còn Sống','2025-12-29 18:31:22',2,'QQ00','NN09','Nam',NULL,NULL,NULL,'GP03'),('TV16','Phạm Thị Cúc','1955-06-20','Hưng Yên','Còn Sống','2025-12-29 18:32:26',2,'QQ04','NN07','Nữ',NULL,NULL,NULL,'GP03'),('TV17','Ngô Thị Đào','1960-01-11','Thái Bình','Còn Sống','2025-12-29 18:32:56',2,'QQ00','NN01','Nữ',NULL,NULL,NULL,'GP03'),('TV18','Hoàng Văn Tuấn','1978-04-30','Thái Bình','Còn Sống','2025-12-30 06:54:46',3,'QQ00','NN06','Nam',NULL,NULL,NULL,'GP03'),('TV19','Nguyễn Thị Mai','1980-02-13','Nghệ An','Còn Sống','2025-12-30 06:55:21',3,'QQ00','NN03','Nữ',NULL,NULL,NULL,'GP03'),('TV20','Hoàng Thị Tuyết','1985-01-10','Thái Bình','Còn Sống','2025-12-30 06:55:57',3,'QQ00','NN14','Nữ',NULL,NULL,NULL,'GP03'),('TV21','Hoàng Văn Nam','1988-01-01','Thái Bình','Còn Sống','2025-12-30 06:56:30',3,'QQ00','NN02','Nam',NULL,NULL,NULL,'GP03'),('TV22','Trần Thị Ly','1990-05-05','Hưng Yên','Còn Sống','2025-12-30 06:57:10',3,'QQ04','NN07','Nữ',NULL,NULL,NULL,'GP03'),('TV23','Hoàng Thị An','2000-05-01','Thái Bình','Còn Sống','2025-12-30 07:02:20',4,'QQ04',NULL,'Nữ',NULL,NULL,NULL,'GP03'),('TV24','Hoàng Văn Bình','2002-09-02','Thái Bình','Còn Sống','2025-12-30 07:02:52',4,'QQ00',NULL,'Nam',NULL,NULL,NULL,'GP03'),('TV25','Hoàng Văn Khánh','2015-12-25','Thái Bình','Còn Sống','2025-12-30 07:03:33',4,'QQ00',NULL,'Nam',NULL,NULL,NULL,'GP03'),('TV26','Vũ Thị Sương','2003-01-01','Hà Nam','Còn Sống','2025-12-30 07:04:09',4,'QQ00','NN05','Nữ',NULL,NULL,NULL,'GP03'),('TV27','Hoàng Văn Cường','2024-01-01','Thái Bình','Còn Sống','2025-12-30 07:04:40',5,'QQ00',NULL,'Nam',NULL,NULL,NULL,'GP03'),('TV28','Hoàng Thị Diệu','2025-02-02','Thái Bình','Còn Sống','2025-12-30 07:05:11',5,'QQ00',NULL,'Nữ',NULL,NULL,NULL,'GP03'),('TV30','Trần Văn Anh','1960-01-01','Hà Nội','Còn Sống','2025-12-30 07:38:46',2,'QQ00',NULL,'Nam',NULL,NULL,NULL,NULL),('TV31','Trần Văn Cầu','1930-01-01','Hà Nội','Còn Sống','2025-12-30 07:39:07',1,'QQ00',NULL,'Nam',NULL,NULL,NULL,NULL),('TV32','Trần Văn Bô','1904-01-01','Hà Nội','Còn Sống','2025-12-30 07:39:31',0,'QQ00',NULL,'Nam',NULL,NULL,NULL,NULL),('TV33','Nguyễn Thị Ánh','1906-01-01','Hải Dương','Còn Sống','2025-12-30 07:40:14',0,'QQ00','NN03','Nữ',NULL,NULL,NULL,NULL),('TV34','Nguyễn Thành Công','1975-12-30','Quảng Ngãi','Còn Sống','2025-12-30 07:42:11',1,'QQ00','NN03','Nam',NULL,NULL,NULL,'GP04'),('TV35','Nguyễn Thành Phúc','1950-01-01','Quảng Ngãi','Còn Sống','2025-12-30 07:43:44',0,'QQ05','NN08','Nam',NULL,NULL,NULL,'GP04'),('TV36','Trần Thị Xuân','1951-01-01','Hà Nội','Còn Sống','2025-12-30 07:44:20',0,'QQ01','NN02','Nữ',NULL,NULL,NULL,'GP04'),('TV37','Nguyễn Thành Thái','1978-01-01','Đà Nẵng','Còn Sống','2025-12-30 07:45:01',1,'QQ05',NULL,'Nam',NULL,NULL,NULL,'GP04'),('TV38','Phạm Thị Bưởi','1970-01-01','Đà Nẵng','Còn Sống','2025-12-30 07:45:42',1,'QQ01',NULL,'Nữ',NULL,NULL,NULL,'GP04'),('TV39','Trần Thị Bích','1980-01-01','Quảng Nam','Còn Sống','2025-12-30 07:46:12',1,'QQ06','NN09','Nữ',NULL,NULL,NULL,'GP04'),('TV40','Nguyễn Thị Phương','1994-01-01','Đà Nẵng','Còn Sống','2025-12-30 07:46:48',1,'QQ03',NULL,'Nữ',NULL,NULL,NULL,'GP04'),('TV41','Nguyễn Thị Thanh Phương','2000-01-01','Nghệ An','Còn Sống','2025-12-30 07:47:24',2,'QQ00',NULL,'Nữ',NULL,NULL,NULL,'GP04'),('TV42','Nguyễn Thành Phước','2001-01-01','Đà Nẵng','Còn Sống','2025-12-30 07:47:50',2,'QQ00',NULL,'Nam',NULL,NULL,NULL,'GP04'),('TV43','Nguyễn Thành Kim','1998-01-01','Quế Hưng','Còn Sống','2025-12-30 07:48:26',2,'QQ00',NULL,'Nam',NULL,NULL,NULL,'GP04'),('TV44','Nguyễn Thị Kim Anh','2000-01-01','Hà Nội','Còn Sống','2025-12-30 07:48:56',2,'QQ00',NULL,'Nữ',NULL,NULL,NULL,'GP04'),('TV45','Nguyễn Thành Nhân','2024-01-01','HCM','Còn Sống','2025-12-30 07:49:32',3,'QQ05',NULL,'Nam',NULL,NULL,NULL,'GP04'),('TV46','Nguyễn Thành Triết','2025-01-01','Bình Dương','Còn Sống','2025-12-30 07:50:08',1,'QQ01',NULL,'Nam',NULL,NULL,NULL,'GP04'),('TV47','Trần Trung','1950-12-26','An Giang','Còn Sống','2025-12-30 07:51:41',1,'QQ00','NN12','Nam',NULL,NULL,NULL,NULL),('TV48','Trần Trung Vĩnh','1925-01-01','Hà Tiên','Còn Sống','2025-12-30 07:54:39',0,'QQ07',NULL,'Nam',NULL,NULL,NULL,NULL),('TV49','Phạm Thị Ái Kiều','1929-01-01','Tây Ninh','Còn Sống','2025-12-30 07:55:10',0,'QQ01',NULL,'Nữ',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `THANHVIEN` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_GEN_ID_THANHVIEN` BEFORE INSERT ON `THANHVIEN` FOR EACH ROW BEGIN
    DECLARE max_id INT;

    SELECT COALESCE(MAX(CAST(SUBSTRING(MaTV, 3) AS UNSIGNED)), 0) + 1
    INTO max_id
    FROM THANHVIEN;

    SET NEW.MaTV = CONCAT('TV', LPAD(max_id, 2, '0'));
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `TRG_UPDATE_TRANGTHAI_THANHVIEN_MaNguyenNhanMat` BEFORE UPDATE ON `THANHVIEN` FOR EACH ROW BEGIN
    IF NEW.MaNguyenNhanMat IS NOT NULL AND OLD.MaNguyenNhanMat IS NULL THEN
        SET NEW.TrangThai = 'Mất';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `YEU_CAU_MAT_KHAU`
--

DROP TABLE IF EXISTS `YEU_CAU_MAT_KHAU`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `YEU_CAU_MAT_KHAU` (
  `MaYeuCau` int NOT NULL AUTO_INCREMENT,
  `Email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `TrangThai` enum('ChoDuyet','DaDuyet','DaDoi') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'ChoDuyet',
  `NgayYeuCau` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `NgayDuyet` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`MaYeuCau`),
  KEY `idx_email` (`Email`),
  KEY `idx_trangthai` (`TrangThai`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `YEU_CAU_MAT_KHAU`
--

LOCK TABLES `YEU_CAU_MAT_KHAU` WRITE;
/*!40000 ALTER TABLE `YEU_CAU_MAT_KHAU` DISABLE KEYS */;
INSERT INTO `YEU_CAU_MAT_KHAU` VALUES (2,'vandung@example.com','DaDoi','2025-12-30 04:35:04','2025-12-30 04:35:20');
/*!40000 ALTER TABLE `YEU_CAU_MAT_KHAU` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-30  9:41:01
