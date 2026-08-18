

-- ---------- 1. Column ----------
alter table public.product_variants
  add column if not exists price_on_request boolean not null default false;

-- ---------- 2. Seed the PUBG Mobile Pre-Loaded Account variant ----------
insert into public.product_variants (product_id, name, price, active, sold_out, price_on_request)
select p.id, 'Pre-Loaded Account (contact for price)', 0, true, false, true
from public.products p
join public.categories c on c.id = p.category_id
where c.slug = 'pubg-mobile'
  and not exists (
    select 1 from public.product_variants pv
    where pv.product_id = p.id
      and pv.name = 'Pre-Loaded Account (contact for price)'
  )
limit 1;
