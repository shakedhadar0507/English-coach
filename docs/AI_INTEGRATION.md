# AI integration and costs

All AI is optional and **off by default**. Nothing in the app depends on it to work.

## Configuration
`AI_PROVIDER=openai-compatible`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL_TEXT`, and per-feature flags:
`AI_FEATURE_WRITING`, `AI_FEATURE_TUTOR` (coach turns + end-of-conversation feedback), `AI_FEATURE_CONTENT_GENERATION`,
`AI_FEATURE_REALTIME` (paid, requires `OPENAI_REALTIME_API_KEY`; **not implemented in the UI**, see status).
Keys stay on the server; the browser never receives them.

## Safety and quality
- Every call: per-user rate limit → **atomic budget reservation** in Postgres → provider call with timeout and retries →
  strict zod validation of the JSON → settle actual tokens/cost. Over budget → the feature returns `budget_exceeded`.
- Monthly cap set in Settings (0–15 USD, server-enforced).
- Prompts treat learner text as data (prompt-injection guard).
- **Grounding:** writing issues and conversation mistakes must quote text the learner actually wrote; anything else is dropped.
- Free-tier providers are recorded with $0 cost but still counted and rate-limited.

## Features
| Feature | With AI | Without AI |
|---|---|---|
| Writing feedback | Corrections by category (error / unnatural / alternative / style), corrected text, summary, follow-up | Text is saved; honest notice |
| Speaking coach | Turn-based voice (browser STT/TTS) or text, inline corrections (optional), end-of-conversation feedback | Start button disabled with notice |
| Content drafts | Validated drafts for review | n/a |
| Lessons, placement, vocabulary, listening, grammar | Not used (deterministic) | Fully working |

Voice: speech recognition and speech synthesis run in the browser (Web Speech API). Quality depends on the device;
Safari on iPhone supports both. Raw audio is never uploaded or stored. Pronunciation is not scored (that needs audio analysis).

## Cost estimates (verify current provider pricing before enabling)
Assumptions per use: writing feedback ≈ 1.5k input + 1k output tokens; coach turn ≈ 2k input + 150 output; 20 turns per conversation.

| Option | Daily use (1 writing + 1 conversation) | Monthly |
|---|---|---|
| Gemini free tier (`AI_FREE_TIER=true`) | $0 | **$0**, subject to free-tier limits; Google may use free-tier data to improve its products |
| OpenAI `gpt-4o-mini` (paid) | ≈ $0.01 | **≈ $0.30–0.50** |
| Real-time voice (`gpt-realtime-mini`, ~15 min/day) | ≈ $0.90 | **≈ $27** — above the $15 cap; not enabled |

The in-app numbers are estimates from `src/lib/ai/pricing.ts`, not invoices.
