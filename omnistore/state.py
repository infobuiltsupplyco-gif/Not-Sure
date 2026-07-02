"""Tiny JSON state store so autopilot cycles remember what they've done."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from .config import DATA_DIR

STATE_FILE = DATA_DIR / "state.json"

_DEFAULT: dict[str, Any] = {
    "niche": None,
    "launched_products": [],   # [{name, shopify_id, launched_at, listing}]
    "post_history": [],        # [{platform, text, posted_at, live}]
    "research_history": [],    # [{niche, at, product_names}]
}


def load() -> dict[str, Any]:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return json.loads(json.dumps(_DEFAULT))


def save(state: dict[str, Any]) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2, default=str))


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")
