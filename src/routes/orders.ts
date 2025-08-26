import { Router } from 'express';
import { OrderStatus, PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth.js';
import { randomUUID } from 'crypto';

export const createOrdersRouter = (prisma: PrismaClient) => {
  const router = Router();

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
    const { storeId, items } = req.body; // Validated by OpenAPI

    // Basic validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Order must contain at least one item.' } });
    }

    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Verify store exists
      const store = await tx.store.findUnique({ where: { id: storeId } });
      if (!store) {
        throw { status: 404, code: 'STORE_NOT_FOUND', message: `Store with id ${storeId} not found.` };
      }

      // 2. Get all product details in one go
      const productIds = items.map(item => item.productId);
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          storeId: storeId, // Ensure all products belong to the same store
        },
      });

      // 3. Validate products and map for quick access
      const productMap = new Map(products.map(p => [p.id, p]));
      const notFoundProducts = productIds.filter(id => !productMap.has(id));

      if (notFoundProducts.length > 0) {
        throw { status: 400, code: 'INVALID_PRODUCTS', message: `Products not found or do not belong to the store: ${notFoundProducts.join(', ')}` };
      }

      // 4. Validate stock, calculate total, and prepare order items
      const shippingCost = 5.0; // Flat rate shipping
      let subTotal = 0;
      const stockUpdates: Promise<any>[] = [];

      for (const item of items) {
        const product = productMap.get(item.productId)!;

        // Stock validation
        if (product.stock < item.quantity) {
          throw { status: 400, code: 'INSUFFICIENT_STOCK', message: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` };
        }

        subTotal += product.price * item.quantity;

        // Prepare stock update
        stockUpdates.push(
          tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: item.quantity } },
          })
        );
      }

      // Execute all stock updates
      await Promise.all(stockUpdates);

      const total = subTotal + shippingCost;

      // 5. Create the order and its items
      const orderItemsData = items.map(item => {
        const product = productMap.get(item.productId)!;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        };
      });

      return tx.order.create({
        data: {
          userId,
          storeId,
          total,
          status: 'PENDING',
          items: {
            create: orderItemsData,
          },
        },
        include: {
          store: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
      });
    });

    res.status(201).json(newOrder);
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    }
    next(err);
  }
});

// PATCH /:orderId/status - Update order status
router.patch('/:orderId/status', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { orderId } = req.params;
    const { status: newStatus } = req.body;

    if (!newStatus || typeof newStatus !== 'string') {
        return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Status must be a non-empty string.' } });
    }

    const newStatusUpper = newStatus.toUpperCase() as OrderStatus;
    if (!Object.values(OrderStatus).includes(newStatusUpper)) {
        return res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Invalid status: ${newStatus}` } });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [{ userId }, { store: { ownerId: userId } }],
      },
    });

    if (!order) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', http: 404, message: 'Order not found' },
      });
    }

    const userRole = req.user!.role;
    if (userRole !== 'store' && userRole !== 'courier' && userRole !== 'admin' && order.userId !== userId) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', http: 403, message: 'You do not have permission to update this order status' },
      });
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['ACCEPTED', 'CANCELED'],
      ACCEPTED: ['ON_THE_WAY', 'CANCELED'],
      ON_THE_WAY: ['DELIVERED', 'CANCELED'],
      DELIVERED: [],
      CANCELED: [],
    };

    const currentStatus = order.status;
    if (!validTransitions[currentStatus]?.includes(newStatusUpper)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          http: 400,
          message: `Cannot transition from ${currentStatus} to ${newStatusUpper}`,
        },
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatusUpper },
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

  return router;
};