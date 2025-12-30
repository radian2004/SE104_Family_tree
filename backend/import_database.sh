#!/bin/bash
# ===================================================
# Import MySQL Database into Docker Container
# ===================================================

if [ -z "$1" ]; then
    echo "Usage: ./import_database.sh [sql_file]"
    echo "Example: ./import_database.sh database_backup_20250630_140000.sql"
    exit 1
fi

SQL_FILE="$1"

if [ ! -f "$SQL_FILE" ]; then
    echo "Error: File '$SQL_FILE' not found!"
    exit 1
fi

echo "Importing database from $SQL_FILE into Docker container..."
docker exec -i cnpm_mysql mysql -u root -p123456 app < "$SQL_FILE"

echo ""
echo "✅ Database imported successfully!"
