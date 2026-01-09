import { shopifyGraphqlWithRefresh, METAFIELDS_SET_MUTATION } from '../lib/shopify';

const SHOP_DOMAIN = 'usa-shop-8790.myshopify.com';
const PRODUCT_ID = 'gid://shopify/Product/15306635247993';

// Metafields completi per la landing page
const metafields = {
  // Hero Section
  hero_overtitle: 'NUOVA COLLEZIONE 2024',
  hero_title: "L'Eleganza al Tuo Polso",
  hero_subtitle: `Scopri il <strong>nuovo standard</strong> di eleganza italiana.<br>Design raffinato, qualità superiore, stile inconfondibile.`,
  hero_image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',

  // About Section
  about_title: 'Artigianato Italiano',
  about_subtitle: 'Ogni dettaglio racconta una storia di eccellenza',

  // CTA & Scarcity
  scarcity_text: 'Solo 23 pezzi rimasti! Ordina ora.',
  cta_button_text: 'ACQUISTA ORA - Spedizione Gratuita',
  sticky_cta_text: 'Offerta limitata: -33% oggi',

  // Icons
  icon1_text: 'Spedizione Gratuita',
  icon2_text: 'Pagamento Sicuro',
  icon3_text: 'Reso Facile 30gg',

  // Section 1
  section1_overtitle: 'QUALITÀ PREMIUM',
  section1_title: 'Materiali di Prima Scelta',
  section1_text: `Il nostro orologio è realizzato con acciaio inossidabile 316L, lo stesso utilizzato in chirurgia, garantendo resistenza e ipoallergenicità.`,
  section1_bullets: 'Acciaio inossidabile 316L|Vetro zaffiro antigraffio|Movimento svizzero|Impermeabile 5ATM',
  section1_image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=600',

  // Section 2
  section2_overtitle: 'DESIGN ESCLUSIVO',
  section2_title: 'Eleganza in Ogni Dettaglio',
  section2_text: `Il quadrante minimalista con indici applicati a mano riflette l'attenzione maniacale per i dettagli che ci contraddistingue.`,
  section2_bullets: 'Quadrante minimalista|Indici applicati a mano|Cinturino intercambiabile|Confezione regalo premium',
  section2_image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600',

  // Section 3
  section3_overtitle: 'GARANZIA TOTALE',
  section3_title: 'La Nostra Promessa',
  section3_text: `Offriamo 2 anni di garanzia completa e 30 giorni di reso senza domande. La tua soddisfazione è la nostra priorità assoluta.`,
  section3_image: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600',

  // Text Block
  text_block_subtitle: 'Perché scegliere noi?',
  text_block_description: `<p>Da oltre 20 anni, creiamo orologi che combinano <strong>tradizione artigianale</strong> e <strong>innovazione tecnologica</strong>.</p><p>Ogni pezzo è un capolavoro unico, pensato per chi non si accontenta.</p>`,
  text_block_image: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=600',

  // Reviews
  reviews_title: 'Cosa Dicono i Nostri Clienti',
  review1_stars: '5',
  review1_author: 'Marco R. - Milano',
  review1_text: 'Qualità eccezionale! Il mio nuovo orologio preferito. Spedizione velocissima e packaging curato nei minimi dettagli.',
  review2_stars: '5',
  review2_author: 'Laura B. - Roma',
  review2_text: 'Elegante e raffinato, esattamente come nelle foto. Lo indosso ogni giorno e ricevo sempre complimenti.',
  review3_stars: '5',
  review3_author: 'Giuseppe M. - Napoli',
  review3_text: 'Rapporto qualità-prezzo incredibile. Non pensavo di trovare un orologio così bello a questo prezzo.',
};

async function main() {
  console.log('📝 Aggiunta metafield al prodotto...\n');
  console.log('Product ID:', PRODUCT_ID);

  const metafieldInputs = Object.entries(metafields).map(([key, value]) => ({
    ownerId: PRODUCT_ID,
    namespace: 'landing',
    key: key,
    value: String(value),
    type: key.includes('stars') ? 'number_integer' : 'single_line_text_field',
  }));

  console.log(`\nTotale metafield da salvare: ${metafieldInputs.length}`);

  // Shopify accetta max 25 metafield per richiesta
  const batches = [];
  for (let i = 0; i < metafieldInputs.length; i += 25) {
    batches.push(metafieldInputs.slice(i, i + 25));
  }

  let totalSaved = 0;
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\nBatch ${i + 1}/${batches.length} (${batch.length} metafield)...`);

    const metaResult = await shopifyGraphqlWithRefresh<any>(
      SHOP_DOMAIN,
      METAFIELDS_SET_MUTATION,
      { metafields: batch }
    );

    if (metaResult.metafieldsSet.userErrors?.length > 0) {
      console.error('   Errori:', metaResult.metafieldsSet.userErrors);
    } else {
      totalSaved += batch.length;
      console.log(`   ✅ Salvati: ${batch.map(m => m.key).join(', ')}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ METAFIELD SALVATI: ${totalSaved}/${metafieldInputs.length}`);
  console.log('='.repeat(50));
  console.log('\n🔗 Visualizza la landing:');
  console.log('   https://usa-shop-8790.myshopify.com/products/orologio-elegante-collection-2024');
}

main().catch(console.error);
