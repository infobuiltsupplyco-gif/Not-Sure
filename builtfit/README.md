# BuiltFit

Nutrition + fitness tracking that respects you. Verified food data, honest
exercise math, wellbeing-first design — and every core feature free forever.

Part of the Built Supply Co family. Mint on near-black, mobile-first.

## The four principles (North Star)

BuiltFit is the deliberate inversion of the four failures of mainstream
trackers:

| Failure elsewhere | BuiltFit's answer |
| --- | --- |
| Inaccurate crowd-sourced food data | Global search uses **only** USDA FoodData Central + Open Food Facts, with a Verified badge, source label, and confidence score on every food. Personal foods stay private and are always marked "Personal entry — unverified". |
| Paywalled basics | Barcode scanning, macros, custom goals, CSV export, and charts are **free forever** — enforced in code (`lib/flags.ts` `free_forever` contract with a runtime guard). |
| Inflated exercise burn | Conservative MET math (Compendium of Physical Activities), burn shown as a **range**, the low end used for budgets, and "add calories back" **off by default**. |
| Number obsession | **Gentle Mode** hides every calorie numeral app-wide; streaks reward logging consistency (never deficits); neutral language ("above target", never red alarms); weekly averages over daily; a hard **1,200 kcal/day floor** with a supportive message; and the Food Quality Score sits **above** the calorie ring. |

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind CSS v4 · Supabase (Postgres,
Auth, RLS, Storage) · Recharts · html5-qrcode · Zod · Stripe (scaffold only,
disabled at launch).

## Setup

### 1. Install

```bash
cd builtfit
npm install
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. In **Settings → API**, copy the project URL, anon key, and service-role key.
3. (Optional) In **Authentication → Providers**, enable Google and set the
   callback to `https://<your-domain>/auth/callback` (and
   `http://localhost:3000/auth/callback` for dev).

### 3. Configure environment

```bash
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, and (recommended) USDA_API_KEY
```

A free USDA key takes 30 seconds:
<https://fdc.nal.usda.gov/api-key-signup.html>. Without it the app falls back
to `DEMO_KEY` (rate-limited) and the seeded cache.

### 4. Run the migration + seed

Using the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <your-project-ref>
supabase db push          # applies supabase/migrations/0001_init.sql
psql "$DATABASE_URL" -f supabase/seed.sql   # or paste seed.sql into the SQL editor
```

Or simply paste `supabase/migrations/0001_init.sql` followed by
`supabase/seed.sql` into the Supabase **SQL Editor** and run them.

The migration creates every table with row-level security (users can only
touch their own rows), the private `progress-photos` storage bucket, the
profile-on-signup trigger, and the logging-streak trigger. The seed loads ~44
verified staple foods so search works before any external API call.

### 5. Run it

```bash
npm run dev
# open http://localhost:3000
```

Sign up, complete the 3-step onboarding (targets are explained honestly —
Mifflin-St Jeor, no black box), and start logging.

## Project layout

```
app/                  Pages (App Router) + API routes
  (app)/              Signed-in app: dashboard, diary, foods, recipes,
                      exercise, progress, insights, settings
  api/foods/…         Merged verified-source search + barcode lookup
  api/export          Free CSV export (diary, weight, measurements, …)
  api/stripe/webhook  Inert scaffold while subscriptions are disabled
components/           UI kit + feature components
lib/
  food-sources/       USDA + Open Food Facts adapters, merge/rank, cache
  actions/            Server actions (Zod-validated)
  nutrition.ts        Mifflin-St Jeor, targets, 1200 kcal safety floor
  mets.ts             Compendium MET values + conservative burn ranges
  quality-score.ts    Food Quality Score (whole foods, protein, fiber, micros)
  flags.ts            Feature flags with the free-forever contract
supabase/             Migration + seed SQL
```

## Monetization stance

The app is 100% free at launch: no card, no trial banners. `lib/plans.ts`
and `lib/flags.ts` scaffold a future **BuiltFit+** tier that could gate only
non-core extras (AI meal suggestions, analytics themes). Core tracking
features are marked `free_forever: true` — a permanent contract enforced by
`assertNeverPaywalled()` at runtime. Stripe helpers and the webhook exist but
are inert while `NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=false`.

## Verifying RLS

Create two accounts, log foods with both, and confirm each sees only its own
diary/recipes/photos. Policies live in `supabase/migrations/0001_init.sql`;
every user table uses `auth.uid() = user_id` (or the recipe-ownership join).
`foods_cache` is globally readable and only writable by the service role.
