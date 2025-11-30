import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Lista tutti gli shop
export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Map to include name (fallback to shop domain if name is null)
    const mappedShops = shops.map(s => ({
      id: s.id,
      name: (s as any).name || s.shop,
      shop: s.shop,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ success: true, shops: mappedShops });
  } catch (error: any) {
    console.error('Get shops error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get shops' },
      { status: 500 }
    );
  }
}

// POST - Crea/aggiorna uno shop
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, shopDomain, accessToken } = body;

    if (!shopDomain || !accessToken) {
      return NextResponse.json(
        { error: 'Shop domain e Access Token sono obbligatori' },
        { status: 400 }
      );
    }

    // Normalizza il dominio
    let normalizedDomain = shopDomain.trim().toLowerCase();
    if (!normalizedDomain.includes('.myshopify.com')) {
      normalizedDomain = `${normalizedDomain}.myshopify.com`;
    }

    // Verifica che le credenziali funzionino
    const testResponse = await fetch(
      `https://${normalizedDomain}/admin/api/2024-01/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!testResponse.ok) {
      return NextResponse.json(
        { error: 'Credenziali non valide. Verifica il dominio e l\'Access Token.' },
        { status: 400 }
      );
    }

    const shopData = await testResponse.json();

    // Upsert shop
    const shopName = name || shopData.shop?.name || normalizedDomain;
    const shop = await prisma.shop.upsert({
      where: { shop: normalizedDomain },
      update: {
        accessToken,
      } as any,
      create: {
        shop: normalizedDomain,
        accessToken,
      } as any,
    });

    // Update name separately if supported
    try {
      await prisma.shop.update({
        where: { id: shop.id },
        data: { name: shopName } as any,
      });
    } catch (e) {
      // name field might not exist yet
    }

    return NextResponse.json({
      success: true,
      shop: {
        id: shop.id,
        name: shopName,
        shop: shop.shop,
      },
      message: 'Shop configurato con successo!',
    });
  } catch (error: any) {
    console.error('Create shop error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create shop' },
      { status: 500 }
    );
  }
}

// DELETE - Elimina uno shop
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('id');

    if (!shopId) {
      return NextResponse.json({ error: 'Missing shop ID' }, { status: 400 });
    }

    await prisma.shop.delete({
      where: { id: shopId },
    });

    return NextResponse.json({ success: true, message: 'Shop eliminato' });
  } catch (error: any) {
    console.error('Delete shop error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete shop' },
      { status: 500 }
    );
  }
}
