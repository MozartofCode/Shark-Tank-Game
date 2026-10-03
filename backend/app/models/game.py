"""Game session state (server-side) and the API request/response schemas."""

import time
from typing import Literal

from pydantic import BaseModel, Field

from app.models.pitch import Outcome, PublicPitch, RealDeal
from app.models.shark import SharkReaction

PLAYER = "player"


class Offer(BaseModel):
    investor: str  # "player" or a shark id
    amount: int = Field(gt=0)
    equity: float = Field(gt=0, le=1)

    @property
    def valuation(self) -> int:
        return round(self.amount / self.equity)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


Decision = Literal["pending", "accepted", "countered", "walked"]


class RoundState(BaseModel):
    pitch_id: str
    status: Literal["open", "countered", "closed"] = "open"
    decision: Decision = "pending"
    chat: list[ChatMessage] = []
    player_offer: Offer | None = None
    player_passed: bool = False
    counter: Offer | None = None
    winner: Offer | None = None
    founder_line: str = ""


class GameState(BaseModel):
    id: str
    created_at: float = Field(default_factory=time.time)
    bankroll_start: int
    cash: int
    rounds: list[RoundState]
    current_round: int = 0
    revealed: bool = False

    @property
    def finished(self) -> bool:
        return all(r.status == "closed" for r in self.rounds)


# ---------- requests ----------


class QuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)


class OfferRequest(BaseModel):
    pass_: bool = Field(default=False, alias="pass")
    amount: int | None = None
    equity: float | None = None


class CounterRequest(BaseModel):
    accept: bool


# ---------- responses ----------


class RoundView(BaseModel):
    index: int
    pitch: PublicPitch
    status: str
    decision: Decision
    questions_left: int
    chat: list[ChatMessage]
    shark_reactions: list[SharkReaction]
    player_offer: Offer | None
    player_passed: bool
    counter: Offer | None
    winner: Offer | None
    founder_line: str


class GameView(BaseModel):
    id: str
    bankroll_start: int
    cash: int
    current_round: int
    total_rounds: int
    finished: bool
    revealed: bool
    rounds: list[RoundView]


class DealResult(BaseModel):
    investor: str
    amount: int
    equity: float
    valuation: int
    stake_value: int
    moic: float


class RevealRound(BaseModel):
    index: int
    pitch: PublicPitch
    outcome: Outcome
    real_deal: RealDeal
    deal: DealResult | None
    lessons: list[dict[str, str]]


class Standing(BaseModel):
    investor: str
    name: str
    invested: int
    portfolio_value: int
    net_worth: int
    return_pct: float
    deals: int


class RevealView(BaseModel):
    game_id: str
    bankroll_start: int
    cash_left: int
    invested: int
    portfolio_value: int
    net_worth: int
    return_pct: float
    benchmark_years: float
    benchmark_value: int
    best_deal: str | None
    worst_deal: str | None
    rounds: list[RevealRound]
    standings: list[Standing]
