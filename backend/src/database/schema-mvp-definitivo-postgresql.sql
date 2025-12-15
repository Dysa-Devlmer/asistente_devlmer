-- ============================================================================
-- SCHEMA DEFINITIVO MVP - SYSME TPV
-- Base de Datos: PostgreSQL (PRODUCCIÓN)
-- Versión: 1.0.0-MVP
-- Fecha: 14 Enero 2025
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CONFIGURACIÓN Y MAESTROS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- TABLA: sucursal
-- Propósito: Gestión multi-sucursal (hasta 5 sucursales)
-- -----------------------------------------------------------------------------
CREATE TABLE sucursal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(10) NOT NULL UNIQUE, -- 'SUC001', 'SUC002'
    nombre VARCHAR(100) NOT NULL,
    rut VARCHAR(12) NOT NULL, -- RUT Chile: 12.345.678-9
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'America/Santiago',
    esta_activa BOOLEAN DEFAULT TRUE,
    configuracion JSONB DEFAULT '{}', -- Config específica sucursal
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sucursal IS 'Gestión multi-sucursal - hasta 5 sucursales';
COMMENT ON COLUMN sucursal.rut IS 'RUT de la sucursal (Chile)';

-- -----------------------------------------------------------------------------
-- TABLA: dispositivo
-- Propósito: Control de dispositivos POS (hasta 9 por sucursal)
-- -----------------------------------------------------------------------------
CREATE TABLE dispositivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursal(id) ON DELETE RESTRICT,
    codigo VARCHAR(20) NOT NULL UNIQUE, -- 'POS-01', 'CMD-01'
    nombre VARCHAR(50) NOT NULL, -- 'Caja Principal', 'Comandero 1'
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('CAJA', 'COMANDERO', 'COCINA', 'BARRA')),
    dispositivo_info JSONB DEFAULT '{}', -- user-agent, IP, MAC, etc.
    esta_activo BOOLEAN DEFAULT TRUE,
    ultima_sincronizacion TIMESTAMPTZ,
    version_app VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE dispositivo IS 'Control dispositivos POS - máximo 9 por sucursal';
COMMENT ON COLUMN dispositivo.tipo IS 'CAJA: punto venta fijo, COMANDERO: móvil meseros, COCINA: KDS, BARRA: display bar';

CREATE INDEX idx_dispositivo_sucursal ON dispositivo(sucursal_id);

-- -----------------------------------------------------------------------------
-- TABLA: empleado
-- Propósito: Gestión de usuarios con RUT, sucursal y roles
-- -----------------------------------------------------------------------------
CREATE TABLE empleado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursal(id) ON DELETE RESTRICT,
    rut VARCHAR(12) NOT NULL UNIQUE, -- RUT Chile obligatorio
    nombres VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50),
    email VARCHAR(100),
    telefono VARCHAR(20),
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('ADMIN', 'GERENTE', 'CAJERO', 'MESERO', 'COCINA', 'BARRA', 'BARMAN')),
    pin_code VARCHAR(6), -- PIN numérico para login rápido
    password_hash TEXT, -- Bcrypt hash para login web
    esta_activo BOOLEAN DEFAULT TRUE,
    foto_url TEXT,
    fecha_ingreso DATE,
    fecha_salida DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE empleado IS 'Empleados con RUT, sucursal y roles';
COMMENT ON COLUMN empleado.rut IS 'RUT empleado - obligatorio Chile';
COMMENT ON COLUMN empleado.pin_code IS 'PIN 4-6 dígitos para login rápido en POS';

CREATE INDEX idx_empleado_sucursal ON empleado(sucursal_id);
CREATE INDEX idx_empleado_rol ON empleado(rol);

