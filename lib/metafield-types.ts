import { MetafieldDefinition } from '@/types/shopify';

// Mapping from Shopify metafield types to HTML input types
export const METAFIELD_INPUT_CONFIG: Record<string, {
  inputType: 'text' | 'textarea' | 'number' | 'url' | 'checkbox' | 'date' | 'datetime-local' | 'color' | 'file' | 'select' | 'json';
  placeholder?: string;
  validate?: (value: string) => boolean;
  format?: (value: any) => string;
  parse?: (value: string) => any;
}> = {
  'single_line_text_field': {
    inputType: 'text',
    placeholder: 'Inserisci testo...',
    validate: (v) => typeof v === 'string',
  },
  'multi_line_text_field': {
    inputType: 'textarea',
    placeholder: 'Inserisci testo su più righe...',
    validate: (v) => typeof v === 'string',
  },
  'number_integer': {
    inputType: 'number',
    placeholder: '0',
    validate: (v) => Number.isInteger(Number(v)),
    parse: (v) => parseInt(v, 10),
  },
  'number_decimal': {
    inputType: 'number',
    placeholder: '0.00',
    validate: (v) => !isNaN(Number(v)),
    parse: (v) => parseFloat(v),
  },
  'url': {
    inputType: 'url',
    placeholder: 'https://...',
    validate: (v) => /^https?:\/\//.test(v),
  },
  'json': {
    inputType: 'json',
    placeholder: '{}',
    validate: (v) => {
      try {
        JSON.parse(v);
        return true;
      } catch {
        return false;
      }
    },
  },
  'boolean': {
    inputType: 'checkbox',
    validate: (v) => v === 'true' || v === 'false' || typeof v === 'boolean',
    format: (v) => v ? 'true' : 'false',
    parse: (v) => v === 'true',
  },
  'date': {
    inputType: 'date',
    validate: (v) => !isNaN(Date.parse(v)),
  },
  'date_time': {
    inputType: 'datetime-local',
    validate: (v) => !isNaN(Date.parse(v)),
  },
  'color': {
    inputType: 'color',
    placeholder: '#000000',
    validate: (v) => /^#[0-9A-Fa-f]{6}$/.test(v),
  },
  'weight': {
    inputType: 'number',
    placeholder: '0',
    validate: (v) => !isNaN(Number(v)),
  },
  'volume': {
    inputType: 'number',
    placeholder: '0',
    validate: (v) => !isNaN(Number(v)),
  },
  'dimension': {
    inputType: 'number',
    placeholder: '0',
    validate: (v) => !isNaN(Number(v)),
  },
  'rating': {
    inputType: 'number',
    placeholder: '1-5',
    validate: (v) => {
      const num = Number(v);
      return !isNaN(num) && num >= 0 && num <= 5;
    },
  },
  'file_reference': {
    inputType: 'file',
    validate: () => true,
  },
  'product_reference': {
    inputType: 'text',
    placeholder: 'gid://shopify/Product/...',
    validate: (v) => v.startsWith('gid://shopify/Product/'),
  },
  'collection_reference': {
    inputType: 'text',
    placeholder: 'gid://shopify/Collection/...',
    validate: (v) => v.startsWith('gid://shopify/Collection/'),
  },
  'variant_reference': {
    inputType: 'text',
    placeholder: 'gid://shopify/ProductVariant/...',
    validate: (v) => v.startsWith('gid://shopify/ProductVariant/'),
  },
  'page_reference': {
    inputType: 'text',
    placeholder: 'gid://shopify/Page/...',
    validate: (v) => v.startsWith('gid://shopify/Page/'),
  },
  'metaobject_reference': {
    inputType: 'text',
    placeholder: 'gid://shopify/Metaobject/...',
    validate: (v) => v.startsWith('gid://shopify/Metaobject/'),
  },
  'list.single_line_text_field': {
    inputType: 'textarea',
    placeholder: 'Una voce per riga...',
    validate: () => true,
    format: (v) => Array.isArray(v) ? v.join('\n') : v,
    parse: (v) => v.split('\n').filter(Boolean),
  },
  'list.file_reference': {
    inputType: 'file',
    validate: () => true,
  },
};

// Get input config for a metafield type
export function getMetafieldInputConfig(type: string) {
  return METAFIELD_INPUT_CONFIG[type] || METAFIELD_INPUT_CONFIG['single_line_text_field'];
}

