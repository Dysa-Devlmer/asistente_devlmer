# MIGRATION STRATEGY - Estrategia de Migración de Datos

**Fecha:** 2025-12-15
**Fase:** Diseño del Nuevo Sistema
**Objetivo:** Definir estrategia de migración SIN escribir código

---

## 🎯 PRINCIPIOS ESTRATÉGICOS

1. **Migración única (Big Bang controlado)**
   - No dual-write
   - Ventana de mantenimiento planificada
   - Rollback preparado

2. **Priorizar integridad sobre completitud**
   - Mejor menos datos limpios que muchos sucios
   - Validar antes de insertar
   - Rechazar datos inconsistentes

3. **Mantener trazabilidad**
   - Guardar `legacy_id` en todas las tablas
   - Logs detallados de transformaciones
   - Mapeo reversible

4. **Testing exhaustivo**
   - Migración en ambiente de desarrollo primero
   - Validación de datos post-migración
   - Comparación legacy vs nuevo

---

## 📋 SCOPE DE MIGRACIÓN

### ✅ QUÉ SE MIGRA

#### Datos Maestros (100% del histórico)
- ✅ **Productos** - Catálogo completo activo e inactivo
- ✅ **Categorías** - Todas las categorías
- ✅ **Tarifas de precio** - DEFAULT, VIP, etc
- ✅ **Precios por producto** - Histórico de precios
- ✅ **Mesas** - Layout del restaurante
- ✅ **Salones** - Áreas del restaurante
- ✅ **Empleados** - Activos e inactivos
- ✅ **Métodos de pago** - Todos los métodos
- ✅ **Cajas registradoras** - Configuración de cajas

#### Datos Transaccionales (Histórico limitado)
- ✅ **Órdenes cerradas** - Últimos 12 meses
- ✅ **Items de órdenes** - Asociados a órdenes migradas
- ✅ **Pagos** - Últimos 12 meses
- ✅ **Turnos de caja (cerrados)** - Últimos 6 meses
- ✅ **Facturas/Boletas** - Últimos 12 meses (obligación SUNAT)

#### Clientes (Selectivo)
- ✅ **Clientes con facturas** - Últimos 12 meses
- ✅ **Clientes con saldo pendiente** - Todos

---

### ❌ QUÉ NO SE MIGRA

#### Datos Excluidos del Scope
- ❌ **Órdenes abiertas (legacy)** - Cerrar antes de migración
- ❌ **Pre-tickets / Pre-facturas** - Datos temporales
- ❌ **Cola de cocina histórica** - Ya procesada
- ❌ **Histórico > 12 meses** - Mantener en legacy READ-ONLY
- ❌ **Módulos fuera de scope:**
  - Hotel (habitaciones, reservas)
  - E-commerce (OpenCart)
  - SMS
  - Fabricación
  - Proveedores/Compras (fase posterior)
  - Inventario avanzado (fase posterior)

#### Datos Temporales / Obsoletos
- ❌ Tablas `*2` (ventadirecta2, tiquet2, etc) - Backups internos legacy
- ❌ Promociones expiradas
- ❌ Empleados con +2 años inactivos
- ❌ Productos nunca vendidos (stock 0, sin ventas)
- ❌ Configuraciones internas del TPV legacy

---

## 🗓️ POLÍTICA DE HISTÓRICOS

### Ventana de Migración: 12 Meses

**Fecha de corte:** 2024-12-15 (1 año antes de migración)

**Justificación:**
- Reportes fiscales (SUNAT): 12 meses obligatorios
- Análisis de negocio: 1 año suficiente para tendencias
- Performance: Reducir volumen inicial del nuevo sistema
- Legacy READ-ONLY: Disponible para consultas antiguas

### Datos por Rango de Fechas

| Tipo de Dato | Rango | Criterio |
|--------------|-------|----------|
| Órdenes | 12 meses | `fecha_venta >= '2024-12-15'` |
| Pagos | 12 meses | `fecha >= '2024-12-15'` |
| Turnos caja | 6 meses | `opened_at >= '2025-06-15'` |
| Facturas | 12 meses | `fecha_tiquet >= '2024-12-15'` |
| Productos | TODO | Histórico completo |
| Empleados | Activos + 2 años | `terminated_at IS NULL OR >= '2023-12-15'` |
| Clientes | Con facturas recientes | `last_invoice >= '2024-12-15'` |

---

## 🔄 ORDEN DE MIGRACIÓN

### Fase 1: Datos Maestros (Sin dependencias)

**Orden estricto:**

