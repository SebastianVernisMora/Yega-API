import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // 1. Clean up existing data
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleaned up previous data.');


  // 2. Create Users
  const password = await bcrypt.hash('password123', 10);
  await prisma.user.createMany({
    data: [
      {
        email: 'alice@example.com',
        name: 'Alice',
        password,
        role: Role.CLIENT,
      },
      {
        email: 'bob@example.com',
        name: 'Bob',
        password,
        role: Role.CLIENT,
      },
      {
        email: 'storeowner@example.com',
        name: 'Store Owner',
        password,
        role: Role.STORE,
      },
       {
        email: 'courier@example.com',
        name: 'Speedy Gonzales',
        password,
        role: Role.COURIER,
      },
    ],
  });
  console.log(`Created users.`);

  // 3. Retrieve users for relations
  const alice = await prisma.user.findUnique({ where: { email: 'alice@example.com' } });
  const storeOwner = await prisma.user.findUnique({ where: { email: 'storeowner@example.com' } });

  if (!alice || !storeOwner) {
    console.error('Could not find created users, stopping seed.');
    return;
  }

  // 4. Create a Store
  const store = await prisma.store.create({
    data: {
      name: 'Super Store',
      description: 'A store with everything you need.',
      ownerId: storeOwner.id,
    },
  });
  console.log(`Created store: ${store.name}`);

  // 5. Create Products
  await prisma.product.createMany({
    data: [
      {
        name: 'Laptop Pro',
        description: 'A powerful laptop for professionals.',
        price: 1500.0,
        storeId: store.id,
      },
      {
        name: 'Wireless Mouse',
        description: 'A comfortable ergonomic mouse.',
        price: 45.0,
        storeId: store.id,
      },
      {
        name: 'Mechanical Keyboard',
        description: 'A tactile and responsive keyboard.',
        price: 120.0,
        storeId: store.id,
      },
    ],
  });
  console.log(`Created products for ${store.name}.`);

  // 6. Retrieve products for relations
  const laptop = await prisma.product.findFirst({ where: { name: 'Laptop Pro' } });
  const mouse = await prisma.product.findFirst({ where: { name: 'Wireless Mouse' } });

  if (!laptop || !mouse) {
    console.error('Could not find created products, stopping seed.');
    return;
  }

  // 7. Create an Order
  const order = await prisma.order.create({
    data: {
      userId: alice.id,
      storeId: store.id,
      total: laptop.price + mouse.price,
      status: 'PENDING',
      items: {
        create: [
          {
            productId: laptop.id,
            quantity: 1,
            price: laptop.price,
          },
          {
            productId: mouse.id,
            quantity: 1,
            price: mouse.price,
          },
        ],
      },
    },
  });
  console.log(`Created order ${order.id} for ${alice.name}.`);

  // 8. Create a Review
  const review = await prisma.review.create({
    data: {
        userId: alice.id,
        productId: laptop.id,
        rating: 5,
        comment: "This laptop is amazing! Super fast and great for development."
    }
  });
  console.log(`Created review ${review.id} for ${laptop.name} by ${alice.name}.`);


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
