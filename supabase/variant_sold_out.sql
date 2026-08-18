-- ============================================================
-- variant_sold_out.sql
-- Per-variant manual sold-out flag. When EVERY active variant of a
-- product is flagged sold out, the product is automatically marked
-- sold out (mirrors sync_sold_out's one-way behavior for code stock,
-- so the existing code-stock trigger and the manual admin product
-- toggle keep working unchanged).
-- NOTE: run in a FRESH SQL Editor window.
-- ============================================================

-- ---------- 1. Variant sold-out column ----------
alter table public.product_variants
  add column if not exists sold_out boolean not null default false;

-- ---------- 2. Auto sold-out when all active variants are flagged ----------
create or replace function public.sync_variant_sold_out()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_pid uuid;
  v_active_available integer;
begin
  select product_id into v_pid
    from product_variants where id = coalesce(new.id, old.id);
  if v_pid is null then
    return coalesce(new, old);
  end if;

  select count(*) into v_active_available
    from product_variants
    where product_id = v_pid
      and active
      and not coalesce(sold_out, false);

  if v_active_available = 0 then
    update products set sold_out = true where id = v_pid;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_variant_sold_out on public.product_variants;
create trigger trg_sync_variant_sold_out
  after insert or update or delete on public.product_variants
  for each row execute function public.sync_variant_sold_out();

-- ============================================================
-- Done. Existing products are left untouched (sold_out defaults to
-- false); flag variants from the admin panel Products tab.
-- ============================================================