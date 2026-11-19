/**
 * Applies SQL migrations in db/migrations in filename order, once each.
 * Usage: DATABASE_URL=... npx tsx scripts/migrate.ts
 */
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { Client } from "pg";

export async function migrate(connectionString: string, log = console.log) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(`create schema if not exists private;
      create table if not exists private.schema_migrations (
        name text primary key, checksum text not null, applied_at timestamptz not null default now())`);
    const dir = path.join(process.cwd(), "db", "migrations");
    const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    const { rows } = await client.query<{ name: string; checksum: string }>("select name, checksum from private.schema_migrations");
    const applied = new Map(rows.map((r) => [r.name, r.checksum]));
    for (const file of files) {
      const sql = readFileSync(path.join(dir, file), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      if (applied.has(file)) {
        if (applied.get(file) !== checksum) throw new Error(`Migration ${file} was modified after being applied`);
        continue;
      }
      log(`applying ${file}`);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into private.schema_migrations (name, checksum) values ($1, $2)", [file, checksum]);
        await client.query("commit");
      } catch (e) {
        await client.query("rollback");
        throw e;
      }
    }
    log("migrations up to date");
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.endsWith("migrate.ts")) {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL missing"); process.exit(1); }
  migrate(url).catch((e) => { console.error(e); process.exit(1); });
}
