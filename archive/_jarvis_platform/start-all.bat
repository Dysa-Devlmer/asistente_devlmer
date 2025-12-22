@echo off
REM Script de inicio rápido para JARVIS Sistema Completo

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║    🚀 Iniciando JARVIS Sistema Completo                 ║
echo ║                                                           ║
echo ║    JARVIS Core + Panel Web + Monitoreo                   ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

echo 📝 Verificando instalación...
if not exist "node_modules\" (
    echo ❌ node_modules no encontrado. Ejecutando npm install...
    call npm install
)

echo.
echo ✅ Abriendo terminales...
echo.

REM Terminal 1: JARVIS Protected
echo 🤖 [1/3] Iniciando JARVIS Core (modo protegido)...
start "JARVIS Core - Protected Mode" cmd /k "npm run protected"

REM Esperar 2 segundos
timeout /t 2 /nobreak >nul

REM Terminal 2: Panel Web Protected
echo 🌐 [2/3] Iniciando Panel Web (puerto 7777)...
start "JARVIS Panel Web - Port 7777" cmd /k "npm run panel"

REM Esperar 3 segundos
timeout /t 3 /nobreak >nul

REM Terminal 3: Monitoreo de Logs
echo 📊 [3/3] Iniciando monitor de logs...
start "JARVIS Logs Monitor" cmd /k "echo Esperando logs... && timeout /t 5 /nobreak >nul && powershell -Command \"Get-Content logs\guardian.log -Wait -Tail 20\""

echo.
echo ════════════════════════════════════════════════════════════
echo.
echo ✅ SISTEMA INICIADO COMPLETAMENTE
echo.
echo 📍 Servicios activos:
echo    • JARVIS Core (Terminal 1)
echo    • Panel Web: http://localhost:7777
echo    • Frontend: http://localhost:5173
echo    • Logs (Terminal 3)
echo.
echo 💡 Comandos útiles:
echo    • En JARVIS: "status" - Ver estado del sistema
echo    • En JARVIS: "memory" - Ver uso de memoria
echo    • En JARVIS: "gc" - Limpiar memoria
echo    • En JARVIS: "salir" - Cerrar de forma segura
echo.
echo 🛡️ Protecciones activas:
echo    ✅ Auto-restart si JARVIS se cierra
echo    ✅ Garbage Collection cada 20 segundos
echo    ✅ Monitoreo de memoria cada 5 segundos
echo    ✅ Logs completos en logs/
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo 🎩 Como siempre, Señor Solier. ⚡
echo.
echo Presiona cualquier tecla para abrir el panel web en el navegador...
pause >nul

REM Abrir navegador
start http://localhost:7777

echo.
echo ✅ Panel web abierto en el navegador
echo.
echo 📝 Para detener el sistema:
echo    1. Cierra cada terminal con Ctrl+C
echo    2. O ejecuta "salir" en JARVIS Core
echo.
