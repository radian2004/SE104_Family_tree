# 🔧 Fix Lỗi "Incorrect arguments to mysqld_stmt_execute" - Tra Cứu Thành Viên

> **Ngày tạo:** 21/12/2024  
> **Lỗi:** "Incorrect arguments to mysqld_stmt_execute"  
> **Nguyên nhân:** Lỗi xử lý parameters trong SQL query

---

## 🐛 Mô Tả Lỗi

### Lỗi Postman
```json
{
  "message": "Tra cứu thành viên thất bại",
  "error": "Incorrect arguments to mysqld_stmt_execute"
}
```

### Nguyên Nhân

Lỗi xảy ra do **2 vấn đề** trong method `traCuuThanhVien`:

1. **Vấn đề 1:** Cách lấy kết quả từ `databaseService.query()` sai
   - Code hiện tại: `const countRows = await databaseService.query<any[]>(countSql, params);`
   - Vấn đề: Không biết `databaseService.query()` trả về `[rows, fields]` hay chỉ `rows`

2. **Vấn đề 2:** Parameters `limit` và `offset` có thể là string hoặc undefined
   - MySQL yêu cầu LIMIT/OFFSET phải là số nguyên dương
   - Nếu truyền string hoặc NaN sẽ gây lỗi

---

## ✅ Giải Pháp

### CÁCH 1: Sửa Nhanh (Recommended)

**File:** `backend/src/services/thanhvien.services.ts`

**Tìm đoạn code (khoảng dòng 593-710):**

```typescript
  async traCuuThanhVien(query: TraCuuThanhVienQuery): Promise<TraCuuThanhVienResponse> {
    // ... code phía trên giữ nguyên ...
    
    // [3] Query đếm tổng số record (cho pagination)
    const countSql = `
      SELECT COUNT(*) as total
      FROM THANHVIEN tv
      WHERE ${whereClause}
    `;
    
    const countRows = await databaseService.query<any[]>(countSql, params);
    const total = countRows[0]?.total || 0;
    
    // ... phần tiếp theo ...
```

**Thay thế bằng:**

```typescript
  async traCuuThanhVien(query: TraCuuThanhVienQuery): Promise<TraCuuThanhVienResponse> {
    try {
      // [1] Xây dựng điều kiện WHERE
      const conditions: string[] = ['1=1'];
      const params: any[] = [];
      
      if (query.search) {
        conditions.push('(tv.HoTen LIKE ? OR tv.MaTV LIKE ?)');
        params.push(`%${query.search}%`, `%${query.search}%`);
      }
      
      if (query.doi !== undefined) {
        conditions.push('tv.DOI = ?');
        params.push(query.doi);
      }
      
      if (query.maGiaPha) {
        conditions.push('tv.MaGiaPha = ?');
        params.push(query.maGiaPha);
      }
      
      if (query.trangThai) {
        conditions.push('tv.TrangThai = ?');
        params.push(query.trangThai);
      }
      
      const whereClause = conditions.join(' AND ');
      
      // [2] Xây dựng ORDER BY
      let orderBy = 'tv.DOI ASC, tv.TGTaoMoi ASC';
      
      if (query.sortBy) {
        const order = query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        
        switch (query.sortBy) {
          case 'doi':
            orderBy = `tv.DOI ${order}`;
            break;
          case 'ngaySinh':
            orderBy = `tv.NgayGioSinh ${order}`;
            break;
          case 'hoTen':
            orderBy = `tv.HoTen ${order}`;
            break;
        }
      }
      
      // [3] ✅ FIX: Query đếm tổng số record
      const countSql = `
        SELECT COUNT(*) as total
        FROM THANHVIEN tv
        WHERE ${whereClause}
      `;
      
      // ✅ FIX: Xử lý kết quả đúng cách
      const countResult = await databaseService.query<any[]>(countSql, params);
      // Kiểm tra xem result trả về [rows, fields] hay chỉ rows
      const countRows = Array.isArray(countResult[0]) ? countResult[0] : countResult;
      const total = countRows[0]?.total || 0;
      
      // [4] ✅ FIX: Tính toán pagination với validation
      const page = Math.max(1, parseInt(String(query.page || 1)));
      const limit = Math.max(1, Math.min(100, parseInt(String(query.limit || 10))));
      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);
      
      // [5] Query lấy dữ liệu với JOIN
      const dataSql = `
        SELECT 
          tv.MaTV,
          tv.HoTen,
          tv.NgayGioSinh,
          tv.DOI,
          qhc.MaTVCha,
          qhc.MaTVMe,
          cha.HoTen AS TenCha,
          me.HoTen AS TenMe
        FROM THANHVIEN tv
        LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
        LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
        LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;
      
      // ✅ FIX: Đảm bảo limit và offset là số nguyên
      const dataParams = [...params, limit, offset];
      const dataResult = await databaseService.query<any[]>(dataSql, dataParams);
      
      // ✅ FIX: Xử lý kết quả đúng cách
      const rows = Array.isArray(dataResult[0]) ? dataResult[0] : dataResult;
      
      // [6] Format kết quả với STT
      const data: TraCuuThanhVienResult[] = rows.map((row, index) => ({
        STT: offset + index + 1,
        MaTV: row.MaTV,
        HoTen: row.HoTen,
        NgayGioSinh: row.NgayGioSinh,
        DOI: row.DOI,
        TenCha: row.TenCha || null,
        TenMe: row.TenMe || null,
        MaCha: row.MaTVCha || null,
        MaMe: row.MaTVMe || null
      }));
      
      // [7] Trả về kết quả
      return {
        message: data.length > 0 ? 'Tra cứu thành viên thành công' : 'Không tìm thấy thành viên',
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      };
      
    } catch (error: any) {
      console.error('Lỗi traCuuThanhVien service:', error);
      throw new Error(error.message || 'Lỗi không xác định khi tra cứu thành viên');
    }
  }
