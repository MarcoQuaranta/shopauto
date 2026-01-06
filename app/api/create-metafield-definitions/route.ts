import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { shopifyGraphql, METAFIELD_DEFINITION_CREATE_MUTATION, METAFIELD_DEFINITION_PIN_MUTATION } from '@/lib/shopify';

// Definizioni dei metafield da creare
const METAFIELD_DEFINITIONS = [
  // Bullets
  { namespace: 'custom', key: 'bullet_1', name: 'Bullet 1', type: 'single_line_text_field', description: 'Primo punto chiave del prodotto' },
  { namespace: 'custom', key: 'bullet_2', name: 'Bullet 2', type: 'single_line_text_field', description: 'Secondo punto chiave del prodotto' },
  { namespace: 'custom', key: 'bullet_3', name: 'Bullet 3', type: 'single_line_text_field', description: 'Terzo punto chiave del prodotto' },

  // Angle 1
  { namespace: 'custom', key: 'angle_1_image', name: 'Angle 1 Image', type: 'file_reference', description: 'Immagine angolo 1' },
  { namespace: 'custom', key: 'angle_1_title', name: 'Angle 1 Title', type: 'single_line_text_field', description: 'Titolo angolo 1' },
  { namespace: 'custom', key: 'angle_1_text', name: 'Angle 1 Text', type: 'multi_line_text_field', description: 'Testo angolo 1' },

  // Angle 2
  { namespace: 'custom', key: 'angle_2_image', name: 'Angle 2 Image', type: 'file_reference', description: 'Immagine angolo 2' },
  { namespace: 'custom', key: 'angle_2_title', name: 'Angle 2 Title', type: 'single_line_text_field', description: 'Titolo angolo 2' },
  { namespace: 'custom', key: 'angle_2_text', name: 'Angle 2 Text', type: 'multi_line_text_field', description: 'Testo angolo 2' },

  // Angle 3
  { namespace: 'custom', key: 'angle_3_image', name: 'Angle 3 Image', type: 'file_reference', description: 'Immagine angolo 3' },
  { namespace: 'custom', key: 'angle_3_title', name: 'Angle 3 Title', type: 'single_line_text_field', description: 'Titolo angolo 3' },
  { namespace: 'custom', key: 'angle_3_text', name: 'Angle 3 Text', type: 'multi_line_text_field', description: 'Testo angolo 3' },

  // Lifestyle
  { namespace: 'custom', key: 'lifestyle_main_title', name: 'Lifestyle Main Title', type: 'single_line_text_field', description: 'Titolo principale sezione lifestyle' },
  { namespace: 'custom', key: 'lifestyle_left_icon', name: 'Lifestyle Left Icon', type: 'file_reference', description: 'Icona sinistra lifestyle' },
  { namespace: 'custom', key: 'lifestyle_left_title', name: 'Lifestyle Left Title', type: 'single_line_text_field', description: 'Titolo sinistra lifestyle' },
  { namespace: 'custom', key: 'lifestyle_left_text', name: 'Lifestyle Left Text', type: 'multi_line_text_field', description: 'Testo sinistra lifestyle' },
  { namespace: 'custom', key: 'lifestyle_image', name: 'Lifestyle Image', type: 'file_reference', description: 'Immagine/GIF centrale lifestyle' },
  { namespace: 'custom', key: 'lifestyle_right_icon', name: 'Lifestyle Right Icon', type: 'file_reference', description: 'Icona destra lifestyle' },
  { namespace: 'custom', key: 'lifestyle_right_title', name: 'Lifestyle Right Title', type: 'single_line_text_field', description: 'Titolo destra lifestyle' },
  { namespace: 'custom', key: 'lifestyle_right_text', name: 'Lifestyle Right Text', type: 'multi_line_text_field', description: 'Testo destra lifestyle' },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json(
        { error: 'shopId richiesto' },
        { status: 400 }
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop non trovato' }, { status: 404 });
    }

    const shopConfig = { shop: shop.shop, accessToken: shop.accessToken };
    const results: any[] = [];
    const errors: any[] = [];

    for (const def of METAFIELD_DEFINITIONS) {
      try {
        console.log(`[METAFIELD DEF] Creating: ${def.namespace}.${def.key}`);

        const result: any = await shopifyGraphql(
          shopConfig,
          METAFIELD_DEFINITION_CREATE_MUTATION,
          {
            definition: {
              namespace: def.namespace,
              key: def.key,
              name: def.name,
              type: def.type,
              description: def.description,
              ownerType: 'PRODUCT',
              pin: true, // Pin automaticamente
            },
          }
        );

        if (result.metafieldDefinitionCreate.userErrors.length > 0) {
          const error = result.metafieldDefinitionCreate.userErrors[0];
          // Se già esiste, prova a pinnarlo
          if (error.message.includes('already exists') || error.message.includes('già esistente')) {
            console.log(`[METAFIELD DEF] ${def.key} already exists, skipping`);
            results.push({ key: def.key, status: 'exists' });
          } else {
            console.error(`[METAFIELD DEF] Error for ${def.key}:`, error);
            errors.push({ key: def.key, error: error.message });
          }
        } else {
          const created = result.metafieldDefinitionCreate.createdDefinition;
          console.log(`[METAFIELD DEF] Created: ${def.key} with ID ${created?.id}`);
          results.push({ key: def.key, status: 'created', id: created?.id });
        }
      } catch (err: any) {
        console.error(`[METAFIELD DEF] Exception for ${def.key}:`, err.message);
        errors.push({ key: def.key, error: err.message });
      }
    }

    // Aggiorna la cache
    await prisma.metafieldDefinitionCache.deleteMany({
      where: { shopId },
    });

    return NextResponse.json({
      success: true,
      message: `Creazione completata: ${results.length} processati, ${errors.length} errori`,
      results,
      errors,
    });
  } catch (error: any) {
    console.error('Create metafield definitions error:', error);
    return NextResponse.json(
      { error: error.message || 'Errore durante la creazione delle definizioni' },
      { status: 500 }
    );
  }
}
