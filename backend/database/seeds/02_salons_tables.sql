-- ============================================================
-- SEED: Salones y Mesas del Restaurante
-- Sistema: POS Restaurant - SYSME_MISTURA Compatible
-- ============================================================

-- Limpiar datos existentes (solo para testing)
TRUNCATE TABLE mesa CASCADE;
TRUNCATE TABLE salon CASCADE;

-- ============================================================
-- SALONES / ÁREAS DEL RESTAURANTE
-- ============================================================

INSERT INTO salon (id_salon, descripcion) VALUES
('SALON1', 'Salón Principal'),
('TERRAZA', 'Terraza Exterior'),
('VIP', 'Área VIP'),
('BAR', 'Zona de Barra')
ON CONFLICT (id_salon) DO UPDATE SET
  descripcion = EXCLUDED.descripcion;

-- ============================================================
-- MESAS - SALÓN PRINCIPAL (Mesas 01-12)
-- ============================================================

INSERT INTO mesa ("Num_Mesa", descripcion, id_salon, id_tarifa, top, izq, width, height, estado) VALUES
-- Fila 1
('01', 'Mesa 1 - 4 personas', 'SALON1', 1, 50, 50, 120, 120, 'libre'),
('02', 'Mesa 2 - 4 personas', 'SALON1', 1, 50, 200, 120, 120, 'libre'),
('03', 'Mesa 3 - 4 personas', 'SALON1', 1, 50, 350, 120, 120, 'libre'),
('04', 'Mesa 4 - 2 personas', 'SALON1', 1, 50, 500, 100, 100, 'libre'),

-- Fila 2
('05', 'Mesa 5 - 4 personas', 'SALON1', 1, 200, 50, 120, 120, 'libre'),
('06', 'Mesa 6 - 4 personas', 'SALON1', 1, 200, 200, 120, 120, 'libre'),
('07', 'Mesa 7 - 6 personas', 'SALON1', 1, 200, 350, 150, 150, 'libre'),
('08', 'Mesa 8 - 2 personas', 'SALON1', 1, 200, 530, 100, 100, 'libre'),

-- Fila 3
('09', 'Mesa 9 - 4 personas', 'SALON1', 1, 380, 50, 120, 120, 'libre'),
('10', 'Mesa 10 - 4 personas', 'SALON1', 1, 380, 200, 120, 120, 'libre'),
('11', 'Mesa 11 - 8 personas', 'SALON1', 1, 380, 350, 180, 180, 'libre'),
('12', 'Mesa 12 - 2 personas', 'SALON1', 1, 380, 560, 100, 100, 'libre')

ON CONFLICT ("Num_Mesa") DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  id_salon = EXCLUDED.id_salon,
  id_tarifa = EXCLUDED.id_tarifa,
  top = EXCLUDED.top,
  izq = EXCLUDED.izq,
  width = EXCLUDED.width,
  height = EXCLUDED.height,
  estado = EXCLUDED.estado;

-- ============================================================
-- MESAS - TERRAZA (Mesas 13-20)
-- ============================================================

INSERT INTO mesa ("Num_Mesa", descripcion, id_salon, id_tarifa, top, izq, width, height, estado) VALUES
('13', 'Terraza 1 - 4 personas', 'TERRAZA', 1, 50, 50, 120, 120, 'libre'),
('14', 'Terraza 2 - 4 personas', 'TERRAZA', 1, 50, 200, 120, 120, 'libre'),
('15', 'Terraza 3 - 6 personas', 'TERRAZA', 1, 50, 350, 150, 150, 'libre'),
('16', 'Terraza 4 - 2 personas', 'TERRAZA', 1, 50, 530, 100, 100, 'libre'),
('17', 'Terraza 5 - 4 personas', 'TERRAZA', 1, 200, 50, 120, 120, 'libre'),
('18', 'Terraza 6 - 4 personas', 'TERRAZA', 1, 200, 200, 120, 120, 'libre'),
('19', 'Terraza 7 - 2 personas', 'TERRAZA', 1, 200, 350, 100, 100, 'libre'),
('20', 'Terraza 8 - 2 personas', 'TERRAZA', 1, 200, 480, 100, 100, 'libre')

