# POS Backend - Sistema Moderno para Restaurante

Backend del nuevo sistema POS diseñado con arquitectura moderna y limpia.

## Stack Técnico

- **Runtime:** Node.js 20 LTS
- **Lenguaje:** TypeScript 5.3+
- **Framework:** Express.js 4.x
- **ORM:** Prisma 5.x
- **Base de Datos:** PostgreSQL 14+
- **Testing:** Vitest

## Requisitos

- Node.js >= 20.0.0
- PostgreSQL >= 14
- npm

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Aplicar migraciones de base de datos
npm run prisma:migrate

# Generar Prisma Client
npm run prisma:generate
```

## Scripts Disponibles

### Desarrollo

```bash
# Ejecutar en modo desarrollo (hot reload)
npm run dev

# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm run test:watch
```

### Prisma

```bash
# Generar Prisma Client
npm run prisma:generate

# Crear y aplicar migración
npm run prisma:migrate

# Abrir Prisma Studio (GUI para explorar datos)
npm run prisma:studio

# Push schema sin crear migración (dev only)
npm run prisma:push
```

### Producción

```bash
# Build del proyecto
npm run build

# Ejecutar en producción
npm start
```

### Code Quality

```bash
# Linting
npm run lint

# Formatear código
npm run format
```

## Estructura del Proyecto

```
backend/
├── prisma/
│   ├── schema.prisma          # Schema de Prisma
│   └── migrations/            # Migraciones SQL
│
├── src/
│   ├── index.ts               # Entry point
│   ├── server.ts              # Express app
│   ├── config/
│   │   ├── database.ts        # Prisma client singleton
│   │   └── env.ts             # Validación de env vars
│   └── routes/
│       └── health.ts          # Health check endpoint
│
├── tests/
│   ├── health.test.ts         # Test de health endpoint
│   └── database.test.ts       # Test de conexión DB
│
├── .env                       # Variables de entorno (git ignored)
├── .env.example               # Template de variables
├── tsconfig.json              # Configuración TypeScript
├── vitest.config.ts           # Configuración Vitest
└── package.json               # Dependencias y scripts
```

## Endpoints Disponibles

### Health Check

```
GET /health
```

Respuesta exitosa:
```json
{
  "status": "ok",
  "timestamp": "2025-12-15T21:00:00.000Z",
  "database": "connected"
}
```

## Variables de Entorno

Ver `.env.example` para la lista completa de variables requeridas.

Variables obligatorias:
- `DATABASE_URL`: Connection string de PostgreSQL

## Fase Actual: Implementación

Estado:
- ✅ Stack técnico definido
- ✅ Esqueleto del backend creado
- 🔄 Prisma schema en desarrollo
- ⏳ Migración de datos pendiente

## Licencia

MIT
