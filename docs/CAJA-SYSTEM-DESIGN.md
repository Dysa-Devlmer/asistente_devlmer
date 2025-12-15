# DISEÑO DEL SISTEMA DE CAJA

**Fecha:** 2025-01-15
**Iteración:** 4
**Estado:** CRÍTICO - Sistema auditable e inmutable

---

## 📋 TABLA DE CONTENIDOS

1. [Objetivos](#objetivos)
2. [Modelo de Datos](#modelo-de-datos)
3. [Reglas de Negocio](#reglas-de-negocio)
4. [Contratos API](#contratos-api)
5. [Estados y Transiciones](#estados-y-transiciones)
6. [Auditoría](#auditoría)
7. [Offline-First](#offline-first)
8. [Idempotencia](#idempotencia)

---

## 🎯 OBJETIVOS

### Características Principales
- ✅ Sistema auditable e inmutable
- ✅ Offline-first (sincroniza después)
- ✅ Idempotente (mismo request = mismo resultado)
- ✅ NO editar ni borrar cierres
- ✅ NO borrar movimientos
- ✅ Totales por medio de pago
- ✅ Reporte inmutable de cierre

### Prohibiciones
- ❌ NO tocar fiscal
- ❌ NO tocar frontend
- ❌ NO cambiar bootstrap
- ❌ NO cambiar contratos existentes

---

## 💾 MODELO DE DATOS

### 1. Tabla `sesion_caja`

Representa una sesión de caja (apertura hasta cierre).

```sql
CREATE TABLE sesion_caja (
  -- Identificación
  id CHAR(36) PRIMARY KEY,                    -- UUID
  numero_sesion INT NOT NULL,                 -- Auto-increment por sucursal
  sucursal_id CHAR(36) NOT NULL,
  empleado_apertura_id CHAR(36) NOT NULL,     -- Quien abrió
  empleado_cierre_id CHAR(36) NULL,           -- Quien cerró (NULL si abierta)

  -- Timestamps
  fecha_apertura DATETIME NOT NULL,           -- Cuándo se abrió
  fecha_cierre DATETIME NULL,                 -- Cuándo se cerró (NULL si abierta)

  -- Montos
  monto_inicial DECIMAL(12,2) NOT NULL,       -- Efectivo inicial
  monto_final_esperado DECIMAL(12,2) NULL,    -- Calculado al cerrar
  monto_final_real DECIMAL(12,2) NULL,        -- Contado físicamente
  diferencia DECIMAL(12,2) NULL,              -- Real - Esperado

  -- Estado
  estado ENUM('abierta', 'cerrada') NOT NULL DEFAULT 'abierta',

  -- Auditoría
  notas_apertura TEXT NULL,
  notas_cierre TEXT NULL,
  cierre_inmutable_json JSON NULL,            -- Snapshot inmutable del cierre

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Índices
  INDEX idx_sucursal_estado (sucursal_id, estado),
  INDEX idx_sucursal_numero (sucursal_id, numero_sesion),
  INDEX idx_fecha_apertura (fecha_apertura),
  INDEX idx_fecha_cierre (fecha_cierre),

  -- Constraints
  CONSTRAINT fk_sesion_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursal(id),
  CONSTRAINT fk_sesion_empleado_apertura FOREIGN KEY (empleado_apertura_id) REFERENCES empleado(id),
  CONSTRAINT fk_sesion_empleado_cierre FOREIGN KEY (empleado_cierre_id) REFERENCES empleado(id),
  CONSTRAINT chk_monto_inicial_positivo CHECK (monto_inicial >= 0),
  CONSTRAINT chk_estado_cierre CHECK (
    (estado = 'abierta' AND fecha_cierre IS NULL AND empleado_cierre_id IS NULL) OR
    (estado = 'cerrada' AND fecha_cierre IS NOT NULL AND empleado_cierre_id IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Tabla `movimiento_caja`

Representa movimientos de efectivo (ingresos/egresos) que NO son ventas.

```sql
CREATE TABLE movimiento_caja (
  -- Identificación
  id CHAR(36) PRIMARY KEY,                    -- UUID
  sesion_caja_id CHAR(36) NOT NULL,

  -- Tipo y concepto
  tipo ENUM('ingreso', 'egreso') NOT NULL,
  concepto VARCHAR(255) NOT NULL,             -- "Pago a proveedor", "Retiro"

  -- Monto
  monto DECIMAL(12,2) NOT NULL,

  -- Auditoría
  empleado_id CHAR(36) NOT NULL,              -- Quien hizo el movimiento
  fecha DATETIME NOT NULL,
  notas TEXT NULL,

  -- Soft delete (NO se pueden borrar físicamente)
  esta_activo BOOLEAN NOT NULL DEFAULT TRUE,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Índices
  INDEX idx_sesion (sesion_caja_id),
  INDEX idx_tipo (tipo),
  INDEX idx_fecha (fecha),
  INDEX idx_empleado (empleado_id),

  -- Constraints
  CONSTRAINT fk_movimiento_sesion FOREIGN KEY (sesion_caja_id) REFERENCES sesion_caja(id),
  CONSTRAINT fk_movimiento_empleado FOREIGN KEY (empleado_id) REFERENCES empleado(id),
  CONSTRAINT chk_monto_positivo CHECK (monto > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. Tabla `cierre_caja_detalle`

Detalle inmutable de totales por medio de pago al cerrar.

```sql
CREATE TABLE cierre_caja_detalle (
  -- Identificación
  id CHAR(36) PRIMARY KEY,                    -- UUID
  sesion_caja_id CHAR(36) NOT NULL,

  -- Medio de pago
  forma_pago_id CHAR(36) NOT NULL,
  nombre_forma_pago VARCHAR(100) NOT NULL,    -- Snapshot (ej: "Efectivo")

  -- Totales calculados
  cantidad_transacciones INT NOT NULL,        -- Cuántas ventas
  monto_total DECIMAL(12,2) NOT NULL,         -- Total vendido

  -- Auditoría (inmutable)
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Índices
  INDEX idx_sesion (sesion_caja_id),
  INDEX idx_forma_pago (forma_pago_id),

  -- Constraints
  CONSTRAINT fk_detalle_sesion FOREIGN KEY (sesion_caja_id) REFERENCES sesion_caja(id),
  CONSTRAINT fk_detalle_forma_pago FOREIGN KEY (forma_pago_id) REFERENCES forma_pago(id),
  CONSTRAINT chk_cantidad_positiva CHECK (cantidad_transacciones >= 0),
  CONSTRAINT chk_monto_detalle_positivo CHECK (monto_total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4. Relación con `venta`

La tabla `venta` ya existe y se relaciona con caja:

```sql
-- NO MODIFICAR (solo para referencia)
ALTER TABLE venta ADD COLUMN sesion_caja_id CHAR(36) NULL;
ALTER TABLE venta ADD CONSTRAINT fk_venta_sesion_caja
  FOREIGN KEY (sesion_caja_id) REFERENCES sesion_caja(id);
```

**Importante:** Si `venta.sesion_caja_id` es NULL, significa que la venta se hizo sin sesión de caja (caso excepcional).

---

## 📐 REGLAS DE NEGOCIO

### Apertura de Caja

**PRE-CONDICIONES:**
1. NO debe haber una sesión abierta en la sucursal
2. El empleado debe tener permiso "CAJA_ABRIR"
3. Monto inicial >= 0

**POST-CONDICIONES:**
1. Se crea `sesion_caja` con estado='abierta'
2. `numero_sesion` se auto-incrementa por sucursal
3. `fecha_apertura` = NOW()
4. `empleado_apertura_id` = empleado actual
5. `monto_inicial` = monto provisto

**ERRORES:**
- `CAJA_ALREADY_OPEN`: Ya existe una sesión abierta
- `INSUFFICIENT_PERMISSIONS`: Empleado sin permiso
- `INVALID_AMOUNT`: Monto inicial negativo

### Cierre de Caja

**PRE-CONDICIONES:**
1. DEBE haber una sesión abierta en la sucursal
2. El empleado debe tener permiso "CAJA_CERRAR"
3. `monto_final_real` >= 0

**PROCESO:**
1. Calcular `monto_final_esperado`:
   ```
   monto_final_esperado =
     monto_inicial +
     SUM(ventas en efectivo) +
     SUM(movimientos ingreso) -
     SUM(movimientos egreso)
   ```

2. Calcular `diferencia`:
   ```
   diferencia = monto_final_real - monto_final_esperado
   ```

3. Generar `cierre_caja_detalle` por cada forma de pago:
   - Contar transacciones
   - Sumar montos

4. Crear `cierre_inmutable_json`:
   ```json
   {
     "sesion_id": "...",
     "numero_sesion": 123,
     "fecha_apertura": "...",
     "fecha_cierre": "...",
     "empleado_apertura": { "id": "...", "nombre": "..." },
     "empleado_cierre": { "id": "...", "nombre": "..." },
     "monto_inicial": 1000.00,
     "monto_final_esperado": 5230.50,
     "monto_final_real": 5250.00,
     "diferencia": 19.50,
     "totales_por_forma_pago": [
       { "forma_pago": "Efectivo", "cantidad": 15, "monto": 3500.00 },
       { "forma_pago": "Tarjeta", "cantidad": 8, "monto": 1730.50 }
     ],
     "movimientos": [
       { "tipo": "ingreso", "concepto": "...", "monto": 100.00 },
       { "tipo": "egreso", "concepto": "...", "monto": 200.00 }
     ]
   }
   ```

5. Actualizar `sesion_caja`:
   - `estado` = 'cerrada'
   - `fecha_cierre` = NOW()
   - `empleado_cierre_id` = empleado actual
   - `monto_final_esperado`, `monto_final_real`, `diferencia`
   - `cierre_inmutable_json`

**POST-CONDICIONES:**
1. Sesión cerrada (estado='cerrada')
2. Cierre INMUTABLE (NO se puede editar)
3. Detalle generado en `cierre_caja_detalle`
4. JSON snapshot guardado

**ERRORES:**
- `CAJA_NOT_OPEN`: No hay sesión abierta
- `CAJA_ALREADY_CLOSED`: Sesión ya cerrada
- `INSUFFICIENT_PERMISSIONS`: Empleado sin permiso
- `INVALID_AMOUNT`: Monto final negativo

### Movimientos de Caja

**PRE-CONDICIONES:**
1. DEBE haber una sesión abierta
2. `monto` > 0
3. `tipo` IN ('ingreso', 'egreso')
4. `concepto` no vacío

**POST-CONDICIONES:**
1. Se crea `movimiento_caja`
2. `fecha` = NOW()
3. `empleado_id` = empleado actual
4. NO se puede borrar (soft-delete: `esta_activo = false`)

**ERRORES:**
- `CAJA_NOT_OPEN`: No hay sesión abierta
- `INVALID_AMOUNT`: Monto <= 0
- `MISSING_CONCEPTO`: Concepto vacío

### Inmutabilidad

**REGLAS DURAS:**
1. ❌ NO se puede editar `sesion_caja` si `estado='cerrada'`
2. ❌ NO se puede borrar `sesion_caja` (ni siquiera soft-delete)
3. ❌ NO se puede editar `cierre_caja_detalle`
4. ❌ NO se puede borrar `cierre_caja_detalle`
5. ❌ NO se puede editar `movimiento_caja` (excepto soft-delete)
6. ✅ Se puede soft-delete `movimiento_caja` (esta_activo = false)

### Auditoría

**TRAZABILIDAD COMPLETA:**
- Quién abrió la caja (`empleado_apertura_id`)
- Quién cerró la caja (`empleado_cierre_id`)
- Quién hizo cada movimiento (`movimiento_caja.empleado_id`)
- Cuándo se abrió (`fecha_apertura`)
- Cuándo se cerró (`fecha_cierre`)
- Snapshot inmutable JSON del cierre

**LOG ESTRUCTURADO:**
```json
{
  "action": "caja.apertura",
  "sesion_id": "...",
  "empleado_id": "...",
  "sucursal_id": "...",
  "monto_inicial": 1000.00,
  "timestamp": "..."
}
```

---

## 🔌 CONTRATOS API

### 1. POST /api/caja/abrir

**Request:**
```json
{
  "sucursal_id": "550e8400-e29b-41d4-a716-446655440000",
  "empleado_id": "660e8400-e29b-41d4-a716-446655440001",
  "monto_inicial": 1000.00,
  "notas": "Apertura turno mañana"
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

**Errores:**
- `400 CAJA_ALREADY_OPEN`: Ya hay una caja abierta
- `400 INVALID_AMOUNT`: Monto inicial < 0
- `403 INSUFFICIENT_PERMISSIONS`: Sin permiso CAJA_ABRIR
- `404 SUCURSAL_NOT_FOUND`: Sucursal no existe
- `404 EMPLEADO_NOT_FOUND`: Empleado no existe

### 2. POST /api/caja/cerrar

**Request:**
```json
{
  "sesion_id": "770e8400-e29b-41d4-a716-446655440002",
  "empleado_id": "660e8400-e29b-41d4-a716-446655440001",
  "monto_final_real": 5250.00,
  "notas": "Cierre turno mañana - diferencia mínima"
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
      "nombre": "Juan Pérez"
    },
    "empleado_cierre": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "nombre": "Juan Pérez"
    },
    "monto_inicial": 1000.00,
    "monto_final_esperado": 5230.50,
    "monto_final_real": 5250.00,
    "diferencia": 19.50,
    "estado": "cerrada",
    "totales_por_forma_pago": [
      {
        "forma_pago_id": "880e8400-e29b-41d4-a716-446655440003",
        "nombre": "Efectivo",
        "cantidad_transacciones": 15,
        "monto_total": 3500.00
      },
      {
        "forma_pago_id": "880e8400-e29b-41d4-a716-446655440004",
        "nombre": "Tarjeta Débito",
        "cantidad_transacciones": 8,
        "monto_total": 1730.50
      }
    ],
    "movimientos": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440005",
        "tipo": "ingreso",
        "concepto": "Cambio inicial adicional",
        "monto": 100.00,
        "fecha": "2025-01-15T10:30:00.000Z"
      }
    ],
    "notas": "Cierre turno mañana - diferencia mínima"
  }
}
```

**Errores:**
- `400 CAJA_NOT_OPEN`: No hay sesión abierta
- `400 CAJA_ALREADY_CLOSED`: Sesión ya cerrada
- `400 INVALID_AMOUNT`: Monto final < 0
- `403 INSUFFICIENT_PERMISSIONS`: Sin permiso CAJA_CERRAR
- `404 SESION_NOT_FOUND`: Sesión no existe

### 3. POST /api/caja/movimiento

**Request (Ingreso):**
```json
{
  "sesion_id": "770e8400-e29b-41d4-a716-446655440002",
  "empleado_id": "660e8400-e29b-41d4-a716-446655440001",
  "tipo": "ingreso",
  "concepto": "Préstamo de caja principal",
  "monto": 500.00,
  "notas": "Para cambio"
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
    "sesion_id": "770e8400-e29b-41d4-a716-446655440002",
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

**Errores:**
- `400 CAJA_NOT_OPEN`: No hay sesión abierta
- `400 INVALID_AMOUNT`: Monto <= 0
- `400 MISSING_CONCEPTO`: Concepto vacío
- `404 SESION_NOT_FOUND`: Sesión no existe

### 4. GET /api/caja/sesion/:id

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "sesion_id": "770e8400-e29b-41d4-a716-446655440002",
    "numero_sesion": 123,
    "sucursal_id": "550e8400-e29b-41d4-a716-446655440000",
    "empleado_apertura_id": "660e8400-e29b-41d4-a716-446655440001",
    "empleado_cierre_id": null,
    "fecha_apertura": "2025-01-15T08:00:00.000Z",
    "fecha_cierre": null,
    "monto_inicial": 1000.00,
    "estado": "abierta",
    "movimientos": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440005",
        "tipo": "ingreso",
        "concepto": "Préstamo",
        "monto": 500.00,
        "fecha": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### 5. GET /api/caja/activa?sucursal_id=xxx

**Response 200 OK (Hay caja abierta):**
```json
{
  "success": true,
  "data": {
    "sesion_id": "770e8400-e29b-41d4-a716-446655440002",
    "numero_sesion": 123,
    "estado": "abierta",
    "fecha_apertura": "2025-01-15T08:00:00.000Z",
    "monto_inicial": 1000.00
  }
}
```

**Response 200 OK (No hay caja abierta):**
```json
{
  "success": true,
  "data": null
}
```

---

## 🔄 ESTADOS Y TRANSICIONES

```
                    ┌─────────────┐
                    │   INICIO    │
                    └──────┬──────┘
                           │
                   POST /caja/abrir
                           │
                           ▼
                    ┌─────────────┐
              ┌────►│   ABIERTA   │◄────┐
              │     └──────┬──────┘     │
              │            │            │
POST /caja/movimiento      │     GET /caja/sesion
              │            │            │
              │            │            │
              └────────────┴────────────┘
                           │
                  POST /caja/cerrar
                           │
                           ▼
                    ┌─────────────┐
                    │   CERRADA   │
                    │  (INMUTABLE)│
                    └─────────────┘
```

**Transiciones permitidas:**
- `NULL` → `abierta`: POST /caja/abrir
- `abierta` → `cerrada`: POST /caja/cerrar
- ❌ `cerrada` → `abierta`: NO PERMITIDO
- ❌ `cerrada` → editar: NO PERMITIDO

---

## 📊 AUDITORÍA

### Campos de Auditoría

**sesion_caja:**
- `empleado_apertura_id` - Quién abrió
- `empleado_cierre_id` - Quién cerró
- `fecha_apertura` - Cuándo se abrió
- `fecha_cierre` - Cuándo se cerró
- `cierre_inmutable_json` - Snapshot completo
- `created_at`, `updated_at`

**movimiento_caja:**
- `empleado_id` - Quién hizo el movimiento
- `fecha` - Cuándo se hizo
- `esta_activo` - Soft-delete
- `created_at`, `updated_at`

**cierre_caja_detalle:**
- `created_at` - Cuándo se generó (inmutable)

### Logs Estructurados

```json
// Apertura
{
  "level": "info",
  "action": "caja.apertura",
  "sesion_id": "...",
  "empleado_id": "...",
  "sucursal_id": "...",
  "monto_inicial": 1000.00,
  "timestamp": "2025-01-15T08:00:00.000Z"
}

// Movimiento
{
  "level": "info",
  "action": "caja.movimiento",
  "movimiento_id": "...",
  "sesion_id": "...",
  "tipo": "ingreso",
  "monto": 500.00,
  "empleado_id": "...",
  "timestamp": "2025-01-15T10:30:00.000Z"
}

// Cierre
{
  "level": "info",
  "action": "caja.cierre",
  "sesion_id": "...",
  "empleado_id": "...",
  "monto_final_esperado": 5230.50,
  "monto_final_real": 5250.00,
  "diferencia": 19.50,
  "timestamp": "2025-01-15T16:00:00.000Z"
}
```

---

## 🌐 OFFLINE-FIRST

### Estrategia

1. **Cliente genera UUIDs localmente**
   - `sesion_id`, `movimiento_id` generados en el cliente
   - Idempotencia por UUID

2. **Queue local**
   - Operaciones se encolan si no hay conexión
   - Se sincronizan cuando hay conexión

3. **Timestamps del cliente**
   - `fecha_apertura`, `fecha_cierre`, `fecha` vienen del cliente
   - Validación: no pueden ser futuros

4. **Validación en servidor**
   - Verificar que UUID no exista
   - Verificar reglas de negocio
   - Si UUID ya existe → idempotencia (retornar 200)

### Idempotencia

**Apertura:**
```
Cliente envía: sesion_id = "xxx", monto_inicial = 1000

Primera llamada:
  → 201 Created (sesión creada)

Segunda llamada (mismo UUID):
  → 200 OK (sesión ya existe, retornar datos)
```

**Movimiento:**
```
Cliente envía: movimiento_id = "yyy", monto = 500

Primera llamada:
  → 201 Created (movimiento creado)

Segunda llamada (mismo UUID):
  → 200 OK (movimiento ya existe, retornar datos)
```

**Cierre:**
```
Cliente envía: sesion_id = "xxx", monto_final_real = 5250

Primera llamada:
  → 200 OK (sesión cerrada)

Segunda llamada:
  → 200 OK (sesión ya cerrada, retornar datos)
```

---

## 🎯 DECISIONES TÉCNICAS

### 1. ¿Por qué `cierre_inmutable_json`?

- **Razón:** Snapshot completo para auditoría
- **Ventaja:** Si se borran datos relacionados, el JSON persiste
- **Uso:** Reportes, auditorías, reconstrucción

### 2. ¿Por qué NO borrar movimientos?

- **Razón:** Auditoría completa
- **Alternativa:** Soft-delete con `esta_activo = false`
- **Ventaja:** Trazabilidad total

### 3. ¿Por qué `numero_sesion`?

- **Razón:** Legibilidad humana ("Sesión #123")
- **Implementación:** Auto-increment por sucursal
- **Query:** `MAX(numero_sesion) + 1` en transacción

### 4. ¿Por qué separar `cierre_caja_detalle`?

- **Razón:** Totales por forma de pago (reportes)
- **Ventaja:** Query rápida sin recalcular
- **Inmutabilidad:** NO se puede editar

---

## ✅ VALIDACIONES

### Apertura
- [ ] `sucursal_id` es UUID válido
- [ ] `empleado_id` es UUID válido
- [ ] `monto_inicial` >= 0
- [ ] NO existe sesión abierta en la sucursal
- [ ] Empleado tiene permiso CAJA_ABRIR
- [ ] Sucursal existe
- [ ] Empleado existe

### Cierre
- [ ] `sesion_id` es UUID válido
- [ ] `empleado_id` es UUID válido
- [ ] `monto_final_real` >= 0
- [ ] Sesión existe
- [ ] Sesión está abierta (estado='abierta')
- [ ] Empleado tiene permiso CAJA_CERRAR

### Movimiento
- [ ] `sesion_id` es UUID válido
- [ ] `empleado_id` es UUID válido
- [ ] `tipo` IN ('ingreso', 'egreso')
- [ ] `concepto` no vacío (min 3 chars)
- [ ] `monto` > 0
- [ ] Sesión existe
- [ ] Sesión está abierta

---

**Fin del Diseño**
**Versión:** 1.0.0
**Próximo paso:** Implementación de contratos API
