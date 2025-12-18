# ETL DESIGN - PARTE 2: FASES 2, 3 Y 4

**Continuación de:** ETL-DESIGN.md
**Fecha:** 2025-12-15

---

## FASE 2: DATOS MAESTROS CON RELACIONES

### 9. PRODUCTS (productos)

#### Fuente Legacy
```sql
-- Tabla: complementog
SELECT * FROM complementog
WHERE id_empresa = '001' AND id_centro = '01';
```

#### Query de Lectura
```sql
SELECT
    id_complementog,
    complementog AS nombre,
    descripcion,
    id_tipo_comg,  -- FK a category
    precio,
    activo,
    stock,         -- Si existe
    costo          -- Si existe
FROM complementog
WHERE id_empresa = '001' AND id_centro = '01'
ORDER BY id_tipo_comg, id_complementog;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_complementog | legacySku | = id_complementog | NOT NULL |
| id_complementog | sku | UPPER(TRIM(id_complementog)) | UNIQUE, NOT NULL |
| complementog | name | CONVERT utf8mb4, TRIM | NOT NULL |
| descripcion | description | CONVERT utf8mb4 | - |
| id_tipo_comg | categoryId | JOIN categories WHERE legacyCode = id_tipo_comg | FK, NOT NULL |
| precio | basePrice | ROUND(precio, 2) | > 0 |
| costo | costPrice | ROUND(COALESCE(costo, 0), 2) | >= 0 |
| activo | isActive | 'S'→TRUE, 'N'→FALSE | NOT NULL |
| stock | currentStock | processStock(stock) | >= 0 |

#### Procesamiento de Stock (Crítico)
```javascript
/**
 * Según MIGRATION-STRATEGY.md:
 * - Stocks negativos NO son inventario real, son contadores de ventas
 * - Resetear a 0 y marcar como tracks_inventory = FALSE
 */
function processStock(stockLegacy: number | null): {
  currentStock: number,
  tracksInventory: boolean
} {
  // Si es NULL o 0, no hay inventario
  if (stockLegacy === null || stockLegacy === 0) {
    return {
      currentStock: 0,
      tracksInventory: false
    };
  }

  // Si es NEGATIVO, es contador de ventas, NO inventario
  if (stockLegacy < 0) {
    console.warn(`Product has negative stock ${stockLegacy}, resetting to 0`);
    return {
      currentStock: 0,
      tracksInventory: false
    };
  }

  // Si es POSITIVO, es stock real
  return {
    currentStock: Math.round(stockLegacy * 1000) / 1000,  // 3 decimales
    tracksInventory: true
  };
}

// Ejemplos del dump real:
// -19433 (Pisco Sour Catedral) → currentStock: 0, tracksInventory: false
// -17978 (Pisco Sour Peruano)  → currentStock: 0, tracksInventory: false
// 50.5 (Cerveza Corona)        → currentStock: 50.500, tracksInventory: true
```

#### Resolución de FK (categoryId)
```typescript
// Crear mapa en memoria para lookups rápidos
const categoryMap = new Map<string, bigint>();

// Cargar al inicio
const categories = await prisma.category.findMany({
  select: { id: true, legacyCode: true }
});

for (const cat of categories) {
  if (cat.legacyCode) {
    categoryMap.set(cat.legacyCode, cat.id);
  }
}

// Al migrar producto:
const categoryId = categoryMap.get(legacyProduct.id_tipo_comg);

if (!categoryId) {
  throw new Error(`Category not found for product ${legacyProduct.id_complementog}: ${legacyProduct.id_tipo_comg}`);
}
```

#### Manejo de Errores
- **Error Bloqueante:** categoryId no encontrado, precio <= 0, nombre vacío
- **Error No Bloqueante:** descripción vacía, costo NULL (usar 0)

#### Logs Esperados
```
[PRODUCTS] Inicio migración
[PRODUCTS] Cargando mapa de categorías... 15 categorías cargadas
[PRODUCTS] Leyendo 250 productos de legacy...
[PRODUCTS] ✓ Insertado: id=1, sku=00437, name="Algarrobina", category=COCKTAILS
[PRODUCTS] ⚠ Warning: Producto 00470 tiene stock negativo -19433, reseteando a 0
[PRODUCTS] ✓ Insertado: id=5, sku=00470, name="Pisco Sour Catedral", stock=0
[PRODUCTS] ✗ Error: Producto 00999 categoría no encontrada: 9999
[PRODUCTS] Total migrado: 249 / 250 (99.6%)
[PRODUCTS] Errores: 1 (categoría no encontrada)
[PRODUCTS] Tiempo: 2.1s
```

---

### 10. PRODUCT_PRICES (precios por tarifa)

**IMPORTANTE:** Solo migrar si existe tabla `comg_tarifa` en legacy.

#### Fuente Legacy
```sql
-- Tabla: comg_tarifa
SELECT * FROM comg_tarifa
WHERE id_empresa = '001';
```

#### Query de Lectura
```sql
SELECT
    ct.id_complementog,
    ct.id_tarifa,
    ct.precio
FROM comg_tarifa ct
WHERE ct.id_empresa = '001'
ORDER BY ct.id_complementog, ct.id_tarifa;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_complementog | productId | JOIN products WHERE legacySku = id_complementog | FK, NOT NULL |
| id_tarifa | priceTierId | JOIN price_tiers WHERE legacyCode = id_tarifa | FK, NOT NULL |
| precio | price | ROUND(precio, 2) | > 0 |

