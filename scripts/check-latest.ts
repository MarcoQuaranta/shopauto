import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findFirst();
  if (!shop) {
    console.log('No shop found');
    return;
  }

  // Get latest product with metafields
  const query = `
    query {
      products(first: 1, reverse: true) {
        edges {
          node {
            id
            title
            handle
            templateSuffix
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
  const product = data.data.products.edges[0]?.node;

  if (!product) {
    console.log('No product found');
    return;
  }

  console.log('Ultimo prodotto creato:');
  console.log('  Title:', product.title);
  console.log('  Handle:', product.handle);
  console.log('  Template:', product.templateSuffix || 'DEFAULT');
  console.log('  URL: /products/' + product.handle);
  console.log('');
  console.log('Metafields:');

  const metafields = product.metafields?.edges || [];
  if (metafields.length === 0) {
    console.log('  (NESSUN METAFIELD - QUESTO E IL PROBLEMA!)');
  } else {
    metafields.forEach((m: any) => {
      console.log('  ' + m.node.namespace + '.' + m.node.key + ': ' + (m.node.value || '').substring(0, 80));
    });
  }

  await prisma.$disconnect();
}

main();
