-- ============================================================
-- GlobalGameStore - Supabase Schema
-- Run this in the Supabase SQL Editor (or via supabase CLI).
-- ============================================================

-- ---------- Extensions ----------
create extension if not exists pgcrypto;

-- ---------- Profiles (links to auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  whatsapp text,
  country text,
  role text not null default 'user' check (role in ('user', 'admin')),
  credits_balance numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ---------- Categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

-- ---------- Regions (location based recommendations) ----------
create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,          -- pk | mena | us | global
  name text not null,                 -- Pakistan | Middle East | USA | Global
  countries text[] not null default '{}',  -- ISO country codes
  sort_order integer not null default 0
);

alter table public.regions enable row level security;

-- ---------- Products ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  category_id uuid references public.categories (id) on delete set null,
  region_id uuid references public.regions (id) on delete set null, -- NULL = global
  featured boolean not null default false,
  active boolean not null default true,
  sold_out boolean not null default false,   -- admin can mark product as sold out
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- ---------- Product variants (denominations / top-up amounts) ----------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,                     -- e.g. "100 UC", "$10 Gift Card"
  price numeric(12, 2) not null default 0,
  original_price numeric(12, 2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.product_variants enable row level security;

-- ---------- Codes (stock of redeemable codes per variant) ----------
create table if not exists public.codes (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  code text not null,
  status text not null default 'available' check (status in ('available', 'assigned')),
  order_id uuid,                          -- set when sold to an order
  created_at timestamptz not null default now()
);

alter table public.codes enable row level security;

-- ---------- Orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,      -- e.g. GGS-2026001
  user_id uuid references auth.users (id) on delete set null,
  customer_name text,
  customer_email text,
  customer_whatsapp text,
  country text,
  total numeric(12, 2) not null default 0,
  payment_method text not null check (payment_method in ('credits', 'whatsapp')),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'completed', 'cancelled')),
  whatsapp_link text,                     -- prefilled wa.me link for whatsapp orders
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

-- ---------- Order items ----------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid,
  product_name text not null,
  variant_id uuid,
  variant_name text not null,
  quantity integer not null default 1,
  unit_price numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0
);

alter table public.order_items enable row level security;

-- ---------- Codes delivered per order (for credits paid orders) ----------
create table if not exists public.order_codes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid references public.order_items (id) on delete set null,
  product_name text,
  variant_name text,
  code text not null
);

alter table public.order_codes enable row level security;

-- ---------- Credit transactions (ledger) ----------
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  admin_id uuid references auth.users (id) on delete set null,
  amount numeric(12, 2) not null,          -- positive = credit, negative = debit
  reason text,
  order_id uuid,
  created_at timestamptz not null default now()
);

alter table public.credit_transactions enable row level security;

-- ---------- Settings (admin config) ----------
create table if not exists public.settings (
  key text primary key,
  value text
);

alter table public.settings enable row level security;

-- ---------- Indexes ----------
create index if not exists idx_products_category on public.products (category_id);
create index if not exists idx_products_region on public.products (region_id);
create index if not exists idx_variants_product on public.product_variants (product_id);
create index if not exists idx_codes_variant on public.codes (variant_id);
create index if not exists idx_codes_status on public.codes (status);
create index if not exists idx_orders_user on public.orders (user_id);
create index if not exists idx_order_items_order on public.order_items (order_id);
create index if not exists idx_order_codes_order on public.order_codes (order_id);
create index if not exists idx_credit_tx_user on public.credit_transactions (user_id);

-- ============================================================
-- Row Level Security policies
-- Public read access for catalog data; writes happen through
-- the backend (service role), so we keep user policies minimal.
-- ============================================================

create policy "Public read categories" on public.categories for select using (true);
create policy "Public read regions" on public.regions for select using (true);
create policy "Public read products" on public.products for select using (active = true);
create policy "Public read variants" on public.product_variants for select using (true);

create policy "User reads own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "User updates own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "User reads own orders" on public.orders
  for select using (auth.uid() = user_id);

create policy "User reads own order items" on public.order_items
  for select using (
    order_id in (select id from public.orders where user_id = auth.uid())
  );

create policy "User reads own delivered codes" on public.order_codes
  for select using (
    order_id in (select id from public.orders where user_id = auth.uid())
  );

create policy "User reads own credit transactions" on public.credit_transactions
  for select using (auth.uid() = user_id);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-create profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-promote first user to admin (useful for initial setup).
-- After your first registration, you can disable this trigger
-- or delete this block.
create or replace function public.promote_first_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles) then
    update public.profiles
    set role = 'admin'
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_first on auth.users;
create trigger on_auth_user_created_first
  after insert on auth.users
  for each row execute procedure public.promote_first_user();

-- ============================================================
-- Production hardening (S1-S5, F1/F2, F4)
-- ============================================================

