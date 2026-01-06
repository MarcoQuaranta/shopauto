'use client';

import { useState } from 'react';
import { VariantOption, VariantCombination, ProductImage } from '@/types/shopify';
import VariantBuilder from './VariantBuilder';
import ImageGallery from './ImageGallery';

interface ProductFormProps {
  shopId: string;
  product?: any;
  onSuccess?: () => void;
}

export default function ProductForm({ shopId, product, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // AI generation
  const [exampleUrl, setExampleUrl] = useState('');

  // Basic product data
  const [title, setTitle] = useState(product?.title || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price || '');
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice || '');

  // Variants
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([]);

  // Product images (Shopify gallery/carousel)
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  // Bullets
  const [bullet1, setBullet1] = useState(product?.metafields?.bullet_1 || '');
  const [bullet2, setBullet2] = useState(product?.metafields?.bullet_2 || '');
  const [bullet3, setBullet3] = useState(product?.metafields?.bullet_3 || '');

  // Angle 1
  const [angle1ImageFile, setAngle1ImageFile] = useState<File | null>(null);
  const [angle1Title, setAngle1Title] = useState(product?.metafields?.angle_1_title || '');
  const [angle1Text, setAngle1Text] = useState(product?.metafields?.angle_1_text || '');

  // Angle 2
  const [angle2ImageFile, setAngle2ImageFile] = useState<File | null>(null);
  const [angle2Title, setAngle2Title] = useState(product?.metafields?.angle_2_title || '');
  const [angle2Text, setAngle2Text] = useState(product?.metafields?.angle_2_text || '');

  // Angle 3
  const [angle3ImageFile, setAngle3ImageFile] = useState<File | null>(null);
  const [angle3Title, setAngle3Title] = useState(product?.metafields?.angle_3_title || '');
  const [angle3Text, setAngle3Text] = useState(product?.metafields?.angle_3_text || '');

  // Lifestyle section
  const [lifestyleMainTitle, setLifestyleMainTitle] = useState(product?.metafields?.lifestyle_main_title || '');
  const [lifestyleLeftTitle, setLifestyleLeftTitle] = useState(product?.metafields?.lifestyle_left_title || '');
  const [lifestyleLeftIconFile, setLifestyleLeftIconFile] = useState<File | null>(null);
  const [lifestyleLeftText, setLifestyleLeftText] = useState(product?.metafields?.lifestyle_left_text || '');
  const [lifestyleImageFile, setLifestyleImageFile] = useState<File | null>(null);
  const [lifestyleRightTitle, setLifestyleRightTitle] = useState(product?.metafields?.lifestyle_right_title || '');
  const [lifestyleRightIconFile, setLifestyleRightIconFile] = useState<File | null>(null);
  const [lifestyleRightText, setLifestyleRightText] = useState(product?.metafields?.lifestyle_right_text || '');

  // AI Generation from URL
  const handleAIGenerate = async () => {
    if (!exampleUrl) {
      alert('Inserisci un URL di esempio');
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/generate-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          url: exampleUrl,
          fields: [
            'bullet_1', 'bullet_2', 'bullet_3',
            'angle_1_title', 'angle_1_text',
            'angle_2_title', 'angle_2_text',
            'angle_3_title', 'angle_3_text',
            'lifestyle_main_title',
            'lifestyle_left_title', 'lifestyle_left_text',
            'lifestyle_right_title', 'lifestyle_right_text'
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          if (data.content.title) setTitle(data.content.title);
          if (data.content.description) setDescription(data.content.description);

          const mf = data.content.metafields || {};
          if (mf.bullet_1) setBullet1(mf.bullet_1);
          if (mf.bullet_2) setBullet2(mf.bullet_2);
          if (mf.bullet_3) setBullet3(mf.bullet_3);
          if (mf.angle_1_title) setAngle1Title(mf.angle_1_title);
          if (mf.angle_1_text) setAngle1Text(mf.angle_1_text);
          if (mf.angle_2_title) setAngle2Title(mf.angle_2_title);
          if (mf.angle_2_text) setAngle2Text(mf.angle_2_text);
          if (mf.angle_3_title) setAngle3Title(mf.angle_3_title);
          if (mf.angle_3_text) setAngle3Text(mf.angle_3_text);
          if (mf.lifestyle_main_title) setLifestyleMainTitle(mf.lifestyle_main_title);
          if (mf.lifestyle_left_title) setLifestyleLeftTitle(mf.lifestyle_left_title);
          if (mf.lifestyle_left_text) setLifestyleLeftText(mf.lifestyle_left_text);
          if (mf.lifestyle_right_title) setLifestyleRightTitle(mf.lifestyle_right_title);
          if (mf.lifestyle_right_text) setLifestyleRightText(mf.lifestyle_right_text);
        }
      } else {
        const error = await res.json();
        alert(`Errore AI: ${error.error}`);
      }
    } catch (error) {
      console.error('AI generation error:', error);
      alert('Errore durante la generazione AI');
    } finally {
      setAiLoading(false);
    }
  };

  // Upload file and get Shopify file GID
  const uploadFileForMetafield = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('shopId', shopId);
      formData.append('file', file);

      const res = await fetch('/api/upload-media', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return data.file?.id || null;
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Upload all image files
      const uploads: { key: string; file: File }[] = [];
      if (angle1ImageFile) uploads.push({ key: 'angle_1_image', file: angle1ImageFile });
      if (angle2ImageFile) uploads.push({ key: 'angle_2_image', file: angle2ImageFile });
      if (angle3ImageFile) uploads.push({ key: 'angle_3_image', file: angle3ImageFile });
      if (lifestyleLeftIconFile) uploads.push({ key: 'lifestyle_left_icon', file: lifestyleLeftIconFile });
      if (lifestyleImageFile) uploads.push({ key: 'lifestyle_image', file: lifestyleImageFile });
      if (lifestyleRightIconFile) uploads.push({ key: 'lifestyle_right_icon', file: lifestyleRightIconFile });

      const uploadedGids: Record<string, string> = {};
      for (const upload of uploads) {
        const gid = await uploadFileForMetafield(upload.file);
        if (gid) uploadedGids[upload.key] = gid;
      }

      // 2. Build metafields
      const metafields: Record<string, string> = {};

      // Bullets
      if (bullet1) metafields.bullet_1 = bullet1;
      if (bullet2) metafields.bullet_2 = bullet2;
      if (bullet3) metafields.bullet_3 = bullet3;

      // Angle 1
      if (uploadedGids.angle_1_image) metafields.angle_1_image = uploadedGids.angle_1_image;
      if (angle1Title) metafields.angle_1_title = angle1Title;
      if (angle1Text) metafields.angle_1_text = angle1Text;

      // Angle 2
      if (uploadedGids.angle_2_image) metafields.angle_2_image = uploadedGids.angle_2_image;
      if (angle2Title) metafields.angle_2_title = angle2Title;
      if (angle2Text) metafields.angle_2_text = angle2Text;

      // Angle 3
      if (uploadedGids.angle_3_image) metafields.angle_3_image = uploadedGids.angle_3_image;
      if (angle3Title) metafields.angle_3_title = angle3Title;
      if (angle3Text) metafields.angle_3_text = angle3Text;

      // Lifestyle
      if (lifestyleMainTitle) metafields.lifestyle_main_title = lifestyleMainTitle;
      if (lifestyleLeftTitle) metafields.lifestyle_left_title = lifestyleLeftTitle;
      if (uploadedGids.lifestyle_left_icon) metafields.lifestyle_left_icon = uploadedGids.lifestyle_left_icon;
      if (lifestyleLeftText) metafields.lifestyle_left_text = lifestyleLeftText;
      if (uploadedGids.lifestyle_image) metafields.lifestyle_image = uploadedGids.lifestyle_image;
      if (lifestyleRightTitle) metafields.lifestyle_right_title = lifestyleRightTitle;
      if (uploadedGids.lifestyle_right_icon) metafields.lifestyle_right_icon = uploadedGids.lifestyle_right_icon;
      if (lifestyleRightText) metafields.lifestyle_right_text = lifestyleRightText;

      // 3. Build product options for variants
      const productOptions = variantOptions.length > 0
        ? variantOptions.map(opt => ({ name: opt.name, values: opt.values }))
        : undefined;

      // 4. Create or update product
      const endpoint = product ? '/api/update-product' : '/api/create-product';
      const payload = product
        ? {
            productId: product.id,
            shopId,
            title,
            description,
            price: parseFloat(price) || 0,
            compareAtPrice: parseFloat(compareAtPrice) || null,
            metafields,
          }
        : {
            shopId,
            title,
            description,
            price: parseFloat(price) || 0,
            compareAtPrice: parseFloat(compareAtPrice) || null,
            templateSuffix: 'landing',
            metafields,
            options: productOptions,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Errore: ${error.error}`);
        return;
      }

      const result = await response.json();
      const createdProductId = result.product?.shopifyProductId || result.product?.shopifyId || product?.shopifyProductId;

      // 5. Handle variants
      if (variantOptions.length > 0 && variantCombinations.length > 0 && createdProductId) {
        try {
          await fetch('/api/variants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shopId,
              productId: createdProductId,
              options: variantOptions,
              variants: variantCombinations,
            }),
          });
        } catch (variantErr) {
          console.error('Variant creation failed:', variantErr);
        }
      }

      // 6. Handle product images (carousel)
      if (productImages.length > 0 && createdProductId) {
        const newImages = productImages.filter(img => !img.id && (img.file || img.url));

        if (newImages.length > 0) {
          try {
            const imageFormData = new FormData();
            imageFormData.append('shopId', shopId);
            imageFormData.append('productId', createdProductId);

            newImages.forEach(img => {
              if (img.url) imageFormData.append('imageUrls', img.url);
              if (img.file) imageFormData.append('files', img.file);
            });

            await fetch('/api/product-images', {
              method: 'POST',
              body: imageFormData,
            });
          } catch (imgErr) {
            console.error('Image upload failed:', imgErr);
          }
        }
      }

      alert(product ? 'Prodotto aggiornato!' : 'Prodotto creato!');
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  // Image upload component
  const ImageUpload = ({
    label,
    file,
    setFile,
  }: {
    label: string;
    file: File | null;
    setFile: (f: File | null) => void;
  }) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type="file"
        accept="image/*,image/gif"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="w-full text-sm"
      />
      {file && (
        <div className="mt-2">
          <img
            src={URL.createObjectURL(file)}
            alt="Preview"
            className="h-24 w-24 object-cover rounded"
          />
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Generation da URL */}
      <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
        <h3 className="text-lg font-bold mb-3 text-purple-800">Genera con AI</h3>
        <p className="text-sm text-purple-600 mb-3">
          Inserisci un URL di esempio e l'AI genererà i testi.
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={exampleUrl}
            onChange={(e) => setExampleUrl(e.target.value)}
            placeholder="https://esempio.com/prodotto"
            className="flex-1 rounded-md border-gray-300 shadow-sm px-4 py-2 border"
          />
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={aiLoading || !exampleUrl}
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 font-medium"
          >
            {aiLoading ? 'Generando...' : 'Genera'}
          </button>
        </div>
      </div>

      {/* Info Base Prodotto */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-bold mb-4">Informazioni Prodotto</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Prodotto *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo Finale (€) *</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo di Confronto (€)</label>
              <input
                type="number"
                step="0.01"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Immagini Prodotto (Carosello) */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-bold mb-4">Immagini Prodotto (Carosello)</h3>
        <ImageGallery
          images={productImages}
          onImagesChange={setProductImages}
          shopId={shopId}
          productId={product?.shopifyProductId}
        />
      </div>

      {/* Varianti */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-bold mb-4">Varianti</h3>
        <VariantBuilder
          options={variantOptions}
          combinations={variantCombinations}
          onOptionsChange={setVariantOptions}
          onCombinationsChange={setVariantCombinations}
          defaultPrice={price || '0.00'}
          defaultCompareAtPrice={compareAtPrice || undefined}
        />
      </div>

      {/* Bullets */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-bold mb-4">Bullet Points</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bullet 1</label>
            <input
              type="text"
              value={bullet1}
              onChange={(e) => setBullet1(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bullet 2</label>
            <input
              type="text"
              value={bullet2}
              onChange={(e) => setBullet2(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bullet 3</label>
            <input
              type="text"
              value={bullet3}
              onChange={(e) => setBullet3(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>
        </div>
      </div>

      {/* Angle 1 */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-bold mb-4 text-blue-800">Angle 1</h3>
        <div className="space-y-4">
          <ImageUpload label="Immagine" file={angle1ImageFile} setFile={setAngle1ImageFile} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
            <input
              type="text"
              value={angle1Title}
              onChange={(e) => setAngle1Title(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Testo</label>
            <textarea
              value={angle1Text}
              onChange={(e) => setAngle1Text(e.target.value)}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>
        </div>
      </div>

      {/* Angle 2 */}
      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <h3 className="text-lg font-bold mb-4 text-green-800">Angle 2</h3>
        <div className="space-y-4">
          <ImageUpload label="Immagine" file={angle2ImageFile} setFile={setAngle2ImageFile} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
            <input
              type="text"
              value={angle2Title}
              onChange={(e) => setAngle2Title(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Testo</label>
            <textarea
              value={angle2Text}
              onChange={(e) => setAngle2Text(e.target.value)}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>
        </div>
      </div>

      {/* Angle 3 */}
      <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
        <h3 className="text-lg font-bold mb-4 text-orange-800">Angle 3</h3>
        <div className="space-y-4">
          <ImageUpload label="Immagine" file={angle3ImageFile} setFile={setAngle3ImageFile} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
            <input
              type="text"
              value={angle3Title}
              onChange={(e) => setAngle3Title(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Testo</label>
            <textarea
              value={angle3Text}
              onChange={(e) => setAngle3Text(e.target.value)}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>
        </div>
      </div>

      {/* Lifestyle Section */}
      <div className="bg-pink-50 p-6 rounded-lg border border-pink-200">
        <h3 className="text-lg font-bold mb-4 text-pink-800">Sezione Lifestyle</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo Principale</label>
            <input
              type="text"
              value={lifestyleMainTitle}
              onChange={(e) => setLifestyleMainTitle(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Left */}
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-pink-700">Sinistra</h4>
              <ImageUpload label="Icona" file={lifestyleLeftIconFile} setFile={setLifestyleLeftIconFile} />
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                <input
                  type="text"
                  value={lifestyleLeftTitle}
                  onChange={(e) => setLifestyleLeftTitle(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border text-sm"
                />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Testo</label>
                <textarea
                  value={lifestyleLeftText}
                  onChange={(e) => setLifestyleLeftText(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border text-sm"
                />
              </div>
            </div>

            {/* Center - GIF */}
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-pink-700">Centro (GIF)</h4>
              <ImageUpload label="GIF/Immagine" file={lifestyleImageFile} setFile={setLifestyleImageFile} />
            </div>

            {/* Right */}
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-pink-700">Destra</h4>
              <ImageUpload label="Icona" file={lifestyleRightIconFile} setFile={setLifestyleRightIconFile} />
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                <input
                  type="text"
                  value={lifestyleRightTitle}
                  onChange={(e) => setLifestyleRightTitle(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border text-sm"
                />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Testo</label>
                <textarea
                  value={lifestyleRightText}
                  onChange={(e) => setLifestyleRightText(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="sticky bottom-0 bg-white border-t p-4">
        <button
          type="submit"
          disabled={loading || aiLoading}
          className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 font-bold"
        >
          {loading ? 'Salvataggio...' : product ? 'Aggiorna Prodotto' : 'Crea Prodotto'}
        </button>
      </div>
    </form>
  );
}
