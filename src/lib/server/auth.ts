import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { getPool } from "./db";

/**
 * Authentication: email + password, public sign-up disabled.
 * Accounts are created only with `npm run owner:create` (and the database
 * additionally rejects any email not in private.allowed_emails).
 */
export function createAuth(opts: { allowSignUp?: boolean } = {}) {
  return betterAuth({
    appName: "English Coach",
    baseURL: process.env.APP_URL,
    secret: process.env.AUTH_SECRET,
    database: getPool(),
    emailAndPassword: { enabled: true, disableSignUp: !opts.allowSignUp, minPasswordLength: 10, autoSignIn: false },
    user: { modelName: "auth_users" },
    session: {
      modelName: "auth_sessions",
      expiresIn: 60 * 60 * 24 * 30,     // 30 days
      updateAge: 60 * 60 * 24,          // refresh daily
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    account: { modelName: "auth_accounts" },
    verification: { modelName: "auth_verifications" },
    rateLimit: { enabled: process.env.NODE_ENV === "production", storage: "database", modelName: "auth_rate_limits", window: 60, max: 30,
      customRules: { "/sign-in/email": { window: 60, max: 5 } } },
    advanced: { database: { generateId: "uuid" }, useSecureCookies: process.env.NODE_ENV === "production" },
    telemetry: { enabled: false },
    plugins: [nextCookies()],
  });
}

const globalForAuth = globalThis as unknown as { __ecAuth?: ReturnType<typeof createAuth> };
export function getAuth() {
  if (!globalForAuth.__ecAuth) globalForAuth.__ecAuth = createAuth();
  return globalForAuth.__ecAuth;
}
