# HƯỚNG DẪN TẠO ROUTE GET-ME - LẤY THÔNG TIN CÁ NHÂN TÀI KHOẢN

## 📋 MỤC ĐÍCH
Tạo route GET `/users/get-me` để lấy đầy đủ thông tin cá nhân của tài khoản đang đăng nhập, bao gồm thông tin từ các bảng:
- `TAIKHOAN` - Thông tin tài khoản
- `THANHVIEN` - Thông tin thành viên cơ bản
- `CAYGIAPHA` - Thông tin gia phả
- `QUEQUAN` - Quê quán
- `NGHENGHIEP` - Nghề nghiệp
- `HONNHAN` - Quan hệ hôn nhân
- `QUANHECON` - Quan hệ con cái (cha mẹ)
- `GHINHANTHANHTICH` - Danh sách thành tích
- `LOAITHANHTICH` - Chi tiết loại thành tích
- `NGUYENNHANMAT` - Nguyên nhân mất (nếu có)
- `DIADIEMMAITANG` - Địa điểm mai táng (nếu có)

## 🗄️ CẤU TRÚC DATABASE LIÊN QUAN

### 1. TAIKHOAN
```sql
CREATE TABLE TAIKHOAN(
	TenDangNhap VARCHAR(50) PRIMARY KEY,
	MaTV VARCHAR(5),
	MatKhau VARCHAR(100),
	MaLoaiTK VARCHAR(5),
	TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV) ON DELETE CASCADE,
	FOREIGN KEY(MaLoaiTK) REFERENCES LOAITAIKHOAN(MaLoaiTK)
);
```

### 2. THANHVIEN
```sql
CREATE TABLE THANHVIEN (
    MaTV VARCHAR(5) PRIMARY KEY,
    HoTen VARCHAR(50),
    NgayGioSinh DATETIME,
    DiaChi VARCHAR(50),
    TrangThai VARCHAR(20) DEFAULT 'Còn Sống',
    TGTaoMoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    DOI INT DEFAULT 0,
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
```

### 3. CAYGIAPHA
```sql
CREATE TABLE CAYGIAPHA(
	MaGiaPha VARCHAR(5) PRIMARY KEY,
	TenGiaPha VARCHAR(35),
	NguoiLap VARCHAR(20),
    TGLap TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
	TruongToc VARCHAR(20),
	FOREIGN KEY(NguoiLap) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(TruongToc) REFERENCES THANHVIEN(MaTV)
);
```

### 4. HONNHAN
```sql
CREATE TABLE HONNHAN(
	MaTV VARCHAR(5),
	MaTVVC VARCHAR(5),
	NgayBatDau DATE,
	NgayKetThuc DATE,
	PRIMARY KEY(MaTV, MaTVVC),
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(MaTVVC) REFERENCES THANHVIEN(MaTV)
);
```

### 5. QUANHECON
```sql
CREATE TABLE QUANHECON(
	MaTV VARCHAR(5) PRIMARY KEY,
	MaTVCha VARCHAR(5),
	MaTVMe VARCHAR(5),
	NgayPhatSinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
	FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(MaTVCha) REFERENCES THANHVIEN(MaTV),
	FOREIGN KEY(MaTVMe) REFERENCES THANHVIEN(MaTV)
);
```

### 6. GHINHANTHANHTICH
```sql
CREATE TABLE GHINHANTHANHTICH(
	MaLTT VARCHAR(5),
	MaTV VARCHAR(5),
	NgayPhatSinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY(MaLTT, MaTV, NgayPhatSinh),
	FOREIGN KEY(MaLTT) REFERENCES LOAITHANHTICH(MaLTT),
    FOREIGN KEY(MaTV) REFERENCES THANHVIEN(MaTV)
);
```

