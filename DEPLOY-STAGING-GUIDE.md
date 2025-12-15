# 📘 Guía de Deploy a Staging - Fase 1

**Fecha:** 14 Enero 2025
**Versión:** v0.9.0-fase1
**Status:** READY FOR STAGING DEPLOYMENT

---

## ⚠️ PRE-REQUISITOS

### 1. Verificar que el PR está aprobado
```bash
# Ver estado del PR (cuando esté en repositorio correcto)
gh pr view <PR_NUMBER>
```

### 2. Backup de base de datos **OBLIGATORIO**

**IMPORTANTE: NO ejecutar migraciones sin backup previo**

```bash
cd backend
chmod +x scripts/backup-pre-migration.sh
./scripts/backup-pre-migration.sh
```

Esto creará un archivo: `backups/backup_pre_fase1_<timestamp>.dump`

**Guardar este backup en ubicación segura antes de continuar.**

---

## 📦 PASO 1: Preparación del Entorno Staging

### 1.1 Variables de Entorno

Crear/actualizar `.env` en staging con:

```bash
# Database
DB_HOST=staging-db.example.com
DB_PORT=5432
DB_USER=sysme_user
DB_PASSWORD=<SECURE_PASSWORD>
DB_NAME=sysme_tpv_staging

# App
NODE_ENV=staging
PORT=3000

# Logging
LOG_LEVEL=debug  # Para staging, usar debug
```

### 1.2 Instalar Dependencias

```bash
npm ci  # Usar ci (no install) para reproducibilidad
```

---

## 🗄️ PASO 2: Aplicar Migraciones

### 2.1 Verificar Backup

```bash
# Confirmar que el backup existe
ls -lh backups/backup_pre_fase1_*.dump
```

### 2.2 Ejecutar Migración

```bash
# Si usas Knex directamente
npx knex migrate:latest --env staging

# O si tienes script npm
npm run migrate:latest
```

**Migración aplicada:**
- `20250114054600_add_missing_dependencies_to_sync_event.js`
  - Agrega columna `missing_dependencies` (TEXT NULL)
  - Actualiza constraint `sync_status` para incluir `DEPENDENCIA_PENDIENTE`

### 2.3 Verificar Migración

```bash
# Conectar a PostgreSQL staging
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Verificar columna agregada
\d sync_event

# Debe mostrar:
# missing_dependencies | text | | |

# Verificar constraint actualizado
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'sync_event_sync_status_check';

# Debe incluir: ... 'DEPENDENCIA_PENDIENTE' ...
```

---

## 🚀 PASO 3: Deploy del Servicio

### 3.1 Build Production

```bash
npm run build
```

**Output esperado:**
- Directorio `dist/` creado
- Sin errores de compilación
- Archivos .js y .d.ts generados

### 3.2 Iniciar Servicio

```bash
# Opción A: Directamente
NODE_ENV=staging npm run start:nest

# Opción B: Con PM2 (recomendado)
pm2 start dist/main.js --name sysme-tpv-staging --env staging

# Opción C: Con Docker
docker-compose -f docker-compose.staging.yml up -d
```

### 3.3 Verificar que el Servicio Inició

```bash
# Ver logs
pm2 logs sysme-tpv-staging
# O si es directo:
tail -f logs/app.log

# Buscar:
# ✅ Conexión a PostgreSQL exitosa
# 🚀 Nest application successfully started
```

---

## 🧪 PASO 4: Tests E2E en Staging

### 4.1 Smoke Test Manual

```bash
# Health check
curl http://staging.example.com:3000/health

# Expected: {"status":"ok","timestamp":"..."}
```

### 4.2 Test Básico de Sync

