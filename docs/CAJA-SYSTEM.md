# SISTEMA DE CAJA - DOCUMENTACIÓN COMPLETA

**Versión:** 1.0.0
**Fecha:** 2025-01-15
**Iteración:** 4 - Sistema Crítico
**Estado:** Auditable, Inmutable, Offline-First

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Modelo de Datos](#modelo-de-datos)
4. [API Endpoints](#api-endpoints)
5. [Flujos de Negocio](#flujos-de-negocio)
6. [Reglas de Inmutabilidad](#reglas-de-inmutabilidad)
7. [Offline-First e Idempotencia](#offline-first-e-idempotencia)
8. [Seguridad y Auditoría](#seguridad-y-auditoría)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 RESUMEN EJECUTIVO

### Objetivo

Implementar un sistema de **caja registradora** completo, auditable e inmutable para el sistema POS de venta, con soporte para operación offline-first.

### Características Principales

✅ **Apertura de Caja**
- Registro de monto inicial
- Generación automática de número de sesión
- Validación de permisos (futuro)
- Idempotencia para offline

✅ **Cierre de Caja**
- Cálculo automático de monto esperado
- Registro de monto real contado
- Cálculo de diferencia (faltante/sobrante)
- Totales por medio de pago
- Snapshot inmutable JSON
- No editable una vez cerrada

✅ **Movimientos de Caja**
- Ingresos (préstamos, otros ingresos)
- Egresos (pagos, retiros)
- Soft-delete (no se borran físicamente)
- Auditoría completa

✅ **Consolidación**
- Errores tipificados con códigos
- Logging estructurado con request_id
- Rate limiting por endpoint
- Health checks ready

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Capas de la Aplicación

```
┌─────────────────────────────────────┐
│         HTTP REST API               │
│    (Controller + Middleware)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Business Logic Layer          │
│  (Services + Validation)            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Data Access Layer             │
│     (Repositories + SQL)            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│          MySQL Database             │
│  (sesion_caja, movimiento_caja,     │
│   cierre_caja_detalle)              │
└─────────────────────────────────────┘
```

### Estructura de Archivos

```
backend/src/modules/caja/
├── dto/
│   ├── sesion-caja.dto.ts          # DTOs de sesión
│   ├── movimiento-caja.dto.ts      # DTOs de movimientos
│   └── caja-response.dto.ts        # DTOs de respuesta
├── repositories/
│   ├── sesion-caja.repository.ts   # Queries de sesión
│   ├── movimiento-caja.repository.ts # Queries de movimientos
│   ├── cierre-caja.repository.ts   # Queries de cierre
│   └── empleado.repository.ts      # Queries de empleados
├── services/
│   ├── sesion-caja.service.ts      # Lógica de apertura/cierre
│   └── movimiento-caja.service.ts  # Lógica de movimientos
├── controllers/
│   └── caja.controller.ts          # HTTP endpoints
└── caja.module.ts                  # Router con rate limiting
```

---

## 💾 MODELO DE DATOS

### Tablas

#### 1. `sesion_caja`

Representa una sesión de caja (desde apertura hasta cierre).

**Campos principales:**
- `id` (UUID): Identificador único
- `numero_sesion` (INT): Número secuencial por sucursal (ej: "Sesión #123")
- `sucursal_id` (UUID): Sucursal donde se abrió
- `empleado_apertura_id` (UUID): Quién abrió
- `empleado_cierre_id` (UUID): Quién cerró (NULL si abierta)
- `fecha_apertura` (DATETIME): Cuándo se abrió
- `fecha_cierre` (DATETIME): Cuándo se cerró (NULL si abierta)
- `monto_inicial` (DECIMAL): Efectivo inicial
- `monto_final_esperado` (DECIMAL): Calculado al cerrar
- `monto_final_real` (DECIMAL): Contado físicamente
- `diferencia` (DECIMAL): Real - Esperado
- `estado` (ENUM): 'abierta' | 'cerrada'
- `cierre_inmutable_json` (JSON): Snapshot del cierre

**Índices:**
- `(sucursal_id, estado)`: Para buscar sesión activa
- `(sucursal_id, numero_sesion)`: Para auditoría
- `fecha_apertura`, `fecha_cierre`: Para reportes

**Constraints:**
- `monto_inicial >= 0`
- Si `estado='abierta'` → campos de cierre deben ser NULL
- Si `estado='cerrada'` → campos de cierre deben estar completos
- `UNIQUE (sucursal_id, numero_sesion)`

#### 2. `movimiento_caja`

Movimientos de efectivo que NO son ventas.

**Campos principales:**
- `id` (UUID): Identificador único
- `sesion_caja_id` (UUID): Sesión a la que pertenece
- `tipo` (ENUM): 'ingreso' | 'egreso'
- `concepto` (VARCHAR): Descripción del movimiento
- `monto` (DECIMAL): Monto del movimiento (siempre positivo)
- `empleado_id` (UUID): Quién hizo el movimiento
- `fecha` (DATETIME): Cuándo se hizo
- `esta_activo` (BOOLEAN): FALSE = anulado (soft-delete)

**Índices:**
- `sesion_caja_id`: Para consultar movimientos por sesión
- `tipo`: Para filtrar ingresos/egresos
- `fecha`: Para reportes cronológicos

**Constraints:**
- `monto > 0`
- `concepto` mínimo 3 caracteres

#### 3. `cierre_caja_detalle`

Detalle inmutable de totales por forma de pago al cerrar.

**Campos principales:**
- `id` (UUID): Identificador único
- `sesion_caja_id` (UUID): Sesión a la que pertenece
- `forma_pago_id` (UUID): Forma de pago
- `nombre_forma_pago` (VARCHAR): Snapshot del nombre
- `cantidad_transacciones` (INT): Número de ventas
- `monto_total` (DECIMAL): Total vendido

**Características:**
- **INMUTABLE**: No tiene `updated_at`
- NO se puede editar
- NO se puede borrar
- Se genera automáticamente al cerrar caja

#### 4. Relación con `venta`

```sql
ALTER TABLE venta
ADD COLUMN sesion_caja_id CHAR(36) NULL;
```

Permite saber en qué sesión se hizo cada venta.

---

## 🔌 API ENDPOINTS

### Base URL

```
/api/caja
```

### Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `/abrir` | 10 requests | 60s |
| `/cerrar` | 10 requests | 60s |
| `/movimiento` | 30 requests | 60s |
| Otros | 30 requests | 60s |

### Endpoints Disponibles

#### 1. POST /api/caja/abrir

**Descripción:** Abrir caja (apertura de sesión)

**Request:**
```json
{
  "sucursal_id": "550e8400-e29b-41d4-a716-446655440000",
  "empleado_id": "660e8400-e29b-41d4-a716-446655440001",
  "monto_inicial": 1000.00,
  "notas": "Apertura turno mañana",
  "sesion_id": "770e8400-..." // Opcional (offline-first)
  "fecha_apertura": "2025-01-15T08:00:00.000Z" // Opcional (offline-first)
}
```

**Response 201 Created:**
```json
{
  "success": true,
  "data": {
    "sesion_id": "770e8400-e29b-41d4-a716-446655440002",
    "numero_sesion": 123,
    "sucursal_id": "550e8400-e29b-41d4-a716-446655440000",
    "empleado_apertura_id": "660e8400-e29b-41d4-a716-446655440001",
    "fecha_apertura": "2025-01-15T08:00:00.000Z",
    "monto_inicial": 1000.00,
    "estado": "abierta",
    "notas": "Apertura turno mañana"
  }
}
```

**Errores Posibles:**
- `400 VALIDATION_ERROR`: Datos inválidos
- `404 SUCURSAL_NOT_FOUND`: Sucursal no existe
- `404 EMPLEADO_NOT_FOUND`: Empleado no existe
- `409 CAJA_ALREADY_OPEN`: Ya hay caja abierta
- `403 INSUFFICIENT_PERMISSIONS`: Sin permisos (futuro)

#### 2. POST /api/caja/cerrar

**Descripción:** Cerrar caja con cálculos automáticos

**Request:**
```json
{
  "sesion_id": "770e8400-e29b-41d4-a716-446655440002",
  "empleado_id": "660e8400-e29b-41d4-a716-446655440001",
  "monto_final_real": 5250.00,
  "notas": "Cierre turno mañana - todo OK",
  "fecha_cierre": "2025-01-15T16:00:00.000Z" // Opcional (offline-first)
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "sesion_id": "770e8400-e29b-41d4-a716-446655440002",
    "numero_sesion": 123,
    "fecha_apertura": "2025-01-15T08:00:00.000Z",
    "fecha_cierre": "2025-01-15T16:00:00.000Z",
    "empleado_apertura": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "nombre": "Juan",
      "apellido": "Pérez"
    },
    "empleado_cierre": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "nombre": "Juan",
      "apellido": "Pérez"
    },
    "monto_inicial": 1000.00,
    "monto_final_esperado": 5230.50,
    "monto_final_real": 5250.00,
    "diferencia": 19.50,
    "estado": "cerrada",
    "totales_por_forma_pago": [
      {
        "forma_pago_id": "880e8400-...",
        "nombre": "Efectivo",
        "cantidad_transacciones": 15,
        "monto_total": 3500.00
      },
      {
        "forma_pago_id": "880e8400-...",
        "nombre": "Tarjeta Débito",
        "cantidad_transacciones": 8,
        "monto_total": 1730.50
      }
    ],
    "movimientos": [
      {
        "id": "990e8400-...",
        "tipo": "ingreso",
        "concepto": "Préstamo",
        "monto": 500.00,
        "fecha": "2025-01-15T10:30:00.000Z",
        "empleado_id": "660e8400-...",
        "notas": null
      }
    ],
    "notas_apertura": "Apertura turno mañana",
    "notas_cierre": "Cierre turno mañana - todo OK"
  }
}
```

**Cálculo automático:**
```
monto_final_esperado =
  monto_inicial +
  SUM(ventas en efectivo) +
  SUM(movimientos ingreso) -
  SUM(movimientos egreso)

diferencia = monto_final_real - monto_final_esperado
```

**Errores Posibles:**
- `404 SESION_CAJA_NOT_FOUND`: Sesión no existe
- `409 CAJA_ALREADY_CLOSED`: Ya está cerrada (idempotencia retorna datos)
- `404 EMPLEADO_NOT_FOUND`: Empleado no existe
- `403 INSUFFICIENT_PERMISSIONS`: Sin permisos (futuro)

#### 3. POST /api/caja/movimiento

**Descripción:** Crear movimiento de caja (ingreso/egreso)

**Request (Ingreso):**
```json
{
  "sesion_id": "770e8400-e29b-41d4-a716-446655440002",
  "empleado_id": "660e8400-e29b-41d4-a716-446655440001",
  "tipo": "ingreso",
  "concepto": "Préstamo de caja principal",
  "monto": 500.00,
  "notas": "Para cambio",
  "movimiento_id": "990e8400-..." // Opcional (offline-first)
  "fecha": "2025-01-15T10:30:00.000Z" // Opcional (offline-first)
}
```

**Request (Egreso):**
```json
{
  "sesion_id": "770e8400-e29b-41d4-a716-446655440002",
  "empleado_id": "660e8400-e29b-41d4-a716-446655440001",
  "tipo": "egreso",
  "concepto": "Pago a proveedor",
  "monto": 300.00,
  "notas": "Factura #12345"
}
```

**Response 201 Created:**
```json
{
  "success": true,
  "data": {
    "movimiento_id": "990e8400-e29b-41d4-a716-446655440005",
    "sesion_caja_id": "770e8400-e29b-41d4-a716-446655440002",
    "tipo": "ingreso",
    "concepto": "Préstamo de caja principal",
    "monto": 500.00,
    "empleado_id": "660e8400-e29b-41d4-a716-446655440001",
    "fecha": "2025-01-15T10:30:00.000Z",
    "notas": "Para cambio",
    "esta_activo": true
  }
}
```

**Errores Posibles:**
- `404 SESION_CAJA_NOT_FOUND`: Sesión no existe
- `409 CAJA_ALREADY_CLOSED`: Caja ya cerrada
- `404 EMPLEADO_NOT_FOUND`: Empleado no existe
- `400 VALIDATION_ERROR`: Monto <= 0 o concepto vacío

#### 4. GET /api/caja/sesion/:id

**Descripción:** Obtener sesión por ID

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "sesion_id": "770e8400-...",
    "numero_sesion": 123,
    "estado": "cerrada",
    // ... resto de campos
  }
}
```

#### 5. GET /api/caja/activa?sucursal_id=xxx

**Descripción:** Obtener sesión activa de una sucursal

**Response 200 OK (Con sesión activa):**
```json
{
  "success": true,
  "data": {
    "sesion_id": "770e8400-...",
    "numero_sesion": 123,
    "estado": "abierta",
    "fecha_apertura": "2025-01-15T08:00:00.000Z",
    "monto_inicial": 1000.00,
    "empleado_apertura_id": "660e8400-..."
  }
}
```

**Response 200 OK (Sin sesión activa):**
```json
{
  "success": true,
  "data": null
}
```

#### 6. GET /api/caja/movimientos/:sesion_id

**Descripción:** Obtener movimientos de una sesión

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "movimientos": [
      {
        "movimiento_id": "990e8400-...",
        "tipo": "ingreso",
        "concepto": "Préstamo",
        "monto": 500.00,
        "fecha": "2025-01-15T10:30:00.000Z",
        "esta_activo": true
      }
    ],
    "total": 1
  }
}
```

#### 7. DELETE /api/caja/movimiento/:id

**Descripción:** Anular movimiento (soft-delete)

**Request Body:**
```json
{
  "empleado_id": "660e8400-...",
  "motivo": "Error en el registro"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "movimiento_id": "990e8400-...",
    "esta_activo": false
    // ... resto de campos
  }
}
```

---

## 🔄 FLUJOS DE NEGOCIO

### Flujo 1: Apertura de Caja

```
1. Usuario ingresa monto inicial
2. Sistema valida:
   - Sucursal existe
   - Empleado existe
   - NO hay caja abierta
   - (Futuro) Empleado tiene permiso CAJA_ABRIR
3. Sistema genera número de sesión (auto-increment por sucursal)
4. Sistema crea sesión con estado='abierta'
5. Sistema retorna datos de apertura
```

### Flujo 2: Cierre de Caja

```
1. Usuario ingresa monto real contado
2. Sistema valida:
   - Sesión existe
   - Sesión está abierta
   - Empleado existe
   - (Futuro) Empleado tiene permiso CAJA_CERRAR
3. Sistema calcula:
   - Total ingresos de movimientos
   - Total egresos de movimientos
   - Total ventas en efectivo
   - monto_final_esperado = inicial + efectivo + ingresos - egresos
   - diferencia = real - esperado
4. Sistema genera totales por forma de pago:
   - Cuenta transacciones por forma de pago
   - Suma montos por forma de pago
   - Crea registros en cierre_caja_detalle
5. Sistema genera snapshot inmutable JSON:
   - Todos los datos de la sesión
   - Empleados (snapshot)
   - Totales por forma de pago
   - Movimientos
   - Resumen de ventas
6. Sistema actualiza sesión:
   - estado = 'cerrada'
   - Campos de cierre
   - cierre_inmutable_json
7. Sistema retorna reporte completo
```

### Flujo 3: Movimiento de Caja

```
1. Usuario crea ingreso o egreso
2. Sistema valida:
   - Sesión existe y está abierta
   - Empleado existe
   - Monto > 0
   - Concepto no vacío
3. Sistema crea movimiento
4. Sistema retorna datos del movimiento
```

---

## 🔒 REGLAS DE INMUTABILIDAD

### ❌ NO SE PUEDE:

1. **Editar sesión cerrada**
   ```sql
   UPDATE sesion_caja
   SET monto_final_real = 5000
   WHERE id = '...' AND estado = 'cerrada'; -- ❌ PROHIBIDO
   ```

2. **Borrar sesión**
   ```sql
   DELETE FROM sesion_caja WHERE id = '...'; -- ❌ PROHIBIDO
   ```

3. **Editar cierre_caja_detalle**
   ```sql
   UPDATE cierre_caja_detalle
   SET monto_total = 1000
   WHERE id = '...'; -- ❌ PROHIBIDO
   ```

4. **Borrar cierre_caja_detalle**
   ```sql
   DELETE FROM cierre_caja_detalle WHERE id = '...'; -- ❌ PROHIBIDO
   ```

5. **Borrar físicamente movimiento**
   ```sql
   DELETE FROM movimiento_caja WHERE id = '...'; -- ❌ PROHIBIDO
   ```

### ✅ SÍ SE PUEDE:

1. **Anular movimiento (soft-delete)**
   ```sql
   UPDATE movimiento_caja
   SET esta_activo = FALSE
   WHERE id = '...'; -- ✅ PERMITIDO
   ```

2. **Consultar cualquier dato**
   ```sql
   SELECT * FROM sesion_caja WHERE id = '...'; -- ✅ PERMITIDO
   ```

---

## 🌐 OFFLINE-FIRST E IDEMPOTENCIA

### Estrategia

El sistema soporta operación offline mediante:

1. **Cliente genera UUIDs**
   - `sesion_id` generado en cliente
   - `movimiento_id` generado en cliente
   - Server valida que no existan (idempotencia)

2. **Cliente envía timestamps**
   - `fecha_apertura` del cliente
   - `fecha_cierre` del cliente
   - `fecha` de movimientos del cliente
   - Server valida que no sean futuros

3. **Idempotencia automática**
   - Si UUID ya existe → retornar 200 con datos existentes
   - NO error 409 Conflict

### Ejemplo: Apertura Idempotente

**Request 1 (offline):**
```json
{
  "sesion_id": "770e8400-e29b-41d4-a716-446655440002",
  "sucursal_id": "550e8400-...",
  "empleado_id": "660e8400-...",
  "monto_inicial": 1000,
  "fecha_apertura": "2025-01-15T08:00:00.000Z"
}
```

**Response 1:**
```
201 Created
```

**Request 2 (cuando regresa conexión):**
```json
{
  "sesion_id": "770e8400-e29b-41d4-a716-446655440002", // MISMO UUID
  "sucursal_id": "550e8400-...",
  "empleado_id": "660e8400-...",
  "monto_inicial": 1000,
  "fecha_apertura": "2025-01-15T08:00:00.000Z"
}
```

**Response 2:**
```
200 OK (retorna datos existentes, NO error)
```

---

## 🔐 SEGURIDAD Y AUDITORÍA

### Trazabilidad Completa

Cada operación registra:
- **Quién:** `empleado_id`
- **Cuándo:** `fecha_apertura`, `fecha_cierre`, `fecha`
- **Qué:** Tipo de operación (apertura, cierre, movimiento)
- **Resultado:** Montos, diferencias, totales

### Logs Estructurados

```json
// Apertura
{
  "level": "info",
  "action": "caja.apertura",
  "sesion_id": "770e8400-...",
  "empleado_id": "660e8400-...",
  "sucursal_id": "550e8400-...",
  "monto_inicial": 1000.00,
  "timestamp": "2025-01-15T08:00:00.000Z",
  "request_id": "abc123-..."
}

// Cierre
{
  "level": "info",
  "action": "caja.cierre",
  "sesion_id": "770e8400-...",
  "empleado_id": "660e8400-...",
  "monto_final_esperado": 5230.50,
  "monto_final_real": 5250.00,
  "diferencia": 19.50,
  "timestamp": "2025-01-15T16:00:00.000Z",
  "request_id": "def456-..."
}

// Movimiento
{
  "level": "info",
  "action": "caja.movimiento",
  "movimiento_id": "990e8400-...",
  "sesion_id": "770e8400-...",
  "tipo": "ingreso",
  "monto": 500.00,
  "empleado_id": "660e8400-...",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "request_id": "ghi789-..."
}
```

### Snapshot Inmutable

El campo `cierre_inmutable_json` guarda TODO al momento del cierre:

```json
{
  "sesion_id": "770e8400-...",
  "numero_sesion": 123,
  "sucursal_id": "550e8400-...",
  "fecha_apertura": "2025-01-15T08:00:00.000Z",
  "fecha_cierre": "2025-01-15T16:00:00.000Z",
  "empleado_apertura": { "id": "...", "nombre": "Juan", "apellido": "Pérez" },
  "empleado_cierre": { "id": "...", "nombre": "María", "apellido": "González" },
  "monto_inicial": 1000.00,
  "monto_final_esperado": 5230.50,
  "monto_final_real": 5250.00,
  "diferencia": 19.50,
  "totales_por_forma_pago": [...],
  "movimientos": [...],
  "ventas_resumen": {
    "cantidad_total": 23,
    "monto_total": 4730.50
  },
  "timestamp_snapshot": "2025-01-15T16:00:05.000Z"
}
```

**Ventaja:** Si se borran datos relacionados, el JSON persiste para auditoría.

---

## 🧪 TESTING

### Tests Implementados

#### Unit Tests (1 archivo, 8+ tests)
- `backend/tests/unit/caja/sesion-caja.service.spec.ts`
  - ✅ Abrir caja exitosamente
  - ✅ Error si sucursal no existe
  - ✅ Error si empleado no existe
  - ✅ Error si ya hay caja abierta
  - ✅ Idempotencia en apertura
  - ✅ Cerrar caja exitosamente
  - ✅ Error si sesión no existe
  - ✅ Idempotencia en cierre
  - ✅ Obtener sesión activa

#### E2E Tests (1 archivo, 15+ tests)
- `backend/tests/e2e/caja/caja.e2e.spec.ts`
  - ✅ POST /abrir - exitoso
  - ✅ POST /abrir - 400 si falta campo
  - ✅ POST /abrir - 400 si UUID inválido
  - ✅ POST /abrir - 409 si ya hay caja abierta
  - ✅ POST /cerrar - exitoso
  - ✅ POST /cerrar - 404 si sesión no existe
  - ✅ POST /movimiento - ingreso exitoso
  - ✅ POST /movimiento - egreso exitoso
  - ✅ POST /movimiento - 409 si caja cerrada
  - ✅ GET /activa - retorna sesión activa
  - ✅ GET /activa - retorna null si no hay
  - ✅ GET /activa - 400 si falta sucursal_id
  - ✅ Request ID tracking
  - ✅ Request ID del cliente

### Ejecutar Tests

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Todos los tests
npm test

# Tests de caja específicamente
npm test -- caja
```

---

## 🔧 TROUBLESHOOTING

### Problema: "CAJA_ALREADY_OPEN"

**Síntoma:** No se puede abrir caja, error 409.

**Causa:** Ya existe una sesión abierta en la sucursal.

**Solución:**
```sql
-- Verificar sesiones abiertas
SELECT * FROM sesion_caja
WHERE sucursal_id = 'xxx' AND estado = 'abierta';

-- Si es error, cerrar sesión manualmente (SOLO EN DEV)
UPDATE sesion_caja
SET estado = 'cerrada',
    fecha_cierre = NOW(),
    empleado_cierre_id = 'xxx',
    monto_final_esperado = monto_inicial,
    monto_final_real = monto_inicial,
    diferencia = 0
WHERE id = 'xxx' AND estado = 'abierta';
```

### Problema: "CAJA_ALREADY_CLOSED"

**Síntoma:** No se puede crear movimiento, error 409.

**Causa:** La sesión ya está cerrada (inmutabilidad).

**Solución:** No se puede. Debes reabrir una nueva caja.

### Problema: Diferencia muy grande

**Síntoma:** `diferencia` es un monto alto (faltante o sobrante).

**Causa:** Posibles razones:
1. Ventas no registradas
2. Movimientos no registrados
3. Error en conteo físico

**Solución:**
```sql
-- Verificar ventas en efectivo
SELECT COUNT(*), SUM(total)
FROM venta v
INNER JOIN forma_pago fp ON v.forma_pago_id = fp.id
WHERE v.sesion_caja_id = 'xxx'
  AND fp.tipo = 'efectivo'
  AND v.esta_activo = TRUE;

-- Verificar movimientos
SELECT tipo, COUNT(*), SUM(monto)
FROM movimiento_caja
WHERE sesion_caja_id = 'xxx'
  AND esta_activo = TRUE
GROUP BY tipo;
```

### Problema: Query lento en cierre

**Síntoma:** Cierre tarda mucho (> 5s).

**Causa:** Muchas ventas/movimientos sin índices.

**Solución:**
```sql
-- Verificar índices
SHOW INDEX FROM venta WHERE Key_name LIKE '%sesion%';
SHOW INDEX FROM movimiento_caja;

-- Analizar query plan
EXPLAIN SELECT forma_pago_id, COUNT(*), SUM(total)
FROM venta
WHERE sesion_caja_id = 'xxx' AND esta_activo = TRUE
GROUP BY forma_pago_id;
```

---

## 📊 MÉTRICAS Y MONITOREO

### Métricas Clave

**Operacionales:**
- Tiempo promedio de apertura: < 500ms
- Tiempo promedio de cierre: < 2s
- Tiempo promedio de movimiento: < 200ms

**Negocio:**
- Sesiones abiertas simultáneas
- Diferencias promedio (faltantes/sobrantes)
- Movimientos promedio por sesión
- Ventas promedio por sesión

### Queries de Monitoreo

```sql
-- Sesiones abiertas actualmente
SELECT COUNT(*)
FROM sesion_caja
WHERE estado = 'abierta';

-- Diferencias altas (> $100)
SELECT sesion_id, numero_sesion, diferencia, fecha_cierre
FROM sesion_caja
WHERE estado = 'cerrada'
  AND ABS(diferencia) > 100
ORDER BY fecha_cierre DESC
LIMIT 10;

-- Sesiones del día
SELECT COUNT(*), SUM(diferencia)
FROM sesion_caja
WHERE DATE(fecha_apertura) = CURDATE();
```

---

## 🎯 PRÓXIMOS PASOS

### Fase 2 (Futuro)

1. **Permisos granulares**
   - Implementar verificación de `CAJA_ABRIR`
   - Implementar verificación de `CAJA_CERRAR`
   - Implementar verificación de `CAJA_MOVIMIENTO`

2. **Reportes**
   - Reporte de sesiones por período
   - Reporte de diferencias
   - Reporte de movimientos

3. **Notificaciones**
   - Alerta si diferencia > umbral
   - Alerta si sesión abierta > 12 horas
   - Alerta si movimiento grande (> umbral)

4. **Integración con Fiscal**
   - Asociar cierre con cierre fiscal
   - Validar totales contra facturación

---

**Fin de la Documentación**
**Versión:** 1.0.0
**Última actualización:** 2025-01-15

---

**Referencias:**
- Diseño completo: docs/CAJA-SYSTEM-DESIGN.md
- Migración DB: backend/migrations/007_create_caja_tables.sql
- Código fuente: backend/src/modules/caja/
- Tests: backend/tests/unit/caja/ y backend/tests/e2e/caja/
