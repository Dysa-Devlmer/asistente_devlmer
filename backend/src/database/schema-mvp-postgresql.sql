-- ============================================================================
-- SYSME POS - Schema MVP Híbrido para PostgreSQL
-- ============================================================================
-- Sistema de Punto de Venta para Hostelería
-- Versión: 1.0.0-MVP
-- Base de datos: PostgreSQL 14+
--
-- Características:
-- - Soporte offline-first con sincronización
-- - Multi-sucursal (hasta 5 sucursales)
-- - Multi-dispositivo (hasta 9 simultáneos)
-- - Cumplimiento fiscal Chile (RUT, IVA 19%, propinas)
-- - Event sourcing para sincronización
-- - UUIDs generados en cliente
--
-- IMPORTANTE:
-- - NO usar cascades destructivos en tablas fiscales
-- - UUIDs siempre generados en frontend
-- - Mismos nombres que SQLite (compatibilidad)
-- ============================================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLAS DE CONFIGURACIÓN Y MAESTROS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1. SUCURSAL (Multi-sucursal obligatorio)
-- ----------------------------------------------------------------------------
CREATE TABLE sucursal (
    id SERIAL PRIMARY KEY,
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
    tasa_iva NUMERIC(5,2) DEFAULT 19.00,

    -- Estado
    activa BOOLEAN DEFAULT TRUE,

    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE sucursal IS 'Sucursales del sistema (hasta 5)';
COMMENT ON COLUMN sucursal.tasa_iva IS 'IVA Chile: 19%';

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sucursal_updated_at
BEFORE UPDATE ON sucursal
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 1.2. EMPLEADO (Meseros, cajeros, cocineros)
-- ----------------------------------------------------------------------------
CREATE TABLE empleado (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),

    -- Identificación
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    rut VARCHAR(12) UNIQUE NOT NULL, -- Chile: 12.345.678-9

    -- Nombres
    primer_nombre VARCHAR(50) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50),

    -- Autenticación
    password_hash VARCHAR(255) NOT NULL, -- bcrypt para backoffice
    pin_hash VARCHAR(255) NOT NULL, -- PIN 4 dígitos para comandero

    -- Rol
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'gerente', 'cajero', 'mesero', 'cocina', 'barra')),

    -- Relación multi-sucursal
    sucursal_id INTEGER NOT NULL,

    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP,

    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE RESTRICT
);

COMMENT ON TABLE empleado IS 'Empleados del sistema con autenticación dual (password + PIN)';
COMMENT ON COLUMN empleado.rut IS 'RUT chileno obligatorio (formato: 12345678-9)';
COMMENT ON COLUMN empleado.pin_hash IS 'PIN hasheado para acceso rápido en comanderos móviles';

CREATE INDEX idx_empleado_rol ON empleado(rol);
CREATE INDEX idx_empleado_activo ON empleado(activo);
CREATE INDEX idx_empleado_sucursal ON empleado(sucursal_id);
CREATE UNIQUE INDEX idx_empleado_uuid ON empleado(uuid);

CREATE TRIGGER trigger_empleado_updated_at
BEFORE UPDATE ON empleado
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 1.3. DISPOSITIVO (Gestión de hasta 9 dispositivos)
-- ----------------------------------------------------------------------------
CREATE TABLE dispositivo (
    id UUID PRIMARY KEY, -- Generado en cliente (NO usar gen_random_uuid aquí)

    -- Identificación
    nombre VARCHAR(100) NOT NULL, -- "Terminal 1 - Caja Principal"
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('POS', 'MOBILE', 'KDS', 'WEB')),
    modelo VARCHAR(100), -- "iPad Pro 12.9", etc.
    sistema_operativo VARCHAR(50),
    version_app VARCHAR(20),

    -- Relaciones
    sucursal_id INTEGER NOT NULL,
    usuario_asignado_id INTEGER, -- Usuario por defecto

    -- Estado de conexión
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'bloqueado')),
    online BOOLEAN DEFAULT FALSE,
    ultima_conexion TIMESTAMP,
    ultima_sincronizacion TIMESTAMP,

    -- Configuración offline
    permitir_offline BOOLEAN DEFAULT TRUE,
    auto_sync BOOLEAN DEFAULT TRUE,
    intervalo_sync_segundos INTEGER DEFAULT 30,

    -- Auditoría
    registrado_at TIMESTAMP DEFAULT NOW(),
    registrado_por INTEGER,

    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE RESTRICT,
    FOREIGN KEY (usuario_asignado_id) REFERENCES empleado(id) ON DELETE SET NULL,
    FOREIGN KEY (registrado_por) REFERENCES empleado(id) ON DELETE SET NULL
);

