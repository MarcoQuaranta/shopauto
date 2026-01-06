import { GoogleGenerativeAI } from '@google/generative-ai';

// Landing page field structure
export interface LandingPageContent {
  // Basic product info
  title?: string;
  description?: string;

  // Hero section
  hero_overtitle?: string;
  hero_title?: string;
  hero_subtitle?: string;

  // About section
  about_title?: string;
  about_subtitle?: string;

  // CTA & Scarcity
  scarcity_text?: string;
  cta_button_text?: string;
  sticky_cta_text?: string;

  // Icons/Features
  icon1_text?: string;
  icon2_text?: string;
  icon3_text?: string;

  // Sections 1-3
  section1_overtitle?: string;
  section1_title?: string;
  section1_text?: string;
  section1_bullets?: string;

  section2_overtitle?: string;
  section2_title?: string;
  section2_text?: string;
  section2_bullets?: string;

  section3_overtitle?: string;
  section3_title?: string;
  section3_text?: string;

  // Text block
  text_block_subtitle?: string;
  text_block_description?: string;

  // Reviews
  reviews_title?: string;
  review1_stars?: string;
  review1_author?: string;
  review1_text?: string;
  review2_stars?: string;
  review2_author?: string;
  review2_text?: string;
  review3_stars?: string;
  review3_author?: string;
  review3_text?: string;
}

export interface GenerationOptions {
  tone?: 'professionale' | 'amichevole' | 'urgente' | 'lusso';
  includeReviews?: boolean;
  targetAudience?: string;
  productCategory?: string;
}

export type FieldAction = 'generate' | 'improve' | 'shorten' | 'expand' | 'translate';

const SYSTEM_PROMPT = `Sei un esperto copywriter italiano specializzato in landing page e-commerce.

Linee guida IMPORTANTI:
- Scrivi SEMPRE in italiano fluente e naturale
- Usa un tono persuasivo ma credibile
- Includi call-to-action efficaci
- Puoi usare HTML base: <strong>, <em>, <br>
- Per i bullet points (campi con _bullets), separa con il carattere |
- Le recensioni devono sembrare autentiche con nomi italiani realistici
- Enfatizza i BENEFICI, non solo le caratteristiche
- Evita frasi generiche e luoghi comuni
- Crea urgenza senza essere aggressivo`;

const TONE_INSTRUCTIONS: Record<string, string> = {
  professionale: 'Usa un tono professionale e autorevole, adatto a un pubblico esigente.',
  amichevole: 'Usa un tono amichevole e colloquiale, come se parlassi con un amico.',
  urgente: 'Crea senso di urgenza e scarsità, spingendo all\'azione immediata.',
  lusso: 'Usa un tono elegante e sofisticato, enfatizzando esclusività e qualità premium.',
};

/**
 * Generate complete landing page content from a product description
 */
export async function generateLandingPageContent(
  apiKey: string,
  productPrompt: string,
  options: GenerationOptions = {}
): Promise<LandingPageContent> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.8,
      topP: 0.9,
      maxOutputTokens: 4096,
    },
  });

  const toneInstruction = options.tone ? TONE_INSTRUCTIONS[options.tone] : '';
  const audienceInstruction = options.targetAudience
    ? `Target: ${options.targetAudience}.`
    : '';

  const userPrompt = `${productPrompt}

${toneInstruction}
${audienceInstruction}

Genera una landing page completa in italiano. Rispondi SOLO con un JSON valido (senza markdown code blocks) con questi campi:

{
  "title": "Titolo prodotto accattivante (max 60 caratteri)",
  "hero_overtitle": "Piccolo testo sopra il titolo hero (es. 'Novità 2024')",
  "hero_title": "Titolo principale hero section, impattante",
  "hero_subtitle": "Sottotitolo con HTML per enfasi (usa <strong> per evidenziare)",
  "about_title": "Titolo sezione about",
  "about_subtitle": "Sottotitolo about",
  "scarcity_text": "Testo urgenza (es. 'Solo 23 pezzi disponibili')",
  "cta_button_text": "Testo pulsante CTA (es. 'Acquista Ora')",
  "sticky_cta_text": "Testo CTA sticky (es. 'Ordina con spedizione gratuita')",
  "icon1_text": "Primo beneficio con emoji (es. '🚚 Spedizione Gratuita')",
  "icon2_text": "Secondo beneficio con emoji",
  "icon3_text": "Terzo beneficio con emoji",
  "section1_overtitle": "Overtitle sezione 1",
  "section1_title": "Titolo sezione 1 - primo beneficio principale",
  "section1_text": "Testo descrittivo sezione 1 (2-3 frasi)",
  "section1_bullets": "Bullet 1|Bullet 2|Bullet 3 (separati da |)",
  "section2_overtitle": "Overtitle sezione 2",
  "section2_title": "Titolo sezione 2 - secondo beneficio",
  "section2_text": "Testo descrittivo sezione 2",
  "section2_bullets": "Bullet 1|Bullet 2|Bullet 3",
  "section3_overtitle": "Overtitle sezione 3",
  "section3_title": "Titolo sezione 3 - terzo beneficio",
  "section3_text": "Testo descrittivo sezione 3",
  "text_block_subtitle": "Sottotitolo text block",
  "text_block_description": "Descrizione text block (paragrafo più lungo)",
  "reviews_title": "Titolo sezione recensioni (es. 'Cosa dicono i nostri clienti')"${options.includeReviews !== false ? `,
  "review1_stars": "5",
  "review1_author": "Nome Cognome",
  "review1_text": "Testo recensione autentica e dettagliata",
  "review2_stars": "5",
  "review2_author": "Nome Cognome",
  "review2_text": "Testo recensione",
  "review3_stars": "4",
  "review3_author": "Nome Cognome",
  "review3_text": "Testo recensione"` : ''}
}`;

  try {
    const result = await model.generateContent([SYSTEM_PROMPT, userPrompt]);
    const responseText = result.response.text();

    // Clean response (remove markdown code blocks if present)
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }

    return JSON.parse(jsonText.trim());
  } catch (error: any) {
    console.error('Gemini generation error:', error);

    if (error.message?.includes('SAFETY')) {
      throw new Error('Contenuto non generabile per motivi di sicurezza. Prova con un prompt diverso.');
    }
    if (error.message?.includes('QUOTA') || error.message?.includes('429')) {
      throw new Error('Limite API raggiunto. Riprova tra qualche minuto.');
    }
    if (error instanceof SyntaxError) {
      throw new Error('Errore nel parsing della risposta AI. Riprova.');
    }

    throw new Error('Errore di generazione. Riprova.');
  }
}

