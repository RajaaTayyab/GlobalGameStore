-- ============================================================
-- catalog_update.sql — full catalog refresh
-- Source: ALL_PRODUCTS_WITH_RATES.xlsx
-- Currency: USDT charged. Images: local public/images only.
-- 6 regions: pk, us, sa, ae, kw, global (mena removed).
-- Variant names show only the reward (e.g. "SAR 50 Amazon (KSA)").
-- Frontend (ProductBuy.tsx) already renders price separately via
-- formatPrice(v.price), so name no longer repeats "X USDT —" —
-- that was causing the duplicate price shown in your screenshot.
-- Added: Nintendo eShop (US) — was in xlsx, missing from old SQL.
-- NOTE: run in a FRESH SQL Editor window.
-- ============================================================

-- ---------- 1. Regions ----------
insert into public.regions (code, name, countries, sort_order)
values
  ('pk', 'Pakistan', array['PK']::text[], 0),
  ('us', 'USA', array['US']::text[], 1),
  ('sa', 'Saudi Arabia', array['SA']::text[], 2),
  ('ae', 'UAE', array['AE']::text[], 3),
  ('kw', 'Kuwait', array['KW']::text[], 4),
  ('global', 'Global', '{}'::text[], 5)
on conflict (code) do update set
  name = excluded.name,
  countries = excluded.countries,
  sort_order = excluded.sort_order;

-- ---------- 2. Categories ----------
insert into public.categories (name, slug, sort_order, active, image_url)
values
  ('Yalla Ludo', 'yalla-ludo', 5, true, '/images/yalla ludo.jpeg'),
  ('Free Fire', 'free-fire', 15, true, '/images/Free-Fire.jpg'),
  ('Yalla Live', 'yalla-live', 25, true, '/images/Yala live.png'),
  ('PUBG Mobile Global', 'pubg-mobile', 35, true, '/images/pubg-mobile.jpg'),
  ('Jawaker', 'jawaker', 45, true, '/images/Jawaker.jpeg'),
  ('TikTok', 'tiktok', 55, true, '/images/tiktok.png'),
  ('Apple Gift Cards', 'itunes', 65, true, '/images/Apple_Card.png'),
  ('Xbox Gift Cards', 'xbox', 75, true, '/images/xbox.png'),
  ('PlayStation Gift Cards', 'psn', 85, true, '/images/psn.png'),
  ('Nintendo eShop', 'nintendo-eshop', 90, true, '/images/nintendo.png'),
  ('Netflix', 'netflix', 95, true, '/images/Netflix.png'),
  ('NordVPN Standard', 'nordvpn', 105, true, '/images/nord-vpn.png'),
  ('Surfshark VPN', 'surfshark', 110, true, '/images/surfshark.png'),
  ('Amazon Gift Cards', 'amazon', 115, true, '/images/Amazon.png'),
  ('Noon Gift Cards', 'noon', 125, true, '/images/noon.png')
on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  active = true,
  image_url = excluded.image_url;

-- ---------- 3. Delete ALL previous product entries ----------
-- Cascades to product_variants and codes. Orders untouched
-- (order_items/order_codes keep their own name/price copy).
delete from public.products;

-- ---------- 4. Insert products ----------
with cat as (select id, slug from public.categories),
     reg as (select id, code from public.regions)
