/**
 * Utility per convertire template Liquid in JSON OS 2.0
 *
 * Questo file contiene funzioni helper per:
 * - Analizzare template Liquid
 * - Estrarre sezioni
 * - Generare product.{suffix}.json
 */

export interface LiquidSection {
  name: string;
  content: string;
  schema?: any;
}

export interface TemplateJSON {
  name: string;
  sections: Record<string, {
    type: string;
    settings?: Record<string, any>;
  }>;
  order: string[];
}

/**
 * Estrae sezioni da un template Liquid
 */
export function extractSectionsFromLiquid(liquidContent: string): LiquidSection[] {
  const sections: LiquidSection[] = [];

  // Pattern per identificare blocchi di sezioni
  // Esempio: {% section 'header' %} o blocchi custom
  const sectionPattern = /{%\s*section\s+['"]([^'"]+)['"]\s*%}/g;

  let match;
  while ((match = sectionPattern.exec(liquidContent)) !== null) {
    sections.push({
      name: match[1],
      content: '', // Il contenuto sarà caricato separatamente
    });
  }

  return sections;
}

/**
 * Genera il JSON template per Shopify OS 2.0
 */
export function generateTemplateJSON(
  templateName: string,
  sections: { name: string; type: string; settings?: any }[]
): TemplateJSON {
  const template: TemplateJSON = {
    name: templateName,
    sections: {},
    order: [],
  };

  sections.forEach((section, index) => {
    const sectionId = `section_${index + 1}`;
    template.sections[sectionId] = {
      type: section.type,
      ...(section.settings && { settings: section.settings }),
    };
    template.order.push(sectionId);
  });

  return template;
}

/**
 * Crea il contenuto di una sezione Liquid con schema
 */
export function createLiquidSection(
  sectionName: string,
  metafieldKeys: string[]
): string {
  const schemaSettings = metafieldKeys.map((key) => ({
    type: 'text',
    id: key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  return `
<div class="landing-section landing-${sectionName}">
  ${metafieldKeys.map((key) => `
  {% if product.metafields.landing.${key} %}
    <div class="${key.replace(/_/g, '-')}">
      {{ product.metafields.landing.${key} }}
    </div>
  {% endif %}`).join('')}
</div>

{% schema %}
{
  "name": "${sectionName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}",
  "settings": ${JSON.stringify(schemaSettings, null, 2)}
}
{% endschema %}
`.trim();
}

/**
 * Esempio di template completo
 */
export const EXAMPLE_TEMPLATES = {
  landing: {
    sections: [
      { name: 'hero', type: 'landing-hero' },
      { name: 'section1', type: 'landing-section-1' },
      { name: 'section2', type: 'landing-section-2' },
      { name: 'section3', type: 'landing-section-3' },
    ],
  },
  landing1: {
    sections: [
      { name: 'hero', type: 'landing1-hero' },
      { name: 'features', type: 'landing1-features' },
      { name: 'testimonials', type: 'landing1-testimonials' },
    ],
  },
  landing2: {
    sections: [
      { name: 'hero', type: 'landing2-hero' },
      { name: 'video', type: 'landing2-video' },
      { name: 'cta', type: 'landing2-cta' },
    ],
  },
};
