"""Product research: live web search → structured, ranked product picks."""

from __future__ import annotations

from . import ai
from .config import CONFIG
from .models import ResearchReport


def pick_niche() -> str:
    """Let the AI choose a niche when the operator hasn't set one."""
    return ai.research_web(
        "Research current e-commerce trends and pick ONE dropshipping niche with "
        "strong demand, healthy margins, light competition, and products that ship "
        "well internationally. Avoid electronics with certification burdens and "
        "anything ingestible. Reply with the niche on the first line, then a short "
        "justification.",
        max_searches=6,
    ).strip().splitlines()[0].strip()


def run_research(niche: str, count: int | None = None) -> ResearchReport:
    """Find `count` winning products in `niche`, grounded in live search."""
    count = count or CONFIG.products_per_cycle

    findings = ai.research_web(
        f"Research the '{niche}' dropshipping market as of today.\n\n"
        f"Find {count} specific products that are winning RIGHT NOW. For each, look for:\n"
        "- demand signals (TikTok/Instagram virality, Google Trends, Amazon movers, ad libraries)\n"
        "- realistic supplier pricing on AliExpress/CJdropshipping-style marketplaces\n"
        "- what competitors charge at retail\n"
        "- saturation and risk (IP issues, seasonality, shipping fragility)\n\n"
        "Write a thorough research memo with everything you found, including numbers "
        "and where they came from."
    )

    return ai.extract(
        f"Convert this research memo into a structured report with exactly the {count} "
        f"strongest products. Target markup over supplier cost: {CONFIG.markup}x. "
        f"Niche: {niche}\n\n--- MEMO ---\n{findings}",
        ResearchReport,
    )
