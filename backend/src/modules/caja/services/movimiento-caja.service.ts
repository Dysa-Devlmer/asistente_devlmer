/**
 * Service: Movimiento de Caja
 *
 * Responsabilidad: Lógica de negocio para movimientos de caja
 * - Crear movimiento (ingreso/egreso)
 * - Anular movimiento (soft-delete)
 * - Consultar movimientos de una sesión
 * - Idempotencia (offline-first)
 */

import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { MovimientoCajaRepository } from '../repositories/movimiento-caja.repository';
import { SesionCajaRepository } from '../repositories/sesion-caja.repository';
import { EmpleadoRepository } from '../repositories/empleado.repository';
import {
  CrearMovimientoCajaDto,
  AnularMovimientoCajaDto,
  MovimientoCajaResponseDto,
  ListaMovimientosResponseDto,
  TipoMovimientoCaja,
} from '../dto/movimiento-caja.dto';
import {
  CajaNotOpenError,
  CajaAlreadyClosedError,
  SesionCajaNotFoundError,
  MovimientoCajaNotFoundError,
  EmpleadoNotFoundError,
  ValidationError,
} from '../../../common/errors/typed-errors';
import { logger } from '../../../common/logging/structured-logger';

export class MovimientoCajaService {
  private movimientoRepo: MovimientoCajaRepository;
  private sesionRepo: SesionCajaRepository;
  private empleadoRepo: EmpleadoRepository;

  constructor(private db: Pool) {
    this.movimientoRepo = new MovimientoCajaRepository(db);
    this.sesionRepo = new SesionCajaRepository(db);
    this.empleadoRepo = new EmpleadoRepository(db);
  }

  /**
   * Crear movimiento de caja
   *
   * Validaciones:
   * - Sesión existe
   * - Sesión está abierta (NO cerrada)
   * - Empleado existe
   * - Monto > 0
   * - Concepto no vacío
   *
   * Idempotencia:
   * - Si movimiento_id ya existe, retornar datos existentes
   */
  async crearMovimiento(dto: CrearMovimientoCajaDto): Promise<MovimientoCajaResponseDto> {
    const {
      sesion_id,
      empleado_id,
      tipo,
      concepto,
      monto,
      notas,
      movimiento_id,
      fecha,
    } = dto;

    // Generar ID si no viene del cliente (offline-first)
    const movimientoId = movimiento_id || uuidv4();

    // Idempotencia: Si ya existe, retornar datos
    const movimientoExistente = await this.movimientoRepo.obtenerPorId(movimientoId);
    if (movimientoExistente) {
      logger.info('Creación de movimiento idempotente', {
        movimiento_id: movimientoId,
        sesion_id,
        tipo,
      });

      return {
        movimiento_id: movimientoExistente.id,
        sesion_caja_id: movimientoExistente.sesion_caja_id,
        tipo: movimientoExistente.tipo,
        concepto: movimientoExistente.concepto,
        monto: parseFloat(movimientoExistente.monto),
        empleado_id: movimientoExistente.empleado_id,
        fecha: movimientoExistente.fecha.toISOString(),
        notas: movimientoExistente.notas,
        esta_activo: movimientoExistente.esta_activo === 1,
      };
    }

    // Validar sesión existe
    const sesion = await this.sesionRepo.obtenerPorId(sesion_id);
    if (!sesion) {
      throw new SesionCajaNotFoundError(sesion_id);
    }

    // Validar sesión está abierta
    if (sesion.estado === 'cerrada') {
      throw new CajaAlreadyClosedError(sesion_id);
    }

    // Validar empleado existe
    const empleadoExiste = await this.empleadoRepo.existeEmpleado(empleado_id);
    if (!empleadoExiste) {
      throw new EmpleadoNotFoundError(empleado_id);
    }

    // Validar monto > 0
    if (monto <= 0) {
      throw new ValidationError('El monto debe ser mayor a 0');
    }

    // Validar concepto no vacío
    if (!concepto || concepto.trim().length < 3) {
      throw new ValidationError('El concepto debe tener al menos 3 caracteres');
    }

    // Crear movimiento
    const fechaMovimiento = fecha ? new Date(fecha) : new Date();

    await this.movimientoRepo.crearMovimiento({
      movimientoId,
      sesionCajaId: sesion_id,
      tipo,
      concepto,
      monto,
      empleadoId: empleado_id,
      fecha: fechaMovimiento,
      notas: notas || null,
    });

    logger.info('Movimiento de caja creado', {
      movimiento_id: movimientoId,
      sesion_id,
      tipo,
      monto,
      empleado_id,
    });

    return {
      movimiento_id: movimientoId,
      sesion_caja_id: sesion_id,
      tipo,
      concepto,
      monto,
      empleado_id,
      fecha: fechaMovimiento.toISOString(),
      notas: notas || null,
      esta_activo: true,
    };
  }

