/**
 * Seed script for GlobalGameStore.
 *
 * Usage:
 *   1. Copy .env.example to .env.local and fill in Supabase keys.
 *   2. Run the Supabase schema from supabase/schema.sql in the SQL editor.
 *   3. node --env-file=.env.local scripts/seed.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const IMG = "https://globalgamestore.com/wp-content/uploads";
const img = (path) => `${IMG}/${path}`;

async function main() {
  console.log("Seeding GlobalGameStore…\n");

  // ---------- Regions ----------
  const regions = [
    { code: "pk", name: "Pakistan", countries: ["PK"], sort_order: 1 },
    {
      code: "mena",
      name: "Middle East",
      countries: ["AE", "SA", "QA", "KW", "BH", "OM", "IQ", "JO", "LB", "EG", "SY", "YE", "PS"],
      sort_order: 2,
    },
    { code: "us", name: "USA", countries: ["US"], sort_order: 3 },
    { code: "global", name: "Global", countries: [], sort_order: 4 },
  ];
  const { data: regionRows, error: regErr } = await admin
    .from("regions")
    .upsert(regions, { onConflict: "code" })
    .select();
  if (regErr) throw regErr;
  const regionId = Object.fromEntries(regionRows.map((r) => [r.code, r.id]));
  console.log(`Regions: ${regionRows.length}`);

  // ---------- Categories ----------
  const categories = [
    { name: "Free Fire", slug: "free-fire", image_url: img("2026/06/freefire.webp"), sort_order: 1 },
    { name: "PUBG Mobile", slug: "pubg-mobile", image_url: img("2026/06/pubgmobile.webp"), sort_order: 2 },
    { name: "PlayStation", slug: "playstation", image_url: img("2026/06/20250909_000808_0000-1.webp"), sort_order: 3 },
    { name: "Xbox", slug: "xbox", image_url: img("2026/06/XBox.webp"), sort_order: 4 },
    { name: "Razer Gold", slug: "razer-gold", image_url: img("2026/06/razer-gold.webp"), sort_order: 5 },
    { name: "Nintendo", slug: "nintendo", image_url: img("2026/06/Untitled-design-2.webp"), sort_order: 6 },
    { name: "Yalla Ludo", slug: "yalla-ludo", image_url: img("2020/10/yalla-ludo.webp"), sort_order: 7 },
    { name: "Jawaker", slug: "jawaker", image_url: img("2020/10/Jawaker-Pins.webp"), sort_order: 8 },
  ];
  const { data: catRows, error: catErr } = await admin
    .from("categories")
    .upsert(categories, { onConflict: "slug" })
    .select();
  if (catErr) throw catErr;
  const catId = Object.fromEntries(catRows.map((c) => [c.slug, c.id]));
  console.log(`Categories: ${catRows.length}`);

  // ---------- Products + variants + codes ----------
  const products = [
    {
      name: "PUBG Mobile",
      slug: "pubg-mobile",
      description:
        "PUBG Mobile UC top-ups delivered instantly. Choose your UC package and get your code right after payment.",
      image_url: img("2026/06/pubgmobile.webp"),
      category: "pubg-mobile",
      region: "pk",
      featured: true,
      variants: [
        { name: "60 UC", price: 0.93, original: 1.05, codes: ["PK-UC60-AAAA-1111", "PK-UC60-BBBB-2222"] },
        { name: "300 UC", price: 4.5, original: 5.0, codes: ["PK-UC300-CCCC-3333", "PK-UC300-DDDD-4444"] },
        { name: "660 UC", price: 9.5, original: 10.5, codes: ["PK-UC660-EEEE-5555"] },
      ],
    },
    {
      name: "Free Fire",
      slug: "free-fire",
      description:
        "Free Fire diamonds top-ups for all servers. Instant digital delivery after payment.",
      image_url: img("2026/06/freefire.webp"),
      category: "free-fire",
      region: "pk",
      featured: true,
      variants: [
        { name: "100 Diamonds", price: 0.97, original: 1.1, codes: ["FF-100-AAAA-1111", "FF-100-BBBB-2222"] },
        { name: "520 Diamonds", price: 4.85, original: 5.4, codes: ["FF-520-CCCC-3333"] },
        { name: "1080 Diamonds", price: 9.7, original: 10.8, codes: ["FF-1080-DDDD-4444"] },
      ],
    },
    {
      name: "Yalla Ludo Pins",
      slug: "yalla-ludo",
      description:
        "Yalla Ludo top-up pins for MENA players. Instant delivery, best prices in the region.",
      image_url: img("2020/10/yalla-ludo.webp"),
      category: "yalla-ludo",
      region: "mena",
      featured: true,
      variants: [
        { name: "1M Chips", price: 1.84, original: 2.1, codes: ["YL-1M-AAAA-1111"] },
        { name: "5M Chips", price: 9.2, original: 10.5, codes: ["YL-5M-BBBB-2222"] },
      ],
    },
    {
      name: "Jawaker Pins",
      slug: "jawaker",
      description:
        "Jawaker game pins for Middle East players. Fast and reliable top-up delivery.",
      image_url: img("2020/10/Jawaker-Pins.webp"),
      category: "jawaker",
      region: "mena",
      featured: true,
      variants: [
        { name: "50K Coins", price: 0.86, original: 1.0, codes: ["JW-50K-AAAA-1111"] },
        { name: "200K Coins", price: 3.5, original: 4.0, codes: ["JW-200K-BBBB-2222"] },
      ],
    },
    {
      name: "PlayStation USA",
      slug: "playstation-usa",
      description:
        "PlayStation Store USA gift cards. Instant codes delivered to your email.",
      image_url: img("2026/06/20250909_000808_0000-1.webp"),
      category: "playstation",
      region: "us",
      featured: true,
      variants: [
        { name: "$10 Card", price: 9.5, original: 10.0, codes: ["PSN-US-10-AAAA-1111"] },
        { name: "$50 Card", price: 47.5, original: 50.0, codes: ["PSN-US-50-BBBB-2222"] },
        { name: "$100 Card", price: 95.0, original: 100.0, codes: ["PSN-US-100-CCCC-3333"] },
      ],
    },
    {
      name: "Xbox",
      slug: "xbox",
      description:
        "Xbox gift cards for USA accounts. Redeem instantly for games, DLC and more.",
      image_url: img("2026/06/XBox.webp"),
      category: "xbox",
      region: "us",
      featured: false,
      variants: [{ name: "$25 Card", price: 24.0, original: 25.0, codes: ["XBOX-US-25-AAAA-1111"] }],
    },
    {
      name: "Nintendo eShop USA Gift Cards",
      slug: "nintendo-eshop-usa",
      description:
        "Nintendo eShop USA gift cards. Perfect for Switch games and DLC.",
      image_url: img("2026/06/Untitled-design-2.webp"),
      category: "nintendo",
      region: "us",
      featured: false,
      variants: [{ name: "$5 Card", price: 5.0, original: null, codes: ["NINT-US-5-AAAA-1111"] }],
    },
    {
      name: "Razer Gold Global",
      slug: "razer-gold-global",
      description:
        "Razer Gold PINs valid worldwide. Use for 1000+ games, apps and gift cards.",
      image_url: img("2026/06/razer-gold.webp"),
      category: "razer-gold",
      region: "global",
      featured: true,
      variants: [
        { name: "$1 PIN", price: 0.95, original: 1.0, codes: ["RZ-GLB-1-AAAA-1111"] },
        { name: "$5 PIN", price: 4.75, original: 5.0, codes: ["RZ-GLB-5-BBBB-2222"] },
        { name: "$10 PIN", price: 9.5, original: 10.0, codes: ["RZ-GLB-10-CCCC-3333"] },
      ],
    },
  ];

  for (const p of products) {
    const { data: existing } = await admin
      .from("products")
      .select("id")
      .eq("slug", p.slug)
      .maybeSingle();
    let productId = existing?.id;
    if (!productId) {
      const { data, error } = await admin
        .from("products")
        .insert({
          name: p.name,
          slug: p.slug,
          description: p.description,
          image_url: p.image_url,
          category_id: catId[p.category],
          region_id: regionId[p.region],
          featured: p.featured,
        })
        .select()
        .single();
      if (error) throw error;
      productId = data.id;
    } else {
      await admin.from("products").update({ featured: p.featured }).eq("id", productId);
    }

    for (const v of p.variants) {
      const { data: vRow } = await admin
        .from("product_variants")
        .select("id")
        .eq("product_id", productId)
        .eq("name", v.name)
        .maybeSingle();
      let variantId = vRow?.id;
      if (!variantId) {
        const { data: inserted, error } = await admin
          .from("product_variants")
          .insert({
            product_id: productId,
            name: v.name,
            price: v.price,
            original_price: v.original ?? null,
          })
          .select()
          .single();
        if (error) throw error;
        variantId = inserted.id;
      }
      for (const code of v.codes ?? []) {
        const { data: cRow } = await admin
          .from("codes")
          .select("id")
          .eq("code", code)
          .maybeSingle();
        if (!cRow) {
          await admin.from("codes").insert({ variant_id: variantId, code });
        }
      }
    }
    console.log(`  Product: ${p.name}`);
  }

  // ---------- Settings ----------
  await admin
    .from("settings")
    .upsert([
      { key: "whatsapp_number", value: process.env.WHATSAPP_NUMBER || "15551234567" },
      { key: "store_name", value: "GlobalGameStore" },
    ]);
  console.log("Settings saved");

  // ---------- Demo users (optional) ----------
  const demoPassword = process.env.SEED_DEMO_PASSWORD || "demo1234";
  for (const u of [
    { email: "admin@globalgamestore.com", name: "Store Admin", role: "admin" },
    { email: "player@example.com", name: "Demo Player", role: "user" },
  ]) {
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = existing.users.find((x) => x.email === u.email);
    if (!found) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: demoPassword,
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });
      if (error) {
        console.error(`  Could not create ${u.email}: ${error.message}`);
        continue;
      }
      await admin
        .from("profiles")
        .update({ role: u.role, full_name: u.name, credits_balance: u.role === "user" ? 50 : 0 })
        .eq("id", created.user.id);
      console.log(`  Demo user: ${u.email} (${u.role}, password: ${demoPassword})`);
    } else {
      console.log(`  Demo user already exists: ${u.email}`);
    }
  }

  console.log("\nDone! Start the app with: npm run dev");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
