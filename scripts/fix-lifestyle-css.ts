import { getValidAccessToken } from '../lib/shopify';

const SHOP_DOMAIN = 'usa-shop-8790.myshopify.com';
const THEME_ID = '187843281273';

async function main() {
  console.log('🔧 Fix CSS sezione lifestyle...\n');

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

  // Fix 1: Aggiungi max-width e margin auto a .lifestyle-section
  const oldCss = `.lifestyle-section {\\n  font-family: 'Inter', sans-serif;\\n  padding: 50px 0px;\\n  width: 100%;\\n  box-sizing: border-box;\\n}`;

  const newCss = `.lifestyle-section {\\n  font-family: 'Inter', sans-serif;\\n  padding: 50px 20px;\\n  width: 100%;\\n  max-width: 1200px;\\n  margin: 0 auto;\\n  box-sizing: border-box;\\n}`;

  if (templateValue.includes(oldCss)) {
    templateValue = templateValue.replace(oldCss, newCss);
    console.log('✅ Fix 1 applicato: max-width + margin auto');
  } else {
    console.log('⚠️ Pattern CSS non trovato, provo variante...');

    // Prova con variante
    const oldCss2 = `lifestyle-section {\\\\n  font-family: 'Inter', sans-serif;\\\\n  padding: 50px 0px;\\\\n  width: 100%;\\\\n  box-sizing: border-box;\\\\n}`;
    const newCss2 = `lifestyle-section {\\\\n  font-family: 'Inter', sans-serif;\\\\n  padding: 50px 20px;\\\\n  width: 100%;\\\\n  max-width: 1200px;\\\\n  margin: 0 auto;\\\\n  box-sizing: border-box;\\\\n}`;

    if (templateValue.includes(oldCss2)) {
      templateValue = templateValue.replace(oldCss2, newCss2);
      console.log('✅ Fix 1 applicato (variante)');
    } else {
      // Provo replace generico
      templateValue = templateValue.replace(
        /\.lifestyle-section \{([^}]*?)padding: 50px 0px;([^}]*?)width: 100%;([^}]*?)\}/g,
        '.lifestyle-section {$1padding: 50px 20px;$2width: 100%;\\n  max-width: 1200px;\\n  margin: 0 auto;$3}'
      );
      console.log('✅ Fix 1 applicato (regex)');
    }
  }

  // Salva il template modificato
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
    console.log('\n✅ Template aggiornato!');
    console.log('\n🔗 Ricarica: https://italivio.com/products/pisello-negro');
  } else {
    const err = await putResponse.text();
    console.log('❌ Errore:', err);
  }
}

main().catch(console.error);
