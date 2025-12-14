# Análisis Comparativo: Modelos de Datos SQL

## Comparación: Modelo Simplificado vs Modelo Completo

### 📊 Resumen Ejecutivo

| Aspecto | Modelo Simplificado (Usuario) | Modelo Completo (Claude) | Recomendación |
|---------|-------------------------------|--------------------------|---------------|
| **Complejidad** | Baja - MVP rápido | Alta - Producción completa | **Híbrido** |
| **Tiempo desarrollo** | 2-3 semanas | 6-8 semanas | **4-5 semanas** |
| **Escalabilidad** | Buena para inicio | Excelente | **Evolución gradual** |
| **Offline support** | ✅ Básico | ✅ Robusto | **Intermedio** |
| **Cumplimiento fiscal** | ⚠️ Mínimo | ✅ Completo | **Progresivo** |

---

## 1️⃣ Análisis Tabla por Tabla

### EMPLEADO / usuarios

**Propuesta Usuario:**
```sql
CREATE TABLE empleado (
    id UUID PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Modelo Completo:**
```sql
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255),
    primer_nombre VARCHAR(50) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    rut VARCHAR(12) UNIQUE,
    rol VARCHAR(20) DEFAULT 'mesero',
    permisos TEXT,
    sucursal_id INTEGER,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Análisis:**

| Característica | Simplificado | Completo | Ganador | Razón |
|---------------|--------------|----------|---------|-------|
| UUID como PK | ✅ | ⚠️ Dual (INT + UUID) | **Simplificado** | Más limpio, menos complejidad |
| Datos personales | ❌ | ✅ | **Completo** | RUT obligatorio en Chile |
| Multi-sucursal | ❌ | ✅ | **Completo** | Requisito del sistema |
| Permisos granulares | ❌ | ✅ | **Depende** | MVP no necesita |

**🎯 Recomendación MVP:**
```sql
CREATE TABLE empleado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificación
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    rut VARCHAR(12) UNIQUE, -- Chile: obligatorio

    -- Nombres
    primer_nombre VARCHAR(50) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50),

    -- Autenticación
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255) NOT NULL, -- Para comanderos

    -- Rol simple (suficiente para MVP)
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'gerente', 'cajero', 'mesero', 'cocina')),

    -- Multi-sucursal (requisito)
    sucursal_id INTEGER NOT NULL,

    -- Estado
    activo BOOLEAN DEFAULT TRUE,

    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (sucursal_id) REFERENCES sucursal(id)
);
```

**Campos agregados respecto al original:**
- ✅ `rut` (obligatorio Chile)
- ✅ `sucursal_id` (multi-sucursal es requisito)
- ✅ `password_hash` (necesario para backoffice)
- ✅ `apellidos` separados (estándar Chile)
- ✅ `updated_at` (auditoría básica)

---

### PEDIDO

