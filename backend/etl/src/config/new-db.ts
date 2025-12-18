/**
 * New PostgreSQL Database Connection (via Prisma)
 * Sistema nuevo: pos_db (PostgreSQL 14+, utf8mb4)
 */

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.LOG_LEVEL === 'debug' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });
    console.log('✅ Connected to new PostgreSQL database (Prisma)');
  }
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    console.log('🔒 Disconnected Prisma client');
  }
}
