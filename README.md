# Tank Day 🦈

Take a seat on the panel. You have **$10M** and **five real startup pitches**. Watch each pitch, grill the founder, compete with four AI sharks for the deal, then fast-forward years later and see what really happened to every company and what your stake is worth.

It's a game for people who love Shark Tank and want to learn how startup investing works: valuation, equity, dilution, exits, survivorship bias.

## Quick start

Requirements: [uv](https://docs.astral.sh/uv/) (Python 3.12) and Node 20+.

```bash
make install
cp .env.example .env    # optional: add ANTHROPIC_API_KEY for the live AI founder
make dev                # API on :8000, web app on http://localhost:5173
```

The game works without an API key. A built-in offline founder answers questions from the pitch facts.

| Command | What it does |
|---|---|
| `make dev` | Run backend and frontend together |
| `make test` | Backend test suite (pytest) |
| `make lint` | ruff + oxlint |
| `make validate` | Check every pitch in `pitches/` |
| `make build` | Production build of the web app |

## How a day works

1. **Intro**: company, the ask, and the implied valuation (ask ÷ equity).
2. **Pitch**: the real clip, cut before the deal so there are no spoilers.
3. **Q&A**: up to 3 questions to an AI founder who only knows pitch-day facts.
4. **Offers**: the four sharks go in or out. You make your own offer or pass. The founder accepts the best offer, counters once if it's close, or walks.
5. **Reveal**: real outcome, your stake's value after dilution, MOIC, a lesson, a leaderboard against the sharks, and an index-fund benchmark.

## Architecture (MVC)

```
backend/ (FastAPI)
  app/models/         Pydantic domain + API schemas (Pitch, PublicPitch, GameState, views)
  app/repositories/   Data access: LocalPitchRepository (JSON), SharkRepository (YAML), InMemoryGameStore
  app/services/       Business logic: game_engine, founder (accept/counter/walk), scoring, deal_math, founder_chat (Claude)
  app/controllers/    Thin HTTP layer: /api/games…, /api/health, /api/sharks, /media
  app/content/        sharks.yaml (fictional personas), lessons.py
frontend/ (React + Vite + TS + Tailwind)
  src/api/            HTTP + SSE client (model access)
  src/store/          Zustand game store (controller)
  src/views/          Home, Game, Reveal screens (views)
  src/components/     SharkPanel, FounderChat, OfferSlip, DecisionBanner, VideoPlayer…
pitches/<slug>/       pitch.json (+ hidden outcome) and reactions.json
scripts/              new_pitch, validate_pitches, generate_shark_reactions, trim_clip
```

**Server-authoritative.** The browser never receives `outcome`, `real_deal` or `founder_prefs` until the reveal (`PublicPitch` omits them). `/media` only serves whitelisted media files. Both rules are enforced by tests.

**Deterministic money, AI flavour.** All deal math and founder decisions are plain Python (`services/founder.py`, `services/scoring.py`). Claude only writes dialogue: live founder answers (Claude Haiku 4.5, streamed over SSE) and offline shark reactions (Claude Sonnet 5.5, `scripts/generate_shark_reactions.py`).

### API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/games` | Start a day (5 random pitches) |
| GET | `/api/games/{id}` | Resume |
| POST | `/api/games/{id}/rounds/{i}/questions` | Ask the founder (SSE: `delta`…, `done`) |
| POST | `/api/games/{id}/rounds/{i}/offer` | `{amount, equity}` or `{pass: true}` |
| POST | `/api/games/{id}/rounds/{i}/counter` | `{accept: bool}` |
| POST | `/api/games/{id}/reveal` | Results (only once every round is closed) |

## Adding a pitch

```bash
python3 scripts/new_pitch.py my-company       # scaffolds pitches/my-company/pitch.json
# fill in pitch.json (facts = pitch-day knowledge only; outcome with sources)
cd backend && uv run python ../scripts/generate_shark_reactions.py my-company   # or write reactions.json by hand
make validate
```

Read [docs/CONTENT_AND_COPYRIGHT.md](docs/CONTENT_AND_COPYRIGHT.md) before adding clips.

## Roadmap

See [docs/PLAN.md](docs/PLAN.md). Next up (v2): Supabase Auth, saved runs, leaderboards and a daily challenge. The `PitchRepository` and `GameStore` protocols are the swap points.

*Educational game, not financial advice. Not affiliated with Shark Tank, ABC or Sony Pictures Television.*
