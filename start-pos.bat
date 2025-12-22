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

REM Cargar variables desde .env
call "%~dp0scripts\\load-env.bat"
if %errorlevel% neq 0 exit /b 1

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
cd /d "%~dp0backend"
start "POS Backend" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo [3/3] Iniciando frontend...
cd /d "%~dp0web-interface\frontend"
start "POS Frontend" cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo [4/4] Sistema listo
echo.
echo ================================================
echo   POS CORRIENDO (MODO DEV)
echo ================================================
echo   Backend:    http://localhost:3000
echo   Frontend:   http://localhost:5173
echo   PostgreSQL: localhost:%PGPORT%
echo ================================================
echo.
echo [DEV MODE] Presiona cualquier tecla para detener...
echo.
pause >nul

REM Detener todo
call scripts\stop-db.bat
taskkill /FI "WindowTitle eq POS Backend*" /F >nul 2>&1
taskkill /FI "WindowTitle eq POS Frontend*" /F >nul 2>&1

echo.
echo Sistema detenido.
timeout /t 2 /nobreak >nul