#### Resolución de FKs
```typescript
// Mapas en memoria
const productMap = new Map<string, bigint>();  // legacySku → id
const tierMap = new Map<string, bigint>();     // legacyCode → id

// Cargar productos
const products = await prisma.product.findMany({
  select: { id: true, legacySku: true }
});
for (const p of products) {
  if (p.legacySku) productMap.set(p.legacySku, p.id);
}

// Cargar price tiers
const tiers = await prisma.priceTier.findMany({
  select: { id: true, legacyCode: true }
});
for (const t of tiers) {
  if (t.legacyCode) tierMap.set(t.legacyCode, t.id);
}

// Al migrar:
const productId = productMap.get(legacy.id_complementog);
const priceTierId = tierMap.get(legacy.id_tarifa);

if (!productId || !priceTierId) {
  logger.skip(`Missing FK: product=${legacy.id_complementog}, tier=${legacy.id_tarifa}`);
  continue;
}
```

#### Manejo de Duplicados
```typescript
// UNIQUE(productId, priceTierId)
try {
  await prisma.productPrice.create({
    data: { productId, priceTierId, price }
  });
} catch (error) {
  if (error.code === 'P2002') {  // Unique constraint
    logger.skip(`Duplicate price: product=${productId}, tier=${priceTierId}`);
    continue;
  }
  throw error;
}
```

#### Manejo de Errores
- **Error Bloqueante:** productId no encontrado, priceTierId no encontrado, precio <= 0
- **Error No Bloqueante:** duplicados (skip)

#### Logs Esperados
```
[PRODUCT_PRICES] Inicio migración
[PRODUCT_PRICES] Cargando mapas... 250 productos, 3 tarifas
[PRODUCT_PRICES] Leyendo 750 precios de legacy...
[PRODUCT_PRICES] ✓ Insertado: product=1 (00437), tier=1 (DEFAULT), price=15.00
[PRODUCT_PRICES] ⊘ Skip: Duplicado product=5, tier=1
[PRODUCT_PRICES] ✗ Error: Producto no encontrado: 99999
[PRODUCT_PRICES] Total migrado: 748 / 750 (99.7%)
[PRODUCT_PRICES] Skipped: 1 duplicados, 1 huérfanos
[PRODUCT_PRICES] Tiempo: 1.5s
```

---

### 11. TABLES (mesas)

#### Fuente Legacy
```sql
-- Tabla: mesa
SELECT * FROM mesa
WHERE id_empresa = '001' AND id_centro = '01'
ORDER BY id_salon, num_mesa;
```

#### Query de Lectura
```sql
SELECT
    num_mesa,
    id_salon,
    capacidad,
    estado,
    activo
FROM mesa
WHERE id_empresa = '001' AND id_centro = '01'
ORDER BY id_salon, num_mesa;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| num_mesa | legacyTableNumber | = num_mesa | NOT NULL |
| num_mesa | tableNumber | TRIM(num_mesa) | NOT NULL |
| id_salon | roomId | JOIN rooms WHERE legacyCode = id_salon | FK, NOT NULL |
| capacidad | capacity | COALESCE(capacidad, 4) | > 0 |
| estado | status | mapTableStatus(estado) | ENUM |
| activo | isActive | 'S'→TRUE, 'N'→FALSE | NOT NULL |

#### Mapeo de Estado
```javascript
function mapTableStatus(estado: string): TableStatus {
  const lower = estado.trim().toLowerCase();

  const STATUS_MAP = {
    'libre': 'available',
    'disponible': 'available',
    'ocupada': 'occupied',
    'ocupado': 'occupied',
    'reservada': 'reserved',
    'fuera_servicio': 'out_of_service',
    'mantenimiento': 'out_of_service',
  };

  const mapped = STATUS_MAP[lower];
  if (mapped) return mapped;

  // Default: available
  console.warn(`Unknown table status "${estado}", defaulting to available`);
  return 'available';
}
```

#### Resolución de FK (roomId)
```typescript
const roomMap = new Map<string, bigint>();  // legacyCode → id

const rooms = await prisma.room.findMany({
  select: { id: true, legacyCode: true }
});

for (const room of rooms) {
  if (room.legacyCode) {
    roomMap.set(room.legacyCode, room.id);
  }
}

// Al migrar:
const roomId = roomMap.get(legacyTable.id_salon);

if (!roomId) {
  throw new Error(`Room not found for table ${legacyTable.num_mesa}: ${legacyTable.id_salon}`);
}
```

#### Validación de UNIQUE
```typescript
// UNIQUE(roomId, tableNumber)
const existing = await prisma.table.findUnique({
  where: {
    unique_room_table: {
      roomId,
      tableNumber
    }
  }
});

if (existing) {
  logger.skip(`Table already exists: room=${roomId}, table=${tableNumber}`);
  continue;
}
```

#### Manejo de Errores
- **Error Bloqueante:** roomId no encontrado, tableNumber vacío, duplicado de (roomId, tableNumber)
- **Error No Bloqueante:** capacidad NULL (usar 4), estado inválido (usar 'available')

#### Logs Esperados
```
[TABLES] Inicio migración
[TABLES] Cargando mapa de salones... 5 salones cargados
[TABLES] Leyendo 30 mesas de legacy...
[TABLES] ✓ Insertado: id=1, room=SALON_PRINCIPAL, table=M01, capacity=4
[TABLES] ⚠ Warning: Mesa M15 estado desconocido "bloqueada", usando 'available'
[TABLES] ✓ Insertado: id=15, room=TERRAZA, table=M15, status=available
[TABLES] Total migrado: 30 / 30 (100%)
[TABLES] Tiempo: 0.5s
```

---

## FASE 3: DATOS TRANSACCIONALES (12 MESES)

### 12. CASH_REGISTER_SHIFTS (turnos de caja)

**FILTRO TEMPORAL:** Últimos 6 meses (según MIGRATION-STRATEGY.md)

#### Fuente Legacy
```sql
-- Tabla: apcajas
SELECT * FROM apcajas
WHERE fecha_apertura >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
ORDER BY id_apcajas;
```

#### Query de Lectura
```sql
SELECT
    a.id_apcajas,
    a.id_caja,
    a.id_camarero AS id_empleado_apertura,
    a.efectivo_inicial,
    a.observaciones_apertura,
    a.efectivo_sistema,
    a.efectivo_real,
    a.tarjetas,
    a.otros,
    a.total_cierre,
    a.diferencia,
    a.observaciones_cierre,
    a.cerrada,
    TIMESTAMP(a.fecha_apertura, a.hora_apertura) AS apertura,
    TIMESTAMP(a.fecha_cierre, a.hora_cierre) AS cierre
