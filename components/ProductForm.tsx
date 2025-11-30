'use client';

import { useState } from 'react';

interface ProductFormProps {
  shopId: string;
  product?: any;
  onSuccess?: () => void;
}

export default function ProductForm({ shopId, product, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: product?.title || '',
    price: product?.price || '',
    compareAtPrice: product?.compareAtPrice || '',
    sku: product?.sku || '',
    templateSuffix: product?.templateSuffix || 'landing',

    // Hero section
    hero_overtitle: product?.metafields?.hero_overtitle || '',
    hero_title: product?.metafields?.hero_title || '',
    hero_subtitle: product?.metafields?.hero_subtitle || '',
    hero_image: product?.metafields?.hero_image || '',

    // Chi Siamo
    about_title: product?.metafields?.about_title || 'Chi Siamo',
    about_subtitle: product?.metafields?.about_subtitle || 'La nostra storia',
    section1_image_url: product?.metafields?.section1_image || '',
    section2_image_url: product?.metafields?.section2_image || '',
    section3_image_url: product?.metafields?.section3_image || '',

    // Scarcity & CTA
    scarcity_text: product?.metafields?.scarcity_text || '💎 Ultime unità disponibili',
    cta_button_text: product?.metafields?.cta_button_text || 'ORDINA ORA',
    sticky_cta_text: product?.metafields?.sticky_cta_text || 'AGGIUNGI',

    // Icons
    icon1_text: product?.metafields?.icon1_text || '🇮🇹 Qualità Italiana',
    icon2_text: product?.metafields?.icon2_text || '🛡️ Garanzia 2 anni',
    icon3_text: product?.metafields?.icon3_text || '🔒 Pagamenti Sicuri',

    // Sections
    section1_overtitle: product?.metafields?.section1_overtitle || '',
    section1_title: product?.metafields?.section1_title || '',
    section1_text: product?.metafields?.section1_text || '',
    section1_bullets: product?.metafields?.section1_bullets || '',
    section2_title: product?.metafields?.section2_title || '',
    section2_text: product?.metafields?.section2_text || '',
    section2_bullets: product?.metafields?.section2_bullets || '',
    section3_title: product?.metafields?.section3_title || '',
    section3_text: product?.metafields?.section3_text || '',

    // Reviews
    reviews_title: product?.metafields?.reviews_title || 'Recensioni Clienti',
    review1_stars: product?.metafields?.review1_stars || '5',
    review1_author: product?.metafields?.review1_author || '',
    review1_text: product?.metafields?.review1_text || '',
    review2_stars: product?.metafields?.review2_stars || '5',
    review2_author: product?.metafields?.review2_author || '',
    review2_text: product?.metafields?.review2_text || '',
    review3_stars: product?.metafields?.review3_stars || '5',
    review3_author: product?.metafields?.review3_author || '',
    review3_text: product?.metafields?.review3_text || '',

    // Text Block Section
    text_block_subtitle: product?.metafields?.text_block_subtitle || 'La nostra promessa',
    text_block_description: product?.metafields?.text_block_description || '',
    text_block_image_url: product?.metafields?.text_block_image || '',
  });

  const [images, setImages] = useState<{
    hero_image?: File;
    section1_image?: File;
    section2_image?: File;
    section3_image?: File;
    text_block_image?: File;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload images first (only if files are selected)
      const uploadedImages: Record<string, string> = {};

      for (const [key, file] of Object.entries(images)) {
        if (file) {
          try {
            const imgFormData = new FormData();
            imgFormData.append('shopId', shopId);
            imgFormData.append('file', file);

            const uploadRes = await fetch('/api/upload-media', {
              method: 'POST',
              body: imgFormData,
            });

            if (uploadRes.ok) {
              const { file: uploadedFile } = await uploadRes.json();
              uploadedImages[key] = uploadedFile.url;
            } else {
              console.error(`Failed to upload ${key}:`, await uploadRes.text());
            }
          } catch (uploadError) {
            console.error(`Error uploading ${key}:`, uploadError);
          }
        }
      }

      // Prepare metafields (use uploaded image URL, or URL from form, or existing)
      const metafields = {
        hero_overtitle: formData.hero_overtitle,
        hero_title: formData.hero_title,
        hero_subtitle: formData.hero_subtitle,
        hero_image: uploadedImages.hero_image || formData.hero_image || product?.metafields?.hero_image || '',

        about_title: formData.about_title,
        about_subtitle: formData.about_subtitle,

        scarcity_text: formData.scarcity_text,
        cta_button_text: formData.cta_button_text,
        sticky_cta_text: formData.sticky_cta_text,

        icon1_text: formData.icon1_text,
        icon2_text: formData.icon2_text,
        icon3_text: formData.icon3_text,

        section1_overtitle: formData.section1_overtitle,
        section1_title: formData.section1_title,
        section1_text: formData.section1_text,
        section1_bullets: formData.section1_bullets,
        section1_image: uploadedImages.section1_image || formData.section1_image_url || product?.metafields?.section1_image || '',

        section2_title: formData.section2_title,
        section2_text: formData.section2_text,
        section2_bullets: formData.section2_bullets,
        section2_image: uploadedImages.section2_image || formData.section2_image_url || product?.metafields?.section2_image || '',

        section3_title: formData.section3_title,
        section3_text: formData.section3_text,
        section3_image: uploadedImages.section3_image || formData.section3_image_url || product?.metafields?.section3_image || '',

        reviews_title: formData.reviews_title,
        review1_stars: formData.review1_stars,
        review1_author: formData.review1_author,
        review1_text: formData.review1_text,
        review2_stars: formData.review2_stars,
        review2_author: formData.review2_author,
        review2_text: formData.review2_text,
        review3_stars: formData.review3_stars,
        review3_author: formData.review3_author,
        review3_text: formData.review3_text,

        text_block_subtitle: formData.text_block_subtitle,
        text_block_description: formData.text_block_description,
        text_block_image: uploadedImages.text_block_image || formData.text_block_image_url || product?.metafields?.text_block_image || '',
      };

      // Create or update product
      const endpoint = product ? '/api/update-product' : '/api/create-product';
      const payload = product
        ? {
            productId: product.id,
            shopId,
            title: formData.title,
            price: parseFloat(formData.price) || 0,
            compareAtPrice: parseFloat(formData.compareAtPrice) || null,
            sku: formData.sku,
            metafields,
          }
        : {
            shopId,
            title: formData.title,
            price: parseFloat(formData.price) || 0,
            compareAtPrice: parseFloat(formData.compareAtPrice) || null,
            sku: formData.sku,
            templateSuffix: formData.templateSuffix,
            metafields,
          };

      console.log('[FORM] Sending to:', endpoint);
      console.log('[FORM] Payload:', JSON.stringify(payload, null, 2));

      // Count non-empty metafields
      const nonEmptyMetafields = Object.entries(metafields).filter(([k, v]) => v !== '' && v !== null && v !== undefined);
      console.log('[FORM] Non-empty metafields count:', nonEmptyMetafields.length);
      console.log('[FORM] Non-empty metafield keys:', nonEmptyMetafields.map(([k]) => k));

      if (nonEmptyMetafields.length === 0) {
        console.warn('[FORM] WARNING: All metafields are empty!');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('[FORM] Response status:', response.status);

      if (response.ok) {
        alert(product ? 'Prodotto aggiornato!' : 'Prodotto creato!');
        onSuccess?.();
      } else {
        const error = await response.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4">📦 Informazioni Base</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titolo Prodotto *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo di Confronto (€) <span className="text-gray-400 text-xs">barrato</span></label>
            <input
              type="number"
              step="0.01"
              value={formData.compareAtPrice}
              onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
              placeholder="Es: 199.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border"
            />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-blue-50 p-6 rounded-lg border-t-4 border-blue-500">
        <h3 className="text-lg font-bold mb-4">🎯 Hero Section</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sovratitolo (piccolo, sopra il titolo)</label>
            <input
              type="text"
              value={formData.hero_overtitle}
              onChange={(e) => setFormData({ ...formData, hero_overtitle: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
              placeholder="Es: NUOVA COLLEZIONE 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo Hero</label>
            <input
              type="text"
              value={formData.hero_title}
              onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
              placeholder="Es: Scopri l'Eleganza"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sottotitolo Hero <span className="text-blue-500 text-xs">(HTML supportato)</span></label>
            <textarea
              value={formData.hero_subtitle}
              onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
              rows={2}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
              placeholder="Puoi usare HTML: <strong>grassetto</strong>, <em>corsivo</em>, <br> per a capo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Immagine Hero</label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Oppure incolla URL immagine (es: https://...)"
                value={formData.hero_image || ''}
                onChange={(e) => setFormData({ ...formData, hero_image: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border text-sm"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImages({ ...images, hero_image: e.target.files?.[0] })}
                className="w-full text-sm"
              />
              <p className="text-xs text-gray-500">Carica file OPPURE incolla URL immagine</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA & Scarcity */}
      <div className="bg-red-50 p-6 rounded-lg border-t-4 border-red-500">
        <h3 className="text-lg font-bold mb-4">🔥 CTA & Scarcity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Testo Scarcity Bar</label>
            <input
              type="text"
              value={formData.scarcity_text}
              onChange={(e) => setFormData({ ...formData, scarcity_text: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Testo Pulsante CTA</label>
            <input
              type="text"
              value={formData.cta_button_text}
              onChange={(e) => setFormData({ ...formData, cta_button_text: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Testo CTA Sticky</label>
            <input
              type="text"
              value={formData.sticky_cta_text}
              onChange={(e) => setFormData({ ...formData, sticky_cta_text: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>
        </div>
      </div>

      {/* Icons Row */}
      <div className="bg-green-50 p-6 rounded-lg border-t-4 border-green-500">
        <h3 className="text-lg font-bold mb-4">✨ Icone Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icona 1</label>
            <input
              type="text"
              value={formData.icon1_text}
              onChange={(e) => setFormData({ ...formData, icon1_text: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icona 2</label>
            <input
              type="text"
              value={formData.icon2_text}
              onChange={(e) => setFormData({ ...formData, icon2_text: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icona 3</label>
            <input
              type="text"
              value={formData.icon3_text}
              onChange={(e) => setFormData({ ...formData, icon3_text: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>
        </div>
      </div>

      {/* Section 1 */}
      <div className="bg-purple-50 p-6 rounded-lg border-t-4 border-purple-500">
        <h3 className="text-lg font-bold mb-4">📄 Sezione 1</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sovratitolo (piccolo, sopra il titolo)</label>
            <input
              type="text"
              value={formData.section1_overtitle}
              onChange={(e) => setFormData({ ...formData, section1_overtitle: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
              placeholder="Es: QUALITÀ PREMIUM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo (grande)</label>
            <input
              type="text"
              value={formData.section1_title}
              onChange={(e) => setFormData({ ...formData, section1_title: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Testo <span className="text-purple-500 text-xs">(HTML supportato)</span></label>
            <textarea
              value={formData.section1_text}
              onChange={(e) => setFormData({ ...formData, section1_text: e.target.value })}
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
              placeholder="Puoi usare HTML: <strong>grassetto</strong>, <em>corsivo</em>, <br> per a capo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bullet Points (con spunta)</label>
            <textarea
              value={formData.section1_bullets}
              onChange={(e) => setFormData({ ...formData, section1_bullets: e.target.value })}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
              placeholder="Separa i punti con | Es: Qualità premium|Spedizione gratuita|Garanzia 2 anni"
            />
            <p className="text-xs text-gray-500 mt-1">Separa ogni punto con il carattere | (pipe)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Immagine</label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="URL immagine"
                value={formData.section1_image_url || ''}
                onChange={(e) => setFormData({ ...formData, section1_image_url: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border text-sm"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImages({ ...images, section1_image: e.target.files?.[0] })}
                className="w-full text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 */}
      <div className="bg-yellow-50 p-6 rounded-lg border-t-4 border-yellow-500">
        <h3 className="text-lg font-bold mb-4">📄 Sezione 2</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
            <input
              type="text"
              value={formData.section2_title}
              onChange={(e) => setFormData({ ...formData, section2_title: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Testo <span className="text-yellow-600 text-xs">(HTML supportato)</span></label>
            <textarea
              value={formData.section2_text}
              onChange={(e) => setFormData({ ...formData, section2_text: e.target.value })}
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
              placeholder="Puoi usare HTML: <strong>grassetto</strong>, <em>corsivo</em>, <br> per a capo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bullet Points (con spunta)</label>
            <textarea
              value={formData.section2_bullets}
              onChange={(e) => setFormData({ ...formData, section2_bullets: e.target.value })}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
              placeholder="Separa i punti con | Es: Qualità premium|Spedizione gratuita|Garanzia 2 anni"
            />
            <p className="text-xs text-gray-500 mt-1">Separa ogni punto con il carattere | (pipe)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Immagine</label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="URL immagine"
                value={formData.section2_image_url || ''}
                onChange={(e) => setFormData({ ...formData, section2_image_url: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border text-sm"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImages({ ...images, section2_image: e.target.files?.[0] })}
                className="w-full text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 */}
      <div className="bg-pink-50 p-6 rounded-lg border-t-4 border-pink-500">
        <h3 className="text-lg font-bold mb-4">📄 Sezione 3</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
            <input
              type="text"
              value={formData.section3_title}
              onChange={(e) => setFormData({ ...formData, section3_title: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Testo <span className="text-pink-500 text-xs">(HTML supportato)</span></label>
            <textarea
              value={formData.section3_text}
              onChange={(e) => setFormData({ ...formData, section3_text: e.target.value })}
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
              placeholder="Puoi usare HTML: <strong>grassetto</strong>, <em>corsivo</em>, <br> per a capo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Immagine</label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="URL immagine"
                value={formData.section3_image_url || ''}
                onChange={(e) => setFormData({ ...formData, section3_image_url: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border text-sm"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImages({ ...images, section3_image: e.target.files?.[0] })}
                className="w-full text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Text Block Section */}
      <div className="bg-gray-800 p-6 rounded-lg border-t-4 border-gray-600">
        <h3 className="text-lg font-bold mb-4 text-white">🎨 Sezione Testuale (Grigio Scuro)</h3>
        <p className="text-gray-400 text-sm mb-4">Sottotitolo piccolo + Descrizione grande + Foto circolare</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sottotitolo (piccolo)</label>
            <input
              type="text"
              value={formData.text_block_subtitle}
              onChange={(e) => setFormData({ ...formData, text_block_subtitle: e.target.value })}
              className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm px-4 py-2 border"
              placeholder="Es: La nostra promessa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Descrizione (grande) <span className="text-gray-400 text-xs">(HTML supportato)</span></label>
            <textarea
              value={formData.text_block_description}
              onChange={(e) => setFormData({ ...formData, text_block_description: e.target.value })}
              rows={3}
              className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm px-4 py-2 border"
              placeholder="Puoi usare HTML: <strong>grassetto</strong>, <em>corsivo</em>, <br> per a capo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Immagine Circolare</label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="URL immagine"
                value={formData.text_block_image_url || ''}
                onChange={(e) => setFormData({ ...formData, text_block_image_url: e.target.value })}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm px-4 py-2 border text-sm"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImages({ ...images, text_block_image: e.target.files?.[0] })}
                className="w-full text-sm text-gray-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chi Siamo */}
      <div className="bg-slate-100 p-6 rounded-lg border-t-4 border-slate-500">
        <h3 className="text-lg font-bold mb-4">🏢 Chi Siamo (Foto Full Screen)</h3>
        <p className="text-gray-500 text-sm mb-4">Sezione con foto a schermo intero e testo sovrapposto</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sovratitolo</label>
            <input
              type="text"
              value={formData.about_subtitle}
              onChange={(e) => setFormData({ ...formData, about_subtitle: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
              placeholder="Es: La nostra storia"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
            <input
              type="text"
              value={formData.about_title}
              onChange={(e) => setFormData({ ...formData, about_title: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
              placeholder="Es: Chi Siamo"
            />
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-indigo-50 p-6 rounded-lg border-t-4 border-indigo-500">
        <h3 className="text-lg font-bold mb-4">⭐ Recensioni</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo Sezione</label>
            <input
              type="text"
              value={formData.reviews_title}
              onChange={(e) => setFormData({ ...formData, reviews_title: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border"
            />
          </div>

          {/* Recensione 1 */}
          <div className="bg-white p-4 rounded border">
            <p className="font-medium text-sm mb-2">Recensione 1</p>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Stelle (1-5)</label>
                <select
                  value={formData.review1_stars}
                  onChange={(e) => setFormData({ ...formData, review1_stars: e.target.value })}
                  className="w-full rounded border-gray-300 shadow-sm px-3 py-2 border text-sm"
                >
                  <option value="5">★★★★★ (5)</option>
                  <option value="4">★★★★☆ (4)</option>
                  <option value="3">★★★☆☆ (3)</option>
                  <option value="2">★★☆☆☆ (2)</option>
                  <option value="1">★☆☆☆☆ (1)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Autore</label>
                <input
                  type="text"
                  value={formData.review1_author}
                  onChange={(e) => setFormData({ ...formData, review1_author: e.target.value })}
                  className="w-full rounded border-gray-300 shadow-sm px-3 py-2 border text-sm"
                  placeholder="Es: Marco V."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Testo recensione</label>
              <textarea
                value={formData.review1_text}
                onChange={(e) => setFormData({ ...formData, review1_text: e.target.value })}
                className="w-full rounded border-gray-300 shadow-sm px-3 py-2 border text-sm"
                rows={2}
                placeholder="Es: Prodotto fantastico, qualità eccellente!"
              />
            </div>
          </div>

          {/* Recensione 2 */}
          <div className="bg-white p-4 rounded border">
            <p className="font-medium text-sm mb-2">Recensione 2</p>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Stelle (1-5)</label>
                <select
                  value={formData.review2_stars}
                  onChange={(e) => setFormData({ ...formData, review2_stars: e.target.value })}
                  className="w-full rounded border-gray-300 shadow-sm px-3 py-2 border text-sm"
                >
                  <option value="5">★★★★★ (5)</option>
                  <option value="4">★★★★☆ (4)</option>
                  <option value="3">★★★☆☆ (3)</option>
                  <option value="2">★★☆☆☆ (2)</option>
                  <option value="1">★☆☆☆☆ (1)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Autore</label>
                <input
                  type="text"
                  value={formData.review2_author}
                  onChange={(e) => setFormData({ ...formData, review2_author: e.target.value })}
                  className="w-full rounded border-gray-300 shadow-sm px-3 py-2 border text-sm"
                  placeholder="Es: Laura M."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Testo recensione</label>
              <textarea
                value={formData.review2_text}
                onChange={(e) => setFormData({ ...formData, review2_text: e.target.value })}
                className="w-full rounded border-gray-300 shadow-sm px-3 py-2 border text-sm"
                rows={2}
                placeholder="Es: Spedizione velocissima, consigliato!"
              />
            </div>
          </div>

          {/* Recensione 3 */}
          <div className="bg-white p-4 rounded border">
            <p className="font-medium text-sm mb-2">Recensione 3</p>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Stelle (1-5)</label>
                <select
                  value={formData.review3_stars}
                  onChange={(e) => setFormData({ ...formData, review3_stars: e.target.value })}
                  className="w-full rounded border-gray-300 shadow-sm px-3 py-2 border text-sm"
                >
                  <option value="5">★★★★★ (5)</option>
                  <option value="4">★★★★☆ (4)</option>
                  <option value="3">★★★☆☆ (3)</option>
                  <option value="2">★★☆☆☆ (2)</option>
                  <option value="1">★☆☆☆☆ (1)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Autore</label>
                <input
                  type="text"
                  value={formData.review3_author}
                  onChange={(e) => setFormData({ ...formData, review3_author: e.target.value })}
                  className="w-full rounded border-gray-300 shadow-sm px-3 py-2 border text-sm"
                  placeholder="Es: Giuseppe R."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Testo recensione</label>
              <textarea
                value={formData.review3_text}
                onChange={(e) => setFormData({ ...formData, review3_text: e.target.value })}
                className="w-full rounded border-gray-300 shadow-sm px-3 py-2 border text-sm"
                rows={2}
                placeholder="Es: Ottimo rapporto qualità prezzo!"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-white border-t-4 border-gray-200 p-6 rounded-lg shadow-lg">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white px-6 py-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 font-bold text-lg shadow-lg"
        >
          {loading ? '⏳ Salvataggio in corso...' : product ? '✅ Aggiorna Prodotto' : '🚀 Crea Prodotto'}
        </button>
      </div>
    </form>
  );
}
