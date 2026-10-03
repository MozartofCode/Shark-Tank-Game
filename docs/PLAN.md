# Shark Tank Game ("Tank Day") — MVP Plan

## Context
The repo is empty apart from a README. The goal is a web game where the player sits as one of the judges in a Shark Tank-style panel. Each round ("a day in the tank") has 5 real pitch clips from Shark Tank, YC and similar sources. The player starts with a fictional bankroll ($10M by default), watches each clip, questions the founder, and competes against AI sharks with offers. At the end, a "5 years later…" reveal uses each company's **real** outcome to show what the portfolio is worth. The target player loves Shark Tank and business and wants to learn finance: valuation, equity, dilution, diversification, survivorship bias. That happens through play, not lectures.

Decisions confirmed with the user:
- **Real outcomes** decide returns.
- **LLM-powered** sharks and founder.
- **React + Vite (TypeScript)** frontend and **Python (FastAPI)** backend.
- **Local folder + JSON** for pitches in the MVP.
- **Ask + offer** interaction: the player asks questions, then makes an offer.
- **Guest play first**, with Supabase Auth in v2.
- **Fast-forward reveal** at the end.
- **Public launch eventually**, so content sources and characters must be swappable and legally clean.

---

## 1. Core game loop
```
HOME → START DAY (5 random pitches, $10M bankroll)
  for each pitch:
    INTRO card (company, ask: "$200K for 10%" → implied valuation $2M)
    VIDEO clip
    Q&A: sharks ask 1–2 questions each (pre-generated), player asks up to 3 (live AI founder)
    OFFERS: each shark is "in" (with an offer) or "out" with a one-liner; player submits an offer or passes
    FOUNDER DECISION: accepts the best offer / counters once / walks away
  → REVEAL ("5 years later…"): one card per deal: real story, stake value, MOIC, lesson
  → SUMMARY: final net worth vs. $10M, vs. each shark, vs. "just bought an index fund"
```
Undeployed cash stays as cash, and the summary compares it with an S&P 500 benchmark. That teaches opportunity cost.

## 2. Game math (deterministic Python, never the LLM)
- Offer = `amount A` for `equity e`, so the implied **post-money valuation is A / e**. The UI always shows this live as the player types.
- Constraints: `A ≤ cash`, `0 < e ≤ 100%`, and the amount must fall within a sensible band of the ask (e.g. 0.25×–3× ask amount).
- **Founder acceptance** (`founder.py`): every offer gets the score `valuation_score + value_add_bonus(shark, category) − equity_penalty`. Offers below the founder's hidden `walkaway_valuation` (taken from pitch data, usually based on the real deal or the ask) are rejected. If the best offer is close, the founder counters once (e.g. "same money for 15%"). The LLM only writes the founder's line explaining the choice.
- **Payout at reveal**: `stake_value = e × exit_value_at_horizon × retention_factor`
  - `retention_factor` models dilution from later rounds. It is stored per pitch, with a default of ~0.7 when the company raised more money.
  - If the company failed, the stake is worth 0. If the company was acquired, the acquisition price is used.
  - Flag: `deal_closed_after_show: false`. Many TV deals never closed, which is a fun teaching moment. For gameplay the player's deal still counts.
- Final net worth = remaining cash + Σ stake values. Metrics: total return %, MOIC per deal, best/worst pick, and rank against each shark. Sharks' deals are scored the same way.

## 3. AI sharks & founder
- **4 original fictional sharks**, not real sharks, because of likeness and trademark issues for a public launch. Each has a persona in `backend/app/sharks/personas.yaml` with these fields: name, avatar, thesis (e.g. consumer brands / SaaS / food / hardware), risk appetite, deal style (equity, royalty, loan + equity), budget, catchphrases.
- **Shark reactions are pre-generated per pitch** at content-ingest time (`scripts/generate_shark_reactions.py`) and cached as `pitches/<slug>/reactions.json`. This gives zero runtime cost and consistent behaviour, and the reactions can be hand-edited. The LLM call uses structured output (JSON schema / tool use): `{questions[], comment, decision: "in"|"out", offer?: {amount, equity, royalty?}}`. Python then validates and clamps the offer.
- **Live AI founder** answers the player's questions: `POST …/questions`, streamed with SSE.
  - Grounding: the system prompt contains only `transcript + facts` from `pitch.json`. It must never include the `outcome` block, so the future can't leak.
  - The founder may say "I don't know" or deflect if a fact isn't in the data. Answers are capped at around 80 words.
  - Model: `claude-haiku-4-5-20251001` for founder chat (cheap and fast), and `claude-sonnet-5-5` for offline shark generation.
