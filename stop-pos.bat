@echo off
REM ================================================
REM   DETENER SISTEMA POS COMPLETO
REM ================================================

echo.
echo ================================================
echo   DETENIENDO SISTEMA POS
echo ================================================
echo.

echo [1/3] Deteniendo frontend...
taskkill /FI "WindowTitle eq POS Frontend*" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend detenido
) else (
    echo [INFO] Frontend no estaba corriendo
)

echo.
echo [2/3] Deteniendo backend...
taskkill /FI "WindowTitle eq POS Backend*" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend detenido
) else (
    echo [INFO] Backend no estaba corriendo
)

echo.
echo [3/3] Deteniendo PostgreSQL...
call scripts\stop-db.bat

echo.
echo [OK] Sistema completamente detenido
timeout /t 2 /nobreak >nul
