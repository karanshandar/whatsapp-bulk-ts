@echo off
echo ===================================================
echo  WhatsApp Bulk Messenger - Windows Startup Setup
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

rem Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] PM2 is not installed. Please run start-pm2.bat first.
  pause
  exit /b 1
)

echo [INFO] Setting up WhatsApp Bulk Messenger to start on Windows boot...

rem Get absolute path to the current directory
set "CURRENT_DIR=%CD%"
echo [INFO] Application directory: %CURRENT_DIR%

rem Save the PM2 process list to ensure our app is included
echo [INFO] Saving current PM2 process list...
call pm2 save

rem Create startup script in Windows Startup folder
echo [INFO] Creating startup entry...

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "STARTUP_SCRIPT=%STARTUP_FOLDER%\StartWhatsAppMessenger.bat"

echo @echo off > "%STARTUP_SCRIPT%"
echo cd /d "%CURRENT_DIR%" >> "%STARTUP_SCRIPT%"
echo call pm2 resurrect >> "%STARTUP_SCRIPT%"
echo exit >> "%STARTUP_SCRIPT%"

if exist "%STARTUP_SCRIPT%" (
  echo [SUCCESS] Created startup script at: %STARTUP_SCRIPT%
) else (
  echo [ERROR] Failed to create startup script.
  pause
  exit /b 1
)

rem Alternatively, create a scheduled task to run at startup
echo [INFO] Creating a scheduled task as backup method...
schtasks /Create /SC ONSTART /TN "WhatsAppBulkMessenger" /TR "cmd.exe /c cd /d \"%CURRENT_DIR%\" && pm2 resurrect" /RU SYSTEM /F
if %ERRORLEVEL% equ 0 (
  echo [SUCCESS] Created scheduled task "WhatsAppBulkMessenger"
) else (
  echo [WARNING] Failed to create scheduled task. Using only startup folder method.
)

echo.
echo [SUCCESS] Setup complete! WhatsApp Bulk Messenger will start automatically on system boot.
echo.

echo To disable startup:
echo 1. Delete the file: %STARTUP_SCRIPT%
echo 2. Run: schtasks /Delete /TN "WhatsAppBulkMessenger" /F
echo.

pause