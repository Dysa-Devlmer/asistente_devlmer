-- ============================================================
-- SEED: Empleados de Prueba (apcajas)
-- Sistema: POS Restaurant - SYSME_MISTURA Compatible
-- ============================================================

-- Limpiar datos existentes (solo para testing)
TRUNCATE TABLE apcajas CASCADE;

-- Insertar empleados de prueba
-- Formato: codigo_cajero (ID empleado), nombre_cajero, clave (PIN)
-- IMPORTANTE: En producción, las claves deben estar hasheadas

INSERT INTO apcajas (codigo_cajero, nombre_cajero, clave, activo) VALUES
-- ADMIN y GERENTES
('ADM001', 'Administrador', '1234', true),
('GER001', 'Gerente Principal', '5678', true),

-- MESEROS
('MES001', 'Juan Pérez', '1111', true),
('MES002', 'María García', '2222', true),
('MES003', 'Carlos López', '3333', true),
('MES004', 'Ana Martínez', '4444', true),

-- CAJEROS
('CAJ001', 'Laura Rodríguez', '5555', true),
('CAJ002', 'Pedro Sánchez', '6666', true),

-- COCINA
('COC001', 'Chef Principal', '7777', true),
('COC002', 'Ayudante Cocina 1', '8888', true),
('COC003', 'Ayudante Cocina 2', '9999', true),

-- BARRA/BAR
('BAR001', 'Bartender Principal', '1010', true),
('BAR002', 'Ayudante Barra', '2020', true)

ON CONFLICT (codigo_cajero) DO UPDATE SET
  nombre_cajero = EXCLUDED.nombre_cajero,
  clave = EXCLUDED.clave,
  activo = EXCLUDED.activo;

-- Verificación
SELECT
  codigo_cajero as "ID",
  nombre_cajero as "Nombre",
  CASE WHEN activo THEN 'Activo' ELSE 'Inactivo' END as "Estado"
FROM apcajas
ORDER BY codigo_cajero;

-- Resumen
SELECT COUNT(*) as "Total Empleados" FROM apcajas WHERE activo = true;

-- ============================================================
-- NOTAS DE USO:
-- ============================================================
-- Para login en el sistema POS, usar:
--   ID: MES001  PIN: 1111  (Mesero Juan)
--   ID: ADM001  PIN: 1234  (Administrador)
--   ID: CAJ001  PIN: 5555  (Cajera Laura)
-- ============================================================
