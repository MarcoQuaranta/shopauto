import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findFirst();
  if (!shop) {
    console.log('No shop found');
    return;
  }

  // Get products in reverse order (newest first)
  const query = `
    query {
      products(first: 10, reverse: true) {
        edges {
          node {
            id
            title
            handle
            templateSuffix
            createdAt
            metafields(first: 50) {
              edges {
                node {
                  namespace
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(`https://${shop.shop}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': shop.accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  const products = data.data.products.edges;

  console.log('Ultimi 10 prodotti:\n');

  products.forEach((p: any, i: number) => {
    const metafields = p.node.metafields?.edges || [];
    console.log(`${i + 1}. ${p.node.title}`);
    console.log(`   Created: ${p.node.createdAt}`);
    console.log(`   Template: ${p.node.templateSuffix || 'DEFAULT'}`);
    console.log(`   Metafields: ${metafields.length}`);
    if (metafields.length > 0) {
      console.log(`   Keys: ${metafields.map((m: any) => m.node.key).join(', ')}`);
    }
    console.log('');
  });

  await prisma.$disconnect();
}

main();
