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

  it('should create an order', async () => {
    const product = { id: 'prod-1', name: 'Test Product', price: new Prisma.Decimal(10.0) };
    const orderData = { storeId: 'store-1', items: [{ productId: 'prod-1', quantity: 2 }] };

    (prismaMock.product.findUnique as any).mockResolvedValue(product);
    (prismaMock.order.create as any).mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      storeId: 'store-1',
      total: new Prisma.Decimal(20.0),
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).post('/orders').send(orderData);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('order-1');
  });

  it('should list user orders', async () => {
    const orders = [
      { id: 'order-1', userId: 'user-1', total: new Prisma.Decimal(20.0), status: 'PENDING', storeId: 's1', createdAt: new Date(), updatedAt: new Date() },
    ];
    (prismaMock.order.findMany as any).mockResolvedValue(orders);
    (prismaMock.order.count as any).mockResolvedValue(1);

    const res = await request(app).get('/orders');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('order-1');
  });

  it('should update order status with a valid transition', async () => {
    const order = { id: 'order-1', status: 'PENDING', userId: 'user-1' };
    (prismaMock.order.findFirst as any).mockResolvedValue(order);
    (prismaMock.order.update as any).mockResolvedValue({ ...order, status: 'ACCEPTED' });

    const res = await request(app)
      .patch('/orders/order-1')
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ACCEPTED');
  });

  it('should not update order status with an invalid transition', async () => {
    const order = { id: 'order-1', status: 'PENDING', userId: 'user-1' };
    (prismaMock.order.findFirst as any).mockResolvedValue(order);

    const res = await request(app)
      .patch('/orders/order-1')
      .send({ status: 'DELIVERED' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });
});
