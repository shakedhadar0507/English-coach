# Architecture

```
Browser (PWA, Hebrew RTL / English LTR)
 ├─ Server Components render pages with the verified session (requireUser)
 ├─ Client components: lesson player, review session, placement runner, coach, settings
 ├─ IndexedDB outbox (offline answers, idempotency keys) + service worker (page cache, push)
 └─ Web Speech API (TTS for listening/coach, STT for speaking) — on device, $0
        │  JSON over same-origin fetch
Next.js route handlers (src/app/api/**) ── route(): auth, zod validation, 64KB limit, origin check
        │
Services (src/lib/server/services/*) ── business logic, grading with hidden keys, AI calls
        │
Postgres ── withUser(): transaction as role app_user + app.user_id → RLS on every row
          └ withOwner(): owner connection for answer keys, auth, seeding, cron only
        │
Optional AI provider (OpenAI-compatible) ── budget reservation → call → zod validation → settle
```

## Key decisions
- **Portable RLS without Supabase Auth.** Each request runs `set local role app_user` and `set_config('app.user_id', …)`;
  policies use `private.uid()`. The user id only ever comes from the verified Better Auth session.
- **Hidden answer keys.** `exercise_keys` / `assessment_item_keys` have no RLS policies, so the app role cannot read them.
  Grading happens on the server. For offline use the server ships SHA-256 hashes of accepted answers (salted per exercise);
  the client can grade without ever seeing the plain answer.
- **Idempotency everywhere.** Attempts (`client_attempt_id`), vocabulary reviews (`client_review_id`), writing submissions and
  conversation turns (`seq`) are unique per user, so retries and offline replays never double-count.
- **Optimistic concurrency for SRS.** `apply_vocabulary_review` checks the card `version`.
- **Deterministic grading first.** Normalization (case, punctuation, contractions, curly quotes), several accepted answers,
  Levenshtein-1 typo tolerance only for vocabulary production, and an honest "needs review" self-check for open answers.
- **No fake AI.** When a feature flag is off, the UI says so. The coach button is disabled instead of showing scripted replies.
- **Daily plan** is generated once per local day from real data: overdue reviews (≤40% of time), recurring mistakes,
  the next lessons ranked by weakest skill, a productive task (speaking or writing), then new words.

## Folders
- `content/` curriculum source (TypeScript), schema, validator, AI drafts
- `db/migrations/` SQL schema, RLS, functions
- `scripts/` migrate, seed, validate, owner CLI, icon generator, content generation, E2E reset
- `src/app/` pages (`(app)` group is authenticated) and API routes
- `src/lib/learning/` pure algorithms (grading, FSRS wrapper, placement, plan, streaks) — unit tested
- `src/lib/server/` DB, auth, session, services, push
- `src/lib/ai/` provider config, client, pricing, output schemas
- `src/i18n/` Hebrew and English dictionaries (typed: both must have the same keys)
