@echo off
echo ===================================================
echo  WhatsApp Bulk Messenger - Windows Service Uninstall
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

echo [INFO] Creating service uninstallation script...
echo const Service = require('node-windows').Service; > uninstall-service-temp.js
echo const path = require('path'); >> uninstall-service-temp.js
echo. >> uninstall-service-temp.js
echo // Create a new service object >> uninstall-service-temp.js
echo const svc = new Service({ >> uninstall-service-temp.js
echo   name: 'WhatsAppBulkMessenger', >> uninstall-service-temp.js
echo   script: path.join(__dirname, 'dist', 'server.js') >> uninstall-service-temp.js
echo }); >> uninstall-service-temp.js
echo. >> uninstall-service-temp.js
echo // Listen for uninstall events >> uninstall-service-temp.js
echo svc.on('uninstall', function() { >> uninstall-service-temp.js
echo   console.log('Service uninstalled successfully!'); >> uninstall-service-temp.js
echo }); >> uninstall-service-temp.js
echo. >> uninstall-service-temp.js
echo svc.on('error', function(err) { >> uninstall-service-temp.js
echo   console.error('Service error:', err); >> uninstall-service-temp.js
echo }); >> uninstall-service-temp.js
echo. >> uninstall-service-temp.js
echo // Uninstall the service >> uninstall-service-temp.js
echo console.log('Uninstalling WhatsApp Bulk Messenger Windows service...'); >> uninstall-service-temp.js
echo svc.uninstall(); >> uninstall-service-temp.js

echo [INFO] Uninstalling WhatsApp Bulk Messenger Windows service...
call node uninstall-service-temp.js
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Service uninstallation failed.
  pause
  exit /b 1
)

echo [INFO] Waiting for service to complete uninstallation...
timeout /t 5 /nobreak > NUL

echo [INFO] Cleaning up temporary files...
del uninstall-service-temp.js

echo.
echo [SUCCESS] WhatsApp Bulk Messenger service has been uninstalled.
echo.
echo To reinstall the service, run install-service.bat
echo.

pause