-- Rate limiting store (S2)
create table if not exists public.rate_limits (
  key text primary key,
  hits integer not null default 0,
  window_start timestamptz not null default now()
);
alter table public.rate_limits enable row level security;

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_window timestamptz;
  v_hits integer;
begin
  v_window := now() - make_interval(secs => p_window_seconds);
  insert into rate_limits (key, hits, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    hits = case when rate_limits.window_start < v_window then 1 else rate_limits.hits + 1 end,
    window_start = case when rate_limits.window_start < v_window then now() else rate_limits.window_start end
  returning hits into v_hits;
  return jsonb_build_object(
    'hits', v_hits,
    'allowed', v_hits <= p_limit,
    'remaining', greatest(0, p_limit - v_hits)
  );
end;
$$;

-- Checkout idempotency (F2)
alter table public.orders
  add column if not exists idempotency_key text;
create unique index if not exists idx_orders_idempotency
  on public.orders (idempotency_key)
  where idempotency_key is not null;

-- Atomic credits checkout (F1)
create or replace function public.place_credits_order(
  p_user_id uuid,
  p_order_number text,
  p_customer_name text,
  p_customer_email text,
  p_customer_whatsapp text,
  p_country text,
  p_idempotency_key text,
  p_items jsonb,
  p_total numeric
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_balance numeric;
  v_order_id uuid;
  v_item jsonb;
  v_oi_id uuid;
  v_qty integer;
  v_ids uuid[];
  v_codes text[];
begin
  select credits_balance into v_balance
    from profiles where id = p_user_id for update;
  if v_balance is null then
    return jsonb_build_object('ok', false, 'error', 'User not found');
  end if;
  if v_balance < p_total then
    return jsonb_build_object('ok', false, 'error', 'Insufficient credits');
  end if;

  if p_idempotency_key is not null then
    if exists (select 1 from orders where idempotency_key = p_idempotency_key) then
      return jsonb_build_object(
        'ok', false, 'duplicate', true,
        'order_id', (select id from orders where idempotency_key = p_idempotency_key limit 1)
      );
    end if;
  end if;

  insert into orders (
    order_number, user_id, customer_name, customer_email, customer_whatsapp,
    country, total, payment_method, status, idempotency_key
  ) values (
    p_order_number, p_user_id, p_customer_name, p_customer_email, p_customer_whatsapp,
    p_country, p_total, 'credits', 'paid', p_idempotency_key
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;

    insert into order_items (
      order_id, product_id, product_name, variant_id, variant_name,
      quantity, unit_price, total
    ) values (
      v_order_id,
      (v_item ->> 'product_id')::uuid,
      v_item ->> 'product_name',
      (v_item ->> 'variant_id')::uuid,
      v_item ->> 'variant_name',
      v_qty,
      (v_item ->> 'unit_price')::numeric,
      (v_item ->> 'unit_price')::numeric * v_qty
    ) returning id into v_oi_id;

    -- Atomically claim available codes (skip locked rows).
    select array_agg(c.id), array_agg(c.code)
      into v_ids, v_codes
      from (
        select id, code from codes
        where variant_id = (v_item ->> 'variant_id')::uuid
          and status = 'available'
        order by created_at
        limit v_qty
        for update skip locked
      ) c;

    if v_codes is null or array_length(v_codes, 1) < v_qty then
      raise exception 'Not enough stock for %', v_item ->> 'product_name';
    end if;

    update codes
      set status = 'assigned', order_id = v_order_id
      where id = any(v_ids);

    insert into order_codes (order_id, order_item_id, product_name, variant_name, code)
      select v_order_id, v_oi_id, v_item ->> 'product_name', v_item ->> 'variant_name', x
      from unnest(v_codes) x;
  end loop;

  update profiles set credits_balance = v_balance - p_total where id = p_user_id;
  insert into credit_transactions (user_id, amount, reason, order_id)
  values (p_user_id, -p_total, 'Order #' || p_order_number, v_order_id);

  return jsonb_build_object('ok', true, 'order_id', v_order_id);
end;
$$;

-- Auto sold out when stock hits 0 (F4)
create or replace function public.sync_sold_out()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_pid uuid;
  v_count integer;
begin
  select product_id into v_pid
    from product_variants where id = coalesce(new.variant_id, old.variant_id);
  if v_pid is null then
    return coalesce(new, old);
  end if;
  select count(*) into v_count
    from codes c
    join product_variants pv on pv.id = c.variant_id
    where pv.product_id = v_pid and c.status = 'available';
  if v_count = 0 then
    update products set sold_out = true where id = v_pid;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_sold_out on public.codes;
create trigger trg_sync_sold_out
  after insert or update or delete on public.codes
  for each row execute function public.sync_sold_out();
