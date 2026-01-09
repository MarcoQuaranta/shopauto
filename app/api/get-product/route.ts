import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { shopifyGraphqlWithRefresh } from '@/lib/shopify';

const GET_PRODUCT_FULL_QUERY = `
  query getProductFull($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      descriptionHtml
      status
      templateSuffix
      tags
      featuredImage {
        url
      }
      options {
        id
        name
        values
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            price
            compareAtPrice
            sku
            inventoryQuantity
            selectedOptions {
              name
              value
            }
            inventoryItem {
              id
              tracked
            }
            image {
              id
              url
              altText
            }
          }
        }
      }
      media(first: 50) {
        edges {
          node {
            ... on MediaImage {
              id
              image {
                url
                altText
              }
            }
          }
        }
      }
      metafields(first: 50) {
        edges {
          node {
            id
            namespace
            key
            value
            type
          }
        }
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');
  const productId = searchParams.get('productId');

  if (!shopId || !productId) {
    return NextResponse.json(
      { error: 'shopId e productId sono richiesti' },
      { status: 400 }
    );
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop non trovato' }, { status: 404 });
    }

    // Fetch product from Shopify
    const response: any = await shopifyGraphqlWithRefresh(
      shop.shop,
      GET_PRODUCT_FULL_QUERY,
      { id: productId }
    );

    const product = response.product;
    if (!product) {
      return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });
    }

    // Get local product data
    const localProduct = await prisma.product.findFirst({
      where: {
        shopId,
        shopifyProductId: productId,
      },
    });

    // Parse metafields into a flat object
    const metafields: Record<string, string> = {};
    product.metafields?.edges?.forEach((edge: any) => {
      const mf = edge.node;
      if (mf.namespace === 'custom') {
        metafields[mf.key] = mf.value;
      }
    });

    // Build URL to MediaId mapping (since variant.image returns ProductImage, not MediaImage)
    const urlToMediaId: Record<string, string> = {};
    product.media?.edges?.forEach((edge: any) => {
      if (edge.node.image?.url) {
        // Normalize URL by removing query params for matching
        const normalizedUrl = edge.node.image.url.split('?')[0];
        urlToMediaId[normalizedUrl] = edge.node.id;
      }
    });

    // Parse variants
    const variants = product.variants.edges.map((edge: any) => {
      const variantImageUrl = edge.node.image?.url || null;
      // Find the mediaId by matching URL
      let mediaId = null;
      if (variantImageUrl) {
        const normalizedVariantUrl = variantImageUrl.split('?')[0];
        mediaId = urlToMediaId[normalizedVariantUrl] || null;
      }

      return {
        id: edge.node.id,
        title: edge.node.title,
        price: edge.node.price,
        compareAtPrice: edge.node.compareAtPrice,
        sku: edge.node.sku,
        inventoryQuantity: edge.node.inventoryQuantity,
        options: edge.node.selectedOptions.reduce((acc: Record<string, string>, opt: any) => {
          acc[opt.name] = opt.value;
          return acc;
        }, {}),
        tracked: edge.node.inventoryItem?.tracked ?? true,
        // Include variant image - use mediaId for API compatibility
        imageId: mediaId,
        imageUrl: variantImageUrl,
      };
    });

    // Parse options
    const options = product.options
      .filter((opt: any) => opt.name !== 'Title') // Filter out default option
      .map((opt: any) => ({
        id: opt.id,
        name: opt.name,
        values: opt.values,
      }));

    // Parse images
    const images = product.media?.edges
      ?.filter((edge: any) => edge.node.image)
      .map((edge: any) => ({
        id: edge.node.id,
        url: edge.node.image.url,
        altText: edge.node.image.altText,
      })) || [];

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        localId: localProduct?.id,
        title: product.title,
        handle: product.handle,
        description: product.descriptionHtml,
        status: product.status,
        templateSuffix: product.templateSuffix,
        tags: product.tags ? product.tags.join(', ') : '',
        featuredImage: product.featuredImage?.url,
        options,
        variants,
        images,
        metafields,
        // First variant data for simple products
        price: variants[0]?.price,
        compareAtPrice: variants[0]?.compareAtPrice,
        sku: variants[0]?.sku,
      },
    });
  } catch (error: any) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: error.message || 'Errore nel caricamento prodotto' },
      { status: 500 }
    );
  }
}
