# Tank Day 🦈

Take a seat on the panel. Every day you get **$1M** and **five real startup pitches**. Watch each pitch, question the founder, compete with four AI sharks for the deal, then fast-forward years later and see what really happened to every company and what your slice is worth. Every day adds to your lifetime **portfolio**.

It's built to teach (including teenagers) how startup investing works: valuation, equity, dilution, exits, survivorship bias, and why investors spread their bets. The wording is deliberately plain, with a "money words" glossary and a short lesson after every company.

## Quick start

Requirements: [uv](https://docs.astral.sh/uv/) (Python 3.12) and Node 20+.

```bash
make install
cp .env.example .env    # optional: add ANTHROPIC_API_KEY for the live AI founder
make dev                # API on :8000, web app on http://localhost:5173
```

The game works without an API key. A built-in offline founder answers questions from the pitch facts.

### Accounts & leaderboards (Supabase)

The Supabase project **tank-day** (`uulpajrparfidqyntdop`) already has the schema from `supabase/migrations/`. To turn on saved runs and leaderboards:

1. Supabase Dashboard → **Project Settings → API Keys** → copy a **secret key** into `.env` as `SUPABASE_SECRET_KEY`. It's server-only, so never commit it or put it in the frontend.
2. Dashboard → **Authentication → URL Configuration**: set **Site URL** to your app URL and add `http://localhost:5173` to **Redirect URLs** so magic links land back in the game.
3. Restart the backend. `/api/health` should report `"accounts": true, "leaderboards": true`.

Optional: run `cd backend && uv run python ../scripts/sync_pitches.py`, then set `PITCH_SOURCE=supabase` to serve pitches from the database instead of the `pitches/` folder.

Supabase's built-in email sender is rate-limited. Configure custom SMTP before a public launch.

| Command | What it does |
|---|---|
| `make dev` | Run backend and frontend together |
| `make test` | Backend test suite (pytest) |
| `make lint` | ruff + oxlint |
| `make validate` | Check every pitch in `pitches/` |
| `make build` | Production build of the web app |

## How a day works

Each day picks 5 of the 17 pitches. Every day includes **1–3 companies that really went out of business**, mixed with survivors and shuffled, so you can't just "buy everything" and win.

1. **Meet**: who's asking, how much, and what that says the company is worth.
2. **Watch**: the real clip, cut before the deal so there are no spoilers.
3. **Ask**: up to 3 questions to an AI founder who only knows pitch-day facts.
4. **Invest**: the four sharks go in or out. You offer money for a slice, or skip. The founder takes the offer that values the company highest (sharks get a small bonus when they can help), counters once if it's close, or walks.
5. **Find out**: what really happened, what your slice is worth now, a lesson, how you did against the sharks, and an index-fund comparison.

**Portfolio.** Every finished day is added to your portfolio: total invested, what it's worth now, profit, and every company you own. Guests' portfolios live in the browser; signed-in players' portfolios are saved in Supabase (`GET /api/me/portfolio`).

## Architecture (MVC)

```
backend/ (FastAPI)
  app/models/         Pydantic domain + API schemas (Pitch, PublicPitch, GameState, views)
  app/repositories/   Data access: Local/SupabasePitchRepository, SharkRepository (YAML), InMemoryGameStore, SupabaseRunRepository
  app/services/       Business logic: game_engine, founder (accept/counter/walk), scoring, deal_math, founder_chat (Claude)
  app/controllers/    Thin HTTP layer: /api/games…, /api/health, /api/sharks, /media
  app/content/        sharks.yaml (fictional personas), lessons.py
frontend/ (React + Vite + TS + Tailwind)
  src/api/            HTTP + SSE client (model access)
  src/store/          Zustand game store (controller)
  src/views/          Home, Game, Reveal screens (views)
  src/components/     SharkPanel, FounderChat, OfferSlip, DecisionBanner, VideoPlayer…
pitches/<slug>/       pitch.json (+ hidden outcome) and reactions.json
scripts/              new_pitch, validate_pitches, generate_shark_reactions, sync_pitches, trim_clip
supabase/migrations/  Database schema + RLS policies
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
| POST | `/api/games/{id}/reveal` | Results (only once every round is closed); saves the run for signed-in players |
| POST | `/api/games/{id}/claim` | Attach a guest game to the signed-in account |
| GET | `/api/leaderboard?scope=daily\|all` | Daily challenge / all-time leaderboard |
| GET | `/api/me/runs` | Signed-in player's run history |
| GET | `/api/me/portfolio` | Every finished day and the companies the player owns |

`POST /api/games` takes `{"mode": "daily"}` for the daily challenge: everyone gets the same 5 pitches each UTC day, and only your first daily run is ranked. Requests may carry `Authorization: Bearer <supabase access token>`. The backend verifies it against the project's JWKS (ES256).

**Security model.** Scores are written only by the backend with the secret key; the tables have no insert policies, so players can't post fake scores. `pitches` (hidden outcomes) has RLS with no policies, so it's service-role only. Games owned by an account can only be used by that account.

## Adding a pitch

```bash
python3 scripts/new_pitch.py my-company       # scaffolds pitches/my-company/pitch.json
# fill in pitch.json (facts = pitch-day knowledge only; outcome with sources)
cd backend && uv run python ../scripts/generate_shark_reactions.py my-company   # or write reactions.json by hand
make validate
```

Read [docs/CONTENT_AND_COPYRIGHT.md](docs/CONTENT_AND_COPYRIGHT.md) before adding clips.

## Roadmap

See [docs/PLAN.md](docs/PLAN.md). Done: MVP + v2 (Supabase Auth, saved runs, leaderboards, daily challenge). Next: a persistent `GameStore` so in-progress games survive server restarts, royalty/loan deals, more pitches (especially flops), TTS shark voices, and deployment.

*Educational game, not financial advice. Not affiliated with Shark Tank, ABC or Sony Pictures Television.*
