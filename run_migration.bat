@echo off
echo Running database migration...
echo.
echo Please enter your MySQL root password when prompted.
echo.

mysql -u root -p automation_assessment < "%~dp0database_migration.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Migration completed successfully!
) else (
    echo.
    echo Migration failed. Please check the error messages above.
)

pause
