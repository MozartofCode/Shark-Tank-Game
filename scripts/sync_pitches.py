"""Upload local pitches (pitch.json + reactions.json) to the Supabase `pitches` table.

Then set PITCH_SOURCE=supabase to serve pitches from the database.

Usage:  cd backend && uv run python ../scripts/sync_pitches.py
Requires SUPABASE_URL and SUPABASE_SECRET_KEY in .env.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.config import get_settings
from app.repositories.pitch_repository import LocalPitchRepository
from app.repositories.supabase_rest import SupabaseRest


def main() -> int:
    settings = get_settings()
    if not settings.persistence_enabled:
        print("Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env first.")
        return 1
    local = LocalPitchRepository(ROOT / "pitches")
    rows = [
        {
            "id": pid,
            "data": local.get(pid).model_dump(mode="json"),
            "reactions": local.get_reactions(pid).model_dump(mode="json"),
            "published": True,
        }
        for pid in local.list_ids()
    ]
    SupabaseRest(settings.supabase_url, settings.supabase_secret_key).upsert("pitches", rows)
    print(f"Synced {len(rows)} pitches to Supabase.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