-- -----------------------------------------------------------------------------
-- TABLA: zona
-- Propósito: Zonas del restaurante (Salón, Terraza, VIP, etc)
-- -----------------------------------------------------------------------------
CREATE TABLE zona (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursal(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL, -- 'Salón Principal', 'Terraza'
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Color hex para UI
    orden INTEGER DEFAULT 0,
    esta_activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE zona IS 'Zonas/áreas del restaurante para agrupar mesas';

CREATE INDEX idx_zona_sucursal ON zona(sucursal_id);

-- -----------------------------------------------------------------------------
-- TABLA: mesa
-- Propósito: Mesas con plano dinámico
-- -----------------------------------------------------------------------------
CREATE TABLE mesa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursal(id) ON DELETE CASCADE,
    zona_id UUID REFERENCES zona(id) ON DELETE SET NULL,
    numero VARCHAR(10) NOT NULL, -- '1', 'A1', 'BAR-5'
    capacidad INTEGER DEFAULT 4,
    estado VARCHAR(20) DEFAULT 'LIBRE' CHECK (estado IN ('LIBRE', 'OCUPADA', 'RESERVADA', 'LIMPIEZA', 'INACTIVA')),
    posicion_x INTEGER, -- Coordenadas para plano visual
    posicion_y INTEGER,
    forma VARCHAR(20) DEFAULT 'CUADRADA' CHECK (forma IN ('CUADRADA', 'RECTANGULAR', 'REDONDA', 'BARRA')),
    esta_activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sucursal_id, numero)
);

COMMENT ON TABLE mesa IS 'Mesas con soporte para plano dinámico visual';
COMMENT ON COLUMN mesa.posicion_x IS 'Posición X en canvas para plano visual';

CREATE INDEX idx_mesa_sucursal ON mesa(sucursal_id);
CREATE INDEX idx_mesa_estado ON mesa(estado);

-- -----------------------------------------------------------------------------
-- TABLA: categoria
-- Propósito: Categorías de productos
-- -----------------------------------------------------------------------------
CREATE TABLE categoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID REFERENCES sucursal(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#10B981',
    icono VARCHAR(50), -- Nombre del icono (ej: 'coffee', 'pizza')
    orden INTEGER DEFAULT 0,
    esta_activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categoria IS 'Categorías de productos del menú';

CREATE INDEX idx_categoria_sucursal ON categoria(sucursal_id);

-- -----------------------------------------------------------------------------
-- TABLA: producto
-- Propósito: Productos/items del menú
-- -----------------------------------------------------------------------------
CREATE TABLE producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID REFERENCES sucursal(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categoria(id) ON DELETE SET NULL,
    sku VARCHAR(50),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 0) NOT NULL, -- CLP sin decimales
    costo NUMERIC(10, 0), -- Para cálculo de margen
    aplica_iva BOOLEAN DEFAULT TRUE, -- IVA 19% Chile
    tipo VARCHAR(20) DEFAULT 'PRODUCTO' CHECK (tipo IN ('PRODUCTO', 'SERVICIO', 'MENU')),
    disponible BOOLEAN DEFAULT TRUE,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    requiere_preparacion BOOLEAN DEFAULT FALSE, -- Si va a cocina/barra
    estacion_cocina_id UUID, -- Referencia a estacion_cocina (lo crearemos después)
    tiempo_preparacion_min INTEGER, -- Minutos estimados
    imagen_url TEXT,
    esta_activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE producto IS 'Productos del menú - precios en CLP (sin decimales)';
COMMENT ON COLUMN producto.precio IS 'Precio en CLP - ej: 5000 = $5.000';

CREATE INDEX idx_producto_sucursal ON producto(sucursal_id);
CREATE INDEX idx_producto_categoria ON producto(categoria_id);
CREATE INDEX idx_producto_disponible ON producto(disponible);

-- ============================================================================
-- TRANSACCIONALES (UUID PK - OFFLINE FIRST)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- TABLA: caja
-- Propósito: Cajas físicas del punto de venta
-- -----------------------------------------------------------------------------
CREATE TABLE caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursal(id) ON DELETE RESTRICT,
    codigo VARCHAR(20) NOT NULL UNIQUE, -- 'CAJA-01', 'CAJA-02'
    nombre VARCHAR(100) NOT NULL, -- 'Caja Principal', 'Caja Express'
    tipo VARCHAR(20) DEFAULT 'PRINCIPAL' CHECK (tipo IN ('PRINCIPAL', 'EXPRESS', 'DELIVERY')),
    esta_activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE caja IS 'Cajas físicas del punto de venta';

CREATE INDEX idx_caja_sucursal ON caja(sucursal_id);

-- -----------------------------------------------------------------------------
-- TABLA: sesion_caja
-- Propósito: Turnos de caja con cierres fiscales
-- -----------------------------------------------------------------------------
CREATE TABLE sesion_caja (
    id UUID PRIMARY KEY, -- Generado en frontend (offline-first)
    caja_id UUID NOT NULL REFERENCES caja(id) ON DELETE RESTRICT,
    empleado_id UUID NOT NULL REFERENCES empleado(id) ON DELETE RESTRICT,
    sucursal_id UUID NOT NULL REFERENCES sucursal(id) ON DELETE RESTRICT,
    dispositivo_id UUID REFERENCES dispositivo(id) ON DELETE SET NULL,

    numero_sesion VARCHAR(20) NOT NULL UNIQUE, -- 'SES-20250114-001'
    fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,

    -- Montos
    monto_inicial NUMERIC(12, 0) NOT NULL DEFAULT 0, -- CLP
    monto_esperado NUMERIC(12, 0) DEFAULT 0, -- Total teórico
    monto_real NUMERIC(12, 0), -- Efectivo contado físicamente
    diferencia NUMERIC(12, 0) DEFAULT 0, -- Real - Esperado

    -- Desglose de pagos
    total_efectivo NUMERIC(12, 0) DEFAULT 0,
    total_tarjeta NUMERIC(12, 0) DEFAULT 0,
    total_transferencia NUMERIC(12, 0) DEFAULT 0,
    total_otros NUMERIC(12, 0) DEFAULT 0,
    total_propinas NUMERIC(12, 0) DEFAULT 0,

    -- Estado
    estado VARCHAR(20) DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'CERRADA', 'AUDITADA')),
    observaciones TEXT,

    -- Sincronización
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (sync_status IN ('PENDIENTE', 'SINCRONIZADO', 'ERROR')),
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sesion_caja IS 'Turnos/sesiones de caja con cierre fiscal';
COMMENT ON COLUMN sesion_caja.id IS 'UUID generado en frontend (offline-first)';
COMMENT ON COLUMN sesion_caja.diferencia IS 'Diferencia entre efectivo real vs esperado';

