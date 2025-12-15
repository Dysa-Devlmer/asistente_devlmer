# ITERACIÓN 3 - CONSOLIDACIÓN BACKEND

**Fecha:** 2025-01-15
**Branch:** feature/backend-consolidation
**Objetivo:** Endurecer backend para operación real (producción-ready)

---

## 📋 RESUMEN EJECUTIVO

Esta iteración implementa características de nivel producción para el backend de POS Venta API, sin agregar nuevas funcionalidades de negocio. El foco está en:

- ✅ **Operabilidad:** Health checks para Kubernetes
- ✅ **Observabilidad:** Logging estructurado con request tracing
- ✅ **Confiabilidad:** Manejo estandarizado de errores
- ✅ **Protección:** Rate limiting y timeouts de DB
- ✅ **Documentación:** Guía de operaciones completa

---

## 🎯 ALCANCE IMPLEMENTADO

### 1. Typed Errors System

**Archivos creados:**
- `backend/src/common/errors/typed-errors.ts`

**Características:**
- 13 códigos de error tipificados (VALIDATION_ERROR, INVALID_UUID, RATE_LIMIT_EXCEEDED, DATABASE_TIMEOUT, etc.)
- Clase base `TypedError` con metadata y serialización JSON
- Clases específicas para errores comunes
- Metadata automática (timestamp, request_id)

**Códigos de error:**
```typescript
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',           // 400
  INVALID_UUID = 'INVALID_UUID',                   // 400
  INVALID_PAGINATION = 'INVALID_PAGINATION',       // 400
  INVALID_TIMESTAMP = 'INVALID_TIMESTAMP',         // 400
  MISSING_REQUIRED_PARAM = 'MISSING_REQUIRED_PARAM', // 400
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',       // 404
  SUCURSAL_NOT_FOUND = 'SUCURSAL_NOT_FOUND',       // 404
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',     // 429
  DATABASE_ERROR = 'DATABASE_ERROR',               // 500
  DATABASE_TIMEOUT = 'DATABASE_TIMEOUT',           // 500
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED', // 500
  INTERNAL_ERROR = 'INTERNAL_ERROR',               // 500
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',     // 503
  DATABASE_UNAVAILABLE = 'DATABASE_UNAVAILABLE',   // 503
}
```

**Ejemplo de uso:**
```typescript
throw new InvalidUUIDError('sucursal_id', 'invalid-uuid-123');

// Response:
{
  "statusCode": 400,
  "error": "Bad Request",
  "code": "INVALID_UUID",
  "message": "sucursal_id debe ser un UUID válido (recibido: invalid-uuid-123)",
  "metadata": {
    "fieldName": "sucursal_id",
    "value": "invalid-uuid-123",
    "timestamp": "2025-01-15T14:30:00.000Z"
  }
}
```

---

### 2. Structured Logging

**Archivos creados:**
- `backend/src/common/logging/structured-logger.ts`

**Características:**
- Logs en formato JSON estructurado
- 4 niveles: ERROR, WARN, INFO, DEBUG
- Request ID tracking automático
- Metadata extensible

**Formato de log:**
```json
{
  "timestamp": "2025-01-15T14:30:00.000Z",
  "level": "info",
  "message": "Request completed successfully",
  "metadata": {
    "service": "pos-venta-api",
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "method": "GET",
    "path": "/api/bootstrap/catalogo",
    "status_code": 200,
    "duration_ms": 45
  }
}
```

**Queries útiles (Loki/CloudWatch):**
```logql
# Todos los errores
{service="pos-venta-api"} | json | level="error"

# Errores de un request específico
{service="pos-venta-api"} | json | request_id="550e8400-..."

# Requests lentos (> 1s)
{service="pos-venta-api"} | json | duration_ms > 1000
```

---

### 3. Middlewares

**Archivos creados:**
- `backend/src/common/middleware/request-id.middleware.ts`
- `backend/src/common/middleware/request-logger.middleware.ts`
- `backend/src/common/middleware/error-handler.middleware.ts`
- `backend/src/common/middleware/rate-limiter.middleware.ts`

#### 3.1 Request ID Middleware

**Funcionalidad:**
- Genera UUID único por request
- Acepta `X-Request-ID` del cliente
- Agrega `x-request-id` al response
- Permite tracing end-to-end

