@echo off
REM ===================================================
REM Export MySQL Database from Docker Container
REM ===================================================
echo Exporting database from Docker container...

REM Generate timestamp for filename
set timestamp=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%

REM Export database
docker exec cnpm_mysql mysqldump -u root -p123456 app > "database_backup_%timestamp%.sql"

echo.
echo Sửa Database exported successfully!
echo File: database_backup_%timestamp%.sql
echo.
echo You can share this file with your team.
echo To import: docker exec -i cnpm_mysql mysql -u root -p123456 app < database_backup_XXXXXX.sql
pause
