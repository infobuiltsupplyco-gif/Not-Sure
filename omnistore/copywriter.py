"""Listing generation: product idea → publish-ready Shopify listing."""

from __future__ import annotations

from . import ai
from .models import Listing, ProductIdea


def write_listing(idea: ProductIdea) -> Listing:
    return ai.extract(
        "Write a complete, publish-ready Shopify listing for this product. "
        "The description_html should open with a one-line hook, sell benefits as "
        "scannable <ul> bullets, include a short specs section, and close with a "
        "shipping/guarantee note. Price at or near the suggested retail; set a "
        "compare-at price roughly 30-40% higher.\n\n"
        f"Product: {idea.model_dump_json(indent=2)}",
        Listing,
    )
