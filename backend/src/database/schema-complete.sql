-- ============================================================================
-- SYSME-POS: Esquema de Base de Datos Completo
-- Versión: 2.0.0
-- Arquitectura: Multi-Sucursal con Sincronización Híbrida
-- ============================================================================
--
-- ARQUITECTURA HÍBRIDA:
-- - Cada sucursal tiene su propia BD SQLite local
-- - Funciona 100% offline
-- - Sincroniza con servidor central cuando hay internet
-- - Reportes consolidados en servidor central
--
-- ============================================================================

-- ============================================================================
-- PARTE 1: ESTRUCTURA EMPRESARIAL
-- ============================================================================

-- Empresa (solo en servidor central para sync)
CREATE TABLE IF NOT EXISTS company (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200),
    rut VARCHAR(20) UNIQUE,                    -- RUT empresa Chile
    giro VARCHAR(200),                         -- Giro comercial
    address VARCHAR(300),
    city VARCHAR(100),
    region VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    logo_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'America/Santiago',
    currency VARCHAR(3) DEFAULT 'CLP',
    tax_rate DECIMAL(5,2) DEFAULT 19.00,       -- IVA Chile 19%
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sucursales
CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER DEFAULT 1,
    code VARCHAR(20) UNIQUE NOT NULL,          -- Código único sucursal (SUC001, SUC002)
    name VARCHAR(100) NOT NULL,                -- "Sucursal Centro", "Sucursal Mall"
    address VARCHAR(300),
    city VARCHAR(100),
    region VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    manager_name VARCHAR(100),
    opening_time TIME DEFAULT '11:00',
    closing_time TIME DEFAULT '23:00',
    is_active BOOLEAN DEFAULT 1,
    -- Configuración específica de sucursal
    has_delivery BOOLEAN DEFAULT 1,
    has_takeaway BOOLEAN DEFAULT 1,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    minimum_order DECIMAL(10,2) DEFAULT 0,
    -- Sincronización
    last_sync_at DATETIME,
    sync_status VARCHAR(20) DEFAULT 'pending', -- pending, syncing, synced, error
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Terminales/TPV por sucursal
CREATE TABLE IF NOT EXISTS terminals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    code VARCHAR(20) NOT NULL,                 -- TPV1, TPV2, TABLET1, COCINA1
    name VARCHAR(100) NOT NULL,                -- "Caja Principal", "Tablet Salón"
    type VARCHAR(20) NOT NULL,                 -- 'main', 'pos', 'tablet', 'kitchen', 'bar'
    -- Permisos del terminal
    can_open_cash BOOLEAN DEFAULT 0,           -- Solo terminales principales
    can_close_cash BOOLEAN DEFAULT 0,
    can_process_payments BOOLEAN DEFAULT 0,
    can_view_reports BOOLEAN DEFAULT 0,
    can_modify_orders BOOLEAN DEFAULT 1,
    can_send_to_kitchen BOOLEAN DEFAULT 1,
    -- Estado
    is_active BOOLEAN DEFAULT 1,
    last_activity_at DATETIME,
    ip_address VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, code)
);

-- ============================================================================
-- PARTE 2: USUARIOS Y PERMISOS
-- ============================================================================

-- Usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER,                         -- NULL = acceso a todas las sucursales
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,            -- bcrypt hash
    pin_code VARCHAR(255),                     -- PIN rápido para tablets (hash)
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL,                 -- admin, manager, cashier, waiter, kitchen, bar
    -- Configuración de trabajo
    assigned_terminal VARCHAR(20),             -- Terminal asignado por defecto
    assigned_section VARCHAR(50),              -- Sección asignada (Salón Principal, Terraza)
    -- Permisos específicos (JSON)
    permissions TEXT DEFAULT '{}',             -- {"delete_items":true,"give_discounts":false}
    -- Estado
    is_active BOOLEAN DEFAULT 1,
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sesiones de usuario (para tablets)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    terminal_id INTEGER,
    branch_id INTEGER NOT NULL,
    token VARCHAR(500) NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================================
-- PARTE 3: SALONES Y MESAS
-- ============================================================================

-- Salones/Áreas del restaurante
CREATE TABLE IF NOT EXISTS salons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,                -- "Salón Principal", "Terraza", "Privado"
    description TEXT,
    floor_plan_image VARCHAR(500),             -- Imagen del plano
    capacity INTEGER DEFAULT 0,                -- Capacidad total del salón
    is_active BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, name)
);

