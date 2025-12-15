-- ============================================================================
-- SYSME POS - Schema MVP Híbrido para SQLite
-- ============================================================================
-- Sistema de Punto de Venta para Hostelería
-- Versión: 1.0.0-MVP
-- Base de datos: SQLite 3.35+
--
-- IMPORTANTE:
-- - Mismos nombres de tablas y columnas que PostgreSQL
-- - UUIDs generados en cliente (funciones helper incluidas)
-- - Tipos de datos adaptados a SQLite pero compatibles
-- - Sin cascades destructivos en tablas fiscales
--
-- Diferencias vs PostgreSQL:
-- - SERIAL → INTEGER PRIMARY KEY AUTOINCREMENT
-- - UUID → CHAR(36) (sin tipo nativo)
-- - NUMERIC → DECIMAL o INTEGER según caso
-- - JSONB → TEXT (almacenado como JSON string)
-- - Triggers más simples (sin CREATE OR REPLACE FUNCTION)
-- ============================================================================

-- Habilitar foreign keys (crítico en SQLite)
PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. TABLAS DE CONFIGURACIÓN Y MAESTROS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1. SUCURSAL
-- ----------------------------------------------------------------------------
CREATE TABLE sucursal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,

    -- Dirección
    direccion TEXT,
    comuna VARCHAR(50),
    region VARCHAR(50),
    telefono VARCHAR(20),
    email VARCHAR(100),

    -- Configuración regional Chile
    timezone VARCHAR(50) DEFAULT 'America/Santiago',
    moneda VARCHAR(3) DEFAULT 'CLP',
    tasa_iva DECIMAL(5,2) DEFAULT 19.00,

    -- Estado
    activa BOOLEAN DEFAULT 1,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para updated_at
CREATE TRIGGER trigger_sucursal_updated_at
AFTER UPDATE ON sucursal
FOR EACH ROW
BEGIN
    UPDATE sucursal SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ----------------------------------------------------------------------------
-- 1.2. EMPLEADO
-- ----------------------------------------------------------------------------
CREATE TABLE empleado (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),

    -- Identificación
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    rut VARCHAR(12) UNIQUE NOT NULL,

    -- Nombres
    primer_nombre VARCHAR(50) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50),

    -- Autenticación
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,

    -- Rol
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'gerente', 'cajero', 'mesero', 'cocina', 'barra')),

    -- Relación multi-sucursal
    sucursal_id INTEGER NOT NULL,

    -- Estado
    activo BOOLEAN DEFAULT 1,
    ultimo_login DATETIME,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE RESTRICT
);

CREATE INDEX idx_empleado_rol ON empleado(rol);
CREATE INDEX idx_empleado_activo ON empleado(activo);
CREATE INDEX idx_empleado_sucursal ON empleado(sucursal_id);
CREATE UNIQUE INDEX idx_empleado_uuid ON empleado(uuid);

CREATE TRIGGER trigger_empleado_updated_at
AFTER UPDATE ON empleado
FOR EACH ROW
BEGIN
    UPDATE empleado SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ----------------------------------------------------------------------------
-- 1.3. DISPOSITIVO
-- ----------------------------------------------------------------------------
CREATE TABLE dispositivo (
    id CHAR(36) PRIMARY KEY, -- Generado en cliente

    -- Identificación
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('POS', 'MOBILE', 'KDS', 'WEB')),
    modelo VARCHAR(100),
    sistema_operativo VARCHAR(50),
    version_app VARCHAR(20),

    -- Relaciones
    sucursal_id INTEGER NOT NULL,
    usuario_asignado_id INTEGER,

    -- Estado de conexión
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'bloqueado')),
    online BOOLEAN DEFAULT 0,
    ultima_conexion DATETIME,
    ultima_sincronizacion DATETIME,

    -- Configuración offline
    permitir_offline BOOLEAN DEFAULT 1,
    auto_sync BOOLEAN DEFAULT 1,
    intervalo_sync_segundos INTEGER DEFAULT 30,

    -- Auditoría
    registrado_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    registrado_por INTEGER,

    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_asignado_id) REFERENCES empleado(id) ON DELETE SET NULL,
    FOREIGN KEY (registrado_por) REFERENCES empleado(id) ON DELETE SET NULL
);

