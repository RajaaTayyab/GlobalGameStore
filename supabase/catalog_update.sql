-- ============================================================
-- GlobalGameStore - Full catalog replace
-- Generated from ALL_PRODUCTS_WITH_RATES.xlsx
--
-- What this does:
--  1. Upserts the 7 regions (pk, mena, us, sa, ae, kw, global)
--  2. Upserts all categories used below
--  3. DELETES ALL existing products (full wipe, per user request) -
--     including any not in this sheet (e.g. Razer Gold). Cascades
--     via ON DELETE CASCADE to their variants + stock codes. Order
--     history is untouched (orders store their own name/price copy).
--  4. Re-inserts every product + variant fresh from the sheet.
--
-- IMPORTANT: prices below are exactly what was in the sheet (your
-- supplier/cost rate in USD). No markup has been applied - double
-- check these are the prices you want customers to pay before running
-- this against production.
--
-- Region-locked products (region_code below is not NULL) will now be
-- HIDDEN from visitors outside that region on the storefront (this
-- required a small code change in ProductGrid.tsx - see chat).
-- ============================================================

-- ---------- 1. Regions ----------
insert into public.regions (code, name, countries, sort_order)
values
  ('pk', 'Pakistan', array['PK']::text[], 0),
  ('mena', 'Middle East', array['QA','BH','OM','IQ','JO','LB','EG','SY','YE','PS']::text[], 1),
  ('us', 'USA', array['US']::text[], 2),
  ('sa', 'Saudi Arabia', array['SA']::text[], 3),
  ('ae', 'UAE', array['AE']::text[], 4),
  ('kw', 'Kuwait', array['KW']::text[], 5),
  ('global', 'Global', '{}'::text[], 6)

on conflict (code) do update set
  name = excluded.name,
  countries = excluded.countries,
  sort_order = excluded.sort_order;

-- ---------- 2. Categories ----------
insert into public.categories (name, slug, sort_order, active, image_url)
values
  ('Yalla Ludo', 'yalla-ludo', 5, true, '/images/yalla-ludo.webp'),
  ('Free Fire', 'free-fire', 15, true, '/images/freefire.webp'),
  ('Yalla Live', 'yalla-live', 40, true, '/images/yalla-live.jpeg'),
  ('PUBG Mobile', 'pubg-mobile', 25, true, '/images/pubg-mobile.jpg'),
  ('Jawaker', 'jawaker', 60, true, '/images/jawaker.webp'),
  ('TikTok', 'tiktok', 50, true, '/images/tiktok.png'),
  ('iTunes', 'itunes', 30, true, null),
  ('Xbox', 'xbox', 35, true, '/images/xbox.png'),
  ('PSN', 'psn', 10, true, '/images/playstation.jpg'),
  ('Netflix', 'netflix', 80, true, null),
  ('VPN', 'vpn', 90, true, '/images/nord-vpn.png'),
  ('Amazon Gift Cards', 'amazon', 100, true, null),
  ('Noon', 'noon', 110, true, null)

on conflict (slug) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  active = true,
  image_url = excluded.image_url;

-- ---------- 3. Delete ALL previous product entries ----------
-- Full wipe (per user confirmation) - removes every existing product,
-- including ones not in this sheet (e.g. Razer Gold). Cascades to
-- product_variants and codes automatically. Orders/order history are
-- untouched (order_items/order_codes store their own name/price copy
-- and do not FK-reference products).
delete from public.products;

-- ---------- 4. Insert products ----------
with cat as (select id, slug from public.categories),
     reg as (select id, code from public.regions)
