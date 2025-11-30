# Guida Template Liquid → JSON OS 2.0

Questa guida spiega come convertire i tuoi template Liquid esistenti in template JSON compatibili con Shopify Online Store 2.0.

## Come funziona il sistema

### 1. Template Liquid tradizionale

Prima avevi un file `product-landing.liquid` con tutto il codice:

```liquid
<div class="hero">
  <h1>{{ product.title }}</h1>
  <img src="{{ product.featured_image | img_url: 'large' }}">
</div>

<div class="section-1">
  <h2>{{ product.metafields.custom.section1_title }}</h2>
  <p>{{ product.metafields.custom.section1_text }}</p>
</div>
```

### 2. Sistema OS 2.0 - Diviso in Sezioni

Con OS 2.0, dividi il codice in **sezioni riutilizzabili**:

**File: `sections/landing-hero.liquid`**
```liquid
<div class="hero">
  {% if product.metafields.landing.hero_title %}
    <h1>{{ product.metafields.landing.hero_title }}</h1>
  {% endif %}

  {% if product.metafields.landing.hero_image %}
    <img src="{{ product.metafields.landing.hero_image }}">
  {% endif %}
</div>

{% schema %}
{
  "name": "Landing Hero",
  "settings": [
    {
      "type": "text",
      "id": "hero_title",
      "label": "Hero Title"
    },
    {
      "type": "image_picker",
      "id": "hero_image",
      "label": "Hero Image"
    }
  ]
}
{% endschema %}
```

**File: `templates/product.landing.json`**
```json
{
  "name": "Landing Page",
  "sections": {
    "hero": {
      "type": "landing-hero",
      "settings": {}
    },
    "section_1": {
      "type": "landing-section-1",
      "settings": {}
    }
  },
  "order": ["hero", "section_1"]
}
```

## Step per convertire il tuo template

### Step 1: Identifica le sezioni

Guarda il tuo template Liquid e identifica i blocchi logici:
- Hero / Header
- Sezione contenuti 1
- Sezione contenuti 2
- Gallery
- CTA
- Footer
- ecc.

### Step 2: Crea i file sezioni

Per ogni blocco, crea un file in `sections/`:

**Esempio: `sections/landing-section-1.liquid`**

```liquid
<div class="landing-section-1">
  <div class="container">
    {% if product.metafields.landing.section1_title %}
      <h2>{{ product.metafields.landing.section1_title }}</h2>
    {% endif %}

    <div class="content">
      {% if product.metafields.landing.section1_image %}
        <div class="image">
          <img src="{{ product.metafields.landing.section1_image }}" alt="{{ product.metafields.landing.section1_title }}">
        </div>
      {% endif %}

      {% if product.metafields.landing.section1_text %}
        <div class="text">
          {{ product.metafields.landing.section1_text }}
        </div>
      {% endif %}
    </div>
  </div>
</div>

<style>
  .landing-section-1 {
    padding: 60px 20px;
  }
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  .content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
</style>

{% schema %}
{
  "name": "Landing Section 1",
  "settings": [
    {
      "type": "text",
      "id": "section1_title",
      "label": "Title"
    },
    {
      "type": "richtext",
      "id": "section1_text",
      "label": "Text"
    },
    {
      "type": "image_picker",
      "id": "section1_image",
      "label": "Image"
    }
  ]
}
{% endschema %}
```

### Step 3: Crea il template JSON

Crea il file `templates/product.landing.json`:

```json
{
  "name": "Landing Page",
  "sections": {
    "hero": {
      "type": "landing-hero",
      "settings": {}
    },
    "section_1": {
      "type": "landing-section-1",
      "settings": {}
    },
    "section_2": {
      "type": "landing-section-1",
      "settings": {}
    },
    "section_3": {
      "type": "landing-section-1",
      "settings": {}
    }
  },
  "order": [
    "hero",
    "section_1",
    "section_2",
    "section_3"
  ]
}
```

### Step 4: Carica i file su Shopify

1. Vai in **Admin > Online Store > Themes**
2. Clicca su **Actions > Edit code**
3. Carica i file:
   - Sezioni in `sections/`
   - Template in `templates/`

### Step 5: Imposta il template dal pannello

Quando crei un prodotto con questa app, il sistema imposta automaticamente:

```javascript
templateSuffix: "landing"
```

Che corrisponde al file `product.landing.json`.

## Metafields

### Naming convention

Usa sempre il namespace `landing` per i metafields:

```
product.metafields.landing.hero_title
product.metafields.landing.hero_subtitle
product.metafields.landing.hero_image
product.metafields.landing.section1_title
product.metafields.landing.section1_text
product.metafields.landing.section1_image
```

### Tipi di metafield supportati

- **Testo semplice**: `single_line_text_field`
- **Testo lungo**: `multi_line_text_field`
- **Numero**: `number_integer` o `number_decimal`
- **Boolean**: `boolean`
- **URL**: `url`
- **File/Immagine**: `file_reference`

L'app gestisce automaticamente i tipi in base al contenuto.

## Template multipli

Puoi creare più template:

```
templates/product.landing.json
templates/product.landing1.json
templates/product.landing2.json
```

Ognuno con sezioni diverse:

**landing.json** → Per prodotti standard
**landing1.json** → Per prodotti con video
**landing2.json** → Per prodotti con gallery

Seleziona il template dal form nella dashboard.

## Esempio completo: Sezione con Gallery

```liquid
<div class="product-gallery">
  <h2>{{ product.metafields.landing.gallery_title | default: 'Gallery' }}</h2>

  <div class="gallery-grid">
    {% for i in (1..6) %}
      {% assign img_key = 'gallery_image_' | append: i %}
      {% assign img_url = product.metafields.landing[img_key] %}

      {% if img_url %}
        <div class="gallery-item">
          <img src="{{ img_url }}" alt="Gallery {{ i }}">
        </div>
      {% endif %}
    {% endfor %}
  </div>
</div>

<style>
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .gallery-item img {
    width: 100%;
    height: auto;
  }
</style>

{% schema %}
{
  "name": "Product Gallery",
  "settings": [
    {
      "type": "text",
      "id": "gallery_title",
      "label": "Gallery Title",
      "default": "Gallery"
    }
  ]
}
{% endschema %}
```

E nel form aggiungi 6 campi per le immagini:
```javascript
gallery_image_1: file
gallery_image_2: file
gallery_image_3: file
gallery_image_4: file
gallery_image_5: file
gallery_image_6: file
```

## Best Practices

1. **Usa nomi descrittivi** per le sezioni: `landing-hero`, `landing-features`, `landing-testimonials`
2. **Raggruppa metafields** per sezione: `section1_title`, `section1_text`, `section1_image`
3. **Valida i metafields** con `{% if %}` prima di stamparli
4. **Usa CSS inline** nelle sezioni per evitare conflitti
5. **Testa sempre** i template prima di metterli in produzione
6. **Documenta** ogni sezione con commenti nel codice

## Risorse

- [Shopify OS 2.0 Documentation](https://shopify.dev/themes/architecture)
- [Liquid Reference](https://shopify.dev/docs/api/liquid)
- [Section Schema](https://shopify.dev/docs/themes/architecture/sections/section-schema)
- [Metafields API](https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsSet)
