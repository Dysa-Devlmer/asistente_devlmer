# DISEÑO DEL SISTEMA DE PAGOS

**Fecha:** 2025-12-15
**Iteración:** 5
**Estado:** CRÍTICO - Sistema confiable y auditable

---

## 📋 TABLA DE CONTENIDOS

1. [Objetivos](#objetivos)
2. [Modelo de Datos](#modelo-de-datos)
3. [Reglas de Negocio](#reglas-de-negocio)
4. [Contratos API](#contratos-api)
5. [Estados y Transiciones](#estados-y-transiciones)
6. [Audit](#auditoría)
7. [Offline-First](#offline-first)
8. [Idempotencia](#idempotencia)
9. [Integración Webpay](#integración-webpay)
10. [Reintentos](#reintentos)

---

## 🎯 OBJETIVOS

### Características Principales
- ✅ Sistema de pagos confiable y auditable
- ✅ Soporte para efectivo y Webpay
- ✅ Estados claros: pending, approved, rejected, failed, cancelled
- ✅ Asociación a venta y sesión de caja
- ✅ Reintentos seguros con backoff exponencial
- ✅ Idempotencia total
- ✅ Offline-first (efectivo primero, Webpay online)
- ✅ Reconciliación de pagos

### Prohibiciones
- ❌ NO tocar fiscal
- ❌ NO tocar frontend
- ❌ NO modificar sistema de caja
- ❌ NO modificar bootstrap

---

## 💾 MODELO DE DATOS

### 1. Tabla `pago`

Representa un intento de pago (efectivo o Webpay).

```sql
CREATE TABLE pago (
  -- Identificación
  id CHAR(36) PRIMARY KEY,                    -- UUID
  numero_pago VARCHAR(50) NULL,               -- Número secuencial legible (ej: "PAG-20250115-0001")

  -- Relaciones
  venta_id CHAR(36) NOT NULL,                 -- Venta asociada
  sesion_caja_id CHAR(36) NULL,               -- Sesión de caja (NULL si venta sin caja)
  forma_pago_id CHAR(36) NOT NULL,            -- Forma de pago (Efectivo, Webpay, etc.)

  -- Montos
  monto DECIMAL(12,2) NOT NULL,               -- Monto total del pago
  monto_pagado DECIMAL(12,2) NULL,            -- Monto efectivamente pagado (puede ser != monto en casos de error)

  -- Estado del pago
  estado ENUM(
    'pending',     -- Pendiente (creado pero no procesado)
    'processing',  -- En proceso (esperando respuesta Webpay)
    'approved',    -- Aprobado
    'rejected',    -- Rechazado (por banco, fondos insuficientes, etc.)
    'failed',      -- Falló técnicamente (timeout, error servidor, etc.)
    'cancelled'    -- Cancelado por usuario/sistema
  ) NOT NULL DEFAULT 'pending',

  -- Metadata del pago
  metodo VARCHAR(50) NOT NULL,                -- 'efectivo', 'webpay', 'webpay_plus', etc.

  -- Información de efectivo (si aplica)
  monto_recibido DECIMAL(12,2) NULL,          -- Efectivo recibido
  monto_cambio DECIMAL(12,2) NULL,            -- Vuelto entregado

  -- Información de Webpay (si aplica)
  webpay_token VARCHAR(255) NULL,             -- Token de transacción Webpay
  webpay_buy_order VARCHAR(100) NULL,         -- Orden de compra Webpay
  webpay_session_id VARCHAR(100) NULL,        -- ID de sesión Webpay
  webpay_authorization_code VARCHAR(50) NULL, -- Código de autorización
  webpay_card_number VARCHAR(20) NULL,        -- Últimos 4 dígitos tarjeta (ej: "**** **** **** 1234")
  webpay_transaction_date DATETIME NULL,      -- Fecha/hora transacción en Webpay
  webpay_response_code VARCHAR(10) NULL,      -- Código respuesta Webpay (0 = aprobado)

  -- Timestamps
  fecha_inicio DATETIME NOT NULL,             -- Cuándo se inició el pago
  fecha_completado DATETIME NULL,             -- Cuándo se completó (approved/rejected/failed)

  -- Auditoría
  empleado_id CHAR(36) NOT NULL,              -- Empleado que procesó el pago
  terminal_id VARCHAR(50) NULL,               -- ID del terminal POS
  ip_address VARCHAR(45) NULL,                -- IP desde donde se originó

  -- Reintentos
  intentos_procesamiento INT NOT NULL DEFAULT 0,  -- Número de intentos
  ultimo_error TEXT NULL,                     -- Último error capturado

  -- Notas
  notas TEXT NULL,                            -- Notas adicionales

  -- Soft delete
  esta_activo BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE = anulado
  motivo_anulacion TEXT NULL,                 -- Razón de anulación
  fecha_anulacion DATETIME NULL,              -- Cuándo se anuló

  -- Timestamps de auditoría
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Índices para performance
  INDEX idx_venta (venta_id),
  INDEX idx_sesion_caja (sesion_caja_id),
  INDEX idx_forma_pago (forma_pago_id),
  INDEX idx_estado (estado),
  INDEX idx_metodo (metodo),
  INDEX idx_fecha_inicio (fecha_inicio),
  INDEX idx_webpay_token (webpay_token),
  INDEX idx_numero_pago (numero_pago),
  INDEX idx_activo (esta_activo),
  INDEX idx_empleado (empleado_id),

  -- Foreign Keys
  CONSTRAINT fk_pago_venta FOREIGN KEY (venta_id)
    REFERENCES venta(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pago_sesion_caja FOREIGN KEY (sesion_caja_id)
    REFERENCES sesion_caja(id) ON DELETE SET NULL,
  CONSTRAINT fk_pago_forma_pago FOREIGN KEY (forma_pago_id)
    REFERENCES forma_pago(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pago_empleado FOREIGN KEY (empleado_id)
    REFERENCES empleado(id) ON DELETE RESTRICT,

  -- Constraints de negocio
  CONSTRAINT chk_monto_positivo CHECK (monto > 0),
  CONSTRAINT chk_monto_pagado_positivo CHECK (monto_pagado IS NULL OR monto_pagado >= 0),
  CONSTRAINT chk_efectivo_consistente CHECK (
    -- Si es efectivo, debe tener monto_recibido y cambio calculado
    (metodo = 'efectivo' AND monto_recibido IS NOT NULL AND monto_cambio IS NOT NULL)
    OR
    -- Si NO es efectivo, no debe tener estos campos
    (metodo != 'efectivo' AND monto_recibido IS NULL AND monto_cambio IS NULL)
  ),
  CONSTRAINT chk_webpay_consistente CHECK (
    -- Si es Webpay aprobado, debe tener token y authorization_code
    (metodo LIKE 'webpay%' AND estado = 'approved' AND webpay_token IS NOT NULL AND webpay_authorization_code IS NOT NULL)
    OR
    -- Si NO es Webpay aprobado, puede no tenerlos
    (estado != 'approved' OR metodo NOT LIKE 'webpay%')
  ),
  CONSTRAINT chk_estado_fecha CHECK (
    -- Si está completado (approved/rejected/failed), debe tener fecha_completado
    (estado IN ('approved', 'rejected', 'failed', 'cancelled') AND fecha_completado IS NOT NULL)
    OR
    -- Si está pendiente/processing, NO debe tener fecha_completado
    (estado IN ('pending', 'processing') AND fecha_completado IS NULL)
  ),
  CONSTRAINT chk_anulacion_consistente CHECK (
    -- Si está anulado, debe tener motivo y fecha
    (esta_activo = FALSE AND motivo_anulacion IS NOT NULL AND fecha_anulacion IS NOT NULL)
    OR
    -- Si está activo, NO debe tener datos de anulación
    (esta_activo = TRUE AND motivo_anulacion IS NULL AND fecha_anulacion IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Pagos de ventas - Efectivo y Webpay';
```

### 2. Tabla `pago_intento`

Registra cada intento de procesamiento de pago (para Webpay principalmente).

```sql
CREATE TABLE pago_intento (
  -- Identificación
  id CHAR(36) PRIMARY KEY,                    -- UUID
  pago_id CHAR(36) NOT NULL,                  -- Pago al que pertenece

  -- Intento
  numero_intento INT NOT NULL,                -- 1, 2, 3, etc.
  estado_resultante ENUM(
    'success',       -- Intento exitoso
    'error',         -- Error técnico
    'rejected',      -- Rechazado por banco
    'timeout',       -- Timeout
    'cancelled'      -- Cancelado por usuario
  ) NOT NULL,

  -- Detalles del intento
  request_payload JSON NULL,                  -- Request enviado
  response_payload JSON NULL,                 -- Response recibido
  error_message TEXT NULL,                    -- Mensaje de error (si aplica)
  error_code VARCHAR(50) NULL,                -- Código de error

  -- Timing
  fecha_inicio DATETIME NOT NULL,             -- Inicio del intento
  fecha_fin DATETIME NULL,                    -- Fin del intento
  duracion_ms INT NULL,                       -- Duración en milisegundos

  -- Auditoría (inmutable - no tiene updated_at)
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Índices
  INDEX idx_pago (pago_id),
  INDEX idx_numero_intento (numero_intento),
  INDEX idx_estado (estado_resultante),
  INDEX idx_fecha_inicio (fecha_inicio),

  -- Foreign Keys
  CONSTRAINT fk_intento_pago FOREIGN KEY (pago_id)
    REFERENCES pago(id) ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT chk_numero_intento_positivo CHECK (numero_intento > 0),
  CONSTRAINT chk_duracion_positiva CHECK (duracion_ms IS NULL OR duracion_ms >= 0),

  -- Evitar duplicados
  CONSTRAINT uq_pago_numero_intento UNIQUE (pago_id, numero_intento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Intentos de procesamiento de pagos - Auditoría de reintentos';
```

### 3. Relación con `venta`

La tabla `venta` debe tener referencia al pago principal:

```sql
-- NOTA: Solo agregar si la columna NO existe
-- Esta modificación se hace en la migración

ALTER TABLE venta
  ADD COLUMN pago_id CHAR(36) NULL COMMENT 'Pago principal de la venta';

ALTER TABLE venta
  ADD CONSTRAINT fk_venta_pago
  FOREIGN KEY (pago_id) REFERENCES pago(id) ON DELETE SET NULL;

ALTER TABLE venta
  ADD INDEX idx_venta_pago (pago_id);
```

**Importante:**
- Una venta puede tener múltiples pagos (ej: pago parcial efectivo + tarjeta)
- El campo `venta.pago_id` apunta al pago principal/total
- Para obtener TODOS los pagos de una venta, consultar `pago.venta_id`

---

## 📐 REGLAS DE NEGOCIO

### 1. Creación de Pago

**PRE-CONDICIONES:**
1. La venta debe existir y estar activa
2. La forma de pago debe existir y estar activa
3. El monto debe ser > 0
4. Si hay sesión de caja, debe estar abierta
5. Si es efectivo, `monto_recibido >= monto`

**PROCESO (Efectivo):**
1. Validar pre-condiciones
2. Calcular `monto_cambio = monto_recibido - monto`
3. Crear registro en `pago` con:
   - `estado = 'approved'` (efectivo se aprueba inmediatamente)
   - `metodo = 'efectivo'`
   - `fecha_completado = NOW()`
   - `monto_pagado = monto`
4. Actualizar `venta.pago_id` si es el pago principal
5. Retornar respuesta exitosa

**PROCESO (Webpay):**
1. Validar pre-condiciones
2. Generar `webpay_buy_order` único (ej: UUID o timestamp)
3. Crear registro en `pago` con:
   - `estado = 'pending'`
   - `metodo = 'webpay'` o `'webpay_plus'`
   - `fecha_inicio = NOW()`
4. Iniciar transacción con Webpay:
   - Llamar a Webpay API `/transactions`
   - Obtener `token` y `url`
   - Guardar `webpay_token` en registro
   - Actualizar `estado = 'processing'`
5. Crear registro en `pago_intento` (intento #1)
6. Retornar URL de Webpay para redirección

**POST-CONDICIONES:**
- Pago registrado en BD
- Estado coherente con método de pago
- Audit trail completo

**ERRORES:**
- `VENTA_NOT_FOUND`: Venta no existe
- `FORMA_PAGO_NOT_FOUND`: Forma de pago no existe
- `CAJA_NOT_OPEN`: Sesión de caja cerrada (si aplica)
- `INVALID_AMOUNT`: Monto inválido
- `INSUFFICIENT_CASH`: Efectivo recibido menor al monto
- `WEBPAY_INIT_ERROR`: Error al iniciar transacción Webpay

---

### 2. Confirmación de Pago Webpay

**PRE-CONDICIONES:**
1. El pago debe existir
2. El pago debe estar en estado `processing`
3. El token debe coincidir

**PROCESO:**
1. Validar pre-condiciones
2. Consultar estado en Webpay con token
3. Procesar respuesta:
   - **Si approved (response_code = 0):**
     - Actualizar `estado = 'approved'`
     - Guardar `webpay_authorization_code`, `webpay_card_number`, etc.
     - Establecer `fecha_completado = NOW()`
     - `monto_pagado = monto`
   - **Si rejected (response_code != 0):**
     - Actualizar `estado = 'rejected'`
     - Guardar `webpay_response_code`
     - Establecer `fecha_completado = NOW()`
     - `monto_pagado = 0`
   - **Si error técnico:**
     - Actualizar `estado = 'failed'`
     - Guardar error en `ultimo_error`
     - Incrementar `intentos_procesamiento`
4. Crear registro en `pago_intento` con resultado
5. Actualizar `venta.pago_id` si es aprobado
6. Retornar respuesta

**POST-CONDICIONES:**
- Pago con estado final
- Intento registrado
- Venta actualizada

**ERRORES:**
- `PAGO_NOT_FOUND`: Pago no existe
- `INVALID_STATE`: Pago no está en processing
- `TOKEN_MISMATCH`: Token no coincide
- `WEBPAY_CONFIRM_ERROR`: Error al confirmar con Webpay

---

### 3. Reintentos Automáticos

**APLICABLE A:** Pagos en estado `failed` o `processing` con timeout

**ESTRATEGIA:** Backoff exponencial
```
Intento 1: Inmediato
Intento 2: 5 segundos después
Intento 3: 15 segundos después
Intento 4: 45 segundos después
Intento 5: 2 minutos después
Máximo: 5 intentos
```

**PROCESO:**
1. Verificar que `intentos_procesamiento < 5`
2. Esperar según backoff
3. Intentar confirmar con Webpay nuevamente
4. Registrar intento en `pago_intento`
5. Si falla 5 veces, marcar `estado = 'failed'` permanentemente

**IMPORTANTE:**
- Los reintentos NO crean nuevos pagos
- Se reutiliza el mismo `pago_id`
- Idempotencia garantizada por `webpay_token`

---

### 4. Anulación de Pago

**PRE-CONDICIONES:**
1. El pago debe existir
2. El pago debe estar `esta_activo = TRUE`
3. Usuario debe tener permiso `PAGO_ANULAR`
4. **Solo se puede anular si:**
   - Estado = `pending` (nunca se procesó), O
   - Estado = `failed` (falló técnicamente), O
   - Estado = `approved` Y han pasado < 24 horas (reversión)

**PROCESO:**
1. Validar pre-condiciones
2. Si `estado = 'approved'` y Webpay:
   - Llamar a Webpay API para reversar transacción
   - Si reversa exitosa, continuar
   - Si falla, retornar error
3. Actualizar registro:
   - `esta_activo = FALSE`
   - `motivo_anulacion = motivo_proporcionado`
   - `fecha_anulacion = NOW()`
4. Si es el pago principal, actualizar `venta.pago_id = NULL`
5. Retornar confirmación

**POST-CONDICIONES:**
- Pago anulado (soft-delete)
- Venta sin referencia al pago
- Audit trail preservado

**ERRORES:**
- `PAGO_NOT_FOUND`: Pago no existe
- `PAGO_ALREADY_CANCELLED`: Ya estaba anulado
- `CANNOT_CANCEL_APPROVED`: No se puede anular (>24h o sin reversión Webpay)
- `INSUFFICIENT_PERMISSIONS`: Sin permiso
- `WEBPAY_REVERSAL_ERROR`: Error al reversar en Webpay

---

### 5. Consulta de Estado

**ENDPOINT:** `GET /api/pagos/:id/estado`

**PROCESO:**
1. Buscar pago por ID
2. Si no existe, retornar 404
3. Si `estado = 'processing'`:
   - Consultar estado actual en Webpay
   - Actualizar registro si cambió
4. Retornar estado actualizado

**IMPORTANTE:**
- Este endpoint es idempotente
- Puede cambiar el estado si Webpay ya respondió
- Útil para polling del cliente

---

## 🔄 ESTADOS Y TRANSICIONES

### Diagrama de Estados

```
                    ┌─────────┐
                    │ pending │
                    └────┬────┘
                         │
                         ▼
                  ┌─────────────┐
          ┌───────│ processing  │──────┐
          │       └─────────────┘      │
          │                            │
          ▼                            ▼
    ┌──────────┐               ┌──────────┐
    │ approved │               │ rejected │
    └──────────┘               └──────────┘
          │                            │
          │                            │
          └────────┐          ┌────────┘
                   │          │
                   ▼          ▼
              ┌──────────────────┐
              │     failed       │
              └────────┬─────────┘
                       │
                       ▼
                ┌──────────────┐
                │  cancelled   │
                └──────────────┘
```

### Transiciones Válidas

| Estado Actual | Estados Permitidos | Condición |
|---------------|-------------------|-----------|
| `pending` | `processing`, `approved`, `cancelled` | Iniciar procesamiento, aprobar efectivo, cancelar |
| `processing` | `approved`, `rejected`, `failed`, `cancelled` | Resultado de Webpay |
| `approved` | `cancelled` | Solo con reversión (< 24h) |
| `rejected` | `cancelled` | Anulación administrativa |
| `failed` | `processing`, `cancelled` | Reintento o anulación |
| `cancelled` | NINGUNO | Estado final |

**Reglas:**
- Estados `approved`, `rejected`, `failed` son cuasi-finales (solo permiten `cancelled`)
- Estado `cancelled` es final absoluto
- Transición `failed` → `processing` solo con reintentos (max 5)

---

## 🔐 AUDITORÍA

### Campos de Auditoría en `pago`

1. **Quién:**
   - `empleado_id`: Empleado que procesó
   - `terminal_id`: Terminal usado
   - `ip_address`: IP de origen

2. **Cuándo:**
   - `fecha_inicio`: Inicio del pago
   - `fecha_completado`: Fin del pago
   - `created_at`: Creación del registro
   - `updated_at`: Última modificación
   - `fecha_anulacion`: Si fue anulado

3. **Qué:**
   - `estado`: Estado actual
   - `metodo`: Método de pago
   - `monto`: Monto solicitado
   - `monto_pagado`: Monto efectivamente pagado
   - Campos Webpay completos

4. **Cómo:**
   - `intentos_procesamiento`: Número de intentos
   - `ultimo_error`: Último error
   - Tabla `pago_intento`: Historial completo

### Trazabilidad Completa

**Pregunta:** ¿Qué pasó con el pago X?

**Respuesta:**
```sql
SELECT
  p.*,
  pi.numero_intento,
  pi.estado_resultante,
  pi.error_message,
  pi.duracion_ms
FROM pago p
LEFT JOIN pago_intento pi ON p.id = pi.pago_id
WHERE p.id = 'xxx'
ORDER BY pi.numero_intento ASC;
```

---

## 📱 OFFLINE-FIRST

### Estrategia por Método

#### Efectivo
- **100% Offline:** Se procesa localmente
- Cliente genera UUID
- Se crea registro en IndexedDB local
- Sincroniza cuando hay conexión

#### Webpay
- **Online Obligatorio:** Requiere conexión
- Si no hay conexión, mostrar error al usuario
- Cliente debe verificar conectividad antes de iniciar

### Sincronización

**Uplink (Cliente → Servidor):**
```json
POST /api/pagos
{
  "pago_id": "uuid-generado-cliente",
  "venta_id": "...",
  "metodo": "efectivo",
  "monto": 1000,
  "monto_recibido": 1500,
  "fecha_inicio": "2025-12-15T10:30:00Z",
  ...
}
```

**Idempotencia:**
- Si `pago_id` ya existe, retornar 200 con pago existente
- No duplicar

**Downlink (Servidor → Cliente):**
- Endpoint `/api/pagos/delta?since=timestamp`
- Retorna pagos creados/modificados desde timestamp
- Cliente actualiza su IndexedDB

---

## 🔁 IDEMPOTENCIA

### Garantías

1. **Mismo UUID = Mismo pago:**
   ```typescript
   // Cliente
   const pagoId = generateUUID();
   await crearPago({ pago_id: pagoId, ... });

   // Si falla y reintenta
   await crearPago({ pago_id: pagoId, ... }); // Retorna el existente
   ```

2. **Webpay token único:**
   - El token de Webpay es único por transacción
   - Reintentos con mismo token no crean transacciones duplicadas
   - Webpay mismo garantiza idempotencia

3. **Check de existencia:**
   ```sql
   -- En el servicio, antes de crear
   SELECT * FROM pago WHERE id = ?;
   IF EXISTS THEN RETURN existing;
   ELSE CREATE new;
   ```

---

## 🌐 INTEGRACIÓN WEBPAY

### Flujo Completo

#### 1. Iniciar Transacción

**Request a Webpay:**
```http
POST https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions
Content-Type: application/json
Tbk-Api-Key-Id: 597055555532
Tbk-Api-Key-Secret: 579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C

{
  "buy_order": "pago-uuid-123",
  "session_id": "sesion-uuid-456",
  "amount": 10000,
  "return_url": "https://misitioweb.com/api/pagos/webpay/callback"
}
```

**Response de Webpay:**
```json
{
  "token": "01ab23cd45ef67890123",
  "url": "https://webpay3gint.transbank.cl/webpayserver/initTransaction"
}
```

**Acción en nuestro sistema:**
1. Guardar `webpay_token`
2. Actualizar `estado = 'processing'`
3. Retornar URL al cliente para redirección

#### 2. Usuario Paga (en Webpay)

- Cliente redirige a `url` con `token_ws=...`
- Usuario ingresa datos de tarjeta
- Webpay procesa
- Webpay redirige a `return_url?token_ws=...`

#### 3. Confirmar Transacción

**Cuando Webpay redirige a callback:**

```http
GET /api/pagos/webpay/callback?token_ws=01ab23cd45ef67890123
```

**Nuestro backend hace:**

```http
PUT https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions/{token}
Content-Type: application/json
Tbk-Api-Key-Id: 597055555532
Tbk-Api-Key-Secret: ...
```

**Response de Webpay (si aprobado):**
```json
{
  "vci": "TSY",
  "amount": 10000,
  "status": "AUTHORIZED",
  "buy_order": "pago-uuid-123",
  "session_id": "sesion-uuid-456",
  "card_detail": {
    "card_number": "6623"
  },
  "accounting_date": "1215",
  "transaction_date": "2025-12-15T10:35:42.000Z",
  "authorization_code": "1213",
  "payment_type_code": "VN",
  "response_code": 0,
  "installments_number": 0
}
```

**Acción en nuestro sistema:**
1. Validar `buy_order` corresponde al pago
2. Si `response_code = 0`: Actualizar `estado = 'approved'`
3. Si `response_code != 0`: Actualizar `estado = 'rejected'`
4. Guardar todos los campos Webpay
5. Establecer `fecha_completado`
6. Crear registro en `pago_intento`

#### 4. Manejo de Errores

**Timeout (usuario no completa pago):**
- Webpay redirige con `TBK_TOKEN=...` o simplemente timeout
- Nuestro sistema: `estado = 'failed'` o `'cancelled'`
- Permitir reintento

**Error Técnico:**
- Capturar excepción
- Guardar en `ultimo_error`
- `estado = 'failed'`
- Incrementar `intentos_procesamiento`
- Aplicar backoff para reintento

---

## 🔄 REINTENTOS

### Política de Reintentos

**Aplicable a:** Errores técnicos (no rechazos de banco)

**Backoff Exponencial:**
```typescript
const delays = [0, 5000, 15000, 45000, 120000]; // ms
const maxRetries = 5;

async function retryPayment(pagoId: string, attempt: number) {
  if (attempt > maxRetries) {
    await markAsFailed(pagoId);
    return;
  }

  const delay = delays[attempt - 1] || delays[delays.length - 1];
  await sleep(delay);

  try {
    const result = await confirmWebpay(pagoId);
    if (result.success) {
      await markAsApproved(pagoId, result);
    } else {
      await retryPayment(pagoId, attempt + 1);
    }
  } catch (error) {
    await logAttempt(pagoId, attempt, error);
    await retryPayment(pagoId, attempt + 1);
  }
}
```

**Registro de Intentos:**
Cada intento se guarda en `pago_intento` con:
- `numero_intento`: 1, 2, 3, ...
- `estado_resultante`: success, error, timeout
- `duracion_ms`: Tiempo que tomó
- `error_message`: Si falló
- `request_payload` y `response_payload`: Para debugging

---

## 📊 CONTRATOS API

### 1. POST /api/pagos/crear

Crear un nuevo pago.

**Request Body:**
```json
{
  "pago_id": "550e8400-e29b-41d4-a716-446655440000",
  "venta_id": "660e8400-e29b-41d4-a716-446655440001",
  "sesion_caja_id": "770e8400-e29b-41d4-a716-446655440002",
  "forma_pago_id": "880e8400-e29b-41d4-a716-446655440003",
  "empleado_id": "990e8400-e29b-41d4-a716-446655440004",
  "monto": 15000.00,
  "metodo": "efectivo",
  "monto_recibido": 20000.00,
  "notas": "Pago en efectivo",
  "fecha_inicio": "2025-12-15T10:30:00.000Z"
}
```

**Response (Efectivo - 201 Created):**
```json
{
  "success": true,
  "data": {
    "pago_id": "550e8400-e29b-41d4-a716-446655440000",
    "venta_id": "660e8400-e29b-41d4-a716-446655440001",
    "estado": "approved",
    "metodo": "efectivo",
    "monto": 15000.00,
    "monto_pagado": 15000.00,
    "monto_recibido": 20000.00,
    "monto_cambio": 5000.00,
    "fecha_inicio": "2025-12-15T10:30:00.000Z",
    "fecha_completado": "2025-12-15T10:30:00.000Z"
  }
}
```

**Response (Webpay - 201 Created):**
```json
{
  "success": true,
  "data": {
    "pago_id": "550e8400-e29b-41d4-a716-446655440000",
    "venta_id": "660e8400-e29b-41d4-a716-446655440001",
    "estado": "processing",
    "metodo": "webpay",
    "monto": 15000.00,
    "webpay_token": "01ab23cd45ef67890123",
    "webpay_url": "https://webpay3gint.transbank.cl/webpayserver/initTransaction",
    "fecha_inicio": "2025-12-15T10:30:00.000Z"
  }
}
```

---

### 2. GET /api/pagos/:id

Obtener detalles de un pago.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pago_id": "550e8400-e29b-41d4-a716-446655440000",
    "numero_pago": "PAG-20251215-0001",
    "venta_id": "660e8400-e29b-41d4-a716-446655440001",
    "sesion_caja_id": "770e8400-e29b-41d4-a716-446655440002",
    "forma_pago_id": "880e8400-e29b-41d4-a716-446655440003",
    "forma_pago_nombre": "Webpay Plus",
    "estado": "approved",
    "metodo": "webpay",
    "monto": 15000.00,
    "monto_pagado": 15000.00,
    "webpay_authorization_code": "1213",
    "webpay_card_number": "**** **** **** 6623",
    "webpay_transaction_date": "2025-12-15T10:35:42.000Z",
    "fecha_inicio": "2025-12-15T10:30:00.000Z",
    "fecha_completado": "2025-12-15T10:35:42.000Z",
    "empleado_id": "990e8400-e29b-41d4-a716-446655440004",
    "empleado_nombre": "Juan Pérez",
    "intentos_procesamiento": 1,
    "esta_activo": true,
    "created_at": "2025-12-15T10:30:00.000Z",
    "updated_at": "2025-12-15T10:35:42.000Z"
  }
}
```

---

### 3. POST /api/pagos/webpay/confirmar

Confirmar pago Webpay (callback después de redirección).

**Request Body:**
```json
{
  "token_ws": "01ab23cd45ef67890123"
}
```

**Response (200 OK - Aprobado):**
```json
{
  "success": true,
  "data": {
    "pago_id": "550e8400-e29b-41d4-a716-446655440000",
    "estado": "approved",
    "webpay_authorization_code": "1213",
    "webpay_card_number": "**** **** **** 6623",
    "monto_pagado": 15000.00,
    "fecha_completado": "2025-12-15T10:35:42.000Z"
  }
}
```

**Response (200 OK - Rechazado):**
```json
{
  "success": true,
  "data": {
    "pago_id": "550e8400-e29b-41d4-a716-446655440000",
    "estado": "rejected",
    "webpay_response_code": "-1",
    "motivo_rechazo": "Transacción rechazada por el emisor",
    "fecha_completado": "2025-12-15T10:35:42.000Z"
  }
}
```

---

### 4. DELETE /api/pagos/:id/anular

Anular un pago.

**Request Body:**
```json
{
  "empleado_id": "990e8400-e29b-41d4-a716-446655440004",
  "motivo": "Error en el monto registrado"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pago_id": "550e8400-e29b-41d4-a716-446655440000",
    "esta_activo": false,
    "motivo_anulacion": "Error en el monto registrado",
    "fecha_anulacion": "2025-12-15T11:00:00.000Z"
  }
}
```

---

### 5. GET /api/pagos/venta/:venta_id

Obtener todos los pagos de una venta.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "venta_id": "660e8400-e29b-41d4-a716-446655440001",
    "total_pagos": 2,
    "monto_total_pagado": 15000.00,
    "pagos": [
      {
        "pago_id": "550e8400-e29b-41d4-a716-446655440000",
        "estado": "approved",
        "metodo": "efectivo",
        "monto": 10000.00,
        "fecha_completado": "2025-12-15T10:30:00.000Z"
      },
      {
        "pago_id": "550e8400-e29b-41d4-a716-446655440011",
        "estado": "approved",
        "metodo": "webpay",
        "monto": 5000.00,
        "fecha_completado": "2025-12-15T10:35:42.000Z"
      }
    ]
  }
}
```

---

### 6. GET /api/pagos/delta

Obtener cambios incrementales (sincronización).

**Query Parameters:**
- `since` (ISO 8601 timestamp, required)
- `sucursal_id` (UUID, optional)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "since": "2025-12-15T10:00:00.000Z",
    "until": "2025-12-15T14:30:00.000Z",
    "total_changes": 3,
    "pagos": [
      {
        "pago_id": "550e8400-e29b-41d4-a716-446655440000",
        "venta_id": "660e8400-e29b-41d4-a716-446655440001",
        "estado": "approved",
        "metodo": "efectivo",
        "monto": 10000.00,
        "updated_at": "2025-12-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

## 🔒 SEGURIDAD

### 1. Validación de Montos

```typescript
// En el servicio
if (monto <= 0) {
  throw new InvalidAmountError();
}

if (metodo === 'efectivo' && monto_recibido < monto) {
  throw new InsufficientCashError(monto, monto_recibido);
}
```

### 2. Validación de Estados

```typescript
// Solo permitir transiciones válidas
const validTransitions = {
  'pending': ['processing', 'approved', 'cancelled'],
  'processing': ['approved', 'rejected', 'failed', 'cancelled'],
  // ...
};

if (!validTransitions[currentState].includes(newState)) {
  throw new InvalidStateTransitionError(currentState, newState);
}
```

### 3. Protección contra Duplicados

```typescript
// Verificar idempotencia
const existing = await pagoRepo.obtenerPorId(pago_id);
if (existing) {
  return existing; // Retornar sin error
}
```

### 4. Sanitización de Datos Webpay

```typescript
// Solo exponer últimos 4 dígitos de tarjeta
const cardNumber = webpayResponse.card_detail.card_number;
const masked = `**** **** **** ${cardNumber.slice(-4)}`;
```

### 5. Timeout de Sesiones Webpay

```typescript
// Marcar como failed si han pasado > 15 minutos en processing
const MAX_PROCESSING_TIME = 15 * 60 * 1000; // 15 min

if (estado === 'processing' && Date.now() - fecha_inicio > MAX_PROCESSING_TIME) {
  await markAsFailed(pago_id, 'Timeout - No se completó la transacción');
}
```

---

## 📈 MÉTRICAS Y MONITOREO

### KPIs Importantes

1. **Tasa de aprobación:**
   ```sql
   SELECT
     COUNT(CASE WHEN estado = 'approved' THEN 1 END) * 100.0 / COUNT(*) AS tasa_aprobacion
   FROM pago
   WHERE metodo LIKE 'webpay%'
     AND fecha_inicio >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
   ```

2. **Tiempo promedio de procesamiento:**
   ```sql
   SELECT
     AVG(TIMESTAMPDIFF(SECOND, fecha_inicio, fecha_completado)) AS segundos_promedio
   FROM pago
   WHERE estado IN ('approved', 'rejected')
     AND fecha_completado IS NOT NULL;
   ```

3. **Tasa de reintentos:**
   ```sql
   SELECT
     COUNT(CASE WHEN intentos_procesamiento > 1 THEN 1 END) * 100.0 / COUNT(*) AS tasa_reintentos
   FROM pago;
   ```

4. **Distribución por método:**
   ```sql
   SELECT
     metodo,
     COUNT(*) AS total,
     SUM(monto_pagado) AS monto_total
   FROM pago
   WHERE estado = 'approved'
     AND esta_activo = TRUE
   GROUP BY metodo;
   ```

---

## 🧪 CASOS DE PRUEBA

### Caso 1: Pago Efectivo Exitoso
1. Crear venta
2. Crear pago efectivo con monto_recibido > monto
3. Verificar estado = 'approved'
4. Verificar monto_cambio calculado correctamente

### Caso 2: Pago Webpay Exitoso
1. Crear venta
2. Iniciar pago Webpay
3. Simular callback de Webpay con response_code = 0
4. Confirmar pago
5. Verificar estado = 'approved'
6. Verificar campos Webpay guardados

### Caso 3: Pago Webpay Rechazado
1. Crear venta
2. Iniciar pago Webpay
3. Simular callback con response_code = -1
4. Confirmar pago
5. Verificar estado = 'rejected'

### Caso 4: Reintento Exitoso
1. Crear pago Webpay
2. Simular timeout en primer intento
3. Verificar estado = 'failed', intentos = 1
4. Ejecutar reintento
5. Simular éxito en segundo intento
6. Verificar estado = 'approved', intentos = 2

### Caso 5: Anulación de Pago Aprobado
1. Crear pago approved (< 24h)
2. Simular reversión exitosa en Webpay
3. Anular pago
4. Verificar esta_activo = FALSE
5. Verificar motivo_anulacion guardado

### Caso 6: Idempotencia
1. Crear pago con UUID específico
2. Intentar crear mismo pago nuevamente
3. Verificar que retorna 200 con pago existente
4. Verificar que NO se creó duplicado

---

## 📚 REFERENCIAS

- [Documentación Webpay Plus](https://www.transbankdevelopers.cl/documentacion/webpay-plus)
- [API Reference Transbank](https://www.transbankdevelopers.cl/referencia/webpay)
- Sistema de Caja (Iteración 4)
- Bootstrap API (Iteraciones 1-2)

---

**FIN DEL DOCUMENTO DE DISEÑO**
