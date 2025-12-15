# 🔍 Auditoría Técnica - Sync Service

**Versión:** 1.0.0-MVP
**Fecha:** 14 Enero 2025
**Archivo auditado:** `backend/src/modules/sync/services/sync.service.ts`
**Líneas de código:** 442

---

## 📋 Resumen Ejecutivo

### ✅ Fortalezas Identificadas
- ✅ Idempotencia implementada (evita duplicados)
- ✅ Transacciones atómicas (rollback automático)
- ✅ Logging detallado para auditoría
- ✅ Upsert pattern (`.onConflict().merge()`)

### ⚠️ Problemas Críticos Detectados
- ❌ **CRÍTICO:** No valida dependencias entre eventos (orden)
- ❌ **CRÍTICO:** Race condition en `processPagoRegistrado` (líneas 168-178)
- ❌ **ALTO:** No hay locking para concurrencia multi-dispositivo
- ⚠️ **MEDIO:** Procesamiento secuencial (no paralelo) - línea 33
- ⚠️ **MEDIO:** `actualizarTotalesSesionCaja` puede tener datos inconsistentes

---

## 🔒 Invariantes Fiscales

### 1. Inmutabilidad de Pagos Sincronizados

**Ubicación:** Líneas 172-177

**Invariante:**
```
PAGO.sync_status = 'SINCRONIZADO' → PAGO es INMUTABLE
```

**Implementación actual:**
```typescript
if (exists.sync_status === 'SINCRONIZADO') {
  this.logger.warn(`⚠️ Pago ${event.entity_id} ya existe y está sincronizado`);
  return; // OK, no es error
}
```

**✅ CORRECTO:** No modifica pago sincronizado.

**⚠️ PROBLEMA:** Solo verifica en aplicación, NO a nivel de base de datos.

**Riesgo:**
- Si dos requests simultáneos llegan, ambos pasan la verificación antes del INSERT
- Triggers de PostgreSQL deberían prevenir esto (definidos en schema), pero NO están siendo validados aquí

**Recomendación:**
```sql
-- Ya está en schema-mvp-definitivo-postgresql.sql (líneas 287-298)
-- PERO: Sync service NO verifica si el trigger fue ejecutado
-- Si el trigger rechaza, la transacción falla pero el error no es específico
```

---

### 2. Integridad Pedido → Pago

**Ubicación:** Líneas 209-214

**Invariante:**
```
PAGO registrado → PEDIDO.estado = 'PAGADO'
```

**Implementación actual:**
```typescript
await trx('pedido')
  .where({ id: payload.pedido_id })
  .update({
    estado: 'PAGADO',
    fecha_cierre: new Date().toISOString(),
  });
```

**⚠️ PROBLEMA:** No valida si el pedido existe antes de actualizar.

**Escenario de fallo:**
```
1. Evento PAGO_REGISTRADO llega primero (red rápida)
2. Pedido todavía no existe en BD servidor (evento PEDIDO_CREADO no llegó)
3. UPDATE de pedido no afecta ninguna fila (silenciosamente falla)
4. Pago queda registrado pero pedido nunca se marca como PAGADO
```

**Evidencia:** Línea 209 no verifica `.first()` ni el resultado del `.update()`

---

### 3. Totales de Sesión de Caja

**Ubicación:** Líneas 409-440

**Invariante:**
```
sesion_caja.total_efectivo = SUM(pago.monto WHERE metodo='EFECTIVO' AND estado='COMPLETADO')
```

