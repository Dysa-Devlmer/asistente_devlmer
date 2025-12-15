/**
 * Sistema de Errores Tipificados
 *
 * Errores con códigos, mensajes estandarizados y metadata
 * para debugging y operación
 */

/**
 * Códigos de error estandarizados
 */
export enum ErrorCode {
  // 400 - Bad Request
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_UUID = 'INVALID_UUID',
  INVALID_PAGINATION = 'INVALID_PAGINATION',
  INVALID_TIMESTAMP = 'INVALID_TIMESTAMP',
  MISSING_REQUIRED_PARAM = 'MISSING_REQUIRED_PARAM',

  // 404 - Not Found
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  SUCURSAL_NOT_FOUND = 'SUCURSAL_NOT_FOUND',
  EMPLEADO_NOT_FOUND = 'EMPLEADO_NOT_FOUND',
  SESION_CAJA_NOT_FOUND = 'SESION_CAJA_NOT_FOUND',
  MOVIMIENTO_CAJA_NOT_FOUND = 'MOVIMIENTO_CAJA_NOT_FOUND',

  // 409 - Conflict (Caja business rules)
  CAJA_ALREADY_OPEN = 'CAJA_ALREADY_OPEN',
  CAJA_NOT_OPEN = 'CAJA_NOT_OPEN',
  CAJA_ALREADY_CLOSED = 'CAJA_ALREADY_CLOSED',

  // 403 - Forbidden
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // 404 - Not Found (Pagos)
  PAGO_NOT_FOUND = 'PAGO_NOT_FOUND',
  VENTA_NOT_FOUND = 'VENTA_NOT_FOUND',
  FORMA_PAGO_NOT_FOUND = 'FORMA_PAGO_NOT_FOUND',

  // 409 - Conflict (Pagos business rules)
  PAGO_ALREADY_PROCESSED = 'PAGO_ALREADY_PROCESSED',
  PAGO_ALREADY_CANCELLED = 'PAGO_ALREADY_CANCELLED',
  INVALID_PAYMENT_STATE = 'INVALID_PAYMENT_STATE',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  CANNOT_CANCEL_APPROVED = 'CANNOT_CANCEL_APPROVED',

  // 400 - Bad Request (Pagos)
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INSUFFICIENT_CASH = 'INSUFFICIENT_CASH',
  INVALID_PAYMENT_METHOD = 'INVALID_PAYMENT_METHOD',
  TOKEN_MISMATCH = 'TOKEN_MISMATCH',

  // 500 - External Service Error (Webpay)
  WEBPAY_INIT_ERROR = 'WEBPAY_INIT_ERROR',
  WEBPAY_CONFIRM_ERROR = 'WEBPAY_CONFIRM_ERROR',
  WEBPAY_REVERSAL_ERROR = 'WEBPAY_REVERSAL_ERROR',
  WEBPAY_TIMEOUT = 'WEBPAY_TIMEOUT',

  // 429 - Too Many Requests
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // 500 - Internal Server Error
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_TIMEOUT = 'DATABASE_TIMEOUT',
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // 503 - Service Unavailable
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_UNAVAILABLE = 'DATABASE_UNAVAILABLE',
}

/**
 * Metadata adicional para errores
 */
export interface ErrorMetadata {
  [key: string]: any;
  request_id?: string;
  timestamp?: string;
  path?: string;
  method?: string;
}

/**
 * Clase base para errores tipificados
 */
export class TypedError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly metadata: ErrorMetadata;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    metadata: ErrorMetadata = {},
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.metadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
    };
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convertir a formato JSON para responses
   */
  toJSON() {
    return {
      statusCode: this.statusCode,
      error: this.getErrorName(),
      code: this.code,
      message: this.message,
      metadata: this.metadata,
    };
  }

  private getErrorName(): string {
    if (this.statusCode >= 500) return 'Internal Server Error';
    if (this.statusCode === 404) return 'Not Found';
    if (this.statusCode === 429) return 'Too Many Requests';
    if (this.statusCode >= 400) return 'Bad Request';
    return 'Error';
  }
}

/**
 * Errores 400 - Bad Request
 */
export class ValidationError extends TypedError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, metadata);
  }
}

