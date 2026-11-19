# Project status

Last updated: 2026-11-19. Verified locally against Postgres 16 with a production build (`next build` + `next start`).
Deployed 2026-11-19 on a free Render web service with a free Neon Postgres project (see docs/DEPLOYMENT.md).

Legend: ✅ implemented and tested · 🟡 implemented, not fully verified · ⛔ blocked · ❌ not implemented

## Core
| Feature | Status | Evidence / notes |
|---|---|---|
| Owner-only sign-in, sign-up disabled, DB allow-list | ✅ | E2E (sign-up API rejected, wrong password), integration test (allow-list trigger) |
| Sign-in rate limiting | ✅ | Observed 429 after 5 attempts/min in production mode |
| Row Level Security isolation | ✅ | 12 integration tests with two users |
| Hidden answer keys + server grading | ✅ | Integration test; unit tests for grading |
| Hebrew RTL default, English LTR, switch persists | ✅ | E2E |
| Light / dark / system theme | ✅ | E2E (dark persists after reload) |
| Onboarding (language, goals, accent, minutes) | ✅ | E2E |
| Adaptive placement test + results, retake, history, manual level | ✅ | E2E runs a full test; unit tests for the estimator. Capped at C1 |
| Daily plan (reviews, mistakes, lessons by weakness, productive task, new words) | ✅ | Unit tests; shown on Home in E2E |
| Lesson player (13 exercise types, feedback with rule + example, pause/resume, summary) | ✅ | E2E completes a lesson; progress recorded |
| Vocabulary SRS (FSRS, flashcard/recognition/production, mastery needs production) | ✅ | Unit + integration tests; E2E learns words |
| Word library (search, filters, sort, save/difficult, personal words, word detail) | ✅ | E2E opens a word page; add-word form not E2E-tested (🟡 for that form) |
| Grammar guide + practice by topic | ✅ | Pages render in E2E |
| Listening (TTS player, speed, transcript, glossary, save word, questions, dictation) | 🟡 | Pages render in E2E; audio uses the device's speech engine and was not checked by ear |
| Writing tasks + history | ✅ / 🟡 | Without AI: saved with honest notice (E2E page). AI feedback verified only against a mock provider |
| Recurring mistakes page + focused practice | 🟡 | Page renders; errors are recorded (verified in DB); focused-practice flow not E2E-tested |
| Progress dashboard (streaks, time, activity, skills, mistakes, AI cost) | ✅ | Renders real data in E2E |
| Floating notes button (draggable, notes saved per screen with context, earlier notes and their status shown) | ✅ | E2E: drag, position persists after reload, note saved and listed |
| Settings (all preferences, goals, budget ≤ $15, export, delete, sign out, install guide) | ✅ / 🟡 | Theme/language E2E-tested; export + delete verified via API script (`tests/api/data-flow.mjs`: no answer keys in export, confirmation required, onboarding reset). Push toggle needs a device |

## AI
| Feature | Status | Evidence / notes |
|---|---|---|
| Provider-agnostic client, per-feature flags, keys server-side | ✅ | Mock-provider flow |
| Atomic monthly budget + cost tracking | ✅ | Integration test (concurrency) + mock flow (`budget_exceeded` at $0 cap) |
| Writing feedback with grounding | 🟡 | Mock provider only; real model quality unverified |
| Speaking coach: turn-based voice (browser STT/TTS) and text, inline corrections, end feedback | 🟡 | Mock provider for the API; real microphone/voice not tested on a device |
| Real-time voice (WebRTC) | ❌ | Requires a paid provider (~$27/month at 15 min/day, above the cap). UI shows it as unavailable |
| AI content generation (drafts → validator → human review) | 🟡 | Script runs and refuses when disabled; not run against a real model |
| Pronunciation scoring | ❌ | Needs audio analysis; the UI says so |

## Platform
| Feature | Status | Evidence / notes |
|---|---|---|
| PWA manifest, icons, service worker, offline page | ✅ | E2E checks manifest/SW/icons |
| Offline answering with outbox + hashed offline grading | 🟡 | Code paths exist; not exercised by automated tests |
| Push reminders (VAPID, cron endpoint, dedupe per day) | 🟡 | Code complete; needs deployed HTTPS + keys to verify delivery |
| iPhone install (Add to Home Screen) | 🟡 | Manifest + apple meta in place; not yet tried on a real iPhone |
| Deployment on Render + Neon | ✅ / 🟡 | Live; startup log shows migrations, seed and owner bootstrap; DB verified (214 exercises, 117 words, 1 owner). Pages not yet checked from a phone (the build container cannot reach the public URL) |

## Content
| Item | Status | Notes |
|---|---|---|
| A1–C1 curriculum: 15 units, 45 lessons, 214 exercises | ✅ | Passes the validator with 0 errors (3 non-blocking warnings) |
| 18 grammar topics, 117 words, 24 listening clips, 53 placement items | ✅ | Validated and seeded |
| C2 content | ❌ | Not written; placement is capped at C1 and the app states this |
| Recorded human audio | ❌ | Listening uses on-device text-to-speech |

## Known limitations
- Free Render instances sleep when idle; the first load after a pause is slow.
- Speech recognition quality and voice availability vary by device and browser.
- No Content-Security-Policy header yet.
- Lint reports warnings from React Compiler advisory rules (downgraded from errors, see `eslint.config.mjs`).