**Propuesta Usuario:**
```sql
CREATE TABLE pedido (
    id UUID PRIMARY KEY,
    id_mesa UUID REFERENCES mesa(id),
    id_empleado UUID REFERENCES empleado(id),
    estado VARCHAR(20) NOT NULL,
    total DECIMAL(10,2) DEFAULT 0,
    estado_sincronizacion VARCHAR(20) NOT NULL,
    origen_dispositivo UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Modelo Completo:** (58 campos)

**Análisis:**

| Aspecto | Simplificado | Completo | MVP Necesita |
|---------|--------------|----------|--------------|
| Campos totales | 8 | 58 | ~15-20 |
| División de cuenta | ❌ | ✅ | ✅ Sí |
| Tipos de pedido | ❌ | ✅ | ⚠️ Fase 2 |
| Propinas | ❌ | ✅ | ✅ Sí (Chile) |
| Facturación | ❌ | ✅ | ⚠️ Fase 2 |
| Sync robusta | ✅ Básica | ✅ Completa | ✅ Básica OK |

**🎯 Recomendación MVP:**
```sql
CREATE TABLE pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificación visible (generada por servidor)
    numero_pedido VARCHAR(50) UNIQUE,
    numero_temp VARCHAR(50), -- Temporal offline

    -- Relaciones
    id_mesa INTEGER NOT NULL,
    id_mesero INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    id_cliente INTEGER, -- NULL = anónimo

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'confirmado', 'en_cocina', 'listo', 'servido', 'pagado', 'cancelado')),
    estado_pago VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado_pago IN ('pendiente', 'pagado', 'parcial', 'anulado')),

    -- Montos (CLP sin decimales)
    subtotal DECIMAL(10,0) DEFAULT 0,
    descuento DECIMAL(10,0) DEFAULT 0,
    propina DECIMAL(10,0) DEFAULT 0,
    iva DECIMAL(10,0) DEFAULT 0, -- 19% en Chile
    total DECIMAL(10,0) DEFAULT 0,

    -- División de cuenta (MVP necesita esto)
    cuenta_dividida BOOLEAN DEFAULT FALSE,
    numero_divisiones INTEGER DEFAULT 1,

    -- Notas
    notas_especiales TEXT,
    notas_cocina TEXT,

    -- Sincronización (CRÍTICO)
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE'
        CHECK (sync_status IN ('PENDIENTE', 'SINCRONIZANDO', 'SINCRONIZADO', 'ERROR')),
    sync_retries INTEGER DEFAULT 0,
    device_id UUID NOT NULL,
    creado_offline BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP,

    FOREIGN KEY (id_mesa) REFERENCES mesa(id),
    FOREIGN KEY (id_mesero) REFERENCES empleado(id),
    FOREIGN KEY (id_sucursal) REFERENCES sucursal(id)
);

