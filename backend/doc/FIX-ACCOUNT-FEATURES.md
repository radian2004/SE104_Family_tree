# Hướng Dẫn Sửa Lại Chức Năng Account (Đăng Ký, Đăng Nhập, Đăng Xuất)

## Vấn Đề

Sau khi cập nhật database schema trong `init.sql`, bảng `THANHVIEN` không còn có cột `MaGioiTinh` nữa mà thay bằng cột `GioiTinh` (kiểu VARCHAR(3) với giá trị 'Nam'/'Nữ'). Tuy nhiên, code backend vẫn đang sử dụng `MaGioiTinh` dẫn đến lỗi khi đăng ký.

**Lỗi hiện tại:**
```
Unknown column 'MaGioiTinh' in 'field list'
```

## Các File Cần Sửa

### 1. File: `src/models/schemas/ThanhVien.schema.ts`

**Vị trí cần sửa:** Dòng 14 và 33

**Code hiện tại:**
```typescript
interface ThanhVienType {
  MaTV?: string;
  HoTen?: string;
  NgayGioSinh?: Date;
  DiaChi?: string;
  TrangThai?: string;
  TGTaoMoi?: Date;
  DOI?: number;
  MaQueQuan?: string;
  MaNgheNghiep?: string;
  MaGioiTinh?: string;  // ❌ Sai: Không còn cột này trong DB
  MaGiaPha?: string;
}

export default class ThanhVien {
  MaTV?: string;
  HoTen: string;
  NgayGioSinh: Date;
  DiaChi: string;
  TrangThai: string;
  TGTaoMoi: Date;
  DOI: number;
  MaQueQuan: string;
  MaNgheNghiep: string;
  MaGioiTinh: string;  // ❌ Sai: Không còn cột này trong DB
  MaGiaPha?: string;

  constructor(thanhvien: ThanhVienType) {
    const date = new Date();
    this.MaTV = thanhvien.MaTV;
    this.HoTen = thanhvien.HoTen || '';
    this.NgayGioSinh = thanhvien.NgayGioSinh || new Date();
    this.DiaChi = thanhvien.DiaChi || '';
    this.TrangThai = thanhvien.TrangThai || 'Sống';
    this.TGTaoMoi = thanhvien.TGTaoMoi || date;
    this.DOI = thanhvien.DOI || 0;
    this.MaQueQuan = thanhvien.MaQueQuan || '';
    this.MaNgheNghiep = thanhvien.MaNgheNghiep || '';
    this.MaGioiTinh = thanhvien.MaGioiTinh || '';  // ❌ Sai
    this.MaGiaPha = thanhvien.MaGiaPha;
  }
}
```

**Code cần sửa thành:**
```typescript
interface ThanhVienType {
  MaTV?: string;
  HoTen?: string;
  NgayGioSinh?: Date;
  DiaChi?: string;
  TrangThai?: string;
  TGTaoMoi?: Date;
  DOI?: number;
  MaQueQuan?: string;
  MaNgheNghiep?: string;
  GioiTinh?: string;  // ✅ Đúng: VARCHAR(3) - 'Nam'/'Nữ'
  MaNguyenNhanMat?: string;
  NgayGioMat?: Date;
  MaDiaDiem?: string;
  MaGiaPha?: string;
}

export default class ThanhVien {
  MaTV?: string;
  HoTen: string;
  NgayGioSinh: Date;
  DiaChi: string;
  TrangThai: string;
  TGTaoMoi: Date;
  DOI: number;
  MaQueQuan: string;
  MaNgheNghiep: string;
  GioiTinh: string;  // ✅ Đúng: 'Nam' hoặc 'Nữ'
  MaNguyenNhanMat?: string;
  NgayGioMat?: Date;
  MaDiaDiem?: string;
  MaGiaPha?: string;

  constructor(thanhvien: ThanhVienType) {
    const date = new Date();
    this.MaTV = thanhvien.MaTV;
    this.HoTen = thanhvien.HoTen || '';
    this.NgayGioSinh = thanhvien.NgayGioSinh || new Date();
    this.DiaChi = thanhvien.DiaChi || '';
    this.TrangThai = thanhvien.TrangThai || 'Còn Sống';
    this.TGTaoMoi = thanhvien.TGTaoMoi || date;
    this.DOI = thanhvien.DOI || 0;
    this.MaQueQuan = thanhvien.MaQueQuan || '';
    this.MaNgheNghiep = thanhvien.MaNgheNghiep || '';
    this.GioiTinh = thanhvien.GioiTinh || 'Nam';  // ✅ Đúng: Mặc định 'Nam'
    this.MaNguyenNhanMat = thanhvien.MaNguyenNhanMat;
    this.NgayGioMat = thanhvien.NgayGioMat;
    this.MaDiaDiem = thanhvien.MaDiaDiem;
    this.MaGiaPha = thanhvien.MaGiaPha;
  }
}
```

---

### 2. File: `src/services/users.services.ts`

**Vị trí cần sửa:** Dòng 88-91 (hàm `register`)

