'use client';

import { useEffect, useState } from 'react';

interface ProductListProps {
  shopId: string;
  onEdit?: (product: any) => void;
}

export default function ProductList({ shopId, onEdit }: ProductListProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [shopDomain, setShopDomain] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleProductAction = async (productId: string, action: 'delete' | 'unpublish') => {
    const confirmMsg = action === 'delete'
      ? 'Sei sicuro di voler ELIMINARE definitivamente questo prodotto?'
      : 'Sei sicuro di voler rimuovere questo prodotto dal catalogo?';

    if (!confirm(confirmMsg)) return;

    setActionLoading(productId);
    try {
      const response = await fetch('/api/delete-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, productId, action }),
      });

      const data = await response.json();

      if (response.ok) {
        if (action === 'delete') {
          setProducts(products.filter(p => p.shopifyId !== productId));
        } else {
          loadProducts();
        }
      } else {
        alert(`Errore: ${data.error}`);
      }
    } catch (error) {
      console.error('Action error:', error);
      alert('Errore durante l\'operazione');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (shopId) {
      loadProducts();
    }
  }, [shopId]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/get-product-data?shopId=${shopId}&listAll=true`);
      if (response.ok) {
        const data = await response.json();
        if (data.shopDomain) {
          setShopDomain(data.shopDomain);
        }

        const shopifyProducts = data.products || [];
        const localProducts = data.localProducts || [];

        const mergedProducts = shopifyProducts.map((sp: any) => {
          const local = localProducts.find((lp: any) => lp.shopifyProductId === sp.id);
          return {
            id: sp.id, // Always use Shopify ID for updates
            shopifyId: sp.id,
            localId: local?.id,
            title: sp.title,
            handle: sp.handle,
            price: parseFloat(sp.variants?.edges?.[0]?.node?.price || '0'),
            sku: sp.variants?.edges?.[0]?.node?.sku || '',
            templateSuffix: sp.templateSuffix || 'default',
            featuredImage: sp.featuredImage?.url,
            metafields: local?.metafields || {},
          };
        });

        setProducts(mergedProducts);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!shopId) {
    return (
      <div className="text-center text-gray-500 py-8">
        Seleziona uno shop per vedere i prodotti
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8">
        Caricamento prodotti...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Nessun prodotto trovato. Crea il tuo primo prodotto!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 font-medium text-gray-600">Prodotto</th>
            <th className="text-left py-3 px-2 font-medium text-gray-600">Prezzo</th>
            <th className="text-left py-3 px-2 font-medium text-gray-600">SKU</th>
            <th className="text-left py-3 px-2 font-medium text-gray-600">Template</th>
            <th className="text-right py-3 px-2 font-medium text-gray-600">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-2">
                <div className="flex items-center gap-3">
                  {product.featuredImage ? (
                    <img
                      src={product.featuredImage}
                      alt={product.title}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                      No img
                    </div>
                  )}
                  <span className="font-medium text-gray-900">{product.title}</span>
                </div>
              </td>
              <td className="py-3 px-2 text-gray-600">
                €{product.price?.toFixed(2) || '0.00'}
              </td>
              <td className="py-3 px-2 text-gray-500">
                {product.sku || '-'}
              </td>
              <td className="py-3 px-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {product.templateSuffix}
                </span>
              </td>
              <td className="py-3 px-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit?.(product)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Modifica
                  </button>
                  {shopDomain && (
                    <a
                      href={`https://${shopDomain}/products/${product.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Vedi
                    </a>
                  )}
                  <button
                    onClick={() => handleProductAction(product.shopifyId, 'unpublish')}
                    disabled={actionLoading === product.shopifyId}
                    className="text-orange-600 hover:text-orange-800 text-sm disabled:opacity-50"
                  >
                    {actionLoading === product.shopifyId ? '...' : 'Nascondi'}
                  </button>
                  <button
                    onClick={() => handleProductAction(product.shopifyId, 'delete')}
                    disabled={actionLoading === product.shopifyId}
                    className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                  >
                    {actionLoading === product.shopifyId ? '...' : 'Elimina'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