insert into public.products (name, slug, description, category_id, region_id, active, image_url)
select v.name, v.slug, v.description, cat.id, reg.id, true, v.image_url
from (values
  ('Yalla Ludo', 'yalla-ludo', 'Top up Yalla Ludo Gold & Diamond instantly.', 'yalla-ludo', NULL::text, '/images/yalla ludo.jpeg'),
  ('Free Fire', 'free-fire', 'Top up Free Fire Diamonds instantly.', 'free-fire', NULL::text, '/images/Free-Fire.jpg'),
  ('Yalla Live', 'yalla-live', 'Top up Yalla Live coins instantly.', 'yalla-live', NULL::text, '/images/Yala live.png'),
  ('PUBG Mobile Global', 'pubg-mobile', 'PUBG Mobile Global UC top-up.', 'pubg-mobile', NULL::text, '/images/pubg-mobile.jpg'),
  ('Jawaker', 'jawaker', 'Jawaker token top-up.', 'jawaker', NULL::text, '/images/Jawaker.jpeg'),
  ('TikTok', 'tiktok', 'Top up TikTok coins instantly.', 'tiktok', NULL::text, '/images/tiktok.png'),
  ('Apple Gift Card', 'itunes', 'App Store gift cards, ready to redeem.', 'itunes', NULL::text, '/images/Apple_Card.png'),
  ('Xbox Gift Card (USA)', 'xbox', 'Xbox Gift Card, USA region.', 'xbox', 'us'::text, '/images/xbox.png'),
  ('Xbox Gift Card (KSA)', 'xbox-ksa', 'Xbox Gift Card, Saudi Arabia region.', 'xbox', 'sa'::text, '/images/xbox.png'),
  ('PlayStation Gift Card (USA)', 'psn', 'PlayStation Network gift card, USA region.', 'psn', 'us'::text, '/images/psn.png'),
  ('PlayStation Gift Card (UAE)', 'psn-uae', 'PlayStation Network gift card, UAE region.', 'psn', 'ae'::text, '/images/psn.png'),
  ('PlayStation Gift Card (Kuwait)', 'psn-kuwait', 'PlayStation Network gift card, Kuwait region.', 'psn', 'kw'::text, '/images/psn.png'),
  ('PlayStation Gift Card (KSA)', 'psn-ksa', 'PlayStation Network gift card, Saudi Arabia region.', 'psn', 'sa'::text, '/images/psn.png'),
  ('Nintendo eShop (USA)', 'nintendo-eshop-us', 'Nintendo eShop gift card, USA region.', 'nintendo-eshop', 'us'::text, '/images/nintendo.png'),
  ('Netflix Gift Card (KSA)', 'netflix-ksa', 'Netflix gift card, Saudi Arabia region.', 'netflix', 'sa'::text, '/images/Netflix.png'),
  ('Netflix Gift Card (UAE)', 'netflix-uae', 'Netflix gift card, UAE region.', 'netflix', 'ae'::text, '/images/Netflix.png'),
  ('NordVPN Standard', 'nordvpn-standard', 'NordVPN Standard subscription.', 'nordvpn', NULL::text, '/images/nord-vpn.png'),
  ('Surfshark VPN', 'surfshark-vpn', 'Surfshark VPN subscription.', 'surfshark', NULL::text, '/images/surfshark.png'),
  ('Amazon Gift Card (KSA)', 'amazon-ksa', 'Amazon gift card, Saudi Arabia region.', 'amazon', 'sa'::text, '/images/Amazon.png'),
  ('Amazon Gift Card (UAE)', 'amazon-uae', 'Amazon gift card, UAE region.', 'amazon', 'ae'::text, '/images/Amazon.png'),
  ('Noon Gift Card (KSA)', 'noon-sa', 'Noon gift card, Saudi Arabia region.', 'noon', 'sa'::text, '/images/noon.png'),
  ('Noon Gift Card (UAE)', 'noon-ae', 'Noon gift card, UAE region.', 'noon', 'ae'::text, '/images/noon.png')
) as v(name, slug, description, cat_slug, region_code, image_url)
join cat on cat.slug = v.cat_slug
left join reg on reg.code = v.region_code
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category_id = excluded.category_id,
  region_id = excluded.region_id,
  active = true,
  image_url = excluded.image_url;

