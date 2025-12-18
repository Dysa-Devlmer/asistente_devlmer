@echo off
REM ================================================
REM   SISTEMA POS - EJECUTABLE PRINCIPAL
REM   MODO: DESARROLLO
REM   En produccion: eliminar 'pause' y usar servicio
REM ================================================

title POS - Sistema Integrado
color 0A

echo.
echo ================================================
echo   SISTEMA POS - INICIANDO
echo ================================================
echo.

REM Arrancar PostgreSQL embebido
echo [1/3] Iniciando base de datos embebida...
call scripts\start-db.bat
if %errorlevel% neq 0 (
    echo ERROR: No se pudo iniciar PostgreSQL
    pause
    exit /b 1
)

echo.
echo [2/3] Iniciando backend...
cd backend
start "POS Backend" cmd /k "npm start"

timeout /t 5 /nobreak >nul

echo.
echo [3/3] Sistema listo
echo.
echo ================================================
echo   POS CORRIENDO (MODO DEV)
echo ================================================
echo   Backend:    http://localhost:3000
echo   PostgreSQL: localhost:5433
echo ================================================
echo.
echo [DEV MODE] Presiona cualquier tecla para detener...
echo.
pause >nul

REM Detener todo
call scripts\stop-db.bat
taskkill /FI "WindowTitle eq POS Backend*" /F >nul 2>&1

echo.
echo Sistema detenido.
timeout /t 2 /nobreak >nul
