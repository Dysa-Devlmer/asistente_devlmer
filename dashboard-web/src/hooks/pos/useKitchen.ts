/**
 * useKitchen Hook
 * Custom hook for kitchen panel operations with WebSocket
 */

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useKitchenStore } from '../../store/kitchenStore';
import * as kitchenApi from '../../services/api/kitchenApi';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:7777';
const RECONNECT_DELAY = 3000;
const STATS_REFRESH_INTERVAL = 30000; // 30 seconds

// Sound notification (optional - can be replaced with actual audio file)
const playNotificationSound = () => {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
};

export function useKitchen() {
  const store = useKitchenStore();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load items from API
  const loadItems = useCallback(async () => {
    store.setLoading(true);
    store.clearError();

    try {
      const response = await kitchenApi.getPendingItems({
        station: store.selectedStation || undefined,
      });

      store.setItems(response.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading kitchen items';
      store.setError(message);
      console.error('[useKitchen] Load items error:', error);
    } finally {
      store.setLoading(false);
    }
  }, [store.selectedStation]);

  // Load stats from API
  const loadStats = useCallback(async () => {
    try {
      const stats = await kitchenApi.getStats();
      store.setStats(stats);
    } catch (error) {
      console.error('[useKitchen] Load stats error:', error);
    }
  }, []);

  // Mark item as served
  const markServed = useCallback(
    async (id_venta: number, id_linea: number, quantity?: number) => {
      store.clearError();

      try {
        await kitchenApi.markItemServed(id_venta, id_linea, quantity);
        // WebSocket will handle UI update via kitchen:item_served event
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error marking item as served';
        store.setError(message);
        console.error('[useKitchen] Mark served error:', error);
        throw error;
      }
    },
    []
  );

  // Mark all items from order as served
  const markAllServed = useCallback(async (id_venta: number, station?: number) => {
    store.clearError();

    try {
      await kitchenApi.markAllServed(id_venta, station);
      // WebSocket will handle UI update
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error marking all items';
      store.setError(message);
      console.error('[useKitchen] Mark all served error:', error);
      throw error;
    }
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    console.log('[useKitchen] Setting up WebSocket connection...');

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('[useKitchen] WebSocket connected:', socket.id);
      store.setConnected(true);

      // Subscribe to kitchen updates
      socket.emit('kitchen:subscribe', {
        station: store.selectedStation || undefined,
      });

      // Load initial data
      loadItems();
      loadStats();
    });

    socket.on('disconnect', (reason) => {
      console.log('[useKitchen] WebSocket disconnected:', reason);
      store.setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[useKitchen] WebSocket connection error:', error);
      store.setConnected(false);
    });

    // Kitchen events
    socket.on('kitchen:new_items', (data) => {
      console.log('[useKitchen] New items received:', data);

      // Play notification sound
      playNotificationSound();

      // Refresh items list
      loadItems();
      loadStats();
    });

    socket.on('kitchen:item_served', (data) => {
      console.log('[useKitchen] Item served:', data);

      const { id_venta, id_linea, served_qty, remaining_qty } = data;

      if (remaining_qty === 0) {
        // Remove item from list
        store.removeItem(id_venta, id_linea);
      } else {
        // Update item quantities
        store.updateItem(id_venta, id_linea, {
          servido_cocina: served_qty,
          pendingQty: remaining_qty,
        });
      }

      // Refresh stats
      loadStats();
    });

    socket.on('kitchen:order_updated', (data) => {
      console.log('[useKitchen] Order updated:', data);
      // Refresh items list to reflect changes
      loadItems();
    });

    socket.on('kitchen:order_completed', (data) => {
      console.log('[useKitchen] Order completed:', data);
      // Refresh items and stats
      loadItems();
      loadStats();
    });

    // Ping/pong for connection keep-alive
    socket.on('pong', () => {
      // Connection is alive
    });

    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 25000); // Every 25 seconds

    // Cleanup
    return () => {
      console.log('[useKitchen] Cleaning up WebSocket connection...');

      clearInterval(pingInterval);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      socket.emit('kitchen:unsubscribe');
      socket.disconnect();
    };
  }, [store.selectedStation, loadItems, loadStats]);

  // Auto-refresh stats periodically
  useEffect(() => {
    statsIntervalRef.current = setInterval(() => {
      if (store.isConnected) {
        loadStats();
      }
    }, STATS_REFRESH_INTERVAL);

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [store.isConnected, loadStats]);

  // Re-subscribe when selected station changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('[useKitchen] Station changed, re-subscribing:', store.selectedStation);

      socketRef.current.emit('kitchen:unsubscribe');
      socketRef.current.emit('kitchen:subscribe', {
        station: store.selectedStation || undefined,
      });

      // Reload items for new station
      loadItems();
    }
  }, [store.selectedStation, loadItems]);

  return {
    // State
    items: store.items,
    orderedItems: store.getOrderedItems(),
    stats: store.stats,
    selectedStation: store.selectedStation,
    isConnected: store.isConnected,
    loading: store.loading,
    error: store.error,

    // Actions
    setSelectedStation: store.setSelectedStation,
    markServed,
    markAllServed,
    refresh: loadItems,
    clearError: store.clearError,

    // Computed
    pendingCount: store.getPendingCount(),
    getStationCount: store.getStationCount,
  };
}
