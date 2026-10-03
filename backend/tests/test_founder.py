from app.models.game import Offer
from app.services import founder


def test_sharks_alone_reproduce_expected_outcomes(pitches, sharks):
    """With no player offer, each pitch resolves the way the content intends."""
    expected = {
        "scrub-daddy": "vance",
        "doorbot": None,
        "squatty-potty": "vance",
        "bombas": "bloom",
        "kodiak-cakes": None,
        "cousins-maine-lobster": "bloom",
    }
    for pid, winner in expected.items():
        offers = [
            Offer(investor=r.shark_id, amount=r.offer.amount, equity=r.offer.equity)
            for r in pitches.get_reactions(pid).reactions
            if r.offer
        ]
        d = founder.decide(offers, pitches.get(pid), sharks)
        assert (d.offer.investor if d.kind == "accepted" else None) == winner, pid


def test_player_beats_shark_with_better_valuation(pitches, sharks):
    pitch = pitches.get("scrub-daddy")
    shark = Offer(investor="vance", amount=200_000, equity=0.20)  # $1M, x1.15 fit bonus
    player = Offer(investor="player", amount=100_000, equity=0.08)  # $1.25M
    d = founder.decide([shark, player], pitch, sharks)
    assert d.kind == "accepted" and d.offer.investor == "player"


def test_smart_money_wins_close_contest(pitches, sharks):
    pitch = pitches.get("scrub-daddy")
    shark = Offer(investor="vance", amount=200_000, equity=0.20)  # effective $1.15M
    player = Offer(investor="player", amount=110_000, equity=0.10)  # $1.1M
    assert founder.decide([shark, player], pitch, sharks).offer.investor == "vance"


def test_counter_when_close_then_walk_when_far(pitches, sharks):
    pitch = pitches.get("doorbot")  # walk-away $5M
    close = Offer(investor="player", amount=700_000, equity=0.17)  # ~$4.1M
    d = founder.decide([close], pitch, sharks)
    assert d.kind == "countered"
    assert d.offer.amount == 700_000 and d.offer.equity == 0.14  # $5M
    far = Offer(investor="player", amount=700_000, equity=0.40)
    assert founder.decide([far], pitch, sharks).kind == "walked"


def test_no_offers_walks(pitches, sharks):
    assert founder.decide([], pitches.get("bombas"), sharks).kind == "walked"