-- Tarifas/Precios por zona
CREATE TABLE IF NOT EXISTS pricing_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,                -- "Normal", "Terraza +10%", "Happy Hour"
    description TEXT,
    multiplier DECIMAL(4,2) DEFAULT 1.00,      -- 1.00 = precio normal, 1.10 = +10%
    is_active BOOLEAN DEFAULT 1,
    -- Horario de aplicación (opcional)
    applies_from TIME,                         -- Ej: Happy Hour 17:00-19:00
    applies_until TIME,
    applies_days VARCHAR(20),                  -- "1,2,3,4,5" = Lun-Vie
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mesas
CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    salon_id INTEGER NOT NULL,
    pricing_tier_id INTEGER,
    table_number VARCHAR(20) NOT NULL,         -- "1", "T1", "B1", "LLEVAR"
    name VARCHAR(50),                          -- "Mesa Ventana", "Barra Izq"
    max_capacity INTEGER DEFAULT 4,
    min_capacity INTEGER DEFAULT 1,
    -- Posición en el mapa visual
    position_x DECIMAL(8,2) DEFAULT 0,
    position_y DECIMAL(8,2) DEFAULT 0,
    width DECIMAL(8,2) DEFAULT 80,
    height DECIMAL(8,2) DEFAULT 80,
    shape VARCHAR(20) DEFAULT 'rectangle',     -- rectangle, circle, square
    rotation INTEGER DEFAULT 0,                -- Grados de rotación
    -- Estado
    status VARCHAR(20) DEFAULT 'free',         -- free, occupied, reserved, blocked
    current_order_id INTEGER,                  -- Pedido activo en la mesa
    current_waiter_id INTEGER,                 -- Garzón asignado
    occupied_since DATETIME,
    -- Configuración
    is_active BOOLEAN DEFAULT 1,
    is_joinable BOOLEAN DEFAULT 1,             -- Puede unirse con otras mesas
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, salon_id, table_number),
    FOREIGN KEY (salon_id) REFERENCES salons(id),
    FOREIGN KEY (pricing_tier_id) REFERENCES pricing_tiers(id)
);

-- Unión de mesas (cuando se juntan varias mesas)
CREATE TABLE IF NOT EXISTS table_joins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    main_table_id INTEGER NOT NULL,            -- Mesa principal
    joined_table_id INTEGER NOT NULL,          -- Mesa unida
    order_id INTEGER,                          -- Pedido compartido
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    separated_at DATETIME,
    FOREIGN KEY (main_table_id) REFERENCES tables(id),
    FOREIGN KEY (joined_table_id) REFERENCES tables(id)
);

-- ============================================================================
-- PARTE 4: MENÚ Y PRODUCTOS
-- ============================================================================

-- Categorías de productos
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER,                         -- NULL = todas las sucursales
    parent_id INTEGER,                         -- Subcategorías
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    color VARCHAR(7) DEFAULT '#6366f1',        -- Color para UI
    icon VARCHAR(50),                          -- Icono
    -- Configuración de impresión/destino
    default_destination VARCHAR(20) DEFAULT 'kitchen', -- kitchen, bar, none
    printer_id INTEGER,                        -- Impresora asignada
    -- Orden y visibilidad
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    show_in_pos BOOLEAN DEFAULT 1,
    show_in_menu BOOLEAN DEFAULT 1,            -- Menú público/web
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Productos
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER,                         -- NULL = todas las sucursales
    category_id INTEGER NOT NULL,
    sku VARCHAR(50),                           -- Código interno
    barcode VARCHAR(100),                      -- Código de barras
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(50),                    -- Nombre corto para tickets
    description TEXT,
    -- Precios
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0,              -- Costo (de receta)
    promotion_price DECIMAL(10,2),             -- Precio promoción
    promotion_start DATETIME,
    promotion_end DATETIME,
    -- Configuración
    preparation_time INTEGER DEFAULT 10,       -- Minutos
    destination VARCHAR(20) DEFAULT 'kitchen', -- kitchen, bar, both, none
    -- Restricciones dietéticas (JSON array)
    dietary_tags TEXT DEFAULT '[]',            -- ["vegetariano","sin gluten"]
    allergens TEXT DEFAULT '[]',               -- ["gluten","lactosa","mariscos"]
    -- Imágenes
    image_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    -- Estado
    is_active BOOLEAN DEFAULT 1,
    is_featured BOOLEAN DEFAULT 0,             -- Destacado/Recomendado
    is_available BOOLEAN DEFAULT 1,            -- Disponible hoy
    out_of_stock BOOLEAN DEFAULT 0,            -- Agotado temporalmente
    -- Metadatos
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Grupos de modificadores (ej: "Término de carne", "Extras", "Sin ingredientes")
CREATE TABLE IF NOT EXISTS modifier_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER,
    name VARCHAR(100) NOT NULL,                -- "Término de Carne"
    description TEXT,
    selection_type VARCHAR(20) DEFAULT 'single', -- single, multiple, required
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Modificadores individuales
CREATE TABLE IF NOT EXISTS modifiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,                -- "Término Medio", "Sin Cebolla"
    short_name VARCHAR(30),                    -- "TM", "S/Ceb"
    price_adjustment DECIMAL(10,2) DEFAULT 0,  -- +500 para extra queso
    is_default BOOLEAN DEFAULT 0,              -- Seleccionado por defecto
    is_active BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES modifier_groups(id)
);