CREATE INDEX idx_dispositivo_sucursal ON dispositivo(sucursal_id);
CREATE INDEX idx_dispositivo_tipo ON dispositivo(tipo);
CREATE INDEX idx_dispositivo_estado ON dispositivo(estado);
CREATE INDEX idx_dispositivo_online ON dispositivo(online);

-- ----------------------------------------------------------------------------
-- 1.4. ZONA
-- ----------------------------------------------------------------------------
CREATE TABLE zona (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    sucursal_id INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#e5e7eb',

    -- Estado
    activa BOOLEAN DEFAULT 1,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE CASCADE
);

CREATE INDEX idx_zona_sucursal ON zona(sucursal_id);

-- ----------------------------------------------------------------------------
-- 1.5. MESA
-- ----------------------------------------------------------------------------
CREATE TABLE mesa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero VARCHAR(10) NOT NULL,
    capacidad INTEGER DEFAULT 4,
    zona_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,

    -- Posicionamiento en plano
    pos_x DECIMAL(8,2) DEFAULT 0,
    pos_y DECIMAL(8,2) DEFAULT 0,
    ancho DECIMAL(8,2) DEFAULT 100,
    alto DECIMAL(8,2) DEFAULT 100,
    rotacion INTEGER DEFAULT 0,
    forma VARCHAR(20) DEFAULT 'rectangular',

    -- Estado operativo
    estado VARCHAR(20) DEFAULT 'disponible'
        CHECK (estado IN ('disponible', 'ocupada', 'reservada', 'mantenimiento', 'limpieza')),
    pedido_actual_id CHAR(36),
    mesero_asignado_id INTEGER,

    -- Estado
    activa BOOLEAN DEFAULT 1,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (zona_id) REFERENCES zona(id) ON DELETE RESTRICT,
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE RESTRICT,
    FOREIGN KEY (mesero_asignado_id) REFERENCES empleado(id) ON DELETE SET NULL,

    UNIQUE(numero, sucursal_id)
);

CREATE INDEX idx_mesa_estado ON mesa(estado);
CREATE INDEX idx_mesa_zona ON mesa(zona_id);
CREATE INDEX idx_mesa_sucursal ON mesa(sucursal_id);
CREATE INDEX idx_mesa_pedido_actual ON mesa(pedido_actual_id);

CREATE TRIGGER trigger_mesa_updated_at
AFTER UPDATE ON mesa
FOR EACH ROW
BEGIN
    UPDATE mesa SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ----------------------------------------------------------------------------
-- 1.6. CATEGORIA
-- ----------------------------------------------------------------------------
CREATE TABLE categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    icono VARCHAR(50),

    -- Orden
    orden INTEGER DEFAULT 0,

    -- Estado
    activa BOOLEAN DEFAULT 1,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categoria_activa ON categoria(activa);
CREATE INDEX idx_categoria_orden ON categoria(orden);

CREATE TRIGGER trigger_categoria_updated_at
AFTER UPDATE ON categoria
FOR EACH ROW
BEGIN
    UPDATE categoria SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ----------------------------------------------------------------------------
-- 1.7. PRODUCTO
-- ----------------------------------------------------------------------------
CREATE TABLE producto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),

    -- Identificación
    sku VARCHAR(50) UNIQUE,
    codigo_barra VARCHAR(100),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,

    -- Clasificación
    categoria_id INTEGER NOT NULL,

    -- Precio (CLP sin decimales - usar INTEGER)
    precio INTEGER NOT NULL,
    costo INTEGER DEFAULT 0,

    -- Inventario
    stock DECIMAL(8,2) DEFAULT 0,
    stock_minimo DECIMAL(8,2) DEFAULT 5,
    es_inventariable BOOLEAN DEFAULT 1,

    -- Cocina
    tiempo_preparacion INTEGER DEFAULT 10,
    estacion_cocina_id INTEGER,
    requiere_cocina BOOLEAN DEFAULT 1,

    -- Configuración
    imagen_url VARCHAR(255),
    permite_modificadores BOOLEAN DEFAULT 1,

    -- Estado
    activo BOOLEAN DEFAULT 1,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (categoria_id) REFERENCES categoria(id) ON DELETE RESTRICT
);