**Ejemplo:**
```bash
curl -H "X-Request-ID: my-custom-id" http://localhost:3000/api/bootstrap/catalogo
# Response incluye: x-request-id: my-custom-id
```

#### 3.2 Request Logger Middleware

**Funcionalidad:**
- Logea inicio y fin de cada request
- Calcula duration_ms
- Incluye method, path, status_code
- Usa request_id para correlación

**Log de ejemplo:**
```json
{
  "level": "info",
  "message": "Request completed",
  "metadata": {
    "request_id": "...",
    "method": "GET",
    "path": "/api/bootstrap/catalogo",
    "status_code": 200,
    "duration_ms": 45
  }
}
```

#### 3.3 Error Handler Middleware

**Funcionalidad:**
- Captura TODOS los errores de la aplicación
- Distingue TypedError vs Error genérico
- Incluye request_id en error response
- Oculta stack traces en producción

**Errores manejados:**
- TypedError → Respeta status code y metadata
- Error genérico → 500 Internal Server Error
- NODE_ENV=production → Oculta detalles

#### 3.4 Rate Limiter Middleware

**Funcionalidad:**
- Rate limiting en memoria (IP-based)
- 3 limiters configurables
- Headers X-RateLimit-*
- Error 429 con Retry-After

**Límites configurados:**
```typescript
export const rateLimiters = {
  general: createRateLimiter({ windowMs: 60000, maxRequests: 100 }),
  bootstrap: createRateLimiter({ windowMs: 60000, maxRequests: 30 }),
  deltaSync: createRateLimiter({ windowMs: 60000, maxRequests: 10 }),
};
```

**Headers de rate limit:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705329060
```

**Error 429:**
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit excedido: máximo 100 requests por 60s",
  "metadata": {
    "limit": 100,
    "windowMs": 60000,
    "retry_after": 45
  }
}
```

---

### 4. Health Checks

**Archivos creados:**
- `backend/src/common/health/health-checker.ts`
- `backend/src/common/health/health.controller.ts`

#### 4.1 GET /health (Liveness)

**Propósito:** Verificar que el proceso está vivo

**Response 200 OK:**
```json
{
  "status": "healthy",
  "checks": {
    "process": {
      "status": "healthy",
      "message": "Process is running"
    }
  },
  "timestamp": "2025-01-15T14:30:00.000Z",
  "uptime_seconds": 3600
}
```

**Uso en Kubernetes:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3
```

#### 4.2 GET /ready (Readiness)

**Propósito:** Verificar que puede recibir tráfico

**Checks realizados:**
- ✅ Database connectivity (timeout 5s)
- ✅ Memory usage (degraded si > 85%)

**Response 200 OK (Healthy):**
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database is reachable",
      "duration_ms": 15
    },
    "memory": {
      "status": "healthy",
      "message": "Memory usage: 45%",
      "heap_usage_percent": 45
    }
  }
}
```

**Response 200 OK (Degraded):**
```json
{
  "status": "degraded",
  "checks": {
    "database": {
      "status": "degraded",
      "message": "Database responding slowly",
      "duration_ms": 1500
    }
  }
}
```

**Response 503 Service Unavailable:**
```json
{
  "status": "unhealthy",
  "checks": {
    "database": {
      "status": "unhealthy",
      "message": "Database is unreachable",
      "error": "Connection refused"
    }
  }
}
```

**Uso en Kubernetes:**
```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
```

---

### 5. Database Timeouts

**Archivos creados:**
- `backend/src/common/database/db-config.ts`

**Configuración:**
```typescript
export const defaultDatabaseConfig = {
  connectionLimit: 10,       // 10 conexiones concurrentes
  connectTimeout: 10000,     // 10s para establecer conexión
  acquireTimeout: 10000,     // 10s para adquirir del pool
  timeout: 30000,            // 30s timeout para queries
  queueLimit: 0,             // Sin límite de queue
};
```

**Funciones útiles:**

1. **executeWithTimeout:** Wrapper para queries con timeout manual
```typescript
const result = await executeWithTimeout(db,
  'SELECT * FROM producto WHERE sucursal_id = ?',
  [sucursalId],
  30000 // 30s timeout
);
```

