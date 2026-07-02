"""TikTok: trend-driven video creation with a human approval gate.

Pipeline:
    1. `plan`    — Claude researches what's trending on TikTok in your niche
                   RIGHT NOW, storyboards N videos to ride those trends, and
                   (if you've dropped clips/images into assets/) assembles a
                   ready-to-post 9:16 MP4 with ffmpeg.
    2. `queue`   — you review every pending video: storyboard, caption,
                   hashtags, rendered file.
    3. `approve` — ONLY after your explicit approval does a video post, via
                   TikTok's official Content Posting API (your own developer
                   app + OAuth token — never your password).

Nothing is ever posted without approval. There is deliberately no way to
bypass the queue.

Posting notes: unaudited TikTok developer apps may only post with
privacy_level SELF_ONLY (visible just to you in-app — a second safety layer);
after TikTok audits your app you can set TIKTOK_PRIVACY_LEVEL=PUBLIC_TO_EVERYONE.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import uuid
from pathlib import Path
from typing import Any

import requests

from . import ai
from .config import CONFIG, DATA_DIR, OUTPUT_DIR, ROOT
from .models import TikTokBatch, TikTokVideoPlan
from . import state as state_store

ASSETS_DIR = ROOT / "assets"
VIDEO_DIR = OUTPUT_DIR / "tiktok"
QUEUE_FILE = DATA_DIR / "tiktok_queue.json"

TIKTOK_API = "https://open.tiktokapis.com/v2"


# ── queue ────────────────────────────────────────────────────────────────

def _load_queue() -> list[dict[str, Any]]:
    if QUEUE_FILE.exists():
        return json.loads(QUEUE_FILE.read_text())
    return []


def _save_queue(queue: list[dict[str, Any]]) -> None:
    QUEUE_FILE.write_text(json.dumps(queue, indent=2, default=str))


# ── 1. plan: research trends, storyboard videos, assemble drafts ────────

def plan_videos(niche: str, count: int = 3) -> list[dict[str, Any]]:
    print(f"▸ Researching what's trending on TikTok for '{niche}'...")
    findings = ai.research_web(
        f"Research what is trending on TikTok RIGHT NOW that a store in the "
        f"'{niche}' niche could ride: trending sounds, formats (e.g. 'X things "
        f"I wish I knew', ASMR unboxing, before/after), challenges, and hashtags. "
        f"Also look at what top-performing accounts in this niche posted this week. "
        f"Write a memo with specifics — names of sounds, formats, hashtags, and why "
        f"each is working.",
        max_searches=8,
    )

    st = state_store.load()
    recent = [e["plan"]["concept"] for e in _load_queue()][-10:]
    products = [p["name"] for p in st.get("launched_products", [])][-10:]

    batch = ai.extract(
        f"Storyboard {count} TikTok videos for a '{niche}' store, each riding a "
        f"specific trend from this research. Rules: native TikTok energy, hook in "
        f"the first 2 seconds, 15-35s total, mostly value/entertainment with at most "
        f"one direct product video. Never recycle these recent concepts: {recent}\n\n"
        f"Products available to feature: {products or '(none yet — keep it product-free)'}\n\n"
        f"--- TREND RESEARCH ---\n{findings}",
        TikTokBatch,
    )
    print(f"  trends: {batch.trend_summary[:180]}...")

    queue = _load_queue()
    created = []
    for plan in batch.videos:
        entry_id = uuid.uuid4().hex[:8]
        video_path = assemble_video(plan, entry_id)
        entry = {
            "id": entry_id,
            "status": "pending",           # pending → approved/posted | rejected
            "created_at": state_store.now(),
            "plan": plan.model_dump(),
            "video_path": str(video_path) if video_path else None,
        }
        queue.append(entry)
        created.append(entry)
        print(f"  [{entry_id}] {plan.concept}"
              + (f" → {video_path}" if video_path else "  (storyboard only — add clips to assets/ to auto-render)"))

    _save_queue(queue)

    if CONFIG.tiktok_autopost:
        for entry in created:
            if entry["video_path"]:
                approve(entry["id"])
        print(f"\n{len(created)} video(s) processed in AUTOPOST mode.")
    else:
        print(f"\n{len(created)} video(s) queued. Review with `python -m omnistore tiktok queue`, "
              f"then `python -m omnistore tiktok approve --id <ID>` to post.")
    return created


# ── 2. assemble: storyboard + your raw clips → 9:16 MP4 via ffmpeg ──────

def assemble_video(plan: TikTokVideoPlan, entry_id: str) -> Path | None:
    """Render the storyboard into a vertical MP4 using media from assets/.

    Uses whatever clips (.mp4/.mov) or images (.jpg/.png) you drop into
    assets/, cycling through them scene by scene with the storyboard's text
    overlays. Returns None (storyboard-only) when there are no assets or no
    ffmpeg — the plan still queues and can be shot/edited manually.
    """
    if not shutil.which("ffmpeg"):
        return None
    assets = sorted(
        p for p in ASSETS_DIR.glob("*")
        if p.suffix.lower() in (".mp4", ".mov", ".jpg", ".jpeg", ".png")
    ) if ASSETS_DIR.exists() else []
    if not assets:
        return None

    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    scene_files: list[Path] = []

    for i, scene in enumerate(plan.scenes):
        src = assets[i % len(assets)]
        out = VIDEO_DIR / f"{entry_id}_scene{i}.mp4"
        dur = max(1.0, min(scene.seconds, 15.0))
        overlay = _drawtext(scene.on_screen_text)

        if src.suffix.lower() in (".jpg", ".jpeg", ".png"):
            inputs = ["-loop", "1", "-t", f"{dur}", "-i", str(src)]
        else:
            inputs = ["-t", f"{dur}", "-i", str(src)]

        vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30"
        if overlay:
            vf += f",{overlay}"

        cmd = ["ffmpeg", "-y", *inputs, "-vf", vf, "-an",
               "-c:v", "libx264", "-pix_fmt", "yuv420p", str(out)]
        if subprocess.run(cmd, capture_output=True).returncode != 0:
            return None
        scene_files.append(out)

    concat_list = VIDEO_DIR / f"{entry_id}_concat.txt"
    concat_list.write_text("".join(f"file '{f.name}'\n" for f in scene_files))
    final = VIDEO_DIR / f"{entry_id}.mp4"
    result = subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
         "-c", "copy", str(final)],
        capture_output=True, cwd=VIDEO_DIR,
    )
    for f in (*scene_files, concat_list):
        f.unlink(missing_ok=True)
    return final if result.returncode == 0 else None


def _drawtext(text: str) -> str:
    if not text.strip():
        return ""
    safe = text.replace("\\", "").replace("'", "’").replace(":", "\\:").replace(",", "\\,")
    return (
        f"drawtext=text='{safe}':fontcolor=white:fontsize=64:borderw=4:bordercolor=black"
        f":x=(w-text_w)/2:y=h*0.72"
    )


# ── 3. review + approve: the human gate ──────────────────────────────────

def show_queue() -> None:
    queue = _load_queue()
    pending = [e for e in queue if e["status"] == "pending"]
    if not pending:
        print("No videos awaiting approval. Generate some: `python -m omnistore tiktok plan`")
        return
    for e in pending:
        p = e["plan"]
        print(f"\n[{e['id']}]  {p['concept']}")
        print(f"  trend:    {p['trend_basis']}")
        print(f"  hook:     {p['hook']}")
        print(f"  sound:    {p['sound_suggestion']}")
        print(f"  caption:  {p['caption']}  {' '.join('#' + h.lstrip('#') for h in p['hashtags'])}")
        print(f"  video:    {e['video_path'] or '(storyboard only — no rendered file)'}")
        for i, s in enumerate(p["scenes"], 1):
            print(f"    scene {i} ({s['seconds']}s): {s['visual']}"
                  + (f" | text: {s['on_screen_text']}" if s["on_screen_text"] else ""))
    print(f"\napprove: python -m omnistore tiktok approve --id <ID>")
    print(f"reject:  python -m omnistore tiktok reject --id <ID>")


def set_status(entry_id: str, status: str) -> dict[str, Any] | None:
    queue = _load_queue()
    for e in queue:
        if e["id"] == entry_id:
            e["status"] = status
            _save_queue(queue)
            return e
    print(f"No queued video with id '{entry_id}'.")
    return None


def approve(entry_id: str) -> None:
    entry = set_status(entry_id, "approved")
    if not entry:
        return
    plan = entry["plan"]
    caption = f"{plan['caption']} {' '.join('#' + h.lstrip('#') for h in plan['hashtags'])}".strip()

    if not entry["video_path"] or not Path(entry["video_path"]).exists():
        print("Approved, but there's no rendered video file to upload. "
              "Shoot/edit it from the storyboard, or drop raw clips into assets/ and re-plan.")
        return
    if not CONFIG.tiktok_enabled:
        print("Approved. Set TIKTOK_ACCESS_TOKEN in .env to enable posting, "
              f"or upload manually: {entry['video_path']}")
        return

    publish_id = _post_video(Path(entry["video_path"]), caption)
    set_status(entry_id, "posted")
    print(f"  [tiktok] published (publish_id={publish_id}, privacy={CONFIG.tiktok_privacy})")


# ── 4. post: TikTok Content Posting API (official) ───────────────────────

def _post_video(video: Path, caption: str) -> str:
    data = video.read_bytes()
    init = requests.post(
        f"{TIKTOK_API}/post/publish/video/init/",
        headers={
            "Authorization": f"Bearer {CONFIG.tiktok_access_token}",
            "Content-Type": "application/json; charset=UTF-8",
        },
        json={
            "post_info": {
                "title": caption[:2200],
                "privacy_level": CONFIG.tiktok_privacy,
                "disable_duet": False,
                "disable_comment": False,
                "disable_stitch": False,
            },
            "source_info": {
                "source": "FILE_UPLOAD",
                "video_size": len(data),
                "chunk_size": len(data),
                "total_chunk_count": 1,
            },
        },
        timeout=30,
    )
    init.raise_for_status()
    body = init.json()["data"]

    upload = requests.put(
        body["upload_url"],
        headers={
            "Content-Type": "video/mp4",
            "Content-Range": f"bytes 0-{len(data) - 1}/{len(data)}",
        },
        data=data,
        timeout=300,
    )
    upload.raise_for_status()
    return body["publish_id"]
