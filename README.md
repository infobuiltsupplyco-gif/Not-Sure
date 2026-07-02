# This repo hosts two projects

| Project | What it is | Docs |
|---|---|---|
| **OmniStore** 🛒⚡ | Autonomous AI dropshipping engine (Python, in `omnistore/`) | below |
| **Vigil** 🛡️ | SaaS platform for security operations companies (React, in `src/`) | [see Vigil section](#vigil--the-operating-system-for-security-companies) |

---

# OmniStore 🛒⚡

**An autonomous AI commerce engine.** Point it at a niche (or let it pick one) and it runs a dropshipping store end to end:

1. **Finds winning products** — Claude researches the live web (TikTok trends, Google Trends, supplier pricing, competitor stores) and returns ranked, evidence-backed picks with realistic costs and margins.
2. **Builds the listings** — SEO titles, converting HTML descriptions, tags, pricing with compare-at anchors.
3. **Publishes to Shopify** — creates real products through the Shopify Admin API.
4. **Generates the marketing** — ad creatives across 4 platforms with distinct angles, welcome + abandoned-cart emails, launch copy.
5. **Runs the social media** — plans a platform-native content calendar and posts to Facebook and X on its own schedule, remembering what it already posted so it never repeats itself.

Every cycle builds on the last: launched products, post history, and the chosen niche persist in `data/state.json`.

## Get your AI link ($0 hosting, ~5 minutes)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/infobuiltsupplyco-gif/Not-Sure)

1. Click the button, sign in to Render — **free plan, no card required**
2. Paste your `ANTHROPIC_API_KEY` and pick a dashboard password when asked
3. Render builds it and gives you **your permanent AI link** — `https://omnistore-….onrender.com`

That URL is your password-protected control room. It naps when idle (free tier) and wakes when you open it.

**The always-on autopilot is also free**: `.github/workflows/autopilot.yml` runs the AI on GitHub's own servers — full cycle daily + 3 TikTok slots — at no hosting cost. Just add `ANTHROPIC_API_KEY` under repo *Settings → Secrets and variables → Actions*, and it runs on schedule (or trigger it from the Actions tab). Drafts, videos and marketing kits land as downloadable artifacts on each run.

**The one unavoidable cost:** the Anthropic API key is pay-per-use — that's the AI's actual thinking, billed by Anthropic, not by this project. Typical cycles run cents-to-a-few-dollars; set `OMNISTORE_MODEL=claude-haiku-4-5` for the cheapest runs.

## Quick start (run it on your own computer instead)

```bash
pip install -r requirements.txt
cp .env.example .env      # add your ANTHROPIC_API_KEY (the only required key)

python -m omnistore web          # ★ browser control room → http://127.0.0.1:8787
python -m omnistore run          # one full cycle
python -m omnistore autopilot    # run forever: daily launches, 3x/day social, 3x/day TikTok
```

**The control room** (`python -m omnistore web`) is the easiest way to drive the AI: run cycles, generate TikTok videos, preview them in the page, and approve/reject with one click.

Other commands:

```bash
python -m omnistore research --niche "home fitness"   # research only, prints JSON
python -m omnistore social                            # one day of social content
python -m omnistore status                            # what the engine has done so far
```

## Dry-run first (default)

`OMNISTORE_DRY_RUN=true` is the default: the AI does **all** the work — research, listings, marketing, social calendar — but publishes nothing. Drafts land in `output/` so you can review exactly what it would ship. Flip to `false` when you've connected your keys and like what you see.

| Integration | Needs | Without it |
|---|---|---|
| Claude (the brain) | `ANTHROPIC_API_KEY` | Nothing works — this one's required |
| Shopify | store domain + Admin API token (`write_products`) | Listings saved as JSON drafts |
| Facebook Page | page ID + page access token | Posts queued to `output/social_queue.jsonl` |
| X / Twitter | OAuth2 user token (`tweet.write`) | Posts queued |
| Instagram | requires an image pipeline (see roadmap) | Posts queued with an `image_prompt` you can use |
| TikTok | developer app + `video.publish` OAuth token | Videos still render + queue; you post manually |

## TikTok: AI-made videos, posted 3x/day

Two modes, your choice:

- **Approval queue (default):** every video waits for your one-click approval in the control room (or CLI) before posting.
- **Autopost (`OMNISTORE_TIKTOK_AUTOPOST=true`):** on autopilot the engine generates and posts a fresh trend-riding video at 09:30, 14:00 and 19:00 UTC — fully hands-off.

CLI flow:

```bash
python -m omnistore tiktok plan            # research live TikTok trends → storyboard + render videos
python -m omnistore tiktok queue           # review captions, hashtags, scene-by-scene storyboards
python -m omnistore tiktok approve --id X  # ONLY this posts a video
python -m omnistore tiktok reject --id X
```

- The AI researches what's trending on TikTok *today* (sounds, formats, hashtags) and storyboards videos that ride those trends — value/entertainment first, not spam.
- Drop raw clips or product photos into `assets/` and ffmpeg assembles a finished 1080×1920 video with the storyboard's text overlays. No assets? You still get a shoot-ready storyboard.
- Posting uses TikTok's **official Content Posting API** with your own developer-app token — never your password. Until TikTok audits your app, posts are `SELF_ONLY` (visible just to you in-app), which doubles as a final review step.

## How it works

```
┌─────────────┐   web search    ┌──────────────┐   structured    ┌─────────────┐
│  research   │ ──────────────▸ │ Claude Opus  │ ──────────────▸ │  ranked     │
│  cycle      │                 │ 4.8 + adaptive│    outputs     │  products   │
└─────────────┘                 │  thinking    │                 └──────┬──────┘
                                └──────────────┘                        │
        ┌───────────────┬───────────────────┬───────────────────┬──────┘
        ▼               ▼                   ▼                   ▼
   Shopify listing  marketing kit     social calendar      state.json
   (Admin API)      (ads + emails)    (FB / IG / X)        (memory)
```

- **Model**: `claude-opus-4-8` with adaptive thinking and prompt caching on the system prompt.
- **Research** uses the server-side `web_search` tool with dynamic filtering — findings are grounded in what's trending *today*, not training data.
- **Every AI output is typed**: Pydantic schemas + the API's structured outputs mean the engine gets validated data, never brittle text parsing.
- **Social posting** goes through the official Meta Graph API and X API v2 with your own credentials — no scraping, no ToS games.

## Honest notes

- The AI's supplier-cost estimates are research-based starting points. Confirm actual pricing with your supplier before scaling ad spend.
- Order fulfillment (auto-forwarding orders to suppliers) is the next module on the roadmap — today the engine handles finding, listing, marketing, and social.
- Instagram publishing needs hosted images; each queued IG post ships with an `image_prompt` ready for your image generator of choice.
- Keep `DRY_RUN=true` until you've reviewed a few cycles. It's your store and your ad accounts.

## Roadmap

- [ ] Order auto-fulfillment (CJdropshipping / AliExpress APIs)
- [ ] AI image generation → Instagram publishing
- [ ] Weekly ShopifyQL analytics review that feeds back into product picks
- [ ] Auto price testing on live listings

---

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
