@echo off
echo ===================================================
echo        WhatsApp Bulk Messenger Startup Script
echo ===================================================
echo.

rem Check if dependencies are installed
if not exist "node_modules" (
  echo [INFO] Dependencies not found. Running installer...
  call install-dependencies.bat
)

rem Check for port conflicts
set PORT=3000
netstat -o -n -a | findstr ":3000 "
if %ERRORLEVEL% EQU 0 (
  echo [INFO] Port 3000 is already in use, checking for available port...
  set PORT=3001
  netstat -o -n -a | findstr ":3001 "
  if %ERRORLEVEL% EQU 0 (
    set PORT=3002
  )
  echo [INFO] Using port %PORT% to avoid conflicts.
  powershell -Command "(Get-Content .env) -replace '^PORT=.*', 'PORT=%PORT%' | Set-Content .env"
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
start "" cmd /c "timeout /t 3 >nul && start http://localhost:%PORT%"

rem Start the server
node dist/server.js

pause