import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let prismaMock: any;
vi.mock('@prisma/client', () => {
  prismaMock = {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((actions: any[]) => Promise.all(actions)),
  };
  return { PrismaClient: vi.fn(() => prismaMock) };
});

vi.mock('../src/middlewares/auth.js', () => ({
  default: (req: any, _res: any, next: any) => { req.user = { id: '1', role: 'admin' }; next(); },
  authMiddleware: (req: any, _res: any, next: any) => { req.user = { id: '1', role: 'admin' }; next(); },
}));

vi.mock('../src/middlewares/rbac.js', () => ({
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Catalog routes', () => {
  let app: express.Express;
  let catalogRouter: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    catalogRouter = (await import('../src/routes/catalog.js')).default;
    app.use('/catalog', catalogRouter);

    prismaMock.product.findMany.mockReset();
    prismaMock.product.count.mockReset();
    prismaMock.product.update.mockReset();
  });

  it('lists catalog items', async () => {
    prismaMock.product.findMany.mockResolvedValue([{ id: 'p1', name: 'Product 1' }]);
    prismaMock.product.count.mockResolvedValue(1);

    const res = await request(app).get('/catalog');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 404 when updating non-existent product', async () => {
    prismaMock.product.update.mockRejectedValue({ code: 'P2025' });

    const res = await request(app)
      .put('/catalog/nonexistent')
      .send({ name: 'New' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