CREATE INDEX idx_producto_categoria ON producto(categoria_id);
CREATE INDEX idx_producto_activo ON producto(activo);
CREATE INDEX idx_producto_sku ON producto(sku);
CREATE UNIQUE INDEX idx_producto_uuid ON producto(uuid);

CREATE TRIGGER trigger_producto_updated_at
AFTER UPDATE ON producto
FOR EACH ROW
BEGIN
    UPDATE producto SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ----------------------------------------------------------------------------
-- 1.8. MODIFICADOR
-- ----------------------------------------------------------------------------
CREATE TABLE modificador (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    precio_adicional INTEGER DEFAULT 0,

    -- Estado
    activo BOOLEAN DEFAULT 1,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Relación muchos a muchos
CREATE TABLE producto_modificador (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    modificador_id INTEGER NOT NULL,
    es_obligatorio BOOLEAN DEFAULT 0,
    orden INTEGER DEFAULT 0,

    FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE CASCADE,
    FOREIGN KEY (modificador_id) REFERENCES modificador(id) ON DELETE CASCADE,

    UNIQUE(producto_id, modificador_id)
);

CREATE INDEX idx_prod_mod_producto ON producto_modificador(producto_id);

-- ============================================================================
-- 2. TABLAS TRANSACCIONALES CORE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1. PEDIDO
-- ----------------------------------------------------------------------------
CREATE TABLE pedido (
    id CHAR(36) PRIMARY KEY, -- Generado en cliente

    -- Identificación visible
    numero_pedido VARCHAR(50) UNIQUE,
    numero_temp VARCHAR(50),

    -- Relaciones
    mesa_id INTEGER NOT NULL,
    mesero_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,
    cliente_id INTEGER,

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'confirmado', 'en_cocina', 'listo', 'servido', 'pagado', 'cancelado')),
    estado_pago VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado_pago IN ('pendiente', 'pagado', 'parcial', 'anulado')),

    -- Montos (CLP sin decimales - usar INTEGER)
    subtotal INTEGER DEFAULT 0,
    descuento INTEGER DEFAULT 0,
    propina INTEGER DEFAULT 0,
    iva INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,

    -- División de cuenta
    cuenta_dividida BOOLEAN DEFAULT 0,
    numero_divisiones INTEGER DEFAULT 1,

    -- Notas
    notas_especiales TEXT,
    notas_cocina TEXT,

    -- Sincronización
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE'
        CHECK (sync_status IN ('PENDIENTE', 'SINCRONIZANDO', 'SINCRONIZADO', 'CONFLICTO', 'ERROR')),
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    sync_timestamp DATETIME,

    -- Dispositivo
    device_id CHAR(36) NOT NULL,
    device_type VARCHAR(20) DEFAULT 'POS' CHECK (device_type IN ('POS', 'MOBILE', 'WEB')),

    -- Flags offline
    creado_offline BOOLEAN DEFAULT 0,
    modificado_offline BOOLEAN DEFAULT 0,

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME,
    paid_at DATETIME,

    FOREIGN KEY (mesa_id) REFERENCES mesa(id) ON DELETE RESTRICT,
    FOREIGN KEY (mesero_id) REFERENCES empleado(id) ON DELETE RESTRICT,
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE RESTRICT,
    FOREIGN KEY (device_id) REFERENCES dispositivo(id) ON DELETE RESTRICT
);

CREATE INDEX idx_pedido_sync_status ON pedido(sync_status, device_id);
CREATE INDEX idx_pedido_mesa ON pedido(mesa_id, estado);
CREATE INDEX idx_pedido_mesero ON pedido(mesero_id);
CREATE INDEX idx_pedido_estado ON pedido(estado);
CREATE INDEX idx_pedido_fecha ON pedido(created_at);
CREATE INDEX idx_pedido_numero ON pedido(numero_pedido);
CREATE INDEX idx_pedido_numero_temp ON pedido(numero_temp);

CREATE TRIGGER trigger_pedido_updated_at
AFTER UPDATE ON pedido
FOR EACH ROW
BEGIN
    UPDATE pedido SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ----------------------------------------------------------------------------
