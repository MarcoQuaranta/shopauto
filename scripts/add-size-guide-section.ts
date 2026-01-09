import { getValidAccessToken } from '../lib/shopify';

const SHOP_DOMAIN = 'usa-shop-8790.myshopify.com';
const THEME_ID = '187843281273';

async function main() {
  console.log('Adding size guide section below bullets...\n');

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

  // Find product-details block
  const productDetails = template.sections.main.blocks['product-details'];

  if (!productDetails) {
    console.log('product-details block not found!');
    return;
  }

  // Create new size guide section
  const sizeGuideSectionId = 'custom_liquid_size_guide';

  const sizeGuideBlock = {
    type: 'custom-liquid',
    name: 't:names.custom_liquid',
    settings: {
      custom_liquid: `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

{% if product.metafields.custom.size_guide2 != blank %}
<div class="size-guide-inline">
  {{ product.metafields.custom.size_guide2 | newline_to_br }}
</div>
{% endif %}

<style>
.size-guide-inline {
  font-family: 'Inter', sans-serif;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 15px 0;
}

.size-guide-inline h1,
.size-guide-inline h2,
.size-guide-inline h3,
.size-guide-inline h4 {
  font-weight: 700;
  color: #041626;
  margin: 0 0 15px 0;
}

.size-guide-inline h3 {
  font-size: 18px;
}

.size-guide-inline p {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin: 0 0 10px 0;
}

.size-guide-inline table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  font-size: 13px;
}

.size-guide-inline th,
.size-guide-inline td {
  padding: 10px 12px;
  text-align: center;
  border: 1px solid #e0e0e0;
}

.size-guide-inline th {
  background: #e9ecef;
  font-weight: 600;
  color: #041626;
}

.size-guide-inline td {
  background: #fff;
  color: #333;
}

.size-guide-inline tr:nth-child(even) td {
  background: #fafafa;
}

@media (max-width: 500px) {
  .size-guide-inline {
    padding: 15px;
  }

  .size-guide-inline table {
    font-size: 12px;
  }

  .size-guide-inline th,
  .size-guide-inline td {
    padding: 8px 6px;
  }
}
</style>`
    },
    blocks: {}
  };

  // Add the new block
  productDetails.blocks[sizeGuideSectionId] = sizeGuideBlock;

  // Update block_order - insert after bullets (custom_liquid_yfWgLd)
  const blockOrder = productDetails.block_order;
  const bulletsIndex = blockOrder.indexOf('custom_liquid_yfWgLd');

  if (bulletsIndex !== -1) {
    // Insert after bullets
    blockOrder.splice(bulletsIndex + 1, 0, sizeGuideSectionId);
    console.log('Inserted after bullets section');
  } else {
    // Fallback: add at the end
    blockOrder.push(sizeGuideSectionId);
    console.log('Added at the end (bullets section not found)');
  }

  console.log('New block order:', blockOrder);

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
    console.log('\nSize guide section added!');
    console.log('\nReload: https://italivio.com/products/pisello-negro');
  } else {
    const err = await putResponse.text();
    console.log('Error:', err);
  }
}

main().catch(console.error);
