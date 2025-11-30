# Shopify Product Manager - Landing Page Builder

App completa Next.js 14 (App Router) + TypeScript per creare e gestire prodotti Shopify con landing page personalizzate, senza usare il pannello Shopify.

## Features

- **Creazione prodotti completa** - Titolo, prezzo, SKU, varianti
- **Landing page personalizzate** - Template multipli con metafields
- **Upload immagini** - Caricamento diretto su Shopify via GraphQL
- **Gestione metafields** - Testi, immagini, sezioni della landing
- **Multi-template** - Supporto per landing, landing1, landing2, ecc.
- **OAuth completo** - Autenticazione sicura con Shopify
- **Zero click su Shopify** - Tutto gestibile dal pannello esterno
- **Multi-shop** - Supporto per più negozi Shopify

## Stack Tecnologico

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Prisma** (ORM)
- **PostgreSQL** (NeonDB)
- **Shopify Admin API** (GraphQL)
- **Vercel** (Deployment)

## Installazione

### 1. Clona il progetto

```bash
git clone <repo-url>
cd shopauto
```

### 2. Installa dipendenze

```bash
npm install
```

### 3. Configura le variabili d'ambiente

Copia il file `.env.example` in `.env`:

```bash
cp .env.example .env
```

Compila le seguenti variabili:

```env
# Database NeonDB
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Shopify App Credentials
SHOPIFY_API_KEY="your-shopify-api-key"
SHOPIFY_API_SECRET="your-shopify-api-secret"

# App URL
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret"
```

### 4. Crea un database NeonDB

