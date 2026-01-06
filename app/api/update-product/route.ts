import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { shopifyGraphql, METAFIELDS_SET_MUTATION, PRODUCT_UPDATE_MUTATION } from '@/lib/shopify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[UPDATE] Received request body:', JSON.stringify(body, null, 2));

    const {
      productId,
      shopId,
      title,
      description,
      price,
      compareAtPrice,
      sku,
      metafields,
    } = body;

    console.log('[UPDATE] productId:', productId);
    console.log('[UPDATE] shopId:', shopId);

    if (!productId || !shopId) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, shopId' },
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

    // Get product from DB - try by local ID first, then by Shopify ID
    let product = await prisma.product.findUnique({
      where: { id: productId },
    });

    // If not found by local ID, try by Shopify ID
    if (!product) {
      product = await prisma.product.findFirst({
        where: { shopifyProductId: productId },
      });
    }

    // If still not found, create a local record for this Shopify product
    let shopifyProductId = productId;
    if (!product) {
      // productId is the Shopify GID, use it directly
      if (productId.startsWith('gid://shopify/Product/')) {
        shopifyProductId = productId;
        // Create local record
        product = await prisma.product.create({
          data: {
            shopifyProductId: productId,
            shopId: shop.id,
            title: title || 'Untitled',
            metafields: metafields || {},
          },
        });
        console.log('[UPDATE] Created local product record for Shopify product:', productId);
      } else {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
    } else {
      shopifyProductId = product.shopifyProductId;
    }

    // Update product basic info if provided
    if (title || description !== undefined) {
      const productInput: any = {
        id: shopifyProductId,
      };
      if (title) productInput.title = title;
      if (description !== undefined) productInput.descriptionHtml = description;

      const productResult: any = await shopifyGraphql(
        { shop: shop.shop, accessToken: shop.accessToken },
        PRODUCT_UPDATE_MUTATION,
        { input: productInput }
      );

      if (productResult.productUpdate.userErrors.length > 0) {
        return NextResponse.json(
          { error: productResult.productUpdate.userErrors },
          { status: 400 }
        );
      }
    }

    // Update variant price, compareAtPrice and SKU using REST API
    if (price || compareAtPrice || sku) {
      // First get the variant ID from Shopify
      const getProductQuery = `
        query getProduct($id: ID!) {
          product(id: $id) {
            variants(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      `;

      const productData: any = await shopifyGraphql(
        { shop: shop.shop, accessToken: shop.accessToken },
        getProductQuery,
        { id: shopifyProductId }
      );

      const variantId = productData.product?.variants?.edges[0]?.node?.id;

      if (variantId) {
        try {
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
        }
      }
    }

    // Update metafields if provided (only non-empty values)
    if (metafields && Object.keys(metafields).length > 0) {
      // Fetch metafield definitions from shop to get correct types
      const definitionsCache = await prisma.metafieldDefinitionCache.findMany({
        where: { shopId, namespace: 'custom' },
      });

      // Build type map from definitions
      const typeMap: Record<string, string> = {};
      definitionsCache.forEach((def) => {
        typeMap[def.key] = def.type;
      });

      console.log('[UPDATE] Type map from definitions:', typeMap);

      const metafieldInputs = Object.entries(metafields)
        .filter(([key, value]) => {
          if (value === '' || value === null || value === undefined) return false;
          return true;
        })
        .map(([key, value]) => ({
          ownerId: shopifyProductId,
          namespace: 'custom',
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          type: typeMap[key] || 'single_line_text_field',
        }));

      console.log('[UPDATE] Metafields to save:', JSON.stringify(metafieldInputs, null, 2));

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
        console.log('No metafields to update (all values are empty)');
      }
    }

    // Update product in database (use local product ID)
    if (product) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          ...(title && { title }),
          ...(price && { price }),
          ...(sku && { sku }),
          ...(metafields && { metafields }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}
