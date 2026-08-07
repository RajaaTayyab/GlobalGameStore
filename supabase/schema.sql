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
