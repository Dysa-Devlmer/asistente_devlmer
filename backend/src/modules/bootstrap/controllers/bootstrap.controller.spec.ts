import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BootstrapController } from './bootstrap.controller';
import { BootstrapService } from '../services/bootstrap.service';
import { TipoDispositivo } from '../dto/dispositivo.dto';

describe('BootstrapController', () => {
  let controller: BootstrapController;
  let service: jest.Mocked<BootstrapService>;

  // Mocks de datos
  const mockSucursalId = '123e4567-e89b-12d3-a456-426614174000';
  const mockDispositivoId = '987fcdeb-51a2-43e7-9876-543210fedcba';

  const mockMetaResponse = {
    bootstrap_version: '1.0.0',
    generated_at: '2025-01-15T12:00:00Z',
    data: {
      sucursal_id: mockSucursalId,
      catalog_version: 'BOOTSTRAP_V1',
      server_timestamp: '2025-01-15T12:00:00Z',
      requires_full_sync: false,
    },
  };

  const mockSucursalResponse = {
    bootstrap_version: '1.0.0',
    generated_at: '2025-01-15T12:00:00Z',
    data: {
      id: mockSucursalId,
      codigo: 'SUC001',
      nombre: 'Sucursal Centro',
      rut: '76.123.456-7',
      direccion: 'Av. Principal 123',
      telefono: '+56912345678',
      email: 'centro@sysme.cl',
      timezone: 'America/Santiago',
      esta_activa: true,
      configuracion: {},
    },
  };

  const mockDispositivoResponse = {
    bootstrap_version: '1.0.0',
    generated_at: '2025-01-15T12:00:00Z',
    data: {
      id: mockDispositivoId,
      sucursal_id: mockSucursalId,
      codigo: 'POS-01',
      nombre: 'Caja Principal',
      tipo: TipoDispositivo.CAJA,
      dispositivo_info: {},
      esta_activo: true,
      ultima_sincronizacion: '2025-01-15T11:30:00Z',
      version_app: '1.0.0',
    },
  };

  beforeEach(async () => {
    // Crear mock del service
    const mockService = {
      getMeta: jest.fn(),
      getSucursal: jest.fn(),
      getDispositivo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BootstrapController],
      providers: [
        {
          provide: BootstrapService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<BootstrapController>(BootstrapController);
    service = module.get(BootstrapService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/bootstrap/meta', () => {
    it('debería retornar metadata correctamente', async () => {
      service.getMeta.mockResolvedValue(mockMetaResponse);

      const result = await controller.getMeta(mockSucursalId);

      expect(result).toEqual(mockMetaResponse);
      expect(service.getMeta).toHaveBeenCalledWith(mockSucursalId);
    });

    it('debería lanzar NotFoundException si sucursal no existe', async () => {
      service.getMeta.mockRejectedValue(
        new NotFoundException('Sucursal no encontrada'),
      );

      await expect(controller.getMeta(mockSucursalId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería retornar estructura con bootstrap_version', async () => {
      service.getMeta.mockResolvedValue(mockMetaResponse);

      const result = await controller.getMeta(mockSucursalId);

      expect(result.bootstrap_version).toBe('1.0.0');
    });

    it('debería retornar catalog_version en data', async () => {
      service.getMeta.mockResolvedValue(mockMetaResponse);

      const result = await controller.getMeta(mockSucursalId);

      expect(result.data.catalog_version).toBe('BOOTSTRAP_V1');
    });

    it('debería retornar requires_full_sync como false (Iteración 1)', async () => {
      service.getMeta.mockResolvedValue(mockMetaResponse);

      const result = await controller.getMeta(mockSucursalId);

      expect(result.data.requires_full_sync).toBe(false);
    });
  });

  describe('GET /api/bootstrap/sucursal/:id', () => {
    it('debería retornar sucursal correctamente', async () => {
      service.getSucursal.mockResolvedValue(mockSucursalResponse);

      const result = await controller.getSucursal(mockSucursalId);

      expect(result).toEqual(mockSucursalResponse);
      expect(service.getSucursal).toHaveBeenCalledWith(mockSucursalId);
    });

    it('debería lanzar NotFoundException si sucursal no existe', async () => {
      service.getSucursal.mockRejectedValue(
        new NotFoundException('Sucursal no encontrada'),
      );

      await expect(controller.getSucursal(mockSucursalId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería retornar estructura con bootstrap_version y generated_at', async () => {
      service.getSucursal.mockResolvedValue(mockSucursalResponse);

      const result = await controller.getSucursal(mockSucursalId);

      expect(result.bootstrap_version).toBe('1.0.0');
      expect(result.generated_at).toBeDefined();
    });

    it('debería retornar datos de sucursal sin campos sensibles', async () => {
      service.getSucursal.mockResolvedValue(mockSucursalResponse);

      const result = await controller.getSucursal(mockSucursalId);

      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('codigo');
      expect(result.data).toHaveProperty('nombre');
      // No debe incluir password_hash ni otros campos sensibles
      expect(result.data).not.toHaveProperty('password_hash');
    });
  });

  describe('GET /api/bootstrap/dispositivo', () => {
    it('debería retornar dispositivo correctamente', async () => {
      service.getDispositivo.mockResolvedValue(mockDispositivoResponse);

      const result = await controller.getDispositivo(
        mockSucursalId,
        mockDispositivoId,
      );

      expect(result).toEqual(mockDispositivoResponse);
      expect(service.getDispositivo).toHaveBeenCalledWith(
        mockSucursalId,
        mockDispositivoId,
      );
    });

    it('debería lanzar NotFoundException si dispositivo no existe', async () => {
      service.getDispositivo.mockRejectedValue(
        new NotFoundException('Dispositivo no encontrado'),
      );

      await expect(
        controller.getDispositivo(mockSucursalId, mockDispositivoId),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería retornar estructura con bootstrap_version y generated_at', async () => {
      service.getDispositivo.mockResolvedValue(mockDispositivoResponse);

      const result = await controller.getDispositivo(
        mockSucursalId,
        mockDispositivoId,
      );

      expect(result.bootstrap_version).toBe('1.0.0');
      expect(result.generated_at).toBeDefined();
    });

    it('debería retornar datos de dispositivo sin campos sensibles', async () => {
      service.getDispositivo.mockResolvedValue(mockDispositivoResponse);

      const result = await controller.getDispositivo(
        mockSucursalId,
        mockDispositivoId,
      );

      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('codigo');
      expect(result.data).toHaveProperty('tipo');
      // No debe incluir tokens ni otros campos sensibles
      expect(result.data).not.toHaveProperty('auth_token');
    });

    it('debería validar que el dispositivo pertenece a la sucursal', async () => {
      service.getDispositivo.mockResolvedValue(mockDispositivoResponse);

      const result = await controller.getDispositivo(
        mockSucursalId,
        mockDispositivoId,
      );

      expect(result.data.sucursal_id).toBe(mockSucursalId);
    });
  });

  describe('Contrato de API - Headers y estructura', () => {
    it('todas las respuestas deben tener la estructura base correcta', async () => {
      service.getMeta.mockResolvedValue(mockMetaResponse);
      service.getSucursal.mockResolvedValue(mockSucursalResponse);
      service.getDispositivo.mockResolvedValue(mockDispositivoResponse);

      const metaResult = await controller.getMeta(mockSucursalId);
      const sucursalResult = await controller.getSucursal(mockSucursalId);
      const dispositivoResult = await controller.getDispositivo(
        mockSucursalId,
        mockDispositivoId,
      );

      // Todas deben tener bootstrap_version, generated_at y data
      [metaResult, sucursalResult, dispositivoResult].forEach((result) => {
        expect(result).toHaveProperty('bootstrap_version');
        expect(result).toHaveProperty('generated_at');
        expect(result).toHaveProperty('data');
      });
    });
  });
});
