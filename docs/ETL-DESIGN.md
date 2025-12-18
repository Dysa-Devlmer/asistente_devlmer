# ETL DESIGN - Diseño Detallado de Migración

**Fecha:** 2025-12-15
**Fase:** Fase 4 - ETL (Migración de Datos)
**Estado:** DISEÑO (Sin código aún)

---

## 🎯 OBJETIVO

Definir EXACTAMENTE cómo se migrarán los datos desde el sistema legacy (MySQL latin1) al nuevo sistema (PostgreSQL utf8mb4), sin escribir código todavía.

---

## 📋 PRERREQUISITOS TÉCNICOS

### Campos de Trazabilidad Necesarios

**IMPORTANTE:** Antes de ejecutar el ETL, necesitamos agregar campos `legacy_id` a los modelos Prisma para mantener trazabil idad.

#### Modificación al Schema Prisma (Fase 4.0 - PRE-ETL)

Agregar a cada modelo que se migrará:

```prisma
// En cada modelo migrado desde legacy:
legacyId  BigInt?  @map("legacy_id")  // ID original del sistema legacy

// Además, en Product:
legacySku String?  @map("legacy_sku") @db.VarChar(50)  // SKU original legacy

// En Table:
legacyTableNumber  String?  @map("legacy_table_number") @db.VarChar(20)

// En Employee:
legacyCode String?  @map("legacy_code") @db.VarChar(20)
```

**Modelos que requieren legacy_id:**
1. Order → `legacyId` (de `ventadirecta.id_venta`)
2. OrderItem → `legacyId` (de `ventadir_comg.id_linea`)
3. Product → `legacyId` + `legacySku` (de `complementog.id_complementog`)
4. Category → `legacyCode` (de `tipo_comg.id_tipo_comg`)
5. PriceTier → `legacyCode` (de `tarifa.id_tarifa`)
6. Table → `legacyTableNumber` (de `mesa.num_mesa`)
7. Room → `legacyCode` (de `salon.id_salon`)
8. CashRegister → `legacyId` (de `cajas.id_caja`)
9. CashRegisterShift → `legacyId` (de `apcajas.id_apcajas`)
10. Payment → `legacyId` (de `pagoscobros.id_pagoscobros`)
11. PaymentMethod → `legacyCode` (de `modo_pago.id_modo_pago`)
12. Invoice → `legacyId` (de `tiquet.id_tiquet`) + `legacySeries` (de `tiquet.serie`)
13. Employee → `legacyId` (de `camareros.id_camarero`)
14. Customer → `legacyId` (de `cliente.id_cliente`)

**Índices necesarios:** Agregar índice en cada `legacy_id` para lookups rápidos

```prisma
@@index([legacyId])
```

---

## 🔄 ORDEN DE MIGRACIÓN (4 FASES)

### FASE 1: DATOS MAESTROS SIN DEPENDENCIAS

**Orden estricto (sin dependencias FK):**

1. **rooms** (salones)
2. **categories** (categorías)
3. **price_tiers** (tarifas)
4. **payment_methods** (métodos de pago)
5. **cash_registers** (cajas registradoras)
6. **kitchen_stations** (estaciones de cocina)
7. **employees** (empleados)
8. **customers** (clientes - solo con facturas recientes)

**Resultado:** Tablas base pobladas, sin relaciones FK todavía

---

### FASE 2: DATOS MAESTROS CON RELACIONES

**Orden estricto (con dependencias FK):**

9. **products** (depende de: categories)
10. **product_prices** (depende de: products, price_tiers)
11. **tables** (depende de: rooms)

**Resultado:** Catálogo completo funcional

---

### FASE 3: DATOS TRANSACCIONALES (HISTÓRICOS 12 MESES)

**Orden estricto (dependencias complejas):**

12. **cash_register_shifts** (depende de: cash_registers, employees)
13. **orders** (depende de: tables, employees, cash_register_shifts)
14. **order_items** (depende de: orders, products)
15. **payments** (depende de: orders, payment_methods, cash_register_shifts, employees)
16. **invoices** (depende de: orders, customers - opcional)

**Resultado:** Histórico transaccional completo

---

### FASE 4: VALIDACIÓN Y CUADRE

