"""Marketing kit generation: ads, lifecycle emails, launch copy per product."""

from __future__ import annotations

import json

from . import ai
from .config import OUTPUT_DIR
from .models import Listing, MarketingKit, ProductIdea


def build_kit(idea: ProductIdea, listing: Listing) -> MarketingKit:
    kit = ai.extract(
        "Create a complete marketing kit for this product launch:\n"
        "- At least 4 ad creatives spread across Facebook, Instagram, TikTok and Google,\n"
        "  each with a DIFFERENT psychological angle (pain point, social proof, novelty,\n"
        "  urgency-without-fakery).\n"
        "- A welcome email for new subscribers introducing the store and this product.\n"
        "- An abandoned-cart email that recovers the sale without being pushy.\n"
        "- A short launch announcement blurb.\n\n"
        f"Product idea: {idea.model_dump_json(indent=2)}\n\n"
        f"Live listing: {listing.model_dump_json(indent=2)}",
        MarketingKit,
    )

    out = OUTPUT_DIR / f"marketing_{_slug(idea.name)}.json"
    out.write_text(json.dumps(kit.model_dump(), indent=2))
    print(f"  [marketing] kit saved → {out}")
    return kit


def _slug(text: str) -> str:
    return "".join(c.lower() if c.isalnum() else "-" for c in text)[:60].strip("-")