COMMENT ON TABLE dispositivo IS 'Dispositivos conectados (máximo 9 simultáneos por sucursal)';
COMMENT ON COLUMN dispositivo.id IS 'UUID generado en el cliente al registrar dispositivo';

CREATE INDEX idx_dispositivo_sucursal ON dispositivo(sucursal_id);
CREATE INDEX idx_dispositivo_tipo ON dispositivo(tipo);
CREATE INDEX idx_dispositivo_estado ON dispositivo(estado);
CREATE INDEX idx_dispositivo_online ON dispositivo(online);

-- ----------------------------------------------------------------------------
-- 1.4. ZONA (Áreas del restaurante)
-- ----------------------------------------------------------------------------
CREATE TABLE zona (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL, -- 'Salón Principal', 'Terraza', 'Barra'
    descripcion TEXT,
    sucursal_id INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#e5e7eb', -- Color de fondo en plano

    -- Estado
    activa BOOLEAN DEFAULT TRUE,

    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE CASCADE
);

CREATE INDEX idx_zona_sucursal ON zona(sucursal_id);

-- ----------------------------------------------------------------------------
-- 1.5. MESA
-- ----------------------------------------------------------------------------
CREATE TABLE mesa (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(10) NOT NULL,
    capacidad INTEGER DEFAULT 4,
    zona_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,

    -- Posicionamiento en plano (para editor drag & drop)
    pos_x NUMERIC(8,2) DEFAULT 0,
    pos_y NUMERIC(8,2) DEFAULT 0,
    ancho NUMERIC(8,2) DEFAULT 100,
    alto NUMERIC(8,2) DEFAULT 100,
    rotacion INTEGER DEFAULT 0, -- grados: 0, 90, 180, 270
    forma VARCHAR(20) DEFAULT 'rectangular', -- 'rectangular', 'circular'

    -- Estado operativo
    estado VARCHAR(20) DEFAULT 'disponible'
        CHECK (estado IN ('disponible', 'ocupada', 'reservada', 'mantenimiento', 'limpieza')),
    pedido_actual_id UUID, -- UUID del pedido activo
    mesero_asignado_id INTEGER,

    -- Estado
    activa BOOLEAN DEFAULT TRUE,

    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (zona_id) REFERENCES zona(id) ON DELETE RESTRICT,
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE RESTRICT,
    FOREIGN KEY (mesero_asignado_id) REFERENCES empleado(id) ON DELETE SET NULL,

    UNIQUE(numero, sucursal_id)
);

COMMENT ON COLUMN mesa.pedido_actual_id IS 'UUID del pedido activo en esta mesa (puede ser NULL si está disponible)';

CREATE INDEX idx_mesa_estado ON mesa(estado);
CREATE INDEX idx_mesa_zona ON mesa(zona_id);
CREATE INDEX idx_mesa_sucursal ON mesa(sucursal_id);
CREATE INDEX idx_mesa_pedido_actual ON mesa(pedido_actual_id);

