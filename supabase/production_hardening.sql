-- ---------- Rate limiting store (S2) ----------
create table if not exists public.rate_limits (
  key text primary key,
  hits integer not null default 0,
  window_start timestamptz not null default now()
);
alter table public.rate_limits enable row level security;

-- Atomic fixed-window counter. Returns whether the request is allowed.
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

-- ---------- Checkout idempotency (F2) ----------
alter table public.orders
  add column if not exists idempotency_key text;
create unique index if not exists idx_orders_idempotency
  on public.orders (idempotency_key)
  where idempotency_key is not null;

-- ---------- Atomic credits checkout (F1) ----------
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

-- ---------- Auto sold out when stock hits 0 (F4) ----------
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
