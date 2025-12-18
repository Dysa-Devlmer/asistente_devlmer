import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server';

describe('Health Endpoint', () => {
  const app = createServer();

  it('should return 200 and status ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('database');
  });

  it('should have correct response structure', async () => {
    const response = await request(app).get('/health');

    expect(response.body.status).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.database).toBeDefined();
  });
});
