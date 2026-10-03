"""Minimal client for Supabase's PostgREST API (https://<ref>.supabase.co/rest/v1)."""

from typing import Any

import httpx


class SupabaseRest:
    def __init__(self, url: str, key: str, timeout: float = 10.0):
        self._client = httpx.Client(
            base_url=f"{url.rstrip('/')}/rest/v1",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
            timeout=timeout,
        )

    def select(self, table: str, params: dict[str, str] | None = None) -> list[dict[str, Any]]:
        res = self._client.get(f"/{table}", params=params or {})
        res.raise_for_status()
        return res.json()

    def insert(self, table: str, rows: list[dict[str, Any]] | dict[str, Any]) -> list[dict[str, Any]]:
        res = self._client.post(f"/{table}", json=rows, headers={"Prefer": "return=representation"})
        res.raise_for_status()
        return res.json()

    def upsert(self, table: str, rows: list[dict[str, Any]]) -> None:
        res = self._client.post(
            f"/{table}", json=rows, headers={"Prefer": "resolution=merge-duplicates"}
        )
        res.raise_for_status()
