# Banana Skill (project install)

AI image generation skill where Claude acts as Creative Director for Google's
Gemini Nano Banana image models. Vendored into this repository from
[AgriciDaniel/banana-claude](https://github.com/AgriciDaniel/banana-claude)
(v1.4.1, MIT licensed — see `LICENSE` in this directory).

## Usage

In any Claude Code session in this repo:

```
/banana generate "a hero image for a coffee shop website"
/banana edit ~/photo.png "remove the background"
/banana chat            # multi-turn creative session
/banana batch <idea> 3  # N variations
/banana setup           # configure the MCP server + API key
```

Claude interprets your intent, picks a domain mode (Cinema, Product, Portrait,
Editorial, UI, Logo, Landscape, Infographic, Abstract), builds a prompt with
Google's 5-component formula, and calls Gemini.

## Setup

1. Get a free Google AI API key: https://aistudio.google.com/apikey
2. Either run `/banana setup` (configures the `@ycse/nanobanana-mcp` MCP
   server, requires Node.js 18+), or export `GOOGLE_AI_API_KEY` and let the
   skill fall back to the direct-API scripts in `scripts/`.
3. Verify with `python3 scripts/validate_setup.py`.

## Layout

- `SKILL.md` — the skill definition (Creative Director pipeline)
- `references/` — prompt engineering, model specs, MCP tools, post-processing,
  cost tracking, presets (loaded on demand)
- `scripts/` — setup, validation, direct-API generate/edit fallbacks, cost
  tracker, preset manager, CSV batch planner
- `../../agents/brief-constructor.md` — subagent that builds the Reasoning Brief
