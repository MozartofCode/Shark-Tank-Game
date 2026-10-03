"""Shark personas, defined in `app/content/sharks.yaml`."""

from pathlib import Path

import yaml

from app.models.shark import SharkPersona

SHARKS_FILE = Path(__file__).resolve().parents[1] / "content" / "sharks.yaml"


class SharkRepository:
    def __init__(self, path: Path = SHARKS_FILE):
        raw = yaml.safe_load(path.read_text())
        self._sharks = {s["id"]: SharkPersona.model_validate(s) for s in raw["sharks"]}

    def all(self) -> list[SharkPersona]:
        return list(self._sharks.values())

    def get(self, shark_id: str) -> SharkPersona:
        return self._sharks[shark_id]
