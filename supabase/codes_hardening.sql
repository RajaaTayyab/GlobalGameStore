-- ============================================================
-- codes_hardening.sql
-- 1. Duplicate codes can never be added twice (global unique).
-- 2. Sold / delivered codes are stored in the codes table with
--    status 'assigned' + order_id so they can never be re-sold.
-- NOTE: run in a FRESH SQL Editor window.
-- ============================================================

-- ---------- 1. Drop any existing duplicate code strings ----------
-- Keep the earliest row per code value, remove later copies.
delete from public.codes a
using public.codes b
where a.code = b.code and a.id > b.id;

-- ---------- 2. Unique constraint ----------
-- Enforces at the DB level that the same code can never be inserted
-- twice, across any variant or batch.
create unique index if not exists idx_codes_code_unique
  on public.codes (code);

-- ============================================================
-- Done. Existing 'assigned' codes stay; new adds are guarded by
-- the unique index and the admin add-codes flow reports skips.
-- ============================================================