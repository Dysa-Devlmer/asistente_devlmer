# NEW DATA MODEL - DISEÑO MODERNO GREENFIELD

**Fecha:** 2025-12-15
**Fase:** Diseño del Nuevo Sistema
**Principio:** Diseñado desde cero, SIN copiar legacy

---

## 🎯 PRINCIPIOS DE DISEÑO

### Técnicos
- ✅ **UTF-8 (utf8mb4)** por defecto en toda la BD
- ✅ **Nombres en inglés** (convención REST API)
- ✅ **Snake_case** para nombres de tablas y columnas
- ✅ **Foreign Keys explícitas** con ON DELETE/UPDATE definido
- ✅ **Timestamps automáticos** (created_at, updated_at)
- ✅ **Soft deletes** (deleted_at) en lugar de borrado físico
- ✅ **Normalización 3FN** mínimo
- ✅ **Índices** en campos de búsqueda frecuente

### IDs
**Decisión: BIGINT AUTO_INCREMENT (no UUID)**

**Justificación:**
- ✅ Rendimiento superior en JOIN y índices
- ✅ Tamaño reducido (8 bytes vs 36 bytes)
- ✅ Ordenamiento natural por tiempo de creación
- ✅ Compatible con ecosistema existente (Prisma, TypeORM, etc)
- ✅ Legibilidad en logs y debugging
- ❌ UUID solo si necesitamos: distributed systems, merge de DBs, expose IDs publicly

**Formato:**
```sql
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
```

---

## 📋 MODELO DE DATOS CORE

### DOMINIO 1: VENTAS / COMANDAS

#### Tabla: `orders`
**Propósito:** Cabecera de órdenes/comandas del restaurante

```sql
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL COMMENT 'Número visible (ej: #001234)',

    -- Relaciones
    table_id BIGINT UNSIGNED NOT NULL COMMENT 'Mesa asignada',
    waiter_id BIGINT UNSIGNED NOT NULL COMMENT 'Mesero responsable',
    shift_id BIGINT UNSIGNED NOT NULL COMMENT 'Turno/apertura de caja',

    -- Información de la orden
    guest_count TINYINT UNSIGNED DEFAULT 1 COMMENT 'Número de comensales',
    status ENUM('open', 'sent_to_kitchen', 'in_preparation', 'ready', 'delivered', 'closed', 'cancelled')
        DEFAULT 'open' COMMENT 'Estado de la orden',

    -- Totales
    subtotal DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Suma de items',
    tax_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Monto de impuestos (IGV 18%)',
    discount_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Descuento aplicado',
    total_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Total a pagar',

    -- Metadatos
    notes TEXT COMMENT 'Notas especiales de la orden',
    opened_at DATETIME NOT NULL COMMENT 'Fecha/hora de creación',
    sent_to_kitchen_at DATETIME COMMENT 'Cuándo se envió a cocina',
    closed_at DATETIME COMMENT 'Cuándo se cerró (pagada)',
    cancelled_at DATETIME COMMENT 'Cuándo se anuló',
    cancellation_reason TEXT COMMENT 'Motivo de anulación',

    -- Timestamps automáticos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Soft delete',

    -- Índices
    INDEX idx_status (status),
    INDEX idx_table (table_id),
    INDEX idx_waiter (waiter_id),
    INDEX idx_shift (shift_id),
    INDEX idx_opened_at (opened_at),

    -- Foreign Keys
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE RESTRICT,
    FOREIGN KEY (waiter_id) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (shift_id) REFERENCES cash_register_shifts(id) ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Órdenes/comandas del restaurante';
```

---

#### Tabla: `order_items`
**Propósito:** Líneas de productos en cada orden

```sql
CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    order_id BIGINT UNSIGNED NOT NULL COMMENT 'Orden padre',
    product_id BIGINT UNSIGNED NOT NULL COMMENT 'Producto ordenado',

    -- Información del item
    quantity DECIMAL(8,3) NOT NULL DEFAULT 1.000 COMMENT 'Cantidad (permite decimales)',
    unit_price DECIMAL(10,2) NOT NULL COMMENT 'Precio unitario al momento de la orden',
    subtotal DECIMAL(10,2) NOT NULL COMMENT 'quantity * unit_price',
    discount_percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Descuento % aplicado',
    discount_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Monto de descuento',
    total_amount DECIMAL(10,2) NOT NULL COMMENT 'subtotal - discount_amount',

    -- Metadatos
    notes TEXT COMMENT 'Notas especiales (sin cebolla, término 3/4, etc)',
    status ENUM('pending', 'sent_to_kitchen', 'in_preparation', 'ready', 'delivered', 'cancelled')
        DEFAULT 'pending',

    sent_to_kitchen_at DATETIME COMMENT 'Cuándo se envió a cocina',
    prepared_at DATETIME COMMENT 'Cuándo se marcó como lista',
    delivered_at DATETIME COMMENT 'Cuándo se entregó',
    cancelled_at DATETIME COMMENT 'Cuándo se anuló',
    cancellation_reason TEXT COMMENT 'Motivo de anulación',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    -- Índices
    INDEX idx_order (order_id),
    INDEX idx_product (product_id),
    INDEX idx_status (status),

    -- Foreign Keys
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Líneas de productos en órdenes';
```

