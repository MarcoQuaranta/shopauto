import { getValidAccessToken } from '../lib/shopify';

const SHOP_DOMAIN = 'usa-shop-8790.myshopify.com';
const PRODUCT_ID = 'gid://shopify/Product/15306635247993';

// Immagini da URL esterni
const images = {
  angle_1_image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
  angle_2_image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=600',
  angle_3_image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600',
  lifestyle_image: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600',
};

async function uploadFileFromUrl(token: string, url: string, filename: string): Promise<string | null> {
  // Step 1: Create staged upload
  const stageQuery = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters { name value }
        }
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
        query: stageQuery,
        variables: {
          input: [{
            filename: filename,
            mimeType: 'image/jpeg',
            resource: 'FILE',
            httpMethod: 'POST'
          }]
        }
      }),
    }
  );

  const stageResult = await response.json();

  if (stageResult.data?.stagedUploadsCreate?.userErrors?.length > 0) {
    console.log('Stage error:', stageResult.data.stagedUploadsCreate.userErrors);
    return null;
  }

  const target = stageResult.data?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target) {
    console.log('No staged target');
    return null;
  }

  // Step 2: Download image and upload to staged URL
  const imageResponse = await fetch(url);
  const imageBuffer = await imageResponse.arrayBuffer();

  const formData = new FormData();
  target.parameters.forEach((p: any) => {
    formData.append(p.name, p.value);
  });
  formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), filename);

  await fetch(target.url, {
    method: 'POST',
    body: formData,
  });

  // Step 3: Create file in Shopify
  const fileQuery = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          alt
          ... on MediaImage {
            id
          }
        }
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
        query: fileQuery,
        variables: {
          files: [{
            originalSource: target.resourceUrl,
            contentType: 'IMAGE',
            alt: filename
          }]
        }
      }),
    }
  );

  const fileResult = await response.json();

  if (fileResult.data?.fileCreate?.userErrors?.length > 0) {
    console.log('File create error:', fileResult.data.fileCreate.userErrors);
    return null;
  }

  return fileResult.data?.fileCreate?.files?.[0]?.id || null;
}

async function main() {
  console.log('📸 Caricamento immagini...\n');

  const token = await getValidAccessToken(SHOP_DOMAIN);
  const fileIds: Record<string, string> = {};

  for (const [key, url] of Object.entries(images)) {
    console.log(`Caricamento ${key}...`);
    const fileId = await uploadFileFromUrl(token, url, `${key}.jpg`);
    if (fileId) {
      fileIds[key] = fileId;
      console.log(`   ✅ ${fileId}`);
    } else {
      console.log(`   ❌ Fallito`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // Salva i file_reference nei metafield
  console.log('\n📝 Salvataggio metafield immagini...');

  const metafields = Object.entries(fileIds).map(([key, fileId]) => ({
    ownerId: PRODUCT_ID,
    namespace: 'custom',
    key: key,
    value: fileId,
    type: 'file_reference',
  }));

  if (metafields.length > 0) {
    const response = await fetch(
      `https://${SHOP_DOMAIN}/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
              metafieldsSet(metafields: $metafields) {
                metafields { namespace key }
                userErrors { field message }
              }
            }
          `,
          variables: { metafields }
        }),
      }
    );

    const result = await response.json();
    if (result.data?.metafieldsSet?.userErrors?.length > 0) {
      console.log('❌ Errori:', result.data.metafieldsSet.userErrors);
    } else {
      console.log('✅ Immagini salvate nei metafield!');
    }
  }

  console.log('\n🔗 https://italivio.com/products/orologio-elegante-collection-2024');
}

main().catch(console.error);