-- Relación productos-grupos de modificadores
CREATE TABLE IF NOT EXISTS product_modifier_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    modifier_group_id INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(product_id, modifier_group_id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (modifier_group_id) REFERENCES modifier_groups(id)
);

-- ============================================================================
-- PARTE 5: RECETAS (Reemplaza Inventario Tradicional)
-- ============================================================================

-- Ingredientes base
CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER,
    name VARCHAR(100) NOT NULL,                -- "Carne Molida", "Pan Hamburguesa"
    unit VARCHAR(20) NOT NULL,                 -- "kg", "unidad", "litro", "g"
    cost_per_unit DECIMAL(10,2) DEFAULT 0,     -- Costo por unidad
    supplier_id INTEGER,                       -- Proveedor principal
    -- Alertas de stock
    min_stock_alert DECIMAL(10,2),             -- Alertar cuando baje de esto
    current_stock DECIMAL(10,2) DEFAULT 0,     -- Stock actual estimado
    last_purchase_date DATE,
    last_purchase_price DECIMAL(10,2),
    -- Estado
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Recetas de productos
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL UNIQUE,
    portions INTEGER DEFAULT 1,                -- Porciones que produce
    preparation_instructions TEXT,             -- Instrucciones de preparación
    total_cost DECIMAL(10,2) DEFAULT 0,        -- Costo total calculado
    profit_margin DECIMAL(5,2) DEFAULT 0,      -- Margen % calculado
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Ingredientes de cada receta
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,           -- Cantidad necesaria
    unit VARCHAR(20) NOT NULL,                 -- Unidad de la cantidad
    cost DECIMAL(10,2) DEFAULT 0,              -- Costo de este ingrediente
    notes TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

-- Proveedores
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER,
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    rut VARCHAR(20),
    payment_terms VARCHAR(100),                -- "Contado", "30 días"
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PARTE 6: PEDIDOS Y COMANDAS
-- ============================================================================

-- Pedidos (orden principal)
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,  -- ORD-20251203-00001
    -- Ubicación
    table_id INTEGER,
    salon_id INTEGER,
    -- Personal
    waiter_id INTEGER NOT NULL,
    cashier_id INTEGER,                        -- Quien cobró
    -- Tipo de pedido
    order_type VARCHAR(20) DEFAULT 'dine_in',  -- dine_in, takeaway, delivery
    -- Cliente (para delivery/reservas)
    customer_id INTEGER,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_count INTEGER DEFAULT 1,          -- Número de comensales
    -- Dirección delivery
    delivery_address TEXT,
    delivery_notes TEXT,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    -- Totales
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_reason VARCHAR(200),
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    -- Estado
    status VARCHAR(20) DEFAULT 'open',         -- open, in_progress, ready, completed, cancelled
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, partial, paid, refunded
    -- Timestamps
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_to_kitchen_at DATETIME,
    ready_at DATETIME,
    completed_at DATETIME,
    cancelled_at DATETIME,
    cancellation_reason TEXT,
    -- Notas
    notes TEXT,
    kitchen_notes TEXT,                        -- Notas para cocina
    -- Sincronización
    sync_id VARCHAR(50),                       -- UUID para sync
    synced_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id),
    FOREIGN KEY (waiter_id) REFERENCES users(id)
);

