import "server-only";
import { withUser } from "../db";

const EXPORT_TABLES = [
  "user_preferences", "learning_goals", "assessments", "assessment_answers", "daily_plans", "daily_plan_items", "learning_sessions",
  "lesson_progress", "exercise_attempts", "user_vocabulary", "vocabulary_reviews", "user_grammar_progress", "learning_errors",
  "writing_submissions", "writing_feedback", "conversations", "conversation_turns", "conversation_feedback", "notifications", "ai_usage",
] as const;

/** Everything the learner owns, read through RLS so nothing else can leak in. */
export async function exportAll(userId: string) {
  return withUser(userId, async (db) => {
    const out: Record<string, unknown[]> = {};
    const { rows: profile } = await db.query("select * from profiles where id = private.uid()");
    out.profile = profile;
    const { rows: words } = await db.query(
      `select v.*, (select json_agg(m) from vocabulary_meanings m where m.vocabulary_id = v.id) as meanings from vocabulary v where v.owner_id = private.uid()`);
    out.personal_vocabulary = words;
    // Table names are a fixed allow-list above, never user input.
    for (const t of EXPORT_TABLES) out[t] = (await db.query(`select * from public.${t} where user_id = private.uid()`)).rows;
    return { exported_at: new Date().toISOString(), app: "english-coach", version: 1, data: out };
  });
}

/**
 * Deletes all learning data and resets onboarding. The account itself and the
 * AI usage ledger (needed for the monthly spending cap) are kept.
 */
export async function deleteAllData(userId: string) {
  await withUser(userId, async (db) => {
    for (const t of ["conversations", "writing_submissions", "learning_errors", "user_grammar_progress", "vocabulary_reviews", "user_vocabulary",
      "exercise_attempts", "learning_sessions", "lesson_progress", "daily_plans", "assessments", "learning_goals", "notifications", "push_subscriptions"]) {
      await db.query(`delete from public.${t} where user_id = private.uid()`);
    }
    await db.query("delete from vocabulary where owner_id = private.uid()");
    await db.query("update profiles set current_level = null, level_source = null, onboarded_at = null, onboarding_step = 'welcome' where id = private.uid()");
  });
}
