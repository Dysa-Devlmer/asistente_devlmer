/**
 * DTO Base para Responses de Bootstrap API v2.0
 *
 * Todos los endpoints retornan esta estructura:
 * {
 *   "bootstrap_version": "2.0.0",
 *   "generated_at": "2025-01-15T14:30:00.000Z",
 *   "data": { ... }
 * }
 */

import { IsString, IsDateString } from 'class-validator';

/**
 * Constante de versión Bootstrap
 */
export const BOOTSTRAP_VERSION = '2.0.0';

/**
 * Wrapper genérico para responses de Bootstrap
 */
export class BootstrapResponseWrapper<T> {
  @IsString()
  bootstrap_version: string;

  @IsDateString()
  generated_at: string;

  data: T;

  constructor(data: T) {
    this.bootstrap_version = BOOTSTRAP_VERSION;
    this.generated_at = new Date().toISOString();
    this.data = data;
  }
}
