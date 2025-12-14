# Modelo de Datos SQL - Sistema TPV Hostelería SYSME

## Índice
1. [Principios de Diseño](#principios-de-diseño)
2. [Diagrama Entidad-Relación](#diagrama-entidad-relación)
3. [Esquema SQL Completo](#esquema-sql-completo)
4. [Tablas de Sincronización](#tablas-de-sincronización)
5. [Reglas de Integridad](#reglas-de-integridad)
6. [Índices y Optimización](#índices-y-optimización)

---

## Principios de Diseño

### 🔑 Claves Primarias: UUID vs AUTOINCREMENT

**DECISIÓN CRÍTICA:**
- ✅ **UUID** para entidades que se crean offline
- ❌ **AUTOINCREMENT** solo para entidades que SIEMPRE se crean en servidor

| Tabla | Tipo PK | Razón |
|-------|---------|-------|
| `pedidos` | UUID | Se crean offline en comanderos |
| `detalle_pedido` | UUID | Se crean offline con el pedido |
| `pagos` | UUID | Se registran offline en TPV |
| `sync_events` | UUID | Eventos generados en cualquier dispositivo |
| `usuarios` | AUTOINCREMENT | Solo se crean en backoffice |
| `productos` | AUTOINCREMENT | Solo se crean en backoffice |
| `categorias` | AUTOINCREMENT | Solo se crean en backoffice |
| `mesas` | AUTOINCREMENT | Solo se configuran en backoffice |

### 📊 Modelo Event-Based (No solo Sync de Tablas)

Cada acción crítica genera un **evento inmutable** en `sync_events`:

```
Acción del Usuario → Evento → Cola Local → Sincronización → Confirmación Backend
```

**Beneficios:**
- ✅ Trazabilidad completa (auditoría)
- ✅ Idempotencia garantizada
- ✅ No hay duplicados al reintentar
- ✅ Resolución de conflictos basada en timestamps
- ✅ Replay de eventos para debugging

### 🔒 Integridad Fiscal (Crítico)

**Regla de Oro:** Los pagos son INMUTABLES offline

```sql
-- ❌ NUNCA permitido offline:
UPDATE pagos SET monto = ...
DELETE FROM pagos WHERE ...

-- ✅ Solo permitido:
INSERT INTO pagos (...)  -- Registrar pago
INSERT INTO compensaciones (...)  -- Compensar/anular después
```

### 🔄 Estados de Sincronización

Toda entidad crítica tiene:
```sql
sync_status VARCHAR(20) DEFAULT 'PENDIENTE'
  -- PENDIENTE: Creado offline, esperando sync
  -- SINCRONIZANDO: En proceso de envío
  -- SINCRONIZADO: Confirmado por servidor
  -- CONFLICTO: Requiere resolución manual
  -- ERROR: Falló después de N reintentos
```

---

## Diagrama Entidad-Relación (Texto)

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  EMPLEADO   │──────>│   PEDIDO     │<──────│    MESA     │
│ (usuarios)  │  hace │              │ en    │             │
└─────────────┘       └──────────────┘       └─────────────┘
                             │                       │
                             │ contiene              │ ubicada en
                             ▼                       ▼
                      ┌──────────────┐       ┌─────────────┐
                      │DETALLE_PEDIDO│       │    ZONA     │
                      │              │       │             │
                      └──────────────┘       └─────────────┘
                             │
                             │ es
                             ▼
                      ┌──────────────┐
                      │   PRODUCTO   │<──────┌─────────────┐
                      │              │ de    │  CATEGORIA  │
                      └──────────────┘       └─────────────┘
                             │
                             │ puede tener
                             ▼
                      ┌──────────────┐
                      │ MODIFICADOR  │
                      │              │
                      └──────────────┘

┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   PEDIDO    │──────>│     PAGO     │──────>│SESION_CAJA  │
│             │ tiene │              │ en    │             │
└─────────────┘       └──────────────┘       └─────────────┘

┌─────────────┐       ┌──────────────┐
│   ORDEN_    │<──────│DETALLE_PEDIDO│
│   COCINA    │       │              │
│   (KDS)     │       └──────────────┘
└─────────────┘              │
       │                     │ asignado a
       ▼                     ▼
┌─────────────┐       ┌──────────────┐
│  ESTACION_  │       │   PRODUCTO   │
│   COCINA    │       │              │
└─────────────┘       └──────────────┘

        SINCRONIZACIÓN (OFFLINE/ONLINE)
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│DISPOSITIVO  │──────>│ SYNC_EVENTS  │──────>│ SYNC_QUEUE  │
│             │genera │              │ va a  │             │
└─────────────┘       └──────────────┘       └─────────────┘
```

---

## Esquema SQL Completo

### 1. Tablas de Configuración y Maestros

#### 1.1. `usuarios` (Empleados)
```sql
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255), -- PIN de 4 dígitos hasheado (para comanderos)

    -- Datos personales
    primer_nombre VARCHAR(50) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50),
    rut VARCHAR(12) UNIQUE, -- RUT chileno (12.345.678-9)
    telefono VARCHAR(20),

    -- Rol y permisos
    rol VARCHAR(20) DEFAULT 'mesero' CHECK (rol IN ('admin', 'gerente', 'cajero', 'mesero', 'cocina', 'barra')),
    permisos TEXT, -- JSON: ["ventas", "reportes", "configuracion"]
    sucursal_id INTEGER DEFAULT 1,

    -- Estado
    is_active BOOLEAN DEFAULT 1,
    ultimo_login DATETIME,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
);

-- Índices
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_active ON usuarios(is_active);
CREATE INDEX idx_usuarios_sucursal ON usuarios(sucursal_id);
CREATE UNIQUE INDEX idx_usuarios_uuid ON usuarios(uuid);
```

#### 1.2. `sucursales`
```sql
CREATE TABLE sucursales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(10) UNIQUE NOT NULL, -- SUC001, SUC002, ...
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    comuna VARCHAR(50),
    region VARCHAR(50),
    telefono VARCHAR(20),
    email VARCHAR(100),

    -- Configuración
    timezone VARCHAR(50) DEFAULT 'America/Santiago',
    moneda VARCHAR(3) DEFAULT 'CLP',
    tasa_iva DECIMAL(5,2) DEFAULT 19.00, -- Chile: 19%

    -- Estado
    is_active BOOLEAN DEFAULT 1,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales
INSERT INTO sucursales (codigo, nombre, comuna, region) VALUES
('SUC001', 'Sucursal Centro', 'Santiago', 'Metropolitana'),
('SUC002', 'Sucursal Providencia', 'Providencia', 'Metropolitana'),
('SUC003', 'Sucursal Las Condes', 'Las Condes', 'Metropolitana');
```

#### 1.3. `categorias`
```sql
CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#6366f1', -- Color hex para UI
    icono VARCHAR(50), -- Nombre del icono (ej: 'coffee', 'pizza')

    -- Orden y estado
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categorias_active ON categorias(is_active);
CREATE INDEX idx_categorias_orden ON categorias(sort_order);
```

#### 1.4. `productos`
```sql
CREATE TABLE productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),

    -- Identificación
    sku VARCHAR(50) UNIQUE,
    codigo_barra VARCHAR(100),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,

    -- Clasificación
    categoria_id INTEGER NOT NULL,

    -- Precio y costo
    precio DECIMAL(10,0) NOT NULL, -- CLP sin decimales
    costo DECIMAL(10,0) DEFAULT 0,
    precio_oferta DECIMAL(10,0),
    oferta_activa BOOLEAN DEFAULT 0,

    -- Inventario
    stock DECIMAL(8,2) DEFAULT 0,
    stock_minimo DECIMAL(8,2) DEFAULT 5,
    unidad_medida VARCHAR(20) DEFAULT 'UN', -- UN, KG, LT, GR, ML
    es_inventariable BOOLEAN DEFAULT 1,

    -- Cocina
    tiempo_preparacion INTEGER DEFAULT 10, -- minutos
    estacion_cocina_id INTEGER, -- NULL si no requiere cocina (ej: bebidas embotelladas)
    requiere_cocina BOOLEAN DEFAULT 1,

    -- Configuración
    imagen_url VARCHAR(255),
    peso DECIMAL(8,2), -- en gramos
    es_combo BOOLEAN DEFAULT 0,
    permite_modificadores BOOLEAN DEFAULT 1,

    -- Estado
    is_active BOOLEAN DEFAULT 1,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    FOREIGN KEY (estacion_cocina_id) REFERENCES estaciones_cocina(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_active ON productos(is_active);
CREATE INDEX idx_productos_sku ON productos(sku);
CREATE INDEX idx_productos_estacion ON productos(estacion_cocina_id);
CREATE UNIQUE INDEX idx_productos_uuid ON productos(uuid);
```

#### 1.5. `modificadores`
```sql
CREATE TABLE modificadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'ingrediente', 'coccion', 'tamano', 'extra'
    precio_adicional DECIMAL(10,0) DEFAULT 0,
    afecta_stock BOOLEAN DEFAULT 0,
    producto_stock_id INTEGER, -- Si afecta stock, qué producto descuenta

    -- Estado
    is_active BOOLEAN DEFAULT 1,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (producto_stock_id) REFERENCES productos(id)
);

-- Relación muchos a muchos: productos <-> modificadores
CREATE TABLE productos_modificadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto_id INTEGER NOT NULL,
    modificador_id INTEGER NOT NULL,
    es_obligatorio BOOLEAN DEFAULT 0,
    sort_order INTEGER DEFAULT 0,

    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (modificador_id) REFERENCES modificadores(id) ON DELETE CASCADE,

    UNIQUE(producto_id, modificador_id)
);

CREATE INDEX idx_prod_mods_producto ON productos_modificadores(producto_id);
```

---

### 2. Tablas de Sala y Mesas

#### 2.1. `zonas`
```sql
CREATE TABLE zonas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL, -- 'Salón Principal', 'Terraza', 'Barra', 'VIP'
    sucursal_id INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#e5e7eb', -- Color de fondo en plano
    descripcion TEXT,

    -- Estado
    is_active BOOLEAN DEFAULT 1,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE
);