17. **Validar totales** (suma items = total orden)
18. **Validar relaciones** (todas las FK resueltas)
19. **Reportes de comparación** (legacy vs nuevo)

---

## 📊 DETALLE POR TABLA

### 1. ROOMS (salones)

#### Fuente Legacy
```sql
-- Tabla: salon
SELECT * FROM salon WHERE activo = 'S';
```

#### Query de Lectura
```sql
SELECT
    id_salon,
    salon AS nombre,
    capacidad,
    activo,
    orden
FROM salon
WHERE id_empresa = '001' AND id_centro = '01'
ORDER BY orden, id_salon;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_salon | legacyCode | = id_salon | NOT NULL |
| - | code | UPPER(REPLACE(salon, ' ', '_')) | UNIQUE, NOT NULL |
| salon | name | CONVERT utf8mb4, TRIM | NOT NULL |
| capacidad | capacity | = capacidad | >= 0 |
| activo | isActive | 'S'→TRUE, 'N'→FALSE | NOT NULL |
| orden | displayOrder | = orden | >= 0 |

#### Generación de `code`
```javascript
// Pseudo-código
function generateRoomCode(nombre: string): string {
  return nombre
    .trim()
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^A-Z0-9]+/g, '_')  // Reemplazar no-alfanum con _
    .replace(/^_|_$/g, '');        // Quitar _ inicio/fin
}

// Ejemplos:
"Salón Principal" → "SALON_PRINCIPAL"
"Terraza" → "TERRAZA"
"Bar" → "BAR"
```

#### Manejo de Errores
- **Error Bloqueante:** nombre vacío o NULL
- **Error No Bloqueante:** capacidad NULL (usar 0)

#### Logs Esperados
```
[ROOMS] Inicio migración
[ROOMS] Leyendo 5 salones de legacy...
[ROOMS] Transformando salon id=01 "Salón Principal"...
[ROOMS] ✓ Insertado: id=1, code=SALON_PRINCIPAL
[ROOMS] Transformando salon id=02 "Terraza"...
[ROOMS] ✓ Insertado: id=2, code=TERRAZA
[ROOMS] Total migrado: 5 / 5 (100%)
[ROOMS] Tiempo: 0.2s
```

---

### 2. CATEGORIES (categorías)

#### Fuente Legacy
```sql
-- Tabla: tipo_comg
SELECT * FROM tipo_comg WHERE activo = 'S';
```

#### Query de Lectura
```sql
SELECT
    id_tipo_comg,
    tipo AS nombre,
    activo,
    orden,
    id_padre  -- Si existe jerarquía
FROM tipo_comg
WHERE id_empresa = '001'
ORDER BY orden, id_tipo_comg;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_tipo_comg | legacyCode | = id_tipo_comg | NOT NULL |
| - | code | generateCategoryCode(tipo) | UNIQUE, NOT NULL |
| tipo | name | CONVERT utf8mb4, TRIM | NOT NULL |
| activo | isActive | 'S'→TRUE, 'N'→FALSE | NOT NULL |
| orden | displayOrder | = orden | >= 0 |
| id_padre | parentId | JOIN categories.legacyCode | FK opcional |

#### Generación de `code`
```javascript
// Map manual para categorías conocidas
const CATEGORY_CODE_MAP = {
  '0051': 'COCKTAILS',
  '0052': 'SOFT_DRINKS',
  '0053': 'FRESH_JUICES',
  '0054': 'BEERS',
  '0055': 'COFFEE',
  '0063': 'APPETIZERS',
  '0064': 'CEVICHES',
  '0065': 'TIRADITOS',
  '0066': 'CAUSAS',
  '0067': 'OCTOPUS',
  '0068': 'MAIN_DISHES',
  '0069': 'RICE_DISHES',
  '0070': 'MEATS',
  '0071': 'FISH',
  '0072': 'SOUPS',
  '0073': 'PASTAS',
};

function generateCategoryCode(legacyId: string, nombre: string): string {
  // Primero intentar lookup manual
  if (CATEGORY_CODE_MAP[legacyId]) {
    return CATEGORY_CODE_MAP[legacyId];
  }

  // Si no existe, generar slug
  return nombre
    .trim()
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
```

