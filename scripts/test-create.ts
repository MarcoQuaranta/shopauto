// Script to test create-product API behavior

async function testCreate() {
  // Simulate what ProductForm sends
  const payload = {
    shopId: "cmikin8iv0000w8fsttf09u32",
    title: "Test Product " + Date.now(),
    price: 99.99,
    templateSuffix: "landing",
    metafields: {
      hero_overtitle: "",
      hero_title: "Test Hero Title",
      hero_subtitle: "Test subtitle",
      hero_image: "",
      about_title: "Chi Siamo",
      about_subtitle: "La nostra storia",
      scarcity_text: "💎 Ultime unità disponibili",
      cta_button_text: "ORDINA ORA",
      sticky_cta_text: "AGGIUNGI",
      icon1_text: "🇮🇹 Qualità Italiana",
      icon2_text: "🛡️ Garanzia 2 anni",
      icon3_text: "🔒 Pagamenti Sicuri",
      section1_overtitle: "",
      section1_title: "Sezione 1 Title",
      section1_text: "Testo della sezione 1",
      section1_bullets: "Bullet 1|Bullet 2",
      section1_image: "",
      section2_title: "",
      section2_text: "",
      section2_bullets: "",
      section2_image: "",
      section3_title: "",
      section3_text: "",
      section3_image: "",
      reviews_title: "Recensioni Clienti",
      review1_stars: "5",
      review1_author: "Mario R.",
      review1_text: "Prodotto eccellente!",
      review2_stars: "5",
      review2_author: "Luigi V.",
      review2_text: "Consigliato!",
      review3_stars: "4",
      review3_author: "Anna M.",
      review3_text: "Molto buono",
      text_block_subtitle: "La nostra promessa",
      text_block_description: "",
      text_block_image: "",
    },
  };

  console.log("Sending payload with metafields:");
  const nonEmpty = Object.entries(payload.metafields).filter(
    ([k, v]) => v !== "" && v !== null && v !== undefined
  );
  console.log("Non-empty metafields:", nonEmpty.length);
  nonEmpty.forEach(([k, v]) => console.log(`  ${k}: ${String(v).substring(0, 50)}`));

  const response = await fetch("http://localhost:3000/api/create-product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  console.log("\nResponse:", result);

  if (result.product?.shopifyId) {
    console.log("\nNow checking metafields on Shopify...");
    // Could query Shopify here to verify
  }
}

testCreate().catch(console.error);
