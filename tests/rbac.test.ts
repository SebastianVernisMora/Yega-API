import { describe, it, expect, vi } from 'vitest';
import { assertProductOwnership } from '../src/middlewares/rbac';

const prismaMock: any = {
  product: {
    findUnique: vi.fn(),
  },
};

describe('RBAC Middleware', () => {
  it('should not throw an error if the user owns the product', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: 'p1',
      store: {
        ownerId: 'user1',
      },
    });

    await expect(
      assertProductOwnership(prismaMock, 'user1', 'p1')
    ).resolves.toBeUndefined();
  });

  it('should throw a FORBIDDEN error if the user does not own the product', async () => {
    prismaMock.product.findUnique.mockResolvedValue({
      id: 'p1',
      store: {
        ownerId: 'user2',
      },
    });

    await expect(assertProductOwnership(prismaMock, 'user1', 'p1')).rejects.toThrow(
      'You do not own this product'
    );
  });

  it('should throw a NOT_FOUND error if the product does not exist', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);

    await expect(assertProductOwnership(prismaMock, 'user1', 'p1')).rejects.toThrow(
      'Product not found'
    );
  });
});