1. **`rooms`** (salones) - Sin dependencias
2. **`categories`** (categorías) - Sin dependencias
3. **`price_tiers`** (tarifas) - Sin dependencias
4. **`payment_methods`** (métodos pago) - Sin dependencias
5. **`cash_registers`** (cajas) - Sin dependencias
6. **`kitchen_stations`** (estaciones cocina) - Sin dependencias
7. **`employees`** (empleados) - Sin dependencias
8. **`customers`** (clientes) - Sin dependencias

**Resultado:** Tablas base pobladas

---

### Fase 2: Datos Maestros con Relaciones

**Orden estricto:**

9. **`products`** - Depende de: categories
10. **`product_prices`** - Depende de: products, price_tiers
11. **`tables`** - Depende de: rooms

**Resultado:** Catálogo completo funcional

---

### Fase 3: Datos Transaccionales (Históricos)

**Orden estricto:**

12. **`cash_register_shifts`** - Depende de: cash_registers, employees
13. **`orders`** - Depende de: tables, employees, cash_register_shifts
14. **`order_items`** - Depende de: orders, products
15. **`payments`** - Depende de: orders, payment_methods, cash_register_shifts, employees
16. **`invoices`** - Depende de: orders, customers

**Resultado:** Histórico transaccional migrado

---

### Fase 4: Validación y Cuadre

17. **Validar totales:**
    - Suma de `order_items.total_amount` = `orders.total_amount`
    - Suma de `payments.amount` por orden = `orders.total_amount`
    - Count de órdenes legacy = count de órdenes nuevas

18. **Validar relaciones:**
    - Todas las FK resueltas
    - No hay NULL en campos NOT NULL
    - Enums en rango válido

19. **Reportes de comparación:**
    - Ventas totales legacy vs nuevo (por mes)
    - Productos más vendidos (top 20)
    - Métodos de pago más usados

---

## 🆔 MANEJO DE IDs LEGACY

### Estrategia: Generar IDs Nuevos + Guardar Referencia

**Razones:**
- IDs legacy no son secuenciales ni optimizados
- Permite limpiar gaps y duplicados
- Facilita futuras integraciones
- Mantiene autonomía del nuevo sistema

### Campos de Trazabilidad

Todas las tablas incluyen:

```sql
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- Nuevo ID
legacy_id BIGINT COMMENT 'ID original del sistema legacy',
legacy_sku VARCHAR(50) COMMENT 'SKU original (productos)',
```

### Mapeo de IDs (en memoria durante migración)

```javascript
// Pseudo-código (NO implementar ahora)
const idMap = {
  orders: new Map(),        // legacy_id → nuevo_id
  products: new Map(),
  employees: new Map(),
  // ...
};

// Al insertar orden:
const newOrderId = await db.insert('orders', orderData);
idMap.orders.set(legacyOrder.id_venta, newOrderId);

// Al insertar order_items:
const newOrderId = idMap.orders.get(legacyItem.id_venta);
```

---

## 🔍 MANEJO DE STOCKS NEGATIVOS

### Problema Detectado (del dump)

Productos con stock negativo en `almacen_complementg`:

```sql
('01','001','01','0051','00470',-19433,...)  -- Pisco Sour Catedral: -19,433
('01','001','01','0051','00471',-17978,...)  -- Pisco Sour Peruano: -17,978
('01','001','01','0068','00353',-36950,...)  -- Lomo Saltado: -36,950
```

**Interpretación:**
- Valor negativo = cantidad vendida SIN control de inventario
- NO es stock disponible
- Es contador de ventas históricas

### Estrategia de Migración

**Para productos SIN control de inventario:**

```sql
-- En `products`:
tracks_inventory = FALSE
current_stock = 0.000  -- Resetear a 0, NO migrar valor negativo
```

**Para productos CON control de inventario:**

```sql
-- Solo si stock positivo:
IF legacy_stock > 0 THEN
    tracks_inventory = TRUE
    current_stock = legacy_stock
ELSE
    tracks_inventory = FALSE
    current_stock = 0.000
END IF
```

**Justificación:**
- El nuevo sistema parte de inventario limpio
- Stocks negativos son dato histórico, no operativo
- Se puede habilitar inventario después, tomando conteo físico

---

## 🔐 VALIDACIONES PRE-MIGRACIÓN

### Validar Datos Legacy ANTES de Migrar

#### 1. Integridad Referencial

```sql
-- Validar que todas las órdenes tengan mesa válida
SELECT COUNT(*) FROM ventadirecta v
LEFT JOIN mesa m ON v.Num_Mesa = m.num_mesa
WHERE m.num_mesa IS NULL;
-- Resultado esperado: 0

-- Validar que todas las líneas tengan producto válido
SELECT COUNT(*) FROM ventadir_comg vc
LEFT JOIN complementog c ON vc.id_complementog = c.id_complementog
WHERE c.id_complementog IS NULL;
-- Resultado esperado: 0
```

