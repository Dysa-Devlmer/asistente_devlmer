-- =====================================================
-- SEED: Product Prices (Precios por Tarifa)
-- =====================================================
-- price_tier_id: 1=Regular, 2=Mayorista, 3=Empleados, 4=VIP
--
-- Lógica de precios:
-- - Regular: Precio base
-- - Mayorista: -10% del regular
-- - Empleados: -20% del regular
-- - VIP: +8% del regular (incluye servicio premium)
-- =====================================================

-- ENTRADAS (products 1-4)
-- Nachos Supreme
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(1, 1, 12.50, NOW(), NOW()),
(1, 2, 11.25, NOW(), NOW()),
(1, 3, 10.00, NOW(), NOW()),
(1, 4, 13.50, NOW(), NOW());

-- Alitas BBQ
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(2, 1, 14.00, NOW(), NOW()),
(2, 2, 12.60, NOW(), NOW()),
(2, 3, 11.20, NOW(), NOW()),
(2, 4, 15.12, NOW(), NOW());

-- Dedos de Queso
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(3, 1, 10.00, NOW(), NOW()),
(3, 2, 9.00, NOW(), NOW()),
(3, 3, 8.00, NOW(), NOW()),
(3, 4, 10.80, NOW(), NOW());

-- Calamares Fritos
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(4, 1, 16.00, NOW(), NOW()),
(4, 2, 14.40, NOW(), NOW()),
(4, 3, 12.80, NOW(), NOW()),
(4, 4, 17.28, NOW(), NOW());

-- ENSALADAS (products 5-7)
-- Ensalada César
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(5, 1, 9.00, NOW(), NOW()),
(5, 2, 8.10, NOW(), NOW()),
(5, 3, 7.20, NOW(), NOW()),
(5, 4, 9.72, NOW(), NOW());

-- Ensalada Griega
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(6, 1, 10.50, NOW(), NOW()),
(6, 2, 9.45, NOW(), NOW()),
(6, 3, 8.40, NOW(), NOW()),
(6, 4, 11.34, NOW(), NOW());

-- Ensalada Mixta
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(7, 1, 7.50, NOW(), NOW()),
(7, 2, 6.75, NOW(), NOW()),
(7, 3, 6.00, NOW(), NOW()),
(7, 4, 8.10, NOW(), NOW());

-- SOPAS (products 8-10)
-- Sopa de Tomate
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(8, 1, 6.00, NOW(), NOW()),
(8, 2, 5.40, NOW(), NOW()),
(8, 3, 4.80, NOW(), NOW()),
(8, 4, 6.48, NOW(), NOW());

-- Sopa de Cebolla
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(9, 1, 7.50, NOW(), NOW()),
(9, 2, 6.75, NOW(), NOW()),
(9, 3, 6.00, NOW(), NOW()),
(9, 4, 8.10, NOW(), NOW());

-- Consomé de Pollo
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(10, 1, 5.50, NOW(), NOW()),
(10, 2, 4.95, NOW(), NOW()),
(10, 3, 4.40, NOW(), NOW()),
(10, 4, 5.94, NOW(), NOW());

-- PLATOS PRINCIPALES (products 11-13)
-- Pollo Asado
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(11, 1, 18.00, NOW(), NOW()),
(11, 2, 16.20, NOW(), NOW()),
(11, 3, 14.40, NOW(), NOW()),
(11, 4, 19.44, NOW(), NOW());

-- Milanesa Napolitana
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(12, 1, 20.00, NOW(), NOW()),
(12, 2, 18.00, NOW(), NOW()),
(12, 3, 16.00, NOW(), NOW()),
(12, 4, 21.60, NOW(), NOW());

-- Parrillada Mixta
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(13, 1, 45.00, NOW(), NOW()),
(13, 2, 40.50, NOW(), NOW()),
(13, 3, 36.00, NOW(), NOW()),
(13, 4, 48.60, NOW(), NOW());

