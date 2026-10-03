"""Game rules: starting a day, taking offers, founder decisions, the reveal.

Controllers call into this service; it owns all state transitions and never
lets hidden pitch data (outcome, walk-away valuation) reach a view before the
reveal.
"""

import logging
import random
import uuid
from datetime import UTC, date, datetime

from app.config import Settings
from app.models.game import (
    PLAYER,
    ChatMessage,
    GameState,
    GameView,
    Offer,
    RevealView,
    RoundState,
    RoundView,
)
from app.repositories.game_store import GameStore
from app.repositories.pitch_repository import PitchRepository
from app.repositories.run_repository import RunRepository
from app.repositories.shark_repository import SharkRepository
from app.services import founder
from app.services.deal_math import validate_player_offer
from app.services.scoring import build_reveal

log = logging.getLogger(__name__)


def utc_today() -> date:
    return datetime.now(UTC).date()


class GameError(Exception):
    """A rule violation that should be shown to the player (HTTP 400/404/409)."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


class GameEngine:
    def __init__(
        self,
        settings: Settings,
        pitches: PitchRepository,
        sharks: SharkRepository,
        store: GameStore,
        runs: RunRepository,
    ):
        self.settings = settings
        self.pitches = pitches
        self.sharks = sharks
        self.store = store
        self.runs = runs

    # ---------- lifecycle ----------

    def new_game(
        self,
        seed: int | None = None,
        *,
        daily: bool = False,
        user_id: str | None = None,
        today: date | None = None,
    ) -> GameState:
        """Start a day. The daily challenge gives everyone the same pitches each UTC day."""
        ids = sorted(self.pitches.list_ids())
        if not ids:
            raise GameError("No pitches available. Add some to the pitches/ folder.", 503)
        daily_date = (today or utc_today()) if daily else None
        if daily_date:
            seed = int(daily_date.strftime("%Y%m%d"))
        chosen = self._pick_pitches(random.Random(seed), ids)
        game = GameState(
            id=uuid.uuid4().hex,
            bankroll_start=self.settings.starting_bankroll,
            cash=self.settings.starting_bankroll,
            rounds=[RoundState(pitch_id=pid) for pid in chosen],
            user_id=user_id,
            daily_date=daily_date,
        )
        self.store.save(game)
        return game

    def _pick_pitches(self, rng: random.Random, ids: list[str]) -> list[str]:
        """Mix flops and successes so every day has real risk.

        Each day gets 1-3 companies that failed (the player never knows how many),
        the rest are drawn from the survivors, and the order is shuffled.
        """
        n = min(self.settings.rounds_per_game, len(ids))
        flops = [i for i in ids if self.pitches.get(i).outcome.status == "failed"]
        others = [i for i in ids if i not in flops]
        k = min(rng.choice([1, 2, 2, 3]), len(flops), n)
        k = max(k, n - len(others))  # not enough survivors: use more flops
        chosen = rng.sample(flops, k) + rng.sample(others, n - k)
        rng.shuffle(chosen)
        return chosen

    def get_game(self, game_id: str, user_id: str | None = None) -> GameState:
        """Load a game. Games owned by an account can only be used by that account."""
        game = self.store.get(game_id)
        if game is None:
            raise GameError("Game not found or expired.", 404)
        if game.user_id and game.user_id != user_id:
            raise GameError("This game belongs to another player.", 403)
        return game

    def claim(self, game: GameState, user_id: str) -> GameState:
        """Attach a guest game to the account that just signed in (and save it if finished)."""
        if game.user_id and game.user_id != user_id:
            raise GameError("This game belongs to another player.", 403)
        game.user_id = user_id
        self.store.save(game)
        if game.revealed:
            self.reveal(game)
        return game

    def _round(self, game: GameState, index: int) -> RoundState:
        if not 0 <= index < len(game.rounds):
            raise GameError("No such round.", 404)
        if index != game.current_round:
            raise GameError("That round isn't active.", 409)
        return game.rounds[index]

    # ---------- Q&A ----------

    def questions_left(self, r: RoundState) -> int:
        asked = sum(1 for m in r.chat if m.role == "user")
        return max(0, self.settings.max_questions_per_round - asked)

    def check_can_ask(self, game: GameState, index: int) -> RoundState:
        r = self._round(game, index)
        if r.status != "open" or r.player_offer or r.player_passed:
            raise GameError("Questions are closed for this pitch.", 409)
        if self.questions_left(r) == 0:
            raise GameError("You've used all your questions for this pitch.", 409)
        return r

    def record_answer(self, game: GameState, index: int, question: str, answer: str) -> None:
        r = game.rounds[index]
        r.chat.append(ChatMessage(role="user", content=question))
        r.chat.append(ChatMessage(role="assistant", content=answer))
        self.store.save(game)

    # ---------- offers ----------

    def _shark_offers(self, pitch_id: str) -> list[Offer]:
        reactions = self.pitches.get_reactions(pitch_id).reactions
        return [
            Offer(investor=x.shark_id, amount=x.offer.amount, equity=x.offer.equity)
            for x in reactions
            if x.decision == "in" and x.offer
        ]

    def submit_offer(
        self,
        game: GameState,
        index: int,
        *,
        passed: bool,
        amount: int | None,
        equity: float | None,
    ) -> GameState:
        r = self._round(game, index)
        if r.status != "open":
            raise GameError("This pitch is no longer taking offers.", 409)
        pitch = self.pitches.get(r.pitch_id)

        offers = self._shark_offers(r.pitch_id)
        if passed:
            r.player_passed = True
        else:
            if amount is None or equity is None:
                raise GameError("An offer needs an amount and an equity percentage.")
            validate_player_offer(amount, equity, pitch.ask, game.cash)
            r.player_offer = Offer(investor=PLAYER, amount=amount, equity=equity)
            offers.append(r.player_offer)

        sharks = {s.id: s for s in self.sharks.all()}
        decision = founder.decide(offers, pitch, sharks)
        r.founder_line = decision.line

        if decision.kind == "accepted":
            self._close(game, r, decision.offer, "accepted")
        elif decision.kind == "countered" and decision.offer.investor == PLAYER:
            r.status = "countered"
            r.decision = "countered"
            r.counter = decision.offer
        elif decision.kind == "countered":
            original = next(o for o in offers if o.investor == decision.offer.investor)
            name = sharks[original.investor].name
            if founder.shark_takes_counter(original, decision.offer):
                r.founder_line += f" {name}: \"You've got yourself a deal.\""
                self._close(game, r, decision.offer, "accepted")
            else:
                r.founder_line += f" {name}: \"Too rich for me. I'm out.\""
                self._close(game, r, None, "walked")
        else:
            self._close(game, r, None, "walked")

        self.store.save(game)
        return game

    def respond_to_counter(self, game: GameState, index: int, accept: bool) -> GameState:
        r = self._round(game, index)
        if r.status != "countered" or r.counter is None:
            raise GameError("There's no counter-offer to respond to.", 409)
        if accept:
            if r.counter.amount > game.cash:
                raise GameError("You don't have enough cash left for this deal.")
            r.founder_line = "Deal! Thank you, we can't wait to work with you."
            self._close(game, r, r.counter, "accepted")
        else:
            r.founder_line = "No problem. We'll keep building on our own."
            self._close(game, r, None, "walked")
        self.store.save(game)
        return game

    def _close(self, game: GameState, r: RoundState, winner: Offer | None, decision: str) -> None:
        r.status = "closed"
        r.decision = decision
        r.winner = winner
        if winner and winner.investor == PLAYER:
            game.cash -= winner.amount
        game.current_round = min(game.current_round + 1, len(game.rounds))

    # ---------- reveal ----------

    def reveal(self, game: GameState) -> RevealView:
        if not game.finished:
            raise GameError("Finish all pitches before the reveal.", 409)
        game.revealed = True
        pitches = {r.pitch_id: self.pitches.get(r.pitch_id) for r in game.rounds}
        sharks = {s.id: s for s in self.sharks.all()}
        result = build_reveal(game, pitches, sharks)
        if game.user_id and not game.saved and self.runs.enabled:
            try:
                self.runs.save(result, game.user_id, [r.pitch_id for r in game.rounds], game.daily_date)
                game.saved = True
            except Exception:
                log.exception("Could not save run %s", game.id)
        self.store.save(game)
        result.daily_date = game.daily_date
        result.saved = game.saved
        return result

    # ---------- views ----------

    def view(self, game: GameState) -> GameView:
        rounds = []
        for i, r in enumerate(game.rounds):
            pitch = self.pitches.get(r.pitch_id)
            rounds.append(
                RoundView(
                    index=i,
                    pitch=pitch.to_public(),
                    status=r.status,
                    decision=r.decision,
                    questions_left=self.questions_left(r),
                    chat=r.chat,
                    shark_reactions=self.pitches.get_reactions(r.pitch_id).reactions,
                    player_offer=r.player_offer,
                    player_passed=r.player_passed,
                    counter=r.counter,
                    winner=r.winner,
                    founder_line=r.founder_line,
                )
            )
        return GameView(
            id=game.id,
            bankroll_start=game.bankroll_start,
            cash=game.cash,
            current_round=game.current_round,
            total_rounds=len(game.rounds),
            finished=game.finished,
            revealed=game.revealed,
            daily_date=game.daily_date,
            signed_in=game.user_id is not None,
            saved=game.saved,
            rounds=rounds,
        )
