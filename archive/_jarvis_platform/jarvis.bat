@echo off
REM ⚡ JARVIS MARK VII - QUICK START SCRIPT
REM "Jarvis, we're home." - Tony Stark

echo.
echo ========================================
echo    JARVIS MARK VII - INITIALIZATION
echo ========================================
echo.
echo "Shall we begin?"
echo.

node jarvis-init.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ JARVIS initialization failed
    echo.
    pause
    exit /b %errorlevel%
)
