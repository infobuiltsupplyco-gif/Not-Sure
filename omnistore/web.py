"""The OmniStore control room — a web dashboard for the whole engine.

Launch with `python -m omnistore web`, open http://127.0.0.1:8787 and run
everything from the browser: full cycles, TikTok video generation, the
approval queue with in-page video previews, autopilot status.
"""

from __future__ import annotations

import html
import threading
from pathlib import Path

from flask import Flask, redirect, send_file

from . import state as state_store
from .config import CONFIG

app = Flask(__name__)

_job: dict[str, str | None] = {"name": None}


def _background(name: str, fn, *args) -> bool:
    if _job["name"]:
        return False
    _job["name"] = name

    def run() -> None:
        try:
            fn(*args)
        except Exception as exc:
            print(f"[web] {name} failed: {exc}")
        finally:
            _job["name"] = None

    threading.Thread(target=run, daemon=True).start()
    return True


def _e(text: str) -> str:
    return html.escape(str(text))


STYLE = """
body{font-family:-apple-system,Segoe UI,sans-serif;background:#0d1117;color:#e6edf3;margin:0;padding:2rem;max-width:960px;margin-inline:auto}
h1{font-size:1.6rem} h2{font-size:1.1rem;margin-top:2rem;border-bottom:1px solid #21262d;padding-bottom:.4rem}
.card{background:#161b22;border:1px solid #21262d;border-radius:10px;padding:1rem 1.2rem;margin:.8rem 0}
.stat{display:inline-block;margin-right:2rem} .stat b{font-size:1.4rem;display:block}
.pill{display:inline-block;padding:.1rem .6rem;border-radius:99px;font-size:.75rem;background:#1f6feb33;border:1px solid #1f6feb}
.pill.warn{background:#d2992233;border-color:#d29922}
button{background:#238636;color:#fff;border:0;border-radius:6px;padding:.5rem 1rem;font-size:.9rem;cursor:pointer;margin-right:.5rem}
button.gray{background:#21262d} button.red{background:#da3633}
form{display:inline} video{max-width:200px;border-radius:8px;display:block;margin:.5rem 0}
small{color:#8b949e} .scene{color:#8b949e;font-size:.85rem;margin-left:1rem}
.banner{background:#1f6feb22;border:1px solid #1f6feb;border-radius:8px;padding:.6rem 1rem;margin-bottom:1rem}
"""


@app.get("/")
def home():
    st = state_store.load()
    queue = _tiktok_queue()
    pending = [e for e in queue if e["status"] == "pending"]

    busy = f'<div class="banner">⏳ Working: <b>{_e(_job["name"])}</b> — refresh in a minute.</div>' if _job["name"] else ""
    key_warn = "" if CONFIG.anthropic_api_key else \
        '<div class="banner">⚠️ <b>ANTHROPIC_API_KEY missing</b> — the AI can\'t think yet. Add it to your .env and restart.</div>'

    mode = '<span class="pill warn">LIVE</span>' if not CONFIG.dry_run else '<span class="pill">DRY RUN</span>'
    tiktok_mode = '<span class="pill warn">AUTOPOST 3x/day</span>' if CONFIG.tiktok_autopost else '<span class="pill">approval queue</span>'

    products = "".join(
        f"<div class='card'><b>{_e(p['name'])}</b> "
        f"<small>{'shopify:' + _e(p['shopify_id']) if p.get('shopify_id') else 'draft'} · {_e(p['launched_at'])}</small></div>"
        for p in st["launched_products"][-8:]
    ) or "<small>Nothing launched yet — run a cycle.</small>"

    videos = "".join(_video_card(e) for e in pending) or \
        "<small>No videos waiting. Generate some below.</small>"

    return f"""<!doctype html><html><head><title>OmniStore</title><style>{STYLE}</style></head><body>
{busy}{key_warn}
<h1>🛒⚡ OmniStore <small>autonomous commerce engine</small></h1>
<div class="card">
  <span class="stat"><b>{_e(st.get('niche') or '—')}</b><small>niche</small></span>
  <span class="stat"><b>{len(st['launched_products'])}</b><small>products launched</small></span>
  <span class="stat"><b>{len(st['post_history'])}</b><small>social posts</small></span>
  <span class="stat"><b>{len(pending)}</b><small>videos in queue</small></span>
  <div style="margin-top:.6rem">store: {mode} &nbsp; tiktok: {tiktok_mode}</div>
</div>

<h2>Run the AI</h2>
<form method="post" action="/actions/run-cycle"><button>▶ Full cycle (research → launch → market → post)</button></form>
<form method="post" action="/actions/plan-videos"><button>🎬 Make TikTok videos now</button></form>
<form method="post" action="/actions/social"><button class="gray">✍ Social refresh</button></form>
<p><small>For always-on 3x/day posting, keep <code>python -m omnistore autopilot</code> running.</small></p>

<h2>TikTok queue {'' if not CONFIG.tiktok_autopost else '(autopost is ON — rendered videos skip this queue)'}</h2>
{videos}

<h2>Store</h2>
{products}
</body></html>"""


