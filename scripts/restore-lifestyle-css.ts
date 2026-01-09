import { getValidAccessToken } from '../lib/shopify';

const SHOP_DOMAIN = 'usa-shop-8790.myshopify.com';
const THEME_ID = '187843281273';

async function main() {
  console.log('🔄 Ripristino CSS originale lifestyle...\n');

  const token = await getValidAccessToken(SHOP_DOMAIN);

  // Scarica il template attuale
  const getResponse = await fetch(
    `https://${SHOP_DOMAIN}/admin/api/2024-01/themes/${THEME_ID}/assets.json?asset[key]=templates/product.json`,
    {
      headers: { 'X-Shopify-Access-Token': token }
    }
  );

  const data = await getResponse.json();
  let templateValue = data.asset.value;

  // Ripristina CSS originale
  templateValue = templateValue.replace(
    /\.lifestyle-section \{[^}]*font-family:[^}]*padding:[^}]*width:[^}]*max-width:[^}]*margin:[^}]*box-sizing:[^}]*\}/g,
    `.lifestyle-section {\\n  font-family: 'Inter', sans-serif;\\n  padding: 50px 0px;\\n  width: 100%;\\n  box-sizing: border-box;\\n}`
  );

  // Salva
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
          value: templateValue
        }
      })
    }
  );

  if (putResponse.ok) {
    console.log('✅ CSS ripristinato!');
  } else {
    console.log('❌ Errore:', await putResponse.text());
  }
}

main().catch(console.error);