**Implementación actual:**
```typescript
const totales = await trx('pago')
  .where({
    sesion_caja_id: sesionCajaId,
    estado: 'COMPLETADO', // Solo pagos completados
  })
  .select(trx.raw(`SUM(CASE WHEN metodo = 'EFECTIVO' THEN monto...`))
```

**✅ CORRECTO:** Recalcula desde pagos (no acumula).

**⚠️ PROBLEMA:** Si la sesión de caja no existe todavía, el UPDATE falla silenciosamente.

**Evidencia:** Línea 431 no verifica si `sesion_caja_id` existe.

---

## 🔀 Puntos Críticos de Concurrencia

### 1. Race Condition: Verificación de Pago Existente

**Ubicación:** Líneas 168-203

**Escenario:**
```
Thread A                          Thread B
────────────────────────────────  ────────────────────────────────
Recibe PAGO_REGISTRADO (uuid-123)
                                   Recibe PAGO_REGISTRADO (uuid-123) [REINTENTO]
await trx('pago').where().first()
  → Pago NO existe                 await trx('pago').where().first()
                                     → Pago NO existe (A no hizo commit aún)
INSERT pago (uuid-123)
                                   INSERT pago (uuid-123) [FALLA: UNIQUE]
COMMIT                             ROLLBACK (duplicate key)
```

**Resultado:** Thread B lanza error, pero el pago SÍ fue registrado por A.

**Problema:** Cliente B recibe error y reintenta, causando loops infinitos.

**Solución requerida:** `SELECT ... FOR UPDATE` o `INSERT ... ON CONFLICT DO NOTHING`

---

### 2. Race Condition: Actualización de Totales de Caja

**Ubicación:** Líneas 414-428

**Escenario:**
```
Dispositivo A                     Dispositivo B
─────────────────────────────────  ─────────────────────────────────
PAGO_REGISTRADO ($10,000)
  → Calcular totales: $10,000
  → UPDATE sesion_caja             PAGO_REGISTRADO ($5,000)
                                     → Calcular totales: $10,000 + $5,000 = $15,000
                                     → UPDATE sesion_caja
COMMIT (total = $10,000)           COMMIT (total = $15,000) ✅
```

**Resultado:** ✅ Correcto (recalcula desde pagos, no acumula).

**Pero:**
Si hay un DELETE/ANULACIÓN entre el SELECT y el UPDATE:

```
Thread A: SELECT pagos → $15,000
  [Thread B: ANULA pago de $5,000]
Thread A: UPDATE sesion_caja SET total = $15,000 [INCORRECTO, debería ser $10,000]
```

**⚠️ RIESGO MEDIO:** Totales pueden quedar desincronizados si hay anulaciones concurrentes.

**Solución:** Calcular totales dentro de un `SELECT ... FOR UPDATE` en `sesion_caja`.

---

### 3. No hay Row-Level Locking

**Ubicación:** Todas las queries de UPDATE

**Problema:**
PostgreSQL usa MVCC (Multi-Version Concurrency Control), pero las transacciones aquí **no usan locking explícito**.

**Ejemplo:**
```typescript
// Línea 290 - CAJA_CERRADA
await trx('sesion_caja').where({ id: event.entity_id }).update({...})
```

Si dos dispositivos cierran la misma caja simultáneamente:
```
Dispositivo A                     Dispositivo B
─────────────────────────────────  ─────────────────────────────────
CAJA_CERRADA (sesion-123)
UPDATE sesion_caja                 CAJA_CERRADA (sesion-123)
  SET estado='CERRADA'               UPDATE sesion_caja
  WHERE id='sesion-123'                SET estado='CERRADA'
COMMIT                             COMMIT
```

**Resultado:** Ambos commits exitosos, último commit gana (last-write-wins).

**¿Es problema?**
- Para cierre de caja: SÍ (puede sobrescribir totales diferentes)
- Para mesa OCUPADA/LIBRE: NO (estado final es el mismo)

---

## 🔄 Escenarios de Eventos Fuera de Orden

### Escenario 1: Pago Llega Antes que Pedido

```
Tiempo  Evento                    Estado BD
──────  ────────────────────────  ──────────────────────────────────
T0      PEDIDO_CREADO generado    [En cola dispositivo, offline]
        (pedido-uuid-123)

T1      PAGO_REGISTRADO generado  [Pago tiene prioridad 1]
        (pago-uuid-456)           [Pedido tiene prioridad 3]
        pedido_id: pedido-uuid-123

T2      Reconecta red
        → Sync envía PAGO primero [Por prioridad]

T3      Backend procesa PAGO      INSERT pago ✅
        (línea 181-203)           UPDATE pedido WHERE id='pedido-uuid-123'
                                  → 0 rows affected ❌
                                  [Pedido NO existe todavía]

T4      Backend procesa PEDIDO    INSERT pedido ✅
        (línea 318-342)           estado = 'ABIERTO' ❌ [DEBERÍA SER 'PAGADO']

RESULTADO: Inconsistencia
  - ✅ Pago registrado (correcto)
  - ❌ Pedido en estado 'ABIERTO' (incorrecto, debería estar PAGADO)
  - 💰 Dinero contabilizado en caja (correcto)
  - 📊 Reporte de ventas: pedido aparece como NO pagado (incorrecto)
```

**Diagrama:**
```
┌─────────────────────────────────────────────────────────┐
│ PROBLEMA: Pago llega antes que Pedido                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Dispositivo (offline)                                   │
│  ┌──────────────┐       ┌──────────────┐               │
│  │ PEDIDO_CREADO│  →    │ PAGO_REGISTRADO              │
│  │  (prioridad 3)│       │  (prioridad 1)│              │
│  └──────────────┘       └──────────────┘               │
│         │                      │                         │
│         │  Red reconecta       │                         │
│         ▼                      ▼                         │
│  ┌────────────────────────────────────┐                 │
│  │   Cola de sincronización           │                 │
│  │   [PAGO primero por prioridad]     │                 │
│  └────────────────────────────────────┘                 │
│                │                                         │
│                ▼                                         │
│  ┌─────────────────────────────────────┐                │
│  │ Servidor recibe PAGO primero        │                │
│  │                                      │                │
│  │  1. INSERT pago ✅                   │                │
│  │  2. UPDATE pedido ❌ (no existe)     │                │
│  │  3. COMMIT                           │                │
│  └─────────────────────────────────────┘                │
│                │                                         │
│                ▼                                         │
│  ┌─────────────────────────────────────┐                │
│  │ Servidor recibe PEDIDO después      │                │
│  │                                      │                │
│  │  1. INSERT pedido ✅                 │                │
│  │     estado = 'ABIERTO' ❌            │                │
│  │     (debería ser 'PAGADO')           │                │
│  │  2. COMMIT                           │                │
│  └─────────────────────────────────────┘                │
│                                                          │
│  RESULTADO: Pedido PAGADO pero marcado ABIERTO          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Frecuencia:** ALTA (pagos tienen prioridad sobre pedidos)

**Impacto fiscal:** MEDIO (dinero contabilizado, pero reportes incorrectos)

---

### Escenario 2: Pago Llega Antes que Sesión de Caja

```
Tiempo  Evento                    Estado BD
──────  ────────────────────────  ──────────────────────────────────
T0      CAJA_ABIERTA generado     [En cola dispositivo]
        (sesion-uuid-789)

T1      PAGO_REGISTRADO generado  [Pago prioridad 1]
        sesion_caja_id: sesion-uuid-789  [Caja prioridad 2]

T2      Sync envía PAGO primero

T3      Backend procesa PAGO      INSERT pago ✅
        (línea 206)               actualizarTotalesSesionCaja()
                                  → UPDATE sesion_caja WHERE id='sesion-uuid-789'
                                  → 0 rows affected ❌
                                  [Sesión NO existe todavía]

T4      Backend procesa CAJA      INSERT sesion_caja ✅
        ABIERTA                   total_efectivo = 0 ❌
                                  [DEBERÍA incluir el pago de T3]

RESULTADO: Inconsistencia grave
  - ✅ Pago registrado
  - ✅ Sesión de caja creada
  - ❌ Totales de caja = 0 (incorrecto)
  - 💰 Dinero "desaparece" de los totales
  - 🚨 Cierre de caja no cuadrará
```

**Frecuencia:** ALTA (pago prioridad 1 > caja prioridad 2)

**Impacto fiscal:** ⚠️ **CRÍTICO** (dinero no contabilizado en caja)

---

### Escenario 3: Cierre de Caja Llega Antes que Pagos

```
Tiempo  Evento                    Estado BD
──────  ────────────────────────  ──────────────────────────────────
T0      10 PAGOS_REGISTRADOS      [En cola, offline]
        generados (offline)

T1      CAJA_CERRADA generado     [Prioridad 2]

T2      Sync ordena por prioridad [Todos prioridad 1 o 2]
        → CAJA_CERRADA puede ir antes que algunos pagos

T3      Backend procesa           UPDATE sesion_caja
        CAJA_CERRADA              SET estado='CERRADA',
                                      total_efectivo=50000 (del cálculo local)

T4      Backend procesa           INSERT pago ✅
        PAGO_REGISTRADO #11       actualizarTotalesSesionCaja()
        (generado después T1)     → Recalcula: 55000
                                  → UPDATE sesion_caja
                                      SET total_efectivo=55000
                                      WHERE estado='CERRADA' ✅

RESULTADO:
  - ✅ Totales correctos (recálculo)
  - ⚠️ Pero caja estaba "cerrada" cuando llegó pago
  - 🚨 Violación de regla de negocio: no se puede pagar en caja cerrada
```

**Frecuencia:** BAJA (pero posible)

**Impacto:** MEDIO (viola lógica de negocio, pero totales correctos)

---

## 🔁 Escenario: Reintento de Mismo Lote 5 Veces

### Configuración
```json
{
  "eventos": [
    {"event_type": "PAGO_REGISTRADO", "idempotency_key": "pago:uuid-123:created"},
    {"event_type": "PEDIDO_CREADO", "idempotency_key": "pedido:uuid-456:created"}
  ]
}
```

### Reintento 1 (Primera vez)

```
POST /api/sync/events
├─ Evento 1: PAGO_REGISTRADO
│  ├─ checkDuplicate('pago:uuid-123:created') → NO existe ✅
│  ├─ INSERT sync_event ✅
│  ├─ INSERT pago ✅
│  └─ Marca como PROCESADO ✅
│
└─ Evento 2: PEDIDO_CREADO
   ├─ checkDuplicate('pedido:uuid-456:created') → NO existe ✅
   ├─ INSERT sync_event ✅
   ├─ INSERT pedido ✅
   └─ Marca como PROCESADO ✅

Respuesta: {processed: 2, errors: 0}
```

---

### Reintento 2 (Timeout, cliente no recibió respuesta)

**Supuesto:** Cliente no recibió el `200 OK` del reintento 1 (timeout de red)

```
POST /api/sync/events [MISMO PAYLOAD]
├─ Evento 1: PAGO_REGISTRADO
│  ├─ checkDuplicate('pago:uuid-123:created') → SÍ existe ❌
│  └─ Lanza ConflictException
│      → Capturado en línea 53
│      → Marca como IGNORADO ✅
│
└─ Evento 2: PEDIDO_CREADO
   ├─ checkDuplicate('pedido:uuid-456:created') → SÍ existe ❌
   └─ Marca como IGNORADO ✅

Respuesta: {
  processed: 0,
  errors: 2,
  results: [
    {idempotency_key: 'pago:uuid-123:created', status: 'IGNORADO'},
    {idempotency_key: 'pedido:uuid-456:created', status: 'IGNORADO'}
  ]
}
```

**✅ CORRECTO:** No duplica datos.

---

### Reintentos 3, 4, 5 (Idénticos al Reintento 2)

```
Todos devuelven: {processed: 0, errors: 2, status: 'IGNORADO'}
```

**✅ IDEMPOTENCIA FUNCIONA:** Mismo resultado en todos los reintentos.

---

### ⚠️ PROBLEMA: ¿Qué pasa si el lote tiene eventos NUEVOS + VIEJOS?

```json
{
  "eventos": [
    {"event_type": "PAGO_REGISTRADO", "idempotency_key": "pago:uuid-123:created"},
    {"event_type": "PAGO_REGISTRADO", "idempotency_key": "pago:uuid-999:created"}
  ]
}
```

**Reintento 6:**
```
├─ Evento 1: uuid-123 → IGNORADO (ya existe)
└─ Evento 2: uuid-999 → PROCESADO ✅ (nuevo)

Respuesta: {processed: 1, errors: 1}
```

**✅ CORRECTO:** Procesa solo eventos nuevos.

---

### 🚨 PROBLEMA: Race Condition en Procesamiento Secuencial

**Código actual (línea 33):**
```typescript
for (const event of events) {
  await this.processEvent(event); // SECUENCIAL
}
```

**Escenario:**
```
Thread A                          Thread B
────────────────────────────────  ────────────────────────────────
POST /sync/events
  [pago:uuid-123:created]

checkDuplicate(uuid-123) → OK     POST /sync/events [REINTENTO]
                                    [pago:uuid-123:created]

                                  checkDuplicate(uuid-123) → OK ❌
                                  [A no hizo INSERT todavía]

INSERT sync_event (uuid-123) ✅
                                  INSERT sync_event (uuid-123) ❌
                                  → UNIQUE constraint violation
                                  → Transacción ROLLBACK
COMMIT
                                  ERROR: duplicate key
```

**Problema:** La verificación de duplicados (`checkDuplicate`) NO está dentro de la transacción con lock.

**Ubicación:** Línea 96 - `checkDuplicate` se ejecuta ANTES de la transacción (línea 99)

**Solución:** Mover `checkDuplicate` dentro de transacción con `SELECT ... FOR UPDATE`.

---

## 📊 Matriz de Riesgos

| Problema | Severidad | Probabilidad | Impacto Fiscal | Frecuencia |
|----------|-----------|--------------|----------------|------------|
| **Pago antes de Pedido** | 🔴 CRÍTICA | ALTA | MEDIO | Diaria |
| **Pago antes de Sesión Caja** | 🔴 CRÍTICA | ALTA | CRÍTICO | Diaria |
| **Race condition checkDuplicate** | 🟡 ALTA | MEDIA | BAJO | Semanal |
| **Totales caja con anulaciones** | 🟡 MEDIA | BAJA | BAJO | Mensual |
| **Cierre caja antes de pagos** | 🟠 MEDIA | BAJA | MEDIO | Mensual |
| **Procesamiento secuencial lento** | 🟢 BAJA | ALTA | N/A | Siempre |

---

## 🛠️ Recomendaciones Críticas (NO IMPLEMENTAR AHORA)

### 1. Validar Dependencias Entre Eventos

**Problema:** Eventos independientes se procesan sin verificar FK.

**Solución propuesta:**
```typescript
// ANTES de procesar PAGO_REGISTRADO
const pedido = await trx('pedido').where({id: payload.pedido_id}).first();
if (!pedido) {
  // Marcar evento como PENDIENTE (no ERROR)
  // Reintentarlo después cuando llegue PEDIDO_CREADO
  throw new DependencyNotMetException('Pedido no existe todavía');
}
```

**Ubicación:** Línea 165 (antes del INSERT de pago)

---

### 2. Implementar Row-Level Locking

**Problema:** Actualizaciones concurrentes no están protegidas.

**Solución propuesta:**
```typescript
// Línea 290 - CAJA_CERRADA
const sesion = await trx('sesion_caja')
  .where({ id: event.entity_id })
  .forUpdate() // LOCK ROW
  .first();

if (!sesion) {
  throw new NotFoundException('Sesión de caja no existe');
}

if (sesion.estado === 'CERRADA') {
  // Ya fue cerrada por otro dispositivo
  return; // Idempotente
}

await trx('sesion_caja')
  .where({ id: event.entity_id })
  .update({...});
```

---

### 3. Mover Verificación de Idempotencia a Transacción

**Problema:** `checkDuplicate` (línea 96) está fuera de la transacción.

**Solución propuesta:**
```typescript
await this.knexService.transaction(async (trx) => {
  // Verificar duplicado CON LOCK
  const exists = await trx('sync_event')
    .where({ idempotency_key: event.idempotency_key })
    .forUpdate() // LOCK
    .first();

  if (exists) {
    throw new ConflictException('Duplicado');
  }

  // Resto del procesamiento...
});
```

---

### 4. Implementar Cola de Dependencias

**Problema:** No hay mecanismo para reintentar eventos con dependencias faltantes.

**Solución propuesta:**
```
1. Evento PAGO_REGISTRADO llega
2. Pedido no existe → Marcar como DEPENDENCIA_PENDIENTE
3. Guardar en tabla `sync_event_pending` con:
   - dependency_type: 'pedido'
   - dependency_id: 'uuid-pedido-123'
4. Cuando llegue PEDIDO_CREADO:
   - Procesar pedido
   - Buscar eventos pendientes que dependan de este pedido
   - Reprocesarlos
```

---

### 5. Validar Estado de Sesión de Caja

**Problema:** Se puede registrar pago en sesión cerrada.

**Solución propuesta:**
```typescript
// Línea 206 - Antes de actualizar totales
const sesion = await trx('sesion_caja')
  .where({ id: sesionCajaId })
  .first();

if (sesion.estado === 'CERRADA') {
  throw new BusinessRuleException(
    'No se puede registrar pago en sesión cerrada'
  );
}
```

---

## 🧪 Escenarios de Prueba Recomendados

### Test 1: Orden Incorrecto (Pago antes de Pedido)
```
1. Enviar PAGO_REGISTRADO (pedido_id: uuid-123)
2. Esperar procesamiento
3. Verificar: ¿Pago fue rechazado o está pendiente?
4. Enviar PEDIDO_CREADO (uuid-123)
5. Verificar: ¿Pago se reprocesó automáticamente?
```

### Test 2: Concurrencia (2 dispositivos cierran misma caja)
```
1. Dispositivo A envía CAJA_CERRADA (total: $10,000)
2. Dispositivo B envía CAJA_CERRADA (total: $10,500) [simultáneo]
3. Verificar: ¿Ambos commits exitosos o uno falla?
4. Verificar: ¿Total final es correcto?
```

### Test 3: Reintentos Masivos
```
1. Enviar lote con 100 eventos
2. Simular timeout (no recibir respuesta)
3. Reintentar mismo lote 10 veces
4. Verificar: ¿No hay duplicados en BD?
5. Verificar: ¿Respuesta idéntica en cada reintento?
```

### Test 4: Pago Antes de Sesión Caja
```
1. Enviar PAGO_REGISTRADO (sesion_id: uuid-789)
2. Verificar: ¿Pago fue rechazado o queda pendiente?
3. Enviar CAJA_ABIERTA (uuid-789)
4. Verificar: ¿Total de caja incluye el pago?
```

---

## 📈 Métricas de Calidad Actual

| Métrica | Valor | Objetivo |
|---------|-------|----------|
| **Cobertura de idempotencia** | 100% | 100% ✅ |
| **Validación de dependencias** | 0% | 100% ❌ |
| **Uso de transacciones** | 100% | 100% ✅ |
| **Row-level locking** | 0% | 80% ❌ |
| **Manejo de FK faltantes** | 0% | 100% ❌ |
| **Tests de concurrencia** | 0% | 50% ❌ |

---

## 🎯 Plan de Mitigación (Priorizado)

### Fase 1: Crítico (Antes de producción)
1. ✅ Validar FK antes de INSERT/UPDATE
2. ✅ Implementar row-level locking en cierre de caja
3. ✅ Mover `checkDuplicate` dentro de transacción

### Fase 2: Importante (Primera semana producción)
4. ✅ Implementar cola de dependencias
5. ✅ Validar estado de sesión antes de pagos
6. ✅ Tests de concurrencia multi-dispositivo

### Fase 3: Optimización (Primer mes)
7. ✅ Procesamiento paralelo de eventos independientes
8. ✅ Alertas automáticas para eventos pendientes > 5 min
9. ✅ Dashboard de métricas de sync

---

## 📝 Conclusión

### ✅ Lo que funciona bien:
- Idempotencia robusta (evita duplicados)
- Transacciones atómicas (rollback automático)
- Logging detallado
- Recálculo de totales (no acumulativo)

### ❌ Lo que requiere corrección urgente:
- **Validación de FK antes de procesamiento**
- **Row-level locking para concurrencia**
- **Manejo de eventos fuera de orden**

### Riesgo fiscal actual: 🔴 **ALTO**

**Razón:** Pagos pueden quedar sin contabilizar en sesión de caja si llegan antes que la apertura.

---

**Próximo paso recomendado:** Implementar validaciones de dependencias (Fase 1) antes de continuar con nuevos módulos.

