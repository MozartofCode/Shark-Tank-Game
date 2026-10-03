from datetime import date

import pytest

from app.services.game_engine import GameError
from tests.conftest import game_with

DAY = ["scrub-daddy", "doorbot", "breathometer", "kodiak-cakes", "toygaroo"]


def finish(engine, game):
    for i in range(len(game.rounds)):
        engine.submit_offer(game, i, passed=True, amount=None, equity=None)
    return engine.reveal(game)




def test_daily_challenge_is_deterministic(engine):
    d = date(2026, 10, 3)
    a = engine.new_game(daily=True, today=d)
    b = engine.new_game(daily=True, today=d)
    c = engine.new_game(daily=True, today=date(2026, 10, 4))
    assert [r.pitch_id for r in a.rounds] == [r.pitch_id for r in b.rounds]
    assert [r.pitch_id for r in a.rounds] != [r.pitch_id for r in c.rounds]
    assert a.daily_date == d


def test_signed_in_run_is_saved_once(engine, runs):
    game = game_with(engine, DAY)
    game.user_id = "user-1"
    reveal = finish(engine, game)
    assert reveal.saved and len(runs.saved) == 1
    engine.reveal(game)  # re-opening the reveal must not double-save
    assert len(runs.saved) == 1
    _, user_id, pitch_ids, _ = runs.saved[0]
    assert user_id == "user-1" and pitch_ids == DAY


def test_guest_run_is_not_saved_until_claimed(engine, runs):
    game = game_with(engine, DAY)
    assert finish(engine, game).saved is False
    assert runs.saved == []
    engine.claim(game, "user-2")
    assert game.saved and runs.saved[0][1] == "user-2"


def test_owned_games_are_private(engine):
    game = engine.new_game(user_id="owner")
    with pytest.raises(GameError) as e:
        engine.get_game(game.id, "someone-else")
    assert e.value.status == 403
    with pytest.raises(GameError):
        engine.get_game(game.id, None)
    assert engine.get_game(game.id, "owner") is game
    with pytest.raises(GameError):
        engine.claim(game, "someone-else")