  /**
   * Anular movimiento (soft-delete)
   *
   * Validaciones:
   * - Movimiento existe
   * - Movimiento está activo
   * - Sesión del movimiento está abierta (NO se puede anular si la caja ya cerró)
   * - Empleado existe
   */
  async anularMovimiento(dto: AnularMovimientoCajaDto): Promise<MovimientoCajaResponseDto> {
    const { movimiento_id, empleado_id, motivo } = dto;

    // Validar movimiento existe
    const movimiento = await this.movimientoRepo.obtenerPorId(movimiento_id);
    if (!movimiento) {
      throw new MovimientoCajaNotFoundError(movimiento_id);
    }

    // Validar sesión del movimiento está abierta
    const sesionCerrada = await this.sesionRepo.estaCerrada(movimiento.sesion_caja_id);
    if (sesionCerrada) {
      throw new CajaAlreadyClosedError(movimiento.sesion_caja_id);
    }

    // Validar empleado existe
    const empleadoExiste = await this.empleadoRepo.existeEmpleado(empleado_id);
    if (!empleadoExiste) {
      throw new EmpleadoNotFoundError(empleado_id);
    }

    // Anular movimiento
    const anulado = await this.movimientoRepo.anularMovimiento(movimiento_id);

    if (!anulado) {
      // Ya estaba anulado o no existe
      logger.warn('Intento de anular movimiento ya anulado', {
        movimiento_id,
        empleado_id,
      });
    } else {
      logger.info('Movimiento anulado', {
        movimiento_id,
        sesion_id: movimiento.sesion_caja_id,
        empleado_id,
        motivo,
      });
    }

    // Retornar movimiento actualizado
    const movimientoActualizado = await this.movimientoRepo.obtenerPorId(movimiento_id);

    return {
      movimiento_id: movimientoActualizado!.id,
      sesion_caja_id: movimientoActualizado!.sesion_caja_id,
      tipo: movimientoActualizado!.tipo,
      concepto: movimientoActualizado!.concepto,
      monto: parseFloat(movimientoActualizado!.monto),
      empleado_id: movimientoActualizado!.empleado_id,
      fecha: movimientoActualizado!.fecha.toISOString(),
      notas: movimientoActualizado!.notas,
      esta_activo: movimientoActualizado!.esta_activo === 1,
    };
  }

  /**
   * Obtener movimientos de una sesión
   *
   * Incluye solo movimientos activos (NO anulados)
   */
  async obtenerMovimientosPorSesion(sesionId: string): Promise<ListaMovimientosResponseDto> {
    // Validar sesión existe
    const sesionExiste = await this.sesionRepo.existeSesion(sesionId);
    if (!sesionExiste) {
      throw new SesionCajaNotFoundError(sesionId);
    }

    const movimientos = await this.movimientoRepo.obtenerMovimientosPorSesion(sesionId);

    return {
      movimientos: movimientos.map(m => ({
        movimiento_id: m.id,
        sesion_caja_id: m.sesion_caja_id,
        tipo: m.tipo,
        concepto: m.concepto,
        monto: parseFloat(m.monto),
        empleado_id: m.empleado_id,
        fecha: m.fecha.toISOString(),
        notas: m.notas,
        esta_activo: m.esta_activo === 1,
      })),
      total: movimientos.length,
    };
  }

  /**
   * Obtener TODOS los movimientos de una sesión (incluyendo anulados)
   *
   * Útil para auditoría
   */
  async obtenerTodosMovimientosPorSesion(sesionId: string): Promise<ListaMovimientosResponseDto> {
    // Validar sesión existe
    const sesionExiste = await this.sesionRepo.existeSesion(sesionId);
    if (!sesionExiste) {
      throw new SesionCajaNotFoundError(sesionId);
    }

    const movimientos = await this.movimientoRepo.obtenerTodosMovimientosPorSesion(sesionId);

    return {
      movimientos: movimientos.map(m => ({
        movimiento_id: m.id,
        sesion_caja_id: m.sesion_caja_id,
        tipo: m.tipo,
        concepto: m.concepto,
        monto: parseFloat(m.monto),
        empleado_id: m.empleado_id,
        fecha: m.fecha.toISOString(),
        notas: m.notas,
        esta_activo: m.esta_activo === 1,
      })),
      total: movimientos.length,
    };
  }
}
