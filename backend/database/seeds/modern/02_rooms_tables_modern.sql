-- =====================================================
-- SEED: Rooms and Tables (Salones y Mesas)
-- =====================================================
-- TableStatus: available, occupied, reserved

-- Salones
INSERT INTO rooms (code, name, description, created_at, updated_at)
VALUES
('MAIN', 'Salón Principal', 'Área principal del restaurante', NOW(), NOW()),
('TERR', 'Terraza', 'Área exterior con vista', NOW(), NOW()),
('VIP', 'Salón VIP', 'Área privada para eventos', NOW(), NOW()),
('BAR', 'Bar', 'Área de bar y bebidas', NOW(), NOW());

-- Mesas para Salón Principal (id: 1)
INSERT INTO tables (table_number, capacity, room_id, status, created_at, updated_at)
VALUES
('M01', 4, 1, 'available', NOW(), NOW()),
('M02', 4, 1, 'available', NOW(), NOW()),
('M03', 2, 1, 'available', NOW(), NOW()),
('M04', 2, 1, 'available', NOW(), NOW()),
('M05', 6, 1, 'available', NOW(), NOW()),
('M06', 6, 1, 'available', NOW(), NOW()),
('M07', 8, 1, 'available', NOW(), NOW()),
('M08', 4, 1, 'available', NOW(), NOW());

-- Mesas para Terraza (id: 2)
INSERT INTO tables (table_number, capacity, room_id, status, created_at, updated_at)
VALUES
('T01', 4, 2, 'available', NOW(), NOW()),
('T02', 4, 2, 'available', NOW(), NOW()),
('T03', 2, 2, 'available', NOW(), NOW()),
('T04', 2, 2, 'available', NOW(), NOW()),
('T05', 6, 2, 'available', NOW(), NOW());

-- Mesas para Salón VIP (id: 3)
INSERT INTO tables (table_number, capacity, room_id, status, created_at, updated_at)
VALUES
('V01', 8, 3, 'available', NOW(), NOW()),
('V02', 10, 3, 'available', NOW(), NOW()),
('V03', 12, 3, 'available', NOW(), NOW());

-- Mesas para Bar (id: 4)
INSERT INTO tables (table_number, capacity, room_id, status, created_at, updated_at)
VALUES
('B01', 2, 4, 'available', NOW(), NOW()),
('B02', 2, 4, 'available', NOW(), NOW()),
('B03', 4, 4, 'available', NOW(), NOW()),
('B04', 4, 4, 'available', NOW(), NOW());

-- =====================================================
-- Total: 4 salones, 20 mesas
-- Salón Principal: 8 mesas (2-8 personas)
-- Terraza: 5 mesas (2-6 personas)
-- Salón VIP: 3 mesas (8-12 personas)
-- Bar: 4 mesas (2-4 personas)
-- =====================================================
