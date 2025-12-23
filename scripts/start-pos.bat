@echo off
REM ===============================================
REM Start POS System (PostgreSQL + Backend + Frontend)
REM ===============================================

echo.
echo ================================
echo Starting POS System
echo ================================
echo.

REM Check if already running
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo WARNING: Node.exe processes already running
    echo Please stop existing processes first with stop-pos.bat
    pause
    exit /b 1
)

REM Step 1: Start PostgreSQL
echo [1/3] Starting PostgreSQL...
cd /d "%~dp0"
call start-db.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start PostgreSQL
    pause
    exit /b 1
)
echo PostgreSQL started successfully on port 4306
echo.

REM Wait for PostgreSQL to be ready
timeout /t 3 /nobreak >nul

REM Step 2: Start Backend (API + WebSocket)
echo [2/3] Starting Backend (API + WebSocket)...
cd /d "%~dp0\..\backend"
start "POS Backend" cmd /k "npm run dev"
echo Backend starting on http://localhost:7777
echo.

REM Wait for backend to initialize
timeout /t 5 /nobreak >nul

REM Step 3: Start Frontend (Vite Dev Server)
echo [3/3] Starting Frontend (Vite)...
cd /d "%~dp0\..\frontend"
start "POS Frontend" cmd /k "npm run dev"
echo Frontend starting on http://localhost:5173
echo.

echo ================================
echo POS System Started Successfully
echo ================================
echo.
echo Services:
echo   - PostgreSQL:  localhost:4306
echo   - Backend API: http://localhost:7777
echo   - Frontend:    http://localhost:5173
echo.
echo Press Ctrl+C in each terminal to stop services
echo Or run stop-pos.bat to stop all services
echo.

pause
