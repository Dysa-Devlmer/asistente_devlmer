# POS System - Project Architecture & Guidelines

**Project**: Restaurant Point of Sale System
**Repository**: https://github.com/Dysa-Devlmer/asistente_devlmer.git
**Branch**: `feature/backend-consolidation`
**Last Updated**: 22 December 2025

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Pattern](#architecture-pattern)
4. [Project Structure](#project-structure)
5. [Backend Modules](#backend-modules)
6. [Frontend Components](#frontend-components)
7. [Development Guidelines](#development-guidelines)
8. [Maintenance & Cleanup](#maintenance--cleanup)
9. [Roadmap](#roadmap)

---

## 🎯 Project Overview

**Goal**: Build a modern, production-ready Point of Sale (POS) system for restaurants, based on the SYSME_MISTURA legacy system architecture.

**Key Principles**:
- ✅ **Maintain SYSME_MISTURA compatibility** - Use existing PostgreSQL schema
- ✅ **Modern tech stack** - TypeScript, React, WebSocket for real-time updates
- ✅ **Clean architecture** - Repository → Service → Routes pattern
- ✅ **Type safety** - End-to-end TypeScript with strict typing
- ✅ **Test coverage** - Unit tests for all business logic (26/26 passing)
- ✅ **Touch-friendly UI** - Optimized for tablets and touch screens
- ✅ **Real-time sync** - WebSocket for kitchen panel and multi-terminal support

---

## 🛠️ Technology Stack

### Backend (Cimientos)

```
Node.js 18+
├── TypeScript (strict mode)
├── Express (REST API)
├── PostgreSQL (via pg pool)
├── Socket.io (WebSocket server)
├── Vitest (unit testing)
└── dotenv (environment config)
```

**Why this stack?**
- TypeScript: Type safety and better DX
- Express: Industry standard, well-documented
- PostgreSQL: ACID compliance, existing SYSME schema
- Socket.io: Bidirectional real-time communication
- Vitest: Fast, modern testing framework

### Frontend (Estructura)

```
React 18+
├── TypeScript
├── Vite (build tool)
├── React Router (client-side routing)
├── Zustand (state management)
├── TailwindCSS (styling)
└── Socket.io-client (WebSocket)
```

**Why this stack?**
- React 18: Modern hooks, concurrent features
- Vite: Fast HMR, optimized builds
- Zustand: Lightweight state management
- TailwindCSS: Utility-first, rapid UI development
- Socket.io-client: Real-time updates

---

## 🏗️ Architecture Pattern

### Backend: Repository → Service → Routes

```
┌─────────────┐
│   Routes    │  Express routes, request validation
│  (REST API) │  /api/pos/tables, /api/pos/sales, etc.
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │  Business logic, transactions
│             │  TablesService, SalesService, etc.
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Repositories│  Database queries, SQL
│             │  TablesRepository, SalesRepository
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │  SYSME_MISTURA schema
│  Database   │  ventadirecta, ventadir_comg, mesa, etc.
└─────────────┘
```

**Rules**:
1. **Routes** handle HTTP requests/responses only
2. **Services** contain business logic and orchestrate transactions
3. **Repositories** execute SQL queries and map results to types
4. Each layer depends only on the layer below (no circular dependencies)

### Frontend: Components → Hooks → Stores → API

```
┌─────────────┐
│ Components  │  React components (TableMap, SaleView, etc.)
│             │  Pure presentation logic
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Hooks     │  Custom hooks (useSale, useTables, useKitchen)
│             │  Combine stores + API + side effects
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Stores    │  Zustand stores (saleStore, authStore, kitchenStore)
│             │  Global state management
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  API Client │  Fetch functions (tablesApi, salesApi, kitchenApi)
│             │  Type-safe API calls
└─────────────┘
```

**Rules**:
1. **Components** are pure and reusable
2. **Hooks** encapsulate logic and side effects
3. **Stores** hold global state only
4. **API clients** handle HTTP communication

---

## 📂 Project Structure

```
pos_venta/
├── backend/                     # Node.js API server
│   ├── src/
│   │   ├── config/             # Database, env, WebSocket config
│   │   │   ├── postgres.ts     # PostgreSQL pool
│   │   │   ├── env.ts          # Environment variables
│   │   │   └── database.ts     # Prisma client (legacy)
│   │   │
│   │   ├── modules/            # Feature modules
│   │   │   └── pos/            # POS module
│   │   │       ├── repositories/  # Data access layer
│   │   │       │   ├── TablesRepository.ts      (700 lines)
│   │   │       │   ├── SalesRepository.ts       (700 lines)
│   │   │       │   └── KitchenRepository.ts     (360 lines)
│   │   │       │
│   │   │       ├── services/      # Business logic layer
│   │   │       │   ├── TablesService.ts         (300 lines)
│   │   │       │   ├── SalesService.ts          (600 lines)
│   │   │       │   └── KitchenService.ts        (150 lines)
│   │   │       │
│   │   │       ├── routes/        # REST endpoints
│   │   │       │   ├── tables.ts               (200 lines)
│   │   │       │   ├── sales.ts                (300 lines)
│   │   │       │   └── kitchen.ts              (200 lines)
│   │   │       │
│   │   │       ├── __tests__/     # Unit tests
│   │   │       │   ├── TablesRepository.test.ts  (11 tests ✅)
│   │   │       │   └── SalesRepository.test.ts   (15 tests ✅)
│   │   │       │
│   │   │       └── pos.module.ts  # Module exports
│   │   │
│   │   ├── services/           # Global services
│   │   │   └── WebSocketService.ts  (150 lines)
│   │   │
│   │   ├── server.ts           # Express app setup
│   │   └── index.ts            # Entry point
│   │
│   └── package.json
│
├── frontend/                    # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/pos/     # POS components
│   │   │   ├── TableMap/       # Table visualization
│   │   │   │   ├── TableMap.tsx           (150 lines)
│   │   │   │   └── TableButton.tsx        (100 lines)
│   │   │   │
│   │   │   ├── SaleView/       # Sale management
│   │   │   │   ├── SaleView.tsx           (400 lines)
│   │   │   │   ├── CategoryGrid.tsx       (150 lines)
│   │   │   │   ├── ProductGrid.tsx        (350 lines)
│   │   │   │   └── CartPanel.tsx          (300 lines)
│   │   │   │
│   │   │   ├── Checkout/       # Payment processing
│   │   │   │   └── CheckoutModal.tsx      (600 lines)
│   │   │   │
│   │   │   └── KitchenPanel/   # Kitchen display ✅
│   │   │       ├── KitchenPanel.tsx       (230 lines)
│   │   │       ├── KitchenOrderCard.tsx   (190 lines)
│   │   │       └── __tests__/
│   │   │           ├── KitchenPanel.test.tsx      (350 lines)
│   │   │           └── KitchenOrderCard.test.tsx  (450 lines)
│   │   │
│   │   ├── pages/pos/          # Page components
│   │   │   ├── POSLogin.tsx               (300 lines)
│   │   │   └── POSMain.tsx                (400 lines)
│   │   │
│   │   ├── store/              # Zustand stores
│   │   │   ├── authStore.ts               (150 lines)
│   │   │   ├── saleStore.ts               (150 lines)
│   │   │   ├── kitchenStore.ts            (150 lines) ✅
│   │   │   └── __tests__/
│   │   │       └── kitchenStore.test.ts   (650 lines)
│   │   │
│   │   ├── hooks/pos/          # Custom hooks
│   │   │   ├── useSale.ts                 (300 lines)
│   │   │   ├── useTables.ts               (100 lines)
│   │   │   └── useKitchen.ts              (270 lines) ✅
│   │   │
│   │   ├── services/api/       # API clients
│   │   │   ├── tablesApi.ts               (100 lines)
│   │   │   ├── salesApi.ts                (250 lines)
│   │   │   └── kitchenApi.ts              (170 lines)
│   │   │
│   │   ├── types/pos/          # TypeScript types
│   │   │   └── index.ts                   (470 lines)
│   │   │
│   │   ├── App.tsx             # Router setup
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Global styles
│   │
│   ├── index.html
│   └── package.json
│
├── docs/                        # Documentation
│   ├── MISTURA_INTEGRATION_ANALYSIS.md       (1,200 lines)
│   ├── PHASE6_KITCHEN_PANEL_DESIGN.md        (1,500 lines)
│   ├── PHASE6_PROGRESS_REPORT.md             (300 lines)
│   ├── FINAL_COMPLETION_REPORT.md            (1,000+ lines)
│   └── PROJECT_ARCHITECTURE.md               (this file)
│
├── scripts/                     # Utility scripts
│   ├── start-pos.bat           # Start PostgreSQL + Backend + Frontend
│   └── stop-pos.bat            # Stop all services
│
├── archive/                     # Archived/deprecated code
│   ├── _jarvis_platform/       # Old JARVIS assistant (archived)
│   └── _trash/                 # Temporary files to delete
│
└── .gitignore
```

---

## 🔧 Backend Modules

### 1. Tables Module

**Purpose**: Manage restaurant tables (mesas)

**Files**:
- `TablesRepository.ts` - Database queries
- `TablesService.ts` - Business logic
- `routes/tables.ts` - REST API

**Key Operations**:
- `getAllTables()` - Get all tables with status
- `getTableStats()` - Get occupancy statistics
- `getTableRate()` - Get table's pricing tier
- `canOpenSale()` - Check if table can have new sale
- `getTablesBySalon()` - Filter tables by salon/area

**REST Endpoints**:
- `GET /api/pos/tables` - List all tables
- `GET /api/pos/tables/stats` - Get statistics
- `GET /api/pos/tables/:num_mesa` - Get specific table
- `GET /api/pos/tables/:num_mesa/rate` - Get table rate
- `GET /api/pos/tables/:num_mesa/can-open-sale` - Validate sale creation

**Tests**: 11 unit tests ✅

---

### 2. Sales Module

**Purpose**: Manage sales (ventas) and sale lines

**Files**:
- `SalesRepository.ts` - Database queries
- `SalesService.ts` - Business logic with transactions
- `routes/sales.ts` - REST API

**Key Operations**:
- `createSale()` - Create new sale for table
- `addLine()` - Add product to sale
- `updateLine()` - Modify quantity/price
- `deleteLine()` - Remove product
- `changeSaleTable()` - Move sale to different table
- `changeSaleRate()` - Change pricing tier (recalculates all prices)
- `finalizeSale()` - Close sale, record payment, free table
- `parkSale()` - Save sale without closing
- `cancelSale()` - Cancel sale, restore table

**REST Endpoints**:
- `POST /api/pos/sales` - Create sale
- `GET /api/pos/sales/:id` - Get sale details
- `POST /api/pos/sales/:id/lines` - Add line
- `PUT /api/pos/sales/:id/lines/:line` - Update line
- `DELETE /api/pos/sales/:id/lines/:line` - Delete line
- `PATCH /api/pos/sales/:id/table` - Change table
- `PATCH /api/pos/sales/:id/rate` - Change rate
- `POST /api/pos/sales/:id/finalize` - Finalize sale
- `POST /api/pos/sales/:id/park` - Park sale
- `POST /api/pos/sales/:id/cancel` - Cancel sale
- `PATCH /api/pos/sales/:id/lines/:line/served` - Mark line as served

**Tests**: 15 unit tests ✅

---

### 3. Kitchen Panel Module (Phase 6)

**Purpose**: Real-time kitchen order display with WebSocket

**Files**:
- `KitchenRepository.ts` - Database queries
- `KitchenService.ts` - Business logic
- `routes/kitchen.ts` - REST API with WebSocket integration
- `WebSocketService.ts` - Socket.io server

**Key Operations**:
- `getPendingItems()` - Get all pending kitchen items
- `markItemServed()` - Mark item as ready (full or partial)
- `markAllServed()` - Mark all items from order
- `getStats()` - Get kitchen statistics by station
- `initialize()` - Add servido_cocina field if missing

**Kitchen Stations**:
1. Parrilla (Grill)
2. Estación Fría (Cold station)
3. Estación Caliente (Hot station)
4. Barra (Bar)

**REST Endpoints**:
- `GET /api/pos/kitchen/items` - Get pending items
- `POST /api/pos/kitchen/items/:id/:line/mark-served` - Mark served
- `POST /api/pos/kitchen/items/mark-all-served` - Mark all served
- `GET /api/pos/kitchen/stats` - Get statistics
- `GET /api/pos/kitchen/items/order/:id` - Get order items
- `POST /api/pos/kitchen/initialize` - Initialize module
- `GET /api/pos/kitchen/validate` - Validate database

**WebSocket Events** (Server → Client):
- `kitchen:new_items` - New order sent to kitchen
- `kitchen:item_served` - Item marked as served
- `kitchen:order_updated` - Order modified
- `kitchen:order_completed` - All items served

**WebSocket Events** (Client → Server):
- `kitchen:subscribe` - Subscribe to updates
- `kitchen:unsubscribe` - Unsubscribe from updates

**Tests**: Pending (9 repository tests + 4 service tests)

---

## 🎨 Frontend Components

### Authentication

**POSLogin** (`pages/pos/POSLogin.tsx`)
- Employee ID + PIN authentication
- Numeric keypad for touch input
- Auto-redirect if already authenticated
- Stores session in localStorage via authStore

---

### Main Interface

**POSMain** (`pages/pos/POSMain.tsx`)
- Top navigation bar with employee info
- View tabs: Mesas (Tables) | Cocina (Kitchen)
- Dropdown menu: Config, Reports, Logout
- Protected route (requires authentication)
- Internal view routing

---

### Table Management

**TableMap** (`components/pos/TableMap/TableMap.tsx`)
- Visual grid of restaurant tables
- Color-coded status: green (libre), orange (ocupada), blue (reservada)
- Auto-refresh every 10 seconds
- Responsive scaling based on viewport
- Click to open sale or view existing

**TableButton** (`components/pos/TableMap/TableButton.tsx`)
- Individual table button
- Displays table number and status
- Pulsing animation for occupied tables
- Touch-optimized (large tap target)

---

### Sale Management

**SaleView** (`components/pos/SaleView/SaleView.tsx`)
- Main sale interface
- Left panel: Categories + Products
- Right panel: Cart
- Breadcrumb navigation
- Action buttons: Finalizar, Aparcar, Cancelar

**CategoryGrid** (`components/pos/SaleView/CategoryGrid.tsx`)
- Touch-friendly category selector
- Fetches from API
- Responsive 2-5 column layout
- Selected state with ring effect

**ProductGrid** (`components/pos/SaleView/ProductGrid.tsx`)
- Product selection with quantity modal
- Embedded QuantityModal component
- Numeric keypad for quantity input
- Notes and observations input
- Price display with IVA

**CartPanel** (`components/pos/SaleView/CartPanel.tsx`)
- Display sale lines
- LineEditModal for editing quantities
- Visual states: new (green), modified (yellow), served (blue badge)
- Footer with totals: Subtotal, IVA, Total
- Delete line action

---

### Payment

**CheckoutModal** (`components/pos/Checkout/CheckoutModal.tsx`)
- Three payment methods: efectivo, tarjeta, mixto
- Numeric keypad with special keys:
  - C (clear), ← (backspace), . (decimal)
  - Exacto (exact amount button)
- Automatic change calculation
- Split payment support (mixto)
- Total breakdown display

---

### Kitchen Panel (✅ Phase 6 Complete)

**KitchenPanel** (`components/pos/KitchenPanel/KitchenPanel.tsx`)
- **Station Filtering**: 4 kitchen stations + "All Stations" view
  - Parrilla (Grill) - Orange
  - Fríos (Cold Station) - Blue
  - Bebidas (Bar) - Purple
  - Postres (Desserts) - Pink
- **Real-time Updates**: WebSocket integration with Socket.io
- **Connection Status**: Visual indicator (green=connected, red=disconnected)
- **Item Counters**: Badge showing pending count per station
- **Auto-refresh**: Manual refresh button with loading state
- **Error Handling**: Dismissible error alerts
- **Empty States**: Contextual messages for no pending orders
- **Stats Footer**: Total orders, total items, oldest order wait time
- **Responsive Grid**: 1-4 columns depending on screen size

**KitchenOrderCard** (`components/pos/KitchenPanel/KitchenOrderCard.tsx`)
- **Order Header**:
  - Mesa number and order ID
  - Order age in minutes (auto-updating)
  - Order creation time (HH:MM format)
  - "Mark All Served" button
- **Urgency Color Coding**:
  - Green: < 10 minutes
  - Yellow: 10-19 minutes
  - Red: 20+ minutes
- **Items Grouped by Station**:
  - Station name with color indicator
  - Items sorted by station number
- **Item Display**:
  - Quantity (large, bold) + Product name
  - Notes (blue with 📝 icon)
  - Observations (orange with ⚠️ icon)
  - "Mark Served" button per item
- **Loading States**: Spinner and disabled state during mark operations
- **Error Handling**: Console logging with graceful recovery

**useKitchen Hook** (`hooks/pos/useKitchen.ts`)
- **WebSocket Management**:
  - Auto-connection with reconnection logic
  - Subscribe/unsubscribe to station-specific updates
  - Ping/pong keep-alive (25s interval)
- **Event Handlers**:
  - `kitchen:new_items` - Sound notification + data reload
  - `kitchen:item_served` - Update or remove item from list
  - `kitchen:order_updated` - Reload items
  - `kitchen:order_completed` - Reload data
- **API Integration**:
  - `loadItems()` - Fetch pending items
  - `loadStats()` - Fetch kitchen statistics
  - `markServed(id_venta, id_linea, quantity)` - Mark item served
  - `markAllServed(id_venta, station)` - Mark all items served
- **Sound Notifications**: Web Audio API beep on new orders (800Hz sine wave)
- **Auto Stats Refresh**: Every 30 seconds
- **Station Re-subscription**: Auto-resubscribe on station change

**kitchenStore** (`store/kitchenStore.ts`)
- **State**:
  - `items`: Array of KitchenItem
  - `stats`: KitchenStats or null
  - `selectedStation`: number or null
  - `isConnected`: boolean
  - `loading`: boolean
  - `error`: string or null
- **Actions**:
  - `setItems`, `addItem`, `updateItem`, `removeItem`
  - `setStats`, `setSelectedStation`, `setConnected`
  - `setLoading`, `setError`, `clearError`, `reset`
- **Computed Getters**:
  - `getOrderedItems()` - Group items by order, filter by station, sort by time
  - `getItemsByStation(station)` - Filter items by station
  - `getPendingCount()` - Total pending quantity across all items
  - `getStationCount(station)` - Pending quantity for specific station
- **Devtools**: Zustand devtools integration for debugging

**Unit Tests** (✅ All passing)
- `kitchenStore.test.ts` - 15 test suites covering all state operations
- `KitchenPanel.test.tsx` - 12 test suites for component behavior
- `KitchenOrderCard.test.tsx` - 11 test suites for order card functionality
- **Total**: 38 unit tests for kitchen panel system

---

## 📏 Development Guidelines

### Code Style

**TypeScript**:
```typescript
// Use strict typing
interface User {
  id: number;
  name: string;
}

// Prefer interfaces over types for objects
interface Props {
  user: User;
  onSave: (user: User) => void;
}

// Use async/await over promises
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

**React Components**:
```typescript
// Functional components with TypeScript
export const MyComponent: React.FC<Props> = ({ user, onSave }) => {
  // Use hooks
  const [loading, setLoading] = useState(false);

  // Early returns for loading/error states
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

**File Naming**:
- Components: PascalCase (`TableMap.tsx`, `SaleView.tsx`)
- Hooks: camelCase with `use` prefix (`useSale.ts`, `useTables.ts`)
- Stores: camelCase with `Store` suffix (`saleStore.ts`, `authStore.ts`)
- Services: camelCase with `Service` suffix (`TablesService.ts`)
- Repositories: PascalCase with `Repository` suffix (`TablesRepository.ts`)

### Commit Messages

Follow conventional commits:

```
feat: Add kitchen panel WebSocket support
fix: Correct IVA calculation in sales service
docs: Update architecture documentation
test: Add tests for KitchenRepository
refactor: Extract payment logic to service
chore: Update dependencies
```

### Testing

**Backend**:
```typescript
// Use Vitest for unit tests
import { describe, it, expect, beforeEach } from 'vitest';

describe('TablesRepository', () => {
  let repo: TablesRepository;

  beforeEach(() => {
    repo = new TablesRepository();
  });

  it('should find all tables', async () => {
    const tables = await repo.findAll();
    expect(tables).toBeDefined();
    expect(Array.isArray(tables)).toBe(true);
  });
});
```

**Test Coverage Target**: 80%+ for services and repositories

### Git Workflow

1. **Feature branches**: `feature/feature-name`
2. **Bug fixes**: `fix/bug-description`
3. **Documentation**: `docs/update-name`
4. **Always pull before pushing**: `git pull origin feature/backend-consolidation`
5. **Descriptive commits**: Include what changed and why

---

## 🧹 Maintenance & Cleanup

### ✅ Completed Cleanup

1. **JARVIS Platform Archived** ✅
   - All JARVIS-related files moved to `archive/_jarvis_platform/`
   - Includes: core modules, tests, documentation, npm modules

2. **Trash Files Moved** ✅
   - Temporary files moved to `archive/_trash/`
   - Examples: postgresql-portable.zip, continuar.txt, test files

### 🚀 Recommended Cleanup (Next Steps)

#### 1. Delete Archived Files (If Not Needed)

```bash
# Remove JARVIS platform permanently
rm -rf archive/_jarvis_platform/

# Remove trash files
rm -rf archive/_trash/

# Remove empty archive folder
rm -rf archive/
```

#### 2. Standardize Frontend Folder

```bash
# Option A: Rename frontend to frontend (cleaner)
mv frontend frontend

# Option B: Keep frontend (current)
# No action needed
```

#### 3. Remove Unused Dependencies

```bash
# Backend: Check and remove unused packages
cd backend
npm prune

# Frontend: Check and remove unused packages
cd frontend
npm prune
```

#### 4. Update Scripts

Ensure `start-pos.bat` and `stop-pos.bat` reflect current structure:

**start-pos.bat** should:
1. Start PostgreSQL (port 4306)
2. Start backend (port 7777)
3. Start frontend dev server (port 5173)

**stop-pos.bat** should:
1. Stop frontend dev server
2. Stop backend
3. Stop PostgreSQL

#### 5. Clean Documentation

Keep only POS-related docs in `docs/`:
- ✅ MISTURA_INTEGRATION_ANALYSIS.md
- ✅ PHASE6_KITCHEN_PANEL_DESIGN.md
- ✅ PHASE6_PROGRESS_REPORT.md
- ✅ FINAL_COMPLETION_REPORT.md
- ✅ PROJECT_ARCHITECTURE.md (this file)

Remove or archive:
- ❌ Old JARVIS guides
- ❌ Unrelated system manuals
- ❌ Duplicate documentation

#### 6. Security Audit

```bash
# Check backend vulnerabilities
cd backend
npm audit

# Fix automatically if possible
npm audit fix

# Check frontend vulnerabilities
cd frontend
npm audit
npm audit fix
```

**Note**: GitHub Dependabot has flagged 1 moderate vulnerability. Review and fix:
https://github.com/Dysa-Devlmer/asistente_devlmer/security/dependabot/1

---

## 🗺️ Roadmap

### ✅ Phase 5: SYSME_MISTURA Integration (COMPLETED)

- ✅ Backend consolidation (Repository → Service → Routes)
- ✅ Tables module (CRUD, stats, rates)
- ✅ Sales module (create, lines, finalize, payments)
- ✅ Frontend components (TableMap, SaleView, CheckoutModal)
- ✅ Authentication (POSLogin, POSMain, authStore)
- ✅ 26 unit tests passing (100%)

**Commit**: `9bd464c` - Complete Phase 5: Full POS System Implementation

---

### 🚧 Phase 6: Kitchen Panel (IN PROGRESS)

**Backend** (100% Complete):
- ✅ KitchenRepository with 8 methods
- ✅ KitchenService with transactions
- ✅ WebSocketService with Socket.io
- ✅ Kitchen routes (7 REST endpoints)
- ✅ Server integration (HTTP + WebSocket)

**Frontend** (40% Complete):
- ✅ Type definitions (KitchenItem, KitchenStats, etc.)
- ✅ kitchenApi service (7 functions)
- ⏳ kitchenStore (Zustand)
- ⏳ useKitchen hook
- ⏳ KitchenPanel component
- ⏳ KitchenOrderCard component
- ⏳ WebSocket client integration

**Testing** (0% Complete):
- ⏳ KitchenRepository tests (9 tests)
- ⏳ KitchenService tests (4 tests)
- ⏳ Frontend component tests

**Commit**: `3f31da9` - Add Phase 6: Kitchen Panel Backend + WebSocket (Part 1)

**Next Steps**:
1. Complete kitchenStore, useKitchen, KitchenPanel
2. Integrate kitchen view in POSMain routing
3. Write and run all tests
4. Document kitchen panel usage

---

### 📅 Phase 7: End-to-End Testing (PLANNED)

**Goals**:
- Complete smoke test of entire flow
- Test scenarios:
  1. Login → Select table → Add products → Finalize sale
  2. Login → Kitchen panel → Mark items served
  3. Multi-terminal sync with WebSocket
  4. Error handling and edge cases

**Deliverables**:
- E2E test suite (Playwright or Cypress)
- Test documentation
- Bug fixes identified during testing

---

### 🚀 Phase 8: Production Deployment (PLANNED)

**Infrastructure**:
- Docker containers:
  - PostgreSQL container
  - Backend container (Node.js)
  - Frontend container (nginx with React build)
- Docker Compose for orchestration
- Nginx reverse proxy with SSL
- Environment-specific configs (dev, staging, prod)

**Security**:
- HTTPS with Let's Encrypt certificates
- Environment variables for secrets
- Database backups
- Rate limiting
- CORS configuration

**Monitoring**:
- Health check endpoints
- Error logging (Winston/Pino)
- Performance metrics
- Uptime monitoring

**Deliverables**:
- Docker files and compose config
- Deployment scripts
- Production documentation
- Backup/restore procedures

---

### 🔮 Phase 9: Advanced Features (FUTURE)

**Potential Enhancements**:
1. **Reporting & Analytics**
   - Daily/weekly/monthly sales reports
   - Product popularity analysis
   - Employee performance metrics
   - Kitchen preparation time tracking

2. **Multi-Language Support**
   - i18n integration (react-i18next)
   - Spanish/English toggle
   - Translatable UI strings

3. **Offline Mode**
   - Service worker for PWA
   - Offline queue for sales
   - Sync on reconnect

4. **Thermal Printer Integration**
   - ESC/POS protocol support
   - Kitchen ticket printing
   - Receipt printing

5. **Advanced Kitchen Features**
   - Sound notifications for new orders
   - Visual alerts for urgent items
   - Preparation time tracking
   - Bottleneck detection

6. **Mobile App**
   - React Native version
   - Waiter handheld devices
   - Push notifications

---

## 📊 Current Status Summary

### Code Metrics

**Backend**:
- Files: 12 implementation files + 2 test files
- Lines of code: 4,860 lines
- Test coverage: 26 tests, 100% passing
- Modules: 3 (Tables, Sales, Kitchen)

**Frontend**:
- Files: 20 component files + 6 service/store files
- Lines of code: 5,200 lines
- Components: 12 (8 complete, 4 pending)
- Pages: 2 (POSLogin, POSMain)

**Documentation**:
- Files: 5 comprehensive docs
- Lines: 5,800+ lines
- Coverage: Architecture, design, progress, completion reports

**Total Project**:
- Lines of code: 10,000+
- Files: 40+ files
- Commits: 3 major commits (Phase 5 + Phase 6 Part 1)
- Test coverage: 26/26 passing (backend)

### Dependencies

**Backend** (12 packages):
- express, pg, socket.io
- typescript, vitest, @types/*

**Frontend** (15 packages):
- react, react-router-dom, zustand
- socket.io-client, tailwindcss
- vite, typescript, @types/*

### Repository Health

- ✅ Branch: `feature/backend-consolidation`
- ✅ No merge conflicts
- ⚠️ 1 moderate security vulnerability (Dependabot alert)
- ✅ All tests passing
- ✅ Clean git history

---

## 🎯 Success Criteria

### Definition of Done (Phase 6)

- [x] Backend kitchen module complete
- [x] WebSocket server implemented
- [x] Kitchen API routes functional
- [ ] Frontend kitchen components complete
- [ ] WebSocket client integrated
- [ ] All tests passing (backend + frontend)
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Deployed to staging environment

### Definition of Done (Full Project)

- [ ] All planned features implemented
- [ ] 80%+ test coverage
- [ ] E2E tests passing
- [ ] Production deployment successful
- [ ] User acceptance testing complete
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Documentation complete

---

## 📞 Support & Contact

**Repository**: https://github.com/Dysa-Devlmer/asistente_devlmer.git
**Branch**: `feature/backend-consolidation`
**Issues**: https://github.com/Dysa-Devlmer/asistente_devlmer/issues

---

**Last Updated**: 22 December 2025
**Maintained By**: Devlmer + Claude Code
**License**: Proprietary

---

## 🔖 Quick Links

- [SYSME Integration Analysis](./MISTURA_INTEGRATION_ANALYSIS.md)
- [Kitchen Panel Design](./PHASE6_KITCHEN_PANEL_DESIGN.md)
- [Kitchen Panel Progress](./PHASE6_PROGRESS_REPORT.md)
- [Phase 5 Completion Report](./FINAL_COMPLETION_REPORT.md)
- [GitHub Security Alerts](https://github.com/Dysa-Devlmer/asistente_devlmer/security)

---

**Remember**: This document is the **single source of truth** for project architecture and guidelines. Keep it updated as the project evolves.
