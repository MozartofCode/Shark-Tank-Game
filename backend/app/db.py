"""Relational storage for server-side state (game sessions, classrooms).

Locally this is a SQLite file. In production, point DATABASE_URL at the
Supabase Postgres connection string; the same tables work on both.
"""

from functools import lru_cache

from sqlalchemy import (
    JSON,
    BigInteger,
    Column,
    Float,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
)
from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool

from app.config import get_settings

metadata = MetaData()

game_sessions = Table(
    "game_sessions",
    metadata,
    Column("id", String(64), primary_key=True),
    Column("user_id", String(64), index=True),
    Column("data", Text, nullable=False),
    Column("created_at", Float, nullable=False, index=True),
    Column("updated_at", Float, nullable=False),
)

classrooms = Table(
    "classrooms",
    metadata,
    Column("code", String(12), primary_key=True),
    Column("name", String(80), nullable=False),
    Column("teacher_token", String(64), nullable=False),
    Column("seed", Integer, nullable=False),
    Column("created_at", Float, nullable=False),
)

classroom_results = Table(
    "classroom_results",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("code", String(12), nullable=False, index=True),
    Column("game_id", String(64), nullable=False, unique=True),
    Column("student", String(40), nullable=False),
    Column("profit", BigInteger, nullable=False),
    Column("invested", BigInteger, nullable=False),
    Column("deals", JSON, nullable=False),
    Column("created_at", Float, nullable=False),
)


def make_engine(url: str) -> Engine:
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    if url == "sqlite:///:memory:":
        engine = create_engine(url, connect_args={"check_same_thread": False}, poolclass=StaticPool)
    elif url.startswith("sqlite"):
        engine = create_engine(url, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=5)
    metadata.create_all(engine)
    return engine


@lru_cache
def get_engine() -> Engine:
    return make_engine(get_settings().database_url)