-- Items del pedido
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    -- Info del producto (copiada para historial)
    product_name VARCHAR(150) NOT NULL,
    product_sku VARCHAR(50),
    -- Cantidad y precio
    quantity DECIMAL(8,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    -- Modificadores aplicados (JSON)
    modifiers TEXT DEFAULT '[]',               -- [{"id":1,"name":"Sin cebolla","price":0}]
    modifiers_total DECIMAL(10,2) DEFAULT 0,
    -- Totales
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    -- Destino de comanda
    destination VARCHAR(20) DEFAULT 'kitchen', -- kitchen, bar, kitchen_1, kitchen_2, etc.
    printer_id INTEGER,
    -- Estado de preparación
    status VARCHAR(20) DEFAULT 'pending',      -- pending, sent, preparing, ready, delivered, cancelled
    sent_at DATETIME,                          -- Cuando se envió a cocina
    started_at DATETIME,                       -- Cuando empezó preparación
    ready_at DATETIME,                         -- Cuando está listo
    delivered_at DATETIME,                     -- Cuando se entregó al cliente
    -- Notas
    notes TEXT,                                -- Observaciones del cliente
    kitchen_notes TEXT,                        -- Notas internas cocina
    -- Quién agregó/modificó
    added_by INTEGER,                          -- Usuario que agregó
    -- Comanda número (para agrupar envíos)
    comanda_number INTEGER DEFAULT 1,          -- 1ra comanda, 2da comanda, etc.
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Historial de comandas enviadas
CREATE TABLE IF NOT EXISTS comanda_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    comanda_number INTEGER NOT NULL,
    destination VARCHAR(20) NOT NULL,          -- kitchen, bar, kitchen_1
    items_count INTEGER NOT NULL,
    sent_by INTEGER NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    printed BOOLEAN DEFAULT 0,
    printed_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- ============================================================================
-- PARTE 7: PAGOS Y CAJA
-- ============================================================================

-- Sesiones de caja
CREATE TABLE IF NOT EXISTS cash_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    terminal_id INTEGER NOT NULL,
    session_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,                  -- Cajero
    -- Estado
    status VARCHAR(20) DEFAULT 'open',         -- open, closed, suspended
    -- Balances
    opening_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(10,2),
    expected_balance DECIMAL(10,2),
    difference DECIMAL(10,2),
    -- Totales por método de pago
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_cash DECIMAL(10,2) DEFAULT 0,
    total_card DECIMAL(10,2) DEFAULT 0,
    total_transfer DECIMAL(10,2) DEFAULT 0,
    total_other DECIMAL(10,2) DEFAULT 0,
    -- Movimientos
    total_income DECIMAL(10,2) DEFAULT 0,      -- Ingresos extra
    total_expenses DECIMAL(10,2) DEFAULT 0,    -- Retiros/gastos
    -- Contadores
    sales_count INTEGER DEFAULT 0,
    cancelled_count INTEGER DEFAULT 0,
    -- Timestamps
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    notes TEXT,
    -- Sync
    sync_id VARCHAR(50),
    synced_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (terminal_id) REFERENCES terminals(id)
);

-- Movimientos de caja
CREATE TABLE IF NOT EXISTS cash_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cash_session_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,                 -- opening, sale, income, expense, closing
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),                -- cash, card, transfer, mixed
    -- Referencia
    reference_type VARCHAR(50),                -- sale, order, manual
    reference_id INTEGER,
    -- Detalle
    reason VARCHAR(255),
    notes TEXT,
    -- Quien realizó
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Pagos (un pedido puede tener múltiples pagos - cuenta dividida)
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    cash_session_id INTEGER,
    branch_id INTEGER NOT NULL,
    -- Monto
    amount DECIMAL(10,2) NOT NULL,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    -- Método de pago
    payment_method VARCHAR(50) NOT NULL,       -- cash, credit_card, debit_card, transfer, mixed
    card_type VARCHAR(50),                     -- visa, mastercard, amex
    card_last_digits VARCHAR(4),
    authorization_code VARCHAR(50),
    -- Estado
    status VARCHAR(20) DEFAULT 'completed',    -- completed, refunded, cancelled
    -- Cambio (si pago en efectivo)
    amount_received DECIMAL(10,2),
    change_amount DECIMAL(10,2),
    -- Facturación
    invoice_requested BOOLEAN DEFAULT 0,
    invoice_rut VARCHAR(20),
    invoice_name VARCHAR(200),
    -- Timestamps
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    refunded_at DATETIME,
    processed_by INTEGER,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id)
);