2. **verifyDatabaseConnection:** Verifica conexión con retry
```typescript
await verifyDatabaseConnection(db, 3, 1000);
// 3 intentos, 1s entre intentos
```

**Error de timeout:**
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "code": "DATABASE_TIMEOUT",
  "message": "Database query timeout (30000ms)",
  "metadata": {
    "timeoutMs": 30000,
    "query": "SELECT * FROM producto WHERE..."
  }
}
```

---

### 6. Integración con Bootstrap API

**Archivos modificados:**
- `backend/src/modules/bootstrap/bootstrap.module.ts`
- `backend/src/modules/bootstrap/controllers/bootstrap.controller.ts`

**Cambios implementados:**

1. **Rate limiting por endpoint:**
   - `/catalogo` → 30 requests/60s
   - `/empleados` → 30 requests/60s
   - `/delta` → 10 requests/60s

2. **Typed errors en controller:**
   - Reemplazó validaciones manuales por `InvalidUUIDError`
   - Reemplazó validaciones manuales por `MissingRequiredParamError`
   - Removió método `handleError()` (ahora usa middleware)

3. **Structured logging:**
   - Log de inicio de cada request
   - Log de errores con request_id
   - Metadata completa

4. **Propagación de errores:**
   - Uso de `next(error)` para pasar al middleware
   - Error handler centralizado

**Antes:**
```typescript
async getCatalogo(req: Request, res: Response): Promise<void> {
  try {
    if (!sucursal_id) {
      res.status(400).json({ statusCode: 400, message: '...' });
      return;
    }
    // ...
  } catch (error) {
    this.handleError(res, error);
  }
}
```

**Después:**
```typescript
async getCatalogo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!sucursal_id) {
      throw new MissingRequiredParamError('sucursal_id');
    }
    logger.info('GET /api/bootstrap/catalogo', { request_id: req.request_id });
    // ...
  } catch (error) {
    logger.error('Error in getCatalogo', { request_id: req.request_id }, error);
    next(error); // Propagar a middleware
  }
}
```

---

## 📚 DOCUMENTACIÓN

**Archivo creado:**
- `docs/OPERATIONS-GUIDE.md` (800+ líneas)

**Contenido:**
- Health checks (liveness y readiness)
- Logging estructurado con queries de ejemplo
- Códigos de error y formato de response
- Rate limiting configuration
- Database timeouts
- Métricas clave y alertas recomendadas
- Troubleshooting guides
- Runbooks para incidentes comunes

**Secciones clave:**
- 🏥 Health Checks
- 📝 Logging
- ⚠️ Error Handling
- 🚦 Rate Limiting
- ⏱️ Database Timeouts
- 📊 Monitoring
- 🔧 Troubleshooting
- 📖 Runbooks

---

## 🧪 TESTS

**Archivos creados:**

### Unit Tests (1 archivo)
- `backend/tests/unit/common/typed-errors.spec.ts`
  - Tests para TypedError base
  - Tests para errores específicos (ValidationError, InvalidUUIDError, etc.)
  - Tests de serialización JSON

### E2E Tests (3 archivos)
- `backend/tests/e2e/common/health-checks.e2e.spec.ts` (12 tests)
  - Liveness probe tests
  - Readiness probe tests
  - Database health check tests
  - Memory health check tests
  - Degraded state tests
  - Kubernetes integration tests

- `backend/tests/e2e/common/rate-limiter.e2e.spec.ts` (12 tests)
  - Rate limit headers tests
  - Error 429 tests
  - Retry-After header tests
  - Multiple rate limiters tests
  - Window reset tests
  - Request ID in errors tests

- `backend/tests/e2e/common/error-handling.e2e.spec.ts` (10 tests)
  - TypedError handling tests
  - Generic error handling tests
  - Request ID propagation tests
  - Error metadata tests
  - Error format tests

**Total:** 35+ tests

**Ejecutar tests:**
```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# Todos los tests
npm test
```

---

## 📦 ESTRUCTURA DE ARCHIVOS

```
backend/
├── src/
│   ├── common/
│   │   ├── errors/
│   │   │   └── typed-errors.ts           # Sistema de errores tipificados
│   │   ├── logging/
│   │   │   └── structured-logger.ts      # Logger JSON estructurado
│   │   ├── middleware/
│   │   │   ├── request-id.middleware.ts  # Request ID tracking
│   │   │   ├── request-logger.middleware.ts  # Request logging
│   │   │   ├── error-handler.middleware.ts   # Error handling centralizado
│   │   │   └── rate-limiter.middleware.ts    # Rate limiting
│   │   ├── health/
│   │   │   ├── health-checker.ts         # Health check logic
│   │   │   └── health.controller.ts      # Health endpoints
│   │   └── database/
│   │       └── db-config.ts              # DB timeouts y config
│   └── modules/
│       └── bootstrap/
│           ├── bootstrap.module.ts       # Router con rate limiting
│           └── controllers/
│               └── bootstrap.controller.ts  # Controller con typed errors
├── tests/
│   ├── unit/
│   │   └── common/
│   │       └── typed-errors.spec.ts      # Unit tests de errores
│   └── e2e/
│       └── common/
│           ├── health-checks.e2e.spec.ts # E2E health checks
│           ├── rate-limiter.e2e.spec.ts  # E2E rate limiting
│           └── error-handling.e2e.spec.ts # E2E error handling
└── docs/
    ├── OPERATIONS-GUIDE.md               # Guía de operaciones
    └── ITERACION3-CONSOLIDACION-BACKEND.md  # Este documento
