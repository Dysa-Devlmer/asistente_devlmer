-- =====================================================
-- SEED: Categories (Categorías de Productos)
-- =====================================================

INSERT INTO categories (code, name, description, created_at, updated_at)
VALUES
('APTZ', 'Entradas', 'Aperitivos y entradas', NOW(), NOW()),
('SALD', 'Ensaladas', 'Ensaladas frescas', NOW(), NOW()),
('SOUP', 'Sopas', 'Sopas y caldos', NOW(), NOW()),
('MAIN', 'Platos Principales', 'Platos fuertes', NOW(), NOW()),
('MEAT', 'Carnes', 'Carnes rojas y blancas', NOW(), NOW()),
('FISH', 'Pescados y Mariscos', 'Productos del mar', NOW(), NOW()),
('PSTA', 'Pastas', 'Pastas y lasañas', NOW(), NOW()),
('PIZZ', 'Pizzas', 'Pizzas artesanales', NOW(), NOW()),
('BURG', 'Hamburguesas', 'Hamburguesas gourmet', NOW(), NOW()),
('DSRT', 'Postres', 'Postres y dulces', NOW(), NOW()),
('BCOL', 'Bebidas Frías', 'Refrescos, jugos, batidos', NOW(), NOW()),
('BHOT', 'Bebidas Calientes', 'Café, té, chocolate', NOW(), NOW()),
('BEER', 'Cervezas', 'Cervezas nacionales e importadas', NOW(), NOW()),
('WINE', 'Vinos', 'Vinos tintos, blancos y rosados', NOW(), NOW()),
('CKTL', 'Cócteles', 'Cócteles y bebidas preparadas', NOW(), NOW()),
('LIQR', 'Licores', 'Licores y destilados', NOW(), NOW());

-- =====================================================
-- Total: 16 categorías
-- Comidas: 9 categorías
-- Bebidas: 7 categorías
-- =====================================================