-- Reportes Z
CREATE TABLE IF NOT EXISTS z_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cash_session_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    report_number VARCHAR(50) UNIQUE NOT NULL,
    report_date DATE NOT NULL,
    -- Ventas
    total_sales DECIMAL(10,2) NOT NULL,
    total_tax DECIMAL(10,2) NOT NULL,
    total_discount DECIMAL(10,2) DEFAULT 0,
    net_sales DECIMAL(10,2) NOT NULL,
    -- Por método de pago
    cash_sales DECIMAL(10,2) DEFAULT 0,
    card_sales DECIMAL(10,2) DEFAULT 0,
    transfer_sales DECIMAL(10,2) DEFAULT 0,
    other_sales DECIMAL(10,2) DEFAULT 0,
    -- Contadores
    transactions_count INTEGER NOT NULL,
    cancelled_count INTEGER DEFAULT 0,
    refunded_count INTEGER DEFAULT 0,
    -- Caja
    opening_balance DECIMAL(10,2) NOT NULL,
    closing_balance DECIMAL(10,2) NOT NULL,
    difference DECIMAL(10,2) DEFAULT 0,
    -- Detalle completo (JSON)
    report_data TEXT,
    -- Estado
    printed BOOLEAN DEFAULT 0,
    printed_at DATETIME,
    generated_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id)
);

-- ============================================================================
-- PARTE 8: RESERVACIONES
-- ============================================================================

CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    reservation_number VARCHAR(50) UNIQUE NOT NULL,
    -- Cliente
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100),
    -- Reserva
    party_size INTEGER NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 120,      -- Duración estimada
    -- Mesa asignada (puede ser NULL hasta confirmar)
    table_id INTEGER,
    -- Estado
    status VARCHAR(20) DEFAULT 'pending',      -- pending, confirmed, seated, completed, cancelled, no_show
    -- Origen
    source VARCHAR(20) DEFAULT 'phone',        -- phone, web, whatsapp, walk_in
    -- Notas
    notes TEXT,
    special_requests TEXT,                     -- "Cumpleaños", "Silla de bebé"
    -- Timestamps
    confirmed_at DATETIME,
    seated_at DATETIME,
    completed_at DATETIME,
    cancelled_at DATETIME,
    cancellation_reason TEXT,
    -- Recordatorio
    reminder_sent BOOLEAN DEFAULT 0,
    reminder_sent_at DATETIME,
    -- Creado por
    created_by INTEGER,                        -- Usuario o NULL si cliente
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id)
);

-- ============================================================================
-- PARTE 9: CLIENTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER,                         -- NULL = cliente global
    -- Identificación
    rut VARCHAR(20),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    -- Dirección
    address TEXT,
    city VARCHAR(100),
    -- Facturación
    billing_name VARCHAR(200),
    billing_rut VARCHAR(20),
    billing_address TEXT,
    billing_giro VARCHAR(200),
    -- Estadísticas
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    average_ticket DECIMAL(10,2) DEFAULT 0,
    last_order_date DATE,
    -- Preferencias
    preferences TEXT,                          -- JSON con preferencias
    notes TEXT,
    -- Estado
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PARTE 10: CONFIGURACIÓN Y SINCRONIZACIÓN
-- ============================================================================

-- Configuración del sistema
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER,                         -- NULL = global
    category VARCHAR(50) DEFAULT 'general',
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string',    -- string, number, boolean, json
    description TEXT,
    is_public BOOLEAN DEFAULT 0,               -- Visible en frontend
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, key)
);

-- Cola de sincronización (para arquitectura híbrida)
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    operation VARCHAR(20) NOT NULL,            -- insert, update, delete
    data TEXT NOT NULL,                        -- JSON con los datos
    priority INTEGER DEFAULT 5,                -- 1=alta, 10=baja
    status VARCHAR(20) DEFAULT 'pending',      -- pending, syncing, synced, error
    attempts INTEGER DEFAULT 0,
    last_attempt_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced_at DATETIME
);

-- Log de sincronización
CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    sync_type VARCHAR(20) NOT NULL,            -- full, incremental, manual
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    records_sent INTEGER DEFAULT 0,
    records_received INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL,               -- success, partial, error
    error_message TEXT,
    details TEXT                               -- JSON con detalles
);

-- ============================================================================
-- PARTE 11: IMPRESORAS Y DESTINOS
-- ============================================================================