```

---

## 🚀 CÓMO USAR

### 1. Configurar Express App

```typescript
import express from 'express';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { requestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { errorHandlerMiddleware } from './common/middleware/error-handler.middleware';
import { rateLimiters } from './common/middleware/rate-limiter.middleware';
import { createBootstrapRouter } from './modules/bootstrap/bootstrap.module';
import { HealthController } from './common/health/health.controller';

const app = express();

// 1. Request ID (debe ser primero)
app.use(requestIdMiddleware);

// 2. Request Logger
app.use(requestLoggerMiddleware);

// 3. Rate limiting general (opcional)
app.use(rateLimiters.general);

// 4. Health checks
const healthController = new HealthController(db);
app.get('/health', (req, res) => healthController.getHealth(req, res));
app.get('/ready', (req, res) => healthController.getReady(req, res));

// 5. Bootstrap API (con rate limiting específico)
app.use('/api/bootstrap', createBootstrapRouter(db));

// 6. Error handler (debe ser último)
app.use(errorHandlerMiddleware);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 2. Usar Typed Errors

```typescript
import { InvalidUUIDError, MissingRequiredParamError } from './common/errors/typed-errors';

// En tu controller o service
if (!userId) {
  throw new MissingRequiredParamError('userId');
}

if (!isUUID(userId)) {
  throw new InvalidUUIDError('userId', userId);
}
```

### 3. Usar Structured Logger

```typescript
import { logger } from './common/logging/structured-logger';

// Info
logger.info('User logged in', {
  request_id: req.request_id,
  user_id: userId,
});

// Error
logger.error('Failed to fetch user', {
  request_id: req.request_id,
  user_id: userId,
}, error);
```

### 4. Configurar DB con Timeouts

```typescript
import mysql from 'mysql2/promise';
import { createDatabaseConfig, defaultDatabaseConfig } from './common/database/db-config';

const config = createDatabaseConfig({
  ...defaultDatabaseConfig,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const db = mysql.createPool(config);
```

---

## 📊 MÉTRICAS Y MONITORING

### Métricas Clave

**Disponibilidad:**
- Uptime: > 99.9%
- Health check success rate: 100%

**Performance:**
- Request latency (p50): < 100ms
- Request latency (p95): < 500ms
- Request latency (p99): < 1000ms

**Errores:**
- Error rate (4xx): < 1%
- Error rate (5xx): < 0.1%

**Database:**
- DB query duration (p95): < 200ms
- DB connection pool usage: < 80%
- DB timeout rate: < 0.01%

**Rate Limiting:**
- Rate limit hit rate: < 1%

### Alertas Recomendadas

| Alerta | Condición | Severidad |
|--------|-----------|-----------|
| High Error Rate | 5xx rate > 1% por 5min | Critical |
| Database Down | Readiness check fails por 2min | Critical |
| High Memory | Memory usage > 90% por 5min | Warning |
| Slow Responses | p95 latency > 1s por 5min | Warning |
| DB Timeouts | > 10 timeouts por min | Warning |

---

## 🎯 DECISIONES TÉCNICAS

### 1. Rate Limiting en Memoria vs Redis

**Decisión:** Implementado en memoria
**Razón:** Simplicidad para staging, fácil migración a Redis después
**Nota:** Producción debe usar Redis para clustering

### 2. Manejo de Errores: Middleware vs try-catch local

**Decisión:** Middleware centralizado con typed errors
**Razón:** DRY, consistencia, facilita debugging
**Ventaja:** Un solo lugar para formato de error

### 3. Health Checks: Simple vs Complejo

**Decisión:** Liveness simple, Readiness con checks
**Razón:** Kubernetes best practices
**Checks:** DB + Memory (mínimo viable)

### 4. Logging: JSON vs Plain Text

**Decisión:** JSON estructurado
**Razón:** Integración con Loki/CloudWatch/ELK
**Ventaja:** Query-able, filterable

### 5. Database Timeouts: Múltiples niveles

**Decisión:** Connection + Acquisition + Query timeouts
**Razón:** Granularidad para debugging
**Default:** 10s/10s/30s (ajustable por query)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Typed errors system
- [x] Structured logging con request_id
- [x] Middleware de request ID
- [x] Middleware de request logger
- [x] Middleware de error handler
- [x] Middleware de rate limiter
- [x] Health checks (/health y /ready)
- [x] Database timeout configuration
- [x] Integración con Bootstrap API
- [x] Tests unitarios (typed errors)
- [x] Tests E2E (health, rate limit, errors)
- [x] Documentación de operaciones
- [x] Resumen de iteración

---

## 📝 NOTAS DE PRODUCCIÓN

### Variables de Entorno Requeridas

```bash
NODE_ENV=production          # production | development | staging
LOG_LEVEL=info              # error | warn | info | debug

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=pos_venta
DB_CONNECTION_LIMIT=10
DB_CONNECT_TIMEOUT=10000
DB_ACQUIRE_TIMEOUT=10000
DB_QUERY_TIMEOUT=30000
```

### Recomendaciones para Producción

1. **Rate Limiting:**
   - Migrar de memoria a Redis
   - Ajustar límites según carga real
   - Considerar rate limiting por usuario (no solo IP)

2. **Logging:**
   - Integrar con Loki o CloudWatch
   - Configurar retención de logs (30-90 días)
   - Crear dashboards de Grafana

3. **Health Checks:**
   - Agregar más checks si necesario (Redis, S3, etc.)
   - Ajustar thresholds según carga
   - Monitorear tiempos de respuesta

4. **Database:**
   - Tune timeouts según queries reales
   - Monitorear slow query log
   - Aumentar connection pool si necesario

5. **Monitoring:**
   - Configurar alertas en PagerDuty/OpsGenie
   - Crear runbooks para cada alerta
   - Revisar SLOs mensualmente

---

## 🔗 REFERENCIAS

- **Typed Errors:** backend/src/common/errors/typed-errors.ts:1
- **Structured Logger:** backend/src/common/logging/structured-logger.ts:1
- **Error Handler Middleware:** backend/src/common/middleware/error-handler.middleware.ts:1
- **Rate Limiter Middleware:** backend/src/common/middleware/rate-limiter.middleware.ts:1
- **Health Checker:** backend/src/common/health/health-checker.ts:1
- **DB Config:** backend/src/common/database/db-config.ts:1
- **Operations Guide:** docs/OPERATIONS-GUIDE.md:1

---

## 🎉 PRÓXIMOS PASOS

1. **Merge a develop:**
   ```bash
   git checkout develop
   git merge feature/backend-consolidation
   ```

2. **Deploy a staging:**
   - Actualizar variables de entorno
   - Configurar health checks en K8s
   - Verificar logs en Loki

3. **Monitorear:**
   - Error rates
   - Latency metrics
   - Health check success rate
   - Rate limit hit rate

4. **Iterar:**
   - Ajustar timeouts según datos reales
   - Ajustar rate limits según carga
   - Agregar más checks si necesario

---

**Fin del Documento**
**Versión:** 1.0.0
**Última actualización:** 2025-01-15