#### Manejo de Jerarquía (si existe)
```typescript
// Primera pasada: categorías padre (id_padre IS NULL)
// Segunda pasada: subcategorías (id_padre IS NOT NULL)
```

#### Manejo de Errores
- **Error Bloqueante:** nombre vacío
- **Error No Bloqueante:** orden NULL (usar 0)

#### Logs Esperados
```
[CATEGORIES] Inicio migración
[CATEGORIES] Leyendo 15 categorías de legacy...
[CATEGORIES] Pasada 1: Categorías padre (sin id_padre)
[CATEGORIES] ✓ Insertado: id=1, code=COCKTAILS, name="Cocteles"
[CATEGORIES] ✓ Insertado: id=2, code=APPETIZERS, name="Piqueos"
[CATEGORIES] Pasada 2: Subcategorías (con id_padre)
[CATEGORIES] Total migrado: 15 / 15 (100%)
[CATEGORIES] Tiempo: 0.3s
```

---

### 3. PRICE_TIERS (tarifas)

#### Fuente Legacy
```sql
-- Tabla: tarifa
SELECT * FROM tarifa WHERE activo = 'S';
```

#### Query de Lectura
```sql
SELECT
    id_tarifa,
    tarifa AS nombre,
    defecto,
    activo,
    orden
FROM tarifa
WHERE id_empresa = '001'
ORDER BY defecto DESC, orden;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_tarifa | legacyCode | = id_tarifa | NOT NULL |
| - | code | generateTierCode(tarifa) | UNIQUE, NOT NULL |
| tarifa | name | CONVERT utf8mb4, TRIM | NOT NULL |
| defecto | isDefault | 'S'→TRUE, 'N'→FALSE | Solo 1 TRUE |
| activo | isActive | 'S'→TRUE, 'N'→FALSE | NOT NULL |
| orden | displayOrder | = orden | >= 0 |

#### Generación de `code`
```javascript
const TIER_CODE_MAP = {
  'Tarifa por defecto': 'DEFAULT',
  'Tarifa VIP': 'VIP',
  'Happy Hour': 'HAPPY_HOUR',
  'Promoción': 'PROMO',
};

