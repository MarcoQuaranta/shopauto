import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// Template files to sync
const TEMPLATE_FILES = [
  { local: 'sections/landing-hero.liquid', remote: 'sections/landing-hero.liquid' },
  { local: 'sections/landing-section-1.liquid', remote: 'sections/landing-section-1.liquid' },
  { local: 'sections/landing-text-block.liquid', remote: 'sections/landing-text-block.liquid' },
  { local: 'sections/landing-reviews.liquid', remote: 'sections/landing-reviews.liquid' },
  { local: 'sections/landing-faq.liquid', remote: 'sections/landing-faq.liquid' },
  { local: 'sections/landing-about.liquid', remote: 'sections/landing-about.liquid' },
  { local: 'templates/product.landing.json', remote: 'templates/product.landing.json' },
];

async function getMainThemeId(shop: string, accessToken: string): Promise<string | null> {
  const response = await fetch(`https://${shop}/admin/api/2024-01/themes.json`, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('Failed to get themes:', await response.text());
    return null;
  }

  const data = await response.json();
  const mainTheme = data.themes.find((theme: any) => theme.role === 'main');
  return mainTheme?.id?.toString() || null;
}

async function uploadAsset(
  shop: string,
  accessToken: string,
  themeId: string,
  assetKey: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(
    `https://${shop}/admin/api/2024-01/themes/${themeId}/assets.json`,
    {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset: {
          key: assetKey,
          value: content,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to upload ${assetKey}:`, errorText);
    return { success: false, error: errorText };
  }

  return { success: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json(
        { error: 'Missing required field: shopId' },
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

    console.log('[SYNC] Starting template sync for shop:', shop.shop);

    // Get main theme ID
    const themeId = await getMainThemeId(shop.shop, shop.accessToken);
    if (!themeId) {
      return NextResponse.json(
        { error: 'Could not find main theme' },
        { status: 400 }
      );
    }

    console.log('[SYNC] Found main theme ID:', themeId);

    const results: { file: string; success: boolean; error?: string }[] = [];
    const templatesDir = path.join(process.cwd(), 'templates', 'shopify');

    for (const file of TEMPLATE_FILES) {
      const localPath = path.join(templatesDir, file.local);

      if (!fs.existsSync(localPath)) {
        console.log(`[SYNC] File not found: ${localPath}`);
        results.push({ file: file.remote, success: false, error: 'File not found locally' });
        continue;
      }

      const content = fs.readFileSync(localPath, 'utf-8');
      console.log(`[SYNC] Uploading ${file.remote}...`);

      const result = await uploadAsset(shop.shop, shop.accessToken, themeId, file.remote, content);
      results.push({ file: file.remote, ...result });

      if (result.success) {
        console.log(`[SYNC] ✓ Uploaded ${file.remote}`);
      } else {
        console.log(`[SYNC] ✗ Failed ${file.remote}: ${result.error}`);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failCount === 0,
      message: `Synced ${successCount}/${results.length} templates`,
      themeId,
      results,
    });
  } catch (error: any) {
    console.error('[SYNC] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync templates' },
      { status: 500 }
    );
  }
}
