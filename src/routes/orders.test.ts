/**
 * Tests for Orders Router
 *
 * Testing Library and Framework: Jest + Supertest (HTTP assertions) with TypeScript
 * - Mocks PrismaClient from @prisma/client
 * - Mocks auth middleware to inject a fake authenticated user
 * - Mounts the router on an Express app
 *
 * Note: This repository currently lacks a test runner configuration.
 * These tests are written for Jest. To run them, add Jest + ts-jest + supertest dev dependencies
 * and a jest.config.ts compatible with ESM + TypeScript, or port to Vitest with minimal changes.
 */

import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

// We mock PrismaClient before importing the router so its instance uses the mock.
const findManyMock = jest.fn();
const countMock = jest.fn();
const findFirstMock = jest.fn();
const createMock = jest.fn();

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      order: {
        findMany: findManyMock,
        count: countMock,
        findFirst: findFirstMock,
        create: createMock,
      },
    })),
  };
});

// Mock auth middleware to set req.user
jest.mock('../middlewares/auth.js', () => {
  const mockAuth = (req: Request & { user?: any }, _res: Response, next: NextFunction) => {
    req.user = { id: 'user_123' };
    next();
  };
  return {
    __esModule: true,
    default: mockAuth,
  };
});

// Import the router under test (aligning with ESM .js import style used in the project)
import ordersRouter from './orders.js';

// Helpers to build an app with the router and a basic error handler
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/orders', ordersRouter);
  // Minimal error handler to capture next(err)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err?.http || 500).json({ error: { message: err?.message || 'Internal Server Error' } });
  });
  return app;
}

