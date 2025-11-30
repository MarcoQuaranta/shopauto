import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { shopifyGraphql, PRODUCT_CREATE_MUTATION, METAFIELDS_SET_MUTATION, PUBLISH_PRODUCT_MUTATION, GET_PUBLICATIONS_QUERY } from '@/lib/shopify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shopId,
      title,
      price,
      compareAtPrice,
      sku,
      templateSuffix = 'landing',
      metafields,
      images,
    } = body;

    if (!shopId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: shopId, title' },
        { status: 400 }
      );
    }

    // Get shop credentials
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Prepare product input (variants are auto-created by Shopify)
    const productInput: any = {
      title,
      status: 'ACTIVE',
      templateSuffix,
    };

    // Create product in Shopify
    const productResult: any = await shopifyGraphql(
      { shop: shop.shop, accessToken: shop.accessToken },
      PRODUCT_CREATE_MUTATION,
      { input: productInput }
    );

    if (productResult.productCreate.userErrors.length > 0) {
      return NextResponse.json(
        { error: productResult.productCreate.userErrors },
        { status: 400 }
      );
    }

    const createdProduct = productResult.productCreate.product;
    const productGid = createdProduct.id;

    // Publish product to Online Store channel
    try {
      // Get all publications (sales channels)
      const publicationsResult: any = await shopifyGraphql(
        { shop: shop.shop, accessToken: shop.accessToken },
        GET_PUBLICATIONS_QUERY
      );

      const publications = publicationsResult.publications?.edges || [];

      // Find Online Store publication
      const onlineStorePublication = publications.find((pub: any) =>
        pub.node.name === 'Online Store' || pub.node.name.toLowerCase().includes('online')
      );

      if (onlineStorePublication) {
        await shopifyGraphql(
          { shop: shop.shop, accessToken: shop.accessToken },
          PUBLISH_PRODUCT_MUTATION,
          {
            id: productGid,
            input: [{ publicationId: onlineStorePublication.node.id }]
          }
        );
        console.log('Product published to Online Store');
      } else {
        // If no Online Store found, publish to all channels
        for (const pub of publications) {
          try {
            await shopifyGraphql(
              { shop: shop.shop, accessToken: shop.accessToken },
              PUBLISH_PRODUCT_MUTATION,
              {
                id: productGid,
                input: [{ publicationId: pub.node.id }]
              }
            );
          } catch (e) {
            console.log(`Could not publish to ${pub.node.name}`);
          }
        }
      }
    } catch (publishError) {
      console.error('Error publishing product:', publishError);
      // Don't fail the request, product is still created
    }

    // Update variant price, compareAtPrice and SKU using REST API
    if (price || compareAtPrice || sku) {
      const variantId = createdProduct.variants.edges[0]?.node?.id;

      if (variantId) {
        try {
          // Extract numeric ID from GID (gid://shopify/ProductVariant/123 -> 123)
          const numericVariantId = variantId.split('/').pop();

          const variantUpdateData: any = {};
          if (price) variantUpdateData.price = price.toString();
          if (compareAtPrice) variantUpdateData.compare_at_price = compareAtPrice.toString();
          if (sku) variantUpdateData.sku = sku;

          const restApiUrl = `https://${shop.shop}/admin/api/2024-01/variants/${numericVariantId}.json`;

          const restResponse = await fetch(restApiUrl, {
            method: 'PUT',
            headers: {
              'X-Shopify-Access-Token': shop.accessToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              variant: variantUpdateData,
            }),
          });

          if (!restResponse.ok) {
            console.error('Failed to update variant price/SKU:', await restResponse.text());
          } else {
            console.log('Variant price/SKU updated successfully');
          }
        } catch (variantError) {
          console.error('Error updating variant:', variantError);
          // Non bloccare il flusso, il prodotto è comunque creato
        }
      }
    }

    // Set metafields if provided (only non-empty values)
    if (metafields && Object.keys(metafields).length > 0) {
      // Keys that should use multi_line_text_field (longer texts)
      const multiLineKeys = [
        'hero_subtitle', 'section1_text', 'section1_bullets',
        'section2_text', 'section2_bullets', 'section3_text',
        'text_block_description', 'review1_text', 'review2_text', 'review3_text'
      ];

      const metafieldInputs = Object.entries(metafields)
        .filter(([key, value]) => {
          // Skip empty strings and null/undefined
          if (value === '' || value === null || value === undefined) return false;
          return true;
        })
        .map(([key, value]) => ({
          ownerId: productGid,
          namespace: 'landing',
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          type: multiLineKeys.includes(key) ? 'multi_line_text_field' : 'single_line_text_field',
        }));

      console.log('[CREATE] Metafields to save:', JSON.stringify(metafieldInputs, null, 2));

      // Only send metafields if there are any after filtering
      if (metafieldInputs.length > 0) {
        const metafieldResult: any = await shopifyGraphql(
          { shop: shop.shop, accessToken: shop.accessToken },
          METAFIELDS_SET_MUTATION,
          { metafields: metafieldInputs }
        );

        if (metafieldResult.metafieldsSet.userErrors.length > 0) {
          console.error('Metafield errors:', metafieldResult.metafieldsSet.userErrors);
        }
      } else {
        console.log('No metafields to save (all values are empty)');
      }
    }

    // Save product to database
    const dbProduct = await prisma.product.create({
      data: {
        shopifyProductId: productGid,
        shopId: shop.id,
        title,
        price,
        sku,
        templateSuffix,
        metafields: metafields || {},
      },
    });

    return NextResponse.json({
      success: true,
      product: {
        id: dbProduct.id,
        shopifyId: productGid,
        title: createdProduct.title,
        handle: createdProduct.handle,
      },
    });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
