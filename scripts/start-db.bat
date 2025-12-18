@echo off
REM ================================================
REM   ARRANCAR POSTGRESQL EMBEBIDO
REM ================================================

setlocal

REM Cargar variables desde .env
call "%~dp0load-env.bat"
if %errorlevel% neq 0 exit /b 1

set POSTGRES_HOME=%~dp0..\runtime\postgres
set PGDATA=%~dp0..\runtime\data\postgres
set PGLOG=%~dp0..\runtime\data\postgres.log

echo.
echo ================================================
echo   ARRANCANDO POSTGRESQL EMBEBIDO
echo ================================================
echo.

echo [1/3] Verificando cluster...
if not exist "%PGDATA%\postgresql.conf" (
    echo ERROR: Cluster no inicializado
    echo Ejecuta primero: scripts\init-db.bat
    pause
    exit /b 1
)
echo [OK] Cluster encontrado
echo.

echo [2/3] Verificando si ya esta corriendo...
"%POSTGRES_HOME%\bin\pg_ctl.exe" -D "%PGDATA%" status >nul 2>&1
if %errorlevel% equ 0 (
    echo [AVISO] PostgreSQL ya esta corriendo
    echo Puerto: %PGPORT%
    pause
    exit /b 0
)

echo [3/3] Iniciando servidor PostgreSQL...
echo Puerto: %PGPORT%
echo Log: %PGLOG%
echo.
"%POSTGRES_HOME%\bin\pg_ctl.exe" -D "%PGDATA%" -l "%PGLOG%" start
if %errorlevel% neq 0 (
    echo ERROR: Fallo al iniciar PostgreSQL
    echo Revisa el log: %PGLOG%
    pause
    exit /b 1
)

timeout /t 3 /nobreak >nul

echo.
echo ================================================
echo   POSTGRESQL CORRIENDO
echo ================================================
echo   Puerto: %PGPORT%
echo   Log:    %PGLOG%
echo ================================================
echo.

endlocal