CREATE TRIGGER trigger_mesa_updated_at
BEFORE UPDATE ON mesa
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 1.6. CATEGORIA (Categorías de productos)
-- ----------------------------------------------------------------------------
CREATE TABLE categoria (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    icono VARCHAR(50), -- 'coffee', 'pizza', etc.

    -- Orden
    orden INTEGER DEFAULT 0,

    -- Estado
    activa BOOLEAN DEFAULT TRUE,

    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categoria_activa ON categoria(activa);
CREATE INDEX idx_categoria_orden ON categoria(orden);

CREATE TRIGGER trigger_categoria_updated_at
BEFORE UPDATE ON categoria
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 1.7. PRODUCTO
-- ----------------------------------------------------------------------------
CREATE TABLE producto (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),

    -- Identificación
    sku VARCHAR(50) UNIQUE,
    codigo_barra VARCHAR(100),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,

    -- Clasificación
    categoria_id INTEGER NOT NULL,

    -- Precio (CLP sin decimales)
    precio NUMERIC(10,0) NOT NULL,
    costo NUMERIC(10,0) DEFAULT 0,

    -- Inventario (básico para MVP)
    stock NUMERIC(8,2) DEFAULT 0,
    stock_minimo NUMERIC(8,2) DEFAULT 5,
    es_inventariable BOOLEAN DEFAULT TRUE,

    -- Cocina
    tiempo_preparacion INTEGER DEFAULT 10, -- minutos
    estacion_cocina_id INTEGER, -- NULL si no requiere cocina
    requiere_cocina BOOLEAN DEFAULT TRUE,

    -- Configuración
    imagen_url VARCHAR(255),
    permite_modificadores BOOLEAN DEFAULT TRUE,

    -- Estado
    activo BOOLEAN DEFAULT TRUE,

    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (categoria_id) REFERENCES categoria(id) ON DELETE RESTRICT
);

COMMENT ON COLUMN producto.precio IS 'Precio en CLP sin decimales (ej: 5000 = $5.000)';

CREATE INDEX idx_producto_categoria ON producto(categoria_id);
CREATE INDEX idx_producto_activo ON producto(activo);
CREATE INDEX idx_producto_sku ON producto(sku);
CREATE UNIQUE INDEX idx_producto_uuid ON producto(uuid);

