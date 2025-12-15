/**
 * Database Configuration
 *
 * Configuración de timeouts y connection pooling para MySQL
 */

import { DatabaseTimeoutError, DatabaseConnectionFailedError } from '../errors/typed-errors';
import { logger } from '../logging/structured-logger';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  connectTimeout: number;      // ms para establecer conexión
  acquireTimeout: number;      // ms para adquirir conexión del pool
  timeout: number;             // ms para queries (statement timeout)
  queueLimit: number;          // máximo de requests en queue
}

/**
 * Configuración por defecto para producción
 */
export const defaultDatabaseConfig: Partial<DatabaseConfig> = {
  connectionLimit: 10,         // 10 conexiones concurrentes
  connectTimeout: 10000,       // 10s para conectar
  acquireTimeout: 10000,       // 10s para adquirir del pool
  timeout: 30000,              // 30s timeout para queries
  queueLimit: 0,               // Sin límite de queue (usa acquireTimeout)
};

/**
 * Crear configuración de DB con timeouts
 */
export function createDatabaseConfig(config: DatabaseConfig): any {
  return {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,

    // Connection pool
    connectionLimit: config.connectionLimit,
    queueLimit: config.queueLimit,

    // Timeouts
    connectTimeout: config.connectTimeout,
    acquireTimeout: config.acquireTimeout,
    timeout: config.timeout,

    // Opciones adicionales
    waitForConnections: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,

    // Charset
    charset: 'utf8mb4',

    // Timezone
    timezone: 'Z', // UTC
  };
}

/**
 * Wrapper para queries con timeout manual
 */
export async function executeWithTimeout<T>(
  db: any,
  query: string,
  params: any[] = [],
  timeoutMs: number = 30000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new DatabaseTimeoutError(timeoutMs, {
        query: query.substring(0, 100), // Solo primeros 100 chars
      }));
    }, timeoutMs);
  });

  const queryPromise = db.execute(query, params);

  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    return result as T;
  } catch (error: any) {
    // Re-throw timeout error
    if (error instanceof DatabaseTimeoutError) {
      logger.error('Database query timeout', {
        query: query.substring(0, 100),
        timeout_ms: timeoutMs,
      }, error);
      throw error;
    }

    // Otros errores de DB
    logger.error('Database query error', {
      query: query.substring(0, 100),
      error_code: error.code,
      error_message: error.message,
    }, error);

    throw error;
  }
}

/**
 * Verificar conexión de DB con retry
 */
export async function verifyDatabaseConnection(
  db: any,
  maxRetries: number = 3,
  retryDelayMs: number = 1000
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Attempting database connection (attempt ${attempt}/${maxRetries})`);

      await db.execute('SELECT 1 AS connection_test');

      logger.info('Database connection successful');
      return;
    } catch (error: any) {
      lastError = error;
      logger.warn(`Database connection attempt ${attempt} failed`, {
        attempt,
        max_retries: maxRetries,
        error_message: error.message,
      });

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  throw new DatabaseConnectionFailedError({
    attempts: maxRetries,
    last_error: lastError?.message,
  });
}
