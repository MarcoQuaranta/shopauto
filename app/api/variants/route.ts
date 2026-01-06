import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  shopifyGraphql,
  PRODUCT_VARIANTS_BULK_CREATE_MUTATION,
  PRODUCT_VARIANTS_BULK_UPDATE_MUTATION,
  PRODUCT_VARIANT_DELETE_MUTATION,
  PRODUCT_VARIANTS_QUERY,
} from '@/lib/shopify';
import { VariantCombination, VariantOption } from '@/types/shopify';
import { generateVariantCombinations, validateVariantOptions } from '@/lib/variants';

// GET - Fetch variants for a product
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');
  const productId = searchParams.get('productId');

  if (!shopId || !productId) {
    return NextResponse.json(
      { success: false, error: 'shopId e productId sono richiesti' },
      { status: 400 }
    );
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop non trovato' },
        { status: 404 }
      );
    }

    // Fetch variants from Shopify
    const response: any = await shopifyGraphql(
      { shop: shop.shop, accessToken: shop.accessToken },
      PRODUCT_VARIANTS_QUERY,
      { id: productId }
    );

    const product = response.product;
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Prodotto non trovato' },
        { status: 404 }
      );
    }

    const options: VariantOption[] = product.options.map((opt: any) => ({
      name: opt.name,
      values: opt.values,
    }));

    const variants: VariantCombination[] = product.variants.edges.map((edge: any) => ({
      id: edge.node.id,
      options: edge.node.selectedOptions.reduce((acc: Record<string, string>, opt: any) => {
        acc[opt.name] = opt.value;
        return acc;
      }, {}),
      price: edge.node.price,
      compareAtPrice: edge.node.compareAtPrice,
      sku: edge.node.sku,
      inventoryQuantity: edge.node.inventoryQuantity,
    }));

    return NextResponse.json({
      success: true,
      options,
      variants,
    });
  } catch (error: any) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create variants for a product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, productId, options, variants } = body;

    if (!shopId || !productId) {
      return NextResponse.json(
        { success: false, error: 'shopId e productId sono richiesti' },
        { status: 400 }
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop non trovato' },
        { status: 404 }
      );
    }

    // Validate options
    if (options && options.length > 0) {
      const validation = validateVariantOptions(options);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }
    }

    // Build variant inputs
    const variantInputs = (variants as VariantCombination[]).map(variant => ({
      price: variant.price,
      compareAtPrice: variant.compareAtPrice || null,
      sku: variant.sku || null,
      optionValues: Object.entries(variant.options).map(([name, value]) => ({
        optionName: name,
        name: value,
      })),
    }));

    // Create variants via Shopify API
    const response: any = await shopifyGraphql(
      { shop: shop.shop, accessToken: shop.accessToken },
      PRODUCT_VARIANTS_BULK_CREATE_MUTATION,
      {
        productId,
        variants: variantInputs,
      }
    );

    if (response.productVariantsBulkCreate.userErrors?.length > 0) {
      const errors = response.productVariantsBulkCreate.userErrors;
      console.error('Shopify variant creation errors:', errors);
      return NextResponse.json(
        { success: false, error: errors[0].message },
        { status: 400 }
      );
    }

    // Update local product record
    const localProduct = await prisma.product.findFirst({
      where: {
        shopId,
        shopifyProductId: productId,
      },
    });

    if (localProduct) {
      await prisma.product.update({
        where: { id: localProduct.id },
        data: {
          variantsCount: response.productVariantsBulkCreate.productVariants.length,
          hasMultipleVariants: response.productVariantsBulkCreate.productVariants.length > 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      variants: response.productVariantsBulkCreate.productVariants,
    });
  } catch (error: any) {
    console.error('Error creating variants:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update variants
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, productId, variants } = body;

    if (!shopId || !productId || !variants) {
      return NextResponse.json(
        { success: false, error: 'shopId, productId e variants sono richiesti' },
        { status: 400 }
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop non trovato' },
        { status: 404 }
      );
    }

    // Build update inputs
    const variantInputs = (variants as VariantCombination[]).map(variant => ({
      id: variant.id,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice || null,
      sku: variant.sku || null,
    }));

    // Update variants via Shopify API
    const response: any = await shopifyGraphql(
      { shop: shop.shop, accessToken: shop.accessToken },
      PRODUCT_VARIANTS_BULK_UPDATE_MUTATION,
      {
        productId,
        variants: variantInputs,
      }
    );

    if (response.productVariantsBulkUpdate.userErrors?.length > 0) {
      const errors = response.productVariantsBulkUpdate.userErrors;
      console.error('Shopify variant update errors:', errors);
      return NextResponse.json(
        { success: false, error: errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      variants: response.productVariantsBulkUpdate.productVariants,
    });
  } catch (error: any) {
    console.error('Error updating variants:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a variant
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');
  const variantId = searchParams.get('variantId');

  if (!shopId || !variantId) {
    return NextResponse.json(
      { success: false, error: 'shopId e variantId sono richiesti' },
      { status: 400 }
    );
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, error: 'Shop non trovato' },
        { status: 404 }
      );
    }

    // Delete variant via Shopify API
    const response: any = await shopifyGraphql(
      { shop: shop.shop, accessToken: shop.accessToken },
      PRODUCT_VARIANT_DELETE_MUTATION,
      { id: variantId }
    );

    if (response.productVariantDelete.userErrors?.length > 0) {
      const errors = response.productVariantDelete.userErrors;
      console.error('Shopify variant delete errors:', errors);
      return NextResponse.json(
        { success: false, error: errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedVariantId: response.productVariantDelete.deletedProductVariantId,
    });
  } catch (error: any) {
    console.error('Error deleting variant:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