-- CARNES (products 14-17)
-- Bife de Chorizo
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(14, 1, 28.00, NOW(), NOW()),
(14, 2, 25.20, NOW(), NOW()),
(14, 3, 22.40, NOW(), NOW()),
(14, 4, 30.24, NOW(), NOW());

-- T-Bone Steak
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(15, 1, 35.00, NOW(), NOW()),
(15, 2, 31.50, NOW(), NOW()),
(15, 3, 28.00, NOW(), NOW()),
(15, 4, 37.80, NOW(), NOW());

-- Costillas BBQ
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(16, 1, 22.00, NOW(), NOW()),
(16, 2, 19.80, NOW(), NOW()),
(16, 3, 17.60, NOW(), NOW()),
(16, 4, 23.76, NOW(), NOW());

-- Lomo Fino
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(17, 1, 32.00, NOW(), NOW()),
(17, 2, 28.80, NOW(), NOW()),
(17, 3, 25.60, NOW(), NOW()),
(17, 4, 34.56, NOW(), NOW());

-- PESCADOS Y MARISCOS (products 18-20)
-- Salmón Grillado
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(18, 1, 26.00, NOW(), NOW()),
(18, 2, 23.40, NOW(), NOW()),
(18, 3, 20.80, NOW(), NOW()),
(18, 4, 28.08, NOW(), NOW());

-- Camarones al Ajillo
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(19, 1, 24.00, NOW(), NOW()),
(19, 2, 21.60, NOW(), NOW()),
(19, 3, 19.20, NOW(), NOW()),
(19, 4, 25.92, NOW(), NOW());

-- Filete de Pescado
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(20, 1, 18.50, NOW(), NOW()),
(20, 2, 16.65, NOW(), NOW()),
(20, 3, 14.80, NOW(), NOW()),
(20, 4, 19.98, NOW(), NOW());

-- PASTAS (products 21-24)
-- Spaghetti Carbonara
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(21, 1, 15.00, NOW(), NOW()),
(21, 2, 13.50, NOW(), NOW()),
(21, 3, 12.00, NOW(), NOW()),
(21, 4, 16.20, NOW(), NOW());

-- Ravioles de Ricota
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(22, 1, 16.50, NOW(), NOW()),
(22, 2, 14.85, NOW(), NOW()),
(22, 3, 13.20, NOW(), NOW()),
(22, 4, 17.82, NOW(), NOW());

-- Lasaña Boloñesa
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(23, 1, 17.00, NOW(), NOW()),
(23, 2, 15.30, NOW(), NOW()),
(23, 3, 13.60, NOW(), NOW()),
(23, 4, 18.36, NOW(), NOW());

-- Fettuccine Alfredo
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(24, 1, 14.50, NOW(), NOW()),
(24, 2, 13.05, NOW(), NOW()),
(24, 3, 11.60, NOW(), NOW()),
(24, 4, 15.66, NOW(), NOW());

-- PIZZAS (products 25-28)
-- Pizza Margarita
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(25, 1, 12.00, NOW(), NOW()),
(25, 2, 10.80, NOW(), NOW()),
(25, 3, 9.60, NOW(), NOW()),
(25, 4, 12.96, NOW(), NOW());

-- Pizza Pepperoni
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(26, 1, 14.00, NOW(), NOW()),
(26, 2, 12.60, NOW(), NOW()),
(26, 3, 11.20, NOW(), NOW()),
(26, 4, 15.12, NOW(), NOW());

-- Pizza Cuatro Quesos
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(27, 1, 15.50, NOW(), NOW()),
(27, 2, 13.95, NOW(), NOW()),
(27, 3, 12.40, NOW(), NOW()),
(27, 4, 16.74, NOW(), NOW());

-- Pizza Hawaiana
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(28, 1, 13.50, NOW(), NOW()),
(28, 2, 12.15, NOW(), NOW()),
(28, 3, 10.80, NOW(), NOW()),
(28, 4, 14.58, NOW(), NOW());