export class InvalidUUIDError extends TypedError {
  constructor(fieldName: string, value: string, metadata: ErrorMetadata = {}) {
    super(
      `${fieldName} debe ser un UUID válido (recibido: ${value})`,
      ErrorCode.INVALID_UUID,
      400,
      { ...metadata, fieldName, value }
    );
  }
}

export class InvalidPaginationError extends TypedError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, ErrorCode.INVALID_PAGINATION, 400, metadata);
  }
}

export class InvalidTimestampError extends TypedError {
  constructor(fieldName: string, value: string, metadata: ErrorMetadata = {}) {
    super(
      `${fieldName} debe ser ISO 8601 válido (recibido: ${value})`,
      ErrorCode.INVALID_TIMESTAMP,
      400,
      { ...metadata, fieldName, value }
    );
  }
}

export class MissingRequiredParamError extends TypedError {
  constructor(paramName: string, metadata: ErrorMetadata = {}) {
    super(
      `${paramName} es requerido`,
      ErrorCode.MISSING_REQUIRED_PARAM,
      400,
      { ...metadata, paramName }
    );
  }
}

/**
 * Errores 404 - Not Found
 */
export class ResourceNotFoundError extends TypedError {
  constructor(resourceType: string, resourceId: string, metadata: ErrorMetadata = {}) {
    super(
      `${resourceType} con ID ${resourceId} no encontrado`,
      ErrorCode.RESOURCE_NOT_FOUND,
      404,
      { ...metadata, resourceType, resourceId }
    );
  }
}

export class SucursalNotFoundError extends TypedError {
  constructor(sucursalId: string, metadata: ErrorMetadata = {}) {
    super(
      `Sucursal con ID ${sucursalId} no encontrada o inactiva`,
      ErrorCode.SUCURSAL_NOT_FOUND,
      404,
      { ...metadata, sucursalId }
    );
  }
}

/**
 * Errores 429 - Rate Limit
 */
export class RateLimitExceededError extends TypedError {
  constructor(limit: number, windowMs: number, metadata: ErrorMetadata = {}) {
    super(
      `Rate limit excedido: máximo ${limit} requests por ${windowMs / 1000}s`,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      { ...metadata, limit, windowMs }
    );
  }
}

/**
 * Errores 500 - Internal Server Error
 */
export class DatabaseError extends TypedError {
  constructor(message: string, metadata: ErrorMetadata = {}, isOperational: boolean = true) {
    super(message, ErrorCode.DATABASE_ERROR, 500, metadata, isOperational);
  }
}

export class DatabaseTimeoutError extends TypedError {
  constructor(timeoutMs: number, metadata: ErrorMetadata = {}) {
    super(
      `Database query timeout (${timeoutMs}ms)`,
      ErrorCode.DATABASE_TIMEOUT,
      500,
      { ...metadata, timeoutMs }
    );
  }
}

export class DatabaseConnectionFailedError extends TypedError {
  constructor(metadata: ErrorMetadata = {}) {
    super(
      'Database connection failed',
      ErrorCode.DATABASE_CONNECTION_FAILED,
      500,
      metadata,
      false // No operacional - requiere intervención
    );
  }
}

export class InternalError extends TypedError {
  constructor(message: string, metadata: ErrorMetadata = {}, isOperational: boolean = false) {
    super(message, ErrorCode.INTERNAL_ERROR, 500, metadata, isOperational);
  }
}

/**
 * Errores 503 - Service Unavailable
 */
export class ServiceUnavailableError extends TypedError {
  constructor(serviceName: string, metadata: ErrorMetadata = {}) {
    super(
      `Service ${serviceName} is unavailable`,
      ErrorCode.SERVICE_UNAVAILABLE,
      503,
      { ...metadata, serviceName },
      true
    );
  }
}

export class DatabaseUnavailableError extends TypedError {
  constructor(metadata: ErrorMetadata = {}) {
    super(
      'Database is unavailable',
      ErrorCode.DATABASE_UNAVAILABLE,
      503,
      metadata,
      true
    );
  }
}

/**
 * Errores 404 - Not Found (Caja)
 */
export class EmpleadoNotFoundError extends TypedError {
  constructor(empleadoId: string, metadata: ErrorMetadata = {}) {
    super(
      `Empleado con ID ${empleadoId} no encontrado`,
      ErrorCode.EMPLEADO_NOT_FOUND,
      404,
      { ...metadata, empleadoId },
      true
    );
  }
}