-- 2.2. DETALLE_PEDIDO
-- ----------------------------------------------------------------------------
CREATE TABLE detalle_pedido (
    id CHAR(36) PRIMARY KEY, -- Generado en cliente

    -- Relaciones
    pedido_id CHAR(36) NOT NULL,
    producto_id INTEGER NOT NULL,

    -- Snapshot del producto
    producto_nombre VARCHAR(150) NOT NULL,
    producto_sku VARCHAR(50),
    producto_precio INTEGER NOT NULL,

    -- Cantidad
    cantidad DECIMAL(8,2) NOT NULL DEFAULT 1,

    -- Modificadores (JSON como TEXT en SQLite)
    modificadores TEXT,

    -- Precios
    precio_unitario INTEGER NOT NULL,
    precio_total INTEGER NOT NULL,
    descuento INTEGER DEFAULT 0,
    precio_final INTEGER NOT NULL,

    -- Cocina
    estacion_cocina_id INTEGER,
    requiere_preparacion BOOLEAN DEFAULT 1,
    tiempo_estimado INTEGER,

    -- Notas
    notas TEXT,

    -- Estado
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'en_preparacion', 'listo', 'servido', 'cancelado')),

    -- División de cuenta
    asignado_a_division INTEGER,

    -- Sincronización
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE',
    device_id CHAR(36) NOT NULL,
    creado_offline BOOLEAN DEFAULT 0,

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_to_kitchen_at DATETIME,
    ready_at DATETIME,
    served_at DATETIME,

    FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE RESTRICT,
    FOREIGN KEY (device_id) REFERENCES dispositivo(id) ON DELETE RESTRICT
);

CREATE INDEX idx_detalle_pedido ON detalle_pedido(pedido_id);
CREATE INDEX idx_detalle_producto ON detalle_pedido(producto_id);
CREATE INDEX idx_detalle_estado ON detalle_pedido(estado);
CREATE INDEX idx_detalle_sync ON detalle_pedido(sync_status);

-- ----------------------------------------------------------------------------
-- 2.3. SESION_CAJA
-- ----------------------------------------------------------------------------
CREATE TABLE sesion_caja (
    id CHAR(36) PRIMARY KEY, -- Generado en cliente

    -- Identificación
    numero_sesion VARCHAR(50) UNIQUE,
    numero_temp VARCHAR(50),

    -- Relaciones
    cajero_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,
    terminal_id VARCHAR(50),

    -- Estado
    estado VARCHAR(20) DEFAULT 'abierta'
        CHECK (estado IN ('abierta', 'cerrada', 'suspendida')),

    -- Montos (INTEGER para CLP)
    monto_apertura INTEGER NOT NULL DEFAULT 0,
    monedas_apertura TEXT, -- JSON

    monto_esperado INTEGER,
    monto_real INTEGER,
    diferencia INTEGER,
    monedas_cierre TEXT, -- JSON

    -- Totales
    total_ventas INTEGER DEFAULT 0,
    total_efectivo INTEGER DEFAULT 0,
    total_tarjeta INTEGER DEFAULT 0,
    total_transferencia INTEGER DEFAULT 0,
    total_propinas INTEGER DEFAULT 0,
    cantidad_ventas INTEGER DEFAULT 0,

    total_ingresos INTEGER DEFAULT 0,
    total_egresos INTEGER DEFAULT 0,

    -- Notas
    notas_apertura TEXT,
    notas_cierre TEXT,

    -- Sincronización
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE',
    sync_priority INTEGER DEFAULT 2,
    sync_retries INTEGER DEFAULT 0,
    device_id CHAR(36) NOT NULL,
    creado_offline BOOLEAN DEFAULT 0,

    -- Timestamps
    abierta_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    cerrada_at DATETIME,

    FOREIGN KEY (cajero_id) REFERENCES empleado(id) ON DELETE RESTRICT,
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE RESTRICT,
    FOREIGN KEY (device_id) REFERENCES dispositivo(id) ON DELETE RESTRICT
);

CREATE INDEX idx_sesion_cajero ON sesion_caja(cajero_id);
CREATE INDEX idx_sesion_estado ON sesion_caja(estado);
CREATE INDEX idx_sesion_fecha ON sesion_caja(abierta_at);
CREATE INDEX idx_sesion_sync ON sesion_caja(sync_status, sync_priority);