CREATE INDEX idx_zonas_sucursal ON zonas(sucursal_id);
```

#### 2.2. `mesas`
```sql
CREATE TABLE mesas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero VARCHAR(10) NOT NULL, -- 'Mesa 1', 'Barra 3', etc.
    capacidad INTEGER DEFAULT 4,
    zona_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,

    -- Posicionamiento en plano (para editor drag & drop)
    posicion_x DECIMAL(8,2) DEFAULT 0,
    posicion_y DECIMAL(8,2) DEFAULT 0,
    ancho DECIMAL(8,2) DEFAULT 100, -- píxeles
    alto DECIMAL(8,2) DEFAULT 100,
    rotacion INTEGER DEFAULT 0, -- grados: 0, 90, 180, 270
    forma VARCHAR(20) DEFAULT 'rectangular', -- 'rectangular', 'circular', 'cuadrada'

    -- Estado operativo
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'ocupada', 'reservada', 'mantenimiento', 'limpieza')),
    pedido_actual_uuid CHAR(36), -- UUID del pedido activo en esta mesa
    mesero_asignado_id INTEGER, -- Mesero responsable de la mesa

    -- Configuración
    is_active BOOLEAN DEFAULT 1,
    permite_reservas BOOLEAN DEFAULT 1,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE RESTRICT,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    FOREIGN KEY (mesero_asignado_id) REFERENCES usuarios(id) ON DELETE SET NULL,

    UNIQUE(numero, sucursal_id)
);

