import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { shopifyGraphql } from '@/lib/shopify';

const PRODUCT_METAFIELDS_QUERY = `
  query getProductMetafields($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      metafields(first: 50, namespace: "custom") {
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
  const productId = searchParams.get('productId'); // Shopify GID

  if (!shopId || !productId) {
    return NextResponse.json({ error: 'shopId and productId required' }, { status: 400 });
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const result: any = await shopifyGraphql(
      { shop: shop.shop, accessToken: shop.accessToken },
      PRODUCT_METAFIELDS_QUERY,
      { id: productId }
    );

    const metafields = result.product?.metafields?.edges?.map((e: any) => ({
      key: e.node.key,
      value: e.node.value,
      type: e.node.type,
    })) || [];

    return NextResponse.json({
      product: {
        id: result.product?.id,
        title: result.product?.title,
        handle: result.product?.handle,
      },
      metafields,
      count: metafields.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
