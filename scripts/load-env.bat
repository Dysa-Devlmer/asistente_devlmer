@echo off
REM ================================================
REM   CARGA VARIABLES DESDE .env
REM   NO editar este archivo
REM ================================================

set ENV_FILE=%~dp0..\backend\.env

if not exist "%ENV_FILE%" (
    echo ERROR: Archivo .env no encontrado en backend/
    echo Copia .env.example a .env y configura las credenciales
    pause
    exit /b 1
)

REM Leer variables del .env (solo las necesarias para PostgreSQL)
for /f "usebackq tokens=1,2 delims==" %%a in ("%ENV_FILE%") do (
    set line=%%a
    set value=%%b

    REM Ignorar comentarios y lineas vacias
    if not "!line:~0,1!"=="#" (
        if "%%a"=="PGUSER" set PGUSER=%%b
        if "%%a"=="PGPASSWORD" set PGPASSWORD=%%b
        if "%%a"=="PGPORT" set PGPORT=%%b
    )
)

REM Valores por defecto si no estan en .env
if "%PGUSER%"=="" set PGUSER=pos_admin
if "%PGPORT%"=="" set PGPORT=5433

REM Validar que PGPASSWORD este configurado
if "%PGPASSWORD%"=="" (
    echo ERROR: PGPASSWORD no configurado en .env
    echo Agrega la linea: PGPASSWORD=tu_password_seguro
    pause
    exit /b 1
)