---

#### Tabla: `kitchen_queue`
**Propósito:** Cola de comandas para cocina/barra

```sql
CREATE TABLE kitchen_queue (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    order_item_id BIGINT UNSIGNED NOT NULL COMMENT 'Item de orden',
    station_id BIGINT UNSIGNED NOT NULL COMMENT 'Estación de cocina (Grill, Frío, Barra, etc)',

    -- Información
    priority TINYINT UNSIGNED DEFAULT 5 COMMENT '1=urgente, 5=normal, 10=baja',
    status ENUM('pending', 'in_preparation', 'ready', 'delivered') DEFAULT 'pending',

    assigned_at DATETIME COMMENT 'Cuándo se asignó',
    started_at DATETIME COMMENT 'Cuándo se comenzó a preparar',
    completed_at DATETIME COMMENT 'Cuándo se completó',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_status (status),
    INDEX idx_station (station_id),
    INDEX idx_priority (priority),

    -- Foreign Keys
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES kitchen_stations(id) ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cola de preparación para cocina';
```

---

#### Tabla: `kitchen_stations`
**Propósito:** Estaciones de cocina (Grill, Frío, Barra, etc)

```sql
CREATE TABLE kitchen_stations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL COMMENT 'Nombre de estación (ej: Grill, Barra, Fríos)',
    code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código corto (ej: GRILL, BAR, COLD)',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0 COMMENT 'Orden de visualización',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    INDEX idx_active (is_active)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Estaciones de cocina';
```

---

### DOMINIO 2: PRODUCTOS & CATEGORÍAS

#### Tabla: `products`
**Propósito:** Catálogo de productos vendibles

```sql
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    category_id BIGINT UNSIGNED NOT NULL COMMENT 'Categoría del producto',

    -- Información básica
    sku VARCHAR(50) UNIQUE NOT NULL COMMENT 'Código único del producto',
    name VARCHAR(200) NOT NULL COMMENT 'Nombre del producto',
    description TEXT COMMENT 'Descripción detallada',

    -- Precios
    base_price DECIMAL(10,2) NOT NULL COMMENT 'Precio base (tarifa DEFAULT)',
    cost_price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Costo del producto',

    -- Control
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Producto disponible en menú',
    is_taxable BOOLEAN DEFAULT TRUE COMMENT 'Aplica IGV',
    tax_rate DECIMAL(5,2) DEFAULT 18.00 COMMENT 'Tasa de impuesto %',

    -- Inventario
    tracks_inventory BOOLEAN DEFAULT FALSE COMMENT 'Si controla stock',
    current_stock DECIMAL(10,3) DEFAULT 0.000 COMMENT 'Stock actual',
    min_stock DECIMAL(10,3) DEFAULT 0.000 COMMENT 'Stock mínimo',

    -- Metadatos
    image_url VARCHAR(500) COMMENT 'URL de imagen principal',
    preparation_time INT COMMENT 'Tiempo estimado de preparación (minutos)',
    display_order INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    -- Índices
    INDEX idx_category (category_id),
    INDEX idx_active (is_active),
    INDEX idx_name (name),
    FULLTEXT idx_search (name, description),

    -- Foreign Keys
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Catálogo de productos';
```

---

#### Tabla: `categories`
**Propósito:** Categorías de productos (Piqueos, Ceviches, Bebidas, etc)

```sql
CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Jerarquía (opcional)
    parent_id BIGINT UNSIGNED NULL COMMENT 'Categoría padre (para subcategorías)',

    -- Información
    code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código único (ej: CEVICHES, DRINKS)',
    name VARCHAR(100) NOT NULL COMMENT 'Nombre de categoría',
    description TEXT,

    -- Control
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,

    -- Metadatos
    icon VARCHAR(100) COMMENT 'Icono o emoji',
    color VARCHAR(20) COMMENT 'Color en hex (ej: #FF5733)',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    -- Índices
    INDEX idx_parent (parent_id),
    INDEX idx_active (is_active),

    -- Foreign Keys
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Categorías de productos';
```

