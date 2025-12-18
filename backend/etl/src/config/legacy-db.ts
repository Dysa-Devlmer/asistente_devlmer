/**
 * Legacy MySQL Database Connection (READ-ONLY)
 * Sistema legacy: sysmehotel (MySQL 5.x, latin1)
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let connection: mysql.Connection | null = null;

export async function getLegacyConnection(): Promise<mysql.Connection> {
  if (connection) {
    return connection;
  }

  connection = await mysql.createConnection({
    host: process.env.LEGACY_DB_HOST || 'localhost',
    port: parseInt(process.env.LEGACY_DB_PORT || '3306'),
    user: process.env.LEGACY_DB_USER || 'root',
    password: process.env.LEGACY_DB_PASSWORD || '',
    database: process.env.LEGACY_DB_NAME || 'sysmehotel',
    // Force UTF8 using charset number (utf8mb4 = 45, utf8 = 33)
    // Avoiding string charset to prevent recognition issues
    charsetNumber: 33, // UTF8 (compatible with legacy)
    timezone: '+00:00',
  });

  console.log('✅ Connected to legacy MySQL database (READ-ONLY)');
  return connection;
}

export async function closeLegacyConnection(): Promise<void> {
  if (connection) {
    await connection.end();
    connection = null;
    console.log('🔒 Closed legacy MySQL connection');
  }
}

/**
 * Execute legacy query with utf8mb4 conversion
 */
export async function queryLegacy<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const conn = await getLegacyConnection();
  const [rows] = await conn.execute(sql, params);
  return rows as T[];
}
