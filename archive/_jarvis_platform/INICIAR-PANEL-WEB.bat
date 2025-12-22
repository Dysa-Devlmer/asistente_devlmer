@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║                                                           ║
echo ║      🤖 J.A.R.V.I.S. MARK VII - PANEL WEB                ║
echo ║                                                           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo Iniciando Panel de Control Web...
echo.

cd "%~dp0"

REM Verificar que node_modules exista
if not exist "node_modules\" (
    echo ❌ Dependencias no instaladas.
    echo.
    echo Ejecutando: npm install
    call npm install
    echo.
)

REM Iniciar backend
start "JARVIS Backend" cmd /k "echo 📡 Backend API en puerto 3001 && node web-interface\backend\server.cjs"

REM Esperar 3 segundos
timeout /t 3 /nobreak > nul

REM Iniciar frontend
start "JARVIS Frontend" cmd /k "cd web-interface\frontend && echo 🎨 Frontend React en puerto 5173 && npm run dev"

echo.
echo ✅ Panel Web iniciado correctamente
echo.
echo 📍 URLs disponibles:
echo    Backend:  http://localhost:3001/api
echo    Frontend: http://localhost:5173
echo.
echo 💡 Se abrirán dos ventanas de terminal:
echo    - Backend (puerto 3001)
echo    - Frontend (puerto 5173)
echo.
pause
