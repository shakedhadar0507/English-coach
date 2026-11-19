import { Client, Pool } from "pg";
import { migrate } from "../../scripts/migrate";
import { seedContent } from "../../scripts/content-seed";

/**
 * Integration tests run against a real Postgres. Set TEST_DATABASE_ADMIN_URL to
 * a server where the test may create/drop the database `ec_it`.
 */
export const ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL;

export async function freshDatabase(): Promise<{ url: string; pool: Pool }> {
  if (!ADMIN_URL) throw new Error("TEST_DATABASE_ADMIN_URL not set");
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query("drop database if exists ec_it with (force)");
  await admin.query("create database ec_it");
  await admin.end();
  const url = ADMIN_URL.replace(/\/[^/?]+(\?|$)/, "/ec_it$1");
  await migrate(url, () => {});
  await seedContent(url, "it", () => {});
  return { url, pool: new Pool({ connectionString: url, max: 6 }) };
}

export async function createUser(pool: Pool, email: string): Promise<string> {
  await pool.query("insert into private.allowed_emails (email) values ($1) on conflict do nothing", [email]);
  const { rows } = await pool.query("insert into auth_users (email, name) values ($1, 'Test') returning id", [email]);
  return rows[0].id;
}
