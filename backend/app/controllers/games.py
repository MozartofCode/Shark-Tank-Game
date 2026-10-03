"""HTTP controllers for the game. Thin: parse input, call the engine, return views."""

import json

from fastapi import APIRouter, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.dependencies import get_engine, get_founder_chat, get_pitch_repository
from app.models.game import (
    CounterRequest,
    GameView,
    NewGameRequest,
    OfferRequest,
    QuestionRequest,
    RevealView,
)
from app.repositories.pitch_repository import PitchRepository
from app.services.auth import AuthUser, optional_user, required_user
from app.services.deal_math import InvalidOffer
from app.services.founder_chat import FounderChat
from app.services.game_engine import GameEngine, GameError
from app.services.rate_limit import rate_limit

router = APIRouter(prefix="/api/games", tags=["games"])


def _http(e: GameError | InvalidOffer) -> HTTPException:
    status = e.status if isinstance(e, GameError) else 400
    return HTTPException(status_code=status, detail=str(e))


def _uid(user: AuthUser | None) -> str | None:
    return user.id if user else None


@router.post("", response_model=GameView, dependencies=[Depends(rate_limit("new_game", 30, 3600))])
def create_game(
    body: NewGameRequest | None = None,
    engine: GameEngine = Depends(get_engine),
    user: AuthUser | None = Depends(optional_user),
):
    """Start a day. `mode: "daily"` gives everyone the same five pitches today."""
    try:
        mode = body.mode if body else "random"
        game = engine.new_game(
            daily=mode == "daily",
            user_id=_uid(user),
            class_code=body.class_code if mode == "class" else None,
            student=body.student if mode == "class" else None,
        )
        return engine.view(game)
    except GameError as e:
        raise _http(e)


@router.get("/{game_id}", response_model=GameView)
def get_game(
    game_id: str,
    engine: GameEngine = Depends(get_engine),
    user: AuthUser | None = Depends(optional_user),
):
    try:
        return engine.view(engine.get_game(game_id, _uid(user)))
    except GameError as e:
        raise _http(e)


@router.post("/{game_id}/claim", response_model=GameView)
def claim_game(
    game_id: str,
    engine: GameEngine = Depends(get_engine),
    user: AuthUser = Depends(required_user),
):
    """Attach a guest game to the signed-in account (saves it if already revealed)."""
    try:
        game = engine.get_game(game_id, user.id)
        return engine.view(engine.claim(game, user.id))
    except GameError as e:
        raise _http(e)


@router.post(
    "/{game_id}/rounds/{index}/questions",
    dependencies=[Depends(rate_limit("questions", 60, 3600))],
)
async def ask_question(
    game_id: str,
    index: int,
    body: QuestionRequest,
    engine: GameEngine = Depends(get_engine),
    chat: FounderChat = Depends(get_founder_chat),
    pitches: PitchRepository = Depends(get_pitch_repository),
    user: AuthUser | None = Depends(optional_user),
):
    """Streams the founder's answer as server-sent events: `delta`* then `done`."""
    try:
        game = engine.get_game(game_id, _uid(user))
        r = engine.check_can_ask(game, index)
    except GameError as e:
        raise _http(e)
    pitch = pitches.get(r.pitch_id)
    history = list(r.chat)
    question = body.question.strip()

    async def events():
        parts: list[str] = []
        async for chunk in chat.answer(pitch, history, question):
            parts.append(chunk)
            yield {"event": "delta", "data": json.dumps({"text": chunk})}
        answer = "".join(parts).strip()
        engine.record_answer(game, index, question, answer)
        yield {
            "event": "done",
            "data": json.dumps(
                {"answer": answer, "questions_left": engine.questions_left(game.rounds[index])}
            ),
        }

    return EventSourceResponse(events())


@router.post(
    "/{game_id}/rounds/{index}/offer",
    response_model=GameView,
    dependencies=[Depends(rate_limit("actions", 120, 60))],
)
def make_offer(
    game_id: str,
    index: int,
    body: OfferRequest,
    engine: GameEngine = Depends(get_engine),
    user: AuthUser | None = Depends(optional_user),
):
    try:
        game = engine.get_game(game_id, _uid(user))
        engine.submit_offer(
            game,
            index,
            passed=body.pass_,
            amount=body.amount,
            equity=body.equity,
            reason=body.reason,
            royalty=body.royalty,
        )
        return engine.view(game)
    except (GameError, InvalidOffer) as e:
        raise _http(e)


@router.post("/{game_id}/rounds/{index}/counter", response_model=GameView)
def respond_to_counter(
    game_id: str,
    index: int,
    body: CounterRequest,
    engine: GameEngine = Depends(get_engine),
    user: AuthUser | None = Depends(optional_user),
):
    try:
        game = engine.get_game(game_id, _uid(user))
        engine.respond_to_counter(game, index, body.accept)
        return engine.view(game)
    except GameError as e:
        raise _http(e)


@router.post("/{game_id}/reveal", response_model=RevealView)
def reveal(
    game_id: str,
    engine: GameEngine = Depends(get_engine),
    user: AuthUser | None = Depends(optional_user),
):
    try:
        return engine.reveal(engine.get_game(game_id, _uid(user)))
    except GameError as e:
        raise _http(e)
