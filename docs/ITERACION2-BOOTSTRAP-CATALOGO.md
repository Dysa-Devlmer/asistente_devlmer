# ITERACIÓN 2 - BOOTSTRAP API: CATÁLOGO Y DELTA SYNC

**Versión:** 2.0.0
**Fecha:** 2025-01-15
**Estado:** Draft - Especificación Técnica
**Autor:** Equipo Backend

---

## 📋 TABLA DE CONTENIDOS

1. [Introducción](#introducción)
2. [Endpoints Nuevos](#endpoints-nuevos)
3. [Contratos JSON](#contratos-json)
4. [Paginación](#paginación)
5. [Delta Sync](#delta-sync)
6. [Reglas de Merge en Cliente](#reglas-de-merge-en-cliente)
7. [Casos de Acceptance](#casos-de-acceptance)
8. [Ejemplos cURL](#ejemplos-curl)

---

## 🎯 INTRODUCCIÓN

**Iteración 2** expande el sistema Bootstrap con:
- **Catálogos paginados** (productos, categorías, impuestos, etc.)
- **Empleados** con roles y permisos
- **Delta Sync** para sincronización incremental eficiente

### Objetivos
✅ Reducir payload inicial (paginación)
✅ Sincronización incremental (delta)
✅ Offline-first con merge inteligente
✅ Manejo de soft-deletes vía estado

---

## 🔌 ENDPOINTS NUEVOS

### Resumen

| Método | Endpoint | Descripción | Paginación |
|--------|----------|-------------|------------|
| GET | `/api/bootstrap/catalogo` | Catálogo completo (productos, categorías, impuestos, formas_pago) | ✅ Sí |
| GET | `/api/bootstrap/empleados` | Empleados activos con roles | ✅ Sí |
| GET | `/api/bootstrap/delta` | Cambios incrementales desde timestamp | ❌ No |

### Headers Obligatorios (Todos los endpoints)

```http
x-bootstrap-version: 2.0.0
cache-control: public, max-age=300
```

---

## 📄 CONTRATOS JSON

### 1. GET /api/bootstrap/catalogo

**Query Parameters:**
- `sucursal_id` (UUID, required) - ID de la sucursal
- `page` (integer, optional, default: 1) - Número de página
- `limit` (integer, optional, default: 50, max: 100) - Registros por página

**Response Structure:**

```json
{
  "bootstrap_version": "2.0.0",
  "generated_at": "2025-01-15T14:30:00.000Z",
  "data": {
    "sucursal_id": "550e8400-e29b-41d4-a716-446655440000",
    "pagination": {
      "page": 1,
      "limit": 50,
      "total_items": 523,
      "total_pages": 11,
      "has_next": true,
      "has_prev": false
    },
    "catalogo": {
      "productos": [
        {
          "id": "650e8400-e29b-41d4-a716-446655440001",
          "codigo": "PROD001",
          "codigo_barra": "7501234567890",
          "nombre": "Producto Ejemplo",
          "descripcion": "Descripción del producto",
          "categoria_id": "750e8400-e29b-41d4-a716-446655440002",
          "precio_venta": 150.00,
          "precio_compra": 100.00,
          "stock_actual": 25,
          "stock_minimo": 5,
          "unidad_medida": "UNIDAD",
          "impuesto_id": "850e8400-e29b-41d4-a716-446655440003",
          "imagen_url": "https://cdn.example.com/productos/prod001.jpg",
          "esta_activo": true,
          "permite_venta_sin_stock": false,
          "es_servicio": false,
          "requiere_autorizacion": false,
          "created_at": "2025-01-10T10:00:00.000Z",
          "updated_at": "2025-01-15T12:00:00.000Z"
        }
      ],
      "categorias": [
        {
          "id": "750e8400-e29b-41d4-a716-446655440002",
          "codigo": "CAT001",
          "nombre": "Bebidas",
          "descripcion": "Bebidas y refrescos",
          "categoria_padre_id": null,
          "orden": 1,
          "esta_activa": true,
          "created_at": "2025-01-01T10:00:00.000Z",
          "updated_at": "2025-01-01T10:00:00.000Z"
        }
      ],
      "impuestos": [
        {
          "id": "850e8400-e29b-41d4-a716-446655440003",
          "codigo": "IVA19",
          "nombre": "IVA 19%",
          "porcentaje": 19.00,
          "tipo": "IVA",
          "esta_activo": true,
          "created_at": "2025-01-01T10:00:00.000Z",
          "updated_at": "2025-01-01T10:00:00.000Z"
        }
      ],
      "formas_pago": [
        {
          "id": "950e8400-e29b-41d4-a716-446655440004",
          "codigo": "EFECTIVO",
          "nombre": "Efectivo",
          "tipo": "CASH",
          "requiere_autorizacion": false,
          "abre_cajon": true,
          "esta_activa": true,
          "created_at": "2025-01-01T10:00:00.000Z",
          "updated_at": "2025-01-01T10:00:00.000Z"
        }
      ]
    }
  }
}
```

**Reglas de Negocio:**
- Paginación aplica **solo a productos** (el resto viene completo siempre)
- `limit` max: 100 registros
- Si `page` excede `total_pages`, retorna página vacía (no error)
- Solo productos activos (`esta_activo = true`)
- Ordenamiento: `codigo ASC, nombre ASC`

---

### 2. GET /api/bootstrap/empleados

**Query Parameters:**
- `sucursal_id` (UUID, required) - ID de la sucursal
- `page` (integer, optional, default: 1) - Número de página
- `limit` (integer, optional, default: 50, max: 100) - Registros por página

**Response Structure:**

```json
{
  "bootstrap_version": "2.0.0",
  "generated_at": "2025-01-15T14:30:00.000Z",
  "data": {
    "sucursal_id": "550e8400-e29b-41d4-a716-446655440000",
    "pagination": {
      "page": 1,
      "limit": 50,
      "total_items": 12,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    },
    "empleados": [
      {
        "id": "a50e8400-e29b-41d4-a716-446655440005",
        "codigo": "EMP001",
        "nombre": "Juan",
        "apellido": "Pérez",
        "nombre_completo": "Juan Pérez",
        "email": "juan.perez@empresa.com",
        "telefono": "+56912345678",
        "rol_id": "b50e8400-e29b-41d4-a716-446655440006",
        "rol_nombre": "Cajero",
        "sucursal_id": "550e8400-e29b-41d4-a716-446655440000",
        "esta_activo": true,
        "puede_abrir_caja": true,
        "puede_hacer_devoluciones": false,
        "puede_aplicar_descuentos": true,
        "descuento_maximo_porcentaje": 10.00,
        "requiere_autorizacion_supervisor": false,
        "permisos": [
          "VENTA_CREAR",
          "VENTA_VER",
          "PRODUCTO_VER",
          "CAJA_ABRIR",
          "CAJA_CERRAR"
        ],
        "created_at": "2025-01-05T10:00:00.000Z",
        "updated_at": "2025-01-10T15:30:00.000Z"
      }
    ]
  }
}
```

**Reglas de Negocio:**
- Solo empleados activos (`esta_activo = true`)
- Solo empleados de la sucursal especificada
- `permisos` es array de strings (códigos de permiso)
- Ordenamiento: `apellido ASC, nombre ASC`
- **Campos sensibles excluidos:** `password_hash`, `pin_hash`, `token_sesion`

---

### 3. GET /api/bootstrap/delta

**Query Parameters:**
- `sucursal_id` (UUID, required) - ID de la sucursal
- `since` (ISO 8601 timestamp, required) - Timestamp de última sincronización

**Response Structure:**

```json
{
  "bootstrap_version": "2.0.0",
  "generated_at": "2025-01-15T14:30:00.000Z",
  "data": {
    "sucursal_id": "550e8400-e29b-41d4-a716-446655440000",
    "since": "2025-01-15T10:00:00.000Z",
    "until": "2025-01-15T14:30:00.000Z",
    "total_changes": 5,
    "changes": [
      {
        "op": "update",
        "entity": "producto",
        "id": "650e8400-e29b-41d4-a716-446655440001",
        "changed_at": "2025-01-15T12:00:00.000Z",
        "payload": {
          "id": "650e8400-e29b-41d4-a716-446655440001",
          "codigo": "PROD001",
          "nombre": "Producto Actualizado",
          "precio_venta": 175.00,
          "stock_actual": 30,
          "esta_activo": true,
          "updated_at": "2025-01-15T12:00:00.000Z"
        }
      },
      {
        "op": "insert",
        "entity": "producto",
        "id": "650e8400-e29b-41d4-a716-446655440010",
        "changed_at": "2025-01-15T13:00:00.000Z",
        "payload": {
          "id": "650e8400-e29b-41d4-a716-446655440010",
          "codigo": "PROD010",
          "nombre": "Producto Nuevo",
          "precio_venta": 200.00,
          "stock_actual": 10,
          "esta_activo": true,
          "created_at": "2025-01-15T13:00:00.000Z",
          "updated_at": "2025-01-15T13:00:00.000Z"
        }
      },
      {
        "op": "delete",
        "entity": "producto",
        "id": "650e8400-e29b-41d4-a716-446655440007",
        "changed_at": "2025-01-15T14:00:00.000Z",
        "payload": {
          "id": "650e8400-e29b-41d4-a716-446655440007",
          "codigo": "PROD007",
          "esta_activo": false,
          "updated_at": "2025-01-15T14:00:00.000Z"
        }
      },
      {
        "op": "update",
        "entity": "empleado",
        "id": "a50e8400-e29b-41d4-a716-446655440005",
        "changed_at": "2025-01-15T11:30:00.000Z",
        "payload": {
          "id": "a50e8400-e29b-41d4-a716-446655440005",
          "codigo": "EMP001",
          "nombre_completo": "Juan Pérez",
          "puede_aplicar_descuentos": true,
          "descuento_maximo_porcentaje": 15.00,
          "updated_at": "2025-01-15T11:30:00.000Z"
        }
      },
      {
        "op": "update",
        "entity": "categoria",
        "id": "750e8400-e29b-41d4-a716-446655440002",
        "changed_at": "2025-01-15T14:15:00.000Z",
        "payload": {
          "id": "750e8400-e29b-41d4-a716-446655440002",
          "codigo": "CAT001",
          "nombre": "Bebidas y Refrescos",
          "updated_at": "2025-01-15T14:15:00.000Z"
        }
      }
    ]
  }
}
```

**Campos del Change:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `op` | string | Operación: `insert`, `update`, `delete` |
| `entity` | string | Tipo de entidad: `producto`, `empleado`, `categoria`, `impuesto`, `forma_pago` |
| `id` | UUID | ID único de la entidad |
| `changed_at` | ISO 8601 | Timestamp exacto del cambio |
| `payload` | object | Datos completos de la entidad (solo campos cambiados en updates) |

**Reglas de Negocio:**
- `since` debe ser ISO 8601 válido
- Retorna cambios donde `updated_at > since`
- **Soft-deletes:** `op: "delete"` + `esta_activo: false` en payload
- **Hard-deletes:** No se rastrean (asumimos solo soft-deletes)
- Ordenamiento: `changed_at ASC` (más antiguos primero)
- **Sin paginación** (asumimos delta razonable < 1000 registros)
- Si `since` es futuro, retorna array vacío

---

## 📑 PAGINACIÓN

### Especificación

**Query Parameters:**
```
page=1         # Página actual (base 1, no 0)
limit=50       # Registros por página (default: 50, max: 100)
```

**Response Meta:**
```json
{
  "pagination": {
    "page": 1,           // Página actual
    "limit": 50,         // Límite aplicado
    "total_items": 523,  // Total registros disponibles
    "total_pages": 11,   // Total páginas (ceil(total_items / limit))
    "has_next": true,    // Hay página siguiente
    "has_prev": false    // Hay página anterior
  }
}
```

### Validaciones

| Validación | Comportamiento |
|------------|----------------|
| `limit < 1` | Error 400: "limit debe ser >= 1" |
| `limit > 100` | Error 400: "limit max es 100" |
| `page < 1` | Error 400: "page debe ser >= 1" |
| `page > total_pages` | Retorna página vacía con `data: []` |
| Missing `page` | Default: 1 |
| Missing `limit` | Default: 50 |

### Límites

```
MAX_LIMIT = 100
DEFAULT_LIMIT = 50
MIN_PAGE = 1
```

---

## 🔄 DELTA SYNC

### Flujo de Sincronización

```
┌─────────────┐
│  Dispositivo│
│  (Cliente)  │
└──────┬──────┘
       │
       │ 1) GET /api/bootstrap/meta
       │    → Obtener server_timestamp
       │
       ▼
┌─────────────────────────────────────┐
│ Verificar si es primera sincronización │
└──────┬──────────────────────────────┘
       │
       ├─── Primera vez
       │    │
       │    ├─→ 2a) GET /api/bootstrap/catalogo?page=1&limit=100
       │    ├─→ 2b) GET /api/bootstrap/catalogo?page=2&limit=100
       │    ├─→ ...hasta total_pages
       │    │
       │    └─→ 3) GET /api/bootstrap/empleados
       │
       └─── Ya sincronizado
            │
            └─→ 4) GET /api/bootstrap/delta?since=<last_sync>
                   → Aplicar merge rules
```

### Lógica de Cliente

```javascript
// Pseudocódigo cliente
async function syncBootstrap(sucursalId) {
  const lastSync = await getLastSyncTimestamp(); // De SQLite local

  if (!lastSync) {
    // Primera sincronización: cargar todo
    await fullSync(sucursalId);
  } else {
    // Sincronización incremental
    await deltaSync(sucursalId, lastSync);
  }

  // Guardar nuevo timestamp
  await saveLastSyncTimestamp(new Date().toISOString());
}

async function deltaSync(sucursalId, since) {
  const response = await fetch(
    `/api/bootstrap/delta?sucursal_id=${sucursalId}&since=${since}`
  );
  const { data } = await response.json();

  for (const change of data.changes) {
    await applyChange(change);
  }
}

async function applyChange(change) {
  const { op, entity, payload } = change;

  switch (op) {
    case 'insert':
      await db.insert(entity, payload);
      break;

    case 'update':
      await db.update(entity, payload.id, payload);
      break;

    case 'delete':
      // Soft-delete: marcar como inactivo
      await db.update(entity, payload.id, {
        esta_activo: false,
        updated_at: payload.updated_at
      });
      break;
  }
}
```

---

## 🧩 REGLAS DE MERGE EN CLIENTE

### Estrategia General

**Merge by ID:**
- El `id` es la clave primaria única
- Si existe localmente → UPDATE
- Si no existe → INSERT

**Fields Overwrite:**
- Los campos del payload **sobrescriben** los locales
- **No hay merge field-level** (no se preservan campos locales no presentes en payload)

**Soft-Deletes vía Estado:**
- `op: "delete"` → Setear `esta_activo = false` localmente
- **NO eliminar** el registro de SQLite
- Filtrar en queries: `WHERE esta_activo = true`

### Reglas por Operación

#### 1. INSERT (`op: "insert"`)

```sql
-- Si no existe localmente
INSERT INTO producto (id, codigo, nombre, precio_venta, ...)
VALUES (?, ?, ?, ?, ...);
```

**Validaciones:**
- Si ya existe localmente con mismo ID → ERROR (inconsistencia)
- Cliente debe logear y reportar este caso

#### 2. UPDATE (`op: "update"`)

```sql
-- Sobrescribir campos del payload
UPDATE producto
SET
  nombre = ?,
  precio_venta = ?,
  stock_actual = ?,
  updated_at = ?
WHERE id = ?;
```

**Validaciones:**
- Si NO existe localmente → Tratarlo como INSERT
- `updated_at` del servidor debe ser >= local (protección concurrencia)

#### 3. DELETE (`op: "delete"`)

```sql
-- Soft-delete: marcar inactivo
UPDATE producto
SET
  esta_activo = false,
  updated_at = ?
WHERE id = ?;
```

**Validaciones:**
- Si NO existe localmente → SKIP (ya no existe)
- No eliminar físicamente del SQLite

### Manejo de Conflictos

**Estrategia: Server Wins**
- El servidor es la fuente de verdad
- Cambios locales en conflicto → Sobrescritos
- **No hay resolución automática** de conflictos

**Excepciones:**
- Transacciones locales pendientes de sync → Proteger de sobrescritura
- Implementar flag `is_pending_sync` en SQLite local

### Integridad Referencial

**Cascadas:**
- Si llega `delete` de categoría → Verificar productos asociados
- **No eliminar productos** huérfanos automáticamente
- Marcar como `categoria_id = NULL` o mostrar warning

**Orden de Aplicación:**
1. Categorías
2. Impuestos
3. Formas de Pago
4. Productos (pueden referenciar categorías/impuestos)
5. Empleados

---

## ✅ CASOS DE ACCEPTANCE

### A. Paginación - Catálogo

#### TC-PAG-001: Primera página con default limit
```gherkin
GIVEN sucursal activa con 150 productos
WHEN GET /api/bootstrap/catalogo?sucursal_id={id}
THEN response.pagination.page = 1
AND response.pagination.limit = 50
AND response.pagination.total_items = 150
AND response.pagination.total_pages = 3
AND response.pagination.has_next = true
AND response.pagination.has_prev = false
AND response.data.catalogo.productos.length = 50
```

#### TC-PAG-002: Última página
```gherkin
GIVEN sucursal con 150 productos
WHEN GET /api/bootstrap/catalogo?sucursal_id={id}&page=3&limit=50
THEN response.pagination.page = 3
AND response.pagination.has_next = false
AND response.pagination.has_prev = true
AND response.data.catalogo.productos.length = 50
```

#### TC-PAG-003: Página fuera de rango
```gherkin
GIVEN sucursal con 150 productos
WHEN GET /api/bootstrap/catalogo?sucursal_id={id}&page=10
THEN status = 200
AND response.pagination.page = 10
AND response.data.catalogo.productos = []
```

#### TC-PAG-004: Límite máximo excedido
```gherkin
WHEN GET /api/bootstrap/catalogo?sucursal_id={id}&limit=200
THEN status = 400
AND error.message = "limit max es 100"
```

#### TC-PAG-005: Límite inválido
```gherkin
WHEN GET /api/bootstrap/catalogo?sucursal_id={id}&limit=0
THEN status = 400
AND error.message = "limit debe ser >= 1"
```

### B. Paginación - Empleados

#### TC-EMP-001: Todos los empleados en una página
```gherkin
GIVEN sucursal con 12 empleados activos
WHEN GET /api/bootstrap/empleados?sucursal_id={id}
THEN response.pagination.total_items = 12
AND response.pagination.total_pages = 1
AND response.data.empleados.length = 12
```

#### TC-EMP-002: Solo empleados activos
```gherkin
GIVEN sucursal con 10 empleados activos y 5 inactivos
WHEN GET /api/bootstrap/empleados?sucursal_id={id}
THEN response.pagination.total_items = 10
AND all empleados have esta_activo = true
```

#### TC-EMP-003: Campos sensibles excluidos
```gherkin
WHEN GET /api/bootstrap/empleados?sucursal_id={id}
THEN response.data.empleados[*] NOT contains password_hash
AND response.data.empleados[*] NOT contains pin_hash
AND response.data.empleados[*] NOT contains token_sesion
```

### C. Delta Sync

#### TC-DELTA-001: Sin cambios desde last sync
```gherkin
GIVEN última sincronización a 2025-01-15T14:00:00Z
AND sin cambios en base de datos desde entonces
WHEN GET /api/bootstrap/delta?sucursal_id={id}&since=2025-01-15T14:00:00Z
THEN response.data.total_changes = 0
AND response.data.changes = []
```

#### TC-DELTA-002: Detección de INSERT
```gherkin
GIVEN producto nuevo creado a 2025-01-15T13:00:00Z
WHEN GET /api/bootstrap/delta?since=2025-01-15T12:00:00Z
THEN response.data.changes contains:
  {
    "op": "insert",
    "entity": "producto",
    "changed_at": "2025-01-15T13:00:00.000Z",
    "payload": { full producto object }
  }
```

#### TC-DELTA-003: Detección de UPDATE
```gherkin
GIVEN producto actualizado (precio_venta) a 2025-01-15T13:30:00Z
WHEN GET /api/bootstrap/delta?since=2025-01-15T13:00:00Z
THEN response.data.changes contains:
  {
    "op": "update",
    "entity": "producto",
    "payload": { incluye campo precio_venta actualizado }
  }
```

#### TC-DELTA-004: Soft-delete detectado
```gherkin
GIVEN producto marcado esta_activo=false a 2025-01-15T14:00:00Z
WHEN GET /api/bootstrap/delta?since=2025-01-15T13:00:00Z
THEN response.data.changes contains:
  {
    "op": "delete",
    "entity": "producto",
    "payload": { "esta_activo": false }
  }
```

#### TC-DELTA-005: Múltiples entidades
```gherkin
GIVEN cambios en producto, empleado y categoría
WHEN GET /api/bootstrap/delta?since={timestamp}
THEN response.data.changes contiene 3 items
AND entities = ["producto", "empleado", "categoria"]
```

#### TC-DELTA-006: Ordenamiento cronológico
```gherkin
GIVEN cambios a diferentes timestamps
WHEN GET /api/bootstrap/delta?since={timestamp}
THEN response.data.changes ordenados por changed_at ASC
```

#### TC-DELTA-007: Timestamp futuro
```gherkin
GIVEN server_timestamp = 2025-01-15T14:00:00Z
WHEN GET /api/bootstrap/delta?since=2025-01-15T15:00:00Z
THEN response.data.total_changes = 0
AND response.data.changes = []
```

### D. Merge Rules

#### TC-MERGE-001: Insert nuevo registro
```gherkin
GIVEN cliente SQLite vacío
WHEN aplica change { op: "insert", entity: "producto", payload: {...} }
THEN SQLite contiene nuevo producto
AND campos coinciden con payload
```

#### TC-MERGE-002: Update sobrescribe campos
```gherkin
GIVEN producto local con precio_venta = 100
WHEN aplica change { op: "update", payload: { precio_venta: 150 } }
THEN producto.precio_venta = 150
```

#### TC-MERGE-003: Soft-delete marca inactivo
```gherkin
GIVEN producto local con esta_activo = true
WHEN aplica change { op: "delete" }
THEN producto.esta_activo = false
AND registro NO eliminado de SQLite
```

#### TC-MERGE-004: Update de registro no existente
```gherkin
GIVEN producto NO existe localmente
WHEN aplica change { op: "update", payload: {...} }
THEN se trata como INSERT
AND producto insertado en SQLite
```

### E. Headers y Versioning

#### TC-HEAD-001: Headers presentes en todos los endpoints
```gherkin
WHEN GET /api/bootstrap/catalogo
OR GET /api/bootstrap/empleados
OR GET /api/bootstrap/delta
THEN response headers contienen:
  x-bootstrap-version: 2.0.0
  cache-control: public, max-age=300
```

#### TC-HEAD-002: Response structure consistente
```gherkin
WHEN GET cualquier endpoint bootstrap
THEN response body contiene:
  {
    "bootstrap_version": "2.0.0",
    "generated_at": "<ISO 8601>",
    "data": { ... }
  }
```

### F. Performance

#### TC-PERF-001: Response time catálogo
```gherkin
GIVEN sucursal con 1000 productos
WHEN GET /api/bootstrap/catalogo?limit=100
THEN response time < 500ms
```

#### TC-PERF-002: Response time delta
```gherkin
GIVEN 50 cambios en última hora
WHEN GET /api/bootstrap/delta?since={1_hour_ago}
THEN response time < 300ms
```

#### TC-PERF-003: Response size límite
```gherkin
WHEN GET /api/bootstrap/catalogo?limit=100
THEN response size < 2MB
```

---

## 🔧 EJEMPLOS cURL

### 1. Obtener catálogo (primera página)

```bash
curl -X GET \
  'http://localhost:3000/api/bootstrap/catalogo?sucursal_id=550e8400-e29b-41d4-a716-446655440000&page=1&limit=50' \
  -H 'Accept: application/json'
```

**Response:**
```http
HTTP/1.1 200 OK
x-bootstrap-version: 2.0.0
cache-control: public, max-age=300
content-type: application/json

{
  "bootstrap_version": "2.0.0",
  "generated_at": "2025-01-15T14:30:00.000Z",
  "data": {
    "sucursal_id": "550e8400-e29b-41d4-a716-446655440000",
    "pagination": { ... },
    "catalogo": { ... }
  }
}
```

### 2. Obtener empleados

```bash
curl -X GET \
  'http://localhost:3000/api/bootstrap/empleados?sucursal_id=550e8400-e29b-41d4-a716-446655440000' \
  -H 'Accept: application/json'
```

### 3. Obtener delta desde última sincronización

```bash
curl -X GET \
  'http://localhost:3000/api/bootstrap/delta?sucursal_id=550e8400-e29b-41d4-a716-446655440000&since=2025-01-15T10:00:00.000Z' \
  -H 'Accept: application/json'
```

**Response:**
```http
HTTP/1.1 200 OK
x-bootstrap-version: 2.0.0
cache-control: public, max-age=300

{
  "bootstrap_version": "2.0.0",
  "generated_at": "2025-01-15T14:30:00.000Z",
  "data": {
    "sucursal_id": "550e8400-e29b-41d4-a716-446655440000",
    "since": "2025-01-15T10:00:00.000Z",
    "until": "2025-01-15T14:30:00.000Z",
    "total_changes": 5,
    "changes": [ ... ]
  }
}
```

### 4. Error: límite excedido

```bash
curl -X GET \
  'http://localhost:3000/api/bootstrap/catalogo?sucursal_id=550e8400-e29b-41d4-a716-446655440000&limit=200'
```

**Response:**
```http
HTTP/1.1 400 Bad Request
content-type: application/json

{
  "statusCode": 400,
  "message": "limit max es 100",
  "error": "Bad Request"
}
```

---

## 📝 NOTAS TÉCNICAS

### Implementación Backend (NestJS)

**Estructura sugerida:**
```
src/modules/bootstrap/
├── controllers/
│   └── bootstrap.controller.ts
├── services/
│   ├── bootstrap.service.ts
│   ├── catalogo.service.ts
│   ├── empleado.service.ts
│   └── delta.service.ts
├── repositories/
│   ├── catalogo.repository.ts
│   ├── empleado.repository.ts
│   └── delta.repository.ts
├── dto/
│   ├── catalogo.dto.ts
│   ├── empleado.dto.ts
│   ├── delta.dto.ts
│   └── pagination.dto.ts
└── bootstrap.module.ts
```

### Queries SQL Delta

```sql
-- Detectar cambios desde timestamp
SELECT
  'update' as op,
  'producto' as entity,
  id,
  updated_at as changed_at,
  -- campos completos
FROM producto
WHERE sucursal_id = ?
  AND updated_at > ?
  AND created_at < updated_at  -- Es update, no insert

UNION ALL

SELECT
  'insert' as op,
  'producto' as entity,
  id,
  created_at as changed_at,
  -- campos completos
FROM producto
WHERE sucursal_id = ?
  AND created_at > ?

UNION ALL

-- Soft-deletes
SELECT
  'delete' as op,
  'producto' as entity,
  id,
  updated_at as changed_at,
  -- solo id y esta_activo
FROM producto
WHERE sucursal_id = ?
  AND updated_at > ?
  AND esta_activo = false

ORDER BY changed_at ASC;
```

### Índices Recomendados

```sql
-- Para delta queries
CREATE INDEX idx_producto_sucursal_updated
ON producto(sucursal_id, updated_at);

CREATE INDEX idx_producto_sucursal_created
ON producto(sucursal_id, created_at);

-- Para paginación
CREATE INDEX idx_producto_sucursal_activo_codigo
ON producto(sucursal_id, esta_activo, codigo);
```

---

## 🎯 ACCEPTANCE CRITERIA (Resumen)

### Funcional
- ✅ Catálogo retorna productos + categorías + impuestos + formas_pago
- ✅ Paginación solo en productos (resto completo)
- ✅ Límite max 100 registros
- ✅ Empleados sin campos sensibles
- ✅ Delta detecta insert/update/delete correctamente
- ✅ Soft-deletes vía `esta_activo = false`

### No Funcional
- ✅ Response time < 500ms (catálogo)
- ✅ Response time < 300ms (delta)
- ✅ Response size < 2MB
- ✅ Cache headers (5 min)
- ✅ Headers x-bootstrap-version en todos los endpoints

### Testing
- ✅ Unit tests para cada servicio
- ✅ Integration tests para endpoints
- ✅ Tests de paginación edge cases
- ✅ Tests de delta sync con timestamps

---

## 📚 REFERENCIAS

- Iteración 1: Meta, Sucursal, Dispositivo (completado)
- ISO 8601: https://en.wikipedia.org/wiki/ISO_8601
- REST Pagination Best Practices: https://www.moesif.com/blog/technical/api-design/REST-API-Design-Filtering-Sorting-and-Pagination/

---

**Fin del documento**
**Versión:** 2.0.0
**Última actualización:** 2025-01-15