// Legacy "landing" namespace fields (always shown for backward compatibility)
export const LEGACY_LANDING_FIELDS: MetafieldDefinition[] = [
  // Hero Section
  { namespace: 'landing', key: 'hero_overtitle', name: 'Hero Overtitle', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'hero_title', name: 'Hero Titolo', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'hero_subtitle', name: 'Hero Sottotitolo', type: 'multi_line_text_field', description: 'Supporta HTML' },
  { namespace: 'landing', key: 'hero_image', name: 'Hero Immagine', type: 'url' },

  // About Section
  { namespace: 'landing', key: 'about_title', name: 'About Titolo', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'about_subtitle', name: 'About Sottotitolo', type: 'single_line_text_field' },

  // CTA & Scarcity
  { namespace: 'landing', key: 'scarcity_text', name: 'Testo Scarsità', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'cta_button_text', name: 'Testo Pulsante CTA', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'sticky_cta_text', name: 'Testo CTA Sticky', type: 'single_line_text_field' },

  // Icons
  { namespace: 'landing', key: 'icon1_text', name: 'Icona 1 Testo', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'icon2_text', name: 'Icona 2 Testo', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'icon3_text', name: 'Icona 3 Testo', type: 'single_line_text_field' },

  // Section 1
  { namespace: 'landing', key: 'section1_overtitle', name: 'Sezione 1 Overtitle', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'section1_title', name: 'Sezione 1 Titolo', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'section1_text', name: 'Sezione 1 Testo', type: 'multi_line_text_field' },
  { namespace: 'landing', key: 'section1_bullets', name: 'Sezione 1 Bullet Points', type: 'multi_line_text_field', description: 'Separa con |' },
  { namespace: 'landing', key: 'section1_image', name: 'Sezione 1 Immagine', type: 'url' },

  // Section 2
  { namespace: 'landing', key: 'section2_overtitle', name: 'Sezione 2 Overtitle', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'section2_title', name: 'Sezione 2 Titolo', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'section2_text', name: 'Sezione 2 Testo', type: 'multi_line_text_field' },
  { namespace: 'landing', key: 'section2_bullets', name: 'Sezione 2 Bullet Points', type: 'multi_line_text_field', description: 'Separa con |' },
  { namespace: 'landing', key: 'section2_image', name: 'Sezione 2 Immagine', type: 'url' },

  // Section 3
  { namespace: 'landing', key: 'section3_overtitle', name: 'Sezione 3 Overtitle', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'section3_title', name: 'Sezione 3 Titolo', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'section3_text', name: 'Sezione 3 Testo', type: 'multi_line_text_field' },
  { namespace: 'landing', key: 'section3_image', name: 'Sezione 3 Immagine', type: 'url' },

  // Text Block
  { namespace: 'landing', key: 'text_block_subtitle', name: 'Text Block Sottotitolo', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'text_block_description', name: 'Text Block Descrizione', type: 'multi_line_text_field' },
  { namespace: 'landing', key: 'text_block_image', name: 'Text Block Immagine', type: 'url' },

  // Reviews
  { namespace: 'landing', key: 'reviews_title', name: 'Recensioni Titolo', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'review1_stars', name: 'Recensione 1 Stelle', type: 'number_integer', description: '1-5' },
  { namespace: 'landing', key: 'review1_author', name: 'Recensione 1 Autore', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'review1_text', name: 'Recensione 1 Testo', type: 'multi_line_text_field' },
  { namespace: 'landing', key: 'review2_stars', name: 'Recensione 2 Stelle', type: 'number_integer', description: '1-5' },
  { namespace: 'landing', key: 'review2_author', name: 'Recensione 2 Autore', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'review2_text', name: 'Recensione 2 Testo', type: 'multi_line_text_field' },
  { namespace: 'landing', key: 'review3_stars', name: 'Recensione 3 Stelle', type: 'number_integer', description: '1-5' },
  { namespace: 'landing', key: 'review3_author', name: 'Recensione 3 Autore', type: 'single_line_text_field' },
  { namespace: 'landing', key: 'review3_text', name: 'Recensione 3 Testo', type: 'multi_line_text_field' },
];

// Group metafield definitions by namespace
export function groupByNamespace(definitions: MetafieldDefinition[]): Record<string, MetafieldDefinition[]> {
  return definitions.reduce((acc, def) => {
    if (!acc[def.namespace]) {
      acc[def.namespace] = [];
    }
    acc[def.namespace].push(def);
    return acc;
  }, {} as Record<string, MetafieldDefinition[]>);
}

// Merge shop definitions with legacy fields
export function mergeWithLegacyFields(
  shopDefinitions: MetafieldDefinition[]
): MetafieldDefinition[] {
  const merged = [...shopDefinitions];
  const existingKeys = new Set(shopDefinitions.map(d => `${d.namespace}.${d.key}`));

  // Add legacy fields that don't exist in shop definitions
  for (const legacyField of LEGACY_LANDING_FIELDS) {
    const key = `${legacyField.namespace}.${legacyField.key}`;
    if (!existingKeys.has(key)) {
      merged.push(legacyField);
    }
  }

  return merged;
}

// Get display label for namespace
export function getNamespaceLabel(namespace: string): string {
  const labels: Record<string, string> = {
    landing: 'Landing Page',
    global: 'Globali',
    custom: 'Personalizzati',
  };
  return labels[namespace] || namespace;
}

// Determine if a field should use multi-line input
export function isMultiLineField(key: string): boolean {
  const multiLineKeys = [
    'hero_subtitle',
    'section1_text',
    'section1_bullets',
    'section2_text',
    'section2_bullets',
    'section3_text',
    'text_block_description',
    'review1_text',
    'review2_text',
    'review3_text',
  ];
  return multiLineKeys.includes(key);
}
