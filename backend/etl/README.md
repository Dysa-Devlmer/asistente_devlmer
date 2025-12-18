# ETL Migration - Legacy MySQL → New PostgreSQL

**Fecha:** 2025-12-15
**Versión:** 1.0.0
**Estrategia:** Big Bang Controlado (Ventana de mantenimiento: 4 horas)

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Prerrequisitos](#prerrequisitos)
3. [Instalación](#instalación)
4. [Configuración](#configuración)
5. [Ejecución](#ejecución)
6. [Validación](#validación)
7. [Logs y Reportes](#logs-y-reportes)
8. [Rollback](#rollback)
9. [Troubleshooting](#troubleshooting)

---

## 📖 Descripción General

Este proyecto ETL migra datos del sistema legacy (MySQL, `sysmehotel`) al nuevo sistema POS (PostgreSQL, `pos_db`).

### Alcance de Migración

- **Datos Maestros:** 100% (rooms, categories, employees, products, etc.)
- **Datos Transaccionales:** Últimos 12 meses (órdenes, pagos, facturas)
- **Cash Shifts:** Últimos 6 meses
- **Clientes:** Solo con facturas en últimos 12 meses

### Fases de Migración

1. **Fase 1:** Maestros sin dependencias (8 tablas)
2. **Fase 2:** Maestros con relaciones (3 tablas)
3. **Fase 3:** Transaccionales (5 tablas)
4. **Fase 4:** Validaciones y reportes

### Tiempo Estimado

- **Total:** 75-110 minutos
- **Fase 1:** 2-3 min
- **Fase 2:** 3-5 min
- **Fase 3:** 60-90 min
- **Fase 4:** 10-15 min

---

## ✅ Prerrequisitos

### 1. Campos Legacy en Schema

**IMPORTANTE:** Antes de ejecutar la migración, debes agregar los campos de trazabilidad al schema Prisma.

#### Opción A: SQL Directo (Recomendado)
```bash
# Desde: D:/pos_venta/backend
psql -d pos_db -U postgres -f prisma/migrations/add_legacy_fields.sql
```

#### Opción B: Script Node.js
```bash
# Desde: D:/pos_venta/backend
node add-legacy-fields.js
npx prisma format
npx prisma migrate dev --name add_legacy_traceability_fields
npx prisma generate
```

#### Verificar
```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name LIKE '%legacy%'
ORDER BY table_name, column_name;
```

**Resultado esperado:** 17 filas (legacy_id, legacy_code, legacy_sku, etc.)

### 2. Bases de Datos

- **Legacy DB:** MySQL 5.x, `sysmehotel`, accesible en red
- **New DB:** PostgreSQL 14+, `pos_db`, vacío o con datos de prueba

### 3. Backups

**CRÍTICO:** Realizar backup COMPLETO de ambas bases antes de migrar.

```bash
# Backup legacy (MySQL)
E:/POS\ SYSME/Sysme_Principal/SYSME/sysmeserver/bin/mysqldump.exe \
  -u root -p sysmehotel > backup_legacy_pre_migration.sql

# Backup new (PostgreSQL)
pg_dump -U postgres pos_db > backup_new_pre_migration.sql
```

### 4. Software

- Node.js 18+
- PostgreSQL 14+
- Acceso a MySQL legacy (solo lectura)

---

## 🔧 Instalación

```bash
# 1. Navegar al proyecto ETL
cd D:/pos_venta/backend/etl

# 2. Instalar dependencias
npm install

# 3. Compilar TypeScript
npm run build
```

---

## ⚙️ Configuración

### 1. Crear archivo .env

```bash
# Copiar ejemplo
cp .env.example .env
```

### 2. Editar .env

```env
# Legacy MySQL Database (READ-ONLY)
LEGACY_DB_HOST=192.168.1.100
LEGACY_DB_PORT=3306
LEGACY_DB_USER=root
LEGACY_DB_PASSWORD=tu_password_legacy
LEGACY_DB_NAME=sysmehotel

# New PostgreSQL Database (via Prisma)
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/pos_db?schema=public"

# Migration Settings
BATCH_SIZE_DEFAULT=100
DRY_RUN=false
LOG_LEVEL=info
```

### 3. Verificar Conexiones

```bash
# Test legacy connection
npm run dev -- --test-legacy

# Test new connection
npm run dev -- --test-new
```

---

## 🚀 Ejecución

### Ejecución Completa (Producción)

```bash
cd D:/pos_venta/backend/etl
npm run migrate
```

**Salida esperada:**
```
═══════════════════════════════════════════════════════════════════
🚀 ETL MIGRATION - Legacy MySQL → New PostgreSQL
═══════════════════════════════════════════════════════════════════

📡 Connecting to databases...
✅ Connected to both databases

═══════════════════════════════════════════════════════════════════
🚀 PHASE START: PHASE 1.1 - Rooms
═══════════════════════════════════════════════════════════════════

🏛️  Migrating Rooms (salon → rooms)...
Found 3 active rooms in legacy DB
📦 Starting batch processing: rooms (3 records)
...
✅ Rooms migration complete. Map size: 3

═══════════════════════════════════════════════════════════════════
✅ PHASE COMPLETE: PHASE 1.1
   Migrated: 3
   Skipped:  0
   Errors:   0
═══════════════════════════════════════════════════════════════════

[... continues for all phases ...]

═══════════════════════════════════════════════════════════════════
✅ MIGRATION COMPLETED SUCCESSFULLY
═══════════════════════════════════════════════════════════════════

📊 Total Duration: 87m 23s

Phase Summary:
   PHASE 1.1: 0m 2s
   PHASE 1.2: 0m 1s
   PHASE 1.3: 0m 1s
   ...
   PHASE 4.3: 0m 15s

✅ All data migrated and validated
✅ System ready for production
```

### Modo Desarrollo (Watch)

```bash
npm run dev
```

### Solo Compilar

```bash
npm run build
```

---

## ✅ Validación

### Validación Independiente

Puedes ejecutar validaciones SIN ejecutar la migración completa:

```bash
npm run validate
```

Esto ejecuta:
1. Validación de totales (order.total vs SUM(items.subtotal))
2. Validación de FKs (todas las relaciones resueltas)
3. Comparación Legacy vs New (conteo de registros)

### Validación Manual

```sql
-- 1. Contar registros migrados
SELECT 'rooms' as table, COUNT(*) as count FROM rooms
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items;

-- 2. Verificar campos legacy poblados
SELECT COUNT(*) FROM orders WHERE legacy_id IS NOT NULL;

-- 3. Verificar integridad FK
SELECT
  oi.id,
  oi.order_id,
  o.id as order_exists
FROM order_items oi
LEFT JOIN orders o ON o.id = oi.order_id
WHERE o.id IS NULL;
-- Resultado esperado: 0 rows

-- 4. Validar totales de órdenes
SELECT
  o.id,
  o.order_number,
  o.total as order_total,
  SUM(oi.subtotal) as items_total,
  ABS(o.total - SUM(oi.subtotal)) as diff
FROM orders o
INNER JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.order_number, o.total
HAVING ABS(o.total - SUM(oi.subtotal)) > 1.00;
-- Resultado esperado: 0 rows (o muy pocos con diferencias mínimas)
```

---

## 📊 Logs y Reportes

### Ubicación de Logs

```
backend/etl/logs/
├── migration.log              # Log principal (todo)
├── error.log                  # Solo errores
├── errors-blocking.json       # Errores bloqueantes (detallado)
├── warnings.json              # Advertencias (detallado)
├── orphans.json               # Registros huérfanos (FKs no resueltas)
├── validation-totals.json     # Reporte validación de totales
├── validation-relationships.json  # Reporte validación FKs
└── validation-comparison.json # Comparación Legacy vs New
```

### Formato de Logs

**migration.log:**
```
2025-12-15 10:30:45 [info]: 🏛️  Migrating Rooms (salon → rooms)...
2025-12-15 10:30:45 [info]: Found 3 active rooms in legacy DB
2025-12-15 10:30:46 [info]: ✅ Rooms migration complete. Map size: 3
```

**errors-blocking.json:**
```json
[
  {
    "table": "orders",
    "legacyId": 12345,
    "error": "Foreign key constraint failed: employee_id=99 not found",
    "stack": "...",
    "data": { "id_venta": 12345, "id_camarero": 99 }
  }
]
```

### Interpretar Reportes

**validation-totals.json:**
```json
[
  {
    "orderId": "123",
    "orderNumber": "#20250115-0042",
    "orderTotal": 125.50,
    "itemsTotal": 125.50,
    "diff": 0.00,
    "diffPercent": 0.00,
    "status": "OK"
  },
  {
    "orderId": "456",
    "orderNumber": "#20250115-0043",
    "orderTotal": 89.00,
    "itemsTotal": 88.75,
    "diff": 0.25,
    "diffPercent": 0.28,
    "status": "WARNING"
  }
]
```

- **OK:** Diferencia < 1%
- **WARNING:** Diferencia 1-5%
- **ERROR:** Diferencia > 5%

---

## 🔄 Rollback

### Si la Migración Falla

1. **Detener migración** (Ctrl+C si está ejecutando)

2. **Restaurar backup de la base nueva:**
```bash
# Eliminar base nueva
psql -U postgres -c "DROP DATABASE pos_db;"

# Recrear base
psql -U postgres -c "CREATE DATABASE pos_db;"

# Restaurar backup
psql -U postgres pos_db < backup_new_pre_migration.sql
```

3. **Analizar logs:**
```bash
# Ver errores bloqueantes
cat logs/errors-blocking.json | jq

# Ver últimas líneas del log principal
tail -n 100 logs/migration.log
```

4. **Corregir problema y re-ejecutar**

### Si la Migración Tuvo Éxito pero Hay Problemas en Producción

**NO TOCAR LEGACY.** El sistema legacy queda como respaldo.

1. Detener tráfico al nuevo sistema
2. Analizar problema en logs/validaciones
3. Si es necesario, volver temporalmente a TPV legacy mientras se corrige
4. Corregir datos en nuevo sistema (SQL manual o re-migración)
5. Re-validar

---

## 🔧 Troubleshooting

### Error: "Connection refused" (Legacy DB)

**Causa:** No se puede conectar a MySQL legacy

**Solución:**
1. Verificar IP/puerto en `.env`
2. Verificar que MySQL legacy esté ejecutando
3. Verificar firewall/permisos de red
4. Verificar usuario/password

```bash
# Test manual
mysql -h 192.168.1.100 -u root -p sysmehotel
```

### Error: "Foreign key constraint failed"

**Causa:** FK no resuelta (registro padre no existe)

**Solución:**
1. Revisar `logs/orphans.json` para ver qué FKs fallan
2. Verificar que las fases anteriores completaron correctamente
3. Si es sistemático, revisar filtros en queries legacy

### Error: "Duplicate key value violates unique constraint"

**Causa:** Registro ya existe (violación de idempotencia)

**Solución:**
1. Verificar que `legacy_id` esté poblado correctamente
2. Si es re-ejecución, la migración debería skipear automáticamente
3. Si falla, limpiar datos parciales y re-ejecutar

### Warning: "Negative stock reset to 0"

**Causa:** Stock negativo en legacy (esperado)

**Solución:**
- **No es un error.** Los stocks negativos son contadores de ventas, no inventario
- Se resetean a 0 automáticamente
- Se deshabilita `tracks_inventory` para estos productos

### Error: "Order total mismatch > 5%"

**Causa:** Diferencia significativa entre `order.total` y `SUM(items.subtotal)`

**Solución:**
1. Revisar `logs/validation-totals.json`
2. Verificar datos en legacy:
```sql
SELECT
  vd.id_venta,
  vd.total,
  SUM(vc.subtotal) as items_total
FROM ventadirecta vd
INNER JOIN ventadir_comg vc ON vc.id_venta = vd.id_venta
WHERE vd.id_venta = 12345
GROUP BY vd.id_venta, vd.total;
```
3. Si el error existe en legacy, documentar y continuar
4. Si es error de migración, corregir transformación

### Performance: Migración muy lenta

**Causa:** Lotes muy grandes o conexión lenta

**Solución:**
1. Reducir batch sizes en `src/config/constants.ts`
2. Verificar latencia de red a legacy DB
3. Verificar carga de bases de datos (CPU/RAM)

```typescript
// constants.ts
export const BATCH_SIZES = {
  orders: 50,        // Reducir de 100 a 50
  order_items: 250,  // Reducir de 500 a 250
  // ...
};
```

---

## 📚 Documentación Adicional

- **Diseño ETL:** `D:/pos_venta/docs/ETL-DESIGN.md`
- **Diseño ETL Parte 2:** `D:/pos_venta/docs/ETL-DESIGN-PART2.md`
- **Campos Legacy:** `D:/pos_venta/docs/SCHEMA-LEGACY-FIELDS.md`
- **Resumen Ejecutivo:** `D:/pos_venta/docs/FASE4-RESUMEN-EJECUTIVO.md`

---

## ⚠️ Notas Importantes

1. **LEGACY es READ-ONLY:** El ETL NUNCA modifica la base legacy
2. **Idempotencia:** El ETL puede re-ejecutarse de forma segura
3. **Stocks negativos:** Se resetean a 0 automáticamente (son sales counters)
4. **Ventana de 12 meses:** Solo transacciones recientes se migran
5. **Clientes filtrados:** Solo clientes con facturas recientes

---

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisar logs en `backend/etl/logs/`
2. Consultar sección Troubleshooting arriba
3. Revisar documentación de diseño (ETL-DESIGN.md)

---

**FIN DEL README**

Estado: ✅ Proyecto ETL completo y listo para ejecutar
Última actualización: 2025-12-15
