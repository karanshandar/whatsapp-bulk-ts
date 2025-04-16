@echo off
echo ===================================================
echo      WhatsApp Bulk Messenger Dependencies Setup
echo ===================================================
echo.

rem Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Node.js is not installed or not in your PATH.
  echo Please install Node.js from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

rem Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] npm is not installed or not in your PATH.
  echo Please install Node.js from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

echo [INFO] Creating required directories...
if not exist "uploads" mkdir uploads
if not exist "uploads\temp" mkdir uploads\temp
if not exist "data" mkdir data
if not exist "logs" mkdir logs
if not exist "dist" mkdir dist

echo [INFO] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
  echo [ERROR] Failed to install dependencies.
  echo Trying again with --no-fund flag...
  call npm install --no-fund
)

echo [INFO] Installing TypeScript definitions for qrcode...
call npm install --save-dev @types/qrcode
if %ERRORLEVEL% neq 0 (
  echo [WARN] Failed to install @types/qrcode. Creating a type declaration file instead...
  if not exist "src\types" mkdir src\types
  if not exist "src\types\qrcode.d.ts" (
    echo declare module 'qrcode'; > src\types\qrcode.d.ts
    echo [INFO] Created qrcode type definition file.
  )
)

rem Create .env file if it doesn't exist
if not exist ".env" (
  echo [INFO] Creating default .env file...
  (
    echo # WhatsApp Bulk Messenger Configuration
    echo PORT=3000
    echo LOG_LEVEL=info
    echo.
    echo # WhatsApp Configuration (optional - can be set through the UI)
    echo WHATSAPP_CLIENT_ID=
    echo.
    echo # Message Settings
    echo DELAY_BETWEEN_MESSAGES=3000
    echo MAX_RETRIES=3
    echo RETRY_DELAY=5000
    echo.
    echo # Storage Settings
    echo DATA_DIR=./data
  ) > .env
  echo [SUCCESS] Default .env file created.
)

echo.
echo [SUCCESS] Dependencies installation completed!
echo.
echo You can now run start-app.bat to compile and start the application.
echo.
pause