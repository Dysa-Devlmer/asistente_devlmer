@echo off
REM ===============================================
REM Stop POS System (Frontend + Backend + PostgreSQL)
REM ===============================================

echo.
echo ================================
echo Stopping POS System
echo ================================
echo.

REM Step 1: Stop Frontend (Vite Dev Server)
echo [1/3] Stopping Frontend...
for /f "tokens=2" %%i in ('tasklist ^| findstr /i "node.exe"') do (
    netstat -ano | findstr ":5173" | findstr "%%i" >nul 2>&1
    if not errorlevel 1 (
        echo Killing Vite process (PID: %%i)
        taskkill /PID %%i /F >nul 2>&1
    )
)
echo Frontend stopped
echo.

REM Step 2: Stop Backend (API + WebSocket)
echo [2/3] Stopping Backend...
for /f "tokens=2" %%i in ('tasklist ^| findstr /i "node.exe"') do (
    netstat -ano | findstr ":7777" | findstr "%%i" >nul 2>&1
    if not errorlevel 1 (
        echo Killing Backend process (PID: %%i)
        taskkill /PID %%i /F >nul 2>&1
    )
)
echo Backend stopped
echo.

REM Step 3: Stop PostgreSQL
echo [3/3] Stopping PostgreSQL...
cd /d "%~dp0"
call stop-db.bat
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: PostgreSQL may not have stopped properly
) else (
    echo PostgreSQL stopped
)
echo.

REM Kill any remaining node processes (optional)
echo Checking for remaining node processes...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo WARNING: Some node.exe processes are still running
    choice /C YN /M "Kill all node.exe processes?"
    if errorlevel 2 goto :skip_kill
    if errorlevel 1 (
        taskkill /F /IM node.exe >nul 2>&1
        echo All node processes killed
    )
)
:skip_kill

echo.
echo ================================
echo POS System Stopped
echo ================================
echo.

pause
