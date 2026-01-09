import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  return genAI;
}

export interface ProductInput {
  name: string;
  category: string; // es: "t-shirt", "hoodie", "pants", "jacket"
  description?: string; // descrizione base opzionale
  targetAudience?: string; // es: "uomo", "donna", "unisex"
  style?: string; // es: "casual", "streetwear", "elegante"
}

export interface GeneratedContent {
  title: string;
  description: string;
  bullet_1: string;
  bullet_2: string;
  bullet_3: string;
  angle_1_title: string;
  angle_1_text: string;
  angle_2_title: string;
  angle_2_text: string;
  angle_3_title: string;
  angle_3_text: string;
  lifestyle_main_title: string;
  lifestyle_left_title: string;
  lifestyle_left_text: string;
  lifestyle_right_title: string;
  lifestyle_right_text: string;
}

export async function generateProductContent(input: ProductInput): Promise<GeneratedContent> {
  const model = getGenAI().getGenerativeModel({ model: 'gemma-3-4b-it' });

  const prompt = `You are a professional e-commerce copywriter. Generate compelling product content in English.

PRODUCT INFO:
- Category: ${input.category}
- Target: ${input.targetAudience || 'unisex'}
- Style: ${input.style || 'casual'}
${input.description ? `- Base description: ${input.description}` : ''}

CRITICAL RULES:
- NEVER mention brand names, product names, store names or e-commerce sites
- NEVER reference any specific brand or company
- Focus ONLY on product characteristics and features
- Keep content generic so it can be used for any similar product

GENERATE THE FOLLOWING CONTENT:

1. **TITLE**: A generic catchy product title (NO brand names, just product type)

2. **DESCRIPTION**: Very short description (1 sentence MAX), professional tone, NO brand names

3. **BULLETS** (3 bullet points):
   - Format: "<strong>Keyword</strong>: brief description" (keyword in bold before colon)
   - Max 1 short line each
   - Focus on SPECIFIC product characteristics
   - Be concrete about features (fabric, construction, details)
   - NO brand names

4. **ANGLES** (3 sections, STRICTLY follow this order):
   - ANGLE 1 - DESIGN: Focus ONLY on aesthetic, style, visual appeal, design details
   - ANGLE 2 - FIT & COMFORT: Focus ONLY on fit, comfort, functionality, wearability
   - ANGLE 3 - MATERIALS: Focus ONLY on fabric quality, materials, durability, feel
   - Descriptions should be 3-4 sentences, emotional and engaging
   - Use <strong> tags on 2-3 key words/phrases in each angle text
   - NO brand names

5. **LIFESTYLE SECTION**:
   - MAIN TITLE: An emotional, aspirational headline (short, NO brand names)
   - LEFT SIDE (Versatility/Occasions):
     * Title: About versatility and timing
     * Text: Recommend best moments to wear it. Emotional tone. 3-4 sentences.
   - RIGHT SIDE (Lifestyle/Comfort):
     * Title: About lifestyle and feeling comfortable
     * Text: Focus on feeling at ease, confidence, self-expression. 3-4 sentences.

RESPOND IN THIS EXACT JSON FORMAT (no markdown, no code blocks, just raw JSON):
{
  "title": "...",
  "description": "...",
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
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  // Clean response (remove markdown code blocks if present)
  let cleanJson = response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const content = JSON.parse(cleanJson) as GeneratedContent;
    return content;
  } catch (error) {
    console.error('Failed to parse AI response:', response);
    throw new Error('Failed to parse AI-generated content');
  }
}

// Test function
export async function testGeneration() {
  const content = await generateProductContent({
    name: 'Classic Cotton Tee',
    category: 't-shirt',
    targetAudience: 'unisex',
    style: 'casual streetwear'
  });

  console.log('Generated content:');
  console.log(JSON.stringify(content, null, 2));
  return content;
}
