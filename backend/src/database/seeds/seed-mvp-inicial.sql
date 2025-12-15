-- ============================================================================
-- SYSME POS - Seed Data Inicial (MVP)
-- ============================================================================
-- Datos iniciales para desarrollo y testing
-- Compatible con PostgreSQL y SQLite
-- ============================================================================

-- ============================================================================
-- 1. SUCURSALES
-- ============================================================================

INSERT INTO sucursal (codigo, nombre, comuna, region, telefono, email) VALUES
('SUC001', 'Sucursal Centro', 'Santiago', 'Metropolitana', '+56 2 2345 6789', 'centro@sysmepos.cl'),
('SUC002', 'Sucursal Providencia', 'Providencia', 'Metropolitana', '+56 2 2987 6543', 'providencia@sysmepos.cl'),
('SUC003', 'Sucursal Las Condes', 'Las Condes', 'Metropolitana', '+56 2 2456 7890', 'lascondes@sysmepos.cl');

-- ============================================================================
-- 2. EMPLEADOS
-- ============================================================================

-- Password y PIN para todos: "password123" y "1234" (hasheados con bcrypt)
-- IMPORTANTE: Cambiar en producción

INSERT INTO empleado (username, email, rut, primer_nombre, apellido_paterno, apellido_materno, password_hash, pin_hash, rol, sucursal_id) VALUES
-- Admin
('admin', 'admin@sysmepos.cl', '12345678-9', 'Admin', 'Sistema', NULL,
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 'admin', 1),

-- Gerente
('gerente1', 'gerente@sysmepos.cl', '23456789-0', 'María', 'González', 'Silva',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 'gerente', 1),

-- Cajeros
('cajero1', 'cajero1@sysmepos.cl', '34567890-1', 'Juan', 'Pérez', 'López',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 'cajero', 1),

('cajero2', 'cajero2@sysmepos.cl', '45678901-2', 'Ana', 'Martínez', 'Rojas',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 'cajero', 1),

-- Meseros
('mesero1', 'mesero1@sysmepos.cl', '56789012-3', 'Pedro', 'Sánchez', 'Muñoz',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 'mesero', 1),

('mesero2', 'mesero2@sysmepos.cl', '67890123-4', 'Carolina', 'Fuentes', 'Díaz',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 'mesero', 1),

('mesero3', 'mesero3@sysmepos.cl', '78901234-5', 'Diego', 'Ramírez', 'Torres',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 'mesero', 1),

-- Personal de cocina
('cocina1', 'cocina1@sysmepos.cl', '89012345-6', 'Luis', 'Morales', 'Castro',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 'cocina', 1),

('cocina2', 'cocina2@sysmepos.cl', '90123456-7', 'Francisca', 'Vargas', 'Bravo',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 'cocina', 1),

-- Barman
('barra1', 'barra1@sysmepos.cl', '01234567-8', 'Rodrigo', 'Campos', 'Navarro',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/jPW5.ZjjQgT3vSMKG',
 'barra', 1);

-- ============================================================================
-- 3. ZONAS Y MESAS
-- ============================================================================

-- Zonas Sucursal Centro
INSERT INTO zona (nombre, descripcion, sucursal_id, color) VALUES
('Salón Principal', 'Área principal del restaurant', 1, '#3b82f6'),
('Terraza', 'Terraza exterior', 1, '#10b981'),
('Barra', 'Área de barra', 1, '#8b5cf6'),
('Salón VIP', 'Área privada VIP', 1, '#f59e0b');

-- Mesas Salón Principal (Zona 1)
INSERT INTO mesa (numero, capacidad, zona_id, sucursal_id, pos_x, pos_y, forma) VALUES
('Mesa 1', 4, 1, 1, 50, 50, 'rectangular'),
('Mesa 2', 4, 1, 1, 200, 50, 'rectangular'),
('Mesa 3', 2, 1, 1, 350, 50, 'circular'),
('Mesa 4', 6, 1, 1, 50, 200, 'rectangular'),
('Mesa 5', 4, 1, 1, 200, 200, 'rectangular'),
('Mesa 6', 4, 1, 1, 350, 200, 'rectangular'),
('Mesa 7', 2, 1, 1, 50, 350, 'circular'),
('Mesa 8', 8, 1, 1, 200, 350, 'rectangular');

-- Mesas Terraza (Zona 2)
INSERT INTO mesa (numero, capacidad, zona_id, sucursal_id, pos_x, pos_y, forma) VALUES
('Terraza 1', 4, 2, 1, 50, 50, 'circular'),
('Terraza 2', 4, 2, 1, 200, 50, 'circular'),
('Terraza 3', 2, 2, 1, 350, 50, 'circular'),
('Terraza 4', 6, 2, 1, 50, 200, 'rectangular');