**Code hiện tại:**
```typescript
async register(payload: RegisterReqBody) {
  const { name, email, password } = payload;

  // 1. Tạo thành viên mới
  const insertThanhVienSql = `
    INSERT INTO THANHVIEN (HoTen, MaGioiTinh) 
    VALUES (?, 'GT00')
  `;
  await databaseService.query(insertThanhVienSql, [name]);

  // 2. Lấy MaTV vừa tạo (trigger tự sinh)
  const [thanhVien] = await databaseService.query<RowDataPacket[]>(
    'SELECT MaTV FROM THANHVIEN ORDER BY TGTaoMoi DESC LIMIT 1'
  );
  const MaTV = thanhVien.MaTV;

  // 3. Hash password và tạo tài khoản
  const hashedPassword = hashPassword(password);
  const insertTaiKhoanSql = `
    INSERT INTO TAIKHOAN (TenDangNhap, MaTV, MatKhau, MaLoaiTK) 
    VALUES (?, ?, ?, 'LTK02')
  `;
  await databaseService.query(insertTaiKhoanSql, [email, MaTV, hashedPassword]);

  // 4. Tạo access token và refresh token
  const [access_token, refresh_token] = await this.signAccessAndRefreshToken(email);

  // 5. Lưu refresh token vào database
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + 7);

  const insertRefreshTokenSql = `
    INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) 
    VALUES (?, ?, ?)
  `;
  await databaseService.query(insertRefreshTokenSql, [refresh_token, email, expDate]);

  return {
    access_token,
    refresh_token
  };
}
```

**Code cần sửa thành:**
```typescript
async register(payload: RegisterReqBody) {
  const { name, email, password } = payload;

  // 1. Tạo thành viên mới với GioiTinh thay vì MaGioiTinh
  const insertThanhVienSql = `
    INSERT INTO THANHVIEN (HoTen, GioiTinh) 
    VALUES (?, 'Nam')
  `;
  await databaseService.query(insertThanhVienSql, [name]);

  // 2. Lấy MaTV vừa tạo (trigger tự sinh)
  const [thanhVien] = await databaseService.query<RowDataPacket[]>(
    'SELECT MaTV FROM THANHVIEN ORDER BY TGTaoMoi DESC LIMIT 1'
  );
  const MaTV = thanhVien.MaTV;

  // 3. Hash password và tạo tài khoản
  const hashedPassword = hashPassword(password);
  const insertTaiKhoanSql = `
    INSERT INTO TAIKHOAN (TenDangNhap, MaTV, MatKhau, MaLoaiTK) 
    VALUES (?, ?, ?, 'LTK03')
  `;
  await databaseService.query(insertTaiKhoanSql, [email, MaTV, hashedPassword]);

  // 4. Tạo access token và refresh token
  const [access_token, refresh_token] = await this.signAccessAndRefreshToken(email);

  // 5. Lưu refresh token vào database
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + 7);

  const insertRefreshTokenSql = `
    INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) 
    VALUES (?, ?, ?)
  `;
  await databaseService.query(insertRefreshTokenSql, [refresh_token, email, expDate]);

  return {
    access_token,
    refresh_token
  };
}
```

**Giải thích thay đổi:**
- ❌ `MaGioiTinh` → ✅ `GioiTinh` (theo schema mới trong init.sql)
- ❌ `'GT00'` → ✅ `'Nam'` (giá trị hợp lệ: 'Nam' hoặc 'Nữ')
- ❌ `'LTK02'` → ✅ `'LTK03'` (LTK03 là User, LTK02 là TruongToc theo init.sql)

---

## 3. Kiểm Tra Schema Database

Trong file `init.sql`, bảng `THANHVIEN` được định nghĩa như sau:

