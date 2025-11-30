import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { shopifyGraphql, PRODUCT_DELETE_MUTATION, UNPUBLISH_PRODUCT_MUTATION, GET_PUBLICATIONS_QUERY } from '@/lib/shopify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, productId, action } = body; // action: 'delete' | 'unpublish'

    if (!shopId || !productId) {
      return NextResponse.json({ error: 'Missing shopId or productId' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    if (action === 'delete') {
      // Delete product from Shopify
      const result: any = await shopifyGraphql(
        { shop: shop.shop, accessToken: shop.accessToken },
        PRODUCT_DELETE_MUTATION,
        { input: { id: productId } }
      );

      if (result.productDelete.userErrors.length > 0) {
        return NextResponse.json({
          error: result.productDelete.userErrors[0].message
        }, { status: 400 });
      }

      // Also delete from local DB if exists
      await prisma.product.deleteMany({
        where: { shopifyProductId: productId },
      });

      return NextResponse.json({
        success: true,
        message: 'Prodotto eliminato definitivamente',
      });

    } else if (action === 'unpublish') {
      // Get Online Store publication
      const pubResult: any = await shopifyGraphql(
        { shop: shop.shop, accessToken: shop.accessToken },
        GET_PUBLICATIONS_QUERY
      );

      const publications = pubResult.publications?.edges || [];
      const onlineStore = publications.find((p: any) =>
        p.node.name === 'Online Store' || p.node.name.toLowerCase().includes('online')
      );

      if (!onlineStore) {
        return NextResponse.json({ error: 'Online Store channel not found' }, { status: 404 });
      }

      // Unpublish from Online Store
      const result: any = await shopifyGraphql(
        { shop: shop.shop, accessToken: shop.accessToken },
        UNPUBLISH_PRODUCT_MUTATION,
        {
          id: productId,
          input: [{ publicationId: onlineStore.node.id }]
        }
      );

      if (result.publishableUnpublish.userErrors.length > 0) {
        return NextResponse.json({
          error: result.publishableUnpublish.userErrors[0].message
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Prodotto rimosso dal catalogo (non visibile ai clienti)',
      });

    } else {
      return NextResponse.json({ error: 'Invalid action. Use "delete" or "unpublish"' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Delete/unpublish product error:', error);
    return NextResponse.json(
      { error: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}