- One-liner reactions to the player's offer (e.g. a shark scoffing at a low valuation) also come from Haiku, with a canned fallback if the API fails.
- All LLM access goes through one module, `backend/app/llm.py`, with timeouts, fallbacks and per-game rate limits.

## 4. Content: pitch folder (MVP)
```
pitches/
  scrub-daddy/
    clip.mp4            # 2–4 min trimmed (git-ignored if large; see below)
    poster.jpg
    pitch.json          # metadata (schema below)
    reactions.json      # generated shark reactions
```
`pitch.json` is validated by a Pydantic model `Pitch` in `backend/app/models/pitch.py`:
```json
{
  "id": "scrub-daddy",
  "source": {"show": "shark_tank", "season": 4, "episode": 7, "credit": "…"},
  "video": {"type": "file", "path": "clip.mp4"},      // or {"type":"youtube","id":"…","start":30,"end":210} or {"type":"url","url":"…"}
  "company": {"name": "…", "category": "consumer", "one_liner": "…", "founders": ["…"]},
  "ask": {"amount": 100000, "equity": 0.10},
  "facts": {"revenue_ttm": 100000, "margins": "…", "units_sold": 0, "notes": ["…"]},
  "transcript": "…",                                  // generated with Whisper, then hand-cleaned
  "founder_prefs": {"walkaway_valuation": 600000, "wants_value_add": ["retail"]},
  "real_deal": {"shark": "…", "amount": 200000, "equity": 0.20, "closed": true},
  "outcome": {                                        // HIDDEN until reveal
    "status": "thriving|acquired|failed|private",
    "horizon_years": 5, "exit_value": 0, "retention_factor": 0.7,
    "story": "…", "as_of": "2026-01", "sources": ["https://…"]
  },
  "lessons": ["licensing", "valuation_vs_revenue"]
}
```
- The `video.type` union is what makes the public launch possible. You can switch a pitch to YouTube embeds or licensed/hosted URLs without touching game code.
- Clips: keep them out of git (`.gitignore` `pitches/**/clip.mp4`). For now, sync them manually or with Git LFS. In v2 they move to Supabase Storage.
- Helper scripts in `scripts/`:
  - `new_pitch.py <slug>`: scaffolds the folder and template JSON.
  - `trim_clip.sh`: ffmpeg wrapper that trims and compresses to 720p H.264.
  - `transcribe.py`: transcribes locally with faster-whisper.
  - `validate_pitches.py`: checks every pitch.json against the schema, confirms files exist, and confirms outcome sources are present.
- **Starter content: about 15 pitches**, so that a "day" of 5 varies between plays. Deliberately mix big wins, solid exits, flops, and "sharks passed but it became huge" cases (e.g. Ring/Doorbot). That teaches survivorship bias. Every outcome needs at least one cited source.

## 5. Architecture
```
Shark-Tank-Game/
  backend/  (FastAPI, Python 3.12, uv)
    app/main.py            # app factory, CORS, serves /media from pitches/
    app/config.py          # pydantic-settings: ANTHROPIC_API_KEY, STARTING_BANKROLL, PITCHES_DIR
    app/models/            # pitch.py, game.py (Pydantic)
    app/content/repo.py    # PitchRepository protocol + LocalPitchRepository (JSON); SupabasePitchRepository in v2
    app/game/engine.py     # state machine, offer validation, sharks' offers
    app/game/founder.py    # acceptance/counter logic
    app/game/scoring.py    # reveal math, benchmark
    app/game/store.py      # GameStore protocol; InMemoryGameStore (TTL) → SupabaseGameStore in v2
    app/llm.py             # Anthropic client, prompts, fallbacks
    app/routers/games.py
    tests/                 # pytest: scoring, founder, engine, schema
  frontend/ (React + Vite + TS + Tailwind, Zustand for game state, TanStack Query for API)
    src/pages/  Home, Game, Reveal, Summary
    src/components/  Stage, VideoPlayer (file|youtube), SharkSeat, FounderChat, OfferSlip, ValuationMeter, RevealCard, PortfolioBar
  pitches/
  scripts/
```
- **The server is authoritative.** The client never receives `outcome`, `founder_prefs` or `real_deal` until the reveal, so the game can't be cheated through DevTools. `PublicPitch` is a separate response model that omits these fields.
- **Guest sessions**: `POST /api/games` returns a `game_id`, which the client keeps in localStorage so a refresh resumes the game. Games are stored in memory with a 24h TTL. That's acceptable for the MVP and gets replaced in v2.

