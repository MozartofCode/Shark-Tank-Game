"""Application settings, loaded from environment variables / .env."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", REPO_ROOT / "backend" / ".env"),
        extra="ignore",
    )

    pitches_dir: Path = REPO_ROOT / "pitches"
    starting_bankroll: int = 1_000_000  # fresh cash every day
    rounds_per_game: int = 5
    max_questions_per_round: int = 3
    game_ttl_seconds: int = 60 * 60 * 24 * 7
    # SQLite locally; in production use the Supabase Postgres connection string.
    database_url: str = f"sqlite:///{REPO_ROOT / 'backend' / 'data' / 'tankday.db'}"

    anthropic_api_key: str | None = None
    founder_model: str = "claude-haiku-4-5"
    reactions_model: str = "claude-sonnet-5-5"

    # Abuse protection
    rate_limits_enabled: bool = True
    trust_proxy_headers: bool = False  # set true behind Fly/Render/Vercel proxies
    ai_daily_call_cap: int = 2000  # live AI founder answers per day, then offline answers

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Supabase (v2): auth, saved runs, leaderboards, optional pitch storage.
    supabase_url: str | None = None
    supabase_publishable_key: str | None = None
    supabase_secret_key: str | None = None  # server-only; never expose to the browser
    pitch_source: Literal["local", "supabase"] = "local"

    @property
    def llm_enabled(self) -> bool:
        return bool(self.anthropic_api_key)

    @property
    def auth_enabled(self) -> bool:
        return bool(self.supabase_url)

    @property
    def persistence_enabled(self) -> bool:
        return bool(self.supabase_url and self.supabase_secret_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
