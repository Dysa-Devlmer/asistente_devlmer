-- =====================================================
-- SEED: Products (Productos)
-- =====================================================
-- NOTA: Prisma requiere: sku, name, category_id, base_price
-- Los precios por tarifa se configuran en product_prices

-- ENTRADAS (category_id: 1)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('APTZ-001', 'Nachos Supreme', 'Nachos con queso, guacamole y crema', 1, 12.50, NOW(), NOW()),
('APTZ-002', 'Alitas BBQ', '10 alitas de pollo con salsa BBQ', 1, 14.00, NOW(), NOW()),
('APTZ-003', 'Dedos de Queso', '8 dedos de mozzarella empanizados', 1, 10.00, NOW(), NOW()),
('APTZ-004', 'Calamares Fritos', 'Aros de calamar con salsa tártara', 1, 16.00, NOW(), NOW());

-- ENSALADAS (category_id: 2)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('SALD-001', 'Ensalada César', 'Lechuga, crutones, parmesano y aderezo César', 2, 9.00, NOW(), NOW()),
('SALD-002', 'Ensalada Griega', 'Tomate, pepino, cebolla, aceitunas y queso feta', 2, 10.50, NOW(), NOW()),
('SALD-003', 'Ensalada Mixta', 'Lechuga, tomate, zanahoria y vinagreta', 2, 7.50, NOW(), NOW());

-- SOPAS (category_id: 3)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('SOUP-001', 'Sopa de Tomate', 'Crema de tomate con albahaca', 3, 6.00, NOW(), NOW()),
('SOUP-002', 'Sopa de Cebolla', 'Sopa de cebolla gratinada', 3, 7.50, NOW(), NOW()),
('SOUP-003', 'Consomé de Pollo', 'Caldo de pollo con vegetales', 3, 5.50, NOW(), NOW());

-- PLATOS PRINCIPALES (category_id: 4)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('MAIN-001', 'Pollo Asado', 'Medio pollo con papas y ensalada', 4, 18.00, NOW(), NOW()),
('MAIN-002', 'Milanesa Napolitana', 'Milanesa de res con jamón y queso', 4, 20.00, NOW(), NOW()),
('MAIN-003', 'Parrillada Mixta', 'Carne, pollo y chorizo para 2 personas', 4, 45.00, NOW(), NOW());

-- CARNES (category_id: 5)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('MEAT-001', 'Bife de Chorizo', 'Corte argentino 300g con guarnición', 5, 28.00, NOW(), NOW()),
('MEAT-002', 'T-Bone Steak', 'Corte T-Bone 400g término a elección', 5, 35.00, NOW(), NOW()),
('MEAT-003', 'Costillas BBQ', 'Costillas de cerdo con salsa BBQ', 5, 22.00, NOW(), NOW()),
('MEAT-004', 'Lomo Fino', 'Medallones de lomo con salsa de hongos', 5, 32.00, NOW(), NOW());

-- PESCADOS Y MARISCOS (category_id: 6)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('FISH-001', 'Salmón Grillado', 'Filete de salmón con vegetales', 6, 26.00, NOW(), NOW()),
('FISH-002', 'Camarones al Ajillo', 'Camarones salteados en ajo y mantequilla', 6, 24.00, NOW(), NOW()),
('FISH-003', 'Filete de Pescado', 'Filete empanizado con arroz', 6, 18.50, NOW(), NOW());

-- PASTAS (category_id: 7)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('PSTA-001', 'Spaghetti Carbonara', 'Pasta con panceta, huevo y parmesano', 7, 15.00, NOW(), NOW()),
('PSTA-002', 'Ravioles de Ricota', 'Ravioles con salsa de tomate', 7, 16.50, NOW(), NOW()),
('PSTA-003', 'Lasaña Boloñesa', 'Lasaña de carne con bechamel', 7, 17.00, NOW(), NOW()),
('PSTA-004', 'Fettuccine Alfredo', 'Pasta en salsa de crema', 7, 14.50, NOW(), NOW());

-- PIZZAS (category_id: 8)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('PIZZ-001', 'Pizza Margarita', 'Salsa, mozzarella y albahaca', 8, 12.00, NOW(), NOW()),
('PIZZ-002', 'Pizza Pepperoni', 'Salsa, mozzarella y pepperoni', 8, 14.00, NOW(), NOW()),
('PIZZ-003', 'Pizza Cuatro Quesos', 'Mozzarella, parmesano, gorgonzola y provolone', 8, 15.50, NOW(), NOW()),
('PIZZ-004', 'Pizza Hawaiana', 'Jamón, piña y mozzarella', 8, 13.50, NOW(), NOW());