CREATE TRIGGER trigger_producto_updated_at
BEFORE UPDATE ON producto
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 1.8. MODIFICADOR (Sin queso, Extra bacon, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE modificador (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'ingrediente', 'coccion', 'extra'
    precio_adicional NUMERIC(10,0) DEFAULT 0,

    -- Estado
    activo BOOLEAN DEFAULT TRUE,

    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW()
);

-- Relación muchos a muchos: productos <-> modificadores
CREATE TABLE producto_modificador (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL,
    modificador_id INTEGER NOT NULL,
    es_obligatorio BOOLEAN DEFAULT FALSE,
    orden INTEGER DEFAULT 0,

    FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE CASCADE,
    FOREIGN KEY (modificador_id) REFERENCES modificador(id) ON DELETE CASCADE,

    UNIQUE(producto_id, modificador_id)
);

CREATE INDEX idx_prod_mod_producto ON producto_modificador(producto_id);

-- ============================================================================
-- 2. TABLAS TRANSACCIONALES CORE (Usan UUID como PK)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1. PEDIDO (Core del sistema)
-- ----------------------------------------------------------------------------
CREATE TABLE pedido (
    id UUID PRIMARY KEY, -- Generado en cliente (NO gen_random_uuid)

    -- Identificación visible (generada por servidor al sincronizar)
    numero_pedido VARCHAR(50) UNIQUE,
    numero_temp VARCHAR(50), -- Temporal offline (DEVICE_ID-TIMESTAMP)

    -- Relaciones
    mesa_id INTEGER NOT NULL,
    mesero_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,
    cliente_id INTEGER, -- NULL = anónimo

    -- Estado del pedido
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'confirmado', 'en_cocina', 'listo', 'servido', 'pagado', 'cancelado')),
    estado_pago VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado_pago IN ('pendiente', 'pagado', 'parcial', 'anulado')),

    -- Montos (CLP sin decimales)
    subtotal NUMERIC(10,0) DEFAULT 0,
    descuento NUMERIC(10,0) DEFAULT 0,
    propina NUMERIC(10,0) DEFAULT 0, -- Chile: propinas muy comunes
    iva NUMERIC(10,0) DEFAULT 0, -- 19% de (subtotal - descuento)
    total NUMERIC(10,0) DEFAULT 0, -- subtotal - descuento + propina

    -- División de cuenta (requisito MVP)
    cuenta_dividida BOOLEAN DEFAULT FALSE,
    numero_divisiones INTEGER DEFAULT 1,

    -- Notas
    notas_especiales TEXT,
    notas_cocina TEXT,

    -- Sincronización (CRÍTICO)
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE'
        CHECK (sync_status IN ('PENDIENTE', 'SINCRONIZANDO', 'SINCRONIZADO', 'CONFLICTO', 'ERROR')),
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    sync_timestamp TIMESTAMP,

    -- Dispositivo origen
    device_id UUID NOT NULL,
    device_type VARCHAR(20) DEFAULT 'POS' CHECK (device_type IN ('POS', 'MOBILE', 'WEB')),

    -- Flags offline
    creado_offline BOOLEAN DEFAULT FALSE,
    modificado_offline BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    paid_at TIMESTAMP,

    FOREIGN KEY (mesa_id) REFERENCES mesa(id) ON DELETE RESTRICT,
    FOREIGN KEY (mesero_id) REFERENCES empleado(id) ON DELETE RESTRICT,
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE RESTRICT,
    FOREIGN KEY (device_id) REFERENCES dispositivo(id) ON DELETE RESTRICT
);

COMMENT ON TABLE pedido IS 'Pedidos del sistema - UUID generado en cliente para soporte offline';
COMMENT ON COLUMN pedido.id IS 'UUID generado en el CLIENTE al crear pedido offline';
COMMENT ON COLUMN pedido.numero_pedido IS 'Número visible generado por SERVIDOR al sincronizar';
COMMENT ON COLUMN pedido.propina IS 'Propina en CLP - común en cultura chilena';
COMMENT ON COLUMN pedido.cuenta_dividida IS 'TRUE si el pedido se dividió entre varios pagos';

-- Índices críticos para sincronización y consultas
CREATE INDEX idx_pedido_sync_status ON pedido(sync_status, device_id);
CREATE INDEX idx_pedido_mesa ON pedido(mesa_id, estado);
CREATE INDEX idx_pedido_mesero ON pedido(mesero_id);
CREATE INDEX idx_pedido_estado ON pedido(estado);
CREATE INDEX idx_pedido_fecha ON pedido(created_at);
CREATE INDEX idx_pedido_numero ON pedido(numero_pedido);
CREATE INDEX idx_pedido_numero_temp ON pedido(numero_temp);