-- Barra (Zona 3)
INSERT INTO mesa (numero, capacidad, zona_id, sucursal_id, pos_x, pos_y, forma) VALUES
('Barra 1', 1, 3, 1, 50, 50, 'cuadrada'),
('Barra 2', 1, 3, 1, 100, 50, 'cuadrada'),
('Barra 3', 1, 3, 1, 150, 50, 'cuadrada'),
('Barra 4', 1, 3, 1, 200, 50, 'cuadrada'),
('Barra 5', 1, 3, 1, 250, 50, 'cuadrada'),
('Barra 6', 1, 3, 1, 300, 50, 'cuadrada');

-- VIP (Zona 4)
INSERT INTO mesa (numero, capacidad, zona_id, sucursal_id, pos_x, pos_y, forma) VALUES
('VIP 1', 8, 4, 1, 100, 100, 'rectangular'),
('VIP 2', 10, 4, 1, 300, 100, 'rectangular');

-- ============================================================================
-- 4. CATEGORÍAS DE PRODUCTOS
-- ============================================================================

INSERT INTO categoria (nombre, descripcion, color, icono, orden) VALUES
('Bebidas Frías', 'Bebidas frías y refrescos', '#3b82f6', 'glass-water', 1),
('Bebidas Calientes', 'Cafés, tés e infusiones', '#f59e0b', 'coffee', 2),
('Cervezas', 'Cervezas nacionales e importadas', '#eab308', 'beer', 3),
('Vinos', 'Vinos tintos, blancos y rosados', '#dc2626', 'wine-glass', 4),
('Entradas', 'Aperitivos y entradas', '#10b981', 'utensils', 5),
('Ensaladas', 'Ensaladas frescas', '#22c55e', 'leaf', 6),
('Platos Principales', 'Platos de fondo', '#ef4444', 'plate-utensils', 7),
('Carnes', 'Carnes a la parrilla', '#dc2626', 'drumstick', 8),
('Pastas', 'Pastas italianas', '#f97316', 'bowl-food', 9),
('Pizzas', 'Pizzas artesanales', '#f59e0b', 'pizza-slice', 10),
('Mariscos', 'Pescados y mariscos', '#06b6d4', 'fish', 11),
('Postres', 'Postres y dulces', '#ec4899', 'cake-slice', 12);

-- ============================================================================
-- 5. ESTACIONES DE COCINA
-- ============================================================================

INSERT INTO estacion_cocina (codigo, nombre, descripcion, color, sucursal_id, tiempo_alerta_minutos) VALUES
('COCINA_CALIENTE', 'Cocina Caliente', 'Platos calientes y guisos', '#ef4444', 1, 15),
('COCINA_FRIA', 'Cocina Fría', 'Ensaladas y preparaciones frías', '#3b82f6', 1, 10),
('PARRILLA', 'Parrilla', 'Carnes y pescados a la parrilla', '#f59e0b', 1, 20),
('BARRA', 'Barra', 'Bebidas y tragos', '#8b5cf6', 1, 5),
('REPOSTERIA', 'Repostería', 'Postres y pastelería', '#ec4899', 1, 15);

-- ============================================================================
-- 6. PRODUCTOS (Menú chileno típico)
-- ============================================================================

-- BEBIDAS FRÍAS
INSERT INTO producto (nombre, descripcion, precio, categoria_id, stock, sku, estacion_cocina_id, requiere_cocina, tiempo_preparacion) VALUES
('Coca Cola 500ml', 'Coca Cola regular', 1500, 1, 100, 'BEB-001', 4, 0, 2),
('Coca Cola Zero 500ml', 'Coca Cola sin azúcar', 1500, 1, 80, 'BEB-002', 4, 0, 2),
('Sprite 500ml', 'Refresco de limón', 1500, 1, 80, 'BEB-003', 4, 0, 2),
('Fanta 500ml', 'Refresco de naranja', 1500, 1, 80, 'BEB-004', 4, 0, 2),
('Agua Mineral 500ml', 'Agua sin gas', 1200, 1, 150, 'BEB-005', 4, 0, 1),
('Agua con Gas 500ml', 'Agua mineralizada', 1200, 1, 100, 'BEB-006', 4, 0, 1),
('Jugo Natural Naranja', 'Jugo exprimido fresco', 2500, 1, 0, 'BEB-007', 4, 1, 5),
('Jugo Natural Frutilla', 'Jugo de frutillas frescas', 2800, 1, 0, 'BEB-008', 4, 1, 5),
('Limonada Natural', 'Limonada casera', 2200, 1, 0, 'BEB-009', 4, 1, 5);

