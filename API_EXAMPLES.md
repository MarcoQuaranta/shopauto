# API Examples

Esempi pratici di utilizzo delle API dell'app.

## Creare un prodotto completo

```javascript
// Example: Create product with all sections
const createProduct = async () => {
  const response = await fetch('/api/create-product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shopId: 'your-shop-id',
      title: 'Amazing Product',
      price: 99.99,
      sku: 'PROD-001',
      templateSuffix: 'landing',
      metafields: {
        // Hero Section
        hero_title: 'Discover Amazing Product',
        hero_subtitle: 'The best product you will ever find',
        hero_image: 'https://cdn.shopify.com/hero.jpg',

        // Section 1
        section1_title: 'Why Choose Us',
        section1_text: 'We provide the best quality products...',
        section1_image: 'https://cdn.shopify.com/section1.jpg',

        // Section 2
        section2_title: 'Features',
        section2_text: 'Our product features include...',
        section2_image: 'https://cdn.shopify.com/section2.jpg',

        // Section 3
        section3_title: 'Testimonials',
        section3_text: 'What our customers say...',
        section3_image: 'https://cdn.shopify.com/section3.jpg',
      },
    }),
  });

  const data = await response.json();
  console.log('Product created:', data);
};
```

## Upload immagine e usa URL

```javascript
// Example: Upload image first, then use URL in product
const uploadAndCreateProduct = async () => {
  // Step 1: Upload image
  const formData = new FormData();
  formData.append('shopId', 'your-shop-id');
  formData.append('file', imageFile); // File from input

  const uploadResponse = await fetch('/api/upload-media', {
    method: 'POST',
    body: formData,
  });

  const { file } = await uploadResponse.json();
  const imageUrl = file.url;

  // Step 2: Create product with uploaded image URL
  const createResponse = await fetch('/api/create-product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shopId: 'your-shop-id',
      title: 'Product with Uploaded Image',
      price: 49.99,
      metafields: {
        hero_image: imageUrl,
        hero_title: 'Check out this image!',
      },
    }),
  });

  const product = await createResponse.json();
  console.log('Product created with image:', product);
};
```

## Aggiornare solo alcuni metafields

```javascript
// Example: Update only specific metafields
const updateProductMetafields = async (productId) => {
  const response = await fetch('/api/update-product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId: productId,
      shopId: 'your-shop-id',
      metafields: {
        // Update only section1
        section1_title: 'Updated Title',
        section1_text: 'Updated text content',
      },
    }),
  });

  const data = await response.json();
  console.log('Product updated:', data);
};
```

## Ottenere lista prodotti

```javascript
// Example: Get all products
const getProducts = async () => {
  const response = await fetch(
    '/api/get-product-data?shopId=your-shop-id&listAll=true'
  );

  const { products, localProducts } = await response.json();

  console.log('Shopify products:', products);
  console.log('Local database products:', localProducts);
};
```

## Ottenere singolo prodotto con metafields

```javascript
// Example: Get single product with all metafields
const getProductDetails = async (productId) => {
  const response = await fetch(
    `/api/get-product-data?shopId=your-shop-id&productId=${productId}`
  );

  const { product, localProduct } = await response.json();

  console.log('Product from Shopify:', product);
  console.log('Product from local DB:', localProduct);

  // Access metafields
  const metafields = product.metafields.edges.map(edge => ({
    key: edge.node.key,
    value: edge.node.value,
  }));

  console.log('Metafields:', metafields);
};
```

## Upload multiple immagini

```javascript
// Example: Upload multiple images in parallel
const uploadMultipleImages = async (files) => {
  const shopId = 'your-shop-id';

  const uploadPromises = files.map(async (file, index) => {
    const formData = new FormData();
    formData.append('shopId', shopId);
    formData.append('file', file);

    const response = await fetch('/api/upload-media', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return { index, url: data.file.url };
  });

  const results = await Promise.all(uploadPromises);
  console.log('All images uploaded:', results);

  return results;
};
```

