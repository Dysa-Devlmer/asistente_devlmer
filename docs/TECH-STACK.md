# TECH STACK - Stack Técnico del Nuevo Sistema

**Fecha:** 2025-12-15
**Fase:** Implementación del Backend (Fase 3)
**Estado:** Propuesta para aprobación

---

## 🎯 PRINCIPIOS DE SELECCIÓN

1. **Estabilidad sobre novedad** - Tecnologías maduras y probadas
2. **TypeScript everywhere** - Type safety en todo el stack
3. **Developer Experience** - Productividad y mantenibilidad
4. **Ecosistema robusto** - Comunidad activa y librerías disponibles
5. **Performance adecuada** - No sobre-optimizar prematuramente

---

## 🗄️ BASE DE DATOS

### Propuesta: **PostgreSQL 14+**

**Justificación:**

✅ **ACID completo** - Transacciones robustas críticas para POS
✅ **UTF-8 nativo** - Sin problemas de charset (vs legacy latin1)
✅ **Foreign Keys enforcement** - Integridad referencial garantizada
✅ **JSON support** - Para campos flexibles futuros (metadatos, configs)
✅ **Índices avanzados** - BTREE, GIN, partial indexes
✅ **Extensiones útiles:**
  - `pg_trgm` - Búsqueda fuzzy de productos
  - `uuid-ossp` - Si necesitamos UUIDs después
✅ **Ventanas de mantenimiento** - VACUUM, ANALYZE automáticos
✅ **Prisma support** - Soporte completo de primera clase
✅ **Gratuito y open source** - Sin costos de licencia
✅ **Amplia adopción** - Fácil encontrar soporte/developers

**Alternativas consideradas:**

❌ **MySQL/MariaDB**
- Considerado (similar a legacy)
- Rechazado: queremos alejarnos del ecosistema legacy
- FK enforcement históricamente débil (mejoró en 8.0+)

❌ **SQLite**
- Rechazado: No apto para multi-usuario concurrente en producción
- Útil solo para tests

---

## 🚀 RUNTIME

### Propuesta: **Node.js 20 LTS**

**Justificación:**

✅ **LTS (Long Term Support)** - Soporte hasta abril 2026
✅ **Performance V8** - JIT compiler rápido
✅ **Ecosystem maduro** - NPM con millones de paquetes
✅ **TypeScript native** - Excelente integración
✅ **Async I/O** - Ideal para operaciones DB intensivas
✅ **Single-threaded event loop** - Suficiente para POS (no millones de usuarios)
✅ **Cross-platform** - Desarrollo en Windows, deploy en Linux

**Versión específica:** Node.js 20.x (LTS activo)

---

## 📘 LENGUAJE

### Propuesta: **TypeScript 5.3+**

**Justificación:**

✅ **Type safety** - Errores en compile time, no runtime
✅ **IntelliSense** - Autocompletado y refactoring seguros
✅ **Contratos claros** - Interfaces para DTOs, modelos, servicios
✅ **Mantenibilidad** - Código autodocumentado
✅ **Prisma Client** - Tipos generados automáticamente desde schema
✅ **Refactoring seguro** - Cambios con confianza
✅ **Comunidad** - Estándar de facto en backend Node.js moderno

**Configuración strict:** `"strict": true` en tsconfig

---

## 🗃️ ORM

### Propuesta: **Prisma 5.x**

**Justificación:**

✅ **Type-safe queries** - Queries con tipos completos en TypeScript
✅ **Schema-first** - DDL declarativo en `schema.prisma`
✅ **Migrations** - Generación automática de migraciones SQL
✅ **Prisma Client** - Cliente autogenerado con tipos
✅ **Prisma Studio** - GUI para explorar datos (útil en dev)
✅ **Relaciones explícitas** - FK definidas claramente
✅ **Validación de schema** - Detecta errores antes de migrar
✅ **Performance** - Query optimization y connection pooling
✅ **DevEx excelente** - Developer experience superior
✅ **PostgreSQL support** - Primera clase

**Alternativas consideradas:**

❌ **TypeORM**
- Considerado (popular)
- Rechazado: API más verbosa, decorators pesados, menos type-safe

❌ **Sequelize**
- Rechazado: Legacy, basado en callbacks/promises mixtos

❌ **Knex.js**
- Rechazado: Query builder puro, sin types generados

