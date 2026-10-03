import pytest

from app.models.game import Offer
from app.models.pitch import Ask
from app.services.deal_math import (
    InvalidOffer,
    floor_to_half_percent,
    implied_valuation,
    moic,
    stake_value,
    validate_player_offer,
)


def test_implied_valuation():
    assert implied_valuation(100_000, 0.10) == 1_000_000
    assert Offer(investor="player", amount=200_000, equity=0.175).valuation == 1_142_857


def test_floor_to_half_percent_rounds_down():
    assert floor_to_half_percent(0.14375) == 0.14
    assert floor_to_half_percent(0.105) == 0.105


def test_stake_value_applies_dilution(pitches):
    outcome = pitches.get("doorbot").outcome  # $1B exit, 30% retention
    offer = Offer(investor="player", amount=700_000, equity=0.10)
    assert stake_value(offer, outcome) == 30_000_000
    assert moic(700_000, 30_000_000) == 42.86


def test_failed_company_is_worth_zero(pitches):
    offer = Offer(investor="player", amount=250_000, equity=0.10)
    assert stake_value(offer, pitches.get("breathometer").outcome) == 0


@pytest.mark.parametrize(
    "amount,equity,cash,msg",
    [
        (5_000, 0.1, 10_000_000, "Minimum"),
        (600_000, 0.1, 500_000, "only have"),
        (10_000_000, 0.1, 10_000_000, "capped"),
        (100_000, 0.95, 10_000_000, "Equity"),
    ],
)
def test_invalid_offers(amount, equity, cash, msg):
    with pytest.raises(InvalidOffer, match=msg):
        validate_player_offer(amount, equity, Ask(amount=100_000, equity=0.1), cash)
