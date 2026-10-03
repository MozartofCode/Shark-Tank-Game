"""Scaffold a new pitch folder with a template pitch.json.

Usage:  python scripts/new_pitch.py my-company
Then fill in pitch.json, run generate_shark_reactions.py (or write
reactions.json by hand), and validate with validate_pitches.py.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

TEMPLATE = {
    "id": "",
    "source": {
        "show": "shark_tank",
        "season": None,
        "episode": None,
        "channel": "Shark Tank Global (official)",
        "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    },
    "video": {"type": "youtube", "id": "VIDEO_ID", "start": 0, "end": 240},
    "company": {"name": "", "category": "consumer", "one_liner": "", "founders": [""]},
    "ask": {"amount": 100000, "equity": 0.10},
    "facts": {
        "summary": "What the founder knows at pitch time. No hindsight!",
        "highlights": ["Fact the founder can talk about", "Another fact"],
    },
    "founder_prefs": {"walkaway_valuation": 500000},
    "real_deal": {"result": "deal", "summary": "What happened on the real show."},
    "outcome": {
        "status": "thriving",
        "years_later": 5,
        "exit_value": 0,
        "value_basis": "estimate",
        "retention_factor": 1.0,
        "headline": "",
        "story": "",
        "as_of": "YYYY-MM",
        "sources": ["https://"],
    },
    "lessons": ["valuation"],
}


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 1
    slug = sys.argv[1].strip().lower()
    folder = ROOT / "pitches" / slug
    if folder.exists():
        print(f"{folder} already exists")
        return 1
    folder.mkdir(parents=True)
    TEMPLATE["id"] = slug
    (folder / "pitch.json").write_text(json.dumps(TEMPLATE, indent=2) + "\n")
    print(f"Created {folder / 'pitch.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
