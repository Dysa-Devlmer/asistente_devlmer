-- ============================================================
-- SCRIPT MAESTRO: Ejecutar todos los Seeds
-- Sistema: POS Restaurant - SYSME_MISTURA Compatible
-- ============================================================
-- Este script ejecuta todos los seeds en el orden correcto
-- para inicializar la base de datos con datos de prueba
-- ============================================================

\echo ''
\echo '===================================================================='
\echo '  INICIALIZANDO BASE DE DATOS CON DATOS DE PRUEBA'
\echo '  Sistema: POS Restaurant'
\echo '===================================================================='
\echo ''

-- Paso 1: Tarifas (debe ir antes de mesas y productos)
\echo '>>> [1/5] Ejecutando: 03_rates.sql'
\i 03_rates.sql
\echo ''

-- Paso 2: Salones (debe ir antes de mesas)
\echo '>>> [2/5] Ejecutando: 02_salons_tables.sql'
\i 02_salons_tables.sql
\echo ''

-- Paso 3: Empleados
\echo '>>> [3/5] Ejecutando: 01_employees.sql'
\i 01_employees.sql
\echo ''

-- Paso 4: Categorías de productos
\echo '>>> [4/5] Ejecutando: 04_categories.sql'
\i 04_categories.sql
\echo ''

-- Paso 5: Productos y precios (debe ir al final)
\echo '>>> [5/5] Ejecutando: 05_products.sql'
\i 05_products.sql
\echo ''

-- ============================================================
-- RESUMEN FINAL
-- ============================================================

\echo ''
\echo '===================================================================='
\echo '  RESUMEN DE DATOS INSERTADOS'
\echo '===================================================================='
\echo ''

SELECT
  '📊 EMPLEADOS' as "Tipo de Dato",
  COUNT(*)::text as "Cantidad"
FROM apcajas WHERE activo = true

UNION ALL

SELECT
  '🏢 SALONES',
  COUNT(*)::text
FROM salon

UNION ALL

SELECT
  '🪑 MESAS',
  COUNT(*)::text
FROM mesa WHERE estado IN ('libre', 'ocupada', 'reservada')

UNION ALL

SELECT
  '💰 TARIFAS',
  COUNT(*)::text
FROM tarifa WHERE activo = true

UNION ALL

SELECT
  '📂 CATEGORÍAS',
  COUNT(*)::text
FROM tipo_comg WHERE activo = true

UNION ALL

SELECT
  '🍽️ PRODUCTOS',
  COUNT(*)::text
FROM complementog WHERE activo = true

UNION ALL

SELECT
  '🏷️ PRECIOS (Producto x Tarifa)',
  COUNT(*)::text
FROM comg_tarifa;

\echo ''
\echo '===================================================================='
\echo '  ✅ BASE DE DATOS INICIALIZADA CORRECTAMENTE'
\echo '===================================================================='
\echo ''
\echo 'Credenciales de prueba para login:'
\echo ''
\echo '  MESERO:'
\echo '    ID: MES001    PIN: 1111    (Juan Pérez)'
\echo ''
\echo '  ADMINISTRADOR:'
\echo '    ID: ADM001    PIN: 1234    (Administrador)'
\echo ''
\echo '  CAJERA:'
\echo '    ID: CAJ001    PIN: 5555    (Laura Rodríguez)'
\echo ''
\echo '===================================================================='
\echo ''
