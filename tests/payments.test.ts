import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPaymentsRouter } from '../src/routes/payments';
import { createPrismaMock } from './helpers/prisma';
import { Prisma, PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

// Mock middlewares
vi.mock('../src/middlewares/auth.js', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', role: 'client' };
    next();
  },
}));

const stripeMock = {
  paymentIntents: {
    create: vi.fn(),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
} as unknown as Stripe;


describe('Payments Routes', () => {
  let app: express.Express;
  let prismaMock: PrismaClient;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    app = express();
    app.use(express.json());
    app.use('/payments', createPaymentsRouter(prismaMock, stripeMock));
  });

  describe('POST /payments/intent', () => {
    it('should create a payment intent and return a client secret', async () => {
      const order = {
        id: 'order-1',
        userId: 'user-1',
        total: 100.0,
      };

      (prismaMock.order.findFirst as any).mockResolvedValue(order);

      const paymentIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret_456',
      };
      (stripeMock.paymentIntents.create as any).mockResolvedValue(paymentIntent);

      (prismaMock.payment.create as any).mockResolvedValue({
        id: 'payment-1',
        orderId: 'order-1',
        providerPaymentId: 'pi_123',
        amount: 100.0,
        currency: 'mxn',
        status: 'pending',
      });

      (prismaMock.order.update as any).mockResolvedValue({ ...order, status: 'PAYMENT_PENDING' });


      const res = await request(app)
        .post('/payments/intent')
        .send({ orderId: 'order-1' });

      expect(res.status).toBe(200);
      expect(res.body.clientSecret).toBe('pi_123_secret_456');
      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'mxn',
        automatic_payment_methods: {
            enabled: true,
        },
      });
      expect(prismaMock.payment.create).toHaveBeenCalledWith({
        data: {
          orderId: 'order-1',
          providerPaymentId: 'pi_123',
          amount: 100.0,
          currency: 'mxn',
          status: 'pending',
        },
      });
      expect(prismaMock.order.update).toHaveBeenCalledWith({
        where: {id: 'order-1'},
        data: { status: 'PAYMENT_PENDING' }
    });
    });

    it('should return 404 if order not found', async () => {
      (prismaMock.order.findFirst as any).mockResolvedValue(null);

      const res = await request(app)
        .post('/payments/intent')
        .send({ orderId: 'non-existent-order' });

      expect(res.status).toBe(404);
    });
  });
});
