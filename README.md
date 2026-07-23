# therapytrack

Mobile-first web app to track a medication regimen: what's due right now, confirm/skip each dose, and keep inventory current so nothing runs out unnoticed. Built for a family caregiving situation — multiple caregivers on different phones, shared access via a household passcode (no per-person accounts).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres, hosted).

## Screens

- **Ahora** (`/`) — what's due now/soon/overdue today, confirm or skip in one tap, PRN (as-needed) meds logged separately. Auto-refreshes every 60s.
- **Agenda** (`/agenda`) — full-day schedule, any date, past or future.
- **Medicamentos** (`/medicamentos`) — one card per medication: add new, edit dose/cadence, take out of/back into rotation, restock or correct units on hand, days-of-supply estimate, low-stock flags.
- **Historial** (`/historial`) — log of every confirmed/skipped dose, who logged it, when.

## Data model

See [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). Two tables:

- `medications` — one row per prescribed medication: dose, route, schedule (fixed daily times, weekly, or PRN), course duration, units on hand.
- `dose_events` — one row per confirmed/skipped administration; confirming a `taken` dose atomically decrements `units_on_hand` via the `decrement_units` Postgres function (`0002_functions.sql`).

Schedule computation (what's due, when, and low-stock detection) is pure logic in [`src/lib/schedule.ts`](src/lib/schedule.ts) — no framework dependencies, easy to unit test.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase URL/anon key + a shared PIN
npm run dev
```

Then, in the Supabase SQL editor (or via `supabase db push` if you use the CLI), run `supabase/migrations/0001_init.sql`, `0002_functions.sql`, then `supabase/seed.sql` to load the initial medication list.

## Access model

Every caregiver enters the same shared `THERAPYTRACK_PIN` once per device (90-day cookie). On first use each caregiver also picks their name (stored in that browser's `localStorage`) so `dose_events.caregiver_name` records who confirmed each dose. There's no per-user login — this is a private household tool, not a multi-tenant product.

## Deploy

Vercel (free tier is enough): connect this repo, set the four env vars from `.env.local.example` in Project Settings, deploy. See the studio-vault project notes for the step-by-step used the first time this was set up.
