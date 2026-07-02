"""CLI entry point: `python -m omnistore <command>`."""

from __future__ import annotations

import argparse
import json
import sys

from .config import CONFIG


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="omnistore",
        description="OmniStore — autonomous AI dropshipping engine",
    )
    sub = parser.add_subparsers(dest="command")

    p_run = sub.add_parser("run", help="Run one full cycle: research → launch → market → post")
    p_run.add_argument("--niche", help="Override the niche for this cycle")

    p_research = sub.add_parser("research", help="Research only: print winning products for a niche")
    p_research.add_argument("--niche", help="Niche to research (AI picks one if omitted)")

    sub.add_parser("social", help="Generate and publish one day of social content")
    sub.add_parser("autopilot", help="Run forever on a daily schedule")
    sub.add_parser("status", help="Show what the engine has launched and posted")

    p_tiktok = sub.add_parser("tiktok", help="TikTok videos: plan → review → approve → post")
    tiktok_sub = p_tiktok.add_subparsers(dest="tiktok_command", required=True)
    p_tt_plan = tiktok_sub.add_parser("plan", help="Research trends and storyboard/render new videos")
    p_tt_plan.add_argument("--count", type=int, default=3)
    p_tt_plan.add_argument("--niche", help="Override the niche")
    tiktok_sub.add_parser("queue", help="Show videos awaiting your approval")
    p_tt_ok = tiktok_sub.add_parser("approve", help="Approve a video — this is what triggers posting")
    p_tt_ok.add_argument("--id", required=True)
    p_tt_no = tiktok_sub.add_parser("reject", help="Reject a queued video")
    p_tt_no.add_argument("--id", required=True)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    needs_ai = args.command in ("run", "research", "social", "autopilot") or (
        args.command == "tiktok" and args.tiktok_command == "plan"
    )
    if needs_ai and not CONFIG.anthropic_api_key:
        sys.exit("ANTHROPIC_API_KEY is not set. Copy .env.example to .env and fill it in.")

    if args.command == "run":
        from . import orchestrator
        orchestrator.run_cycle(niche=args.niche)

    elif args.command == "research":
        from . import research
        niche = args.niche or CONFIG.niche or research.pick_niche()
        report = research.run_research(niche)
        print(json.dumps(report.model_dump(), indent=2))

    elif args.command == "social":
        from . import orchestrator
        orchestrator.run_social_only()

    elif args.command == "autopilot":
        from . import scheduler
        scheduler.start()

    elif args.command == "tiktok":
        from . import tiktok
        if args.tiktok_command == "plan":
            from . import research, state as state_store
            niche = args.niche or CONFIG.niche or state_store.load().get("niche")
            if not niche:
                niche = research.pick_niche()
                print(f"AI picked niche: {niche}")
            tiktok.plan_videos(niche, count=args.count)
        elif args.tiktok_command == "queue":
            tiktok.show_queue()
        elif args.tiktok_command == "approve":
            tiktok.approve(args.id)
        elif args.tiktok_command == "reject":
            tiktok.set_status(args.id, "rejected")
            print(f"Rejected {args.id}.")

    elif args.command == "status":
        from . import state as state_store
        st = state_store.load()
        print(f"Niche: {st.get('niche') or '(not set)'}")
        print(f"Products launched: {len(st['launched_products'])}")
        for p in st["launched_products"]:
            live = f"shopify:{p['shopify_id']}" if p.get("shopify_id") else "draft"
            print(f"  - {p['name']}  [{live}]  {p['launched_at']}")
        print(f"Posts: {len(st['post_history'])} "
              f"({sum(1 for p in st['post_history'] if p.get('live'))} live)")


if __name__ == "__main__":
    main()
