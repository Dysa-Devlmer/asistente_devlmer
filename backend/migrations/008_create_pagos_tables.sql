-- =====================================================
-- MIGRACIÓN 008: SISTEMA DE PAGOS
-- Fecha: 2025-12-15
-- Descripción: Crea tablas para sistema de pagos
--              con soporte para efectivo y Webpay
-- =====================================================

-- 1. TABLA pago
-- Representa un pago (efectivo o Webpay) asociado a una venta
CREATE TABLE IF NOT EXISTS pago (
  -- Identificación
  id CHAR(36) PRIMARY KEY COMMENT 'UUID del pago',
  numero_pago VARCHAR(50) NULL COMMENT 'Número secuencial legible (ej: PAG-20251215-0001)',

  -- Relaciones
  venta_id CHAR(36) NOT NULL COMMENT 'Venta asociada',
  sesion_caja_id CHAR(36) NULL COMMENT 'Sesión de caja (NULL si venta sin caja)',
  forma_pago_id CHAR(36) NOT NULL COMMENT 'Forma de pago (Efectivo, Webpay, etc.)',

  -- Montos
  monto DECIMAL(12,2) NOT NULL COMMENT 'Monto total del pago',
  monto_pagado DECIMAL(12,2) NULL COMMENT 'Monto efectivamente pagado',

  -- Estado del pago
  estado ENUM('pending', 'processing', 'approved', 'rejected', 'failed', 'cancelled')
    NOT NULL DEFAULT 'pending' COMMENT 'Estado actual del pago',

  -- Metadata del pago
  metodo VARCHAR(50) NOT NULL COMMENT 'efectivo, webpay, webpay_plus, etc.',

  -- Información de efectivo (si aplica)
  monto_recibido DECIMAL(12,2) NULL COMMENT 'Efectivo recibido del cliente',
  monto_cambio DECIMAL(12,2) NULL COMMENT 'Vuelto entregado al cliente',

  -- Información de Webpay (si aplica)
  webpay_token VARCHAR(255) NULL COMMENT 'Token de transacción Webpay',
  webpay_buy_order VARCHAR(100) NULL COMMENT 'Orden de compra Webpay',
  webpay_session_id VARCHAR(100) NULL COMMENT 'ID de sesión Webpay',
  webpay_authorization_code VARCHAR(50) NULL COMMENT 'Código de autorización Webpay',
  webpay_card_number VARCHAR(20) NULL COMMENT 'Últimos 4 dígitos tarjeta (masked)',
  webpay_transaction_date DATETIME NULL COMMENT 'Fecha/hora transacción en Webpay',
  webpay_response_code VARCHAR(10) NULL COMMENT 'Código respuesta Webpay (0 = aprobado)',

  -- Timestamps
  fecha_inicio DATETIME NOT NULL COMMENT 'Cuándo se inició el pago',
  fecha_completado DATETIME NULL COMMENT 'Cuándo se completó (approved/rejected/failed)',

  -- Auditoría
  empleado_id CHAR(36) NOT NULL COMMENT 'Empleado que procesó el pago',
  terminal_id VARCHAR(50) NULL COMMENT 'ID del terminal POS',
  ip_address VARCHAR(45) NULL COMMENT 'IP desde donde se originó',

  -- Reintentos
  intentos_procesamiento INT NOT NULL DEFAULT 0 COMMENT 'Número de intentos de procesamiento',
  ultimo_error TEXT NULL COMMENT 'Último error capturado',

  -- Notas
  notas TEXT NULL COMMENT 'Notas adicionales',

  -- Soft delete
  esta_activo BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'FALSE = anulado',
  motivo_anulacion TEXT NULL COMMENT 'Razón de anulación',
  fecha_anulacion DATETIME NULL COMMENT 'Cuándo se anuló',

  -- Timestamps de auditoría
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Índices para performance
  INDEX idx_venta (venta_id),
  INDEX idx_sesion_caja (sesion_caja_id),
  INDEX idx_forma_pago (forma_pago_id),
  INDEX idx_estado (estado),
  INDEX idx_metodo (metodo),
  INDEX idx_fecha_inicio (fecha_inicio),
  INDEX idx_webpay_token (webpay_token),
  INDEX idx_numero_pago (numero_pago),
  INDEX idx_activo (esta_activo),
  INDEX idx_empleado (empleado_id),
  INDEX idx_fecha_completado (fecha_completado),

  -- Foreign Keys
  CONSTRAINT fk_pago_venta FOREIGN KEY (venta_id)
    REFERENCES venta(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pago_sesion_caja FOREIGN KEY (sesion_caja_id)
    REFERENCES sesion_caja(id) ON DELETE SET NULL,
  CONSTRAINT fk_pago_forma_pago FOREIGN KEY (forma_pago_id)
    REFERENCES forma_pago(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pago_empleado FOREIGN KEY (empleado_id)
    REFERENCES empleado(id) ON DELETE RESTRICT,

  -- Constraints de negocio
  CONSTRAINT chk_pago_monto_positivo CHECK (monto > 0),
  CONSTRAINT chk_pago_monto_pagado_positivo CHECK (monto_pagado IS NULL OR monto_pagado >= 0),

  -- Si es efectivo, debe tener monto_recibido y cambio calculado
  CONSTRAINT chk_pago_efectivo_consistente CHECK (
    (metodo = 'efectivo' AND monto_recibido IS NOT NULL AND monto_cambio IS NOT NULL)
    OR
    (metodo != 'efectivo' AND monto_recibido IS NULL AND monto_cambio IS NULL)
  ),

  -- Si es Webpay aprobado, debe tener token y authorization_code
  CONSTRAINT chk_pago_webpay_consistente CHECK (
    (metodo LIKE 'webpay%' AND estado = 'approved' AND webpay_token IS NOT NULL AND webpay_authorization_code IS NOT NULL)
    OR
    (estado != 'approved' OR metodo NOT LIKE 'webpay%')
  ),

  -- Si está completado, debe tener fecha_completado
  CONSTRAINT chk_pago_estado_fecha CHECK (
    (estado IN ('approved', 'rejected', 'failed', 'cancelled') AND fecha_completado IS NOT NULL)
    OR
    (estado IN ('pending', 'processing') AND fecha_completado IS NULL)
  ),

  -- Si está anulado, debe tener motivo y fecha
  CONSTRAINT chk_pago_anulacion_consistente CHECK (
    (esta_activo = FALSE AND motivo_anulacion IS NOT NULL AND fecha_anulacion IS NOT NULL)
    OR
    (esta_activo = TRUE AND motivo_anulacion IS NULL AND fecha_anulacion IS NULL)
  ),

  -- Validar que cambio es correcto (si es efectivo)
  CONSTRAINT chk_pago_cambio_correcto CHECK (
    metodo != 'efectivo' OR monto_cambio = (monto_recibido - monto)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Pagos de ventas - Efectivo y Webpay';

-- 2. TABLA pago_intento
-- Registra cada intento de procesamiento (para auditoría y reintentos)
CREATE TABLE IF NOT EXISTS pago_intento (
  -- Identificación
  id CHAR(36) PRIMARY KEY COMMENT 'UUID del intento',
  pago_id CHAR(36) NOT NULL COMMENT 'Pago al que pertenece',

  -- Intento
  numero_intento INT NOT NULL COMMENT '1, 2, 3, etc.',
  estado_resultante ENUM('success', 'error', 'rejected', 'timeout', 'cancelled')
    NOT NULL COMMENT 'Resultado del intento',

  -- Detalles del intento
  request_payload JSON NULL COMMENT 'Request enviado a Webpay',
  response_payload JSON NULL COMMENT 'Response recibido de Webpay',
  error_message TEXT NULL COMMENT 'Mensaje de error (si aplica)',
  error_code VARCHAR(50) NULL COMMENT 'Código de error',

  -- Timing
  fecha_inicio DATETIME NOT NULL COMMENT 'Inicio del intento',
  fecha_fin DATETIME NULL COMMENT 'Fin del intento',
  duracion_ms INT NULL COMMENT 'Duración en milisegundos',

  -- Auditoría (inmutable - no tiene updated_at)
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Índices
  INDEX idx_pago (pago_id),
  INDEX idx_numero_intento (numero_intento),
  INDEX idx_estado (estado_resultante),
  INDEX idx_fecha_inicio (fecha_inicio),

  -- Foreign Keys
  CONSTRAINT fk_intento_pago FOREIGN KEY (pago_id)
    REFERENCES pago(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT chk_intento_numero_positivo CHECK (numero_intento > 0),
  CONSTRAINT chk_intento_duracion_positiva CHECK (duracion_ms IS NULL OR duracion_ms >= 0),

  -- Evitar duplicados
  CONSTRAINT uq_pago_numero_intento UNIQUE (pago_id, numero_intento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Intentos de procesamiento de pagos - Auditoría de reintentos';

-- 3. AGREGAR RELACIÓN venta -> pago
-- Esto permite saber cuál es el pago principal de una venta
-- NOTA: Solo agregar si la columna NO existe
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'venta'
    AND COLUMN_NAME = 'pago_id'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE venta ADD COLUMN pago_id CHAR(36) NULL COMMENT ''Pago principal de la venta'' AFTER sesion_caja_id',
  'SELECT ''Column pago_id already exists in venta'' AS message'
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
    AND CONSTRAINT_NAME = 'fk_venta_pago'
);

SET @sql = IF(
  @fk_exists = 0 AND @column_exists = 0,
  'ALTER TABLE venta ADD CONSTRAINT fk_venta_pago
   FOREIGN KEY (pago_id) REFERENCES pago(id) ON DELETE SET NULL',
  'SELECT ''FK fk_venta_pago already exists or not needed'' AS message'
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
    AND INDEX_NAME = 'idx_venta_pago'
);

SET @sql = IF(
  @index_exists = 0,
  'ALTER TABLE venta ADD INDEX idx_venta_pago (pago_id)',
  'SELECT ''Index idx_venta_pago already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- FIN DE MIGRACIÓN 008
-- =====================================================

-- Verificación
SELECT
  'pago' AS tabla,
  COUNT(*) AS registros
FROM pago
UNION ALL
SELECT
  'pago_intento' AS tabla,
  COUNT(*) AS registros
FROM pago_intento;
