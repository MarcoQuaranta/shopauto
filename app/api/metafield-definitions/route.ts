import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { shopifyGraphql, METAFIELD_DEFINITIONS_QUERY } from '@/lib/shopify';
import { MetafieldDefinition } from '@/types/shopify';
import { LEGACY_LANDING_FIELDS, mergeWithLegacyFields } from '@/lib/metafield-types';

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

// GET - Fetch metafield definitions for a shop
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');
  const forceRefresh = searchParams.get('refresh') === 'true';

  if (!shopId) {
    return NextResponse.json(
      { success: false, error: 'shopId è richiesto' },
      { status: 400 }
    );
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop non trovato' },
        { status: 404 }
      );
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedDefinitions = await prisma.metafieldDefinitionCache.findMany({
        where: {
          shopId,
          cachedAt: {
            gte: new Date(Date.now() - CACHE_DURATION),
          },
        },
      });

      if (cachedDefinitions.length > 0) {
        const definitions: MetafieldDefinition[] = cachedDefinitions.map((def: any) => ({
          id: def.id,
          namespace: def.namespace,
          key: def.key,
          name: def.name,
          type: def.type,
          description: def.description || undefined,
          validations: def.validations as any[] || undefined,
        }));

        // Merge with legacy fields
        const merged = mergeWithLegacyFields(definitions);

        return NextResponse.json({
          success: true,
          definitions: merged,
          fromCache: true,
        });
      }
    }

    // Fetch from Shopify
    const response: any = await shopifyGraphql(
      { shop: shop.shop, accessToken: shop.accessToken },
      METAFIELD_DEFINITIONS_QUERY,
      {
        ownerType: 'PRODUCT',
        first: 100,
      }
    );

    const shopDefinitions: MetafieldDefinition[] = response.metafieldDefinitions.edges.map(
      (edge: any) => ({
        id: edge.node.id,
        namespace: edge.node.namespace,
        key: edge.node.key,
        name: edge.node.name,
        type: edge.node.type.name,
        description: edge.node.description,
        validations: edge.node.validations,
      })
    );

    // Clear old cache and save new definitions
    await prisma.metafieldDefinitionCache.deleteMany({
      where: { shopId },
    });

    if (shopDefinitions.length > 0) {
      await prisma.metafieldDefinitionCache.createMany({
        data: shopDefinitions.map(def => ({
          shopId,
          namespace: def.namespace,
          key: def.key,
          name: def.name,
          type: def.type,
          description: def.description || null,
          validations: def.validations ? JSON.parse(JSON.stringify(def.validations)) : Prisma.JsonNull,
        })),
      });
    }

    // Merge with legacy fields
    const merged = mergeWithLegacyFields(shopDefinitions);

    return NextResponse.json({
      success: true,
      definitions: merged,
      fromCache: false,
    });
  } catch (error: any) {
    console.error('Error fetching metafield definitions:', error);

    // On error, return legacy fields at minimum
    return NextResponse.json({
      success: true,
      definitions: LEGACY_LANDING_FIELDS,
      fromCache: false,
      warning: 'Impossibile caricare le definizioni dallo shop, mostro solo i campi legacy',
    });
  }
}

// POST - Manually add a metafield definition to cache (for custom fields)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, namespace, key, name, type, description } = body;

    if (!shopId || !namespace || !key || !name || !type) {
      return NextResponse.json(
        { success: false, error: 'Campi richiesti: shopId, namespace, key, name, type' },
        { status: 400 }
      );
    }

    // Check if shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop non trovato' },
        { status: 404 }
      );
    }

    // Upsert definition in cache
    const definition = await prisma.metafieldDefinitionCache.upsert({
      where: {
        shopId_namespace_key: {
          shopId,
          namespace,
          key,
        },
      },
      update: {
        name,
        type,
        description: description || null,
        cachedAt: new Date(),
      },
      create: {
        shopId,
        namespace,
        key,
        name,
        type,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      definition: {
        id: definition.id,
        namespace: definition.namespace,
        key: definition.key,
        name: definition.name,
        type: definition.type,
        description: definition.description,
      },
    });
  } catch (error: any) {
    console.error('Error adding metafield definition:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove a metafield definition from cache
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');
  const namespace = searchParams.get('namespace');
  const key = searchParams.get('key');

  if (!shopId || !namespace || !key) {
    return NextResponse.json(
      { success: false, error: 'shopId, namespace e key sono richiesti' },
      { status: 400 }
    );
  }

  try {
    await prisma.metafieldDefinitionCache.delete({
      where: {
        shopId_namespace_key: {
          shopId,
          namespace,
          key,
        },
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting metafield definition:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