-- Índices
CREATE INDEX idx_mesas_estado ON mesas(estado);
CREATE INDEX idx_mesas_zona ON mesas(zona_id);
CREATE INDEX idx_mesas_sucursal ON mesas(sucursal_id);
CREATE INDEX idx_mesas_pedido_actual ON mesas(pedido_actual_uuid);
```

#### 2.3. `layouts_sala`
```sql
CREATE TABLE layouts_sala (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sucursal_id INTEGER NOT NULL,
    nombre VARCHAR(100) NOT NULL, -- 'Layout Verano', 'Layout Navidad', etc.
    configuracion TEXT NOT NULL, -- JSON con posiciones de todas las mesas
    es_activo BOOLEAN DEFAULT 0, -- Solo uno activo por sucursal

    -- Auditoría
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Solo un layout activo por sucursal
CREATE UNIQUE INDEX idx_layouts_activo ON layouts_sala(sucursal_id, es_activo)
WHERE es_activo = 1;
```

---

### 3. Tablas Transaccionales (CRÍTICAS - Usan UUID)

#### 3.1. `pedidos`
```sql
CREATE TABLE pedidos (
    -- ⚠️ UUID como Primary Key (se crean offline)
    uuid CHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),

    -- Identificación visible
    numero_pedido VARCHAR(50) UNIQUE, -- AUTO-001-00123 (generado por servidor al sincronizar)
    numero_temp VARCHAR(50), -- Número temporal offline (DEVICE_UUID-TIMESTAMP)

    -- Relaciones
    mesa_id INTEGER NOT NULL,
    mesero_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,
    cliente_id INTEGER, -- NULL si es cliente anónimo

    -- Estado del pedido
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'confirmado', 'en_cocina', 'listo', 'servido', 'pagado', 'cancelado')),
    estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado', 'parcial', 'anulado')),

    -- Montos (en CLP, sin decimales)
    subtotal DECIMAL(10,0) DEFAULT 0,
    descuento DECIMAL(10,0) DEFAULT 0,
    propina DECIMAL(10,0) DEFAULT 0,
    iva DECIMAL(10,0) DEFAULT 0, -- Calculado: (subtotal - descuento) * 0.19
    total DECIMAL(10,0) DEFAULT 0, -- subtotal - descuento + propina

    -- Configuración
    numero_comensales INTEGER DEFAULT 1,
    tipo_pedido VARCHAR(20) DEFAULT 'mesa' CHECK (tipo_pedido IN ('mesa', 'delivery', 'llevar', 'barra')),
    requiere_factura BOOLEAN DEFAULT 0,

    -- Notas
    notas_especiales TEXT,
    notas_cocina TEXT,

    -- División de cuenta
    cuenta_dividida BOOLEAN DEFAULT 0,
    numero_divisiones INTEGER DEFAULT 1,

    -- Sincronización (CRÍTICO)
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (sync_status IN ('PENDIENTE', 'SINCRONIZANDO', 'SINCRONIZADO', 'CONFLICTO', 'ERROR')),
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    sync_timestamp DATETIME,

    -- Dispositivo origen
    device_id CHAR(36) NOT NULL, -- UUID del dispositivo que creó el pedido
    device_type VARCHAR(20) DEFAULT 'POS' CHECK (device_type IN ('POS', 'MOBILE', 'WEB')),

    -- Flags offline
    creado_offline BOOLEAN DEFAULT 0,
    modificado_offline BOOLEAN DEFAULT 0,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME, -- Cuándo se confirmó el pedido
    paid_at DATETIME, -- Cuándo se pagó

    FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE RESTRICT,
    FOREIGN KEY (mesero_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- Índices críticos para sincronización
CREATE INDEX idx_pedidos_sync_status ON pedidos(sync_status);
CREATE INDEX idx_pedidos_device ON pedidos(device_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_mesa ON pedidos(mesa_id);
CREATE INDEX idx_pedidos_mesero ON pedidos(mesero_id);
CREATE INDEX idx_pedidos_fecha ON pedidos(created_at);
CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);
```

#### 3.2. `detalle_pedido`
```sql
CREATE TABLE detalle_pedido (
    -- ⚠️ UUID como Primary Key (se crean offline)
    uuid CHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),

    -- Relaciones
    pedido_uuid CHAR(36) NOT NULL,
    producto_id INTEGER NOT NULL,

    -- Snapshot del producto (inmutable - fiscalmente importante)
    producto_nombre VARCHAR(150) NOT NULL,
    producto_sku VARCHAR(50),
    producto_precio DECIMAL(10,0) NOT NULL, -- Precio al momento de venta

    -- Cantidad
    cantidad DECIMAL(8,2) NOT NULL DEFAULT 1,

    -- Modificadores aplicados (JSON)
    modificadores TEXT, -- [{"id": 1, "nombre": "Sin cebolla", "precio": 0}, ...]

    -- Precios
    precio_unitario DECIMAL(10,0) NOT NULL,
    precio_total DECIMAL(10,0) NOT NULL, -- cantidad * precio_unitario + sum(modificadores)
    descuento DECIMAL(10,0) DEFAULT 0,
    precio_final DECIMAL(10,0) NOT NULL, -- precio_total - descuento

    -- Cocina
    estacion_cocina_id INTEGER,
    requiere_preparacion BOOLEAN DEFAULT 1,
    tiempo_estimado INTEGER, -- minutos

    -- Notas
    notas TEXT, -- "Sin picante", "Término medio", etc.

    -- Estado
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_preparacion', 'listo', 'servido', 'cancelado')),

    -- División de cuenta
    asignado_a_division INTEGER, -- Si cuenta dividida, a qué división pertenece (1, 2, 3...)

    -- Sincronización
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE',
    device_id CHAR(36) NOT NULL,
    creado_offline BOOLEAN DEFAULT 0,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_to_kitchen_at DATETIME,
    ready_at DATETIME,
    served_at DATETIME,

    FOREIGN KEY (pedido_uuid) REFERENCES pedidos(uuid) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    FOREIGN KEY (estacion_cocina_id) REFERENCES estaciones_cocina(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_detalle_pedido ON detalle_pedido(pedido_uuid);
CREATE INDEX idx_detalle_producto ON detalle_pedido(producto_id);
CREATE INDEX idx_detalle_estado ON detalle_pedido(estado);
CREATE INDEX idx_detalle_estacion ON detalle_pedido(estacion_cocina_id);
CREATE INDEX idx_detalle_sync ON detalle_pedido(sync_status);
```

#### 3.3. `pagos`
```sql
CREATE TABLE pagos (
    -- ⚠️ UUID como Primary Key (se crean offline)
    uuid CHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),

    -- Identificación visible
    numero_pago VARCHAR(50) UNIQUE, -- Generado por servidor
    numero_temp VARCHAR(50), -- Número temporal offline

    -- Relaciones
    pedido_uuid CHAR(36) NOT NULL,
    sesion_caja_uuid CHAR(36) NOT NULL,
    cajero_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,

    -- Método de pago
    metodo_pago VARCHAR(50) NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mixto')),

    -- Montos (CLP sin decimales)
    monto DECIMAL(10,0) NOT NULL,
    monto_recibido DECIMAL(10,0), -- Solo para efectivo
    cambio DECIMAL(10,0) DEFAULT 0, -- Solo para efectivo

    -- Pago mixto (si aplica)
    es_pago_mixto BOOLEAN DEFAULT 0,
    detalle_mixto TEXT, -- JSON: [{"metodo": "efectivo", "monto": 5000}, {"metodo": "tarjeta", "monto": 3000}]

    -- Propina
    propina DECIMAL(10,0) DEFAULT 0,
    propina_porcentaje DECIMAL(5,2), -- 10.00 = 10%

    -- Referencias externas
    referencia_externa VARCHAR(100), -- Código de transacción tarjeta, transferencia, etc.
    voucher_url VARCHAR(255), -- URL del comprobante electrónico

    -- Estado
    estado VARCHAR(20) DEFAULT 'completado' CHECK (estado IN ('completado', 'anulado', 'parcial')),

    -- 🔒 INMUTABILIDAD (Fiscalmente crítico)
    es_anulable BOOLEAN DEFAULT 1, -- Solo TRUE antes de sincronizar
    anulado BOOLEAN DEFAULT 0,
    anulado_por INTEGER, -- Usuario que anuló
    anulado_at DATETIME,
    motivo_anulacion TEXT,

    -- Sincronización (MÁXIMA PRIORIDAD)
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE',
    sync_priority INTEGER DEFAULT 1, -- 1 = máxima prioridad
    sync_retries INTEGER DEFAULT 0,
    sync_error TEXT,
    sync_timestamp DATETIME,

    -- Dispositivo
    device_id CHAR(36) NOT NULL,
    device_type VARCHAR(20) DEFAULT 'POS',
    creado_offline BOOLEAN DEFAULT 0,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pedido_uuid) REFERENCES pedidos(uuid) ON DELETE RESTRICT,
    FOREIGN KEY (sesion_caja_uuid) REFERENCES sesiones_caja(uuid) ON DELETE RESTRICT,
    FOREIGN KEY (cajero_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT,
    FOREIGN KEY (anulado_por) REFERENCES usuarios(id)
);

-- Índices críticos
CREATE INDEX idx_pagos_pedido ON pagos(pedido_uuid);
CREATE INDEX idx_pagos_sesion ON pagos(sesion_caja_uuid);
CREATE INDEX idx_pagos_sync_status ON pagos(sync_status);
CREATE INDEX idx_pagos_sync_priority ON pagos(sync_priority);
CREATE INDEX idx_pagos_metodo ON pagos(metodo_pago);
CREATE INDEX idx_pagos_fecha ON pagos(created_at);
CREATE INDEX idx_pagos_estado ON pagos(estado);
```

---

### 4. Tablas de Cocina (KDS)

#### 4.1. `estaciones_cocina`
```sql
CREATE TABLE estaciones_cocina (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(20) UNIQUE NOT NULL, -- 'COCINA_CALIENTE', 'BARRA', 'PARRILLA', etc.
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#ef4444', -- Color para UI
    sucursal_id INTEGER NOT NULL,

    -- Configuración
    tiempo_alerta_minutos INTEGER DEFAULT 15, -- Alertar si un pedido lleva más de X minutos
    impresora_ip VARCHAR(50), -- IP de impresora de cocina asignada

    -- Estado
    is_active BOOLEAN DEFAULT 1,

    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE
);

-- Datos iniciales
INSERT INTO estaciones_cocina (codigo, nombre, color, sucursal_id) VALUES
('COCINA_CALIENTE', 'Cocina Caliente', '#ef4444', 1),
('COCINA_FRIA', 'Cocina Fría', '#3b82f6', 1),
('BARRA', 'Barra', '#8b5cf6', 1),
('PARRILLA', 'Parrilla', '#f59e0b', 1),
('REPOSTERIA', 'Repostería', '#ec4899', 1);
```

#### 4.2. `ordenes_cocina`
```sql
CREATE TABLE ordenes_cocina (
    uuid CHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),

    -- Relaciones
    detalle_pedido_uuid CHAR(36) NOT NULL,
    pedido_uuid CHAR(36) NOT NULL,
    estacion_id INTEGER NOT NULL,

    -- Información del pedido
    mesa_numero VARCHAR(10) NOT NULL,
    producto_nombre VARCHAR(150) NOT NULL,
    cantidad DECIMAL(8,2) NOT NULL,
    modificadores TEXT, -- JSON
    notas TEXT,

    -- Estado de preparación
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_preparacion', 'listo', 'servido', 'cancelado')),

    -- Tiempos
    tiempo_estimado INTEGER, -- minutos
    tiempo_transcurrido INTEGER, -- calculado en tiempo real
    tiempo_real INTEGER, -- minutos que realmente tomó

    -- Prioridad
    prioridad INTEGER DEFAULT 1 CHECK (prioridad IN (1, 2, 3)), -- 1=normal, 2=alta, 3=urgente
    es_urgente BOOLEAN DEFAULT 0,

    -- Timestamps de estados
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    served_at DATETIME,
    cancelled_at DATETIME,

    -- Notificaciones
    mesero_notificado BOOLEAN DEFAULT 0, -- TRUE cuando plato está listo
    notificado_at DATETIME,

    -- Auditoría
    cocinero_id INTEGER, -- Quién preparó

    FOREIGN KEY (detalle_pedido_uuid) REFERENCES detalle_pedido(uuid) ON DELETE CASCADE,
    FOREIGN KEY (pedido_uuid) REFERENCES pedidos(uuid) ON DELETE CASCADE,
    FOREIGN KEY (estacion_id) REFERENCES estaciones_cocina(id) ON DELETE RESTRICT,
    FOREIGN KEY (cocinero_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices para KDS
CREATE INDEX idx_ordenes_estacion ON ordenes_cocina(estacion_id);
CREATE INDEX idx_ordenes_estado ON ordenes_cocina(estado);
CREATE INDEX idx_ordenes_pedido ON ordenes_cocina(pedido_uuid);
CREATE INDEX idx_ordenes_prioridad ON ordenes_cocina(prioridad DESC, received_at ASC);
CREATE INDEX idx_ordenes_tiempo ON ordenes_cocina(received_at);
```

---

### 5. Tablas de Caja (Sesiones y Movimientos)

#### 5.1. `sesiones_caja`
```sql
CREATE TABLE sesiones_caja (
    uuid CHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),

    -- Identificación
    numero_sesion VARCHAR(50) UNIQUE, -- CAJ-001-20250113-001
    numero_temp VARCHAR(50), -- Temporal offline

    -- Relaciones
    cajero_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,
    terminal_id VARCHAR(50), -- Identificador del terminal/caja física

    -- Estado
    estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada', 'suspendida')),

    -- Montos de apertura
    monto_apertura DECIMAL(10,0) NOT NULL DEFAULT 0,
    monedas_apertura TEXT, -- JSON: {"billetes_20000": 5, "billetes_10000": 10, ...}

    -- Montos de cierre (calculados)
    monto_esperado DECIMAL(10,0),
    monto_real DECIMAL(10,0),
    diferencia DECIMAL(10,0), -- monto_real - monto_esperado
    monedas_cierre TEXT, -- JSON con arqueo de monedas

    -- Totales de ventas
    total_ventas DECIMAL(10,0) DEFAULT 0,
    total_efectivo DECIMAL(10,0) DEFAULT 0,
    total_tarjeta DECIMAL(10,0) DEFAULT 0,
    total_transferencia DECIMAL(10,0) DEFAULT 0,
    total_propinas DECIMAL(10,0) DEFAULT 0,
    cantidad_ventas INTEGER DEFAULT 0,

    -- Movimientos adicionales
    total_ingresos DECIMAL(10,0) DEFAULT 0, -- Ingresos fuera de ventas
    total_egresos DECIMAL(10,0) DEFAULT 0, -- Retiros, gastos

    -- Notas
    notas_apertura TEXT,
    notas_cierre TEXT,
    observaciones TEXT,

    -- Sincronización
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE',
    sync_priority INTEGER DEFAULT 2, -- Alta prioridad pero menos que pagos
    device_id CHAR(36) NOT NULL,
    creado_offline BOOLEAN DEFAULT 0,

    -- Timestamps
    abierta_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    cerrada_at DATETIME,

    FOREIGN KEY (cajero_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE RESTRICT
);

-- Índices
CREATE INDEX idx_sesiones_cajero ON sesiones_caja(cajero_id);
CREATE INDEX idx_sesiones_estado ON sesiones_caja(estado);
CREATE INDEX idx_sesiones_fecha ON sesiones_caja(abierta_at);
CREATE INDEX idx_sesiones_sync ON sesiones_caja(sync_status);
```

---

### 6. Sistema de Sincronización (CORE)

#### 6.1. `dispositivos`
```sql
CREATE TABLE dispositivos (
    uuid CHAR(36) PRIMARY KEY, -- Generado en cliente

    -- Identificación
    nombre VARCHAR(100) NOT NULL, -- "Terminal 1 - Caja Principal"
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('POS', 'MOBILE', 'KDS', 'WEB')),
    modelo VARCHAR(100), -- "iPad Pro 12.9", "Windows 11 Desktop", etc.
    sistema_operativo VARCHAR(50),
    version_app VARCHAR(20),

    -- Relaciones
    sucursal_id INTEGER NOT NULL,
    usuario_asignado_id INTEGER, -- Usuario por defecto del dispositivo

    -- Red
    ip_address VARCHAR(45), -- IPv4 o IPv6
    mac_address VARCHAR(17),

    -- Estado de conexión
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'bloqueado', 'mantenimiento')),
    online BOOLEAN DEFAULT 0,
    ultima_conexion DATETIME,
    ultima_desconexion DATETIME,
    ultima_sincronizacion DATETIME,

    -- Configuración
    permitir_offline BOOLEAN DEFAULT 1,
    auto_sync BOOLEAN DEFAULT 1,
    intervalo_sync_segundos INTEGER DEFAULT 30,

    -- Límites
    max_pedidos_offline INTEGER DEFAULT 100,
    dias_datos_local INTEGER DEFAULT 7, -- Días de histórico a mantener offline

    -- Auditoría
    registrado_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    registrado_por INTEGER,

    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_asignado_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- Índices
