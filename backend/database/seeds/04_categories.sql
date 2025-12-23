-- ============================================================
-- SEED: Categorías de Productos
-- Sistema: POS Restaurant - SYSME_MISTURA Compatible
-- ============================================================

-- Limpiar datos existentes (solo para testing)
TRUNCATE TABLE tipo_comg CASCADE;

-- ============================================================
-- CATEGORÍAS DE PRODUCTOS (tipo_comg)
-- ============================================================
-- bloque_cocina: 1=Parrilla, 2=Fríos, 3=Bebidas, 4=Postres

INSERT INTO tipo_comg (id_tipo, descripcion, bloque_cocina, activo, orden) VALUES
-- PARRILLA (bloque_cocina = 1)
(1, 'Carnes a la Parrilla', 1, true, 1),
(2, 'Pollo y Aves', 1, true, 2),
(3, 'Pescados y Mariscos', 1, true, 3),
(4, 'Hamburguesas', 1, true, 4),

-- FRÍOS (bloque_cocina = 2)
(5, 'Ensaladas', 2, true, 5),
(6, 'Ceviches', 2, true, 6),
(7, 'Entradas Frías', 2, true, 7),
(8, 'Sushi y Rolls', 2, true, 8),

-- BEBIDAS (bloque_cocina = 3)
(9, 'Bebidas Calientes', 3, true, 9),
(10, 'Refrescos', 3, true, 10),
(11, 'Jugos Naturales', 3, true, 11),
(12, 'Cervezas', 3, true, 12),
(13, 'Vinos', 3, true, 13),
(14, 'Cócteles', 3, true, 14),

-- POSTRES (bloque_cocina = 4)
(15, 'Postres Clásicos', 4, true, 15),
(16, 'Helados', 4, true, 16),
(17, 'Pasteles', 4, true, 17)

ON CONFLICT (id_tipo) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  bloque_cocina = EXCLUDED.bloque_cocina,
  activo = EXCLUDED.activo,
  orden = EXCLUDED.orden;

-- Verificación por Estación de Cocina
SELECT
  CASE bloque_cocina
    WHEN 1 THEN '🔥 PARRILLA'
    WHEN 2 THEN '❄️ FRÍOS'
    WHEN 3 THEN '🍹 BEBIDAS'
    WHEN 4 THEN '🍰 POSTRES'
    ELSE 'Sin asignar'
  END as "Estación",
  id_tipo as "ID",
  descripcion as "Categoría",
  CASE WHEN activo THEN 'Activa' ELSE 'Inactiva' END as "Estado"
FROM tipo_comg
WHERE activo = true
ORDER BY bloque_cocina, orden;

-- Resumen por Estación
SELECT
  CASE bloque_cocina
    WHEN 1 THEN 'Parrilla'
    WHEN 2 THEN 'Fríos'
    WHEN 3 THEN 'Bebidas'
    WHEN 4 THEN 'Postres'
    ELSE 'Sin asignar'
  END as "Estación de Cocina",
  COUNT(*) as "Categorías"
FROM tipo_comg
WHERE activo = true
GROUP BY bloque_cocina
ORDER BY bloque_cocina;

-- Total
SELECT COUNT(*) as "Total Categorías Activas" FROM tipo_comg WHERE activo = true;

-- ============================================================
-- NOTAS:
-- ============================================================
-- bloque_cocina determina qué estación de cocina prepara el producto:
--   1 = Parrilla (carnes, pescados a la plancha, hamburguesas)
--   2 = Fríos (ensaladas, ceviches, sushi)
--   3 = Bebidas (barra - jugos, cócteles, cervezas, vinos)
--   4 = Postres (repostería, helados)
--
-- El campo 'orden' determina el orden de visualización en el POS
-- ============================================================
