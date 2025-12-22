@echo off
REM ============================================
REM JARVIS v2.0.0 - Script de Inicio
REM ============================================
REM Inicia el servidor web de JARVIS

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║      🤖 J.A.R.V.I.S. v2.0.0 - INICIANDO...              ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org
    pause
    exit /b 1
)

REM Verificar si el puerto 7777 está en uso
netstat -ano | findstr :7777 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  ADVERTENCIA: El puerto 7777 ya está en uso
    echo.
    echo ¿Deseas detener el proceso existente y reiniciar JARVIS?
    choice /C SN /M "S=Si, N=No"
    if errorlevel 2 (
        echo.
        echo ℹ️  JARVIS probablemente ya está corriendo en http://localhost:7777
        echo.
        pause
        exit /b 0
    )

    REM Detener procesos en el puerto 7777
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7777') do (
        taskkill /F /PID %%a >nul 2>nul
    )
    echo ✅ Proceso anterior detenido
    timeout /t 2 >nul
)

REM Cambiar al directorio del backend
cd /d "%~dp0web-interface\backend"

echo.
echo 🚀 Iniciando servidor JARVIS...
echo.

REM Iniciar el servidor
start "JARVIS v2.0.0 Server" cmd /k "node server.cjs"

REM Esperar 5 segundos para que el servidor inicie
timeout /t 5 >nul

echo.
echo ✅ JARVIS iniciado exitosamente
echo.
echo 🌐 Accede al dashboard en: http://localhost:7777
echo.
echo 📋 Credenciales por defecto:
echo    👤 Usuario: admin
echo    🔑 Password: jarvis2024
echo.
echo ⚠️  IMPORTANTE: Cambia la contraseña en el primer login
echo.
echo ℹ️  Para detener JARVIS, usa: stop-jarvis.bat
echo.

REM Abrir navegador automáticamente
choice /C SN /M "¿Abrir el dashboard en el navegador?"
if errorlevel 1 if not errorlevel 2 (
    start http://localhost:7777
)

pause