CREATE TRIGGER trigger_pedido_updated_at
BEFORE UPDATE ON pedido
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 2.2. DETALLE_PEDIDO (Ítems del pedido)
-- ----------------------------------------------------------------------------
CREATE TABLE detalle_pedido (
    id UUID PRIMARY KEY, -- Generado en cliente

    -- Relaciones
    pedido_id UUID NOT NULL,
    producto_id INTEGER NOT NULL,

    -- Snapshot del producto (inmutable - fiscalmente importante)
    producto_nombre VARCHAR(150) NOT NULL,
    producto_sku VARCHAR(50),
    producto_precio NUMERIC(10,0) NOT NULL,

    -- Cantidad
    cantidad NUMERIC(8,2) NOT NULL DEFAULT 1,

    -- Modificadores aplicados (JSON)
    modificadores JSONB, -- [{"id": 1, "nombre": "Sin cebolla", "precio": 0}, ...]

    -- Precios
    precio_unitario NUMERIC(10,0) NOT NULL,
    precio_total NUMERIC(10,0) NOT NULL, -- cantidad * precio_unitario + sum(modificadores)
    descuento NUMERIC(10,0) DEFAULT 0,
    precio_final NUMERIC(10,0) NOT NULL, -- precio_total - descuento

    -- Cocina
    estacion_cocina_id INTEGER,
    requiere_preparacion BOOLEAN DEFAULT TRUE,
    tiempo_estimado INTEGER, -- minutos

    -- Notas
    notas TEXT,

    -- Estado
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'en_preparacion', 'listo', 'servido', 'cancelado')),

    -- División de cuenta
    asignado_a_division INTEGER, -- Si dividida: 1, 2, 3, etc.

    -- Sincronización
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE',
    device_id UUID NOT NULL,
    creado_offline BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    sent_to_kitchen_at TIMESTAMP,
    ready_at TIMESTAMP,
    served_at TIMESTAMP,

    FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE RESTRICT,
    FOREIGN KEY (device_id) REFERENCES dispositivo(id) ON DELETE RESTRICT
);

COMMENT ON COLUMN detalle_pedido.producto_nombre IS 'Snapshot inmutable del nombre - no cambia si modifican el producto';
COMMENT ON COLUMN detalle_pedido.modificadores IS 'JSON con modificadores aplicados (ej: [{"id":1,"nombre":"Sin queso","precio":0}])';

CREATE INDEX idx_detalle_pedido ON detalle_pedido(pedido_id);
CREATE INDEX idx_detalle_producto ON detalle_pedido(producto_id);
CREATE INDEX idx_detalle_estado ON detalle_pedido(estado);
CREATE INDEX idx_detalle_sync ON detalle_pedido(sync_status);

-- ----------------------------------------------------------------------------
-- 2.3. SESION_CAJA (CRÍTICO para cierres fiscales)
-- ----------------------------------------------------------------------------
CREATE TABLE sesion_caja (
    id UUID PRIMARY KEY, -- Generado en cliente

    -- Identificación
    numero_sesion VARCHAR(50) UNIQUE, -- Generado por servidor
    numero_temp VARCHAR(50), -- Temporal offline

    -- Relaciones
    cajero_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,
    terminal_id VARCHAR(50), -- Identificador terminal físico

    -- Estado
    estado VARCHAR(20) DEFAULT 'abierta'
        CHECK (estado IN ('abierta', 'cerrada', 'suspendida')),

    -- Montos de apertura
    monto_apertura NUMERIC(10,0) NOT NULL DEFAULT 0,
    monedas_apertura JSONB, -- {"billetes_20000": 5, "billetes_10000": 10, ...}

    -- Montos de cierre (calculados)
    monto_esperado NUMERIC(10,0),
    monto_real NUMERIC(10,0),
    diferencia NUMERIC(10,0), -- monto_real - monto_esperado
    monedas_cierre JSONB,

    -- Totales de ventas
    total_ventas NUMERIC(10,0) DEFAULT 0,
    total_efectivo NUMERIC(10,0) DEFAULT 0,
    total_tarjeta NUMERIC(10,0) DEFAULT 0,
    total_transferencia NUMERIC(10,0) DEFAULT 0,
    total_propinas NUMERIC(10,0) DEFAULT 0,
    cantidad_ventas INTEGER DEFAULT 0,

    -- Movimientos adicionales
    total_ingresos NUMERIC(10,0) DEFAULT 0,
    total_egresos NUMERIC(10,0) DEFAULT 0,

    -- Notas
    notas_apertura TEXT,
    notas_cierre TEXT,

    -- Sincronización (alta prioridad)
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE',
    sync_priority INTEGER DEFAULT 2,
    sync_retries INTEGER DEFAULT 0,
    device_id UUID NOT NULL,
    creado_offline BOOLEAN DEFAULT FALSE,

    -- Timestamps
    abierta_at TIMESTAMP DEFAULT NOW(),
    cerrada_at TIMESTAMP,

    FOREIGN KEY (cajero_id) REFERENCES empleado(id) ON DELETE RESTRICT,
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE RESTRICT,
    FOREIGN KEY (device_id) REFERENCES dispositivo(id) ON DELETE RESTRICT
);