### 7. Các bảng danh mục khác
- `QUEQUAN`: MaQueQuan, TenQueQuan
- `NGHENGHIEP`: MaNgheNghiep, TenNgheNghiep
- `LOAITHANHTICH`: MaLTT, TenLTT
- `NGUYENNHANMAT`: MaNguyenNhanMat, TenNguyenNhanMat
- `DIADIEMMAITANG`: MaDiaDiem, TenDiaDiem
- `LOAITAIKHOAN`: MaLoaiTK, TenLoaiTK

## 🔐 AUTHENTICATION FLOW
Route này yêu cầu authentication. User phải gửi `access_token` trong header:
```
Authorization: Bearer <access_token>
```

Middleware `accessTokenValidator` sẽ:
1. Verify token
2. Decode token để lấy `user_id` (chính là `TenDangNhap` - email)
3. Gán vào `req.decoded_authorization`

## 📝 IMPLEMENTATION

### BƯỚC 1: Thêm interface vào `src/services/users.services.ts`

Thêm các interface sau vào đầu file (sau các interface hiện có):

```typescript
// Interface cho thông tin đầy đủ của user
interface GetMeUserRow extends RowDataPacket {
  // Thông tin tài khoản
  TenDangNhap: string;
  TenLoaiTK: string;
  
  // Thông tin thành viên
  HoTen: string;
  NgayGioSinh: Date | null;
  DiaChi: string | null;
  TrangThai: string;
  DOI: number;
  GioiTinh: string | null;
  
  // Quê quán
  TenQueQuan: string | null;
  
  // Nghề nghiệp
  TenNgheNghiep: string | null;
  
  // Gia phả
  TenGiaPha: string | null;
  TenNguoiLap: string | null;
  TenTruongToc: string | null;
}

// Interface cho quan hệ hôn nhân
interface HonNhanInfoRow extends RowDataPacket {
  HoTenVC: string;
  GioiTinhVC: string;
  NgayGioSinhVC: Date | null;
  NgayBatDau: Date;
  NgayKetThuc: Date | null;
  TrangThaiHonNhan: string; // 'Đang kết hôn' hoặc 'Đã kết thúc'
}

// Interface cho quan hệ cha mẹ
interface QuanHeChaMemRow extends RowDataPacket {
  HoTenCha: string | null;
  GioiTinhCha: string | null;
  HoTenMe: string | null;
  GioiTinhMe: string | null;
}

// Interface cho danh sách thành tích
interface ThanhTichInfoRow extends RowDataPacket {
  TenLTT: string;
  NgayPhatSinh: Date;
}
```

### BƯỚC 2: Thêm method `getMe` vào `UsersService` class

Thêm method sau vào class `UsersService` trong file `src/services/users.services.ts` (trước dòng cuối cùng export):

