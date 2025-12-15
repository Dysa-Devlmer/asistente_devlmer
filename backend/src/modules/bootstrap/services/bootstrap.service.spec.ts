import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BootstrapService } from './bootstrap.service';
import { SucursalRepository } from '../repositories/sucursal.repository';
import { DispositivoRepository } from '../repositories/dispositivo.repository';

describe('BootstrapService', () => {
  let service: BootstrapService;
  let sucursalRepository: jest.Mocked<SucursalRepository>;
  let dispositivoRepository: jest.Mocked<DispositivoRepository>;

  // Mocks de datos
  const mockSucursalId = '123e4567-e89b-12d3-a456-426614174000';
  const mockDispositivoId = '987fcdeb-51a2-43e7-9876-543210fedcba';

  const mockSucursal = {
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
  };

  const mockDispositivo = {
    id: mockDispositivoId,
    sucursal_id: mockSucursalId,
    codigo: 'POS-01',
    nombre: 'Caja Principal',
    tipo: 'CAJA' as any,
    dispositivo_info: {},
    esta_activo: true,
    ultima_sincronizacion: new Date().toISOString(),
    version_app: '1.0.0',
  };

  beforeEach(async () => {
    // Crear mocks de repositorios
    const mockSucursalRepo = {
      exists: jest.fn(),
      findById: jest.fn(),
      getLastUpdated: jest.fn(),
    };

    const mockDispositivoRepo = {
      exists: jest.fn(),
      findBySucursalAndId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BootstrapService,
        {
          provide: SucursalRepository,
          useValue: mockSucursalRepo,
        },
        {
          provide: DispositivoRepository,
          useValue: mockDispositivoRepo,
        },
      ],
    }).compile();

    service = module.get<BootstrapService>(BootstrapService);
    sucursalRepository = module.get(SucursalRepository);
    dispositivoRepository = module.get(DispositivoRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMeta', () => {
    it('debería retornar metadata con estructura correcta', async () => {
      sucursalRepository.exists.mockResolvedValue(true);

      const result = await service.getMeta(mockSucursalId);

      expect(result).toMatchObject({
        bootstrap_version: '1.0.0',
        generated_at: expect.any(String),
        data: {
          sucursal_id: mockSucursalId,
          catalog_version: 'BOOTSTRAP_V1',
          server_timestamp: expect.any(String),
          requires_full_sync: false,
        },
      });
    });

    it('debería lanzar NotFoundException si sucursal no existe', async () => {
      sucursalRepository.exists.mockResolvedValue(false);

      await expect(service.getMeta(mockSucursalId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería incluir bootstrap_version y generated_at', async () => {
      sucursalRepository.exists.mockResolvedValue(true);

      const result = await service.getMeta(mockSucursalId);

      expect(result.bootstrap_version).toBe('1.0.0');
      expect(result.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601
    });
  });

  describe('getSucursal', () => {
    it('debería retornar sucursal con estructura correcta', async () => {
      sucursalRepository.findById.mockResolvedValue(mockSucursal);

      const result = await service.getSucursal(mockSucursalId);

      expect(result).toMatchObject({
        bootstrap_version: '1.0.0',
        generated_at: expect.any(String),
        data: mockSucursal,
      });
    });

    it('debería lanzar NotFoundException si sucursal no existe', async () => {
      sucursalRepository.findById.mockResolvedValue(null);

      await expect(service.getSucursal(mockSucursalId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería llamar al repository con ID correcto', async () => {
      sucursalRepository.findById.mockResolvedValue(mockSucursal);

      await service.getSucursal(mockSucursalId);

      expect(sucursalRepository.findById).toHaveBeenCalledWith(mockSucursalId);
      expect(sucursalRepository.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDispositivo', () => {
    it('debería retornar dispositivo con estructura correcta', async () => {
      dispositivoRepository.findBySucursalAndId.mockResolvedValue(
        mockDispositivo,
      );

      const result = await service.getDispositivo(
        mockSucursalId,
        mockDispositivoId,
      );

      expect(result).toMatchObject({
        bootstrap_version: '1.0.0',
        generated_at: expect.any(String),
        data: mockDispositivo,
      });
    });

    it('debería lanzar NotFoundException si dispositivo no existe', async () => {
      dispositivoRepository.findBySucursalAndId.mockResolvedValue(null);

      await expect(
        service.getDispositivo(mockSucursalId, mockDispositivoId),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería llamar al repository con IDs correctos', async () => {
      dispositivoRepository.findBySucursalAndId.mockResolvedValue(
        mockDispositivo,
      );

      await service.getDispositivo(mockSucursalId, mockDispositivoId);

      expect(dispositivoRepository.findBySucursalAndId).toHaveBeenCalledWith(
        mockSucursalId,
        mockDispositivoId,
      );
      expect(dispositivoRepository.findBySucursalAndId).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('Estructura de respuesta', () => {
    it('todas las respuestas deben incluir bootstrap_version', async () => {
      sucursalRepository.exists.mockResolvedValue(true);
      sucursalRepository.findById.mockResolvedValue(mockSucursal);
      dispositivoRepository.findBySucursalAndId.mockResolvedValue(
        mockDispositivo,
      );

      const metaResult = await service.getMeta(mockSucursalId);
      const sucursalResult = await service.getSucursal(mockSucursalId);
      const dispositivoResult = await service.getDispositivo(
        mockSucursalId,
        mockDispositivoId,
      );

      expect(metaResult.bootstrap_version).toBe('1.0.0');
      expect(sucursalResult.bootstrap_version).toBe('1.0.0');
      expect(dispositivoResult.bootstrap_version).toBe('1.0.0');
    });

    it('todas las respuestas deben incluir generated_at en formato ISO 8601', async () => {
      sucursalRepository.exists.mockResolvedValue(true);
      sucursalRepository.findById.mockResolvedValue(mockSucursal);
      dispositivoRepository.findBySucursalAndId.mockResolvedValue(
        mockDispositivo,
      );

      const metaResult = await service.getMeta(mockSucursalId);
      const sucursalResult = await service.getSucursal(mockSucursalId);
      const dispositivoResult = await service.getDispositivo(
        mockSucursalId,
        mockDispositivoId,
      );

      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(metaResult.generated_at).toMatch(iso8601Regex);
      expect(sucursalResult.generated_at).toMatch(iso8601Regex);
      expect(dispositivoResult.generated_at).toMatch(iso8601Regex);
    });
  });
});
