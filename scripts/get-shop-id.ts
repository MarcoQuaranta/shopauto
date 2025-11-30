import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findFirst();
  console.log('Shop ID:', shop?.id);
  console.log('Shop:', shop?.shop);
  await prisma.$disconnect();
}

main();
