# SCHEMA PRISMA - Campos de Trazabilidad Legacy

**Fecha:** 2025-12-15
**Fase:** Fase 4 - Paso 4.0 (Prerrequisito ETL)
**Objetivo:** Agregar campos `legacy_id` y similares para trazabilidad de migración

---

## 🎯 RESUMEN

Según MIGRATION-STRATEGY.md, todas las tablas migradas deben incluir campos de trazabilidad que guarden el ID original del sistema legacy. Esto permite:

1. Debugging de migración
2. Mapeo reversible
3. Re-ejecución idempotente
4. Auditoría de origen de datos

---

## 📋 CAMBIOS NECESARIOS POR MODELO

### 1. Order
```prisma
model Order {
  id                   BigInt       @id @default(autoincrement())
  legacyId             BigInt?      @map("legacy_id")  // ← AGREGAR
  orderNumber          String       @unique @map("order_number") @db.VarChar(20)
  // ... resto del modelo

  @@index([legacyId])  // ← AGREGAR índice
  @@map("orders")
}
```

**Migración desde:** `ventadirecta.id_venta`

---

### 2. OrderItem
```prisma
model OrderItem {
  id                   BigInt           @id @default(autoincrement())
  legacyId             BigInt?          @map("legacy_id")  // ← AGREGAR
  // ... resto del modelo

  @@index([legacyId])  // ← AGREGAR índice
  @@map("order_items")
}
```

**Migración desde:** `ventadir_comg.id_linea`

---

### 3. Product
```prisma
model Product {
  id                   BigInt          @id @default(autoincrement())
  legacyId             BigInt?          @map("legacy_id")   // ← AGREGAR
  legacySku            String?          @map("legacy_sku") @db.VarChar(50)  // ← AGREGAR (importante para lookups)
  sku                  String          @unique @db.VarChar(50)
  // ... resto del modelo

  @@index([legacyId])      // ← AGREGAR índice
  @@index([legacySku])     // ← AGREGAR índice
  @@map("products")
}
```

**Migración desde:** `complementog.id_complementog` (ambos campos)

---

### 4. Category
```prisma
model Category {
  id                   BigInt       @id @default(autoincrement())
  legacyCode           String?      @map("legacy_code") @db.VarChar(20)  // ← AGREGAR
  code                 String       @unique @db.VarChar(20)
  // ... resto del modelo

  @@index([legacyCode])  // ← AGREGAR índice
  @@map("categories")
}
```

**Migración desde:** `tipo_comg.id_tipo_comg`

---

### 5. PriceTier
```prisma
model PriceTier {
  id                   BigInt          @id @default(autoincrement())
  legacyCode           String?          @map("legacy_code") @db.VarChar(20)  // ← AGREGAR
  code                 String          @unique @db.VarChar(20)
  // ... resto del modelo

  @@index([legacyCode])  // ← AGREGAR índice
  @@map("price_tiers")
}
```

**Migración desde:** `tarifa.id_tarifa`

---

### 6. Table
```prisma
model Table {
  id                   BigInt       @id @default(autoincrement())
  legacyTableNumber    String?      @map("legacy_table_number") @db.VarChar(20)  // ← AGREGAR
  tableNumber          String       @map("table_number") @db.VarChar(20)
  // ... resto del modelo

  @@index([legacyTableNumber])  // ← AGREGAR índice
  @@map("tables")
}
```

**Migración desde:** `mesa.num_mesa`

---

### 7. Room
```prisma
model Room {
  id                   BigInt       @id @default(autoincrement())
  legacyCode           String?      @map("legacy_code") @db.VarChar(20)  // ← AGREGAR
  code                 String       @unique @db.VarChar(20)
  // ... resto del modelo

  @@index([legacyCode])  // ← AGREGAR índice
  @@map("rooms")
}
```

**Migración desde:** `salon.id_salon`

---

### 8. CashRegister
```prisma
model CashRegister {
  id                   BigInt                @id @default(autoincrement())
  legacyId             BigInt?                @map("legacy_id")  // ← AGREGAR
  code                 String                @unique @db.VarChar(20)
  // ... resto del modelo

  @@index([legacyId])  // ← AGREGAR índice
  @@map("cash_registers")
}
```

**Migración desde:** `cajas.id_caja`

---

### 9. CashRegisterShift
```prisma
model CashRegisterShift {
  id                   BigInt       @id @default(autoincrement())
  legacyId             BigInt?      @map("legacy_id")  // ← AGREGAR
  // ... resto del modelo

  @@index([legacyId])  // ← AGREGAR índice
  @@map("cash_register_shifts")
}
```

**Migración desde:** `apcajas.id_apcajas`

---

### 10. Payment
```prisma
model Payment {
  id                   BigInt        @id @default(autoincrement())
  legacyId             BigInt?        @map("legacy_id")  // ← AGREGAR
  // ... resto del modelo

  @@index([legacyId])  // ← AGREGAR índice
  @@map("payments")
}
```

**Migración desde:** `pagoscobros.id_pagoscobros`

---