-- ----------------------------------------------------------------------------
-- 2.4. PAGO (CRÍTICO - Inmutable)
-- ----------------------------------------------------------------------------
CREATE TABLE pago (
    id CHAR(36) PRIMARY KEY, -- Generado en cliente

    -- Identificación
    numero_pago VARCHAR(50) UNIQUE,
    numero_temp VARCHAR(50),

    -- Relaciones
    pedido_id CHAR(36) NOT NULL,
    sesion_caja_id CHAR(36) NOT NULL,
    cajero_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,

    -- Método de pago
    metodo VARCHAR(30) NOT NULL
        CHECK (metodo IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mixto')),

    -- Montos (INTEGER para CLP)
    monto INTEGER NOT NULL,
    monto_recibido INTEGER,
    cambio INTEGER DEFAULT 0,

    -- Pago mixto
    es_mixto BOOLEAN DEFAULT 0,
    detalle_mixto TEXT, -- JSON

    -- Propina
    propina INTEGER DEFAULT 0,

    -- Referencias
    referencia_externa VARCHAR(100),
    voucher_url VARCHAR(255),

    -- Estado
    estado VARCHAR(20) DEFAULT 'completado'
        CHECK (estado IN ('completado', 'anulado')),

    -- Anulación
    anulado BOOLEAN DEFAULT 0,
    anulado_por INTEGER,
    anulado_at DATETIME,
    motivo_anulacion TEXT,

    -- Sincronización (MÁXIMA PRIORIDAD)
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE',
    sync_priority INTEGER DEFAULT 1,
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    sync_timestamp DATETIME,
    device_id CHAR(36) NOT NULL,
    creado_offline BOOLEAN DEFAULT 0,

    -- Timestamp
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE RESTRICT,
    FOREIGN KEY (sesion_caja_id) REFERENCES sesion_caja(id) ON DELETE RESTRICT,
    FOREIGN KEY (cajero_id) REFERENCES empleado(id) ON DELETE RESTRICT,
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE RESTRICT,
    FOREIGN KEY (anulado_por) REFERENCES empleado(id) ON DELETE SET NULL,
    FOREIGN KEY (device_id) REFERENCES dispositivo(id) ON DELETE RESTRICT
);

CREATE INDEX idx_pago_pedido ON pago(pedido_id);
CREATE INDEX idx_pago_sesion ON pago(sesion_caja_id);
CREATE INDEX idx_pago_sync ON pago(sync_status, sync_priority);
CREATE INDEX idx_pago_metodo ON pago(metodo);
CREATE INDEX idx_pago_fecha ON pago(created_at);
CREATE INDEX idx_pago_estado ON pago(estado);

-- Trigger: Prevenir modificación de pagos sincronizados
CREATE TRIGGER trigger_prevenir_mod_pago
BEFORE UPDATE ON pago
FOR EACH ROW
WHEN OLD.sync_status = 'SINCRONIZADO'
BEGIN
    SELECT RAISE(ABORT, 'FISCAL: No se pueden modificar pagos sincronizados');
END;

-- Trigger: Prevenir eliminación de pagos
CREATE TRIGGER trigger_prevenir_delete_pago
BEFORE DELETE ON pago
BEGIN
    SELECT RAISE(ABORT, 'FISCAL: No se pueden eliminar pagos. Usar anulación');
END;

-- ============================================================================
-- 3. SISTEMA DE SINCRONIZACIÓN
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1. SYNC_EVENT
-- ----------------------------------------------------------------------------
CREATE TABLE sync_event (
    id CHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),

    -- Identificación del evento
    tipo_entidad VARCHAR(50) NOT NULL,
    entidad_id CHAR(36) NOT NULL,
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('CREATE', 'UPDATE', 'DELETE', 'SYNC')),

    -- Evento
    evento VARCHAR(50) NOT NULL,

    -- Payload (JSON como TEXT)
    payload TEXT NOT NULL,
    payload_hash VARCHAR(64),

    -- Metadata
    version INTEGER DEFAULT 1,

    -- Origen
    device_id CHAR(36) NOT NULL,
    usuario_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,

    -- Timestamps
    client_timestamp DATETIME NOT NULL,
    server_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Estado
    procesado BOOLEAN DEFAULT 0,
    procesado_at DATETIME,
    error TEXT,

    -- Prioridad
    prioridad INTEGER DEFAULT 5 CHECK (prioridad BETWEEN 1 AND 10),

    -- Idempotencia
    idempotency_key VARCHAR(100) UNIQUE,

    FOREIGN KEY (device_id) REFERENCES dispositivo(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES empleado(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id)
);

