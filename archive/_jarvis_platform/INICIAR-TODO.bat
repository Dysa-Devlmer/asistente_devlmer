@echo off
title J.A.R.V.I.S. MARK VII - Sistema Completo
color 0B
cls

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║           🤖 J.A.R.V.I.S. MARK VII - MARK VII                ║
echo ║                                                               ║
echo ║              Sistema Completo Iniciando...                   ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo.

echo [1/4] 🔍 Verificando dependencias...
timeout /t 1 >nul

REM Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js no está instalado
    echo    Descarga desde: https://nodejs.org
    pause
    exit /b 1
)

REM Verificar Ollama
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Ollama no encontrado - Chat IA será limitado
    echo    Descarga desde: https://ollama.ai
) else (
    echo ✅ Ollama detectado
)

echo.
echo [2/4] 🚀 Iniciando Ollama (IA Local)...
start "" "C:\Users\zeNk0\AppData\Local\Programs\Ollama\ollama.exe" serve 2>nul
timeout /t 2 >nul
echo ✅ Ollama iniciado en puerto 11434
echo.

echo [3/4] 🌐 Iniciando Backend API...
start "JARVIS Backend" cmd /k "cd web-interface\backend && node server.cjs"
timeout /t 3 >nul
echo ✅ Backend activo en http://localhost:3001
echo.

echo [4/4] 🎨 Iniciando Frontend React...
start "JARVIS Frontend" cmd /k "cd web-interface\frontend && npm run dev"
timeout /t 5 >nul
echo ✅ Frontend activo en http://localhost:5173
echo.

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║              ✅ TODOS LOS SISTEMAS OPERACIONALES             ║
echo ║                                                               ║
echo ║  📊 Panel Web: http://localhost:5173                         ║
echo ║  🔌 Backend API: http://localhost:3001                       ║
echo ║  🤖 Ollama IA: http://localhost:11434                        ║
echo ║                                                               ║
echo ║  Presiona cualquier tecla para abrir el navegador...         ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

pause >nul

echo.
echo 🌐 Abriendo panel web en el navegador...
start http://localhost:5173

echo.
echo ✅ Sistema J.A.R.V.I.S. completamente iniciado
echo.
echo 💡 Funcionalidades disponibles:
echo    - Chat con IA (Mistral local ilimitado)
echo    - Dashboard con gráficas en tiempo real
echo    - Monitor del sistema con métricas reales
echo    - Terminal integrado con comandos
echo    - Command Palette (Ctrl+K)
echo    - Notificaciones en tiempo real
echo.
echo 📝 Para detener: Cierra las ventanas de Backend y Frontend
echo.
echo "Como siempre, Señor." - J.A.R.V.I.S.
echo.
pause
