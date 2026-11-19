import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { ADMIN_URL, createUser, freshDatabase } from "./helpers";
import { withOwner, withUser } from "@/lib/server/db";
import { newCardState, review, Rating } from "@/lib/learning/srs";

const run = ADMIN_URL ? describe : describe.skip;

run("database security and atomic operations", () => {
  let pool: Pool;
  let alice: string;
  let bob: string;
  let exerciseId: string;
  let vocabId: string;

  beforeAll(async () => {
    ({ pool } = await freshDatabase());
    alice = await createUser(pool, "alice@example.com");
    bob = await createUser(pool, "bob@example.com");
    const { rows } = await pool.query("select id from exercises where grammar_topic_id is not null limit 1");
    exerciseId = rows[0].id;
    const v = await pool.query("select id from vocabulary where owner_id is null limit 1");
    vocabId = v.rows[0].id;
  }, 120_000);

  afterAll(async () => { await pool?.end(); });

  it("creates profile and preferences on signup", async () => {
    const p = await withUser(alice, (db) => db.query("select * from user_preferences"), pool);
    expect(p.rows).toHaveLength(1);
    expect(p.rows[0].locale).toBe("he");
    expect(p.rows[0].daily_minutes).toBe(15);
  });

  it("rejects accounts for emails that are not allow-listed", async () => {
    await expect(pool.query("insert into auth_users (email) values ('intruder@example.com')")).rejects.toThrow(/Signups are disabled/);
  });

  it("isolates personal rows between users", async () => {
    await withUser(alice, (db) => db.query("insert into learning_goals (user_id, goal, priority) values ($1, 'business', 1)", [alice]), pool);
    const seenByBob = await withUser(bob, (db) => db.query("select * from learning_goals"), pool);
    expect(seenByBob.rows).toHaveLength(0);
    const seenByAlice = await withUser(alice, (db) => db.query("select * from learning_goals"), pool);
    expect(seenByAlice.rows).toHaveLength(1);
  });

  it("prevents writing rows on behalf of another user", async () => {
    await expect(withUser(bob, (db) => db.query("insert into learning_goals (user_id, goal, priority) values ($1, 'travel', 1)", [alice]), pool))
      .rejects.toThrow(/row-level security/);
    const upd = await withUser(bob, (db) => db.query("update user_preferences set daily_minutes = 60 where user_id = $1", [alice]), pool);
    expect(upd.rowCount).toBe(0);
  });

  it("never exposes answer keys or auth tables to users", async () => {
    await expect(withUser(alice, (db) => db.query("select * from exercise_keys limit 1"), pool)).rejects.toThrow(/permission denied/);
    await expect(withUser(alice, (db) => db.query("select * from assessment_item_keys limit 1"), pool)).rejects.toThrow(/permission denied/);
    await expect(withUser(alice, (db) => db.query("select * from auth_accounts limit 1"), pool)).rejects.toThrow(/permission denied/);
    await expect(withUser(alice, (db) => db.query("select * from auth_sessions limit 1"), pool)).rejects.toThrow(/permission denied/);
  });

  it("makes curriculum read-only for users", async () => {
    const r = await withUser(alice, (db) => db.query("select count(*)::int as n from exercises"), pool);
    expect(r.rows[0].n).toBeGreaterThan(10);
    await expect(withUser(alice, (db) => db.query("update exercises set prompt = '{}'"), pool)).resolves.toMatchObject({ rowCount: 0 });
    await expect(withUser(alice, (db) => db.query("insert into grammar_topics (slug, level, title_en, title_he, summary_en, summary_he) values ('x','A1','x','x','x','x')"), pool))
      .rejects.toThrow(/row-level security/);
  });

  it("records exercise attempts idempotently", async () => {
    const call = () => withUser(alice, (db) => db.query("select * from record_exercise_attempt($1, null, 'attempt-1', '{}'::jsonb, true, 1, '{}'::jsonb, 1200)", [exerciseId]), pool);
    const first = await call();
    const second = await call();
    expect(first.rows[0].duplicate).toBe(false);
    expect(second.rows[0].duplicate).toBe(true);
    expect(second.rows[0].attempt_id).toBe(first.rows[0].attempt_id);
    const progress = await withUser(alice, (db) => db.query("select attempts, correct from user_grammar_progress"), pool);
    expect(progress.rows[0]).toEqual({ attempts: 1, correct: 1 });
  });

  it("applies vocabulary reviews atomically with idempotency and optimistic concurrency", async () => {
    const now = new Date();
    await withUser(alice, (db) => db.query("insert into user_vocabulary (user_id, vocabulary_id) values ($1, $2)", [alice, vocabId]), pool);
    const next = { ...review(newCardState(now), Rating.Good, now) };
    const apply = (key: string, version: number, dir = "production") =>
      withUser(alice, (db) => db.query("select * from apply_vocabulary_review($1, $2, 'flashcard', $3, 3::smallint, true, $4, $5)", [vocabId, key, dir, version, next]), pool);
    const a = await apply("rev-1", 0);
    expect(a.rows[0]).toMatchObject({ applied: true, duplicate: false, new_version: 1 });
    const dup = await apply("rev-1", 0);
    expect(dup.rows[0]).toMatchObject({ applied: false, duplicate: true });
    const stale = await apply("rev-2", 0);
    expect(stale.rows[0]).toMatchObject({ applied: false, duplicate: false, new_version: 1 });
    const logs = await withUser(alice, (db) => db.query("select count(*)::int as n from vocabulary_reviews"), pool);
    expect(logs.rows[0].n).toBe(1);
  });

  it("does not mark words mastered from recognition alone", async () => {
    const v = await pool.query("select id from vocabulary where owner_id is null offset 1 limit 1");
    const id = v.rows[0].id;
    await withUser(alice, (db) => db.query("insert into user_vocabulary (user_id, vocabulary_id) values ($1, $2)", [alice, id]), pool);
    const strong = { due: new Date(Date.now() + 40 * 864e5).toISOString(), stability: 40, difficulty: 3, scheduled_days: 40, learning_steps: 0, reps: 6, lapses: 0, fsrs_state: 2, last_review: new Date().toISOString() };
    for (let i = 0; i < 3; i++) {
      await withUser(alice, (db) => db.query("select * from apply_vocabulary_review($1, $2, 'mc', 'recognition', 3::smallint, true, $3, $4)", [id, `rec-${i}`, i, strong]), pool);
    }
    let st = await withUser(alice, (db) => db.query("select status from user_vocabulary where vocabulary_id = $1", [id]), pool);
    expect(st.rows[0].status).toBe("review");
    for (let i = 0; i < 2; i++) {
      await withUser(alice, (db) => db.query("select * from apply_vocabulary_review($1, $2, 'typing', 'production', 3::smallint, true, $3, $4)", [id, `prod-${i}`, 3 + i, strong]), pool);
    }
    st = await withUser(alice, (db) => db.query("select status from user_vocabulary where vocabulary_id = $1", [id]), pool);
    expect(st.rows[0].status).toBe("mastered");
  });

  it("enforces the AI budget under concurrent requests", async () => {
    await withUser(bob, (db) => db.query("update user_preferences set monthly_ai_budget_usd = 1.00"), pool);
    const attempts = await Promise.all(Array.from({ length: 6 }, () =>
      withUser(bob, (db) => db.query("select reserve_ai_budget('writing_feedback', 'test', 'm', 0.30) as id"), pool)));
    const granted = attempts.filter((r) => r.rows[0].id !== null).length;
    expect(granted).toBe(3);
    const summary = await withUser(bob, (db) => db.query("select * from ai_month_summary()"), pool);
    expect(Number(summary.rows[0].spent)).toBeCloseTo(0.9, 5);
  });

  it("settles reservations to actual cost and frees the difference", async () => {
    const { rows } = await withUser(bob, (db) => db.query("select id from ai_usage where status = 'reserved' limit 1"), pool);
    await withUser(bob, (db) => db.query("select settle_ai_usage($1, 'committed', 100, 50, 0, 0.01)", [rows[0].id]), pool);
    const summary = await withUser(bob, (db) => db.query("select * from ai_month_summary()"), pool);
    expect(Number(summary.rows[0].spent)).toBeCloseTo(0.61, 5);
    // Users cannot settle someone else's reservation
    await withUser(alice, (db) => db.query("select settle_ai_usage($1, 'released', 0, 0, 0, 0)", [rows[0].id]), pool);
    const still = await withOwner((db) => db.query("select status from ai_usage where id = $1", [rows[0].id]), pool);
    expect(still.rows[0].status).toBe("committed");
  });

  it("cascades deletion of all personal data", async () => {
    await withOwner((db) => db.query("delete from auth_users where id = $1", [alice]), pool);
    for (const t of ["profiles", "user_preferences", "learning_goals", "exercise_attempts", "user_vocabulary", "vocabulary_reviews"]) {
      const col = t === "profiles" ? "id" : "user_id";
      const r = await pool.query(`select count(*)::int as n from ${t} where ${col} = $1`, [alice]);
      expect(r.rows[0].n, t).toBe(0);
    }
  });
});
