# 🔄 PUNTO DE CONTINUACIÓN - ETL MIGRATION

**Fecha Pausa:** 2025-12-18
**Hora:** 02:26 UTC
**Estado:** ⏸️ Sesión detenida tras fix de fechas y rerun 3.2 — 3.3 no ejecutada (orders=7,998 < 8,000; faltan 32 órdenes por ventana de shifts).

---

## Última acción (18/12 02:24 UTC)
- Fix en `parseMySQLDate`: ahora soporta Buffer|string|Date|null, trim, rechaza `0000-00-00` y registra warning; evita error `dateStr.startsWith`.
- Re-ejecutada **PHASE 3.2 – Orders** (warmup + mesa placeholder `Num_Mesa='00'` id=62 ya existente).
- Lectura legacy: 8,030 órdenes cerradas (12 meses).
- Resultado migrator: Migrated 51 / Skipped 7,979 / Errors 0 / Orphans 0 (skips mayormente por idempotencia).
- Conteos Postgres (PGDATA `runtime/data/postgres`, puerto 5432):
  - Orders: antes 7,976 → después 7,998 (faltan 32 para 8,030)
  - Order Items: 0 (3.3 NO ejecutada)
  - Cash Register Shifts: 84; Products: 819; Tables: 62 (incl. placeholder 00)
- Stop condition aplicada: orders=7,998 (<8,000) ⇒ **3.3 no se corrió**.

### Motivo de faltantes (32 órdenes)
- IDs faltantes (sample): 5099, 5430, 5960, 5973, 6088, 7000, 7333, 7406, 7642, 7644, 7645, 7646, 7780, 8646, 10155, 10633, 10634, 10635, 12694, 12696, 13978, 14435, 14807, 14810, 14854, 15002, 15009, 15012, 15854, 17678, 17741, 17742.
- Todas tienen `fecha_venta` en Buffer convertibles (parse ok) pero caen fuera de la ventana de shifts (6 meses, apcajas); no existe shiftId → el transform retorna null. No hay orphans loggeados por FK, solo skips idempotentes.

---

## Decisiones aplicadas (vigentes)
- **Mesa placeholder Num_Mesa='00':** legacy_table_number='00', tableNumber='MESA_SISTEMA', room más antiguo, status available, id=62. Usar solo cuando Num_Mesa='00'.
- **Empleado placeholder para shifts:** code `SYSTEM_CASHIER`, id=11, rol waiter; usado si `id_camarero` vacío en apcajas.
- **Warmup de mapas:**
  - 3.1: cash registers, employees, shifts (por legacyId e id_caja) + placeholder employee.
  - 3.2: mesas (incl. placeholder '00'), employees, shifts (por id_caja), orderSequences desde order_numbers existentes.
  - 3.3: productos (legacy_sku padded) y órdenes desde Postgres antes de procesar legacy.
- **Key product/order items:** `id_complementog` varchar(5) padded → `String(...).trim().padStart(5,'0')` contra `legacy_sku`.

---

## Estado de las fases
- Fase 1: ✅ completa (rooms, categories, price_tiers, payment_methods, cash_registers, employees, customers, kitchen_stations).
- Fase 2: ✅ completa (products 819, product_prices 738, tables 62 con placeholder 00).
- Fase 3.1: ✅ shifts (84) con placeholder employee.
- Fase 3.2: ✅ re-ejecutada; **orders=7,998** (faltan 32 por ausencia de shift en ventana 6m).
- Fase 3.3: ⏸️ NO ejecutada hoy (stop por orders<8,000); order_items=0.
- Fase 3.4+ y validadores: ⏸️ sin tocar.

---

## Próximo paso controlado
1) Decidir cómo cubrir las 32 órdenes fuera de ventana de shifts (6m). Opciones: ampliar ventana de shifts a 12m o definir shift placeholder por id_caja para órdenes >6m.
2) Re-ejecutar solo Phase 3.2 tras la decisión; confirmar orders >= 8,000 o detener con lista de faltantes.
3) Solo con orders >= 8,000: ejecutar Phase 3.3 (order_items) y reportar migrados/skipped/orphans (top 20) + conteos finales.
4) Mantener PGDATA `runtime/data/postgres`, puerto 5432. No tocar Prisma ni avanzar a 3.4.

---

## Integridad/Logs
- No se registraron orphans en orders en esta corrida; warnings por fecha siguen (ver `backend/etl/logs/warnings.json`).
- Mapas de órdenes/productos se alimentan desde Postgres antes de procesar legacy para idempotencia.
- Placeholder mesa id=62 y empleado id=11 deben preservarse; no hay passwords asociados.

---

## Comandos útiles
- Contar órdenes/items: `psql -h localhost -p 5432 -U pos_admin -d pos_db -c "SELECT COUNT(*) FROM orders;"` (usar PGPASSWORD del .env).
- Correr solo 3.2: `node -e "const { migrateOrders } = require('./dist/migrators/phase3/orders'); const { getLegacyConnection, closeLegacyConnection } = require('./dist/config/legacy-db'); const { getPrismaClient, disconnectPrisma } = require('./dist/config/new-db'); (async()=>{ try { await getLegacyConnection(); getPrismaClient(); await migrateOrders(); } finally { await closeLegacyConnection(); await disconnectPrisma(); }})();"`
- Correr 3.3 (solo con orders>8k): similar llamando `migrateOrderItems` después.

---

## Resumen rápido para reanudar
- DB objetivo: PostgreSQL portable `runtime/data/postgres` puerto 5432.
- Datos actuales: orders 7,998; order_items 0; products 819; shifts 84; tables 62 (incl. placeholder 00 id=62).
- Pendiente: decisión sobre órdenes sin shift (>6m) para llegar a 8k+, re-ejecutar 3.2 y luego 3.3.
- No ejecutar 3.4+ hasta nueva autorización.