-- BEBIDAS CALIENTES
INSERT INTO producto (nombre, descripcion, precio, categoria_id, stock, sku, estacion_cocina_id, requiere_cocina, tiempo_preparacion) VALUES
('Café Americano', 'Café negro americano', 1800, 2, 0, 'CAF-001', 4, 1, 3),
('Café Cortado', 'Café con leche', 2000, 2, 0, 'CAF-002', 4, 1, 3),
('Capuchino', 'Café con leche espumada', 2500, 2, 0, 'CAF-003', 4, 1, 4),
('Café Latte', 'Café con más leche', 2500, 2, 0, 'CAF-004', 4, 1, 4),
('Té Verde', 'Té verde en hebras', 1500, 2, 0, 'TE-001', 4, 1, 3),
('Té Negro', 'Té negro tradicional', 1500, 2, 0, 'TE-002', 4, 1, 3),
('Manzanilla', 'Infusión de manzanilla', 1500, 2, 0, 'TE-003', 4, 1, 3);

-- CERVEZAS
INSERT INTO producto (nombre, descripcion, precio, categoria_id, stock, sku, estacion_cocina_id, requiere_cocina, tiempo_preparacion) VALUES
('Cristal 330ml', 'Cerveza nacional', 2000, 3, 200, 'CER-001', 4, 0, 2),
('Escudo 330ml', 'Cerveza nacional', 2000, 3, 150, 'CER-002', 4, 0, 2),
('Royal 330ml', 'Cerveza premium', 2500, 3, 100, 'CER-003', 4, 0, 2),
('Corona 355ml', 'Cerveza importada', 3500, 3, 80, 'CER-004', 4, 0, 2),
('Heineken 330ml', 'Cerveza importada', 3500, 3, 80, 'CER-005', 4, 0, 2);

-- ENTRADAS
INSERT INTO producto (nombre, descripcion, precio, categoria_id, stock, sku, estacion_cocina_id, tiempo_preparacion) VALUES
('Tabla de Quesos', 'Selección de quesos chilenos', 6500, 5, 0, 'ENT-001', 2, 10),
('Tabla de Fiambres', 'Jamón serrano, salame, queso', 7500, 5, 0, 'ENT-002', 2, 10),
('Empanadas de Pino', 'Empanadas tradicionales (3 unid)', 4500, 5, 0, 'ENT-003', 1, 15),
('Empanadas de Queso', 'Empanadas de queso (3 unid)', 4000, 5, 0, 'ENT-004', 1, 15),
('Sopaipillas', 'Sopaipillas caseras con pebre', 3000, 5, 0, 'ENT-005', 1, 10),
('Papas Fritas', 'Papas fritas caseras', 3500, 5, 0, 'ENT-006', 1, 12);

-- ENSALADAS
INSERT INTO producto (nombre, descripcion, precio, categoria_id, stock, sku, estacion_cocina_id, tiempo_preparacion) VALUES
('Ensalada Chilena', 'Tomate, cebolla, cilantro', 3500, 6, 0, 'ENS-001', 2, 8),
('Ensalada César', 'Lechuga, pollo, parmesano, crutones', 5500, 6, 0, 'ENS-002', 2, 10),
('Ensalada Mixta', 'Lechuga, tomate, zanahoria, betarraga', 4500, 6, 0, 'ENS-003', 2, 8),
('Ensalada Palta Reina', 'Palta rellena con pollo', 6500, 6, 0, 'ENS-004', 2, 12);

-- PLATOS PRINCIPALES
INSERT INTO producto (nombre, descripcion, precio, categoria_id, stock, sku, estacion_cocina_id, tiempo_preparacion) VALUES
('Cazuela de Vacuno', 'Cazuela tradicional chilena', 7500, 7, 0, 'PLATO-001', 1, 25),
('Pastel de Choclo', 'Pastel de choclo tradicional', 7000, 7, 0, 'PLATO-002', 1, 30),
('Porotos con Riendas', 'Porotos con tallarines y longaniza', 6500, 7, 0, 'PLATO-003', 1, 25),
('Charquicán', 'Charquicán de carne', 6000, 7, 0, 'PLATO-004', 1, 20);

-- CARNES
INSERT INTO producto (nombre, descripcion, precio, categoria_id, stock, sku, estacion_cocina_id, tiempo_preparacion) VALUES
('Lomo Liso 250g', 'Lomo liso a la parrilla', 12000, 8, 0, 'CAR-001', 3, 20),
('Filete de Res 200g', 'Filete de res premium', 14000, 8, 0, 'CAR-002', 3, 18),
('Costillar de Cerdo', 'Costillar BBQ', 9500, 8, 0, 'CAR-003', 3, 30),
('Churrasco Pobre', 'Churrasco con huevo y papas', 8500, 8, 0, 'CAR-004', 3, 18),
('Churrasco Italiano', 'Churrasco con tomate, palta y mayo', 7500, 8, 0, 'CAR-005', 3, 15);