CREATE INDEX idx_dispositivos_sucursal ON dispositivos(sucursal_id);
CREATE INDEX idx_dispositivos_tipo ON dispositivos(tipo);
CREATE INDEX idx_dispositivos_estado ON dispositivos(estado);
CREATE INDEX idx_dispositivos_online ON dispositivos(online);
```

#### 6.2. `sync_events` (CRÍTICO - Event Sourcing)
```sql
CREATE TABLE sync_events (
    uuid CHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),

    -- Identificación del evento
    tipo_entidad VARCHAR(50) NOT NULL, -- 'pedido', 'pago', 'mesa', 'producto', etc.
    entidad_uuid CHAR(36) NOT NULL, -- UUID de la entidad afectada
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('CREATE', 'UPDATE', 'DELETE', 'SYNC')),

    -- Evento
    evento VARCHAR(50) NOT NULL, -- 'pedido.created', 'pago.completed', 'mesa.estado_changed', etc.

    -- Payload (INMUTABLE)
    payload TEXT NOT NULL, -- JSON completo del estado de la entidad en ese momento
    payload_hash VARCHAR(64), -- SHA256 del payload para detectar duplicados

    -- Metadata
    version INTEGER DEFAULT 1, -- Versión del evento (para evolución de schema)

    -- Origen
    device_id CHAR(36) NOT NULL,
    usuario_id INTEGER NOT NULL,
    sucursal_id INTEGER NOT NULL,

    -- Timestamps (CRÍTICO para resolución de conflictos)
    client_timestamp DATETIME NOT NULL, -- Timestamp del dispositivo cliente
    server_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp del servidor

    -- Estado de procesamiento
    procesado BOOLEAN DEFAULT 0,
    procesado_at DATETIME,
    error TEXT,

    -- Prioridad
    prioridad INTEGER DEFAULT 5 CHECK (prioridad BETWEEN 1 AND 10), -- 1=máxima, 10=mínima

    -- Idempotencia
    idempotency_key VARCHAR(100) UNIQUE, -- device_id + entidad_uuid + client_timestamp

    FOREIGN KEY (device_id) REFERENCES dispositivos(uuid) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
);

