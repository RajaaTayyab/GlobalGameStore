-- Idempotent migration: adds the `sold_out` flag to products (run in SQL Editor once).
-- Safe to run even if already applied. If you ran schema.sql before this existed,
-- run this single statement instead of re-running the whole schema.
alter table public.products
  add column if not exists sold_out boolean not null default false;
