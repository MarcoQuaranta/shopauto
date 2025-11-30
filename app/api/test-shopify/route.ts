import { NextRequest, NextResponse } from 'next/server';
import { shopifyGraphql } from '@/lib/shopify';

const TEST_QUERY = `
  query {
    shop {
      name
      email
      url
      myshopifyDomain
      plan {
        displayName
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json(
        { error: 'Missing shop parameter. Usage: /api/test-shopify?shop=your-store.myshopify.com' },
        { status: 400 }
      );
    }

    // Use access token from env
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'SHOPIFY_ACCESS_TOKEN not configured in .env' },
        { status: 500 }
      );
    }

    const result = await shopifyGraphql<any>(
      { shop, accessToken },
      TEST_QUERY
    );

    return NextResponse.json({
      success: true,
      message: 'Shopify connection successful!',
      shop: result.shop,
    });
  } catch (error: any) {
    console.error('Shopify test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to connect to Shopify',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
