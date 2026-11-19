# Security

## Access
- Single owner. No sign-up page; Better Auth runs with `disableSignUp`, and a database trigger rejects any account whose
  email is not in `private.allowed_emails` (defense in depth if the auth layer were misconfigured).
- Passwords: minimum 10 characters, hashed by Better Auth (scrypt). Reset only via the admin CLI, which also revokes sessions.
- Sessions: HTTP-only cookies, `Secure` in production, SameSite=Lax, 30-day expiry with daily refresh.
- Sign-in rate limit: 5 attempts per minute (DB-backed), 30 requests/min for other auth endpoints.
- `proxy.ts` redirects signed-out visitors; **every** page and API route still verifies the session on the server.

## Data isolation
- Row Level Security on every table. User requests run as `app_user` with `app.user_id` from the verified session.
- Answer keys live in tables with no policies; the app role cannot read them. Offline grading uses salted hashes.
- Auth tables are not granted to `app_user`. AI usage is read-only for users and written only by security-definer functions.
- Child rows (answers, plan items, turns, feedback) are checked by trigger to belong to the same user as their parent.
- Integration tests prove a second user cannot read or write the first user's rows.

## Request hardening
- All API input validated with zod (strict schemas for preferences; enums for everything user-selectable); 64 KB body limit.
- Cross-origin writes rejected (Origin must match Host) on top of SameSite cookies.
- Dynamic SQL column names come only from fixed allow-lists, never from input.
- Security headers in `next.config.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (microphone for this origin only). A Content-Security-Policy is not configured yet.
- Cron endpoint requires a 24+ character bearer secret compared in constant time.

## Secrets and AI
- `.env*` files are git-ignored (only `.env.example` is committed). Provider keys are server-only.
- Learner text sent to the AI is wrapped as data; prompts instruct the model to ignore instructions inside it.
- AI output is schema-validated and grounded against the learner's text.
- Monthly AI spend is capped (≤ $15, server-enforced) with an atomic reservation so concurrent calls cannot overspend.

## Privacy
- Raw audio is never uploaded or stored; speech recognition runs in the browser.
- Text goes to an AI provider only when that feature is enabled. With a free tier (e.g. Gemini), the provider may use data
  to improve its services — documented in the AI guide.
- Full export and full delete are available in Settings.
- Signing out clears the service worker's page cache.