#### 2. Datos Nulos Críticos

```sql
-- Validar órdenes sin total
SELECT COUNT(*) FROM ventadirecta WHERE tv IS NULL OR tv = 0;

-- Validar productos sin precio
SELECT COUNT(*) FROM complementog WHERE precio IS NULL OR precio <= 0;
```

#### 3. Duplicados

```sql
-- Detectar mesas duplicadas
SELECT num_mesa, COUNT(*) FROM mesa GROUP BY num_mesa HAVING COUNT(*) > 1;

-- Detectar productos duplicados por SKU
SELECT id_complementog, COUNT(*) FROM complementog
GROUP BY id_complementog HAVING COUNT(*) > 1;
```

#### 4. Rangos de Fechas

```sql
-- Validar fechas inválidas
SELECT COUNT(*) FROM ventadirecta WHERE fecha_venta = '0000-00-00';

-- Validar fechas futuras (sospechoso)
SELECT COUNT(*) FROM ventadirecta WHERE fecha_venta > CURDATE();
```

---

## 📊 VALIDACIONES POST-MIGRACIÓN

### Cuadre de Totales

```sql
-- Comparar total de ventas por mes (legacy vs nuevo)
-- LEGACY:
SELECT
    DATE_FORMAT(fecha_venta, '%Y-%m') AS mes,
    SUM(tv) AS total_legacy
FROM ventadirecta
WHERE cerrada = 'S' AND fecha_venta >= '2024-12-15'
GROUP BY mes;

-- NUEVO:
SELECT
    DATE_FORMAT(opened_at, '%Y-%m') AS mes,
    SUM(total_amount) AS total_nuevo
FROM orders
WHERE status = 'closed'
GROUP BY mes;

-- Diferencia esperada: < 1% (por redondeos)
```

### Conteo de Registros

| Tabla Legacy | Tabla Nueva | Query Validación |
|--------------|-------------|------------------|
| ventadirecta (cerrada='S', 12m) | orders | `SELECT COUNT(*) FROM ...` |
| ventadir_comg (12m) | order_items | JOIN con órdenes migradas |
| complementog (activo='S') | products (is_active=TRUE) | Count activos |
| camareros (activo='S') | employees (is_active=TRUE) | Count activos |
| pagoscobros (tipo='E', 12m) | payments | Solo entradas |

### Validar Relaciones

```sql
-- Verificar que NO hay FKs rotas
SELECT COUNT(*) FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;
-- Esperado: 0

SELECT COUNT(*) FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
WHERE p.id IS NULL;
-- Esperado: 0
```

### Validar Top Productos

```sql
-- LEGACY: Top 10 productos más vendidos
SELECT
    c.complementog,
    SUM(vc.cantidad) AS total_vendido
FROM ventadir_comg vc
JOIN complementog c ON vc.id_complementog = c.id_complementog
JOIN ventadirecta v ON vc.id_venta = v.id_venta
WHERE v.cerrada = 'S' AND v.fecha_venta >= '2024-12-15'
GROUP BY c.id_complementog
ORDER BY total_vendido DESC
LIMIT 10;

-- NUEVO: Top 10
SELECT
    p.name,
    SUM(oi.quantity) AS total_vendido
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'closed'
GROUP BY p.id
ORDER BY total_vendido DESC
LIMIT 10;

-- Comparar: Los productos deben coincidir (puede variar orden por redondeos)
```

---

## 🚨 MANEJO DE ERRORES Y CONFLICTOS

### Estrategia de Errores

#### Errores Bloqueantes (Detener migración)
- FK no resuelta (producto/mesa/empleado no existe)
- Fecha inválida (0000-00-00)
- Total de orden != suma de items
- Duplicado de PK/UK

**Acción:** Loggear, corregir datos legacy, reintentar

#### Errores No Bloqueantes (Log + Skip)
- Caracteres no UTF-8 (reemplazar por �)
- Campos opcionales nulos
- Descuentos/notas vacías

**Acción:** Loggear warning, continuar migración

#### Registros Huérfanos
- Items sin orden válida → SKIP + LOG
- Pagos sin orden válida → SKIP + LOG
- Facturas sin orden válida → SKIP + LOG

**Acción:** Generar reporte de huérfanos para revisión manual

---

## 🔄 PLAN DE ROLLBACK

### Escenarios de Rollback

**Momento 1: Durante Migración**
- Detener proceso
- DROP nuevo schema
- Reactivar legacy
- Tiempo: < 5 minutos

**Momento 2: Post-Migración (primeras horas)**
- Restaurar dump de nuevo sistema (vacío)
- Reactivar legacy en modo escritura
- Tiempo: < 10 minutos

