@echo off
REM ============================================
REM JARVIS v2.0.0 - Script de Detención
REM ============================================
REM Detiene el servidor web de JARVIS

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║      🤖 J.A.R.V.I.S. v2.0.0 - DETENIENDO...             ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Buscar procesos de Node.js en el puerto 7777
echo 🔍 Buscando procesos de JARVIS...
echo.

netstat -ano | findstr :7777 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ℹ️  No se encontraron procesos de JARVIS corriendo en el puerto 7777
    echo.
    pause
    exit /b 0
)

REM Detener todos los procesos en el puerto 7777
echo 🛑 Deteniendo servidor JARVIS...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7777') do (
    echo    Deteniendo PID %%a...
    taskkill /F /PID %%a >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo    ✅ Proceso %%a detenido
    ) else (
        echo    ⚠️  No se pudo detener el proceso %%a
    )
)

echo.
echo ✅ JARVIS detenido exitosamente
echo.
echo ℹ️  Para iniciar JARVIS nuevamente, usa: start-jarvis.bat
echo.

pause