```sql
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
    GioiTinh VARCHAR(3), -- Nam/Nữ  ✅
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

**Lưu ý:**
- Không có cột `MaGioiTinh`
- Có cột `GioiTinh` với kiểu `VARCHAR(3)` và giá trị `'Nam'` hoặc `'Nữ'`

---

## 4. Các Chức Năng Khác Cần Kiểm Tra

### Chức năng Đăng nhập (login)
**File:** `src/services/users.services.ts` - Hàm `login`

✅ **Không cần sửa** - Logic đăng nhập chỉ làm việc với bảng `TAIKHOAN` và `REFRESH_TOKENS`, không liên quan đến cột `GioiTinh`.

```typescript
async login(email: string, password: string) {
  // 1. Tìm tài khoản
  const sql = 'SELECT * FROM TAIKHOAN WHERE TenDangNhap = ?';
  const rows = await databaseService.query<TaiKhoanRow[]>(sql, [email]);

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];

  // 2. So sánh password
  const hashedPassword = hashPassword(password);
  if (user.MatKhau !== hashedPassword) {
    return null;
  }

  // 3. Tạo tokens
  const [access_token, refresh_token] = await this.signAccessAndRefreshToken(user.TenDangNhap);

  // 4. Lưu refresh token
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + 7);

  const insertRefreshTokenSql = `
    INSERT INTO REFRESH_TOKENS (token, TenDangNhap, NgayHetHan) 
    VALUES (?, ?, ?)
  `;
  await databaseService.query(insertRefreshTokenSql, [refresh_token, user.TenDangNhap, expDate]);

  return {
    access_token,
    refresh_token,
    user: {
      TenDangNhap: user.TenDangNhap,
      MaTV: user.MaTV,
      MaLoaiTK: user.MaLoaiTK
    }
  };
}
```

---

### Chức năng Đăng xuất (logout)
**File:** `src/services/users.services.ts` - Hàm `logout`

✅ **Không cần sửa** - Logic đăng xuất chỉ xóa token trong bảng `REFRESH_TOKENS`.

```typescript
async logout(refresh_token: string) {
  const sql = 'DELETE FROM REFRESH_TOKENS WHERE token = ?';
  const result = await databaseService.query<ResultSetHeader>(sql, [refresh_token]);

  return {
    message: 'Đăng xuất thành công',
    deletedCount: result.affectedRows
  };
}
```

---

## 5. Tóm Tắt Các Thay Đổi

| File | Dòng | Thay đổi |
|------|------|----------|
| `src/models/schemas/ThanhVien.schema.ts` | 14 | `MaGioiTinh?: string;` → `GioiTinh?: string;` |
| `src/models/schemas/ThanhVien.schema.ts` | 33 | `MaGioiTinh: string;` → `GioiTinh: string;` |
| `src/models/schemas/ThanhVien.schema.ts` | 47 | `this.MaGioiTinh = thanhvien.MaGioiTinh \|\| '';` → `this.GioiTinh = thanhvien.GioiTinh \|\| 'Nam';` |
| `src/services/users.services.ts` | 89 | `INSERT INTO THANHVIEN (HoTen, MaGioiTinh)` → `INSERT INTO THANHVIEN (HoTen, GioiTinh)` |
| `src/services/users.services.ts` | 90 | `VALUES (?, 'GT00')` → `VALUES (?, 'Nam')` |
| `src/services/users.services.ts` | 101 | `VALUES (?, ?, ?, 'LTK02')` → `VALUES (?, ?, ?, 'LTK03')` |

---

## 6. Test API Sau Khi Sửa

### Test Đăng Ký
**Endpoint:** `POST http://localhost:3000/users/register`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "phuccao16",
  "email": "dthanh@example.com",
  "password": "Password1234!",
  "confirm_password": "Password1234!"
}
```

**Expected Response:** `201 Created`
```json
{
  "message": "Đăng ký thành công",
  "result": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Test Đăng Nhập
**Endpoint:** `POST http://localhost:3000/users/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "dthanh@example.com",
  "password": "Password1234!"
}
```

**Expected Response:** `200 OK`
```json
{
  "message": "Đăng nhập thành công",
  "result": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "TenDangNhap": "dthanh@example.com",
      "MaTV": "TV09",
      "MaLoaiTK": "LTK03"
    }
  }
}
```

---

### Test Đăng Xuất
**Endpoint:** `POST http://localhost:3000/users/logout`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response:** `200 OK`
```json
{
  "message": "Đăng xuất thành công",
  "deletedCount": 1
}
```

---

## 7. Kiểm Tra Database Sau Khi Đăng Ký

Kết nối vào MySQL container:
```bash
docker exec -it <container_name> mysql -u root -p123456 app
```

Query kiểm tra:
```sql
-- Xem tài khoản mới tạo
SELECT * FROM TAIKHOAN WHERE TenDangNhap = 'dthanh@example.com';

-- Xem thành viên mới tạo
SELECT * FROM THANHVIEN WHERE MaTV IN (
  SELECT MaTV FROM TAIKHOAN WHERE TenDangNhap = 'dthanh@example.com'
);

-- Xem refresh token
SELECT * FROM REFRESH_TOKENS WHERE TenDangNhap = 'dthanh@example.com';
```

**Kết quả mong đợi trong THANHVIEN:**
- Cột `GioiTinh` có giá trị `'Nam'`
- Cột `HoTen` có giá trị `'phuccao16'`
- Cột `TrangThai` có giá trị `'Còn Sống'`
- Cột `DOI` có giá trị `0`

---

## 8. Lưu Ý Quan Trọng

1. **Backup database trước khi sửa code** để tránh mất dữ liệu
2. **Restart server backend** sau khi sửa code: `npm run dev`
3. **Kiểm tra .env** để đảm bảo các biến môi trường JWT đúng
4. **Xóa dữ liệu test** nếu muốn test lại từ đầu:
   ```sql
   DELETE FROM REFRESH_TOKENS WHERE TenDangNhap = 'dthanh@example.com';
   DELETE FROM TAIKHOAN WHERE TenDangNhap = 'dthanh@example.com';
   DELETE FROM THANHVIEN WHERE HoTen = 'phuccao16';
   ```

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** 18/12/2025  
**Mục đích:** Hướng dẫn sửa lỗi account features sau khi cập nhật database schema
