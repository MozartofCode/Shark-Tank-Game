"""Pitch content models.

`Pitch` is the full record stored in `pitches/<slug>/pitch.json`, including the
hidden real-world outcome. `PublicPitch` is what the browser is allowed to see
before the reveal; it never carries `outcome`, `real_deal` or `founder_prefs`.
"""

from typing import Annotated, Literal

from pydantic import BaseModel, Field

Category = Literal["consumer", "food", "tech", "apparel", "services", "health"]


class FileVideo(BaseModel):
    type: Literal["file"]
    path: str


class YouTubeVideo(BaseModel):
    type: Literal["youtube"]
    id: str
    start: int = 0
    end: int | None = None


class UrlVideo(BaseModel):
    type: Literal["url"]
    url: str


Video = Annotated[FileVideo | YouTubeVideo | UrlVideo, Field(discriminator="type")]


class Source(BaseModel):
    show: Literal["shark_tank", "yc_demo_day", "other"]
    season: int | None = None
    episode: int | None = None
    channel: str
    url: str


class Company(BaseModel):
    name: str
    category: Category
    one_liner: str
    founders: list[str]


class Ask(BaseModel):
    amount: int = Field(gt=0)
    equity: float = Field(gt=0, le=1)

    @property
    def valuation(self) -> int:
        return round(self.amount / self.equity)


class Facts(BaseModel):
    """What the founder knows and may talk about at pitch time."""

    summary: str
    highlights: list[str]


class FounderPrefs(BaseModel):
    walkaway_valuation: int = Field(gt=0)


class RealDeal(BaseModel):
    result: Literal["deal", "no_deal"]
    summary: str


class Outcome(BaseModel):
    status: Literal["thriving", "acquired", "failed"]
    years_later: int = Field(ge=1)
    exit_value: int = Field(ge=0)
    value_basis: Literal["acquisition", "estimate", "zero"]
    retention_factor: float = Field(ge=0, le=1)
    headline: str
    story: str
    as_of: str
    sources: list[str] = Field(min_length=1)


class Pitch(BaseModel):
    id: str
    source: Source
    video: Video
    company: Company
    ask: Ask
    facts: Facts
    founder_prefs: FounderPrefs
    real_deal: RealDeal
    outcome: Outcome
    lessons: list[str] = []

    def to_public(self) -> "PublicPitch":
        return PublicPitch(
            id=self.id,
            source=self.source,
            video=self.video,
            company=self.company,
            ask=self.ask,
            implied_valuation=self.ask.valuation,
            facts=self.facts,
        )


class PublicPitch(BaseModel):
    id: str
    source: Source
    video: Video
    company: Company
    ask: Ask
    implied_valuation: int
    facts: Facts