### 11. PaymentMethod
```prisma
model PaymentMethod {
  id                   BigInt       @id @default(autoincrement())
  legacyCode           String?      @map("legacy_code") @db.VarChar(20)  // ← AGREGAR
  code                 String       @unique @db.VarChar(20)
  // ... resto del modelo

  @@index([legacyCode])  // ← AGREGAR índice
  @@map("payment_methods")
}
```

**Migración desde:** `modo_pago.id_modo_pago`

---

### 12. Invoice
```prisma
model Invoice {
  id                   BigInt         @id @default(autoincrement())
  legacyId             BigInt?         @map("legacy_id")  // ← AGREGAR
  legacySeries         String?         @map("legacy_series") @db.VarChar(10)  // ← AGREGAR
  // ... resto del modelo

  @@index([legacyId])      // ← AGREGAR índice
  @@index([legacySeries])  // ← AGREGAR índice
  @@map("invoices")
}
```

**Migración desde:** `tiquet.id_tiquet` + `tiquet.serie`

---

### 13. Employee
```prisma
model Employee {
  id                   BigInt                @id @default(autoincrement())
  legacyId             BigInt?                @map("legacy_id")  // ← AGREGAR
  employeeCode         String                @unique @map("employee_code") @db.VarChar(20)
  // ... resto del modelo

  @@index([legacyId])  // ← AGREGAR índice
  @@map("employees")
}
```

**Migración desde:** `camareros.id_camarero`

---

### 14. Customer
```prisma
model Customer {
  id                   BigInt               @id @default(autoincrement())
  legacyId             BigInt?               @map("legacy_id")  // ← AGREGAR
  // ... resto del modelo

  @@index([legacyId])  // ← AGREGAR índice
  @@map("customers")
}
```

**Migración desde:** `cliente.id_cliente`

---

## ❌ MODELOS SIN LEGACY (No Migrados)

Estos modelos NO tienen equivalente legacy, por lo tanto NO necesitan `legacy_id`:

### KitchenQueue
- **Razón:** Cola operativa, no se migra histórico

### KitchenStation
- **Razón:** No existe en legacy, se crean estaciones por defecto

### ProductPrice
- **Razón:** Aunque se migra desde `comg_tarifa`, no tiene ID legacy propio (es relación)
- **Nota:** NO necesita `legacy_id`, la relación se resuelve por FKs

---

## 📊 RESUMEN DE CAMBIOS

| Modelo | Campo Legacy | Tipo | Índice |
|--------|--------------|------|--------|
| Order | `legacyId` | BigInt? | ✅ |
| OrderItem | `legacyId` | BigInt? | ✅ |
| Product | `legacyId` + `legacySku` | BigInt? + String? | ✅ ambos |
| Category | `legacyCode` | String? | ✅ |
| PriceTier | `legacyCode` | String? | ✅ |
| Table | `legacyTableNumber` | String? | ✅ |
| Room | `legacyCode` | String? | ✅ |
| CashRegister | `legacyId` | BigInt? | ✅ |
| CashRegisterShift | `legacyId` | BigInt? | ✅ |
| Payment | `legacyId` | BigInt? | ✅ |
| PaymentMethod | `legacyCode` | String? | ✅ |
| Invoice | `legacyId` + `legacySeries` | BigInt? + String? | ✅ ambos |
| Employee | `legacyId` | BigInt? | ✅ |
| Customer | `legacyId` | BigInt? | ✅ |

**Total:** 14 modelos modificados, 17 campos agregados, 17 índices agregados

---

## ✅ APLICACIÓN DE CAMBIOS

### Paso 1: Actualizar schema.prisma

Agregar todos los campos listados arriba a `backend/prisma/schema.prisma`

### Paso 2: Generar migración
```bash
cd D:/pos_venta/backend
npx prisma migrate dev --name add_legacy_traceability_fields
```

### Paso 3: Verificar migración
```bash
npx prisma migrate status
```

### Paso 4: Generar Prisma Client actualizado
```bash
npx prisma generate
```

---

## 🔍 VALIDACIÓN POST-MIGRACIÓN

Después de aplicar la migración, verificar que todas las columnas existan:

```sql
-- PostgreSQL
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%legacy%'
ORDER BY table_name, column_name;
```

**Resultado esperado:** 17 filas (todos los campos legacy agregados)

---

## 📌 IMPORTANCIA

**SIN estos campos, el ETL NO puede funcionar correctamente:**

1. ❌ No hay forma de mapear IDs legacy → nuevos
2. ❌ No se puede hacer re-ejecución idempotente
3. ❌ No hay trazabilidad de migración
4. ❌ No se pueden debuggear errores de FK
5. ❌ No se puede auditar origen de datos

**CON estos campos:**

1. ✅ Mapeo completo legacy ↔ nuevo
2. ✅ Re-ejecución segura (detectar duplicados)
3. ✅ Trazabilidad total
4. ✅ Debugging fácil de errores
5. ✅ Auditoría de origen

---

**FIN DE DOCUMENTACIÓN**

Estado: ✅ DOCUMENTADO
Acción Siguiente: Aplicar cambios a schema.prisma y ejecutar migración
