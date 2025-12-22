# JARVIS v2.0 - Complete System Guide
## Enterprise-Grade Autonomous AI Assistant

<div align="center">

![JARVIS v2.0](https://img.shields.io/badge/JARVIS-v2.0.0-blue?style=for-the-badge&logo=robot)
![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)

### 🚀 El Sistema de IA Autónomo Más Completo

**12 Sistemas Principales** • **28 Componentes Frontend** • **16 Módulos Core** • **Enterprise-Grade**

[Comenzar](#-quick-start) • [Características](#-características-completas) • [Arquitectura](#-arquitectura) • [API](#-api-reference)

</div>

---

## 📖 Tabla de Contenidos

1. [Introducción](#-introducción)
2. [Quick Start](#-quick-start)
3. [Características Completas](#-características-completas)
4. [Arquitectura](#-arquitectura)
5. [Instalación Detallada](#-instalación-detallada)
6. [Configuración](#️-configuración)
7. [Uso Avanzado](#-uso-avanzado)
8. [API Reference](#-api-reference)
9. [Seguridad](#-seguridad)
10. [Performance](#-performance)
11. [Testing](#-testing)
12. [Troubleshooting](#-troubleshooting)
13. [Contribuir](#-contribuir)

---

## 🎯 Introducción

JARVIS v2.0 es un **sistema de asistente AI autónomo de nivel enterprise** que revoluciona la forma en que interactuamos con la automatización y la inteligencia artificial. Construido desde cero con arquitectura modular y escalable, JARVIS v2.0 ofrece:

### ¿Qué es JARVIS v2.0?

- ✅ **Sistema Autónomo Completo** - Ejecuta tareas complejas sin intervención humana
- ✅ **12 Sistemas Integrados** - Desde búsqueda de código hasta disaster recovery
- ✅ **Enterprise-Ready** - Seguridad, testing, monitoring, y backup incluidos
- ✅ **Production-Grade** - Listo para desplegar en producción
- ✅ **100% Open Source** - Código completamente abierto y extensible

### ¿Para Quién es JARVIS v2.0?

- 👨‍💻 **Desarrolladores** - Automatiza tareas repetitivas y optimiza workflow
- 🏢 **Empresas** - Sistema enterprise con seguridad y compliance
- 🔬 **Investigadores** - Plataforma extensible para experimentar con IA
- 🎓 **Estudiantes** - Aprende arquitectura de sistemas complejos

---

## ⚡ Quick Start

### Inicio Rápido (5 minutos)

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd jarvis-standalone

# 2. Instalar dependencias
npm install

# 3. Instalar frontend
cd web-interface/frontend && npm install && npm run build && cd ../..

# 4. Iniciar JARVIS
node start-ultimate.js
```

### Acceder al Sistema

```
URL: http://localhost:3000
Usuario: admin
Contraseña: jarvis2024
```

⚠️ **IMPORTANTE**: Cambiar contraseña en primer login desde la pestaña "Seguridad".

---

## 🌟 Características Completas

### Sistema 1: 🤖 Autonomous Agent System
**Ejecución autónoma de tareas complejas con IA**

- **Gestión de Agentes**: Múltiples agentes trabajando simultáneamente
- **Execution Engine**: Motor de ejecución con error handling
- **Task Planner**: Planificación inteligente de subtareas
- **Self-Verification**: Auto-validación de resultados
- **Strategies**: Balanced, Speed, Quality modes

**Casos de Uso:**
- Refactoring automático de código
- Generación de tests
- Análisis de vulnerabilidades
- Code review automatizado

---

### Sistema 2: 🔍 Intelligent Code Search
**Búsqueda semántica AI-powered en codebase**

- **Semantic Search**: Búsqueda por significado, no solo keywords
- **Multi-language**: Soporte para todos los lenguajes
- **Indexación Automática**: Indexa todo el proyecto automáticamente
- **Relevance Ranking**: Resultados ordenados por relevancia AI
- **Context-Aware**: Entiende el contexto del código

**Casos de Uso:**
- Encontrar implementaciones similares
- Buscar ejemplos de uso de APIs
- Localizar bugs patterns
- Code discovery

---

### Sistema 3: 📚 Automatic Documentation Generator
**Generación automática de documentación técnica con IA**

- **Code Analysis**: Análisis profundo de código
- **Auto-Generation**: Genera docs sin intervención
- **Markdown Output**: Docs en formato estándar
- **API Documentation**: Docs de APIs automáticas
- **Usage Examples**: Genera ejemplos de uso

**Casos de Uso:**
- Documentar proyectos legacy
- Generar README automáticos
- Crear API references
- Documentación de librerías

---

### Sistema 4: 🔔 Push Notifications System
**Sistema de notificaciones en tiempo real multi-canal**

- **Real-time Alerts**: Notificaciones instantáneas
- **Multi-Channel**: Email, WebSocket, Push
- **Priority System**: Critical, High, Medium, Low
- **Notification Center**: Centro centralizado
- **History**: Historial completo con filtros

**Casos de Uso:**
- Alertas de errores críticos
- Notificaciones de tareas completadas
- Alertas de seguridad
- Status updates

---

### Sistema 5: 🎤 Voice Control System
**Control por voz con NLP avanzado**

- **Speech Recognition**: Reconocimiento de voz
- **Natural Language**: Procesamiento de lenguaje natural
- **Voice Commands**: Comandos por voz
- **Text-to-Speech**: Síntesis de voz
- **Multilingual**: Soporte multi-idioma

**Casos de Uso:**
- Hands-free operation
- Accesibilidad
- Comandos rápidos
- Interacción natural

---

### Sistema 6: ⏰ Task Scheduler & Workflows
**Sistema completo de automatización y workflows**

- **Cron Scheduler**: Tareas programadas con sintaxis cron
- **Workflow Engine**: Workflows multi-step
- **Templates**: 4 templates predefinidos + custom
- **Execution History**: Historial completo
- **Error Handling**: Retry logic y error recovery

**Casos de Uso:**
- Backups automáticos
- Reports periódicos
- Data synchronization
- Maintenance tasks

---

### Sistema 7: 📝 Logging & System Monitoring
**Logging estructurado y monitoreo en tiempo real**

- **Winston Logging**: Logs estructurados
- **Log Rotation**: Rotación automática daily
- **System Monitoring**: CPU, RAM, Disk tracking
- **Real-time Metrics**: Métricas en tiempo real
- **Alert System**: Alertas por umbrales

**Casos de Uso:**
- Debugging
- Performance analysis
- Compliance auditing
- System health monitoring

---

### Sistema 8: ⚙️ Centralized Settings Manager
**Configuración centralizada con validación**

- **Schema Validation**: Validación de configuración
- **Hot Reload**: Cambios sin reiniciar
- **Profiles**: Development, Production, Test
- **Backup**: Backup automático de settings
- **Export/Import**: Exportar configuración

**Casos de Uso:**
- Configuration management
- Environment switching
- Settings migration
- Configuration backup

---

### Sistema 9: 💾 Backup & Disaster Recovery
**Sistema completo de backup y recuperación**

- **Automated Backups**: Backups automáticos programados
- **ZIP Compression**: Compresión eficiente
- **Checksum Verification**: SHA256 checksums
- **Selective Restore**: Restauración selectiva
- **Retention Policy**: Limpieza automática (10 backups)

**Casos de Uso:**
- Disaster recovery
- Data migration
- Point-in-time restore
- Pre-deployment backup

---

### Sistema 10: 🧪 Automated Testing & QA
**Framework completo de testing con coverage**

- **Jest Integration**: Framework Jest
- **Auto-Discovery**: Encuentra tests automáticamente
- **Coverage Reports**: HTML, LCOV, JSON reports
- **Quality Gates**: Coverage > 70%, 0 fallos
- **CI/CD Ready**: JUnit XML reports

**Casos de Uso:**
- Continuous testing
- Quality assurance
- Regression testing
- Coverage tracking

---

### Sistema 11: 🔐 Security & Authentication
**Sistema de seguridad enterprise-grade**

- **JWT Authentication**: Tokens seguros (24h access + 7d refresh)
- **RBAC**: 4 roles (Admin, Developer, Viewer, Guest)
- **Password Hashing**: Bcrypt 10 rounds
- **Session Management**: Timeout configurable
- **Audit Logging**: Todas las operaciones críticas
- **Account Lockout**: 5 intentos → 15 min bloqueado

**Casos de Uso:**
- Multi-user systems
- Access control
- Compliance (SOC2, ISO27001)
- Security auditing

---

### Sistema 12: ⚡ Performance Monitoring & Optimization
**Monitoreo de rendimiento con optimización automática**

- **Operation Tracking**: Response time de cada op
- **Slow Detection**: Ops > 1s detectadas
- **Critical Detection**: Ops > 5s alertadas
- **Memory Monitoring**: Heap, RSS tracking
- **Cache System**: In-memory cache (100 entradas, 5 min TTL)
- **Auto-Optimization**: Cache clear + GC automático

**Casos de Uso:**
- Performance tuning
- Bottleneck detection
- Resource optimization
- SLA monitoring

---

## 🏗️ Arquitectura

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    JARVIS v2.0 Architecture                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Frontend (React 18)                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐           │   │
│  │  │Dashboard │ │Components│ │Socket.io  │           │   │
│  │  │          │ │  (28)    │ │Client     │           │   │
│  │  └──────────┘ └──────────┘ └───────────┘           │   │
│  └─────────────────────────────────────────────────────┘   │
│                         ↕ HTTP/WebSocket                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        Backend (Node.js + Express + Socket.io)      │   │
│  │  ┌──────────────┐  ┌───────────────────────────┐   │   │
│  │  │Express Server│  │Socket.io Server           │   │   │
│  │  │REST API      │  │Real-time Communication    │   │   │
│  │  └──────────────┘  └───────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │     Integration Layer (12 integrations)     │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                         ↕ Module API                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Core Systems (16 modules)               │   │
│  │  ┌────────────┬────────────┬────────────┐           │   │
│  │  │Autonomous  │Code Search │Docs Gen    │           │   │
│  │  ├────────────┼────────────┼────────────┤           │   │
│  │  │Scheduler   │Logging     │Settings    │           │   │
│  │  ├────────────┼────────────┼────────────┤           │   │
│  │  │Backup      │Testing     │Auth        │           │   │
│  │  ├────────────┼────────────┼────────────┤           │   │
│  │  │Performance │Voice       │Notifications│          │   │
│  │  └────────────┴────────────┴────────────┘           │   │
│  └─────────────────────────────────────────────────────┘   │
│                         ↕ Data Layer                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Storage & Persistence                   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │SQLite DB │ │File System│ │Memory   │            │   │
│  │  │(Memory)  │ │(Logs,Cfg) │ │(Cache)  │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Stack Tecnológico

**Backend:**
```
Node.js 18+ ────┐
Express.js      ├──► HTTP Server
Socket.io       ├──► WebSocket Server
better-sqlite3  ├──► Database
Winston         ├──► Logging
JWT + bcrypt    ├──► Security
Jest + c8       └──► Testing
```

**Frontend:**
```
React 18 ───────┐
Vite           ├──► Build Tool
TailwindCSS    ├──► Styling
Socket.io      └──► Real-time
```

### Patrones de Diseño

- **Microservices**: Módulos independientes y desacoplados
- **Event-Driven**: EventEmitter para comunicación asíncrona
- **Three-Tier**: Frontend, Backend, Data layers
- **Observer**: Eventos para notificaciones
- **Strategy**: Múltiples estrategias de ejecución
- **Factory**: Creación de agentes y tasks
- **Singleton**: Managers globales

---

## 📦 Instalación Detallada

### Requisitos del Sistema

**Obligatorios:**
- Node.js >= 18.0.0
- npm >= 8.0.0
- 2 GB RAM mínimo (4 GB recomendado)
- 1 GB espacio en disco
- Sistema Operativo: Windows 10+, Ubuntu 20.04+, macOS 11+

**Opcionales:**
- Git para clonar repositorio
- Visual Studio Code (recomendado)
- Node.js --expose-gc flag para GC manual

### Instalación Paso a Paso

#### 1. Clonar Repositorio

```bash
git clone <repository-url>
cd jarvis-standalone
```

#### 2. Instalar Dependencias Backend

```bash
npm install
```

**Dependencias principales instaladas:**
- express, socket.io, cors
- better-sqlite3, fs-extra
- winston, winston-daily-rotate-file
- jsonwebtoken, bcryptjs
- archiver, extract-zip
- jest, @jest/globals, c8

#### 3. Configurar Frontend

```bash
cd web-interface/frontend
npm install
```

**Dependencias frontend instaladas:**
- react, react-dom
- socket.io-client
- tailwindcss
- vite

#### 4. Compilar Frontend

```bash
npm run build
cd ../..
```

#### 5. Crear Directorios Necesarios

El sistema los crea automáticamente, pero puedes crearlos manualmente:

```bash
mkdir -p config logs backups memory test-reports coverage
```

#### 6. Verificar Instalación

```bash
# Verificar Node.js
node --version  # Debe ser >= 18.0.0

# Verificar npm
npm --version   # Debe ser >= 8.0.0

# Verificar estructura
ls -la core/    # Debe mostrar 16 directorios
```

---

## ⚙️ Configuración

### Archivo de Configuración

JARVIS usa `config/settings.json` (creado automáticamente):

```json
{
  "system": {
    "projectName": "JARVIS",
    "version": "2.0.0",
    "language": "es",
    "timezone": "America/Mexico_City"
  },
  "agent": {
    "maxConcurrentTasks": 3,
    "defaultStrategy": "balanced",
    "maxRetries": 3,
    "timeout": 300000
  },
  "scheduler": {
    "enabled": true,
    "maxTasks": 100
  },
  "logging": {
    "level": "info",
    "enableConsole": true,
    "maxFileSize": "10m",
    "maxFiles": "14d"
  },
  "security": {
    "jwtExpiration": "24h",
    "refreshExpiration": "7d",
    "maxLoginAttempts": 5
  },
  "performance": {
    "cacheEnabled": true,
    "cacheMaxSize": 100,
    "cacheTTL": 300000
  }
}
```

### Variables de Entorno

Crear archivo `.env` (opcional):

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret-key-here
LOG_LEVEL=info
CACHE_ENABLED=true
```

### Perfiles de Configuración

Usar diferentes perfiles:

```bash
# Development
NODE_ENV=development node start-ultimate.js

# Production
NODE_ENV=production node start-ultimate.js

# Testing
NODE_ENV=test npm test
```

---

## 🚀 Uso Avanzado

### Línea de Comandos

```bash
# Iniciar con --expose-gc para GC manual
node --expose-gc start-ultimate.js

# Iniciar en modo debug
NODE_ENV=development DEBUG=* node start-ultimate.js

# Ejecutar tests
npm test

# Ejecutar tests con coverage
npm test -- --coverage

# Ejecutar test específico
npm test -- test-scheduler.cjs
```

### API Programática

#### Usar el Autonomous Agent

```javascript
const AutonomousAgentManager = require('./core/autonomous-agent/autonomous-agent-manager.cjs');

const manager = new AutonomousAgentManager();
await manager.initialize();

const result = await manager.executeTask({
  description: "Refactorizar función getUserData() para usar async/await",
  context: {
    filePath: './src/utils.js',
    functionName: 'getUserData'
  },
  strategy: 'quality'
});

console.log(result);
```

#### Crear Backup Programáticamente

```javascript
const BackupManager = require('./core/backup/backup-manager.cjs');

const bm = new BackupManager();
await bm.initialize();

const backup = await bm.createBackup({
  type: 'full',
  includeMemory: true,
  includeConfig: true,
  description: 'Pre-deployment backup'
});

console.log(`Backup created: ${backup.name}`);
```

#### Generar Documentación

```javascript
const DocGenerator = require('./core/documentation/doc-generator.cjs');

const docGen = new DocGenerator();
await docGen.initialize();

const docs = await docGen.generateDocumentation({
  files: ['./src/app.js', './src/utils.js'],
  outputPath: './docs/generated'
});

console.log(`Docs generated in: ${docs.outputPath}`);
```

---

## 📚 API Reference

### REST API Endpoints

```
GET  /api/health              # Health check
GET  /api/metrics             # System metrics
POST /api/tasks               # Create task
GET  /api/tasks/:id           # Get task status
```

### WebSocket Events

**Cliente → Servidor:**
```javascript
// Autonomous Agent
socket.emit('agent:execute', { description, context, strategy });

// Backup
socket.emit('backup:create', { type, includeMemory, ... });

// Performance
socket.emit('performance:get-metrics');
socket.emit('performance:auto-optimize');

// Settings
socket.emit('settings:get-all');
socket.emit('settings:set', { path, value });

// Tests
socket.emit('test:run-all', { coverage: true });
```

**Servidor → Cliente:**
```javascript
// Agent events
socket.on('agent:task-started', (data) => {});
socket.on('agent:task-progress', (data) => {});
socket.on('agent:task-completed', (data) => {});

// Performance events
socket.on('performance:metrics', (data) => {});
socket.on('performance:slow-operation', (data) => {});

// Notification events
socket.on('notification:push', (data) => {});
```

---

## 🔐 Seguridad

### Roles y Permisos

**Admin:**
- Acceso completo (*)
- Todas las operaciones

**Developer:**
- autonomous:execute
- code:search, code:read
- docs:generate
- tasks:create, tasks:execute
- logs:read
- settings:read, settings:write
- backup:create, backup:restore
- tests:run

**Viewer:**
- code:search, code:read
- docs:read
- tasks:read
- logs:read
- settings:read

**Guest:**
- code:read
- docs:read

### Crear Usuario

```javascript
// Via UI: Tab "Seguridad" → "Crear Usuario"

// Via Socket.io:
socket.emit('auth:create-user', {
  username: 'developer1',
  email: 'dev@company.com',
  password: 'SecurePass123!',
  role: 'developer'
});
```

### Cambiar Contraseña

```javascript
socket.emit('auth:update-user', {
  username: 'admin',
  updates: {
    password: 'NewSecurePass123!'
  }
});
```

### Audit Log

Todas las operaciones de seguridad se registran en `logs/security-audit.log`:

```json
{
  "timestamp": "2025-11-10T20:00:00.000Z",
  "event": "login_success",
  "username": "admin",
  "data": {
    "ip": "127.0.0.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

---

## ⚡ Performance

### Optimización

#### Cache

El sistema usa cache en memoria automáticamente:

```javascript
// Via Performance Monitor
performanceMonitor.cacheSet('user:123', userData, 300000); // 5 min TTL
const data = performanceMonitor.cacheGet('user:123');
```

#### Monitoreo de Operaciones

```javascript
// Trackear operación
const opId = performanceMonitor.startOperation('db-query', {
  name: 'getUserById',
  category: 'database'
});

// ... ejecutar operación ...

performanceMonitor.endOperation(opId, {
  success: true,
  result: user
});
```

#### Auto-Optimización

```bash
# Via UI: Tab "Performance" → "Auto-Optimizar"

# Via Socket.io:
socket.emit('performance:auto-optimize');
```

Ejecuta:
1. Limpieza de cache
2. Garbage collection (si --expose-gc)
3. Guardado de métricas

---

## 🧪 Testing

### Estructura de Tests

```
jarvis-standalone/
├── test-autonomous.cjs
├── test-backup.cjs
├── test-scheduler.cjs
├── test-logging.cjs
└── jest.config.cjs
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Con coverage
npm test -- --coverage

# Test específico
npm test -- test-scheduler.cjs

# Watch mode
npm test -- --watch
```

### Coverage Reports

Después de ejecutar tests con `--coverage`:

```
coverage/
├── index.html          # Reporte HTML
├── lcov.info          # LCOV format
└── coverage-summary.json
```

Abrir `coverage/index.html` en navegador para ver reporte visual.

### Quality Gates

Configurado en `jest.config.cjs`:

```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50
  }
}
```

---

## 🔧 Troubleshooting

### Problema: "Port 3000 already in use"

**Solución:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

O cambiar puerto:
```bash
PORT=3001 node start-ultimate.js
```

### Problema: Frontend no carga

**Solución:**
```bash
cd web-interface/frontend
npm run build
cd ../..
node start-ultimate.js
```

### Problema: "Cannot find module"

**Solución:**
```bash
rm -rf node_modules package-lock.json
npm install
cd web-interface/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problema: Tests fallan

**Solución:**
```bash
# Limpiar cache de Jest
npx jest --clearCache

# Ejecutar tests con más info
npm test -- --verbose
```

### Logs de Debug

Activar logs detallados:

```bash
DEBUG=* node start-ultimate.js
```

---

## 🤝 Contribuir

### Proceso de Contribución

1. **Fork** el proyecto
2. **Crear** feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** cambios (`git commit -m 'Add AmazingFeature'`)
4. **Push** al branch (`git push origin feature/AmazingFeature`)
5. **Abrir** Pull Request

### Guías de Estilo

**JavaScript:**
- CommonJS modules (`.cjs`)
- 2 espacios de indentación
- Semicolons
- JSDoc comments

**React:**
- Functional components
- Hooks
- 2 espacios de indentación

### Testing

Todos los PR deben:
- Incluir tests
- Pasar todos los tests existentes
- Mantener coverage > 50%

---

## 📞 Soporte

### Reportar Bugs

Abrir issue en GitHub con:
1. Descripción del problema
2. Pasos para reproducir
3. Comportamiento esperado
4. Screenshots (si aplica)
5. Logs relevantes

### Feature Requests

Abrir issue con tag `enhancement` incluyendo:
1. Descripción de la feature
2. Casos de uso
3. Mockups (si aplica)

---

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE)

---

## 🙏 Agradecimientos

- **Anthropic** - Claude AI
- **Node.js** Community
- **React** Team
- Open Source Contributors

---

<div align="center">

**JARVIS v2.0** - Made with 🤖 and ❤️

Generated with [Claude Code](https://claude.com/claude-code)

[⬆ Volver arriba](#jarvis-v20---complete-system-guide)

</div>
