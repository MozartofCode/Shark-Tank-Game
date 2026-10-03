"""Application settings, loaded from environment variables / .env."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", REPO_ROOT / "backend" / ".env"),
        extra="ignore",
    )

    pitches_dir: Path = REPO_ROOT / "pitches"
    starting_bankroll: int = 10_000_000
    rounds_per_game: int = 5
    max_questions_per_round: int = 3
    game_ttl_seconds: int = 60 * 60 * 24

    anthropic_api_key: str | None = None
    founder_model: str = "claude-haiku-4-5"
    reactions_model: str = "claude-sonnet-5-5"

    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    @property
    def llm_enabled(self) -> bool:
        return bool(self.anthropic_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
