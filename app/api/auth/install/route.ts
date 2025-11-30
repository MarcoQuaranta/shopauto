import { NextRequest, NextResponse } from 'next/server';
import { buildAuthUrl, generateNonce } from '@/lib/oauth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  // Normalize shop domain
  const shopDomain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Generate nonce and build auth URL
  const nonce = generateNonce();
  const authUrl = buildAuthUrl(shopDomain, nonce);

  // In production, you should store nonce in session/database
  // For now, we redirect directly
  return NextResponse.redirect(authUrl);
}
