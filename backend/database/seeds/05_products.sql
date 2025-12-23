-- ============================================================
-- SEED: Productos y Precios
-- Sistema: POS Restaurant - SYSME_MISTURA Compatible
-- ============================================================

-- Limpiar datos existentes (solo para testing)
TRUNCATE TABLE comg_tarifa CASCADE;
TRUNCATE TABLE complementog CASCADE;

-- ============================================================
-- PRODUCTOS (complementog)
-- ============================================================

-- PARRILLA (Categorías 1-4, bloque_cocina=1)
INSERT INTO complementog (id_complementog, complementog, id_tipo, pvp, iva, bloque_cocina, activo) VALUES
-- Carnes a la Parrilla (cat 1)
(1, 'Bife de Chorizo 400g', 1, 45.00, 18, 1, true),
(2, 'Lomo de Res 300g', 1, 55.00, 18, 1, true),
(3, 'Costillas de Cerdo', 1, 35.00, 18, 1, true),
(4, 'Parrillada Mixta para 2', 1, 75.00, 18, 1, true),

-- Pollo y Aves (cat 2)
(5, 'Pollo a la Parrilla', 2, 28.00, 18, 1, true),
(6, 'Alitas BBQ (12 unidades)', 2, 22.00, 18, 1, true),
(7, 'Pechuga Grillada', 2, 25.00, 18, 1, true),

-- Pescados y Mariscos (cat 3)
(8, 'Salmón a la Plancha', 3, 48.00, 18, 1, true),
(9, 'Trucha Frita', 3, 32.00, 18, 1, true),
(10, 'Brochetas de Camarones', 3, 42.00, 18, 1, true),

-- Hamburguesas (cat 4)
(11, 'Hamburguesa Clásica', 4, 18.00, 18, 1, true),
(12, 'Hamburguesa Doble Carne', 4, 24.00, 18, 1, true),
(13, 'Hamburguesa BBQ Bacon', 4, 26.00, 18, 1, true),

-- FRÍOS (Categorías 5-8, bloque_cocina=2)
-- Ensaladas (cat 5)
(14, 'Ensalada César', 5, 16.00, 18, 2, true),
(15, 'Ensalada Griega', 5, 15.00, 18, 2, true),
(16, 'Ensalada Caprese', 5, 18.00, 18, 2, true),

-- Ceviches (cat 6)
(17, 'Ceviche de Pescado', 6, 28.00, 18, 2, true),
(18, 'Ceviche Mixto', 6, 32.00, 18, 2, true),
(19, 'Tiradito', 6, 30.00, 18, 2, true),

-- Entradas Frías (cat 7)
(20, 'Tabla de Quesos', 7, 25.00, 18, 2, true),
(21, 'Jamón Serrano con Melón', 7, 22.00, 18, 2, true),

-- Sushi y Rolls (cat 8)
(22, 'California Roll (8 piezas)', 8, 24.00, 18, 2, true),
(23, 'Salmón Roll (8 piezas)', 8, 28.00, 18, 2, true),
(24, 'Mix Sushi (12 piezas)', 8, 38.00, 18, 2, true),

-- BEBIDAS (Categorías 9-14, bloque_cocina=3)
-- Bebidas Calientes (cat 9)
(25, 'Café Americano', 9, 5.00, 18, 3, true),
(26, 'Café Latte', 9, 7.00, 18, 3, true),
(27, 'Cappuccino', 9, 7.00, 18, 3, true),
(28, 'Té Variado', 9, 4.50, 18, 3, true),

-- Refrescos (cat 10)
(29, 'Coca Cola', 10, 4.00, 18, 3, true),
(30, 'Inca Kola', 10, 4.00, 18, 3, true),
(31, 'Sprite', 10, 4.00, 18, 3, true),
(32, 'Agua Mineral', 10, 3.00, 18, 3, true),

-- Jugos Naturales (cat 11)
(33, 'Jugo de Naranja', 11, 8.00, 18, 3, true),
(34, 'Jugo de Fresa', 11, 8.00, 18, 3, true),
(35, 'Limonada Natural', 11, 6.00, 18, 3, true),

-- Cervezas (cat 12)
(36, 'Cerveza Pilsen', 12, 8.00, 18, 3, true),
(37, 'Cerveza Cusqueña', 12, 10.00, 18, 3, true),
(38, 'Cerveza Artesanal', 12, 12.00, 18, 3, true),

-- Vinos (cat 13)
(39, 'Vino Tinto Copa', 13, 15.00, 18, 3, true),
(40, 'Vino Blanco Copa', 13, 15.00, 18, 3, true),
(41, 'Vino Tinto Botella', 13, 55.00, 18, 3, true),
(42, 'Vino Blanco Botella', 13, 50.00, 18, 3, true),

-- Cócteles (cat 14)
(43, 'Pisco Sour', 14, 18.00, 18, 3, true),
(44, 'Mojito', 14, 16.00, 18, 3, true),
(45, 'Margarita', 14, 17.00, 18, 3, true),

