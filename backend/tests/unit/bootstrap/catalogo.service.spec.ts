/**
 * Unit Tests - Catalogo Service
 *
 * Test Cases según: docs/ITERACION2-BOOTSTRAP-CATALOGO.md
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CatalogoService } from '../../../src/modules/bootstrap/services/catalogo.service';

describe('CatalogoService', () => {
  let service: CatalogoService;
  let mockDb: any;
  let mockCatalogoRepository: any;

  beforeEach(() => {
    // Mock database connection
    mockDb = {
      execute: jest.fn(),
    };

    service = new CatalogoService(mockDb);

    // Mock repository methods
    mockCatalogoRepository = {
      sucursalExists: jest.fn(),
      getCatalogo: jest.fn(),
    };

    // Inject mocked repository
    (service as any).catalogoRepository = mockCatalogoRepository;
  });

  describe('getCatalogo', () => {
    const validSucursalId = '550e8400-e29b-41d4-a716-446655440000';

    it('TC-PAG-001: debe retornar primera página con default limit', async () => {
      // Arrange
      mockCatalogoRepository.sucursalExists.mockResolvedValue(true);
      mockCatalogoRepository.getCatalogo.mockResolvedValue({
        productos: Array(50).fill({}),
        categorias: [],
        impuestos: [],
        formas_pago: [],
        pagination: {
          page: 1,
          limit: 50,
          total_items: 150,
          total_pages: 3,
          has_next: true,
          has_prev: false,
        },
      });

      // Act
      const result = await service.getCatalogo(validSucursalId);

      // Assert
      expect(result.bootstrap_version).toBe('2.0.0');
      expect(result.data.pagination.page).toBe(1);
      expect(result.data.pagination.limit).toBe(50);
      expect(result.data.pagination.total_items).toBe(150);
      expect(result.data.pagination.total_pages).toBe(3);
      expect(result.data.pagination.has_next).toBe(true);
      expect(result.data.pagination.has_prev).toBe(false);
      expect(result.data.catalogo.productos).toHaveLength(50);
    });

    it('TC-PAG-002: debe retornar última página correctamente', async () => {
      // Arrange
      mockCatalogoRepository.sucursalExists.mockResolvedValue(true);
      mockCatalogoRepository.getCatalogo.mockResolvedValue({
        productos: Array(50).fill({}),
        categorias: [],
        impuestos: [],
        formas_pago: [],
        pagination: {
          page: 3,
          limit: 50,
          total_items: 150,
          total_pages: 3,
          has_next: false,
          has_prev: true,
        },
      });

      // Act
      const result = await service.getCatalogo(validSucursalId, 3, 50);

      // Assert
      expect(result.data.pagination.page).toBe(3);
      expect(result.data.pagination.has_next).toBe(false);
      expect(result.data.pagination.has_prev).toBe(true);
    });

    it('TC-PAG-003: debe retornar página vacía cuando excede total_pages', async () => {
      // Arrange
      mockCatalogoRepository.sucursalExists.mockResolvedValue(true);
      mockCatalogoRepository.getCatalogo.mockResolvedValue({
        productos: [],
        categorias: [],
        impuestos: [],
        formas_pago: [],
        pagination: {
          page: 10,
          limit: 50,
          total_items: 150,
          total_pages: 3,
          has_next: false,
          has_prev: true,
        },
      });

      // Act
      const result = await service.getCatalogo(validSucursalId, 10, 50);

      // Assert
      expect(result.data.pagination.page).toBe(10);
      expect(result.data.catalogo.productos).toHaveLength(0);
    });

    it('TC-PAG-004: debe lanzar error cuando limit excede max (100)', async () => {
      // Arrange
      mockCatalogoRepository.sucursalExists.mockResolvedValue(true);

      // Act & Assert
      await expect(service.getCatalogo(validSucursalId, 1, 200)).rejects.toThrow(
        'limit max es 100'
      );
    });

    it('TC-PAG-005: debe lanzar error cuando limit es inválido (0)', async () => {
      // Arrange
      mockCatalogoRepository.sucursalExists.mockResolvedValue(true);

      // Act & Assert
      await expect(service.getCatalogo(validSucursalId, 1, 0)).rejects.toThrow(
        'limit debe ser >= 1'
      );
    });

    it('debe lanzar error cuando page es menor a 1', async () => {
      // Arrange
      mockCatalogoRepository.sucursalExists.mockResolvedValue(true);

      // Act & Assert
      await expect(service.getCatalogo(validSucursalId, 0, 50)).rejects.toThrow(
        'page debe ser >= 1'
      );
    });

    it('debe lanzar error cuando sucursal no existe', async () => {
      // Arrange
      mockCatalogoRepository.sucursalExists.mockResolvedValue(false);

      // Act & Assert
      await expect(service.getCatalogo(validSucursalId, 1, 50)).rejects.toThrow(
        'Sucursal con ID'
      );
    });

    it('debe incluir bootstrap_version y generated_at en response', async () => {
      // Arrange
      mockCatalogoRepository.sucursalExists.mockResolvedValue(true);
      mockCatalogoRepository.getCatalogo.mockResolvedValue({
        productos: [],
        categorias: [],
        impuestos: [],
        formas_pago: [],
        pagination: {
          page: 1,
          limit: 50,
          total_items: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false,
        },
      });

      // Act
      const result = await service.getCatalogo(validSucursalId);

      // Assert
      expect(result.bootstrap_version).toBe('2.0.0');
      expect(result.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
