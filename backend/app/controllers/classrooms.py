"""Classroom mode: teachers create a class; students play the same five pitches."""

from collections import Counter

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from app.dependencies import get_classroom_repository, get_engine
from app.repositories.classroom_repository import ClassResult, ClassroomRepository
from app.services.game_engine import GameEngine
from app.services.rate_limit import rate_limit

router = APIRouter(prefix="/api/classes", tags=["classrooms"])


class CreateClassRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class ClassCreated(BaseModel):
    code: str
    name: str
    teacher_token: str


class ClassInfo(BaseModel):
    code: str
    name: str


class CompanyStat(BaseModel):
    pitch_id: str
    company: str
    status: str
    investors: int
    total_invested: int
    total_value: int


class ClassDashboard(BaseModel):
    code: str
    name: str
    companies: list[str]
    students: list[ClassResult]
    company_stats: list[CompanyStat]
    prompts: list[str]


@router.post(
    "", response_model=ClassCreated, dependencies=[Depends(rate_limit("new_class", 10, 3600))]
)
def create_class(
    body: CreateClassRequest,
    repo: ClassroomRepository = Depends(get_classroom_repository),
    engine: GameEngine = Depends(get_engine),
):
    room = repo.create(
        body.name.strip(), lambda seed: [r.pitch_id for r in engine.new_game_preview(seed)]
    )
    return ClassCreated(code=room.code, name=room.name, teacher_token=room.teacher_token)


@router.get("/{code}", response_model=ClassInfo)
def get_class(code: str, repo: ClassroomRepository = Depends(get_classroom_repository)):
    room = repo.get(code)
    if room is None:
        raise HTTPException(status_code=404, detail="That class code doesn't exist.")
    return ClassInfo(code=room.code, name=room.name)


@router.get("/{code}/dashboard", response_model=ClassDashboard)
def dashboard(
    code: str,
    x_teacher_token: str = Header(default=""),
    repo: ClassroomRepository = Depends(get_classroom_repository),
    engine: GameEngine = Depends(get_engine),
):
    room = repo.get(code)
    if room is None or room.teacher_token != x_teacher_token:
        raise HTTPException(status_code=403, detail="Only the teacher can see this class.")
    pitch_ids = room.pitch_ids or [r.pitch_id for r in engine.new_game_preview(room.seed)]
    students = sorted(repo.results(room.code), key=lambda s: s.profit, reverse=True)
    stats = _company_stats(engine, pitch_ids, students)
    return ClassDashboard(
        code=room.code,
        name=room.name,
        companies=[engine.pitches.get(p).company.name for p in pitch_ids],
        students=students,
        company_stats=stats,
        prompts=_prompts(stats, students),
    )


def _company_stats(engine: GameEngine, pitch_ids: list[str], students: list[ClassResult]):
    stats = []
    for pid in pitch_ids:
        pitch = engine.pitches.get(pid)
        deals = [d for s in students for d in s.deals if d["pitch_id"] == pid]
        stats.append(
            CompanyStat(
                pitch_id=pid,
                company=pitch.company.name,
                status=pitch.outcome.status,
                investors=len(deals),
                total_invested=sum(d["amount"] for d in deals),
                total_value=sum(d["stake_value"] for d in deals),
            )
        )
    return stats


def _prompts(stats: list[CompanyStat], students: list[ClassResult]) -> list[str]:
    if not students:
        return ["No results yet. Prompts appear here as students finish."]
    prompts = []
    popular = max(stats, key=lambda s: s.investors)
    if popular.investors:
        prompts.append(
            f"{popular.investors} of {len(students)} students backed {popular.company}. "
            f"What made it so convincing?"
        )
    flops = [s for s in stats if s.status == "failed" and s.investors]
    if flops:
        f = max(flops, key=lambda s: s.investors)
        prompts.append(
            f"{f.company} went out of business, yet {f.investors} students invested. "
            "Were there warning signs in the pitch?"
        )
    skipped = [s for s in stats if s.status != "failed" and s.investors == 0]
    if skipped:
        prompts.append(
            f"Nobody invested in {skipped[0].company}, and it survived. "
            "Why do investors miss good companies?"
        )
    reasons = Counter(d.get("reason") for s in students for d in s.deals if d.get("reason"))
    if reasons:
        top, n = reasons.most_common(1)[0]
        label = {
            "team": "the team",
            "product": "the product",
            "price": "a good price",
            "gut": "a gut feeling",
        }
        prompts.append(
            f"The most common reason to invest was {label.get(top, top)} ({n} deals). "
            "Is that a good reason?"
        )
    best, worst = students[0], students[-1]
    if len(students) > 1 and best.profit != worst.profit:
        prompts.append(
            f"{best.student} did best and {worst.student} did worst. "
            "Compare how many companies each invested in."
        )
    prompts.append(
        "Would you rather own a big slice of a small company or a small slice of a big one?"
    )
    return prompts
