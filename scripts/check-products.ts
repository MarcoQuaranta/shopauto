import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findFirst();
  if (!shop) {
    console.log('No shop found');
    return;
  }

  const query = `
    query {
      products(first: 5, reverse: true) {
        edges {
          node {
            id
            title
            handle
            templateSuffix
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
  console.log('Ultimi prodotti:');
  data.data.products.edges.forEach((p: any) => {
    console.log('  ' + p.node.title + ' -> template: ' + (p.node.templateSuffix || 'DEFAULT') + ' -> /products/' + p.node.handle);
  });

  await prisma.$disconnect();
}

main();
