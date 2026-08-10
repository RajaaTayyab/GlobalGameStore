-- ============================================================
-- GlobalGameStore - Catalog seed: PSN · Xbox · iTunes · Razer Gold · Yalla Live · TikTok
--
-- Adds the categories and products the storefront now references.
-- Idempotent (upserts on unique slugs), safe to re-run.
-- NOTE: run this in a FRESH Supabase SQL Editor window (stale editor buffers
-- cause 42601 syntax errors). Variants + redeemable codes are added through the
-- admin panel after the products exist.
-- ============================================================

-- ---------- Categories ----------
insert into public.categories (name, slug, image_url, sort_order, active)
values
  ('PSN',       'psn',        null,                   10, true),
  ('iTunes',    'itunes',     null,                   30, true),
  ('Yalla Live','yalla-live', '/images/yalla-ludo.webp', 40, true),
  ('TikTok',    'tiktok',     null,                   50, true),
  ('Razer Gold','razer-gold', '/images/razer-gold.webp', 20, true)
on conflict (slug) do update set
  name       = excluded.name,
  image_url  = excluded.image_url,
  sort_order = excluded.sort_order,
  active     = true;

-- ---------- Products ----------
-- Each product is global — the storefront merely *features* them in some
-- regions. region_id stays NULL (global) so every product appears everywhere.
-- Images point at /public/images placeholders; swap for Supabase Storage URLs
-- in the admin panel when real art is ready.
with c as (select id, slug from public.categories)
insert into public.products (name, slug, description, image_url, category_id, region_id, featured, active)
select
  v.name, v.slug, v.description, v.image_url,
  c.id, null, v.featured, true
from (values
  ('PSN Gift Card', 'psn',
   'PlayStation Network gift cards, ready to redeem.',
   '/images/playstation.webp', 'psn', false),
  ('iTunes Gift Card', 'itunes',
   'App Store / iTunes gift cards, ready to redeem.',
   null, 'itunes', false),
  ('Yalla Live Coins', 'yalla-live',
   'Top up Yalla Live coins instantly.',
   '/images/yalla-ludo.webp', 'yalla-live', false),
  ('TikTok Coins', 'tiktok',
   'Top up TikTok coins instantly.',
   null, 'tiktok', false),
  ('Razer Gold', 'razer-gold-global',
   'Razer Gold gift cards — spend across thousands of games.',
   '/images/razer-gold.webp', 'razer-gold', false)
) as v(name, slug, description, image_url, cat_slug, featured)
join c on c.slug = v.cat_slug
on conflict (slug) do update set
  name        = excluded.name,
  description = excluded.description,
  image_url   = excluded.image_url,
  category_id = excluded.category_id,
  region_id   = excluded.region_id,
  featured    = excluded.featured,
  active      = true;
