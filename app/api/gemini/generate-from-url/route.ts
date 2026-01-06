import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, url, fields } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL richiesto' },
        { status: 400 }
      );
    }

    // Get API key
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

    // Fetch page content
    let pageContent = '';
    try {
      const pageRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        // Extract text content (simple extraction)
        pageContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 10000); // Limit to 10k chars
      }
    } catch (fetchError) {
      console.error('Error fetching URL:', fetchError);
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build prompt
    const fieldsToGenerate = fields || ['bullet1', 'bullet2', 'bullet3', 'angle1_title', 'angle1_desc', 'angle2_title', 'angle2_desc', 'angle3_title', 'angle3_desc'];

    const prompt = `Analizza questa pagina prodotto e genera contenuti marketing in italiano.

URL: ${url}
${pageContent ? `\nContenuto pagina:\n${pageContent}` : ''}

Genera i seguenti campi per una landing page:
- title: Nome prodotto accattivante
- description: Descrizione breve del prodotto (2-3 frasi)
${fieldsToGenerate.map((f: string) => `- ${f}: ${getFieldDescription(f)}`).join('\n')}

Rispondi SOLO con un JSON valido nel formato:
{
  "title": "...",
  "description": "...",
  "metafields": {
    ${fieldsToGenerate.map((f: string) => `"${f}": "..."`).join(',\n    ')}
  }
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response
    let content;
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return NextResponse.json(
        { success: false, error: 'Errore nel parsing della risposta AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error: any) {
    console.error('Generate from URL error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function getFieldDescription(field: string): string {
  const descriptions: Record<string, string> = {
    bullet1: 'Primo punto chiave/beneficio del prodotto (breve, 5-10 parole)',
    bullet2: 'Secondo punto chiave/beneficio del prodotto (breve, 5-10 parole)',
    bullet3: 'Terzo punto chiave/beneficio del prodotto (breve, 5-10 parole)',
    angle1_title: 'Titolo primo angolo di vendita (es: "Qualità Premium")',
    angle1_desc: 'Descrizione primo angolo (2-3 frasi persuasive)',
    angle2_title: 'Titolo secondo angolo di vendita',
    angle2_desc: 'Descrizione secondo angolo (2-3 frasi persuasive)',
    angle3_title: 'Titolo terzo angolo di vendita',
    angle3_desc: 'Descrizione terzo angolo (2-3 frasi persuasive)',
  };

  return descriptions[field] || `Contenuto per ${field}`;
}
