"""Pure deal arithmetic shared by the engine, founder and scoring."""

import math

from app.models.game import Offer
from app.models.pitch import Ask, Outcome

MIN_EQUITY = 0.01
MAX_EQUITY = 0.90
MIN_AMOUNT = 10_000
MAX_ASK_MULTIPLE = 5


class InvalidOffer(ValueError):
    pass


def implied_valuation(amount: int, equity: float) -> int:
    return round(amount / equity)


def validate_player_offer(amount: int, equity: float, ask: Ask, cash: int) -> None:
    if amount < MIN_AMOUNT:
        raise InvalidOffer(f"Minimum offer is ${MIN_AMOUNT:,}.")
    if amount > cash:
        raise InvalidOffer(f"You only have ${cash:,} left to invest.")
    if amount > ask.amount * MAX_ASK_MULTIPLE:
        raise InvalidOffer(
            f"The founder only needs ${ask.amount:,}. Offers are capped at "
            f"{MAX_ASK_MULTIPLE}x the ask (${ask.amount * MAX_ASK_MULTIPLE:,})."
        )
    if not (MIN_EQUITY <= equity <= MAX_EQUITY):
        raise InvalidOffer(f"Equity must be between {MIN_EQUITY:.0%} and {MAX_EQUITY:.0%}.")


def floor_to_half_percent(equity: float) -> float:
    """Round equity *down* to the nearest 0.5% (better for the founder)."""
    return math.floor(equity * 200 + 1e-9) / 200


ROYALTY_PAYBACK_YEARS = 3


def royalty_payout(offer: Offer, outcome: Outcome) -> int:
    """Simplified royalty: sales pay the investor back (up to 1x) over ~3 years.

    A company that shuts down early only pays back the years it was selling.
    """
    if not offer.royalty:
        return 0
    return round(offer.amount * min(1.0, outcome.years_later / ROYALTY_PAYBACK_YEARS))


def equity_value(offer: Offer, outcome: Outcome) -> int:
    return round(offer.equity * outcome.exit_value * outcome.retention_factor)


def stake_value(offer: Offer, outcome: Outcome) -> int:
    """What the investor's deal is worth `years_later`: equity after dilution + royalty."""
    return equity_value(offer, outcome) + royalty_payout(offer, outcome)


def moic(invested: int, value: int) -> float:
    """Multiple on invested capital."""
    return round(value / invested, 2) if invested else 0.0
