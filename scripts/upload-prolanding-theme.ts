import * as fs from 'fs';
import * as path from 'path';
import { getValidAccessToken } from '../lib/shopify';

const SHOP_DOMAIN = 'usa-shop-8790.myshopify.com';
const THEME_ID = '187843281273';
const SHOPAUTO_PATH = 'C:/shopauto/templates/shopify/prolanding';

// Sezioni da caricare
const sections = [
  'prolanding-hero',
  'prolanding-benefits',
  'prolanding-iconbox',
  'prolanding-compare',
  'prolanding-features',
  'prolanding-reviews',
  'prolanding-faq',
  'prolanding-guarantee',
];

async function uploadAsset(token: string, key: string, value: string) {
  const response = await fetch(
    `https://${SHOP_DOMAIN}/admin/api/2024-01/themes/${THEME_ID}/assets.json`,
    {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset: { key, value }
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to upload ${key}: ${err}`);
  }

  return response.json();
}

async function main() {
  console.log('📦 Caricamento template ProLanding nel tema Shopify...\n');

  const token = await getValidAccessToken(SHOP_DOMAIN);
  console.log('✅ Token ottenuto\n');

  // 1. Carica le sezioni
  console.log('1️⃣ Caricamento sezioni liquid...');
  for (const section of sections) {
    const filePath = path.join(SHOPAUTO_PATH, 'sections', `${section}.liquid`);

    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️ File non trovato: ${filePath}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const key = `sections/${section}.liquid`;

    try {
      await uploadAsset(token, key, content);
      console.log(`   ✅ ${section}`);
    } catch (e: any) {
      console.log(`   ❌ ${section}: ${e.message}`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  // 2. Carica il template JSON
  console.log('\n2️⃣ Caricamento template product.prolanding.json...');
  const templatePath = path.join(SHOPAUTO_PATH, 'templates', 'product.prolanding.json');

  if (fs.existsSync(templatePath)) {
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    try {
      await uploadAsset(token, 'templates/product.prolanding.json', templateContent);
      console.log('   ✅ Template caricato');
    } catch (e: any) {
      console.log(`   ❌ Template: ${e.message}`);
    }
  }

  // 3. Aggiorna il prodotto con templateSuffix
  console.log('\n3️⃣ Aggiornamento prodotto con template prolanding...');

  const updateQuery = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id title templateSuffix }
        userErrors { field message }
      }
    }
  `;

  const updateResponse = await fetch(
    `https://${SHOP_DOMAIN}/admin/api/2024-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: updateQuery,
        variables: {
          input: {
            id: 'gid://shopify/Product/15306635247993',
            templateSuffix: 'prolanding'
          }
        }
      }),
    }
  );

  const updateResult = await updateResponse.json();
  if (updateResult.data?.productUpdate?.userErrors?.length > 0) {
    console.log('   ❌ Errori:', updateResult.data.productUpdate.userErrors);
  } else {
    console.log('   ✅ Prodotto aggiornato con template prolanding');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ COMPLETATO!');
  console.log('='.repeat(50));
  console.log('\n🔗 Visualizza la landing:');
  console.log('   https://usa-shop-8790.myshopify.com/products/orologio-elegante-collection-2024');
}

main().catch(console.error);