-- HAMBURGUESAS (products 29-31)
-- Hamburguesa Clásica
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(29, 1, 11.00, NOW(), NOW()),
(29, 2, 9.90, NOW(), NOW()),
(29, 3, 8.80, NOW(), NOW()),
(29, 4, 11.88, NOW(), NOW());

-- Hamburguesa Doble
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(30, 1, 14.50, NOW(), NOW()),
(30, 2, 13.05, NOW(), NOW()),
(30, 3, 11.60, NOW(), NOW()),
(30, 4, 15.66, NOW(), NOW());

-- Hamburguesa BBQ
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(31, 1, 13.00, NOW(), NOW()),
(31, 2, 11.70, NOW(), NOW()),
(31, 3, 10.40, NOW(), NOW()),
(31, 4, 14.04, NOW(), NOW());

-- POSTRES (products 32-35)
-- Tiramisú
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(32, 1, 8.50, NOW(), NOW()),
(32, 2, 7.65, NOW(), NOW()),
(32, 3, 6.80, NOW(), NOW()),
(32, 4, 9.18, NOW(), NOW());

-- Cheesecake
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(33, 1, 9.00, NOW(), NOW()),
(33, 2, 8.10, NOW(), NOW()),
(33, 3, 7.20, NOW(), NOW()),
(33, 4, 9.72, NOW(), NOW());

-- Brownie con Helado
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(34, 1, 7.00, NOW(), NOW()),
(34, 2, 6.30, NOW(), NOW()),
(34, 3, 5.60, NOW(), NOW()),
(34, 4, 7.56, NOW(), NOW());

-- Flan Casero
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(35, 1, 6.00, NOW(), NOW()),
(35, 2, 5.40, NOW(), NOW()),
(35, 3, 4.80, NOW(), NOW()),
(35, 4, 6.48, NOW(), NOW());

-- BEBIDAS FRÍAS (products 36-40)
-- Coca Cola
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(36, 1, 3.00, NOW(), NOW()),
(36, 2, 2.70, NOW(), NOW()),
(36, 3, 2.40, NOW(), NOW()),
(36, 4, 3.24, NOW(), NOW());

-- Agua Mineral
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(37, 1, 2.50, NOW(), NOW()),
(37, 2, 2.25, NOW(), NOW()),
(37, 3, 2.00, NOW(), NOW()),
(37, 4, 2.70, NOW(), NOW());

-- Jugo de Naranja
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(38, 1, 4.50, NOW(), NOW()),
(38, 2, 4.05, NOW(), NOW()),
(38, 3, 3.60, NOW(), NOW()),
(38, 4, 4.86, NOW(), NOW());

-- Limonada
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(39, 1, 3.50, NOW(), NOW()),
(39, 2, 3.15, NOW(), NOW()),
(39, 3, 2.80, NOW(), NOW()),
(39, 4, 3.78, NOW(), NOW());

-- Smoothie de Frutas
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(40, 1, 6.00, NOW(), NOW()),
(40, 2, 5.40, NOW(), NOW()),
(40, 3, 4.80, NOW(), NOW()),
(40, 4, 6.48, NOW(), NOW());

-- BEBIDAS CALIENTES (products 41-44)
-- Café Expresso
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(41, 1, 3.50, NOW(), NOW()),
(41, 2, 3.15, NOW(), NOW()),
(41, 3, 2.80, NOW(), NOW()),
(41, 4, 3.78, NOW(), NOW());

-- Cappuccino
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(42, 1, 4.50, NOW(), NOW()),
(42, 2, 4.05, NOW(), NOW()),
(42, 3, 3.60, NOW(), NOW()),
(42, 4, 4.86, NOW(), NOW());

-- Té Verde
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(43, 1, 3.00, NOW(), NOW()),
(43, 2, 2.70, NOW(), NOW()),
(43, 3, 2.40, NOW(), NOW()),
(43, 4, 3.24, NOW(), NOW());