## Form React completo con upload

```jsx
// Example: Complete React form with image upload
import { useState } from 'react';

export default function CreateProductForm() {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    heroTitle: '',
    heroSubtitle: '',
  });
  const [heroImage, setHeroImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let heroImageUrl = '';

      // Upload image if selected
      if (heroImage) {
        const formDataImg = new FormData();
        formDataImg.append('shopId', 'your-shop-id');
        formDataImg.append('file', heroImage);

        const uploadRes = await fetch('/api/upload-media', {
          method: 'POST',
          body: formDataImg,
        });

        const { file } = await uploadRes.json();
        heroImageUrl = file.url;
      }

      // Create product
      const response = await fetch('/api/create-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId: 'your-shop-id',
          title: formData.title,
          price: parseFloat(formData.price),
          templateSuffix: 'landing',
          metafields: {
            hero_title: formData.heroTitle,
            hero_subtitle: formData.heroSubtitle,
            hero_image: heroImageUrl,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Product created successfully!');
        // Reset form
        setFormData({ title: '', price: '', heroTitle: '', heroSubtitle: '' });
        setHeroImage(null);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Product Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
      />

      <input
        type="number"
        placeholder="Price"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        required
      />

      <input
        type="text"
        placeholder="Hero Title"
        value={formData.heroTitle}
        onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
      />

      <textarea
        placeholder="Hero Subtitle"
        value={formData.heroSubtitle}
        onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setHeroImage(e.target.files[0])}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
}
```

## Error Handling

```javascript
// Example: Proper error handling
const createProductWithErrorHandling = async () => {
  try {
    const response = await fetch('/api/create-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shopId: 'your-shop-id',
        title: 'Test Product',
        price: 10.00,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Unknown error');
    }

    const data = await response.json();

    if (data.success) {
      console.log('Success!', data.product);
    } else {
      console.error('Failed:', data.error);
    }
  } catch (error) {
    console.error('Network or server error:', error.message);
    alert('Failed to create product: ' + error.message);
  }
};
```

## Utilizzare metafields complessi (JSON)

```javascript
// Example: Store complex data in metafields
const createProductWithComplexData = async () => {
  const response = await fetch('/api/create-product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shopId: 'your-shop-id',
      title: 'Product with Complex Data',
      price: 79.99,
      metafields: {
        // Simple strings
        hero_title: 'Main Title',

        // JSON data (stored as string, parsed on frontend)
        features_list: JSON.stringify([
          'Feature 1',
          'Feature 2',
          'Feature 3',
        ]),

        // Boolean
        show_gallery: true,

        // Numbers
        rating: '4.5',
        reviews_count: '127',
      },
    }),
  });

  const data = await response.json();
  console.log('Product created:', data);
};
```

## Vercel Deployment

Quando fai il deploy su Vercel, assicurati di:

1. Configurare le variabili d'ambiente nel dashboard Vercel
2. Aggiungere il database URL (NeonDB)
3. Il postinstall script genererà automaticamente Prisma Client

```bash
# In Vercel, aggiungi queste environment variables:
DATABASE_URL=postgresql://...
SHOPIFY_API_KEY=your-key
SHOPIFY_API_SECRET=your-secret
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=random-secret
```

## Testing locale

```bash
# 1. Installa dipendenze
npm install

# 2. Setup database
npm run db:push

# 3. Avvia dev server
npm run dev

# 4. Testa l'API con curl
curl -X POST http://localhost:3000/api/create-product \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "test-shop-id",
    "title": "Test Product",
    "price": 19.99
  }'
```

## Tips

- **Rate Limiting**: Shopify API ha rate limits. In produzione, implementa retry logic
- **Image Optimization**: Usa Next.js Image component per ottimizzare le immagini
- **Caching**: Considera di cachare le chiamate API per migliorare performance
- **Validation**: Usa Zod o simili per validare input lato server
- **Security**: Mai esporre API keys nel frontend
- **Logging**: Implementa logging per debugging in produzione
