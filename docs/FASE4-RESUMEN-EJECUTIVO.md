# FASE 4 - ETL (MIGRACIÓN DE DATOS) - RESUMEN EJECUTIVO

**Fecha:** 2025-12-15
**Estado:** DISEÑO COMPLETO ✅ | IMPLEMENTACIÓN EN PROGRESO 🔄

---

## 🎯 OBJETIVO DE LA FASE

Migrar datos del sistema legacy (MySQL latin1) al nuevo sistema (PostgreSQL utf8mb4) de forma controlada, validada y con trazabilidad completa.

---

## ✅ TRABAJO COMPLETADO

### 1. DOCUMENTACIÓN DE DISEÑO COMPLETA

#### ETL-DESIGN.md (Parte 1)
**Contenido:** Fase 1 - Datos Maestros sin Dependencias

- ✅ Rooms (salones) - Query, transformaciones, manejo de errores
- ✅ Categories (categorías) - Generación de códigos, jerarquía
- ✅ Price Tiers (tarifas) - Validación de tarifa default
- ✅ Payment Methods (métodos pago) - Detección de requiresReference
- ✅ Cash Registers (cajas) - Mapeo directo
- ✅ Kitchen Stations (estaciones) - Creación por defecto (no legacy)
- ✅ Employees (empleados) - Split de nombre, mapeo de roles
- ✅ Customers (clientes) - Solo con facturas recientes (12 meses)

**Total:** 8 tablas maestras diseñadas

---

#### ETL-DESIGN-PART2.md
**Contenido:** Fases 2, 3, 4 + Estrategias Globales

**Fase 2 - Datos Maestros con Relaciones:**
- ✅ Products (productos) - Procesamiento de stocks negativos (CRÍTICO)
- ✅ Product Prices (precios por tarifa) - Validación de duplicados
- ✅ Tables (mesas) - Mapeo de estados

**Fase 3 - Datos Transaccionales (12 meses):**
- ✅ Cash Register Shifts (turnos de caja) - 6 meses
- ✅ Orders (órdenes) - Solo cerradas, últimos 12 meses
- ✅ Order Items (líneas de productos) - Validación de cantidades
- ✅ Payments (pagos) - Solo tipo='E' (cobros)
- ✅ Invoices (comprobantes) - Detección de tipo por serie

**Fase 4 - Validaciones:**
- ✅ Validar totales (suma items = total orden)
- ✅ Validar relaciones (FKs no rotas)
- ✅ Reportes de comparación (legacy vs nuevo)

**Estrategias Globales:**
- ✅ Manejo de errores (bloqueantes vs no-bloqueantes)
- ✅ Batch processing (tamaños de lote por tabla)
- ✅ Idempotencia (re-ejecución segura)
- ✅ Estructura del proyecto ETL
- ✅ Logs estructurados

**Total:** 8 tablas adicionales + validaciones + estrategias

---

### 2. DOCUMENTACIÓN DE CAMPOS LEGACY

#### SCHEMA-LEGACY-FIELDS.md
**Contenido:** Campos de trazabilidad necesarios

- ✅ Documentación de 14 modelos a modificar
- ✅ Especificación de 17 campos legacy a agregar
- ✅ 17 índices para lookups rápidos
- ✅ Justificación de cada campo
- ✅ Validación post-migración

**Modelos documentados:**
1. Order → `legacyId`
2. OrderItem → `legacyId`
3. Product → `legacyId` + `legacySku`
4. Category → `legacyCode`
5. PriceTier → `legacyCode`
6. Table → `legacyTableNumber`
7. Room → `legacyCode`
8. CashRegister → `legacyId`
9. CashRegisterShift → `legacyId`
10. Payment → `legacyId`
11. PaymentMethod → `legacyCode`
12. Invoice → `legacyId` + `legacySeries`
13. Employee → `legacyId`
14. Customer → `legacyId`

---

### 3. SCRIPT SQL DE MIGRACIÓN

#### add_legacy_fields.sql
**Contenido:** Script listo para ejecutar

- ✅ 14 `ALTER TABLE` statements
- ✅ 17 `CREATE INDEX` statements
- ✅ Query de verificación incluida
- ✅ Idempotente (IF NOT EXISTS)

**Ejecución:**
```bash
psql -d pos_db -f backend/prisma/migrations/add_legacy_fields.sql
```

---

## 📊 ESTADÍSTICAS DEL DISEÑO

### Tablas a Migrar
```
Fase 1: 8 tablas (maestros sin dependencias)
Fase 2: 3 tablas (maestros con relaciones)
Fase 3: 5 tablas (transaccionales)
Total:  16 tablas
```

### Volumen Estimado de Datos
```
Maestros:           ~500 registros
Productos:          ~250 productos + ~750 precios
Transaccionales:    ~34,000 registros (órdenes + items + pagos)
Total:              ~35,500 registros
```

### Tiempo Estimado
```
Fase 1:  2-3 min
Fase 2:  3-5 min
Fase 3:  60-90 min
Fase 4:  10-15 min
Total:   75-110 min (dentro de ventana de 4 horas)
```

