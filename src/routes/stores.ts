import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware as authenticate } from '../middlewares/auth';
import { requireRole as authorize } from '../middlewares/rbac';

export const createStoresRouter = (prisma: PrismaClient) => {
  const router = Router();

  // GET /stores - List all stores
  router.get('/', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    try {
      const stores = await prisma.store.findMany({
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      });
      const totalStores = await prisma.store.count();
      res.header('X-Total-Count', totalStores.toString());
      res.json(stores);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching stores.' });
    }
  });

  // GET /stores/:id - Get a specific store
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const store = await prisma.store.findUnique({
        where: { id },
      });
      if (store) {
        res.json(store);
      } else {
        res.status(404).json({ error: 'Store not found.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching the store.' });
    }
  });

  // POST /stores - Create a new store
  router.post('/', authenticate, async (req, res) => {
    const { name, description } = req.body;
    const ownerId = req.user!.id;

    try {
      const newStore = await prisma.store.create({
        data: {
          name,
          description,
          ownerId,
        },
      });
      res.status(201).json(newStore);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while creating the store.' });
    }
  });

  // PUT /stores/:id - Update a store
  router.put('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user!.id;

    try {
      const store = await prisma.store.findUnique({
        where: { id },
      });

      if (!store) {
        return res.status(404).json({ error: 'Store not found.' });
      }

      if (store.ownerId !== userId) {
        return res.status(403).json({ error: 'You are not authorized to update this store.' });
      }

      const updatedStore = await prisma.store.update({
        where: { id },
        data: {
          name,
          description,
        },
      });
      res.json(updatedStore);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while updating the store.' });
    }
  });

  // DELETE /stores/:id - Delete a store
  router.delete('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const userId = req.user!.id;

    try {
      const store = await prisma.store.findUnique({
        where: { id },
      });

      if (!store) {
        return res.status(404).json({ error: 'Store not found.' });
      }

      if (store.ownerId !== userId) {
        return res.status(403).json({ error: 'You are not authorized to delete this store.' });
      }

      await prisma.store.delete({
        where: { id },
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while deleting the store.' });
    }
  });

  return router;
};
