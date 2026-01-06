import { VariantOption, VariantCombination } from '@/types/shopify';

/**
 * Generate all possible variant combinations from options
 * Uses cartesian product algorithm
 *
 * Example:
 * Input: [
 *   { name: "Taglia", values: ["M", "L"] },
 *   { name: "Colore", values: ["Rosso", "Blu"] }
 * ]
 * Output: [
 *   { Taglia: "M", Colore: "Rosso" },
 *   { Taglia: "M", Colore: "Blu" },
 *   { Taglia: "L", Colore: "Rosso" },
 *   { Taglia: "L", Colore: "Blu" }
 * ]
 */
export function generateVariantCombinations(
  options: VariantOption[]
): Record<string, string>[] {
  if (options.length === 0) return [];

  // Filter out options with no values
  const validOptions = options.filter(opt => opt.values.length > 0);
  if (validOptions.length === 0) return [];

  // Start with the first option
  let combinations: Record<string, string>[] = validOptions[0].values.map(value => ({
    [validOptions[0].name]: value
  }));

  // For each additional option, multiply combinations
  for (let i = 1; i < validOptions.length; i++) {
    const option = validOptions[i];
    const newCombinations: Record<string, string>[] = [];

    for (const combo of combinations) {
      for (const value of option.values) {
        newCombinations.push({
          ...combo,
          [option.name]: value
        });
      }
    }

    combinations = newCombinations;
  }

  return combinations;
}

/**
 * Format variant title from options
 * Example: { Taglia: "M", Colore: "Rosso" } => "M / Rosso"
 */
export function formatVariantTitle(options: Record<string, string>): string {
  return Object.values(options).join(' / ');
}

/**
 * Generate full variant combinations with default prices
 */
export function generateVariantsWithDefaults(
  options: VariantOption[],
  defaultPrice: string = '0.00',
  defaultCompareAtPrice?: string
): VariantCombination[] {
  const combinations = generateVariantCombinations(options);

  return combinations.map(combo => ({
    options: combo,
    price: defaultPrice,
    compareAtPrice: defaultCompareAtPrice,
    sku: '',
    inventoryQuantity: 0
  }));
}

/**
 * Parse selected options from Shopify variant
 * Converts array format to Record format
 */
export function parseSelectedOptions(
  selectedOptions: Array<{ name: string; value: string }>
): Record<string, string> {
  return selectedOptions.reduce((acc, opt) => {
    acc[opt.name] = opt.value;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Convert options record back to array format for Shopify API
 */
export function optionsToArray(
  options: Record<string, string>
): Array<{ name: string; value: string }> {
  return Object.entries(options).map(([name, value]) => ({ name, value }));
}

/**
 * Build variant input for Shopify bulk create/update
 */
export function buildVariantInput(variant: VariantCombination) {
  const input: any = {
    price: variant.price,
    optionValues: Object.entries(variant.options).map(([name, value]) => ({
      optionName: name,
      name: value
    }))
  };

  if (variant.compareAtPrice) {
    input.compareAtPrice = variant.compareAtPrice;
  }

  if (variant.sku) {
    input.sku = variant.sku;
  }

  if (variant.inventoryQuantity !== undefined) {
    input.inventoryQuantities = {
      availableQuantity: variant.inventoryQuantity,
      locationId: '' // Will be set by the API route
    };
  }

  return input;
}

/**
 * Validate variant options (Shopify limit: max 3 options, max 100 variants)
 */
export function validateVariantOptions(options: VariantOption[]): {
  valid: boolean;
  error?: string;
} {
  // Max 3 options
  if (options.length > 3) {
    return {
      valid: false,
      error: 'Shopify permette massimo 3 opzioni (es. Taglia, Colore, Materiale)'
    };
  }

  // Check each option has at least one value
  for (const opt of options) {
    if (!opt.name.trim()) {
      return {
        valid: false,
        error: 'Ogni opzione deve avere un nome'
      };
    }
    if (opt.values.length === 0) {
      return {
        valid: false,
        error: `L'opzione "${opt.name}" deve avere almeno un valore`
      };
    }
  }

  // Calculate total combinations
  const totalCombinations = options.reduce((total, opt) => {
    return total * Math.max(opt.values.length, 1);
  }, 1);

  if (totalCombinations > 100) {
    return {
      valid: false,
      error: `Troppe combinazioni (${totalCombinations}). Shopify permette massimo 100 varianti`
    };
  }

  return { valid: true };
}

/**
 * Get unique option values from existing variants
 */
export function extractOptionsFromVariants(
  variants: Array<{
    selectedOptions: Array<{ name: string; value: string }>;
  }>
): VariantOption[] {
  const optionsMap = new Map<string, Set<string>>();

  for (const variant of variants) {
    for (const opt of variant.selectedOptions) {
      if (!optionsMap.has(opt.name)) {
        optionsMap.set(opt.name, new Set());
      }
      optionsMap.get(opt.name)!.add(opt.value);
    }
  }

  return Array.from(optionsMap.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values)
  }));
}
