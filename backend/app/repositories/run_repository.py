"""Finished runs and leaderboards.

`SupabaseRunRepository` writes with the server-only secret key (clients can
never insert scores directly: the tables have no insert policies) and reads
leaderboards through public views. `NullRunRepository` is used when Supabase
isn't configured, so guest play keeps working.
"""

from datetime import UTC, date, datetime
from typing import Literal, Protocol

from pydantic import BaseModel

from app.models.game import Holding, PortfolioDay, RevealView
from app.repositories.supabase_rest import SupabaseRest


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    net_worth: int
    return_pct: float
    deals: int


class RunSummary(BaseModel):
    game_id: str
    daily_date: date | None
    net_worth: int
    return_pct: float
    deals: int
    created_at: str


Scope = Literal["all", "daily"]


class RunRepository(Protocol):
    enabled: bool

    def save(self, reveal: RevealView, user_id: str, pitch_ids: list[str], daily: date | None) -> None: ...
    def leaderboard(self, scope: Scope, day: date | None, limit: int = 20) -> list[LeaderboardEntry]: ...
    def runs_for(self, user_id: str, limit: int = 20) -> list[RunSummary]: ...
    def portfolio(self, user_id: str, names: dict[str, tuple[str, str]]) -> list[PortfolioDay]: ...


class NullRunRepository:
    enabled = False

    def save(self, reveal, user_id, pitch_ids, daily) -> None:
        return None

    def leaderboard(self, scope, day, limit=20) -> list[LeaderboardEntry]:
        return []

    def runs_for(self, user_id, limit=20) -> list[RunSummary]:
        return []

    def portfolio(self, user_id, names) -> list[PortfolioDay]:
        return []


class SupabaseRunRepository:
    enabled = True

    def __init__(self, url: str, secret_key: str):
        self.db = SupabaseRest(url, secret_key)

    def save(self, reveal: RevealView, user_id: str, pitch_ids: list[str], daily: date | None) -> None:
        me = next(s for s in reveal.standings if s.investor == "player")
        [run] = self.db.insert(
            "game_runs",
            {
                "game_id": reveal.game_id,
                "user_id": user_id,
                "daily_date": daily.isoformat() if daily else None,
                "pitch_ids": pitch_ids,
                "bankroll": reveal.bankroll_start,
                "invested": reveal.invested,
                "net_worth": reveal.net_worth,
                "return_pct": reveal.return_pct,
                "deals": me.deals,
            },
        )
        deals = [
            {
                "run_id": run["id"],
                "round": r.index,
                "pitch_id": r.pitch.id,
                "investor": r.deal.investor,
                "amount": r.deal.amount,
                "equity": r.deal.equity,
                "stake_value": r.deal.stake_value,
                "reason": r.reason if r.deal.investor == "player" else None,
            }
            for r in reveal.rounds
            if r.deal
        ]
        if deals:
            self.db.insert("game_deals", deals)

    def leaderboard(self, scope: Scope, day: date | None, limit: int = 20) -> list[LeaderboardEntry]:
        params = {
            "select": "username,net_worth,return_pct,deals",
            "order": "net_worth.desc",
            "limit": str(limit),
        }
        view = "leaderboard_all_time"
        if scope == "daily":
            view = "leaderboard_daily"
            params["daily_date"] = f"eq.{(day or datetime.now(UTC).date()).isoformat()}"
        rows = self.db.select(view, params)
        return [LeaderboardEntry(rank=i + 1, **row) for i, row in enumerate(rows)]

    def runs_for(self, user_id: str, limit: int = 20) -> list[RunSummary]:
        rows = self.db.select(
            "game_runs",
            {
                "select": "game_id,daily_date,net_worth,return_pct,deals,created_at",
                "user_id": f"eq.{user_id}",
                "order": "created_at.desc",
                "limit": str(limit),
            },
        )
        return [RunSummary(**row) for row in rows]

    def portfolio(self, user_id: str, names: dict[str, tuple[str, str]]) -> list[PortfolioDay]:
        """Every day the player has finished, with the companies they own.

        `names` maps pitch id -> (company name, outcome status).
        """
        rows = self.db.select(
            "game_runs",
            {
                "select": "game_id,daily_date,bankroll,created_at,"
                "game_deals(pitch_id,investor,amount,equity,stake_value,reason)",
                "user_id": f"eq.{user_id}",
                "order": "created_at.asc",
                "limit": "500",
            },
        )
        days = []
        for row in rows:
            holdings = [
                Holding(
                    pitch_id=d["pitch_id"],
                    company=names.get(d["pitch_id"], (d["pitch_id"], ""))[0],
                    status=names.get(d["pitch_id"], ("", "unknown"))[1],
                    amount=d["amount"],
                    equity=float(d["equity"]),
                    stake_value=d["stake_value"],
                    reason=d.get("reason"),
                )
                for d in row["game_deals"]
                if d["investor"] == "player"
            ]
            days.append(
                PortfolioDay(
                    game_id=row["game_id"],
                    played_at=row["created_at"],
                    daily_date=row["daily_date"],
                    bankroll=row["bankroll"],
                    holdings=holdings,
                )
            )
        return days