-- Índices críticos
CREATE INDEX idx_pedido_sync ON pedido(sync_status, device_id);
CREATE INDEX idx_pedido_mesa ON pedido(id_mesa, estado);
CREATE INDEX idx_pedido_estado ON pedido(estado);
```

**Campos agregados respecto al original:**
- ✅ `numero_pedido` / `numero_temp` (trazabilidad)
- ✅ `sucursal_id` (multi-sucursal)
- ✅ `estado_pago` separado (importante para caja)
- ✅ `propina` (cultura chilena - muy usado)
- ✅ `iva` separado (fiscalidad)
- ✅ `cuenta_dividida` (requisito MVP documento)
- ✅ `sync_retries` (robustez offline)
- ✅ `creado_offline` (auditoría)

---

### PAGO

**Propuesta Usuario:**
```sql
CREATE TABLE pago (
    id UUID PRIMARY KEY,
    id_pedido UUID REFERENCES pedido(id),
    metodo VARCHAR(30) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    cambio DECIMAL(10,2) DEFAULT 0,
    estado_sincronizacion VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**🎯 Recomendación MVP:**
```sql
CREATE TABLE pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificación
    numero_pago VARCHAR(50) UNIQUE, -- Generado servidor
    numero_temp VARCHAR(50), -- Temporal offline

    -- Relaciones
    id_pedido UUID NOT NULL,
    id_sesion_caja UUID NOT NULL, -- CRÍTICO para cierres
    id_cajero INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,

    -- Método de pago
    metodo VARCHAR(30) NOT NULL
        CHECK (metodo IN ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mixto')),

    -- Montos (CLP sin decimales)
    monto DECIMAL(10,0) NOT NULL,
    monto_recibido DECIMAL(10,0), -- Solo efectivo
    cambio DECIMAL(10,0) DEFAULT 0,

    -- Pago mixto
    es_mixto BOOLEAN DEFAULT FALSE,
    detalle_mixto TEXT, -- JSON: [{"metodo": "efectivo", "monto": 5000}, ...]

    -- Propina (puede ser parte del pago)
    propina DECIMAL(10,0) DEFAULT 0,

    -- Referencias externas
    referencia_externa VARCHAR(100), -- Código transacción tarjeta
    voucher_url VARCHAR(255),

    -- Estado
    estado VARCHAR(20) DEFAULT 'completado'
        CHECK (estado IN ('completado', 'anulado')),
    anulado BOOLEAN DEFAULT FALSE,
    anulado_por INTEGER,
    anulado_at TIMESTAMP,
    motivo_anulacion TEXT,

    -- Sincronización (MÁXIMA PRIORIDAD)
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE',
    sync_priority INTEGER DEFAULT 1, -- Pagos siempre prioridad 1
    sync_retries INTEGER DEFAULT 0,
    device_id UUID NOT NULL,
    creado_offline BOOLEAN DEFAULT FALSE,

    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (id_pedido) REFERENCES pedido(id),
    FOREIGN KEY (id_sesion_caja) REFERENCES sesion_caja(id),
    FOREIGN KEY (id_cajero) REFERENCES empleado(id),
    FOREIGN KEY (id_sucursal) REFERENCES sucursal(id),
    FOREIGN KEY (anulado_por) REFERENCES empleado(id)
);

-- Trigger: Prevenir modificación de pagos sincronizados
CREATE OR REPLACE FUNCTION prevenir_modificacion_pago()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.sync_status = 'SINCRONIZADO' THEN
        RAISE EXCEPTION 'No se pueden modificar pagos sincronizados. Crear compensación.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevenir_mod_pago
BEFORE UPDATE ON pago
FOR EACH ROW
EXECUTE FUNCTION prevenir_modificacion_pago();

-- Índices
CREATE INDEX idx_pago_pedido ON pago(id_pedido);
CREATE INDEX idx_pago_sync ON pago(sync_status, sync_priority);
CREATE INDEX idx_pago_sesion ON pago(id_sesion_caja);
```

**Campos críticos agregados:**
- ✅ `id_sesion_caja` (obligatorio para cierres de caja)
- ✅ `es_mixto` + `detalle_mixto` (requisito documento)
- ✅ `propina` (Chile - muy común)
- ✅ `anulado` + campos de anulación (fiscalidad)
- ✅ `sync_priority` (pagos siempre primero)
- ✅ Trigger de inmutabilidad (fiscalidad crítica)

---

## 2️⃣ Tablas FALTANTES en Modelo Simplificado

### ❌ CRÍTICAS para MVP:

#### 1. `sucursal`
**Razón:** Sistema multi-sucursal es requisito obligatorio

```sql
CREATE TABLE sucursal (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    comuna VARCHAR(50),
    region VARCHAR(50),
    timezone VARCHAR(50) DEFAULT 'America/Santiago',
    tasa_iva DECIMAL(5,2) DEFAULT 19.00,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `sesion_caja`
**Razón:** Sin esto, no puedes hacer cierres de caja (fiscalidad)

```sql
CREATE TABLE sesion_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_sesion VARCHAR(50) UNIQUE,
    id_cajero INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    estado VARCHAR(20) DEFAULT 'abierta'
        CHECK (estado IN ('abierta', 'cerrada')),

    -- Montos
    monto_apertura DECIMAL(10,0) NOT NULL DEFAULT 0,
    monto_esperado DECIMAL(10,0),
    monto_real DECIMAL(10,0),
    diferencia DECIMAL(10,0),

    total_ventas DECIMAL(10,0) DEFAULT 0,
    total_efectivo DECIMAL(10,0) DEFAULT 0,
    total_tarjeta DECIMAL(10,0) DEFAULT 0,
    cantidad_ventas INTEGER DEFAULT 0,

    -- Sync
    sync_status VARCHAR(20) DEFAULT 'PENDIENTE',
    device_id UUID NOT NULL,

    -- Timestamps
    abierta_at TIMESTAMP DEFAULT NOW(),
    cerrada_at TIMESTAMP,

    FOREIGN KEY (id_cajero) REFERENCES empleado(id),
    FOREIGN KEY (id_sucursal) REFERENCES sucursal(id)
);
```

#### 3. `dispositivo`
**Razón:** Gestionar 9 dispositivos simultáneos (requisito)

```sql
CREATE TABLE dispositivo (
    id UUID PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('POS', 'MOBILE', 'KDS')),
    id_sucursal INTEGER NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo',
    online BOOLEAN DEFAULT FALSE,
    ultima_sincronizacion TIMESTAMP,
    registrado_at TIMESTAMP DEFAULT NOW(),

    FOREIGN KEY (id_sucursal) REFERENCES sucursal(id)
);
```

#### 4. `sync_event` (Ya incluida por usuario - ✅ Bien!)

---

### ⚠️ IMPORTANTES para MVP (Fase 1.5):

#### 5. `orden_cocina` (KDS - módulo deseable pero diseñar ahora)

```sql
CREATE TABLE orden_cocina (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_detalle_pedido UUID NOT NULL,
    id_pedido UUID NOT NULL,
    id_estacion_cocina INTEGER NOT NULL,

    mesa_numero VARCHAR(10) NOT NULL,
    producto_nombre VARCHAR(150) NOT NULL,
    cantidad DECIMAL(8,2) NOT NULL,
    notas TEXT,

    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'en_preparacion', 'listo', 'servido', 'cancelado')),

    tiempo_estimado INTEGER, -- minutos

    received_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    FOREIGN KEY (id_detalle_pedido) REFERENCES detalle_pedido(id),
    FOREIGN KEY (id_pedido) REFERENCES pedido(id),
    FOREIGN KEY (id_estacion_cocina) REFERENCES estacion_cocina(id)
);
```

#### 6. `estacion_cocina`

```sql
CREATE TABLE estacion_cocina (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#ef4444',
    id_sucursal INTEGER NOT NULL,
    activa BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (id_sucursal) REFERENCES sucursal(id)
);