export class SesionCajaNotFoundError extends TypedError {
  constructor(sesionId: string, metadata: ErrorMetadata = {}) {
    super(
      `Sesión de caja con ID ${sesionId} no encontrada`,
      ErrorCode.SESION_CAJA_NOT_FOUND,
      404,
      { ...metadata, sesionId },
      true
    );
  }
}

export class MovimientoCajaNotFoundError extends TypedError {
  constructor(movimientoId: string, metadata: ErrorMetadata = {}) {
    super(
      `Movimiento de caja con ID ${movimientoId} no encontrado`,
      ErrorCode.MOVIMIENTO_CAJA_NOT_FOUND,
      404,
      { ...metadata, movimientoId },
      true
    );
  }
}

/**
 * Errores 409 - Conflict (Reglas de negocio de Caja)
 */
export class CajaAlreadyOpenError extends TypedError {
  constructor(sucursalId: string, sesionActivaId: string, metadata: ErrorMetadata = {}) {
    super(
      `Ya existe una caja abierta en la sucursal ${sucursalId}. Cierre la sesión ${sesionActivaId} antes de abrir una nueva.`,
      ErrorCode.CAJA_ALREADY_OPEN,
      409,
      { ...metadata, sucursalId, sesionActivaId },
      true
    );
  }
}

export class CajaNotOpenError extends TypedError {
  constructor(sucursalId: string, metadata: ErrorMetadata = {}) {
    super(
      `No hay una caja abierta en la sucursal ${sucursalId}. Debe abrir la caja primero.`,
      ErrorCode.CAJA_NOT_OPEN,
      409,
      { ...metadata, sucursalId },
      true
    );
  }
}

export class CajaAlreadyClosedError extends TypedError {
  constructor(sesionId: string, metadata: ErrorMetadata = {}) {
    super(
      `La sesión de caja ${sesionId} ya está cerrada. No se puede modificar una caja cerrada (inmutabilidad).`,
      ErrorCode.CAJA_ALREADY_CLOSED,
      409,
      { ...metadata, sesionId },
      true
    );
  }
}

/**
 * Errores 403 - Forbidden
 */
export class InsufficientPermissionsError extends TypedError {
  constructor(requiredPermission: string, metadata: ErrorMetadata = {}) {
    super(
      `Permisos insuficientes. Se requiere el permiso: ${requiredPermission}`,
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      403,
      { ...metadata, requiredPermission },
      true
    );
  }
}

/**
 * Errores 404 - Not Found (Pagos)
 */
export class PagoNotFoundError extends TypedError {
  constructor(pagoId: string, metadata: ErrorMetadata = {}) {
    super(
      `Pago con ID ${pagoId} no encontrado`,
      ErrorCode.PAGO_NOT_FOUND,
      404,
      { ...metadata, pagoId },
      true
    );
  }
}

export class VentaNotFoundError extends TypedError {
  constructor(ventaId: string, metadata: ErrorMetadata = {}) {
    super(
      `Venta con ID ${ventaId} no encontrada`,
      ErrorCode.VENTA_NOT_FOUND,
      404,
      { ...metadata, ventaId },
      true
    );
  }
}

export class FormaPagoNotFoundError extends TypedError {
  constructor(formaPagoId: string, metadata: ErrorMetadata = {}) {
    super(
      `Forma de pago con ID ${formaPagoId} no encontrada`,
      ErrorCode.FORMA_PAGO_NOT_FOUND,
      404,
      { ...metadata, formaPagoId },
      true
    );
  }
}

/**
 * Errores 409 - Conflict (Reglas de negocio de Pagos)
 */
export class PagoAlreadyProcessedError extends TypedError {
  constructor(pagoId: string, estadoActual: string, metadata: ErrorMetadata = {}) {
    super(
      `El pago ${pagoId} ya fue procesado (estado: ${estadoActual}). No se puede volver a procesar.`,
      ErrorCode.PAGO_ALREADY_PROCESSED,
      409,
      { ...metadata, pagoId, estadoActual },
      true
    );
  }
}

