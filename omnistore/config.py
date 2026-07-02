"""Environment-driven configuration with a safe dry-run default."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
OUTPUT_DIR = ROOT / "output"


def _bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


@dataclass
class Config:
    anthropic_api_key: str | None = field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY"))
    niche: str = field(default_factory=lambda: os.getenv("OMNISTORE_NICHE", "").strip())

    shopify_domain: str = field(default_factory=lambda: os.getenv("SHOPIFY_STORE_DOMAIN", "").strip())
    shopify_token: str = field(default_factory=lambda: os.getenv("SHOPIFY_ACCESS_TOKEN", "").strip())

    meta_page_id: str = field(default_factory=lambda: os.getenv("META_PAGE_ID", "").strip())
    meta_page_token: str = field(default_factory=lambda: os.getenv("META_PAGE_ACCESS_TOKEN", "").strip())
    meta_ig_user_id: str = field(default_factory=lambda: os.getenv("META_IG_USER_ID", "").strip())

    x_access_token: str = field(default_factory=lambda: os.getenv("X_ACCESS_TOKEN", "").strip())

    dry_run: bool = field(default_factory=lambda: _bool("OMNISTORE_DRY_RUN", True))
    products_per_cycle: int = field(default_factory=lambda: int(os.getenv("OMNISTORE_PRODUCTS_PER_CYCLE", "3")))
    markup: float = field(default_factory=lambda: float(os.getenv("OMNISTORE_MARKUP", "2.5")))

    @property
    def shopify_enabled(self) -> bool:
        return bool(self.shopify_domain and self.shopify_token) and not self.dry_run

    @property
    def meta_enabled(self) -> bool:
        return bool(self.meta_page_id and self.meta_page_token) and not self.dry_run

    @property
    def x_enabled(self) -> bool:
        return bool(self.x_access_token) and not self.dry_run


CONFIG = Config()
DATA_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