---

## 🏗️ FRAMEWORK BACKEND

### Propuesta: **Express.js 4.x (minimalista)**

**Justificación:**

✅ **Estándar de facto** - Framework más usado en Node.js
✅ **Minimalista** - Solo lo necesario, sin magia
✅ **Middleware ecosystem** - Miles de middlewares disponibles
✅ **Flexible** - No impone estructura rígida
✅ **Documentación extensa** - Años de recursos y ejemplos
✅ **Performance adecuada** - Suficiente para POS local

**Middlewares esenciales:**
- `express.json()` - Body parser JSON
- `cors` - CORS para frontend futuro
- `helmet` - Security headers
- `morgan` - HTTP logging

**Alternativas consideradas:**

❌ **Fastify**
- Considerado (más rápido)
- Rechazado: No necesitamos ese nivel de performance aún
- Puede considerarse después si hay bottlenecks

❌ **NestJS**
- Rechazado: Demasiado opinado, curva de aprendizaje alta
- Overhead innecesario para POS

❌ **Koa**
- Rechazado: Menos ecosistema que Express

---

## 🧪 TESTING

### Propuesta: **Vitest**

**Justificación:**

✅ **Velocidad** - Más rápido que Jest
✅ **ESM nativo** - Soporte moderno de módulos
✅ **Compatible con Jest API** - Migración fácil si ya conoces Jest
✅ **TypeScript out-of-box** - Sin configuración extra
✅ **Watch mode inteligente** - Re-run solo tests afectados

**Scope de testing en Fase 3:**
- Test de conexión DB
- Test de migración inicial
- Test health endpoint

**Librerías adicionales:**
- `@vitest/ui` - UI para ver resultados
- `supertest` - Testing de endpoints HTTP

---

## 📦 GESTIÓN DE DEPENDENCIAS

### Propuesta: **npm (nativo de Node.js)**

**Justificación:**

✅ **Nativo** - Incluido con Node.js
✅ **Lockfile** - `package-lock.json` para reproducibilidad
✅ **Workspaces** - Si después necesitamos monorepo
✅ **Scripts** - Integración con npm scripts

**Alternativas:**
- pnpm: Considerado (más eficiente disco), no crítico ahora
- yarn: No aporta ventajas significativas para este proyecto

---

## 🔧 HERRAMIENTAS DE DESARROLLO

### Code Quality

**ESLint** - Linting
- Config: `@typescript-eslint/recommended`
- Reglas strict para consistencia

**Prettier** - Formatting
- Integración con ESLint
- Formato automático en save

### Build

**tsx** - Ejecutar TypeScript directamente (dev)
**tsc** - Compilar a JavaScript (producción)

### Process Management (Producción futura)

**PM2** - Recomendado para deploy
- Restart automático
- Logs
- Clustering (si necesario después)

---

## 🌐 VARIABLES DE ENTORNO

### Propuesta: **dotenv**

**Justificación:**
✅ Simple y estándar
✅ `.env` files para diferentes entornos

**Archivo `.env.example`:**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pos_db"

# Server
PORT=3000
NODE_ENV=development

# Logs
LOG_LEVEL=info
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
pos-backend/
├── prisma/
│   ├── schema.prisma          # Schema de Prisma (CRÍTICO)
│   └── migrations/            # Migraciones SQL generadas
│
├── src/
│   ├── index.ts               # Entry point
│   ├── server.ts              # Express app
│   ├── config/
│   │   ├── database.ts        # Prisma client singleton
│   │   └── env.ts             # Validación de env vars
│   │
│   ├── routes/
│   │   └── health.ts          # Health check endpoint
│   │
│   └── types/
│       └── global.d.ts        # Tipos globales
│
├── tests/
│   ├── setup.ts               # Setup de tests
│   ├── health.test.ts         # Test de health
│   └── database.test.ts       # Test de conexión DB
│
├── .env.example               # Template de variables
├── .env                       # Variables locales (git ignored)
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── vitest.config.ts
├── package.json
└── README.md
```

---

## 📊 RESUMEN DEL STACK

| Componente | Tecnología | Versión |
|------------|------------|---------|
| **Base de Datos** | PostgreSQL | 14+ |
| **Runtime** | Node.js | 20 LTS |
| **Lenguaje** | TypeScript | 5.3+ |
| **ORM** | Prisma | 5.x |
| **Framework** | Express.js | 4.x |
| **Testing** | Vitest | latest |
| **Linting** | ESLint | latest |
| **Formatting** | Prettier | latest |
| **Env Management** | dotenv | latest |

---

## 🔄 FLUJO DE DESARROLLO

### Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env
cp .env.example .env
# Editar .env con credenciales locales

# 3. Aplicar migraciones
npx prisma migrate dev

# 4. Generar Prisma Client
npx prisma generate

# 5. Ejecutar en modo desarrollo
npm run dev

# 6. Ejecutar tests
npm test
```