```bash
curl -X POST http://staging.example.com:3000/api/sync/events \
  -H "Content-Type: application/json" \
  -d '[
    {
      "event_type": "MESA_OCUPADA",
      "entity_type": "MESA",
      "entity_id": "mesa-smoke-test-001",
      "idempotency_key": "mesa:mesa-smoke-test-001:ocupada",
      "payload": {
        "numero_mesa": 99,
        "capacidad": 4
      },
      "dispositivo_id": "dispositivo-smoke-test",
      "sucursal_id": "sucursal-smoke-test",
      "client_timestamp": "2025-01-14T12:00:00Z"
    }
  ]'

# Expected:
# {"processed":1,"errors":0,"pending":0,"results":[...]}
```

### 4.3 Test de Dependencias Pendientes

```bash
# Enviar pago SIN pedido previo (debe quedar PENDIENTE)
curl -X POST http://staging.example.com:3000/api/sync/events \
  -H "Content-Type: application/json" \
  -d '[
    {
      "event_type": "PAGO_REGISTRADO",
      "entity_type": "PAGO",
      "entity_id": "pago-test-pending-001",
      "idempotency_key": "pago:pago-test-pending-001:created",
      "payload": {
        "pedido_id": "pedido-inexistente-999",
        "sesion_caja_id": "sesion-inexistente-999",
        "monto": 10000,
        "metodo": "EFECTIVO"
      },
      "dispositivo_id": "dispositivo-smoke-test",
      "sucursal_id": "sucursal-smoke-test",
      "client_timestamp": "2025-01-14T12:01:00Z"
    }
  ]'

# Expected:
# {"processed":0,"errors":0,"pending":1,"results":[{"status":"DEPENDENCIA_PENDIENTE",...}]}
```

### 4.4 Verificar en Base de Datos

```sql
-- Ver eventos con dependencias pendientes
SELECT
  id,
  event_type,
  entity_id,
  sync_status,
  missing_dependencies,
  created_at
FROM sync_event
WHERE sync_status = 'DEPENDENCIA_PENDIENTE'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔥 PASO 5: Pruebas de Concurrencia

### 5.1 Test: Doble Cierre de Caja (Idempotencia)

**Escenario:** Dos dispositivos intentan cerrar la misma caja simultáneamente

```bash
# Terminal 1: Cerrar caja
curl -X POST http://staging.example.com:3000/api/sync/events \
  -H "Content-Type: application/json" \
  -d '[{"event_type":"CAJA_CERRADA","entity_type":"SESION_CAJA","entity_id":"sesion-concurrency-test-001","idempotency_key":"sesion:sesion-concurrency-test-001:cerrada:1","payload":{"monto_real":50000,"monto_esperado":50000},"dispositivo_id":"dispositivo-1","sucursal_id":"sucursal-test","client_timestamp":"2025-01-14T18:00:00Z"}]' &

# Terminal 2: Cerrar MISMA caja (inmediatamente después)
curl -X POST http://staging.example.com:3000/api/sync/events \
  -H "Content-Type: application/json" \
  -d '[{"event_type":"CAJA_CERRADA","entity_type":"SESION_CAJA","entity_id":"sesion-concurrency-test-001","idempotency_key":"sesion:sesion-concurrency-test-001:cerrada:2","payload":{"monto_real":50000,"monto_esperado":50000},"dispositivo_id":"dispositivo-2","sucursal_id":"sucursal-test","client_timestamp":"2025-01-14T18:00:01Z"}]' &
```

**Resultado esperado:**
- Primera solicitud: `processed: 1` (cierra la caja)
- Segunda solicitud: `processed: 1` (idempotente, no genera error)
- En BD: sesión tiene `estado = 'CERRADA'` y UN solo registro

### 5.2 Test: Pago antes de Pedido

**Escenario:** Pago llega antes que el pedido asociado

```bash
# 1. Enviar PAGO primero (pedido aún no existe)
curl -X POST http://staging.example.com:3000/api/sync/events \
  -H "Content-Type: application/json" \
  -d '[{"event_type":"PAGO_REGISTRADO","entity_type":"PAGO","entity_id":"pago-antes-pedido-001","idempotency_key":"pago:pago-antes-pedido-001:created","payload":{"pedido_id":"pedido-antes-999","sesion_caja_id":"sesion-test-001","monto":15000,"metodo":"EFECTIVO"},"dispositivo_id":"dispositivo-1","sucursal_id":"sucursal-test","client_timestamp":"2025-01-14T12:00:00Z"}]'

