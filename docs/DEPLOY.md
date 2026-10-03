# Deploying Tank Day

The app is two pieces:

| Piece | Where | Config |
|---|---|---|
| **API** (FastAPI) | Fly.io (`fly.toml`) or Render (`render.yaml`), built from the root `Dockerfile` | environment variables below |
| **Web app** (Vite/React) | Vercel (`frontend/vercel.json`) or Netlify, root directory `frontend` | `VITE_*` variables |

## 1. Supabase dashboard (project `tank-day`)

1. **Secret key**: Project Settings → API Keys → create a *secret* key. Use it only as `SUPABASE_SECRET_KEY` on the API.
2. **Database URL**: Project Settings → Database → Connection string → *Session pooler* URI.
   Use it as `DATABASE_URL` (game sessions + classrooms are stored there; tables already exist with RLS on).
3. **Auth URLs**: Authentication → URL Configuration
   - Site URL: your web app URL (e.g. `https://tankday.app`)
   - Redirect URLs: add the same URL and `http://localhost:5173`
4. **Email**: Authentication → Emails → SMTP Settings. Plug in an email provider (Resend, Postmark, SES…).
   The built-in sender only allows a handful of emails per hour.

## 2. API environment variables

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase session-pooler URI (step 1.2) |
| `SUPABASE_URL` | `https://uulpajrparfidqyntdop.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (public) |
| `SUPABASE_SECRET_KEY` | secret key (step 1.1) |
| `ANTHROPIC_API_KEY` | for live AI founder answers (optional) |
| `AI_DAILY_CALL_CAP` | e.g. `2000` (cost guard) |
| `CORS_ORIGINS` | JSON list, e.g. `["https://tankday.app"]` |
| `ENVIRONMENT` | `production` |
| `SENTRY_DSN` | optional error monitoring |

`TRUST_PROXY_HEADERS=true` and `PITCHES_DIR` are already set in the Docker image.

**Fly.io:**
```bash
fly launch --no-deploy        # choose a unique app name, keep fly.toml
fly secrets set DATABASE_URL=... SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... SUPABASE_SECRET_KEY=... ANTHROPIC_API_KEY=... CORS_ORIGINS='["https://tankday.app"]' ENVIRONMENT=production
fly deploy
```

## 3. Web app environment variables

| Variable | Value |
|---|---|
| `VITE_API_URL` | the API URL, e.g. `https://tank-day-api.fly.dev` |
| `VITE_CONTACT_EMAIL` | shown on Privacy/Terms |
| `VITE_PLAUSIBLE_DOMAIN` | optional analytics domain |

On Vercel: New Project → this repo → Root Directory `frontend` → add the variables → Deploy.

## 4. After deploying

- `https://<api>/api/health` should show `"accounts": true, "leaderboards": true`.
- Play one day while signed in and check the leaderboard.
- The weekly **Check pitch videos** GitHub Action warns you if a clip stops being embeddable.
- Before a public launch, have someone review `Privacy` and `Terms` (in `frontend/src/views/LegalView.tsx`).
