@echo off
echo ===================================================
echo       WhatsApp Bulk Messenger Startup Script
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

rem Check if dependencies are installed
if not exist "node_modules" (
  echo [INFO] Installing dependencies...
  call npm install
  if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install dependencies.
    echo.
    pause
    exit /b 1
  )
  echo [SUCCESS] Dependencies installed successfully.
)

rem Check if TypeScript is installed
where npx >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo [ERROR] npx command not found. This is required to run TypeScript.
  echo.
  pause
  exit /b 1
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

rem Compile TypeScript
echo [INFO] Compiling TypeScript...
call npx tsc
if %ERRORLEVEL% neq 0 (
  echo [ERROR] TypeScript compilation failed.
  echo.
  pause
  exit /b 1
)
echo [SUCCESS] TypeScript compilation successful.

rem Check if example template exists
if not exist "public/template_example.xlsx" (
  echo [INFO] Creating example Excel template...
  node -e "try { require('./dist/utils/template-generator').createExampleTemplate(); } catch(e) { console.error('Failed to create template, will be generated at runtime.'); }"
)

rem Start the server
echo.
echo [INFO] Starting WhatsApp Bulk Messenger...
echo The application will open in your web browser in a few seconds.
echo.
echo Press Ctrl+C to stop the server.
echo.

rem Open browser after a short delay
start "" cmd /c "timeout /t 3 >nul && start http://localhost:3000"

rem Start the server
node dist/server.js

pause