### Producción

```bash
# 1. Build
npm run build

# 2. Aplicar migraciones
npx prisma migrate deploy

# 3. Iniciar
npm start
```

---

## 🚫 QUÉ NO INCLUIR (TODAVÍA)

❌ **Frontend framework** (React, Vue, etc) - Fase posterior
❌ **Auth library** (Passport, JWT) - Fase 4
❌ **WebSockets** (Socket.io) - Si es necesario después
❌ **GraphQL** - No necesario, REST es suficiente
❌ **Redis** - No necesario aún
❌ **Docker** - Puede agregarse después
❌ **CI/CD** - Fase de deployment

---

## 📈 ESCALABILIDAD FUTURA

Este stack permite escalar:

✅ **Horizontal:** Load balancer + múltiples instancias Node.js
✅ **Vertical:** PostgreSQL soporta grandes volúmenes
✅ **Funcionalidad:** Agregar módulos sin refactor mayor
✅ **Performance:** Connection pooling, índices, caching (después)

---

## 💾 REQUISITOS DE INFRAESTRUCTURA

### Desarrollo
- Node.js 20 LTS instalado
- PostgreSQL 14+ local o Docker
- 4 GB RAM mínimo
- 1 GB espacio disco

### Producción (estimado para restaurante)
- VPS: 2 vCPU, 4 GB RAM
- Disco: 20 GB SSD
- PostgreSQL: 2 GB RAM dedicado
- Conexiones concurrentes: 20-50 (suficiente)

---

## 📌 DECISIONES TÉCNICAS CLAVE

### ¿Por qué PostgreSQL y no MySQL?

| Aspecto | PostgreSQL | MySQL |
|---------|------------|-------|
| Charset UTF-8 | ✅ Nativo desde siempre | ⚠️ utf8mb4 desde 5.5 |
| FK enforcement | ✅ Siempre estricto | ⚠️ Depende de engine |
| JSON | ✅ JSONB performante | ⚠️ JSON básico |
| Extensiones | ✅ Muchas útiles | ❌ Limitadas |
| Tipos avanzados | ✅ Arrays, enums nativos | ❌ Limitados |
| Comunidad | ✅ Activa | ✅ Activa |

**Veredicto:** PostgreSQL es mejor opción técnica para greenfield.

### ¿Por qué Prisma y no TypeORM?

| Aspecto | Prisma | TypeORM |
|---------|--------|---------|
| Type safety | ✅ 100% generado | ⚠️ Decorators manuales |
| DevEx | ✅ Excelente | ⚠️ Bueno |
| Schema definition | ✅ Declarativo | ⚠️ Imperativo |
| Migrations | ✅ Auto-generadas | ⚠️ Manuales |
| Learning curve | ✅ Suave | ⚠️ Empinada |

**Veredicto:** Prisma ofrece mejor DX y type safety.

---

## ✅ CRITERIOS DE APROBACIÓN DEL STACK

Este stack es aprobable si:

1. ✅ Todas las tecnologías son LTS o estables
2. ✅ Soportan el modelo de datos completo (NEW-DATA-MODEL.md)
3. ✅ Permiten implementar la estrategia de migración
4. ✅ No introducen complejidad innecesaria
5. ✅ Documentación y comunidad activas

---

## 📝 SIGUIENTE PASO

Una vez aprobado este stack:

**Paso 2:** Crear esqueleto del backend
- Inicializar proyecto Node.js + TypeScript
- Configurar Prisma
- Implementar health check
- Levantar servidor Express

---

**FIN DE TECH-STACK**

Estado: ✅ PROPUESTA COMPLETA
Tecnologías: PostgreSQL + Node.js + TypeScript + Prisma + Express
Siguiente: Esperar aprobación para continuar con Paso 2