```typescript
  /**
   * Lấy thông tin đầy đủ của user đang đăng nhập
   * @param user_id - TenDangNhap (email) của user
   */
  async getMe(user_id: string) {
    // 1. Lấy thông tin cơ bản của user từ nhiều bảng
    const userInfoSql = `
      SELECT 
        tk.TenDangNhap,
        tk.MaTV,
        tk.MaLoaiTK,
        ltk.TenLoaiTK,
        tk.TGTaoMoi AS TGTaoTK,
        
        tv.HoTen,
        tv.NgayGioSinh,
        tv.DiaChi,
        tv.TrangThai,
        tv.DOI,
        tv.GioiTinh,
        tv.TGTaoMoi,
        tv.NgayGioMat,
        
        tv.MaNguyenNhanMat,
        nnm.TenNguyenNhanMat,
        
        tv.MaDiaDiem,
        dd.TenDiaDiem,
        
        tv.MaQueQuan,
        qq.TenQueQuan,
        
        tv.MaNgheNghiep,
        nn.TenNgheNghiep,
        
        tv.MaGiaPha,
        gp.TenGiaPha,
        gp.NguoiLap,
        nl.HoTen AS TenNguoiLap,
        gp.TruongToc,
        tt.HoTen AS TenTruongToc,
        gp.TGLap
        
      FROM TAIKHOAN tk
      INNER JOIN THANHVIEN tv ON tk.MaTV = tv.MaTV
      LEFT JOIN LOAITAIKHOAN ltk ON tk.MaLoaiTK = ltk.MaLoaiTK
      LEFT JOIN QUEQUAN qq ON tv.MaQueQuan = qq.MaQueQuan
      LEFT JOIN NGHENGHIEP nn ON tv.MaNgheNghiep = nn.MaNgheNghiep
      LEFT JOIN NGUYENNHANMAT nnm ON tv.MaNguyenNhanMat = nnm.MaNguyenNhanMat
      LEFT JOIN DIADIEMMAITANG dd ON tv.MaDiaDiem = dd.MaDiaDiem
      LEFT JOIN CAYGIAPHA gp ON tv.MaGiaPha = gp.MaGiaPha
      LEFT JOIN THANHVIEN nl ON gp.NguoiLap = nl.MaTV
      LEFT JOIN THANHVIEN tt ON gp.TruongToc = tt.MaTV
      WHERE tk.TenDangNhap = ?
    `;
    
    const userInfoRows = await databaseService.query<GetMeUserRow[]>(userInfoSql, [user_id]);
    
    if (userInfoRows.length === 0) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }
    
    const userInfo = userInfoRows[0];
    
    // 2. Lấy thông tin quan hệ hôn nhân (vợ/chồng)
    const honNhanSql = `
      SELECT 
        tv.HoTen AS HoTenVC,
        tv.GioiTinh AS GioiTinhVC,
        tv.NgayGioSinh AS NgayGioSinhVC,
        hn.NgayBatDau,
        hn.NgayKetThuc,
        CASE 
          WHEN hn.NgayKetThuc IS NULL THEN 'Đang kết hôn'
          ELSE 'Đã kết thúc'
        END AS TrangThaiHonNhan
      FROM HONNHAN hn
      INNER JOIN THANHVIEN tv ON hn.MaTVVC = tv.MaTV
      WHERE hn.MaTV = ?
      ORDER BY hn.NgayBatDau DESC
    `;
    
    const honNhanRows = await databaseService.query<HonNhanInfoRow[]>(honNhanSql, [userInfo.MaTV]);
    
    // 3. Lấy thông tin cha mẹ
    const quanHeChaMemSql = `
      SELECT 
        cha.HoTen AS HoTenCha,
        cha.GioiTinh AS GioiTinhCha,
        me.HoTen AS HoTenMe,
        me.GioiTinh AS GioiTinhMe
      FROM QUANHECON qhc
      LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
      LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
      WHERE qhc.MaTV = ?
    `;
    
    const quanHeChaMemRows = await databaseService.query<QuanHeChaMemRow[]>(quanHeChaMemSql, [userInfo.MaTV]);
    
    // 4. Lấy danh sách thành tích
    const thanhTichSql = `
      SELECT 
        ltt.TenLTT,
        gnt.NgayPhatSinh
      FROM GHINHANTHANHTICH gnt
      INNER JOIN LOAITHANHTICH ltt ON gnt.MaLTT = ltt.MaLTT
      WHERE gnt.MaTV = ?
      ORDER BY gnt.NgayPhatSinh DESC
    `;
    
    const thanhTichRows = await databaseService.query<ThanhTichInfoRow[]>(thanhTichSql, [userInfo.MaTV]);
    
    // 5. Trả về kết quả tổng hợp
    return {
      // Thông tin tài khoản
      TenDangNhap: userInfo.TenDangNhap,
      LoaiTaiKhoan: userInfo.TenLoaiTK,
      
      // Thông tin cơ bản thành viên
      HoTen: userInfo.HoTen,
      NgayGioSinh: userInfo.NgayGioSinh,
      DiaChi: userInfo.DiaChi,
      GioiTinh: userInfo.GioiTinh,
      Doi: userInfo.DOI,
      TrangThai: userInfo.TrangThai,
      
      // Thông tin quê quán
      QueQuan: userInfo.TenQueQuan,
      
      // Thông tin nghề nghiệp
      NgheNghiep: userInfo.TenNgheNghiep,
      
      // Thông tin gia phả
      GiaPha: userInfo.TenGiaPha ? {
        TenGiaPha: userInfo.TenGiaPha,
        NguoiLap: userInfo.TenNguoiLap,
        TruongToc: userInfo.TenTruongToc
      } : null,
      
      // Danh sách vợ/chồng
      HonNhan: honNhanRows.map(hn => ({
        HoTen: hn.HoTenVC,
        GioiTinh: hn.GioiTinhVC,
        NgayGioSinh: hn.NgayGioSinhVC,
        NgayBatDau: hn.NgayBatDau,
        NgayKetThuc: hn.NgayKetThuc,
        TrangThai: hn.TrangThaiHonNhan
      })),
      
      // Thông tin cha mẹ
      ChaMe: quanHeChaMemRows.length > 0 ? {
        Cha: quanHeChaMemRows[0].HoTenCha ? {
          HoTen: quanHeChaMemRows[0].HoTenCha,
          GioiTinh: quanHeChaMemRows[0].GioiTinhCha
        } : null,
        Me: quanHeChaMemRows[0].HoTenMe ? {
          HoTen: quanHeChaMemRows[0].HoTenMe,
          GioiTinh: quanHeChaMemRows[0].GioiTinhMe
        } : null
      } : null,
      
      // Danh sách thành tích
      ThanhTich: thanhTichRows.map(tt => ({
        TenThanhTich: tt.TenLTT,
        NgayDat: tt.NgayPhatSinh
      }))
    };
  }
```

