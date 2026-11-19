# Testing

| Suite | Command | What it covers | Last result |
|---|---|---|---|
| Unit | `npm test` | grading/normalization, FSRS scheduling + mastery rule, adaptive placement, daily plan, streaks, cost estimates | 40/40 pass |
| DB security (integration) | `TEST_DATABASE_ADMIN_URL=postgres://… npm run test:integration` | RLS isolation between two users, hidden answer keys, auth tables not readable, idempotent attempts/reviews, optimistic concurrency, budget reservation under concurrency, sign-up allow-list | 12/12 pass |
| E2E (iPhone 13 viewport, Hebrew) | see below | sign-in redirect + 401s, sign-up blocked, wrong password, onboarding + full adaptive placement, all main screens render without errors, complete a lesson, learn vocabulary, coach disabled state, theme + language persistence, PWA manifest/SW | 9/9 pass |
| AI flow (mock provider, $0) | see below | writing feedback with grounding (invented issue dropped), coach start/turn/idempotent retry/end feedback, budget cap → `budget_exceeded`, cross-origin write → 403, cap > $15 rejected | pass |
| Data export/delete (API) | `node tests/api/data-flow.mjs` (server on :3100) | export has all tables and no answer keys, delete needs confirmation, data removed, onboarding reset | pass |
| Type check / lint / build | `npm run typecheck`, `npm run lint`, `npm run build` | | pass (lint: warnings only) |

## Running E2E locally
```bash
# disposable database
createdb ec_e2e && export DATABASE_URL=postgres://…/ec_e2e AUTH_SECRET=$(openssl rand -base64 32) APP_URL=http://localhost:3100
npm run db:migrate && npm run content:seed
E2E_ALLOW_RESET=yes npm run e2e:reset      # removes all accounts, re-creates owner@example.com / TestPassword123
npm run build && PORT=3100 npm start &
npm run test:e2e
```
The sign-in endpoint is rate-limited (5/min) in production mode, so the suite signs in once and reuses the session.

## AI flow against the mock provider
```bash
node tests/ai/mock-provider.mjs &      # fake OpenAI-compatible API on :3199
PORT=3101 APP_URL=http://localhost:3101 AI_PROVIDER=openai-compatible AI_BASE_URL=http://localhost:3199 AI_API_KEY=test \
  AI_MODEL_TEXT=gpt-4o-mini AI_FEATURE_WRITING=true AI_FEATURE_TUTOR=true npx next start -p 3101 &
node tests/ai/ai-flow.mjs
```

## Not covered by automated tests
- Real speech recognition / synthesis (needs a real device and microphone).
- Real push delivery to an iPhone (needs deployed HTTPS + VAPID keys).
- A real AI provider's output quality.
- Offline replay of the IndexedDB outbox (logic exists; only manual testing so far).
