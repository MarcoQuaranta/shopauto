import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { assistField, FieldAction } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, fieldName, fieldLabel, productContext, currentValue, action } = body;

    if (!fieldName || !fieldLabel || !productContext) {
      return NextResponse.json(
        { success: false, error: 'fieldName, fieldLabel e productContext sono richiesti' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions: FieldAction[] = ['generate', 'improve', 'shorten', 'expand', 'translate'];
    const fieldAction: FieldAction = validActions.includes(action) ? action : 'generate';

    // Get API key (from shop settings or environment)
    let apiKey = process.env.GEMINI_API_KEY;

    if (shopId) {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { geminiApiKey: true },
      });

      if (shop?.geminiApiKey) {
        apiKey = shop.geminiApiKey;
      }
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key Gemini non configurata' },
        { status: 400 }
      );
    }

    // Generate field content
    const value = await assistField(
      apiKey,
      fieldName,
      fieldLabel,
      productContext,
      currentValue,
      fieldAction
    );

    return NextResponse.json({
      success: true,
      value,
    });
  } catch (error: any) {
    console.error('Gemini assist error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
