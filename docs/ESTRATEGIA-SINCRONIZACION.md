# 🔄 Estrategia de Sincronización - SYSME TPV

**Versión:** 1.0.0-MVP
**Fecha:** 14 Enero 2025
**Contexto:** Sistema offline-first con hasta 9 dispositivos simultáneos

---

## 📌 Principios Fundamentales

### 1. Offline-First
- **SIEMPRE** funciona sin conexión
- Todas las operaciones se guardan localmente primero (SQLite)
- La sincronización es asíncrona y automática
- El usuario nunca espera por la red

### 2. Event Sourcing
- **NO** sincronizamos tablas directamente
- **SÍ** generamos eventos inmutables (`sync_event`)
- Cada acción = 1 evento
- Los eventos nunca se modifican, solo se procesan

### 3. Idempotencia
- Procesar el mismo evento 2 veces = mismo resultado
- Usamos `idempotency_key` para evitar duplicados
- Si hay reintento, no se duplican datos

### 4. Priorización
- Pagos tienen **PRIORIDAD MÁXIMA** (sync_priority = 1)
- Sesiones de caja ALTA (priority = 2)
- Pedidos MEDIA (priority = 3)
- Cambios menores BAJA (priority = 5-10)

---

## 🎯 ¿Qué Entidades Generan sync_event?

### ✅ Entidades que SÍ generan eventos:

| Entidad | Eventos Generados | Prioridad | Razón |
|---------|-------------------|-----------|-------|
| **pago** | `PAGO_REGISTRADO`, `PAGO_ANULADO` | **1** (MÁXIMA) | Fiscalidad, cierres de caja |
| **sesion_caja** | `CAJA_ABIERTA`, `CAJA_CERRADA` | **2** (ALTA) | Control fiscal, auditoría |
| **pedido** | `PEDIDO_CREADO`, `PEDIDO_COMPLETADO`, `PEDIDO_CANCELADO` | **3** (MEDIA) | Ventas, reportes |
| **detalle_pedido** | `ITEM_AGREGADO`, `ITEM_MODIFICADO`, `ITEM_CANCELADO` | **3** (MEDIA) | Parte del pedido |
| **mesa** | `MESA_OCUPADA`, `MESA_LIBERADA` | **4** (MEDIA) | Estado en tiempo real |
| **producto** | `PRODUCTO_ACTUALIZADO` | **5** (BAJA) | Cambios de menú |
| **empleado** | `EMPLEADO_ACTUALIZADO` | **6** (BAJA) | Cambios de personal |

### ❌ Entidades que NO generan eventos:

- **sucursal** - Se configura manualmente (no cambia frecuentemente)
- **dispositivo** - Configuración inicial
- **zona** - Configuración inicial
- **categoria** - Cambios poco frecuentes
- **caja** - Configuración inicial
- **estacion_cocina** - Configuración inicial

**Regla:** Solo generan eventos las entidades que **cambian frecuentemente** o tienen **impacto fiscal/operativo**.

---

## 🔢 Orden de Prioridad (Detallado)

```
PRIORIDAD 1 (CRÍTICA - FISCAL):
├─ Pagos registrados
├─ Pagos anulados
└─ Sync cada 5 segundos (mientras haya conexión)

PRIORIDAD 2 (ALTA - CONTROL):
├─ Apertura de caja
├─ Cierre de caja
└─ Sync cada 10 segundos

PRIORIDAD 3 (MEDIA - OPERATIVA):
├─ Pedidos creados
├─ Pedidos completados
├─ Items de pedidos
└─ Sync cada 30 segundos

PRIORIDAD 4 (MEDIA - ESTADO):
├─ Cambios de estado de mesas
├─ Reservas
└─ Sync cada 60 segundos

PRIORIDAD 5-10 (BAJA - CONFIGURACIÓN):
├─ Actualizaciones de productos
├─ Cambios de empleados
├─ Configuraciones
└─ Sync cada 5 minutos
```

---

## 🚀 Flujo Completo de Sincronización

### Paso a Paso (Ejemplo: Registrar un Pago)

