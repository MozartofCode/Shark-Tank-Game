"""Classrooms: a teacher creates a class, students play the same five pitches."""

import secrets
import time

from pydantic import BaseModel
from sqlalchemy import insert, select
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError

from app.db import classroom_results, classrooms

# No 0/O or 1/I so codes are easy to read aloud and type.
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


class Classroom(BaseModel):
    code: str
    name: str
    seed: int
    teacher_token: str
    pitch_ids: list[str] = []


class ClassResult(BaseModel):
    game_id: str
    student: str
    profit: int
    invested: int
    deals: list[dict]
    created_at: float


class ClassroomRepository:
    def __init__(self, engine: Engine):
        self.engine = engine

    def create(self, name: str, pick) -> Classroom:
        """`pick(seed)` returns the class's pitch ids for that seed."""
        for _ in range(10):
            seed = secrets.randbelow(2**31)
            room = Classroom(
                code="".join(secrets.choice(CODE_ALPHABET) for _ in range(6)),
                name=name,
                seed=seed,
                teacher_token=secrets.token_urlsafe(24),
                pitch_ids=pick(seed),
            )
            try:
                with self.engine.begin() as conn:
                    conn.execute(
                        insert(classrooms).values(**room.model_dump(), created_at=time.time())
                    )
                return room
            except IntegrityError:
                continue  # code collision, try another
        raise RuntimeError("Could not allocate a class code")

    def get(self, code: str) -> Classroom | None:
        with self.engine.connect() as conn:
            row = conn.execute(select(classrooms).where(classrooms.c.code == code.upper())).first()
        if row is None:
            return None
        return Classroom(
            code=row.code,
            name=row.name,
            seed=row.seed,
            teacher_token=row.teacher_token,
            pitch_ids=row.pitch_ids or [],
        )

    def add_result(self, code: str, result: ClassResult) -> None:
        try:
            with self.engine.begin() as conn:
                conn.execute(insert(classroom_results).values(code=code, **result.model_dump()))
        except IntegrityError:
            pass  # already recorded for this game

    def results(self, code: str) -> list[ClassResult]:
        with self.engine.connect() as conn:
            rows = conn.execute(
                select(classroom_results)
                .where(classroom_results.c.code == code)
                .order_by(classroom_results.c.created_at)
            ).all()
        return [
            ClassResult(
                game_id=r.game_id,
                student=r.student,
                profit=r.profit,
                invested=r.invested,
                deals=r.deals,
                created_at=r.created_at,
            )
            for r in rows
        ]
