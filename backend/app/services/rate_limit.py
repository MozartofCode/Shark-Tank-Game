"""Simple per-IP sliding-window rate limits.

In-process, so each server instance enforces its own limits. That's enough to
stop casual abuse; put a proxy/WAF in front for anything heavier.
"""

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from app.config import get_settings


class RateLimiter:
    def __init__(self):
        self._hits: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, bucket: str, key: str, limit: int, window_seconds: int) -> bool:
        now = time.monotonic()
        with self._lock:
            hits = self._hits[(bucket, key)]
            while hits and now - hits[0] > window_seconds:
                hits.popleft()
            if len(hits) >= limit:
                return False
            hits.append(now)
            return True

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


limiter = RateLimiter()


def client_ip(request: Request) -> str:
    if get_settings().trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(bucket: str, limit: int, window_seconds: int):
    """FastAPI dependency factory: 429 when an IP exceeds `limit` per window."""

    def dependency(request: Request) -> None:
        if not get_settings().rate_limits_enabled:
            return
        if not limiter.check(bucket, client_ip(request), limit, window_seconds):
            raise HTTPException(
                status_code=429, detail="Slow down a little! Try again in a few minutes."
            )

    return dependency


class DailyBudget:
    """Counts paid AI calls per UTC day; past the cap, callers use the free fallback."""

    def __init__(self):
        self._day = ""
        self._count = 0
        self._lock = threading.Lock()

    def try_spend(self, cap: int) -> bool:
        today = time.strftime("%Y-%m-%d", time.gmtime())
        with self._lock:
            if today != self._day:
                self._day, self._count = today, 0
            if self._count >= cap:
                return False
            self._count += 1
            return True


ai_budget = DailyBudget()
