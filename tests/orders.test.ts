import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createOrdersRouter } from '../src/routes/orders';
import { createPrismaMock } from './helpers/prisma';
import { Prisma, PrismaClient, Product } from '@prisma/client';

// Mock middlewares
vi.mock('../src/middlewares/auth.js', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'user-1', role: 'client' };
    next();
  },
}));

describe('Orders Routes', () => {
  let app: express.Express;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    app = express();
    app.use(express.json());
    app.use('/orders', createOrdersRouter(prismaMock));
  });

  it('should create an order with sufficient stock and correct total', async () => {
    const store = { id: 'store-1', name: 'Test Store' };
    const product: Product = { id: 'prod-1', name: 'Test Product', price: 10.0, storeId: 'store-1', stock: 10, description: null, createdAt: new Date(), updatedAt: new Date() };
    const orderData = { storeId: 'store-1', items: [{ productId: 'prod-1', quantity: 2 }] };
    const shippingCost = 5.0;
    const total = (product.price * 2) + shippingCost;

    const createdOrder = {
      id: 'order-1',
      userId: 'user-1',
      storeId: 'store-1',
      total: total,
      status: 'PENDING',
      items: [{ productId: 'prod-1', quantity: 2, price: 10.0 }],
    };

    // Mock transaction
    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      prismaMock.store.findUnique.mockResolvedValue(store);
      prismaMock.product.findMany.mockResolvedValue([product]);
      prismaMock.product.update.mockResolvedValue({ ...product, stock: product.stock - 2 });
      prismaMock.order.create.mockResolvedValue(createdOrder);
      return await callback(prismaMock);
    });

    const res = await request(app).post('/orders').send(orderData);

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(total);
    expect(prismaMock.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stock: { decrement: 2 } },
    });
  });

  it('should fail to create an order with insufficient stock', async () => {
    const store = { id: 'store-1', name: 'Test Store' };
    const product: Product = { id: 'prod-1', name: 'Test Product', price: 10.0, storeId: 'store-1', stock: 1, description: null, createdAt: new Date(), updatedAt: new Date() };
    const orderData = { storeId: 'store-1', items: [{ productId: 'prod-1', quantity: 2 }] };

    prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.store.findUnique.mockResolvedValue(store);
        prismaMock.product.findMany.mockResolvedValue([product]);
        return await callback(prismaMock);
      });

    const res = await request(app).post('/orders').send(orderData);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  it('should list user orders', async () => {
    const orders = [{ id: 'order-1', userId: 'user-1', total: 25.0, status: 'PENDING' }];
    prismaMock.order.findMany.mockResolvedValue(orders);
    prismaMock.order.count.mockResolvedValue(1);

    const res = await request(app).get('/orders');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('order-1');
  });

  it('should update order status with a valid transition', async () => {
    const order = { id: 'order-1', status: 'PENDING', userId: 'user-1' };
    prismaMock.order.findFirst.mockResolvedValue(order);
    prismaMock.order.update.mockResolvedValue({ ...order, status: 'ACCEPTED' });

    const res = await request(app)
      .patch('/orders/order-1/status')
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ACCEPTED');
  });

  it('should not update order status with an invalid transition', async () => {
    const order = { id: 'order-1', status: 'PENDING', userId: 'user-1' };
    prismaMock.order.findFirst.mockResolvedValue(order);

    const res = await request(app)
      .patch('/orders/order-1/status')
      .send({ status: 'DELIVERED' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });
});
