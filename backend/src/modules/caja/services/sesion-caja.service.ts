/**
 * Service: Sesión de Caja
 *
 * Responsabilidad: Lógica de negocio para apertura y cierre de caja
 * - Abrir caja (con validaciones)
 * - Cerrar caja (con cálculos y snapshot inmutable)
 * - Consultar sesión activa
 * - Idempotencia (offline-first)
 */

import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { SesionCajaRepository } from '../repositories/sesion-caja.repository';
import { MovimientoCajaRepository } from '../repositories/movimiento-caja.repository';
import { CierreCajaRepository } from '../repositories/cierre-caja.repository';
import { EmpleadoRepository } from '../repositories/empleado.repository';
import {
  AbrirCajaDto,
  CerrarCajaDto,
  AperturaCajaResponseDto,
  CierreCajaResponseDto,
  SesionActivaResponseDto,
  CierreInmutableSnapshot,
  CierreDetallePorFormaPagoDto,
  MovimientoCajaSimpleDto,
  EstadoSesionCaja,
} from '../dto/sesion-caja.dto';
import {
  CajaAlreadyOpenError,
  CajaNotOpenError,
  CajaAlreadyClosedError,
  SucursalNotFoundError,
  EmpleadoNotFoundError,
  SesionCajaNotFoundError,
  InsufficientPermissionsError,
} from '../../../common/errors/typed-errors';
import { logger } from '../../../common/logging/structured-logger';

export class SesionCajaService {
  private sesionRepo: SesionCajaRepository;
  private movimientoRepo: MovimientoCajaRepository;
  private cierreRepo: CierreCajaRepository;
  private empleadoRepo: EmpleadoRepository;

  constructor(private db: Pool) {
    this.sesionRepo = new SesionCajaRepository(db);
    this.movimientoRepo = new MovimientoCajaRepository(db);
    this.cierreRepo = new CierreCajaRepository(db);
    this.empleadoRepo = new EmpleadoRepository(db);
  }