function generateTierCode(nombre: string): string {
  if (TIER_CODE_MAP[nombre]) {
    return TIER_CODE_MAP[nombre];
  }

  return nombre
    .trim()
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
```

#### Validación Especial
```typescript
// SOLO puede haber UNA tarifa con isDefault = TRUE
const defaultCount = await prisma.priceTier.count({
  where: { isDefault: true }
});

if (defaultCount > 1) {
  throw new Error('Multiple default price tiers detected');
}
```

#### Manejo de Errores
- **Error Bloqueante:** nombre vacío, más de 1 tarifa default
- **Error No Bloqueante:** ninguno

#### Logs Esperados
```
[PRICE_TIERS] Inicio migración
[PRICE_TIERS] Leyendo 3 tarifas de legacy...
[PRICE_TIERS] ✓ Insertado: id=1, code=DEFAULT, name="Tarifa por defecto", isDefault=true
[PRICE_TIERS] ✓ Insertado: id=2, code=VIP, name="Tarifa VIP"
[PRICE_TIERS] ✓ Validación: Solo 1 tarifa default
[PRICE_TIERS] Total migrado: 3 / 3 (100%)
[PRICE_TIERS] Tiempo: 0.2s
```

---

### 4. PAYMENT_METHODS (métodos de pago)

#### Fuente Legacy
```sql
-- Tabla: modo_pago
SELECT * FROM modo_pago WHERE activo = 'S';
```

#### Query de Lectura
```sql
SELECT
    id_modo_pago,
    modo_pago AS nombre,
    activo,
    requiere_referencia,  -- Si existe
    orden
FROM modo_pago
WHERE id_empresa = '001'
ORDER BY orden;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_modo_pago | legacyCode | = id_modo_pago | NOT NULL |
| - | code | generatePaymentCode(modo_pago) | UNIQUE, NOT NULL |
| modo_pago | name | CONVERT utf8mb4, TRIM | NOT NULL |
| activo | isActive | 'S'→TRUE, 'N'→FALSE | NOT NULL |
| requiere_referencia | requiresReference | Detectar o FALSE | NOT NULL |
| orden | displayOrder | = orden | >= 0 |

#### Generación de `code`
```javascript
const PAYMENT_CODE_MAP = {
  'Efectivo': 'CASH',
  'Tarjeta Crédito': 'CREDIT_CARD',
  'Tarjeta Débito': 'DEBIT_CARD',
  'Tarjeta de Crédito': 'CREDIT_CARD',
  'Tarjeta de Débito': 'DEBIT_CARD',
  'Webpay': 'WEBPAY',
  'Transferencia': 'TRANSFER',
  'Cortesía': 'COURTESY',
  'Voucher': 'VOUCHER',
};

function generatePaymentCode(nombre: string): string {
  const cleaned = nombre.trim();

  if (PAYMENT_CODE_MAP[cleaned]) {
    return PAYMENT_CODE_MAP[cleaned];
  }

  return cleaned
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
```

#### Detección de `requiresReference`
```javascript
// Tarjetas, transferencias → TRUE
// Efectivo, cortesía → FALSE
function detectRequiresReference(code: string, nombre: string): boolean {
  const requiresRef = ['CREDIT_CARD', 'DEBIT_CARD', 'WEBPAY', 'TRANSFER', 'VOUCHER'];

  if (requiresRef.includes(code)) return true;

  if (nombre.toLowerCase().includes('tarjeta') ||
      nombre.toLowerCase().includes('transferencia')) {
    return true;
  }

  return false;
}
```

#### Logs Esperados
```
[PAYMENT_METHODS] Inicio migración
[PAYMENT_METHODS] Leyendo 6 métodos de pago de legacy...
[PAYMENT_METHODS] ✓ Insertado: id=1, code=CASH, name="Efectivo", requiresReference=false
[PAYMENT_METHODS] ✓ Insertado: id=2, code=CREDIT_CARD, name="Tarjeta Crédito", requiresReference=true
[PAYMENT_METHODS] Total migrado: 6 / 6 (100%)
[PAYMENT_METHODS] Tiempo: 0.2s
```

---

### 5. CASH_REGISTERS (cajas registradoras)

#### Fuente Legacy
```sql
-- Tabla: cajas
SELECT * FROM cajas WHERE activo = 'S';
```

#### Query de Lectura
```sql
SELECT
    id_caja,
    caja AS codigo,
    nombre,
    descripcion,
    activo
FROM cajas
WHERE id_empresa = '001'
ORDER BY id_caja;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_caja | legacyId | = id_caja | NOT NULL |
| caja | code | UPPER(TRIM(caja)) | UNIQUE, NOT NULL |
| nombre | name | CONVERT utf8mb4, TRIM | NOT NULL |
| descripcion | description | CONVERT utf8mb4 | - |
| activo | isActive | 'S'→TRUE, 'N'→FALSE | NOT NULL |

#### Logs Esperados
```
[CASH_REGISTERS] Inicio migración
[CASH_REGISTERS] Leyendo 2 cajas de legacy...
[CASH_REGISTERS] ✓ Insertado: id=1, code=CAJA-01, name="Caja Principal"
[CASH_REGISTERS] ✓ Insertado: id=2, code=CAJA-02, name="Caja Barra"
[CASH_REGISTERS] Total migrado: 2 / 2 (100%)
[CASH_REGISTERS] Tiempo: 0.1s
```

---

### 6. KITCHEN_STATIONS (estaciones de cocina)

#### Fuente Legacy
**NO existe tabla legacy para esto**. Se crean estaciones estándar según CORE-DOMAIN.md.

#### Datos a Insertar (hardcoded)
```typescript
const DEFAULT_KITCHEN_STATIONS = [
  { code: 'GRILL', name: 'Parrilla', displayOrder: 1 },
  { code: 'COLD', name: 'Estación Fría', displayOrder: 2 },
  { code: 'HOT', name: 'Estación Caliente', displayOrder: 3 },
  { code: 'BAR', name: 'Barra', displayOrder: 4 },
  { code: 'DESSERTS', name: 'Postres', displayOrder: 5 },
];
```

#### Transformaciones
```typescript
// Insertar directamente
for (const station of DEFAULT_KITCHEN_STATIONS) {
  await prisma.kitchenStation.create({
    data: {
      code: station.code,
      name: station.name,
      displayOrder: station.displayOrder,
      isActive: true,
    }
  });
}
```

#### Logs Esperados
```
[KITCHEN_STATIONS] Inicio migración
[KITCHEN_STATIONS] No hay tabla legacy, creando estaciones por defecto...
[KITCHEN_STATIONS] ✓ Creado: id=1, code=GRILL, name="Parrilla"
[KITCHEN_STATIONS] ✓ Creado: id=2, code=COLD, name="Estación Fría"
[KITCHEN_STATIONS] ✓ Creado: id=3, code=HOT, name="Estación Caliente"
[KITCHEN_STATIONS] ✓ Creado: id=4, code=BAR, name="Barra"
[KITCHEN_STATIONS] ✓ Creado: id=5, code=DESSERTS, name="Postres"
[KITCHEN_STATIONS] Total creado: 5 estaciones
[KITCHEN_STATIONS] Tiempo: 0.1s
```

---

### 7. EMPLOYEES (empleados)

#### Fuente Legacy
```sql
-- Tabla: camareros
SELECT * FROM camareros
WHERE activo = 'S'
   OR (activo = 'N' AND fecha_baja >= DATE_SUB(NOW(), INTERVAL 2 YEAR));
```

#### Query de Lectura
```sql
SELECT
    id_camarero,
    cod_camarero,
    nombre AS nombre_completo,
    clave,
    tipo,  -- Rol
    activo,
    fecha_alta,
    fecha_baja,
    email,
    telefono
FROM camareros
WHERE id_empresa = '001'
ORDER BY id_camarero;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_camarero | legacyId | = id_camarero | NOT NULL |
| cod_camarero | employeeCode | TRIM(cod_camarero) | UNIQUE, NOT NULL |
| nombre | firstName, lastName | splitName(nombre) | NOT NULL |
| clave | pinCode | LEFT(clave, 6) | Max 6 chars |
| tipo | role | mapEmployeeRole(tipo) | ENUM |
| activo | isActive | 'S'→TRUE, 'N'→FALSE | NOT NULL |
| fecha_alta | hiredAt | = fecha_alta | DATE |
| fecha_baja | terminatedAt | = fecha_baja | DATE, nullable |
| email | email | LOWER(TRIM(email)) | UNIQUE si no NULL |
| telefono | phone | TRIM(telefono) | - |

#### Split de Nombre
```javascript
function splitName(nombreCompleto: string): { firstName: string, lastName: string } {
  const parts = nombreCompleto.trim().split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  return { firstName, lastName };
}

// Ejemplos:
"Juan Pérez" → { firstName: "Juan", lastName: "Pérez" }
"María Elena García López" → { firstName: "María", lastName: "Elena García López" }
"Carlos" → { firstName: "Carlos", lastName: "" }
```

#### Mapeo de Roles
```javascript
const EMPLOYEE_ROLE_MAP = {
  'Camarero': 'waiter',
  'Mesero': 'waiter',
  'Cajero': 'cashier',
  'Cocinero': 'cook',
  'Chef': 'cook',
  'Bartender': 'bartender',
  'Barman': 'bartender',
  'Gerente': 'manager',
  'Administrador': 'admin',
  'Admin': 'admin',
};

function mapEmployeeRole(tipo: string): EmployeeRole {
  const cleaned = tipo.trim();

  const mapped = EMPLOYEE_ROLE_MAP[cleaned];
  if (mapped) return mapped;

  // Default: waiter
  console.warn(`Unknown employee type "${tipo}", defaulting to waiter`);
  return 'waiter';
}
```

#### Manejo de Errores
- **Error Bloqueante:** employeeCode duplicado, nombre vacío
- **Error No Bloqueante:** clave vacía (dejar NULL), email inválido (dejar NULL)

#### Logs Esperados
```
[EMPLOYEES] Inicio migración
[EMPLOYEES] Leyendo 12 empleados de legacy (activos + 2 años inactivos)...
[EMPLOYEES] ✓ Insertado: id=1, code=CAM001, name="Juan Pérez", role=waiter
[EMPLOYEES] ⚠ Warning: Unknown role "Ayudante" for CAM005, using 'waiter'
[EMPLOYEES] ✓ Insertado: id=5, code=CAM005, name="María García", role=waiter
[EMPLOYEES] Total migrado: 12 / 12 (100%)
[EMPLOYEES] Tiempo: 0.3s
```

---

### 8. CUSTOMERS (clientes)

**IMPORTANTE:** Solo migrar clientes con facturas emitidas en los últimos 12 meses.

#### Fuente Legacy
```sql
-- Tabla: cliente
SELECT DISTINCT c.*
FROM cliente c
INNER JOIN tiquet t ON c.nif = t.dni OR c.ruc = t.dni OR c.dni = t.dni
WHERE t.fecha_tiquet >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
  AND c.activo = 'S';
```

#### Query de Lectura
```sql
SELECT
    c.id_cliente,
    c.tipo_doc,
    COALESCE(c.nif, c.ruc, c.dni) AS documento,
    COALESCE(c.razon_social, c.nombre) AS nombre,
    c.email,
    c.telefono,
    c.direccion,
    c.activo
FROM cliente c
WHERE EXISTS (
    SELECT 1 FROM tiquet t
    WHERE (t.dni = c.nif OR t.dni = c.ruc OR t.dni = c.dni)
      AND t.fecha_tiquet >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
)
ORDER BY c.id_cliente;
```

#### Transformaciones

| Campo Legacy | Campo Nuevo | Transformación | Validación |
|--------------|-------------|----------------|------------|
| id_cliente | legacyId | = id_cliente | NOT NULL |
| tipo_doc | documentType | mapDocumentType(tipo_doc) | ENUM |
| nif/ruc/dni | documentNumber | COALESCE(nif, ruc, dni) | UNIQUE combo |
| razon_social/nombre | name | COALESCE, CONVERT utf8mb4 | NOT NULL |
| email | email | LOWER(TRIM(email)) | - |
| telefono | phone | TRIM(telefono) | - |
| direccion | address | CONVERT utf8mb4 | - |
| activo | isActive | 'S'→TRUE, 'N'→FALSE | NOT NULL |

#### Mapeo de Tipo de Documento
```javascript
function mapDocumentType(tipo: string): CustomerDocumentType {
  const upper = tipo.trim().toUpperCase();

  if (upper.includes('RUC') || upper === 'R') return 'ruc';
  if (upper.includes('DNI') || upper === 'D') return 'dni';
  if (upper.includes('PASS') || upper === 'P') return 'passport';

  return 'other';
}
```

#### Validación Especial
```typescript
// UNIQUE(documentType, documentNumber)
const existing = await prisma.customer.findUnique({
  where: {
    unique_doc: {
      documentType,
      documentNumber
    }
  }
});

if (existing) {
  logger.skip(`Customer already exists: ${documentType} ${documentNumber}`);
  continue;
}
```

#### Manejo de Errores
- **Error Bloqueante:** documento vacío, nombre vacío, duplicado de (documentType, documentNumber)
- **Error No Bloqueante:** email inválido, teléfono vacío

#### Logs Esperados
```
[CUSTOMERS] Inicio migración
[CUSTOMERS] Filtrando clientes con facturas últimos 12 meses...
[CUSTOMERS] Leyendo 45 clientes de legacy...
[CUSTOMERS] ✓ Insertado: id=1, doc=DNI 12345678, name="Juan Cliente"
[CUSTOMERS] ⊘ Skip: Cliente ya existe DNI 87654321
[CUSTOMERS] Total migrado: 44 / 45 (97.8%)
[CUSTOMERS] Skipped: 1 duplicados
[CUSTOMERS] Tiempo: 0.4s
```

---

## 🎯 CONTINÚA EN SIGUIENTE ARCHIVO

**Razón:** El documento es muy extenso. La siguiente parte contendrá:

- FASE 2: products, product_prices, tables
- FASE 3: cash_register_shifts, orders, order_items, payments, invoices
- FASE 4: Validaciones
- Manejo de errores global
- Estructura del proyecto ETL
- Estrategias de batch processing
- Idempotencia

---

**FIN DE PARTE 1**

Estado: ✅ FASE 1 DISEÑADA (8 tablas maestras)
Pendiente: Fases 2, 3, 4
