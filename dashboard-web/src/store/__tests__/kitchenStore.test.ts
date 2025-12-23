/**
 * Unit Tests for kitchenStore
 * Tests Zustand store for kitchen panel state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useKitchenStore } from '../kitchenStore';
import type { KitchenItem, KitchenStats } from '../../types/pos';

describe('kitchenStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useKitchenStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useKitchenStore.getState();

      expect(state.items).toEqual([]);
      expect(state.stats).toBeNull();
      expect(state.selectedStation).toBeNull();
      expect(state.isConnected).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setItems', () => {
    it('should set items and clear error', () => {
      const mockItems: KitchenItem[] = [
        {
          id_venta: 1,
          id_linea: 1,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Hamburguesa',
          cantidad: 2,
          servido_cocina: 0,
          pendingQty: 2,
          bloque_cocina: 1,
          nota: '',
          observaciones: '',
        },
      ];

      useKitchenStore.getState().setError('Previous error');
      useKitchenStore.getState().setItems(mockItems);

      const state = useKitchenStore.getState();
      expect(state.items).toEqual(mockItems);
      expect(state.error).toBeNull();
    });
  });

  describe('addItem', () => {
    it('should add item to the list', () => {
      const item1: KitchenItem = {
        id_venta: 1,
        id_linea: 1,
        num_mesa: '01',
        fecha_venta: '2025-01-22',
        hora: '12:00:00',
        complementog: 'Hamburguesa',
        cantidad: 2,
        servido_cocina: 0,
        pendingQty: 2,
        bloque_cocina: 1,
        nota: '',
        observaciones: '',
      };

      const item2: KitchenItem = {
        ...item1,
        id_linea: 2,
        complementog: 'Pizza',
      };

      useKitchenStore.getState().addItem(item1);
      useKitchenStore.getState().addItem(item2);

      const state = useKitchenStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items[0].complementog).toBe('Hamburguesa');
      expect(state.items[1].complementog).toBe('Pizza');
    });
  });

  describe('updateItem', () => {
    it('should update specific item', () => {
      const item: KitchenItem = {
        id_venta: 1,
        id_linea: 1,
        num_mesa: '01',
        fecha_venta: '2025-01-22',
        hora: '12:00:00',
        complementog: 'Hamburguesa',
        cantidad: 2,
        servido_cocina: 0,
        pendingQty: 2,
        bloque_cocina: 1,
        nota: '',
        observaciones: '',
      };

      useKitchenStore.getState().setItems([item]);
      useKitchenStore.getState().updateItem(1, 1, {
        servido_cocina: 1,
        pendingQty: 1,
      });

      const state = useKitchenStore.getState();
      expect(state.items[0].servido_cocina).toBe(1);
      expect(state.items[0].pendingQty).toBe(1);
    });

    it('should not update items that do not match', () => {
      const item1: KitchenItem = {
        id_venta: 1,
        id_linea: 1,
        num_mesa: '01',
        fecha_venta: '2025-01-22',
        hora: '12:00:00',
        complementog: 'Hamburguesa',
        cantidad: 2,
        servido_cocina: 0,
        pendingQty: 2,
        bloque_cocina: 1,
        nota: '',
        observaciones: '',
      };

      useKitchenStore.getState().setItems([item1]);
      useKitchenStore.getState().updateItem(999, 999, { pendingQty: 0 });

      const state = useKitchenStore.getState();
      expect(state.items[0].pendingQty).toBe(2); // Unchanged
    });
  });

  describe('removeItem', () => {
    it('should remove specific item', () => {
      const items: KitchenItem[] = [
        {
          id_venta: 1,
          id_linea: 1,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Hamburguesa',
          cantidad: 2,
          servido_cocina: 0,
          pendingQty: 2,
          bloque_cocina: 1,
          nota: '',
          observaciones: '',
        },
        {
          id_venta: 1,
          id_linea: 2,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Pizza',
          cantidad: 1,
          servido_cocina: 0,
          pendingQty: 1,
          bloque_cocina: 2,
          nota: '',
          observaciones: '',
        },
      ];

      useKitchenStore.getState().setItems(items);
      useKitchenStore.getState().removeItem(1, 1);

      const state = useKitchenStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id_linea).toBe(2);
      expect(state.items[0].complementog).toBe('Pizza');
    });
  });

  describe('setStats', () => {
    it('should set stats and clear error', () => {
      const mockStats: KitchenStats = {
        totalOrders: 5,
        totalItems: 12,
        oldestOrder: {
          id_venta: 1,
          mesa: '01',
          orderTime: '2025-01-22 12:00:00',
          waitTime: 15,
        },
      };

      useKitchenStore.getState().setError('Previous error');
      useKitchenStore.getState().setStats(mockStats);

      const state = useKitchenStore.getState();
      expect(state.stats).toEqual(mockStats);
      expect(state.error).toBeNull();
    });
  });

  describe('setSelectedStation', () => {
    it('should set selected station', () => {
      useKitchenStore.getState().setSelectedStation(1);
      expect(useKitchenStore.getState().selectedStation).toBe(1);

      useKitchenStore.getState().setSelectedStation(null);
      expect(useKitchenStore.getState().selectedStation).toBeNull();
    });
  });

  describe('setConnected', () => {
    it('should set connection status', () => {
      useKitchenStore.getState().setConnected(true);
      expect(useKitchenStore.getState().isConnected).toBe(true);

      useKitchenStore.getState().setConnected(false);
      expect(useKitchenStore.getState().isConnected).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('should set loading status', () => {
      useKitchenStore.getState().setLoading(true);
      expect(useKitchenStore.getState().loading).toBe(true);

      useKitchenStore.getState().setLoading(false);
      expect(useKitchenStore.getState().loading).toBe(false);
    });
  });

  describe('setError and clearError', () => {
    it('should set error message', () => {
      useKitchenStore.getState().setError('Test error');
      expect(useKitchenStore.getState().error).toBe('Test error');
    });

    it('should clear error', () => {
      useKitchenStore.getState().setError('Test error');
      useKitchenStore.getState().clearError();
      expect(useKitchenStore.getState().error).toBeNull();
    });
  });

  describe('getOrderedItems', () => {
    it('should group items by order and station', () => {
      const items: KitchenItem[] = [
        {
          id_venta: 1,
          id_linea: 1,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Hamburguesa',
          cantidad: 2,
          servido_cocina: 0,
          pendingQty: 2,
          bloque_cocina: 1,
          nota: '',
          observaciones: '',
        },
        {
          id_venta: 1,
          id_linea: 2,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Pizza',
          cantidad: 1,
          servido_cocina: 0,
          pendingQty: 1,
          bloque_cocina: 2,
          nota: '',
          observaciones: '',
        },
        {
          id_venta: 2,
          id_linea: 1,
          num_mesa: '02',
          fecha_venta: '2025-01-22',
          hora: '12:30:00',
          complementog: 'Pasta',
          cantidad: 1,
          servido_cocina: 0,
          pendingQty: 1,
          bloque_cocina: 1,
          nota: '',
          observaciones: '',
        },
      ];

      useKitchenStore.getState().setItems(items);
      const orders = useKitchenStore.getState().getOrderedItems();

      expect(orders).toHaveLength(2);
      expect(orders[0].id_venta).toBe(1);
      expect(orders[0].mesa).toBe('01');
      expect(orders[0].items).toHaveLength(2);
      expect(orders[0].itemsByStation.size).toBe(2); // 2 stations
      expect(orders[1].id_venta).toBe(2);
      expect(orders[1].mesa).toBe('02');
    });

    it('should filter by selected station', () => {
      const items: KitchenItem[] = [
        {
          id_venta: 1,
          id_linea: 1,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Hamburguesa',
          cantidad: 2,
          servido_cocina: 0,
          pendingQty: 2,
          bloque_cocina: 1,
          nota: '',
          observaciones: '',
        },
        {
          id_venta: 1,
          id_linea: 2,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Pizza',
          cantidad: 1,
          servido_cocina: 0,
          pendingQty: 1,
          bloque_cocina: 2,
          nota: '',
          observaciones: '',
        },
      ];

      useKitchenStore.getState().setItems(items);
      useKitchenStore.getState().setSelectedStation(1);

      const orders = useKitchenStore.getState().getOrderedItems();
      expect(orders[0].items).toHaveLength(1);
      expect(orders[0].items[0].bloque_cocina).toBe(1);
    });

    it('should sort orders by time (oldest first)', () => {
      const items: KitchenItem[] = [
        {
          id_venta: 2,
          id_linea: 1,
          num_mesa: '02',
          fecha_venta: '2025-01-22',
          hora: '13:00:00',
          complementog: 'Pasta',
          cantidad: 1,
          servido_cocina: 0,
          pendingQty: 1,
          bloque_cocina: 1,
          nota: '',
          observaciones: '',
        },
        {
          id_venta: 1,
          id_linea: 1,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Hamburguesa',
          cantidad: 2,
          servido_cocina: 0,
          pendingQty: 2,
          bloque_cocina: 1,
          nota: '',
          observaciones: '',
        },
      ];

      useKitchenStore.getState().setItems(items);
      const orders = useKitchenStore.getState().getOrderedItems();

      // Should be sorted oldest first (12:00 before 13:00)
      expect(orders[0].id_venta).toBe(1);
      expect(orders[1].id_venta).toBe(2);
    });
  });

  describe('getItemsByStation', () => {
    it('should return items for specific station', () => {
      const items: KitchenItem[] = [
        {
          id_venta: 1,
          id_linea: 1,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Hamburguesa',
          cantidad: 2,
          servido_cocina: 0,
          pendingQty: 2,
          bloque_cocina: 1,
          nota: '',
          observaciones: '',
        },
        {
          id_venta: 1,
          id_linea: 2,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Pizza',
          cantidad: 1,
          servido_cocina: 0,
          pendingQty: 1,
          bloque_cocina: 2,
          nota: '',
          observaciones: '',
        },
      ];

      useKitchenStore.getState().setItems(items);
      const station1Items = useKitchenStore.getState().getItemsByStation(1);
      const station2Items = useKitchenStore.getState().getItemsByStation(2);

      expect(station1Items).toHaveLength(1);
      expect(station1Items[0].complementog).toBe('Hamburguesa');
      expect(station2Items).toHaveLength(1);
      expect(station2Items[0].complementog).toBe('Pizza');
    });
  });

  describe('getPendingCount', () => {
    it('should return total pending quantity across all items', () => {
      const items: KitchenItem[] = [
        {
          id_venta: 1,
          id_linea: 1,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Hamburguesa',
          cantidad: 2,
          servido_cocina: 0,
          pendingQty: 2,
          bloque_cocina: 1,
          nota: '',
          observaciones: '',
        },
        {
          id_venta: 1,
          id_linea: 2,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Pizza',
          cantidad: 3,
          servido_cocina: 1,
          pendingQty: 2,
          bloque_cocina: 2,
          nota: '',
          observaciones: '',
        },
      ];

      useKitchenStore.getState().setItems(items);
      const count = useKitchenStore.getState().getPendingCount();

      expect(count).toBe(4); // 2 + 2
    });

    it('should return 0 when no items', () => {
      const count = useKitchenStore.getState().getPendingCount();
      expect(count).toBe(0);
    });
  });

  describe('getStationCount', () => {
    it('should return pending count for specific station', () => {
      const items: KitchenItem[] = [
        {
          id_venta: 1,
          id_linea: 1,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Hamburguesa',
          cantidad: 2,
          servido_cocina: 0,
          pendingQty: 2,
          bloque_cocina: 1,
          nota: '',
          observaciones: '',
        },
        {
          id_venta: 1,
          id_linea: 2,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Pizza',
          cantidad: 3,
          servido_cocina: 1,
          pendingQty: 2,
          bloque_cocina: 1,
          nota: '',
          observaciones: '',
        },
        {
          id_venta: 1,
          id_linea: 3,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Ensalada',
          cantidad: 1,
          servido_cocina: 0,
          pendingQty: 1,
          bloque_cocina: 2,
          nota: '',
          observaciones: '',
        },
      ];

      useKitchenStore.getState().setItems(items);
      const station1Count = useKitchenStore.getState().getStationCount(1);
      const station2Count = useKitchenStore.getState().getStationCount(2);

      expect(station1Count).toBe(4); // 2 + 2
      expect(station2Count).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      useKitchenStore.getState().setItems([
        {
          id_venta: 1,
          id_linea: 1,
          num_mesa: '01',
          fecha_venta: '2025-01-22',
          hora: '12:00:00',
          complementog: 'Hamburguesa',
          cantidad: 2,
          servido_cocina: 0,
          pendingQty: 2,
          bloque_cocina: 1,
          nota: '',
          observaciones: '',
        },
      ]);
      useKitchenStore.getState().setSelectedStation(1);
      useKitchenStore.getState().setConnected(true);
      useKitchenStore.getState().setError('Error');

      useKitchenStore.getState().reset();

      const state = useKitchenStore.getState();
      expect(state.items).toEqual([]);
      expect(state.stats).toBeNull();
      expect(state.selectedStation).toBeNull();
      expect(state.isConnected).toBe(false);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
