"""Deterministic founder decision logic.

Each offer is scored by its implied valuation, boosted when the investor is a
shark whose expertise fits the company (founders give up some valuation for a
"smart money" partner). The founder has a hidden walk-away valuation:

- best score >= walk-away          -> accept the best offer
- best score >= 75% of walk-away   -> counter the best offer once
                                      (same money, less equity)
- otherwise                        -> walk away
"""

from dataclasses import dataclass

from app.models.game import PLAYER, Offer
from app.models.pitch import Pitch
from app.models.shark import SharkPersona
from app.services.deal_math import floor_to_half_percent

VALUE_ADD_BONUS = 0.15
COUNTER_THRESHOLD = 0.75
# A shark accepts the founder's counter if it keeps at least this share of its ask.
SHARK_COUNTER_TOLERANCE = 0.7


@dataclass
class FounderDecision:
    kind: str  # "accepted" | "countered" | "walked"
    offer: Offer | None
    line: str


def value_add_bonus(offer: Offer, pitch: Pitch, sharks: dict[str, SharkPersona]) -> float:
    shark = sharks.get(offer.investor)
    if shark and pitch.company.category in shark.thesis:
        return VALUE_ADD_BONUS
    return 0.0


def effective_valuation(offer: Offer, pitch: Pitch, sharks: dict[str, SharkPersona]) -> float:
    return offer.valuation * (1 + value_add_bonus(offer, pitch, sharks))


def _name(investor: str, sharks: dict[str, SharkPersona]) -> str:
    return "you" if investor == PLAYER else sharks[investor].name


def decide(
    offers: list[Offer], pitch: Pitch, sharks: dict[str, SharkPersona]
) -> FounderDecision:
    if not offers:
        return FounderDecision(
            "walked", None, "No offers on the table. Thank you for your time, Sharks."
        )

    # Highest effective valuation wins; ties go to the player.
    best = max(
        offers,
        key=lambda o: (effective_valuation(o, pitch, sharks), o.investor == PLAYER),
    )
    score = effective_valuation(best, pitch, sharks)
    walkaway = pitch.founder_prefs.walkaway_valuation
    who = _name(best.investor, sharks)

    if score >= walkaway:
        if value_add_bonus(best, pitch, sharks) and best.valuation < max(
            o.valuation for o in offers
        ):
            line = (
                f"It's not the highest number, but {who} can really help us grow. "
                "We have a deal!"
            )
        else:
            line = f"We'd love to accept the offer from {who}. We have a deal!"
        return FounderDecision("accepted", best, line)

    if score >= walkaway * COUNTER_THRESHOLD:
        target_valuation = walkaway / (1 + value_add_bonus(best, pitch, sharks))
        equity = floor_to_half_percent(best.amount / target_valuation)
        counter = Offer(investor=best.investor, amount=best.amount, equity=max(equity, 0.005))
        line = (
            f"We're close. Would {who} do ${counter.amount:,} for {counter.equity:.1%}?"
        )
        return FounderDecision("countered", counter, line)

    return FounderDecision(
        "walked",
        None,
        "With respect, those valuations are way below what we're worth. We'll pass.",
    )


def shark_takes_counter(original: Offer, counter: Offer) -> bool:
    return counter.equity >= original.equity * SHARK_COUNTER_TOLERANCE
