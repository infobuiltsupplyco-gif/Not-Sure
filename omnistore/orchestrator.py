"""The autopilot: one call runs the whole pipeline end to end.

    niche → research → listings → Shopify → marketing kits → social calendar

Each cycle remembers what it launched and posted, so the next cycle builds on
the store instead of starting over.
"""

from __future__ import annotations

from . import copywriter, marketing, research, shopify_client, social
from . import state as state_store
from .config import CONFIG


def run_cycle(niche: str | None = None) -> None:
    st = state_store.load()

    # 1. Niche: operator setting > saved state > let the AI decide.
    niche = niche or CONFIG.niche or st.get("niche")
    if not niche:
        print("▸ No niche set — asking the AI to pick one...")
        niche = research.pick_niche()
        print(f"  chose: {niche}")
    st["niche"] = niche
    state_store.save(st)

    # 2. Research winning products on the live web.
    print(f"▸ Researching '{niche}' for {CONFIG.products_per_cycle} winning products...")
    report = research.run_research(niche)
    print(f"  {report.market_summary[:200]}...")

    already_launched = {p["name"].lower() for p in st["launched_products"]}

    # 3-5. For each new product: listing → Shopify → marketing kit.
    for idea in report.products:
        if idea.name.lower() in already_launched:
            print(f"▸ Skipping '{idea.name}' (already launched)")
            continue

        print(f"▸ Launching '{idea.name}' — {idea.why_winning[:100]}...")
        listing = copywriter.write_listing(idea)
        shopify_id = shopify_client.publish_listing(listing)
        marketing.build_kit(idea, listing)

        st = state_store.load()
        st["launched_products"].append({
            "name": idea.name,
            "shopify_id": shopify_id,
            "launched_at": state_store.now(),
            "listing": listing.model_dump(),
        })
        st["research_history"].append({
            "niche": niche,
            "at": state_store.now(),
            "product_names": [p.name for p in report.products],
        })
        state_store.save(st)

    # 6. Social calendar for everything now in the store.
    print("▸ Building and publishing social calendar...")
    st = state_store.load()
    calendar = social.build_calendar(niche, st["launched_products"], st["post_history"])
    social.publish_calendar(calendar)

    mode = "DRY RUN — nothing was published" if CONFIG.dry_run else "LIVE"
    print(f"\n✔ Cycle complete ({mode}). {len(st['launched_products'])} products in store.")


def run_social_only() -> None:
    """Lighter cycle for intra-day runs: fresh social content, no new products."""
    st = state_store.load()
    niche = CONFIG.niche or st.get("niche")
    if not niche:
        print("No niche yet — run a full cycle first (`python -m omnistore run`).")
        return
    calendar = social.build_calendar(niche, st["launched_products"], st["post_history"], days=1)
    social.publish_calendar(calendar)
