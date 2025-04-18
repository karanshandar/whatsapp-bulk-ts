@echo off
echo ===================================================
echo  WhatsApp Bulk Messenger - PM2 Shutdown Script
echo ===================================================
echo.

rem Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] PM2 is not installed. Cannot stop the application.
  pause
  exit /b 1
)

rem Check if the application is running
call pm2 list | findstr "whatsapp-bulk-messenger" >nul
if %ERRORLEVEL% neq 0 (
  echo [INFO] WhatsApp Bulk Messenger is not currently running in PM2.
  pause
  exit /b 0
)

echo [INFO] Stopping WhatsApp Bulk Messenger...
call pm2 stop whatsapp-bulk-messenger

echo.
echo Choose an option:
echo 1. Just stop the application (it will restart on server reboot)
echo 2. Delete the application from PM2 (won't restart on reboot)
echo.

choice /C 12 /M "Select option"
if errorlevel 2 (
  echo.
  echo [INFO] Deleting WhatsApp Bulk Messenger from PM2...
  call pm2 delete whatsapp-bulk-messenger
  echo [INFO] Application deleted from PM2.
) else (
  echo.
  echo [INFO] Application stopped but remains in PM2 list.
  echo [INFO] It will restart on server reboot if PM2 startup is configured.
)

echo.
echo [INFO] To start again, run: start-pm2.bat
echo.

pause