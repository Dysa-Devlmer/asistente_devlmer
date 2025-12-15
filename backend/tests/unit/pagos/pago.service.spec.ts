/**
 * Unit Tests - Pago Service
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PagoService } from '../../../src/modules/pagos/services/pago.service';
import { CrearPagoDto, MetodoPago } from '../../../src/modules/pagos/dto/pago.dto';
import {
  VentaNotFoundError,
  InvalidAmountError,
  InsufficientCashError,
} from '../../../src/common/errors/typed-errors';

// Mock del Pool de MySQL
const mockDb: any = {
  execute: jest.fn(),
  getConnection: jest.fn(() => ({
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    release: jest.fn(),
    execute: jest.fn(),
  })),
};

describe('PagoService', () => {
  let service: PagoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PagoService(mockDb);
  });

  describe('crearPago - Efectivo', () => {
    const validDto: CrearPagoDto = {
      venta_id: '660e8400-e29b-41d4-a716-446655440001',
      sesion_caja_id: '770e8400-e29b-41d4-a716-446655440002',
      forma_pago_id: '880e8400-e29b-41d4-a716-446655440003',
      empleado_id: '990e8400-e29b-41d4-a716-446655440004',
      monto: 15000,
      metodo: MetodoPago.EFECTIVO,
      monto_recibido: 20000,
    };

    it('debe crear pago en efectivo exitosamente', async () => {
      // Mock: pago no existe (idempotencia)
      mockDb.execute.mockResolvedValueOnce([[]]); // obtenerPorId
      // Mock: venta existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]); // existeVenta
      // Mock: forma pago existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]); // existeFormaPago
      // Mock: crear pago
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // Mock: actualizar pago
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await service.crearPago(validDto);

      expect(result).toHaveProperty('pago_id');
      expect(result).toHaveProperty('estado', 'approved');
      expect(result).toHaveProperty('monto', 15000);
      expect(result).toHaveProperty('monto_recibido', 20000);
      expect(result).toHaveProperty('monto_cambio', 5000);
    });

    it('debe lanzar error si venta no existe', async () => {
      mockDb.execute.mockResolvedValueOnce([[]]); // pago no existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 0 }]]); // venta NO existe

      await expect(service.crearPago(validDto)).rejects.toThrow(VentaNotFoundError);
    });

    it('debe lanzar error si monto es inválido', async () => {
      const invalidDto = { ...validDto, monto: -100 };

      mockDb.execute.mockResolvedValueOnce([[]]); // pago no existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]); // venta existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]); // forma pago existe

      await expect(service.crearPago(invalidDto as any)).rejects.toThrow(InvalidAmountError);
    });

    it('debe lanzar error si efectivo recibido es insuficiente', async () => {
      const insufficientDto = { ...validDto, monto_recibido: 10000 }; // menos que monto

      mockDb.execute.mockResolvedValueOnce([[]]); // pago no existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]); // venta existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]); // forma pago existe

      await expect(service.crearPago(insufficientDto)).rejects.toThrow(InsufficientCashError);
    });

    it('debe ser idempotente (retornar pago existente)', async () => {
      const pagoExistente = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        numero_pago: null,
        venta_id: validDto.venta_id,
        sesion_caja_id: validDto.sesion_caja_id,
        monto: '15000.00',
        monto_pagado: '15000.00',
        monto_recibido: '20000.00',
        monto_cambio: '5000.00',
        estado: 'approved',
        metodo: 'efectivo',
        fecha_inicio: new Date(),
        fecha_completado: new Date(),
        empleado_id: validDto.empleado_id,
      };

      mockDb.execute.mockResolvedValueOnce([[pagoExistente]]); // pago YA existe

      const result = await service.crearPago({
        ...validDto,
        pago_id: pagoExistente.id,
      });

      expect(result).toHaveProperty('pago_id', pagoExistente.id);
      expect(result).toHaveProperty('estado', 'approved');
    });
  });

  describe('crearPago - Webpay', () => {
    const validDto: CrearPagoDto = {
      venta_id: '660e8400-e29b-41d4-a716-446655440001',
      forma_pago_id: '880e8400-e29b-41d4-a716-446655440003',
      empleado_id: '990e8400-e29b-41d4-a716-446655440004',
      monto: 15000,
      metodo: MetodoPago.WEBPAY,
    };

    it('debe iniciar pago Webpay exitosamente', async () => {
      mockDb.execute.mockResolvedValueOnce([[]]); // pago no existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]); // venta existe
      mockDb.execute.mockResolvedValueOnce([[{ existe: 1 }]]); // forma pago existe
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // crear pago
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // actualizar con token
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // crear intento

      const result = await service.crearPago(validDto);

      expect(result).toHaveProperty('pago_id');
      expect(result).toHaveProperty('estado', 'processing');
      expect(result).toHaveProperty('webpay_token');
      expect(result).toHaveProperty('webpay_url');
    });
  });
});
