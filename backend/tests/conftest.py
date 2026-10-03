import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import pytest

from app.config import get_settings
from app.dependencies import get_pitch_repository, get_shark_repository
from app.repositories.game_store import InMemoryGameStore
from app.repositories.run_repository import NullRunRepository
from app.services.game_engine import GameEngine
from app.services.rate_limit import limiter


@pytest.fixture
def pitches():
    return get_pitch_repository()


@pytest.fixture
def sharks():
    return {s.id: s for s in get_shark_repository().all()}


class FakeRunRepository(NullRunRepository):
    """Records saves instead of writing to Supabase."""

    enabled = True

    def __init__(self):
        self.saved = []

    def save(self, reveal, user_id, pitch_ids, daily):
        self.saved.append((reveal, user_id, pitch_ids, daily))


@pytest.fixture
def runs():
    return FakeRunRepository()


@pytest.fixture
def engine(pitches, runs):
    return GameEngine(
        get_settings(), pitches, get_shark_repository(), InMemoryGameStore(3600), runs
    )


def game_with(engine, pitch_ids):
    """A game whose rounds are exactly `pitch_ids` (deterministic tests)."""
    from app.models.game import RoundState

    game = engine.new_game(seed=1)
    game.rounds = [RoundState(pitch_id=p) for p in pitch_ids]
    engine.store.save(game)
    return game


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    limiter.reset()
    yield
    limiter.reset()