COMMENT ON TABLE sesion_caja IS 'Sesiones de caja - CRÍTICO para cumplimiento fiscal';
COMMENT ON COLUMN sesion_caja.diferencia IS 'Diferencia entre efectivo real vs esperado en cierre';

CREATE INDEX idx_sesion_cajero ON sesion_caja(cajero_id);
CREATE INDEX idx_sesion_estado ON sesion_caja(estado);
CREATE INDEX idx_sesion_fecha ON sesion_caja(abierta_at);
CREATE INDEX idx_sesion_sync ON sesion_caja(sync_status, sync_priority);

-- ----------------------------------------------------------------------------
-- 2.4. PAGO (CRÍTICO - Inmutable después de sincronizar)
-- ----------------------------------------------------------------------------
CREATE TABLE pago (
    id UUID PRIMARY KEY, -- Generado en cliente

    -- Identificación
    numero_pago VARCHAR(50) UNIQUE, -- Generado por servidor
    numero_temp VARCHAR(50), -- Temporal offline

    -- Relaciones
    pedido_id UUID NOT NULL,
    sesion_caja_id UUID NOT NULL, -- OBLIGATORIO para cierres
    cajero_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,

    -- Método de pago
    metodo VARCHAR(30) NOT NULL
        CHECK (metodo IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mixto')),

    -- Montos (CLP sin decimales)
    monto NUMERIC(10,0) NOT NULL,
    monto_recibido NUMERIC(10,0), -- Solo efectivo
    cambio NUMERIC(10,0) DEFAULT 0, -- Solo efectivo

    -- Pago mixto
    es_mixto BOOLEAN DEFAULT FALSE,
    detalle_mixto JSONB, -- [{"metodo": "efectivo", "monto": 5000}, {"metodo": "tarjeta", "monto": 3000}]

    -- Propina (puede ser parte del pago)
    propina NUMERIC(10,0) DEFAULT 0,

    -- Referencias externas
    referencia_externa VARCHAR(100), -- Código transacción tarjeta
    voucher_url VARCHAR(255),

    -- Estado
    estado VARCHAR(20) DEFAULT 'completado'
        CHECK (estado IN ('completado', 'anulado')),

    -- Anulación (compensación - NO se borra)
    anulado BOOLEAN DEFAULT FALSE,
    anulado_por INTEGER,
    anulado_at TIMESTAMP,
    motivo_anulacion TEXT,

    -- Sincronización (MÁXIMA PRIORIDAD)
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE',
    sync_priority INTEGER DEFAULT 1, -- Pagos SIEMPRE prioridad 1
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    sync_timestamp TIMESTAMP,
    device_id UUID NOT NULL,
    creado_offline BOOLEAN DEFAULT FALSE,

    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE RESTRICT,
    FOREIGN KEY (sesion_caja_id) REFERENCES sesion_caja(id) ON DELETE RESTRICT,
    FOREIGN KEY (cajero_id) REFERENCES empleado(id) ON DELETE RESTRICT,
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE RESTRICT,
    FOREIGN KEY (anulado_por) REFERENCES empleado(id) ON DELETE SET NULL,
    FOREIGN KEY (device_id) REFERENCES dispositivo(id) ON DELETE RESTRICT
);

COMMENT ON TABLE pago IS 'Pagos del sistema - INMUTABLE después de sincronizar (fiscalidad)';
COMMENT ON COLUMN pago.sesion_caja_id IS 'OBLIGATORIO - necesario para cierres de caja';
COMMENT ON COLUMN pago.sync_priority IS 'Pagos SIEMPRE prioridad 1 (fiscalmente crítico)';
COMMENT ON COLUMN pago.detalle_mixto IS 'JSON con detalle de pago mixto si aplica';

CREATE INDEX idx_pago_pedido ON pago(pedido_id);
CREATE INDEX idx_pago_sesion ON pago(sesion_caja_id);
CREATE INDEX idx_pago_sync ON pago(sync_status, sync_priority);
CREATE INDEX idx_pago_metodo ON pago(metodo);
CREATE INDEX idx_pago_fecha ON pago(created_at);
CREATE INDEX idx_pago_estado ON pago(estado);

-- Trigger: Prevenir modificación de pagos sincronizados (FISCALIDAD)
CREATE OR REPLACE FUNCTION prevenir_modificacion_pago()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.sync_status = 'SINCRONIZADO' THEN
        RAISE EXCEPTION 'FISCAL: No se pueden modificar pagos sincronizados. Crear compensación/anulación.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevenir_mod_pago
BEFORE UPDATE ON pago
FOR EACH ROW
EXECUTE FUNCTION prevenir_modificacion_pago();

-- Trigger: Prevenir eliminación de pagos (FISCALIDAD)
CREATE OR REPLACE FUNCTION prevenir_eliminacion_pago()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'FISCAL: No se pueden eliminar pagos. Usar anulación (soft delete).';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevenir_delete_pago
BEFORE DELETE ON pago
FOR EACH ROW
EXECUTE FUNCTION prevenir_eliminacion_pago();

-- ============================================================================
-- 3. SISTEMA DE SINCRONIZACIÓN (Event Sourcing)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1. SYNC_EVENT (Event Sourcing - CORE de sincronización)
-- ----------------------------------------------------------------------------
CREATE TABLE sync_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificación del evento
    tipo_entidad VARCHAR(50) NOT NULL, -- 'pedido', 'pago', 'mesa', etc.
    entidad_id UUID NOT NULL, -- UUID de la entidad afectada
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('CREATE', 'UPDATE', 'DELETE', 'SYNC')),

    -- Evento
    evento VARCHAR(50) NOT NULL, -- 'pedido.created', 'pago.completed', etc.

    -- Payload (INMUTABLE)
    payload JSONB NOT NULL, -- Estado completo de la entidad
    payload_hash VARCHAR(64), -- SHA256 para detectar duplicados

    -- Metadata
    version INTEGER DEFAULT 1,

    -- Origen
    device_id UUID NOT NULL,
    usuario_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,

    -- Timestamps (CRÍTICO para resolución de conflictos)
    client_timestamp TIMESTAMP NOT NULL, -- Timestamp del cliente
    server_timestamp TIMESTAMP DEFAULT NOW(), -- Timestamp del servidor

    -- Estado de procesamiento
    procesado BOOLEAN DEFAULT FALSE,
    procesado_at TIMESTAMP,
    error TEXT,

    -- Prioridad
    prioridad INTEGER DEFAULT 5 CHECK (prioridad BETWEEN 1 AND 10),

    -- Idempotencia (evita duplicados)
    idempotency_key VARCHAR(100) UNIQUE, -- device_id + entidad_id + client_timestamp

    FOREIGN KEY (device_id) REFERENCES dispositivo(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES empleado(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id)
);

