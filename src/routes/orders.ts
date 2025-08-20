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
        include: {
          store: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
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
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
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

    // Calculate total
    let total = 0;
    const orderItemsData = [];

    // Get product details and calculate total
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PRODUCT',
            http: 400,
            message: `Product with id ${item.productId} not found`,
          },
        });
      }

      const itemTotal = product.price.toNumber() * item.quantity;
      total += itemTotal;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Create order with items
    const newOrder = await prisma.order.create({
      data: {
        userId,
        storeId,
        total,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(newOrder);
  } catch (err) {
    next(err);
  }
});

// PATCH /:orderId/status - Update order status
router.patch('/:orderId/status', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { orderId } = req.params;
    const { status } = req.body;

    // Check if user owns the order or is a store/courier/admin
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { userId },
          { store: { ownerId: userId } },
        ],
      },
    });

    if (!order) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          http: 404,
          message: 'Order not found',
        },
      });
    }

    // Check if user has permission to update status
    const userRole = req.user!.role;
    if (userRole !== 'store' && userRole !== 'courier' && userRole !== 'admin' && order.userId !== userId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          http: 403,
          message: 'You do not have permission to update this order status',
        },
      });
    }

    // Validate status transition (simplified for now)
    const validTransitions = {
      pending: ['accepted', 'canceled'],
      accepted: ['preparing', 'canceled'],
      preparing: ['assigned', 'canceled'],
      assigned: ['on_route', 'canceled'],
      on_route: ['delivered', 'canceled'],
      delivered: [],
      canceled: [],
    };

    const currentStatus = order.status as keyof typeof validTransitions;
    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          http: 400,
          message: `Cannot transition from ${currentStatus} to ${status}`,
        },
      });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.json(updatedOrder);
  } catch (err) {
    next(err);
  }
});

export default router;