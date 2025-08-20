import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCatalogRouter } from '../src/routes/catalog';
import { createPrismaMock } from './helpers/prisma';
import { PrismaClient } from '@prisma/client';

// Mock middlewares
vi.mock('../src/middlewares/auth.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => { req.user = { id: '1', role: 'admin' }; next(); },
}));
vi.mock('../src/middlewares/rbac.js', () => ({
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Catalog routes', () => {
  let app: express.Express;
  let prismaMock: PrismaClient;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    app = express();
    app.use(express.json());
    app.use('/catalog', createCatalogRouter(prismaMock));
  });

  it('lists catalog items', async () => {
    const products = [{ id: 'p1', name: 'Product 1', description: 'A product', price: 10, storeId: 's1', createdAt: new Date(), updatedAt: new Date() }];
    (prismaMock.product.findMany as any).mockResolvedValue(products);
    (prismaMock.product.count as any).mockResolvedValue(1);

    const res = await request(app).get('/catalog/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 404 when updating non-existent product', async () => {
    (prismaMock.product.update as any).mockRejectedValue({ code: 'P2025' });

    const res = await request(app)
      .put('/catalog/products/nonexistent')
      .send({ name: 'New' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