# Expected: {"pending":1, "results":[{"status":"DEPENDENCIA_PENDIENTE","missing_dependencies":["pedido:pedido-antes-999",...]}]}

# 2. Ahora enviar el PEDIDO
# (En producción, esto dispararía reprocesamiento del pago)
```

---

## 📊 PASO 6: Monitoreo Post-Deploy

### 6.1 Logs a Monitorear

```bash
# Ver logs en tiempo real
pm2 logs sysme-tpv-staging --lines 100

# Buscar:
# ✅ "procesados" - eventos procesados exitosamente
# ⚠️  "DEPENDENCIA_PENDIENTE" - eventos en espera
# ❌ "Error procesando evento" - errores (investigar)
```

### 6.2 Métricas de Base de Datos

```sql
-- Estadísticas de sync_event
SELECT
  sync_status,
  COUNT(*) as total,
  MIN(created_at) as primer_evento,
  MAX(created_at) as ultimo_evento
FROM sync_event
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY sync_status;

-- Debe mostrar:
-- PROCESADO        | <mayoría>
-- DEPENDENCIA_PENDIENTE | <algunos, temporal>
-- ERROR            | 0 (ideal)
```

### 6.3 Alertas a Configurar

1. **Alta tasa de errores:** `ERROR` > 5% de eventos
2. **Dependencias pendientes acumuladas:** `DEPENDENCIA_PENDIENTE` > 100 por 1 hora
3. **Eventos duplicados:** Incremento en `ConflictException`

---

## 🔄 PASO 7: Rollback (Si es necesario)

### 7.1 Revertir Migración

```bash
# Rollback de la migración
npx knex migrate:rollback --env staging

# Esto ejecuta el down() de:
# 20250114054600_add_missing_dependencies_to_sync_event.js
```

### 7.2 Restaurar Backup

```bash
# Restaurar desde el dump
export PGPASSWORD="$DB_PASSWORD"
pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  -c --if-exists \
  backups/backup_pre_fase1_<timestamp>.dump
```

### 7.3 Revertir Deploy de Código

```bash
# Detener servicio
pm2 stop sysme-tpv-staging

# Checkout a versión anterior
git checkout <commit-anterior>

# Rebuild
npm run build

# Restart
pm2 restart sysme-tpv-staging
```

---

## ✅ CHECKLIST DE VALIDACIÓN POST-DEPLOY

- [ ] Backup de BD creado y guardado
- [ ] Migración aplicada exitosamente
- [ ] Servicio iniciado sin errores
- [ ] Health check responde OK
- [ ] Smoke test de sync básico: PASS
- [ ] Test de dependencias pendientes: PASS
- [ ] Test de doble cierre de caja: PASS (idempotente)
- [ ] Test de pago antes de pedido: PASS (DEPENDENCIA_PENDIENTE)
- [ ] Logs no muestran errores críticos
- [ ] Métricas de BD son normales
- [ ] Alertas configuradas
- [ ] Equipo notificado del deploy

---

## 📞 CONTACTO Y ESCALACIÓN

**Si encuentras problemas:**
1. Revisar logs: `pm2 logs sysme-tpv-staging`
2. Revisar BD: queries de monitoreo (sección 6.2)
3. Si es crítico: **ROLLBACK inmediatamente** (sección 7)
4. Notificar al equipo con:
   - Descripción del problema
   - Logs relevantes
   - Queries de BD ejecutadas
   - Acciones tomadas

---

**Última actualización:** 14 Enero 2025
**Autor:** Claude (Sonnet 4.5)
**Version:** v0.9.0-fase1
