"""Serves self-hosted pitch media (video.type == "file").

Only whitelisted media extensions are served, so pitch.json (which holds the
hidden outcome) can never be downloaded from here.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import get_settings

router = APIRouter(tags=["media"])

ALLOWED = {".mp4", ".webm", ".jpg", ".jpeg", ".png", ".webp", ".vtt"}


@router.get("/media/{pitch_id}/{filename}")
def media(pitch_id: str, filename: str):
    root = get_settings().pitches_dir.resolve()
    path = (root / pitch_id / filename).resolve()
    if path.suffix.lower() not in ALLOWED or root not in path.parents or not path.is_file():
        raise HTTPException(status_code=404)
    return FileResponse(path)
