@echo off
echo ===================================================
echo    WhatsApp Bulk Messenger Uninstallation Script
echo ===================================================
echo.
echo WARNING: This will delete all application data including:
echo  - Uploaded Excel files
echo  - WhatsApp session data
echo  - Log files
echo  - Application configuration
echo.
echo Your source code will NOT be deleted.
echo.
set /p CONFIRM=Are you sure you want to continue? (Y/N): 

if /i "%CONFIRM%" neq "Y" (
  echo.
  echo Uninstallation cancelled.
  echo.
  pause
  exit /b 0
)

echo.
echo [INFO] Cleaning up application data...

rem Remove data directories
if exist "uploads" (
  echo Removing uploaded files...
  rmdir /s /q uploads
)

if exist "data" (
  echo Removing WhatsApp session data...
  rmdir /s /q data
)

if exist "logs" (
  echo Removing log files...
  rmdir /s /q logs
)

if exist "dist" (
  echo Removing compiled TypeScript files...
  rmdir /s /q dist
)

rem Remove config files
if exist "config.json" (
  echo Removing configuration file...
  del /f /q config.json
)

if exist ".env" (
  echo Removing environment configuration...
  del /f /q .env
)

if exist "message_status.json" (
  echo Removing message status file...
  del /f /q message_status.json
)

echo.
echo [SUCCESS] Application data has been removed.
echo The source code remains intact.
echo.
echo To reinstall the application, run install.bat
echo.
pause