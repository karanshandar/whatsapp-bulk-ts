@echo off
echo ===================================================
echo      WhatsApp Bulk Messenger Installation Script
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

echo [INFO] Creating directory structure...

rem Create main directories
if not exist "src" mkdir src
if not exist "src\config" mkdir src\config
if not exist "src\services" mkdir src\services
if not exist "src\utils" mkdir src\utils
if not exist "src\middleware" mkdir src\middleware
if not exist "src\types" mkdir src\types
if not exist "src\routes" mkdir src\routes
if not exist "public" mkdir public
if not exist "public\css" mkdir public\css
if not exist "public\js" mkdir public\js
if not exist "public\js\modules" mkdir public\js\modules
if not exist "public\images" mkdir public\images
if not exist "views" mkdir views
if not exist "uploads" mkdir uploads
if not exist "uploads\temp" mkdir uploads\temp
if not exist "data" mkdir data
if not exist "logs" mkdir logs
if not exist "dist" mkdir dist

echo [INFO] Creating blank TypeScript files...

rem Create basic TypeScript files
echo // Configuration management for WhatsApp Bulk Messenger > src\config\config.ts
echo // WhatsApp service implementation > src\services\whatsapp.service.ts
echo // Excel service implementation > src\services\excel.service.ts
echo // Message service implementation > src\services\message.service.ts
echo // Logger utility > src\utils\logger.ts
echo // Excel template generator > src\utils\template-generator.ts
echo // Error handling middleware > src\middleware\error-handler.ts
echo // Configuration type definitions > src\types\config.types.ts
echo // WhatsApp type definitions > src\types\whatsapp.types.ts
echo // Excel type definitions > src\types\excel.types.ts
echo // API routes > src\routes\api.routes.ts
echo // Express application setup > src\app.ts
echo // Main server entry point > src\server.ts

rem Create package.json if it doesn't exist
if not exist "package.json" (
  echo [INFO] Initializing new npm project...
  
  echo {> package.json
  echo   "name": "whatsapp-bulk-messenger",>> package.json
  echo   "version": "1.0.0",>> package.json
  echo   "description": "A web-based tool for sending bulk WhatsApp messages",>> package.json
  echo   "main": "dist/server.js",>> package.json
  echo   "scripts": {>> package.json
  echo     "start": "node dist/server.js",>> package.json
  echo     "dev": "ts-node src/server.ts",>> package.json
  echo     "build": "tsc",>> package.json
  echo     "watch": "tsc -w">> package.json
  echo   },>> package.json
  echo   "author": "",>> package.json
  echo   "license": "MIT">> package.json
  echo }>> package.json
)

rem Create tsconfig.json
echo [INFO] Creating TypeScript configuration...

echo {> tsconfig.json
echo   "compilerOptions": {>> tsconfig.json
echo     "target": "ES2020",>> tsconfig.json
echo     "module": "CommonJS",>> tsconfig.json
echo     "outDir": "./dist",>> tsconfig.json
echo     "rootDir": "./src",>> tsconfig.json
echo     "strict": true,>> tsconfig.json
echo     "esModuleInterop": true,>> tsconfig.json
echo     "skipLibCheck": true,>> tsconfig.json
echo     "resolveJsonModule": true>> tsconfig.json
echo   },>> tsconfig.json
echo   "include": ["src/**/*"],>> tsconfig.json
echo   "exclude": ["node_modules", "dist"]>> tsconfig.json
echo }>> tsconfig.json

rem Create client-side JavaScript modules
echo // WhatsApp connection module > public\js\modules\connection.js
echo // Excel handling module > public\js\modules\excel.js
echo // Messaging module > public\js\modules\messaging.js
echo // UI utilities module > public\js\modules\ui.js
echo // Main JavaScript entry point > public\js\main.js

rem Create basic HTML file
if not exist "views\index.html" (
  echo ^<!DOCTYPE html^>> views\index.html
  echo ^<html lang="en"^>>> views\index.html
  echo ^<head^>>> views\index.html
  echo   ^<meta charset="UTF-8"^>>> views\index.html
  echo   ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>>> views\index.html
  echo   ^<title^>WhatsApp Bulk Messenger^</title^>>> views\index.html
  echo   ^<link rel="stylesheet" href="/css/style.css"^>>> views\index.html
  echo ^</head^>>> views\index.html
  echo ^<body^>>> views\index.html
  echo   ^<div id="app"^>Loading...^</div^>>> views\index.html
  echo   ^<script src="/js/main.js"^>^</script^>>> views\index.html
  echo ^</body^>>> views\index.html
  echo ^</html^>>> views\index.html
)

rem Create empty css file
if not exist "public\css\style.css" (
  echo /* WhatsApp Bulk Messenger Styles */> public\css\style.css
)

echo [INFO] Installing dependencies...
npm install express socket.io whatsapp-web.js qrcode xlsx express-fileupload dotenv winston

echo [INFO] Installing TypeScript dependencies...
npm install --save-dev typescript ts-node @types/node @types/express @types/socket.io @types/express-fileupload

echo.
echo [SUCCESS] Installation completed!
echo.
echo To start the application, run start.bat
echo.
pause