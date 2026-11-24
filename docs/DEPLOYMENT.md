# Deployment (Render + Neon, $0 baseline)

Nothing below has been created yet. Every step that creates a resource or costs money needs the owner's approval.

## Cost breakdown
| Resource | Plan | Monthly cost | Notes |
|---|---|---|---|
| Render web service | Free | $0 | Sleeps after ~15 min idle; first request after sleep takes ~30–60 s |
| Neon Postgres | Free | $0 | 0.5 GB storage, compute auto-suspends |
| Reminder scheduler | GitHub Actions cron (free) or none | $0 | Render cron jobs are paid, so they are not used |
| Push notifications | Web Push (VAPID) | $0 | |
| AI | Off / Gemini free tier / paid | $0 / $0 / ≈ $0.30–0.50 | See AI_INTEGRATION.md |
| **Total** | | **$0** (≤ $0.50 with paid text AI) | Hard cap $15/month, enforced in-app for AI |

## Steps
1. **Database (Neon):** create a *new* project (free plan), copy the pooled connection string (with `sslmode=require`).
2. **Migrate, seed and create the owner:** automatic. The Render start command runs `npm run bootstrap`
   (`scripts/bootstrap.ts`) before `npm start`: it applies pending migrations, seeds content when the bundle changed,
   and creates the owner once when `OWNER_EMAIL` and `OWNER_PASSWORD` are set. Remove `OWNER_PASSWORD` after the
   first successful boot. The manual equivalents (`db:migrate`, `content:seed`, `owner:create`) still work.
3. **Render:** new Web Service from the GitHub repo (or `render.yaml` blueprint), plan **Free**, Node 24 (`.node-version`).
   Build `npm ci && npm run build`, start `npm run bootstrap && npm start`. Environment variables: `DATABASE_URL`, `AUTH_SECRET`
   (`openssl rand -base64 32`), `APP_URL`, `OWNER_EMAIL`, `OWNER_PASSWORD` (first boot only), optional AI and VAPID variables from `.env.example`.
4. **Verify:** `GET /api/health` returns `{"ok":true,"db":"up"}`; sign in; complete onboarding on the phone.
5. **Push (optional):** `npx web-push generate-vapid-keys`, set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
   `CRON_SECRET`; schedule `POST /api/cron/reminders` with `Authorization: Bearer $CRON_SECRET` every 15–30 minutes
   (e.g. a GitHub Actions workflow).

## Install on iPhone
Open the app URL in Safari → Share → Add to Home Screen → Add. Notifications on iOS work only after installing to the
Home Screen (iOS 16.4+), then enabling them in Settings inside the app.

## Operations
- Password reset: `npm run owner:reset-password -- --email <email>` (signs out all sessions).
- Content update: edit `content/`, `npm run content:validate`, `npm run content:seed`.
- Backups: Neon free tier keeps a short point-in-time restore window; use `GET /api/data/export` for a personal JSON backup.

## Vercel (free Hobby plan, recommended: no cold-start wait)
Render's free instance sleeps after 15 idle minutes, and its 750 free hours are shared across the workspace.
Vercel runs the app as serverless functions, so there is no sleeping server.
1. Import the GitHub repository at https://vercel.com/new (framework is detected; `vercel.json` sets the build to
   `npm run bootstrap && npm run build`, so migrations and content seeding run on every deploy, region `pdx1` next to Neon).
2. Environment variables (Production and Preview): `DATABASE_URL` (Neon pooled URL), `AUTH_SECRET`, `AI_PROVIDER=none`,
   `AI_FEATURE_REALTIME=false`. `APP_URL` is optional: without it the app uses `VERCEL_PROJECT_PRODUCTION_URL`.
3. Hobby limits that matter here: cron jobs run at most once a day, a function may run up to about 60 seconds,
   and the plan is for personal non-commercial use.
