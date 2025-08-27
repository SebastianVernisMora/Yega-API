import express, { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { authMiddleware } from '../middlewares/auth.js';

export const createPaymentsRouter = (prisma: PrismaClient, stripe: Stripe) => {
  const router = Router();

  // The webhook needs to be before the auth middleware because it's not authenticated
  // and the auth middleware would parse the body, which we don't want for the webhook.
  router.post('/webhook', express.raw({type: 'application/json'}), async (req, res, next) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).send('Webhook Error: Missing signature or secret');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Error verifying webhook signature: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object;
        try {
          await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.update({
              where: { providerPaymentId: paymentIntentSucceeded.id },
              data: { status: 'completed' },
            });
            await tx.order.update({
              where: { id: payment.orderId },
              data: { status: 'PAID' },
            });
          });
        } catch (error) {
            console.error('Error updating payment and order status:', error);
            // If the transaction fails, Stripe will retry the webhook.
            return res.status(500).json({ error: 'Failed to update payment status.' });
        }
        break;
      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object;
        try {
            await prisma.payment.update({
                where: { providerPaymentId: paymentIntentFailed.id },
                data: { status: 'failed' },
            });
        } catch (error) {
            console.error('Error updating payment status to failed:', error);
            return res.status(500).json({ error: 'Failed to update payment status.' });
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  router.use(authMiddleware);

  router.post('/intent', async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const { orderId } = req.body;

      const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
      });

      if (!order) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', http: 404, message: 'Order not found' },
        });
      }

      // Ensure order total is a number
      const orderTotal = Number(order.total);
      if (isNaN(orderTotal)) {
        return res.status(400).json({
            error: { code: 'INVALID_ORDER_TOTAL', http: 400, message: 'Order total is not a valid number.' },
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(orderTotal * 100), // Convert to cents and integer
        currency: 'mxn',
        automatic_payment_methods: {
          enabled: true,
        },
      });

      await prisma.payment.create({
        data: {
          orderId: order.id,
          providerPaymentId: paymentIntent.id,
          amount: orderTotal,
          currency: 'mxn',
          status: 'pending',
        },
      });

      await prisma.order.update({
          where: {id: order.id},
          data: { status: 'PAYMENT_PENDING' }
      });


      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
