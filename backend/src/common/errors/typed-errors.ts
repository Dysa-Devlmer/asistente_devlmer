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
