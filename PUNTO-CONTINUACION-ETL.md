# PUNTO DE CONTINUACION - ETL MIGRATION

**Fecha Pausa:** 2025-12-19  
**Hora:** 02:07 UTC  
**Estado:** Sesión detenida con Phase 3.2 (orders) completada a 12 meses y Phase 3.3 (order_items) ejecutada tras ajustar idempotencia (orders=8,030; order_items=35,614).

---

## Última acción (19/12 02:06 UTC)
- Legacy MySQL embebido activo en `E:\POS SYSME\Sysme_Principal\SYSME\sysmeserver\bin\mysqld-nt` (puerto 4306; DB `sysmehotel`, tablas ventadirecta/ventadir_comg/complementog/apcajas OK).  
- Ventana de shifts 12 meses (`MIGRATION_WINDOWS.cash_shifts=12`). Conteo Postgres: cash_register_shifts=280.  
- **Phase 3.2 (Orders)** rerun con match de shift por rango de tiempo + fallback a placeholder empleado:  
  - Legacy cerradas 12m: 8,009.  
  - Migrated: 28 (nuevas), Skipped: 7,981, Errors: 0, Orphans: 0.  
  - Ajuste: colisiones de `orderNumber` ahora avanzan la secuencia si el número ya existe con otro legacyId (se registran como warning).  
  - Orders en Postgres: **8,030** (completas; mesa '00' id=62 preservada; empleado placeholder SYSTEM_CASHIER usado para camarero faltante).  
- **Phase 3.3 (Order Items)** ejecutada tras recargar mapas desde Postgres y usar legacyId compuesto `id_venta*1000 + id_linea` (id_linea no es único global):  
  - Truncado previo: `TRUNCATE kitchen_queue, order_items RESTART IDENTITY;`  
  - Legacy items procesados: 35,616; Migrated: **35,614**; Skipped: 2 (duplicados por checkExisting); Errors/Orphans: 0.  
  - Producto key: `id_complementog` zero-padded a 5 contra `legacySku`.  
- Conteos Postgres (PGDATA `runtime/data/postgres`, puerto 5432):  
  - cash_register_shifts: 280  
  - orders: 8,030  
  - order_items: 35,614  
  - products: 819  
  - tables: 62 (incl. placeholder Num_Mesa='00', id=62)  
- Postgres portable actualmente **encendido** (5432). MySQL legacy encendido (4306).

---

## Decisiones / Fixes aplicados
- Ventana de transacciones y shifts: 12 meses.  
- `migrateOrders`: resolución de shift por rango (openedAt/closedAt por id_caja), placeholder SYSTEM_CASHIER cuando falta camarero, secuencia de `orderNumber` avanza si el número ya existe con otro legacyId.  
- `migrateOrderItems`: recarga siempre mapas desde Postgres; legacyId compuesto `id_venta*1000 + id_linea` para evitar colisiones; truncado kitchen_queue + order_items antes del rerun.  
- Placeholders preservados: mesa `legacyTableNumber='00'` (id=62) y empleado `SYSTEM_CASHIER` (id=11).  
- Mapas warmup: productos (legacy_sku padded) y órdenes desde Postgres antes de procesar legacy.

---

## Estado de fases
- Fase 1: completa (rooms, categories, price_tiers, payment_methods, cash_registers, employees, customers, kitchen_stations).
- Fase 2: completa (products 819, product_prices 738, tables 62 con placeholder 00).
- Fase 3.1: rerun 12m; cash_register_shifts=280.
- Fase 3.2: completa 12m; orders=8,030.
- Fase 3.3: ejecutada; order_items=35,614 (2 skips por duplicado).
- Fase 3.4+ y validadores: no ejecutados hoy.

---

## Próximo paso controlado
1) Validar conteos/consistencias (opcionales): `npm run validate` en `backend/etl` o consultas FK.  
2) Solo con ordenes/items ya completos: evaluar 3.4+ (payments/invoices/validadores) cuando haya autorización.  
3) Apagar servicios al cierre: `scripts\\stop-db.bat` para Postgres embebido si no se sigue trabajando.

---

## Integridad / Logs
- Warnings/Orphans recientes: ninguna en 3.2 final; 3.3 sin orphans, 2 skips por duplicado.  
- Logs en `backend/etl/logs/migration2.log` (runs 19/12).  
- DB objetivo: PostgreSQL portable `runtime/data/postgres` puerto 5432.  
- Legacy: MySQL embebido 4306 (no modificar datos).

---

## Comandos útiles
- Conteos rápidos: `psql -h localhost -p 5432 -U pos_admin -d pos_db -c "SELECT COUNT(*) FROM orders;"` (usar PGPASSWORD del .env).  
- Correr solo 3.2: `node -e "const { migrateOrders } = require('./dist/migrators/phase3/orders'); const { getLegacyConnection, closeLegacyConnection } = require('./dist/config/legacy-db'); const { getPrismaClient, disconnectPrisma } = require('./dist/config/new-db'); (async()=>{ try { await getLegacyConnection(); getPrismaClient(); await migrateOrders(); } finally { await closeLegacyConnection(); await disconnectPrisma(); }})();"`  
- Correr solo 3.3: mismo comando llamando `migrateOrderItems` (asegurar orders completas).

---

## Resumen rápido para reanudar
- Orders completas 12m: **8,030**.  
- Order items insertados: **35,614** (legacyId compuesto).  
- Shifts: 280 (12m).  
- Products: 819; Tables: 62 (placeholder mesa '00' id=62).  
- Servicios encendidos ahora: Postgres 5432; MySQL legacy 4306.  
- No avanzar a Phase 3.4+ sin autorización explícita.  
- Si se detiene la sesión: ejecutar `scripts\\stop-db.bat` para apagar Postgres portable.
