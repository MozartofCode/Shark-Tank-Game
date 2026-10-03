"""Pitch storage.

`LocalPitchRepository` reads `pitches/<slug>/pitch.json` (+ `reactions.json`).
`SupabasePitchRepository` reads the `pitches` table (service role only, since it
holds hidden outcomes). Push local content there with scripts/sync_pitches.py.
"""

import json
from pathlib import Path
from typing import Protocol

from app.models.pitch import Pitch
from app.models.shark import PitchReactions
from app.repositories.supabase_rest import SupabaseRest


class PitchRepository(Protocol):
    def list_ids(self) -> list[str]: ...
    def get(self, pitch_id: str) -> Pitch: ...
    def get_reactions(self, pitch_id: str) -> PitchReactions: ...


class PitchNotFound(KeyError):
    pass


class LocalPitchRepository:
    def __init__(self, root: Path):
        self.root = root
        self._pitches: dict[str, Pitch] = {}
        self._reactions: dict[str, PitchReactions] = {}
        self.reload()

    def reload(self) -> None:
        self._pitches.clear()
        self._reactions.clear()
        for pitch_file in sorted(self.root.glob("*/pitch.json")):
            pitch = Pitch.model_validate(json.loads(pitch_file.read_text()))
            if pitch.id != pitch_file.parent.name:
                raise ValueError(f"{pitch_file}: id '{pitch.id}' must match folder name")
            self._pitches[pitch.id] = pitch
            reactions_file = pitch_file.parent / "reactions.json"
            if reactions_file.exists():
                self._reactions[pitch.id] = PitchReactions.model_validate(
                    json.loads(reactions_file.read_text())
                )
            else:
                self._reactions[pitch.id] = PitchReactions(pitch_id=pitch.id, reactions=[])

    def list_ids(self) -> list[str]:
        return list(self._pitches)

    def get(self, pitch_id: str) -> Pitch:
        try:
            return self._pitches[pitch_id]
        except KeyError as e:
            raise PitchNotFound(pitch_id) from e

    def get_reactions(self, pitch_id: str) -> PitchReactions:
        self.get(pitch_id)
        return self._reactions[pitch_id]


class SupabasePitchRepository:
    def __init__(self, url: str, secret_key: str):
        self.db = SupabaseRest(url, secret_key)
        self._pitches: dict[str, Pitch] = {}
        self._reactions: dict[str, PitchReactions] = {}
        self.reload()

    def reload(self) -> None:
        rows = self.db.select(
            "pitches", {"select": "id,data,reactions", "published": "eq.true", "order": "id"}
        )
        self._pitches = {r["id"]: Pitch.model_validate(r["data"]) for r in rows}
        self._reactions = {r["id"]: PitchReactions.model_validate(r["reactions"]) for r in rows}

    def list_ids(self) -> list[str]:
        return list(self._pitches)

    def get(self, pitch_id: str) -> Pitch:
        try:
            return self._pitches[pitch_id]
        except KeyError as e:
            raise PitchNotFound(pitch_id) from e

    def get_reactions(self, pitch_id: str) -> PitchReactions:
        self.get(pitch_id)
        return self._reactions[pitch_id]
