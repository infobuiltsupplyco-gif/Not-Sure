"""Chat with OmniStore — a conversational command layer over the whole engine.

The AI you talk to here has tools: it can check the store, launch full
cycles, create TikTok videos, and approve/reject queued posts. Long jobs run
in the background so the conversation stays responsive.
"""

from __future__ import annotations

import json
import threading

from anthropic import beta_tool

from . import ai
from .config import CONFIG, DATA_DIR

CHAT_FILE = DATA_DIR / "chat.json"

SYSTEM = """You are OmniStore, the user's autonomous commerce AI. You run their
dropshipping business end to end: product research, Shopify listings, marketing,
social media, and TikTok videos.

- Use your tools — never invent store data or claim work you didn't start.
- Long jobs run in the background: say you've started them and roughly when to
  check back. Use get_store_status to report real progress.
- Be direct, warm and concise. The user may be non-technical: plain language,
  no jargon.
- If dry_run is on, remind the user (briefly) that nothing publishes until they
  turn it off in their settings."""


def history() -> list[dict]:
    if CHAT_FILE.exists():
        return json.loads(CHAT_FILE.read_text())
    return []


def _save(h: list[dict]) -> None:
    CHAT_FILE.write_text(json.dumps(h, indent=2))


def _spawn(fn, *args) -> None:
    threading.Thread(target=fn, args=args, daemon=True).start()


@beta_tool
def get_store_status() -> str:
    """Current store status: niche, launched products, social post count, and TikTok videos awaiting approval."""
    from . import state as state_store, tiktok

    st = state_store.load()
    pending = [e for e in tiktok._load_queue() if e["status"] == "pending"]
    return json.dumps({
        "niche": st.get("niche"),
        "products_launched": [p["name"] for p in st["launched_products"]],
        "social_posts_total": len(st["post_history"]),
        "tiktok_awaiting_approval": [
            {"id": e["id"], "concept": e["plan"]["concept"]} for e in pending
        ],
        "dry_run": CONFIG.dry_run,
        "tiktok_autopost": CONFIG.tiktok_autopost,
    })


@beta_tool
def start_full_cycle(niche: str = "") -> str:
    """Start a full store cycle in the background: research winning products on the live web, create Shopify listings, marketing kits, and social posts.

    Args:
        niche: Optional niche override. Leave empty to use the saved niche or let the AI pick one.
    """
    from . import orchestrator

    _spawn(orchestrator.run_cycle, niche or None)
    return "Full cycle started in the background — new products, marketing and posts typically land within 10–20 minutes. Ask me for status anytime."


@beta_tool
def make_tiktok_videos(count: int = 1) -> str:
    """Research current TikTok trends and create new videos (storyboard, plus a rendered MP4 when raw clips exist in assets/). Videos join the approval queue unless autopost is enabled.

    Args:
        count: How many videos to create (1-5).
    """
    from . import research, state as state_store, tiktok

    def job() -> None:
        niche = CONFIG.niche or state_store.load().get("niche") or research.pick_niche()
        tiktok.plan_videos(niche, count=max(1, min(count, 5)))

    _spawn(job)
    return f"On it — creating {count} trend-riding video(s) in the background. Check status in a few minutes."


@beta_tool
def approve_tiktok_video(video_id: str) -> str:
    """Approve a queued TikTok video by its id — approval is what posts it.

    Args:
        video_id: The queue id, e.g. 'a1b2c3d4'.
    """
    from . import tiktok

    tiktok.approve(video_id)
    return f"Video {video_id} approved."


@beta_tool
def reject_tiktok_video(video_id: str) -> str:
    """Reject a queued TikTok video by its id.

    Args:
        video_id: The queue id, e.g. 'a1b2c3d4'.
    """
    from . import tiktok

    tiktok.set_status(video_id, "rejected")
    return f"Video {video_id} rejected."


TOOLS = [get_store_status, start_full_cycle, make_tiktok_videos,
         approve_tiktok_video, reject_tiktok_video]


def chat_turn(user_message: str) -> str:
    h = history()
    h.append({"role": "user", "content": user_message})

    runner = ai.client().beta.messages.tool_runner(
        model=ai.MODEL,
        max_tokens=4096,
        thinking={"type": "adaptive"},
        system=SYSTEM,
        tools=TOOLS,
        messages=[{"role": m["role"], "content": m["content"]} for m in h[-24:]],
    )
    final = runner.until_done()
    reply = "".join(b.text for b in final.content if b.type == "text").strip() \
        or "(started — ask me for status in a minute)"

    h.append({"role": "assistant", "content": reply})
    _save(h)
    return reply


def repl() -> None:
    print("Chat with OmniStore — your store, in conversation. Ctrl-C to exit.\n")
    while True:
        try:
            msg = input("you › ").strip()
        except (KeyboardInterrupt, EOFError):
            print()
            return
        if not msg:
            continue
        try:
            print(f"\nomnistore › {chat_turn(msg)}\n")
        except Exception as exc:
            print(f"\n[error] {exc}\n")
