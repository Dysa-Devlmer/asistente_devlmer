# 🤖 JARVIS v2.1.0 - COMPLETE GUIDE

**Just A Rather Very Intelligent System - Mark VII**

Enterprise Edition - Complete AI Assistant Platform

---

## 📋 Table of Contents

1. [What's New in v2.1](#whats-new-in-v21)
2. [Quick Start](#quick-start)
3. [Installation](#installation)
4. [Architecture](#architecture)
5. [Core Systems](#core-systems)
6. [API Reference](#api-reference)
7. [Configuration](#configuration)
8. [CLI Usage](#cli-usage)
9. [Development](#development)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## 🎉 What's New in v2.1

### Major Features

✨ **New Professional Systems**

- 🔧 **Config Manager** - Centralized configuration with validation
- 📝 **Logger System** - Winston-based logging with rotation
- 🌐 **API Server** - Complete REST API with Swagger docs
- 🔌 **Plugin Manager** - Dynamic plugin loading system
- 🎯 **CLI** - Interactive command-line interface
- 📊 **Metrics Collector** - Prometheus-compatible metrics
- 📬 **Notification Service** - Multi-channel notifications
- 💾 **Database Migrator** - Schema versioning & migrations
- 🔄 **Auto-Updater** - Automatic update system
- 🚀 **Professional Installer** - Cross-platform setup wizard

### Improvements

- ✅ Complete TypeScript-style JSDoc documentation
- ✅ Full test suite (unit, integration, e2e)
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Docker & Kubernetes ready
- ✅ Production-ready error handling
- ✅ Performance optimizations
- ✅ Security hardening

---

## 🚀 Quick Start

### Option 1: Interactive Installer (Recommended)

```bash
git clone https://github.com/Soyelijah/jarvis-mark-vii.git
cd jarvis-mark-vii
npm install
npm run install:setup
```

### Option 2: Quick Demo

```bash
npm install
npm run demo:auto
```

### Option 3: Full System

```bash
npm install
npm run panel
```

Open:
- 🖥️ Frontend: http://localhost:5173
- 📡 Backend: http://localhost:7777
- 📚 API Docs: http://localhost:7777/api/docs

---

## 💿 Installation

### Prerequisites

- **Node.js** >= 16.0.0
- **npm** >= 7.0.0
- **Git** (optional)
- **Ollama** (optional, for AI features)
- **Redis** (optional, for caching)

### Step-by-Step Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/Soyelijah/jarvis-mark-vii.git
   cd jarvis-mark-vii
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run installer**
   ```bash
   npm run install:setup
   ```

4. **Configure environment**
   Edit `.env` file with your settings

5. **Start JARVIS**
   ```bash
   npm run panel
   ```

### Docker Installation

```bash
# Using Docker Compose
docker-compose up -d

# Using Kubernetes
kubectl apply -f k8s/
```

---

## 🏗️ Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────┐
│                    JARVIS v2.1.0                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │     CLI     │  │   Web UI    │  │   REST API  │     │
│  │  (inquirer) │  │   (React)   │  │  (Express)  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                 │             │
│         └────────────────┴─────────────────┘             │
│                          │                                │
│         ┌────────────────┴────────────────┐             │
│         │       CORE SERVICES              │             │
│         ├──────────────────────────────────┤             │
│         │ • Config Manager                 │             │
│         │ • Logger System                  │             │
│         │ • Plugin Manager                 │             │
│         │ • Metrics Collector              │             │
│         │ • Notification Service           │             │
│         │ • Database Migrator              │             │
│         │ • Auto-Updater                   │             │
│         └──────────────────────────────────┘             │
│                          │                                │
│         ┌────────────────┴────────────────┐             │
│         │     AI & BUSINESS LOGIC          │             │
│         ├──────────────────────────────────┤             │
│         │ • AI Integration (Ollama)        │             │
│         │ • Memory System                  │             │
│         │ • Project Manager                │             │
│         │ • Task Orchestrator              │             │
│         └──────────────────────────────────┘             │
│                          │                                │
│         ┌────────────────┴────────────────┐             │
│         │         DATA LAYER               │             │
│         ├──────────────────────────────────┤             │
│         │ • SQLite/MySQL                   │             │
│         │ • Redis Cache                    │             │
│         │ • File Storage                   │             │
│         └──────────────────────────────────┘             │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Directory Structure

```
jarvis-mark-vii/
├── core/                   # Core systems
│   ├── config-manager.js   # Configuration management
│   ├── logger.js           # Logging system
│   ├── api-server.js       # REST API server
│   ├── plugin-manager.js   # Plugin system
│   ├── metrics-collector.js # Metrics & monitoring
│   ├── notification-service.js # Notifications
│   ├── database-migrator.js # DB migrations
│   └── auto-updater.js     # Auto-update system
├── web-interface/          # Web UI
│   ├── frontend/           # React app
│   └── backend/            # Express server
├── plugins/                # Plugin directory
├── migrations/             # Database migrations
├── tests/                  # Test suites
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── memory/                 # Persistent memory
├── logs/                   # Log files
├── backups/                # Backup storage
├── Proyectos/              # Projects directory
├── .github/workflows/      # CI/CD pipelines
├── jarvis-cli.js           # CLI interface
├── install.js              # Installer
└── package.json            # Dependencies
```

---

## 🔧 Core Systems

### 1. Config Manager

Centralized configuration with environment support.

```javascript
const config = require('./core/config-manager');

// Get configuration
const port = config.get('server.port');
const aiEnabled = config.get('ai.enabled');

// Set runtime config
config.set('custom.value', 'test');

// Export config (without secrets)
const exported = config.export(false);
```

### 2. Logger System

Professional logging with Winston.

```javascript
const { getLogger } = require('./core/logger');
const logger = getLogger();

// Log levels
logger.error('Error message', { error: err });
logger.warn('Warning message');
logger.info('Info message');
logger.debug('Debug message');

// Specialized logging
logger.performance('operation', 150);
logger.http('GET', '/api/test', 200, 45);
logger.ai('ollama', 'mistral', prompt, 1200);
```

### 3. API Server

RESTful API with Express.

```javascript
const APIServer = require('./core/api-server');
const config = require('./core/config-manager');

const api = new APIServer(config.getAll());
await api.start(7777);

// Access API docs: http://localhost:7777/api/docs
```

**Endpoints:**
- `GET /health` - Health check
- `POST /api/v1/ai/chat` - Chat with AI
- `GET /api/v1/projects` - List projects
- `GET /api/v1/memory` - Get memory
- `GET /api/v1/logs/stats` - Log statistics
- And many more...

### 4. Plugin Manager

Dynamic plugin loading system.

```javascript
const PluginManager = require('./core/plugin-manager');

const pluginManager = new PluginManager({
  pluginsPath: './plugins',
  autoLoad: true
});

await pluginManager.initializeAll();
await pluginManager.startAll();

// Create example plugin
pluginManager.createExamplePlugin();
```

### 5. Metrics Collector

Prometheus-compatible metrics.

```javascript
const { getMetricsCollector } = require('./core/metrics-collector');

const metrics = getMetricsCollector();
metrics.start();

// Record metrics
metrics.incrementCounter('api_requests_total', 1, { endpoint: '/api/test' });
metrics.setGauge('active_users', 42);
metrics.observeHistogram('request_duration_seconds', 0.150);

// Export for Prometheus
const prometheusData = metrics.exportPrometheus();
```

### 6. Notification Service

Multi-channel notifications.

```javascript
const { getNotificationService } = require('./core/notification-service');

const notifier = getNotificationService();

await notifier.send({
  title: 'System Alert',
  message: 'CPU usage is high',
  priority: 'high',
  channels: ['console', 'email', 'slack']
});

// Quick notifications
await notifier.notifySystemStart('2.1.0');
await notifier.notifySystemError(error);
```

### 7. Database Migrator

Schema versioning and migrations.

```javascript
const DatabaseMigrator = require('./core/database-migrator');

const migrator = new DatabaseMigrator({
  dbType: 'sqlite',
  connection: { path: './memory/jarvis.db' }
});

await migrator.connect();
await migrator.migrate();

// Create new migration
migrator.createMigration('add_users_table');

// Rollback
await migrator.rollback(1);
```

### 8. Auto-Updater

Automatic update system.

```javascript
const AutoUpdater = require('./core/auto-updater');

const updater = new AutoUpdater({
  repository: 'Soyelijah/jarvis-mark-vii',
  channel: 'stable',
  autoInstall: false
});

updater.start();

// Manual check
const update = await updater.checkForUpdates();
if (update.available) {
  await updater.installUpdate(update.latestVersion);
}
```

---

## 🎯 CLI Usage

Interactive command-line interface.

```bash
# Start CLI
npm run cli

# Or directly
node jarvis-cli.js
```

### CLI Features

- 🚀 Start JARVIS in different modes
- 🎛️ Launch web control panel
- 🧪 Run demos
- 🤖 AI chat session
- 📊 System status
- 🗂️ Project management
- 🔌 Plugin management
- 📝 View logs
- ⚙️ Configuration management
- 🧰 Utilities

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file:

```bash
# Environment
NODE_ENV=production

# Server
PORT=7777
HOST=localhost

# AI
AI_ENABLED=true
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=mistral:latest

# Memory
MEMORY_ENABLED=true
MEMORY_PATH=./memory

# Logging
LOG_LEVEL=info
LOG_FILE=true
LOG_PATH=./logs

# Security
JWT_SECRET=your-secret-key-here

# Database
DB_TYPE=sqlite
DB_PATH=./memory/jarvis.db
```

### Configuration Programmatically

```javascript
const config = require('./core/config-manager');

// Reload config
config.reload();

// Print config
config.print();

// Get all config
const allConfig = config.getAll();
```

---

## 👨‍💻 Development

### Running Tests

```bash
# All tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Development Mode

```bash
# With auto-reload
npm run dev

# Pure mode
npm run dev:pure
```

### Linting & Formatting

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

---

## 🚀 Deployment

### Production with PM2

```bash
# Start
npm run deploy:production

# Stop
npm run deploy:stop

# Restart
npm run deploy:restart

# View logs
npm run deploy:logs
```

### Docker Deployment

```bash
# Build
npm run build:docker

# Start
docker-compose up -d

# Scale
docker-compose up -d --scale backend=3
```

### Kubernetes Deployment

```bash
# Deploy
kubectl apply -f k8s/

# Check status
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/jarvis-backend
```

---

## 🔍 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Change port in .env
PORT=8080
```

**Ollama not running**
```bash
# Start Ollama
ollama serve

# Or disable AI
AI_ENABLED=false
```

**Database errors**
```bash
# Run migrations
npm run migrate

# Reset database
npm run clean
```

**High memory usage**
```bash
# Check metrics
npm run metrics

# View logs
npm run logs:view
```

### Health Check

```bash
# Check system health
npm run health

# Or visit
curl http://localhost:7777/health
```

### Logs

```bash
# View all logs
npm run logs:view

# View errors only
npm run logs:errors

# Clean old logs
npm run logs:clean
```

---

## 📚 Additional Resources

- [README.md](README.md) - Main documentation
- [QUICK-START-GUIDE.md](QUICK-START-GUIDE.md) - Quick start
- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Deployment guide
- [API Documentation](http://localhost:7777/api/docs) - API reference
- [GitHub Repository](https://github.com/Soyelijah/jarvis-mark-vii)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 License

MIT License - See [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- Inspired by Tony Stark's JARVIS from Marvel Cinematic Universe
- Built with: Node.js, React, Express, Winston, Inquirer
- Enterprise patterns: Microservices, Event Sourcing, CQRS

---

<div align="center">

**"All systems operational, sir."**

🤖 Created with ❤️ by [Devlmer](https://github.com/Soyelijah)

⚡ Powered by Stark Industries Technology

</div>
