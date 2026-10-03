"""Check that every YouTube pitch clip still exists and allows embedding.

Uses YouTube's public oEmbed endpoint (no API key): 200 = embeddable,
401 = embedding disabled, 404 = removed/private.

Usage:  python3 scripts/check_embeds.py
"""

import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def check(video_id: str) -> tuple[int, str]:
    url = "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(
        f"https://www.youtube.com/watch?v={video_id}"
    )
    try:
        with urllib.request.urlopen(url, timeout=15) as res:
            return res.status, json.loads(res.read()).get("author_name", "")
    except urllib.error.HTTPError as e:
        return e.code, ""


def main() -> int:
    broken = []
    for pitch_file in sorted(ROOT.glob("pitches/*/pitch.json")):
        pitch = json.loads(pitch_file.read_text())
        video = pitch["video"]
        if video["type"] != "youtube":
            continue
        status, channel = check(video["id"])
        mark = "ok " if status == 200 else "ERR"
        print(f"  {mark} {pitch['id']:24} {video['id']}  {status}  {channel}")
        if status != 200:
            broken.append(pitch["id"])
    if broken:
        print(f"\n{len(broken)} clip(s) can't be embedded: {', '.join(broken)}")
        print("Find a new official upload or set the pitch aside.")
        return 1
    print("\nAll clips embeddable.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
