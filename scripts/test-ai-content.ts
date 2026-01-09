import * as dotenv from 'dotenv';
dotenv.config();

import { generateProductContent } from '../lib/ai-content';

async function main() {
  console.log('Testing AI content generation...\n');

  const content = await generateProductContent({
    name: 'Urban Flex Hoodie',
    category: 'hoodie',
    targetAudience: 'unisex',
    style: 'streetwear casual',
    description: 'Premium cotton blend hoodie with oversized fit'
  });

  console.log('=== GENERATED CONTENT ===\n');

  console.log('TITLE:', content.title);
  console.log('\nDESCRIPTION:', content.description);

  console.log('\n--- BULLETS ---');
  console.log('1:', content.bullet_1);
  console.log('2:', content.bullet_2);
  console.log('3:', content.bullet_3);

  console.log('\n--- ANGLE 1 (Design) ---');
  console.log('Title:', content.angle_1_title);
  console.log('Text:', content.angle_1_text);

  console.log('\n--- ANGLE 2 (Fit) ---');
  console.log('Title:', content.angle_2_title);
  console.log('Text:', content.angle_2_text);

  console.log('\n--- ANGLE 3 (Materials) ---');
  console.log('Title:', content.angle_3_title);
  console.log('Text:', content.angle_3_text);

  console.log('\n--- LIFESTYLE ---');
  console.log('Main Title:', content.lifestyle_main_title);
  console.log('\nLeft (Versatility):');
  console.log('  Title:', content.lifestyle_left_title);
  console.log('  Text:', content.lifestyle_left_text);
  console.log('\nRight (Lifestyle):');
  console.log('  Title:', content.lifestyle_right_title);
  console.log('  Text:', content.lifestyle_right_text);
}

main().catch(console.error);