CREATE INDEX idx_sesion_caja_caja ON sesion_caja(caja_id);
CREATE INDEX idx_sesion_caja_empleado ON sesion_caja(empleado_id);
CREATE INDEX idx_sesion_caja_estado ON sesion_caja(estado);
CREATE INDEX idx_sesion_caja_fecha ON sesion_caja(fecha_apertura);
CREATE INDEX idx_sesion_sync_status ON sesion_caja(sync_status);

-- -----------------------------------------------------------------------------
-- TABLA: pedido
-- Propósito: Pedidos/cuentas de mesas
-- -----------------------------------------------------------------------------
CREATE TABLE pedido (
    id UUID PRIMARY KEY, -- Generado en frontend (offline-first)
    sucursal_id UUID NOT NULL REFERENCES sucursal(id) ON DELETE RESTRICT,
    mesa_id UUID REFERENCES mesa(id) ON DELETE SET NULL,
    empleado_id UUID NOT NULL REFERENCES empleado(id) ON DELETE RESTRICT, -- Mesero
    sesion_caja_id UUID REFERENCES sesion_caja(id) ON DELETE SET NULL,
    dispositivo_id UUID REFERENCES dispositivo(id) ON DELETE SET NULL,

    numero_pedido VARCHAR(20) NOT NULL UNIQUE, -- 'PED-20250114-001'

    -- Tipo de pedido
    tipo VARCHAR(20) DEFAULT 'MESA' CHECK (tipo IN ('MESA', 'LLEVAR', 'DELIVERY', 'BARRA')),

    -- Clientes
    numero_comensales INTEGER DEFAULT 1,
    nombre_cliente VARCHAR(100), -- Para llevar/delivery

    -- Montos (CLP sin decimales)
    subtotal NUMERIC(12, 0) DEFAULT 0, -- Sin IVA
    iva NUMERIC(12, 0) DEFAULT 0, -- IVA 19%
    descuento NUMERIC(12, 0) DEFAULT 0,
    propina NUMERIC(12, 0) DEFAULT 0, -- ⭐ Propinas obligatorio
    total NUMERIC(12, 0) DEFAULT 0,

    -- División de cuenta
    cuenta_dividida BOOLEAN DEFAULT FALSE, -- ⭐ División cuenta
    numero_divisiones INTEGER DEFAULT 1,

    -- Estado
    estado VARCHAR(20) DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'ENVIADO_COCINA', 'LISTO', 'ENTREGADO', 'PAGADO', 'CANCELADO')),

    -- Auditoría
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_envio_cocina TIMESTAMPTZ,
    fecha_entrega TIMESTAMPTZ,
    fecha_cierre TIMESTAMPTZ,

    observaciones TEXT,

    -- Sincronización
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (sync_status IN ('PENDIENTE', 'SINCRONIZADO', 'ERROR')),
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE pedido IS 'Pedidos/cuentas - UUID generado en frontend';
COMMENT ON COLUMN pedido.propina IS 'Propina obligatorio para cumplimiento fiscal Chile';
COMMENT ON COLUMN pedido.cuenta_dividida IS 'Indica si la cuenta fue dividida entre comensales';

