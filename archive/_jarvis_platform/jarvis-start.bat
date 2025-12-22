@echo off
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║           🤖 J.A.R.V.I.S. MARK VII - STARTUP                 ║
echo ║                                                               ║
echo ║           "Activating all systems, sir..."                   ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Verificar si Ollama está instalado
echo [1/4] Verificando Ollama...
where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ollama no está instalado
    echo    Descarga Ollama desde: https://ollama.com/download
    pause
    exit /b 1
)
echo ✅ Ollama encontrado

REM Iniciar Ollama en background
echo.
echo [2/4] Iniciando Ollama...
start /B "" "C:\Users\zeNk0\AppData\Local\Programs\Ollama\ollama.exe" serve >nul 2>&1
timeout /t 3 /nobreak >nul
echo ✅ Ollama iniciado

REM Verificar que Ollama responde
echo.
echo [3/4] Verificando conexión con Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Ollama no responde, esperando...
    timeout /t 5 /nobreak >nul
)
echo ✅ Ollama operacional

REM Iniciar JARVIS (backend + frontend)
echo.
echo [4/4] Iniciando JARVIS...
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║  Backend:  http://localhost:7777                             ║
echo ║  Frontend: http://localhost:5173 (o 5174)                    ║
echo ║                                                               ║
echo ║  Presiona Ctrl+C en ambas ventanas para detener JARVIS      ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM Abrir dos ventanas: una para backend, otra para frontend
start "JARVIS Backend" cmd /k "cd web-interface\backend && node server.cjs"
timeout /t 2 /nobreak >nul
start "JARVIS Frontend" cmd /k "cd web-interface\frontend && npm run dev"

REM Esperar 5 segundos y abrir el navegador
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ✅ JARVIS iniciado exitosamente
echo.
echo "All systems operational, sir."
echo.
pause