### API (MVP)
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/games` | new day: picks 5 pitches and returns game state + public pitches |
| GET | `/api/games/{id}` | resume |
| POST | `/api/games/{id}/rounds/{i}/questions` | player question → founder answer (SSE) |
| POST | `/api/games/{id}/rounds/{i}/offer` | `{amount, equity}` or `{pass:true}` → shark offers + founder decision (possibly a counter) |
| POST | `/api/games/{id}/rounds/{i}/counter` | `{accept: bool}` |
| POST | `/api/games/{id}/reveal` | only once all rounds are done → full results |
| GET | `/media/{slug}/{file}` | clips/posters (static) |

## 6. UX notes
- Stage layout: video in the centre, 4 shark seats in an arc with avatar, speech bubble and an "IN/OUT" badge, and the player's seat with an offer slip at the bottom. A side drawer holds founder chat.
- The offer slip has amount and equity inputs. A **live valuation meter** compares your implied valuation with the founder's ask and with shark offers. This is the main teaching tool.
- Small "Learn" tooltips explain valuation, equity, royalty, dilution and MOIC.
- Reveal: cards flip one at a time with a count-up animation and a 1–2 sentence lesson each.
- Disclaimer in the footer: "Educational game, not financial advice. Outcomes based on public reporting as of <date>."

## 7. v2: Supabase (auth, persistence, content)
- **Auth**: Supabase Auth (email magic link + Google). The frontend uses `@supabase/supabase-js`, and the backend verifies the Supabase JWT (JWKS) in a FastAPI dependency. Guests can still play, and a guest's finished run gets attached to their account when they sign up.
- **Tables** (all with RLS):
  - `profiles(id → auth.users, username, created_at)`
  - `pitches(id text pk, data jsonb, outcome jsonb, published bool)`. Outcome is readable only by the service role.
  - `game_runs(id, user_id null, seed, pitch_ids text[], started_at, finished_at, final_net_worth, return_pct)`
  - `game_deals(run_id, round, pitch_id, investor, amount, equity, accepted, stake_value)`
  - `leaderboard` view (best return % per user, plus a daily view)
- **Storage**: private `pitch-media` bucket. The backend issues short-lived signed URLs. `SupabasePitchRepository` and `SupabaseGameStore` implement the same protocols as the local versions, so the switch is a config change.
- **Daily Challenge**: the same 5 pitches for everyone each day (seeded by date), with a daily leaderboard. This is a strong retention hook.

## 8. Later (v3+)
Royalty and loan deals; TTS voices for sharks; achievements ("Spotted a unicorn", "Diversifier"); a "Learn mode" with stats after each pitch; an admin page for uploading pitches; multiplayer rooms where friends are the sharks; mobile layout polish.

## 9. Public-launch / legal checklist
- Replace self-hosted Shark Tank footage with YouTube embeds (official channels), licensed clips, or freely usable pitches (YC Demo Day, founder-provided videos, original reenactments).
- Use original shark characters only, with no real names or likenesses, and no "Shark Tank" trademark in the product name.
- Cite outcome sources in the reveal, keep the "as of" date, and show the not-financial-advice disclaimer.

## 10. Milestones
1. **M0 – Scaffold** (½ day): uv FastAPI app, Vite React TS + Tailwind, `.env.example`, Makefile/`justfile` (`dev` runs both), CORS, health check.
2. **M1 – Content pipeline**: Pydantic `Pitch` schema, `LocalPitchRepository`, the scripts, and 3 pitches fully filled in.
3. **M2 – Playable loop without AI**: engine, founder logic, scoring, and the full UI flow with canned shark lines. Unit tests for the math.
4. **M3 – AI**: generate shark reactions offline, add the live founder Q&A (SSE), offer one-liners, and fallbacks.
5. **M4 – Polish + content**: reach 15 pitches, finish the reveal animations and learn tooltips, deploy (frontend on Vercel/Netlify, backend on Fly.io/Render).
6. **v2 – Supabase**: auth, runs/leaderboard, Storage, daily challenge.

## 11. Verification
- `pytest backend/tests`: valuation math, dilution/payout, founder accept/counter/reject thresholds, rejection of offers over the remaining cash, and a check that `PublicPitch` never serialises `outcome`.
- `python scripts/validate_pitches.py`: every pitch is schema-valid, its clip exists, and its outcome has sources.
- Manual end-to-end: `make dev`, then play a full 5-pitch day in the browser pane. Check that the clips play, founder answers stream, offers resolve, the reveal totals match a hand calculation for one deal, and refreshing mid-game resumes it.
- LLM safety check: ask the founder "What happened to your company after the show?". It must deflect and not leak the outcome.
