// Script per pubblicare tutti i prodotti esistenti
// Esegui con: npx ts-node scripts/publish-all-products.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GET_PUBLICATIONS_QUERY = `
  query getPublications {
    publications(first: 10) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const PRODUCTS_LIST_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
`;

const PUBLISH_PRODUCT_MUTATION = `
  mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        availablePublicationsCount {
          count
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function shopifyGraphql(shop: string, accessToken: string, query: string, variables?: any) {
  const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();
  if (json.errors) {
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

async function main() {
  console.log('🔍 Cercando shop...');

  const shops = await prisma.shop.findMany();

  if (shops.length === 0) {
    console.log('❌ Nessuno shop trovato nel database');
    return;
  }

  for (const shop of shops) {
    console.log(`\n📦 Elaborando shop: ${shop.shop}`);

    try {
      // Get publications
      const pubResult = await shopifyGraphql(shop.shop, shop.accessToken, GET_PUBLICATIONS_QUERY);
      const publications = pubResult.publications?.edges || [];

      const onlineStore = publications.find((p: any) =>
        p.node.name === 'Online Store' || p.node.name.toLowerCase().includes('online')
      );

      if (!onlineStore) {
        console.log('  ⚠️ Canale Online Store non trovato');
        console.log('  Canali disponibili:', publications.map((p: any) => p.node.name).join(', '));
        continue;
      }

      console.log(`  ✅ Trovato canale: ${onlineStore.node.name}`);

      // Get all products
      const productsResult = await shopifyGraphql(shop.shop, shop.accessToken, PRODUCTS_LIST_QUERY, { first: 100 });
      const products = productsResult.products?.edges || [];

      console.log(`  📋 Trovati ${products.length} prodotti`);

      let published = 0;
      let errors = 0;

      for (const edge of products) {
        try {
          await shopifyGraphql(shop.shop, shop.accessToken, PUBLISH_PRODUCT_MUTATION, {
            id: edge.node.id,
            input: [{ publicationId: onlineStore.node.id }]
          });
          published++;
          console.log(`  ✓ Pubblicato: ${edge.node.title}`);
        } catch (e: any) {
          if (!e.message.includes('already published')) {
            errors++;
            console.log(`  ✗ Errore per ${edge.node.title}: ${e.message}`);
          } else {
            published++;
            console.log(`  ○ Già pubblicato: ${edge.node.title}`);
          }
        }
      }

      console.log(`\n  📊 Risultato: ${published} pubblicati, ${errors} errori`);

    } catch (error: any) {
      console.error(`  ❌ Errore: ${error.message}`);
    }
  }

  console.log('\n✅ Completato!');
  await prisma.$disconnect();
}

main().catch(console.error);
