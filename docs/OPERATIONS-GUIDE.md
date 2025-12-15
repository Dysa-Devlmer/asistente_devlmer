# GUÍA DE OPERACIONES - POS VENTA API

**Versión:** 1.0.0
**Fecha:** 2025-01-15
**Autor:** Equipo DevOps/Backend

---

## 📋 TABLA DE CONTENIDOS

1. [Health Checks](#health-checks)
2. [Logging](#logging)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Database Timeouts](#database-timeouts)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Runbooks](#runbooks)

---

## 🏥 HEALTH CHECKS

### Endpoints

#### GET /health (Liveness Probe)
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
  timeoutSeconds: 5
  failureThreshold: 3
```

#### GET /ready (Readiness Probe)
**Propósito:** Verificar que puede recibir tráfico

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
      "heap_used_mb": 180,
      "heap_total_mb": 400,
      "heap_usage_percent": 45
    }
  },
  "timestamp": "2025-01-15T14:30:00.000Z",
  "uptime_seconds": 3600
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
    },
    "memory": {
      "status": "degraded",
      "message": "High memory usage: 87%",
      "heap_usage_percent": 87
    }
  }
}
```

**Response 503 Service Unavailable (Unhealthy):**
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
  timeoutSeconds: 3
  failureThreshold: 3
```

---

## 📝 LOGGING

### Formato Estructurado

Todos los logs son JSON estructurados:

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

### Niveles de Log

| Nivel | Descripción | Uso |
|-------|-------------|-----|
| `error` | Errores críticos | Fallos que requieren atención inmediata |
| `warn` | Advertencias | Situaciones anormales pero manejables |
| `info` | Información | Eventos normales del sistema |
| `debug` | Debug | Información detallada para desarrollo |

### Request ID

**Cada request tiene un ID único:**
- Generado automáticamente si no existe
- Extraído de header `X-Request-ID` si viene del cliente
- Incluido en:
  - Response header `x-request-id`
  - Todos los logs relacionados
  - Error responses

**Ejemplo:**
```bash
curl -H "X-Request-ID: my-custom-id" http://localhost:3000/api/bootstrap/catalogo
```

### Queries de Logs (Loki/CloudWatch)

```logql
# Todos los errores
{service="pos-venta-api"} | json | level="error"

# Errores de un request específico
{service="pos-venta-api"} | json | request_id="550e8400-e29b-41d4-a716-446655440000"

# Requests lentos (> 1s)
{service="pos-venta-api"} | json | duration_ms > 1000

# Errores 5xx
{service="pos-venta-api"} | json | status_code >= 500
```

---

## ⚠️ ERROR HANDLING

### Códigos de Error

| Código | Descripción | Status HTTP |
|--------|-------------|-------------|
| `VALIDATION_ERROR` | Error de validación | 400 |
| `INVALID_UUID` | UUID inválido | 400 |
| `INVALID_PAGINATION` | Paginación inválida | 400 |
| `INVALID_TIMESTAMP` | Timestamp inválido | 400 |
| `MISSING_REQUIRED_PARAM` | Parámetro requerido faltante | 400 |
| `RESOURCE_NOT_FOUND` | Recurso no encontrado | 404 |
| `SUCURSAL_NOT_FOUND` | Sucursal no encontrada | 404 |
| `RATE_LIMIT_EXCEEDED` | Rate limit excedido | 429 |
| `DATABASE_ERROR` | Error de base de datos | 500 |
| `DATABASE_TIMEOUT` | Timeout de DB | 500 |
| `DATABASE_CONNECTION_FAILED` | Conexión a DB falló | 500 |
| `INTERNAL_ERROR` | Error interno | 500 |
| `SERVICE_UNAVAILABLE` | Servicio no disponible | 503 |
| `DATABASE_UNAVAILABLE` | Base de datos no disponible | 503 |

### Formato de Error Response

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "code": "INVALID_UUID",
  "message": "sucursal_id debe ser un UUID válido (recibido: invalid-uuid)",
  "metadata": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-01-15T14:30:00.000Z",
    "fieldName": "sucursal_id",
    "value": "invalid-uuid"
  }
}
```

---

## 🚦 RATE LIMITING

### Límites por Endpoint

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| General (todos) | 100 requests | 60 segundos |
| `/api/bootstrap/*` | 30 requests | 60 segundos |
| `/api/bootstrap/delta` | 10 requests | 60 segundos |

### Headers de Rate Limit

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705329060
```

### Error 429

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit excedido: máximo 100 requests por 60s",
  "metadata": {
    "request_id": "...",
    "limit": 100,
    "windowMs": 60000,
    "retry_after": 45
  }
}
```

**Header adicional:**
```http
Retry-After: 45
```

---

## ⏱️ DATABASE TIMEOUTS

### Configuración

```typescript
{
  connectionLimit: 10,       // 10 conexiones concurrentes
  connectTimeout: 10000,     // 10s para establecer conexión
  acquireTimeout: 10000,     // 10s para adquirir del pool
  timeout: 30000,            // 30s timeout para queries
  queueLimit: 0              // Sin límite de queue
}
```

### Timeout Errors

**Error 500 - Database Timeout:**
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

### Recomendaciones

- **Queries lentas:** Añadir índices
- **Queries complejas:** Optimizar con EXPLAIN
- **Timeouts frecuentes:** Aumentar `timeout` o escalar DB

---

## 📊 MONITORING

### Métricas Clave

#### Disponibilidad
- **Uptime:** > 99.9%
- **Health check success rate:** 100%

#### Performance
- **Request latency (p50):** < 100ms
- **Request latency (p95):** < 500ms
- **Request latency (p99):** < 1000ms

#### Errores
- **Error rate (4xx):** < 1%
- **Error rate (5xx):** < 0.1%

#### Database
- **DB query duration (p95):** < 200ms
- **DB connection pool usage:** < 80%
- **DB timeout rate:** < 0.01%

#### Rate Limiting
- **Rate limit hit rate:** < 1%

### Alertas Recomendadas

| Alerta | Condición | Severidad |
|--------|-----------|-----------|
| High Error Rate | 5xx rate > 1% por 5min | Critical |
| Database Down | Readiness check fails por 2min | Critical |
| High Memory | Memory usage > 90% por 5min | Warning |
| Slow Responses | p95 latency > 1s por 5min | Warning |
| DB Timeouts | > 10 timeouts por min | Warning |

---

## 🔧 TROUBLESHOOTING

### Pod crasheando (CrashLoopBackOff)

**Diagnóstico:**
```bash
kubectl describe pod <pod-name> -n staging
kubectl logs <pod-name> -n staging --previous
```

**Causas comunes:**
1. Database no accesible
2. Config incorrecta
3. Out of Memory

**Solución:**
```bash
# Verificar conectividad DB
kubectl exec -it <pod-name> -n staging -- nc -zv <db-host> 5432

# Verificar logs
kubectl logs <pod-name> -n staging | grep -i "error\|fatal"

# Verificar memory limits
kubectl top pod <pod-name> -n staging
```

### Readiness probe failing

**Diagnóstico:**
```bash
kubectl get pods -n staging
# Columna READY: 0/1 indica fallo

# Ver detalles
kubectl describe pod <pod-name> -n staging | grep -A 10 "Readiness"
```

**Causas comunes:**
1. Database unreachable
2. Alto uso de memoria
3. Query lento en health check

**Solución:**
```bash
# Test manual del endpoint
curl http://<pod-ip>:3000/ready

# Verificar DB
mysql -h <db-host> -u root -p -e "SELECT 1"
```

### Rate limit excedido

**Diagnóstico:**
```bash
# Logs de rate limit
{service="pos-venta-api"} | json | message="Rate limit exceeded"
```

**Solución temporal:**
```bash
# Ajustar límites (requiere redeploy)
# Ver backend/src/common/middleware/rate-limiter.middleware.ts
```

### Database timeouts

**Diagnóstico:**
```sql
-- Ver queries lentas
SELECT * FROM mysql.slow_log
ORDER BY query_time DESC
LIMIT 10;

-- Ver queries activas
SHOW FULL PROCESSLIST;
```

**Solución:**
1. Añadir índices
2. Optimizar query
3. Aumentar timeout
4. Escalar DB (más CPU/RAM)

---

## 📖 RUNBOOKS

### Runbook: High 5xx Error Rate

**Trigger:** Error rate 5xx > 1% por 5 minutos

**Pasos:**

1. **Verificar logs:**
   ```bash
   kubectl logs -n staging deployment/pos-venta-api --tail=100 | grep "level.*error"
   ```

2. **Identificar patrón:**
   - ¿Es un endpoint específico?
   - ¿Es error de DB?
   - ¿Es error de memoria?

3. **Acciones según causa:**
   - **DB down:** Verificar RDS/CloudSQL, reiniciar si necesario
   - **OOM:** Aumentar memory limits en deployment
   - **Bug:** Rollback a versión anterior

4. **Mitigar:**
   ```bash
   # Rollback si es crítico
   kubectl rollout undo deployment/pos-venta-api -n staging
   ```

### Runbook: Database Connection Failed

**Trigger:** Health check fails con `DATABASE_CONNECTION_FAILED`

**Pasos:**

1. **Verificar DB está up:**
   ```bash
   aws rds describe-db-instances --db-instance-identifier pos-venta-staging-db
   ```

2. **Verificar security groups:**
   ```bash
   # Pods deben poder conectar al puerto 5432
   kubectl exec -it <pod-name> -n staging -- nc -zv <db-host> 5432
   ```

3. **Verificar credentials:**
   ```bash
   kubectl get secret app-secrets -n staging -o yaml
   ```

4. **Restart pods si necesario:**
   ```bash
   kubectl rollout restart deployment/pos-venta-api -n staging
   ```

---

## 🎯 SLAs / SLOs

### Service Level Objectives

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Availability | 99.9% | Uptime mensual |
| Latency (p95) | < 500ms | Request duration |
| Error Rate | < 0.5% | 5xx/total requests |
| Data Durability | 99.99% | Backups exitosos |

### Service Level Agreements

**Uptime:** 99.9% mensual
- **Downtime permitido:** ~43 minutos/mes
- **Compensación:** Si < 99.9%, crédito del 10%

---

## 📞 CONTACTOS

**Equipo Backend:**
- Slack: #backend-team
- Email: backend@empresa.com

**Equipo DevOps:**
- Slack: #devops-team
- Email: devops@empresa.com

**On-Call:**
- PagerDuty: pos-venta-api schedule

---

**Fin de la Guía**
**Versión:** 1.0.0
**Última actualización:** 2025-01-15
