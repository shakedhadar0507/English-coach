/**
 * Runs before the server starts on Render (see render.yaml startCommand):
 *   1. applies pending migrations,
 *   2. seeds content when the bundle checksum is new,
 *   3. creates the owner account once, if OWNER_EMAIL and OWNER_PASSWORD are set
 *      and no account exists for that email. Remove OWNER_PASSWORD after the first boot.
 * Every step is idempotent. Secrets are never logged.
 */
import { Pool } from "pg";
import { migrate } from "./migrate";
import { seedContent } from "./content-seed";
import { createAuth } from "../src/lib/server/auth";

async function ensureOwner(url: string) {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  if (!email || !password) { console.log("owner bootstrap skipped (OWNER_EMAIL/OWNER_PASSWORD not set)"); return; }
  if (password.length < 10) throw new Error("OWNER_PASSWORD must be at least 10 characters");
  const pool = new Pool({ connectionString: url });
  try {
    const { rowCount } = await pool.query("select 1 from auth_users where email = $1", [email]);
    if (rowCount) { console.log("owner account already exists; remove OWNER_PASSWORD from the environment"); return; }
    await pool.query("insert into private.allowed_emails (email) values ($1) on conflict do nothing", [email]);
    const auth = createAuth({ allowSignUp: true });
    await auth.api.signUpEmail({ body: { email, password, name: process.env.OWNER_NAME ?? email.split("@")[0] } });
    console.log("owner account created");
  } finally { await pool.end(); }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  await migrate(url);
  await seedContent(url);
  await ensureOwner(url);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
