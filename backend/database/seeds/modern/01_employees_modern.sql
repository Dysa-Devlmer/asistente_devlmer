-- =====================================================
-- SEED: Employees (Empleados)
-- =====================================================
-- Roles disponibles: waiter, cashier, cook, bartender, manager, admin
-- PINs: 1111 (admin), 2222 (manager), 3333 (empleados)

-- Admin
INSERT INTO employees (employee_code, first_name, last_name, role, pin_code, is_active, created_at, updated_at)
VALUES
('ADMIN01', 'Carlos', 'Administrador', 'admin', '1111', true, NOW(), NOW()),
('MGR01', 'Ana', 'Gerente', 'manager', '2222', true, NOW(), NOW());

-- Cajeros
INSERT INTO employees (employee_code, first_name, last_name, role, pin_code, is_active, created_at, updated_at)
VALUES
('CASH01', 'María', 'Cajera', 'cashier', '3001', true, NOW(), NOW()),
('CASH02', 'Pedro', 'Cajero', 'cashier', '3002', true, NOW(), NOW());

-- Meseros
INSERT INTO employees (employee_code, first_name, last_name, role, pin_code, is_active, created_at, updated_at)
VALUES
('WAIT01', 'Juan', 'Mesero', 'waiter', '3101', true, NOW(), NOW()),
('WAIT02', 'Laura', 'Mesera', 'waiter', '3102', true, NOW(), NOW()),
('WAIT03', 'Diego', 'Mesero', 'waiter', '3103', true, NOW(), NOW()),
('WAIT04', 'Sofia', 'Mesera', 'waiter', '3104', true, NOW(), NOW());

-- Cocineros
INSERT INTO employees (employee_code, first_name, last_name, role, pin_code, is_active, created_at, updated_at)
VALUES
('COOK01', 'Roberto', 'Cocinero', 'cook', '3201', true, NOW(), NOW()),
('COOK02', 'Carmen', 'Cocinera', 'cook', '3202', true, NOW(), NOW()),
('COOK03', 'Miguel', 'Chef', 'cook', '3203', true, NOW(), NOW());

-- Bartenders
INSERT INTO employees (employee_code, first_name, last_name, role, pin_code, is_active, created_at, updated_at)
VALUES
('BART01', 'Luis', 'Bartender', 'bartender', '3301', true, NOW(), NOW()),
('BART02', 'Patricia', 'Barista', 'bartender', '3302', true, NOW(), NOW());

-- Empleado inactivo (para testing)
INSERT INTO employees (employee_code, first_name, last_name, role, pin_code, is_active, created_at, updated_at)
VALUES
('WAIT99', 'Jorge', 'Inactivo', 'waiter', '9999', false, NOW(), NOW());

-- =====================================================
-- Total: 14 empleados
-- Admin: 1 | Manager: 1 | Cashier: 2 | Waiter: 4
-- Cook: 3 | Bartender: 2 | Inactive: 1
-- =====================================================