### BƯỚC 3: Thêm message vào `src/constants/messages.ts`

Thêm message sau vào object `USERS_MESSAGES`:

```typescript
export const USERS_MESSAGES = {
  // ... các message khác
  
  // Get me messages
  USER_NOT_FOUND: 'Không tìm thấy thông tin người dùng',
  GET_ME_SUCCESS: 'Lấy thông tin cá nhân thành công',
  
  // ... các message khác
} as const;
```

### BƯỚC 4: Thêm controller vào `src/controllers/users.controllers.ts`

Thêm controller sau vào file `src/controllers/users.controllers.ts`:

```typescript
/**
 * Controller lấy thông tin cá nhân
 * GET /users/get-me
 * Headers: { Authorization: Bearer <access_token> }
 */
export const getMeController = async (req: Request, res: Response) => {
  // Lấy user_id từ decoded_authorization (đã được validate bởi middleware)
  const { user_id } = req.decoded_authorization as TokenPayload;
  
  // Gọi service để lấy thông tin
  const result = await usersService.getMe(user_id);

  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result
  });
};
```

### BƯỚC 5: Thêm route vào `src/routes/users.routes.ts`

**5.1. Import controller:**

Thêm `getMeController` vào import ở đầu file:

```typescript
import {
  registerController,
  loginController,
  logoutController,
  refreshTokenController,
  getMeController  // ← THÊM DÒNG NÀY
} from '~/controllers/users.controllers';
```

**5.2. Thêm route:**

Thêm route sau vào file (sau route `refresh-token`, trước các route con):

```typescript
/**
 * Description: Lấy thông tin cá nhân của tài khoản đang đăng nhập
 * Path: /users/get-me
 * Method: GET
 * Headers: { Authorization: Bearer <access_token> }
 */
usersRouter.get('/get-me', accessTokenValidator, wrapAsync(getMeController));
```

### BƯỚC 6: Test API

**Request:**
```http
GET http://localhost:4000/users/get-me
Authorization: Bearer <access_token>
```

