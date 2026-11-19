/**
 * Resets a DISPOSABLE test database to a clean state for E2E: removes all accounts (cascades to all
 * personal data) and auth rate-limit rows, then re-creates the test owner. Refuses to run unless
 * E2E_ALLOW_RESET=yes, so it can never be pointed at production by accident.
 */
import { Pool } from "pg";
import { execFileSync } from "node:child_process";

async function main() {
  if (process.env.E2E_ALLOW_RESET !== "yes") throw new Error("Set E2E_ALLOW_RESET=yes to confirm this is a disposable test database");
  const url = process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString: url });
  // Row deletes (not TRUNCATE ... CASCADE, which would also wipe content tables that reference auth_users).
  await pool.query("delete from public.auth_users");
  await pool.query("delete from public.auth_rate_limits");
  await pool.query("delete from private.allowed_emails");
  await pool.end();
  execFileSync("npx", ["tsx", "--require", "./scripts/server-only-shim.cjs", "scripts/owner.ts", "create", "--email", process.env.E2E_EMAIL ?? "owner@example.com", "--name", "Owner"],
    { stdio: "inherit", env: { ...process.env, OWNER_PASSWORD: process.env.E2E_PASSWORD ?? "TestPassword123" } });
}
main().catch((e) => { console.error(e.message); process.exit(1); });
