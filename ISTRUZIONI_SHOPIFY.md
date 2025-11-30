# 🎯 Istruzioni per Shopify - UN SOLO FILE da caricare

## ✅ Cosa hai già fatto:
- ✅ Creato Custom App su Shopify
- ✅ Configurato API credentials
- ✅ Database NeonDB connesso
- ✅ App Next.js funzionante su http://localhost:3000

## 📂 Cosa devi fare SU SHOPIFY (una volta sola):

### Step 1: Apri l'Editor di Codice

1. Vai su **Shopify Admin**
2. Vai su **Online Store** > **Themes**
3. Trova il tuo tema attivo
4. Clicca su **Actions** > **Edit code**

### Step 2: Trova o Crea il file `product-main.liquid`

Nella sidebar sinistra, vai su **Sections** e cerca `product-main.liquid`

**Opzione A: Il file esiste già**
- Clicca su `product-main.liquid`
- **COPIA TUTTO IL CONTENUTO ESISTENTE** in un file di backup (per sicurezza)

**Opzione B: Il file non esiste**
- Clicca su "Add a new section"
- Chiamalo `product-main`

### Step 3: Sostituisci il contenuto

1. Apri il file: `C:\shopauto\templates\shopify\product-main-MODIFIED.liquid`
2. **Copia tutto il contenuto** (Ctrl+A, Ctrl+C)
3. Vai su Shopify editor
4. **Cancella tutto** il contenuto esistente in `product-main.liquid`
5. **Incolla** il nuovo codice
6. Clicca **Save** (in alto a destra)

## ✅ FATTO! Nient'altro da fare su Shopify.

---

## 🚀 Come usare l'app:

### 1. Apri il Dashboard

Vai su: **http://localhost:3000/dashboard**

### 2. Inserisci il tuo Shop ID

Nel campo "Select Shop", inserisci:
```
cmikin8iv0000w8fsttf09u32
```

### 3. Crea un prodotto

1. Clicca **"+ Create New Product"**
2. Compila almeno:
   - **Titolo prodotto** (obbligatorio)
   - **Prezzo**
   - **Hero Title** (es: "Scopri l'Eleganza")
   - **Hero Subtitle** (es: "Il prodotto che cercavi")
   - **Carica un'immagine Hero**

3. (Opzionale) Compila sezioni 1, 2, 3 con testi e immagini
4. Clicca **"🚀 Crea Prodotto"**

### 4. L'app farà automaticamente:

- ✅ Crea il prodotto su Shopify
- ✅ Imposta `templateSuffix: "landing"`
- ✅ Carica tutte le immagini su Shopify CDN
- ✅ Salva tutti i metafields in `product.metafields.landing.*`

### 5. Visualizza la Landing Page

Dopo la creazione, vai su:
```
https://udr1ng-1i.myshopify.com/products/[handle-del-prodotto]
```

(L'handle è il titolo del prodotto in lowercase con trattini, es: "Bracciale Elegante" → `bracciale-elegante`)

---

## 📋 Metafields Supportati

Il template legge automaticamente questi metafields:

**Hero:**
- `landing.hero_title`
- `landing.hero_subtitle`
- `landing.hero_image`

**CTA & Scarcity:**
- `landing.scarcity_text`
- `landing.cta_button_text`
- `landing.sticky_cta_text`

**Icons:**
- `landing.icon1_text`
- `landing.icon2_text`
- `landing.icon3_text`

**Sezioni (1, 2, 3):**
- `landing.section1_title`
- `landing.section1_text`
- `landing.section1_image`
- (stessa struttura per section2 e section3)

**Reviews:**
- `landing.reviews_title`
- `landing.review1_text`
- `landing.review2_text`

---

## 🎨 Come funziona il Template

Il file `product-main.liquid` ha questa logica:

```liquid
{% if template.suffix != 'landing' %}
  {%- Mostra il template normale del prodotto -%}
{% endif %}

{% if template.suffix == 'landing' %}
  {%- Mostra la landing page custom con i metafields -%}
{% endif %}
```

**Quindi:**
- Prodotti NORMALI → Usano il template standard del tema
- Prodotti con suffix "landing" → Usano la landing page custom

L'app imposta automaticamente `templateSuffix: "landing"` quando crei prodotti.

---

## 🔧 Modificare il Design

Se vuoi cambiare colori, font, layout:

1. Vai su Shopify Editor
2. Apri `sections/product-main.liquid`
3. Modifica la sezione `<style>` dentro il blocco `{% if template.suffix == 'landing' %}`
4. Salva

Esempio: Cambiare colore del bottone CTA:
```css
.cta-button {
  background-color: #ff0000; /* Rosso invece di nero */
}
```

---

## ❓ Troubleshooting

### Il prodotto non mostra la landing

**Verifica:**
1. Il prodotto ha `templateSuffix: "landing"`? (controlla su Shopify Admin > Prodotti > [tuo prodotto] > Theme template)
2. Il file `product-main.liquid` è stato salvato correttamente?
3. I metafields sono stati salvati? (controlla su Shopify Admin > Prodotti > [tuo prodotto] > Metafields)

### Le immagini non si caricano

**Verifica:**
- L'app ha permessi `write_files` su Shopify?
- Le immagini sono in formato supportato? (JPG, PNG, WebP)
- Le immagini sono < 20MB?

### Errore "Shop not found"

**Verifica:**
- Stai usando il corretto Shop ID: `cmikin8iv0000w8fsttf09u32`
- Il database è connesso? (apri http://localhost:5555 e verifica che ci sia lo shop)

---

## 📞 Supporto

Se hai problemi:

1. Controlla i **logs** del server Next.js nel terminale
2. Controlla la **Console del browser** (F12) per errori JavaScript
3. Verifica che il server sia avviato: http://localhost:3000

---

## 🎉 Tutto Pronto!

Hai tutto il necessario per creare landing page professionali senza mai toccare il codice Shopify manualmente.

**Workflow completo:**
1. Apri l'app → http://localhost:3000/dashboard
2. Inserisci Shop ID
3. Compila il form
4. Crea prodotto
5. Visualizza su Shopify

**Zero click necessari su Shopify!** 🚀
