# English Coach

A private, mobile-first PWA for learning English, built for one owner (Hebrew UI by default, English available).
It covers all four skills with a structured A1–C1 curriculum, an adaptive placement test, spaced-repetition vocabulary,
grammar, listening, writing feedback and a speaking coach. AI features are optional and behind feature flags.

> Status of every feature (tested / not verified / blocked): see [PROJECT_STATUS.md](PROJECT_STATUS.md).

## Stack
- Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript, Tailwind CSS 4
- PostgreSQL (Neon free tier in production; any Postgres 15+ works) with Row Level Security on every table
- Better Auth (email + password, **public sign-up disabled**, DB-level allow-list)
- ts-fsrs for spaced repetition; custom adaptive placement (IRT-style)
- Optional OpenAI-compatible AI provider (e.g. Gemini free tier or OpenAI), browser Web Speech API for voice
- Vitest (unit + DB security), Playwright (E2E on an iPhone viewport)

## Quick start (local)
```bash
cp .env.example .env.local          # fill DATABASE_URL, AUTH_SECRET, APP_URL
npm install
npm run db:migrate                  # creates schema, roles, RLS
npm run content:validate && npm run content:seed
npm run owner:create -- --email you@example.com --name "Your Name"   # prompts for a password
npm run dev
```

## Scripts
| Script | What it does |
|---|---|
| `db:migrate` | Applies `db/migrations/*.sql` in order (checksummed; refuses edited migrations) |
| `content:validate` | Validates the curriculum (schema, references, answer keys, Hebrew, levels) |
| `content:seed` | Validates, then upserts content idempotently (refuses on validation errors) |
| `content:generate` | Optional AI lesson **drafts** to `content/drafts/` (never auto-published) |
| `owner:create` / `owner:reset-password` | Owner account management (no sign-up page exists) |
| `test` / `test:integration` / `test:e2e` | Unit, DB security, end-to-end tests |
| `e2e:reset` | Resets a **disposable** test DB (requires `E2E_ALLOW_RESET=yes`) |

## Documentation
- [Architecture](docs/ARCHITECTURE.md) · [Database](docs/DATABASE.md) · [Curriculum](docs/CURRICULUM.md)
- [AI integration and costs](docs/AI_INTEGRATION.md) · [Deployment](docs/DEPLOYMENT.md)
- [Testing](docs/TESTING.md) · [Security](docs/SECURITY.md) · [Project status](PROJECT_STATUS.md)
