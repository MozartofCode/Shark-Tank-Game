"""Leaderboards and the signed-in player's run history."""

from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends

from app.dependencies import get_run_repository
from app.repositories.run_repository import LeaderboardEntry, RunRepository, RunSummary
from app.services.auth import AuthUser, required_user
from app.services.game_engine import utc_today

router = APIRouter(prefix="/api", tags=["account"])


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(
    scope: Literal["all", "daily"] = "daily",
    day: date | None = None,
    runs: RunRepository = Depends(get_run_repository),
):
    return runs.leaderboard(scope, day or utc_today())


@router.get("/me/runs", response_model=list[RunSummary])
def my_runs(
    user: AuthUser = Depends(required_user),
    runs: RunRepository = Depends(get_run_repository),
):
    return runs.runs_for(user.id)
