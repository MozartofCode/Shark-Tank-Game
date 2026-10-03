"""The live AI founder who answers the player's questions.

The founder is grounded ONLY in pitch-time facts. The real outcome, the real
on-show deal and the founder's walk-away number are never put in the prompt,
so the future can't leak.

With no ANTHROPIC_API_KEY configured, a keyword-matching fallback answers from
the same facts so the game remains fully playable offline.
"""

import logging
import re
from collections.abc import AsyncIterator

import anthropic

from app.config import Settings
from app.models.game import ChatMessage
from app.models.pitch import Pitch
from app.services.rate_limit import ai_budget

log = logging.getLogger(__name__)

SYSTEM_TEMPLATE = """You are {founders}, the founder(s) of {name}, pitching on a TV investing \
show. You are talking to an investor ("Shark") who just watched your pitch.

Company: {name} - {one_liner}
Your ask: ${amount:,} for {equity:.0%} of the company (a ${valuation:,} valuation).

What you know (this is the ONLY information you have):
{summary}
{highlights}

Rules:
- Stay in character as an energetic, honest founder at the moment of the pitch.
- Only use the facts above. If asked something not covered, say you'd have to \
check or give a vague, plausible founder answer without inventing specific numbers.
- You do not know the future. If asked what happens to the company later, deflect \
optimistically ("That's what we're here to build with you!").
- Never reveal a minimum valuation you'd accept. Defend your ask.
- Answer in at most 80 words, conversational, no markdown."""


def build_system_prompt(pitch: Pitch) -> str:
    return SYSTEM_TEMPLATE.format(
        founders=" & ".join(pitch.company.founders),
        name=pitch.company.name,
        one_liner=pitch.company.one_liner,
        amount=pitch.ask.amount,
        equity=pitch.ask.equity,
        valuation=pitch.ask.valuation,
        summary=pitch.facts.summary,
        highlights="\n".join(f"- {h}" for h in pitch.facts.highlights),
    )


_WORD = re.compile(r"[a-z0-9$%]+")
_SALES = re.compile(r"sales|sold|revenue|subscri", re.IGNORECASE)
_STOP = {
    "the",
    "a",
    "an",
    "is",
    "are",
    "you",
    "your",
    "what",
    "how",
    "do",
    "does",
    "of",
    "to",
    "and",
    "in",
    "it",
    "for",
    "on",
    "i",
    "me",
    "my",
    "we",
    "our",
    "that",
    "this",
    "with",
    "why",
    "can",
    "be",
    "have",
    "has",
    "was",
    "so",
    "much",
    "many",
}


_FIRST_PERSON = [
    (re.compile(r"^The founders? (?:says?|believes?|thinks?) (?:that )?", re.IGNORECASE), ""),
    (re.compile(r"\bThe founders are\b", re.IGNORECASE), "We're"),
    (re.compile(r"\bThe founder is\b", re.IGNORECASE), "I'm"),
    (re.compile(r"\bThe founders\b", re.IGNORECASE), "We"),
    (re.compile(r"\bThe founder\b", re.IGNORECASE), "I"),
]


def _in_first_person(sentence: str) -> str:
    """Fact sheets are written about the founder; the offline founder speaks as themself."""
    for pattern, repl in _FIRST_PERSON:
        sentence = pattern.sub(repl, sentence)
    return sentence[:1].upper() + sentence[1:]


def fallback_answer(pitch: Pitch, question: str) -> str:
    """Offline founder: pick the fact sentence that best overlaps the question."""
    q = {w for w in _WORD.findall(question.lower()) if w not in _STOP}
    highlights = [_in_first_person(h) for h in pitch.facts.highlights]
    summary = _in_first_person(pitch.facts.summary)
    candidates = highlights + [summary]
    best, best_score = None, 0
    for c in candidates:
        score = len(q & set(_WORD.findall(c.lower())))
        if score > best_score:
            best, best_score = c, score
    if any(w in q for w in ("future", "later", "years", "exit", "happen", "happened")):
        return "Honestly? That's what we're here to build with you. Partner with us and find out!"
    if any(w in q for w in ("valuation", "worth", "value", "lower", "equity", "percent")):
        return (
            f"We believe ${pitch.ask.valuation:,} is fair for what we've built. "
            f"{highlights[0] if highlights else ''}"
        ).strip()
    if q & {"sales", "sold", "revenue", "selling", "sell", "customers", "subscribers"}:
        numeric = [h for h in highlights if any(c.isdigit() for c in h)]
        sales = [h for h in highlights if _SALES.search(h)]
        if numeric or sales:
            return f"Great question. {(numeric or sales)[0]}"
    if best:
        return f"Great question. {best}"
    return f"Great question. What I can tell you is: {summary}"


class FounderChat:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = (
            anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key, timeout=30.0)
            if settings.llm_enabled
            else None
        )

    async def answer(
        self, pitch: Pitch, history: list[ChatMessage], question: str
    ) -> AsyncIterator[str]:
        if self.client is None or not ai_budget.try_spend(self.settings.ai_daily_call_cap):
            yield fallback_answer(pitch, question)
            return

        messages = [{"role": m.role, "content": m.content} for m in history]
        messages.append({"role": "user", "content": question})
        try:
            async with self.client.messages.stream(
                model=self.settings.founder_model,
                max_tokens=400,
                system=build_system_prompt(pitch),
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except anthropic.APIConnectionError:
            log.warning("Founder chat: connection error, using fallback")
            yield fallback_answer(pitch, question)
        except anthropic.RateLimitError:
            log.warning("Founder chat: rate limited, using fallback")
            yield fallback_answer(pitch, question)
        except anthropic.APIStatusError as e:
            log.warning("Founder chat: API error %s, using fallback", e.status_code)
            yield fallback_answer(pitch, question)
