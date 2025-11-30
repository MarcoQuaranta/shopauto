import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shops = await prisma.shop.findMany();
  console.log('Shop nel database:', shops.length);
  shops.forEach(s => {
    console.log('---');
    console.log('ID:', s.id);
    console.log('Nome:', s.name);
    console.log('Dominio:', s.shop);
    console.log('Token:', s.accessToken.substring(0, 15) + '...');
  });
  await prisma.$disconnect();
}

main();