```

---

### CÁCH 2: Sửa Đơn Giản Hơn (Nếu Cách 1 Không Hoạt Động)

Nếu vẫn gặp lỗi, có thể do `databaseService.query()` có cách hoạt động khác. Hãy thử cách này:

**File:** `backend/src/services/thanhvien.services.ts`

**Thay thế toàn bộ method `traCuuThanhVien`:**

```typescript
  async traCuuThanhVien(query: TraCuuThanhVienQuery): Promise<TraCuuThanhVienResponse> {
    try {
      // [1] Validation và chuẩn hóa input
      const page = Math.max(1, parseInt(String(query.page || 1)) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(String(query.limit || 10)) || 10));
      const offset = (page - 1) * limit;
      
      // [2] Xây dựng base query
      let whereClauses: string[] = [];
      let queryParams: any[] = [];
      
      // Tìm kiếm
      if (query.search && query.search.trim()) {
        whereClauses.push('(tv.HoTen LIKE ? OR tv.MaTV LIKE ?)');
        const searchPattern = `%${query.search.trim()}%`;
        queryParams.push(searchPattern, searchPattern);
      }
      
      // Lọc đời
      if (query.doi !== undefined && !isNaN(Number(query.doi))) {
        whereClauses.push('tv.DOI = ?');
        queryParams.push(Number(query.doi));
      }
      
      // Lọc gia phả
      if (query.maGiaPha && query.maGiaPha.trim()) {
        whereClauses.push('tv.MaGiaPha = ?');
        queryParams.push(query.maGiaPha.trim());
      }
      
      // Lọc trạng thái
      if (query.trangThai && query.trangThai.trim()) {
        whereClauses.push('tv.TrangThai = ?');
        queryParams.push(query.trangThai.trim());
      }
      
      const whereSQL = whereClauses.length > 0 ? whereClauses.join(' AND ') : '1=1';
      
      // [3] Xây dựng ORDER BY
      let orderBySQL = 'tv.DOI ASC, tv.TGTaoMoi ASC';
      
      if (query.sortBy) {
        const orderDirection = query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        
        if (query.sortBy === 'doi') {
          orderBySQL = `tv.DOI ${orderDirection}`;
        } else if (query.sortBy === 'ngaySinh') {
          orderBySQL = `tv.NgayGioSinh ${orderDirection}`;
        } else if (query.sortBy === 'hoTen') {
          orderBySQL = `tv.HoTen ${orderDirection}`;
        }
      }
      
      // [4] Đếm tổng số records
      const countSQL = `SELECT COUNT(*) as total FROM THANHVIEN tv WHERE ${whereSQL}`;
      
      const countResultRaw = await databaseService.query<any[]>(countSQL, queryParams);
      // Handle cả 2 trường hợp: [rows, fields] hoặc rows
      const countData = Array.isArray(countResultRaw[0]) && 'total' in countResultRaw[0][0] 
        ? countResultRaw[0] 
        : countResultRaw;
      
      const total = Number(countData[0]?.total || 0);
      const totalPages = Math.ceil(total / limit);
      
      // [5] Lấy dữ liệu
      const dataSQL = `
        SELECT 
          tv.MaTV,
          tv.HoTen,
          tv.NgayGioSinh,
          tv.DOI,
          qhc.MaTVCha,
          qhc.MaTVMe,
          cha.HoTen AS TenCha,
          me.HoTen AS TenMe
        FROM THANHVIEN tv
        LEFT JOIN QUANHECON qhc ON tv.MaTV = qhc.MaTV
        LEFT JOIN THANHVIEN cha ON qhc.MaTVCha = cha.MaTV
        LEFT JOIN THANHVIEN me ON qhc.MaTVMe = me.MaTV
        WHERE ${whereSQL}
        ORDER BY ${orderBySQL}
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      // ⚠️ QUAN TRỌNG: Không dùng ? cho LIMIT/OFFSET, dùng template string
      const dataResultRaw = await databaseService.query<any[]>(dataSQL, queryParams);
      
      // Handle kết quả
      const dataRows = Array.isArray(dataResultRaw[0]) && dataResultRaw[0].length > 0 && 'MaTV' in dataResultRaw[0][0]
        ? dataResultRaw[0]
        : dataResultRaw;
      
      // [6] Format kết quả
      const data: TraCuuThanhVienResult[] = dataRows.map((row: any, index: number) => ({
        STT: offset + index + 1,
        MaTV: row.MaTV,
        HoTen: row.HoTen,
        NgayGioSinh: row.NgayGioSinh,
        DOI: row.DOI,
        TenCha: row.TenCha || null,
        TenMe: row.TenMe || null,
        MaCha: row.MaTVCha || null,
        MaMe: row.MaTVMe || null
      }));
      
      // [7] Trả về
      return {
        message: data.length > 0 ? 'Tra cứu thành viên thành công' : 'Không tìm thấy thành viên',
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      };
      
    } catch (error: any) {
      console.error('❌ Lỗi traCuuThanhVien:', error);
      throw error;
    }
  }
```

**⚠️ QUAN TRỌNG:** Cách 2 này sử dụng template string cho `LIMIT ${limit} OFFSET ${offset}` thay vì placeholder `?` để tránh lỗi type mismatch.

---

## 🔍 Debugging

Nếu vẫn gặp lỗi, thêm console.log để debug:

```typescript
  async traCuuThanhVien(query: TraCuuThanhVienQuery): Promise<TraCuuThanhVienResponse> {
    try {
      console.log('📥 Input query:', JSON.stringify(query, null, 2));
      
      const page = Math.max(1, parseInt(String(query.page || 1)) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(String(query.limit || 10)) || 10));
      const offset = (page - 1) * limit;
      
      console.log('📊 Pagination:', { page, limit, offset });
      
      // ... rest of code ...
      
      console.log('🔍 Count SQL:', countSQL);
      console.log('📝 Count Params:', queryParams);
      
      const countResultRaw = await databaseService.query<any[]>(countSQL, queryParams);
      console.log('✅ Count Result Raw:', countResultRaw);
      
      // ... rest of code ...
      
      console.log('🔍 Data SQL:', dataSQL);
      console.log('📝 Data Params:', queryParams);
      
      const dataResultRaw = await databaseService.query<any[]>(dataSQL, queryParams);
      console.log('✅ Data Result Raw:', dataResultRaw);
      
      // ... rest of code ...
      
    } catch (error: any) {
      console.error('❌ Lỗi chi tiết:', error);
      throw error;
    }
  }
```

---

## 📋 Checklist Sau Khi Sửa

- [ ] Backup file `thanhvien.services.ts` gốc
- [ ] Apply code fix (Cách 1 hoặc Cách 2)
- [ ] **Restart server:** `npm run dev`
- [ ] Test trên Postman: `GET http://localhost:3000/thanhvien/tra-cuu`
- [ ] Test với params: `GET http://localhost:3000/thanhvien/tra-cuu?page=1&limit=5`
- [ ] Test search: `GET http://localhost:3000/thanhvien/tra-cuu?search=Nguyễn`
- [ ] Kiểm tra console log để xem query SQL
- [ ] Xóa các console.log sau khi debug xong

---

## 🎯 Kết Quả Mong Đợi

**Request:**
```
GET http://localhost:3000/thanhvien/tra-cuu
```

**Response (200 OK):**
```json
{
  "message": "Tra cứu thành viên thành công",
  "data": [
    {
      "STT": 1,
      "MaTV": "TV01",
      "HoTen": "Nguyễn Văn Tổ",
      "NgayGioSinh": "1920-05-15T08:00:00.000Z",
      "DOI": 1,
      "TenCha": null,
      "TenMe": null,
      "MaCha": null,
      "MaMe": null
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## 🆘 Nếu Vẫn Không Được

### Kiểm Tra databaseService

Mở file `backend/src/services/database.services.ts` và kiểm tra:

```typescript
// Kiểm tra method query trả về gì
async query<T>(sql: string, params?: any[]): Promise<T> {
  const connection = await this.getConnection();
  
  // Có thể là một trong các format sau:
  // return connection.query(sql, params);           // Trả về [rows, fields]
  // return (await connection.query(sql, params))[0]; // Trả về rows
  // return connection.execute(sql, params);         // Trả về [rows, fields]
}
```

Nếu method trả về `[rows, fields]`, dùng Cách 1.  
Nếu method trả về chỉ `rows`, đơn giản hóa code:

```typescript
const countRows = await databaseService.query<any[]>(countSql, params);
const total = countRows[0]?.total || 0;

const rows = await databaseService.query<any[]>(dataSql, dataParams);
// Dùng rows trực tiếp
```

---

> **Tác giả:** GitHub Copilot  
> **Phiên bản:** 1.0  
> **Ngày tạo:** 21/12/2024  
> **Mức độ ưu tiên:** 🔴 **CAO** - Cần fix ngay
