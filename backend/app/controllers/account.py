"""Leaderboards and the signed-in player's run history."""

from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends

from app.dependencies import get_pitch_repository, get_run_repository
from app.models.game import PortfolioDay
from app.repositories.pitch_repository import PitchRepository
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


@router.get("/me/portfolio", response_model=list[PortfolioDay])
def my_portfolio(
    user: AuthUser = Depends(required_user),
    runs: RunRepository = Depends(get_run_repository),
    pitches: PitchRepository = Depends(get_pitch_repository),
):
    """Every finished day and the companies the player owns, oldest first."""
    names = {}
    for pid in pitches.list_ids():
        p = pitches.get(pid)
        names[pid] = (p.company.name, p.outcome.status)
    return runs.portfolio(user.id, names)


@router.get("/me/runs", response_model=list[RunSummary])
def my_runs(
    user: AuthUser = Depends(required_user),
    runs: RunRepository = Depends(get_run_repository),
):
    return runs.runs_for(user.id)