/**
 * Assist with a single field - generate, improve, shorten, or expand
 */
export async function assistField(
  apiKey: string,
  fieldName: string,
  fieldLabel: string,
  productContext: string,
  currentValue: string | undefined,
  action: FieldAction
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  const actionPrompts: Record<FieldAction, string> = {
    generate: `Genera un nuovo contenuto per il campo "${fieldLabel}" basandoti sul contesto del prodotto.`,
    improve: `Migliora e rendi più persuasivo questo testo: "${currentValue}"`,
    shorten: `Rendi più conciso questo testo mantenendo il messaggio chiave: "${currentValue}"`,
    expand: `Espandi e arricchisci questo testo con più dettagli: "${currentValue}"`,
    translate: `Traduci in italiano questo testo: "${currentValue}"`,
  };

  const fieldInstructions: Record<string, string> = {
    hero_subtitle: 'Puoi usare HTML come <strong> per enfatizzare. Max 150 caratteri.',
    section1_bullets: 'Genera 3-4 bullet points separati da |',
    section2_bullets: 'Genera 3-4 bullet points separati da |',
    review1_text: 'Scrivi una recensione autentica da cliente soddisfatto.',
    review2_text: 'Scrivi una recensione autentica da cliente soddisfatto.',
    review3_text: 'Scrivi una recensione autentica, può avere anche piccole critiche costruttive.',
  };

  const specificInstruction = fieldInstructions[fieldName] || '';

  const prompt = `${SYSTEM_PROMPT}

Contesto prodotto: ${productContext}

${actionPrompts[action]}

${specificInstruction}

IMPORTANTE: Rispondi SOLO con il testo generato, senza virgolette, spiegazioni o formattazione extra.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error: any) {
    console.error('Gemini assist error:', error);

    if (error.message?.includes('SAFETY')) {
      throw new Error('Contenuto non generabile per motivi di sicurezza.');
    }
    if (error.message?.includes('QUOTA') || error.message?.includes('429')) {
      throw new Error('Limite API raggiunto. Riprova tra qualche minuto.');
    }

    throw new Error('Errore di generazione. Riprova.');
  }
}

/**
 * Generate product title suggestions
 */
export async function generateTitleSuggestions(
  apiKey: string,
  productDescription: string,
  count: number = 5
): Promise<string[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 512,
    },
  });

  const prompt = `${SYSTEM_PROMPT}

Genera ${count} titoli prodotto accattivanti per questo prodotto:
${productDescription}

Rispondi SOLO con un JSON array di stringhe, senza altro testo:
["Titolo 1", "Titolo 2", ...]`;

  try {
    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();

    // Clean response
    if (responseText.startsWith('```json')) {
      responseText = responseText.slice(7);
    }
    if (responseText.startsWith('```')) {
      responseText = responseText.slice(3);
    }
    if (responseText.endsWith('```')) {
      responseText = responseText.slice(0, -3);
    }

    return JSON.parse(responseText.trim());
  } catch (error) {
    console.error('Gemini title suggestions error:', error);
    throw new Error('Errore nella generazione dei titoli. Riprova.');
  }
}

/**
 * Check if API key is valid
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    await model.generateContent('Test');
    return true;
  } catch (error) {
    return false;
  }
}
