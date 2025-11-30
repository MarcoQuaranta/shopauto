import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const shop = await prisma.shop.update({
      where: { shop: 'udr1ng-1i.myshopify.com' },
      data: { name: 'Aurum Milano' }
    });
    console.log('Shop aggiornato con successo!');
    console.log('ID:', shop.id);
    console.log('Nome:', shop.name);
    console.log('Dominio:', shop.shop);
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