FROM apcajas a
WHERE a.fecha_apertura >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
ORDER BY a.id_apcajas;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_apcajas | legacyId | = id_apcajas | NOT NULL |
| id_caja | cashRegisterId | JOIN cash_registers WHERE legacyId = id_caja | FK, NOT NULL |
| id_camarero | openedByUserId | JOIN employees WHERE legacyId = id_camarero | FK, NOT NULL |
| id_camarero | closedByUserId | JOIN employees (si cerrada='S') | FK, nullable |
| efectivo_inicial | openingCash | ROUND(efectivo_inicial, 2) | >= 0 |
| observaciones_apertura | openingNotes | CONVERT utf8mb4 | - |
| efectivo_real | closingCash | ROUND(efectivo_real, 2) | >= 0 |
| tarjetas | closingCards | ROUND(tarjetas, 2) | >= 0 |
| otros | closingOther | ROUND(otros, 2) | >= 0 |
| total_cierre | closingTotal | ROUND(total_cierre, 2) | >= 0 |
| efectivo_sistema | expectedCash | ROUND(efectivo_sistema, 2) | >= 0 |
| diferencia | cashDifference | ROUND(diferencia, 2) | Cualquier valor |
| observaciones_cierre | closingNotes | CONVERT utf8mb4 | - |
| cerrada | status | 'S'→'closed', 'N'→'open' | ENUM |
| fecha+hora apertura | openedAt | TIMESTAMP(fecha, hora) | NOT NULL |
| fecha+hora cierre | closedAt | TIMESTAMP(fecha, hora) si cerrada='S' | nullable |

#### Resolución de FKs
```typescript
const cashRegisterMap = new Map<number, bigint>();
const employeeMap = new Map<number, bigint>();

// Cargar mapas
const registers = await prisma.cashRegister.findMany({
  select: { id: true, legacyId: true }
});
for (const r of registers) {
  if (r.legacyId) cashRegisterMap.set(r.legacyId, r.id);
}

const employees = await prisma.employee.findMany({
  select: { id: true, legacyId: true }
});
for (const e of employees) {
  if (e.legacyId) employeeMap.set(e.legacyId, e.id);
}

// Al migrar:
const cashRegisterId = cashRegisterMap.get(legacy.id_caja);
const openedByUserId = employeeMap.get(legacy.id_camarero);

if (!cashRegisterId || !openedByUserId) {
  logger.error(`Missing FK: register=${legacy.id_caja}, employee=${legacy.id_camarero}`);
  continue;
}
```

#### Manejo de Errores
- **Error Bloqueante:** cashRegisterId no encontrado, openedByUserId no encontrado, openedAt inválido
- **Error No Bloqueante:** closedAt NULL (si cerrada='N'), diferencia NULL

#### Logs Esperados
```
[CASH_REGISTER_SHIFTS] Inicio migración (últimos 6 meses)
[CASH_REGISTER_SHIFTS] Cargando mapas... 2 cajas, 12 empleados
[CASH_REGISTER_SHIFTS] Leyendo 180 turnos de legacy...
[CASH_REGISTER_SHIFTS] ✓ Insertado: id=1, shift_legacy=1001, status=closed, diff=-5.50
[CASH_REGISTER_SHIFTS] ✓ Insertado: id=2, shift_legacy=1002, status=open (sin cierre aún)
[CASH_REGISTER_SHIFTS] Total migrado: 180 / 180 (100%)
[CASH_REGISTER_SHIFTS] Abiertos: 2, Cerrados: 178
[CASH_REGISTER_SHIFTS] Tiempo: 1.8s
```

---

### 13. ORDERS (órdenes/comandas)

**FILTRO TEMPORAL:** Últimos 12 meses, solo cerradas

#### Fuente Legacy
```sql
-- Tabla: ventadirecta
SELECT * FROM ventadirecta
WHERE cerrada = 'S'
  AND fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
ORDER BY id_venta;
```

#### Query de Lectura
```sql
SELECT
    v.id_venta,
    v.Num_Mesa,
    v.id_camarero,
    v.turno AS id_turno_caja,
    v.comensales,
    v.cerrada,
    v.bi AS base_imponible,
    v.ci AS cuota_impuesto,
    v.tv AS total_venta,
    v.observaciones,
    TIMESTAMP(v.fecha_venta, v.hora) AS fecha_hora
FROM ventadirecta v
WHERE v.cerrada = 'S'
  AND v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
ORDER BY v.id_venta;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_venta | legacyId | = id_venta | NOT NULL |
| - | orderNumber | generateOrderNumber(id_venta, fecha_venta) | UNIQUE, NOT NULL |
| Num_Mesa | tableId | JOIN tables WHERE legacyTableNumber = Num_Mesa | FK, NOT NULL |
| id_camarero | waiterId | JOIN employees WHERE legacyId = id_camarero | FK, NOT NULL |
| turno | shiftId | JOIN cash_register_shifts WHERE legacyId = turno | FK, NOT NULL |
| comensales | guestCount | COALESCE(comensales, 1) | > 0 |
| cerrada | status | 'S'→'closed' | ENUM |
| bi | subtotal | ROUND(bi, 2) | >= 0 |
| ci | taxAmount | ROUND(ci, 2) | >= 0 |
| tv | totalAmount | ROUND(tv, 2) | >= 0 |
| observaciones | notes | CONVERT utf8mb4 | - |
| fecha+hora | openedAt | TIMESTAMP(fecha_venta, hora) | NOT NULL |
| fecha+hora | closedAt | = openedAt (aprox, está cerrada) | NOT NULL |

#### Generación de Order Number
```javascript
function generateOrderNumber(legacyId: number, fecha: Date): string {
  const dateStr = fecha.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const paddedId = legacyId.toString().padStart(4, '0');
  return `#${dateStr}-${paddedId}`;
}

