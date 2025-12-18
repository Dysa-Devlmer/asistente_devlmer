import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database';

describe('Database Connection', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to database successfully', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as value`;
    expect(result).toBeDefined();
  });

  it('should execute raw queries', async () => {
    const result: any = await prisma.$queryRaw`SELECT NOW() as current_time`;
    expect(result).toHaveLength(1);
    expect(result[0].current_time).toBeInstanceOf(Date);
  });
});