-- Chocolate Caliente
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(44, 1, 4.00, NOW(), NOW()),
(44, 2, 3.60, NOW(), NOW()),
(44, 3, 3.20, NOW(), NOW()),
(44, 4, 4.32, NOW(), NOW());

-- CERVEZAS (products 45-47)
-- Cerveza Pilsen
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(45, 1, 5.00, NOW(), NOW()),
(45, 2, 4.50, NOW(), NOW()),
(45, 3, 4.00, NOW(), NOW()),
(45, 4, 5.40, NOW(), NOW());

-- Cerveza Negra
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(46, 1, 5.50, NOW(), NOW()),
(46, 2, 4.95, NOW(), NOW()),
(46, 3, 4.40, NOW(), NOW()),
(46, 4, 5.94, NOW(), NOW());

-- Cerveza Artesanal IPA
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(47, 1, 7.00, NOW(), NOW()),
(47, 2, 6.30, NOW(), NOW()),
(47, 3, 5.60, NOW(), NOW()),
(47, 4, 7.56, NOW(), NOW());

-- VINOS (products 48-50)
-- Vino Tinto Malbec
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(48, 1, 8.00, NOW(), NOW()),
(48, 2, 7.20, NOW(), NOW()),
(48, 3, 6.40, NOW(), NOW()),
(48, 4, 8.64, NOW(), NOW());

-- Vino Blanco Chardonnay
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(49, 1, 7.50, NOW(), NOW()),
(49, 2, 6.75, NOW(), NOW()),
(49, 3, 6.00, NOW(), NOW()),
(49, 4, 8.10, NOW(), NOW());

-- Vino Rosado
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(50, 1, 7.00, NOW(), NOW()),
(50, 2, 6.30, NOW(), NOW()),
(50, 3, 5.60, NOW(), NOW()),
(50, 4, 7.56, NOW(), NOW());

-- CÓCTELES (products 51-54)
-- Mojito
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(51, 1, 9.00, NOW(), NOW()),
(51, 2, 8.10, NOW(), NOW()),
(51, 3, 7.20, NOW(), NOW()),
(51, 4, 9.72, NOW(), NOW());

-- Margarita
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(52, 1, 9.50, NOW(), NOW()),
(52, 2, 8.55, NOW(), NOW()),
(52, 3, 7.60, NOW(), NOW()),
(52, 4, 10.26, NOW(), NOW());

-- Piña Colada
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(53, 1, 10.00, NOW(), NOW()),
(53, 2, 9.00, NOW(), NOW()),
(53, 3, 8.00, NOW(), NOW()),
(53, 4, 10.80, NOW(), NOW());

-- Daiquiri
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(54, 1, 8.50, NOW(), NOW()),
(54, 2, 7.65, NOW(), NOW()),
(54, 3, 6.80, NOW(), NOW()),
(54, 4, 9.18, NOW(), NOW());

-- LICORES (products 55-57)
-- Whisky
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(55, 1, 12.00, NOW(), NOW()),
(55, 2, 10.80, NOW(), NOW()),
(55, 3, 9.60, NOW(), NOW()),
(55, 4, 12.96, NOW(), NOW());

-- Ron Añejo
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(56, 1, 10.00, NOW(), NOW()),
(56, 2, 9.00, NOW(), NOW()),
(56, 3, 8.00, NOW(), NOW()),
(56, 4, 10.80, NOW(), NOW());

-- Vodka
INSERT INTO product_prices (product_id, price_tier_id, price, created_at, updated_at) VALUES
(57, 1, 11.00, NOW(), NOW()),
(57, 2, 9.90, NOW(), NOW()),
(57, 3, 8.80, NOW(), NOW()),
(57, 4, 11.88, NOW(), NOW());

-- =====================================================
-- Total: 228 precios (57 productos × 4 tarifas)
-- Rango de precios: $2.00 - $48.60
-- =====================================================