-- PASTAS
INSERT INTO producto (nombre, descripcion, precio, categoria_id, stock, sku, estacion_cocina_id, tiempo_preparacion) VALUES
('Spaghetti Bolognesa', 'Pasta con salsa bolognesa', 6500, 9, 0, 'PAS-001', 1, 15),
('Fetuccini Alfredo', 'Pasta con salsa alfredo', 7000, 9, 0, 'PAS-002', 1, 15),
('Ravioles de Carne', 'Ravioles rellenos con carne', 7500, 9, 0, 'PAS-003', 1, 18),
('Lasagna de Carne', 'Lasagna tradicional', 8000, 9, 0, 'PAS-004', 1, 20);

-- PIZZAS
INSERT INTO producto (nombre, descripcion, precio, categoria_id, stock, sku, estacion_cocina_id, tiempo_preparacion) VALUES
('Pizza Margherita', 'Tomate, mozzarella, albahaca', 7500, 10, 0, 'PIZ-001', 1, 18),
('Pizza Pepperoni', 'Pepperoni y queso', 8500, 10, 0, 'PIZ-002', 1, 18),
('Pizza Italiana', 'Jamón, tomate, palta, mayo', 9000, 10, 0, 'PIZ-003', 1, 18),
('Pizza Cuatro Quesos', 'Mozzarella, parmesano, gorgonzola, gouda', 9500, 10, 0, 'PIZ-004', 1, 18),
('Pizza Vegetariana', 'Vegetales asados', 8000, 10, 0, 'PIZ-005', 1, 18);

-- MARISCOS
INSERT INTO producto (nombre, descripcion, precio, categoria_id, stock, sku, estacion_cocina_id, tiempo_preparacion) VALUES
('Salmón Grillado', 'Salmón a la plancha con vegetales', 12000, 11, 0, 'MAR-001', 3, 18),
('Reineta Frita', 'Reineta con ensalada', 9500, 11, 0, 'MAR-002', 3, 15),
('Paila Marina', 'Mariscos en caldo', 11000, 11, 0, 'MAR-003', 1, 20),
('Jaibas Gratinadas', 'Jaibas al horno', 13000, 11, 0, 'MAR-004', 1, 25);

-- POSTRES
INSERT INTO producto (nombre, descripcion, precio, categoria_id, stock, sku, estacion_cocina_id, tiempo_preparacion) VALUES
('Helado 3 Sabores', 'Helado artesanal', 3500, 12, 0, 'POS-001', 5, 5),
('Torta de Chocolate', 'Torta de chocolate casera', 4000, 12, 0, 'POS-002', 5, 8),
('Cheesecake', 'Cheesecake de frutos rojos', 4500, 12, 0, 'POS-003', 5, 8),
('Leche Asada', 'Leche asada tradicional', 3000, 12, 0, 'POS-004', 5, 5),
('Mote con Huesillos', 'Postre tradicional chileno', 2500, 12, 0, 'POS-005', 5, 5);

-- ============================================================================
-- 7. MODIFICADORES
-- ============================================================================

INSERT INTO modificador (nombre, tipo, precio_adicional) VALUES
-- Cocción
('Punto Medio', 'coccion', 0),
('Bien Cocido', 'coccion', 0),
('Jugoso', 'coccion', 0),

-- Ingredientes (quitar)
('Sin Cebolla', 'ingrediente', 0),
('Sin Tomate', 'ingrediente', 0),
('Sin Ají', 'ingrediente', 0),
('Sin Cilantro', 'ingrediente', 0),
('Sin Queso', 'ingrediente', 0),
('Sin Mayo', 'ingrediente', 0),
('Sin Palta', 'ingrediente', 0),

-- Extras (agregar)
('Extra Queso', 'extra', 800),
('Extra Palta', 'extra', 1000),
('Extra Bacon', 'extra', 1200),
('Extra Huevo', 'extra', 500),
('Extra Papas', 'extra', 1000),
('Extra Salsa', 'extra', 300);

-- Asignar modificadores a productos específicos
-- (Ejemplo: Carnes pueden tener cocción y extras)
INSERT INTO producto_modificador (producto_id, modificador_id, es_obligatorio) VALUES
-- Lomo Liso puede tener cocción (obligatorio elegir una)
(31, 1, 1), -- Punto Medio
(31, 2, 1), -- Bien Cocido
(31, 3, 1), -- Jugoso
-- Y extras opcionales
(31, 14, 0), -- Extra Huevo
(31, 15, 0); -- Extra Papas

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 'Seed data cargado exitosamente' AS status;
SELECT COUNT(*) AS total_productos FROM producto;
SELECT COUNT(*) AS total_empleados FROM empleado;
SELECT COUNT(*) AS total_mesas FROM mesa;
