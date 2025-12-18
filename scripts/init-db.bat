@echo off
REM ================================================
REM   INICIALIZACION POSTGRESQL EMBEBIDO
REM   Solo ejecutar UNA VEZ (primera instalacion)
REM ================================================

setlocal

REM Cargar variables desde .env
call "%~dp0load-env.bat"

set POSTGRES_HOME=%~dp0..\runtime\postgres
set PGDATA=%~dp0..\runtime\data\postgres

echo.
echo ================================================
echo   INICIALIZANDO POSTGRESQL EMBEBIDO
echo ================================================
echo.

echo [1/4] Verificando binarios PostgreSQL...
if not exist "%POSTGRES_HOME%\bin\postgres.exe" (
    echo ERROR: PostgreSQL no encontrado en runtime/postgres/
    echo.
    echo Descarga PostgreSQL portable desde:
    echo https://get.enterprisedb.com/postgresql/postgresql-16.2-1-windows-x64-binaries.zip
    echo.
    echo Extrae el contenido en: runtime\postgres\
    pause
    exit /b 1
)
echo [OK] Binarios encontrados
echo.

echo [2/4] Creando directorio de datos...
if not exist "%PGDATA%" mkdir "%PGDATA%"
if not exist "%~dp0..\runtime\data\backups" mkdir "%~dp0..\runtime\data\backups"
echo [OK] Directorios creados
echo.

echo [3/4] Inicializando cluster PostgreSQL...
echo Usuario: %PGUSER%
echo Puerto: %PGPORT%
echo.
"%POSTGRES_HOME%\bin\initdb.exe" -U "%PGUSER%" -D "%PGDATA%" -E UTF8 --locale=C
if %errorlevel% neq 0 (
    echo ERROR: Fallo al inicializar cluster
    pause
    exit /b 1
)
echo [OK] Cluster inicializado
echo.

echo [4/4] Configurando acceso local...
echo # Configuracion POS >> "%PGDATA%\pg_hba.conf"
echo host    all             all             127.0.0.1/32            md5 >> "%PGDATA%\pg_hba.conf"
echo host    all             all             ::1/128                 md5 >> "%PGDATA%\pg_hba.conf"

echo # Configuracion POS >> "%PGDATA%\postgresql.conf"
echo port = %PGPORT% >> "%PGDATA%\postgresql.conf"
echo listen_addresses = 'localhost' >> "%PGDATA%\postgresql.conf"
echo max_connections = 100 >> "%PGDATA%\postgresql.conf"

echo [OK] Configuracion completada
echo.

echo ================================================
echo   INICIALIZACION COMPLETADA
echo ================================================
echo.
echo Siguiente paso: ejecutar start-db.bat
echo.
pause
endlocal
