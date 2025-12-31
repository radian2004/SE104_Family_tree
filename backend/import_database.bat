@echo off
REM ===================================================
REM Import MySQL Database into Docker Container
REM ===================================================

if "%~1"=="" (
    echo Usage: import_database.bat [sql_file]
    echo Example: import_database.bat database_backup_20250630_140000.sql
    pause
    exit /b 1
)

set SQL_FILE=%~1

if not exist "%SQL_FILE%" (
    echo Error: File '%SQL_FILE%' not found!
    pause
    exit /b 1
)

echo Importing database from %SQL_FILE% into Docker container...
docker exec -i cnpm_mysql mysql -u root -p123456 app < "%SQL_FILE%"

echo.
echo Sửa Database imported successfully!
pause