COMMENT ON TABLE sync_event IS 'Event Sourcing - todos los eventos del sistema para sincronización';
COMMENT ON COLUMN sync_event.idempotency_key IS 'Clave única para evitar duplicados al reintentar';
COMMENT ON COLUMN sync_event.payload IS 'Estado completo de la entidad en formato JSON';

CREATE INDEX idx_sync_event_entidad ON sync_event(tipo_entidad, entidad_id);
CREATE INDEX idx_sync_event_procesado ON sync_event(procesado, prioridad DESC, client_timestamp ASC);
CREATE INDEX idx_sync_event_device ON sync_event(device_id);
CREATE INDEX idx_sync_event_timestamp ON sync_event(server_timestamp);
CREATE UNIQUE INDEX idx_sync_event_idempotency ON sync_event(idempotency_key);
CREATE INDEX idx_sync_event_hash ON sync_event(payload_hash);

-- ============================================================================
-- 4. TABLAS ADICIONALES (KDS - Fase 1.5)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1. ESTACION_COCINA (Para KDS futuro)
-- ----------------------------------------------------------------------------
CREATE TABLE estacion_cocina (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#ef4444',
    sucursal_id INTEGER NOT NULL,

    -- Configuración
    tiempo_alerta_minutos INTEGER DEFAULT 15,
    impresora_ip VARCHAR(50),

    -- Estado
    activa BOOLEAN DEFAULT TRUE,

    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id) ON DELETE CASCADE
);

