import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { SyncService } from './sync.service';
import { IdempotencyService } from './idempotency.service';
import { SyncEventRepository } from '../repositories/sync-event.repository';
import { KnexService } from '@common/database/knex.service';
import { EventType, EntityType } from '../dto/sync-event.dto';

describe('SyncService', () => {
  let service: SyncService;
  let idempotencyService: IdempotencyService;
  let syncEventRepository: SyncEventRepository;

  // Mocks
  const mockKnexService = {
    instance: {
      transaction: jest.fn((callback) => callback(mockTransaction)),
    },
    transaction: jest.fn((callback) => callback(mockTransaction)),
  };

  const mockTransaction = {
    insert: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    first: jest.fn(),
    onConflict: jest.fn().mockReturnThis(),
    merge: jest.fn(),
  };

  const mockIdempotencyService = {
    checkDuplicate: jest.fn(),
    validateFormat: jest.fn().mockReturnValue(true),
  };

  const mockSyncEventRepository = {
    create: jest.fn(),
    markAsProcessed: jest.fn(),
    existsByIdempotencyKey: jest.fn().mockResolvedValue(false),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: KnexService,
          useValue: mockKnexService,
        },
        {
          provide: IdempotencyService,
          useValue: mockIdempotencyService,
        },
        {
          provide: SyncEventRepository,
          useValue: mockSyncEventRepository,
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    idempotencyService = module.get<IdempotencyService>(IdempotencyService);
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

  describe('processEvents', () => {
    it('debe procesar evento PAGO_REGISTRADO correctamente', async () => {
      const eventos = [
        {
          event_type: EventType.PAGO_REGISTRADO,
          entity_type: EntityType.PAGO,
          entity_id: 'uuid-pago-123',
          idempotency_key: 'pago:uuid-pago-123:created',
          payload: {
            pedido_id: 'uuid-pedido-123',
            sesion_caja_id: 'uuid-sesion-123',
            empleado_id: 'uuid-empleado-123',
            metodo: 'EFECTIVO',
            monto: 15000,
            propina: 1500,
          },
          dispositivo_id: 'uuid-dispositivo-123',
          sucursal_id: 'uuid-sucursal-123',
          client_timestamp: '2025-01-14T10:30:00Z',
        },
      ];

      const result = await service.processEvents(eventos);

      expect(result.processed).toBe(1);
      expect(result.errors).toBe(0);
      expect(mockIdempotencyService.checkDuplicate).toHaveBeenCalledWith(
        'pago:uuid-pago-123:created',
      );
      expect(mockSyncEventRepository.create).toHaveBeenCalled();
      expect(mockSyncEventRepository.markAsProcessed).toHaveBeenCalledWith(
        'pago:uuid-pago-123:created',
        expect.anything(),
      );
    });

    it('debe marcar evento como IGNORADO si es duplicado', async () => {
      // Simular que checkDuplicate lanza excepción
      mockIdempotencyService.checkDuplicate.mockRejectedValueOnce(
        new ConflictException('Evento duplicado'),
      );

      const eventos = [
        {
          event_type: EventType.PAGO_REGISTRADO,
          entity_type: EntityType.PAGO,
          entity_id: 'uuid-pago-456',
          idempotency_key: 'pago:uuid-pago-456:created',
          payload: { monto: 10000 },
          dispositivo_id: 'uuid-dispositivo-123',
          sucursal_id: 'uuid-sucursal-123',
          client_timestamp: '2025-01-14T10:30:00Z',
        },
      ];

      const result = await service.processEvents(eventos);

      expect(result.processed).toBe(0);
      expect(result.errors).toBe(1);
      expect(result.results[0].status).toBe('IGNORADO');
    });

    it('debe procesar múltiples eventos correctamente', async () => {
      const eventos = [
        {
          event_type: EventType.PAGO_REGISTRADO,
          entity_type: EntityType.PAGO,
          entity_id: 'uuid-pago-1',
          idempotency_key: 'pago:uuid-pago-1:created',
          payload: { monto: 10000 },
          dispositivo_id: 'uuid-dispositivo-123',
          sucursal_id: 'uuid-sucursal-123',
          client_timestamp: '2025-01-14T10:30:00Z',
        },
        {
          event_type: EventType.MESA_OCUPADA,
          entity_type: EntityType.MESA,
          entity_id: 'uuid-mesa-1',
          idempotency_key: 'mesa:uuid-mesa-1:ocupada',
          payload: {},
          dispositivo_id: 'uuid-dispositivo-123',
          sucursal_id: 'uuid-sucursal-123',
          client_timestamp: '2025-01-14T10:31:00Z',
        },
      ];

      const result = await service.processEvents(eventos);

      expect(result.processed).toBe(2);
      expect(result.errors).toBe(0);
    });
  });
});
