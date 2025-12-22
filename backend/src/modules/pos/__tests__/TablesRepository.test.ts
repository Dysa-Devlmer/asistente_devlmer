/**
 * Unit Tests for TablesRepository
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import { TablesRepository } from '../repositories/TablesRepository';

describe('TablesRepository', () => {
  let pool: Pool;
  let repository: TablesRepository;
  let mockQuery: any;

  beforeEach(() => {
    mockQuery = vi.fn();
    pool = {
      query: mockQuery,
    } as any;
    repository = new TablesRepository(pool);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all tables with current status', async () => {
      const mockTables = [
        {
          Num_Mesa: '01',
          descripcion: 'Mesa 1',
          id_salon: 'SALON1',
          id_tarifa: 1,
          top: 100,
          izq: 100,
          width: 120,
          height: 120,
          estado: 'libre',
          id_venta: null,
          tarifa_nombre: 'Default',
          venta_total: null,
          venta_items: null,
        },
        {
          Num_Mesa: '02',
          descripcion: 'Mesa 2',
          id_salon: 'SALON1',
          id_tarifa: 1,
          top: 250,
          izq: 100,
          width: 120,
          height: 120,
          estado: 'libre',
          id_venta: 123,
          tarifa_nombre: 'Default',
          venta_total: 45.50,
          venta_items: 3,
        },
      ];

      mockQuery.mockResolvedValue({ rows: mockTables });

      const result = await repository.findAll();

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0].estado).toBe('libre');
      expect(result[1].estado).toBe('ocupada'); // Should be 'ocupada' because id_venta exists
    });

    it('should filter by salon when id_salon is provided', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await repository.findAll('SALON1');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('m.id_salon = $1'),
        ['SALON1']
      );
    });
  });

  describe('findByNumber', () => {
    it('should return table by number', async () => {
      const mockTable = {
        Num_Mesa: '01',
        descripcion: 'Mesa 1',
        id_salon: 'SALON1',
        id_tarifa: 1,
        top: 100,
        izq: 100,
        width: 120,
        height: 120,
        estado: 'libre',
        id_venta: null,
        tarifa_nombre: 'Default',
        venta_total: null,
        venta_items: null,
      };

      mockQuery.mockResolvedValue({ rows: [mockTable] });

      const result = await repository.findByNumber('01');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('m."Num_Mesa" = $1'),
        ['01']
      );
      expect(result).toEqual(expect.objectContaining({
        Num_Mesa: '01',
        estado: 'libre',
      }));
    });

    it('should return null when table not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await repository.findByNumber('99');

      expect(result).toBeNull();
    });

    it('should mark table as ocupada when it has active sale', async () => {
      const mockTable = {
        Num_Mesa: '01',
        descripcion: 'Mesa 1',
        id_salon: 'SALON1',
        id_tarifa: 1,
        top: 100,
        izq: 100,
        width: 120,
        height: 120,
        estado: 'libre',
        id_venta: 456,
        tarifa_nombre: 'Default',
        venta_total: 78.90,
        venta_items: 5,
      };

      mockQuery.mockResolvedValue({ rows: [mockTable] });

      const result = await repository.findByNumber('01');

      expect(result?.estado).toBe('ocupada');
    });
  });

  describe('getTableRate', () => {
    it('should return table rate when exists', async () => {
      const mockRate = {
        id_tarifa: 2,
        nombre: 'VIP',
      };

      mockQuery.mockResolvedValue({ rows: [mockRate] });

      const result = await repository.getTableRate('01');

      expect(result).toEqual(mockRate);
    });

    it('should return null when table has no rate', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await repository.getTableRate('01');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update table status', async () => {
      mockQuery.mockResolvedValue({});

      await repository.updateStatus('01', 'ocupada');

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE mesa SET estado = $1 WHERE "Num_Mesa" = $2',
        ['ocupada', '01']
      );
    });
  });

  describe('isAvailable', () => {
    it('should return true when table has no active sales', async () => {
      mockQuery.mockResolvedValue({ rows: [{ count: '0' }] });

      const result = await repository.isAvailable('01');

      expect(result).toBe(true);
    });

    it('should return false when table has active sale', async () => {
      mockQuery.mockResolvedValue({ rows: [{ count: '1' }] });

      const result = await repository.isAvailable('01');

      expect(result).toBe(false);
    });
  });

  describe('getOccupiedCount', () => {
    it('should return count of occupied tables', async () => {
      mockQuery.mockResolvedValue({ rows: [{ count: '5' }] });

      const result = await repository.getOccupiedCount();

      expect(result).toBe(5);
    });
  });
});
