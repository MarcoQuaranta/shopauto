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
  tone?: 'professional' | 'friendly' | 'urgent' | 'luxury';
  includeReviews?: boolean;
  targetAudience?: string;
  productCategory?: string;
}

export type FieldAction = 'generate' | 'improve' | 'shorten' | 'expand' | 'translate';

const SYSTEM_PROMPT = `You are an expert copywriter specialized in e-commerce landing pages.

CRITICAL RULES:
- NEVER mention brand names, product names, store names or e-commerce sites
- NEVER reference any specific brand, company or website
- Focus ONLY on product characteristics and features
- Keep content generic so it can be used for any similar product

IMPORTANT guidelines:
- ALWAYS write in fluent, natural English
- Use a persuasive but credible tone
- Include effective call-to-actions
- You can use basic HTML: <strong>, <em>, <br>
- For bullet points (fields with _bullets), separate with the | character
- Reviews must appear authentic with realistic American/English names
- Emphasize BENEFITS, not just features
- Avoid generic phrases and clichés
- Create urgency without being aggressive`;

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional: 'Use a professional and authoritative tone, suitable for a demanding audience.',
  friendly: 'Use a friendly and conversational tone, as if talking to a friend.',
  urgent: 'Create a sense of urgency and scarcity, pushing for immediate action.',
  luxury: 'Use an elegant and sophisticated tone, emphasizing exclusivity and premium quality.',
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
    model: 'gemma-3-4b-it',
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

REMEMBER: NO brand names, NO product names, NO store names. Focus ONLY on features and characteristics.

Generate a complete landing page in English. Reply ONLY with valid JSON (no markdown code blocks) with these fields:

{
  "title": "Generic product title (NO brand names, max 60 chars)",
  "hero_overtitle": "Small text above hero title (e.g. 'New Arrival')",
  "hero_title": "Main hero section title, impactful (NO brand names)",
  "hero_subtitle": "Subtitle with HTML for emphasis (use <strong> to highlight)",
  "about_title": "About section title",
  "about_subtitle": "About subtitle",
  "scarcity_text": "Urgency text (e.g. 'Only 23 pieces left')",
  "cta_button_text": "CTA button text (e.g. 'Buy Now')",
  "sticky_cta_text": "Sticky CTA text (e.g. 'Order with free shipping')",
  "icon1_text": "Format: <strong>Keyword</strong>: brief benefit (bold keyword before colon)",
  "icon2_text": "Format: <strong>Keyword</strong>: brief benefit (bold keyword before colon)",
  "icon3_text": "Format: <strong>Keyword</strong>: brief benefit (bold keyword before colon)",
  "section1_overtitle": "DESIGN section overtitle",
  "section1_title": "DESIGN - about aesthetics, style, visual appeal",
  "section1_text": "DESIGN descriptive text (3-4 sentences). Use <strong> on 2-3 key words",
  "section1_bullets": "<strong>Keyword</strong>: description|<strong>Keyword</strong>: description|<strong>Keyword</strong>: description",
  "section2_overtitle": "FIT & COMFORT section overtitle",
  "section2_title": "FIT & COMFORT - about fit, comfort, functionality",
  "section2_text": "FIT & COMFORT descriptive text (3-4 sentences). Use <strong> on 2-3 key words",
  "section2_bullets": "<strong>Keyword</strong>: description|<strong>Keyword</strong>: description|<strong>Keyword</strong>: description",
  "section3_overtitle": "MATERIALS section overtitle",
  "section3_title": "MATERIALS - about fabric quality, materials, durability",
  "section3_text": "MATERIALS descriptive text (3-4 sentences). Use <strong> on 2-3 key words",
  "text_block_subtitle": "Text block subtitle",
  "text_block_description": "Very short text block description (1-2 sentences MAX)",
  "reviews_title": "Reviews section title (e.g. 'What our customers say')"${options.includeReviews !== false ? `,
  "review1_stars": "5",
  "review1_author": "First Last Name",
  "review1_text": "Authentic review (NO brand names)",
  "review2_stars": "5",
  "review2_author": "First Last Name",
  "review2_text": "Authentic review (NO brand names)",
  "review3_stars": "4",
  "review3_author": "First Last Name",
  "review3_text": "Authentic review (NO brand names)"` : ''}
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
    model: 'gemma-3-4b-it',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  const actionPrompts: Record<FieldAction, string> = {
    generate: `Generate new content for the "${fieldLabel}" field based on the product context.`,
    improve: `Improve and make this text more persuasive: "${currentValue}"`,
    shorten: `Make this text more concise while keeping the key message: "${currentValue}"`,
    expand: `Expand and enrich this text with more details: "${currentValue}"`,
    translate: `Translate this text to English: "${currentValue}"`,
  };

  const fieldInstructions: Record<string, string> = {
    hero_subtitle: 'You can use HTML like <strong> for emphasis. Max 150 characters.',
    section1_bullets: 'Generate 3-4 bullet points separated by |',
    section2_bullets: 'Generate 3-4 bullet points separated by |',
    review1_text: 'Write an authentic review from a satisfied customer.',
    review2_text: 'Write an authentic review from a satisfied customer.',
    review3_text: 'Write an authentic review, can also have minor constructive criticism.',
  };

  const specificInstruction = fieldInstructions[fieldName] || '';

  const prompt = `${SYSTEM_PROMPT}

Product context: ${productContext}

${actionPrompts[action]}

${specificInstruction}

IMPORTANT: Reply ONLY with the generated text, no quotes, explanations or extra formatting.`;

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
    model: 'gemma-3-4b-it',
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 512,
    },
  });

  const prompt = `${SYSTEM_PROMPT}

Generate ${count} catchy product titles for this product:
${productDescription}

Reply ONLY with a JSON array of strings, no other text:
["Title 1", "Title 2", ...]`;

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
    const model = genAI.getGenerativeModel({ model: 'gemma-3-4b-it' });
    await model.generateContent('Test');
    return true;
  } catch (error) {
    return false;
  }
}