```
DISPOSITIVO (Comandero/Caja - SQLite)
│
├─ 1. Usuario registra pago
│   ├─ Pedido ID: abc-123
│   ├─ Método: EFECTIVO
│   └─ Monto: $15,000
│
├─ 2. Se guarda en SQLite local
│   ├─ INSERT INTO pago (...)
│   ├─ id: uuid-generado-localmente
│   ├─ sync_status: 'PENDIENTE'
│   └─ sync_priority: 1
│
├─ 3. Se crea evento de sincronización
│   ├─ INSERT INTO sync_event
│   ├─ event_type: 'PAGO_REGISTRADO'
│   ├─ entity_type: 'pago'
│   ├─ entity_id: uuid-del-pago
│   ├─ payload: {...datos completos del pago...}
│   ├─ idempotency_key: 'pago:uuid-del-pago:created'
│   ├─ sync_priority: 1
│   └─ client_timestamp: '2025-01-14 10:30:15'
│
├─ 4. Servicio de sync detecta evento pendiente
│   ├─ Query: SELECT * FROM sync_event
│   │         WHERE sync_status = 'PENDIENTE'
│   │         ORDER BY sync_priority ASC, created_at ASC
│   │         LIMIT 10
│   └─ Encuentra: PAGO_REGISTRADO (prioridad 1)
│
├─ 5. Intenta enviar al servidor
│   ├─ POST /api/sync/events
│   ├─ Body: [evento completo con idempotency_key]
│   │
│   ├─ ✅ Caso éxito (200 OK):
│   │   ├─ Servidor procesa evento
│   │   ├─ UPDATE sync_event SET sync_status = 'PROCESADO'
│   │   ├─ UPDATE pago SET sync_status = 'SINCRONIZADO'
│   │   └─ synced_at = NOW()
│   │
│   ├─ ❌ Caso error red (timeout/offline):
│   │   ├─ sync_retries += 1
│   │   ├─ sync_error = 'Network timeout'
│   │   └─ Se reintenta en 5 segundos (prioridad 1)
│   │
│   └─ ⚠️ Caso error servidor (400/500):
│       ├─ sync_retries += 1
│       ├─ sync_error = 'Error del servidor: ...'
│       └─ Si retries > 5: sync_status = 'ERROR' (requiere intervención manual)
│
└─ 6. Confirmación visual al usuario
    └─ "Pago registrado ✅ (Sincronizando...)"
```

---

## 🔁 Manejo de Reintentos

### Estrategia Exponencial Backoff

```javascript
// Pseudocódigo
function calcularIntervaloReintento(sync_priority, sync_retries) {
  const intervalosBase = {
    1: 5000,   // 5 segundos (pagos)
    2: 10000,  // 10 segundos (caja)
    3: 30000,  // 30 segundos (pedidos)
    4: 60000,  // 1 minuto (mesas)
    5: 300000  // 5 minutos (config)
  };

  const base = intervalosBase[sync_priority] || 60000;
  const exponencial = Math.pow(2, sync_retries); // 1, 2, 4, 8, 16...
  const maxIntervalo = 3600000; // 1 hora máximo

  return Math.min(base * exponencial, maxIntervalo);
}

// Ejemplos:
// Pago (prioridad 1):
//   Intento 0: 5s
//   Intento 1: 10s
//   Intento 2: 20s
//   Intento 3: 40s
//   Intento 4: 80s (1.3 min)
//   Intento 5: 160s (2.6 min)

// Pedido (prioridad 3):
//   Intento 0: 30s
//   Intento 1: 60s
//   Intento 2: 120s (2 min)
//   Intento 3: 240s (4 min)
```

### Límites de Reintentos

| Prioridad | Max Reintentos | Acción tras límite |
|-----------|----------------|-------------------|
| 1 (Pagos) | 10 | ⚠️ Alerta admin + marcar ERROR |
| 2 (Caja) | 8 | ⚠️ Alerta admin |
| 3 (Pedidos) | 5 | Marcar ERROR + log |
| 4-10 (Otros) | 3 | Marcar ERROR |

---

## 🔒 Idempotencia - Evitar Duplicados

### ¿Cómo funciona?

**Problema:**
- Comandero envía evento `PAGO_REGISTRADO`
- Servidor procesa OK
- Respuesta se pierde por red lenta
- Comandero reintenta porque no recibió confirmación
- **¿Se duplica el pago?** ❌ NO

**Solución: `idempotency_key`**

```sql
-- En dispositivo (SQLite)
INSERT INTO sync_event (
  id,
  event_type,
  entity_type,
  entity_id,
  idempotency_key,  -- ⭐ CLAVE ÚNICA
  payload,
  ...
) VALUES (
  'event-uuid-1',
  'PAGO_REGISTRADO',
  'pago',
  'pago-uuid-abc',
  'pago:pago-uuid-abc:created',  -- ⭐ Formato: {entity}:{id}:{action}
  '{"monto": 15000, ...}',
  ...
);
```

```javascript
// En servidor (Node.js/PostgreSQL)
async function procesarEvento(evento) {
  // 1. Verificar si ya fue procesado
  const existente = await db.query(
    'SELECT id FROM sync_event WHERE idempotency_key = $1',
    [evento.idempotency_key]
  );

  if (existente) {
    console.log('⚠️ Evento duplicado - ya procesado, ignorando');
    return { status: 'IGNORADO', message: 'Evento duplicado' };
  }

  // 2. Insertar evento (idempotency_key es UNIQUE)
  try {
    await db.query(
      'INSERT INTO sync_event (idempotency_key, ...) VALUES ($1, ...)',
      [evento.idempotency_key, ...]
    );
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL: unique violation
      console.log('⚠️ Race condition - evento ya insertado por otro proceso');
      return { status: 'IGNORADO', message: 'Duplicado (race condition)' };
    }
    throw error;
  }

  // 3. Procesar evento (crear pago, pedido, etc.)
  await procesarPayload(evento);

  return { status: 'PROCESADO' };
}
```

