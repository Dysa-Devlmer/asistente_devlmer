@echo off
REM ================================================
REM   ESTADO POSTGRESQL EMBEBIDO
REM ================================================

setlocal

set POSTGRES_HOME=%~dp0..\runtime\postgres
set PGDATA=%~dp0..\runtime\data\postgres

echo.
echo ================================================
echo   ESTADO POSTGRESQL
echo ================================================
echo.

if not exist "%POSTGRES_HOME%\bin\pg_ctl.exe" (
    echo ERROR: PostgreSQL no encontrado
    pause
    exit /b 1
)

"%POSTGRES_HOME%\bin\pg_ctl.exe" -D "%PGDATA%" status

echo.
pause

endlocal