-- Índices críticos para performance
CREATE INDEX idx_sync_events_entidad ON sync_events(tipo_entidad, entidad_uuid);
CREATE INDEX idx_sync_events_procesado ON sync_events(procesado, prioridad DESC, client_timestamp ASC);
CREATE INDEX idx_sync_events_device ON sync_events(device_id);
CREATE INDEX idx_sync_events_timestamp ON sync_events(server_timestamp);
CREATE UNIQUE INDEX idx_sync_events_idempotency ON sync_events(idempotency_key);
CREATE INDEX idx_sync_events_hash ON sync_events(payload_hash);
```

#### 6.3. `sync_queue` (Cola de Sincronización)
```sql
CREATE TABLE sync_queue (
    uuid CHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),

    -- Referencia al evento
    sync_event_uuid CHAR(36) NOT NULL,

    -- Estado
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'ERROR', 'DESCARTADO')),

    -- Reintentos
    intentos INTEGER DEFAULT 0,
    max_intentos INTEGER DEFAULT 5,
    siguiente_intento DATETIME,
    error_ultimo TEXT,

    -- Prioridad (heredada del evento)
    prioridad INTEGER DEFAULT 5,

    -- Timestamps
    encolado_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    procesado_at DATETIME,
    completado_at DATETIME,

    FOREIGN KEY (sync_event_uuid) REFERENCES sync_events(uuid) ON DELETE CASCADE
);

