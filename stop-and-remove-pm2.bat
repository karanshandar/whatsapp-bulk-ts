@echo off
echo ===================================================
echo  WhatsApp Bulk Messenger - Remove Windows Startup
echo ===================================================
echo.

rem Check if running as administrator
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo [ERROR] This script must be run as Administrator.
  echo Please right-click this file and select "Run as administrator".
  pause
  exit /b 1
)

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "STARTUP_SCRIPT=%STARTUP_FOLDER%\StartWhatsAppMessenger.bat"

echo [INFO] Removing startup configuration...

rem Remove startup script if it exists
if exist "%STARTUP_SCRIPT%" (
  del "%STARTUP_SCRIPT%"
  echo [SUCCESS] Removed startup script from: %STARTUP_SCRIPT%
) else (
  echo [INFO] No startup script found in startup folder.
)

rem Remove scheduled task if it exists
schtasks /Query /TN "WhatsAppBulkMessenger" >nul 2>&1
if %ERRORLEVEL% equ 0 (
  schtasks /Delete /TN "WhatsAppBulkMessenger" /F
  echo [SUCCESS] Removed scheduled task "WhatsAppBulkMessenger"
) else (
  echo [INFO] No scheduled task found.
)

echo.
echo [SUCCESS] WhatsApp Bulk Messenger will no longer start automatically on system boot.
echo.
echo You can set up startup again by running setup-windows-startup.bat
echo.

pause