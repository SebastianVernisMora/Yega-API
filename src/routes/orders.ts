import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();
const prisma = new PrismaClient();

// All order routes are protected, and this router will be mounted on `/orders`
router.use(authMiddleware);

// GET / - List orders for the authenticated user
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10), 1), 50);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    res.setHeader('X-Total-Count', String(total));
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// GET /:orderId - Get a specific order
router.get('/:orderId', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', http: 404, message: 'Order not found' },
      });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST / - Create a new order
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    // Note: The request body is already validated by express-openapi-validator
    const { storeId, items } = req.body;

    const newOrder = await prisma.order.create({
      data: {
        userId,
        // As per instructions, we create a minimal order.
        // The `items` in the DB schema is a JSON field.
        // We'll store the payload's `storeId` and `items` inside this JSON field.
        // A more robust implementation might create OrderItem records.
        items: { storeId, items },
        status: 'pending',
        // Total calculation is omitted for now, as per instructions.
      },
    });

    res.status(201).json(newOrder);
  } catch (err) {
    next(err);
  }
});

export default router;
