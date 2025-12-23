@echo off
REM ===============================================
REM Load Seeds - Inicializar Base de Datos con Datos de Prueba
REM Sistema: POS Restaurant
REM ===============================================

echo.
echo ============================================
echo  Cargando Datos de Prueba
echo ============================================
echo.

REM Verificar que PostgreSQL esté corriendo
netstat -ano | findstr ":4306" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PostgreSQL no está corriendo en el puerto 4306
    echo.
    echo Por favor, ejecuta primero: start-db.bat
    echo.
    pause
    exit /b 1
)

echo PostgreSQL detectado en puerto 4306
echo.

REM Ir al directorio de seeds
cd /d "%~dp0\..\backend\database\seeds"

echo Ejecutando seeds...
echo.

REM Ejecutar el script maestro usando psql
"E:\POS SYSME\Sysme_Principal\SYSME\sysmeserver\bin\psql.exe" ^
  -h 127.0.0.1 ^
  -p 4306 ^
  -U root ^
  -d sysmehotel ^
  -f run-all-seeds.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Falló la ejecución de los seeds
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  ✅ Datos de Prueba Cargados Exitosamente
echo ============================================
echo.
echo Ya puedes iniciar el sistema POS:
echo   1. Backend:  cd backend ^& npm run dev
echo   2. Frontend: cd dashboard-web ^& npm run dev
echo   3. Abrir:    http://localhost:5173
echo.
echo Credenciales de prueba:
echo   Mesero: MES001 / PIN: 1111
echo   Admin:  ADM001 / PIN: 1234
echo.

pause
