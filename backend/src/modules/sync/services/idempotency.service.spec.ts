import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { SyncEventRepository } from '../repositories/sync-event.repository';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let syncEventRepository: SyncEventRepository;

  const mockSyncEventRepository = {
    existsByIdempotencyKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        {
          provide: SyncEventRepository,
          useValue: mockSyncEventRepository,
        },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
    syncEventRepository = module.get<SyncEventRepository>(
      SyncEventRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('checkDuplicate', () => {
    it('NO debe lanzar excepción si el evento NO existe', async () => {
      mockSyncEventRepository.existsByIdempotencyKey.mockResolvedValue(false);

      await expect(
        service.checkDuplicate('pago:uuid-123:created'),
      ).resolves.not.toThrow();
    });

    it('DEBE lanzar ConflictException si el evento YA existe', async () => {
      mockSyncEventRepository.existsByIdempotencyKey.mockResolvedValue(true);

      await expect(
        service.checkDuplicate('pago:uuid-123:created'),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.checkDuplicate('pago:uuid-123:created'),
      ).rejects.toThrow(/duplicado/);
    });
  });

  describe('validateFormat', () => {
    it('debe validar formato correcto de idempotency_key', () => {
      const validKeys = [
        'pago:550e8400-e29b-41d4-a716-446655440000:created',
        'pedido:123e4567-e89b-12d3-a456-426614174000:updated',
        'mesa:a1b2c3d4-e5f6-7890-abcd-ef1234567890:ocupada',
      ];

      validKeys.forEach((key) => {
        expect(service.validateFormat(key)).toBe(true);
      });
    });

    it('debe rechazar formato inválido', () => {
      const invalidKeys = [
        'pago-123-created', // Sin UUIDs
        'pago:invalid-uuid:created', // UUID inválido
        'pago:550e8400-e29b-41d4-a716-446655440000', // Falta acción
        '', // Vacío
        'PAGO:UUID:CREATED', // Mayúsculas
      ];

      invalidKeys.forEach((key) => {
        expect(service.validateFormat(key)).toBe(false);
      });
    });
  });

  describe('generateKey', () => {
    it('debe generar idempotency_key válido', () => {
      const key = service.generateKey(
        'pago',
        '550e8400-e29b-41d4-a716-446655440000',
        'created',
      );

      expect(key).toBe('pago:550e8400-e29b-41d4-a716-446655440000:created');
      expect(service.validateFormat(key)).toBe(true);
    });
  });
});