CREATE INDEX idx_sync_event_entidad ON sync_event(tipo_entidad, entidad_id);
CREATE INDEX idx_sync_event_procesado ON sync_event(procesado, prioridad, client_timestamp);
CREATE INDEX idx_sync_event_device ON sync_event(device_id);
CREATE INDEX idx_sync_event_timestamp ON sync_event(server_timestamp);
CREATE UNIQUE INDEX idx_sync_event_idempotency ON sync_event(idempotency_key);
CREATE INDEX idx_sync_event_hash ON sync_event(payload_hash);

-- ============================================================================
-- 4. TABLAS ADICIONALES (KDS)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1. ESTACION_COCINA
-- ----------------------------------------------------------------------------
CREATE TABLE estacion_cocina (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#ef4444',
    sucursal_id INTEGER NOT NULL,

    tiempo_alerta_minutos INTEGER DEFAULT 15,
    impresora_ip VARCHAR(50),

    activa BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE CASCADE
);

-- Agregar FK a producto y detalle_pedido
-- (En SQLite no se puede ALTER TABLE ADD FOREIGN KEY después,
--  así que estacion_cocina_id ya está incluido arriba)

-- ----------------------------------------------------------------------------
-- 4.2. ORDEN_COCINA
-- ----------------------------------------------------------------------------
CREATE TABLE orden_cocina (
    id CHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),

    -- Relaciones
    detalle_pedido_id CHAR(36) NOT NULL,
    pedido_id CHAR(36) NOT NULL,
    estacion_id INTEGER NOT NULL,

    -- Información
    mesa_numero VARCHAR(10) NOT NULL,
    producto_nombre VARCHAR(150) NOT NULL,
    cantidad DECIMAL(8,2) NOT NULL,
    modificadores TEXT, -- JSON
    notas TEXT,

    -- Estado
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'en_preparacion', 'listo', 'servido', 'cancelado')),

    -- Tiempos
    tiempo_estimado INTEGER,
    tiempo_real INTEGER,

    -- Prioridad
    prioridad INTEGER DEFAULT 1 CHECK (prioridad IN (1, 2, 3)),

    -- Timestamps
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    served_at DATETIME,

    -- Cocinero
    cocinero_id INTEGER,

    FOREIGN KEY (detalle_pedido_id) REFERENCES detalle_pedido(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
    FOREIGN KEY (estacion_id) REFERENCES estacion_cocina(id) ON DELETE RESTRICT,
    FOREIGN KEY (cocinero_id) REFERENCES empleado(id) ON DELETE SET NULL
);

CREATE INDEX idx_orden_estacion ON orden_cocina(estacion_id, estado);
CREATE INDEX idx_orden_prioridad ON orden_cocina(prioridad, received_at);

-- ============================================================================
-- 5. AUDITORÍA
-- ============================================================================

CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Quién
    usuario_id INTEGER,
    device_id CHAR(36),
    ip_address VARCHAR(45),

    -- Qué
    accion VARCHAR(100) NOT NULL,
    entidad_tipo VARCHAR(50) NOT NULL,
    entidad_id VARCHAR(100),

    -- Cambios (JSON como TEXT)
    valores_anteriores TEXT,
    valores_nuevos TEXT,

    -- Contexto
    sucursal_id INTEGER,
    sesion_caja_id CHAR(36),

    -- Timestamp
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES empleado(id),
    FOREIGN KEY (device_id) REFERENCES dispositivo(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id)
);

CREATE INDEX idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX idx_audit_accion ON audit_log(accion);
CREATE INDEX idx_audit_entidad ON audit_log(entidad_tipo, entidad_id);
CREATE INDEX idx_audit_fecha ON audit_log(created_at);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 'Schema MVP Híbrido SQLite creado exitosamente' AS status;
SELECT 'Tablas creadas: 18' AS tablas;
SELECT 'Triggers de fiscalidad: 2 (pagos)' AS triggers;
SELECT 'Listo para desarrollo offline-first' AS nota;
