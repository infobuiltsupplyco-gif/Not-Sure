"""Autopilot scheduler: full cycle daily, fresh social content through the day."""

from __future__ import annotations

import time

import schedule

from . import orchestrator


def start() -> None:
    print("OmniStore autopilot engaged.")
    print("  09:00 UTC  full cycle: research → launch → market → post")
    print("  13:00 UTC  social refresh")
    print("  18:00 UTC  social refresh")
    print("Ctrl-C to stop.\n")

    schedule.every().day.at("09:00").do(_safe, orchestrator.run_cycle)
    schedule.every().day.at("13:00").do(_safe, orchestrator.run_social_only)
    schedule.every().day.at("18:00").do(_safe, orchestrator.run_social_only)

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