describe('Orders Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /orders - list orders for authenticated user', () => {
    it('returns 200 with orders and sets X-Total-Count header (defaults page=1, limit=20)', async () => {
      const fakeOrders = [
        { id: 'o2', userId: 'user_123', items: { storeId: 's1', items: [] }, status: 'pending', createdAt: new Date('2024-01-02') },
        { id: 'o1', userId: 'user_123', items: { storeId: 's1', items: [] }, status: 'pending', createdAt: new Date('2024-01-01') },
      ];

      findManyMock.mockResolvedValueOnce(fakeOrders);
      countMock.mockResolvedValueOnce(42);

      const app = buildApp();
      const res = await request(app).get('/orders').expect(200);

      expect(res.headers['x-total-count']).toBe('42');
      expect(res.body).toEqual(JSON.parse(JSON.stringify(fakeOrders))); // serialize dates

      // Verify prisma args: defaults page=1 -> skip=0, limit=20, ordered by createdAt desc
      expect(findManyMock).toHaveBeenCalledTimes(1);
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user_123' },
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(countMock).toHaveBeenCalledWith({ where: { userId: 'user_123' } });
    });

    it('applies pagination and caps limit<=50 (page=3, limit=100 => limit=50, skip=100)', async () => {
      findManyMock.mockResolvedValueOnce([]);
      countMock.mockResolvedValueOnce(0);

      const app = buildApp();
      await request(app).get('/orders?page=3&limit=100').expect(200);

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user_123' },
          skip: 100, // (3 - 1) * 50
          take: 50,  // capped from 100
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('enforces minimum limit=1 when limit<=0', async () => {
      findManyMock.mockResolvedValueOnce([]);
      countMock.mockResolvedValueOnce(0);

      const app = buildApp();
      await request(app).get('/orders?limit=0').expect(200);

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 1,
        }),
      );
    });

    it('ensures page is at least 1 for negative page values', async () => {
      findManyMock.mockResolvedValueOnce([]);
      countMock.mockResolvedValueOnce(0);

      const app = buildApp();
      await request(app).get('/orders?page=-5').expect(200);

      // Current implementation computes:
      // const page = Math.max(parseInt(pageStr), 1)
      // With page=-5 => parseInt('-5') = -5 => Math.max(-5, 1) = 1
      // skip = (1 - 1) * limit = 0
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        }),
      );
    });

    it('documents current behavior for non-numeric page/limit (NaN propagates)', async () => {
      // This test documents current behavior with invalid inputs.
      // parseInt('abc') => NaN; Math.max(NaN, 1) => NaN; thus skip becomes NaN.
      // If implementation is fixed later to default to 1, update this test accordingly.
      findManyMock.mockResolvedValueOnce([]);
      countMock.mockResolvedValueOnce(0);

      const app = buildApp();
      await request(app).get('/orders?page=abc&limit=xyz').expect(200);

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: NaN,
          take: NaN,
        }),
      );
    });
  });

  describe('GET /orders/:orderId - get specific order', () => {
    it('returns 200 with the order when it exists for the user', async () => {
      const order = { id: 'o1', userId: 'user_123', items: { storeId: 's5', items: [{ sku: 'A', qty: 1 }] }, status: 'pending' };
      findFirstMock.mockResolvedValueOnce(order);

      const app = buildApp();
      const res = await request(app).get('/orders/o1').expect(200);

      expect(res.body).toEqual(order);
      expect(findFirstMock).toHaveBeenCalledWith({
        where: { id: 'o1', userId: 'user_123' },
      });
    });

    it('returns 404 with NOT_FOUND error when order does not exist for the user', async () => {
      findFirstMock.mockResolvedValueOnce(null);

      const app = buildApp();
      const res = await request(app).get('/orders/unknown').expect(404);

      expect(res.body).toEqual({
        error: { code: 'NOT_FOUND', http: 404, message: 'Order not found' },
      });
    });
  });

  describe('POST /orders - create order', () => {
    it('creates a new order with minimal required fields and returns 201', async () => {
      const payload = { storeId: 'store_9', items: [{ sku: 'X', qty: 2 }] };
      const created = {
        id: 'new_order',
        userId: 'user_123',
        items: { storeId: payload.storeId, items: payload.items },
        status: 'pending',
      };
      createMock.mockResolvedValueOnce(created);

      const app = buildApp();
      const res = await request(app).post('/orders').send(payload).expect(201);

      expect(res.body).toEqual(created);
      expect(createMock).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          items: { storeId: 'store_9', items: [{ sku: 'X', qty: 2 }] },
          status: 'pending',
        },
      });
    });

    it('propagates errors from prisma.create via error handler (returns 500)', async () => {
      const payload = { storeId: 's1', items: [] };
      createMock.mockRejectedValueOnce(new Error('DB unavailable'));

      const app = buildApp();
      const res = await request(app).post('/orders').send(payload).expect(500);

      expect(res.body).toEqual({ error: { message: 'DB unavailable' } });
    });
  });

  describe('Error propagation for list and get handlers', () => {
    it('returns 500 when prisma.order.findMany rejects', async () => {
      findManyMock.mockRejectedValueOnce(new Error('query failed'));
      countMock.mockResolvedValueOnce(0);

      const app = buildApp();
      const res = await request(app).get('/orders').expect(500);
      expect(res.body).toEqual({ error: { message: 'query failed' } });
    });

    it('returns 500 when prisma.order.findFirst rejects', async () => {
      findFirstMock.mockRejectedValueOnce(new Error('lookup failed'));

      const app = buildApp();
      const res = await request(app).get('/orders/o1').expect(500);
      expect(res.body).toEqual({ error: { message: 'lookup failed' } });
    });
  });

  // Additional error propagation test for count rejection
  describe('Orders Router - additional error scenarios', () => {
    it('returns 500 when prisma.order.count rejects', async () => {
      countMock.mockRejectedValueOnce(new Error('count failed'));
      findManyMock.mockResolvedValueOnce([]); // Promise.all will reject on count error

      const app = buildApp();
      const res = await request(app).get('/orders').expect(500);
      expect(res.body).toEqual({ error: { message: 'count failed' } });
    });
  });
});