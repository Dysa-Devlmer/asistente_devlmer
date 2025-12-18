@echo off
REM ================================================
REM   CREAR BASE DE DATOS pos_db
REM ================================================

setlocal

REM Cargar variables desde .env
call "%~dp0load-env.bat"
if %errorlevel% neq 0 exit /b 1

set POSTGRES_HOME=%~dp0..\runtime\postgres

echo.
echo ================================================
echo   CREANDO BASE DE DATOS pos_db
echo ================================================
echo.

echo Puerto: %PGPORT%
echo Usuario: %PGUSER%
echo.

"%POSTGRES_HOME%\bin\createdb.exe" -h localhost -p %PGPORT% -U "%PGUSER%" -E UTF8 -O "%PGUSER%" pos_db

if %errorlevel% equ 0 (
    echo [OK] Base de datos pos_db creada exitosamente
) else (
    echo [ERROR] Fallo al crear base de datos
    echo Verifica que PostgreSQL este corriendo: scripts\status-db.bat
)

echo.
pause

endlocal
