import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let prismaMock: any;
vi.mock('@prisma/client', () => {
  prismaMock = {
    order: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => prismaMock) };
});

vi.mock('../src/middlewares/auth.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => { req.user = { id: 'user1', role: 'customer' }; next(); },
}));

describe('Orders routes', () => {
  let app: express.Express;
  let ordersRouter: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    ordersRouter = (await import('../src/routes/orders.js')).default;
    app.use('/orders', ordersRouter);

    prismaMock.order.findMany.mockReset();
    prismaMock.order.count.mockReset();
    prismaMock.order.findFirst.mockReset();
  });

  it('lists user orders', async () => {
    prismaMock.order.findMany.mockResolvedValue([{ id: 'o1', userId: 'user1' }]);
    prismaMock.order.count.mockResolvedValue(1);

    const res = await request(app).get('/orders');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 404 for unknown order', async () => {
    prismaMock.order.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/orders/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

