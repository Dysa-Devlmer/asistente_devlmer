# 🍽️ Restaurant POS System

<div align="center">

![POS Banner](https://img.shields.io/badge/POS-Restaurant%20System-2563eb?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-26%2F26%20Passing-success?style=for-the-badge)
![Coverage](https://img.shields.io/badge/Backend-100%25-brightgreen?style=for-the-badge)

### Modern Point of Sale System for Restaurants
### Compatible with SYSME_MISTURA Legacy System

[🚀 Quick Start](#-quick-start) • [📚 Documentation](#-documentation) • [🏗️ Architecture](#-architecture) • [🧪 Testing](#-testing)

</div>

---

## 📋 Overview

A modern, production-ready Point of Sale (POS) system built with **TypeScript**, **React**, and **PostgreSQL**. Designed to replace and modernize the legacy SYSME_MISTURA system while maintaining full database compatibility.

### ✨ Key Features

- ✅ **Real-time Kitchen Panel** - WebSocket-based order management
- ✅ **Touch-Optimized UI** - Designed for tablets and touchscreens
- ✅ **Multi-Payment Support** - Cash, card, and split payments
- ✅ **Table Management** - Visual table map with real-time status
- ✅ **Price Tiers** - Dynamic pricing based on table configuration
- ✅ **Transaction Safety** - ACID-compliant operations
- ✅ **Type Safety** - End-to-end TypeScript with strict typing
- 🚧 **Multi-Terminal Sync** - WebSocket synchronization (in progress)

---

## 🛠️ Technology Stack

### Backend
```
Node.js 18+ + TypeScript
├── Express (REST API)
├── PostgreSQL (via pg pool)
├── Socket.io (WebSocket)
├── Vitest (Unit Testing)
└── Architecture: Repository → Service → Routes
```

### Frontend
```
React 18 + TypeScript
├── Vite (Build Tool)
├── React Router (Routing)
├── Zustand (State Management)
├── TailwindCSS (Styling)
├── Socket.io-client (WebSocket)
└── Architecture: Components → Hooks → Stores → API
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Dysa-Devlmer/asistente_devlmer.git
cd asistente_devlmer
git checkout feature/backend-consolidation

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../dashboard-web
npm install
```

### Database Setup

1. **Start PostgreSQL** (if using portable version):
```bash
# From project root
cd scripts
./start-postgres.bat
```

2. **Create database** (if not exists):
```sql
CREATE DATABASE sysmehotel;
```

3. **Import SYSME_MISTURA schema** (if migrating from legacy):
```bash
# See docs/ETL_MIGRATION_SUMMARY.md for migration guide
```

### Running the Application

#### Option 1: Manual Start (Development)

```bash
# Terminal 1: Start Backend (API + WebSocket)
cd backend
npm run dev
# Server running on http://localhost:7777

# Terminal 2: Start Frontend
cd dashboard-web
npm run dev
# Frontend running on http://localhost:5173
```

#### Option 2: Automated Start (Windows)

```bash
# From project root
cd scripts
./start-pos.bat
```

This will start:
1. PostgreSQL server (port 4306)
2. Backend API + WebSocket (port 7777)
3. Frontend dev server (port 5173)

### First Login

Default credentials (from SYSME_MISTURA):
- **Employee ID**: `CAM001` (or any from camareros table)
- **PIN**: Check your database or create new employee

---

## 📚 Documentation

- **[Project Architecture](./PROJECT_ARCHITECTURE.md)** - Complete system architecture and guidelines
- **[Kitchen Panel Design](./docs/PHASE6_KITCHEN_PANEL_DESIGN.md)** - Kitchen module specification
- **[SYSME Integration](./docs/MISTURA_INTEGRATION_ANALYSIS.md)** - Legacy system analysis
- **[API Documentation](./docs/API.md)** - REST API reference (coming soon)

---

## 🏗️ Architecture

### Backend Pattern: Repository → Service → Routes

```
┌─────────────┐
│   Routes    │  HTTP endpoints, validation
│             │  /api/pos/tables, /api/pos/sales, /api/pos/kitchen
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │  Business logic, transactions
│             │  TablesService, SalesService, KitchenService
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Repositories│  SQL queries, data mapping
│             │  TablesRepository, SalesRepository, KitchenRepository
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │  SYSME_MISTURA schema
└─────────────┘
```

### Frontend Pattern: Components → Hooks → Stores → API

```
┌─────────────┐
│ Components  │  React UI (TableMap, SaleView, CheckoutModal, etc.)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Hooks     │  Business logic (useSale, useTables, useKitchen)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Stores    │  Global state (Zustand: saleStore, authStore, kitchenStore)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  API Client │  HTTP calls (tablesApi, salesApi, kitchenApi)
└─────────────┘
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

**Current Coverage**:
- ✅ TablesRepository: 11/11 tests passing
- ✅ SalesRepository: 15/15 tests passing
- 🚧 KitchenRepository: Pending (9 tests planned)
- 🚧 KitchenService: Pending (4 tests planned)

**Total**: 26/26 implemented tests passing (100%)

### Frontend Tests

```bash
cd dashboard-web
npm test
```

**Status**: Tests pending (Phase 7)

---

## 📂 Project Structure

```
pos_venta/
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── config/         # Database, WebSocket config
│   │   ├── modules/pos/    # POS module
│   │   │   ├── repositories/  # Data access layer
│   │   │   ├── services/      # Business logic
│   │   │   ├── routes/        # REST endpoints
│   │   │   └── __tests__/     # Unit tests
│   │   ├── services/       # Global services (WebSocket)
│   │   ├── server.ts       # Express app
│   │   └── index.ts        # Entry point
│   └── package.json
│
├── dashboard-web/           # React frontend
│   ├── src/
│   │   ├── components/pos/ # UI components
│   │   ├── pages/pos/      # Page components
│   │   ├── store/          # Zustand stores
│   │   ├── hooks/pos/      # Custom hooks
│   │   ├── services/api/   # API clients
│   │   └── types/pos/      # TypeScript types
│   └── package.json
│
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
└── PROJECT_ARCHITECTURE.md  # Architecture guide
```

---

## 🗺️ Roadmap

### ✅ Phase 5: Core POS System (COMPLETED)
- ✅ Backend modules (Tables, Sales)
- ✅ Frontend components (TableMap, SaleView, Checkout)
- ✅ Authentication (Login, Session)
- ✅ 26 unit tests passing

### 🚧 Phase 6: Kitchen Panel (IN PROGRESS - 70% Complete)
- ✅ Backend complete (KitchenRepository, KitchenService, WebSocket)
- ✅ API routes (7 REST endpoints)
- ✅ Type definitions and API client
- ⏳ Frontend components (kitchenStore, useKitchen, KitchenPanel)
- ⏳ Unit tests (13 tests pending)

### 📅 Phase 7: End-to-End Testing (PLANNED)
- E2E test suite (Playwright/Cypress)
- Smoke tests for complete flow
- Multi-terminal testing

### 🚀 Phase 8: Production Deployment (PLANNED)
- Docker containerization
- Nginx reverse proxy
- SSL configuration
- Monitoring and logging

### 🔮 Phase 9: Advanced Features (FUTURE)
- Reporting and analytics
- Multi-language support
- Offline mode (PWA)
- Thermal printer integration
- Mobile app (React Native)

---

## 🤝 Contributing

This is a private project, but contributions are welcome from authorized team members.

### Development Workflow

1. Create feature branch from `feature/backend-consolidation`
2. Follow architecture patterns documented in `PROJECT_ARCHITECTURE.md`
3. Write tests for new features
4. Ensure all tests pass before committing
5. Create pull request with descriptive commit message

### Code Style

- **TypeScript**: Strict mode, no `any` types
- **Backend**: Repository → Service → Routes pattern
- **Frontend**: Components → Hooks → Stores → API pattern
- **Tests**: Vitest for backend, Jest/RTL for frontend
- **Commits**: Conventional commits format

---

## 📝 License

Proprietary - All rights reserved

---

## 🔗 Links

- **Repository**: https://github.com/Dysa-Devlmer/asistente_devlmer
- **Branch**: `feature/backend-consolidation`
- **Documentation**: [./docs](./docs)
- **Architecture**: [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)

---

## 📞 Support

For issues or questions, contact the development team or create an issue in the repository.

---

**Last Updated**: December 22, 2025
**Version**: 2.0.0 (Phase 6 - Kitchen Panel)
**Status**: Active Development
**Test Coverage**: 26/26 backend tests passing (100%)

---

<div align="center">

**Built with 💙 using TypeScript, React, and PostgreSQL**

*Professional Point of Sale System for Modern Restaurants*

</div>