---

#### Tabla: `price_tiers`
**Propósito:** Tarifas/niveles de precio (DEFAULT, VIP, HAPPY_HOUR, etc)

```sql
CREATE TABLE price_tiers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código único (ej: DEFAULT, VIP)',
    name VARCHAR(100) NOT NULL COMMENT 'Nombre de tarifa',
    description TEXT,

    is_default BOOLEAN DEFAULT FALSE COMMENT 'Tarifa por defecto',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    INDEX idx_default (is_default),
    INDEX idx_active (is_active)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tarifas de precios';
```

---

#### Tabla: `product_prices`
**Propósito:** Precios de productos según tarifa

```sql
CREATE TABLE product_prices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    product_id BIGINT UNSIGNED NOT NULL,
    price_tier_id BIGINT UNSIGNED NOT NULL,

    -- Precio
    price DECIMAL(10,2) NOT NULL COMMENT 'Precio para esta tarifa',

    -- Vigencia (opcional)
    valid_from DATE COMMENT 'Válido desde',
    valid_until DATE COMMENT 'Válido hasta',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    UNIQUE KEY unique_product_tier (product_id, price_tier_id),
    INDEX idx_product (product_id),
    INDEX idx_tier (price_tier_id),

    -- Foreign Keys
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (price_tier_id) REFERENCES price_tiers(id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Precios de productos por tarifa';
```

---

### DOMINIO 3: MESAS & SALONES

#### Tabla: `tables`
**Propósito:** Mesas del restaurante

```sql
CREATE TABLE tables (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    room_id BIGINT UNSIGNED NOT NULL COMMENT 'Salón/área donde está la mesa',

    -- Información
    table_number VARCHAR(20) NOT NULL COMMENT 'Número visible (ej: M01, T12, BARRA-1)',
    capacity INT NOT NULL DEFAULT 4 COMMENT 'Capacidad de personas',

    -- Estado
    status ENUM('available', 'occupied', 'reserved', 'out_of_service') DEFAULT 'available',
    current_order_id BIGINT UNSIGNED NULL COMMENT 'Orden activa actualmente',

    -- Control
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,

    -- Metadatos
    notes TEXT COMMENT 'Notas especiales de la mesa',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    -- Índices
    UNIQUE KEY unique_room_table (room_id, table_number),
    INDEX idx_status (status),
    INDEX idx_room (room_id),

    -- Foreign Keys
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    FOREIGN KEY (current_order_id) REFERENCES orders(id) ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Mesas del restaurante';
```

---

#### Tabla: `rooms`
**Propósito:** Salones/áreas del restaurante (Terraza, Salón, Barra, etc)

```sql
CREATE TABLE rooms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código único (ej: TERRACE, MAIN, BAR)',
    name VARCHAR(100) NOT NULL COMMENT 'Nombre del salón',
    description TEXT,

    capacity INT DEFAULT 0 COMMENT 'Capacidad total del salón',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    INDEX idx_active (is_active)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Salones/áreas del restaurante';
```

---

### DOMINIO 4: CAJA & PAGOS

#### Tabla: `cash_registers`
**Propósito:** Cajas registradoras del restaurante

```sql
CREATE TABLE cash_registers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código único (ej: CAJA-01, TPV-BARRA)',
    name VARCHAR(100) NOT NULL COMMENT 'Nombre de caja',
    description TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    INDEX idx_active (is_active)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cajas registradoras';
```

---

#### Tabla: `cash_register_shifts`
**Propósito:** Aperturas/cierres de caja (turnos)

