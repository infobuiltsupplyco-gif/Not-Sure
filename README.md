# This repo hosts two projects

| Project | What it is | Docs |
|---|---|---|
| **OmniStore** 🛒⚡ | Autonomous AI dropshipping engine (Python, in `omnistore/`) | below |
| **NOVA** 🎬 | Cinematic AI video & image generation studio, free forever (React, in `src/`) | [see NOVA section](#nova--cinematic-ai-motion-studio) |

---

# OmniStore 🛒⚡

**An autonomous AI commerce engine.** Point it at a niche (or let it pick one) and it runs a dropshipping store end to end:

1. **Finds winning products** — Claude researches the live web (TikTok trends, Google Trends, supplier pricing, competitor stores) and returns ranked, evidence-backed picks with realistic costs and margins.
2. **Builds the listings** — SEO titles, converting HTML descriptions, tags, pricing with compare-at anchors.
3. **Publishes to Shopify** — creates real products through the Shopify Admin API.
4. **Generates the marketing** — ad creatives across 4 platforms with distinct angles, welcome + abandoned-cart emails, launch copy.
5. **Runs the social media** — plans a platform-native content calendar and posts to Facebook and X on its own schedule, remembering what it already posted so it never repeats itself.

Every cycle builds on the last: launched products, post history, and the chosen niche persist in `data/state.json`.

## Get your AI link (cloud, ~5 minutes)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/infobuiltsupplyco-gif/Not-Sure)

1. Click the button, sign in to Render (free account, hosting is ~$7/mo)
2. Paste your `ANTHROPIC_API_KEY` and pick a dashboard password when asked
3. Render builds it and gives you **your permanent AI link** — `https://omnistore-….onrender.com`

That URL is your control room, password-protected, with the autopilot already running inside it (dry-run until you add store/social keys in Render's environment settings).

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


# NOVA — Cinematic AI Motion Studio

Free-forever AI video & image generation studio. Type a prompt, pick an
engine profile and a camera move, and NOVA renders a cinematic shot —
entirely in your browser, at zero cost, with no account and no watermark.

## Features

- **Create studio** — prompt box, video/image modes, 6 engine profiles,
  11 motion presets (crash zoom, 360 orbit, bullet time, FPV dive, …),
  4 aspect ratios, 3–10s durations, seeded rerolls.
- **Real exports** — download clips as WebM and stills as PNG.
- **Library** — every generation is saved locally (localStorage) and
  replays deterministically from its seed.
- **$0 architecture** — the free engine is a procedural renderer
  (`src/engine/engine.ts`) that draws seeded cinematic scenes on a canvas.
  Nothing is uploaded and there are no server costs.

## Plugging in hosted models

The studio is provider-agnostic: prompt, engine profile, motion preset,
aspect and duration flow through one interface. To route a profile to a
hosted video/image model, replace the render path in
`src/engine/engine.ts` with the provider API call and supply your own key.
(Hosted providers bill per generation — that part is never free.)

## Development

```bash
npm install
npm run dev     # local dev server
npm run build   # type-check + production build to dist/
```

Deploys to GitHub Pages automatically on push to `main`
(`.github/workflows/deploy.yml`); the app uses a hash router so it works
under the `/Not-Sure/` base path.

## Stack

Vite · React 18 · TypeScript · react-router (hash) · zero runtime dependencies beyond React