---

## 📋 ORDEN DE MIGRACIÓN (4 FASES)

### FASE 1: Maestros Sin Dependencias
1. rooms
2. categories
3. price_tiers
4. payment_methods
5. cash_registers
6. kitchen_stations
7. employees
8. customers

### FASE 2: Maestros Con Relaciones
9. products (depende: categories)
10. product_prices (depende: products, price_tiers)
11. tables (depende: rooms)

### FASE 3: Transaccionales
12. cash_register_shifts (depende: cash_registers, employees)
13. orders (depende: tables, employees, shifts)
14. order_items (depende: orders, products)
15. payments (depende: orders, methods, shifts, employees)
16. invoices (depende: orders, customers)

### FASE 4: Validaciones
17. Validar totales
18. Validar relaciones (FKs)
19. Reportes de comparación

---

## 🔍 TRANSFORMACIONES CLAVE DOCUMENTADAS

### Generación de Códigos
- **Room codes:** `SALON_PRINCIPAL`, `TERRAZA`, `BAR`
- **Category codes:** `COCKTAILS`, `APPETIZERS`, `CEVICHES`, `MAIN_DISHES`
- **Payment codes:** `CASH`, `CREDIT_CARD`, `DEBIT_CARD`

### Mapeos de Enums
- **Roles:** `Camarero` → `waiter`, `Cajero` → `cashier`, etc.
- **Table Status:** `libre` → `available`, `ocupada` → `occupied`
- **Document Type:** Serie `F*` → `factura`, `B*` → `boleta`, `T*` → `ticket`

### Procesamiento Especial
- **Stocks negativos:** Resetear a 0, `tracks_inventory = false` (¡CRÍTICO!)
- **Split de nombres:** `"Juan Pérez"` → `firstName: "Juan"`, `lastName: "Pérez"`
- **Order Numbers:** `#YYYYMMDD-NNNN` (ej: `#20250115-0001`)

---

## 🚨 MANEJO DE ERRORES DOCUMENTADO

### Errores Bloqueantes (Detener)
- FK no resuelta
- Fecha inválida (0000-00-00)
- Total orden != suma items (diff > 5%)
- Duplicado PK/UK
- Charset no convertible

**Acción:** Log → `errors-blocking.json` → DETENER tabla

### Errores No Bloqueantes (Skip)
- Campos opcionales NULL
- Diferencia totales < 1%
- customerId no encontrado (solo warning)

**Acción:** Log → `warnings.json` → CONTINUAR

### Registros Huérfanos
- Items sin orden
- Pagos sin orden
- Facturas sin orden

**Acción:** Log → `orphans.json` → SKIP → Reporte final

---

## 💾 BATCH PROCESSING

### Tamaños de Lote Definidos
```typescript
rooms: 100
employees: 50
products: 100
orders: 100
order_items: 500
payments: 200
invoices: 200
```

### Estrategia
- Procesar en transacciones por lote
- Progress logging cada lote
- Continuar en caso de error no-bloqueante
- Rollback solo del lote fallido (no todo)

---

## 🔄 IDEMPOTENCIA

### Estrategia
```typescript
// Buscar por legacy_id ANTES de insertar
const existing = await prisma.table.findFirst({
  where: { legacyId: data.legacyId }
});

if (existing) {
  logger.skip(`Already migrated: ${data.legacyId}`);
  return existing.id;
}

// Insertar solo si no existe
const created = await prisma.table.create({ data });
return created.id;
```

### Beneficios
- ✅ Re-ejecución segura
- ✅ Continuar desde punto de falla
- ✅ No duplicar datos
- ✅ Debugging fácil

---

## 📁 ESTRUCTURA DEL PROYECTO ETL (Diseñada)

```
backend/etl/
├── src/
│   ├── index.ts                    # Entry point
│   ├── config/
│   │   ├── legacy-db.ts            # MySQL (READ ONLY)
│   │   ├── new-db.ts               # Prisma (PostgreSQL)
│   │   └── constants.ts            # Batch sizes, maps
│   ├── migrators/
│   │   ├── phase1/                 # 8 archivos
│   │   ├── phase2/                 # 3 archivos
│   │   ├── phase3/                 # 5 archivos
│   │   └── phase4/                 # 3 archivos validación
│   ├── utils/
│   │   ├── logger.ts               # Winston
│   │   ├── transformers.ts         # Funciones transformación
│   │   ├── validators.ts           # Validaciones
│   │   └── batch-processor.ts      # Lógica de lotes
│   └── types/
│       └── legacy.ts               # Tipos legacy
├── logs/
│   ├── migration.log
│   ├── errors-blocking.json
│   ├── warnings.json
│   └── orphans.json
├── package.json
├── tsconfig.json
└── README.md
```

---

## ✅ CRITERIOS DE ÉXITO (Documentados)

### Migración Exitosa Si:
1. **Integridad:** 100% de FKs resueltas
2. **Completitud:** >95% de registros migrados
3. **Exactitud:** Diferencia de totales < 1%
4. **Performance:** Queries órdenes < 500ms
5. **Operación:** Primera venta exitosa en nuevo sistema