CREATE INDEX idx_pedido_sucursal ON pedido(sucursal_id);
CREATE INDEX idx_pedido_mesa ON pedido(mesa_id);
CREATE INDEX idx_pedido_estado ON pedido(estado);
CREATE INDEX idx_pedido_fecha ON pedido(fecha_creacion);
CREATE INDEX idx_pedido_sync_status ON pedido(sync_status);

-- -----------------------------------------------------------------------------
-- TABLA: detalle_pedido
-- Propósito: Items/productos del pedido
-- -----------------------------------------------------------------------------
CREATE TABLE detalle_pedido (
    id UUID PRIMARY KEY, -- Generado en frontend
    pedido_id UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES producto(id) ON DELETE RESTRICT,

    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(10, 0) NOT NULL, -- Precio al momento del pedido
    descuento_unitario NUMERIC(10, 0) DEFAULT 0,
    subtotal NUMERIC(12, 0) NOT NULL, -- cantidad * (precio - descuento)

    observaciones TEXT, -- 'Sin cebolla', 'Término medio'
    modificadores JSONB DEFAULT '[]', -- [{id: uuid, nombre: 'Extra queso', precio: 500}]

    -- Estado preparación
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO')),
    enviado_cocina BOOLEAN DEFAULT FALSE,
    fecha_envio_cocina TIMESTAMPTZ,

    -- División de cuenta
    division_info JSONB DEFAULT '{}', -- {comensal: 1, grupo: 'A'}

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE detalle_pedido IS 'Items de pedido - soporte división cuenta y modificadores';

CREATE INDEX idx_detalle_pedido ON detalle_pedido(pedido_id);
CREATE INDEX idx_detalle_producto ON detalle_pedido(producto_id);
CREATE INDEX idx_detalle_estado ON detalle_pedido(estado);

-- -----------------------------------------------------------------------------
-- TABLA: pago
-- Propósito: Pagos de pedidos (INMUTABLES fiscalmente)
-- -----------------------------------------------------------------------------
CREATE TABLE pago (
    id UUID PRIMARY KEY, -- Generado en frontend
    pedido_id UUID NOT NULL REFERENCES pedido(id) ON DELETE RESTRICT, -- NO CASCADE
    sesion_caja_id UUID NOT NULL REFERENCES sesion_caja(id) ON DELETE RESTRICT,
    empleado_id UUID NOT NULL REFERENCES empleado(id) ON DELETE RESTRICT, -- Cajero
    sucursal_id UUID NOT NULL REFERENCES sucursal(id) ON DELETE RESTRICT,
    dispositivo_id UUID REFERENCES dispositivo(id) ON DELETE SET NULL,

    numero_pago VARCHAR(20) NOT NULL UNIQUE, -- 'PAY-20250114-001'

    -- Método de pago
    metodo VARCHAR(20) NOT NULL CHECK (metodo IN ('EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'MIXTO', 'OTRO')),

    -- Pago mixto
    es_mixto BOOLEAN DEFAULT FALSE, -- ⭐ Soporte pago mixto
    detalle_mixto JSONB DEFAULT '[]', -- [{metodo: 'EFECTIVO', monto: 5000}, {metodo: 'TARJETA', monto: 3000}]

    -- Montos
    monto NUMERIC(12, 0) NOT NULL, -- Monto total pagado
    propina NUMERIC(12, 0) DEFAULT 0, -- Propina incluida

    -- Info adicional
    referencia_externa VARCHAR(100), -- Número transacción tarjeta
    banco VARCHAR(50),
    ultimos_4_digitos VARCHAR(4), -- Tarjeta

    -- Estado (INMUTABLE cuando SINCRONIZADO)
    estado VARCHAR(20) DEFAULT 'COMPLETADO' CHECK (estado IN ('COMPLETADO', 'ANULADO')),
    anulado_por UUID REFERENCES empleado(id),
    fecha_anulacion TIMESTAMPTZ,
    motivo_anulacion TEXT,

    fecha_pago TIMESTAMPTZ DEFAULT NOW(),

    -- Sincronización (PRIORIDAD MÁXIMA)
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (sync_status IN ('PENDIENTE', 'SINCRONIZADO', 'ERROR')),
    sync_priority INTEGER DEFAULT 1, -- ⭐ PRIORIDAD 1 = MÁXIMA
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    synced_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE pago IS 'Pagos INMUTABLES fiscalmente - prioridad máxima en sync';
COMMENT ON COLUMN pago.es_mixto IS 'TRUE si el pago usa múltiples métodos';
COMMENT ON COLUMN pago.sync_priority IS '1=MÁXIMA (pagos), 2=ALTA (caja), 3-10=MEDIA/BAJA';

CREATE INDEX idx_pago_pedido ON pago(pedido_id);
CREATE INDEX idx_pago_sesion_caja ON pago(sesion_caja_id);
CREATE INDEX idx_pago_metodo ON pago(metodo);
CREATE INDEX idx_pago_fecha ON pago(fecha_pago);
CREATE INDEX idx_pago_sync_status ON pago(sync_status);
CREATE INDEX idx_pago_sync_priority ON pago(sync_priority); -- Para ordenar sync

-- ============================================================================
-- SINCRONIZACIÓN
-- ============================================================================

-- -----------------------------------------------------------------------------
-- TABLA: sync_event
-- Propósito: Event sourcing para sincronización offline
-- -----------------------------------------------------------------------------
CREATE TABLE sync_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispositivo_id UUID NOT NULL REFERENCES dispositivo(id) ON DELETE CASCADE,
    sucursal_id UUID NOT NULL REFERENCES sucursal(id) ON DELETE CASCADE,

    -- Tipo de evento
    event_type VARCHAR(50) NOT NULL, -- 'PEDIDO_CREADO', 'PAGO_REGISTRADO', 'MESA_LIBERADA'
    entity_type VARCHAR(50) NOT NULL, -- 'pedido', 'pago', 'sesion_caja'
    entity_id UUID NOT NULL, -- ID de la entidad afectada

    -- Payload del evento
    payload JSONB NOT NULL, -- Datos completos del evento

    -- Metadata
    user_id UUID REFERENCES empleado(id),
    client_timestamp TIMESTAMPTZ NOT NULL, -- Timestamp del dispositivo
    server_timestamp TIMESTAMPTZ DEFAULT NOW(), -- Timestamp servidor

    -- Sincronización
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (sync_status IN ('PENDIENTE', 'PROCESADO', 'ERROR', 'IGNORADO')),
    sync_priority INTEGER DEFAULT 5, -- 1=MÁXIMA, 10=BAJA
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    processed_at TIMESTAMPTZ,

    -- Idempotencia
    idempotency_key VARCHAR(100) UNIQUE, -- Para evitar duplicados

    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sync_event IS 'Event sourcing para sincronización offline-first';
COMMENT ON COLUMN sync_event.idempotency_key IS 'Clave única para evitar procesar evento duplicado';
COMMENT ON COLUMN sync_event.client_timestamp IS 'Timestamp del dispositivo (puede estar desfasado)';

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
-- Propósito: Estaciones de preparación (KDS - Kitchen Display System)
-- -----------------------------------------------------------------------------
CREATE TABLE estacion_cocina (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursal(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL, -- 'Cocina Caliente', 'Barra', 'Postres'
    codigo VARCHAR(20) UNIQUE, -- 'COCINA-01', 'BARRA-01'
    tipo VARCHAR(20) CHECK (tipo IN ('COCINA', 'BARRA', 'POSTRES', 'PARRILLA', 'ENSALADAS')),
    orden INTEGER DEFAULT 0,
    color VARCHAR(7) DEFAULT '#EF4444',
    esta_activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE estacion_cocina IS 'Estaciones de preparación para KDS';

-- Ahora podemos agregar la FK en producto
ALTER TABLE producto ADD CONSTRAINT fk_producto_estacion
    FOREIGN KEY (estacion_cocina_id) REFERENCES estacion_cocina(id) ON DELETE SET NULL;

CREATE INDEX idx_estacion_sucursal ON estacion_cocina(sucursal_id);

-- ============================================================================
-- TRIGGERS DE FISCALIDAD (INMUTABILIDAD DE PAGOS)
-- ============================================================================

-- Función para prevenir modificación de pagos sincronizados
CREATE OR REPLACE FUNCTION prevenir_modificacion_pago()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.sync_status = 'SINCRONIZADO' THEN
        RAISE EXCEPTION 'FISCAL: No se pueden modificar pagos sincronizados. Use anulación compensatoria.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger UPDATE
CREATE TRIGGER trigger_prevenir_mod_pago
BEFORE UPDATE ON pago
FOR EACH ROW
EXECUTE FUNCTION prevenir_modificacion_pago();

-- Función para prevenir eliminación de pagos sincronizados
CREATE OR REPLACE FUNCTION prevenir_eliminacion_pago()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.sync_status = 'SINCRONIZADO' THEN
        RAISE EXCEPTION 'FISCAL: No se pueden eliminar pagos sincronizados. Use anulación con motivo.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger DELETE
CREATE TRIGGER trigger_prevenir_del_pago
BEFORE DELETE ON pago
FOR EACH ROW
EXECUTE FUNCTION prevenir_eliminacion_pago();

-- ============================================================================
-- TRIGGERS DE AUDITORÍA (updated_at)
-- ============================================================================

CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER trigger_updated_sucursal BEFORE UPDATE ON sucursal FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_updated_dispositivo BEFORE UPDATE ON dispositivo FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_updated_empleado BEFORE UPDATE ON empleado FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_updated_zona BEFORE UPDATE ON zona FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_updated_mesa BEFORE UPDATE ON mesa FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_updated_categoria BEFORE UPDATE ON categoria FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_updated_producto BEFORE UPDATE ON producto FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_updated_caja BEFORE UPDATE ON caja FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_updated_sesion_caja BEFORE UPDATE ON sesion_caja FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_updated_pedido BEFORE UPDATE ON pedido FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_updated_detalle_pedido BEFORE UPDATE ON detalle_pedido FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_updated_pago BEFORE UPDATE ON pago FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE TRIGGER trigger_updated_estacion_cocina BEFORE UPDATE ON estacion_cocina FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- ============================================================================
-- COMENTARIOS FINALES
-- ============================================================================

COMMENT ON DATABASE postgres IS 'SYSME TPV - Sistema de Punto de Venta Hostelería - MVP v1.0';

-- ============================================================================
-- RESUMEN DEL SCHEMA
-- ============================================================================
--
-- ✅ TABLAS OBLIGATORIAS (15 totales):
--    1. sucursal - Multi-sucursal
--    2. dispositivo - Multi-dispositivo (hasta 9)
--    3. empleado - Con RUT, sucursal, roles
--    4. zona - Zonas del restaurante
--    5. mesa - Mesas con plano dinámico
--    6. categoria - Categorías productos
--    7. producto - Productos del menú
--    8. caja - Cajas físicas
--    9. sesion_caja - Turnos con cierre fiscal
--   10. pedido - Pedidos/cuentas (UUID PK)
--   11. detalle_pedido - Items del pedido
--   12. pago - Pagos INMUTABLES (UUID PK)
--   13. sync_event - Event sourcing offline
--   14. estacion_cocina - KDS
--
-- ✅ CARACTERÍSTICAS CLAVE:
--    - UUID como PK en tablas transaccionales (offline-first)
--    - Campos de sincronización (sync_status, sync_retries)
--    - Estados en vez de deletes (esta_activa, estado)
--    - Soporte pago mixto (es_mixto, detalle_mixto)
--    - Relación clara pedido ↔ sesion_caja
--    - Triggers fiscales (pagos inmutables)
--    - Event sourcing para sync
--    - Cumplimiento fiscal Chile (RUT, IVA 19%, propinas)
--
-- ============================================================================