// Ejemplos:
// id=123, fecha=2025-01-15 → "#20250115-0123"
// id=5678, fecha=2024-12-01 → "#20241201-5678"
```

#### Resolución de FKs (Crítico - 3 FK)
```typescript
const tableMap = new Map<string, bigint>();      // legacyTableNumber → id
const employeeMap = new Map<number, bigint>();   // legacyId → id
const shiftMap = new Map<number, bigint>();      // legacyId → id

// Cargar mapas...

// Al migrar:
const tableId = tableMap.get(legacy.Num_Mesa);
const waiterId = employeeMap.get(legacy.id_camarero);
const shiftId = shiftMap.get(legacy.turno);

if (!tableId || !waiterId || !shiftId) {
  logger.error(`Missing FK for order ${legacy.id_venta}: table=${legacy.Num_Mesa}, waiter=${legacy.id_camarero}, shift=${legacy.turno}`);
  errorsBlocking.push({ order: legacy.id_venta, reason: 'Missing FK' });
  continue;
}
```

#### Validación de Totales
```javascript
// Validar que tv = bi + ci (con tolerancia de redondeo)
const expectedTotal = subtotal + taxAmount;
const diff = Math.abs(totalAmount - expectedTotal);

if (diff > 0.01) {  // Tolerancia 1 centavo
  logger.warn(`Order ${legacy.id_venta} total mismatch: tv=${totalAmount}, bi+ci=${expectedTotal}, diff=${diff}`);
}
```

#### Manejo de Errores
- **Error Bloqueante:** FK no encontrado (table, waiter, shift), fecha inválida, total <= 0
- **Error No Bloqueante:** comensales NULL (usar 1), diferencia de totales < 1 centavo

#### Logs Esperados
```
[ORDERS] Inicio migración (últimos 12 meses, cerradas)
[ORDERS] Cargando mapas... 30 mesas, 12 empleados, 180 turnos
[ORDERS] Leyendo 5,240 órdenes de legacy...
[ORDERS] ✓ Insertado: id=1, order=#20250115-0001, table=M01, total=125.50
[ORDERS] ⚠ Warning: Orden 2345 diferencia total 0.02 (redondeo)
[ORDERS] ✗ Error: Orden 3456 mesa no encontrada: "X99"
[ORDERS] Total migrado: 5,238 / 5,240 (99.96%)
[ORDERS] Errores: 2 (mesa no encontrada)
[ORDERS] Tiempo: 12.5s
```

---

### 14. ORDER_ITEMS (líneas de productos en órdenes)

#### Fuente Legacy
```sql
-- Tabla: ventadir_comg
-- Filtrar por órdenes ya migradas (últimos 12 meses)
SELECT vc.* FROM ventadir_comg vc
INNER JOIN ventadirecta v ON vc.id_venta = v.id_venta
WHERE v.cerrada = 'S'
  AND v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
ORDER BY vc.id_venta, vc.id_linea;
```

#### Query de Lectura
```sql
SELECT
    vc.id_linea,
    vc.id_venta,
    vc.id_complementog,
    vc.cantidad,
    vc.precio,
    vc.total,
    vc.descuento,
    CONCAT(COALESCE(vc.observaciones, ''), ' ', COALESCE(vc.nota, '')) AS notas,
    vc.cocina
FROM ventadir_comg vc
INNER JOIN ventadirecta v ON vc.id_venta = v.id_venta
WHERE v.cerrada = 'S'
  AND v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
ORDER BY vc.id_venta, vc.id_linea;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_linea | legacyId | = id_linea | NOT NULL |
| id_venta | orderId | JOIN orders WHERE legacyId = id_venta | FK, NOT NULL |
| id_complementog | productId | JOIN products WHERE legacySku = id_complementog | FK, NOT NULL |
| cantidad | quantity | ROUND(cantidad, 3) | > 0 |
| precio | unitPrice | ROUND(precio, 2) | > 0 |
| total | totalAmount | ROUND(total, 2) | >= 0 |
| descuento | discountPercentage | ROUND(descuento, 2) | >= 0, <= 100 |
| - | discountAmount | calcular | >= 0 |
| - | subtotal | cantidad * precio | >= 0 |
| observaciones+nota | notes | CONVERT utf8mb4, TRIM | - |
| cocina | status | cocina > 0 → 'sent_to_kitchen' : 'pending' | ENUM |
| - | sentToKitchenAt | Si cocina > 0, aprox = order.openedAt | - |