-- Impresoras configuradas
CREATE TABLE IF NOT EXISTS printers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,                -- "Impresora Cocina", "Impresora Barra"
    type VARCHAR(20) NOT NULL,                 -- thermal, kitchen, bar, label
    connection_type VARCHAR(20) NOT NULL,      -- usb, network, bluetooth
    address VARCHAR(200),                      -- IP o puerto
    port INTEGER,
    -- Configuración
    paper_width INTEGER DEFAULT 80,            -- mm
    is_active BOOLEAN DEFAULT 1,
    is_default BOOLEAN DEFAULT 0,
    -- Para qué se usa
    print_receipts BOOLEAN DEFAULT 0,
    print_kitchen BOOLEAN DEFAULT 0,
    print_bar BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Destinos de comanda (Cocina 1, Cocina 2, Barra, etc.)
CREATE TABLE IF NOT EXISTS kitchen_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    code VARCHAR(20) NOT NULL,                 -- kitchen_1, kitchen_2, bar
    name VARCHAR(100) NOT NULL,                -- "Cocina Caliente", "Cocina Fría", "Barra"
    printer_id INTEGER,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    -- Categorías que maneja (NULL = todas las asignadas)
    category_ids TEXT,                         -- JSON array de IDs de categorías
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, code),
    FOREIGN KEY (printer_id) REFERENCES printers(id)
);

-- ============================================================================
-- PARTE 12: ÍNDICES PARA RENDIMIENTO
-- ============================================================================

-- Índices de búsqueda frecuente
CREATE INDEX IF NOT EXISTS idx_orders_branch_status ON orders(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status, destination);
CREATE INDEX IF NOT EXISTS idx_tables_branch_status ON tables(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_branch ON cash_sessions(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(branch_id, reservation_date, status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, priority);

-- ============================================================================
-- PARTE 13: DATOS INICIALES
-- ============================================================================

-- Empresa por defecto
INSERT OR IGNORE INTO company (id, name, legal_name, currency, tax_rate)
VALUES (1, 'Mi Restaurante', 'Mi Restaurante SpA', 'CLP', 19.00);

-- Sucursal principal
INSERT OR IGNORE INTO branches (id, company_id, code, name, opening_time, closing_time)
VALUES (1, 1, 'SUC001', 'Sucursal Principal', '11:00', '23:00');

-- Terminal principal
INSERT OR IGNORE INTO terminals (id, branch_id, code, name, type, can_open_cash, can_close_cash, can_process_payments, can_view_reports)
VALUES (1, 1, 'TPV1', 'Caja Principal', 'main', 1, 1, 1, 1);

-- Salón por defecto
INSERT OR IGNORE INTO salons (id, branch_id, name, capacity)
VALUES (1, 1, 'Salón Principal', 50);

-- Tarifa normal
INSERT OR IGNORE INTO pricing_tiers (id, branch_id, name, multiplier)
VALUES (1, 1, 'Normal', 1.00);

-- Estaciones de cocina por defecto
INSERT OR IGNORE INTO kitchen_stations (id, branch_id, code, name, display_order)
VALUES
    (1, 1, 'kitchen', 'Cocina', 1),
    (2, 1, 'bar', 'Barra', 2);

-- Configuraciones básicas
INSERT OR IGNORE INTO settings (branch_id, category, key, value, data_type, description) VALUES
    (NULL, 'general', 'restaurant_name', 'Mi Restaurante', 'string', 'Nombre del restaurante'),
    (NULL, 'general', 'currency', 'CLP', 'string', 'Moneda'),
    (NULL, 'general', 'timezone', 'America/Santiago', 'string', 'Zona horaria'),
    (NULL, 'pos', 'tax_rate', '19', 'number', 'Porcentaje de IVA'),
    (NULL, 'pos', 'tax_included', 'true', 'boolean', 'Precios incluyen IVA'),
    (NULL, 'pos', 'tip_suggestions', '[10,15,20]', 'json', 'Sugerencias de propina %'),
    (NULL, 'pos', 'require_table', 'false', 'boolean', 'Requerir mesa para vender'),
    (NULL, 'pos', 'auto_print_kitchen', 'true', 'boolean', 'Imprimir automáticamente a cocina'),
    (NULL, 'delivery', 'enabled', 'true', 'boolean', 'Delivery habilitado'),
    (NULL, 'delivery', 'minimum_order', '10000', 'number', 'Pedido mínimo delivery'),
    (NULL, 'delivery', 'default_fee', '2500', 'number', 'Costo envío por defecto'),
    (NULL, 'sync', 'auto_sync', 'true', 'boolean', 'Sincronización automática'),
    (NULL, 'sync', 'sync_interval', '300', 'number', 'Intervalo sync en segundos');