### Migración Fallida Si:
1. FKs rotas > 0
2. Registros migrados < 90%
3. Diferencia totales > 5%
4. Sistema nuevo no permite crear orden
5. No se puede cobrar una orden

---

## 📌 SIGUIENTES PASOS (IMPLEMENTACIÓN)

### PASO 4.2 - Implementación en TypeScript

1. **Setup proyecto ETL**
   ```bash
   cd D:/pos_venta/backend
   mkdir -p etl/src/{config,migrators/{phase1,phase2,phase3,phase4},utils,types}
   cd etl
   npm init -y
   npm install mysql2 @prisma/client winston dotenv
   npm install -D typescript @types/node tsx
   ```

2. **Configurar TypeScript** (`tsconfig.json`)

3. **Implementar conexiones DB**
   - `config/legacy-db.ts` - MySQL READ ONLY
   - `config/new-db.ts` - Prisma client

4. **Implementar utils**
   - `utils/logger.ts` - Sistema de logs
   - `utils/transformers.ts` - Funciones de transformación
   - `utils/validators.ts` - Validaciones
   - `utils/batch-processor.ts` - Procesamiento por lotes

5. **Implementar migrators** (19 archivos)
   - Fase 1: 8 archivos
   - Fase 2: 3 archivos
   - Fase 3: 5 archivos
   - Fase 4: 3 archivos

6. **Implementar entry point** (`index.ts`)
   - Orquestador principal
   - Ejecución secuencial de fases
   - Manejo de errores global
   - Resumen final

### PASO 4.3 - Validación

1. **Aplicar campos legacy** (SQL ya creado)
2. **Ejecutar migración en DEV**
3. **Validar resultados**
4. **Generar ETL-VALIDATION.md**

---

## 📊 MÉTRICAS DE PROGRESO FASE 4

### Diseño (Paso 4.1) ✅ COMPLETADO 100%
- [x] ETL-DESIGN.md (Parte 1)
- [x] ETL-DESIGN-PART2.md
- [x] SCHEMA-LEGACY-FIELDS.md
- [x] add_legacy_fields.sql
- [x] Estrategias globales documentadas

### Implementación (Paso 4.2) 🔄 PENDIENTE
- [ ] Setup proyecto ETL
- [ ] Config DB (legacy + nuevo)
- [ ] Utils (logger, transformers, validators, batch)
- [ ] Migrators Fase 1 (8 archivos)
- [ ] Migrators Fase 2 (3 archivos)
- [ ] Migrators Fase 3 (5 archivos)
- [ ] Migrators Fase 4 (3 validaciones)
- [ ] Entry point orquestador
- [ ] README del proyecto ETL

### Validación (Paso 4.3) 🔄 PENDIENTE
- [ ] Aplicar campos legacy a schema
- [ ] Ejecutar migración en DEV
- [ ] Validar totales
- [ ] Validar FKs
- [ ] Reportes de comparación
- [ ] ETL-VALIDATION.md

---

## 🎯 ENTREGABLES DE FASE 4

### Documentación ✅ COMPLETADA
- [x] ETL-DESIGN.md
- [x] ETL-DESIGN-PART2.md
- [x] SCHEMA-LEGACY-FIELDS.md
- [x] FASE4-RESUMEN-EJECUTIVO.md (este documento)

### Scripts ✅ COMPLETADOS
- [x] add_legacy_fields.sql

### Código 🔄 PENDIENTE
- [ ] Proyecto ETL completo (backend/etl/)
- [ ] Scripts de validación
- [ ] Logs de ejemplo

### Documentación Final 🔄 PENDIENTE
- [ ] ETL-VALIDATION.md
- [ ] README de ejecución

---

## 🚀 ESTADO ACTUAL

**FASE 4 - DISEÑO:** ✅ 100% COMPLETADO

**Documentos creados:** 4
**Scripts creados:** 1
**Tablas diseñadas:** 16/16
**Queries documentadas:** 16
**Transformaciones definidas:** ~80
**Validaciones especificadas:** 20+
**Estrategias documentadas:** 4 (errores, batch, idempotencia, logs)

**Listo para:** Implementación en TypeScript

---

## 📖 ÍNDICE DE DOCUMENTOS FASE 4

1. **ETL-DESIGN.md** - Fase 1 completa (8 tablas maestras)
2. **ETL-DESIGN-PART2.md** - Fases 2, 3, 4 + estrategias globales
3. **SCHEMA-LEGACY-FIELDS.md** - Campos de trazabilidad (14 modelos)
4. **add_legacy_fields.sql** - Script de migración SQL
5. **FASE4-RESUMEN-EJECUTIVO.md** - Este documento (resumen completo)

---

**FIN DEL RESUMEN EJECUTIVO**

Estado: ✅ DISEÑO COMPLETO
Siguiente: Implementación en TypeScript (Paso 4.2)
Tiempo de diseño: ~2 horas
Líneas de documentación: ~2,000 líneas
