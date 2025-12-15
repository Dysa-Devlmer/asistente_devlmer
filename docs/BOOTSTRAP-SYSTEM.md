# 📦 SISTEMA DE BOOTSTRAP - SYSME POS

**Versión:** 1.0.0 (Iteración 1)
**Fecha:** 15 Enero 2025
**Estado:** Iteración 1 Completada

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Endpoints API](#endpoints-api)
4. [Contrato JSON](#contrato-json)
5. [SQL Queries](#sql-queries)
6. [Versionado y Cache](#versionado-y-cache)
7. [Mapeo SQLite Local](#mapeo-sqlite-local)
8. [Tests y Criterios de Aceptación](#tests-y-criterios-de-aceptación)
9. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🎯 Visión General

### Propósito

El sistema de bootstrap permite que dispositivos nuevos o que requieren re-sincronización descarguen los datos iniciales necesarios para operar offline en menos de 5 segundos (en conexión 4G).

### Objetivos Iteración 1

- ✅ Implementar endpoints básicos (meta, sucursal, dispositivo)
- ✅ Establecer contrato de API con headers estándar
- ✅ Proveer versionado simple del catálogo
- ✅ Solo operaciones de lectura (SELECTs)
- ✅ Sin campos sensibles en respuestas

### Fuera de Alcance (Iteraciones Futuras)

- ⏸️ Paginación (Iteración 2)
- ⏸️ Endpoint delta (Iteración 2)
- ⏸️ Catálogo completo de productos (Iteración 2)
- ⏸️ Empleados (Iteración 2)
- ⏸️ Mesas y zonas (Iteración 2)

---

## 🏗️ Arquitectura

### Diagrama de Flujo

```
┌──────────────┐
│  Dispositivo │
│    Nuevo     │
└──────┬───────┘
       │
       │ 1. GET /api/bootstrap/meta?sucursal_id={id}
       ├────────────────────────────────────────────────────┐
       │                                                    │
       ▼                                                    │
┌──────────────────────────────────────┐                   │
│ Metadata Response:                   │                   │
│ - catalog_version: "BOOTSTRAP_V1"    │                   │
│ - server_timestamp: "2025-01-15..."  │                   │
│ - requires_full_sync: false          │                   │
└──────┬───────────────────────────────┘                   │
       │                                                    │
       │ Decisión: ¿Necesita full sync?                    │
       │ (Iteración 1: siempre sí)                         │
       │                                                    │
       │ 2. GET /api/bootstrap/sucursal/:id                │
       ├────────────────────────────────────────────────────┤
       │                                                    │
       ▼                                                    │
┌──────────────────────────────────────┐                   │
│ Sucursal Response:                   │                   │
│ - id, codigo, nombre, rut            │                   │
│ - direccion, telefono, email         │                   │
│ - timezone, configuracion            │                   │
└──────┬───────────────────────────────┘                   │
       │                                                    │
       │ 3. GET /api/bootstrap/dispositivo?...             │
       ├────────────────────────────────────────────────────┤
       │                                                    │
       ▼                                                    │
┌──────────────────────────────────────┐                   │
│ Dispositivo Response:                │                   │
│ - id, codigo, nombre, tipo           │                   │
│ - dispositivo_info, version_app      │                   │
│ - ultima_sincronizacion              │                   │
└──────┬───────────────────────────────┘                   │
       │                                                    │
       │ 4. Persistir en SQLite local                      │
       │                                                    │
       ▼                                                    │
┌──────────────┐                                           │
│ Dispositivo  │                                           │
│ Listo para   │◄──────────────────────────────────────────┘
│ Operar       │
│ Offline      │
└──────────────┘
```

### Componentes

| Componente | Responsabilidad |
|------------|-----------------|
| **BootstrapController** | Manejo de HTTP requests/responses, validación de parámetros |
| **BootstrapService** | Lógica de negocio, envoltura de respuestas |
| **Repositories** | Queries SQL de solo lectura |
| **DTOs** | Contratos de datos y validación |

---

## 🔌 Endpoints API

### Headers Obligatorios (Respuesta)

Todos los endpoints devuelven estos headers:

```
x-bootstrap-version: 1.0.0
cache-control: public, max-age=300
```

### Estructura Base de Respuesta

Todas las respuestas siguen esta estructura:

```json
{
  "bootstrap_version": "1.0.0",
  "generated_at": "2025-01-15T12:00:00.000Z",
  "data": {
    // ... datos específicos del endpoint
  }
}
```

---

### 1. GET /api/bootstrap/meta

**Propósito:** Obtener metadata del sistema (versión catálogo, timestamp servidor)

**Query Parameters:**
- `sucursal_id` (UUID, required) - ID de la sucursal

**Response 200:**
```json
{
  "bootstrap_version": "1.0.0",
  "generated_at": "2025-01-15T12:00:00.000Z",
  "data": {
    "sucursal_id": "123e4567-e89b-12d3-a456-426614174000",
    "catalog_version": "BOOTSTRAP_V1",
    "server_timestamp": "2025-01-15T12:00:00.000Z",
    "requires_full_sync": false
  }
}
```

**Response 404:**
```json
{
  "statusCode": 404,
  "message": "Sucursal con ID {id} no encontrada o inactiva",
  "error": "Not Found"
}
```

**Notas Iteración 1:**
- `catalog_version` es constante "BOOTSTRAP_V1" (no hash dinámico)
- `requires_full_sync` es solo **informativo**, NO dispara sync automático
- En futuras iteraciones, `catalog_version` será hash o timestamp de última modificación

---

### 2. GET /api/bootstrap/sucursal/:id

**Propósito:** Obtener datos completos de la sucursal

**Path Parameters:**
- `id` (UUID, required) - ID de la sucursal

**Response 200:**
```json
{
  "bootstrap_version": "1.0.0",
  "generated_at": "2025-01-15T12:00:00.000Z",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "codigo": "SUC001",
    "nombre": "Sucursal Centro",
    "rut": "76.123.456-7",
    "direccion": "Av. Principal 123, Santiago",
    "telefono": "+56912345678",
    "email": "centro@sysme.cl",
    "timezone": "America/Santiago",
    "esta_activa": true,
    "configuracion": {
      "impuestos": {
        "iva": 19
      }
    }
  }
}
```

**Response 404:**
```json
{
  "statusCode": 404,
  "message": "Sucursal con ID {id} no encontrada o inactiva",
  "error": "Not Found"
}
```

**Campos Sensibles (NO incluidos):**
- `password_hash`
- Cualquier credencial de acceso

---

### 3. GET /api/bootstrap/dispositivo

**Propósito:** Obtener información del dispositivo y su configuración

**Query Parameters:**
- `sucursal_id` (UUID, required) - ID de la sucursal
- `dispositivo_id` (UUID, required) - ID del dispositivo

**Response 200:**
```json
{
  "bootstrap_version": "1.0.0",
  "generated_at": "2025-01-15T12:00:00.000Z",
  "data": {
    "id": "987fcdeb-51a2-43e7-9876-543210fedcba",
    "sucursal_id": "123e4567-e89b-12d3-a456-426614174000",
    "codigo": "POS-01",
    "nombre": "Caja Principal",
    "tipo": "CAJA",
    "dispositivo_info": {
      "ip": "192.168.1.100",
      "mac": "AA:BB:CC:DD:EE:FF",
      "user_agent": "SYSME-POS/1.0.0"
    },
    "esta_activo": true,
    "ultima_sincronizacion": "2025-01-15T11:30:00.000Z",
    "version_app": "1.0.0"
  }
}
```

**Response 404:**
```json
{
  "statusCode": 404,
  "message": "Dispositivo con ID {id} no encontrado en sucursal {sucursal_id} o inactivo",
  "error": "Not Found"
}
```

**Tipos de Dispositivo:**
- `CAJA` - Punto de venta fijo
- `COMANDERO` - Móvil para meseros
- `COCINA` - KDS (Kitchen Display System)
- `BARRA` - Display para bar

---

## 🗄️ SQL Queries

### Meta

**Propósito:** Verificar existencia de sucursal

```sql
SELECT 1
FROM sucursal
WHERE id = ? AND esta_activa = true
LIMIT 1;
```

---

### Sucursal

**Propósito:** Obtener datos completos de sucursal

```sql
SELECT
  id,
  codigo,
  nombre,
  rut,
  direccion,
  telefono,
  email,
  timezone,
  esta_activa,
  configuracion
FROM sucursal
WHERE id = ? AND esta_activa = true
LIMIT 1;
```

**Índices utilizados:**
- Primary key en `id`

---

### Dispositivo

**Propósito:** Obtener datos completos de dispositivo

```sql
SELECT
  id,
  sucursal_id,
  codigo,
  nombre,
  tipo,
  dispositivo_info,
  esta_activo,
  ultima_sincronizacion,
  version_app
FROM dispositivo
WHERE sucursal_id = ?
  AND id = ?
  AND esta_activo = true
LIMIT 1;
```

**Índices utilizados:**
- Primary key en `id`
- Index en `sucursal_id` (`idx_dispositivo_sucursal`)

---

## 🔄 Versionado y Cache

### Versión del Sistema Bootstrap

**Constante:** `BOOTSTRAP_VERSION = "1.0.0"`

- Se incluye en **todas** las respuestas (`bootstrap_version`)
- Se incluye en header `x-bootstrap-version`
- Incrementa en releases mayores del sistema

### Versión del Catálogo (Iteración 1)

**Constante:** `CATALOG_VERSION = "BOOTSTRAP_V1"`

- **Simple en Iteración 1:** No es hash dinámico
- Permite al cliente identificar versión de datos recibidos
- **Futuro (Iteración 2+):** Será hash o timestamp de última modificación

### Campo `requires_full_sync`

**Valor Iteración 1:** Siempre `false`

- Es solo **informativo**
- **NO dispara sincronización automática**
- El cliente decide cuándo sincronizar basado en su lógica de negocio

### Política de Cache

**Header:** `cache-control: public, max-age=300` (5 minutos)

- Los datos de bootstrap son relativamente estáticos
- Cache de 5 minutos reduce carga en servidor
- Cliente puede forzar refresh ignorando cache

---

## 💾 Mapeo SQLite Local

### Tablas a Persistir (Iteración 1)

| Tabla | Registros | Datos |
|-------|-----------|-------|
| `sucursal` | 1 | Datos completos de la sucursal |
| `dispositivo` | 1 | Datos completos del dispositivo actual |
| `meta_local` | 1 | `bootstrap_version`, `last_sync`, `catalog_version` |

### Tabla Meta Local (Crear si no existe)

```sql
CREATE TABLE IF NOT EXISTS meta_local (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar metadata después de bootstrap exitoso
INSERT OR REPLACE INTO meta_local (key, value) VALUES
  ('bootstrap_version', '1.0.0'),
  ('catalog_version', 'BOOTSTRAP_V1'),
  ('last_sync', '2025-01-15T12:00:00.000Z');
```

### Instrucciones para Frontend

**Paso 1:** Llamar endpoints en orden

```javascript
// 1. Meta
const meta = await fetch(`/api/bootstrap/meta?sucursal_id=${sucId}`);

// 2. Sucursal
const sucursal = await fetch(`/api/bootstrap/sucursal/${sucId}`);

// 3. Dispositivo
const dispositivo = await fetch(
  `/api/bootstrap/dispositivo?sucursal_id=${sucId}&dispositivo_id=${dispId}`
);
```

**Paso 2:** Persistir en SQLite local

```javascript
// Usar transaction para atomicidad
db.transaction((tx) => {
  // Sucursal
  tx.executeSql(`
    INSERT OR REPLACE INTO sucursal
    (id, codigo, nombre, rut, direccion, telefono, email, timezone, esta_activa, configuracion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [sucursal.data.id, sucursal.data.codigo, ...]);

  // Dispositivo
  tx.executeSql(`
    INSERT OR REPLACE INTO dispositivo
    (id, sucursal_id, codigo, nombre, tipo, dispositivo_info, esta_activo, ultima_sincronizacion, version_app)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [dispositivo.data.id, dispositivo.data.sucursal_id, ...]);

  // Meta
  tx.executeSql(`
    INSERT OR REPLACE INTO meta_local (key, value) VALUES
    ('bootstrap_version', ?),
    ('catalog_version', ?),
    ('last_sync', ?)
  `, [meta.bootstrap_version, meta.data.catalog_version, new Date().toISOString()]);
});
```

---

## ✅ Tests y Criterios de Aceptación

### Unit Tests (Completados)

**Archivos:**
- `bootstrap.service.spec.ts` - 15 tests
- `bootstrap.controller.spec.ts` - 15 tests

**Total:** 30 tests unitarios

**Cobertura:**
- Controllers: 100%
- Services: 100%
- Repositories: Mocked (tests de integración en E2E)

### Criterios de Aceptación (Iteración 1)

#### ✅ Estructura de Respuesta

- Todas las respuestas incluyen `bootstrap_version`
- Todas las respuestas incluyen `generated_at` en formato ISO 8601
- Todas las respuestas incluyen `data` con estructura específica

#### ✅ Headers

- Header `x-bootstrap-version: 1.0.0` presente
- Header `cache-control: public, max-age=300` presente

#### ✅ SQL

- Solo queries SELECT (sin INSERT, UPDATE, DELETE)
- Todas las queries filtran por `esta_activa = true` o `esta_activo = true`
- Uso de índices existentes (verificar con EXPLAIN)

#### ✅ Seguridad

- NO se incluyen campos sensibles (`password_hash`, `pin_hash`, etc.)
- Validación de UUIDs en parámetros
- Filtro estricto por `sucursal_id` (sin cross-tenant data leaks)

#### ✅ Performance

- Respuesta < 200ms por endpoint (en DB local)
- Sin N+1 queries
- Uso de `LIMIT 1` en queries que retornan un registro

### Ejecutar Tests

```bash
# Unit tests
cd backend
npm test -- bootstrap

# Ver cobertura
npm run test:coverage -- bootstrap
```

---

## 🚀 Ejemplos de Uso

### cURL - Meta

```bash
curl -X GET \
  'http://localhost:3000/api/bootstrap/meta?sucursal_id=123e4567-e89b-12d3-a456-426614174000' \
  -H 'Accept: application/json' \
  -v
```

**Response Headers:**
```
HTTP/1.1 200 OK
x-bootstrap-version: 1.0.0
cache-control: public, max-age=300
content-type: application/json; charset=utf-8
```

**Response Body:**
```json
{
  "bootstrap_version": "1.0.0",
  "generated_at": "2025-01-15T12:00:00.000Z",
  "data": {
    "sucursal_id": "123e4567-e89b-12d3-a456-426614174000",
    "catalog_version": "BOOTSTRAP_V1",
    "server_timestamp": "2025-01-15T12:00:00.000Z",
    "requires_full_sync": false
  }
}
```

---

### cURL - Sucursal

```bash
curl -X GET \
  'http://localhost:3000/api/bootstrap/sucursal/123e4567-e89b-12d3-a456-426614174000' \
  -H 'Accept: application/json' \
  -v
```

---

### cURL - Dispositivo

```bash
curl -X GET \
  'http://localhost:3000/api/bootstrap/dispositivo?sucursal_id=123e4567-e89b-12d3-a456-426614174000&dispositivo_id=987fcdeb-51a2-43e7-9876-543210fedcba' \
  -H 'Accept: application/json' \
  -v
```

---

## 📝 Notas de Implementación

### Decisiones Técnicas

1. **Versión simple de catálogo (Iteración 1):**
   - Constante `BOOTSTRAP_V1` en lugar de hash dinámico
   - Facilita testing y desarrollo inicial
   - Se mejorará en Iteración 2 con hash real

2. **`requires_full_sync` solo informativo:**
   - No dispara acciones automáticas
   - El cliente decide cuándo sincronizar
   - Evita comportamientos inesperados

3. **Sin paginación (Iteración 1):**
   - Endpoints devuelven 1 registro (sucursal, dispositivo)
   - No se requiere paginación para estos casos
   - Paginación se implementará en Iteración 2 (catálogo, empleados)

### Limitaciones Conocidas

- ⚠️ Sin endpoint de catálogo completo (Iteración 2)
- ⚠️ Sin endpoint de empleados (Iteración 2)
- ⚠️ Sin endpoint de mesas/zonas (Iteración 2)
- ⚠️ Sin endpoint delta (Iteración 2)

---

## 🔮 Roadmap

### Iteración 2 (Planificada)

- Endpoint de catálogo con paginación
- Endpoint de empleados con paginación
- Endpoint delta (`?since=timestamp`)
- Versionado dinámico de catálogo (hash)
- Mesas y zonas

### Iteración 3 (Futuro)

- Compresión de respuestas (gzip)
- Optimizaciones de performance
- Métricas de uso

---

**Última actualización:** 15 Enero 2025
**Autor:** Claude (Sonnet 4.5)
**Revisado por:** @zeNk0