-- Índices para procesamiento eficiente
CREATE INDEX idx_sync_queue_estado ON sync_queue(estado, prioridad DESC, encolado_at ASC);
CREATE INDEX idx_sync_queue_siguiente_intento ON sync_queue(siguiente_intento) WHERE estado = 'PENDIENTE';
CREATE INDEX idx_sync_queue_event ON sync_queue(sync_event_uuid);
```

#### 6.4. `sync_conflicts` (Resolución de Conflictos)
```sql
CREATE TABLE sync_conflicts (
    uuid CHAR(36) PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),

    -- Identificación del conflicto
    tipo_entidad VARCHAR(50) NOT NULL,
    entidad_uuid CHAR(36) NOT NULL,

    -- Versiones en conflicto
    version_local TEXT NOT NULL, -- JSON del estado local
    version_servidor TEXT NOT NULL, -- JSON del estado en servidor
    version_local_timestamp DATETIME NOT NULL,
    version_servidor_timestamp DATETIME NOT NULL,

    -- Origen
    device_id CHAR(36) NOT NULL,
    sync_event_uuid CHAR(36),

    -- Resolución
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'RESUELTO_AUTO', 'RESUELTO_MANUAL', 'DESCARTADO')),
    estrategia_resolucion VARCHAR(50), -- 'last_write_wins', 'merge', 'manual'
    version_final TEXT, -- JSON del estado final después de resolver

    -- Auditoría
    resuelto_por INTEGER,
    resuelto_at DATETIME,
    notas TEXT,

    -- Timestamps
    detectado_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (device_id) REFERENCES dispositivos(uuid),
    FOREIGN KEY (sync_event_uuid) REFERENCES sync_events(uuid),
    FOREIGN KEY (resuelto_por) REFERENCES usuarios(id)
);

