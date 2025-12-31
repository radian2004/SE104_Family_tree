# 📥 Hướng Dẫn Import Database

## Yêu Cầu
- Sửa Docker đã cài đặt
- Sửa Đã chạy `docker-compose up -d` trong thư mục `backend`

## Cách 1: Dùng Script (Khuyến nghị)

### Windows
```bash
cd backend
.\import_database.bat database_backup_XXXXXX.sql
```

### Linux/Mac
```bash
cd backend
chmod +x import_database.sh
./import_database.sh database_backup_XXXXXX.sql
```

## Cách 2: Lệnh Thủ Công

```bash
docker exec -i cnpm_mysql mysql -u root -p123456 app < backend/database_backup_XXXXXX.sql
```

## Kiểm Tra Kết Quả

```bash
# Xem danh sách bảng
docker exec -it cnpm_mysql mysql -u root -p123456 -e "USE app; SHOW TABLES;"

# Đếm số thành viên
docker exec -it cnpm_mysql mysql -u root -p123456 -e "USE app; SELECT COUNT(*) FROM THANHVIEN;"
```

## Lỗi Thường Gặp

### "Can't connect to MySQL server"
```bash
# Kiểm tra container có chạy không
docker ps

# Nếu không thấy cnpm_mysql, start Docker
docker-compose up -d
```

### "ERROR 1045: Access denied"
Đảm bảo password trong `docker-compose.yml` là `123456`

### "No such file or directory"
Đảm bảo file `.sql` đặt trong thư mục `backend/`

## Sau Khi Import

Restart backend để refresh connections:
```bash
docker-compose restart
```

Hoặc nếu backend đang chạy bằng npm:
```bash
# Ctrl+C để dừng, sau đó:
npm run dev
```

---

📖 **Chi tiết đầy đủ:** Xem [DATABASE_SHARING.md](./DATABASE_SHARING.md)