**Response thành công (200 OK):**
```json
{
  "message": "Lấy thông tin cá nhân thành công",
  "result": {
    "TenDangNhap": "user@example.com",
    "LoaiTaiKhoan": "User",
    "HoTen": "Nguyễn Văn Long",
    "NgayGioSinh": "1945-03-20T10:30:00.000Z",
    "DiaChi": "Hà Nội",
    "GioiTinh": "Nam",
    "Doi": 2,
    "TrangThai": "Còn Sống",
    "QueQuan": "Hải Phòng",
    "NgheNghiep": "Công Nhân",
    "GiaPha": {
      "TenGiaPha": "Nguyễn Văn - Hà Nội",
      "NguoiLap": "Nguyễn Văn Long",
      "TruongToc": "Nguyễn Văn Long"
    },
    "HonNhan": [
      {
        "HoTen": "Lê Thị Lan",
        "GioiTinh": "Nữ",
        "NgayGioSinh": "1948-11-25T14:00:00.000Z",
        "NgayBatDau": "1970-06-15",
        "NgayKetThuc": null,
        "TrangThai": "Đang kết hôn"
      }
    ],
    "ChaMe": {
      "Cha": {
        "HoTen": "Nguyễn Văn Tổ",
        "GioiTinh": "Nam"
      },
      "Me": {
        "HoTen": "Lê Thị Lan",
        "GioiTinh": "Nữ"
      }
    },
    "ThanhTich": [
      {
        "TenThanhTich": "Huân chương Lao động",
        "NgayDat": "2018-06-10T00:00:00.000Z"
      }
    ]
  }
}
```

**Response lỗi - Không có token (401 Unauthorized):**
```json
{
  "message": "Access token is required"
}
```

**Response lỗi - Token không hợp lệ (401 Unauthorized):**
```json
{
  "message": "jwt malformed"
}
```

**Response lỗi - Không tìm thấy user (404 Not Found):**
```json
{
  "message": "Không tìm thấy thông tin người dùng"
}
```

## 📊 DỮ LIỆU TRẢ VỀ CHI TIẾT

### 1. Thông tin tài khoản
- `TenDangNhap`: Email đăng nhập
- `LoaiTaiKhoan`: Tên loại tài khoản (Admin/TruongToc/User)

### 2. Thông tin cơ bản
- `HoTen`: Họ và tên
- `NgayGioSinh`: Ngày giờ sinh
- `DiaChi`: Địa chỉ hiện tại
- `GioiTinh`: Giới tính (Nam/Nữ)
- `Doi`: Đời thứ trong gia phả
- `TrangThai`: Trạng thái (Còn Sống/Mất)

### 3. Quê quán
- `QueQuan`: Tên quê quán (string, null nếu chưa có)

### 4. Nghề nghiệp
- `NgheNghiep`: Tên nghề nghiệp (string, null nếu chưa có)

### 5. Gia phả
- `GiaPha`: Object (null nếu chưa thuộc gia phả nào)
  - `TenGiaPha`: Tên gia phả
  - `NguoiLap`: Tên người lập gia phả
  - `TruongToc`: Tên trưởng tộc

### 6. Hôn nhân
- `HonNhan`: Array (có thể rỗng)
  - `HoTen`: Họ tên vợ/chồng
  - `GioiTinh`: Giới tính vợ/chồng
  - `NgayGioSinh`: Ngày giờ sinh vợ/chồng
  - `NgayBatDau`: Ngày bắt đầu hôn nhân
  - `NgayKetThuc`: Ngày kết thúc hôn nhân (null nếu đang kết hôn)
  - `TrangThai`: 'Đang kết hôn' hoặc 'Đã kết thúc'

### 7. Cha mẹ
- `ChaMe`: Object (null nếu chưa có)
  - `Cha`: Object (null nếu không có)
    - `HoTen`: Họ tên cha
    - `GioiTinh`: Giới tính cha
  - `Me`: Object (null nếu không có)
    - `HoTen`: Họ tên mẹ
    - `GioiTinh`: Giới tính mẹ

### 8. Thành tích
- `ThanhTich`: Array (có thể rỗng)
  - `TenThanhTich`: Tên loại thành tích
  - `NgayDat`: Ngày đạt thành tích

## 🔍 QUERY SQL CHI TIẾT

