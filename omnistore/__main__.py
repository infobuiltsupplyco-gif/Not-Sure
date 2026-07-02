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

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    if args.command != "status" and not CONFIG.anthropic_api_key:
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