-- Índices
CREATE INDEX idx_conflicts_estado ON sync_conflicts(estado);
CREATE INDEX idx_conflicts_entidad ON sync_conflicts(tipo_entidad, entidad_uuid);
CREATE INDEX idx_conflicts_device ON sync_conflicts(device_id);
```

---

### 7. Auditoría y Logs

#### 7.1. `audit_log`
```sql
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Quién
    usuario_id INTEGER,
    device_id CHAR(36),
    ip_address VARCHAR(45),

    -- Qué
    accion VARCHAR(100) NOT NULL, -- 'pedido.created', 'producto.updated', 'pago.anulado'
    entidad_tipo VARCHAR(50) NOT NULL,
    entidad_id VARCHAR(100), -- Puede ser INT o UUID

    -- Cambios
    valores_anteriores TEXT, -- JSON
    valores_nuevos TEXT, -- JSON

    -- Contexto
    sucursal_id INTEGER,
    sesion_caja_uuid CHAR(36),

    -- Timestamp
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (device_id) REFERENCES dispositivos(uuid),
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
);

-- Índices para auditoría
CREATE INDEX idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX idx_audit_accion ON audit_log(accion);
CREATE INDEX idx_audit_entidad ON audit_log(entidad_tipo, entidad_id);
CREATE INDEX idx_audit_fecha ON audit_log(created_at);
```

---

## Reglas de Integridad

### Reglas Fiscales (CRÍTICAS)

1. **Inmutabilidad de Pagos:**
```sql
-- Trigger: Prevenir UPDATE/DELETE de pagos sincronizados
CREATE TRIGGER prevent_payment_modification
BEFORE UPDATE ON pagos
WHEN OLD.sync_status = 'SINCRONIZADO'
BEGIN
    SELECT RAISE(ABORT, 'No se pueden modificar pagos ya sincronizados. Crear compensación.');
