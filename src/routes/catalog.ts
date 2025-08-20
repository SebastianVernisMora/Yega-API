// src/routes/catalog.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware as authenticate } from '../middlewares/auth';
import { requireRole as authorize } from '../middlewares/rbac';

export const createCatalogRouter = (prisma: PrismaClient) => {
  const router = Router();

  // GET /catalog/products - Public endpoint to get a list of products
  router.get('/products', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    try {
      const products = await prisma.product.findMany({
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      });
      const totalProducts = await prisma.product.count();
      res.header('X-Total-Count', totalProducts.toString());
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching products.' });
    }
  });

  // GET /catalog/products/:id - Public endpoint to get a single product
  router.get('/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });
      if (product) {
        res.json(product);
      } else {
        res.status(404).json({ error: 'Product not found.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching the product.' });
    }
  });

  // POST /catalog/products - Protected endpoint for store owners to create products
  router.post('/products', authenticate, authorize(['store']), async (req, res) => {
    // TODO: Implement product creation logic
    res.status(201).json({ message: 'Product created successfully (placeholder).' });
  });

  // PUT /catalog/products/:id - Protected endpoint for store owners to update products
  router.put('/products/:id', authenticate, authorize(['store']), async (req, res) => {
    const { id } = req.params;
    try {
      const product = await prisma.product.update({
        where: { id },
        data: req.body,
      });
      res.json(product);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
      }
      res.status(500).json({ error: 'An error occurred while updating the product.' });
    }
  });

  // DELETE /catalog/products/:id - Protected endpoint for store owners to delete products
  router.delete('/products/:id', authenticate, authorize(['store']), async (req, res) => {
    // TODO: Implement product deletion logic
    res.status(204).send();
  });

  return router;
};
