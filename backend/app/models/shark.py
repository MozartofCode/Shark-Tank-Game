"""AI shark personas and their (pre-generated) reactions to a pitch."""

from typing import Literal

from pydantic import BaseModel, Field

from app.models.pitch import Category


class SharkPersona(BaseModel):
    id: str
    name: str
    title: str
    avatar: str
    color: str
    bio: str
    thesis: list[Category]
    style: str
    catchphrase: str


class SharkOfferTerms(BaseModel):
    amount: int = Field(gt=0)
    equity: float = Field(gt=0, le=1)


class SharkReaction(BaseModel):
    shark_id: str
    questions: list[str]
    comment: str
    decision: Literal["in", "out"]
    offer: SharkOfferTerms | None = None


class PitchReactions(BaseModel):
    pitch_id: str
    reactions: list[SharkReaction]
