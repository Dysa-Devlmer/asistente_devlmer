-- ============================================================================
-- SCHEMA DEFINITIVO MVP - SYSME TPV
-- Base de Datos: SQLite (OFFLINE - DISPOSITIVOS)
-- Versión: 1.0.0-MVP
-- Fecha: 14 Enero 2025
-- ============================================================================

-- Habilitar foreign keys (CRÍTICO en SQLite)
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL; -- Write-Ahead Logging para mejor concurrencia
PRAGMA synchronous = NORMAL; -- Balance performance/seguridad

-- ============================================================================
-- FUNCIONES HELPER PARA SQLite
-- ============================================================================

-- SQLite no tiene UUID nativo, usamos función personalizada
-- Los UUIDs se generarán principalmente en JavaScript/TypeScript
-- Esta función es solo para casos excepcionales

-- ============================================================================
-- CONFIGURACIÓN Y MAESTROS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- TABLA: sucursal
-- -----------------------------------------------------------------------------
CREATE TABLE sucursal (
    id TEXT PRIMARY KEY, -- UUID como texto
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    rut TEXT NOT NULL, -- RUT Chile
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'America/Santiago',
    esta_activa INTEGER DEFAULT 1, -- BOOLEAN = INTEGER en SQLite
    configuracion TEXT DEFAULT '{}', -- JSONB = TEXT
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- -----------------------------------------------------------------------------
-- TABLA: dispositivo
-- -----------------------------------------------------------------------------
CREATE TABLE dispositivo (
    id TEXT PRIMARY KEY,
    sucursal_id TEXT NOT NULL REFERENCES sucursal(id) ON DELETE RESTRICT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('CAJA', 'COMANDERO', 'COCINA', 'BARRA')),
    dispositivo_info TEXT DEFAULT '{}',
    esta_activo INTEGER DEFAULT 1,
    ultima_sincronizacion TEXT,
    version_app TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_dispositivo_sucursal ON dispositivo(sucursal_id);

-- -----------------------------------------------------------------------------
-- TABLA: empleado
-- -----------------------------------------------------------------------------
CREATE TABLE empleado (
    id TEXT PRIMARY KEY,
    sucursal_id TEXT NOT NULL REFERENCES sucursal(id) ON DELETE RESTRICT,
    rut TEXT NOT NULL UNIQUE,
    nombres TEXT NOT NULL,
    apellido_paterno TEXT NOT NULL,
    apellido_materno TEXT,
    email TEXT,
    telefono TEXT,
    rol TEXT NOT NULL CHECK (rol IN ('ADMIN', 'GERENTE', 'CAJERO', 'MESERO', 'COCINA', 'BARRA', 'BARMAN')),
    pin_code TEXT,
    password_hash TEXT,
    esta_activo INTEGER DEFAULT 1,
    foto_url TEXT,
    fecha_ingreso TEXT,
    fecha_salida TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_empleado_sucursal ON empleado(sucursal_id);
CREATE INDEX idx_empleado_rol ON empleado(rol);

-- -----------------------------------------------------------------------------
-- TABLA: zona
-- -----------------------------------------------------------------------------
CREATE TABLE zona (
    id TEXT PRIMARY KEY,
    sucursal_id TEXT NOT NULL REFERENCES sucursal(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    color TEXT DEFAULT '#3B82F6',
    orden INTEGER DEFAULT 0,
    esta_activa INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_zona_sucursal ON zona(sucursal_id);

-- -----------------------------------------------------------------------------
-- TABLA: mesa
-- -----------------------------------------------------------------------------
CREATE TABLE mesa (
    id TEXT PRIMARY KEY,
    sucursal_id TEXT NOT NULL REFERENCES sucursal(id) ON DELETE CASCADE,
    zona_id TEXT REFERENCES zona(id) ON DELETE SET NULL,
    numero TEXT NOT NULL,
    capacidad INTEGER DEFAULT 4,
    estado TEXT DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE', 'OCUPADA', 'RESERVADA', 'LIMPIEZA', 'INACTIVA')),
    posicion_x INTEGER,
    posicion_y INTEGER,
    forma TEXT DEFAULT 'CUADRADA' CHECK (forma IN ('CUADRADA', 'RECTANGULAR', 'REDONDA', 'BARRA')),
    esta_activa INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(sucursal_id, numero)
);

CREATE INDEX idx_mesa_sucursal ON mesa(sucursal_id);
CREATE INDEX idx_mesa_estado ON mesa(estado);

-- -----------------------------------------------------------------------------
-- TABLA: categoria
-- -----------------------------------------------------------------------------
CREATE TABLE categoria (
    id TEXT PRIMARY KEY,
    sucursal_id TEXT REFERENCES sucursal(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    color TEXT DEFAULT '#10B981',
    icono TEXT,
    orden INTEGER DEFAULT 0,
    esta_activa INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_categoria_sucursal ON categoria(sucursal_id);

-- -----------------------------------------------------------------------------
-- TABLA: producto
-- -----------------------------------------------------------------------------
CREATE TABLE producto (
    id TEXT PRIMARY KEY,
    sucursal_id TEXT REFERENCES sucursal(id) ON DELETE CASCADE,
    categoria_id TEXT REFERENCES categoria(id) ON DELETE SET NULL,
    estacion_cocina_id TEXT, -- FK se agrega después
    sku TEXT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio INTEGER NOT NULL, -- CLP sin decimales (NUMERIC → INTEGER)
    costo INTEGER,
    aplica_iva INTEGER DEFAULT 1,
    tipo TEXT DEFAULT 'PRODUCTO' CHECK (tipo IN ('PRODUCTO', 'SERVICIO', 'MENU')),
    disponible INTEGER DEFAULT 1,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    requiere_preparacion INTEGER DEFAULT 0,
    tiempo_preparacion_min INTEGER,
    imagen_url TEXT,
    esta_activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_producto_sucursal ON producto(sucursal_id);
CREATE INDEX idx_producto_categoria ON producto(categoria_id);
CREATE INDEX idx_producto_disponible ON producto(disponible);

-- ============================================================================
-- TRANSACCIONALES (UUID PK - OFFLINE FIRST)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- TABLA: caja
-- -----------------------------------------------------------------------------
CREATE TABLE caja (
    id TEXT PRIMARY KEY,
    sucursal_id TEXT NOT NULL REFERENCES sucursal(id) ON DELETE RESTRICT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    tipo TEXT DEFAULT 'PRINCIPAL' CHECK (tipo IN ('PRINCIPAL', 'EXPRESS', 'DELIVERY')),
    esta_activa INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_caja_sucursal ON caja(sucursal_id);

-- -----------------------------------------------------------------------------
-- TABLA: sesion_caja
-- -----------------------------------------------------------------------------
CREATE TABLE sesion_caja (
    id TEXT PRIMARY KEY, -- UUID generado en frontend
    caja_id TEXT NOT NULL REFERENCES caja(id) ON DELETE RESTRICT,
    empleado_id TEXT NOT NULL REFERENCES empleado(id) ON DELETE RESTRICT,
    sucursal_id TEXT NOT NULL REFERENCES sucursal(id) ON DELETE RESTRICT,
    dispositivo_id TEXT REFERENCES dispositivo(id) ON DELETE SET NULL,

    numero_sesion TEXT NOT NULL UNIQUE,
    fecha_apertura TEXT NOT NULL DEFAULT (datetime('now')),
    fecha_cierre TEXT,

    -- Montos en CLP (INTEGER en SQLite)
    monto_inicial INTEGER NOT NULL DEFAULT 0,
    monto_esperado INTEGER DEFAULT 0,
    monto_real INTEGER,
    diferencia INTEGER DEFAULT 0,

    total_efectivo INTEGER DEFAULT 0,
    total_tarjeta INTEGER DEFAULT 0,
    total_transferencia INTEGER DEFAULT 0,
    total_otros INTEGER DEFAULT 0,
    total_propinas INTEGER DEFAULT 0,

    estado TEXT DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'CERRADA', 'AUDITADA')),
    observaciones TEXT,

    -- Sincronización
    sync_status TEXT DEFAULT 'PENDIENTE' CHECK (sync_status IN ('PENDIENTE', 'SINCRONIZADO', 'ERROR')),
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    synced_at TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_sesion_caja_caja ON sesion_caja(caja_id);
CREATE INDEX idx_sesion_caja_empleado ON sesion_caja(empleado_id);
CREATE INDEX idx_sesion_caja_estado ON sesion_caja(estado);
CREATE INDEX idx_sesion_caja_fecha ON sesion_caja(fecha_apertura);
CREATE INDEX idx_sesion_sync_status ON sesion_caja(sync_status);

-- -----------------------------------------------------------------------------
-- TABLA: pedido
-- -----------------------------------------------------------------------------
CREATE TABLE pedido (
    id TEXT PRIMARY KEY, -- UUID generado en frontend
    sucursal_id TEXT NOT NULL REFERENCES sucursal(id) ON DELETE RESTRICT,
    mesa_id TEXT REFERENCES mesa(id) ON DELETE SET NULL,
    empleado_id TEXT NOT NULL REFERENCES empleado(id) ON DELETE RESTRICT,
    sesion_caja_id TEXT REFERENCES sesion_caja(id) ON DELETE SET NULL,
    dispositivo_id TEXT REFERENCES dispositivo(id) ON DELETE SET NULL,

    numero_pedido TEXT NOT NULL UNIQUE,
    tipo TEXT DEFAULT 'MESA' CHECK (tipo IN ('MESA', 'LLEVAR', 'DELIVERY', 'BARRA')),

    numero_comensales INTEGER DEFAULT 1,
    nombre_cliente TEXT,

    -- Montos en CLP (INTEGER)
    subtotal INTEGER DEFAULT 0,
    iva INTEGER DEFAULT 0,
    descuento INTEGER DEFAULT 0,
    propina INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,

    -- División de cuenta
    cuenta_dividida INTEGER DEFAULT 0,
    numero_divisiones INTEGER DEFAULT 1,

    estado TEXT DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'ENVIADO_COCINA', 'LISTO', 'ENTREGADO', 'PAGADO', 'CANCELADO')),

    fecha_creacion TEXT DEFAULT (datetime('now')),
    fecha_envio_cocina TEXT,
    fecha_entrega TEXT,
    fecha_cierre TEXT,

    observaciones TEXT,

    -- Sincronización
    sync_status TEXT DEFAULT 'PENDIENTE' CHECK (sync_status IN ('PENDIENTE', 'SINCRONIZADO', 'ERROR')),
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    synced_at TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_pedido_sucursal ON pedido(sucursal_id);
CREATE INDEX idx_pedido_mesa ON pedido(mesa_id);
CREATE INDEX idx_pedido_estado ON pedido(estado);
CREATE INDEX idx_pedido_fecha ON pedido(fecha_creacion);
CREATE INDEX idx_pedido_sync_status ON pedido(sync_status);

-- -----------------------------------------------------------------------------
-- TABLA: detalle_pedido
-- -----------------------------------------------------------------------------
CREATE TABLE detalle_pedido (
    id TEXT PRIMARY KEY,
    pedido_id TEXT NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL REFERENCES producto(id) ON DELETE RESTRICT,

    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario INTEGER NOT NULL,
    descuento_unitario INTEGER DEFAULT 0,
    subtotal INTEGER NOT NULL,

    observaciones TEXT,
    modificadores TEXT DEFAULT '[]', -- JSON como TEXT

    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO')),
    enviado_cocina INTEGER DEFAULT 0,
    fecha_envio_cocina TEXT,

    division_info TEXT DEFAULT '{}',

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_detalle_pedido ON detalle_pedido(pedido_id);
CREATE INDEX idx_detalle_producto ON detalle_pedido(producto_id);
CREATE INDEX idx_detalle_estado ON detalle_pedido(estado);

-- -----------------------------------------------------------------------------
-- TABLA: pago (INMUTABLE)
-- -----------------------------------------------------------------------------
CREATE TABLE pago (
    id TEXT PRIMARY KEY,
    pedido_id TEXT NOT NULL REFERENCES pedido(id) ON DELETE RESTRICT,
    sesion_caja_id TEXT NOT NULL REFERENCES sesion_caja(id) ON DELETE RESTRICT,
    empleado_id TEXT NOT NULL REFERENCES empleado(id) ON DELETE RESTRICT,
    sucursal_id TEXT NOT NULL REFERENCES sucursal(id) ON DELETE RESTRICT,
    dispositivo_id TEXT REFERENCES dispositivo(id) ON DELETE SET NULL,

    numero_pago TEXT NOT NULL UNIQUE,

    metodo TEXT NOT NULL CHECK (metodo IN ('EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'MIXTO', 'OTRO')),

    -- Pago mixto
    es_mixto INTEGER DEFAULT 0,
    detalle_mixto TEXT DEFAULT '[]',

    monto INTEGER NOT NULL,
    propina INTEGER DEFAULT 0,

    referencia_externa TEXT,
    banco TEXT,
    ultimos_4_digitos TEXT,

    estado TEXT DEFAULT 'COMPLETADO' CHECK (estado IN ('COMPLETADO', 'ANULADO')),
    anulado_por TEXT REFERENCES empleado(id),
    fecha_anulacion TEXT,
    motivo_anulacion TEXT,

    fecha_pago TEXT DEFAULT (datetime('now')),

    -- Sincronización PRIORIDAD MÁXIMA
    sync_status TEXT DEFAULT 'PENDIENTE' CHECK (sync_status IN ('PENDIENTE', 'SINCRONIZADO', 'ERROR')),
    sync_priority INTEGER DEFAULT 1, -- 1 = MÁXIMA
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    synced_at TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_pago_pedido ON pago(pedido_id);
CREATE INDEX idx_pago_sesion_caja ON pago(sesion_caja_id);
CREATE INDEX idx_pago_metodo ON pago(metodo);
CREATE INDEX idx_pago_fecha ON pago(fecha_pago);
CREATE INDEX idx_pago_sync_status ON pago(sync_status);
CREATE INDEX idx_pago_sync_priority ON pago(sync_priority);

-- ============================================================================
-- SINCRONIZACIÓN
-- ============================================================================

-- -----------------------------------------------------------------------------
-- TABLA: sync_event
-- -----------------------------------------------------------------------------
CREATE TABLE sync_event (
    id TEXT PRIMARY KEY,
    dispositivo_id TEXT NOT NULL REFERENCES dispositivo(id) ON DELETE CASCADE,
    sucursal_id TEXT NOT NULL REFERENCES sucursal(id) ON DELETE CASCADE,

    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,

    payload TEXT NOT NULL, -- JSON completo del evento

    user_id TEXT REFERENCES empleado(id),
    client_timestamp TEXT NOT NULL,
    server_timestamp TEXT DEFAULT (datetime('now')),

    sync_status TEXT DEFAULT 'PENDIENTE' CHECK (sync_status IN ('PENDIENTE', 'PROCESADO', 'ERROR', 'IGNORADO')),
    sync_priority INTEGER DEFAULT 5,
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    processed_at TEXT,

    idempotency_key TEXT UNIQUE, -- Evitar duplicados

    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_sync_dispositivo ON sync_event(dispositivo_id);
CREATE INDEX idx_sync_status ON sync_event(sync_status);
CREATE INDEX idx_sync_priority ON sync_event(sync_priority, created_at);
CREATE INDEX idx_sync_entity ON sync_event(entity_type, entity_id);
CREATE INDEX idx_sync_timestamp ON sync_event(client_timestamp);

-- ============================================================================
-- TABLAS COMPLEMENTARIAS (KDS)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- TABLA: estacion_cocina
-- -----------------------------------------------------------------------------
CREATE TABLE estacion_cocina (
    id TEXT PRIMARY KEY,
    sucursal_id TEXT NOT NULL REFERENCES sucursal(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    codigo TEXT UNIQUE,
    tipo TEXT CHECK (tipo IN ('COCINA', 'BARRA', 'POSTRES', 'PARRILLA', 'ENSALADAS')),
    orden INTEGER DEFAULT 0,
    color TEXT DEFAULT '#EF4444',
    esta_activa INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_estacion_sucursal ON estacion_cocina(sucursal_id);

-- ============================================================================
-- TRIGGERS DE FISCALIDAD (INMUTABILIDAD PAGOS)
-- ============================================================================

-- Prevenir UPDATE de pagos sincronizados
CREATE TRIGGER trigger_prevenir_mod_pago
BEFORE UPDATE ON pago
FOR EACH ROW
WHEN OLD.sync_status = 'SINCRONIZADO'
BEGIN
    SELECT RAISE(ABORT, 'FISCAL: No se pueden modificar pagos sincronizados');
END;

-- Prevenir DELETE de pagos sincronizados
CREATE TRIGGER trigger_prevenir_del_pago
BEFORE DELETE ON pago
FOR EACH ROW
WHEN OLD.sync_status = 'SINCRONIZADO'
BEGIN
    SELECT RAISE(ABORT, 'FISCAL: No se pueden eliminar pagos sincronizados');
END;

-- ============================================================================
-- TRIGGERS DE AUDITORÍA (updated_at)
-- ============================================================================

-- Trigger para actualizar updated_at automáticamente
-- En SQLite los triggers son por tabla

CREATE TRIGGER trigger_updated_sucursal
AFTER UPDATE ON sucursal
FOR EACH ROW
BEGIN
    UPDATE sucursal SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_updated_dispositivo
AFTER UPDATE ON dispositivo
FOR EACH ROW
BEGIN
    UPDATE dispositivo SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_updated_empleado
AFTER UPDATE ON empleado
FOR EACH ROW
BEGIN
    UPDATE empleado SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_updated_zona
AFTER UPDATE ON zona
FOR EACH ROW
BEGIN
    UPDATE zona SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_updated_mesa
AFTER UPDATE ON mesa
FOR EACH ROW
BEGIN
    UPDATE mesa SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_updated_categoria
AFTER UPDATE ON categoria
FOR EACH ROW
BEGIN
    UPDATE categoria SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_updated_producto
AFTER UPDATE ON producto
FOR EACH ROW
BEGIN
    UPDATE producto SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_updated_caja
AFTER UPDATE ON caja
FOR EACH ROW
BEGIN
    UPDATE caja SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_updated_sesion_caja
AFTER UPDATE ON sesion_caja
FOR EACH ROW
BEGIN
    UPDATE sesion_caja SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_updated_pedido
AFTER UPDATE ON pedido
FOR EACH ROW
BEGIN
    UPDATE pedido SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_updated_detalle_pedido
AFTER UPDATE ON detalle_pedido
FOR EACH ROW
BEGIN
    UPDATE detalle_pedido SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_updated_pago
AFTER UPDATE ON pago
FOR EACH ROW
BEGIN
    UPDATE pago SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER trigger_updated_estacion_cocina
AFTER UPDATE ON estacion_cocina
FOR EACH ROW
BEGIN
    UPDATE estacion_cocina SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- RESUMEN DEL SCHEMA SQLite
-- ============================================================================
--
-- ✅ ADAPTACIONES vs PostgreSQL:
--    - UUID → TEXT
--    - BOOLEAN → INTEGER (0/1)
--    - JSONB → TEXT
--    - NUMERIC(10,0) → INTEGER (precios CLP)
--    - TIMESTAMPTZ → TEXT (datetime('now'))
--    - PRAGMA foreign_keys = ON (CRÍTICO)
--    - Triggers fiscales simplificados
--    - Mismos nombres tablas/columnas
--
-- ✅ CARACTERÍSTICAS:
--    - 14 tablas (mismas que PostgreSQL)
--    - UUID como PK (generados en frontend)
--    - Sincronización offline
--    - Pagos INMUTABLES
--    - Event sourcing
--    - Cumplimiento fiscal
--
-- ============================================================================
