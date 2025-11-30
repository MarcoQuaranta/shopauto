import crypto from 'crypto';

export const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
export const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
export const SHOPIFY_SCOPES = [
  'read_products',
  'write_products',
  'read_files',
  'write_files',
  'read_metaobjects',
  'write_metaobjects',
  'read_metafields',
  'write_metafields',
].join(',');

export const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function buildAuthUrl(shop: string, nonce: string): string {
  const redirectUri = `${APP_URL}/api/auth/callback`;
  const scopes = SHOPIFY_SCOPES;

  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: scopes,
    redirect_uri: redirectUri,
    state: nonce,
    grant_options: 'per-user',
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  return response.json();
}

export function verifyHmac(query: Record<string, string>): boolean {
  const { hmac, ...params } = query;

  const message = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  const hash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');

  return hash === hmac;
}