**Momento 3: Días después (crítico)**
- Restaurar backup legacy
- Perder transacciones nuevas
- Tiempo: 30-60 minutos
- **EVITAR ESTE ESCENARIO**

### Preparación de Rollback

1. **Backup completo legacy** antes de migración
2. **Backup nuevo sistema vacío** antes de migración
3. **Procedimiento documentado** de reactivación
4. **Ventana de prueba** (2-4 horas) sin transacciones reales

---

## ⏱️ VENTANA DE MANTENIMIENTO

### Timeline Sugerido

**Día D-7:**
- Migración en ambiente de desarrollo
- Validaciones completas
- Ajustes de scripts

**Día D-1:**
- Comunicación a staff
- Preparar backups
- Verificar accesos

**Día D (Migración):**

| Hora | Actividad | Duración | Responsable |
|------|-----------|----------|-------------|
| 02:00 | Cerrar todas las órdenes abiertas en legacy | 30 min | Gerente |
| 02:30 | Backup legacy completo | 30 min | TI |
| 03:00 | Generar dump final legacy | 20 min | TI |
| 03:20 | Ejecutar migración | 60-90 min | TI |
| 04:50 | Validaciones post-migración | 30 min | TI |
| 05:20 | Testing de operaciones básicas | 30 min | Gerente + TI |
| 05:50 | Decisión GO/NO-GO | 10 min | Gerente |
| 06:00 | Apertura nueva caja | - | Cajero |
| 06:30 | Primera venta en sistema nuevo | - | Staff |

**Total ventana:** ~4 horas (02:00 - 06:00)

**Plan B:** Si falla validación a las 05:20 → Rollback a legacy

---

## 📋 CHECKLIST PRE-MIGRACIÓN

### Preparación Técnica

- [ ] Dump legacy generado (`sysmehotel_full.sql`)
- [ ] Backup legacy verificado
- [ ] Nuevo schema creado y testeado
- [ ] Scripts de migración desarrollados
- [ ] Scripts de validación listos
- [ ] Ambiente de desarrollo migrado exitosamente
- [ ] Logs configurados
- [ ] Plan de rollback documentado

### Preparación Operativa

- [ ] Staff notificado (fecha y hora)
- [ ] Cliente final informado (si aplica)
- [ ] Procedimientos de contingencia impresos
- [ ] Contactos de soporte disponibles
- [ ] Turnos de guardia asignados

### Validación Legacy

- [ ] Todas las órdenes cerradas
- [ ] No hay pre-tickets pendientes
- [ ] No hay facturas abiertas
- [ ] Cajas cerradas correctamente
- [ ] Inventario cuadrado (si aplica)

---

## 📈 MÉTRICAS DE ÉXITO

### Criterios de Aceptación

✅ **Migración exitosa si:**

1. **Integridad:** 100% de FKs resueltas
2. **Completitud:** >95% de registros migrados (scope definido)
3. **Exactitud:** Diferencia de totales < 1%
4. **Performance:** Queries de órdenes < 500ms
5. **Operación:** Primera venta exitosa en nuevo sistema

❌ **Migración fallida si:**

1. FKs rotas > 0
2. Registros migrados < 90%
3. Diferencia de totales > 5%
4. Sistema nuevo no permite crear orden
5. No se puede cobrar una orden

---

## 🎯 RESUMEN EJECUTIVO

### Qué se Migra
- ✅ Datos maestros: 100%
- ✅ Transacciones: 12 meses
- ✅ Clientes: Selectivo (con actividad)

### Qué NO se Migra
- ❌ Histórico > 12 meses
- ❌ Módulos fuera de scope (Hotel, E-commerce, etc)
- ❌ Datos temporales (pre-tickets, colas)

### Orden de Migración
1. Maestros sin dependencias (8 tablas)
2. Maestros con relaciones (3 tablas)
3. Transacciones (4 tablas)
4. Validaciones y cuadre

### Ventana de Mantenimiento
- **Duración:** 4 horas (02:00 - 06:00)
- **Rollback:** < 10 minutos si falla
- **Go-live:** Primera venta 06:30

### Métricas de Éxito
- Integridad: 100%
- Completitud: >95%
- Exactitud: <1% diferencia
- Operación: Primera venta exitosa

---

## 📌 SIGUIENTE PASO

Con la estrategia definida, próximas fases:

1. **Fase 3:** Implementación del Backend (TypeScript + Prisma)
2. **Fase 4:** Desarrollo de scripts ETL
3. **Fase 5:** Testing de migración (dev)
4. **Fase 6:** Migración a producción

---

**FIN DE LA ESTRATEGIA DE MIGRACIÓN**

Estado: ✅ ESTRATEGIA DEFINIDA
Enfoque: Big Bang controlado con validación exhaustiva
Riesgo: BAJO (con preparación adecuada)
