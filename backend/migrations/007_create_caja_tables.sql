-- =====================================================
-- MIGRACIÓN 007: SISTEMA DE CAJA
-- Fecha: 2025-01-15
-- Descripción: Crea tablas para sistema de caja
--              auditable e inmutable
-- =====================================================

-- 1. TABLA sesion_caja
-- Representa una sesión de caja (apertura hasta cierre)
CREATE TABLE IF NOT EXISTS sesion_caja (
  -- Identificación
  id CHAR(36) PRIMARY KEY COMMENT 'UUID de la sesión',
  numero_sesion INT NOT NULL COMMENT 'Número secuencial por sucursal',
  sucursal_id CHAR(36) NOT NULL,
  empleado_apertura_id CHAR(36) NOT NULL COMMENT 'Empleado que abrió',
  empleado_cierre_id CHAR(36) NULL COMMENT 'Empleado que cerró (NULL si abierta)',

  -- Timestamps
  fecha_apertura DATETIME NOT NULL COMMENT 'Fecha y hora de apertura',
  fecha_cierre DATETIME NULL COMMENT 'Fecha y hora de cierre (NULL si abierta)',

  -- Montos
  monto_inicial DECIMAL(12,2) NOT NULL COMMENT 'Efectivo inicial al abrir',
  monto_final_esperado DECIMAL(12,2) NULL COMMENT 'Calculado: inicial + ventas + ingresos - egresos',
  monto_final_real DECIMAL(12,2) NULL COMMENT 'Contado físicamente al cerrar',
  diferencia DECIMAL(12,2) NULL COMMENT 'Real - Esperado (puede ser +/-)',

  -- Estado
  estado ENUM('abierta', 'cerrada') NOT NULL DEFAULT 'abierta'
    COMMENT 'Estado de la sesión',

  -- Auditoría y notas
  notas_apertura TEXT NULL COMMENT 'Notas del empleado al abrir',
  notas_cierre TEXT NULL COMMENT 'Notas del empleado al cerrar',
  cierre_inmutable_json JSON NULL COMMENT 'Snapshot completo e inmutable del cierre',

  -- Timestamps de auditoría
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Índices para performance
  INDEX idx_sucursal_estado (sucursal_id, estado),
  INDEX idx_sucursal_numero (sucursal_id, numero_sesion),
  INDEX idx_fecha_apertura (fecha_apertura),
  INDEX idx_fecha_cierre (fecha_cierre),
  INDEX idx_estado (estado),

  -- Foreign Keys
  CONSTRAINT fk_sesion_sucursal FOREIGN KEY (sucursal_id)
    REFERENCES sucursal(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sesion_empleado_apertura FOREIGN KEY (empleado_apertura_id)
    REFERENCES empleado(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sesion_empleado_cierre FOREIGN KEY (empleado_cierre_id)
    REFERENCES empleado(id) ON DELETE RESTRICT,

  -- Constraints de negocio
  CONSTRAINT chk_monto_inicial_positivo CHECK (monto_inicial >= 0),
  CONSTRAINT chk_estado_consistente CHECK (
    -- Si está abierta, no debe tener datos de cierre
    (estado = 'abierta' AND fecha_cierre IS NULL AND empleado_cierre_id IS NULL
     AND monto_final_esperado IS NULL AND monto_final_real IS NULL
     AND diferencia IS NULL AND cierre_inmutable_json IS NULL)
    OR
    -- Si está cerrada, debe tener todos los datos de cierre
    (estado = 'cerrada' AND fecha_cierre IS NOT NULL AND empleado_cierre_id IS NOT NULL
     AND monto_final_esperado IS NOT NULL AND monto_final_real IS NOT NULL
     AND diferencia IS NOT NULL AND cierre_inmutable_json IS NOT NULL)
  ),
  CONSTRAINT uq_sucursal_numero UNIQUE (sucursal_id, numero_sesion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Sesiones de caja - Auditable e inmutable una vez cerrada';

-- 2. TABLA movimiento_caja
-- Movimientos de efectivo que NO son ventas (ingresos/egresos)
CREATE TABLE IF NOT EXISTS movimiento_caja (
  -- Identificación
  id CHAR(36) PRIMARY KEY COMMENT 'UUID del movimiento',
  sesion_caja_id CHAR(36) NOT NULL COMMENT 'Sesión a la que pertenece',

  -- Tipo y concepto
  tipo ENUM('ingreso', 'egreso') NOT NULL COMMENT 'Tipo de movimiento',
  concepto VARCHAR(255) NOT NULL COMMENT 'Descripción del movimiento',

  -- Monto
  monto DECIMAL(12,2) NOT NULL COMMENT 'Monto del movimiento (siempre positivo)',

  -- Auditoría
  empleado_id CHAR(36) NOT NULL COMMENT 'Empleado que realizó el movimiento',
  fecha DATETIME NOT NULL COMMENT 'Fecha y hora del movimiento',
  notas TEXT NULL COMMENT 'Notas adicionales',

  -- Soft delete (NO se pueden borrar físicamente)
  esta_activo BOOLEAN NOT NULL DEFAULT TRUE
    COMMENT 'FALSE = anulado (soft delete)',

  -- Timestamps de auditoría
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Índices para performance
  INDEX idx_sesion (sesion_caja_id),
  INDEX idx_tipo (tipo),
  INDEX idx_fecha (fecha),
  INDEX idx_empleado (empleado_id),
  INDEX idx_activo (esta_activo),

  -- Foreign Keys
  CONSTRAINT fk_movimiento_sesion FOREIGN KEY (sesion_caja_id)
    REFERENCES sesion_caja(id) ON DELETE RESTRICT,
  CONSTRAINT fk_movimiento_empleado FOREIGN KEY (empleado_id)
    REFERENCES empleado(id) ON DELETE RESTRICT,

  -- Constraints de negocio
  CONSTRAINT chk_monto_positivo CHECK (monto > 0),
  CONSTRAINT chk_concepto_minimo CHECK (CHAR_LENGTH(concepto) >= 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Movimientos de caja (ingresos/egresos) - NO se pueden borrar';

-- 3. TABLA cierre_caja_detalle
-- Detalle inmutable de totales por forma de pago al cerrar
CREATE TABLE IF NOT EXISTS cierre_caja_detalle (
  -- Identificación
  id CHAR(36) PRIMARY KEY COMMENT 'UUID del detalle',
  sesion_caja_id CHAR(36) NOT NULL COMMENT 'Sesión a la que pertenece',

  -- Medio de pago
  forma_pago_id CHAR(36) NOT NULL COMMENT 'ID de la forma de pago',
  nombre_forma_pago VARCHAR(100) NOT NULL COMMENT 'Snapshot del nombre (ej: Efectivo)',

  -- Totales calculados al momento del cierre
  cantidad_transacciones INT NOT NULL COMMENT 'Número de ventas con esta forma de pago',
  monto_total DECIMAL(12,2) NOT NULL COMMENT 'Total vendido con esta forma de pago',

  -- Auditoría (inmutable - no tiene updated_at)
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    COMMENT 'Fecha de generación (inmutable)',

  -- Índices para performance
  INDEX idx_sesion (sesion_caja_id),
  INDEX idx_forma_pago (forma_pago_id),

  -- Foreign Keys
  CONSTRAINT fk_detalle_sesion FOREIGN KEY (sesion_caja_id)
    REFERENCES sesion_caja(id) ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_forma_pago FOREIGN KEY (forma_pago_id)
    REFERENCES forma_pago(id) ON DELETE RESTRICT,

  -- Constraints de negocio
  CONSTRAINT chk_cantidad_positiva CHECK (cantidad_transacciones >= 0),
  CONSTRAINT chk_monto_detalle_no_negativo CHECK (monto_total >= 0),

  -- Evitar duplicados por sesión y forma de pago
  CONSTRAINT uq_sesion_forma_pago UNIQUE (sesion_caja_id, forma_pago_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Detalle inmutable de cierre por forma de pago';

-- 4. AGREGAR RELACIÓN venta -> sesion_caja
-- Esto permite saber en qué sesión se hizo cada venta
-- NOTA: Solo agregar si la columna NO existe
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'venta'
    AND COLUMN_NAME = 'sesion_caja_id'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE venta ADD COLUMN sesion_caja_id CHAR(36) NULL COMMENT ''Sesión de caja en la que se realizó la venta'' AFTER sucursal_id',
  'SELECT ''Column sesion_caja_id already exists in venta'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar FK solo si la columna fue agregada
SET @fk_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'venta'
    AND CONSTRAINT_NAME = 'fk_venta_sesion_caja'
);

SET @sql = IF(
  @fk_exists = 0 AND @column_exists = 0,
  'ALTER TABLE venta ADD CONSTRAINT fk_venta_sesion_caja
   FOREIGN KEY (sesion_caja_id) REFERENCES sesion_caja(id) ON DELETE SET NULL',
  'SELECT ''FK fk_venta_sesion_caja already exists or not needed'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar índice
SET @index_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'venta'
    AND INDEX_NAME = 'idx_venta_sesion_caja'
);

SET @sql = IF(
  @index_exists = 0,
  'ALTER TABLE venta ADD INDEX idx_venta_sesion_caja (sesion_caja_id)',
  'SELECT ''Index idx_venta_sesion_caja already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- FIN DE MIGRACIÓN 007
-- =====================================================

-- Verificación
SELECT
  'sesion_caja' AS tabla,
  COUNT(*) AS registros
FROM sesion_caja
UNION ALL
SELECT
  'movimiento_caja' AS tabla,
  COUNT(*) AS registros
FROM movimiento_caja
UNION ALL
SELECT
  'cierre_caja_detalle' AS tabla,
  COUNT(*) AS registros
FROM cierre_caja_detalle;
