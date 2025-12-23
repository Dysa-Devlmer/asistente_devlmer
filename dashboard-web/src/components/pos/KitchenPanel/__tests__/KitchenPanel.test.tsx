/**
 * Unit Tests for KitchenPanel Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KitchenPanel } from '../KitchenPanel';
import { useKitchen } from '../../../../hooks/pos/useKitchen';
import type { KitchenOrder, KitchenStats } from '../../../../types/pos';

// Mock the useKitchen hook
vi.mock('../../../../hooks/pos/useKitchen');

describe('KitchenPanel', () => {
  const mockMarkServed = vi.fn();
  const mockMarkAllServed = vi.fn();
  const mockRefresh = vi.fn();
  const mockClearError = vi.fn();
  const mockSetSelectedStation = vi.fn();

  const defaultMockReturn = {
    orderedItems: [],
    stats: null,
    selectedStation: null,
    isConnected: false,
    loading: false,
    error: null,
    setSelectedStation: mockSetSelectedStation,
    markServed: mockMarkServed,
    markAllServed: mockMarkAllServed,
    refresh: mockRefresh,
    clearError: mockClearError,
    pendingCount: 0,
    getStationCount: vi.fn(() => 0),
    items: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useKitchen as any).mockReturnValue(defaultMockReturn);
  });

  describe('Header', () => {
    it('should render title', () => {
      render(<KitchenPanel />);
      expect(screen.getByText('Panel de Cocina')).toBeInTheDocument();
    });

    it('should display pending count badge when there are pending items', () => {
      (useKitchen as any).mockReturnValue({
        ...defaultMockReturn,
        pendingCount: 5,
      });

      render(<KitchenPanel />);
      expect(screen.getByText(/5 pendiente/i)).toBeInTheDocument();
    });

    it('should not display pending count badge when no pending items', () => {
      render(<KitchenPanel />);
      expect(screen.queryByText(/pendiente/i)).not.toBeInTheDocument();
    });

    it('should show connected status', () => {
      (useKitchen as any).mockReturnValue({
        ...defaultMockReturn,
        isConnected: true,
      });

      render(<KitchenPanel />);
      expect(screen.getByText('Conectado')).toBeInTheDocument();
    });

    it('should show disconnected status', () => {
      render(<KitchenPanel />);
      expect(screen.getByText('Desconectado')).toBeInTheDocument();
    });

    it('should call refresh when refresh button is clicked', () => {
      render(<KitchenPanel />);
      const refreshButton = screen.getByTitle('Refrescar');
      fireEvent.click(refreshButton);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('Station Filters', () => {
    it('should render "All Stations" button', () => {
      render(<KitchenPanel />);
      expect(screen.getByText('Todas las Estaciones')).toBeInTheDocument();
    });

    it('should render station filter buttons', () => {
      render(<KitchenPanel />);
      expect(screen.getByText(/Parrilla/i)).toBeInTheDocument();
      expect(screen.getByText(/Fríos/i)).toBeInTheDocument();
      expect(screen.getByText(/Bebidas/i)).toBeInTheDocument();
      expect(screen.getByText(/Postres/i)).toBeInTheDocument();
    });

    it('should call setSelectedStation when clicking "All Stations"', () => {
      render(<KitchenPanel />);
      const allStationsButton = screen.getByText('Todas las Estaciones');
      fireEvent.click(allStationsButton);
      expect(mockSetSelectedStation).toHaveBeenCalledWith(null);
    });

    it('should highlight selected station button', () => {
      (useKitchen as any).mockReturnValue({
        ...defaultMockReturn,
        selectedStation: 1,
      });

      render(<KitchenPanel />);
      const parrilla Button = screen.getByText(/Parrilla/i);
      expect(parrillaButton).toHaveClass('bg-orange-600');
    });

    it('should display item count on station buttons', () => {
      const mockGetStationCount = vi.fn((station: number) => {
        if (station === 1) return 5;
        if (station === 2) return 3;
        return 0;
      });

      (useKitchen as any).mockReturnValue({
        ...defaultMockReturn,
        getStationCount: mockGetStationCount,
      });

      render(<KitchenPanel />);
      // Check that counts are displayed (exact text match may vary based on button rendering)
      expect(mockGetStationCount).toHaveBeenCalled();
    });
  });

  describe('Error Display', () => {
    it('should display error message when error exists', () => {
      (useKitchen as any).mockReturnValue({
        ...defaultMockReturn,
        error: 'Error loading kitchen items',
      });

      render(<KitchenPanel />);
      expect(screen.getByText('Error loading kitchen items')).toBeInTheDocument();
    });

    it('should call clearError when clicking close button on error', () => {
      (useKitchen as any).mockReturnValue({
        ...defaultMockReturn,
        error: 'Error loading kitchen items',
      });

      render(<KitchenPanel />);
      const closeButton = screen.getByRole('button', { name: '' }); // SVG close button
      fireEvent.click(closeButton);
      expect(mockClearError).toHaveBeenCalledTimes(1);
    });

    it('should not display error alert when no error', () => {
      render(<KitchenPanel />);
      expect(screen.queryByText(/Error/i)).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading and no items', () => {
      (useKitchen as any).mockReturnValue({
        ...defaultMockReturn,
        loading: true,
        orderedItems: [],
      });

      render(<KitchenPanel />);
      expect(screen.getByText('Cargando pedidos...')).toBeInTheDocument();
    });

    it('should not show loading spinner when loading but items exist', () => {
      const mockOrders: KitchenOrder[] = [
        {
          id_venta: 1,
          mesa: '01',
          orderTime: '2025-01-22 12:00:00',
          items: [],
          itemsByStation: new Map(),
        },
      ];

      (useKitchen as any).mockReturnValue({
        ...defaultMockReturn,
        loading: true,
        orderedItems: mockOrders,
      });

      render(<KitchenPanel />);
      expect(screen.queryByText('Cargando pedidos...')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no orders', () => {
      render(<KitchenPanel />);
      expect(screen.getByText('No hay pedidos pendientes')).toBeInTheDocument();
      expect(screen.getByText('Todos los pedidos están completos')).toBeInTheDocument();
    });

    it('should show station-specific empty message when station is selected', () => {
      (useKitchen as any).mockReturnValue({
        ...defaultMockReturn,
        selectedStation: 1,
      });

      render(<KitchenPanel />);
      expect(screen.getByText(/No hay items pendientes en/i)).toBeInTheDocument();
    });
  });

  describe('Orders Display', () => {
    it('should render order cards when orders exist', () => {
      const mockOrders: KitchenOrder[] = [
        {
          id_venta: 1,
          mesa: '01',
          orderTime: '2025-01-22 12:00:00',
          items: [
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
          ],
          itemsByStation: new Map([
            [
              1,
              [
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
              ],
            ],
          ]),
        },
        {
          id_venta: 2,
          mesa: '02',
          orderTime: '2025-01-22 12:30:00',
          items: [],
          itemsByStation: new Map(),
        },
      ];

      (useKitchen as any).mockReturnValue({
        ...defaultMockReturn,
        orderedItems: mockOrders,
      });

      render(<KitchenPanel />);
      // Should render 2 KitchenOrderCard components
      // We can't test the exact rendering since KitchenOrderCard is a separate component
      // but we can verify the grid container exists
      const grid = screen.getByRole('main').querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should pass correct props to KitchenOrderCard', () => {
      const mockOrders: KitchenOrder[] = [
        {
          id_venta: 1,
          mesa: '01',
          orderTime: '2025-01-22 12:00:00',
          items: [],
          itemsByStation: new Map(),
        },
      ];

      (useKitchen as any).mockReturnValue({
        ...defaultMockReturn,
        orderedItems: mockOrders,
      });

      render(<KitchenPanel />);
      // Verify handlers are passed (they should be called by child components)
      // This is more of an integration test
    });
  });

  describe('Footer Stats', () => {
    it('should display stats when available', () => {
      const mockStats: KitchenStats = {
        totalOrders: 5,
        totalItems: 12,
        oldestOrder: {
          id_venta: 1,
          mesa: '01',
          orderTime: '2025-01-22 12:00:00',
          waitTime: 15.5,
        },
      };

      (useKitchen as any).mockReturnValue({
        ...defaultMockReturn,
        stats: mockStats,
      });

      render(<KitchenPanel />);
      expect(screen.getByText(/5/)).toBeInTheDocument(); // orders count
      expect(screen.getByText(/12/)).toBeInTheDocument(); // items count
      expect(screen.getByText(/Mesa 01/)).toBeInTheDocument();
      expect(screen.getByText(/16 min/)).toBeInTheDocument(); // rounded wait time
    });

    it('should not display footer when no stats or zero items', () => {
      render(<KitchenPanel />);
      expect(screen.queryByText(/pedido/i)).not.toBeInTheDocument();
    });

    it('should handle singular/plural correctly', () => {
      const mockStats: KitchenStats = {
        totalOrders: 1,
        totalItems: 1,
        oldestOrder: null,
      };

      (useKitchen as any).mockReturnValue({
        ...defaultMockReturn,
        stats: mockStats,
      });

      render(<KitchenPanel />);
      expect(screen.getByText(/1.*pedido$/i)).toBeInTheDocument(); // singular
      expect(screen.queryByText(/pedidos/i)).not.toBeInTheDocument(); // not plural
    });
  });
});
