/**
 * Unit Tests - Sesión de Caja Service
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SesionCajaService } from '../../../src/modules/caja/services/sesion-caja.service';
import { AbrirCajaDto, CerrarCajaDto } from '../../../src/modules/caja/dto/sesion-caja.dto';
import {
  CajaAlreadyOpenError,
  CajaNotOpenError,
  SucursalNotFoundError,
  EmpleadoNotFoundError,
} from '../../../src/common/errors/typed-errors';

// Mock del Pool de MySQL
const mockDb: any = {
  execute: jest.fn(),
  getConnection: jest.fn(() => ({
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
  })),
};

describe('SesionCajaService', () => {
  let service: SesionCajaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SesionCajaService(mockDb);
  });

  describe('abrirCaja', () => {
    const validDto: AbrirCajaDto = {
      sucursal_id: '550e8400-e29b-41d4-a716-446655440000',
      empleado_id: '660e8400-e29b-41d4-a716-446655440001',
      monto_inicial: 1000,
    };

    it('debe abrir caja exitosamente', async () => {
      // Mock: sesión no existe (idempotencia)
      mockDb.execute.mockResolvedValueOnce([[]]);
      // Mock: sucursal existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]);
      // Mock: empleado existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]);
      // Mock: no hay sesión abierta
      mockDb.execute.mockResolvedValueOnce([[]]);

      const result = await service.abrirCaja(validDto);

      expect(result).toHaveProperty('sesion_id');
      expect(result).toHaveProperty('numero_sesion');
      expect(result.sucursal_id).toBe(validDto.sucursal_id);
      expect(result.monto_inicial).toBe(validDto.monto_inicial);
      expect(result.estado).toBe('abierta');
    });

    it('debe lanzar error si sucursal no existe', async () => {
      // Mock: sesión no existe
      mockDb.execute.mockResolvedValueOnce([[]]);
      // Mock: sucursal NO existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 0 }]]);

      await expect(service.abrirCaja(validDto)).rejects.toThrow(SucursalNotFoundError);
    });

    it('debe lanzar error si empleado no existe', async () => {
      // Mock: sesión no existe
      mockDb.execute.mockResolvedValueOnce([[]]);
      // Mock: sucursal existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]);
      // Mock: empleado NO existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 0 }]]);

      await expect(service.abrirCaja(validDto)).rejects.toThrow(EmpleadoNotFoundError);
    });

    it('debe lanzar error si ya hay caja abierta', async () => {
      const sesionActivaId = '770e8400-e29b-41d4-a716-446655440002';

      // Mock: sesión no existe
      mockDb.execute.mockResolvedValueOnce([[]]);
      // Mock: sucursal existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]);
      // Mock: empleado existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]);
      // Mock: SÍ hay sesión abierta
      mockDb.execute.mockResolvedValueOnce([[{ id: sesionActivaId }]]);

      await expect(service.abrirCaja(validDto)).rejects.toThrow(CajaAlreadyOpenError);
    });

    it('debe ser idempotente (retornar sesión existente)', async () => {
      const sesionExistente = {
        id: '770e8400-e29b-41d4-a716-446655440002',
        numero_sesion: 123,
        sucursal_id: validDto.sucursal_id,
        empleado_apertura_id: validDto.empleado_id,
        fecha_apertura: new Date(),
        monto_inicial: '1000.00',
        estado: 'abierta',
        notas_apertura: null,
      };

      // Mock: sesión ya existe
      mockDb.execute.mockResolvedValueOnce([[sesionExistente]]);

      const result = await service.abrirCaja({
        ...validDto,
        sesion_id: sesionExistente.id,
      });

      expect(result.sesion_id).toBe(sesionExistente.id);
      expect(result.numero_sesion).toBe(sesionExistente.numero_sesion);
    });
  });

  describe('cerrarCaja', () => {
    const validDto: CerrarCajaDto = {
      sesion_id: '770e8400-e29b-41d4-a716-446655440002',
      empleado_id: '660e8400-e29b-41d4-a716-446655440001',
      monto_final_real: 5250,
    };

    it('debe cerrar caja exitosamente', async () => {
      const sesion = {
        id: validDto.sesion_id,
        numero_sesion: 123,
        sucursal_id: '550e8400-e29b-41d4-a716-446655440000',
        empleado_apertura_id: '660e8400-e29b-41d4-a716-446655440001',
        fecha_apertura: new Date(),
        monto_inicial: '1000.00',
        estado: 'abierta',
      };

      // Mock: sesión existe y está abierta
      mockDb.execute.mockResolvedValueOnce([[sesion]]);
      // Mock: empleado existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]);
      // Mock: calcular totales
      mockDb.execute.mockResolvedValueOnce([[{ total: '500.00' }]]); // ingresos
      mockDb.execute.mockResolvedValueOnce([[{ total: '200.00' }]]); // egresos
      mockDb.execute.mockResolvedValueOnce([[{ total_efectivo: '4000.00' }]]); // efectivo

      // Mock: totales por forma de pago
      mockDb.execute.mockResolvedValueOnce([[]]);
      // Mock: movimientos
      mockDb.execute.mockResolvedValueOnce([[]]);
      // Mock: empleados
      mockDb.execute.mockResolvedValueOnce([[{ id: sesion.empleado_apertura_id, nombre: 'Juan', apellido: 'Pérez' }]]);
      mockDb.execute.mockResolvedValueOnce([[{ id: validDto.empleado_id, nombre: 'María', apellido: 'González' }]]);
      // Mock: contar ventas
      mockDb.execute.mockResolvedValueOnce([[{ cantidad_ventas: 10 }]]);
      // Mock: total ventas
      mockDb.execute.mockResolvedValueOnce([[{ total_ventas: '4000.00' }]]);

      const result = await service.cerrarCaja(validDto);

      expect(result).toHaveProperty('sesion_id');
      expect(result).toHaveProperty('monto_final_esperado');
      expect(result).toHaveProperty('monto_final_real');
      expect(result).toHaveProperty('diferencia');
      expect(result.estado).toBe('cerrada');
    });

    it('debe lanzar error si sesión no existe', async () => {
      // Mock: sesión NO existe
      mockDb.execute.mockResolvedValueOnce([[]]);

      await expect(service.cerrarCaja(validDto)).rejects.toThrow();
    });

    it('debe ser idempotente (retornar cierre existente)', async () => {
      const sesionCerrada = {
        id: validDto.sesion_id,
        numero_sesion: 123,
        estado: 'cerrada',
        monto_final_esperado: '5230.50',
        monto_final_real: '5250.00',
        diferencia: '19.50',
        fecha_apertura: new Date(),
        fecha_cierre: new Date(),
      };

      // Mock: sesión ya está cerrada
      mockDb.execute.mockResolvedValueOnce([[sesionCerrada]]);

      const result = await service.cerrarCaja(validDto);

      expect(result.estado).toBe('cerrada');
      expect(result.sesion_id).toBe(validDto.sesion_id);
    });
  });

  describe('obtenerSesionActiva', () => {
    it('debe retornar sesión activa si existe', async () => {
      const sucursalId = '550e8400-e29b-41d4-a716-446655440000';
      const sesionActiva = {
        id: '770e8400-e29b-41d4-a716-446655440002',
        numero_sesion: 123,
        estado: 'abierta',
        fecha_apertura: new Date(),
        monto_inicial: '1000.00',
        empleado_apertura_id: '660e8400-e29b-41d4-a716-446655440001',
      };

      // Mock: sesión activa existe
      mockDb.execute.mockResolvedValueOnce([[sesionActiva]]);

      const result = await service.obtenerSesionActiva(sucursalId);

      expect(result).not.toBeNull();
      expect(result?.sesion_id).toBe(sesionActiva.id);
      expect(result?.estado).toBe('abierta');
    });

    it('debe retornar null si no hay sesión activa', async () => {
      const sucursalId = '550e8400-e29b-41d4-a716-446655440000';

      // Mock: no hay sesión activa
      mockDb.execute.mockResolvedValueOnce([[]]);

      const result = await service.obtenerSesionActiva(sucursalId);

      expect(result).toBeNull();
    });
  });
});
