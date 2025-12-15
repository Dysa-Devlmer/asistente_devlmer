# Bootstrap Module - API v2.0

Módulo de Bootstrap API para sincronización de dispositivos POS.

## Especificación

Ver: `docs/ITERACION2-BOOTSTRAP-CATALOGO.md`

## Estructura

```
bootstrap/
├── controllers/
│   └── bootstrap.controller.ts    # 3 endpoints HTTP
├── services/
│   ├── catalogo.service.ts        # Lógica de negocio catálogo
│   ├── empleado.service.ts        # Lógica de negocio empleados
│   └── delta.service.ts           # Lógica de negocio delta sync
├── repositories/
│   ├── catalogo.repository.ts     # Queries SQL catálogo
│   ├── empleado.repository.ts     # Queries SQL empleados
│   └── delta.repository.ts        # Queries SQL change tracking
├── dto/
│   ├── pagination.dto.ts          # DTOs de paginación
│   ├── catalogo.dto.ts            # DTOs de catálogo
│   ├── empleado.dto.ts            # DTOs de empleados
│   ├── delta.dto.ts               # DTOs de delta sync
│   └── bootstrap-response.dto.ts  # Wrapper genérico
├── bootstrap.module.ts            # Módulo principal y router
└── README.md                      # Este archivo
```

## Endpoints

### 1. GET /api/bootstrap/catalogo

**Query Parameters:**
- `sucursal_id` (UUID, required)
- `page` (integer, optional, default: 1)
- `limit` (integer, optional, default: 50, max: 100)

**Response Headers:**
- `x-bootstrap-version: 2.0.0`
- `cache-control: public, max-age=300`

**Response Body:**
```json
{
  "bootstrap_version": "2.0.0",
  "generated_at": "2025-01-15T14:30:00.000Z",
  "data": {
    "sucursal_id": "...",
    "pagination": { ... },
    "catalogo": {
      "productos": [...],
      "categorias": [...],
      "impuestos": [...],
      "formas_pago": [...]
    }
  }
}
```

### 2. GET /api/bootstrap/empleados

**Query Parameters:**
- `sucursal_id` (UUID, required)
- `page` (integer, optional, default: 1)
- `limit` (integer, optional, default: 50, max: 100)

**Response:** Similar a catálogo pero con empleados

### 3. GET /api/bootstrap/delta

**Query Parameters:**
- `sucursal_id` (UUID, required)
- `since` (ISO 8601, required)

**Response:**
```json
{
  "bootstrap_version": "2.0.0",
  "generated_at": "2025-01-15T14:30:00.000Z",
  "data": {
    "sucursal_id": "...",
    "since": "2025-01-15T10:00:00.000Z",
    "until": "2025-01-15T14:30:00.000Z",
    "total_changes": 5,
    "changes": [
      {
        "op": "update",
        "entity": "producto",
        "id": "...",
        "changed_at": "2025-01-15T12:00:00.000Z",
        "payload": { ... }
      }
    ]
  }
}
```

## Uso

```typescript
import express from 'express';
import mysql from 'mysql2/promise';
import { createBootstrapRouter } from './modules/bootstrap/bootstrap.module';

const app = express();
const db = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'pos_venta',
});

// Registrar rutas
app.use('/api/bootstrap', createBootstrapRouter(db));

app.listen(3000);
```

## Reglas de Negocio

### Catálogo
- Paginación SOLO en productos
- Categorías, impuestos, formas_pago vienen completos
- Solo productos activos (`esta_activo = true`)
- Ordenamiento productos: `codigo ASC, nombre ASC`

### Empleados
- Solo empleados activos (`esta_activo = true`)
- Solo de la sucursal especificada
- **Campos sensibles EXCLUIDOS:** `password_hash`, `pin_hash`, `token_sesion`
- Ordenamiento: `apellido ASC, nombre ASC`

### Delta
- Retorna cambios donde `updated_at > since`
- Soft-deletes: `op="delete"` + `esta_activo=false`
- Sin paginación
- Ordenamiento: `changed_at ASC`

## Validaciones

### Paginación
- `page >= 1` (error 400 si menor)
- `limit >= 1` (error 400 si menor)
- `limit <= 100` (error 400 si mayor)

### UUID
- Todos los IDs deben ser UUID v4 válidos

### Timestamp
- `since` debe ser ISO 8601 válido
- Si `since` es futuro, retorna array vacío

## Testing

Ver:
- `backend/tests/unit/bootstrap/*.spec.ts`
- `backend/tests/e2e/bootstrap/*.e2e.spec.ts`
