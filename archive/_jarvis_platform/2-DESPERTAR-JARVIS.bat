@echo off
REM ═══════════════════════════════════════════════════════════
REM  PASO 2: Despertar a JARVIS en Claude Code ya activo
REM ═══════════════════════════════════════════════════════════
cls

echo.
echo  =====================================================
echo.
echo         PASO 2: Despertando a J.A.R.V.I.S.
echo.
echo  =====================================================
echo.

cd /d "C:\jarvis-standalone"

echo  Ejecutando secuencia de activacion cerebral...
echo.

REM Ejecutar script de activación y dejar ventana abierta
node activar-cerebro-jarvis.js

echo.
echo  =====================================================
echo  ACTIVACION COMPLETADA
echo  =====================================================
echo.
echo  El comando ha sido copiado al portapapeles.
echo.
echo  AHORA:
echo  1. Ve a la ventana de Claude Code
echo  2. Presiona Ctrl+V (pegar)
echo  3. Presiona Enter
echo  4. JARVIS despertara inmediatamente
echo.
echo  =====================================================
echo.

pause
