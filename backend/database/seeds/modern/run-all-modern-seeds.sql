-- =====================================================
-- SCRIPT MAESTRO: Carga completa de seeds modernos
-- =====================================================
-- Este script carga todos los datos de prueba en el orden correcto
-- respetando las dependencias de claves foráneas.
--
-- ORDEN DE EJECUCIÓN:
-- 1. employees (sin dependencias)
-- 2. rooms (sin dependencias)
-- 3. tables (depende de rooms)
-- 4. price_tiers (sin dependencias)
-- 5. categories (sin dependencias)
-- 6. products (depende de categories)
-- 7. product_prices (depende de products y price_tiers)
--
-- USO:
-- psql -h 127.0.0.1 -p 4306 -U pos_admin -d sysmehotel -f run-all-modern-seeds.sql
-- =====================================================

\echo '═══════════════════════════════════════════════════════════'
\echo '🌱 INICIANDO CARGA DE SEEDS MODERNOS'
\echo '═══════════════════════════════════════════════════════════'
\echo ''

-- Iniciar transacción para asegurar atomicidad
BEGIN;

\echo '📝 [1/6] Cargando Employees (Empleados)...'
\i 01_employees_modern.sql
\echo '✅ Employees cargados correctamente'
\echo ''

\echo '🏢 [2/6] Cargando Rooms and Tables (Salones y Mesas)...'
\i 02_rooms_tables_modern.sql
\echo '✅ Rooms y Tables cargados correctamente'
\echo ''

\echo '💰 [3/6] Cargando Price Tiers (Tarifas)...'
\i 03_price_tiers_modern.sql
\echo '✅ Price Tiers cargados correctamente'
\echo ''

\echo '📦 [4/6] Cargando Categories (Categorías)...'
\i 04_categories_modern.sql
\echo '✅ Categories cargados correctamente'
\echo ''

\echo '🍔 [5/6] Cargando Products (Productos)...'
\i 05_products_modern.sql
\echo '✅ Products cargados correctamente'
\echo ''

\echo '💵 [6/6] Cargando Product Prices (Precios por Tarifa)...'
\i 06_product_prices_modern.sql
\echo '✅ Product Prices cargados correctamente'
\echo ''

-- Confirmar transacción
COMMIT;

\echo '═══════════════════════════════════════════════════════════'
\echo '✅ CARGA COMPLETADA EXITOSAMENTE'
\echo '═══════════════════════════════════════════════════════════'
\echo ''
\echo '📊 RESUMEN DE DATOS CARGADOS:'
\echo ''

-- Mostrar contadores
SELECT '👥 Empleados:' AS tabla, COUNT(*) AS registros FROM employees
UNION ALL
SELECT '🏢 Salones:', COUNT(*) FROM rooms
UNION ALL
SELECT '🪑 Mesas:', COUNT(*) FROM tables
UNION ALL
SELECT '💰 Tarifas:', COUNT(*) FROM price_tiers
UNION ALL
SELECT '📦 Categorías:', COUNT(*) FROM categories
UNION ALL
SELECT '🍔 Productos:', COUNT(*) FROM products
UNION ALL
SELECT '💵 Precios:', COUNT(*) FROM product_prices;

\echo ''
\echo '═══════════════════════════════════════════════════════════'
\echo '🎯 DATOS DE PRUEBA PARA TESTING:'
\echo '═══════════════════════════════════════════════════════════'
\echo ''
\echo 'CREDENCIALES DE EMPLEADOS:'
\echo '  Admin:   PIN 1111 - Carlos Administrador'
\echo '  Manager: PIN 2222 - Ana Gerente'
\echo '  Cajero:  PIN 3001 - María Cajera'
\echo '  Mesero:  PIN 3101 - Juan Mesero'
\echo ''
\echo 'MESAS DISPONIBLES:'
\echo '  Salón Principal: M01-M08 (8 mesas)'
\echo '  Terraza: T01-T05 (5 mesas)'
\echo '  Salón VIP: V01-V03 (3 mesas)'
\echo '  Bar: B01-B04 (4 mesas)'
\echo ''
\echo 'PRODUCTOS DE PRUEBA:'
\echo '  60 productos en 16 categorías'
\echo '  228 precios en 4 tarifas diferentes'
\echo ''
\echo '═══════════════════════════════════════════════════════════'
\echo '🚀 SISTEMA LISTO PARA PRUEBAS END-TO-END'
\echo '═══════════════════════════════════════════════════════════'
