import { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: Array<'admin' | 'store' | 'client' | 'courier'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole as any)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          http: 403,
          message: 'You do not have permission to access this resource.',
        }
      });
    }
    next();
  };
}

export async function assertProductOwnership(prisma: any, userId: string, productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      store: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!product) {
    const error: any = new Error('Product not found');
    error.code = 'NOT_FOUND';
    error.http = 404;
    throw error;
  }

  if (product.store.ownerId !== userId) {
    const error: any = new Error('You do not own this product');
    error.code = 'FORBIDDEN';
    error.http = 403;
    throw error;
  }
}

export async function assertStoreOwnership(prisma: any, userId: string, storeId: string) {
    // TODO: Implement ownership check
    // This function will be implemented in a future task.
    // For now, it does nothing.
}
