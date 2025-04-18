@echo off
echo ===================================================
echo  WhatsApp Bulk Messenger - PM2 Startup Script
echo ===================================================
echo.

rem Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] PM2 is not installed. Installing PM2 globally...
  call npm install -g pm2
  if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install PM2. Please install it manually with 'npm install -g pm2'
    pause
    exit /b 1
  )
  echo [SUCCESS] PM2 installed successfully.
)

rem Check if dependencies are installed
if not exist "node_modules" (
  echo [INFO] Dependencies not found. Running installer...
  call install-dependencies.bat
)

rem Compile TypeScript
echo [INFO] Compiling TypeScript...
call npx tsc
if %ERRORLEVEL% neq 0 (
  echo [WARNING] TypeScript compilation had errors.
  echo.
  echo These errors are related to type checking and may not affect functionality.
  echo You can choose to continue or exit to fix the errors.
  echo.
  choice /C YN /M "Continue anyway? (Y/N)"
  if errorlevel 2 (
    echo [INFO] Exiting to allow you to fix TypeScript errors.
    pause
    exit /b 1
  )
  echo [INFO] Continuing despite TypeScript errors...
) else (
  echo [SUCCESS] TypeScript compilation successful.
)

rem Check for ecosystem.config.js
if not exist "ecosystem.config.js" (
  echo [INFO] Creating PM2 ecosystem config file...
  echo module.exports = { > ecosystem.config.js
  echo   apps: [{ >> ecosystem.config.js
  echo     name: "whatsapp-bulk-messenger", >> ecosystem.config.js
  echo     script: "./dist/server.js", >> ecosystem.config.js
  echo     instances: 1, >> ecosystem.config.js
  echo     autorestart: true, >> ecosystem.config.js
  echo     watch: false, >> ecosystem.config.js
  echo     max_memory_restart: "1G", >> ecosystem.config.js
  echo     env: { >> ecosystem.config.js
  echo       NODE_ENV: "production" >> ecosystem.config.js
  echo     } >> ecosystem.config.js
  echo   }] >> ecosystem.config.js
  echo }; >> ecosystem.config.js
  echo [SUCCESS] Created ecosystem.config.js
)

rem Start the server with PM2
echo.
echo [INFO] Starting WhatsApp Bulk Messenger with PM2...
call pm2 start ecosystem.config.js

echo.
echo [INFO] Application started! Access at http://localhost:3000
echo [INFO] To monitor: pm2 monit
echo [INFO] To view logs: pm2 logs whatsapp-bulk-messenger
echo [INFO] To stop: stop-pm2.bat
echo.

rem Save PM2 process list to survive server restarts
echo [INFO] Saving PM2 process list...
call pm2 save

echo.
echo [INFO] To make WhatsApp Bulk Messenger start automatically on server boot, run:
echo       pm2 startup
echo       ^(Then run the command it outputs^)
echo.

pause