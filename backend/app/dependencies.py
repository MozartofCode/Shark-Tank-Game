"""Wires repositories and services together (one instance per process)."""

from functools import lru_cache

from app.config import get_settings
from app.db import get_engine as get_db_engine
from app.repositories.classroom_repository import ClassroomRepository
from app.repositories.game_store import SqlGameStore
from app.repositories.pitch_repository import (
    LocalPitchRepository,
    PitchRepository,
    SupabasePitchRepository,
)
from app.repositories.run_repository import NullRunRepository, RunRepository, SupabaseRunRepository
from app.repositories.shark_repository import SharkRepository
from app.services.founder_chat import FounderChat
from app.services.game_engine import GameEngine


@lru_cache
def get_pitch_repository() -> PitchRepository:
    settings = get_settings()
    if settings.pitch_source == "supabase":
        if not settings.persistence_enabled:
            raise RuntimeError("PITCH_SOURCE=supabase needs SUPABASE_URL and SUPABASE_SECRET_KEY")
        return SupabasePitchRepository(settings.supabase_url, settings.supabase_secret_key)
    return LocalPitchRepository(settings.pitches_dir)


@lru_cache
def get_run_repository() -> RunRepository:
    settings = get_settings()
    if settings.persistence_enabled:
        return SupabaseRunRepository(settings.supabase_url, settings.supabase_secret_key)
    return NullRunRepository()


@lru_cache
def get_classroom_repository() -> ClassroomRepository:
    return ClassroomRepository(get_db_engine())


@lru_cache
def get_shark_repository() -> SharkRepository:
    return SharkRepository()


@lru_cache
def get_engine() -> GameEngine:
    settings = get_settings()
    return GameEngine(
        settings,
        get_pitch_repository(),
        get_shark_repository(),
        SqlGameStore(get_db_engine(), settings.game_ttl_seconds),
        get_run_repository(),
        get_classroom_repository(),
    )


@lru_cache
def get_founder_chat() -> FounderChat:
    return FounderChat(get_settings())
