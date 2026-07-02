# Vigil — The Operating System for Security Companies

Vigil is a vertical SaaS platform for security operations companies — guarding,
mobile patrol, and event security firms. It replaces the paper run sheets,
whiteboard rosters, and group chats these companies run on today with one
system shared by guards, dispatchers, and clients.

**Live demo:** run it locally (below), open the landing page, and click
**"Try the live demo"** — any email/password signs you into a fully-loaded
operations dashboard.

## Why this is a big business

- Physical security is a **$250B+ global market** growing ~7% a year, and most
  of it still runs on paper. The software layer is barely penetrated outside
  the top enterprise operators.
- The buyer pain is acute and financial: contracts are won and lost on
  **provable patrol coverage**. "Did the guard actually walk the site?" is a
  question paper can't answer and Vigil answers with a GPS-stamped scan log.
- Per-guard pricing ($12–$29/guard/month) scales with the customer. A
  100-guard company is $1.4k–$3.5k MRR from a single logo, and mid-size
  security firms routinely run 100–2,000 guards.
- The client portal is the growth loop: every weekly report a security company
  sends its clients is a Vigil-branded proof-of-value in front of the next
  prospective buyer.

## What's in the product

| Area | What it does |
|---|---|
| **Operations board** | Live stat tiles, 14-day incident trend chart, real-time patrol activity feed |
| **Incidents** | Search/filter, expandable detail, status workflow (open → investigating → resolved), 60-second logging modal — new incidents persist locally |
| **Guards** | Roster view with duty status, licence (CoA) numbers, shift end times |
| **Sites** | Contract cards with per-site checkpoint compliance meters and monthly contract value |
| **Reports** | One-click client-ready weekly summaries generated from live data |
| **Marketing site** | Positioning, feature tour, per-guard pricing, testimonials |

## Stack

- **React 18 + TypeScript + Vite** — fast, typed, zero-config builds
- **React Router (hash routing)** — deploys as a static site anywhere,
  including GitHub Pages, with no server rewrites
- **Hand-rolled CSS design system** — dark-first, no framework dependency
- **localStorage persistence** — the demo keeps your incidents and session
  across reloads; swap `src/data/store.tsx` for a real API when the backend
  lands

## Run it

```bash
npm install
npm run dev      # → http://localhost:5173
npm run build    # type-checks and outputs static site to dist/
```

## Roadmap to revenue

1. **Now (this repo):** investor/customer-ready demo — marketing site plus a
   working dashboard with realistic seeded data.
2. **Pilot:** wire the store to a hosted Postgres + auth backend; onboard 2–3
   local security firms free in exchange for case studies.
3. **Mobile:** guard-facing PWA (checkpoint NFC scans, offline incident
   capture) — the data model in `src/data/types.ts` already supports it.
4. **Monetise:** Stripe billing on the existing per-guard plans; client-portal
   seats as the expansion lever.
