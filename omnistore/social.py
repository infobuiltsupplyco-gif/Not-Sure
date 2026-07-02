"""Social media: AI-generated content calendar + posting via official APIs.

Posting uses the official Meta Graph API and X API v2 with the operator's own
credentials, in line with each platform's automation rules. With DRY_RUN=true
(the default) or missing credentials, posts are written to output/ instead.
"""

from __future__ import annotations

import json
from typing import Iterable

import requests

from . import ai
from .config import CONFIG, OUTPUT_DIR
from .models import SocialCalendar, SocialPost
from . import state as state_store

GRAPH = "https://graph.facebook.com/v21.0"


def build_calendar(niche: str, launched_products: list[dict], recent_posts: list[dict], days: int = 3) -> SocialCalendar:
    """Generate the next batch of posts, avoiding repeats of recent content."""
    recent = "\n".join(f"- [{p['platform']}] {p['text'][:120]}" for p in recent_posts[-15:]) or "(none yet)"
    products = "\n".join(f"- {p['name']}" for p in launched_products[-10:]) or "(none yet)"

    return ai.extract(
        f"Plan {days} days of social content (2 posts/day across facebook, instagram and x) "
        f"for a dropshipping store in the '{niche}' niche.\n\n"
        f"Products currently in the store:\n{products}\n\n"
        f"Recent posts (do NOT repeat these angles or phrasings):\n{recent}\n\n"
        "Mix goals: mostly value/entertainment for the niche audience, some product "
        "posts, occasional engagement questions. Platform-native voice for each.",
        SocialCalendar,
    )


def publish_post(post: SocialPost) -> bool:
    """Send one post to its platform. Returns True if it actually went live."""
    if post.platform == "facebook" and CONFIG.meta_enabled:
        resp = requests.post(
            f"{GRAPH}/{CONFIG.meta_page_id}/feed",
            data={"message": post.text, "access_token": CONFIG.meta_page_token},
            timeout=30,
        )
        resp.raise_for_status()
        print(f"  [facebook] posted {resp.json().get('id')}")
        return True

    if post.platform == "x" and CONFIG.x_enabled:
        resp = requests.post(
            "https://api.x.com/2/tweets",
            headers={"Authorization": f"Bearer {CONFIG.x_access_token}"},
            json={"text": post.text},
            timeout=30,
        )
        resp.raise_for_status()
        print(f"  [x] posted {resp.json()['data']['id']}")
        return True

    # Instagram requires a media object; without an image pipeline we queue it.
    # Dry-run / missing credentials also land here.
    queued = OUTPUT_DIR / "social_queue.jsonl"
    with queued.open("a") as f:
        f.write(json.dumps(post.model_dump()) + "\n")
    print(f"  [queued] {post.platform}: {post.text[:80]}...")
    return False


def publish_calendar(calendar: SocialCalendar) -> None:
    st = state_store.load()
    for post in calendar.posts:
        live = publish_post(post)
        st["post_history"].append({
            "platform": post.platform,
            "text": post.text,
            "posted_at": state_store.now(),
            "live": live,
        })
    state_store.save(st)