### Query 1: Lấy thông tin cơ bản user
```sql
SELECT 
  tk.TenDangNhap,
  ltk.TenLoaiTK,
  
  tv.HoTen,
  tv.NgayGioSinh,
  tv.DiaChi,
  tv.TrangThai,
  tv.DOI,
  tv.GioiTinh,
  
  qq.TenQueQuan,
  nn.TenNgheNghiep,
  
  gp.TenGiaPha,
  nl.HoTen AS TenNguoiLap,
  tt.HoTen AS TenTruongToc
  
FROM TAIKHOAN tk
INNER JOIN THANHVIEN tv ON tk.MaTV = tv.MaTV
LEFT JOIN LOAITAIKHOAN ltk ON tk.MaLoaiTK = ltk.MaLoaiTK
LEFT JOIN QUEQUAN qq ON tv.MaQueQuan = qq.MaQueQuan
LEFT JOIN NGHENGHIEP nn ON tv.MaNgheNghiep = nn.MaNgheNghiep
LEFT JOIN CAYGIAPHA gp ON tv.MaGiaPha = gp.MaGiaPha
LEFT JOIN THANHVIEN nl ON gp.NguoiLap = nl.MaTV
LEFT JOIN THANHVIEN tt ON gp.TruongToc = tt.MaTV
WHERE tk.TenDangNhap = ?
```

### Query 2: Lấy thông tin hôn nhân
```sql
SELECT 
  tv.HoTen AS HoTenVC,
  tv.GioiTinh AS GioiTinhVC,
  tv.NgayGioSinh AS NgayGioSinhVC,
  hn.NgayBatDau,
  hn.NgayKetThuc,
  CASE 
    WHEN hn.NgayKetThuc IS NULL THEN 'Đang kết hôn'
    ELSE 'Đã kết thúc'
  END AS TrangThaiHonNhan
FROM HONNHAN hn
INNER JOIN THANHVIEN tv ON hn.MaTVVC = tv.MaTV
WHERE hn.MaTV = ?
ORDER BY hn.NgayBatDau DESC
```

### Query 3: Lấy thông tin cha mẹ
```sql
SELECT 
  cha.HoTen AS HoTenCha,
  cha.GioiTinh AS GioiTinhCha,
  me.HoTen AS HoTenMe,
  me.GioiTinh AS GioiTinhMe
FROM QUANHECON qhc
LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
WHERE qhc.MaTV = ?
```

### Query 4: Lấy danh sách thành tích
```sql
SELECT 
  ltt.TenLTT,
  gnt.NgayPhatSinh
FROM GHINHANTHANHTICH gnt
INNER JOIN LOAITHANHTICH ltt ON gnt.MaLTT = ltt.MaLTT
WHERE gnt.MaTV = ?
ORDER BY gnt.NgayPhatSinh DESC
```

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Authentication
- Route này **BẮT BUỘC** phải có `access_token` hợp lệ
- Token được gửi qua header: `Authorization: Bearer <token>`
- Middleware `accessTokenValidator` sẽ tự động verify và decode token

### 2. User Identification
- `user_id` chính là `TenDangNhap` (email) trong bảng `TAIKHOAN`
- Được lấy từ `req.decoded_authorization.user_id`
- Không cần truyền qua params hay body

### 3. Quan hệ dữ liệu
- Một user có thể có nhiều vợ/chồng (do ly hôn và tái hôn)
- Một user có thể có nhiều thành tích
- Cha và mẹ có thể null (trường hợp thủy tổ - người đầu tiên trong gia phả)
- Các thông tin như quê quán, nghề nghiệp có thể null (chưa cập nhật)

### 4. Dữ liệu trả về
- Chỉ trả về thông tin hiển thị cho người dùng
- Không trả về các mã code (MaTV, MaGiaPha, MaQueQuan...)
- Không trả về thời gian tạo (TGTaoMoi, TGLap...)
- Tất cả các trường là thông tin có thể hiển thị trực tiếp

### 5. Performance
- Query được tối ưu với LEFT JOIN để không bỏ sót dữ liệu
- Sử dụng ORDER BY để sắp xếp kết quả (hôn nhân mới nhất trước, thành tích mới nhất trước)

