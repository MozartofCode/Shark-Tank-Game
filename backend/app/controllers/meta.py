"""Health check and static game metadata (shark roster)."""

from fastapi import APIRouter, Depends

from app.config import get_settings
from app.dependencies import get_pitch_repository, get_shark_repository
from app.models.shark import SharkPersona
from app.repositories.pitch_repository import LocalPitchRepository
from app.repositories.shark_repository import SharkRepository

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/health")
def health(pitches: LocalPitchRepository = Depends(get_pitch_repository)):
    settings = get_settings()
    return {
        "status": "ok",
        "pitches": len(pitches.list_ids()),
        "ai_founder": settings.llm_enabled,
        "bankroll": settings.starting_bankroll,
    }


@router.get("/sharks", response_model=list[SharkPersona])
def sharks(repo: SharkRepository = Depends(get_shark_repository)):
    return repo.all()
