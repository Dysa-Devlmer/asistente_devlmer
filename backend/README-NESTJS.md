# 🏗️ SYSME TPV Backend API

Backend NestJS para sistema de punto de venta con soporte offline-first y sincronización robusta.

---

## 📋 Stack Tecnológico

- **Framework:** NestJS 10+
- **Lenguaje:** TypeScript 5+
- **Base de Datos:** PostgreSQL 14+
- **Query Builder:** Knex.js 3+
- **WebSocket:** Socket.io 4+
- **Testing:** Jest 29+

---

## 🏛️ Arquitectura

### Módulos Principales

```
src/
├── modules/
│   ├── sync/              # Sincronización offline (CRÍTICO)
│   ├── bootstrap/         # Descarga inicial dispositivos
│   ├── fiscal/            # Caja y pagos (NO NEGOCIABLE)
│   └── realtime/          # WebSocket eventos tiempo real
│
├── common/
│   ├── database/          # Knex service
│   ├── guards/            # Auth guards
│   ├── interceptors/      # Logging, transformación
│   └── middlewares/       # Request ID, etc.
│
└── config/                # Configuración app
```

### Arquitectura en Capas

Cada módulo sigue el patrón:

```
module/
├── controllers/   # Endpoints HTTP
├── services/      # Lógica de negocio
├── repositories/  # Acceso a datos (Knex)
└── dto/           # Data Transfer Objects (validación)
```

---

## 🚀 Instalación

### 1. Requisitos Previos

- Node.js 18+ (LTS)
- PostgreSQL 14+
- npm o yarn

### 2. Clonar y Configurar

```bash
# Navegar a backend
cd backend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

### 3. Configurar PostgreSQL

```bash
# Crear usuario y base de datos
psql -U postgres

CREATE USER sysme_user WITH PASSWORD 'sysme_password_2025';
CREATE DATABASE sysme_tpv OWNER sysme_user;
GRANT ALL PRIVILEGES ON DATABASE sysme_tpv TO sysme_user;
\q
```

### 4. Ejecutar Migraciones

```bash
# Ejecutar todas las migraciones
npm run migrate:latest

# Insertar datos semilla (opcional)
npm run seed:run
```

### 5. Iniciar Servidor

```bash
# Desarrollo (hot reload)
npm run start:dev

# Producción
npm run build
npm run start:prod
```

El servidor estará disponible en:
- **API REST:** `http://localhost:3000/api`
- **WebSocket:** `ws://localhost:3000`

---

## 📡 Endpoints Principales

### Sincronización (POST /api/sync/events)

```bash
curl -X POST http://localhost:3000/api/sync/events \
  -H "Content-Type: application/json" \
  -d '[
    {
      "event_type": "PAGO_REGISTRADO",
      "entity_type": "pago",
      "entity_id": "uuid-123",
      "idempotency_key": "pago:uuid-123:created",
      "payload": { "monto": 15000, "metodo": "EFECTIVO" },
      "dispositivo_id": "dispositivo-uuid",
      "sucursal_id": "sucursal-uuid",
      "client_timestamp": "2025-01-14T10:30:00Z"
    }
  ]'
```

### Bootstrap - Descarga Inicial (GET /api/bootstrap/:tipo)

```bash
# Descargar sucursal
curl http://localhost:3000/api/bootstrap/sucursal/uuid-sucursal

# Descargar empleados
curl http://localhost:3000/api/bootstrap/empleados?sucursal_id=uuid-sucursal

# Descargar catálogo completo
curl http://localhost:3000/api/bootstrap/catalogo?sucursal_id=uuid-sucursal

# Descargar mesas
curl http://localhost:3000/api/bootstrap/mesas?sucursal_id=uuid-sucursal
```

### Fiscal - Apertura de Caja (POST /api/fiscal/caja/abrir)

```bash
curl -X POST http://localhost:3000/api/fiscal/caja/abrir \
  -H "Content-Type: application/json" \
  -d '{
    "caja_id": "caja-uuid",
    "empleado_id": "empleado-uuid",
    "dispositivo_id": "dispositivo-uuid",
    "monto_inicial": 50000
  }'
```

### Fiscal - Registrar Pago (POST /api/fiscal/pago/registrar)

```bash
curl -X POST http://localhost:3000/api/fiscal/pago/registrar \
  -H "Content-Type: application/json" \
  -d '{
    "pedido_id": "pedido-uuid",
    "sesion_caja_id": "sesion-uuid",
    "empleado_id": "empleado-uuid",
    "metodo": "EFECTIVO",
    "monto": 15000,
    "propina": 1500
  }'
```

---

## 🔄 Sincronización Offline

### Principios

1. **Event Sourcing:** Todas las escrituras generan eventos inmutables
2. **Idempotencia:** `idempotency_key` evita duplicados
3. **Priorización:** Pagos tienen prioridad máxima (1)
4. **Reintentos:** Backoff exponencial automático

### Flujo de Sincronización

```
Dispositivo → POST /sync/events → Backend
                                      ↓
                              Validar idempotency_key
                                      ↓
                              Procesar en transacción
                                      ↓
                              Marcar como PROCESADO
                                      ↓
                              Broadcast WebSocket
```

### Eventos Soportados

| Evento | Entidad | Prioridad |
|--------|---------|-----------|
| `PAGO_REGISTRADO` | pago | 1 (MÁXIMA) |
| `PAGO_ANULADO` | pago | 1 |
| `CAJA_ABIERTA` | sesion_caja | 2 |
| `CAJA_CERRADA` | sesion_caja | 2 |
| `PEDIDO_CREADO` | pedido | 3 |
| `MESA_OCUPADA` | mesa | 4 |
| `PRODUCTO_AGOTADO` | producto | 5 |

