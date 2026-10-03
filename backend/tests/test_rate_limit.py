from fastapi.testclient import TestClient

from app.main import app
from app.services.rate_limit import DailyBudget, RateLimiter, limiter


def test_limiter_window():
    rl = RateLimiter()
    assert all(rl.check("b", "ip", 3, 60) for _ in range(3))
    assert not rl.check("b", "ip", 3, 60)
    assert rl.check("b", "other-ip", 3, 60)


def test_daily_budget_cap():
    budget = DailyBudget()
    assert budget.try_spend(2) and budget.try_spend(2)
    assert not budget.try_spend(2)


def test_new_game_is_rate_limited():
    limiter.reset()
    client = TestClient(app)
    codes = [client.post("/api/games").status_code for _ in range(31)]
    assert codes[:30] == [200] * 30 and codes[30] == 429
    limiter.reset()
