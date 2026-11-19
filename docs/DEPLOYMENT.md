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
2. **Migrate and seed** from a trusted machine:
   ```bash
   DATABASE_URL=... npm run db:migrate
   DATABASE_URL=... npm run content:seed
   DATABASE_URL=... AUTH_SECRET=... APP_URL=https://<app>.onrender.com npm run owner:create -- --email <owner email>
   ```
3. **Render:** new Web Service from the GitHub repo (or `render.yaml` blueprint), plan **Free**, Node 24 (`.node-version`).
   Build `npm ci && npm run build`, start `npm start`. Environment variables: `DATABASE_URL`, `AUTH_SECRET`
   (`openssl rand -base64 32`), `APP_URL`, optional AI and VAPID variables from `.env.example`.
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
