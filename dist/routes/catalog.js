import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
const router = Router();
const prisma = new PrismaClient();
// GET /catalog (Public)
router.get('/', async (req, res, next) => {
    try {
        const page = Math.max(parseInt(String(req.query.page ?? '1'), 10), 1);
        const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10), 1), 50);
        const skip = (page - 1) * limit;
        const [items, total] = await prisma.$transaction([
            prisma.product.findMany({ skip, take: limit, orderBy: { name: 'asc' } }),
            prisma.product.count(),
        ]);
        res.set('X-Total-Count', String(total));
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
// POST /catalog (Protected: admin, store)
router.post('/', authMiddleware, requireRole('admin', 'store'), async (req, res, next) => {
    try {
        // TODO: If role is 'store', assertStoreOwnership(prisma, req.user.id, req.body.storeId)
        const product = await prisma.product.create({
            data: req.body,
        });
        res.status(201).json(product);
    }
    catch (err) {
        next(err);
    }
});
// PUT /catalog/:productId (Protected: admin, store)
router.put('/:productId', authMiddleware, requireRole('admin', 'store'), async (req, res, next) => {
    try {
        const { productId } = req.params;
        // TODO: If role is 'store', assertProductOwnership(prisma, req.user.id, productId)
        const product = await prisma.product.update({
            where: { id: productId },
            data: req.body,
        });
        res.json(product);
    }
    catch (err) {
        // Prisma's P2025 error code indicates record not found
        if (err.code === 'P2025') {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    http: 404,
                    message: 'Product not found',
                }
            });
        }
        next(err);
    }
});
// DELETE /catalog/:productId (Protected: admin, store)
router.delete('/:productId', authMiddleware, requireRole('admin', 'store'), async (req, res, next) => {
    try {
        const { productId } = req.params;
        // TODO: If role is 'store', assertProductOwnership(prisma, req.user.id, productId)
        await prisma.product.delete({
            where: { id: productId },
        });
        res.status(204).end();
    }
    catch (err) {
        // Prisma's P2025 error code indicates record not found
        if (err.code === 'P2025') {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND',
                    http: 404,
                    message: 'Product not found',
                }
            });
        }
        next(err);
    }
});
export default router;
