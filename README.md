# OmniStore 🛒⚡

**An autonomous AI commerce engine.** Point it at a niche (or let it pick one) and it runs a dropshipping store end to end:

1. **Finds winning products** — Claude researches the live web (TikTok trends, Google Trends, supplier pricing, competitor stores) and returns ranked, evidence-backed picks with realistic costs and margins.
2. **Builds the listings** — SEO titles, converting HTML descriptions, tags, pricing with compare-at anchors.
3. **Publishes to Shopify** — creates real products through the Shopify Admin API.
4. **Generates the marketing** — ad creatives across 4 platforms with distinct angles, welcome + abandoned-cart emails, launch copy.
5. **Runs the social media** — plans a platform-native content calendar and posts to Facebook and X on its own schedule, remembering what it already posted so it never repeats itself.

Every cycle builds on the last: launched products, post history, and the chosen niche persist in `data/state.json`.

## Quick start

```bash
pip install -r requirements.txt
cp .env.example .env      # add your ANTHROPIC_API_KEY (the only required key)

python -m omnistore run          # one full cycle
python -m omnistore autopilot    # run forever: daily launches + 3x/day social
```

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
