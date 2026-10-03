"""Wires repositories and services together (one instance per process)."""

from functools import lru_cache

from app.config import get_settings
from app.repositories.game_store import InMemoryGameStore
from app.repositories.pitch_repository import LocalPitchRepository
from app.repositories.shark_repository import SharkRepository
from app.services.founder_chat import FounderChat
from app.services.game_engine import GameEngine


@lru_cache
def get_pitch_repository() -> LocalPitchRepository:
    return LocalPitchRepository(get_settings().pitches_dir)


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
        InMemoryGameStore(settings.game_ttl_seconds),
    )


@lru_cache
def get_founder_chat() -> FounderChat:
    return FounderChat(get_settings())