#### Cálculo de Montos
```javascript
function calculateItemAmounts(legacy: any): {
  quantity: number,
  unitPrice: number,
  subtotal: number,
  discountPercentage: number,
  discountAmount: number,
  totalAmount: number
} {
  const quantity = Math.round(legacy.cantidad * 1000) / 1000;  // 3 decimales
  const unitPrice = Math.round(legacy.precio * 100) / 100;      // 2 decimales

  const subtotal = Math.round(quantity * unitPrice * 100) / 100;

  const discountPercentage = Math.round((legacy.descuento || 0) * 100) / 100;
  const discountAmount = Math.round(subtotal * discountPercentage / 100 * 100) / 100;

  // total puede venir de legacy o calcularse
  let totalAmount;
  if (legacy.total !== null && legacy.total !== undefined) {
    totalAmount = Math.round(legacy.total * 100) / 100;
  } else {
    totalAmount = Math.round((subtotal - discountAmount) * 100) / 100;
  }

  return {
    quantity,
    unitPrice,
    subtotal,
    discountPercentage,
    discountAmount,
    totalAmount
  };
}
```

#### Resolución de FKs
```typescript
const orderMap = new Map<number, bigint>();    // legacyId → id
const productMap = new Map<string, bigint>();  // legacySku → id

// Cargar mapas...

// Al migrar:
const orderId = orderMap.get(legacy.id_venta);
const productId = productMap.get(legacy.id_complementog);

if (!orderId || !productId) {
  logger.error(`Missing FK for item ${legacy.id_linea}: order=${legacy.id_venta}, product=${legacy.id_complementog}`);
  errorsBlocking.push({ item: legacy.id_linea, reason: 'Missing FK' });
  continue;
}
```

#### Validación de Cantidad y Precio
```javascript
// Descartar líneas inválidas
if (legacy.cantidad <= 0) {
  logger.skip(`Item ${legacy.id_linea} has invalid quantity: ${legacy.cantidad}`);
  continue;
}

if (legacy.precio < 0) {
  logger.skip(`Item ${legacy.id_linea} has invalid price: ${legacy.precio}`);
  continue;
}
```

#### Manejo de Errores
- **Error Bloqueante:** orderId no encontrado, productId no encontrado
- **Error No Bloqueante:** cantidad <= 0 (skip), precio < 0 (skip), notas vacías

#### Logs Esperados
```
[ORDER_ITEMS] Inicio migración
[ORDER_ITEMS] Cargando mapas... 5,238 órdenes, 250 productos
[ORDER_ITEMS] Leyendo 18,532 líneas de legacy...
[ORDER_ITEMS] ✓ Insertado: id=1, order=1, product=00437 (Algarrobina), qty=2, total=30.00
[ORDER_ITEMS] ⊘ Skip: Línea 5678 cantidad inválida: -1
[ORDER_ITEMS] ✗ Error: Línea 9999 producto no encontrado: 99999
[ORDER_ITEMS] Total migrado: 18,520 / 18,532 (99.94%)
[ORDER_ITEMS] Skipped: 10 (cantidad/precio inválidos)
[ORDER_ITEMS] Errores: 2 (producto no encontrado)
[ORDER_ITEMS] Tiempo: 25.3s
```

---

### 15. PAYMENTS (pagos)

**FILTRO:** Solo pagos tipo='E' (entradas/cobros), últimos 12 meses

#### Fuente Legacy
```sql
-- Tabla: pagoscobros
SELECT p.* FROM pagoscobros p
INNER JOIN ventadirecta v ON p.id_venta = v.id_venta
WHERE p.tipo = 'E'  -- Solo entradas (cobros)
  AND v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
ORDER BY p.id_pagoscobros;
```

#### Query de Lectura
```sql
SELECT
    p.id_pagoscobros,
    p.id_venta,
    p.id_modo_pago,
    p.id_apcajas AS id_turno,
    p.id_camarero AS id_empleado,
    p.importe,
    p.referencia,
    p.descripcion,
    TIMESTAMP(p.fecha, p.hora) AS fecha_hora
FROM pagoscobros p
INNER JOIN ventadirecta v ON p.id_venta = v.id_venta
WHERE p.tipo = 'E'
  AND v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
ORDER BY p.id_pagoscobros;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_pagoscobros | legacyId | = id_pagoscobros | NOT NULL |
| id_venta | orderId | JOIN orders WHERE legacyId = id_venta | FK, NOT NULL |
| id_modo_pago | paymentMethodId | JOIN payment_methods WHERE legacyCode = id_modo_pago | FK, NOT NULL |
| id_apcajas | shiftId | JOIN cash_register_shifts WHERE legacyId = id_apcajas | FK, NOT NULL |
| id_camarero | processedByUserId | JOIN employees WHERE legacyId = id_camarero | FK, NOT NULL |
| importe | amount | ROUND(importe, 2) | > 0 |
| referencia | referenceNumber | TRIM(referencia) | - |
| descripcion | notes | CONVERT utf8mb4 | - |
| fecha+hora | paidAt | TIMESTAMP(fecha, hora) | NOT NULL |

#### Resolución de FKs (4 FK - la más compleja)
```typescript
const orderMap = new Map<number, bigint>();
const paymentMethodMap = new Map<string, bigint>();
const shiftMap = new Map<number, bigint>();
const employeeMap = new Map<number, bigint>();

// Cargar mapas...

// Al migrar:
const orderId = orderMap.get(legacy.id_venta);
const paymentMethodId = paymentMethodMap.get(legacy.id_modo_pago);
const shiftId = shiftMap.get(legacy.id_apcajas);
const processedByUserId = employeeMap.get(legacy.id_camarero);

if (!orderId || !paymentMethodId || !shiftId || !processedByUserId) {
  logger.error(`Missing FK for payment ${legacy.id_pagoscobros}`);
  continue;
}
```

#### Validación de Referencia
```javascript
// Si el método de pago requiere referencia, validar que exista
const method = await prisma.paymentMethod.findUnique({
  where: { id: paymentMethodId },
  select: { requiresReference: true }
});

