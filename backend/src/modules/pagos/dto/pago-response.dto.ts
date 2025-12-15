/**
 * Response DTOs para Pagos
 *
 * Estructuras de respuesta estandarizadas
 */

/**
 * Respuesta exitosa estándar
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Crear respuesta exitosa
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}
