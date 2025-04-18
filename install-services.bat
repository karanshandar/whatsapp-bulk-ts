@echo off
echo ===================================================
echo  WhatsApp Bulk Messenger - Windows Service Install
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

echo [INFO] Installing node-windows locally...
call npm install node-windows --save

echo [INFO] Creating service installation script...
echo const Service = require('node-windows').Service; > install-service-temp.js
echo const path = require('path'); >> install-service-temp.js
echo. >> install-service-temp.js
echo // Create a new service object >> install-service-temp.js
echo const svc = new Service({ >> install-service-temp.js
echo   name: 'WhatsAppBulkMessenger', >> install-service-temp.js
echo   description: 'WhatsApp Bulk Messenger Service', >> install-service-temp.js
echo   script: path.join(__dirname, 'dist', 'server.js'), >> install-service-temp.js
echo   nodeOptions: [], >> install-service-temp.js
echo   workingDirectory: __dirname, >> install-service-temp.js
echo   allowServiceInteraction: true >> install-service-temp.js
echo }); >> install-service-temp.js
echo. >> install-service-temp.js
echo // Listen for service install events >> install-service-temp.js
echo svc.on('install', function() { >> install-service-temp.js
echo   console.log('Service installed successfully!'); >> install-service-temp.js
echo   svc.start(); >> install-service-temp.js
echo }); >> install-service-temp.js
echo. >> install-service-temp.js
echo svc.on('start', function() { >> install-service-temp.js
echo   console.log('Service started successfully!'); >> install-service-temp.js
echo }); >> install-service-temp.js
echo. >> install-service-temp.js
echo svc.on('error', function(err) { >> install-service-temp.js
echo   console.error('Service error:', err); >> install-service-temp.js
echo }); >> install-service-temp.js
echo. >> install-service-temp.js
echo // Install the service >> install-service-temp.js
echo console.log('Installing WhatsApp Bulk Messenger as a Windows service...'); >> install-service-temp.js
echo svc.install(); >> install-service-temp.js

echo [INFO] Compiling TypeScript first...
call npx tsc
if %ERRORLEVEL% neq 0 (
  echo [WARNING] TypeScript compilation had errors.
  echo But we'll try to continue anyway...
)

echo [INFO] Installing WhatsApp Bulk Messenger as a Windows service...
call node install-service-temp.js
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Service installation failed.
  pause
  exit /b 1
)

echo [INFO] Cleaning up temporary files...
del install-service-temp.js

echo.
echo [SUCCESS] WhatsApp Bulk Messenger has been installed as a Windows service.
echo It will start automatically when the system boots and continue running
echo even when you disconnect from Remote Desktop.
echo.
echo To uninstall the service, run uninstall-service.bat
echo.

pause