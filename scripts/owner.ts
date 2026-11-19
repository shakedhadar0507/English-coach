/**
 * Owner account management (no public sign-up exists).
 *   npm run owner:create -- --email you@example.com --name "Your Name"     (prompts for the password)
 *   npm run owner:reset-password -- --email you@example.com               (prompts for the new password)
 * Passwords are read from the terminal (or OWNER_PASSWORD) and never logged.
 */
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { Pool } from "pg";
import { createAuth } from "../src/lib/server/auth";

function arg(name: string) { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; }

async function askHidden(q: string): Promise<string> {
  if (process.env.OWNER_PASSWORD) return process.env.OWNER_PASSWORD;
  let muted = false;
  const out = new Writable({ write(chunk, _e, cb) { if (!muted) process.stdout.write(chunk); cb(); } });
  const rl = createInterface({ input: process.stdin, output: out, terminal: true });
  const p = rl.question(q); muted = true;
  const answer = await p; rl.close(); process.stdout.write("\n");
  return answer;
}

async function main() {
  const cmd = process.argv[2];
  const email = arg("email")?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("--email is required");
  if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) throw new Error("DATABASE_URL and AUTH_SECRET must be set");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: /localhost|\/var\/tmp|sslmode=disable/.test(process.env.DATABASE_URL) ? undefined : { rejectUnauthorized: true } });
  try {
    const password = await askHidden("Password (min 10 chars): ");
    if (password.length < 10) throw new Error("Password must be at least 10 characters");
    if (cmd === "create") {
      await pool.query("insert into private.allowed_emails (email) values ($1) on conflict do nothing", [email]);
      const auth = createAuth({ allowSignUp: true });
      await auth.api.signUpEmail({ body: { email, password, name: arg("name") ?? email.split("@")[0] } });
      console.log(`Owner account created for ${email}.`);
    } else if (cmd === "reset-password") {
      const auth = createAuth();
      const ctx = await auth.$context;
      const hash = await ctx.password.hash(password);
      const r = await pool.query(
        `update auth_accounts set password = $2, "updatedAt" = now() where "providerId" = 'credential' and "userId" = (select id from auth_users where email = $1)`, [email, hash]);
      if (!r.rowCount) throw new Error("No password account found for that email");
      await pool.query(`delete from auth_sessions where "userId" = (select id from auth_users where email = $1)`, [email]);
      console.log(`Password updated for ${email}. All sessions were signed out.`);
    } else throw new Error("Usage: owner.ts create|reset-password --email <email>");
  } finally { await pool.end(); }
  process.exit(0);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
