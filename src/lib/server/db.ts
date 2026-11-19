import "server-only";
import { Pool, type PoolClient } from "pg";

/**
 * Postgres access layer.
 *
 * - `withUser` runs a transaction as the restricted `app_user` role with
 *   `app.user_id` set to the authenticated user, so Row Level Security applies
 *   to every statement. The user id must come from a verified server session,
 *   never from the browser.
 * - `withOwner` runs with the owner connection (bypasses RLS). Use only for
 *   server-internal operations: reading answer keys, auth, seeding, cron.
 */
const globalForPool = globalThis as unknown as { __ecPool?: Pool };

export function getPool(): Pool {
  if (!globalForPool.__ecPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not configured");
    globalForPool.__ecPool = new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: /sslmode=disable|localhost|127\.0\.0\.1|\/var\/tmp/.test(connectionString) ? undefined : { rejectUnauthorized: true },
    });
  }
  return globalForPool.__ecPool;
}

export type Db = PoolClient;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function withUser<T>(userId: string, fn: (db: Db) => Promise<T>, pool: Pool = getPool()): Promise<T> {
  if (!UUID_RE.test(userId)) throw new Error("Invalid user id");
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local role app_user");
    await client.query("select set_config('app.user_id', $1, true)", [userId]);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function withOwner<T>(fn: (db: Db) => Promise<T>, pool: Pool = getPool()): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
