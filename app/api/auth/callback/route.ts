import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, verifyHmac } from '@/lib/oauth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');
  const hmac = searchParams.get('hmac');

  if (!code || !shop || !hmac) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // Verify HMAC
  const queryParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  if (!verifyHmac(queryParams)) {
    return NextResponse.json({ error: 'Invalid HMAC' }, { status: 403 });
  }

  try {
    // Exchange code for access token
    const { access_token, scope } = await exchangeCodeForToken(shop, code);

    // Store in database
    await prisma.shop.upsert({
      where: { shop },
      update: {
        accessToken: access_token,
        scope,
      },
      create: {
        shop,
        accessToken: access_token,
        scope,
      },
    });

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
