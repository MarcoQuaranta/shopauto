import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shop = await prisma.shop.findFirst();
  if (!shop) {
    console.log('No shop found');
    return;
  }

  // Get a product ID
  const productId = process.argv[2] || 'gid://shopify/Product/15461049336192';

  const query = `
    query getProduct($id: ID!) {
      product(id: $id) {
        id
        title
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
  `;

  const response = await fetch(`https://${shop.shop}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': shop.accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { id: productId } }),
  });

  const data = await response.json();
  console.log('Product:', data.data?.product?.title);
  console.log('Metafields:');

  const metafields = data.data?.product?.metafields?.edges || [];
  if (metafields.length === 0) {
    console.log('  (nessun metafield trovato)');
  } else {
    metafields.forEach((m: any) => {
      const val = m.node.value || '';
      console.log('  ' + m.node.namespace + '.' + m.node.key + ': ' + val.substring(0, 100));
    });
  }

  await prisma.$disconnect();
}

main();
