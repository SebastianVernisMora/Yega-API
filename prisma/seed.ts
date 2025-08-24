import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // 1. Create Users
  const password = await bcrypt.hash('password123', 10);
  const users = await prisma.user.createMany({
    data: [
      {
        email: 'alice@example.com',
        name: 'Alice',
        password,
        role: 'client',
      },
      {
        email: 'bob@example.com',
        name: 'Bob',
        password,
        role: 'client',
      },
      {
        email: 'storeowner@example.com',
        name: 'Store Owner',
        password,
        role: 'store',
      },
    ],
  });
  console.log(`Created ${users.count} users.`);

  const storeOwner = await prisma.user.findUnique({
    where: { email: 'storeowner@example.com' },
  });

  if (!storeOwner) {
    console.error('Store owner not found, skipping store creation.');
    return;
  }

  // 2. Create Stores
  const store = await prisma.store.create({
    data: {
      name: 'Super Store',
      description: 'A store with everything you need.',
      ownerId: storeOwner.id,
    },
  });
  console.log(`Created store with id: ${store.id}`);

  // 3. Create Products
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'Laptop',
        description: 'A powerful laptop.',
        price: 1200.0,
        storeId: store.id,
      },
      {
        name: 'Mouse',
        description: 'A comfortable mouse.',
        price: 25.0,
        storeId: store.id,
      },
      {
        name: 'Keyboard',
        description: 'A mechanical keyboard.',
        price: 75.0,
        storeId: store.id,
      },
    ],
  });
  console.log(`Created ${products.count} products.`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