-- Datos iniciales
INSERT INTO estacion_cocina (codigo, nombre, color, id_sucursal) VALUES
('COCINA_CALIENTE', 'Cocina Caliente', '#ef4444', 1),
('COCINA_FRIA', 'Cocina Fría', '#3b82f6', 1),
('BARRA', 'Barra', '#8b5cf6', 1),
('PARRILLA', 'Parrilla', '#f59e0b', 1);
```

---

## 3️⃣ Decisiones Técnicas Críticas

### PostgreSQL vs SQLite

| Aspecto | SQLite | PostgreSQL | Recomendación MVP |
|---------|--------|------------|-------------------|
| **Desarrollo local** | ✅ Fácil | ⚠️ Requiere Docker | **SQLite** |
| **Producción** | ❌ No soporta concurrencia | ✅ Robusto | **PostgreSQL** |
| **UUIDs nativos** | ❌ Necesita función custom | ✅ `gen_random_uuid()` | **PostgreSQL gana** |
| **Triggers** | ✅ Soporta | ✅ Soporta | **Empate** |
| **JSON fields** | ⚠️ Limitado | ✅ Excelente | **PostgreSQL** |

**🎯 Decisión Final:**
- **Desarrollo:** SQLite (ya está configurado)
- **Producción:** Migrar a PostgreSQL
- **Código:** Usar Knex.js (ya configurado) para abstraer diferencias

### UUID: PK directo vs Dual (INT + UUID)

**Propuesta Usuario:** UUID como PK directo
```sql
id UUID PRIMARY KEY
```

**Modelo Completo:** Dual
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT,
uuid CHAR(36) UNIQUE NOT NULL
```

**Análisis:**

| Aspecto | UUID PK | Dual INT+UUID | Ganador |
|---------|---------|---------------|---------|
| **Simplicidad** | ✅ Más limpio | ❌ Duplica columnas | **UUID** |
| **Performance** | ⚠️ Índice más grande | ✅ INT más rápido | **Dual** |
| **Offline-first** | ✅ Generación local | ✅ UUID cubre | **Empate** |
| **Joins** | ⚠️ Más lentos | ✅ Más rápidos | **Dual** |
| **Legibilidad** | ❌ UUIDs largos | ✅ IDs cortos | **Dual** |

**🎯 Recomendación:**
**UUID como PK directo** para MVP por:
1. Más simple de implementar
2. Offline-first natural
3. No necesitas migrar IDs entre dispositivos
4. Performance diferencia es mínima con < 100k registros
5. PostgreSQL optimiza bien UUIDs

Si el proyecto escala a millones de registros, puedes optimizar después con UUIDs v7 (ordenables).

---

## 4️⃣ Modelo Híbrido Recomendado (MVP Fase 1)

### Principio: **Empezar simple, evolucionar con datos reales**

```
FASE 0 (Ahora):     Modelo simplificado + campos críticos
FASE 1 (2 semanas): Agregar división de cuenta + propinas
FASE 2 (4 semanas): Reportes avanzados + campos analíticos
FASE 3 (6 semanas): Optimizaciones basadas en uso real
```

