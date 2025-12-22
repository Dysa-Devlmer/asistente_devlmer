/**
 * Unit Tests for SalesRepository
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool, PoolClient } from 'pg';
import { SalesRepository, SaleDTO, SaleLineDTO } from '../repositories/SalesRepository';

describe('SalesRepository', () => {
  let pool: Pool;
  let repository: SalesRepository;
  let mockQuery: any;

  beforeEach(() => {
    mockQuery = vi.fn();
    pool = {
      query: mockQuery,
    } as any;
    repository = new SalesRepository(pool);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create new sale and return id_venta', async () => {
      const sale: SaleDTO = {
        Num_Mesa: '01',
        id_camarero: 'CAM001',
        id_caja: 1,
        cerrada: 'N',
        tarifa: 'Default',
        observaciones: 'Test sale',
      };

      mockQuery.mockResolvedValue({
        rows: [{ id_venta: 123 }],
      });

      const id_venta = await repository.create(sale);

      expect(id_venta).toBe(123);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ventadirecta'),
        ['01', 'CAM001', 1, 'N', 'Default', 'Test sale']
      );
    });
  });

  describe('findById', () => {
    it('should return sale with full details', async () => {
      const mockSale = {
        id_venta: 123,
        Num_Mesa: '01',
        id_camarero: 'CAM001',
        id_caja: 1,
        cerrada: 'N',
        tarifa: 'Default',
        fecha_venta: new Date(),
        mesa_descripcion: 'Mesa 1',
        camarero_nombre: 'Juan',
        num_items: '3',
        subtotal: '45.00',
        total_iva: '50.00',
      };

      const mockLines = [
        {
          id_linea: 1,
          id_venta: 123,
          id_complementog: 'PROD001',
          cantidad: 2,
          precio: 10.0,
          total: 22.0,
          avgiva: 10,
          servido: 'N',
          des_complementog: 'Producto 1',
        },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: [mockSale] })  // First query for sale
        .mockResolvedValueOnce({ rows: mockLines });  // Second query for lines

      const result = await repository.findById(123);

      expect(result).toBeDefined();
      expect(result?.id_venta).toBe(123);
      expect(result?.num_items).toBe(3);
      expect(result?.lineas).toHaveLength(1);
      expect(result?.lineas?.[0].des_complementog).toBe('Producto 1');
    });

    it('should return null when sale not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findOpenSales', () => {
    it('should return all open sales', async () => {
      const mockSales = [
        {
          id_venta: 123,
          Num_Mesa: '01',
          cerrada: 'N',
          num_items: '2',
          subtotal: '20.00',
          total_iva: '22.00',
        },
        {
          id_venta: 124,
          Num_Mesa: '02',
          cerrada: 'N',
          num_items: '3',
          subtotal: '30.00',
          total_iva: '33.00',
        },
      ];

      mockQuery.mockResolvedValue({ rows: mockSales });

      const result = await repository.findOpenSales();

      expect(result).toHaveLength(2);
      expect(result[0].num_items).toBe(2);
    });

    it('should filter by camarero when id_camarero provided', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await repository.findOpenSales('CAM001');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('v.id_camarero = $1'),
        ['CAM001']
      );
    });
  });

  describe('addLine', () => {
    it('should add line to sale and return id_linea', async () => {
      const line: SaleLineDTO = {
        id_venta: 123,
        id_complementog: 'PROD001',
        cantidad: 2,
        precio: 10.0,
        total: 22.0,
        avgiva: 10,
        servido: 'N',
        observaciones: 'Sin cebolla',
      };

      mockQuery.mockResolvedValue({
        rows: [{ id_linea: 456 }],
      });

      const id_linea = await repository.addLine(line);

      expect(id_linea).toBe(456);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ventadir_comg'),
        [123, 'PROD001', 2, 10.0, 22.0, 10, 'N', 'Sin cebolla']
      );
    });
  });

  describe('updateLine', () => {
    it('should update line cantidad and recalculate total', async () => {
      const updates = {
        cantidad: 3,
      };

      mockQuery.mockResolvedValue({});

      await repository.updateLine(456, updates);

      expect(mockQuery).toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ventadir_comg'),
        expect.arrayContaining([3, 456])
      );
    });

    it('should update observaciones without recalculation', async () => {
      const updates = {
        observaciones: 'Extra queso',
      };

      mockQuery.mockResolvedValue({});

      await repository.updateLine(456, updates);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ventadir_comg'),
        expect.arrayContaining(['Extra queso', 456])
      );
    });
  });

  describe('deleteLine', () => {
    it('should delete line from sale', async () => {
      mockQuery.mockResolvedValue({});

      await repository.deleteLine(456);

      expect(mockQuery).toHaveBeenCalledWith(
        'DELETE FROM ventadir_comg WHERE id_linea = $1',
        [456]
      );
    });
  });

  describe('update', () => {
    it('should update sale table and tarifa', async () => {
      const updates = {
        Num_Mesa: '02',
        tarifa: 'VIP',
      };

      mockQuery.mockResolvedValue({});

      await repository.update(123, updates);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE ventadirecta'),
        expect.arrayContaining(['02', 'VIP', 123])
      );
    });

    it('should close sale and set fecha_cierre', async () => {
      const updates = {
        cerrada: 'S' as const,
        total: 55.50,
        forma_pago: 'efectivo',
        importe_pagado: 60.0,
      };

      mockQuery.mockResolvedValue({});

      await repository.update(123, updates);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('cerrada = $'),
        expect.arrayContaining(['S', 55.50, 'efectivo', 60.0, 123])
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('fecha_cierre = NOW()'),
        expect.anything()
      );
    });
  });

  describe('getProductPrice', () => {
    it('should return price according to tarifa', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            pvp: 12.50,
            avgiva: 10,
          },
        ],
      });

      const result = await repository.getProductPrice('PROD001', 'VIP');

      expect(result.pvp).toBe(12.50);
      expect(result.avgiva).toBe(10);
    });

    it('should throw error when product not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await expect(
        repository.getProductPrice('INVALID', 'Default')
      ).rejects.toThrow('Product INVALID not found');
    });
  });

  describe('recalculateLinesForRate', () => {
    it('should recalculate all line prices for new rate', async () => {
      const mockLines = [
        {
          id_linea: 1,
          id_complementog: 'PROD001',
          cantidad: 2,
          precio: 10.0,
        },
      ];

      // Create a mock client with proper query mocking
      const mockClientQuery = vi.fn();
      const mockClient = {
        query: mockClientQuery,
      } as any;

      // Mock the sequence of calls
      mockClientQuery
        .mockResolvedValueOnce({ rows: mockLines })  // Get lines
        .mockResolvedValueOnce({});  // Update line 1

      // Mock pool.query for getProductPrice
      mockQuery.mockResolvedValue({ rows: [{ pvp: 12.0, avgiva: 10 }] });

      await repository.recalculateLinesForRate(123, 'VIP', mockClient);

      expect(mockClientQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ventadir_comg'),
        [123]
      );
    });
  });

  describe('getKitchenPending', () => {
    it('should return pending kitchen orders', async () => {
      const mockOrders = [
        {
          id_venta: 123,
          Num_Mesa: '01',
          id_camarero: 'CAM001',
          nombre_camarero: 'Juan',
          fecha_venta: new Date(),
          lineas_pendientes: [
            {
              id_linea: 1,
              id_complementog: 'PROD001',
              des_producto: 'Pizza',
              cantidad: 2,
              observaciones: 'Sin cebolla',
              fecha_hora: new Date(),
            },
          ],
        },
      ];

      mockQuery.mockResolvedValue({ rows: mockOrders });

      const result = await repository.getKitchenPending();

      expect(result).toHaveLength(1);
      expect(result[0].lineas_pendientes).toHaveLength(1);
      expect(result[0].lineas_pendientes[0].des_producto).toBe('Pizza');
    });
  });
});
