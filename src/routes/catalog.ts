import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/catalog', async (req, res, next) => {
  try {
    const page  = Math.max(parseInt(String(req.query.page  ?? '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10), 1), 50);
    const skip  = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.product.findMany({ skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.product.count(),
    ]);

    res.setHeader('X-Total-Count', String(total));
    res.json(items);
  } catch (err) {
    next(err);
  }
});

export default router;
