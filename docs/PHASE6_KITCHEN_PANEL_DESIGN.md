# Phase 6: Kitchen Panel Design & Implementation

**Date**: 22 December 2025
**Status**: 🚧 In Progress
**Author**: Claude Code + Devlmer

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Business Requirements](#business-requirements)
3. [Data Model](#data-model)
4. [API Endpoints](#api-endpoints)
5. [WebSocket Events](#websocket-events)
6. [Backend Architecture](#backend-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Testing Strategy](#testing-strategy)
9. [Implementation Plan](#implementation-plan)

---

## 🎯 Overview

### Purpose
Implement a modern real-time kitchen panel that displays pending orders, allows kitchen staff to mark items as served, and provides instant updates between POS terminals and kitchen displays.

### Key Features
- ✅ Real-time order display with WebSocket updates
- ✅ Kitchen station grouping (4 blocks: Grill, Cold, Hot, Bar)
- ✅ Quantity tracking (sent vs. served)
- ✅ Mark items as ready/served
- ✅ Visual status indicators
- ✅ Sound notifications for new orders
- ✅ Touch-friendly tablet interface
- ✅ Order hierarchy (Sale → Station → Items)

### Technology Stack
- **Backend**: Node.js + Express + PostgreSQL + Socket.io
- **Frontend**: React + TypeScript + Zustand + Socket.io-client
- **Real-time**: WebSocket bidirectional communication
- **Testing**: Vitest + React Testing Library

---

## 📊 Business Requirements

### Functional Requirements

#### FR1: Kitchen Display
- Display all pending kitchen items grouped by order and station
- Show table number, server name, order time
- Display item name, quantity, notes, observations
- Group items by kitchen station (bloque_cocina: 1-4)
- Calculate pending quantity: `sent_to_kitchen - served_qty`
- Hide items where `sent_to_kitchen = served_qty`

#### FR2: Mark as Served
- Kitchen staff can mark individual items as ready
- Updates `servido_cocina` field in database
- Sends WebSocket event to all connected clients
- Removes item from kitchen panel when fully served
- Updates POS terminals to show "served" status

#### FR3: Real-time Updates
- New orders appear instantly on kitchen displays
- Items marked as served update on POS terminals
- WebSocket connection with auto-reconnect
- Visual/audio notification for new orders
- Connection status indicator

#### FR4: Kitchen Stations
- Station 1: Grill/Hot Items (Parrilla)
- Station 2: Cold Station (Estación Fría)
- Station 3: Hot Station (Estación Caliente)
- Station 4: Bar/Beverages (Barra)
- Items auto-routed based on product configuration
- Manual override available in POS

### Non-Functional Requirements

#### NFR1: Performance
- Display updates < 100ms after database write
- Support 50+ concurrent kitchen items
- Handle 10+ simultaneous WebSocket connections
- Database queries optimized with indexes

#### NFR2: Reliability
- Auto-reconnect on WebSocket disconnect
- Graceful degradation (polling fallback)
- Transaction-based database operations
- Error logging and monitoring

#### NFR3: Usability
- Large touch targets (60px minimum)
- High contrast colors for kitchen environment
- Clear visual hierarchy
- Minimal clicks to mark items as served

---

## 🗄️ Data Model

### Legacy Database Schema (SYSME_MISTURA)

The legacy system uses these fields in `ventadir_comg`:

```sql
-- ventadir_comg (sales line items)
CREATE TABLE ventadir_comg (
  id_venta INT,                    -- FK to ventadirecta (sale ID)
  id_linea INT,                    -- Line item number
  cantidad DECIMAL(10,2),          -- Ordered quantity
  cocina INT DEFAULT 0,            -- Quantity sent to kitchen
  servido_cocina INT DEFAULT 0,    -- Quantity marked as served (NEW FIELD)
  bloque_cocina INT,               -- Kitchen station (1-4)
  complementog VARCHAR(255),       -- Product name
  nota TEXT,                       -- Kitchen notes/options
  observaciones TEXT,              -- Special instructions
  precio DECIMAL(10,2),
  avgiva DECIMAL(5,2),
  total DECIMAL(10,2),
  -- ... other fields
  PRIMARY KEY (id_venta, id_linea),
  INDEX idx_cocina (cocina),
  INDEX idx_bloque_cocina (bloque_cocina)
);
```

**IMPORTANT**: The `servido_cocina` field may NOT exist in the current legacy database. We need to:
1. Check if field exists
2. Add it via migration if missing
3. Default to 0 for existing records

### Kitchen Item Lifecycle

```
┌─────────────┐
│   Created   │ cocina=0, servido_cocina=0
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Sent to     │ cocina=cantidad, servido_cocina=0
│ Kitchen     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Partially   │ cocina=cantidad, servido_cocina<cocina
│ Served      │ (visible in kitchen panel)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Fully       │ cocina=cantidad, servido_cocina=cocina
│ Served      │ (hidden from kitchen panel)
└─────────────┘
```

### Calculated Fields

```typescript
interface KitchenItem {
  // From database
  id_venta: number;
  id_linea: number;
  cantidad: number;           // Total ordered
  cocina: number;            // Sent to kitchen
  servido_cocina: number;    // Marked as served
  bloque_cocina: number;     // Kitchen station (1-4)
  complementog: string;      // Product name
  nota: string | null;       // Kitchen notes
  observaciones: string | null; // Special instructions

  // From JOIN with ventadirecta
  num_mesa: string;          // Table number
  fecha_venta: string;       // Sale date
  hora: string;              // Sale time
  id_camarero: string;       // Server ID

  // Calculated
  pendingQty: number;        // = cocina - servido_cocina
  sentAt: Date;              // When sent to kitchen
}
```

---

## 🔌 API Endpoints

### Kitchen Routes (`/api/pos/kitchen`)

#### 1. GET `/api/pos/kitchen/items`
Get all pending kitchen items.

**Query Parameters:**
- `station?: number` - Filter by kitchen station (1-4)
- `mesa?: string` - Filter by table number

**Response:**
```typescript
{
  success: true,
  data: {
    items: KitchenItem[],
    summary: {
      totalPending: number,
      byStation: {
        1: number,  // Grill
        2: number,  // Cold
        3: number,  // Hot
        4: number   // Bar
      }
    }
  }
}
```

**Business Logic:**
```sql
SELECT
  vc.id_venta,
  vc.id_linea,
  vc.cantidad,
  vc.cocina,
  COALESCE(vc.servido_cocina, 0) as servido_cocina,
  vc.bloque_cocina,
  vc.complementog,
  vc.nota,
  vc.observaciones,
  v.num_mesa,
  v.fecha_venta,
  v.hora,
  v.id_camarero,
  (vc.cocina - COALESCE(vc.servido_cocina, 0)) as pendingQty
FROM ventadir_comg vc
INNER JOIN ventadirecta v ON vc.id_venta = v.id_venta
WHERE v.cerrada = 'N'                    -- Only open orders
  AND vc.cocina > 0                      -- Sent to kitchen
  AND vc.cocina > COALESCE(vc.servido_cocina, 0)  -- Not fully served
  AND vc.bloque_cocina IS NOT NULL       -- Has station assigned
ORDER BY v.fecha_venta, v.hora, vc.bloque_cocina, vc.id_linea
```

#### 2. POST `/api/pos/kitchen/items/:id_venta/:id_linea/mark-served`
Mark an item (or quantity) as served.

**Request Body:**
```typescript
{
  quantity?: number  // Optional: mark partial quantity (default: all pending)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id_venta: number,
    id_linea: number,
    previousServed: number,
    newServed: number,
    remaining: number  // cocina - newServed
  }
}
```

**Business Logic:**
```sql
-- Get current state
SELECT cocina, COALESCE(servido_cocina, 0) as servido_cocina
FROM ventadir_comg
WHERE id_venta = $1 AND id_linea = $2;

-- Calculate new served quantity
-- If quantity param provided: servido_cocina + quantity
-- Else: cocina (mark all as served)
UPDATE ventadir_comg
SET servido_cocina = LEAST($3, cocina)  -- Can't exceed cocina
WHERE id_venta = $1 AND id_linea = $2
RETURNING *;
```

**WebSocket Event Emitted:**
```typescript
{
  event: 'kitchen:item_served',
  data: {
    id_venta: number,
    id_linea: number,
    served_qty: number,
    remaining_qty: number
  }
}
```

#### 3. POST `/api/pos/kitchen/items/mark-all-served`
Mark all items from an order as served.

**Request Body:**
```typescript
{
  id_venta: number,
  bloque_cocina?: number  // Optional: only items from this station
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id_venta: number,
    itemsUpdated: number
  }
}
```

#### 4. GET `/api/pos/kitchen/stats`
Get kitchen statistics.

**Response:**
```typescript
{
  success: true,
  data: {
    totalOrders: number,        // Open orders with kitchen items
    totalItems: number,         // Total pending items
    byStation: {
      1: { orders: number, items: number },
      2: { orders: number, items: number },
      3: { orders: number, items: number },
      4: { orders: number, items: number }
    },
    oldestOrder: {
      id_venta: number,
      mesa: string,
      waitTime: number  // minutes
    }
  }
}
```

---

## 🔄 WebSocket Events

### Server → Client Events

#### `kitchen:new_items`
Emitted when items are sent to kitchen.

```typescript
{
  event: 'kitchen:new_items',
  data: {
    id_venta: number,
    items: Array<{
      id_linea: number,
      complementog: string,
      cantidad: number,
      bloque_cocina: number,
      nota: string | null,
      observaciones: string | null
    }>,
    mesa: string,
    camarero: string
  }
}
```

#### `kitchen:item_served`
Emitted when item is marked as served.

```typescript
{
  event: 'kitchen:item_served',
  data: {
    id_venta: number,
    id_linea: number,
    served_qty: number,
    remaining_qty: number
  }
}
```

#### `kitchen:order_updated`
Emitted when order is modified (line added/deleted).

```typescript
{
  event: 'kitchen:order_updated',
  data: {
    id_venta: number,
    action: 'line_added' | 'line_deleted' | 'line_updated'
  }
}
```

### Client → Server Events

#### `kitchen:subscribe`
Subscribe to kitchen updates for specific station.

```typescript
{
  event: 'kitchen:subscribe',
  data: {
    station?: number  // Optional: subscribe to specific station
  }
}
```

#### `kitchen:unsubscribe`
Unsubscribe from kitchen updates.

```typescript
{
  event: 'kitchen:unsubscribe',
  data: {}
}
```

---

## 🏗️ Backend Architecture

### Repository Layer (`KitchenRepository.ts`)

```typescript
export class KitchenRepository {
  /**
   * Get all pending kitchen items
   * @param filters - Optional filters (station, mesa)
   * @returns Array of kitchen items
   */
  async findPendingItems(filters?: {
    station?: number;
    mesa?: string;
  }): Promise<KitchenItem[]>;

  /**
   * Mark item as served
   * @param id_venta - Sale ID
   * @param id_linea - Line ID
   * @param quantity - Quantity to mark (default: all pending)
   * @returns Updated item
   */
  async markItemServed(
    id_venta: number,
    id_linea: number,
    quantity?: number
  ): Promise<{
    id_venta: number;
    id_linea: number;
    previousServed: number;
    newServed: number;
    remaining: number;
  }>;

  /**
   * Mark all items from order as served
   * @param id_venta - Sale ID
   * @param bloque_cocina - Optional station filter
   * @returns Number of items updated
   */
  async markAllServed(
    id_venta: number,
    bloque_cocina?: number
  ): Promise<number>;

  /**
   * Get kitchen statistics
   * @returns Kitchen stats by station
   */
  async getStats(): Promise<KitchenStats>;

  /**
   * Check if servido_cocina field exists
   * @returns true if field exists
   */
  async checkServidoCocinaField(): Promise<boolean>;

  /**
   * Add servido_cocina field if missing
   */
  async addServidoCocinaField(): Promise<void>;
}
```

### Service Layer (`KitchenService.ts`)

```typescript
export class KitchenService {
  constructor(
    private kitchenRepo: KitchenRepository,
    private wsService: WebSocketService
  ) {}

  /**
   * Get pending kitchen items
   */
  async getPendingItems(filters?: {
    station?: number;
    mesa?: string;
  }): Promise<KitchenItemsResponse>;

  /**
   * Mark item as served
   * Emits WebSocket event on success
   */
  async markItemServed(
    id_venta: number,
    id_linea: number,
    quantity?: number
  ): Promise<void>;

  /**
   * Mark all items from order as served
   * Emits WebSocket event on success
   */
  async markAllServed(
    id_venta: number,
    bloque_cocina?: number
  ): Promise<void>;

  /**
   * Get kitchen statistics
   */
  async getStats(): Promise<KitchenStats>;

  /**
   * Initialize kitchen module
   * Checks/adds servido_cocina field
   */
  async initialize(): Promise<void>;
}
```

### WebSocket Service (`WebSocketService.ts`)

```typescript
export class WebSocketService {
  private io: Server;

  constructor(httpServer: http.Server) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
      }
    });
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('kitchen:subscribe', (data) => {
        if (data.station) {
          socket.join(`kitchen:station:${data.station}`);
        } else {
          socket.join('kitchen:all');
        }
      });

      socket.on('kitchen:unsubscribe', () => {
        socket.leave('kitchen:all');
        [1, 2, 3, 4].forEach(s => socket.leave(`kitchen:station:${s}`));
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Emit event to kitchen subscribers
   */
  emitKitchenEvent(event: string, data: any, station?: number): void {
    const room = station ? `kitchen:station:${station}` : 'kitchen:all';
    this.io.to(room).emit(event, data);
  }

  /**
   * Emit to all connected clients
   */
  emitToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }
}
```

---

## 🎨 Frontend Architecture

### Type Definitions (`types/pos/kitchen.ts`)

```typescript
export interface KitchenItem {
  id_venta: number;
  id_linea: number;
  cantidad: number;
  cocina: number;
  servido_cocina: number;
  bloque_cocina: number;
  complementog: string;
  nota: string | null;
  observaciones: string | null;
  num_mesa: string;
  fecha_venta: string;
  hora: string;
  id_camarero: string;
  pendingQty: number;
}

export interface KitchenOrder {
  id_venta: number;
  mesa: string;
  orderTime: string;
  itemsByStation: Map<number, KitchenItem[]>;
}

export interface KitchenStats {
  totalOrders: number;
  totalItems: number;
  byStation: {
    [station: number]: {
      orders: number;
      items: number;
    };
  };
  oldestOrder?: {
    id_venta: number;
    mesa: string;
    waitTime: number;
  };
}

export const KITCHEN_STATIONS = {
  1: { name: 'Parrilla', color: 'bg-red-500' },
  2: { name: 'Estación Fría', color: 'bg-blue-500' },
  3: { name: 'Estación Caliente', color: 'bg-orange-500' },
  4: { name: 'Barra', color: 'bg-purple-500' }
} as const;
```

### State Management (`store/kitchenStore.ts`)

```typescript
interface KitchenState {
  items: KitchenItem[];
  stats: KitchenStats | null;
  selectedStation: number | null;
  isConnected: boolean;

  // Actions
  setItems: (items: KitchenItem[]) => void;
  addItem: (item: KitchenItem) => void;
  updateItem: (id_venta: number, id_linea: number, updates: Partial<KitchenItem>) => void;
  removeItem: (id_venta: number, id_linea: number) => void;
  setStats: (stats: KitchenStats) => void;
  setSelectedStation: (station: number | null) => void;
  setConnected: (connected: boolean) => void;

  // Computed
  getOrderedItems: () => KitchenOrder[];
  getItemsByStation: (station: number) => KitchenItem[];
}

export const useKitchenStore = create<KitchenState>()(
  devtools(
    (set, get) => ({
      items: [],
      stats: null,
      selectedStation: null,
      isConnected: false,

      setItems: (items) => set({ items }),

      addItem: (item) => set((state) => ({
        items: [...state.items, item]
      })),

      updateItem: (id_venta, id_linea, updates) => set((state) => ({
        items: state.items.map(item =>
          item.id_venta === id_venta && item.id_linea === id_linea
            ? { ...item, ...updates }
            : item
        )
      })),

      removeItem: (id_venta, id_linea) => set((state) => ({
        items: state.items.filter(
          item => !(item.id_venta === id_venta && item.id_linea === id_linea)
        )
      })),

      setStats: (stats) => set({ stats }),
      setSelectedStation: (station) => set({ selectedStation: station }),
      setConnected: (connected) => set({ isConnected: connected }),

      getOrderedItems: () => {
        const items = get().items;
        const orders = new Map<number, KitchenOrder>();

        items.forEach(item => {
          if (!orders.has(item.id_venta)) {
            orders.set(item.id_venta, {
              id_venta: item.id_venta,
              mesa: item.num_mesa,
              orderTime: `${item.fecha_venta} ${item.hora}`,
              itemsByStation: new Map()
            });
          }

          const order = orders.get(item.id_venta)!;
          if (!order.itemsByStation.has(item.bloque_cocina)) {
            order.itemsByStation.set(item.bloque_cocina, []);
          }
          order.itemsByStation.get(item.bloque_cocina)!.push(item);
        });

        return Array.from(orders.values());
      },

      getItemsByStation: (station) => {
        return get().items.filter(item => item.bloque_cocina === station);
      }
    }),
    { name: 'kitchen-store' }
  )
);
```

### Custom Hook (`hooks/pos/useKitchen.ts`)

```typescript
export function useKitchen() {
  const store = useKitchenStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:7777', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Kitchen WebSocket connected');
      store.setConnected(true);
      socket.emit('kitchen:subscribe', { station: store.selectedStation });
    });

    socket.on('disconnect', () => {
      console.log('Kitchen WebSocket disconnected');
      store.setConnected(false);
    });

    socket.on('kitchen:new_items', (data) => {
      // Refresh items
      loadItems();
      // Play sound notification
      playNotificationSound();
    });

    socket.on('kitchen:item_served', (data) => {
      const { id_venta, id_linea, served_qty, remaining_qty } = data;
      if (remaining_qty === 0) {
        store.removeItem(id_venta, id_linea);
      } else {
        store.updateItem(id_venta, id_linea, {
          servido_cocina: served_qty,
          pendingQty: remaining_qty
        });
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [store.selectedStation]);

  // Load items from API
  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await kitchenApi.getPendingItems({
        station: store.selectedStation || undefined
      });
      store.setItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading items');
    } finally {
      setLoading(false);
    }
  };

  // Mark item as served
  const markServed = async (id_venta: number, id_linea: number, quantity?: number) => {
    try {
      await kitchenApi.markItemServed(id_venta, id_linea, quantity);
      // WebSocket will handle UI update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error marking item');
      throw err;
    }
  };

  // Mark all items from order as served
  const markAllServed = async (id_venta: number, station?: number) => {
    try {
      await kitchenApi.markAllServed(id_venta, station);
      // WebSocket will handle UI update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error marking all items');
      throw err;
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const stats = await kitchenApi.getStats();
      store.setStats(stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Auto-load on mount
  useEffect(() => {
    loadItems();
    loadStats();

    // Refresh stats every 30s
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [store.selectedStation]);

  return {
    items: store.items,
    orderedItems: store.getOrderedItems(),
    stats: store.stats,
    selectedStation: store.selectedStation,
    isConnected: store.isConnected,
    loading,
    error,
    setSelectedStation: store.setSelectedStation,
    markServed,
    markAllServed,
    refresh: loadItems
  };
}
```

### Component (`components/pos/KitchenPanel/KitchenPanel.tsx`)

```typescript
export const KitchenPanel: React.FC = () => {
  const {
    orderedItems,
    stats,
    selectedStation,
    isConnected,
    loading,
    error,
    setSelectedStation,
    markServed,
    markAllServed
  } = useKitchen();

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Panel de Cocina</h1>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">{isConnected ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>

        {/* Station Filters */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setSelectedStation(null)}
            className={`px-4 py-2 rounded ${!selectedStation ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Todas
          </button>
          {Object.entries(KITCHEN_STATIONS).map(([station, config]) => (
            <button
              key={station}
              onClick={() => setSelectedStation(Number(station))}
              className={`px-4 py-2 rounded ${
                selectedStation === Number(station)
                  ? `${config.color} text-white`
                  : 'bg-gray-200'
              }`}
            >
              {config.name}
              {stats?.byStation[Number(station)]?.items > 0 && (
                <span className="ml-2 bg-white text-gray-900 rounded-full px-2 py-1 text-xs">
                  {stats.byStation[Number(station)].items}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && <div className="text-center py-8">Cargando...</div>}
        {error && <div className="text-center py-8 text-red-600">{error}</div>}

        {!loading && !error && orderedItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay pedidos pendientes en cocina
          </div>
        )}

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orderedItems.map(order => (
            <KitchenOrderCard
              key={order.id_venta}
              order={order}
              onMarkServed={markServed}
              onMarkAllServed={markAllServed}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 🧪 Testing Strategy

### Unit Tests

#### KitchenRepository Tests
- ✅ `findPendingItems()` returns items with pending quantity
- ✅ `findPendingItems()` filters by station
- ✅ `findPendingItems()` filters by mesa
- ✅ `markItemServed()` updates servido_cocina correctly
- ✅ `markItemServed()` prevents exceeding cocina quantity
- ✅ `markAllServed()` updates multiple items
- ✅ `getStats()` calculates totals correctly
- ✅ `checkServidoCocinaField()` detects field presence
- ✅ `addServidoCocinaField()` adds field if missing

#### KitchenService Tests
- ✅ `getPendingItems()` calls repository correctly
- ✅ `markItemServed()` emits WebSocket event
- ✅ `markAllServed()` emits WebSocket event
- ✅ `initialize()` checks and adds field

### Integration Tests
- ✅ GET `/api/pos/kitchen/items` returns correct data
- ✅ POST `/api/pos/kitchen/items/:id/:line/mark-served` updates database
- ✅ WebSocket events are emitted on mark served
- ✅ Multiple clients receive updates

### E2E Tests
- ✅ Kitchen panel displays pending items
- ✅ Marking item as served removes it from panel
- ✅ POS terminals receive served status updates
- ✅ Sound notification plays on new order

---

## 📅 Implementation Plan

### Phase 1: Database & Backend (4 hours)
1. ✅ Check/add `servido_cocina` field migration
2. ✅ Implement `KitchenRepository` (8 methods)
3. ✅ Write unit tests for repository (9 tests)
4. ✅ Implement `KitchenService` (4 methods)
5. ✅ Write unit tests for service (4 tests)
6. ✅ Create kitchen routes (4 endpoints)

### Phase 2: WebSocket Integration (2 hours)
1. ✅ Implement `WebSocketService`
2. ✅ Integrate WebSocket in kitchen routes
3. ✅ Test WebSocket events manually

### Phase 3: Frontend Implementation (6 hours)
1. ✅ Create type definitions
2. ✅ Implement `kitchenStore`
3. ✅ Create `kitchenApi` service
4. ✅ Implement `useKitchen` hook
5. ✅ Create `KitchenPanel` component
6. ✅ Create `KitchenOrderCard` sub-component
7. ✅ Integrate WebSocket client

### Phase 4: Testing & Documentation (2 hours)
1. ✅ Run all unit tests
2. ✅ Fix any failing tests
3. ✅ Update documentation
4. ✅ Create user guide

### Total: ~14 hours

---

## 📝 Notes

### Database Migration
The `servido_cocina` field may not exist in legacy database. We'll add it via:

```sql
-- Check if field exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'ventadir_comg'
  AND column_name = 'servido_cocina';

-- Add field if missing
ALTER TABLE ventadir_comg
ADD COLUMN servido_cocina INT DEFAULT 0;

-- Create index
CREATE INDEX idx_servido_cocina ON ventadir_comg(servido_cocina);
```

### Performance Optimization
- Add composite index: `(cocina, servido_cocina, bloque_cocina)`
- Use connection pooling for concurrent queries
- Cache stats for 5 seconds to reduce load

### Future Enhancements
- Sound notifications (audio alerts)
- Visual flashing for urgent orders
- Preparation time tracking
- Kitchen analytics dashboard
- Multi-language support
- Print kitchen tickets on demand

---

**Last Updated**: 22 December 2025
**Status**: Ready for Implementation
