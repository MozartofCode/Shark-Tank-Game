"""Verifies Supabase Auth access tokens (asymmetric ES256/RS256 keys via JWKS)."""

import logging
from dataclasses import dataclass

import jwt
from fastapi import Header, HTTPException

from app.config import get_settings

log = logging.getLogger(__name__)
_jwks_client: jwt.PyJWKClient | None = None


@dataclass
class AuthUser:
    id: str
    email: str | None


def _jwks() -> jwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        url = f"{get_settings().supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = jwt.PyJWKClient(url, cache_keys=True, lifespan=3600)
    return _jwks_client


def verify_token(token: str) -> AuthUser:
    settings = get_settings()
    signing_key = _jwks().get_signing_key_from_jwt(token)
    claims = jwt.decode(
        token,
        signing_key.key,
        algorithms=["ES256", "RS256"],
        audience="authenticated",
        issuer=f"{settings.supabase_url.rstrip('/')}/auth/v1",
    )
    return AuthUser(id=claims["sub"], email=claims.get("email"))


def optional_user(authorization: str | None = Header(default=None)) -> AuthUser | None:
    """FastAPI dependency: the signed-in user, or None for guests.

    A present-but-invalid token is rejected (401) rather than silently ignored.
    """
    if not authorization or not get_settings().auth_enabled:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header.")
    try:
        return verify_token(token)
    except jwt.PyJWTError as e:
        log.info("Rejected token: %s", e)
        raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.")


def required_user(authorization: str | None = Header(default=None)) -> AuthUser:
    user = optional_user(authorization)
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in required.")
    return user