### 6. Bảo mật
- Không trả về `MatKhau` trong response
- Chỉ trả về thông tin của user đang đăng nhập
- Token có thời hạn (15 phút cho access_token)

## 🧪 TEST CASES

### Test Case 1: User có đầy đủ thông tin
**Điều kiện:**
- User đã đăng nhập, có token hợp lệ
- Có đầy đủ: gia phả, quê quán, nghề nghiệp, cha mẹ, vợ/chồng, thành tích

**Kỳ vọng:**
- Status: 200 OK
- Trả về đầy đủ các field, không có field null
- `TrangThai`: "Còn Sống"

### Test Case 2: User mới đăng ký
**Điều kiện:**
- User vừa đăng ký, chưa cập nhật thông tin
- Có gia phả, không có quê quán, nghề nghiệp, cha mẹ, vợ/chồng, thành tích

**Kỳ vọng:**
- Status: 200 OK
- `QueQuan`: null
- `NgheNghiep`: null
- `ChaMe`: null
- `HonNhan`: []
- `ThanhTich`: []
- `TrangThai`: "Còn Sống"

### Test Case 3: User đã mất
**Điều kiện:**
- User có `TrangThai = 'Mất'`

**Kỳ vọng:**
- Status: 200 OK
- `TrangThai`: "Mất"

### Test Case 4: Không có token
**Điều kiện:**
- Gọi API không có header Authorization

**Kỳ vọng:**
- Status: 401 Unauthorized
- Message: "Access token is required"

### Test Case 5: Token hết hạn
**Điều kiện:**
- Gọi API với token đã hết hạn (> 15 phút)

**Kỳ vọng:**
- Status: 401 Unauthorized
- Message: "jwt expired"

### Test Case 6: Token không hợp lệ
**Điều kiện:**
- Gọi API với token bị sửa đổi

**Kỳ vọng:**
- Status: 401 Unauthorized
- Message: "invalid signature" hoặc "jwt malformed"

## 📦 STRUCTURE SUMMARY

```
backend/
├── src/
│   ├── controllers/
│   │   └── users.controllers.ts         # Sửa Thêm getMeController
│   ├── services/
│   │   └── users.services.ts           # Sửa Thêm interfaces & getMe method
│   ├── routes/
│   │   └── users.routes.ts             # Sửa Thêm GET /get-me route
│   ├── constants/
│   │   └── messages.ts                 # Sửa Thêm GET_ME messages
│   └── middlewares/
│       └── users.middlewares.ts        # Sửa Sử dụng accessTokenValidator có sẵn
```

## Sửa CHECKLIST IMPLEMENTATION

- [ ] Thêm interfaces vào `users.services.ts`
- [ ] Thêm method `getMe` vào `UsersService` class
- [ ] Thêm messages vào `messages.ts`
- [ ] Thêm controller `getMeController` vào `users.controllers.ts`
- [ ] Import `getMeController` vào `users.routes.ts`
- [ ] Thêm route GET `/get-me` vào `users.routes.ts`
- [ ] Test API với Postman/Thunder Client:
  - [ ] Test với token hợp lệ
  - [ ] Test không có token
  - [ ] Test token không hợp lệ
  - [ ] Test token hết hạn
  - [ ] Kiểm tra dữ liệu trả về đầy đủ
  - [ ] Kiểm tra các trường hợp null

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi implement xong, bạn sẽ có:
1. Sửa Route GET `/users/get-me` hoạt động với authentication
2. Sửa Trả về đầy đủ thông tin cá nhân từ 10+ bảng trong database
3. Sửa Xử lý đúng các trường hợp null/empty
4. Sửa Response có cấu trúc rõ ràng, dễ sử dụng cho frontend
5. Sửa Bảo mật: chỉ user đang đăng nhập mới lấy được thông tin của mình

---

**Tài liệu được tạo**: 26/12/2025  
**Phiên bản**: 1.0  
**Tác giả**: GitHub Copilot
