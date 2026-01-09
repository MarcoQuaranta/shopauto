// Variant types
export interface VariantOption {
  name: string;  // e.g., "Taglia", "Colore"
  values: string[];  // e.g., ["S", "M", "L"]
}

export interface VariantCombination {
  id?: string;  // Shopify variant ID (if exists)
  options: Record<string, string>;  // { Taglia: "M", Colore: "Rosso" }
  price: string;
  compareAtPrice?: string;
  sku?: string;
  inventoryQuantity?: number;
  imageId?: string;  // Shopify media ID to associate with this variant
  imageUrl?: string; // Image URL for display in the UI
}

// Product image types
export interface ProductImage {
  id?: string;  // Shopify media ID
  url?: string;  // Image URL
  file?: File;  // File to upload
  altText?: string;
  position?: number;
  status?: 'pending' | 'uploading' | 'ready' | 'error';
}

// Metafield types
export interface MetafieldDefinition {
  id?: string;
  namespace: string;
  key: string;
  name: string;
  type: string;  // single_line_text_field, multi_line_text_field, number_integer, etc.
  description?: string;
  validations?: MetafieldValidation[];
}

export interface MetafieldValidation {
  name: string;
  value: string;
}

export interface MetafieldValue {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

// Shopify metafield type mapping
export type ShopifyMetafieldType =
  | 'single_line_text_field'
  | 'multi_line_text_field'
  | 'number_integer'
  | 'number_decimal'
  | 'url'
  | 'json'
  | 'boolean'
  | 'date'
  | 'date_time'
  | 'color'
  | 'weight'
  | 'volume'
  | 'dimension'
  | 'rating'
  | 'file_reference'
  | 'product_reference'
  | 'collection_reference'
  | 'variant_reference'
  | 'page_reference'
  | 'metaobject_reference'
  | 'list.single_line_text_field'
  | 'list.file_reference';

// Input type mapping for form fields
export const METAFIELD_INPUT_MAP: Record<string, string> = {
  'single_line_text_field': 'text',
  'multi_line_text_field': 'textarea',
  'number_integer': 'number',
  'number_decimal': 'number',
  'url': 'url',
  'json': 'textarea',
  'boolean': 'checkbox',
  'date': 'date',
  'date_time': 'datetime-local',
  'color': 'color',
  'weight': 'number',
  'volume': 'number',
  'dimension': 'number',
  'rating': 'number',
  'file_reference': 'file',
  'product_reference': 'text',
  'collection_reference': 'text',
  'variant_reference': 'text',
  'page_reference': 'text',
  'metaobject_reference': 'text',
  'list.single_line_text_field': 'textarea',
  'list.file_reference': 'file',
};

// Shopify product types
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  status: string;
  vendor?: string;
  productType?: string;
  templateSuffix?: string;
  options: ShopifyOption[];
  variants: {
    edges: Array<{
      node: ShopifyVariant;
    }>;
  };
  media?: {
    edges: Array<{
      node: ShopifyMedia;
    }>;
  };
  metafields?: {
    edges: Array<{
      node: {
        namespace: string;
        key: string;
        value: string;
        type: string;
      };
    }>;
  };
}

export interface ShopifyOption {
  id: string;
  name: string;
  values: string[];
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  sku?: string;
  inventoryQuantity?: number;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

export interface ShopifyMedia {
  id: string;
  mediaContentType?: string;
  status?: string;
  image?: {
    url: string;
    altText?: string;
  };
}

// API response types
export interface ProductCreateResponse {
  success: boolean;
  product?: {
    id: string;
    shopifyProductId: string;
    title: string;
    handle?: string;
  };
  error?: string;
}

export interface VariantCreateResponse {
  success: boolean;
  variants?: ShopifyVariant[];
  error?: string;
}

export interface ImageUploadResponse {
  success: boolean;
  images?: ProductImage[];
  error?: string;
}

export interface MetafieldDefinitionsResponse {
  success: boolean;
  definitions?: MetafieldDefinition[];
  error?: string;
}