def _video_card(e: dict) -> str:
    p = e["plan"]
    preview = f'<video controls src="/tiktok/{_e(e["id"])}/video"></video>' if e.get("video_path") else \
        "<small>storyboard only — drop clips into assets/ and regenerate to auto-render</small>"
    scenes = "".join(
        f"<div class='scene'>scene {i} ({_e(s['seconds'])}s): {_e(s['visual'])}"
        + (f" — “{_e(s['on_screen_text'])}”" if s['on_screen_text'] else "") + "</div>"
        for i, s in enumerate(p["scenes"], 1)
    )
    tags = " ".join("#" + _e(h).lstrip("#") for h in p["hashtags"])
    return f"""<div class="card">
<b>{_e(p['concept'])}</b> <small>riding: {_e(p['trend_basis'])}</small><br>
<small>hook: {_e(p['hook'])} · sound: {_e(p['sound_suggestion'])}</small>
{preview}
<div>{_e(p['caption'])} <small>{tags}</small></div>
{scenes}
<div style="margin-top:.7rem">
<form method="post" action="/tiktok/{_e(e['id'])}/approve"><button>✔ Approve &amp; post</button></form>
<form method="post" action="/tiktok/{_e(e['id'])}/reject"><button class="red">✖ Reject</button></form>
</div></div>"""


def _tiktok_queue() -> list[dict]:
    from . import tiktok
    return tiktok._load_queue()


@app.post("/actions/run-cycle")
def action_run_cycle():
    from . import orchestrator
    _background("full cycle", orchestrator.run_cycle)
    return redirect("/")


@app.post("/actions/plan-videos")
def action_plan_videos():
    from . import research, tiktok

    def job():
        niche = CONFIG.niche or state_store.load().get("niche") or research.pick_niche()
        tiktok.plan_videos(niche, count=3)

    _background("making TikTok videos", job)
    return redirect("/")


@app.post("/actions/social")
def action_social():
    from . import orchestrator
    _background("social refresh", orchestrator.run_social_only)
    return redirect("/")


@app.post("/tiktok/<entry_id>/approve")
def action_approve(entry_id: str):
    from . import tiktok
    _background(f"posting video {entry_id}", tiktok.approve, entry_id)
    return redirect("/")


@app.post("/tiktok/<entry_id>/reject")
def action_reject(entry_id: str):
    from . import tiktok
    tiktok.set_status(entry_id, "rejected")
    return redirect("/")


@app.get("/tiktok/<entry_id>/video")
def serve_video(entry_id: str):
    for e in _tiktok_queue():
        if e["id"] == entry_id and e.get("video_path") and Path(e["video_path"]).exists():
            return send_file(e["video_path"], mimetype="video/mp4")
    return ("not found", 404)


def start(port: int = 8787) -> None:
    print(f"\n  OmniStore control room → http://127.0.0.1:{port}\n")
    app.run(host="127.0.0.1", port=port, debug=False)
