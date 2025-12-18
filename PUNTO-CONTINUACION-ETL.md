# 🔄 PUNTO DE CONTINUACIÓN - ETL MIGRATION

**Fecha Pausa:** 2025-12-18
**Hora:** 02:15 UTC
**Estado:** ⏸️ Sesión detenida tras rerun controlado (3.2) — NO se ejecutó 3.3 porque orders<8000.

---

## Última acción (18/12 02:06 UTC)
- Re-ejecutada **PHASE 3.2 – Orders** con warmup y mesa placeholder `Num_Mesa='00'`.
- Placeholder mesa creado/asegurado: `legacy_table_number='00'`, `tableNumber='MESA_SISTEMA'`, room existente (id más bajo). **ID creado:** 62.
- Lectura legacy: 8,030 órdenes cerradas (12 meses).
- Resultado del migrator: Migrated 609 / Skipped 7,421 / Errors 0 / Orphans 0 (skips incluyen ya migrados + 54 con fecha inválida).
- Conteos Postgres (pos_db, PGDATA `runtime/data/postgres`, puerto 5432):
  - Orders: antes 7,418 → después 7,976
  - Order Items: 0 → 0 (3.3 no ejecutada)
  - Cash Register Shifts: 84
  - Products: 819; Tables: 62 (incluye placeholder)
- Stop condition aplicada: orders=7,976 (<8,000) ⇒ **3.3 no se corrió**.

### Motivo de faltantes (≈54 órdenes)
- Warn logs muestran `dateStr.startsWith is not a function` (fecha/hora como Buffer) en `parseMySQLDate`; esos registros se skippean (transform devuelve null). No hay orphans por FK en esta corrida.

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
- Fase 3.2: ✅ re-ejecutada; **orders=7,976** (54 con fecha inválida siguen fuera).
- Fase 3.3: ⏸️ NO ejecutada hoy (stop por orders<8,000); order_items=0.
- Fase 3.4+ y validadores: ⏸️ sin tocar.

---

## Próximo paso controlado
1) Resolver 54 órdenes con fecha Buffer (ajustar parseMySQLDate o manejo de Buffer en 3.2) y re-ejecutar solo Phase 3.2.
2) Verificar conteo orders > 8,000. Si no se supera, detener y reportar razones top.
3) Solo con orders>8,000: ejecutar Phase 3.3 (order_items) y reportar migrados/skipped/orphans (top 20) + conteos finales.
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
- Datos actuales: orders 7,976; order_items 0; products 819; shifts 84; tables 62 (incl. placeholder 00 id=62).
- Pendiente: fijar parse de fecha Buffer en orders, re-ejecutar 3.2, luego 3.3 si orders>8k.
- No ejecutar 3.4+ hasta nueva autorización.
