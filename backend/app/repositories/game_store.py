"""Game session storage.

`SqlGameStore` persists games so they survive restarts and work across several
server instances. `InMemoryGameStore` is kept for tests.
"""

import threading
import time
from typing import Protocol

from sqlalchemy import delete, insert, select, update
from sqlalchemy.engine import Engine

from app.db import game_sessions
from app.models.game import GameState


class GameStore(Protocol):
    def save(self, game: GameState) -> None: ...
    def get(self, game_id: str) -> GameState | None: ...


class InMemoryGameStore:
    def __init__(self, ttl_seconds: int):
        self.ttl = ttl_seconds
        self._games: dict[str, GameState] = {}
        self._lock = threading.Lock()

    def save(self, game: GameState) -> None:
        with self._lock:
            self._evict_expired()
            self._games[game.id] = game

    def get(self, game_id: str) -> GameState | None:
        with self._lock:
            game = self._games.get(game_id)
            if game and time.time() - game.created_at > self.ttl:
                del self._games[game_id]
                return None
            return game

    def _evict_expired(self) -> None:
        now = time.time()
        for gid in [g for g, s in self._games.items() if now - s.created_at > self.ttl]:
            del self._games[gid]


class SqlGameStore:
    def __init__(self, engine: Engine, ttl_seconds: int):
        self.engine = engine
        self.ttl = ttl_seconds
        self._saves = 0

    def save(self, game: GameState) -> None:
        row = {
            "user_id": game.user_id,
            "data": game.model_dump_json(),
            "updated_at": time.time(),
        }
        with self.engine.begin() as conn:
            result = conn.execute(
                update(game_sessions).where(game_sessions.c.id == game.id).values(**row)
            )
            if result.rowcount == 0:
                conn.execute(
                    insert(game_sessions).values(id=game.id, created_at=game.created_at, **row)
                )
        self._saves += 1
        if self._saves % 200 == 0:
            self._evict_expired()

    def get(self, game_id: str) -> GameState | None:
        with self.engine.connect() as conn:
            row = conn.execute(
                select(game_sessions.c.data, game_sessions.c.created_at).where(
                    game_sessions.c.id == game_id
                )
            ).first()
        if row is None or time.time() - row.created_at > self.ttl:
            return None
        return GameState.model_validate_json(row.data)

    def _evict_expired(self) -> None:
        cutoff = time.time() - self.ttl
        with self.engine.begin() as conn:
            conn.execute(delete(game_sessions).where(game_sessions.c.created_at < cutoff))
