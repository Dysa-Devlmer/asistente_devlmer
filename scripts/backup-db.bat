@echo off
REM ================================================
REM   BACKUP POSTGRESQL EMBEBIDO
REM ================================================

setlocal

REM Cargar variables desde .env
call "%~dp0load-env.bat"
if %errorlevel% neq 0 exit /b 1

set POSTGRES_HOME=%~dp0..\runtime\postgres
set BACKUP_DIR=%~dp0..\runtime\data\backups

REM Generar timestamp (formato: YYYYMMDD_HHMMSS)
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo.
echo ================================================
echo   BACKUP POSTGRESQL
echo ================================================
echo.
echo Base de datos: pos_db
echo Archivo: pos_db_%TIMESTAMP%.backup
echo.

"%POSTGRES_HOME%\bin\pg_dump.exe" -h localhost -p %PGPORT% -U "%PGUSER%" -F c -b -v -f "%BACKUP_DIR%\pos_db_%TIMESTAMP%.backup" pos_db

if %errorlevel% equ 0 (
    echo.
    echo [OK] Backup completado exitosamente
    echo Ubicacion: %BACKUP_DIR%\pos_db_%TIMESTAMP%.backup
) else (
    echo.
    echo [ERROR] Fallo al generar backup
)

echo.
pause

endlocal