### Formato de idempotency_key

```
{entity_type}:{entity_id}:{action}[:{extra}]

Ejemplos:
- pago:uuid-abc-123:created
- pago:uuid-abc-123:anulado
- pedido:uuid-def-456:created
- pedido:uuid-def-456:completado
- mesa:uuid-ghi-789:ocupada:2025-01-14T10:30:00
- sesion_caja:uuid-jkl-012:cerrada
```

---

## 📊 Diagrama de Flujo Simplificado

```
┌─────────────────────────────────────────────────────────┐
│ DISPOSITIVO (Offline-First)                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Acción Usuario (ej: Registrar pago)                │
│      ↓                                                   │
│  2. Guardar en SQLite local                             │
│      ├─ INSERT pago (sync_status = PENDIENTE)          │
│      └─ INSERT sync_event (idempotency_key único)      │
│      ↓                                                   │
│  3. Confirmación inmediata al usuario ✅                │
│      ↓                                                   │
│  4. Servicio sync en background detecta evento          │
│      ↓                                                   │
│  5. ¿Hay conexión?                                      │
│      ├─ NO  → Esperar y reintentar (según prioridad)   │
│      └─ SÍ  → Continuar                                │
│              ↓                                           │
│  6. Enviar evento al servidor                           │
│      POST /api/sync/events                              │
│      {idempotency_key, payload, ...}                    │
│                                                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ SERVIDOR (PostgreSQL)                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  7. Recibe evento                                        │
│      ↓                                                   │
│  8. Verificar idempotency_key                           │
│      ├─ Ya existe? → Responder 200 OK (ya procesado)   │
│      └─ No existe? → Continuar                          │
│                  ↓                                       │
│  9. Validar payload                                      │
│      ├─ Inválido? → Responder 400 Bad Request          │
│      └─ Válido? → Continuar                             │
│                ↓                                         │
│ 10. Procesar evento (dentro de transacción)             │
│      ├─ INSERT sync_event (con idempotency_key)        │
│      ├─ INSERT/UPDATE entidad (pago, pedido, etc.)     │
│      └─ COMMIT                                           │
│      ↓                                                   │
│ 11. Responder 200 OK                                     │
│      {status: 'PROCESADO', entity_id: ...}              │
│                                                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ DISPOSITIVO (Confirmación)                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 12. Recibe respuesta OK                                  │
│      ↓                                                   │
│ 13. Actualizar estado local                              │
│      ├─ UPDATE sync_event SET sync_status = PROCESADO  │
│      ├─ UPDATE pago SET sync_status = SINCRONIZADO     │
│      └─ synced_at = NOW()                               │
│      ↓                                                   │
│ 14. Notificar usuario (opcional)                         │
│      "Sincronizado ✅"                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Manejo de Conflictos

### Caso 1: Modificación Simultánea (Ejemplo: Mesa)

**Escenario:**
- Dispositivo A marca mesa 5 como OCUPADA (10:30:00)
- Dispositivo B marca mesa 5 como LIBRE (10:30:02)
- Ambos offline, sincronizan después

**Resolución:**
```
Regla: Last-Write-Wins (basado en client_timestamp)

1. Servidor recibe evento A (timestamp: 10:30:00)
   → Procesa: mesa.estado = OCUPADA

2. Servidor recibe evento B (timestamp: 10:30:02)
   → Compara: 10:30:02 > 10:30:00
   → Procesa: mesa.estado = LIBRE (gana el más reciente)

3. Notificar a dispositivo A del cambio
   → WebSocket: {type: 'MESA_ACTUALIZADA', mesa_id: 5, estado: 'LIBRE'}
