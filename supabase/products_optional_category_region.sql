-- ============================================================
-- products_optional_category_region.sql
-- The admin product form no longer collects category/region, so the
-- create API sends NULL for these FKs. If the columns are NOT NULL
-- in your `products` table, every product creation fails with a
-- "null value in column" error. Run this in a FRESH SQL Editor
-- window to make them optional. Safe no-op if already nullable.
-- ============================================================

alter table public.products alter column category_id drop not null;
alter table public.products alter column region_id drop not null;