insert into public.products (name, slug, description, category_id, region_id, active, image_url)
select v.name, v.slug, v.description, cat.id, reg.id, true, v.image_url
from (values
  ('Yalla Ludo Gold', 'yalla-ludo-gold', 'Top up Yalla Ludo Gold instantly.', 'yalla-ludo', NULL::text, '/images/yalla-ludo-gold.jpeg'),
  ('Yalla Ludo Diamond', 'yalla-ludo-diamond', 'Top up Yalla Ludo Diamonds instantly.', 'yalla-ludo', NULL::text, '/images/yalla-ludo-diamond.jpeg'),
  ('Free Fire', 'free-fire', 'Top up Free Fire Diamonds instantly.', 'free-fire', NULL::text, '/images/freefire.webp'),
  ('Yalla Live Coins', 'yalla-live', 'Top up Yalla Live coins instantly.', 'yalla-live', NULL::text, '/images/yalla-live.jpeg'),
  ('PUBG Mobile', 'pubg-mobile', 'PUBG Mobile Global UC top-up.', 'pubg-mobile', NULL::text, '/images/pubg-mobile.jpg'),
  ('Jawaker Pins', 'jawaker', 'Jawaker token top-up.', 'jawaker', NULL::text, '/images/jawaker.webp'),
  ('TikTok Coins', 'tiktok', 'Top up TikTok coins instantly.', 'tiktok', NULL::text, '/images/tiktok.png'),
  ('iTunes Gift Card', 'itunes', 'App Store / iTunes gift cards, ready to redeem.', 'itunes', NULL::text, NULL),
  ('Xbox Gift Card (USA)', 'xbox', 'Xbox Gift Card, USA region.', 'xbox', 'us'::text, '/images/xbox.png'),
  ('Xbox Gift Card (KSA)', 'xbox-ksa', 'Xbox Gift Card, Saudi Arabia region.', 'xbox', 'sa'::text, '/images/xbox.png'),
  ('PSN Gift Card (USA)', 'psn', 'PlayStation Network gift card, USA region.', 'psn', 'us'::text, '/images/playstation.jpg'),
  ('PSN Gift Card (UAE)', 'psn-uae', 'PlayStation Network gift card, UAE region.', 'psn', 'ae'::text, '/images/playstation.jpg'),
  ('PSN Gift Card (Kuwait)', 'psn-kuwait', 'PlayStation Network gift card, Kuwait region.', 'psn', 'kw'::text, '/images/playstation.jpg'),
  ('PSN Gift Card (KSA)', 'psn-ksa', 'PlayStation Network gift card, Saudi Arabia region.', 'psn', 'sa'::text, '/images/playstation.jpg'),
  ('Netflix Gift Card (KSA)', 'netflix-ksa', 'Netflix gift card, Saudi Arabia region.', 'netflix', 'sa'::text, NULL),
  ('Netflix Gift Card (UAE)', 'netflix-uae', 'Netflix gift card, UAE region.', 'netflix', 'ae'::text, NULL),
  ('NordVPN Standard', 'nordvpn-standard', 'NordVPN Standard subscription.', 'vpn', NULL::text, '/images/nord-vpn.png'),
  ('Surfshark VPN', 'surfshark-vpn', 'Surfshark VPN subscription.', 'vpn', NULL::text, '/images/surfshark.jpeg'),
  ('Amazon Gift Card (KSA)', 'amazon-ksa', 'Amazon gift card, Saudi Arabia region.', 'amazon', 'sa'::text, NULL),
  ('Amazon Gift Card (UAE)', 'amazon-uae', 'Amazon gift card, UAE region.', 'amazon', 'ae'::text, NULL),
  ('Noon Gift Card (SA)', 'noon-sa', 'Noon gift card, Saudi Arabia region.', 'noon', 'sa'::text, NULL),
  ('Noon Gift Card (AE)', 'noon-ae', 'Noon gift card, UAE region.', 'noon', 'ae'::text, NULL)
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
with prod as (select id, slug from public.products)
insert into public.product_variants (product_id, name, price, active)
select prod.id, v.name, v.price, true
from (values
  ('yalla-ludo-gold', '2 USDT (68,500 Gold)', 1.86),
  ('yalla-ludo-gold', '5 USDT (223,700 Gold)', 4.65),
  ('yalla-ludo-gold', '10 USDT (1,463,320 Gold)', 9.3),
  ('yalla-ludo-gold', '25 USDT (3,666,470 Gold)', 23.25),
  ('yalla-ludo-gold', '50 USDT (9,973,990 Gold)', 46.5),
  ('yalla-ludo-gold', '100 USDT (25,236,460 Gold)', 93.0),
  ('yalla-ludo-gold', '300 USDT (76,000,860 Gold)', 279.0),
  ('yalla-ludo-gold', '500 USDT (126,910,990 Gold)', 465.0),
  ('yalla-ludo-diamond', '2 USDT (830 Diamond)', 1.86),
  ('yalla-ludo-diamond', '5 USDT (2,320 Diamond)', 4.65),
  ('yalla-ludo-diamond', '10 USDT (5,150 Diamond)', 9.3),
  ('yalla-ludo-diamond', '25 USDT (13,580 Diamond)', 23.25),
  ('yalla-ludo-diamond', '50 USDT (27,640 Diamond)', 46.5),
  ('yalla-ludo-diamond', '100 USDT (55,800 Diamond)', 93.0),
  ('yalla-ludo-diamond', '300 USDT (168,860 Diamond)', 279.0),
  ('yalla-ludo-diamond', '500 USDT (283,460 Diamond)', 465.0),
  ('free-fire', '1 USDT (100 Diamond)', 0.94),
  ('free-fire', '2 USDT (210 Diamond)', 1.88),
  ('free-fire', '5 USDT (530 Diamond)', 4.7),
  ('free-fire', '10 USDT (1,080 Diamond)', 9.4),
  ('free-fire', '20 USDT (2,200 Diamond)', 18.8),
  ('yalla-live', '25 USDT (2,900 Gold)', 23.5),
  ('yalla-live', '50 USDT (5,900 Gold)', 47.0),
  ('yalla-live', '100 USDT (12,500 Gold)', 94.0),
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
  ('itunes', '5 USDT Apple Gift Card', 4.8),
  ('itunes', '10 USDT Apple Gift Card', 9.6),
  ('itunes', '20 USDT Apple Gift Card', 19.2),
  ('itunes', '50 USDT Apple Gift Card', 48.0),
  ('itunes', '100 USDT Apple Gift Card', 96.0),
  ('itunes', '200 USDT Apple Gift Card', 192.0),
  ('itunes', '400 USDT Apple Gift Card', 384.0),
  ('xbox', '15 USDT Xbox Gift Card', 13.5),
  ('xbox', '25 USDT Xbox Gift Card', 22.5),
  ('xbox', '50 USDT Xbox Gift Card', 45.0),
  ('xbox', '100 USDT Xbox Gift Card', 90.0),
  ('xbox-ksa', 'SAR 50', 14.0),
  ('xbox-ksa', 'SAR 100', 26.0),
  ('xbox-ksa', 'SAR 200', 50.0),
  ('xbox-ksa', 'SAR 300', 75.0),
  ('psn', '25 USDT', 23.0),
  ('psn', '50 USDT', 46.0),
  ('psn', '75 USDT', 69.0),
  ('psn', '100 USDT', 92.0),
  ('psn', '150 USDT', 138.0),
  ('psn', '200 USDT', 184.0),
  ('psn', '250 USDT', 230.0),
  ('psn-uae', '10 USDT', 9.2),
  ('psn-uae', '20 USDT', 18.4),
  ('psn-uae', '50 USDT', 46.0),
  ('psn-uae', '100 USDT', 92.0),
  ('psn-uae', '120 USDT', 110.4),
  ('psn-uae', '160 USDT', 147.2),
  ('psn-uae', '200 USDT', 184.0),
  ('psn-kuwait', '10 USDT', 9.2),
  ('psn-kuwait', '20 USDT', 18.4),
  ('psn-kuwait', '50 USDT', 46.0),
  ('psn-kuwait', '100 USDT', 92.0),
  ('psn-kuwait', '120 USDT', 110.4),
  ('psn-kuwait', '160 USDT', 147.2),
  ('psn-kuwait', '200 USDT', 184.0),
  ('psn-ksa', '10 USDT', 9.6),
  ('psn-ksa', '20 USDT', 19.2),
  ('psn-ksa', '50 USDT', 48.0),
  ('psn-ksa', '100 USDT', 96.0),
  ('psn-ksa', '120 USDT', 115.2),
  ('psn-ksa', '160 USDT', 153.6),
  ('psn-ksa', '200 USDT', 192.0),
  ('netflix-ksa', 'SAR 100', 26.0),
  ('netflix-ksa', 'SAR 150', 39.0),
  ('netflix-ksa', 'SAR 200', 50.0),
  ('netflix-ksa', 'SAR 250', 62.0),
  ('netflix-ksa', 'SAR 300', 75.0),
  ('netflix-uae', 'AED 100', 26.0),
  ('netflix-uae', 'AED 150', 39.0),
  ('netflix-uae', 'AED 200', 50.0),
  ('netflix-uae', 'AED 250', 62.0),
  ('netflix-uae', 'AED 300', 75.0),
  ('nordvpn-standard', '1 Month', 13.0),
  ('nordvpn-standard', '6 Months', 37.0),
  ('nordvpn-standard', '1 Year', 52.0),
  ('surfshark-vpn', '1 Month', 15.0),
  ('surfshark-vpn', '6 Months', 35.0),
  ('surfshark-vpn', '12 Months', 50.0),
  ('amazon-ksa', 'SAR 50', 14.0),
  ('amazon-ksa', 'SAR 100', 27.0),
  ('amazon-ksa', 'SAR 250', 67.0),
  ('amazon-ksa', 'SAR 500', 130.0),
  ('amazon-uae', 'AED 50', 14.0),
  ('amazon-uae', 'AED 100', 28.0),
  ('amazon-uae', 'AED 250', 68.0),
  ('amazon-uae', 'AED 500', 131.0),
  ('noon-sa', '100 USDT', 27.0),
  ('noon-sa', '250 USDT', 66.0),
  ('noon-sa', '500 USDT', 130.0),
  ('noon-ae', '100 USDT', 27.0),
  ('noon-ae', '250 USDT', 66.0),
  ('noon-ae', '500 USDT', 130.0)
) as v(product_slug, name, price)
join prod on prod.slug = v.product_slug;

-- ============================================================
-- Done. Stock (redeemable codes) for these products is now empty -
-- add codes for each variant from the admin panel before going live.
-- ============================================================