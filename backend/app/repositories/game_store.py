"""Game session storage.

Guest games live in memory with a TTL. A persistent store (Supabase) can
implement the same protocol in v2.
"""

import threading
import time
from typing import Protocol

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