ON CONFLICT ("Num_Mesa") DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  id_salon = EXCLUDED.id_salon,
  id_tarifa = EXCLUDED.id_tarifa,
  top = EXCLUDED.top,
  izq = EXCLUDED.izq,
  width = EXCLUDED.width,
  height = EXCLUDED.height,
  estado = EXCLUDED.estado;

-- ============================================================
-- MESAS - ÁREA VIP (Mesas 21-24)
-- ============================================================

INSERT INTO mesa ("Num_Mesa", descripcion, id_salon, id_tarifa, top, izq, width, height, estado) VALUES
('21', 'VIP 1 - 6 personas', 'VIP', 2, 50, 50, 180, 180, 'libre'),
('22', 'VIP 2 - 8 personas', 'VIP', 2, 50, 260, 200, 200, 'libre'),
('23', 'VIP 3 - 4 personas', 'VIP', 2, 280, 50, 150, 150, 'libre'),
('24', 'VIP 4 - 4 personas', 'VIP', 2, 280, 230, 150, 150, 'libre')

ON CONFLICT ("Num_Mesa") DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  id_salon = EXCLUDED.id_salon,
  id_tarifa = EXCLUDED.id_tarifa,
  top = EXCLUDED.top,
  izq = EXCLUDED.izq,
  width = EXCLUDED.width,
  height = EXCLUDED.height,
  estado = EXCLUDED.estado;

-- ============================================================
-- MESAS - BARRA (Mesas B1-B6)
-- ============================================================

INSERT INTO mesa ("Num_Mesa", descripcion, id_salon, id_tarifa, top, izq, width, height, estado) VALUES
('B1', 'Barra 1', 'BAR', 1, 50, 50, 80, 80, 'libre'),
('B2', 'Barra 2', 'BAR', 1, 50, 150, 80, 80, 'libre'),
('B3', 'Barra 3', 'BAR', 1, 50, 250, 80, 80, 'libre'),
('B4', 'Barra 4', 'BAR', 1, 50, 350, 80, 80, 'libre'),
('B5', 'Barra 5', 'BAR', 1, 50, 450, 80, 80, 'libre'),
('B6', 'Barra 6', 'BAR', 1, 50, 550, 80, 80, 'libre')

ON CONFLICT ("Num_Mesa") DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  id_salon = EXCLUDED.id_salon,
  id_tarifa = EXCLUDED.id_tarifa,
  top = EXCLUDED.top,
  izq = EXCLUDED.izq,
  width = EXCLUDED.width,
  height = EXCLUDED.height,
  estado = EXCLUDED.estado;

-- Verificación
SELECT
  id_salon as "Salón",
  COUNT(*) as "Total Mesas"
FROM mesa
GROUP BY id_salon
ORDER BY id_salon;

SELECT
  "Num_Mesa" as "Mesa",
  descripcion as "Descripción",
  id_salon as "Salón",
  estado as "Estado"
FROM mesa
ORDER BY "Num_Mesa";

-- Resumen
SELECT
  COUNT(*) as "Total Mesas",
  COUNT(*) FILTER (WHERE estado = 'libre') as "Libres",
  COUNT(*) FILTER (WHERE estado = 'ocupada') as "Ocupadas",
  COUNT(*) FILTER (WHERE estado = 'reservada') as "Reservadas"
FROM mesa;

-- ============================================================
-- NOTAS:
-- ============================================================
-- Total: 30 mesas
-- - Salón Principal: 12 mesas (01-12)
-- - Terraza: 8 mesas (13-20)
-- - VIP: 4 mesas (21-24) - Tarifa especial
-- - Barra: 6 posiciones (B1-B6)
-- ============================================================
