"""Generate pitches/<slug>/reactions.json with Claude (run offline, at content time).

Each fictional shark gets the pitch-time facts (never the outcome) and its
persona, and returns structured JSON: questions, a comment, in/out, and an
offer. Offers are clamped to sane bounds. Review and hand-edit the output.

Usage:
    cd backend
    uv run python ../scripts/generate_shark_reactions.py <slug> [--force]
Requires ANTHROPIC_API_KEY.
"""

import sys
from pathlib import Path
from typing import Literal

import anthropic
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.config import get_settings
from app.models.pitch import Pitch
from app.models.shark import PitchReactions, SharkOfferTerms, SharkReaction
from app.repositories.shark_repository import SharkRepository


class GeneratedReaction(BaseModel):
    questions: list[str]
    comment: str
    decision: Literal["in", "out"]
    offer_amount: int | None
    offer_equity_percent: float | None


PROMPT = """You are playing {name}, "{title}", a fictional investor on a TV pitch show.
Bio: {bio}
Investment thesis (categories you like): {thesis}
Deal style: {style}

A founder just pitched:
Company: {company} ({category}) - {one_liner}
Ask: ${amount:,} for {equity:.1%} (implied valuation ${valuation:,})
Facts: {summary}
{highlights}

Respond in character:
- questions: 1-2 sharp questions you'd ask (under 15 words each)
- comment: one punchy line (under 25 words) explaining your decision
- decision: "in" or "out" - stay true to your thesis; be out on most pitches outside it
- if in: offer_amount (dollars) and offer_equity_percent (e.g. 20 for 20%); \
usually at or below the founder's valuation. If out, both null."""


def generate(slug: str, force: bool) -> None:
    settings = get_settings()
    folder = ROOT / "pitches" / slug
    out = folder / "reactions.json"
    if out.exists() and not force:
        sys.exit(f"{out} exists (use --force to overwrite)")
    pitch = Pitch.model_validate_json((folder / "pitch.json").read_text())
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    reactions = []
    for shark in SharkRepository().all():
        response = client.messages.parse(
            model=settings.reactions_model,
            max_tokens=16000,
            messages=[{
                "role": "user",
                "content": PROMPT.format(
                    name=shark.name, title=shark.title, bio=shark.bio,
                    thesis=", ".join(shark.thesis), style=shark.style,
                    company=pitch.company.name, category=pitch.company.category,
                    one_liner=pitch.company.one_liner, amount=pitch.ask.amount,
                    equity=pitch.ask.equity, valuation=pitch.ask.valuation,
                    summary=pitch.facts.summary,
                    highlights="\n".join(f"- {h}" for h in pitch.facts.highlights),
                ),
            }],
            output_format=GeneratedReaction,
        )
        if response.stop_reason == "refusal":
            sys.exit(f"{shark.id}: model declined; write this reaction by hand")
        g = response.parsed_output
        offer = None
        if g.decision == "in" and g.offer_amount and g.offer_equity_percent:
            amount = max(10_000, min(g.offer_amount, pitch.ask.amount * 3))
            equity = max(0.01, min(g.offer_equity_percent / 100, 0.9))
            offer = SharkOfferTerms(amount=amount, equity=round(equity, 3))
        reactions.append(SharkReaction(
            shark_id=shark.id, questions=g.questions[:2], comment=g.comment,
            decision="in" if offer else "out", offer=offer,
        ))
        print(f"  {shark.name:16} {reactions[-1].decision.upper():3} {offer or ''}")

    out.write_text(PitchReactions(pitch_id=slug, reactions=reactions).model_dump_json(indent=2) + "\n")
    print(f"Wrote {out}. Review it, then run validate_pitches.py")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1:
        sys.exit(__doc__)
    generate(args[0], force="--force" in sys.argv)
