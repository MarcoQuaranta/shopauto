import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateLandingPageContent, GenerationOptions } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, prompt, options } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Il prompt è richiesto' },
        { status: 400 }
      );
    }

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
        { success: false, error: 'API key Gemini non configurata. Aggiungi GEMINI_API_KEY nelle variabili d\'ambiente o nelle impostazioni dello shop.' },
        { status: 400 }
      );
    }

    // Parse options
    const generationOptions: GenerationOptions = {
      tone: options?.tone,
      includeReviews: options?.includeReviews !== false,
      targetAudience: options?.targetAudience,
      productCategory: options?.productCategory,
    };

    // Generate content
    const content = await generateLandingPageContent(apiKey, prompt, generationOptions);

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error: any) {
    console.error('Gemini generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
