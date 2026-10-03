"""Validate every pitch folder: schema, reactions, media files, sources.

Usage:  cd backend && uv run python ../scripts/validate_pitches.py
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.repositories.pitch_repository import LocalPitchRepository
from app.repositories.shark_repository import SharkRepository


def main() -> int:
    errors: list[str] = []
    try:
        repo = LocalPitchRepository(ROOT / "pitches")
    except Exception as e:  # noqa: BLE001 - report any load error
        print(f"FAILED to load pitches: {e}")
        return 1
    shark_ids = {s.id for s in SharkRepository().all()}

    for pid in repo.list_ids():
        p = repo.get(pid)
        if p.video.type == "file" and not (ROOT / "pitches" / pid / p.video.path).exists():
            errors.append(f"{pid}: missing video file {p.video.path}")
        if p.founder_prefs.walkaway_valuation > p.ask.valuation:
            errors.append(f"{pid}: walk-away valuation is above the ask valuation")
        if p.outcome.status == "failed" and p.outcome.exit_value:
            errors.append(f"{pid}: failed companies must have exit_value 0")
        reactions = repo.get_reactions(pid).reactions
        seen = {r.shark_id for r in reactions}
        if seen != shark_ids:
            errors.append(f"{pid}: reactions must cover sharks {sorted(shark_ids)}, got {sorted(seen)}")
        for r in reactions:
            if (r.decision == "in") != (r.offer is not None):
                errors.append(f"{pid}/{r.shark_id}: 'in' requires an offer and 'out' must not have one")
        print(f"  ok  {pid:24} ask ${p.ask.amount:>9,} for {p.ask.equity:5.1%}  -> {p.outcome.status}")

    for e in errors:
        print(f"  ERR {e}")
    print(f"{len(repo.list_ids())} pitches, {len(errors)} errors")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
