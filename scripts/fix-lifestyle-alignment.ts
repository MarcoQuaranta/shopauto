import { getValidAccessToken } from '../lib/shopify';
import * as fs from 'fs';

const SHOP_DOMAIN = 'usa-shop-8790.myshopify.com';
const THEME_ID = '187843281273';

async function main() {
  console.log('Fixing lifestyle section parent alignment...\n');

  const token = await getValidAccessToken(SHOP_DOMAIN);

  // Download current template
  const getResponse = await fetch(
    `https://${SHOP_DOMAIN}/admin/api/2024-01/themes/${THEME_ID}/assets.json?asset[key]=templates/product.json`,
    {
      headers: { 'X-Shopify-Access-Token': token }
    }
  );

  const data = await getResponse.json();
  const template = JSON.parse(data.asset.value);

  // Find the _blocks section that contains lifestyle (ID: 1767381980b885fa85)
  const sectionId = '1767381980b885fa85';

  if (template.sections[sectionId]) {
    const section = template.sections[sectionId];

    console.log('Current settings:');
    console.log('  horizontal_alignment:', section.settings.horizontal_alignment);
    console.log('  horizontal_alignment_flex_direction_column:', section.settings.horizontal_alignment_flex_direction_column);

    // Fix: change alignment from flex-start to center
    section.settings.horizontal_alignment = 'center';
    section.settings.horizontal_alignment_flex_direction_column = 'center';

    console.log('\nNew settings:');
    console.log('  horizontal_alignment:', section.settings.horizontal_alignment);
    console.log('  horizontal_alignment_flex_direction_column:', section.settings.horizontal_alignment_flex_direction_column);
  } else {
    console.log('Section not found!');
    return;
  }

  // Save updated template
  const putResponse = await fetch(
    `https://${SHOP_DOMAIN}/admin/api/2024-01/themes/${THEME_ID}/assets.json`,
    {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset: {
          key: 'templates/product.json',
          value: JSON.stringify(template, null, 2)
        }
      })
    }
  );

  if (putResponse.ok) {
    console.log('\nTemplate updated successfully!');
    console.log('\nReload: https://italivio.com/products/pisello-negro');
  } else {
    const err = await putResponse.text();
    console.log('Error:', err);
  }
}

main().catch(console.error);
