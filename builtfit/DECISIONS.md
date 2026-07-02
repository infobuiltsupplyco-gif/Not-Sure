# BuiltFit — decisions log

Decisions made autonomously during the build, with reasoning. The four North
Star principles won every tie.

## Repo & stack

- **App lives in `builtfit/`** — this repository already hosts two other
  projects (OmniStore in `omnistore/`, Vigil at the root/`src/`), so BuiltFit
  is a self-contained Next.js app in its own directory rather than replacing
  the root project.
- **Tailwind v4** (what `create-next-app@15` ships) with CSS-variable design
  tokens and a class-based dark mode. Dark is the default brand look
  (mint `#7FE8C9` on near-black `#0C0F0E`); light mode derives from the same
  hues at accessible contrast.
- **Hand-rolled shadcn-style UI kit** (`components/ui/*`) instead of the
  shadcn CLI: same look and API surface, zero interactive-CLI friction, no
  Radix dependency weight for the handful of primitives needed.
- **Server actions for mutations, API routes for reads that the client polls**
  (search, barcode, export) and for the Stripe webhook. Every action and
  route validates input with Zod.

## Data & domain

- **Nutrition snapshots**: diary entries store a computed `nutrition` jsonb
  snapshot, so history never changes if a cached food is later corrected.
- **Nutrient set**: calories, protein, carbs, fat, fiber, sugar, saturated
  fat, sodium, potassium, calcium, iron, vitamin C, vitamin A. Broad enough
  for a meaningful micronutrient-coverage score without chasing the full
  USDA nutrient list.
- **Confidence scores**: USDA Foundation/SR Legacy 0.98, FNDDS 0.92, USDA
  Branded 0.88; Open Food Facts scales 0.4–0.85 with record completeness and
  is only badged "Verified" when reasonably complete. Merge order is
  USDA > OFF-branded > OFF-generic, deduped by barcode and name+brand.
- **Whole-food heuristic** (`lib/food-sources/whole-food.ts`) is a transparent
  keyword list, not an ML black box — predictable and explainable to users.
- **Exercise burn range = 75–100% of the MET equation**, because published
  MET values assume a reference metabolism and continuous intensity; the low
  end feeds all budget math. "Add calories back" defaults to OFF.
- **Quality score weights**: whole foods 35%, protein adequacy 25%, fiber
  20%, micro coverage 20% — quality dominates, and nothing in the score
  rewards eating less.
- **Streak trigger lives in Postgres** so consistency updates atomically with
  the diary insert, and counts only that a log happened — never what it said.
- **Safety floor** is enforced three times: UI copy, server action clamp
  (with supportive message + professional-help suggestion), and a DB check
  constraint (`calorie_target >= 1200`).
- **Onboarding requires 18+** for calorie targets; under-18s get a supportive
  message directing them to professional guidance instead of a formula.

## Product

- **Quality score card renders above the calorie ring** on the dashboard —
  layout enforces the principle, not just copy.
- **Gentle Mode** is a React context fed from the profile; every calorie
  display goes through `<CalorieValue />`/`useGentle()` so a numeral cannot
  leak. Macro grams remain visible (they're composition, not calories);
  the energy ring is replaced by a qualitative balance wheel; exercise burn
  numbers hide entirely.
- **Neutral palette for status**: nothing in the app turns red for eating.
  "Above target" is the strongest wording used; the destructive color is
  reserved for destructive *actions* (delete buttons).
- **Personal foods** are stored per-user with RLS, surfaced in the user's own
  search under a "Personal entry — unverified" badge, and never written to
  `foods_cache`.
- **Recipes** store computed per-serving nutrition at save time; logging a
  serving is one tap from the recipe list.
- **Barcode scanning** uses html5-qrcode with a typed-barcode fallback for
  devices that block the camera. Lookup order: cache → Open Food Facts.
- **Account deletion is real**: service-role `deleteUser` cascades through
  every table via FKs, and progress photos are removed from storage first.
  Without a service-role key configured, deletion reports honestly that the
  operator must configure it rather than pretending.

## Monetization

- Everything shipped is free; there is no pricing UI at all while
  `NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED=false`.
- `lib/flags.ts` marks all core tracking `free_forever: true` and
  `assertNeverPaywalled()` throws if future code ever tries to gate one —
  the contract is executable, not aspirational.
- Stripe helpers + webhook are scaffolded and inert; the webhook returns 200
  with a note while disabled so Stripe test pings don't error.

## Known remaining TODOs

- Google OAuth needs provider config in the Supabase dashboard (documented in
  README); email/password works out of the box.
- Weekly insights email/report generation (in-app report exists; no email).
- `foods_cache` full-text index exists but search currently uses ILIKE for
  simplicity; swap to `websearch_to_tsquery` if the cache grows large.
- Offline/PWA support (service worker) not included.
- BuiltFit+ features (AI meal suggestions, analytics themes) are flagged but
  unimplemented by design.