  /**
   * Abrir caja
   *
   * Validaciones:
   * - Sucursal existe
   * - Empleado existe
   * - NO hay caja abierta en la sucursal
   * - Empleado tiene permiso CAJA_ABRIR (futuro)
   *
   * Idempotencia:
   * - Si sesion_id ya existe, retornar datos existentes
   */
  async abrirCaja(dto: AbrirCajaDto): Promise<AperturaCajaResponseDto> {
    const { sucursal_id, empleado_id, monto_inicial, notas, sesion_id, fecha_apertura } = dto;

    // Generar ID si no viene del cliente (offline-first)
    const sesionId = sesion_id || uuidv4();

    // Idempotencia: Si ya existe, retornar datos
    const sesionExistente = await this.sesionRepo.obtenerPorId(sesionId);
    if (sesionExistente) {
      logger.info('Apertura de caja idempotente', {
        sesion_id: sesionId,
        sucursal_id,
        empleado_id,
      });

      return {
        sesion_id: sesionExistente.id,
        numero_sesion: sesionExistente.numero_sesion,
        sucursal_id: sesionExistente.sucursal_id,
        empleado_apertura_id: sesionExistente.empleado_apertura_id,
        fecha_apertura: sesionExistente.fecha_apertura.toISOString(),
        monto_inicial: parseFloat(sesionExistente.monto_inicial),
        estado: EstadoSesionCaja.ABIERTA,
        notas: sesionExistente.notas_apertura,
      };
    }

    // Validar sucursal existe
    const sucursalExiste = await this.empleadoRepo.existeSucursal(sucursal_id);
    if (!sucursalExiste) {
      throw new SucursalNotFoundError(sucursal_id);
    }

    // Validar empleado existe
    const empleadoExiste = await this.empleadoRepo.existeEmpleado(empleado_id);
    if (!empleadoExiste) {
      throw new EmpleadoNotFoundError(empleado_id);
    }

    // Validar NO hay caja abierta
    const sesionActivaId = await this.sesionRepo.existeSesionAbierta(sucursal_id);
    if (sesionActivaId) {
      throw new CajaAlreadyOpenError(sucursal_id, sesionActivaId);
    }

    // TODO: Validar permisos (futuro)
    // const tienePermiso = await this.empleadoRepo.tienePermiso(empleado_id, 'CAJA_ABRIR');
    // if (!tienePermiso) {
    //   throw new InsufficientPermissionsError('CAJA_ABRIR');
    // }

    // Generar número de sesión (transacción con FOR UPDATE)
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();

      const numeroSesion = await this.sesionRepo.generarProximoNumeroSesion(sucursal_id);

      // Crear sesión
      const fechaAperturaDate = fecha_apertura ? new Date(fecha_apertura) : new Date();

      await this.sesionRepo.crearSesion({
        sesionId,
        numeroSesion,
        sucursalId: sucursal_id,
        empleadoAperturaId: empleado_id,
        fechaApertura: fechaAperturaDate,
        montoInicial: monto_inicial,
        notasApertura: notas || null,
      });

      await connection.commit();

      logger.info('Caja abierta exitosamente', {
        sesion_id: sesionId,
        numero_sesion: numeroSesion,
        sucursal_id,
        empleado_id,
        monto_inicial,
      });

      return {
        sesion_id: sesionId,
        numero_sesion: numeroSesion,
        sucursal_id,
        empleado_apertura_id: empleado_id,
        fecha_apertura: fechaAperturaDate.toISOString(),
        monto_inicial,
        estado: EstadoSesionCaja.ABIERTA,
        notas: notas || null,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cerrar caja
   *
   * Validaciones:
   * - Sesión existe
   * - Sesión está abierta
   * - Empleado existe
   * - Empleado tiene permiso CAJA_CERRAR (futuro)
   *
   * Cálculos:
   * - monto_final_esperado = monto_inicial + ventas_efectivo + ingresos - egresos
   * - diferencia = monto_final_real - monto_final_esperado
   * - Totales por forma de pago
   * - Snapshot inmutable JSON
   *
   * Idempotencia:
   * - Si ya está cerrada, retornar datos
   */
  async cerrarCaja(dto: CerrarCajaDto): Promise<CierreCajaResponseDto> {
    const { sesion_id, empleado_id, monto_final_real, notas, fecha_cierre } = dto;

    // Validar sesión existe
    const sesion = await this.sesionRepo.obtenerPorId(sesion_id);
    if (!sesion) {
      throw new SesionCajaNotFoundError(sesion_id);
    }

    // Idempotencia: Si ya está cerrada, retornar datos
    if (sesion.estado === 'cerrada') {
      logger.info('Cierre de caja idempotente', {
        sesion_id,
        empleado_id,
      });

      return await this.construirCierreResponse(sesion_id);
    }

    // Validar empleado existe
    const empleadoExiste = await this.empleadoRepo.existeEmpleado(empleado_id);
    if (!empleadoExiste) {
      throw new EmpleadoNotFoundError(empleado_id);
    }

    // TODO: Validar permisos (futuro)
    // const tienePermiso = await this.empleadoRepo.tienePermiso(empleado_id, 'CAJA_CERRAR');
    // if (!tienePermiso) {
    //   throw new InsufficientPermissionsError('CAJA_CERRAR');
    // }

    // Calcular totales
    const montoInicial = parseFloat(sesion.monto_inicial);
    const totalIngresos = await this.movimientoRepo.calcularTotalIngresos(sesion_id);
    const totalEgresos = await this.movimientoRepo.calcularTotalEgresos(sesion_id);
    const totalEfectivo = await this.cierreRepo.calcularTotalEfectivo(sesion_id);

    const montoFinalEsperado = montoInicial + totalEfectivo + totalIngresos - totalEgresos;
    const diferencia = monto_final_real - montoFinalEsperado;

    // Obtener totales por forma de pago
    const totalesPorFormaPago = await this.cierreRepo.calcularTotalesPorFormaPago(sesion_id);

    // Obtener movimientos
    const movimientos = await this.movimientoRepo.obtenerMovimientosPorSesion(sesion_id);

    // Obtener datos de empleados
    const empleadoApertura = await this.empleadoRepo.obtenerPorId(sesion.empleado_apertura_id);
    const empleadoCierre = await this.empleadoRepo.obtenerPorId(empleado_id);

    // Construir snapshot inmutable
    const snapshot: CierreInmutableSnapshot = {
      sesion_id: sesion.id,
      numero_sesion: sesion.numero_sesion,
      sucursal_id: sesion.sucursal_id,
      fecha_apertura: sesion.fecha_apertura.toISOString(),
      fecha_cierre: fecha_cierre || new Date().toISOString(),
      empleado_apertura: {
        id: empleadoApertura!.id,
        nombre: empleadoApertura!.nombre,
        apellido: empleadoApertura!.apellido || undefined,
      },
      empleado_cierre: {
        id: empleadoCierre!.id,
        nombre: empleadoCierre!.nombre,
        apellido: empleadoCierre!.apellido || undefined,
      },
      monto_inicial: montoInicial,
      monto_final_esperado: montoFinalEsperado,
      monto_final_real,
      diferencia,
      totales_por_forma_pago: totalesPorFormaPago.map(t => ({
        forma_pago_id: t.forma_pago_id,
        nombre: t.nombre_forma_pago,
        cantidad_transacciones: t.cantidad_transacciones,
        monto_total: parseFloat(t.monto_total),
      })),
      movimientos: movimientos.map(m => ({
        id: m.id,
        tipo: m.tipo,
        concepto: m.concepto,
        monto: parseFloat(m.monto),
        fecha: m.fecha.toISOString(),
        empleado_id: m.empleado_id,
        notas: m.notas,
      })),
      ventas_resumen: {
        cantidad_total: await this.cierreRepo.contarVentas(sesion_id),
        monto_total: await this.cierreRepo.calcularTotalVentas(sesion_id),
      },
      timestamp_snapshot: new Date().toISOString(),
    };

    // Transacción para cerrar sesión y crear detalles
    const connection = await this.db.getConnection();
    try {
      await connection.beginTransaction();

      // Cerrar sesión
      const fechaCierreDate = fecha_cierre ? new Date(fecha_cierre) : new Date();

      const cerrado = await this.sesionRepo.cerrarSesion({
        sesionId: sesion_id,
        empleadoCierreId: empleado_id,
        fechaCierre: fechaCierreDate,
        montoFinalEsperado,
        montoFinalReal: monto_final_real,
        diferencia,
        notasCierre: notas || null,
        cierreInmutableJson: JSON.stringify(snapshot),
      });

      if (!cerrado) {
        throw new CajaAlreadyClosedError(sesion_id);
      }

      // Crear detalles por forma de pago
      for (const total of totalesPorFormaPago) {
        await this.cierreRepo.crearDetalle({
          detalleId: uuidv4(),
          sesionCajaId: sesion_id,
          formaPagoId: total.forma_pago_id,
          nombreFormaPago: total.nombre_forma_pago,
          cantidadTransacciones: total.cantidad_transacciones,
          montoTotal: parseFloat(total.monto_total),
        });
      }

      await connection.commit();

      logger.info('Caja cerrada exitosamente', {
        sesion_id,
        numero_sesion: sesion.numero_sesion,
        empleado_id,
        monto_final_esperado: montoFinalEsperado,
        monto_final_real,
        diferencia,
      });

      return await this.construirCierreResponse(sesion_id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Consultar sesión activa de una sucursal
   */
  async obtenerSesionActiva(sucursalId: string): Promise<SesionActivaResponseDto | null> {
    const sesion = await this.sesionRepo.obtenerSesionActiva(sucursalId);

    if (!sesion) {
      return null;
    }

    return {
      sesion_id: sesion.id,
      numero_sesion: sesion.numero_sesion,
      estado: EstadoSesionCaja.ABIERTA,
      fecha_apertura: sesion.fecha_apertura.toISOString(),
      monto_inicial: parseFloat(sesion.monto_inicial),
      empleado_apertura_id: sesion.empleado_apertura_id,
    };
  }

  /**
   * Construir response de cierre (usado para idempotencia)
   */
  private async construirCierreResponse(sesionId: string): Promise<CierreCajaResponseDto> {
    const sesion = await this.sesionRepo.obtenerPorId(sesionId);
    if (!sesion || sesion.estado !== 'cerrada') {
      throw new SesionCajaNotFoundError(sesionId);
    }

    const detalles = await this.cierreRepo.obtenerDetallesPorSesion(sesionId);
    const movimientos = await this.movimientoRepo.obtenerMovimientosPorSesion(sesionId);
    const empleadoApertura = await this.empleadoRepo.obtenerPorId(sesion.empleado_apertura_id);
    const empleadoCierre = await this.empleadoRepo.obtenerPorId(sesion.empleado_cierre_id!);

    return {
      sesion_id: sesion.id,
      numero_sesion: sesion.numero_sesion,
      fecha_apertura: sesion.fecha_apertura.toISOString(),
      fecha_cierre: sesion.fecha_cierre!.toISOString(),
      empleado_apertura: {
        id: empleadoApertura!.id,
        nombre: empleadoApertura!.nombre,
        apellido: empleadoApertura!.apellido || undefined,
      },
      empleado_cierre: {
        id: empleadoCierre!.id,
        nombre: empleadoCierre!.nombre,
        apellido: empleadoCierre!.apellido || undefined,
      },
      monto_inicial: parseFloat(sesion.monto_inicial),
      monto_final_esperado: parseFloat(sesion.monto_final_esperado!),
      monto_final_real: parseFloat(sesion.monto_final_real!),
      diferencia: parseFloat(sesion.diferencia!),
      estado: EstadoSesionCaja.CERRADA,
      totales_por_forma_pago: detalles.map(d => ({
        forma_pago_id: d.forma_pago_id,
        nombre: d.nombre_forma_pago,
        cantidad_transacciones: d.cantidad_transacciones,
        monto_total: parseFloat(d.monto_total),
      })),
      movimientos: movimientos.map(m => ({
        id: m.id,
        tipo: m.tipo,
        concepto: m.concepto,
        monto: parseFloat(m.monto),
        fecha: m.fecha.toISOString(),
        empleado_id: m.empleado_id,
        notas: m.notas,
      })),
      notas_apertura: sesion.notas_apertura,
      notas_cierre: sesion.notas_cierre,
    };
  }
}
