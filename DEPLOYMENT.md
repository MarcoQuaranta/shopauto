# Deployment Guide

Guida completa per il deployment dell'app su Vercel con NeonDB.

## Pre-requisiti

- Account GitHub
- Account Vercel
- Account NeonDB (gratis)
- App Shopify creata e configurata

## Step 1: Setup NeonDB

### 1.1 Crea database

1. Vai su [https://neon.tech](https://neon.tech)
2. Crea un account (gratis)
3. Clicca "Create Project"
4. Dai un nome al progetto (es. "shopauto")
5. Seleziona region più vicina
6. Clicca "Create Project"

### 1.2 Ottieni connection string

1. Nel dashboard NeonDB, vai su "Connection Details"
2. Copia la **Connection String**
3. Dovrebbe essere nel formato:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Salvala in un posto sicuro

## Step 2: Setup GitHub

### 2.1 Crea repository

```bash
# Inizializza git (se non già fatto)
git init

# Aggiungi tutti i file
git add .

# Commit
git commit -m "Initial commit - Shopify Product Manager"

# Crea repo su GitHub e collega
git remote add origin https://github.com/tuo-username/shopauto.git
git branch -M main
git push -u origin main
```

### 2.2 Verifica .gitignore

Assicurati che `.gitignore` includa:

```
.env
.env.local
node_modules
.next
```

**IMPORTANTE**: Non committare MAI il file `.env` con le credenziali!

## Step 3: Setup Vercel

### 3.1 Importa progetto

1. Vai su [https://vercel.com](https://vercel.com)
2. Fai login con GitHub
3. Clicca "Add New..." > "Project"
4. Seleziona il tuo repository "shopauto"
5. Clicca "Import"

### 3.2 Configura Environment Variables

Prima di fare il deploy, aggiungi queste variabili:

```
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=genera-un-secret-random-qui
```

**Come generare NEXTAUTH_SECRET:**

```bash
# In un terminale, esegui:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia il risultato e usalo come `NEXTAUTH_SECRET`.

### 3.3 Deploy

1. Clicca "Deploy"
2. Aspetta che il build finisca (2-3 minuti)
3. Una volta completato, vedrai il link: `https://your-app.vercel.app`

## Step 4: Setup Shopify App URLs

### 4.1 Aggiorna App URLs

1. Vai nel tuo Shopify Admin
2. Settings > Apps and sales channels > Develop apps
3. Clicca sulla tua app
4. Vai su "Configuration"
5. Aggiorna:
   - **App URL**: `https://your-app.vercel.app`
   - **Allowed redirection URL(s)**:
     ```
     https://your-app.vercel.app/api/auth/callback
     ```
6. Salva

### 4.2 Verifica scopes

Assicurati che la tua app abbia questi scopes:

- `read_products`
- `write_products`
- `read_files`
- `write_files`
- `read_metafields`
- `write_metafields`
- `read_metaobjects`
- `write_metaobjects`

## Step 5: Inizializza Database

### 5.1 Da locale (opzionale)

Se vuoi testare che il DB funzioni:

```bash
# Copia .env.example in .env
cp .env.example .env

# Aggiungi il DATABASE_URL di NeonDB
# Poi:
npm run db:push
```

### 5.2 Da Vercel (automatico)

Il database verrà inizializzato automaticamente al primo accesso dell'app grazie al `postinstall` script che genera Prisma Client.

Se vuoi forzare la creazione delle tabelle, puoi:

1. Andare su Vercel > Settings > Functions
2. Creare una Function che esegue `npx prisma db push`

Oppure puoi usare Vercel CLI:

```bash
# Installa Vercel CLI
npm i -g vercel

# Login
vercel login

# Link al progetto
vercel link

# Esegui comando su Vercel
vercel env pull .env.local
npx prisma db push
```

## Step 6: Test dell'app

### 6.1 Accedi all'app

1. Vai su `https://your-app.vercel.app`
2. Dovresti vedere la homepage
3. Clicca "Go to Dashboard"

### 6.2 Connetti il tuo shop

1. Inserisci: `your-shop.myshopify.com`
2. Clicca "Connect Shop"
3. Vieni reindirizzato a Shopify per autorizzare
4. Autorizza l'app
5. Vieni reindirizzato al dashboard

### 6.3 Crea un prodotto di test

1. Clicca "+ Create New Product"
2. Compila il form
3. Carica alcune immagini
4. Clicca "Create Product"
5. Verifica che il prodotto sia stato creato

## Step 7: Upload Template Shopify

### 7.1 Carica sezioni

1. Vai su Shopify Admin > Online Store > Themes
2. Clicca su "Actions" > "Edit code"
3. Nella cartella "sections", clicca "Add a new section"
4. Copia il contenuto di ogni file da `templates/shopify/sections/`:
   - `landing-hero.liquid`
   - `landing-section-1.liquid`
   - `landing-section-2.liquid`
   - `landing-cta.liquid`
5. Salva ogni file

### 7.2 Carica template JSON

1. Nella stessa interfaccia, vai su "templates"
2. Clicca "Add a new template"
3. Seleziona "product"
4. Nome: "landing"
5. Copia il contenuto di `templates/shopify/templates/product.landing.json`
6. Salva

### 7.3 Verifica

1. Vai su un prodotto creato con l'app
2. L'URL dovrebbe essere: `https://your-shop.myshopify.com/products/product-handle`
3. La landing page dovrebbe mostrare tutte le sezioni con i metafields

## Troubleshooting

### Build Failed su Vercel

**Errore**: `Prisma schema not found`

**Soluzione**: Verifica che `prisma/schema.prisma` sia committato su git

---

**Errore**: `Cannot find module '@prisma/client'`

**Soluzione**: Aggiungi script `postinstall` in `package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Database Connection Failed

**Errore**: `Can't reach database server`

**Soluzione**:
- Verifica che `DATABASE_URL` in Vercel sia corretto
- Assicurati che includa `?sslmode=require`
- Verifica che NeonDB non sia in pausa (riattivalo dal dashboard)

### OAuth Redirect Failed

**Errore**: `Redirect URI mismatch`

**Soluzione**:
- Verifica che `NEXTAUTH_URL` in Vercel sia esattamente: `https://your-app.vercel.app`
- Verifica che nell'app Shopify il redirect URL sia: `https://your-app.vercel.app/api/auth/callback`
- NO trailing slash!

### Images Not Loading

**Errore**: Images show broken icon

**Soluzione**:
- Verifica che `next.config.ts` includa:
  ```ts
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  }
  ```

### Metafields Not Showing

**Errore**: Landing page is blank

**Soluzione**:
- Verifica che i file Liquid siano stati caricati su Shopify
- Verifica che il template `product.landing.json` esista
- Verifica che il prodotto abbia `templateSuffix: "landing"`
- Controlla i metafields nel prodotto su Shopify Admin

## Performance Tips

### 1. Enable Edge Runtime (opzionale)

Aggiungi in `app/api/*/route.ts`:

```ts
export const runtime = 'edge';
```

### 2. Caching

Aggiungi caching per le chiamate Shopify:

```ts
import { unstable_cache } from 'next/cache';

const getCachedProducts = unstable_cache(
  async (shopId) => {
    // fetch products
  },
  ['products'],
  { revalidate: 3600 } // 1 hour
);
```

### 3. Image Optimization

Usa sempre Next.js `<Image>` component per immagini Shopify.

## Monitoring

### Vercel Analytics

1. Vai su Vercel Dashboard
2. Seleziona il progetto
3. Vai su "Analytics"
4. Abilita analytics

### Error Tracking

Considera di aggiungere Sentry:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## Backup Database

### NeonDB Backup

NeonDB fa backup automatici. Per export manuale:

```bash
# Usa pgdump
pg_dump $DATABASE_URL > backup.sql
```

## Update e Manutenzione

### Update Dependencies

```bash
npm update
npm audit fix
```

### Redeploy

Ogni push su `main` triggera un nuovo deploy automatico su Vercel.

Per forzare redeploy:
1. Vercel Dashboard > Deployments
2. Clicca sui 3 puntini > "Redeploy"

## Security Checklist

- [ ] `.env` non è committato su git
- [ ] `NEXTAUTH_SECRET` è random e sicuro
- [ ] Shopify API Secret non è esposto nel frontend
- [ ] CORS è configurato correttamente
- [ ] Rate limiting implementato (opzionale ma consigliato)
- [ ] Input validation su tutte le API routes
- [ ] HTTPS enabled (automatico su Vercel)

## Support

Per problemi:
- Check logs su Vercel Dashboard > Logs
- Check database su NeonDB Dashboard
- Check Shopify API logs su Shopify Admin > Apps > [Your App] > API calls

## Costi

- **Vercel**: Free tier (100GB bandwidth, illimitati deploy)
- **NeonDB**: Free tier (0.5GB storage, 100 hours compute/mese)
- **Shopify**: Dipende dal tuo piano

Per produzione, considera:
- Vercel Pro: $20/mese
- NeonDB Pro: $19/mese