### Tablas MVP Fase 0 (Orden de implementación):

1. ✅ `sucursal` (prerequisito)
2. ✅ `empleado` (prerequisito)
3. ✅ `dispositivo` (multi-device)
4. ✅ `zona` (prerequisito mesas)
5. ✅ `mesa` (core)
6. ✅ `categoria` (prerequisito productos)
7. ✅ `producto` (core)
8. ✅ `modificador` + `producto_modificador` (MVP necesita)
9. ✅ `pedido` (core)
10. ✅ `detalle_pedido` (core)
11. ✅ `sesion_caja` (fiscalidad)
12. ✅ `pago` (core)
13. ✅ `sync_event` (offline)

**Total: 13 tablas core**

### Tablas Fase 1.5 (Después de MVP funcionando):

14. `estacion_cocina`
15. `orden_cocina` (KDS)
16. `cliente` (CRM básico)
17. `sync_conflict` (si hay problemas en producción)

---

## 5️⃣ Script SQL Final Recomendado

Voy a generar el script SQL completo híbrido optimizado para PostgreSQL con compatibilidad SQLite.

**🎯 Siguiente Acción:**
¿Quieres que genere:
1. **Script SQL completo** del modelo híbrido?
2. **Migración Knex.js** (más profesional, versionado)?
3. **Ambos** (SQL + Knex)?

Recomiendo **Opción 3** porque:
- SQL puro para documentación y testing manual
- Knex para control de versiones y migración gradual

---

## 6️⃣ Comparación Final

| Métrica | Modelo Simplificado | Modelo Híbrido | Modelo Completo |
|---------|---------------------|----------------|-----------------|
| **Tablas** | 8 | 13 | 25+ |
| **Campos promedio** | 6-8 | 12-15 | 20-30 |
| **Tiempo desarrollo** | 1 semana | 2-3 semanas | 6-8 semanas |
| **Cubre MVP** | ⚠️ 80% | ✅ 100% | ✅ 100% + Fase 2 |
| **Fiscalidad** | ⚠️ Básica | ✅ Completa | ✅ Completa |
| **Offline** | ✅ Sí | ✅ Robusto | ✅ Muy robusto |
| **Escalabilidad** | ⚠️ Media | ✅ Alta | ✅ Muy alta |
| **Complejidad** | Baja | Media | Alta |

---

## 7️⃣ Conclusión y Siguiente Paso

### ✅ Aprobado del Modelo Simplificado:
- UUID como PK (excelente decisión)
- `sync_event` (crítico - bien identificado)
- `estado_sincronizacion` en tablas transaccionales
- Estructura limpia y clara

### ⚠️ Campos Críticos que DEBES Agregar:

1. **`pedido`:**
   - `propina` (cultura Chile)
   - `cuenta_dividida` (requisito documento)
   - `numero_pedido` separado de UUID
   - `sync_retries` (robustez)

2. **`pago`:**
   - `id_sesion_caja` (cierres obligatorios)
   - `es_mixto` + `detalle_mixto`
   - `sync_priority = 1` (siempre)
   - Trigger inmutabilidad

3. **Tablas nuevas obligatorias:**
   - `sucursal` (multi-sucursal es requisito)
   - `sesion_caja` (fiscalidad)
   - `dispositivo` (gestión de 9 dispositivos)

### 🎯 Propuesta Concreta:

Te entrego el **Modelo Híbrido Optimizado**:
- ✅ Base del modelo simplificado
- ✅ + Campos críticos fiscales
- ✅ + Tablas obligatorias multi-sucursal
- ✅ + Triggers de integridad
- ✅ Comentarios explicativos en cada campo
- ✅ Índices optimizados
- ✅ Scripts de migración Knex.js

**¿Procedemos con esto?**

Si dices sí, genero en el siguiente mensaje:
1. 📄 `schema-hibrido-mvp.sql` (PostgreSQL)
2. 📄 `schema-hibrido-mvp-sqlite.sql` (desarrollo)
3. 📁 Migraciones Knex.js numeradas
4. 📄 Script de datos iniciales (seed)
