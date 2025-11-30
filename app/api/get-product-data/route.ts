import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { shopifyGraphql, PRODUCT_GET_QUERY, PRODUCTS_LIST_QUERY, GET_PUBLICATIONS_QUERY, PUBLISH_PRODUCT_MUTATION } from '@/lib/shopify';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');
    const productId = searchParams.get('productId');
    const listAll = searchParams.get('listAll') === 'true';

    if (!shopId) {
      return NextResponse.json(
        { error: 'Missing required parameter: shopId' },
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

    // List all products
    if (listAll) {
      const productsResult: any = await shopifyGraphql(
        { shop: shop.shop, accessToken: shop.accessToken },
        PRODUCTS_LIST_QUERY,
        { first: 50 }
      );

      const products = productsResult.products.edges.map((edge: any) => edge.node);

      // Get local products for matching
      const localProducts = await prisma.product.findMany({
        where: { shopId: shop.id },
      });

      // Auto-publish all products to Online Store (background, non-blocking)
      (async () => {
        try {
          const publicationsResult: any = await shopifyGraphql(
            { shop: shop.shop, accessToken: shop.accessToken },
            GET_PUBLICATIONS_QUERY
          );

          const publications = publicationsResult.publications?.edges || [];
          const onlineStorePublication = publications.find((pub: any) =>
            pub.node.name === 'Online Store' || pub.node.name.toLowerCase().includes('online')
          );

          if (onlineStorePublication) {
            for (const product of products) {
              try {
                await shopifyGraphql(
                  { shop: shop.shop, accessToken: shop.accessToken },
                  PUBLISH_PRODUCT_MUTATION,
                  {
                    id: product.id,
                    input: [{ publicationId: onlineStorePublication.node.id }]
                  }
                );
              } catch (e) {
                // Ignore errors for already published products
              }
            }
            console.log(`Auto-published ${products.length} products to Online Store`);
          }
        } catch (e) {
          console.error('Auto-publish error:', e);
        }
      })();

      return NextResponse.json({
        success: true,
        products,
        localProducts,
        shopDomain: shop.shop,
      });
    }

    // Get single product
    if (productId) {
      // Get from local DB first
      const localProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!localProduct) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      // Get from Shopify
      const productResult: any = await shopifyGraphql(
        { shop: shop.shop, accessToken: shop.accessToken },
        PRODUCT_GET_QUERY,
        { id: localProduct.shopifyProductId }
      );

      return NextResponse.json({
        success: true,
        product: productResult.product,
        localProduct,
      });
    }

    return NextResponse.json(
      { error: 'Either productId or listAll must be provided' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Get product data error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get product data' },
      { status: 500 }
    );
  }
}