export class PagoAlreadyCancelledError extends TypedError {
  constructor(pagoId: string, metadata: ErrorMetadata = {}) {
    super(
      `El pago ${pagoId} ya está anulado. No se puede modificar un pago anulado.`,
      ErrorCode.PAGO_ALREADY_CANCELLED,
      409,
      { ...metadata, pagoId },
      true
    );
  }
}

export class InvalidPaymentStateError extends TypedError {
  constructor(pagoId: string, estadoActual: string, estadoRequerido: string, metadata: ErrorMetadata = {}) {
    super(
      `El pago ${pagoId} está en estado ${estadoActual}, se requiere estado ${estadoRequerido}`,
      ErrorCode.INVALID_PAYMENT_STATE,
      409,
      { ...metadata, pagoId, estadoActual, estadoRequerido },
      true
    );
  }
}

export class InvalidStateTransitionError extends TypedError {
  constructor(estadoActual: string, estadoNuevo: string, metadata: ErrorMetadata = {}) {
    super(
      `Transición de estado inválida: ${estadoActual} -> ${estadoNuevo}`,
      ErrorCode.INVALID_STATE_TRANSITION,
      409,
      { ...metadata, estadoActual, estadoNuevo },
      true
    );
  }
}

export class CannotCancelApprovedError extends TypedError {
  constructor(pagoId: string, motivo: string, metadata: ErrorMetadata = {}) {
    super(
      `No se puede anular el pago aprobado ${pagoId}: ${motivo}`,
      ErrorCode.CANNOT_CANCEL_APPROVED,
      409,
      { ...metadata, pagoId, motivo },
      true
    );
  }
}

/**
 * Errores 400 - Bad Request (Pagos)
 */
export class InvalidAmountError extends TypedError {
  constructor(monto: number, motivo: string, metadata: ErrorMetadata = {}) {
    super(
      `Monto inválido (${monto}): ${motivo}`,
      ErrorCode.INVALID_AMOUNT,
      400,
      { ...metadata, monto, motivo },
      true
    );
  }
}

export class InsufficientCashError extends TypedError {
  constructor(montoRequerido: number, montoRecibido: number, metadata: ErrorMetadata = {}) {
    super(
      `Efectivo insuficiente. Se requiere $${montoRequerido}, se recibió $${montoRecibido}`,
      ErrorCode.INSUFFICIENT_CASH,
      400,
      { ...metadata, montoRequerido, montoRecibido },
      true
    );
  }
}

export class InvalidPaymentMethodError extends TypedError {
  constructor(metodo: string, metadata: ErrorMetadata = {}) {
    super(
      `Método de pago inválido: ${metodo}`,
      ErrorCode.INVALID_PAYMENT_METHOD,
      400,
      { ...metadata, metodo },
      true
    );
  }
}

export class TokenMismatchError extends TypedError {
  constructor(metadata: ErrorMetadata = {}) {
    super(
      'El token Webpay no coincide con el pago registrado',
      ErrorCode.TOKEN_MISMATCH,
      400,
      metadata,
      true
    );
  }
}

/**
 * Errores 500 - External Service Error (Webpay)
 */
export class WebpayInitError extends TypedError {
  constructor(errorMessage: string, metadata: ErrorMetadata = {}) {
    super(
      `Error al iniciar transacción Webpay: ${errorMessage}`,
      ErrorCode.WEBPAY_INIT_ERROR,
      500,
      metadata,
      true
    );
  }
}

export class WebpayConfirmError extends TypedError {
  constructor(errorMessage: string, metadata: ErrorMetadata = {}) {
    super(
      `Error al confirmar transacción Webpay: ${errorMessage}`,
      ErrorCode.WEBPAY_CONFIRM_ERROR,
      500,
      metadata,
      true
    );
  }
}

export class WebpayReversalError extends TypedError {
  constructor(errorMessage: string, metadata: ErrorMetadata = {}) {
    super(
      `Error al reversar transacción Webpay: ${errorMessage}`,
      ErrorCode.WEBPAY_REVERSAL_ERROR,
      500,
      metadata,
      true
    );
  }
}

export class WebpayTimeoutError extends TypedError {
  constructor(timeoutMs: number, metadata: ErrorMetadata = {}) {
    super(
      `Timeout esperando respuesta de Webpay (${timeoutMs}ms)`,
      ErrorCode.WEBPAY_TIMEOUT,
      500,
      { ...metadata, timeoutMs },
      true
    );
  }
}
