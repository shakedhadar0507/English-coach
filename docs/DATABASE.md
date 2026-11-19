# Database

Migrations: `db/migrations/0001_core_schema.sql` (tables, enums, functions, triggers) and
`0002_rls_and_functions.sql` (RLS policies, write functions, grants). Applied by `npm run db:migrate`, tracked in
`private.schema_migrations` with checksums.

## Roles
- **Owner role** (the connection user): runs migrations, seeding, cron and answer-key reads (`withOwner`).
- **`app_user`** (NOLOGIN): every user request switches to it inside a transaction. It has table grants, but RLS restricts rows.

## Tables (main groups)
- Auth: `auth_users`, `auth_sessions`, `auth_accounts`, `auth_verifications`, `auth_rate_limits` (no grants to `app_user`).
  Trigger `enforce_allowed_signup` rejects any email not in `private.allowed_emails`; `handle_new_user` creates profile + preferences.
- Content (read-only to users, approved rows only): curriculum levels/categories/courses/modules/units, lessons, exercises,
  grammar topics, vocabulary (+ meanings, examples; `owner_id` null = global), listening materials, assessment items,
  `content_versions`, `content_validation_results`.
- Hidden: `exercise_keys`, `assessment_item_keys` (no policies → invisible to users).
- Personal (owner-only policies): profiles, user_preferences, learning_goals, assessments(+answers), daily_plans(+items),
  learning_sessions, lesson_progress, exercise_attempts, user_vocabulary, vocabulary_reviews, user_grammar_progress,
  learning_errors, writing_submissions(+feedback), conversations(+turns, feedback), push_subscriptions, notifications.
- `ai_usage`: select-only for the owner; written only by security-definer functions.

## Functions
- `record_exercise_attempt(...)` idempotent attempt + grammar progress + session counters.
- `apply_vocabulary_review(...)` idempotent, version-checked FSRS update; enforces "mastered requires production".
- `record_learning_error(...)` upserts recurring mistakes by (category, pattern).
- `reserve_ai_budget(feature, provider, model, estimate)` locks the user's preferences row, sums the month's committed +
  live reservations and returns a reservation id or NULL if the cap would be exceeded. `settle_ai_usage(...)` records actual usage.
- `ai_month_summary()` spent / budget / requests.

## Data lifecycle
- Export: `GET /api/data/export` (everything the user owns, via RLS).
- Delete: `POST /api/data/delete {confirm:"DELETE"}` removes all learning data and resets onboarding. The account and the
  AI usage ledger (needed to enforce the monthly cap) are kept.
- Raw audio is never stored (speech recognition runs in the browser; only transcripts are saved).
