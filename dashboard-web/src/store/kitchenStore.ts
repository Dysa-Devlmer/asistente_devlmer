/**
 * Kitchen Store
 * Zustand store for kitchen panel state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { KitchenItem, KitchenStats, KitchenOrder } from '../types/pos';

interface KitchenState {
  // State
  items: KitchenItem[];
  stats: KitchenStats | null;
  selectedStation: number | null;
  isConnected: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  setItems: (items: KitchenItem[]) => void;
  addItem: (item: KitchenItem) => void;
  updateItem: (id_venta: number, id_linea: number, updates: Partial<KitchenItem>) => void;
  removeItem: (id_venta: number, id_linea: number) => void;
  setStats: (stats: KitchenStats) => void;
  setSelectedStation: (station: number | null) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;

  // Computed getters
  getOrderedItems: () => KitchenOrder[];
  getItemsByStation: (station: number) => KitchenItem[];
  getPendingCount: () => number;
  getStationCount: (station: number) => number;
}

const initialState = {
  items: [],
  stats: null,
  selectedStation: null,
  isConnected: false,
  loading: false,
  error: null,
};

export const useKitchenStore = create<KitchenState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Actions
      setItems: (items) => set({ items, error: null }),

      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
          error: null,
        })),

      updateItem: (id_venta, id_linea, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id_venta === id_venta && item.id_linea === id_linea
              ? { ...item, ...updates }
              : item
          ),
          error: null,
        })),

      removeItem: (id_venta, id_linea) =>
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.id_venta === id_venta && item.id_linea === id_linea)
          ),
          error: null,
        })),

      setStats: (stats) => set({ stats, error: null }),

      setSelectedStation: (station) => set({ selectedStation: station }),

      setConnected: (connected) => set({ isConnected: connected }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      reset: () => set(initialState),

      // Computed getters
      getOrderedItems: () => {
        const state = get();
        const items = state.selectedStation
          ? state.items.filter((item) => item.bloque_cocina === state.selectedStation)
          : state.items;

        // Group items by order (id_venta)
        const ordersMap = new Map<number, KitchenOrder>();

        items.forEach((item) => {
          if (!ordersMap.has(item.id_venta)) {
            ordersMap.set(item.id_venta, {
              id_venta: item.id_venta,
              mesa: item.num_mesa,
              orderTime: `${item.fecha_venta} ${item.hora}`,
              items: [],
              itemsByStation: new Map(),
            });
          }

          const order = ordersMap.get(item.id_venta)!;
          order.items.push(item);

          // Group by station within order
          if (!order.itemsByStation.has(item.bloque_cocina)) {
            order.itemsByStation.set(item.bloque_cocina, []);
          }
          order.itemsByStation.get(item.bloque_cocina)!.push(item);
        });

        // Convert to array and sort by order time (oldest first)
        return Array.from(ordersMap.values()).sort((a, b) =>
          a.orderTime.localeCompare(b.orderTime)
        );
      },

      getItemsByStation: (station) => {
        return get().items.filter((item) => item.bloque_cocina === station);
      },

      getPendingCount: () => {
        return get().items.reduce((sum, item) => sum + item.pendingQty, 0);
      },

      getStationCount: (station) => {
        return get()
          .items.filter((item) => item.bloque_cocina === station)
          .reduce((sum, item) => sum + item.pendingQty, 0);
      },
    }),
    {
      name: 'kitchen-store',
    }
  )
);