if (method?.requiresReference && !legacy.referencia) {
  logger.warn(`Payment ${legacy.id_pagoscobros} requires reference but none provided`);
}
```

#### Manejo de Errores
- **Error Bloqueante:** FK no encontrado, amount <= 0, paidAt inválido
- **Error No Bloqueante:** referencia faltante (warning), notas vacías

#### Logs Esperados
```
[PAYMENTS] Inicio migración (tipo='E', últimos 12 meses)
[PAYMENTS] Cargando mapas... 5,238 órdenes, 6 métodos, 180 turnos, 12 empleados
[PAYMENTS] Leyendo 5,450 pagos de legacy...
[PAYMENTS] ✓ Insertado: id=1, order=1, method=CASH, amount=125.50
[PAYMENTS] ⚠ Warning: Pago 456 método CREDIT_CARD sin referencia
[PAYMENTS] ✗ Error: Pago 999 orden no encontrada: 99999
[PAYMENTS] Total migrado: 5,448 / 5,450 (99.96%)
[PAYMENTS] Errores: 2 (orden no encontrada)
[PAYMENTS] Tiempo: 11.2s
```

---

### 16. INVOICES (comprobantes)

**FILTRO:** Últimos 12 meses

#### Fuente Legacy
```sql
-- Tabla: tiquet
SELECT t.* FROM tiquet t
INNER JOIN ventadirecta v ON t.id_venta = v.id_venta
WHERE t.fecha_tiquet >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
ORDER BY t.id_tiquet;
```

#### Query de Lectura
```sql
SELECT
    t.id_tiquet,
    t.serie,
    t.id_venta,
    t.dni AS documento_cliente,
    t.total,
    t.iva,
    TIMESTAMP(t.fecha_tiquet, t.horatiquet) AS fecha_hora
FROM tiquet t
INNER JOIN ventadirecta v ON t.id_venta = v.id_venta
WHERE t.fecha_tiquet >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
ORDER BY t.id_tiquet;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_tiquet | legacyId | = id_tiquet | NOT NULL |
| serie | series | TRIM(serie) | NOT NULL |
| id_tiquet | documentNumber | LPAD(id_tiquet, 8, '0') | NOT NULL |
| serie | documentType | detectDocumentType(serie) | ENUM |
| id_venta | orderId | JOIN orders WHERE legacyId = id_venta | FK, NOT NULL |
| dni | customerId | JOIN customers WHERE documentNumber = dni | FK, nullable |
| total | totalAmount | ROUND(total, 2) | > 0 |
| iva | taxAmount | ROUND(iva, 2) | >= 0 |
| - | subtotal | total - iva | >= 0 |
| fecha+hora | issuedAt | TIMESTAMP(fecha_tiquet, horatiquet) | NOT NULL |

#### Detección de Tipo de Documento
```javascript
function detectDocumentType(series: string): DocumentType {
  const upper = series.trim().toUpperCase();

  if (upper.startsWith('F')) return 'factura';
  if (upper.startsWith('B')) return 'boleta';
  if (upper.startsWith('T')) return 'ticket';

  // Default: ticket
  console.warn(`Unknown series prefix "${series}", assuming ticket`);
  return 'ticket';
}

// Ejemplos:
// "F001" → 'factura'
// "B001" → 'boleta'
// "T001" → 'ticket'
// "X999" → 'ticket' (warning)
```

#### Resolución de FK customerId (Opcional)
```typescript
const orderMap = new Map<number, bigint>();
const customerMap = new Map<string, bigint>();  // documentNumber → id

// Cargar mapas...

// Al migrar:
const orderId = orderMap.get(legacy.id_venta);

if (!orderId) {
  logger.error(`Order not found for invoice ${legacy.id_tiquet}: ${legacy.id_venta}`);
  continue;
}

// customerId es OPCIONAL
let customerId: bigint | null = null;
if (legacy.dni) {
  customerId = customerMap.get(legacy.dni) || null;

  if (!customerId && legacy.serie.startsWith('F')) {
    logger.warn(`Factura ${legacy.serie}-${legacy.id_tiquet} sin cliente encontrado: ${legacy.dni}`);
  }
}
```

#### Validación de UNIQUE
```typescript
// UNIQUE(series, documentNumber)
const existing = await prisma.invoice.findUnique({
  where: {
    unique_series_number: {
      series,
      documentNumber
    }
  }
});

if (existing) {
  logger.skip(`Invoice already exists: ${series}-${documentNumber}`);
  continue;
}
```

#### Manejo de Errores
- **Error Bloqueante:** orderId no encontrado, duplicado (series, documentNumber)
- **Error No Bloqueante:** customerId no encontrado (dejar NULL con warning si es factura)

#### Logs Esperados
```
[INVOICES] Inicio migración (últimos 12 meses)
[INVOICES] Cargando mapas... 5,238 órdenes, 44 clientes
[INVOICES] Leyendo 4,890 comprobantes de legacy...
[INVOICES] ✓ Insertado: id=1, type=boleta, series=B001, number=00001234
[INVOICES] ⚠ Warning: Factura F001-00005678 sin cliente (DNI 12345678 no migrado)
[INVOICES] ⊘ Skip: Duplicado B001-00002345
[INVOICES] Total migrado: 4,888 / 4,890 (99.96%)
[INVOICES] Facturas sin cliente: 12
[INVOICES] Tiempo: 9.8s
```

---

## FASE 4: VALIDACIÓN Y CUADRE

### 17. Validar Totales de Órdenes

