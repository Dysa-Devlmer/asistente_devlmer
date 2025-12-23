-- ============================================================
-- SEED: Tarifas del Restaurante
-- Sistema: POS Restaurant - SYSME_MISTURA Compatible
-- ============================================================

-- Limpiar datos existentes (solo para testing)
TRUNCATE TABLE tarifa CASCADE;

-- ============================================================
-- TARIFAS DE PRECIOS
-- ============================================================

INSERT INTO tarifa (id_tarifa, nombre, descripcion, activo) VALUES
(1, 'General', 'Tarifa estándar para todos los clientes', true),
(2, 'VIP', 'Tarifa especial para área VIP (+10%)', true),
(3, 'Happy Hour', 'Tarifa promocional (-15%)', true),
(4, 'Delivery', 'Tarifa para pedidos a domicilio', true)

ON CONFLICT (id_tarifa) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  activo = EXCLUDED.activo;

-- Verificación
SELECT
  id_tarifa as "ID",
  nombre as "Nombre",
  descripcion as "Descripción",
  CASE WHEN activo THEN 'Activa' ELSE 'Inactiva' END as "Estado"
FROM tarifa
ORDER BY id_tarifa;

-- Resumen
SELECT COUNT(*) as "Total Tarifas Activas" FROM tarifa WHERE activo = true;

-- ============================================================
-- NOTAS:
-- ============================================================
-- Las tarifas se asocian a:
-- 1. Mesas (cada mesa tiene una tarifa por defecto)
-- 2. Productos (cada producto puede tener precios diferentes por tarifa)
--
-- Tarifa 1 (General): Usada en Salón Principal, Terraza y Barra
-- Tarifa 2 (VIP): Usada en área VIP
-- Tarifa 3 (Happy Hour): Puede aplicarse manualmente
-- Tarifa 4 (Delivery): Para pedidos externos
-- ============================================================