-- ---------- 5. Insert variants ----------
-- name = reward only; price column drives the USDT display
with prod as (select id, slug from public.products)
insert into public.product_variants (product_id, name, price, active)
select prod.id, v.name, v.price, true
from (values
  ('yalla-ludo', 'Yalla Ludo $2 (68,500 Gold)', 1.86),
  ('yalla-ludo', 'Yalla Ludo $5 (223,700 Gold)', 4.65),
  ('yalla-ludo', 'Yalla Ludo $10 (1,463,320 Gold)', 9.3),
  ('yalla-ludo', 'Yalla Ludo $25 (3,666,470 Gold)', 23.25),
  ('yalla-ludo', 'Yalla Ludo $50 (9,973,990 Gold)', 46.5),
  ('yalla-ludo', 'Yalla Ludo $100 (25,236,460 Gold)', 93.0),
  ('yalla-ludo', 'Yalla Ludo $300 (76,000,860 Gold)', 279.0),
  ('yalla-ludo', 'Yalla Ludo $500 (126,910,990 Gold)', 465.0),
  ('yalla-ludo', 'Yalla Ludo $2 (830 Diamond)', 1.86),
  ('yalla-ludo', 'Yalla Ludo $5 (2,320 Diamond)', 4.65),
  ('yalla-ludo', 'Yalla Ludo $10 (5,150 Diamond)', 9.3),
  ('yalla-ludo', 'Yalla Ludo $25 (13,580 Diamond)', 23.25),
  ('yalla-ludo', 'Yalla Ludo $50 (27,640 Diamond)', 46.5),
  ('yalla-ludo', 'Yalla Ludo $100 (55,800 Diamond)', 93.0),
  ('yalla-ludo', 'Yalla Ludo $300 (168,860 Diamond)', 279.0),
  ('yalla-ludo', 'Yalla Ludo $500 (283,460 Diamond)', 465.0),
  ('free-fire', 'Free Fire $1 (100 Diamonds)', 0.94),
  ('free-fire', 'Free Fire $2 (210 Diamonds)', 1.88),
  ('free-fire', 'Free Fire $5 (530 Diamonds)', 4.7),
  ('free-fire', 'Free Fire $10 (1,080 Diamonds)', 9.4),
  ('free-fire', 'Free Fire $20 (2,200 Diamonds)', 18.8),
  ('yalla-live', 'Yalla Live $25 (2,900 Gold)', 23.5),
  ('yalla-live', 'Yalla Live $50 (5,900 Gold)', 47.0),
  ('yalla-live', 'Yalla Live $100 (12,500 Gold)', 94.0),
  ('pubg-mobile', '60 UC', 0.9),
  ('pubg-mobile', '325 UC', 4.5),
  ('pubg-mobile', '660 UC', 9.0),
  ('pubg-mobile', '1,800 UC', 22.5),
  ('pubg-mobile', '3,850 UC', 45.0),
  ('pubg-mobile', '8,100 UC', 90.0),
  ('pubg-mobile', '16,200 UC', 180.0),
  ('pubg-mobile', '24,300 UC', 270.0),
  ('pubg-mobile', '32,400 UC', 360.0),
  ('pubg-mobile', '40,500 UC', 450.0),
  ('jawaker', '4,250 Token', 0.87),
  ('jawaker', '32,500 Token', 4.35),
  ('jawaker', '70,000 Token', 8.7),
  ('jawaker', '150,000 Token', 17.4),
  ('jawaker', '230,000 Token', 26.1),
  ('jawaker', '400,000 Token', 43.5),
  ('jawaker', '525,000 Token', 56.55),
  ('jawaker', '805,000 Token', 87.0),
  ('tiktok', '7,000 Coins', 75.0),
  ('tiktok', '14,000 Coins', 150.0),
  ('tiktok', '21,000 Coins', 225.0),
  ('tiktok', '28,000 Coins', 300.0),
  ('tiktok', '35,000 Coins', 375.0),
  ('tiktok', '42,000 Coins', 450.0),
  ('tiktok', '49,000 Coins', 525.0),
  ('tiktok', '56,000 Coins', 600.0),
  ('tiktok', '63,000 Coins', 675.0),
  ('tiktok', '70,000 Coins', 750.0),
  ('itunes', '$5 Apple Gift Card', 4.8),
  ('itunes', '$10 Apple Gift Card', 9.6),
  ('itunes', '$20 Apple Gift Card', 19.2),
  ('itunes', '$50 Apple Gift Card', 48.0),
  ('itunes', '$100 Apple Gift Card', 96.0),
  ('itunes', '$200 Apple Gift Card', 192.0),
  ('itunes', '$400 Apple Gift Card', 384.0),
  ('xbox', '$15 Xbox Gift Card', 13.5),
  ('xbox', '$25 Xbox Gift Card', 22.5),
  ('xbox', '$50 Xbox Gift Card', 45.0),
  ('xbox', '$100 Xbox Gift Card', 90.0),
  ('xbox-ksa', 'SAR 50 Xbox (KSA)', 14.0),
  ('xbox-ksa', 'SAR 100 Xbox (KSA)', 26.0),
  ('xbox-ksa', 'SAR 200 Xbox (KSA)', 50.0),
  ('xbox-ksa', 'SAR 300 Xbox (KSA)', 75.0),
  ('psn', '$25 PSN (USA)', 23.0),
  ('psn', '$50 PSN (USA)', 46.0),
  ('psn', '$75 PSN (USA)', 69.0),
  ('psn', '$100 PSN (USA)', 92.0),
  ('psn', '$150 PSN (USA)', 138.0),
  ('psn', '$200 PSN (USA)', 184.0),
  ('psn', '$250 PSN (USA)', 230.0),
  ('psn-uae', '$10 PSN (UAE)', 9.2),
  ('psn-uae', '$20 PSN (UAE)', 18.4),
  ('psn-uae', '$50 PSN (UAE)', 46.0),
  ('psn-uae', '$100 PSN (UAE)', 92.0),
  ('psn-uae', '$120 PSN (UAE)', 110.4),
  ('psn-uae', '$160 PSN (UAE)', 147.2),
  ('psn-uae', '$200 PSN (UAE)', 184.0),
  ('psn-kuwait', '$10 PSN (Kuwait)', 9.2),
  ('psn-kuwait', '$20 PSN (Kuwait)', 18.4),
  ('psn-kuwait', '$50 PSN (Kuwait)', 46.0),
  ('psn-kuwait', '$100 PSN (Kuwait)', 92.0),
  ('psn-kuwait', '$120 PSN (Kuwait)', 110.4),
  ('psn-kuwait', '$160 PSN (Kuwait)', 147.2),
  ('psn-kuwait', '$200 PSN (Kuwait)', 184.0),
  ('psn-ksa', '$10 PSN (KSA)', 9.6),
  ('psn-ksa', '$20 PSN (KSA)', 19.2),
  ('psn-ksa', '$50 PSN (KSA)', 48.0),
  ('psn-ksa', '$100 PSN (KSA)', 96.0),
  ('psn-ksa', '$120 PSN (KSA)', 115.2),
  ('psn-ksa', '$160 PSN (KSA)', 153.6),
  ('psn-ksa', '$200 PSN (KSA)', 192.0),
  ('nintendo-eshop-us', '$10 Nintendo eShop (US)', 9.0),
  ('nintendo-eshop-us', '$20 Nintendo eShop (US)', 18.0),
  ('nintendo-eshop-us', '$35 Nintendo eShop (US)', 31.5),
  ('nintendo-eshop-us', '$50 Nintendo eShop (US)', 45.0),
  ('netflix-ksa', 'SAR 100 Netflix (KSA)', 26.0),
  ('netflix-ksa', 'SAR 150 Netflix (KSA)', 39.0),
  ('netflix-ksa', 'SAR 200 Netflix (KSA)', 50.0),
  ('netflix-ksa', 'SAR 250 Netflix (KSA)', 62.0),
  ('netflix-ksa', 'SAR 300 Netflix (KSA)', 75.0),
  ('netflix-uae', 'AED 100 Netflix (UAE)', 26.0),
  ('netflix-uae', 'AED 150 Netflix (UAE)', 39.0),
  ('netflix-uae', 'AED 200 Netflix (UAE)', 50.0),
  ('netflix-uae', 'AED 250 Netflix (UAE)', 62.0),
  ('netflix-uae', 'AED 300 Netflix (UAE)', 75.0),
  ('nordvpn-standard', '1 Month NordVPN Standard', 13.0),
  ('nordvpn-standard', '6 Months NordVPN Standard', 37.0),
  ('nordvpn-standard', '1 Year NordVPN Standard', 52.0),
  ('surfshark-vpn', '1 Month Surfshark', 15.0),
  ('surfshark-vpn', '6 Months Surfshark', 35.0),
  ('surfshark-vpn', '12 Months Surfshark', 50.0),
  ('amazon-ksa', 'SAR 50 Amazon (KSA)', 14.0),
  ('amazon-ksa', 'SAR 100 Amazon (KSA)', 27.0),
  ('amazon-ksa', 'SAR 250 Amazon (KSA)', 67.0),
  ('amazon-ksa', 'SAR 500 Amazon (KSA)', 130.0),
  ('amazon-uae', 'AED 50 Amazon (UAE)', 14.0),
  ('amazon-uae', 'AED 100 Amazon (UAE)', 28.0),
  ('amazon-uae', 'AED 250 Amazon (UAE)', 68.0),
  ('amazon-uae', 'AED 500 Amazon (UAE)', 131.0),
  ('noon-sa', '$100 Noon (SA)', 27.0),
  ('noon-sa', '$250 Noon (SA)', 66.0),
  ('noon-sa', '$500 Noon (SA)', 130.0),
  ('noon-ae', '$100 Noon (AE)', 27.0),
  ('noon-ae', '$250 Noon (AE)', 66.0),
  ('noon-ae', '$500 Noon (AE)', 130.0)
) as v(product_slug, name, price)
join prod on prod.slug = v.product_slug;

-- ---------- 6. Cleanup: remove categories with no products ----------
delete from public.categories c
where not exists (
  select 1 from public.products p where p.category_id = c.id
);

-- ============================================================
-- Done. Stock (codes) empty for these products — add codes per
-- variant from admin panel before going live. Nintendo eShop
-- needs an image at public/images/nintendo.png (add or swap slug).
-- ============================================================