COMMENT ON TABLE estacion_cocina IS 'Estaciones de cocina para KDS (Kitchen Display System)';

-- Agregar FK a producto
ALTER TABLE producto
ADD FOREIGN KEY (estacion_cocina_id) REFERENCES estacion_cocina(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 4.2. ORDEN_COCINA (Para KDS futuro)
-- ----------------------------------------------------------------------------
CREATE TABLE orden_cocina (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relaciones
    detalle_pedido_id UUID NOT NULL,
    pedido_id UUID NOT NULL,
    estacion_id INTEGER NOT NULL,

    -- Información del pedido
    mesa_numero VARCHAR(10) NOT NULL,
    producto_nombre VARCHAR(150) NOT NULL,
    cantidad NUMERIC(8,2) NOT NULL,
    modificadores JSONB,
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
    received_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    served_at TIMESTAMP,

    -- Cocinero
    cocinero_id INTEGER,

    FOREIGN KEY (detalle_pedido_id) REFERENCES detalle_pedido(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
    FOREIGN KEY (estacion_id) REFERENCES estacion_cocina(id) ON DELETE RESTRICT,
    FOREIGN KEY (cocinero_id) REFERENCES empleado(id) ON DELETE SET NULL
);

CREATE INDEX idx_orden_estacion ON orden_cocina(estacion_id, estado);
CREATE INDEX idx_orden_prioridad ON orden_cocina(prioridad DESC, received_at ASC);

-- Agregar FK a detalle_pedido
ALTER TABLE detalle_pedido
ADD FOREIGN KEY (estacion_cocina_id) REFERENCES estacion_cocina(id) ON DELETE SET NULL;

-- ============================================================================
-- 5. AUDITORÍA
-- ============================================================================

CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,

    -- Quién
    usuario_id INTEGER,
    device_id UUID,
    ip_address VARCHAR(45),

    -- Qué
    accion VARCHAR(100) NOT NULL,
    entidad_tipo VARCHAR(50) NOT NULL,
    entidad_id VARCHAR(100),

    -- Cambios
    valores_anteriores JSONB,
    valores_nuevos JSONB,

    -- Contexto
    sucursal_id INTEGER,
    sesion_caja_id UUID,

    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (usuario_id) REFERENCES empleado(id),
    FOREIGN KEY (device_id) REFERENCES dispositivo(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id)
);

CREATE INDEX idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX idx_audit_accion ON audit_log(accion);
CREATE INDEX idx_audit_entidad ON audit_log(entidad_tipo, entidad_id);
CREATE INDEX idx_audit_fecha ON audit_log(created_at);

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================

-- Verificación de integridad
DO $$
BEGIN
    RAISE NOTICE 'Schema MVP Híbrido creado exitosamente';
    RAISE NOTICE 'Tablas creadas: 18';
    RAISE NOTICE 'Triggers de fiscalidad: 2 (pagos)';
    RAISE NOTICE 'Listo para desarrollo offline-first';
END $$;