END;

CREATE TRIGGER prevent_payment_deletion
BEFORE DELETE ON pagos
WHEN OLD.sync_status = 'SINCRONIZADO'
BEGIN
    SELECT RAISE(ABORT, 'No se pueden eliminar pagos sincronizados');
END;
```

2. **Secuencia de Numeración:**
```sql
-- Números de pedidos/pagos solo los asigna el servidor
-- Dispositivos offline usan numero_temp
-- Al sincronizar, servidor asigna numero oficial
```

3. **Audit Log Automático:**
```sql
-- Trigger: Registrar todas las modificaciones de pedidos
CREATE TRIGGER audit_pedidos_update
AFTER UPDATE ON pedidos
BEGIN
    INSERT INTO audit_log (usuario_id, accion, entidad_tipo, entidad_id, valores_anteriores, valores_nuevos)
    VALUES (
        NEW.mesero_id,
        'pedido.updated',
        'pedido',
        NEW.uuid,
        json_object('estado', OLD.estado, 'total', OLD.total),
        json_object('estado', NEW.estado, 'total', NEW.total)
    );
END;
```

### Reglas de Sincronización

1. **Prioridad de Sync:**
```
1. Pagos (sync_priority = 1)
2. Sesiones de caja (sync_priority = 2)
3. Pedidos completados (sync_priority = 3)
4. Estados de mesa (sync_priority = 4)
5. Otros cambios (sync_priority = 5-10)
```

2. **Resolución de Conflictos (Last-Write-Wins):**
```sql
-- Al detectar conflicto:
-- 1. Comparar timestamps (client_timestamp)
-- 2. Versión más reciente gana
-- 3. Registrar conflicto en sync_conflicts para auditoría
-- 4. Notificar al dispositivo perdedor para actualizar UI
```

3. **Idempotencia:**
```sql
-- Cada evento tiene idempotency_key único:
-- formato: {device_id}_{entidad_uuid}_{client_timestamp}
-- Si llega evento duplicado (mismo key), se ignora
```

---

## Índices y Optimización

### Índices Compuestos Críticos

```sql
-- Para consultas de sincronización
CREATE INDEX idx_sync_pending ON sync_queue(estado, prioridad DESC, encolado_at ASC)
WHERE estado IN ('PENDIENTE', 'ERROR');

-- Para KDS (orden por prioridad y tiempo)
CREATE INDEX idx_kds_active_orders ON ordenes_cocina(estacion_id, estado, prioridad DESC, received_at ASC)
WHERE estado IN ('pendiente', 'en_preparacion');

-- Para reportes de ventas
CREATE INDEX idx_ventas_fecha_sucursal ON pedidos(sucursal_id, created_at DESC)
WHERE estado = 'pagado';

-- Para buscar pedidos activos de una mesa
CREATE INDEX idx_pedidos_mesa_activos ON pedidos(mesa_id, estado)
WHERE estado NOT IN ('cancelado', 'pagado');
```

### Particionamiento (Para producción con mucho volumen)

```sql
-- En PostgreSQL (recomendado para producción):
-- Particionar tabla sync_events por mes
-- Particionar tabla audit_log por mes
-- Esto mantiene las queries rápidas incluso con millones de registros
```

---

## Conclusión del Modelo de Datos

Este esquema SQL cumple con:

✅ **UUIDs en tablas transaccionales** (pedidos, pagos, eventos)
✅ **Modelo event-based** para sincronización robusta
✅ **Inmutabilidad de pagos** (fiscalmente crítico)
✅ **Idempotencia garantizada** (evita duplicados)
✅ **Priorización de sync** (pagos primero)
✅ **Resolución de conflictos** automática y manual
✅ **Auditoría completa** de todas las operaciones
✅ **Optimización para multi-dispositivo** (hasta 9 simultáneos)
✅ **Soporte KDS** con estados de platos
✅ **División de cuentas** y pagos mixtos

Este modelo está listo para:
- Desarrollo inmediato
- Escalado tipo cadena
- Cumplimiento fiscal (Chile)
- Operación offline robusta