#### Validación: Suma de items = Total de orden
```sql
-- PostgreSQL
SELECT
    o.id,
    o.order_number,
    o.total_amount AS order_total,
    COALESCE(SUM(oi.total_amount), 0) AS items_total,
    ABS(o.total_amount - COALESCE(SUM(oi.total_amount), 0)) AS diff
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.order_number, o.total_amount
HAVING ABS(o.total_amount - COALESCE(SUM(oi.total_amount), 0)) > 0.01  -- Tolerancia 1 centavo
ORDER BY diff DESC
LIMIT 100;
```

**Acción:** Si diff > 0.01, loggear warning. Si diff > 1.00, loggear error.

---

### 18. Validar Relaciones (FKs)

#### Validación: No hay FKs rotas
```sql
-- Verificar order_items → orders
SELECT COUNT(*) AS broken_fk_count
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;
-- Esperado: 0

-- Verificar order_items → products
SELECT COUNT(*) AS broken_fk_count
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
WHERE p.id IS NULL;
-- Esperado: 0

-- Verificar payments → orders
SELECT COUNT(*) AS broken_fk_count
FROM payments pa
LEFT JOIN orders o ON pa.order_id = o.id
WHERE o.id IS NULL;
-- Esperado: 0
```

**Acción:** Si COUNT > 0, es ERROR CRÍTICO. Migración fallida.

---

### 19. Reportes de Comparación

#### Comparar Total de Ventas por Mes (Legacy vs Nuevo)
```sql
-- LEGACY (MySQL)
SELECT
    DATE_FORMAT(fecha_venta, '%Y-%m') AS mes,
    SUM(tv) AS total_legacy,
    COUNT(*) AS count_legacy
FROM ventadirecta
WHERE cerrada = 'S' AND fecha_venta >= '2024-12-15'
GROUP BY mes
ORDER BY mes;

-- NUEVO (PostgreSQL)
SELECT
    TO_CHAR(opened_at, 'YYYY-MM') AS mes,
    SUM(total_amount) AS total_nuevo,
    COUNT(*) AS count_nuevo
FROM orders
WHERE status = 'closed'
GROUP BY mes
ORDER BY mes;
```

**Comparación:** La diferencia entre `total_legacy` y `total_nuevo` debe ser < 1% (redondeos).

---

#### Comparar Top 10 Productos Más Vendidos
```sql
-- LEGACY (MySQL)
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

-- NUEVO (PostgreSQL)
SELECT
    p.name,
    SUM(oi.quantity) AS total_vendido
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'closed'
GROUP BY p.id, p.name
ORDER BY total_vendido DESC
LIMIT 10;
```

**Comparación:** Los productos en el top 10 deben coincidir (puede variar orden por decimales).

---

## 📊 MANEJO GLOBAL DE ERRORES

### Tipos de Errores

#### 1. Errores Bloqueantes (Detener Migración)
- FK no resuelta (producto/mesa/empleado no existe)
- Fecha inválida (0000-00-00, NULL en campo obligatorio)
- Total de orden != suma de items (diff > 5%)
- Duplicado de PK/UK
- Charset no convertible (caracteres inválidos)

**Acción:**
1. Loggear error con todos los detalles
2. Agregar a archivo `errors-blocking.json`
3. **DETENER migración de esa tabla**
4. Mostrar resumen de errores al final

#### 2. Errores No Bloqueantes (Log + Skip)
- Campos opcionales nulos
- Descuentos/notas vacías
- Diferencia de totales < 1%
- customerId no encontrado para boletas (solo warning)

**Acción:**
1. Loggear warning
2. Agregar a archivo `warnings.json`
3. **CONTINUAR migración**

#### 3. Registros Huérfanos
- Items sin orden válida → SKIP + LOG
- Pagos sin orden válida → SKIP + LOG
- Facturas sin orden válida → SKIP + LOG

**Acción:**
1. Loggear como "orphan"
2. Agregar a archivo `orphans.json`
3. **SKIP registro**
4. Generar reporte de huérfanos al final

---

### Estructura de Logs

```typescript
interface MigrationLog {
  table: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  legacyId?: any;
  newId?: bigint;
  details?: any;
  timestamp: string;
}

// Ejemplo:
{
  table: 'products',
  level: 'error',
  message: 'Category not found',
  legacyId: '00999',
  details: { categoryLegacyCode: '9999' },
  timestamp: '2025-12-15T14:23:45.123Z'
}
```

---

## 🚀 ESTRATEGIA DE BATCH PROCESSING

### Tamaño de Lotes
```typescript
const BATCH_SIZES = {
  rooms: 100,               // Pocas, procesar todas
  categories: 100,
  price_tiers: 100,
  payment_methods: 100,
  cash_registers: 100,
  kitchen_stations: 100,
  employees: 50,
  customers: 100,
  products: 100,            // ~250 productos
  product_prices: 500,      // ~750 precios
  tables: 100,
  cash_register_shifts: 50, // ~180 turnos
  orders: 100,              // ~5,240 órdenes
  order_items: 500,         // ~18,532 líneas
  payments: 200,            // ~5,450 pagos
  invoices: 200,            // ~4,890 comprobantes
};
```

### Procesamiento por Lotes
```typescript
async function migrateInBatches<T>(
  fetchLegacy: () => Promise<T[]>,
  transform: (legacy: T) => any,
  tableName: string,
  batchSize: number
) {
  const legacyData = await fetchLegacy();
  const total = legacyData.length;

  logger.info(`[${tableName}] Total a migrar: ${total}`);

  let migrated = 0;
  let errors = 0;
  let skipped = 0;

  for (let i = 0; i < total; i += batchSize) {
    const batch = legacyData.slice(i, i + batchSize);

    try {
      await prisma.$transaction(async (tx) => {
        for (const item of batch) {
          try {
            const data = transform(item);
            await tx[tableName].create({ data });
            migrated++;
          } catch (error) {
            if (isBlockingError(error)) {
              errors++;
              logError(tableName, item, error);
            } else {
              skipped++;
              logWarning(tableName, item, error);
            }
          }
        }
      });

      const progress = ((i + batch.length) / total * 100).toFixed(1);
      logger.info(`[${tableName}] Progreso: ${progress}% (${migrated}/${total})`);

    } catch (error) {
      logger.error(`[${tableName}] Error en lote ${i}-${i+batchSize}: ${error}`);
      throw error;
    }
  }

  logger.info(`[${tableName}] Resumen: ${migrated} migrados, ${skipped} omitidos, ${errors} errores`);

  return { migrated, skipped, errors };
}
```

