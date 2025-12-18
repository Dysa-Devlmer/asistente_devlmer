@echo off
REM ================================================
REM   DETENER POSTGRESQL EMBEBIDO
REM ================================================

setlocal

set POSTGRES_HOME=%~dp0..\runtime\postgres
set PGDATA=%~dp0..\runtime\data\postgres

echo.
echo ================================================
echo   DETENIENDO POSTGRESQL EMBEBIDO
echo ================================================
echo.

if not exist "%POSTGRES_HOME%\bin\pg_ctl.exe" (
    echo ERROR: PostgreSQL no encontrado
    pause
    exit /b 1
)

echo Deteniendo servidor PostgreSQL...
"%POSTGRES_HOME%\bin\pg_ctl.exe" -D "%PGDATA%" stop -m fast

if %errorlevel% equ 0 (
    echo [OK] PostgreSQL detenido correctamente
) else (
    echo [AVISO] PostgreSQL no estaba corriendo
)

timeout /t 2 /nobreak >nul

endlocal
