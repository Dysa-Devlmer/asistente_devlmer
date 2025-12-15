# SISTEMA DE PAGOS - Guía de Usuario

**Fecha:** 2025-12-15
**Iteración:** 5
**Versión:** 1.0.0
**Estado:** Producción

---

## 📋 TABLA DE CONTENIDOS

1. [Introducción](#introducción)
2. [Arquitectura](#arquitectura)
3. [API Endpoints](#api-endpoints)
4. [Flujos de Negocio](#flujos-de-negocio)
5. [Offline-First](#offline-first)
6. [Troubleshooting](#troubleshooting)
7. [Testing](#testing)

---

## 🎯 INTRODUCCIÓN

### Propósito

Implementar un sistema de pagos confiable y auditable para el sistema POS de venta, con soporte para:
- **Efectivo**: Aprobación inmediata con cálculo de cambio
- **Webpay**: Integración con Transbank para pagos con tarjeta

### Características Principales

- ✅ **Múltiples métodos de pago**: Efectivo y Webpay
- ✅ **Estados claros**: pending, processing, approved, rejected, failed, cancelled
- ✅ **Idempotencia total**: Mismo UUID = mismo resultado
- ✅ **Offline-first**: Efectivo funciona sin conexión
- ✅ **Reintentos automáticos**: Con backoff exponencial
- ✅ **Auditoría completa**: Todos los intentos registrados
- ✅ **Anulación segura**: Con reversión Webpay (< 24h)

---

## 🏗️ ARQUITECTURA

### Modelo de Datos

#### Tabla `pago`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `venta_id` | UUID | Venta asociada |
| `sesion_caja_id` | UUID | Sesión de caja (nullable) |
| `forma_pago_id` | UUID | Forma de pago |
| `monto` | DECIMAL | Monto del pago |
| `estado` | ENUM | pending, processing, approved, rejected, failed, cancelled |
| `metodo` | VARCHAR | efectivo, webpay, webpay_plus |
| `monto_recibido` | DECIMAL | Efectivo recibido (si aplica) |
| `monto_cambio` | DECIMAL | Vuelto (si aplica) |
| `webpay_token` | VARCHAR | Token Webpay (si aplica) |
| `webpay_authorization_code` | VARCHAR | Código de autorización (si aprobado) |
| `fecha_inicio` | DATETIME | Cuándo se inició |
| `fecha_completado` | DATETIME | Cuándo se completó |
| `esta_activo` | BOOLEAN | FALSE = anulado |

#### Tabla `pago_intento`

Registra cada intento de procesamiento para auditoría y debugging.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `pago_id` | UUID | Pago al que pertenece |
| `numero_intento` | INT | 1, 2, 3, etc. |
| `estado_resultante` | ENUM | success, error, rejected, timeout |
| `request_payload` | JSON | Request enviado |
| `response_payload` | JSON | Response recibido |
| `duracion_ms` | INT | Duración del intento |

### Flujo de Estados

```
pending → processing → approved
                     ↓
                  rejected
                     ↓
                  failed
                     ↓
                cancelled
```

### Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| POST /api/pagos/crear | 30 req | 60s |
| POST /api/pagos/webpay/confirmar | 30 req | 60s |
| GET /api/pagos/:id | 30 req | 60s |
| GET /api/pagos/venta/:venta_id | 30 req | 60s |
| DELETE /api/pagos/:id/anular | 10 req | 60s |

---

## 🌐 API ENDPOINTS

### 1. Crear Pago

**Endpoint:** `POST /api/pagos/crear`

**Request Body (Efectivo):**
```json
{
  "pago_id": "550e8400-e29b-41d4-a716-446655440000",
  "venta_id": "660e8400-e29b-41d4-a716-446655440001",
  "sesion_caja_id": "770e8400-e29b-41d4-a716-446655440002",
  "forma_pago_id": "880e8400-e29b-41d4-a716-446655440003",
  "empleado_id": "990e8400-e29b-41d4-a716-446655440004",
  "monto": 15000,
  "metodo": "efectivo",
  "monto_recibido": 20000,
  "notas": "Pago en efectivo",
  "fecha_inicio": "2025-12-15T10:30:00.000Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "pago_id": "550e8400-e29b-41d4-a716-446655440000",
    "venta_id": "660e8400-e29b-41d4-a716-446655440001",
    "estado": "approved",
    "metodo": "efectivo",
    "monto": 15000,
    "monto_pagado": 15000,
    "monto_recibido": 20000,
    "monto_cambio": 5000,
    "fecha_inicio": "2025-12-15T10:30:00.000Z",
    "fecha_completado": "2025-12-15T10:30:00.000Z"
  }
}
```

**Request Body (Webpay):**
```json
{
  "venta_id": "660e8400-e29b-41d4-a716-446655440001",
  "forma_pago_id": "880e8400-e29b-41d4-a716-446655440003",
  "empleado_id": "990e8400-e29b-41d4-a716-446655440004",
  "monto": 15000,
  "metodo": "webpay"
}
```

**Response (201 Created - Webpay):**
```json
{
  "success": true,
  "data": {
    "pago_id": "550e8400-e29b-41d4-a716-446655440000",
    "estado": "processing",
    "metodo": "webpay",
    "monto": 15000,
    "webpay_token": "01ab23cd45ef67890123",
    "webpay_url": "https://webpay3gint.transbank.cl/webpayserver/initTransaction",
    "webpay_buy_order": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### 2. Confirmar Pago Webpay

**Endpoint:** `POST /api/pagos/webpay/confirmar`

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
    "monto": 15000,
    "monto_pagado": 15000,
    "webpay_authorization_code": "1213",
    "webpay_card_number": "**** **** **** 6623",
    "webpay_transaction_date": "2025-12-15T10:35:42.000Z",
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
    "monto": 15000,
    "monto_pagado": 0,
    "webpay_response_code": "-1",
    "motivo_rechazo": "Transacción rechazada por el emisor",
    "fecha_completado": "2025-12-15T10:35:42.000Z"
  }
}
```

---

### 3. Obtener Pago

**Endpoint:** `GET /api/pagos/:id`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pago_id": "550e8400-e29b-41d4-a716-446655440000",
    "numero_pago": "PAG-20251215-0001",
    "venta_id": "660e8400-e29b-41d4-a716-446655440001",
    "estado": "approved",
    "metodo": "efectivo",
    "monto": 15000,
    "monto_pagado": 15000,
    "fecha_inicio": "2025-12-15T10:30:00.000Z",
    "fecha_completado": "2025-12-15T10:30:00.000Z",
    "empleado_id": "990e8400-e29b-41d4-a716-446655440004",
    "esta_activo": true
  }
}
```

---

### 4. Obtener Pagos de Venta

**Endpoint:** `GET /api/pagos/venta/:venta_id`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "venta_id": "660e8400-e29b-41d4-a716-446655440001",
    "total_pagos": 2,
    "monto_total_pagado": 15000,
    "pagos": [
      {
        "pago_id": "550e8400-e29b-41d4-a716-446655440000",
        "estado": "approved",
        "metodo": "efectivo",
        "monto": 10000,
        "fecha_completado": "2025-12-15T10:30:00.000Z"
      },
      {
        "pago_id": "550e8400-e29b-41d4-a716-446655440011",
        "estado": "approved",
        "metodo": "webpay",
        "monto": 5000,
        "fecha_completado": "2025-12-15T10:35:42.000Z"
      }
    ]
  }
}
```

---

### 5. Anular Pago

**Endpoint:** `DELETE /api/pagos/:id/anular`

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

## 💼 FLUJOS DE NEGOCIO

### Flujo 1: Pago en Efectivo

```
1. Cliente Frontend:
   - Usuario ingresa monto recibido
   - Sistema calcula cambio
   - Cliente genera UUID para pago

2. POST /api/pagos/crear
   {
     "pago_id": "uuid-generado",
     "venta_id": "venta-uuid",
     "monto": 15000,
     "metodo": "efectivo",
     "monto_recibido": 20000
   }

3. Backend:
   - Valida venta existe
   - Valida monto_recibido >= monto
   - Calcula monto_cambio = monto_recibido - monto
   - Crea pago con estado 'approved'
   - Retorna respuesta con cambio

4. Cliente Frontend:
   - Muestra mensaje de pago exitoso
   - Muestra cambio a entregar
   - Marca venta como pagada
```

### Flujo 2: Pago con Webpay

```
1. Cliente Frontend:
   - Usuario selecciona "Pagar con tarjeta"
   - Cliente genera UUID para pago

2. POST /api/pagos/crear
   {
     "pago_id": "uuid-generado",
     "venta_id": "venta-uuid",
     "monto": 15000,
     "metodo": "webpay"
   }

3. Backend:
   - Valida venta existe
   - Llama a Webpay API para iniciar transacción
   - Obtiene token y URL
   - Crea pago con estado 'processing'
   - Retorna URL de Webpay

4. Cliente Frontend:
   - Redirige a webpay_url
   - Usuario ingresa datos de tarjeta en Webpay
   - Webpay procesa pago
   - Webpay redirige a callback

5. Callback Backend:
   POST /api/pagos/webpay/confirmar
   {
     "token_ws": "token-recibido"
   }

6. Backend:
   - Busca pago por token
   - Llama a Webpay API para confirmar
   - Actualiza estado a 'approved' o 'rejected'
   - Registra intento

7. Cliente Frontend:
   - Recibe respuesta de confirmación
   - Muestra resultado al usuario
   - Si aprobado, marca venta como pagada
```

---

## 📱 OFFLINE-FIRST

### Estrategia

**Efectivo:**
- ✅ Funciona 100% offline
- Cliente genera UUID y guarda en IndexedDB
- Sincroniza cuando hay conexión

**Webpay:**
- ❌ Requiere conexión obligatoria
- Mostrar error si no hay internet

### Ejemplo Offline (Efectivo)

```typescript
// Cliente Frontend
async function procesarPagoEfectivo(ventaId: string, monto: number, montoRecibido: number) {
  const pagoId = generateUUID();
  const pagoData = {
    pago_id: pagoId,
    venta_id: ventaId,
    monto,
    metodo: 'efectivo',
    monto_recibido: montoRecibido,
    fecha_inicio: new Date().toISOString(),
  };

  // Guardar en IndexedDB
  await db.pagos.add(pagoData);

  // Intentar sincronizar
  try {
    const response = await fetch('/api/pagos/crear', {
      method: 'POST',
      body: JSON.stringify(pagoData),
    });

    if (response.ok) {
      // Marcar como sincronizado
      await db.pagos.update(pagoId, { synced: true });
    }
  } catch (error) {
    // Sin conexión - se sincronizará después
    console.log('Pago guardado offline, se sincronizará cuando haya conexión');
  }

  return pagoId;
}
```

---

## 🐛 TROUBLESHOOTING

### Problema 1: Pago Efectivo Rechazado

**Causa:** Monto recibido menor al monto del pago

**Error:**
```json
{
  "code": "INSUFFICIENT_CASH",
  "message": "Efectivo insuficiente. Se requiere $15000, se recibió $10000"
}
```

**Solución:**
- Validar monto_recibido >= monto antes de enviar request

### Problema 2: Webpay en Estado 'processing' Permanente

**Causa:** Usuario no completó el pago en Webpay o timeout

**Query de diagnóstico:**
```sql
SELECT * FROM pago
WHERE estado = 'processing'
  AND TIMESTAMPDIFF(MINUTE, fecha_inicio, NOW()) > 15;
```

**Solución:**
- Configurar job que marque como 'failed' después de 15 minutos
- Permitir reintentar pago

### Problema 3: Error al Confirmar Webpay

**Causa:** Token no coincide o pago ya procesado

**Solución:**
- Validar que token_ws sea el correcto
- Verificar logs en `pago_intento` para ver intentos previos

---

## 🧪 TESTING

### Ejecutar Tests

```bash
# Tests unitarios
npm test -- tests/unit/pagos

# Tests E2E
npm test -- tests/e2e/pagos

# Todos los tests
npm test
```

### Cobertura Esperada

- ✅ Unit tests: 10+ tests
- ✅ E2E tests: 8+ tests
- ✅ Cobertura: 80%+

---

## 📚 REFERENCIAS

- [PAGOS-SYSTEM-DESIGN.md](./PAGOS-SYSTEM-DESIGN.md) - Diseño técnico completo
- [CAJA-SYSTEM.md](./CAJA-SYSTEM.md) - Sistema de caja
- [Documentación Webpay](https://www.transbankdevelopers.cl/documentacion/webpay-plus)

---

**FIN DEL DOCUMENTO**

Sistema de Pagos v1.0.0 - Implementación completa y lista para producción.
