# 🏗️ Stack Backend - SYSME TPV

**Versión:** 1.0.0-MVP
**Fecha:** 14 Enero 2025

---

## 🎯 Stack Definitivo

### Core
- **Runtime:** Node.js 18+ (LTS)
- **Lenguaje:** TypeScript 5+
- **Framework:** **NestJS** ✅
- **Base de Datos:** PostgreSQL 14+
- **Query Builder/ORM:** **Knex.js** ✅

---

## ⚖️ Decisiones Técnicas

### 1. Framework: NestJS vs Express

**Decisión: NestJS ✅**

#### Por qué NestJS:

✅ **Arquitectura en capas nativa:**
```
- Controllers (HTTP endpoints)
- Services (lógica de negocio)
- Repositories (acceso a datos)
- Middlewares / Guards / Interceptors
```
Ya viene estructurado, no hay que armarlo manualmente.

✅ **Inyección de dependencias:**
- Facilita testing (mocks)
- Código más testeable y desacoplado
- Mejor para proyectos que escalan

✅ **Decoradores y metadatos:**
```typescript
@Controller('sync')
export class SyncController {
  @Post('events')
  @UseGuards(AuthGuard)
  async receiveEvents(@Body() events: SyncEventDto[]) {
    // ...
  }
}
```
Más legible y mantenible.

✅ **WebSocket integrado:**
- `@nestjs/websockets` + `socket.io`
- No requiere setup adicional
- Crucial para tiempo real (mesas, pedidos)

✅ **Validación automática:**
- `class-validator` + `class-transformer`
- DTOs con validación en runtime
- Menos código boilerplate

✅ **Testing robusto:**
- Suite de testing integrada (Jest)
- Utilities para testing de módulos
- Mejor coverage desde el inicio

#### Por qué NO Express:

❌ Estructura libre (requiere configurar todo manualmente)
❌ Sin inyección de dependencias nativa
❌ WebSocket requiere setup complejo
❌ Validación manual o librerías externas
❌ Testing más verboso

#### Comparación directa:

| Aspecto | NestJS | Express |
|---------|--------|---------|
| Curva aprendizado | Media | Baja |
| Estructura proyecto | ✅ Opinionada | ❌ Libre (puede ser caos) |
| Inyección dependencias | ✅ Nativa | ❌ Manual |
| WebSocket | ✅ Integrado | ❌ Requiere setup |
| TypeScript | ✅ First-class | ⚠️ Posible pero manual |
| Testing | ✅ Suite completa | ⚠️ Manual |
| Escalabilidad | ✅ Excelente | ⚠️ Depende del dev |
| Comunidad | ✅ Grande y activa | ✅ Enorme |

**Conclusión:** Para un TPV con sync offline, WebSocket, y múltiples módulos → **NestJS es superior**.

---

### 2. Query Builder: Knex.js vs Prisma

**Decisión: Knex.js ✅**

#### Por qué Knex.js:

✅ **Migraciones versionadas robustas:**
```bash
knex migrate:make create_pedido_table
knex migrate:latest
knex migrate:rollback
```
Control total sobre el schema SQL.

✅ **Queries complejas fáciles:**
```typescript
// Query con joins, agregaciones, subconsultas
await knex('pedido')
  .select('pedido.*')
  .select(knex.raw('SUM(pago.monto) as total_pagado'))
  .leftJoin('pago', 'pedido.id', 'pago.pedido_id')
  .where('pedido.sucursal_id', sucursalId)
  .groupBy('pedido.id');
```

✅ **Raw SQL cuando se necesita:**
```typescript
await knex.raw(`
  SELECT * FROM pedido
  WHERE sync_status = 'PENDIENTE'
  FOR UPDATE SKIP LOCKED
`);
```
Crítico para manejo de concurrencia.

✅ **Transacciones explícitas:**
```typescript
await knex.transaction(async (trx) => {
  await trx('pago').insert(pago);
  await trx('sync_event').insert(evento);
  await trx('sesion_caja').update({ total_efectivo: ... });
});
```
Necesario para integridad fiscal.

✅ **Menor overhead:**
- No genera cliente pesado
- Queries más rápidas (menos abstracción)
- Control total de performance

✅ **Compatible con schema complejo:**
- Triggers, vistas, funciones PostgreSQL
- No intenta "mapear todo a objetos"

#### Por qué NO Prisma:

❌ Migraciones automáticas (menos control)
❌ Schema en Prisma DSL (no SQL puro)
❌ Queries complejas requieren raw SQL igual
❌ Más pesado (genera cliente grande)
❌ Triggers/funciones requieren workarounds

#### Comparación directa:

| Aspecto | Knex.js | Prisma |
|---------|---------|--------|
| Control migraciones | ✅ Total | ⚠️ Automático (menos control) |
| Queries complejas | ✅ Nativo | ❌ Requiere raw SQL |
| Transacciones | ✅ Explícitas | ✅ Soportadas |
| Raw SQL | ✅ First-class | ⚠️ Escape hatch |
| Performance | ✅ Rápido | ⚠️ Overhead ORM |
| Type safety | ⚠️ Manual | ✅ Generado |
| Curva aprendizaje | ✅ Baja (SQL conocido) | ⚠️ Media (DSL nuevo) |

**Conclusión:** Para un sistema con **fiscalidad, sync complejo, y transacciones críticas** → **Knex.js es más apropiado**.

---

## 📦 Dependencias Principales

