import { GraphQLClient } from 'graphql-request';

export interface ShopifyConfig {
  shop: string;
  accessToken: string;
}

export function createShopifyClient(config: ShopifyConfig) {
  const endpoint = `https://${config.shop}/admin/api/2024-01/graphql.json`;

  return new GraphQLClient(endpoint, {
    headers: {
      'X-Shopify-Access-Token': config.accessToken,
      'Content-Type': 'application/json',
    },
  });
}

export async function shopifyGraphql<T = any>(
  config: ShopifyConfig,
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const client = createShopifyClient(config);

  try {
    const data = await client.request<T>(query, variables);
    return data;
  } catch (error: any) {
    console.error('Shopify GraphQL Error:', error);
    throw new Error(error.response?.errors?.[0]?.message || 'Shopify API error');
  }
}

// GraphQL mutations and queries
export const PRODUCT_CREATE_MUTATION = `
  mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        handle
        status
        variants(first: 10) {
          edges {
            node {
              id
              price
              sku
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const PRODUCT_UPDATE_MUTATION = `
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const METAFIELDS_SET_MUTATION = `
  mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const METAFIELD_DEFINITION_CREATE_MUTATION = `
  mutation metafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        namespace
        key
        name
        type {
          name
        }
        pinnedPosition
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const METAFIELD_DEFINITION_PIN_MUTATION = `
  mutation metafieldDefinitionPin($definitionId: ID!) {
    metafieldDefinitionPin(definitionId: $definitionId) {
      pinnedDefinition {
        id
        pinnedPosition
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const STAGED_UPLOADS_CREATE_MUTATION = `
  mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const FILE_CREATE_MUTATION = `
  mutation fileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        ... on MediaImage {
          id
          alt
          image {
            url
            originalSrc
          }
          preview {
            image {
              url
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const PRODUCT_GET_QUERY = `
  query getProduct($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      status
      descriptionHtml
      vendor
      productType
      templateSuffix
      variants(first: 10) {
        edges {
          node {
            id
            title
            price
            sku
          }
        }
      }
      images(first: 50) {
        edges {
          node {
            id
            url
            altText
          }
        }
      }
      metafields(first: 100) {
        edges {
          node {
            id
            namespace
            key
            value
            type
          }
        }
      }
    }
  }
`;

export const PUBLISH_PRODUCT_MUTATION = `
  mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        availablePublicationsCount {
          count
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const GET_PUBLICATIONS_QUERY = `
  query getPublications {
    publications(first: 10) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

export const PRODUCT_DELETE_MUTATION = `
  mutation productDelete($input: ProductDeleteInput!) {
    productDelete(input: $input) {
      deletedProductId
      userErrors {
        field
        message
      }
    }
  }
`;

export const UNPUBLISH_PRODUCT_MUTATION = `
  mutation publishableUnpublish($id: ID!, $input: [PublicationInput!]!) {
    publishableUnpublish(id: $id, input: $input) {
      publishable {
        availablePublicationsCount {
          count
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const PRODUCTS_LIST_QUERY = `
  query getProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          handle
          status
          templateSuffix
          featuredImage {
            url
          }
          variants(first: 1) {
            edges {
              node {
                id
                price
                sku
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// ============================================
// VARIANT MUTATIONS
// ============================================

// Create product with options (for variants)
export const PRODUCT_CREATE_WITH_OPTIONS_MUTATION = `
  mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        handle
        status
        options {
          id
          name
          values
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              price
              compareAtPrice
              sku
              inventoryQuantity
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Bulk create variants
export const PRODUCT_VARIANTS_BULK_CREATE_MUTATION = `
  mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkCreate(productId: $productId, variants: $variants) {
      productVariants {
        id
        title
        price
        compareAtPrice
        sku
        inventoryQuantity
        selectedOptions {
          name
          value
        }
        inventoryItem {
          id
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Bulk update variants
export const PRODUCT_VARIANTS_BULK_UPDATE_MUTATION = `
  mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        title
        price
        compareAtPrice
        sku
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Delete variant
export const PRODUCT_VARIANT_DELETE_MUTATION = `
  mutation productVariantDelete($id: ID!) {
    productVariantDelete(id: $id) {
      deletedProductVariantId
      userErrors {
        field
        message
      }
    }
  }
`;

// ============================================
// PRODUCT MEDIA MUTATIONS
// ============================================

// Create product media (attach images to product)
export const PRODUCT_CREATE_MEDIA_MUTATION = `
  mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      media {
        ... on MediaImage {
          id
          status
          image {
            url
            altText
          }
        }
      }
      mediaUserErrors {
        field
        message
        code
      }
    }
  }
`;

// Delete product media
export const PRODUCT_DELETE_MEDIA_MUTATION = `
  mutation productDeleteMedia($productId: ID!, $mediaIds: [ID!]!) {
    productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
      deletedMediaIds
      mediaUserErrors {
        field
        message
      }
    }
  }
`;

// Reorder product media
export const PRODUCT_REORDER_MEDIA_MUTATION = `
  mutation productReorderMedia($id: ID!, $moves: [MoveInput!]!) {
    productReorderMedia(id: $id, moves: $moves) {
      job {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ============================================
// METAFIELD DEFINITIONS QUERY
// ============================================

export const METAFIELD_DEFINITIONS_QUERY = `
  query metafieldDefinitions($ownerType: MetafieldOwnerType!, $first: Int!) {
    metafieldDefinitions(ownerType: $ownerType, first: $first) {
      edges {
        node {
          id
          namespace
          key
          name
          description
          type {
            name
          }
          validations {
            name
            value
          }
        }
      }
    }
  }
`;

// ============================================
// ENHANCED PRODUCT QUERIES
// ============================================

// Get product with full variant and media data
export const PRODUCT_FULL_QUERY = `
  query getProductFull($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      status
      descriptionHtml
      vendor
      productType
      templateSuffix
      options {
        id
        name
        values
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            price
            compareAtPrice
            sku
            inventoryQuantity
            selectedOptions {
              name
              value
            }
          }
        }
      }
      media(first: 50) {
        edges {
          node {
            ... on MediaImage {
              id
              status
              image {
                url
                altText
              }
            }
          }
        }
      }
      metafields(first: 100) {
        edges {
          node {
            id
            namespace
            key
            value
            type
          }
        }
      }
    }
  }
`;

// Get product variants only
export const PRODUCT_VARIANTS_QUERY = `
  query getProductVariants($id: ID!) {
    product(id: $id) {
      id
      options {
        id
        name
        values
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            price
            compareAtPrice
            sku
            inventoryQuantity
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
`;

// Get product media only
export const PRODUCT_MEDIA_QUERY = `
  query getProductMedia($id: ID!) {
    product(id: $id) {
      id
      media(first: 50) {
        edges {
          node {
            ... on MediaImage {
              id
              status
              image {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;
