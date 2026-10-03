"""Health check and static game metadata (shark roster)."""

from fastapi import APIRouter, Depends

from app.config import get_settings
from app.dependencies import get_pitch_repository, get_shark_repository
from app.models.shark import SharkPersona
from app.repositories.pitch_repository import PitchRepository
from app.repositories.shark_repository import SharkRepository

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/health")
def health(pitches: PitchRepository = Depends(get_pitch_repository)):
    settings = get_settings()
    return {
        "status": "ok",
        "pitches": len(pitches.list_ids()),
        "ai_founder": settings.llm_enabled,
        "bankroll": settings.starting_bankroll,
        "accounts": settings.auth_enabled,
        "leaderboards": settings.persistence_enabled,
    }


@router.get("/config")
def public_config():
    """Public client config. The publishable key is safe to expose by design."""
    settings = get_settings()
    return {
        "supabase_url": settings.supabase_url if settings.auth_enabled else None,
        "supabase_publishable_key": settings.supabase_publishable_key,
    }


@router.get("/sharks", response_model=list[SharkPersona])
def sharks(repo: SharkRepository = Depends(get_shark_repository)):
    return repo.all()