```json
{
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/platform-socket.io": "^10.3.0",
    "@nestjs/websockets": "^10.3.0",
    "knex": "^3.1.0",
    "pg": "^8.11.3",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "socket.io": "^4.6.1",
    "dotenv": "^16.4.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/testing": "^10.3.0",
    "@types/node": "^20.11.0",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.2"
  }
}
```

---

## 🏗️ Arquitectura en Capas

```
backend/
├── src/
│   ├── modules/
│   │   ├── sync/
│   │   │   ├── controllers/
│   │   │   │   └── sync.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── sync.service.ts
│   │   │   │   └── idempotency.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── sync-event.repository.ts
│   │   │   ├── dto/
│   │   │   │   └── sync-event.dto.ts
│   │   │   └── sync.module.ts
│   │   │
│   │   ├── bootstrap/
│   │   │   ├── controllers/
│   │   │   │   └── bootstrap.controller.ts
│   │   │   ├── services/
│   │   │   │   └── bootstrap.service.ts
│   │   │   └── bootstrap.module.ts
│   │   │
│   │   ├── fiscal/
│   │   │   ├── controllers/
│   │   │   │   ├── caja.controller.ts
│   │   │   │   └── pago.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── sesion-caja.service.ts
│   │   │   │   └── pago.service.ts
│   │   │   ├── repositories/
│   │   │   │   ├── sesion-caja.repository.ts
│   │   │   │   └── pago.repository.ts
│   │   │   └── fiscal.module.ts
│   │   │
│   │   └── realtime/
│   │       ├── gateways/
│   │       │   └── events.gateway.ts
│   │       └── realtime.module.ts
│   │
│   ├── common/
│   │   ├── database/
│   │   │   ├── knex.module.ts
│   │   │   └── knex.service.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   └── middlewares/
│   │       └── request-id.middleware.ts
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   └── app.config.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── database/
│   ├── migrations/
│   │   └── (archivos de migración)
│   └── seeds/
│       └── (archivos de seed)
│
├── knexfile.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Configuración

### Variables de entorno (.env)

```bash
# Servidor
NODE_ENV=development
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=sysme_user
DB_PASSWORD=sysme_password_2025
DB_NAME=sysme_tpv

# JWT (para autenticación futura)
JWT_SECRET=change-this-in-production

# Logging
LOG_LEVEL=debug

# WebSocket
WS_PORT=3001
WS_CORS_ORIGIN=http://localhost:5173
```

---

## 📊 Ventajas del Stack Elegido

### 1. Desarrollo Rápido
- NestJS CLI genera módulos/controladores automáticamente
- Decoradores reducen boilerplate
- Hot reload en desarrollo

### 2. Mantenibilidad
- Código organizado en módulos
- Inyección de dependencias facilita cambios
- Testing estructurado

### 3. Performance
- Knex.js queries optimizados
- PostgreSQL para concurrencia
- WebSocket nativo (no polling)

### 4. Escalabilidad
- Módulos independientes
- Fácil agregar microservicios después
- PostgreSQL escala bien

### 5. Type Safety
- TypeScript end-to-end
- DTOs validados en runtime
- Menos errores en producción

---

## 🎯 Casos de Uso del Stack

### Caso 1: Recibir evento de sincronización
```
Cliente → POST /api/sync/events
         ↓
    SyncController (@Controller)
         ↓
    SyncService (@Injectable)
         ├─ IdempotencyService.check()
         ├─ SyncEventRepository.insert()
         └─ ProcessEventService.handle()
         ↓
    Knex.transaction()
         ├─ INSERT sync_event
         ├─ INSERT/UPDATE entidad
         └─ COMMIT
         ↓
    EventsGateway (WebSocket)
         └─ Broadcast a otros dispositivos
```

### Caso 2: Apertura de caja
```
Cliente → POST /api/fiscal/caja/abrir
         ↓
    CajaController
         ↓
    SesionCajaService
         ├─ Validar: no hay sesión abierta
         ├─ Crear sesion_caja
         └─ Generar sync_event
         ↓
    Knex.transaction()
         └─ Integridad garantizada
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
describe('IdempotencyService', () => {
  it('debe rechazar evento duplicado', async () => {
    const key = 'pago:uuid-123:created';
    await service.check(key); // Primera vez: OK

    await expect(service.check(key))
      .rejects
      .toThrow('Evento duplicado');
  });
});
```

### Integration Tests
```typescript
describe('SyncController (e2e)', () => {
  it('POST /sync/events debe procesar evento válido', () => {
    return request(app.getHttpServer())
      .post('/sync/events')
      .send([{ event_type: 'PAGO_REGISTRADO', ... }])
      .expect(200)
      .expect(res => {
        expect(res.body.processed).toBe(1);
      });
  });
});
```

---

## 📋 Resumen Ejecutivo

### Stack Final:
- ✅ **NestJS** - Framework estructurado, WebSocket integrado
- ✅ **Knex.js** - Control total de SQL, migraciones robustas
- ✅ **PostgreSQL** - Concurrencia, transacciones, triggers
- ✅ **TypeScript** - Type safety end-to-end

### Por qué esta combinación:
1. **Offline-first:** Knex permite queries complejas de sync
2. **Fiscalidad:** Transacciones explícitas + triggers PostgreSQL
3. **Tiempo real:** WebSocket nativo en NestJS
4. **Escalable:** Arquitectura en módulos + PostgreSQL robusto
5. **Mantenible:** TypeScript + estructura clara

---

**✅ Stack justificado y aprobado para implementación**

