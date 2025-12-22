@echo off
REM ============================================
REM JARVIS v2.0.0 - Script de Estado
REM ============================================
REM Muestra el estado del servidor JARVIS

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║      🤖 J.A.R.V.I.S. v2.0.0 - ESTADO DEL SISTEMA        ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Verificar si el puerto 7777 está en uso
netstat -ano | findstr :7777 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ JARVIS está CORRIENDO
    echo.
    echo 🌐 Dashboard: http://localhost:7777
    echo.
    echo 📊 Procesos activos:
    echo.
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7777') do (
        echo    🔹 PID: %%a
        for /f "tokens=1" %%b in ('tasklist ^| findstr %%a') do (
            echo       Proceso: %%b
        )
    )
) else (
    echo ❌ JARVIS NO está corriendo
    echo.
    echo ℹ️  Para iniciar JARVIS, usa: start-jarvis.bat
)

echo.
echo 📋 Información del Sistema:
echo.

REM Mostrar versión de Node.js
node --version >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Node.js:
    node --version
) else (
    echo ❌ Node.js no instalado
)

REM Mostrar información de memoria
echo.
echo 💾 Uso de Memoria:
wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value 2>nul | findstr "="

echo.
echo 📁 Directorio del Proyecto:
echo %~dp0
echo.

REM Verificar archivos clave
echo 📂 Archivos Clave:
if exist "%~dp0web-interface\backend\server.cjs" (
    echo ✅ server.cjs encontrado
) else (
    echo ❌ server.cjs NO encontrado
)

if exist "%~dp0.env" (
    echo ✅ .env encontrado
) else (
    echo ⚠️  .env NO encontrado
)

if exist "%~dp0package.json" (
    echo ✅ package.json encontrado
) else (
    echo ❌ package.json NO encontrado
)

echo.
pause
