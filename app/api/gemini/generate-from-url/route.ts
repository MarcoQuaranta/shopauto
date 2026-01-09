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
    const model = genAI.getGenerativeModel({ model: 'gemma-3-4b-it' });

    // Build prompt
    const fieldsToGenerate = fields || ['bullet1', 'bullet2', 'bullet3', 'angle1_title', 'angle1_desc', 'angle2_title', 'angle2_desc', 'angle3_title', 'angle3_desc'];

    const prompt = `Analyze this product page and generate marketing content in English.

URL: ${url}
${pageContent ? `\nPage content:\n${pageContent}` : ''}

RULES:
- NEVER mention brand names, store names, or product names
- Focus on product characteristics and features
- Description: 1-2 sentences MAX

YOU MUST GENERATE ALL OF THE FOLLOWING FIELDS. DO NOT SKIP ANY FIELD:

1. description: Very short product description (1-2 sentences)

2. BULLETS (all 3 required):
   - bullet_1: Format "<strong>Keyword</strong>: brief description"
   - bullet_2: Format "<strong>Keyword</strong>: brief description"
   - bullet_3: Format "<strong>Keyword</strong>: brief description"

3. ANGLES (all 6 required):
   - angle_1_title: DESIGN angle title (2-4 words)
   - angle_1_text: DESIGN description (3-4 sentences with <strong> tags)
   - angle_2_title: FIT & COMFORT angle title (2-4 words)
   - angle_2_text: FIT & COMFORT description (3-4 sentences with <strong> tags)
   - angle_3_title: MATERIALS angle title (2-4 words)
   - angle_3_text: MATERIALS description (3-4 sentences with <strong> tags)

4. LIFESTYLE (all 5 required):
   - lifestyle_main_title: Emotional headline (3-5 words)
   - lifestyle_left_title: Versatility title (2-4 words)
   - lifestyle_left_text: When/where to wear (2-3 sentences)
   - lifestyle_right_title: Comfort/lifestyle title (2-4 words)
   - lifestyle_right_text: How it makes you feel (2-3 sentences)

Reply with this EXACT JSON structure (all fields mandatory):
{
  "description": "...",
  "metafields": {
    "bullet_1": "...",
    "bullet_2": "...",
    "bullet_3": "...",
    "angle_1_title": "...",
    "angle_1_text": "...",
    "angle_2_title": "...",
    "angle_2_text": "...",
    "angle_3_title": "...",
    "angle_3_text": "...",
    "lifestyle_main_title": "...",
    "lifestyle_left_title": "...",
    "lifestyle_left_text": "...",
    "lifestyle_right_title": "...",
    "lifestyle_right_text": "..."
  }
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // ============================================
    // DEBUG: Log raw AI response
    // ============================================
    console.log('========== AI RAW RESPONSE ==========');
    console.log('Response length:', text.length);
    console.log('Full response:\n', text);
    console.log('======================================');

    // Parse JSON response
    let content;
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('========== EXTRACTED JSON ==========');
        console.log('JSON length:', jsonMatch[0].length);
        console.log('JSON content:\n', jsonMatch[0]);
        console.log('=====================================');
        content = JSON.parse(jsonMatch[0]);
        console.log('========== PARSED CONTENT ==========');
        console.log('Parsed keys:', Object.keys(content));
        console.log('Metafields keys:', content.metafields ? Object.keys(content.metafields) : 'NO METAFIELDS OBJECT');
        console.log('=====================================');
      } else {
        console.error('NO JSON FOUND IN RESPONSE');
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw text that failed to parse:', text);
      return NextResponse.json(
        { success: false, error: 'Errore nel parsing della risposta AI' },
        { status: 500 }
      );
    }

    // Normalize JSON structure - move fields from root to metafields if needed
    // (AI sometimes puts angle/lifestyle fields at root instead of inside metafields)
    if (!content.metafields) {
      content.metafields = {};
    }

    const fieldsToNormalize = [
      'bullet_1', 'bullet_2', 'bullet_3',
      'angle_1_title', 'angle_1_text',
      'angle_2_title', 'angle_2_text',
      'angle_3_title', 'angle_3_text',
      'lifestyle_main_title',
      'lifestyle_left_title', 'lifestyle_left_text',
      'lifestyle_right_title', 'lifestyle_right_text'
    ];

    for (const field of fieldsToNormalize) {
      if (content[field] && !content.metafields[field]) {
        content.metafields[field] = content[field];
        delete content[field];
      }
    }

    // ============================================
    // VALIDATION: Check all required fields
    // ============================================
    const requiredFields = {
      // Bullets
      bullet_1: 'Bullet 1 (primo punto chiave del prodotto)',
      bullet_2: 'Bullet 2 (secondo punto chiave del prodotto)',
      bullet_3: 'Bullet 3 (terzo punto chiave del prodotto)',
      // Angle 1 - DESIGN
      angle_1_title: 'Angle 1 Title (titolo sezione DESIGN)',
      angle_1_text: 'Angle 1 Text (descrizione sezione DESIGN)',
      // Angle 2 - FIT & COMFORT
      angle_2_title: 'Angle 2 Title (titolo sezione FIT & COMFORT)',
      angle_2_text: 'Angle 2 Text (descrizione sezione FIT & COMFORT)',
      // Angle 3 - MATERIALS
      angle_3_title: 'Angle 3 Title (titolo sezione MATERIALS)',
      angle_3_text: 'Angle 3 Text (descrizione sezione MATERIALS)',
      // Lifestyle
      lifestyle_main_title: 'Lifestyle Main Title (titolo principale sezione lifestyle)',
      lifestyle_left_title: 'Lifestyle Left Title (titolo colonna sinistra)',
      lifestyle_left_text: 'Lifestyle Left Text (testo colonna sinistra)',
      lifestyle_right_title: 'Lifestyle Right Title (titolo colonna destra)',
      lifestyle_right_text: 'Lifestyle Right Text (testo colonna destra)',
    };

    const missingFields: string[] = [];
    const emptyFields: string[] = [];

    for (const [fieldKey, fieldDescription] of Object.entries(requiredFields)) {
      const value = content.metafields[fieldKey];
      if (value === undefined || value === null) {
        missingFields.push(fieldDescription);
      } else if (typeof value === 'string' && value.trim() === '') {
        emptyFields.push(fieldDescription);
      }
    }

    // Build detailed error message if fields are missing
    if (missingFields.length > 0 || emptyFields.length > 0) {
      const errorParts: string[] = [];

      if (missingFields.length > 0) {
        errorParts.push(
          `CAMPI NON GENERATI (${missingFields.length}):\n` +
          missingFields.map((f, i) => `  ${i + 1}. ${f}`).join('\n')
        );
      }

      if (emptyFields.length > 0) {
        errorParts.push(
          `CAMPI VUOTI (${emptyFields.length}):\n` +
          emptyFields.map((f, i) => `  ${i + 1}. ${f}`).join('\n')
        );
      }

      const totalMissing = missingFields.length + emptyFields.length;
      const errorMessage =
        `⚠️ GENERAZIONE AI INCOMPLETA\n\n` +
        `L'AI ha generato solo ${Object.keys(requiredFields).length - totalMissing}/${Object.keys(requiredFields).length} campi richiesti.\n\n` +
        errorParts.join('\n\n') +
        `\n\n💡 POSSIBILI CAUSE:\n` +
        `  - La pagina sorgente non contiene abbastanza informazioni sul prodotto\n` +
        `  - Il modello AI ha raggiunto il limite di token\n` +
        `  - La risposta AI è stata troncata\n\n` +
        `🔧 SOLUZIONI:\n` +
        `  - Prova con un URL diverso con più dettagli\n` +
        `  - Riprova la generazione (a volte funziona al secondo tentativo)\n` +
        `  - Compila manualmente i campi mancanti`;

      console.error('AI Generation incomplete:', {
        missingFields,
        emptyFields,
        generatedFields: Object.keys(content.metafields),
        rawResponse: text.substring(0, 500) + '...'
      });

      return NextResponse.json({
        success: false,
        error: errorMessage,
        partialContent: content, // Include partial content so user can use what was generated
        details: {
          missingFields,
          emptyFields,
          totalRequired: Object.keys(requiredFields).length,
          totalGenerated: Object.keys(requiredFields).length - totalMissing
        }
      }, { status: 422 }); // 422 Unprocessable Entity
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
    bullet_1: 'Format: "<strong>Keyword</strong>: brief description" - First key benefit (bold keyword before colon)',
    bullet_2: 'Format: "<strong>Keyword</strong>: brief description" - Second key benefit (bold keyword before colon)',
    bullet_3: 'Format: "<strong>Keyword</strong>: brief description" - Third key benefit (bold keyword before colon)',
    angle_1_title: 'DESIGN angle title - about aesthetics, style, visual appeal (short, 2-4 words)',
    angle_1_text: 'DESIGN angle description (3-4 sentences). Use <strong> tags on 2-3 key words/phrases',
    angle_2_title: 'FIT & COMFORT angle title - about fit, comfort, functionality (short, 2-4 words)',
    angle_2_text: 'FIT & COMFORT angle description (3-4 sentences). Use <strong> tags on 2-3 key words/phrases',
    angle_3_title: 'MATERIALS angle title - about fabric quality, materials, durability (short, 2-4 words)',
    angle_3_text: 'MATERIALS angle description (3-4 sentences). Use <strong> tags on 2-3 key words/phrases',
    lifestyle_main_title: 'Emotional aspirational headline for lifestyle section (short, 3-5 words)',
    lifestyle_left_title: 'Versatility/occasions title - about when to wear it (short, 2-4 words)',
    lifestyle_left_text: 'When and where to wear this product (2-3 sentences, emotional tone)',
    lifestyle_right_title: 'Lifestyle/comfort title - about feeling good (short, 2-4 words)',
    lifestyle_right_text: 'How this product makes you feel confident and comfortable (2-3 sentences, emotional tone)',
  };

  return descriptions[field] || `Content for ${field}`;
}
