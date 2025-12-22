@echo off
REM ═══════════════════════════════════════════════════════════
REM  PASO 1: Abrir Claude Code (sin activar JARVIS)
REM ═══════════════════════════════════════════════════════════
cls

echo.
echo  =====================================================
echo.
echo         PASO 1: Abriendo Claude Code
echo.
echo  =====================================================
echo.

cd /d "C:\jarvis-standalone"

echo  Ubicacion: %CD%
echo.
echo  Abriendo Claude Code...
echo.

REM Abrir Claude Code
start "Claude Code" cmd /k "cd /d C:\jarvis-standalone && claude"

echo.
echo  =====================================================
echo  Claude Code se abrio correctamente
echo  =====================================================
echo.
echo  SIGUIENTE PASO:
echo  Cuando Claude Code este listo, ejecuta:
echo.
echo  2-DESPERTAR-JARVIS.bat
echo.
echo  =====================================================
echo.

timeout /t 5
exit
