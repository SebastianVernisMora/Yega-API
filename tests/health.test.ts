import request from 'supertest';
import express from 'express';
import { describe, it, expect } from 'vitest';
import healthRouter from '../src/routes/health';

const app = express();
app.use('/', healthRouter);

describe('Health Route', () => {
  it('should return 200 with status UP for /health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ status: 'UP' });
  });
});
