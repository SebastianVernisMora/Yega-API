import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createOrdersRouter } from '../src/routes/orders';
import { createPrismaMock } from './helpers/prisma';
import { Prisma, PrismaClient } from '@prisma/client';

// Mock middlewares
vi.mock('../src/middlewares/auth.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', role: 'client' };
    next();
  },
}));

describe('Orders Routes', () => {
  let app: express.Express;
  let prismaMock: PrismaClient;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    app = express();
    app.use(express.json());
    app.use('/orders', createOrdersRouter(prismaMock));
  });

  it('should create an order (simulated)', async () => {
    const orderData = { storeId: 'store-1', items: [{ productId: 'prod-1', quantity: 2 }] };

    const res = await request(app).post('/orders').send(orderData);

    expect(res.status).toBe(201);
    expect(res.body.id).toEqual(expect.any(String));
    expect(res.body.status).toBe('pending');
    expect(res.body.storeId).toBe(orderData.storeId);
    expect(res.body.items).toEqual(orderData.items);
    // Also check for a valid UUID if possible, but for now string is enough
    expect(res.body.id.length).toBe(36);
  });

  it('should list user orders', async () => {
    const orders = [
      { id: 'order-1', userId: 'user-1', total: new Prisma.Decimal(20.0), status: 'pending', storeId: 's1', createdAt: new Date(), updatedAt: new Date() },
    ];
    (prismaMock.order.findMany as any).mockResolvedValue(orders);
    (prismaMock.order.count as any).mockResolvedValue(1);

    const res = await request(app).get('/orders');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('order-1');
  });
});