---

## 🔄 IDEMPOTENCIA

### Estrategia: Detectar y Skip Duplicados
```typescript
// Cada tabla tiene campo unique (legacyId, legacyCode, legacySku, etc.)

async function upsertIdempotent(tableName: string, data: any, legacyField: string) {
  // Buscar si ya existe por legacy_id
  const existing = await prisma[tableName].findFirst({
    where: { [legacyField]: data[legacyField] }
  });

  if (existing) {
    logger.skip(`${tableName} already migrated: ${data[legacyField]}`);
    return { created: false, id: existing.id };
  }

  // Insertar nuevo
  const created = await prisma[tableName].create({ data });
  return { created: true, id: created.id };
}
```

### Re-Ejecución Segura
- Primera ejecución: Migra todo
- Segunda ejecución: Skip duplicados, migra solo faltantes
- Rollback: DELETE WHERE legacy_id IS NOT NULL (si es necesario)

---

## 📁 ESTRUCTURA DEL PROYECTO ETL

```
backend/
├── etl/
│   ├── src/
│   │   ├── index.ts              # Entry point principal
│   │   ├── config/
│   │   │   ├── legacy-db.ts      # Conexión MySQL legacy (READ ONLY)
│   │   │   ├── new-db.ts         # Prisma client (PostgreSQL)
│   │   │   └── constants.ts      # Constantes (batch sizes, maps, etc)
│   │   │
│   │   ├── migrators/
│   │   │   ├── phase1/
│   │   │   │   ├── rooms.ts
│   │   │   │   ├── categories.ts
│   │   │   │   ├── price-tiers.ts
│   │   │   │   ├── payment-methods.ts
│   │   │   │   ├── cash-registers.ts
│   │   │   │   ├── kitchen-stations.ts
│   │   │   │   ├── employees.ts
│   │   │   │   └── customers.ts
│   │   │   │
│   │   │   ├── phase2/
│   │   │   │   ├── products.ts
│   │   │   │   ├── product-prices.ts
│   │   │   │   └── tables.ts
│   │   │   │
│   │   │   ├── phase3/
│   │   │   │   ├── cash-register-shifts.ts
│   │   │   │   ├── orders.ts
│   │   │   │   ├── order-items.ts
│   │   │   │   ├── payments.ts
│   │   │   │   └── invoices.ts
│   │   │   │
│   │   │   └── phase4/
│   │   │       ├── validate-totals.ts
│   │   │       ├── validate-fks.ts
│   │   │       └── validate-comparisons.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── logger.ts         # Winston logger
│   │   │   ├── transformers.ts   # Funciones de transformación
│   │   │   ├── validators.ts     # Validaciones
│   │   │   └── batch-processor.ts
│   │   │
│   │   └── types/
│   │       └── legacy.ts         # Tipos para datos legacy
│   │
│   ├── logs/                     # Logs generados
│   │   ├── migration.log
│   │   ├── errors-blocking.json
│   │   ├── warnings.json
│   │   └── orphans.json
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
└── prisma/
    └── schema.prisma             # Schema con legacy_id ya agregado
```

---

## ⏱️ ESTIMACIÓN DE TIEMPOS

| Fase | Tablas | Registros Est. | Tiempo Est. |
|------|--------|----------------|-------------|
| Fase 1 | 8 | ~500 | 2-3 min |
| Fase 2 | 3 | ~1,000 | 3-5 min |
| Fase 3 | 5 | ~34,000 | 60-90 min |
| Fase 4 | Validaciones | - | 10-15 min |
| **TOTAL** | **16 tablas** | **~35,500 registros** | **75-110 min** |

**Ventana de mantenimiento:** 4 horas (con margen de seguridad)

---

## ✅ CHECKLIST PRE-EJECUCIÓN

- [ ] PostgreSQL 14+ instalado y corriendo
- [ ] Base de datos `pos_db` creada
- [ ] Schema Prisma actualizado con campos `legacy_id`
- [ ] Migración Prisma aplicada (`npx prisma migrate dev`)
- [ ] MySQL legacy accesible en modo READ ONLY
- [ ] Dump legacy disponible (fallback)
- [ ] Backup de PostgreSQL nuevo (vacío)
- [ ] Logs configurados (logs/)
- [ ] Variables de entorno configuradas
- [ ] Proyecto ETL compilado (`npm run build`)

---

## 📌 SIGUIENTE PASO

Con el diseño completo, proceder a **IMPLEMENTACIÓN** (Paso 4.2):

1. Crear proyecto `backend/etl/`
2. Implementar migrators en TypeScript
3. Implementar utils (logger, transformers, validators)
4. Implementar batch processor
5. Testing en ambiente de desarrollo
6. Ejecutar migración completa
7. Validaciones post-migración
8. Generar ETL-VALIDATION.md

---

**FIN DE ETL-DESIGN (COMPLETO)**

Estado: ✅ DISEÑO ETL COMPLETO (4 FASES)
Tablas diseñadas: 16 / 16 (100%)
Estrategias: Definidas (batch, idempotencia, errores)
Listo para: Implementación en TypeScript
