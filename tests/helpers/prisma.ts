import { vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

export const createPrismaMock = () => {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    store: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    order: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
  } as unknown as PrismaClient;
};
