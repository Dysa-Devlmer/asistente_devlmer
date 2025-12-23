/**
 * Unit Tests for KitchenOrderCard Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KitchenOrderCard } from '../KitchenOrderCard';
import type { KitchenOrder } from '../../../../types/pos';

describe('KitchenOrderCard', () => {
  const mockOnMarkServed = vi.fn();
  const mockOnMarkAllServed = vi.fn();

  const mockOrder: KitchenOrder = {
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
        nota: 'Sin cebolla',
        observaciones: 'Urgente',
      },
      {
        id_venta: 1,
        id_linea: 2,
        num_mesa: '01',
        fecha_venta: '2025-01-22',
        hora: '12:00:00',
        complementog: 'Pizza Margherita',
        cantidad: 1,
        servido_cocina: 0,
        pendingQty: 1,
        bloque_cocina: 2,
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
            nota: 'Sin cebolla',
            observaciones: 'Urgente',
          },
        ],
      ],
      [
        2,
        [
          {
            id_venta: 1,
            id_linea: 2,
            num_mesa: '01',
            fecha_venta: '2025-01-22',
            hora: '12:00:00',
            complementog: 'Pizza Margherita',
            cantidad: 1,
            servido_cocina: 0,
            pendingQty: 1,
            bloque_cocina: 2,
            nota: '',
            observaciones: '',
          },
        ],
      ],
    ]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date.now() for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-22 12:10:00')); // 10 minutes after order
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Order Header', () => {
    it('should display mesa number', () => {
      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );
      expect(screen.getByText(/Mesa 01/i)).toBeInTheDocument();
    });

    it('should display order ID', () => {
      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );
      expect(screen.getByText(/Pedido #1/i)).toBeInTheDocument();
    });

    it('should display order age in minutes', () => {
      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );
      expect(screen.getByText(/10 min/i)).toBeInTheDocument();
    });

    it('should display order time', () => {
      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );
      // Time should be formatted as HH:MM
      expect(screen.getByText(/12:00/i)).toBeInTheDocument();
    });
  });

  describe('Urgency Color Coding', () => {
    it('should use green color for orders less than 10 minutes old', () => {
      vi.setSystemTime(new Date('2025-01-22 12:05:00')); // 5 minutes after order

      const { container } = render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('bg-green-100', 'border-green-300');
    });

    it('should use yellow color for orders 10-19 minutes old', () => {
      vi.setSystemTime(new Date('2025-01-22 12:15:00')); // 15 minutes after order

      const { container } = render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('bg-yellow-100', 'border-yellow-300');
    });

    it('should use red color for orders 20+ minutes old', () => {
      vi.setSystemTime(new Date('2025-01-22 12:25:00')); // 25 minutes after order

      const { container } = render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('bg-red-100', 'border-red-300');
    });
  });

  describe('Mark All Served Button', () => {
    it('should display "Mark All Served" button', () => {
      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );
      expect(screen.getByText(/Marcar Todo Servido/i)).toBeInTheDocument();
    });

    it('should call onMarkAllServed when clicked', async () => {
      mockOnMarkAllServed.mockResolvedValue(undefined);

      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const markAllButton = screen.getByText(/Marcar Todo Servido/i);
      fireEvent.click(markAllButton);

      await waitFor(() => {
        expect(mockOnMarkAllServed).toHaveBeenCalledWith(1);
      });
    });

    it('should show loading state when marking all served', async () => {
      mockOnMarkAllServed.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const markAllButton = screen.getByText(/Marcar Todo Servido/i);
      fireEvent.click(markAllButton);

      expect(await screen.findByText(/Marcando.../i)).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/Marcando.../i)).not.toBeInTheDocument();
      });
    });

    it('should disable button while loading', async () => {
      mockOnMarkAllServed.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const markAllButton = screen.getByText(/Marcar Todo Servido/i);
      fireEvent.click(markAllButton);

      await waitFor(() => {
        expect(markAllButton).toBeDisabled();
      });
    });
  });

  describe('Station Grouping', () => {
    it('should group items by station', () => {
      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      // Should show both station names
      expect(screen.getByText(/Parrilla/i)).toBeInTheDocument();
      expect(screen.getByText(/Fríos/i)).toBeInTheDocument();
    });

    it('should display items under correct station', () => {
      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      expect(screen.getByText('Hamburguesa')).toBeInTheDocument();
      expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
    });

    it('should sort stations by station number', () => {
      const { container } = render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const stationHeaders = container.querySelectorAll('h4');
      const stationNames = Array.from(stationHeaders).map((h) => h.textContent);

      // First should be station 1 (Parrilla), then station 2 (Fríos)
      expect(stationNames[0]).toContain('Parrilla');
      expect(stationNames[1]).toContain('Fríos');
    });
  });

  describe('Item Display', () => {
    it('should display item quantity and name', () => {
      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      expect(screen.getByText(/2x/i)).toBeInTheDocument();
      expect(screen.getByText('Hamburguesa')).toBeInTheDocument();
      expect(screen.getByText(/1x/i)).toBeInTheDocument();
      expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
    });

    it('should display item notes when present', () => {
      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      expect(screen.getByText(/Sin cebolla/i)).toBeInTheDocument();
    });

    it('should display item observations when present', () => {
      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      expect(screen.getByText(/Urgente/i)).toBeInTheDocument();
    });

    it('should not display notes section when no notes or observations', () => {
      const orderWithoutNotes = {
        ...mockOrder,
        items: [
          {
            ...mockOrder.items[1],
            nota: '',
            observaciones: '',
          },
        ],
        itemsByStation: new Map([
          [
            2,
            [
              {
                ...mockOrder.items[1],
                nota: '',
                observaciones: '',
              },
            ],
          ],
        ]),
      };

      render(
        <KitchenOrderCard
          order={orderWithoutNotes}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      // Nota emoji should not be present
      expect(screen.queryByText(/📝/)).not.toBeInTheDocument();
      // Observation emoji should not be present
      expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
    });
  });

  describe('Mark Item Served Button', () => {
    it('should display "OK" button for each item', () => {
      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const okButtons = screen.getAllByText(/✓ OK/i);
      expect(okButtons).toHaveLength(2); // One for each item
    });

    it('should call onMarkServed with correct parameters when clicked', async () => {
      mockOnMarkServed.mockResolvedValue(undefined);

      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const okButtons = screen.getAllByText(/✓ OK/i);
      fireEvent.click(okButtons[0]);

      await waitFor(() => {
        expect(mockOnMarkServed).toHaveBeenCalledWith(1, 1);
      });
    });

    it('should show loading spinner on specific item being marked', async () => {
      mockOnMarkServed.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const okButtons = screen.getAllByText(/✓ OK/i);
      fireEvent.click(okButtons[0]);

      // Should show spinner (animated div with border-spin class)
      await waitFor(() => {
        const spinners = document.querySelectorAll('.animate-spin');
        expect(spinners.length).toBeGreaterThan(0);
      });
    });

    it('should disable button while marking item', async () => {
      mockOnMarkServed.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const okButtons = screen.getAllByText(/✓ OK/i);
      fireEvent.click(okButtons[0]);

      await waitFor(() => {
        expect(okButtons[0]).toBeDisabled();
      });
    });

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnMarkServed.mockRejectedValue(new Error('Network error'));

      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const okButtons = screen.getAllByText(/✓ OK/i);
      fireEvent.click(okButtons[0]);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have button titles for screen readers', () => {
      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const markServedButtons = screen.getAllByTitle('Marcar como servido');
      expect(markServedButtons.length).toBeGreaterThan(0);
    });

    it('should disable buttons appropriately during loading', async () => {
      mockOnMarkServed.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <KitchenOrderCard
          order={mockOrder}
          onMarkServed={mockOnMarkServed}
          onMarkAllServed={mockOnMarkAllServed}
        />
      );

      const okButtons = screen.getAllByText(/✓ OK/i);
      fireEvent.click(okButtons[0]);

      await waitFor(() => {
        expect(okButtons[0]).toBeDisabled();
        expect(okButtons[0]).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
      });
    });
  });
});
