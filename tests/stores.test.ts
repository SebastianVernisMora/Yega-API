import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStoresRouter } from '../src/routes/stores';
import { createPrismaMock } from './helpers/prisma';
import { PrismaClient } from '@prisma/client';

// Mock middlewares
let currentUser = { id: 'user-1', role: 'client' };
vi.mock('../src/middlewares/auth', () => ({
  authMiddleware: (req: any, res: any, next: () => void) => {
    req.user = currentUser;
    next();
  },
}));
vi.mock('../src/middlewares/rbac', () => ({
  requireRole: (roles: string[]) => (req: any, res: any, next: () => void) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  },
}));

describe('Store Routes', () => {
  let app: express.Express;
  let prismaMock: PrismaClient;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    app = express();
    app.use(express.json());
    app.use('/stores', createStoresRouter(prismaMock));
    currentUser = { id: 'user-1', role: 'client' };
  });

  describe('GET /stores', () => {
    it('should return a list of stores', async () => {
      const stores = [{ id: 'store-1', name: 'My Store', description: 'A store', ownerId: 'user-1', createdAt: new Date(), updatedAt: new Date() }];
      (prismaMock.store.findMany as any).mockResolvedValue(stores);
      (prismaMock.store.count as any).mockResolvedValue(1);

      const res = await request(app).get('/stores');
      expect(res.status).toBe(200);
      expect(res.body[0].id).toBe('store-1');
      expect(res.headers['x-total-count']).toBe('1');
    });
  });

  describe('GET /stores/:id', () => {
    it('should return a single store if found', async () => {
      const store = { id: 'store-1', name: 'My Store', description: 'A store', ownerId: 'user-1', createdAt: new Date(), updatedAt: new Date() };
      (prismaMock.store.findUnique as any).mockResolvedValue(store);

      const res = await request(app).get('/stores/store-1');
      expect(res.status).toBe(200);
      expect(res.body.id).toEqual(store.id);
    });

    it('should return 404 if store not found', async () => {
      (prismaMock.store.findUnique as any).mockResolvedValue(null);

      const res = await request(app).get('/stores/not-found');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /stores', () => {
    it('should create a new store', async () => {
      const newStoreData = { name: 'New Store', description: 'A great store' };
      const createdStore = { id: 'store-2', ownerId: 'user-1', ...newStoreData, createdAt: new Date(), updatedAt: new Date() };
      (prismaMock.store.create as any).mockResolvedValue(createdStore);

      const res = await request(app).post('/stores').send(newStoreData);
      expect(res.status).toBe(201);
      expect(res.body.id).toEqual(createdStore.id);
      expect(prismaMock.store.create).toHaveBeenCalledWith({
        data: { ...newStoreData, ownerId: 'user-1' },
      });
    });
  });

  describe('PUT /stores/:id', () => {
    it('should update a store if user is the owner', async () => {
      const store = { id: 'store-1', name: 'My Store', ownerId: 'user-1', description: 'A store', createdAt: new Date(), updatedAt: new Date() };
      const updatedData = { name: 'My Updated Store' };
      const updatedStore = { ...store, ...updatedData };
      (prismaMock.store.findUnique as any).mockResolvedValue(store);
      (prismaMock.store.update as any).mockResolvedValue(updatedStore);

      const res = await request(app).put('/stores/store-1').send(updatedData);
      expect(res.status).toBe(200);
      expect(res.body.id).toEqual(updatedStore.id);
    });

    it('should return 403 if user is not the owner', async () => {
      const store = { id: 'store-1', name: 'My Store', ownerId: 'user-2', description: 'A store', createdAt: new Date(), updatedAt: new Date() };
      (prismaMock.store.findUnique as any).mockResolvedValue(store);

      const res = await request(app).put('/stores/store-1').send({ name: 'Update' });
      expect(res.status).toBe(403);
    });

    it('should return 404 if store to update is not found', async () => {
      (prismaMock.store.findUnique as any).mockResolvedValue(null);

      const res = await request(app).put('/stores/not-found').send({ name: 'Update' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /stores/:id', () => {
    it('should delete a store if user is the owner', async () => {
      const store = { id: 'store-1', name: 'My Store', ownerId: 'user-1', description: 'A store', createdAt: new Date(), updatedAt: new Date() };
      (prismaMock.store.findUnique as any).mockResolvedValue(store);
      (prismaMock.store.delete as any).mockResolvedValue(store);

      const res = await request(app).delete('/stores/store-1');
      expect(res.status).toBe(204);
    });

    it('should return 403 if user is not the owner', async () => {
      const store = { id: 'store-1', name: 'My Store', ownerId: 'user-2', description: 'A store', createdAt: new Date(), updatedAt: new Date() };
      (prismaMock.store.findUnique as any).mockResolvedValue(store);

      const res = await request(app).delete('/stores/store-1');
      expect(res.status).toBe(403);
    });

    it('should return 404 if store to delete is not found', async () => {
      (prismaMock.store.findUnique as any).mockResolvedValue(null);
      const res = await request(app).delete('/stores/not-found');
      expect(res.status).toBe(404);
    });
  });
});