```sql
CREATE TABLE cash_register_shifts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    cash_register_id BIGINT UNSIGNED NOT NULL COMMENT 'Caja',
    opened_by_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Usuario que abrió',
    closed_by_user_id BIGINT UNSIGNED NULL COMMENT 'Usuario que cerró',

    -- Montos de apertura
    opening_cash DECIMAL(10,2) NOT NULL COMMENT 'Efectivo inicial (fondo fijo)',
    opening_notes TEXT COMMENT 'Notas de apertura',

    -- Montos de cierre
    closing_cash DECIMAL(10,2) NULL COMMENT 'Efectivo contado al cierre',
    closing_cards DECIMAL(10,2) NULL COMMENT 'Total tarjetas al cierre',
    closing_other DECIMAL(10,2) NULL COMMENT 'Otros métodos de pago',
    closing_total DECIMAL(10,2) NULL COMMENT 'Total al cierre',

    expected_cash DECIMAL(10,2) NULL COMMENT 'Efectivo esperado según sistema',
    cash_difference DECIMAL(10,2) NULL COMMENT 'Diferencia (positiva o negativa)',
    closing_notes TEXT COMMENT 'Notas de cierre',

    -- Estado
    status ENUM('open', 'closed') DEFAULT 'open',

    -- Fechas
    opened_at DATETIME NOT NULL COMMENT 'Fecha/hora de apertura',
    closed_at DATETIME NULL COMMENT 'Fecha/hora de cierre',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_status (status),
    INDEX idx_register (cash_register_id),
    INDEX idx_opened_at (opened_at),

    -- Foreign Keys
    FOREIGN KEY (cash_register_id) REFERENCES cash_registers(id) ON DELETE RESTRICT,
    FOREIGN KEY (opened_by_user_id) REFERENCES employees(id) ON DELETE RESTRICT,
    FOREIGN KEY (closed_by_user_id) REFERENCES employees(id) ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Turnos de caja (apertura/cierre)';
```

---

#### Tabla: `payments`
**Propósito:** Pagos realizados (puede haber múltiples pagos por orden)

```sql
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    order_id BIGINT UNSIGNED NOT NULL COMMENT 'Orden pagada',
    payment_method_id BIGINT UNSIGNED NOT NULL COMMENT 'Método de pago',
    shift_id BIGINT UNSIGNED NOT NULL COMMENT 'Turno de caja',
    processed_by_user_id BIGINT UNSIGNED NOT NULL COMMENT 'Usuario que procesó',

    -- Monto
    amount DECIMAL(10,2) NOT NULL COMMENT 'Monto del pago',

    -- Metadatos
    reference_number VARCHAR(100) COMMENT 'Número de referencia (tarjeta, transf, etc)',
    notes TEXT COMMENT 'Notas del pago',

    -- Fecha
    paid_at DATETIME NOT NULL COMMENT 'Fecha/hora del pago',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_order (order_id),
    INDEX idx_method (payment_method_id),
    INDEX idx_shift (shift_id),
    INDEX idx_paid_at (paid_at),

    -- Foreign Keys
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT,
    FOREIGN KEY (shift_id) REFERENCES cash_register_shifts(id) ON DELETE RESTRICT,
    FOREIGN KEY (processed_by_user_id) REFERENCES employees(id) ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Pagos registrados';
```

---

#### Tabla: `payment_methods`
**Propósito:** Formas de pago (Efectivo, Tarjeta, Webpay, etc)

```sql
CREATE TABLE payment_methods (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código único (ej: CASH, CREDIT_CARD, WEBPAY)',
    name VARCHAR(100) NOT NULL COMMENT 'Nombre del método',
    description TEXT,

    -- Control
    is_active BOOLEAN DEFAULT TRUE,
    requires_reference BOOLEAN DEFAULT FALSE COMMENT 'Si requiere número de referencia',
    display_order INT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    INDEX idx_active (is_active)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Métodos de pago';
```

---

#### Tabla: `cash_drawer_events`
**Propósito:** Registro de aperturas del cajón monedero (retiros, vueltos, etc)

```sql
CREATE TABLE cash_drawer_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    shift_id BIGINT UNSIGNED NOT NULL COMMENT 'Turno de caja',
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Usuario responsable',

    -- Tipo de evento
    event_type ENUM('opening', 'withdrawal', 'addition', 'change_given', 'other') NOT NULL,

    -- Monto
    amount DECIMAL(10,2) NOT NULL COMMENT 'Monto (positivo o negativo)',

    -- Justificación
    reason VARCHAR(200) NOT NULL COMMENT 'Motivo de apertura',
    notes TEXT,

    -- Fecha
    occurred_at DATETIME NOT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_shift (shift_id),
    INDEX idx_type (event_type),
    INDEX idx_occurred_at (occurred_at),

    -- Foreign Keys
    FOREIGN KEY (shift_id) REFERENCES cash_register_shifts(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Eventos de cajón monedero';
```

---

#### Tabla: `invoices`
**Propósito:** Boletas y facturas emitidas

