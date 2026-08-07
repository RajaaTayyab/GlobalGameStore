<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design System — Vault & Chrome

All app pages use this theme, including the admin panel (`src/app/admin/*`, `src/components/admin/*`).

## Theming
- Dark is default: no `data-mode` attribute = dark. Light mode overrides live under `html[data-mode="light"]` in `src/app/globals.css`.
- Tokens are plain CSS vars in an `@theme` block (not `inline`) so utilities emit `var(--token)` references and the runtime light-mode override works.
- Toggle lives in `Navbar.tsx`: flips `data-mode` on `<html>`, persists under localStorage key `gts-theme`, falls back to `prefers-color-scheme` on first visit.
- `color-scheme` handled via `html[data-mode="light"] { color-scheme: light }`.

## Tokens (see `src/app/globals.css`)
| Token | Role |
|---|---|
| `--color-bg` | page background |
| `--color-surface` | cards, panels, drawers |
| `--color-border` | all borders/dividers |
| `--color-text-primary` / `--color-text-muted` | body copy |
| `--color-accent-oxblood` | CTA buttons ONLY (Add to cart, Checkout, Explore deals, Shop Now) |
| `--color-accent-chrome` | informational/badge/icon elements (Flame icon, hero radial glow, status pills, links) |
| `--color-price` | prices (always `font-mono`) |
| `--color-old-price` | strikethrough old prices |
| `--color-instock` | success / in-stock / WhatsApp / positive credit movements |
| `--color-bg` reused | text on chrome badge tiles (legibility) |

## Rules
- No gradients on headline text or CTAs — flat solid colors.
- Cards: `rounded-lg` (or `rounded-xl` for dense inner blocks), `border border-border`, `bg-surface`.
- Category labels, SKUs, order numbers, breadcrumbs, prices: `font-mono`.
- Headlines: `font-serif` (Instrument Serif). Body: `font-sans` (Karla). Mono: Spline Sans Mono (roles wired via `--font-sans`/`--font-serif`/`--font-mono` in `layout.tsx`).
- Hero radial glow stays subtle: `rgba(201,175,140,0.10)` dark / `0.08` light.
- Destructive actions (danger zone, delete, cancelled/error states) keep semantic red (`red-*`); warnings keep `amber-*`; positive/credit/success keep `--color-instock` — no tokens exist for these.
- Admin panel follows the same tokens: primary actions = oxblood, active tab = solid chrome (`bg-accent-chrome text-bg`), admin badges = chrome, prices/order numbers = mono, destructive (delete/deduct) = red.
- Text on oxblood buttons = white; text on chrome tile = `text-bg`.
- Search `slate-|cyan-|emerald-|amber-|bg-white|text-white` before adding UI — those are legacy leftovers from the pre-theme pass.

# Project Facts
- `.env.local` has `REQUIRE_EMAIL_VERIFICATION=true`, Gmail SMTP creds (only used by `src/lib/email.ts` order codes), `WHATSAPP_NUMBER=923195432549`, `ADMIN_EMAILS=admin@globalgamestore.com`.
- Confirmation/reset emails come from Supabase Auth dashboard SMTP (not `.env.local`) — still needs dashboard SMTP + Site URL + Redirect URL config.
- Rate limiting in `src/lib/ratelimit.ts`; admin client in `src/lib/supabase/admin.ts`.
- SQL production hardening (`supabase/production_hardening.sql`) must be re-run in a FRESH SQL Editor window — stale editor buffer causes the `42601` syntax error.