-- POSTRES (Categorías 15-17, bloque_cocina=4)
-- Postres Clásicos (cat 15)
(46, 'Tiramisú', 15, 14.00, 18, 4, true),
(47, 'Cheesecake', 15, 13.00, 18, 4, true),
(48, 'Brownie con Helado', 15, 12.00, 18, 4, true),

-- Helados (cat 16)
(49, 'Copa de Helado (2 bolas)', 16, 8.00, 18, 4, true),
(50, 'Sundae Especial', 16, 11.00, 18, 4, true),

-- Pasteles (cat 17)
(51, 'Porción de Torta Chocolate', 17, 10.00, 18, 4, true),
(52, 'Porción de Torta Fresa', 17, 10.00, 18, 4, true)

ON CONFLICT (id_complementog) DO UPDATE SET
  complementog = EXCLUDED.complementog,
  id_tipo = EXCLUDED.id_tipo,
  pvp = EXCLUDED.pvp,
  iva = EXCLUDED.iva,
  bloque_cocina = EXCLUDED.bloque_cocina,
  activo = EXCLUDED.activo;

-- ============================================================
-- PRECIOS POR TARIFA (comg_tarifa)
-- ============================================================
-- Tarifa 1: General (precio base)
-- Tarifa 2: VIP (+10%)
-- Tarifa 3: Happy Hour (-15%)
-- Tarifa 4: Delivery (mismo que General)

INSERT INTO comg_tarifa (id_complementog, id_tarifa, pvptarifa)
SELECT
  id_complementog,
  1 as id_tarifa,
  pvp as pvptarifa
FROM complementog
WHERE activo = true

ON CONFLICT (id_complementog, id_tarifa) DO UPDATE SET
  pvptarifa = EXCLUDED.pvptarifa;

-- Tarifa VIP (+10%)
INSERT INTO comg_tarifa (id_complementog, id_tarifa, pvptarifa)
SELECT
  id_complementog,
  2 as id_tarifa,
  ROUND(pvp * 1.10, 2) as pvptarifa
FROM complementog
WHERE activo = true

ON CONFLICT (id_complementog, id_tarifa) DO UPDATE SET
  pvptarifa = EXCLUDED.pvptarifa;

-- Tarifa Happy Hour (-15%)
INSERT INTO comg_tarifa (id_complementog, id_tarifa, pvptarifa)
SELECT
  id_complementog,
  3 as id_tarifa,
  ROUND(pvp * 0.85, 2) as pvptarifa
FROM complementog
WHERE activo = true

ON CONFLICT (id_complementog, id_tarifa) DO UPDATE SET
  pvptarifa = EXCLUDED.pvptarifa;

-- Tarifa Delivery (igual a General)
INSERT INTO comg_tarifa (id_complementog, id_tarifa, pvptarifa)
SELECT
  id_complementog,
  4 as id_tarifa,
  pvp as pvptarifa
FROM complementog
WHERE activo = true

ON CONFLICT (id_complementog, id_tarifa) DO UPDATE SET
  pvptarifa = EXCLUDED.pvptarifa;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Productos por Estación
SELECT
  CASE c.bloque_cocina
    WHEN 1 THEN '🔥 PARRILLA'
    WHEN 2 THEN '❄️ FRÍOS'
    WHEN 3 THEN '🍹 BEBIDAS'
    WHEN 4 THEN '🍰 POSTRES'
  END as "Estación",
  t.descripcion as "Categoría",
  COUNT(*) as "Productos"
FROM complementog c
JOIN tipo_comg t ON c.id_tipo = t.id_tipo
WHERE c.activo = true
GROUP BY c.bloque_cocina, t.descripcion
ORDER BY c.bloque_cocina, t.descripcion;

-- Muestra de productos con precios por tarifa
SELECT
  c.id_complementog as "ID",
  c.complementog as "Producto",
  t.descripcion as "Categoría",
  c.pvp as "Precio Base",
  ct_vip.pvptarifa as "VIP",
  ct_happy.pvptarifa as "Happy Hour"
FROM complementog c
JOIN tipo_comg t ON c.id_tipo = t.id_tipo
LEFT JOIN comg_tarifa ct_vip ON c.id_complementog = ct_vip.id_complementog AND ct_vip.id_tarifa = 2
LEFT JOIN comg_tarifa ct_happy ON c.id_complementog = ct_happy.id_complementog AND ct_happy.id_tarifa = 3
WHERE c.activo = true
ORDER BY c.id_tipo, c.id_complementog
LIMIT 15;

-- Resumen General
SELECT
  COUNT(DISTINCT c.id_complementog) as "Total Productos",
  COUNT(DISTINCT c.id_tipo) as "Categorías",
  COUNT(*) as "Precios por Tarifa"
FROM complementog c
JOIN comg_tarifa ct ON c.id_complementog = ct.id_complementog
WHERE c.activo = true;

-- ============================================================
-- NOTAS:
-- ============================================================
-- Total: 52 productos
-- - 13 productos de Parrilla
-- - 11 productos Fríos
-- - 21 Bebidas
-- - 7 Postres
--
-- Cada producto tiene 4 precios (una por tarifa)
-- IVA configurado al 18% (Perú)
-- ============================================================
