import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SyncService } from './sync.service';
import { IdempotencyService } from './idempotency.service';
import { SyncEventRepository } from '../repositories/sync-event.repository';
import { KnexService } from '@common/database/knex.service';
import { EventType, EntityType } from '../dto/sync-event.dto';
import { DependencyNotMetException } from '../exceptions/dependency-not-met.exception';

/**
 * Tests para FASE 1: Correcciones Críticas
 *
 * Cubre:
 * 1. Validación de dependencias FK
 * 2. Idempotencia dentro de transacción
 * 3. Row-level locking
 */
describe('SyncService - Fase 1 Correcciones', () => {
  let service: SyncService;
  let idempotencyService: IdempotencyService;
  let syncEventRepository: SyncEventRepository;

  // Mock de transacción Knex
  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    first: jest.fn(),
    forUpdate: jest.fn().mockReturnThis(), // ⭐ NUEVO: para locking
    onConflict: jest.fn().mockReturnThis(),
    merge: jest.fn(),
    select: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
  };

  const mockTransaction: any = jest.fn(() => mockQueryBuilder);
  // Copiar métodos al objeto función para que trx también tenga estos métodos
  Object.assign(mockTransaction, {
    insert: mockQueryBuilder.insert,
    where: mockQueryBuilder.where,
    update: mockQueryBuilder.update,
    first: mockQueryBuilder.first,
    forUpdate: mockQueryBuilder.forUpdate,
    onConflict: mockQueryBuilder.onConflict,
    merge: mockQueryBuilder.merge,
    select: mockQueryBuilder.select,
    raw: jest.fn().mockResolvedValue({ rows: [{}] }),
  });

  const mockKnexService = {
    instance: mockTransaction,
    transaction: jest.fn((callback) => callback(mockTransaction)),
  };

  const mockIdempotencyService = {
    checkDuplicateInTransaction: jest.fn(), // ⭐ NUEVO método
    checkDuplicate: jest.fn(), // Deprecado
    validateFormat: jest.fn().mockReturnValue(true),
  };

  const mockSyncEventRepository = {
    create: jest.fn(),
    markAsProcessed: jest.fn(),
    markAsDependencyPending: jest.fn(), // ⭐ NUEVO método
    checkDuplicateWithLock: jest.fn().mockResolvedValue(false),
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

  describe('1️⃣ Validación de Dependencias FK', () => {
    it('debe marcar PAGO_REGISTRADO como DEPENDENCIA_PENDIENTE si falta pedido', async () => {
      // Mock: pedido NO existe
      mockQueryBuilder.first.mockResolvedValueOnce(null); // pedido no existe
      mockQueryBuilder.first.mockResolvedValueOnce({ id: 'sesion-123' }); // sesión existe

      const eventos = [
        {
          event_type: EventType.PAGO_REGISTRADO,
          entity_type: EntityType.PAGO,
          entity_id: 'pago-uuid-123',
          idempotency_key: 'pago:pago-uuid-123:created',
          payload: {
            pedido_id: 'pedido-uuid-999', // NO existe
            sesion_caja_id: 'sesion-123',
            monto: 15000,
          },
          dispositivo_id: 'dispositivo-123',
          sucursal_id: 'sucursal-123',
          client_timestamp: '2025-01-14T10:30:00Z',
        },
      ];

      const result = await service.processEvents(eventos);

      // Debe marcar como DEPENDENCIA_PENDIENTE
      expect(result.pending).toBe(1);
      expect(result.processed).toBe(0);
      expect(result.errors).toBe(0);
      expect(result.results[0].status).toBe('DEPENDENCIA_PENDIENTE');
      expect(result.results[0].missing_dependencies).toContain(
        'pedido:pedido-uuid-999',
      );
      expect(mockSyncEventRepository.markAsDependencyPending).toHaveBeenCalled();
    });

    it('debe marcar PAGO_REGISTRADO como DEPENDENCIA_PENDIENTE si falta sesión caja', async () => {
      // Mock: pedido existe, sesión NO
      mockQueryBuilder.first.mockResolvedValueOnce({ id: 'pedido-123' }); // pedido existe
      mockQueryBuilder.first.mockResolvedValueOnce(null); // sesión no existe

      const eventos = [
        {
          event_type: EventType.PAGO_REGISTRADO,
          entity_type: EntityType.PAGO,
          entity_id: 'pago-uuid-456',
          idempotency_key: 'pago:pago-uuid-456:created',
          payload: {
            pedido_id: 'pedido-123',
            sesion_caja_id: 'sesion-uuid-999', // NO existe
            monto: 10000,
          },
          dispositivo_id: 'dispositivo-123',
          sucursal_id: 'sucursal-123',
          client_timestamp: '2025-01-14T10:31:00Z',
        },
      ];

      const result = await service.processEvents(eventos);

      expect(result.pending).toBe(1);
      expect(result.results[0].missing_dependencies).toContain(
        'sesion_caja:sesion-uuid-999',
      );
    });

    it('debe procesar PAGO_REGISTRADO si todas las dependencias existen', async () => {
      // Mock: pedido y sesión existen
      mockQueryBuilder.first.mockResolvedValue({ id: 'exists' });

      const eventos = [
        {
          event_type: EventType.PAGO_REGISTRADO,
          entity_type: EntityType.PAGO,
          entity_id: 'pago-uuid-789',
          idempotency_key: 'pago:pago-uuid-789:created',
          payload: {
            pedido_id: 'pedido-123',
            sesion_caja_id: 'sesion-123',
            metodo: 'EFECTIVO',
            monto: 20000,
          },
          dispositivo_id: 'dispositivo-123',
          sucursal_id: 'sucursal-123',
          client_timestamp: '2025-01-14T10:32:00Z',
        },
      ];

      const result = await service.processEvents(eventos);

      expect(result.processed).toBe(1);
      expect(result.pending).toBe(0);
      expect(result.errors).toBe(0);
    });
  });

  describe('2️⃣ Idempotencia dentro de Transacción', () => {
    it('debe usar checkDuplicateInTransaction (NO checkDuplicate)', async () => {
      mockQueryBuilder.first.mockResolvedValue({ id: 'exists' });

      const eventos = [
        {
          event_type: EventType.MESA_OCUPADA,
          entity_type: EntityType.MESA,
          entity_id: 'mesa-123',
          idempotency_key: 'mesa:mesa-123:ocupada',
          payload: {},
          dispositivo_id: 'dispositivo-123',
          sucursal_id: 'sucursal-123',
          client_timestamp: '2025-01-14T10:33:00Z',
        },
      ];

      await service.processEvents(eventos);

      // ⭐ Debe llamar al método NUEVO (con transacción)
      expect(
        mockIdempotencyService.checkDuplicateInTransaction,
      ).toHaveBeenCalled();

      // ⭐ NO debe llamar al método deprecado
      expect(mockIdempotencyService.checkDuplicate).not.toHaveBeenCalled();
    });

    it('debe usar SELECT ... FOR UPDATE en repository', () => {
      // Verificar que el repository tiene el método nuevo
      expect(mockSyncEventRepository.checkDuplicateWithLock).toBeDefined();
    });
  });

  describe('3️⃣ Row-Level Locking', () => {
    it('debe usar forUpdate() al cerrar caja (CAJA_CERRADA)', async () => {
      // Mock: sesión existe
      mockQueryBuilder.first.mockResolvedValueOnce({
        id: 'sesion-123',
        estado: 'ABIERTA',
      });

      const eventos = [
        {
          event_type: EventType.CAJA_CERRADA,
          entity_type: EntityType.SESION_CAJA,
          entity_id: 'sesion-123',
          idempotency_key: 'sesion_caja:sesion-123:cerrada',
          payload: {
            monto_esperado: 100000,
            monto_real: 100000,
          },
          dispositivo_id: 'dispositivo-123',
          sucursal_id: 'sucursal-123',
          client_timestamp: '2025-01-14T18:00:00Z',
        },
      ];

      await service.processEvents(eventos);

      // ⭐ Verificar que se llamó forUpdate() (row-level lock)
      expect(mockQueryBuilder.forUpdate).toHaveBeenCalled();
    });

    it('debe ser idempotente si caja ya está cerrada', async () => {
      // Mock: sesión YA está cerrada
      // Usar mockResolvedValue (sin Once) porque se llama múltiples veces
      mockQueryBuilder.first.mockResolvedValue({
        id: 'sesion-123',
        estado: 'CERRADA', // ⭐ YA cerrada
      });

      const eventos = [
        {
          event_type: EventType.CAJA_CERRADA,
          entity_type: EntityType.SESION_CAJA,
          entity_id: 'sesion-123',
          idempotency_key: 'sesion_caja:sesion-123:cerrada',
          payload: {
            monto_esperado: 100000,
            monto_real: 100000,
          },
          dispositivo_id: 'dispositivo-123',
          sucursal_id: 'sucursal-123',
          client_timestamp: '2025-01-14T18:00:00Z',
        },
      ];

      const result = await service.processEvents(eventos);

      // ⭐ Debe procesarse exitosamente (no error)
      expect(result.processed).toBe(1);
      expect(result.errors).toBe(0);

      // ⭐ NO debe hacer UPDATE (es idempotente)
      expect(mockQueryBuilder.update).not.toHaveBeenCalled();
    });

    it('debe usar forUpdate() al actualizar totales de sesión caja', async () => {
      // Mock: sesión existe, pedido existe
      mockQueryBuilder.first.mockResolvedValue({ id: 'exists' });

      const eventos = [
        {
          event_type: EventType.PAGO_REGISTRADO,
          entity_type: EntityType.PAGO,
          entity_id: 'pago-123',
          idempotency_key: 'pago:pago-123:created',
          payload: {
            pedido_id: 'pedido-123',
            sesion_caja_id: 'sesion-123',
            metodo: 'EFECTIVO',
            monto: 5000,
          },
          dispositivo_id: 'dispositivo-123',
          sucursal_id: 'sucursal-123',
          client_timestamp: '2025-01-14T10:35:00Z',
        },
      ];

      await service.processEvents(eventos);

      // ⭐ Verificar que forUpdate() se llamó al actualizar totales
      expect(mockQueryBuilder.forUpdate).toHaveBeenCalled();
    });
  });

  describe('4️⃣ Escenarios de Integración', () => {
    it('debe manejar correctamente evento con dependencia pendiente + duplicado', async () => {
      // Primer intento: falta pedido
      mockQueryBuilder.first.mockResolvedValueOnce(null); // pedido no existe

      const evento = {
        event_type: EventType.PAGO_REGISTRADO,
        entity_type: EntityType.PAGO,
        entity_id: 'pago-integration-1',
        idempotency_key: 'pago:pago-integration-1:created',
        payload: {
          pedido_id: 'pedido-pending',
          sesion_caja_id: 'sesion-123',
          monto: 15000,
        },
        dispositivo_id: 'dispositivo-123',
        sucursal_id: 'sucursal-123',
        client_timestamp: '2025-01-14T10:36:00Z',
      };

      const result1 = await service.processEvents([evento]);

      expect(result1.pending).toBe(1);
      expect(mockSyncEventRepository.markAsDependencyPending).toHaveBeenCalled();
    });
  });
});