```sql
CREATE TABLE invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Relaciones
    order_id BIGINT UNSIGNED NOT NULL COMMENT 'Orden facturada',
    customer_id BIGINT UNSIGNED NULL COMMENT 'Cliente (obligatorio para facturas)',

    -- Tipo de comprobante
    document_type ENUM('ticket', 'boleta', 'factura') NOT NULL,

    -- Numeración
    series VARCHAR(10) NOT NULL COMMENT 'Serie (ej: F001, B001, T001)',
    document_number VARCHAR(20) NOT NULL COMMENT 'Número correlativo',
    full_number VARCHAR(30) AS (CONCAT(series, '-', document_number)) STORED COMMENT 'Número completo',

    -- Montos
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Metadatos
    notes TEXT,
    issued_at DATETIME NOT NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL COMMENT 'Anulación',

    -- Índices
    UNIQUE KEY unique_series_number (series, document_number),
    INDEX idx_order (order_id),
    INDEX idx_customer (customer_id),
    INDEX idx_type (document_type),
    INDEX idx_issued_at (issued_at),

    -- Foreign Keys
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Comprobantes emitidos (boletas/facturas)';
```

---

### TABLAS AUXILIARES

#### Tabla: `employees`
**Propósito:** Empleados del restaurante (meseros, cajeros, cocineros, admin)

```sql
CREATE TABLE employees (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Información personal
    employee_code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código de empleado',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) AS (CONCAT(first_name, ' ', last_name)) STORED,

    -- Contacto
    email VARCHAR(200) UNIQUE,
    phone VARCHAR(20),

    -- Autenticación
    pin_code VARCHAR(6) COMMENT 'PIN de 4-6 dígitos para login rápido',
    password_hash VARCHAR(255) COMMENT 'Hash de contraseña (para admin)',

    -- Rol
    role ENUM('waiter', 'cashier', 'cook', 'bartender', 'manager', 'admin') NOT NULL,

    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    hired_at DATE,
    terminated_at DATE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    INDEX idx_role (role),
    INDEX idx_active (is_active)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Empleados del restaurante';
```

---

#### Tabla: `customers`
**Propósito:** Clientes (opcional, para facturas y fidelización)

```sql
CREATE TABLE customers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Tipo de documento
    document_type ENUM('dni', 'ruc', 'passport', 'other') NOT NULL,
    document_number VARCHAR(20) NOT NULL,

    -- Información
    name VARCHAR(200) NOT NULL COMMENT 'Nombre o Razón Social',
    email VARCHAR(200),
    phone VARCHAR(20),
    address TEXT,

    -- Control
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    UNIQUE KEY unique_doc (document_type, document_number),
    INDEX idx_active (is_active)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Clientes (para facturas)';
```

---

## 📊 RESUMEN DEL MODELO

### Total de Tablas: 23

| Dominio | Tablas | Notas |
|---------|--------|-------|
| **Ventas/Comandas** | 4 | orders, order_items, kitchen_queue, kitchen_stations |
| **Productos** | 5 | products, categories, price_tiers, product_prices |
| **Mesas** | 2 | tables, rooms |
| **Caja/Pagos** | 8 | cash_registers, cash_register_shifts, payments, payment_methods, cash_drawer_events, invoices |
| **Auxiliares** | 2 | employees, customers |
| **TOTAL** | **21** | - |

---

## 🎯 CARACTERÍSTICAS DEL MODELO

✅ **Normalización 3FN**
✅ **UTF-8 completo** (utf8mb4_unicode_ci)
✅ **Foreign Keys explícitas** con ON DELETE/UPDATE
✅ **Soft deletes** (deleted_at)
✅ **Timestamps automáticos** (created_at, updated_at)
✅ **Índices optimizados** para búsquedas frecuentes
✅ **Comentarios descriptivos** en todas las columnas
✅ **Nombres en inglés** (convención REST API)
✅ **BIGINT IDs** (rendimiento y escalabilidad)

---

## 🔄 DIFERENCIAS CON LEGACY

| Aspecto | Legacy | Nuevo |
|---------|--------|-------|
| Charset | latin1 | utf8mb4 |
| Nomenclatura | español mixto | inglés snake_case |
| Foreign Keys | NO | SÍ (explícitas) |
| Soft Deletes | NO | SÍ (deleted_at) |
| Timestamps | Manual | Automáticos |
| IDs | INT | BIGINT |
| Tablas | 157 | 21 |
| Normalización | Baja | 3FN |

---

## 📌 SIGUIENTE PASO

Crear **LEGACY-TO-NEW-MAPPING.md** para mapear cada tabla legacy a las nuevas entidades.

---

**FIN DEL MODELO DE DATOS**

Estado: ✅ MODELO DISEÑADO DESDE CERO
Tablas: 21 (core funcional)
Enfoque: Moderno, normalizado, escalable
