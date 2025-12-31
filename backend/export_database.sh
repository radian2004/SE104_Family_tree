#!/bin/bash
# ===================================================
# Export MySQL Database from Docker Container
# ===================================================

echo "Exporting database from Docker container..."

# Generate timestamp for filename
timestamp=$(date +%Y%m%d_%H%M%S)

# Export database
docker exec cnpm_mysql mysqldump -u root -p123456 app > "database_backup_${timestamp}.sql"

echo ""
echo "Sửa Database exported successfully!"
echo "File: database_backup_${timestamp}.sql"
echo ""
echo "You can share this file with your team."
echo "To import: docker exec -i cnpm_mysql mysql -u root -p123456 app < database_backup_${timestamp}.sql"
