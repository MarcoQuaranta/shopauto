import { getValidAccessToken } from '../lib/shopify';

const SHOP_DOMAIN = 'usa-shop-8790.myshopify.com';
const PRODUCT_ID = 'gid://shopify/Product/15306635247993';

// Metafields con namespace CUSTOM (quello usato dal tema)
const metafields = [
  // Bullets
  { namespace: 'custom', key: 'bullet_1', value: 'Premium Swiss Movement', type: 'single_line_text_field' },
  { namespace: 'custom', key: 'bullet_2', value: 'Scratch-resistant Sapphire Crystal', type: 'single_line_text_field' },
  { namespace: 'custom', key: 'bullet_3', value: 'Water Resistant 5ATM', type: 'single_line_text_field' },

  // Angle 1
  { namespace: 'custom', key: 'angle_1_title', value: 'Premium Materials', type: 'single_line_text_field' },
  { namespace: 'custom', key: 'angle_1_text', value: 'Crafted with 316L stainless steel and genuine Italian leather. Every detail speaks of exceptional quality and timeless elegance.', type: 'multi_line_text_field' },

  // Angle 2
  { namespace: 'custom', key: 'angle_2_title', value: 'Precision Engineering', type: 'single_line_text_field' },
  { namespace: 'custom', key: 'angle_2_text', value: 'Swiss quartz movement ensures accuracy within seconds per month. A reliable timepiece that will last for generations.', type: 'multi_line_text_field' },

  // Angle 3
  { namespace: 'custom', key: 'angle_3_title', value: 'Elegant Design', type: 'single_line_text_field' },
  { namespace: 'custom', key: 'angle_3_text', value: 'Minimalist dial with applied indices. The perfect accessory for any occasion, from business meetings to casual weekends.', type: 'multi_line_text_field' },

  // Lifestyle section
  { namespace: 'custom', key: 'lifestyle_main_title', value: 'Designed for Your Lifestyle', type: 'single_line_text_field' },
  { namespace: 'custom', key: 'lifestyle_left_title', value: 'Day to Night', type: 'single_line_text_field' },
  { namespace: 'custom', key: 'lifestyle_left_text', value: 'Seamlessly transitions from boardroom to dinner. Versatile enough for any occasion, elegant enough to make a statement.', type: 'multi_line_text_field' },
  { namespace: 'custom', key: 'lifestyle_right_title', value: 'Built to Last', type: 'single_line_text_field' },
  { namespace: 'custom', key: 'lifestyle_right_text', value: '2-year international warranty. Scratch-resistant crystal and water resistance up to 50 meters. Adventure-ready.', type: 'multi_line_text_field' },

  // Reviews (rating type ha formato specifico)
  { namespace: 'reviews', key: 'rating_count', value: '127', type: 'number_integer' },
];

async function main() {
  console.log('🔧 Correzione prodotto con metafield corretti...\n');

  const token = await getValidAccessToken(SHOP_DOMAIN);

  // 1. Rimuovi templateSuffix (usa template default)
  console.log('1️⃣ Rimozione templateSuffix (uso template default)...');

  const updateQuery = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id title templateSuffix }
        userErrors { field message }
      }
    }
  `;

  let response = await fetch(
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
            id: PRODUCT_ID,
            templateSuffix: ''  // Template default
          }
        }
      }),
    }
  );

  let result = await response.json();
  if (result.data?.productUpdate?.userErrors?.length > 0) {
    console.log('   ❌ Errori:', result.data.productUpdate.userErrors);
  } else {
    console.log('   ✅ Template impostato su default');
  }

  // 2. Aggiungi metafield con namespace CUSTOM
  console.log('\n2️⃣ Aggiunta metafield con namespace custom...');

  const metafieldInputs = metafields.map(m => ({
    ownerId: PRODUCT_ID,
    namespace: m.namespace,
    key: m.key,
    value: m.value,
    type: m.type,
  }));

  const metafieldsQuery = `
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { namespace key value }
        userErrors { field message }
      }
    }
  `;

  response = await fetch(
    `https://${SHOP_DOMAIN}/admin/api/2024-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: metafieldsQuery,
        variables: { metafields: metafieldInputs }
      }),
    }
  );

  result = await response.json();
  if (result.data?.metafieldsSet?.userErrors?.length > 0) {
    console.log('   ❌ Errori:', result.data.metafieldsSet.userErrors);
  } else {
    console.log('   ✅ Metafield salvati:');
    result.data?.metafieldsSet?.metafields?.forEach((m: any) => {
      console.log(`      - ${m.namespace}.${m.key}`);
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ PRODOTTO CORRETTO!');
  console.log('='.repeat(50));
  console.log('\n🔗 Visualizza:');
  console.log('   https://usa-shop-8790.myshopify.com/products/orologio-elegante-collection-2024');
  console.log('   https://italivio.com/products/orologio-elegante-collection-2024');
}

main().catch(console.error);
