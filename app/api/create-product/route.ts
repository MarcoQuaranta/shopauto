import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { shopifyGraphqlWithRefresh, PRODUCT_CREATE_MUTATION, METAFIELDS_SET_MUTATION, PUBLISH_PRODUCT_MUTATION, GET_PUBLICATIONS_QUERY } from '@/lib/shopify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shopId,
      title,
      description,
      price,
      compareAtPrice,
      sku,
      tags,
      templateSuffix = 'landing',
      metafields,
      images,
      options, // Product options for variants (e.g. Size, Color)
    } = body;

    console.log('[CREATE] Received request body:', JSON.stringify(body, null, 2));
    console.log('[CREATE] metafields received:', metafields ? Object.keys(metafields).length : 0, 'keys');
    console.log('[CREATE] Non-empty metafields:', metafields ? Object.entries(metafields).filter(([k, v]) => v !== '' && v !== null && v !== undefined).map(([k]) => k) : []);

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
      descriptionHtml: description || '',
      status: 'ACTIVE',
      templateSuffix,
    };

    // Add tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      productInput.tags = tags;
    }

    // Create product in Shopify
    const productResult: any = await shopifyGraphqlWithRefresh(
      shop.shop,
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

    // Publish product to ALL sales channels
    try {
      // Get all publications (sales channels)
      const publicationsResult: any = await shopifyGraphqlWithRefresh(
        shop.shop,
        GET_PUBLICATIONS_QUERY
      );

      const publications = publicationsResult.publications?.edges || [];
      const publishedChannels: string[] = [];

      // Publish to ALL available channels
      for (const pub of publications) {
        try {
          await shopifyGraphqlWithRefresh(
            shop.shop,
            PUBLISH_PRODUCT_MUTATION,
            {
              id: productGid,
              input: [{ publicationId: pub.node.id }]
            }
          );
          publishedChannels.push(pub.node.name);
        } catch (e) {
          console.log(`Could not publish to ${pub.node.name}`);
        }
      }

      console.log(`Product published to ${publishedChannels.length} channels:`, publishedChannels.join(', '));
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
    // NON passiamo il tipo - Shopify lo inferisce dalla definizione esistente
    if (metafields && Object.keys(metafields).length > 0) {
      const metafieldInputs = Object.entries(metafields)
        .filter(([key, value]) => {
          if (value === '' || value === null || value === undefined) return false;
          return true;
        })
        .map(([key, value]) => ({
          ownerId: productGid,
          namespace: 'custom',
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          // NON includere type - Shopify lo inferisce dalla definizione
        }));

      console.log('[CREATE] Metafields to save (without type):', JSON.stringify(metafieldInputs, null, 2));

      // Only send metafields if there are any after filtering
      if (metafieldInputs.length > 0) {
        const metafieldResult: any = await shopifyGraphqlWithRefresh(
          shop.shop,
          METAFIELDS_SET_MUTATION,
          { metafields: metafieldInputs }
        );

        if (metafieldResult.metafieldsSet.userErrors.length > 0) {
          console.error('[CREATE] Metafield errors:', metafieldResult.metafieldsSet.userErrors);
        } else {
          console.log('[CREATE] Metafields saved successfully:', metafieldResult.metafieldsSet.metafields?.length || 0, 'metafields');
        }
      } else {
        console.log('[CREATE] No metafields to save (all values are empty after filtering)');
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
