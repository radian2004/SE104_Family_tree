# 📦 Hướng Dẫn Chia Sẻ Database Cho Team

## 🔴 Vấn Đề: Dữ Liệu Bị Mất Khi Tắt Docker

### Nguyên Nhân
Bạn có thể đang dùng lệnh **SAI** để tắt Docker:

```bash
# ❌ SAI - Lệnh này XÓA HẾT volumes (bao gồm database!)
docker-compose down -v

# Sửa ĐÚNG - Lệnh này GIỮ LẠI dữ liệu
docker-compose down
```

### Giải Pháp

**Luôn luôn dùng:**
```bash
docker-compose down        # Tắt containers, GIỮ volumes
docker-compose up -d       # Khởi động lại
```

**Chỉ dùng `-v` khi muốn XÓA HẾT và BẮT ĐẦU LẠI:**
```bash
docker-compose down -v     # Tắt + XÓA HẾT dữ liệu
```

---

## 📤 Export Database (Người Gửi)

### Cách 1: Dùng Script Tự Động (Khuyến nghị)

**Windows:**
```bash
cd backend
.\export_database.bat
```

**Linux/Mac:**
```bash
cd backend
chmod +x export_database.sh
./export_database.sh
```

### Cách 2: Lệnh Thủ Công

```bash
# Export toàn bộ database (schema + data)
docker exec cnpm_mysql mysqldump -u root -p123456 app > my_backup.sql

# Hoặc với timestamp
docker exec cnpm_mysql mysqldump -u root -p123456 app > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Kết Quả

File SQL sẽ được tạo trong thư mục `backend/`:
- `database_backup_20250630_140000.sql` (nếu dùng script)
- `my_backup.sql` (nếu dùng lệnh thủ công)

**Gửi file này cho team qua:**
- Git (nếu nhỏ < 10MB)
- Google Drive / OneDrive
- Email (nếu nén .zip)

---

## 📥 Import Database (Người Nhận)

### Bước 1: Nhận File SQL
Tải file `.sql` từ team và đặt trong thư mục `backend/`

### Bước 2: Import vào Docker

**Cách 1: Dùng Script (Windows)**
```bash
cd backend
.\import_database.bat database_backup_20250630_140000.sql
```

**Cách 2: Lệnh Thủ Công**
```bash
docker exec -i cnpm_mysql mysql -u root -p123456 app < database_backup_20250630_140000.sql
```

### Bước 3: Verify
```bash
# Kiểm tra xem dữ liệu đã có chưa
docker exec -it cnpm_mysql mysql -u root -p123456 -e "USE app; SHOW TABLES;"
```

---

## 🔍 Kiểm Tra Volume

### Xem Danh Sách Volumes
```bash
docker volume ls
```

Kết quả sẽ có:
```
backend_mysql_data    # Volume này chứa TẤT CẢ dữ liệu MySQL
```

### Xem Thông Tin Volume
```bash
docker volume inspect backend_mysql_data
```

### Xóa Volume (CẨN THẬN!)
```bash
# ⚠️ CẢNH BÁO: Lệnh này XÓA HẾT dữ liệu!
docker volume rm backend_mysql_data
```

---

## Sửa Workflow Khuyến Nghị

### Khi Phát Triển (Hằng Ngày)
```bash
# 1. Sáng: Start Docker
docker-compose up -d

# 2. Làm việc cả ngày...
# (Mọi thay đổi được lưu tự động trong volume)

# 3. Tối: Stop Docker (GIỮ dữ liệu)
docker-compose down
```

### Khi Chia Sẻ Với Team (1 Tuần 1 Lần)
```bash
# 1. Export database
.\export_database.bat

# 2. Commit file SQL vào Git hoặc gửi qua Drive
git add database_backup_20250630.sql
git commit -m "chore: update database with new data"
git push

# Hoặc upload lên Google Drive và chia sẻ link
```

### Khi Nhận Database Từ Team
```bash
# 1. Pull code mới (nếu qua Git)
git pull

# 2. Import database
.\import_database.bat database_backup_20250630.sql

# 3. Restart backend để refresh connections
docker-compose restart
```

---

## 🚨 Troubleshooting

### Lỗi: "Can't connect to MySQL server"
```bash
# Kiểm tra container có chạy không
docker ps

# Nếu không có cnpm_mysql, start lại
docker-compose up -d
```

### Lỗi: "Access denied for user 'root'"
Đảm bảo password đúng: `123456` (xem `docker-compose.yml`)

### Database Import Xong Nhưng Không Có Dữ Liệu
```bash
# Kiểm tra xem file SQL có dữ liệu không
# File phải > 10KB
ls -lh database_backup_*.sql

# Nếu file quá nhỏ, có thể export bị lỗi
```

### Muốn Reset Hoàn Toàn
```bash
# 1. Stop và XÓA volumes
docker-compose down -v

# 2. Start lại (sẽ chạy init.sql từ đầu)
docker-compose up -d

# 3. Import backup nếu cần
.\import_database.bat my_backup.sql
```

---

## 📝 Ghi Chú

- **Volume `mysql_data`** trong `docker-compose.yml` tự động lưu dữ liệu
- Dữ liệu được lưu trong Docker volume, **KHÔNG** trong thư mục project
- File `init.sql` chỉ chạy **KHI TẠO CONTAINER LẦN ĐẦU**
- Backup thường xuyên để tránh mất dữ liệu!
