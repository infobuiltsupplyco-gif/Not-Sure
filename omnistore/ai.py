"""Claude client helpers.

All AI calls run through here: one client, adaptive thinking, streaming for
long generations, prompt caching on the stable system prompt, and typed
structured outputs via `messages.parse`.
"""

from __future__ import annotations

import os
from typing import Type, TypeVar

import anthropic
from pydantic import BaseModel

# Default is the strongest model; set OMNISTORE_MODEL=claude-haiku-4-5 for
# the cheapest possible runs (~5x less per token, weaker research).
MODEL = os.getenv("OMNISTORE_MODEL", "").strip() or "claude-opus-4-8"

SYSTEM_PROMPT = """You are the commerce brain of OmniStore, an autonomous dropshipping engine.

You research products, write listings, and produce marketing with the judgment of a
seasoned e-commerce operator. Your standards:

- Evidence over hype. Product picks must be justified by what research actually found,
  not generic claims. Flag saturation and risk honestly.
- Numbers must be plausible. Supplier costs reflect real AliExpress/CJdropshipping
  pricing; retail prices respect the target margin and what the market will bear.
- Copy converts. Benefit-led, specific, scannable. No filler adjectives, no fake
  urgency, no claims that could get an ad account banned or violate consumer law.
- Social content sounds human. Platform-native voice, varied formats, never the same
  template twice.

You write for a real store owned by a real person. Everything you produce should be
publishable as-is."""

T = TypeVar("T", bound=BaseModel)

_client: anthropic.Anthropic | None = None


def client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


def _system_blocks() -> list[dict]:
    return [{
        "type": "text",
        "text": SYSTEM_PROMPT,
        "cache_control": {"type": "ephemeral"},
    }]


def generate(prompt: str, max_tokens: int = 32000) -> str:
    """Free-text generation with adaptive thinking, streamed to avoid timeouts."""
    with client().messages.stream(
        model=MODEL,
        max_tokens=max_tokens,
        thinking={"type": "adaptive"},
        system=_system_blocks(),
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        message = stream.get_final_message()
    return next((b.text for b in message.content if b.type == "text"), "")


def research_web(prompt: str, max_searches: int = 12, max_tokens: int = 32000) -> str:
    """Generation grounded in live web search (server-side tool, dynamic filtering)."""
    with client().messages.stream(
        model=MODEL,
        max_tokens=max_tokens,
        thinking={"type": "adaptive"},
        system=_system_blocks(),
        tools=[{
            "type": "web_search_20260209",
            "name": "web_search",
            "max_uses": max_searches,
        }],
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        message = stream.get_final_message()

    # Server tools can pause the turn at the iteration limit; resume until done.
    while message.stop_reason == "pause_turn":
        with client().messages.stream(
            model=MODEL,
            max_tokens=max_tokens,
            thinking={"type": "adaptive"},
            system=_system_blocks(),
            tools=[{
                "type": "web_search_20260209",
                "name": "web_search",
                "max_uses": max_searches,
            }],
            messages=[
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": message.content},
            ],
        ) as stream:
            message = stream.get_final_message()

    return "\n".join(b.text for b in message.content if b.type == "text")


def extract(prompt: str, schema: Type[T], max_tokens: int = 32000) -> T:
    """Structured generation: returns a validated instance of `schema`."""
    response = client().messages.parse(
        model=MODEL,
        max_tokens=max_tokens,
        thinking={"type": "adaptive"},
        system=_system_blocks(),
        messages=[{"role": "user", "content": prompt}],
        output_format=schema,
    )
    if response.parsed_output is None:
        raise RuntimeError(f"Model did not return valid {schema.__name__} (stop_reason={response.stop_reason})")
    return response.parsed_output
