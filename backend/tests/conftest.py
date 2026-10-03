import pytest

from app.config import get_settings
from app.dependencies import get_pitch_repository, get_shark_repository
from app.repositories.game_store import InMemoryGameStore
from app.services.game_engine import GameEngine


@pytest.fixture
def pitches():
    return get_pitch_repository()


@pytest.fixture
def sharks():
    return {s.id: s for s in get_shark_repository().all()}


@pytest.fixture
def engine(pitches):
    return GameEngine(get_settings(), pitches, get_shark_repository(), InMemoryGameStore(3600))


def game_with(engine, pitch_ids):
    """A game whose rounds are exactly `pitch_ids` (deterministic tests)."""
    from app.models.game import RoundState

    game = engine.new_game(seed=1)
    game.rounds = [RoundState(pitch_id=p) for p in pitch_ids]
    engine.store.save(game)
    return game
