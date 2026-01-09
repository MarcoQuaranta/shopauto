import { getValidAccessToken } from '../lib/shopify';
import * as fs from 'fs';

const SHOP_DOMAIN = 'usa-shop-8790.myshopify.com';
const THEME_ID = '187843281273';

async function main() {
  console.log('Scaricando template...\n');

  const token = await getValidAccessToken(SHOP_DOMAIN);

  const getResponse = await fetch(
    `https://${SHOP_DOMAIN}/admin/api/2024-01/themes/${THEME_ID}/assets.json?asset[key]=templates/product.json`,
    {
      headers: { 'X-Shopify-Access-Token': token }
    }
  );

  const data = await getResponse.json();
  const templateValue = data.asset.value;

  // Salva per ispezione
  fs.writeFileSync('temp-template-value.txt', templateValue);
  console.log('Template salvato in temp-template-value.txt');

  // Cerca il CSS lifestyle-section
  const cssMatch = templateValue.match(/\.lifestyle-section \{[^}]+\}/);
  if (cssMatch) {
    console.log('\n=== CSS .lifestyle-section trovato ===');
    console.log(cssMatch[0].replace(/\\n/g, '\n'));
  } else {
    console.log('\nCSS .lifestyle-section non trovato');
  }

  // Cerca .lifestyle-grid
  const gridMatch = templateValue.match(/\.lifestyle-grid \{[^}]+\}/);
  if (gridMatch) {
    console.log('\n=== CSS .lifestyle-grid trovato ===');
    console.log(gridMatch[0].replace(/\\n/g, '\n'));
  }
}

main().catch(console.error);
