/**
 * DTOs de respuesta estándar para API de Caja
 */

/**
 * Wrapper genérico de respuesta exitosa
 */
export interface CajaApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Wrapper para respuesta de error
 * (Manejado por error-handler.middleware, pero documentado aquí)
 */
export interface CajaApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  code: string;
  message: string;
  metadata: {
    request_id: string;
    timestamp: string;
    [key: string]: any;
  };
}

/**
 * Helper para crear respuestas exitosas
 */
export function createSuccessResponse<T>(data: T): CajaApiResponse<T> {
  return {
    success: true,
    data,
  };
}
