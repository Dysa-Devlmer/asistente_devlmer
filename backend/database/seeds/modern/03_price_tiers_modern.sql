-- =====================================================
-- SEED: Price Tiers (Tarifas)
-- =====================================================
-- Diferentes niveles de precios para productos

INSERT INTO price_tiers (code, name, description, is_default, created_at, updated_at)
VALUES
('REGULAR', 'Tarifa Regular', 'Precio estándar para clientes normales', true, NOW(), NOW()),
('WHOLESALE', 'Tarifa Mayorista', 'Precio especial para compras al por mayor', false, NOW(), NOW()),
('EMPLOYEE', 'Tarifa Empleados', 'Descuento para empleados del restaurante', false, NOW(), NOW()),
('VIP', 'Tarifa VIP', 'Precio premium con servicio adicional', false, NOW(), NOW());

-- =====================================================
-- Total: 4 tarifas
-- Regular (id: 1) - Precio base
-- Mayorista (id: 2) - 10-15% menos
-- Empleados (id: 3) - 20% menos
-- VIP (id: 4) - 5-10% más (incluye extras)
-- =====================================================