-- HAMBURGUESAS (category_id: 9)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('BURG-001', 'Hamburguesa Clásica', 'Carne 180g, lechuga, tomate, cebolla', 9, 11.00, NOW(), NOW()),
('BURG-002', 'Hamburguesa Doble', 'Doble carne con queso cheddar', 9, 14.50, NOW(), NOW()),
('BURG-003', 'Hamburguesa BBQ', 'Carne, queso, cebolla caramelizada y BBQ', 9, 13.00, NOW(), NOW());

-- POSTRES (category_id: 10)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('DSRT-001', 'Tiramisú', 'Postre italiano con café y mascarpone', 10, 8.50, NOW(), NOW()),
('DSRT-002', 'Cheesecake', 'Tarta de queso con frutos rojos', 10, 9.00, NOW(), NOW()),
('DSRT-003', 'Brownie con Helado', 'Brownie caliente con helado de vainilla', 10, 7.00, NOW(), NOW()),
('DSRT-004', 'Flan Casero', 'Flan de huevo con dulce de leche', 10, 6.00, NOW(), NOW());

-- BEBIDAS FRÍAS (category_id: 11)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('BCOL-001', 'Coca Cola', 'Refresco 500ml', 11, 3.00, NOW(), NOW()),
('BCOL-002', 'Agua Mineral', 'Agua con gas 500ml', 11, 2.50, NOW(), NOW()),
('BCOL-003', 'Jugo de Naranja', 'Jugo natural de naranja', 11, 4.50, NOW(), NOW()),
('BCOL-004', 'Limonada', 'Limonada casera', 11, 3.50, NOW(), NOW()),
('BCOL-005', 'Smoothie de Frutas', 'Batido de frutas tropicales', 11, 6.00, NOW(), NOW());

-- BEBIDAS CALIENTES (category_id: 12)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('BHOT-001', 'Café Expresso', 'Café expresso doble', 12, 3.50, NOW(), NOW()),
('BHOT-002', 'Cappuccino', 'Café con leche espumada', 12, 4.50, NOW(), NOW()),
('BHOT-003', 'Té Verde', 'Té verde con menta', 12, 3.00, NOW(), NOW()),
('BHOT-004', 'Chocolate Caliente', 'Chocolate con crema batida', 12, 4.00, NOW(), NOW());

-- CERVEZAS (category_id: 13)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('BEER-001', 'Cerveza Pilsen', 'Cerveza rubia 355ml', 13, 5.00, NOW(), NOW()),
('BEER-002', 'Cerveza Negra', 'Cerveza oscura 355ml', 13, 5.50, NOW(), NOW()),
('BEER-003', 'Cerveza Artesanal IPA', 'IPA americana 500ml', 13, 7.00, NOW(), NOW());

-- VINOS (category_id: 14)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('WINE-001', 'Vino Tinto Malbec', 'Copa de Malbec argentino', 14, 8.00, NOW(), NOW()),
('WINE-002', 'Vino Blanco Chardonnay', 'Copa de Chardonnay', 14, 7.50, NOW(), NOW()),
('WINE-003', 'Vino Rosado', 'Copa de vino rosado', 14, 7.00, NOW(), NOW());

-- CÓCTELES (category_id: 15)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('CKTL-001', 'Mojito', 'Ron, menta, lima y soda', 15, 9.00, NOW(), NOW()),
('CKTL-002', 'Margarita', 'Tequila, triple sec y lima', 15, 9.50, NOW(), NOW()),
('CKTL-003', 'Piña Colada', 'Ron, piña y coco', 15, 10.00, NOW(), NOW()),
('CKTL-004', 'Daiquiri', 'Ron, lima y azúcar', 15, 8.50, NOW(), NOW());

-- LICORES (category_id: 16)
INSERT INTO products (sku, name, description, category_id, base_price, created_at, updated_at)
VALUES
('LIQR-001', 'Whisky', 'Whisky escocés 50ml', 16, 12.00, NOW(), NOW()),
('LIQR-002', 'Ron Añejo', 'Ron añejo 50ml', 16, 10.00, NOW(), NOW()),
('LIQR-003', 'Vodka', 'Vodka premium 50ml', 16, 11.00, NOW(), NOW());

-- =====================================================
-- Total: 57 productos distribuidos en 16 categorías
-- Comidas: 35 productos
-- Bebidas: 22 productos
-- =====================================================
