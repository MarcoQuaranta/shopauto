/**
 * Script per salvare lo shop nel database con access token
 *
 * Uso: node --loader ts-node/esm scripts/setup-shop.ts
 * oppure: npx tsx scripts/setup-shop.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shopUrl = process.argv[2];
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shopUrl) {
    console.error('❌ Errore: Specifica lo shop URL');
    console.log('Uso: npx tsx scripts/setup-shop.ts your-store.myshopify.com');
    process.exit(1);
  }

  if (!accessToken) {
    console.error('❌ Errore: SHOPIFY_ACCESS_TOKEN non trovato in .env');
    process.exit(1);
  }

  console.log(`🔄 Salvando shop: ${shopUrl}`);

  const shop = await prisma.shop.upsert({
    where: { shop: shopUrl },
    update: {
      accessToken: accessToken,
      scope: 'read_products,write_products,read_files,write_files,read_metaobjects,write_metaobjects,read_custom_data,write_custom_data',
    },
    create: {
      shop: shopUrl,
      accessToken: accessToken,
      scope: 'read_products,write_products,read_files,write_files,read_metaobjects,write_metaobjects,read_custom_data,write_custom_data',
    },
  });

  console.log('✅ Shop salvato nel database!');
  console.log(`   ID: ${shop.id}`);
  console.log(`   Shop: ${shop.shop}`);
  console.log('\n📝 Copia questo ID per usarlo nell\'app:');
  console.log(`   shopId: "${shop.id}"`);
}

main()
  .catch((e) => {
    console.error('❌ Errore:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
