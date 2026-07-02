"""Shopify Admin REST client — creates real products, or saves drafts in dry-run."""

from __future__ import annotations

import json
from typing import Any

import requests

from .config import CONFIG, OUTPUT_DIR
from .models import Listing

API_VERSION = "2024-10"


def _url(path: str) -> str:
    return f"https://{CONFIG.shopify_domain}/admin/api/{API_VERSION}/{path}"


def _headers() -> dict[str, str]:
    return {
        "X-Shopify-Access-Token": CONFIG.shopify_token,
        "Content-Type": "application/json",
    }


def _listing_payload(listing: Listing) -> dict[str, Any]:
    variant: dict[str, Any] = {
        "price": f"{listing.price_usd:.2f}",
        "inventory_management": None,  # dropship: don't track stock in Shopify
    }
    if listing.compare_at_price_usd:
        variant["compare_at_price"] = f"{listing.compare_at_price_usd:.2f}"

    product: dict[str, Any] = {
        "title": listing.title,
        "body_html": listing.description_html,
        "product_type": listing.product_type,
        "tags": ", ".join(listing.tags),
        "status": "active",
        "variants": [variant],
        "metafields_global_description_tag": listing.seo_meta_description,
    }
    if listing.options:
        product["options"] = [{"name": o.name, "values": o.values} for o in listing.options]
    return {"product": product}


def publish_listing(listing: Listing) -> str | None:
    """Create the product in Shopify. Returns the product id, or None in dry-run."""
    payload = _listing_payload(listing)

    if not CONFIG.shopify_enabled:
        draft = OUTPUT_DIR / f"shopify_draft_{_slug(listing.title)}.json"
        draft.write_text(json.dumps(payload, indent=2))
        print(f"  [dry-run] Shopify draft saved → {draft}")
        return None

    resp = requests.post(_url("products.json"), headers=_headers(), json=payload, timeout=30)
    resp.raise_for_status()
    product = resp.json()["product"]
    print(f"  [shopify] created product {product['id']}: {product['title']}")
    return str(product["id"])


def _slug(text: str) -> str:
    return "".join(c.lower() if c.isalnum() else "-" for c in text)[:60].strip("-")