---

## 🧪 Testing

### Unit Tests

```bash
# Ejecutar todos los tests
npm test

# Watch mode (desarrollo)
npm run test:watch

# Coverage
npm run test:cov
```

### E2E Tests

```bash
npm run test:e2e
```

### Ejemplo de Test

```typescript
describe('SyncController (e2e)', () => {
  it('POST /sync/events debe procesar pago válido', () => {
    return request(app.getHttpServer())
      .post('/sync/events')
      .send([{
        event_type: 'PAGO_REGISTRADO',
        idempotency_key: 'pago:test-uuid:created',
        // ...
      }])
      .expect(200)
      .expect(res => {
        expect(res.body.processed).toBe(1);
        expect(res.body.errors).toBe(0);
      });
  });
});
```

---

## 🗄️ Migraciones

### Crear Nueva Migración

```bash
npm run migrate:make create_nueva_tabla
```

Editar archivo generado en `database/migrations/`:

```typescript
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('nueva_tabla', (table) => {
    table.uuid('id').primary();
    table.string('nombre').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('nueva_tabla');
}
```

### Aplicar Migraciones

```bash
# Última versión
npm run migrate:latest

# Rollback último batch
npm run migrate:rollback

# Rollback todo
npm run migrate:rollback --all
```

---

## 🔒 Seguridad y Reglas Fiscales

### Reglas INMUTABLES

1. **Pagos sincronizados NO se pueden modificar**
   - Trigger PostgreSQL previene UPDATE/DELETE
   - Correcciones = nuevo registro compensatorio

2. **Toda escritura pasa por eventos**
   - No hay `INSERT`/`UPDATE` directo en transaccionales
   - Todo genera evento en `sync_event`

3. **No DELETE físicos**
   - Soft deletes: `esta_activo = false`
   - Auditoría completa

4. **Validación en capas**
   - DTOs (class-validator)
   - Services (lógica de negocio)
   - Database (constraints, triggers)

---

## 📊 Decisiones Técnicas

### ¿Por qué NestJS y no Express?

| Aspecto | NestJS | Express |
|---------|--------|---------|
| Estructura | ✅ Opinionada | ❌ Libre |
| DI | ✅ Nativa | ❌ Manual |
| WebSocket | ✅ Integrado | ❌ Setup complejo |
| Testing | ✅ Suite completa | ⚠️ Manual |
| Escalabilidad | ✅ Modular | ⚠️ Depende del dev |

**Conclusión:** Para TPV con sync, WebSocket y múltiples módulos → NestJS es superior.

### ¿Por qué Knex y no Prisma?

| Aspecto | Knex | Prisma |
|---------|------|--------|
| Control SQL | ✅ Total | ⚠️ Limitado |
| Migraciones | ✅ Versionadas | ⚠️ Automáticas |
| Queries complejas | ✅ Nativo | ❌ Requiere raw |
| Triggers/Funciones | ✅ Soportado | ⚠️ Workarounds |
| Performance | ✅ Rápido | ⚠️ Overhead ORM |

**Conclusión:** Para fiscalidad, sync complejo y transacciones → Knex es más apropiado.

---

## 🐛 Troubleshooting

### Error: "ECONNREFUSED" al iniciar

**Causa:** PostgreSQL no está corriendo o credenciales incorrectas.

**Solución:**
```bash
# Verificar si PostgreSQL está corriendo
pg_isready

# Iniciar PostgreSQL (Linux/Mac)
sudo service postgresql start

# Windows
net start postgresql-x64-14

# Verificar credenciales en .env
cat .env
```

### Error: "Knex no ha sido inicializado"

**Causa:** KnexService no se instanció correctamente.

**Solución:**
```bash
# Verificar conexión a DB
npm run migrate:latest

# Revisar logs del servidor
npm run start:dev
```

### Error: "Evento duplicado"

**Causa:** Idempotencia funcionando correctamente (no es un error).

**Solución:** El evento ya fue procesado, ignorar. Esto es esperado al reintentar.

---

## 📈 Performance

### Optimizaciones Implementadas

1. **Connection pooling:** Min 2, Max 10 (desarrollo) / Max 20 (producción)
2. **Índices en sync_event:** `(sync_status, sync_priority, created_at)`
3. **Transacciones explícitas:** Evita queries N+1
4. **WebSocket:** No polling, conexión persistente

### Benchmarks Esperados

- **POST /sync/events (10 eventos):** < 200ms
- **GET /bootstrap/catalogo:** < 1s (200 productos)
- **POST /fiscal/pago/registrar:** < 100ms

---

## 📚 Documentación Adicional

- [STACK-BACKEND.md](./STACK-BACKEND.md) - Decisiones técnicas detalladas
- [docs/ESTRATEGIA-SINCRONIZACION.md](../docs/ESTRATEGIA-SINCRONIZACION.md) - Event sourcing e idempotencia
- [docs/MODELO-LOCAL-DISPOSITIVOS.md](../docs/MODELO-LOCAL-DISPOSITIVOS.md) - Arquitectura offline

---

## 🤝 Contribución

### Workflow

1. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Implementar con tests
3. Ejecutar linter: `npm run lint`
4. Ejecutar tests: `npm test`
5. Commit siguiendo convenciones
6. Pull request a `main`

### Convenciones de Código

- **Controllers:** Solo manejan HTTP, delegan a Services
- **Services:** Lógica de negocio, llaman Repositories
- **Repositories:** Acceso a datos con Knex
- **DTOs:** Validación con `class-validator`

---

## 📝 Licencia

Propietario - SYSME © 2025

---

**✅ Backend preparado para desarrollo - Estructura completa y funcional**