1. Vai su [NeonDB](https://neon.tech)
2. Crea un nuovo database
3. Copia la connection string in `DATABASE_URL`

### 5. Inizializza il database

```bash
npx prisma db push
```

### 6. Crea un'app Shopify

1. Vai nel tuo Shopify Admin > Settings > Apps and sales channels
2. Clicca su "Develop apps"
3. Crea una nuova app custom
4. Configura gli **scopes** necessari:
   - `read_products`
   - `write_products`
   - `read_files`
   - `write_files`
   - `read_metafields`
   - `write_metafields`
   - `read_metaobjects`
   - `write_metaobjects`
5. Configura **App URL** e **Redirect URLs**:
   - App URL: `https://your-domain.com`
   - Redirect URL: `https://your-domain.com/api/auth/callback`
6. Copia **API Key** e **API Secret** nel file `.env`

### 7. Installa i template Shopify

Carica i file del tema nel tuo tema Shopify:

1. Vai in **Online Store > Themes > Customize**
2. Clicca sui 3 puntini > **Edit code**
3. Carica i file da `templates/shopify/sections/` nella cartella **sections**:
   - `landing-hero.liquid`
   - `landing-section-1.liquid`
4. Carica il file `templates/shopify/templates/product.landing.json` nella cartella **templates**

### 8. Avvia il server di sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## Utilizzo

### 1. Connetti il tuo shop

1. Vai su `/dashboard`
2. Inserisci il tuo dominio Shopify: `your-shop.myshopify.com`
3. Clicca su "Connect Shop"
4. Autorizza l'app nel pannello Shopify

### 2. Crea un prodotto

1. Clicca su "+ Create New Product"
2. Compila il form:
   - **Titolo prodotto** (obbligatorio)
   - **Prezzo** e **SKU**
   - **Template** (landing, landing1, landing2)
   - **Hero Section**: titolo, sottotitolo, immagine
   - **Section 1, 2, 3**: titolo, testo, immagine
3. Clicca su "Create Product"

Il sistema:
- Crea il prodotto in Shopify
- Imposta automaticamente `templateSuffix: "landing"`
- Carica tutte le immagini
- Salva tutti i metafields nelle chiavi `landing.*`

### 3. Modifica un prodotto

1. Dalla lista prodotti, clicca su "Edit"
2. Modifica i campi desiderati
3. Clicca su "Update Product"

### 4. Visualizza la landing page

Ogni prodotto avrà URL:
```
https://your-shop.myshopify.com/products/product-handle
```

## Struttura del Progetto

```
shopauto/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── install/route.ts       # OAuth install
│   │   │   └── callback/route.ts      # OAuth callback
│   │   ├── create-product/route.ts    # Crea prodotto
│   │   ├── update-product/route.ts    # Aggiorna prodotto
│   │   ├── upload-media/route.ts      # Upload immagini
│   │   └── get-product-data/route.ts  # Ottieni dati prodotto
│   ├── dashboard/page.tsx             # Dashboard principale
│   ├── layout.tsx
│   └── page.tsx                       # Homepage
├── components/
│   ├── ProductForm.tsx                # Form creazione/modifica
│   └── ProductList.tsx                # Lista prodotti
├── lib/
│   ├── db.ts                          # Client Prisma
│   ├── shopify.ts                     # Client GraphQL Shopify
│   ├── oauth.ts                       # Utility OAuth
│   └── template-converter.ts          # Utility conversione template
├── prisma/
│   └── schema.prisma                  # Schema database
├── templates/
│   └── shopify/
│       ├── sections/                  # Sezioni Liquid
│       │   ├── landing-hero.liquid
│       │   └── landing-section-1.liquid
│       └── templates/                 # Template JSON OS 2.0
│           └── product.landing.json
├── .env.example
├── package.json
└── README.md
```

## API Routes

### POST /api/create-product

Crea un nuovo prodotto con metafields e template.

**Body:**
```json
{
  "shopId": "shop-id",
  "title": "Product Title",
  "price": 99.99,
  "sku": "SKU123",
  "templateSuffix": "landing",
  "metafields": {
    "hero_title": "Hero Title",
    "hero_subtitle": "Hero Subtitle",
    "hero_image": "https://...",
    "section1_title": "Section 1",
    "section1_text": "Text...",
    "section1_image": "https://..."
  }
}
```

### POST /api/update-product

Aggiorna un prodotto esistente.

**Body:**
```json
{
  "productId": "local-product-id",
  "shopId": "shop-id",
  "metafields": { ... }
}
```

### POST /api/upload-media

Carica un'immagine su Shopify.

**Form Data:**
- `shopId`: ID dello shop
- `file`: File immagine
- `productId` (opzionale): ID del prodotto

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "gid://...",
    "url": "https://cdn.shopify.com/..."
  }
}
```

### GET /api/get-product-data

Ottieni dati di un prodotto o lista prodotti.

**Query Params:**
- `shopId`: ID dello shop (obbligatorio)
- `productId`: ID del prodotto (opzionale)
- `listAll=true`: Lista tutti i prodotti (opzionale)

## Template Shopify

### Metafields

Tutti i metafields sono salvati nel namespace `landing`:

```
landing.hero_title
landing.hero_subtitle
landing.hero_image
landing.section1_title
landing.section1_text
landing.section1_image
landing.section2_title
landing.section2_text
landing.section2_image
landing.section3_title
landing.section3_text
landing.section3_image
```

### Liquid Sections

Le sezioni leggono i metafields del prodotto:

```liquid
{% if product.metafields.landing.hero_title %}
  <h1>{{ product.metafields.landing.hero_title }}</h1>
{% endif %}
```

### Template JSON OS 2.0

File `product.landing.json`:

```json
{
  "name": "Landing Page",
  "sections": {
    "hero": { "type": "landing-hero" },
    "section_1": { "type": "landing-section-1" }
  },
  "order": ["hero", "section_1"]
}
```

## Deploy su Vercel

### 1. Push su GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Importa in Vercel

1. Vai su [Vercel](https://vercel.com)
2. Clicca "Import Project"
3. Seleziona il repo GitHub
4. Configura le variabili d'ambiente (copia da `.env`)
5. Deploy

### 3. Aggiorna Shopify App URLs

Dopo il deploy, aggiorna nell'app Shopify:
- App URL: `https://your-app.vercel.app`
- Redirect URL: `https://your-app.vercel.app/api/auth/callback`

## Database

### Schema Prisma

```prisma
model Shop {
  id          String   @id @default(cuid())
  shop        String   @unique
  accessToken String
  scope       String?
  products    Product[]
}

model Product {
  id               String   @id @default(cuid())
  shopifyProductId String
  shopId           String
  shop             Shop     @relation(fields: [shopId], references: [id])
  title            String
  price            Float?
  sku              String?
  templateSuffix   String   @default("landing")
  metafields       Json?
}

model Template {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  structure Json
  sections  Json?
}
```

### Migrazioni

```bash
# Push schema al database
npx prisma db push

# Genera Prisma Client
npx prisma generate

# Apri Prisma Studio
npx prisma studio
```

## Troubleshooting

### Errore: "Invalid HMAC"

Verifica che `SHOPIFY_API_SECRET` sia corretto nel file `.env`.

### Errore: "Shop not found"

Assicurati di aver completato l'OAuth flow prima di creare prodotti.

### Errore: "Failed to upload file"

Verifica che l'app Shopify abbia lo scope `write_files`.

### Metafields non visualizzati

Verifica che:
1. I file Liquid siano stati caricati nel tema
2. Il template `product.landing.json` esista
3. Il prodotto abbia `templateSuffix: "landing"`

## Licenza

MIT

## Supporto

Per domande o problemi, apri una issue su GitHub.