```

### Caso 2: Pago Duplicado (Prevenido por Idempotencia)

**Escenario:**
- Usuario hace doble clic en "Pagar"
- Se crean 2 registros locales

**Prevención:**
```javascript
// Frontend valida antes de crear
async function registrarPago(pedido_id, monto) {
  // 1. Verificar si ya existe pago para este pedido
  const pagoExistente = await db.query(
    'SELECT id FROM pago WHERE pedido_id = ? AND estado != "ANULADO"',
    [pedido_id]
  );

  if (pagoExistente) {
    throw new Error('Ya existe un pago para este pedido');
  }

  // 2. Crear pago con idempotency_key
  const pagoId = generateUUID();
  const idempotencyKey = `pago:${pagoId}:created`;

  await db.insert('pago', {
    id: pagoId,
    pedido_id,
    monto,
    ...
  });

  await db.insert('sync_event', {
    event_type: 'PAGO_REGISTRADO',
    entity_id: pagoId,
    idempotency_key: idempotencyKey,
    ...
  });
}
```

---

## 🧪 Casos de Prueba Críticos

### Test 1: Pago Offline → Sync → Confirmación
```
1. Desconectar red
2. Registrar pago $10,000
3. Verificar: pago en SQLite local (sync_status = PENDIENTE)
4. Verificar: sync_event creado (prioridad 1)
5. Reconectar red
6. Esperar ≤ 10 segundos
7. Verificar: sync_status = SINCRONIZADO
8. Verificar: evento en servidor PostgreSQL
```

### Test 2: Reintento tras Error
```
1. Configurar servidor para rechazar eventos (503 Service Unavailable)
2. Registrar pago
3. Verificar: sync_retries = 1, 2, 3...
4. Verificar: intervalos crecientes (5s, 10s, 20s...)
5. Arreglar servidor
6. Verificar: evento se procesa exitosamente
```

### Test 3: Idempotencia
```
1. Registrar pago offline
2. Sync manual (forzar envío)
3. Simular timeout (no recibir respuesta)
4. Reintento automático
5. Verificar: servidor solo tiene 1 pago (no duplicado)
6. Verificar: dispositivo recibe confirmación
```

### Test 4: Priorización
```
1. Crear eventos mezclados:
   - 1 pago (prioridad 1)
   - 1 pedido (prioridad 3)
   - 1 cambio de producto (prioridad 5)
2. Desconectar red
3. Reconectar
4. Verificar: pago se sincroniza PRIMERO
5. Verificar: pedido segundo
6. Verificar: producto tercero
```

---

## 🔧 Configuración Recomendada

```javascript
// config/sync.js
export const SyncConfig = {
  // Intervalos de sincronización por prioridad (milisegundos)
  intervals: {
    1: 5000,    // Pagos: cada 5 segundos
    2: 10000,   // Caja: cada 10 segundos
    3: 30000,   // Pedidos: cada 30 segundos
    4: 60000,   // Mesas: cada 1 minuto
    5: 300000   // Configuración: cada 5 minutos
  },

  // Límites de reintentos
  maxRetries: {
    1: 10,  // Pagos: 10 reintentos
    2: 8,   // Caja: 8 reintentos
    3: 5,   // Pedidos: 5 reintentos
    default: 3
  },

  // Tamaño de lote (eventos por request)
  batchSize: 10,

  // Timeout de request (milisegundos)
  requestTimeout: 30000, // 30 segundos

  // Habilitar logs detallados
  debug: process.env.NODE_ENV === 'development'
};
```

---

## 📋 Checklist de Implementación

### Backend (Servidor)
- [ ] Endpoint `POST /api/sync/events` (recibir eventos)
- [ ] Validación de `idempotency_key` (unique constraint)
- [ ] Procesamiento idempotente de eventos
- [ ] Manejo de conflictos (Last-Write-Wins)
- [ ] Logging de eventos rechazados
- [ ] WebSocket para notificaciones en tiempo real

### Frontend (Dispositivo)
- [ ] Generación de UUIDs locales
- [ ] Creación automática de `sync_event` al modificar datos
- [ ] Servicio de sincronización en background
- [ ] Detección de conexión (online/offline)
- [ ] UI de estado de sincronización
- [ ] Reintentos con backoff exponencial
- [ ] Límite de reintentos + alerta admin

### Testing
- [ ] Tests de idempotencia
- [ ] Tests de reintentos
- [ ] Tests de priorización
- [ ] Tests de conflictos
- [ ] Tests de carga (9 dispositivos simultáneos)

---

## 🎯 Resumen Ejecutivo

### ¿Qué logramos con esta estrategia?

✅ **Offline-first real:** Usuario nunca espera por la red
✅ **Fiscalidad garantizada:** Pagos nunca se pierden (prioridad máxima)
✅ **Sin duplicados:** Idempotencia en todos los eventos
✅ **Resiliente:** Reintentos automáticos con backoff
✅ **Escalable:** Soporta 9 dispositivos sin conflictos
✅ **Auditable:** Todos los eventos quedan registrados

### Puntos Críticos

⚠️ **NUNCA** confiar en que la red está disponible
⚠️ **SIEMPRE** generar UUIDs en el cliente
⚠️ **SIEMPRE** usar `idempotency_key` en eventos
⚠️ **SIEMPRE** priorizar pagos (fiscalidad)

---

**Próximo Paso:** [Implementar modelo local SQLite](#)

