"""Autopilot scheduler: full cycle daily, fresh social content through the day."""

from __future__ import annotations

import time

import schedule

from . import orchestrator
from .config import CONFIG


def _tiktok_slot() -> None:
    from . import state as state_store, tiktok

    niche = CONFIG.niche or state_store.load().get("niche")
    if not niche:
        print("[scheduler] tiktok slot skipped — no niche yet (full cycle sets it)")
        return
    tiktok.plan_videos(niche, count=1)


def start() -> None:
    mode = "AUTOPOST" if CONFIG.tiktok_autopost else "approval queue"
    print("OmniStore autopilot engaged.")
    print("  09:00 UTC  full cycle: research → launch → market → post")
    print(f"  09:30 UTC  tiktok video #1 ({mode})")
    print("  13:00 UTC  social refresh")
    print(f"  14:00 UTC  tiktok video #2 ({mode})")
    print("  18:00 UTC  social refresh")
    print(f"  19:00 UTC  tiktok video #3 ({mode})")
    print("Ctrl-C to stop.\n")

    schedule.every().day.at("09:00").do(_safe, orchestrator.run_cycle)
    schedule.every().day.at("09:30").do(_safe, _tiktok_slot)
    schedule.every().day.at("13:00").do(_safe, orchestrator.run_social_only)
    schedule.every().day.at("14:00").do(_safe, _tiktok_slot)
    schedule.every().day.at("18:00").do(_safe, orchestrator.run_social_only)
    schedule.every().day.at("19:00").do(_safe, _tiktok_slot)

    # Kick off immediately so the operator sees it work on day one.
    _safe(orchestrator.run_cycle)

    while True:
        schedule.run_pending()
        time.sleep(30)


def _safe(job) -> None:
    try:
        job()
    except Exception as exc:  # keep the autopilot alive across transient failures
        print(f"[scheduler] job failed, will retry next slot: {exc}")
