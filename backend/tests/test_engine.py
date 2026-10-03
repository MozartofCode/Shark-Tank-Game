import pytest

from app.models.game import PLAYER
from app.services.deal_math import InvalidOffer
from app.services.game_engine import GameError
from tests.conftest import game_with

DAY = ["scrub-daddy", "doorbot", "breathometer", "kodiak-cakes", "toygaroo"]


def test_new_game_has_five_unique_pitches(engine):
    game = engine.new_game()
    ids = [r.pitch_id for r in game.rounds]
    assert len(ids) == 5 and len(set(ids)) == 5
    assert game.cash == game.bankroll_start == 1_000_000


def test_full_day_and_reveal_math(engine):
    game = game_with(engine, DAY)
    # 1. Scrub Daddy: outbid Vance -> player deal.
    engine.submit_offer(game, 0, passed=False, amount=100_000, equity=0.08)
    assert game.rounds[0].winner.investor == PLAYER
    # 2. Doorbot: lowball -> counter -> accept.
    engine.submit_offer(game, 1, passed=False, amount=700_000, equity=0.17)
    assert game.rounds[1].status == "countered"
    engine.respond_to_counter(game, 1, accept=True)
    assert game.rounds[1].winner.equity == 0.14
    # 3-5. Pass.
    for i in (2, 3, 4):
        engine.submit_offer(game, i, passed=True, amount=None, equity=None)
    assert game.finished
    assert game.cash == 1_000_000 - 100_000 - 700_000

    reveal = engine.reveal(game)
    scrub = 0.08 * 500_000_000 * 0.9  # 36M
    ring = 0.14 * 1_000_000_000 * 0.3  # 42M
    assert reveal.portfolio_value == round(scrub) + round(ring)
    assert reveal.net_worth == game.cash + reveal.portfolio_value
    assert reveal.best_deal == "Scrub Daddy"  # 360x beats Doorbot's 60x
    # Steele won Breathometer and Toygaroo, both zeros.
    steele = next(s for s in reveal.standings if s.investor == "steele")
    assert steele.portfolio_value == 0 and steele.invested == 700_000


def test_rounds_must_be_played_in_order(engine):
    game = game_with(engine, DAY)
    with pytest.raises(GameError):
        engine.submit_offer(game, 2, passed=True, amount=None, equity=None)


def test_cannot_offer_more_than_cash(engine):
    game = game_with(engine, DAY)
    game.cash = 50_000
    with pytest.raises(InvalidOffer):
        engine.submit_offer(game, 0, passed=False, amount=100_000, equity=0.08)


def test_reveal_requires_finished_game(engine):
    with pytest.raises(GameError):
        engine.reveal(game_with(engine, DAY))


def test_question_limit(engine):
    game = game_with(engine, DAY)
    for i in range(3):
        engine.check_can_ask(game, 0)
        engine.record_answer(game, 0, f"q{i}", "a")
    with pytest.raises(GameError, match="all your questions"):
        engine.check_can_ask(game, 0)


def test_every_day_mixes_flops_and_survivors(engine, pitches):
    """2-3 failed companies per day, never all winners, never all losers."""
    counts = set()
    for seed in range(200):
        game = engine.new_game(seed=seed)
        statuses = [pitches.get(r.pitch_id).outcome.status for r in game.rounds]
        flops = statuses.count("failed")
        assert 2 <= flops <= 3 and len({r.pitch_id for r in game.rounds}) == 5
        counts.add(flops)
    assert counts == {2, 3}


def test_shark_standings_rank_by_profit(engine):
    game = game_with(engine, DAY)
    for i in range(5):
        engine.submit_offer(game, i, passed=True, amount=None, equity=None)
    reveal = engine.reveal(game)
    profits = [s.profit for s in reveal.standings]
    assert profits == sorted(profits, reverse=True)


def test_sql_store_round_trip_and_ttl():
    import time

    from app.db import make_engine
    from app.models.game import GameState, RoundState
    from app.repositories.game_store import SqlGameStore

    store = SqlGameStore(make_engine("sqlite:///:memory:"), ttl_seconds=60)
    game = GameState(
        id="g1", bankroll_start=1_000_000, cash=900_000, rounds=[RoundState(pitch_id="zipz")]
    )
    store.save(game)
    game.cash = 800_000
    store.save(game)  # update path
    loaded = store.get("g1")
    assert loaded is not game and loaded.cash == 800_000 and loaded.rounds[0].pitch_id == "zipz"
    old = GameState(id="g2", bankroll_start=1, cash=1, rounds=[], created_at=time.time() - 120)
    store.save(old)
    assert store.get("g2") is None
    assert store.get("missing") is None


def test_offer_reason_is_kept_through_reveal(engine):
    game = game_with(engine, DAY)
    engine.submit_offer(game, 0, passed=False, amount=100_000, equity=0.08, reason="team")
    for i in range(1, 5):
        engine.submit_offer(game, i, passed=True, amount=None, equity=None)
    assert engine.view(game).rounds[0].reason == "team"
    assert engine.reveal(game).rounds[0].reason == "team"
